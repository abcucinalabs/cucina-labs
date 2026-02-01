/** Convert a camelCase key to snake_case */
function camelToSnake(key: string): string {
  return key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`)
}

/** Convert a snake_case key to camelCase */
function snakeToCamel(key: string): string {
  return key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
}

/** Convert a camelCase object to snake_case keys for DB writes */
export function toSnakeCase(obj: Record<string, any>): Record<string, any> {
  const result: Record<string, any> = {}
  for (const [key, value] of Object.entries(obj)) {
    result[camelToSnake(key)] = value
  }
  return result
}

/** Convert a snake_case DB row to camelCase for app use */
export function toCamelCase<T = Record<string, any>>(obj: Record<string, any>): T {
  const result: Record<string, any> = {}
  for (const [key, value] of Object.entries(obj)) {
    result[snakeToCamel(key)] = value
  }
  return result as T
}

/** Convert an array of snake_case DB rows to camelCase */
export function toCamelCaseArray<T = Record<string, any>>(arr: Record<string, any>[]): T[] {
  return arr.map((row) => toCamelCase<T>(row))
}
