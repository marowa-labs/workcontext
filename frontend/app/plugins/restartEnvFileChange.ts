import type { Plugin } from 'vite';
import path from 'node:path';
import fs from 'node:fs';


export function restartEnvFileChange(): Plugin {
  return {
    name: 'watch-env-and-exit',
    config(config, env) {
      const root = config.root || process.cwd();
      const mode = env.mode || 'development';

      const filesToWatch = [
        '.env',
        '.env.local',
        `.env.${mode}`,
        `.env.${mode}.local`,
      ]
        .map((f) => path.resolve(root, f))
        .filter((file) => fs.existsSync(file));

      for (const file of filesToWatch) {
        fs.watch(file, { persistent: false }, () => {
          console.log(`[vite] Detected change in ${path.basename(file)}. Exiting for restart...`);
          process.exit(0);
        });
      }
    },
  };
}
