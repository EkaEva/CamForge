import { JSX, ParentComponent, createSignal, onCleanup, onMount } from 'solid-js';

interface ErrorBoundaryProps {
  fallback?: JSX.Element;
  onError?: (error: Error, errorInfo: { componentStack?: string }) => void;
}

/**
 * 错误边界组件
 *
 * 捕获子组件树中的渲染错误，防止整个应用白屏崩溃。
 * 显示友好的错误信息并提供重新加载按钮。
 */
export const ErrorBoundary: ParentComponent<ErrorBoundaryProps> = (props) => {
  const [hasError, setHasError] = createSignal(false);
  const [error, setError] = createSignal<Error | null>(null);

  const handleError = (event: ErrorEvent) => {
    // 只处理来自当前组件树的错误
    setHasError(true);
    setError(event.error);

    // 调用错误回调
    if (props.onError) {
      props.onError(event.error, { componentStack: undefined });
    }

    // 阻止错误继续传播
    event.preventDefault();
  };

  const handleRejection = (event: PromiseRejectionEvent) => {
    setHasError(true);
    setError(event.reason);

    if (props.onError) {
      props.onError(event.reason, { componentStack: undefined });
    }

    event.preventDefault();
  };

  onMount(() => {
    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleRejection);
  });

  onCleanup(() => {
    window.removeEventListener('error', handleError);
    window.removeEventListener('unhandledrejection', handleRejection);
  });

  const handleReload = () => {
    setHasError(false);
    setError(null);
    window.location.reload();
  };

  const handleDismiss = () => {
    setHasError(false);
    setError(null);
  };

  if (hasError()) {
    return (
      props.fallback || (
        <div class="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
          <div class="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div class="flex items-center gap-3 mb-4">
              <div class="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <svg
                  class="w-6 h-6 text-red-600 dark:text-red-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
                发生错误
              </h2>
            </div>

            <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">
              应用遇到了一个意外错误。请尝试重新加载页面。
            </p>

            {error() && (
              <div class="mb-4 p-3 bg-gray-100 dark:bg-gray-700 rounded text-xs font-mono text-gray-700 dark:text-gray-300 overflow-auto max-h-32">
                {error()?.message || 'Unknown error'}
              </div>
            )}

            <div class="flex gap-3">
              <button
                class="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
                onClick={handleReload}
              >
                重新加载
              </button>
              <button
                class="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200 rounded-lg font-medium transition-colors"
                onClick={handleDismiss}
              >
                忽略
              </button>
            </div>
          </div>
        </div>
      )
    );
  }

  return <>{props.children}</>;
};

export default ErrorBoundary;
