const toOptionsCode = (opts) => {
  const order = ['name','type','length','precision','scale','nullable'];
  const entries = Object.entries(opts)
      .sort((a,b) => order.indexOf(a[0]) - order.indexOf(b[0]))
      .map(([k, v]) => `${k}: ${typeof v === 'string' ? `'${v}'` : v}`);
  return `{ ${entries.join(', ')} }`;
};

const parseFields = (raw) => {
  if (!raw) return [];
  const tokens = raw.split(/\s+/).map((t) => t.trim()).filter(Boolean);

  return tokens.map((tok) => {
    const nullable = tok.endsWith('?');
    const core = nullable ? tok.slice(0, -1) : tok;

    const [prop, typeSpec] = core.split(':').map((x) => x.trim());
    if (!prop || !typeSpec) return null;

    const m = typeSpec.match(/^(\w+)(?:\{([^}]+)\})?$/i);
    if (!m) return null;
    const base = m[1].toLowerCase();
    const args = m[2]?.split(',').map((x) => x.trim()) ?? [];

    // TS type
    let tsType = 'unknown';
    switch (base) {
      case 'string':
      case 'text':
        tsType = 'string'; break;
      case 'int':
      case 'integer':
      case 'float':
      case 'double':
        tsType = 'number'; break;
      case 'bigint':
      case 'decimal':
      case 'numeric':
        tsType = 'string'; break; // safe for MySQL drivers
      case 'boolean':
        tsType = 'boolean'; break;
      case 'datetime':
      case 'timestamp':
      case 'date':
      case 'time':
        tsType = 'Date'; break;
      case 'json':
        tsType = 'Record<string, any>'; break;
      default:
        tsType = 'any';
    }

    // TypeORM options
    const options = {};
    switch (base) {
      case 'string':
        options.type = 'varchar';
        if (args[0]) options.length = Number(args[0]);
        break;
      case 'integer':
        options.type = 'int'; break;
      case 'decimal':
      case 'numeric':
        options.type = base;
        if (args[0]) options.precision = Number(args[0]);
        if (args[1]) options.scale = Number(args[1]);
        break;
      default:
        options.type = base;
    }
    if (nullable) options.nullable = true;

    return {
      prop,
      tsType,
      nullable,
      optionsCode: toOptionsCode(options),
    };
  }).filter(Boolean);
};

module.exports = {
  prompt: async ({ inquirer, args }) => {
    const def = args.name || '';
    const { name } = await inquirer.prompt([
      { type: 'input', name: 'name', message: 'Entity name (singular, e.g., Metric)', default: def }
    ]);

    const lower = name.charAt(0).toLowerCase() + name.slice(1);
    const plural = lower.endsWith('s') ? lower : `${lower}s`;

    const includeTimestamps = !(
        args['no-timestamps'] === true ||
        args.noTimestamps === true ||
        args.timestamps === false
    );

    // Rails-like: --fields "value:decimal{18,6} unit:string{32}? recorded_at:datetime"
    const columns = parseFields(args.fields || args.attributes || '');

    return { name, lower, plural, includeTimestamps, columns };
  }
};