// apps/api/src/utils/discover-modules.ts
import path from 'path'

import fg from 'fast-glob'

export async function loadFeatureModules(baseDir: string): Promise<any[]> {
  const patterns = [
    '**/*.module.{ts,js}',
    '!**/app.module.{ts,js}',
    '!**/node_modules/**',
    '!**/test/**',
    '!**/database/**'
  ]
  const files = await fg(patterns, { cwd: baseDir, absolute: true })

  const mods: any[] = []
  for (const file of files) {
    const loaded = await import(pathToFileUrl(file).href) // ESM-friendly
    for (const exp of Object.values(loaded)) {
      if (typeof exp === 'function' && exp.name.endsWith('Module') && exp.name !== 'AppModule') {
        mods.push(exp)
      }
    }
  }
  return mods
}

// Convert file path to a URL for dynamic import
function pathToFileUrl(filePath: string): URL {
  const fullPath = path.resolve(filePath)
  return new URL(`file://${fullPath}`)
}
