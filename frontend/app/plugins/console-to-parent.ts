import type { Plugin } from 'vite';

/**
 * A Vite plugin that injects a self-executing bundle into every module
 * to forward console messages to the parent window.
 */
export default function consoleToParent(): Plugin {
  const virtId = '\0virtual:console-to-parent';

  return {
    name: 'vite-console-to-parent',
    apply: 'serve',
    resolveId(id) {
      if (id === virtId) return id;
    },
    load(id) {
      if (id !== virtId) return;

      return `
(function () {
  if (typeof window === 'undefined') return;
  if (!window || window.parent === window) return;

  const allow = '*';
  const allowed = (origin) =>
    allow === '*' ||
    (Array.isArray(allow) ? allow.includes(origin) : allow === origin);

  function safeStringify(value) {
    return JSON.stringify(value, (_k, v) => {
      if (v instanceof Date) return { __t: 'Date', v: v.toISOString() };
      if (v instanceof Error)
        return { __t: 'Error', v: { name: v.name, message: v.message, stack: v.stack } };
      return v;
    });
  }

  function format(args) {
    if (!args.length) return '';
    const first = args[0];
    if (typeof first !== 'string') {
      return args.map(String).join(' ');
    }
    let index = 1;
    const out = first.replace(/%[sdifjoOc%]/g, (m) => {
      if (m === '%%') return '%';
      if (m === '%c') { index++; return ''; } // swallow CSS styles
      if (index >= args.length) return m;
      const val = args[index++];
      switch (m) {
        case '%s': return String(val);
        case '%d':
        case '%i': return parseInt(val, 10);
        case '%f': return parseFloat(val);
        case '%j': try { return JSON.stringify(val); } catch { return '[Circular]'; }
        case '%o':
        case '%O': try { return String(val); } catch { return '[Object]'; }
        default: return m;
      }
    });
    const rest = args.slice(index).map(String).join(' ');
    return rest ? out + ' ' + rest : out;
  }

  ['log', 'info', 'warn', 'error', 'debug', 'table', 'trace'].forEach((level) => {
    const original = console[level]?.bind(console);
    console[level] = (...args) => {
      try {
        const message = {
          type: 'sandbox:web:console-write',
          __viteConsole: true,
          level,
          text: format(args),
          args: args.map(safeStringify),
        };
        window.parent.postMessage(message, '*');
      } catch (_) {}
      original?.(...args);
    };
  });
})();
      `;
    },
    transform(code, id) {
      if (id.includes('node_modules')) return;
      if (!id.includes('/apps/web/src/')) return;
      if (!/\.(js|ts|jsx|tsx)$/.test(id)) return;
      return {
        code: `import '${virtId}';\n${code}`,
        map: null,
      };
    },
  };
}
