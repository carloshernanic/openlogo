// Valida brands/*/brand.json: schema, coerência com a pasta, aliases únicos e privacidade.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Ajv } from 'ajv';
import addFormats from 'ajv-formats';
import { ROOT, listBrandFolders, loadBrand, type BrandEntry } from './lib/brands.ts';
import { privacyProblem } from './lib/privacy.ts';
import { aliasKey } from './lib/alias-key.ts';

const schema = JSON.parse(readFileSync(join(ROOT, 'schema', 'brand.schema.json'), 'utf8'));
const ajv = new Ajv({ allErrors: true });
addFormats.default(ajv);
const validate = ajv.compile(schema);

const errors: string[] = [];
const owners = new Map<string, { slug: string; alias: string }>();
const folders = listBrandFolders();

for (const folder of folders) {
  const where = `brands/${folder}`;
  let brand: BrandEntry;
  try {
    brand = loadBrand(folder);
  } catch (e) {
    errors.push(`${where}: brand.json ausente ou inválido (${(e as Error).message})`);
    continue;
  }
  const { data } = brand;

  if (!validate(data)) {
    for (const err of validate.errors ?? []) {
      errors.push(`${where}/brand.json${err.instancePath}: ${err.message}`);
    }
    continue;
  }

  if (data.slug !== folder) errors.push(`${where}: slug "${data.slug}" difere do nome da pasta`);

  const missing = data.logoStatus === 'missing';
  if (!missing && !brand.hasLogo) errors.push(`${where}: falta logo.svg (ou marque "logoStatus": "missing")`);
  if (missing && brand.hasLogo) errors.push(`${where}: tem logo.svg mas está marcada como "missing"`);
  if (missing && brand.hasDarkLogo) errors.push(`${where}: logo-dark.svg sem logo.svg`);

  // O nome também vira alias no índice, então entra na checagem de colisão.
  for (const alias of [data.name, ...data.aliases]) {
    const problem = privacyProblem(alias);
    if (problem) errors.push(`${where}: alias "${alias}" ${problem}`);

    const key = aliasKey(alias);
    if (!key) {
      errors.push(`${where}: alias "${alias}" fica vazio depois da normalização`);
      continue;
    }
    const owner = owners.get(key);
    if (owner && owner.slug !== data.slug) {
      errors.push(`${where}: alias "${alias}" colide com "${owner.alias}" de brands/${owner.slug}`);
    } else if (!owner) {
      owners.set(key, { slug: data.slug, alias });
    }
  }
}

if (errors.length > 0) {
  console.error(`✖ ${errors.length} problema(s) em brands/:\n`);
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}
console.log(`✔ ${folders.length} marca(s) válidas`);
