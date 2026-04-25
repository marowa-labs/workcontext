import path from 'node:path';
import type { Plugin } from 'vite';
import { existsSync } from 'node:fs';

export function aliases(): Plugin {
  return {
    enforce: 'pre', // run as early as possible
    name: 'api-aware-alias',
    resolveId(source: string, importer?: string) {
      if (!source.startsWith('@/')) return;
      const sourcePath = source.slice('@/'.length);
      const extensions = ['.ts', '.js', '.tsx', '.jsx'];

      for (const ext of extensions) {
        const filePath = path.resolve(__dirname, '../', 'src', `./${sourcePath}${ext}`);

        if (existsSync(filePath)) {
          return filePath;
        }
      }
      return;
    },
  };
}
