import type { SupportedLanguage } from '../constants/language'

type TranslateFn = (textOrKey: string) => string

interface LocalizePersonNameOptions {
  language: SupportedLanguage
  t: TranslateFn
  role?: 'doctor' | 'villager' | 'admin' | string
}

export function localizePersonName(
  name: string | undefined | null,
  { language, t, role }: LocalizePersonNameOptions
) {
  const trimmed = String(name || '').trim()
  if (!trimmed) return ''

  const withoutHonorific = trimmed.replace(/^(dr\.?|ডা\.?)\s*/i, '').trim()

  if (language !== 'bn') {
    return trimmed
  }

  const translatedName = t(withoutHonorific || trimmed)
  if (role === 'doctor') {
    return `ডা. ${translatedName}`
  }

  return translatedName
}
