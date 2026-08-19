#!/usr/bin/env node
/* tham-do-duong-video.mjs — thăm dò TRANSPORT, không đo sản phẩm.
 *
 * Câu hỏi: OpenRouter `/chat/completions` có nhận VIDEO làm input cho
 * google/gemini-3.7-flash không, dưới HÌNH DẠNG nào, và có THẬT SỰ ĐỌC video
 * hay chỉ trả lời trơn?
 *
 * Vì sao không đủ khi chỉ thấy HTTP 200 + "YES": nếu phần video bị bỏ lặng, model
 * vẫn có thể đoán "YES" cho câu "có chuyển động không?" và ta không phân biệt được.
 * Nên phép thăm dò này có SỨC PHÂN BIỆT:
 *   - clip ĐỘNG  (testsrc chạy)      → câu trả lời đúng là YES
 *   - clip ĐỨNG YÊN (1 khung lặp lại) → câu trả lời đúng là NO
 * Hình dạng nào trả YES cho clip động VÀ NO cho clip đứng yên thì mới coi là
 * đường dùng được. Kèm `usage.prompt_tokens` của cả hai để đối chiếu với một lời
 * gọi CHỈ-CHỮ: video có được nạp hay không lộ ra ở số token, không phải ở lời hứa.
 *
 * Dùng:  node tham-do-duong-video.mjs <video-động.mp4> <video-đứng-yên.mp4>
 * Env:   OPENROUTER_API_KEY (bắt buộc) · VLM_MODEL (mặc định google/gemini-3.7-flash)
 * KHÔNG in giá trị khoá ra bất kỳ đâu.
 */
import { readFileSync } from 'node:fs';

const [moving, still] = process.argv.slice(2);
if (!moving || !still) { console.error('dùng: tham-do-duong-video.mjs <động.mp4> <đứng-yên.mp4>'); process.exit(2); }

const key = process.env.OPENROUTER_API_KEY;
if (!key) { console.error('chưa đặt OPENROUTER_API_KEY'); process.exit(2); }

const MODEL = process.env.VLM_MODEL || 'google/gemini-3.7-flash';
const PROMPT = 'Answer with exactly one word, YES or NO. Watch the whole video. Does the picture change over time — that is, is there any visible motion or change between the first frame and the last frame?';

const uri = (f) => `data:video/mp4;base64,${readFileSync(f).toString('base64')}`;

const shapes = (u) => [
  ['video_url', { type: 'video_url', video_url: { url: u } }],
  ['image_url-mime-video', { type: 'image_url', image_url: { url: u } }],
  ['file-file_data', { type: 'file', file: { filename: 'clip.mp4', file_data: u } }],
];

async function ask(parts) {
  const t0 = Date.now();
  try {
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify({ model: MODEL, temperature: 0, messages: [{ role: 'user', content: parts }] }),
    });
    const body = await res.text();
    const ms = Date.now() - t0;
    if (!res.ok) return { status: res.status, ms, answer: '', tokens: null, err: body.slice(0, 200) };
    const j = JSON.parse(body);
    return {
      status: res.status, ms,
      answer: String(j?.choices?.[0]?.message?.content ?? '').trim(),
      tokens: j?.usage?.prompt_tokens ?? null,
      err: '',
    };
  } catch (e) {
    return { status: 'n/a', ms: Date.now() - t0, answer: '', tokens: null, err: `LỖI MẠNG: ${e.message}` };
  }
}

const uMoving = uri(moving);
const uStill = uri(still);

console.log(`# Thăm dò đường video — model \`${MODEL}\`\n`);
console.log(`- Clip ĐỘNG: \`${moving}\` — câu trả lời đúng là **YES**`);
console.log(`- Clip ĐỨNG YÊN: \`${still}\` — câu trả lời đúng là **NO**`);

const baseline = await ask([{ type: 'text', text: PROMPT }]);
console.log(`\n## Mốc nền — CHỈ CHỮ, không đính video\n`);
console.log(`- HTTP ${baseline.status} · ${baseline.ms} ms · \`prompt_tokens\` = **${baseline.tokens}** · trả: \`${baseline.answer.slice(0, 80)}\``);
console.log(`\nMọi lời gọi dưới đây dùng CÙNG câu hỏi này. Chênh lệch \`prompt_tokens\` so với ${baseline.tokens} là phần token của video.`);

console.log(`\n## Bảng kết quả\n`);
console.log('| Hình dạng | clip ĐỘNG (đúng: YES) | prompt_tokens | clip ĐỨNG YÊN (đúng: NO) | prompt_tokens | Kết luận |');
console.log('|---|---|---|---|---|---|');

for (const i of [0, 1, 2]) {
  const name = shapes(uMoving)[i][0];
  const a = await ask([shapes(uMoving)[i][1], { type: 'text', text: PROMPT }]);
  const b = await ask([shapes(uStill)[i][1], { type: 'text', text: PROMPT }]);
  const A = a.answer.toUpperCase().match(/\b(YES|NO)\b/)?.[1] ?? `LỖI(${a.status}) ${a.err}`;
  const B = b.answer.toUpperCase().match(/\b(YES|NO)\b/)?.[1] ?? `LỖI(${b.status}) ${b.err}`;
  const verdict = A === 'YES' && B === 'NO' ? '**PHÂN BIỆT ĐƯỢC — dùng được**'
    : A === 'YES' && B === 'YES' ? 'không phân biệt được (YES cả hai)'
    : `bất thường (${A}/${B})`;
  console.log(`| \`${name}\` | ${A} | ${a.tokens} | ${B} | ${b.tokens} | ${verdict} |`);
}
