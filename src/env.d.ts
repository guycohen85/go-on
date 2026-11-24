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
