interface ImportMetaEnv {
  /** Web3Forms access key for anonymous feedback. Public by design. */
  readonly PUBLIC_WEB3FORMS_KEY?: string;
  readonly PUBLIC_APP_VERSION?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
