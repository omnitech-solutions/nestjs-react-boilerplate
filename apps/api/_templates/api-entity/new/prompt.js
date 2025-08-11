// apps/api/_templates/api-entity/new/prompt.js
module.exports = {
  prompt: async ({ inquirer, args }) => {
    const def = args.name || ''
    const { name } = await inquirer.prompt([
      {
        type: 'input',
        name: 'name',
        message: 'Entity name (singular, e.g., Organization)',
        default: def
      }
    ])

    const lower = name.charAt(0).toLowerCase() + name.slice(1)
    // basic pluralization — can be swapped for inflection lib if needed
    const plural = lower.endsWith('s') ? lower : `${lower}s`

    return { name, lower, plural }
  }
}
