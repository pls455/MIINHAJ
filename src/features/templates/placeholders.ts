const TOKEN = /\{\{\s*([a-zA-Z0-9_.-]+)\s*\}\}/g;

export function resolveTemplate(template: string, values: Record<string, string | number | boolean | null | undefined>): string {
  return template.replace(TOKEN, (_, key: string) => {
    const value = values[key];
    return value == null ? '' : String(value);
  });
}
