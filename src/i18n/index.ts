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

// 响应式翻译 - 使用 createMemo 确保语言切换时更新
export const t = createMemo(() => {
  return language() === 'zh' ? zh : en;
});

// 切换语言
export function toggleLanguage() {
  const newLang = language() === 'en' ? 'zh' : 'en';
  setLanguage(newLang);
  localStorage.setItem('language', newLang);
}

// 设置语言
export function setLang(lang: Language) {
  setLanguage(lang);
  localStorage.setItem('language', lang);
}

// 获取语言按钮显示文本
export function getLanguageButtonText(): string {
  return language() === 'zh' ? '中文' : 'EN';
}

// 导出
export function useI18n() {
  return {
    t: t(),
    language: language(),
    toggleLanguage,
    setLang,
    getLanguageButtonText,
  };
}

export { language };
