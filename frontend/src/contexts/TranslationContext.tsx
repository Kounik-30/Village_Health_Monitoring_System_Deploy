import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import i18n from '../i18n'
import { translationApi } from '../services/api'
import {
  DEFAULT_LANGUAGE,
  LANGUAGE_STORAGE_KEY,
  SUPPORTED_LANGUAGES,
  TRANSLATION_CACHE_STORAGE_KEY,
  type SupportedLanguage
} from '../constants/language'

type TranslationCache = Partial<Record<SupportedLanguage, Record<string, string>>>

interface TranslateOptions {
  count?: number
  values?: Record<string, string | number>
}

interface TranslationContextValue {
  language: SupportedLanguage
  setLanguage: (language: SupportedLanguage) => void
  t: (textOrKey: string, options?: TranslateOptions) => string
}

const TranslationContext = createContext<TranslationContextValue | undefined>(undefined)

function isSupportedLanguage(value: string | null): value is SupportedLanguage {
  return Boolean(value && SUPPORTED_LANGUAGES.includes(value as SupportedLanguage))
}

function normalizeLanguage(value: string | null | undefined): SupportedLanguage {
  const baseLanguage = String(value || '')
    .trim()
    .split('-')[0]
    .toLowerCase()

  return isSupportedLanguage(baseLanguage) ? baseLanguage : DEFAULT_LANGUAGE
}

function loadStoredLanguage(): SupportedLanguage {
  const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY)
  return normalizeLanguage(stored)
}

