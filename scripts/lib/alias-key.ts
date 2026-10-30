/** Chave usada para comparar aliases entre marcas. */
export function aliasKey(alias: string): string {
  return alias
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, ' ')
    .trim();
}
