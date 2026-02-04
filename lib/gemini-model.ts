const deprecatedModelMap: Record<string, string> = {
  "gemini-2.5-flash-preview-05-20": "gemini-2.5-flash",
}

export function normalizeGeminiModel(model?: string | null): string {
  if (!model) return "gemini-2.5-flash"
  return deprecatedModelMap[model] || model
}
