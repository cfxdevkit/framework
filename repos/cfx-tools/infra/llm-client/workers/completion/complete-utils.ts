export function assistantMessageText(message) {
  if (!message?.content) return '';
  if (typeof message.content === 'string') return message.content;
  if (!Array.isArray(message.content)) return '';
  return message.content
    .filter((part) => part?.type === 'text' && typeof part.text === 'string')
    .map((part) => part.text)
    .join('')
    .trim();
}

// ─── Complete / LLM call ──────────────────────────────────────────────────────
