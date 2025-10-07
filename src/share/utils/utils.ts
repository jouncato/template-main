export function safeJsonParse<T = object>(data: string): T | string {
  try {
    return JSON.parse(data) as T;
  } catch {
    return data;
  }
}
