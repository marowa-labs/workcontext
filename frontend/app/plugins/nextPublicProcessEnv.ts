import { type Plugin, loadEnv } from 'vite';

/**
 * Makes `process.env` safe on the **client** only.
 *   • NEXT_PUBLIC_* keys get their literal values.
 *   • Every other key returns `undefined`.
 * Server / SSR code is untouched.
 */
export function nextPublicProcessEnv(): Plugin {
  const publicEnv = loadEnv(
    process.env.NODE_ENV ?? 'development',
    process.cwd(),
    'NEXT_PUBLIC_',
  );

  const stub = `
if (typeof window !== 'undefined') {
  const $public = ${JSON.stringify(publicEnv)};
  globalThis.process ??= {};
  // Preserve any env vars set by other libraries
  const base = globalThis.process.env ?? {};
  globalThis.process.env = new Proxy(Object.assign({}, $public, base), {
    get(t, p) { return p in t ? t[p] : undefined; },
    has() { return true; }
  });
}
`;

  return {
    name: 'vite:next-public-process-env',
    enforce: 'post',

    /** Inject the stub at the top of every JS/TS module compiled for the browser. */
    transform(code, id, opts) {
      if (opts?.ssr) return null;                          // server/SSR build → leave untouched
      if (!/\.[cm]?[jt]sx?$/.test(id)) return null;  // ignore non-JS modules
      if (code.includes('globalThis.process ??=')) return null; // already injected
      return { code: stub + code, map: null };
    },
  };
}

