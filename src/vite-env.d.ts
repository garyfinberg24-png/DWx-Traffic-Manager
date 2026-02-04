/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_CLIENT_ID: string;
  readonly VITE_TENANT_ID: string;
  readonly VITE_CLIENT_SECRET: string;
  readonly VITE_SHAREPOINT_SITE_URL: string;
  readonly VITE_LIST_NAME: string;
  readonly VITE_DOCUMENT_LIBRARY: string;
  readonly VITE_POWER_AUTOMATE_URL: string;
  readonly VITE_DEMO_CALENDAR_EMAIL: string;
  readonly VITE_ENV: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
