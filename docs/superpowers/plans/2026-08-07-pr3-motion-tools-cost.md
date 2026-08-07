# PR #3 — `compile_motion` + `camera.focus` + `list_fonts` + encoder quality + `cost`

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development hoặc superpowers:executing-plans.

**Goal:** Cho agent (a) xem trước kịch bản chuyển động mà **không tốn một lượt render nào**, (b) chỉ camera vào đúng đối tượng thay vì tự tính toạ độ, (c) biết có những phông nào, (d) đánh đổi chất lượng/dung lượng khi bị từ chối quá cỡ, và (e) biết mỗi lời gọi tốn bao nhiêu.

**Architecture:** Cả năm hạng mục nằm ở tầng `mcp-server/` — không đụng engine render. `compile_motion` tái dùng `resolveConfig` + `resolveMotion` đã export sẵn, **không** `acquireClipSlot`, **không** mở browser page: đó là toàn bộ lý do nó rẻ.

**Tech Stack:** TypeScript, Zod, Vitest, ffmpeg, MCP SDK.

## Global Constraints

- **CẤM đụng `src/lib/export.ts` và `src/lib/mapStyle.ts`** — t3_path. Gói này không có lý do chạm.
- Mọi field Zod mới PHẢI có runtime assert trong `resolveConfig.ts` — `makeTools` được gọi thẳng, bỏ qua Zod.
- Tên trường phải nói rõ đơn vị: `renderMs`, `encodeMs`, `bytes` — không `time`, không `size`.
- Immutability; không `console.log`; conventional commits, không footer attribution.
- Sau toàn bộ: `npm run verify` + `npm run test:mcp` xanh.
- Nhánh xếp chồng trên `feat/routes-measurements` (PR #2 chưa merge). Khi #2 merge xong phải đổi base về `main`.
- Thuế gate: làm stale **cả năm** hợp đồng đã ký → một PR, không tách.

---

### Task 1: `compile_motion` — xem trước kịch bản, không render

Vòng lặp preset→inspect→tweak hiện nay buộc agent trả tiền một clip đầy đủ (~2 phút) chỉ để biết preset sinh ra gì. Tool này trả lời cùng câu hỏi trong mili-giây.

**Files:** Modify `mcp-server/src/tools.ts` · Test `mcp-server/src/tools.test.ts`

**Interfaces:**
- Produces: `compile_motion({...renderMapShape, motion}) → { script: MotionScript, resolved, frames, durationSec, fps }`
- **Bắt buộc:** `chrome` bị ép `'clean'`; KHÔNG gọi `acquireClipSlot`; KHÔNG gọi `deps.renderClip`. Nếu ba điều này sai thì tool mất hết lý do tồn tại.

- [ ] **Step 1.1: Failing test**

```typescript
describe('compile_motion', () => {
  it('returns the compiled script without rendering anything', async () => {
    const t = makeTools({ render, sinkDir, defaultDelivery: 'url' }); // KHÔNG có renderClip
    render.mockClear();
    const j = textJson(await t.compile_motion({
      location: { lng: 105.85, lat: 21.02, zoom: 14 },
      highlight: { points: [{ lng: 105.85, lat: 21.02 }] },
      motion: { preset: 'pushIn' },
    }));

    expect(j.script.camera.length).toBeGreaterThan(1);
    expect(j.fps).toBe(j.script.fps);
    expect(j.frames).toBe(Math.round(j.script.durationSec * j.script.fps));
    expect(j.resolved.center).toBeDefined();
    // Đây là điểm mấu chốt: không một lượt render nào được tiêu
    expect(render).not.toHaveBeenCalled();
  });

  it('reports a preset that cannot compile as an error, not an empty script', async () => {
    const t = makeTools({ render, sinkDir, defaultDelivery: 'url' });
    const res = await t.compile_motion({
      location: { lng: 105.85, lat: 21.02 },
      motion: { preset: 'approach' }, // approach cần highlight.regions
    });
    expect(res.isError).toBe(true);
    expect(textJson(res).error).toMatch(/approach needs highlight\.regions/);
  });

  it('forces chrome clean so the preview matches what render_clip would produce', async () => {
    const t = makeTools({ render, sinkDir, defaultDelivery: 'url' });
    const j = textJson(await t.compile_motion({
      location: { lng: 105.85, lat: 21.02 },
      highlight: { points: [{ lng: 105.85, lat: 21.02 }] },
      chrome: 'poster',
      motion: { preset: 'pushIn' },
    }));
    expect(j.resolved.chrome ?? 'clean').toBe('clean');
  });
});
```

- [ ] **Step 1.2: Run → FAIL**
- [ ] **Step 1.3: Implement** trong `makeTools`:

```typescript
    async compile_motion(params: RenderMapParams & { motion?: unknown }): Promise<ToolResult> {
      try {
        // chrome bị ép 'clean' vì render_clip cũng ép — nếu compile_motion cho
        // xem một script tính trên chrome khác thì bản xem trước nói dối.
        const cfg = await resolveConfig({ ...params, chrome: 'clean' });
        const parsed = parseMotionParam(params.motion);
        if (!parsed.success) return fail(parsed.error);
        const { motion, preset } = resolveMotion(parsed.data, cfg, maxClipFrames());
        return ok({
          ...(preset ? { preset } : {}),
          script: motion,
          fps: motion.fps,
          durationSec: motion.durationSec,
          frames: Math.round(motion.durationSec * motion.fps),
          resolved: resolvedOf(cfg),
        });
      } catch (e) {
        return fail((e as Error).message);
      }
    },
```

Đăng ký trong `registerTools`: mô tả phải nói rõ **không tốn render** — đó là lý do agent chọn nó.

- [ ] **Step 1.4: Run → PASS** · **Step 1.5: Commit**

### Task 2: `camera.focus` — chỉ camera vào đối tượng

Hôm nay agent muốn khung ôm region thứ hai phải tự lấy bbox rồi tự tính center/zoom. Tham số này để engine làm việc đó.

**Files:** Modify `mcp-server/src/resolveConfig.ts`, `mcp-server/src/tools.ts` · Test `mcp-server/src/resolveConfig.test.ts`

**Interfaces:**
- Produces: `camera.focus?: { kind: 'point' | 'region' | 'route'; index: number; paddingPct?: number }`
- Loại trừ với `camera.center`/`camera.zoom` → **throw**, không âm thầm chọn bên thắng.
- Chỉ số ngoài phạm vi → throw kèm số lượng thực có.

- [ ] **Step 2.1: Failing test**

```typescript
describe('camera.focus', () => {
  const two = {
    location: { lng: 105.85, lat: 21.02 },
    highlight: {
      points: [{ lng: 105.0, lat: 21.0 }, { lng: 106.0, lat: 22.0 }],
      regions: [{ geojson: boxFc(105.0, 21.0, 105.2, 21.2) }, { geojson: boxFc(106.0, 22.0, 106.4, 22.4) }],
    },
  };

  it('frames the region at the given index, not the union of all regions', async () => {
    const cfg = await resolveConfig({ ...two, camera: { focus: { kind: 'region', index: 1 } } });
    expect(cfg.camera.center[0]).toBeCloseTo(106.2, 2);
    expect(cfg.camera.center[1]).toBeCloseTo(22.2, 2);
  });

  it('frames the point at the given index', async () => {
    const cfg = await resolveConfig({ ...two, camera: { focus: { kind: 'point', index: 1 } } });
    expect(cfg.camera.center).toEqual([106.0, 22.0]);
  });

  it('zooms OUT as paddingPct grows — the knob does something measurable', async () => {
    const tight = await resolveConfig({ ...two, camera: { focus: { kind: 'region', index: 0, paddingPct: 0 } } });
    const loose = await resolveConfig({ ...two, camera: { focus: { kind: 'region', index: 0, paddingPct: 100 } } });
    expect(loose.camera.zoom).toBeLessThan(tight.camera.zoom);
  });

  it('refuses focus together with an explicit center or zoom', async () => {
    await expect(resolveConfig({ ...two, camera: { focus: { kind: 'point', index: 0 }, zoom: 12 } }))
      .rejects.toThrow(/camera\.focus/);
    await expect(resolveConfig({ ...two, camera: { focus: { kind: 'point', index: 0 }, center: [1, 2] } }))
      .rejects.toThrow(/camera\.focus/);
  });

  it('refuses an index with nothing at it, naming how many exist', async () => {
    await expect(resolveConfig({ ...two, camera: { focus: { kind: 'region', index: 9 } } }))
      .rejects.toThrow(/index out of range \(2 region/);
  });
});
```

- [ ] **Step 2.2: Run → FAIL**
- [ ] **Step 2.3: Implement.** Trong `resolveConfig`, thay nhánh auto-frame:

```typescript
  const focus = params.camera?.focus;
  if (focus && (cam.center || cam.zoom != null)) {
    throw new Error('Invalid camera.focus: mutually exclusive with camera.center / camera.zoom — pass one or the other');
  }
```
Rồi trong khối `if (cam.zoom == null)`, nhánh focus đứng TRƯỚC auto-frame mặc định. `paddingPct` (0..200, mặc định 12) nới span trước khi gọi `zoomFromSpan`:
`zoomFromSpan(span * (1 + paddingPct / 100))`.
Với `kind:'point'` dùng `STREET_ZOOM` và center = điểm đó.

`tools.ts`: thêm `focus` vào `cameraSchema` với `.strict()`.

- [ ] **Step 2.4: Run → PASS** · **Step 2.5: Commit**

### Task 3: `list_fonts` — khám phá phông

**Files:** Modify `mcp-server/src/tools.ts` · Test `mcp-server/src/tools.test.ts`

**Interfaces:** `list_fonts() → { fonts: [{key, stack, titleWeight, titleTracking, uppercaseTitle}] }`

- [ ] **Step 3.1: Failing test**

```typescript
it('list_fonts exposes every font render_map accepts, with its typographic metadata', async () => {
  const { fonts } = textJson(await tools().list_fonts());
  expect(fonts).toHaveLength(6);
  expect(fonts[0]).toMatchObject({ key: 'Space Grotesk' });
  expect(typeof fonts[0].stack).toBe('string');
  expect(typeof fonts[0].uppercaseTitle).toBe('boolean');
  // Danh sách này PHẢI khớp enum mà render_map nhận — lệch là agent đọc được
  // tên phông rồi bị từ chối khi dùng.
  for (const f of fonts) {
    await expect(resolveConfig({ location: { lng: 105.85, lat: 21.02 }, font: f.key })).resolves.toBeTruthy();
  }
});
```

- [ ] **Step 3.2-3.5:** implement (`import { FONTS } from '../../src/data/fonts'`, trả nguyên `FONTS`), đăng ký tool, chạy, commit. Gộp commit với Task 4 nếu muốn.

### Task 4: `output.quality` — biến 422 quá cỡ thành thứ retry được

Hôm nay bị từ chối quá cỡ là ngõ cụt: agent không có nút nào để thử lại nhỏ hơn ngoài hạ fps/kích thước (đổi luôn nội dung).

**Files:** Modify `mcp-server/src/encodeAnimation.ts`, `mcp-server/src/deps.ts`, `mcp-server/src/tools.ts`, `mcp-server/src/http.ts`, `mcp-server/src/jobRunner.ts` · Test `mcp-server/src/encodeAnimation.test.ts`

**Interfaces:**
- Produces: `EncodeOpts.quality?: 'draft' | 'standard' | 'high'` → crf `28|20|16` + preset `veryfast|medium|slow`. Mặc định `standard` (crf 20 = giá trị hiện tại, nên **không đổi hành vi** khi không khai).
- Nhánh GIF bỏ qua crf → phải nêu rõ trong mô tả tool là mp4-only, không im lặng.

- [ ] **Step 4.1: Failing test**

```typescript
describe('encodeArgs quality', () => {
  const base = { fps: 18, format: 'mp4' as const, outPath: '/tmp/x.mp4' };

  it('defaults to the crf the encoder used before this knob existed', () => {
    expect(encodeArgs('f%04d.png', base)).toContain('20');
    expect(encodeArgs('f%04d.png', { ...base, quality: 'standard' })).toEqual(encodeArgs('f%04d.png', base));
  });

  it('maps each quality to a distinct crf and preset', () => {
    const crfOf = (q?: 'draft'|'standard'|'high') => {
      const a = encodeArgs('f%04d.png', { ...base, quality: q });
      return a[a.indexOf('-crf') + 1];
    };
    expect(crfOf('draft')).toBe('28');
    expect(crfOf('standard')).toBe('20');
    expect(crfOf('high')).toBe('16');
    expect(encodeArgs('f%04d.png', { ...base, quality: 'draft' })).toContain('veryfast');
  });

  it('leaves GIF args untouched — crf has no meaning there', () => {
    const gif = { fps: 12, format: 'gif' as const, outPath: '/tmp/x.gif' };
    expect(encodeArgs('f%04d.png', { ...gif, quality: 'high' })).toEqual(encodeArgs('f%04d.png', gif));
  });
});
```

- [ ] **Step 4.2-4.5:** implement bảng `QUALITY = { draft: {crf:'28', preset:'veryfast'}, … }`, nối `quality` qua `ToolDeps.encodeAnimation` signature và **cả ba** call site (tools.ts render_clip, tools.ts render_animation, http.ts, jobRunner.ts), chạy, commit.

### Task 5: `cost` metadata

**Files:** Modify `mcp-server/src/tools.ts`, `mcp-server/src/http.ts`, `mcp-server/src/jobRunner.ts` · Test `mcp-server/src/tools.test.ts`

**Interfaces:** mọi response clip/animation mang `cost: { frames, renderMs, encodeMs, bytes }`. Số liệu đã nằm sẵn ở call site — chỉ cần đo và đính.

- [ ] **Step 5.1: Failing test**

```typescript
it('reports what the call actually cost, in named units', async () => {
  const j = textJson(await clipTools().render_clip({
    location: { lng: 105.85, lat: 21.02, zoom: 14 },
    highlight: { points: [{ lng: 105.85, lat: 21.02 }] },
    motion: { preset: 'pushIn' },
  }));
  expect(j.cost.frames).toBe(j.clip.frames ?? j.motion.script.camera && expect.any(Number));
  expect(typeof j.cost.renderMs).toBe('number');
  expect(typeof j.cost.encodeMs).toBe('number');
  expect(j.cost.bytes).toBe(j.clip.bytes);
  expect(j.cost).not.toHaveProperty('time');  // tên phải mang đơn vị
  expect(j.cost).not.toHaveProperty('size');
});
```

- [ ] **Step 5.2-5.5:** đo bằng `Date.now()` quanh `deps.renderClip` và `deps.encodeAnimation`, chạy, commit.

### Task 6: Bất biến + verify + README + hợp đồng nghiệm thu

- [ ] **Step 6.1:** `_acceptance/motion-tools-cost/scripts/motion-tools-invariants.ts` — I1 t3_path không đụng; I2 `compile_motion` KHÔNG tham chiếu `acquireClipSlot` lẫn `renderClip` (đây là bất biến "rẻ" của nó, và grep là cách duy nhất chứng minh); I3 `quality` được nối ở **cả ba** call site encode. Chứng minh script fail được.
- [ ] **Step 6.2:** `npm run verify` + `npm run test:mcp`.
- [ ] **Step 6.3:** README — năm mục, nêu rõ `compile_motion` không tốn render và `quality` là mp4-only.
- [ ] **Step 6.4:** hợp đồng + evals + verify context sạch + Cổng 2.

---

## Self-Review

1. **Spec coverage:** spec §5 PR #3 liệt kê đúng năm mục — Task 1-5 phủ 1-1 ✓.
2. **Placeholder scan:** Task 3/4/5 gộp bước implement vào một dòng vì code đã cho đủ ở khối Interfaces + test; không mục nào để "TBD" ✓.
3. **Type consistency:** `EncodeOpts.quality` (Task 4) dùng lại ở Task 5 call site; `camera.focus` (Task 2) thêm `kind:'route'` để dùng được với `routes` của PR #2 ✓.
4. **Rủi ro đã biết:** Task 5's test dòng `expect(j.cost.frames).toBe(...)` viết vụng — phải sửa thành so với `j.motion.script` cụ thể lúc implement.
