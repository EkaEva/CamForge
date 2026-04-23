import { TitleBar, Sidebar, MainCanvas, StatusBar } from './components/layout';
import { ErrorBoundary } from './components/ErrorBoundary';
import { initTheme } from './stores/settings';
import './index.css';

// 初始化主题
initTheme();

function App() {
  return (
    <ErrorBoundary>
      <div class="h-screen flex flex-col bg-white dark:bg-gray-900">
        <TitleBar />
        <div class="flex-1 flex overflow-hidden">
          <Sidebar />
          <MainCanvas />
        </div>
        <StatusBar />
      </div>
    </ErrorBoundary>
  );
}

export default App;