import { randomUUID } from 'node:crypto';

/**
 * Hands a RenderConfig to the headless page out-of-band.
 *
 * The config used to ride in the URL: `render.html?config=<base64url>`. That put
 * the whole payload in the request *head*, and `http.createServer` caps the head
 * at Node's default 16 KB. Measured: the boundary polygon for "Ho Chi Minh City"
 * encodes to 20,698 bytes, so the app server answered `431` and the page never
 * loaded — `renderFrame` then waited out its full 20 s timeout and failed with an
 * opaque error. The MCP boundary meanwhile accepts an 8 MiB body. Region
 * highlighting for anything larger than a district was simply broken.
 *
 * So the URL now carries only a short id and the page fetches the payload. The id
 * still changes on every render, which is what forces the real document reload the
 * stale-frame guard depends on.
 */
export interface ConfigStore {
  /** Park a payload and get the id to put in the URL. */
  put(json: string): string;
  get(id: string): string | undefined;
  drop(id: string): void;
  /** Live entries — a leak here means renders are not cleaning up. */
  size(): number;
}

export function createConfigStore(): ConfigStore {
  const entries = new Map<string, string>();
  return {
    put(json) {
      // A random id, NOT a hash of the payload: two concurrent renders of the
      // same config would share a hashed id, and the first to finish would drop
      // it out from under the second.
      const id = randomUUID().replace(/-/g, '');
      entries.set(id, json);
      return id;
    },
    get: (id) => entries.get(id),
    drop: (id) => void entries.delete(id),
    size: () => entries.size,
  };
}
