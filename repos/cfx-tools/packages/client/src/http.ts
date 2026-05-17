/** Minimal fetch-based HTTP helper used by all namespace clients. */
export class HttpClient {
  readonly #baseUrl: string;
  readonly #fetch: typeof fetch;

  constructor(baseUrl: string, fetchImpl: typeof fetch = globalThis.fetch.bind(globalThis)) {
    this.#baseUrl = baseUrl.replace(/\/$/, '');
    this.#fetch = fetchImpl === globalThis.fetch ? fetchImpl.bind(globalThis) : fetchImpl;
  }

  async get<T>(path: string): Promise<T> {
    const res = await this.#fetch(`${this.#baseUrl}${path}`, {
      headers: { accept: 'application/json' },
    });
    return this.#parse<T>(res);
  }

  async post<T>(path: string, body?: unknown): Promise<T> {
    const res = await this.#fetch(`${this.#baseUrl}${path}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', accept: 'application/json' },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });
    return this.#parse<T>(res);
  }

  async put<T>(path: string, body?: unknown): Promise<T> {
    const res = await this.#fetch(`${this.#baseUrl}${path}`, {
      method: 'PUT',
      headers: { 'content-type': 'application/json', accept: 'application/json' },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });
    return this.#parse<T>(res);
  }

  async patch<T>(path: string, body?: unknown): Promise<T> {
    const res = await this.#fetch(`${this.#baseUrl}${path}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json', accept: 'application/json' },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });
    return this.#parse<T>(res);
  }

  async delete<T>(path: string): Promise<T> {
    const res = await this.#fetch(`${this.#baseUrl}${path}`, {
      method: 'DELETE',
      headers: { accept: 'application/json' },
    });
    return this.#parse<T>(res);
  }

  async #parse<T>(res: Response): Promise<T> {
    const text = await res.text();
    let data: unknown;
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error(`Server returned non-JSON (${res.status}): ${text.slice(0, 200)}`);
    }
    if (!res.ok) {
      const msg =
        data && typeof data === 'object' && 'error' in data
          ? String((data as { error: unknown }).error)
          : `HTTP ${res.status}`;
      throw new Error(msg);
    }
    return data as T;
  }
}
