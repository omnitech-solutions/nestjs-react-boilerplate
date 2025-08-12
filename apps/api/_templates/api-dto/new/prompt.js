/* eslint-disable @typescript-eslint/no-var-requires */
const path = require('path')

// allow importing TS AppModule
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

function validatorsFromColumn(col) {
  const sql = String(col.type).toLowerCase()
  const v = new Set()
  const isString = ['varchar', 'text', 'char', 'tinytext', 'mediumtext', 'longtext'].includes(sql)
  const isNumber = ['int', 'integer', 'smallint', 'mediumint', 'float', 'double'].includes(sql)
  const isDecimalLike = ['decimal', 'numeric', 'bigint'].includes(sql)
  const isBool = sql === 'boolean' || (sql === 'tinyint' && col.width === 1)
  const isDate = ['datetime', 'timestamp', 'date', 'time'].includes(sql)
  const isJson = sql === 'json'

  if (isString) {
    v.add('IsString')
    if (col.databaseName === 'name' && col.length) v.add(`Length:${2},${col.length}`)
  } else if (isNumber) {
    v.add('IsNumber')
  } else if (isDecimalLike) {
    v.add('IsString') // represent in DTO as string
  } else if (isBool) {
    v.add('IsBoolean')
  } else if (isDate) {
    v.add('IsDateString')
  } else if (isJson) {
    // optionally: v.add('IsObject')
  }
  if (col.isNullable) v.add('IsOptional')
  return Array.from(v)
}
const dtoTypeFromColumn = (col) => {
  const sql = String(col.type).toLowerCase()
  if (['varchar', 'text', 'char', 'tinytext', 'mediumtext', 'longtext'].includes(sql)) return 'string'
  if (['int', 'integer', 'smallint', 'mediumint', 'float', 'double'].includes(sql)) return 'number'
  if (['decimal', 'numeric', 'bigint'].includes(sql)) return 'string'
  if (sql === 'boolean' || (sql === 'tinyint' && col.width === 1)) return 'boolean'
  if (['datetime', 'timestamp', 'date', 'time'].includes(sql)) return 'string'
  if (sql === 'json') return 'Record<string, any>'
  return 'any'
}

module.exports = {
  prompt: async ({ inquirer, args }) => {
    const def = args.name || ''
    const { name } = await inquirer.prompt([
      { type: 'input', name: 'name', message: 'Entity name (singular, e.g., Organization)', default: def },
    ])

    const lower = toLower(name)
    const plural = toPlural(name)

    // Boot an application context (no HTTP)
    const app = await NestFactory.createApplicationContext(AppModule, { logger: false })
    try {
      const ds = app.get(getDataSourceToken()) // ✅ correct provider token
      if (!ds.isInitialized) await ds.initialize()

      // find metadata by class name or table name
      const meta =
          ds.entityMetadatas.find((m) => m.name === name) ||
          ds.entityMetadatas.find((m) => m.tableName === plural)

      if (!meta) {
        throw new Error(
            `Entity metadata for "${name}" not found. Ensure the entity is registered in TypeOrmModule and in the same process.`
        )
      }

      const fields = meta.columns
          .filter((c) => !RESERVED_SKIP.has(c.propertyName))
          .map((c) => {
            const validators = validatorsFromColumn(c)
            const dtoType = dtoTypeFromColumn(c)
            const isOptional = c.isNullable === true
            return { name: c.propertyName, dtoType, isOptional, validators }
          })

      // dedupe imports
      const importSet = new Set()
      fields.forEach((f) => f.validators.forEach((v) => importSet.add(v.split(':')[0])))
      const validatorImports = Array.from(importSet).sort()

      return { name, lower, plural, fields, validatorImports }
    } finally {
      await app.close()
    }
  },
}