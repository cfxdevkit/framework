import { afterEach, describe, expect, it, vi } from 'vitest';
import { postChatCompletion } from './http.ts';

describe('postChatCompletion', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('streams progress events and accumulates assistant content', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        new ReadableStream({
          start(controller) {
            const encoder = new TextEncoder();
            controller.enqueue(
              encoder.encode(
                [
                  'data: {"choices":[{"index":0,"delta":{"role":"assistant"},"finish_reason":null}]}\n\n',
                  'data: {"choices":[{"index":0,"delta":{"reasoning_content":"Thinking"},"finish_reason":null}]}\n\n',
                  'data: {"choices":[{"index":0,"delta":{"content":"Hello"},"finish_reason":null}]}\n\n',
                  'data: {"choices":[{"index":0,"delta":{"content":" world"},"finish_reason":"stop"}]}\n\n',
                  'data: [DONE]\n\n',
                ].join(''),
              ),
            );
            controller.close();
          },
        }),
        { status: 200 },
      ),
    );
    vi.stubGlobal('fetch', fetchMock);

    const attempts = [];
    const events = [];
    const content = await postChatCompletion({
      baseUrl: 'http://example.test/v1',
      chatPath: 'chat/completions',
      model: 'demo-model',
      messages: [{ role: 'user', content: 'Say hello' }],
      opts: {
        onProgress: (event) => events.push(event),
      },
      attempts,
    });

    expect(content).toBe('Hello world');
    expect(attempts).toEqual([
      expect.objectContaining({ ok: true, status: 200, empty: false, retry: 1 }),
    ]);
    expect(events.map((event) => event.phase)).toEqual(
      expect.arrayContaining(['request', 'headers', 'reasoning', 'content', 'complete']),
    );
    expect(JSON.parse(fetchMock.mock.calls[0][1]?.body)).toEqual(
      expect.objectContaining({ stream: true }),
    );
  });

  it('passes enable_thinking=false through to the request body', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          choices: [{ message: { content: 'Hello' }, finish_reason: 'stop' }],
        }),
        { status: 200 },
      ),
    );
    vi.stubGlobal('fetch', fetchMock);

    const attempts = [];
    const content = await postChatCompletion({
      baseUrl: 'http://example.test/v1',
      chatPath: 'chat/completions',
      model: 'demo-model',
      messages: [{ role: 'user', content: 'Say hello' }],
      opts: {
        enableThinking: false,
      },
      attempts,
    });

    expect(content).toBe('Hello');
    expect(JSON.parse(fetchMock.mock.calls[0][1]?.body)).toEqual(
      expect.objectContaining({ enable_thinking: false }),
    );
  });

  it('passes n_ctx through to the request body when a minimum context is requested', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          choices: [{ message: { content: 'Hello' }, finish_reason: 'stop' }],
        }),
        { status: 200 },
      ),
    );
    vi.stubGlobal('fetch', fetchMock);

    const attempts = [];
    const content = await postChatCompletion({
      baseUrl: 'http://example.test/v1',
      chatPath: 'chat/completions',
      model: 'demo-model',
      messages: [{ role: 'user', content: 'Say hello' }],
      opts: {
        minContextTokens: 30000,
      },
      attempts,
    });

    expect(content).toBe('Hello');
    expect(JSON.parse(fetchMock.mock.calls[0][1]?.body)).toEqual(
      expect.objectContaining({ n_ctx: 30000 }),
    );
  });
});
