/// <reference types="vite/client" />

// Globals used when running inside certain hosted environments.
// When running locally, these will be undefined and we fall back to Vite env vars.
declare const __firebase_config: string | undefined;
declare const __app_id: string | undefined;
declare const __initial_auth_token: string | undefined;
