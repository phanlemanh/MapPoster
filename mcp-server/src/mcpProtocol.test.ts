import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import path from 'node:path';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { RECIPES } from './recipes';

/**
 * Lane giao thức: dựng server MCP THẬT rồi gọi qua đúng `tools/list` và
 * `tools/call`, thay vì gọi `makeTools()` trực tiếp như mọi test khác.
 *
 * Vì sao lane này tồn tại — ba lỗi thật đã đi qua chỗ mù này trong một phiên:
 *
 *   1. `render_recipe` KHAI với MCP chỉ `{recipe, delivery}`. SDK dựng
 *      `z.object(inputSchema)` và Zod loại bỏ khoá không khai, nên
 *      `region`/`subjects`/`pois` không bao giờ tới handler. Tool hỏng HOÀN
 *      TOÀN ở bề mặt duy nhất nó phục vụ, mà 567 test vẫn xanh.
 *   2. README + hợp đồng khẳng định "khoá gõ sai bị từ chối" — qua MCP câu đó
 *      chỉ đúng cho khoá CÓ trong hình dạng khai.
 *   3. Một eval viết ra để canh (1) lại đỏ vì lý do khác với tên của nó.
 *
 * Cả ba lọt qua review, CI xanh và merge. Chúng lộ ra vì có người gọi thử qua
 * MCP, không phải vì bộ đo bắt được. Lane này là bộ đo đó.
 *
 * CỐ Ý KHÔNG RENDER. Cả ba lỗi nằm ở biên tham số; một lượt render thêm ~30s
 * và một phụ thuộc mạng (Nominatim, tile) vào lane mà giá trị nằm ở chỗ khác.
 * Ca sâu nhất dưới đây đi tới tận `resolveConfig` mà vẫn không chạm mạng —
 * `assertTheme` chạy TRƯỚC lượt geocode đầu tiên, nên một theme không tồn tại
 * chứng minh được cả chuỗi MCP → handler → compile → resolveConfig.
 *
 * Gated như các lane tích hợp khác:
 *   MCP_INTEGRATION=1 npx vitest run mcp-server/src/mcpProtocol.test.ts
 */
const RUN = process.env.MCP_INTEGRATION === '1';
const suite = RUN ? describe : describe.skip;

const repoRoot = path.resolve(__dirname, '..', '..');
// Trần 60s mặc định của SDK đủ cho mọi ca ở đây (không ca nào render), nhưng
// lần khởi động đầu có thể phải build dist/. Nới ra để một lần build chậm
// không biến thành một lane đỏ khó đọc.
const CALL_OPTS = { timeout: 300_000 };

let client: Client;

async function callRecipe(args: Record<string, unknown>): Promise<{ ok: boolean; error?: string }> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const res: any = await client.callTool({ name: 'render_recipe', arguments: args }, undefined, CALL_OPTS);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const text = (res.content as any[]).find((c) => c.type === 'text')?.text ?? '{}';
  const body = JSON.parse(text);
  return { ok: body.ok !== false, error: body.error };
}

