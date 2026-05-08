export const SUPPORTED_LANGUAGES = ['en', 'bn'] as const

export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number]

export const DEFAULT_LANGUAGE: SupportedLanguage = 'en'

export const LANGUAGE_STORAGE_KEY = 'vh_language'
export const TRANSLATION_CACHE_STORAGE_KEY = 'vh_translation_cache_v1'

export const LANGUAGE_OPTIONS: Array<{ value: SupportedLanguage; label: string }> = [
  { value: 'en', label: 'English' },
  { value: 'bn', label: 'Bengali' }
]
