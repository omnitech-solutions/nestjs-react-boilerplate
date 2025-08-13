import path from 'path'

const { execa } = require('execa')

type ArgMap = Record<string, string | boolean>

function parseArgs(argv: string[]): ArgMap {
  const out: ArgMap = {}
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]!
    if (a == null || !a.startsWith('--')) continue

    const key = a.slice(2)
    const next = argv[i + 1]

    if (next != null && !next.startsWith('--')) {
      out[key] = next
      i++
    } else {
      out[key] = true
    }
  }
  return out
}

async function runPnpm(script: string, args: string[]) {
  const cwd = path.resolve(__dirname, '..') // apps/api
  await execa('pnpm', ['run', script, ...args], { cwd, stdio: 'inherit' })
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  const name = (args.name as string) || ''
  const fields = (args.fields as string) || ''

  if (!name || !fields) {
    console.error(
        'Usage:\n  pnpm -C apps/api gen:all --name <Entity> --fields "<rails-like fields>"\n\nExample:\n  pnpm -C apps/api gen:all --name Insight --fields "value:decimal{18,6} unit:string{32}? recorded_at:datetime"\n'
    )
    process.exit(1)
  }

  await runPnpm('gen:entity', [name, '--fields', fields])
  await runPnpm('gen:dto', [name])
  await runPnpm('gen:service', [name])
  await runPnpm('gen:controller', [name])
  await runPnpm('gen:seed', [name])
  await runPnpm('gen:module', [name])
}

main().catch((err: unknown) => {
  console.error(err)
  process.exit(1)
})