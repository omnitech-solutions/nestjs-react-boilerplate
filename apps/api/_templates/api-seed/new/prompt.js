/* eslint-disable @typescript-eslint/no-var-requires */
const fs = require('fs')
const path = require('path')

// Allow importing TS AppModule
require('ts-node/register/transpile-only')
require('tsconfig-paths/register')

const { NestFactory } = require('@nestjs/core')
const { getDataSourceToken } = require('@nestjs/typeorm')
const { AppModule } = require('../../../src/app.module')

const RESERVED_SKIP = new Set(['uuid', 'createdAt', 'updatedAt'])

const toPlural = (s) => {
  const lower = s[0].toLowerCase() + s.slice(1)
  return lower.endsWith('s') ? lower : `${lower}s`
}
const toLower = (s) => s[0].toLowerCase() + s.slice(1)

// very simple heuristics for fake data generation
function fakeExprFor(col) {
  const name = col.propertyName.toLowerCase()
  const sql = String(col.type).toLowerCase()
  const isString = ['varchar', 'text', 'char', 'tinytext', 'mediumtext', 'longtext'].includes(sql)
  const isNumber = ['int', 'integer', 'smallint', 'mediumint', 'float', 'double'].includes(sql)
  const isDecimalLike = ['decimal', 'numeric', 'bigint'].includes(sql)
  const isBool = sql === 'boolean' || (sql === 'tinyint' && col.width === 1)
  const isDate = ['datetime', 'timestamp', 'date', 'time'].includes(sql)
  const isJson = sql === 'json'

  // name-ish
  if (isString) {
    if (name === 'name') return "faker.company.name()"
    if (name.includes('industry')) return "faker.commerce.department()"
    if (name.includes('website') || name.includes('url')) return "faker.internet.url()"
    if (name.includes('email')) return "faker.internet.email()"
    if (name.includes('phone')) return "faker.phone.number()"
    if (sql === 'text') return "faker.lorem.paragraph()"
    return "faker.lorem.words(3)"
  }
  if (isNumber) return "faker.number.int({ min: 0, max: 10000 })"
  if (isDecimalLike) return "faker.number.float({ min: 0, max: 10000, fractionDigits: 2 }).toString()"
  if (isBool) return "faker.datatype.boolean()"
  if (isDate) return "new Date()" // entity expects Date
  if (isJson) return "({})"
  return "null" // fallback; can be overridden in code later
}

module.exports = {
  prompt: async ({ inquirer, args }) => {
    const def = args.name || ''
    const { name } = await inquirer.prompt([
      { type: 'input', name: 'name', message: 'Entity name to seed (e.g., Organization)', default: def }
    ])

    const lower = toLower(name)
    const plural = toPlural(name)

    // Boot Nest app context (no HTTP)
    const app = await NestFactory.createApplicationContext(AppModule, { logger: false })
    try {
      const ds = app.get(getDataSourceToken())
      if (!ds.isInitialized) await ds.initialize()

      const meta =
          ds.entityMetadatas.find((m) => m.name === name) ||
          ds.entityMetadatas.find((m) => m.tableName === plural)

      if (!meta) {
        throw new Error(
            `Entity metadata for "${name}" not found. Ensure the entity is registered with TypeOrmModule.`
        )
      }

      // Collect seedable columns
      const cols = meta.columns
          .filter((c) => !RESERVED_SKIP.has(c.propertyName))
          .map((c) => ({
            prop: c.propertyName,
            nullable: !!c.isNullable,
            fakeExpr: fakeExprFor(c)
          }))

      // Determine if a factory file exists
      const factoryRel = path.join('src', 'database', 'factories', `${lower}.factory.ts`)
      const hasFactory = fs.existsSync(factoryRel)

      // Build inline make-body (only if no factory)
      const makeBody = cols
          .map(({ prop, fakeExpr, nullable }) => {
            // For nullable, randomly omit ~30% of the time, but keep simple for template: always set a sensible value
            return `  ${prop}: ${fakeExpr}${nullable ? '' : ''},`
          })
          .join('\n')

      return {
        name,
        lower,
        plural,
        hasFactory,
        factoryImportPath: `../../factories/${lower}.factory`,
        entityImportPath: `../../../${plural}/${lower}.entity`,
        makeBody
      }
    } finally {
      await app.close()
    }
  }
}