suite('MCP protocol — the layer every other test bypasses', () => {
  beforeAll(async () => {
    const transport = new StdioClientTransport({
      command: process.execPath,
      args: ['--import', 'tsx', 'mcp-server/src/stdio.ts'],
      cwd: repoRoot,
      env: { ...process.env, MAPPOSTER_APP_PORT: '0', MAPPOSTER_POOL: '1' } as Record<string, string>,
    });
    client = new Client({ name: 'protocol-lane', version: '0' }, { capabilities: {} });
    await client.connect(transport);
  }, 300_000);

  afterAll(async () => {
    await client?.close();
  });

  it('tools/list declares every parameter every recipe accepts', async () => {
    const { tools } = await client.listTools();
    const rr = tools.find((t) => t.name === 'render_recipe');
    expect(rr, 'render_recipe không được đăng ký').toBeDefined();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const declared = new Set(Object.keys((rr!.inputSchema as any).properties ?? {}));
    for (const [name, spec] of Object.entries(RECIPES)) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      for (const key of Object.keys((spec.schema as any).shape)) {
        expect(
          declared.has(key),
          `render_recipe không KHAI '${key}' với MCP, nên tham số này của '${name}' sẽ bị Zod loại bỏ trước khi tới handler — đây chính là lỗi đã làm tool hỏng hoàn toàn`,
        ).toBe(true);
      }
    }
  });

  it('a scalar parameter actually reaches the handler', async () => {
    // Lỗi trả về CHỈ có thể phát ra từ schema của recipe trong handler. Nếu
    // tham số bị nuốt ở biên, thông điệp sẽ là "region: Required".
    const r = await callRecipe({ recipe: 'region-spotlight', region: '' });
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/region/);
    expect(r.error, 'thông điệp "Required" nghĩa là tham số KHÔNG tới được handler').not.toMatch(/received undefined/);
  });

  it('an array parameter actually reaches the handler', async () => {
    const r = await callRecipe({ recipe: 'compare-locations', subjects: ['A'], reference: 'B' });
    expect(r.ok).toBe(false);
    // "Too small" chỉ phát ra khi mảng ĐÃ tới nơi và được đếm.
    expect(r.error).toMatch(/subjects.*>=\s*2/);
  });

  it('a call reaches resolveConfig — the full chain, without touching the network', async () => {
    // `assertTheme` chạy TRƯỚC lượt geocode đầu tiên, nên ca này chứng minh
    // MCP → handler → compile → resolveConfig mà không tốn một request nào.
    const r = await callRecipe({ recipe: 'region-spotlight', region: 'Hoàn Kiếm, Hà Nội', theme: 'khong-co-that' });
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/Unknown theme: khong-co-that/);
  });

  it('an unknown recipe name is refused, with the known names listed', async () => {
    const r = await callRecipe({ recipe: 'khong-co-that' });
    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/Unknown recipe: khong-co-that/);
    expect(r.error).toMatch(/region-spotlight/);
  });

  // Hai ca dưới khoá GIỚI HẠN của `.strict()` qua MCP đúng như README và hợp
  // đồng (AC-6/AC-6b) mô tả. Chúng ở đây, trên transport thật, chứ không phải
  // ở tầng hàm — vì chính chỗ tài liệu nói sai là chỗ tầng hàm không với tới.
  it('a mistyped key belonging to ANOTHER recipe survives the boundary and IS refused', async () => {
    const r = await callRecipe({ recipe: 'region-spotlight', region: 'Hoàn Kiếm, Hà Nội', pois: ['X'] });
    expect(r.ok).toBe(false);
    // Khẳng định trên CHÍNH tên khoá, không chỉ trên "có lỗi". Bản đầu của ca
    // này chỉ khớp /tham số không hợp lệ/, và negative control cho thấy nó vẫn
    // XANH khi hình dạng khai bị thu về {recipe, delivery} — lúc đó `pois` bị
    // nuốt, `region` cũng bị nuốt, lỗi thành "region: Required", và ca vẫn
    // khớp. Xanh vì lý do sai đúng bằng đỏ vì lý do sai.
    expect(r.error).toMatch(/Unrecognized key.*pois/);
  });

  it('a mistyped key matching NO recipe is stripped by the boundary — documented limit, not a guard', async () => {
    // Không thể từ chối thứ chưa bao giờ nhận. Ca này tồn tại để giới hạn đó
    // được ĐO chứ không chỉ được viết: nếu về sau nó từ chối được, ca này đỏ
    // và buộc cập nhật README + AC-6b cùng lúc.
    const r = await callRecipe({ recipe: 'region-spotlight', region: '', khoaRacKhongThuocRecipeNao: 1 });
    expect(r.ok).toBe(false);
    // Lỗi phải nói về `region` RỖNG — tức `region` ĐÃ tới nơi và bị chính
    // schema recipe bác vì `.min(1)`. Nếu nó nói "received undefined" thì
    // `region` cũng bị nuốt, và ca này không còn chứng minh điều nó khai.
    expect(r.error).toMatch(/region/);
    expect(r.error, 'region cũng bị nuốt ⇒ ca này không đo được điều nó khai').not.toMatch(/received undefined/);
    expect(r.error).not.toMatch(/khoaRacKhongThuocRecipeNao/);
  });
});
