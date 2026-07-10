import { describe, it, expect } from 'vitest';
import { createConfigStore } from './configStore';

describe('createConfigStore', () => {
  it('round-trips a payload by id', () => {
    const store = createConfigStore();
    const id = store.put('{"a":1}');
    expect(store.get(id)).toBe('{"a":1}');
  });

  it('mints a DIFFERENT id for an identical payload', () => {
    // A content hash would collide, and the first render to finish would drop the
    // entry out from under a concurrent render of the same config.
    const store = createConfigStore();
    const a = store.put('{"same":true}');
    const b = store.put('{"same":true}');
    expect(a).not.toBe(b);
    store.drop(a);
    expect(store.get(b)).toBe('{"same":true}'); // the other render is unharmed
  });

  it('forgets a dropped id', () => {
    const store = createConfigStore();
    const id = store.put('{}');
    store.drop(id);
    expect(store.get(id)).toBeUndefined();
    expect(store.size()).toBe(0);
  });

  it('returns undefined for an id it never minted', () => {
    expect(createConfigStore().get('../../etc/passwd')).toBeUndefined();
  });

  it('holds nothing once every render has cleaned up', () => {
    const store = createConfigStore();
    const ids = Array.from({ length: 5 }, (_, i) => store.put(`{"i":${i}}`));
    expect(store.size()).toBe(5);
    ids.forEach(store.drop);
    expect(store.size()).toBe(0);
  });
});
