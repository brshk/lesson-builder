/**
 * Клієнтське читання SSE-потоку від /api/generate та /api/edit.
 *
 * Винесено окремо, бо в парсері є неочевидна деталь: останній фрагмент
 * приходить без завершального роздільника, і його треба дообробити після
 * циклу читання — інакше губиться кінець відповіді.
 */
export interface SseHandlers {
  onText?: (text: string) => void;
  onStatus?: (message: string) => void;
  onMeta?: (data: Record<string, unknown>) => void;
}

export async function streamSse(
  url: string,
  body: unknown,
  headers: Record<string, string>,
  handlers: SseHandlers,
  signal?: AbortSignal
): Promise<void> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
    signal,
  });

  if (!res.ok || !res.body) {
    const data = await res.json().catch(() => null);
    throw new Error(data?.error || `HTTP ${res.status}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  const handleEvent = (raw: string) => {
    const eventMatch = raw.match(/^event: (.+)$/m);
    const dataMatch = raw.match(/^data: (.+)$/m);
    if (!eventMatch || !dataMatch) return;
    let data: { text?: string; message?: string; error?: string } = {};
    try {
      data = JSON.parse(dataMatch[1]);
    } catch {
      return;
    }
    switch (eventMatch[1]) {
      case "text":
        if (data.text) handlers.onText?.(data.text);
        break;
      case "status":
        if (data.message) handlers.onStatus?.(data.message);
        break;
      case "meta":
        handlers.onMeta?.(data as Record<string, unknown>);
        break;
      case "error":
        throw new Error(data.error || "Помилка генерації");
    }
  };

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const events = buffer.split("\n\n");
    buffer = events.pop() ?? "";
    for (const e of events) handleEvent(e);
  }
  buffer += decoder.decode();
  for (const e of buffer.split("\n\n")) handleEvent(e);
}
