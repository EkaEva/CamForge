import { defineConfig, type Plugin } from "vite";
import solid from "vite-plugin-solid";

// @ts-expect-error process is a nodejs global
const host = process.env.TAURI_DEV_HOST;

/**
 * Vite plugin: inject CSP nonce into all inline <style> and <script> tags
 * in the built HTML.
 *
 * - For web deployment (Rust server): uses placeholder __CSP_NONCE__ which the
 *   server replaces with a per-request random nonce.
 * - For Tauri desktop: uses a static nonce value since Tauri serves from local
 *   files and cannot inject per-request nonces. The static nonce is configured
 *   in tauri.conf.json CSP.
 * - In dev mode: replaces __CSP_NONCE__ with the Tauri static nonce so Vite's
 *   HMR client can use it for dynamic <style> injection.
 *
 * This allows removing 'unsafe-inline' from both style-src and script-src in CSP.
 */
function cspNoncePlugin(): Plugin {
  const TAURI_NONCE = "tauri-csp-nonce";

  return {
    name: "csp-nonce-inject",
    enforce: "post",

    // Dev mode: replace __CSP_NONCE__ in index.html with static nonce
    // so Vite HMR client reads it from <meta property="csp-nonce">
    transformIndexHtml: {
      order: "post",
      handler(html) {
        return html.replace(/__CSP_NONCE__/g, TAURI_NONCE);
      },
    },

    // Production build: inject nonce attributes into inline tags
    generateBundle(_, bundle) {
      // Tauri builds set TAURI_ENV_PLATFORM; use a static nonce for Tauri
      const isTauri = !!process.env.TAURI_ENV_PLATFORM;
      const nonceValue = isTauri ? TAURI_NONCE : "__CSP_NONCE__";

      for (const [fileName, chunk] of Object.entries(bundle)) {
        if (chunk.type === "asset" && fileName.endsWith(".html") && typeof chunk.source === "string") {
          // Add nonce to inline <style> tags (not <link rel="stylesheet">)
          chunk.source = chunk.source.replace(
            /<style>/g,
            `<style nonce="${nonceValue}">`
          );
          // Add nonce to inline <script> tags (not <script src="..."> or <script type="application/ld+json">)
          chunk.source = chunk.source.replace(
            /<script(?![^>]*\bsrc=)(?![^>]*type="application\/ld\+json")([^>]*)>/g,
            `<script nonce="${nonceValue}"$1>`
          );
          // Also replace the csp-nonce meta tag placeholder for Tauri
          if (isTauri) {
            chunk.source = chunk.source.replace(
              /content="__CSP_NONCE__"/g,
              `content="${nonceValue}"`
            );
          }
        }
      }
    },
  };
}

// https://vite.dev/config/
export default defineConfig(async () => ({
  plugins: [solid(), cspNoncePlugin()],

  // Worker 配置
  worker: {
    format: 'es',
  },

  // Vite options tailored for Tauri development and only applied in `tauri dev` or `tauri build`
  //
  // 1. prevent Vite from obscuring rust errors
  clearScreen: false,
  // 2. tauri expects a fixed port, fail if that port is not available
  server: {
    port: 1420,
    strictPort: true,
    host: host || false,
    hmr: host
      ? {
          protocol: "ws",
          host,
          port: 1421,
        }
      : undefined,
    watch: {
      // 3. tell Vite to ignore watching `src-tauri`
      ignored: ["**/src-tauri/**"],
    },
  },
}));
