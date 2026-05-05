import { isTauriEnv } from './platform';

export { isTauriEnv };

/**
 * Invoke a Tauri command via IPC.
 * @param command - The Tauri command name
 * @param args - Arguments to pass to the command
 * @throws Error if not running in Tauri environment
 */
export async function invokeCommand<T>(command: string, args?: Record<string, unknown>): Promise<T> {
  if (!isTauriEnv()) {
    throw new Error(`Tauri command "${command}" called outside Tauri environment`);
  }
  const { invoke } = await import('@tauri-apps/api/core');
  return invoke<T>(command, args);
}

/**
 * Open a save file dialog and return the selected path.
 * @param options - Dialog options (filters, default path, etc.)
 * @returns The selected file path, or null if cancelled
 */
export async function saveFileDialog(options?: {
  filters?: { name: string; extensions: string[] }[];
  defaultPath?: string;
}): Promise<string | null> {
  if (!isTauriEnv()) return null;
  const { save } = await import('@tauri-apps/plugin-dialog');
  return save({
    filters: options?.filters,
    defaultPath: options?.defaultPath,
  });
}

/**
 * Write binary data to a file path.
 * @param path - The file path to write to
 * @param data - The binary data to write
 */
export async function writeFile(path: string, data: Uint8Array): Promise<void> {
  if (!isTauriEnv()) return;
  const { writeFile: tauriWriteFile } = await import('@tauri-apps/plugin-fs');
  await tauriWriteFile(path, data);
}
