import { useTranslationContext } from '../contexts/TranslationContext'

export function useTranslate() {
  return useTranslationContext()
}
