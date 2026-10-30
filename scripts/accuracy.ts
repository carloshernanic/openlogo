// Mede precisão e recall do resolve() contra fixtures/descriptors.json.
// Sai com erro se ficar abaixo de fixtures/accuracy-thresholds.json.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT } from './lib/brands.ts';
import { resolve } from '../src/index.ts';

interface Fixture {
  descriptor: string;
  expectedSlug: string | null;
}

const read = <T>(file: string) => JSON.parse(readFileSync(join(ROOT, 'fixtures', file), 'utf8')) as T;
const fixtures = read<Fixture[]>('descriptors.json');
const { minPrecision, minRecall } = read<{ minPrecision: number; minRecall: number }>('accuracy-thresholds.json');

let truePositives = 0;
let falsePositives = 0; // devolveu uma marca errada, ou uma marca quando devia ser null
let falseNegatives = 0; // devolveu null quando havia marca esperada
const errors: string[] = [];
const byConfidence = new Map<number, number>();

for (const { descriptor, expectedSlug } of fixtures) {
  const match = resolve(descriptor);
  const got = match?.slug ?? null;
  if (match) byConfidence.set(match.confidence, (byConfidence.get(match.confidence) ?? 0) + 1);

  if (got !== null && got === expectedSlug) truePositives++;
  else if (got !== null) {
    falsePositives++;
    errors.push(`FP  "${descriptor}" → ${got} (${match?.confidence}), esperado ${expectedSlug ?? 'null'}`);
  } else if (expectedSlug !== null) {
    falseNegatives++;
    errors.push(`FN  "${descriptor}" → null, esperado ${expectedSlug}`);
  }
}

const expectedPositives = fixtures.filter((f) => f.expectedSlug !== null).length;
const predicted = truePositives + falsePositives;
const precision = predicted === 0 ? 1 : truePositives / predicted;
const recall = expectedPositives === 0 ? 1 : truePositives / expectedPositives;
const pct = (n: number) => `${(n * 100).toFixed(1)}%`;

console.log(`casos: ${fixtures.length} (${expectedPositives} com marca, ${fixtures.length - expectedPositives} sem marca)`);
console.log(`precisão: ${pct(precision)}  (mínimo ${pct(minPrecision)})`);
console.log(`recall:   ${pct(recall)}  (mínimo ${pct(minRecall)})`);
console.log(`acertos: ${truePositives}  falsos positivos: ${falsePositives}  falsos negativos: ${falseNegatives}`);
console.log(
  `por confiança: ${[...byConfidence.entries()]
    .sort(([a], [b]) => b - a)
    .map(([c, n]) => `${c}=${n}`)
    .join('  ')}`,
);

if (errors.length > 0) {
  console.log(`\nerros (${errors.length}):`);
  for (const e of errors) console.log(`  ${e}`);
}

if (precision < minPrecision || recall < minRecall) {
  console.error('\n✖ abaixo do mínimo em fixtures/accuracy-thresholds.json');
  process.exit(1);
}
console.log('\n✔ dentro do mínimo');
