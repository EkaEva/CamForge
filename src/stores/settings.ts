import { createSignal } from 'solid-js';

type Theme = 'light' | 'dark' | 'system';

const [theme, setTheme] = createSignal<Theme>('system');
const [isDark, setIsDark] = createSignal(false);

// 更新暗色模式状态
function updateDarkMode() {
  const currentTheme = theme();
  let dark = false;

  if (currentTheme === 'dark') {
    dark = true;
  } else if (currentTheme === 'light') {
    dark = false;
  } else {
    // system
    dark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  setIsDark(dark);

  if (dark) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
}

// 初始化主题
export function initTheme() {
  // 从 localStorage 读取主题设置
  const savedTheme = localStorage.getItem('theme') as Theme | null;
  if (savedTheme) {
    setTheme(savedTheme);
  }
  updateDarkMode();

  // 监听系统主题变化
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', updateDarkMode);
}

// 切换主题
export function toggleTheme() {
  const currentTheme = theme();
  let newTheme: Theme;

  if (currentTheme === 'light') {
    newTheme = 'dark';
  } else if (currentTheme === 'dark') {
    newTheme = 'system';
  } else {
    newTheme = 'light';
  }

  setTheme(newTheme);
  localStorage.setItem('theme', newTheme);
  updateDarkMode();
}

// 设置主题
export function setThemeMode(mode: Theme) {
  setTheme(mode);
  localStorage.setItem('theme', mode);
  updateDarkMode();
}

// 导出
export function useTheme() {
  return {
    theme: theme(),
    isDark: isDark(),
    toggleTheme,
    setThemeMode,
  };
}

export { theme, isDark };
