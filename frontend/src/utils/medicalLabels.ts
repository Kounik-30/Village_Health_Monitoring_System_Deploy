type TranslateFn = (textOrKey: string) => string

const CANONICAL_MEDICAL_LABELS: Record<string, { label: string; aliases: string[] }> = {
  body_pain: {
    label: 'Body Pain',
    aliases: ['Body Pain', 'body pain', 'body ache', 'body aches', 'শরীর ব্যথা']
  },
  cough: {
    label: 'Cough',
    aliases: ['Cough', 'cough', 'কাশি']
  },
  fever: {
    label: 'Fever',
    aliases: ['Fever', 'fever', 'জ্বর']
  },
  stomach_pain: {
    label: 'Stomach Pain',
    aliases: ['Stomach Pain', 'stomach pain', 'abdominal pain', 'পেট ব্যথা']
  },
  diarrhea: {
    label: 'Diarrhea',
    aliases: ['Diarrhea', 'diarrhea', 'diarrhoea', 'ডায়রিয়া', 'ডায়রিয়া']
  },
  vomiting: {
    label: 'Vomiting',
    aliases: ['Vomiting', 'vomiting', 'vomit', 'বমি']
  },
  dizziness: {
    label: 'Dizziness',
    aliases: ['Dizziness', 'dizziness', 'dizzy', 'মাথা ঘোরা']
  },
  chest_pain: {
    label: 'Chest Pain',
    aliases: ['Chest Pain', 'chest pain', 'বুকে ব্যথা']
  },
  breathing_difficulty: {
    label: 'Breathing Difficulty',
    aliases: ['Breathing Difficulty', 'breathing difficulty', 'shortness of breath', 'breathlessness', 'শ্বাসকষ্ট']
  },
  headache: {
    label: 'Headache',
    aliases: ['Headache', 'headache', 'মাথাব্যথা']
  }
}

function normalizeMedicalLabel(value: string) {
  return String(value || '')
    .toLowerCase()
    .replace(/[()]/g, ' ')
    .replace(/[_]+/g, ' ')
    .replace(/[^\p{L}\p{N}\s/-]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function toTitleCase(value: string) {
  return value
    .split(' ')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

const MEDICAL_LABEL_LOOKUP = new Map(
  Object.entries(CANONICAL_MEDICAL_LABELS).flatMap(([canonicalKey, config]) =>
    config.aliases.map((alias) => [normalizeMedicalLabel(alias), canonicalKey])
  )
)

export function canonicalizeMedicalLabel(value: string) {
  const normalizedValue = normalizeMedicalLabel(value)
  return MEDICAL_LABEL_LOOKUP.get(normalizedValue) || normalizedValue
}

export function getCanonicalMedicalLabel(value: string) {
  const canonicalKey = canonicalizeMedicalLabel(value)
  return CANONICAL_MEDICAL_LABELS[canonicalKey]?.label || toTitleCase(canonicalKey)
}

export function localizeMedicalLabel(
  value: string,
  { t }: { t: TranslateFn }
) {
  const englishLabel = getCanonicalMedicalLabel(value)
  return t(englishLabel)
}

export function localizeMedicalList(
  value: string | string[] | null | undefined,
  { t }: { t: TranslateFn }
) {
  const items = Array.isArray(value)
    ? value
    : String(value || '')
        .split(/[,;/|\n]+/)
        .map((item) => item.trim())
        .filter(Boolean)

  return items.map((item) => localizeMedicalLabel(item, { t })).join(', ')
}
