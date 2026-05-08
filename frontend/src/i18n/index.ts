import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import bn from './bn.json'
import en from './en.json'

if (!i18n.isInitialized) {
  i18n
    .use(initReactI18next)
    .init({
      resources: {
        en: { translation: en },
        bn: { translation: bn }
      },
      lng: 'en',
      fallbackLng: 'en',
      supportedLngs: ['en', 'bn'],
      keySeparator: false,
      interpolation: {
        escapeValue: false
      },
      react: {
        useSuspense: false
      }
    })
}

export default i18n
