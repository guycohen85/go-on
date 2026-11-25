interface ImportMetaEnv {
  /** Web3Forms access key for anonymous feedback. Public by design. */
  readonly PUBLIC_WEB3FORMS_KEY?: string;
  readonly PUBLIC_APP_VERSION?: string;
  /** Set on preview deploys (GitHub Pages): adds noindex so search engines skip the site. */
  readonly PUBLIC_PREVIEW?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

/** Service worker registration from @vite-pwa/astro (declared here: its types live in a transitive package). */
declare module 'virtual:pwa-register' {
  export interface RegisterSWOptions {
    immediate?: boolean;
    onNeedRefresh?: () => void;
    onOfflineReady?: () => void;
    onRegisterError?: (error: unknown) => void;
  }
  /** Returns a function that activates the waiting service worker and reloads the page. */
  export function registerSW(options?: RegisterSWOptions): () => Promise<void>;
}
