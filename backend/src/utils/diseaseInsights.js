const INVALID_LABELS = new Set([
  '',
  'n a',
  'na',
  'nil',
  'none',
  'normal',
  'not applicable',
  'not sure',
  'ok',
  'pending',
  'test',
  'unknown',
  'yes',
  'no'
])

const CANONICAL_MEDICAL_LABELS = {
  'body pain': {
    label: 'Body Pain',
    aliases: ['body pain', 'body ache', 'body aches', 'শরীর ব্যথা']
  },
  cough: {
    label: 'Cough',
    aliases: ['cough', 'কাশি']
  },
  fever: {
    label: 'Fever',
    aliases: ['fever', 'জ্বর']
  },
  'stomach pain': {
    label: 'Stomach Pain',
    aliases: ['stomach pain', 'abdominal pain', 'পেট ব্যথা']
  },
  diarrhea: {
    label: 'Diarrhea',
    aliases: ['diarrhea', 'diarrhoea', 'ডায়রিয়া', 'ডায়রিয়া']
  },
  vomiting: {
    label: 'Vomiting',
    aliases: ['vomiting', 'vomit', 'বমি']
  },
  dizziness: {
    label: 'Dizziness',
    aliases: ['dizziness', 'dizzy', 'মাথা ঘোরা']
  },
  'chest pain': {
    label: 'Chest Pain',
    aliases: ['chest pain', 'বুকে ব্যথা']
  },
  'breathing difficulty': {
    label: 'Breathing Difficulty',
    aliases: ['breathing difficulty', 'shortness of breath', 'breathlessness', 'শ্বাসকষ্ট']
  },
  headache: {
    label: 'Headache',
    aliases: ['headache', 'মাথাব্যথা']
  }
}

const CANONICAL_LABEL_LOOKUP = new Map(
  Object.entries(CANONICAL_MEDICAL_LABELS).flatMap(([canonicalKey, config]) =>
    config.aliases.map((alias) => [normalizeMedicalLabel(alias), canonicalKey])
  )
)

function toTitleCase(value) {
  return value
    .split(' ')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

function normalizeMedicalLabel(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[()]/g, ' ')
    .replace(/[_]+/g, ' ')
    .replace(/[^\p{L}\p{N}\s/-]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function isMeaningfulMedicalLabel(label) {
  if (!label) return false
  if (INVALID_LABELS.has(label)) return false
  if (label.length < 2 || label.length > 40) return false

  const words = label.split(' ').filter(Boolean)
  if (!words.length || words.length > 4) return false

  const containsAlpha = words.some((word) => /\p{L}/u.test(word))
  return containsAlpha
}

function canonicalizeMedicalLabel(value) {
  const normalizedValue = normalizeMedicalLabel(value)

  return CANONICAL_LABEL_LOOKUP.get(normalizedValue) || normalizedValue
}

function getDisplayMedicalLabel(canonicalKey) {
  return CANONICAL_MEDICAL_LABELS[canonicalKey]?.label || toTitleCase(canonicalKey)
}

function splitStructuredValues(value) {
  if (!value) return []

  if (Array.isArray(value)) {
    return value.flatMap((item) => splitStructuredValues(item))
  }

  return String(value)
    .split(/[,;/|\n]+/)
    .map((item) => canonicalizeMedicalLabel(item))
    .filter(isMeaningfulMedicalLabel)
}

function getStructuredDiseaseValues(report) {
  return [...new Set([
    ...splitStructuredValues(report.symptoms),
    ...splitStructuredValues(report.diagnosis)
  ])]
}

export function analyzeDiseaseInsights(reports) {
  const diseaseMap = new Map()
  let matchedReports = 0

  for (const report of reports) {
    const detectedValues = getStructuredDiseaseValues(report)
    if (!detectedValues.length) {
      continue
    }

    matchedReports += 1

    for (const disease of detectedValues) {
      diseaseMap.set(disease, (diseaseMap.get(disease) || 0) + 1)
    }
  }

  const diseaseCounts = [...diseaseMap.entries()]
    .map(([disease, count]) => ({
      disease: getDisplayMedicalLabel(disease),
      count
    }))
    .sort((left, right) => right.count - left.count || left.disease.localeCompare(right.disease))

  const dominantDisease = diseaseCounts[0]
    ? {
        name: diseaseCounts[0].disease,
        count: diseaseCounts[0].count
      }
    : null

  return {
    diseaseCounts,
    dominantDisease,
    matchedReports
  }
}

export function getMonthRange(monthValue) {
  if (!/^\d{4}-\d{2}$/.test(monthValue || '')) {
    const error = new Error('Month must use YYYY-MM format')
    error.statusCode = 400
    throw error
  }

  const [year, month] = monthValue.split('-').map(Number)
  const startDate = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0))
  const endDate = new Date(Date.UTC(year, month, 1, 0, 0, 0, 0))

  return {
    startDate,
    endDate,
    label: startDate.toLocaleString('en-US', {
      month: 'long',
      year: 'numeric',
      timeZone: 'UTC'
    })
  }
}
