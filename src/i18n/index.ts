import { createSignal, createMemo } from 'solid-js';
import { en, zh } from './translations';

type Language = 'en' | 'zh';

const [language, setLanguage] = createSignal<Language>('zh');

// 初始化
function initI18n() {
  if (typeof window !== 'undefined' && typeof window.localStorage?.getItem === 'function') {
    const savedLang = window.localStorage.getItem('language') as Language | null;
    if (savedLang) {
      setLanguage(savedLang);
    }
  }
}

// 立即初始化
initI18n();

/** Reactive translation object - updates when language changes */
export const t = createMemo(() => {
  return language() === 'zh' ? zh : en;
});

/**
 * Toggle language between 'en' and 'zh', persisting to localStorage
 */
export function toggleLanguage() {
  const newLang = language() === 'en' ? 'zh' : 'en';
  setLanguage(newLang);
  localStorage.setItem('language', newLang);
}

/**
 * Set the active language and persist to localStorage
 * @param lang - Language to set ('en' or 'zh')
 */
export function setLang(lang: Language) {
  setLanguage(lang);
  localStorage.setItem('language', lang);
}

/**
 * Get display text for the language toggle button
 * @returns '中文' when in English mode, 'EN' when in Chinese mode
 */
export function getLanguageButtonText(): string {
  return language() === 'zh' ? '中文' : 'EN';
}

/**
 * Get the i18n utility object with current translation and helpers
 * @returns Object containing t, language, toggleLanguage, setLang, and getLanguageButtonText
 */
export function useI18n() {
  return {
    t: t(),
    language: language(),
    toggleLanguage,
    setLang,
    getLanguageButtonText,
  };
}

/** Reactive language signal ('en' | 'zh') */
export { language };