function loadStoredCache(): TranslationCache {
  try {
    const raw = localStorage.getItem(TRANSLATION_CACHE_STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as TranslationCache
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

function interpolate(template: string, options?: TranslateOptions) {
  if (!options) return template

  const values = {
    ...(typeof options.count !== 'undefined' ? { count: options.count } : {}),
    ...(options.values || {})
  }

  return Object.entries(values).reduce(
    (result, [key, value]) => result.split(`{{${key}}}`).join(String(value)),
    template
  )
}

export const TranslationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<SupportedLanguage>(() => {
    const storedLanguage = loadStoredLanguage()
    const i18nLanguage = normalizeLanguage(i18n.resolvedLanguage || i18n.language)

    return storedLanguage || i18nLanguage
  })
  const [cache, setCache] = useState<TranslationCache>(() => loadStoredCache())
  const pendingRef = useRef<Record<SupportedLanguage, Set<string>>>({
    en: new Set<string>(),
    bn: new Set<string>()
  })
  const inflightRef = useRef<Record<SupportedLanguage, Set<string>>>({
    en: new Set<string>(),
    bn: new Set<string>()
  })
  const flushTimerRef = useRef<number | null>(null)

  useEffect(() => {
    const handleLanguageChanged = (nextLanguage: string) => {
      const normalizedLanguage = normalizeLanguage(nextLanguage)

      setLanguageState((currentLanguage) =>
        currentLanguage === normalizedLanguage ? currentLanguage : normalizedLanguage
      )
      localStorage.setItem(LANGUAGE_STORAGE_KEY, normalizedLanguage)
    }

    const storedLanguage = loadStoredLanguage()
    const currentI18nLanguage = normalizeLanguage(i18n.resolvedLanguage || i18n.language)

    i18n.on('languageChanged', handleLanguageChanged)
    handleLanguageChanged(currentI18nLanguage)

    if (currentI18nLanguage !== storedLanguage) {
      void i18n.changeLanguage(storedLanguage)
    }

    return () => {
      i18n.off('languageChanged', handleLanguageChanged)
    }
  }, [])

  useEffect(() => {
    localStorage.setItem(TRANSLATION_CACHE_STORAGE_KEY, JSON.stringify(cache))
  }, [cache])

  useEffect(() => {
    return () => {
      if (flushTimerRef.current) {
        window.clearTimeout(flushTimerRef.current)
      }
    }
  }, [])

  const flushPending = useCallback(async (targetLanguage: SupportedLanguage) => {
    const pendingTexts = Array.from(pendingRef.current[targetLanguage])
      .filter((text) => !inflightRef.current[targetLanguage].has(text))

    if (pendingTexts.length === 0 || targetLanguage === 'en') {
      return
    }

    pendingTexts.forEach((text) => {
      pendingRef.current[targetLanguage].delete(text)
      inflightRef.current[targetLanguage].add(text)
    })

    try {
      const translatedEntries = await translationApi.translateBatch(pendingTexts, targetLanguage)

      setCache((current) => {
        const nextForLanguage = {
          ...(current[targetLanguage] || {})
        }

        for (const entry of translatedEntries) {
          nextForLanguage[entry.sourceText] = entry.translatedText || entry.sourceText
        }

        return {
          ...current,
          [targetLanguage]: nextForLanguage
        }
      })
    } catch (error) {
      console.error('Failed to translate UI text:', error)
    } finally {
      pendingTexts.forEach((text) => {
        inflightRef.current[targetLanguage].delete(text)
      })
    }
  }, [])

  const scheduleFlush = useCallback((targetLanguage: SupportedLanguage) => {
    if (targetLanguage === 'en') return
    if (flushTimerRef.current) {
      window.clearTimeout(flushTimerRef.current)
    }

    flushTimerRef.current = window.setTimeout(() => {
      flushTimerRef.current = null
      void flushPending(targetLanguage)
    }, 50)
  }, [flushPending])

  useEffect(() => {
    if (language !== 'en') {
      scheduleFlush(language)
    }
  }, [language, scheduleFlush, cache])

  const queueTranslation = useCallback((sourceText: string, targetLanguage: SupportedLanguage) => {
    if (!sourceText || targetLanguage === 'en') return
    const existing = cache[targetLanguage]?.[sourceText]
    if (existing) return
    if (pendingRef.current[targetLanguage].has(sourceText)) return
    if (inflightRef.current[targetLanguage].has(sourceText)) return

    pendingRef.current[targetLanguage].add(sourceText)
    scheduleFlush(targetLanguage)
  }, [cache, scheduleFlush])

  const t = useCallback((textOrKey: string, options?: TranslateOptions) => {
    if (!textOrKey) return ''

    const i18nOptions = {
      lng: language,
      ...(typeof options?.count !== 'undefined' ? { count: options.count } : {}),
      ...(options?.values || {})
    }

    if (i18n.exists(textOrKey, { lng: language })) {
      return i18n.t(textOrKey, i18nOptions)
    }

    if (language === 'en') {
      return interpolate(textOrKey, options)
    }

    const translated = cache[language]?.[textOrKey]
    if (translated) {
      return interpolate(translated, options)
    }

    queueTranslation(textOrKey, language)
    return interpolate(textOrKey, options)
  }, [cache, language, queueTranslation])

  const setLanguage = useCallback((nextLanguage: SupportedLanguage) => {
    const normalizedLanguage = normalizeLanguage(nextLanguage)
    const currentI18nLanguage = normalizeLanguage(i18n.resolvedLanguage || i18n.language)

    localStorage.setItem(LANGUAGE_STORAGE_KEY, normalizedLanguage)
    setLanguageState(normalizedLanguage)

    if (currentI18nLanguage !== normalizedLanguage) {
      void i18n.changeLanguage(normalizedLanguage)
    }
  }, [])

  const value = useMemo<TranslationContextValue>(() => ({
    language,
    setLanguage,
    t
  }), [language, setLanguage, t])

  return (
    <TranslationContext.Provider value={value}>
      {children}
    </TranslationContext.Provider>
  )
}

export const StaticTranslationProvider: React.FC<{
  children: React.ReactNode
  language?: SupportedLanguage
}> = ({ children, language = 'en' }) => {
  const t = useCallback((textOrKey: string, options?: TranslateOptions) => {
    if (!textOrKey) return ''

    const i18nOptions = {
      lng: language,
      ...(typeof options?.count !== 'undefined' ? { count: options.count } : {}),
      ...(options?.values || {})
    }

    if (i18n.exists(textOrKey, { lng: language })) {
      return i18n.t(textOrKey, i18nOptions)
    }

    return interpolate(textOrKey, options)
  }, [language])

  const value = useMemo<TranslationContextValue>(() => ({
    language,
    setLanguage: () => {},
    t
  }), [language, t])

  return (
    <TranslationContext.Provider value={value}>
      {children}
    </TranslationContext.Provider>
  )
}

export function useTranslationContext() {
  const context = useContext(TranslationContext)
  if (!context) {
    throw new Error('useTranslationContext must be used within a TranslationProvider')
  }
  return context
}
