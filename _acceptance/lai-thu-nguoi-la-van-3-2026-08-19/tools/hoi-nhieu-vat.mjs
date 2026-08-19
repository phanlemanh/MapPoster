#!/usr/bin/env node
/* hoi-nhieu-vat.mjs — hỏi MỘT câu ĐÓNG về NHIỀU vật cùng lúc (video và/hoặc ảnh).
 *
 * Vì sao cần bên cạnh `vlm-video-assert.mjs`: hai câu của làn video hỏi về QUAN
 * HỆ giữa hai vật, không phải về một vật —
 *   (d) khung cuối clip có khớp `settle.png` đi kèm không?
 *   (f) clip walk và clip car cùng cặp điểm có cho tuyến KHÁC NHAU không?
 * Nhét hai vật vào cùng một prompt là cách duy nhất hỏi thẳng quan hệ đó thay vì
 * hỏi rời rồi tự suy ra — suy ra là chỗ ảo giác hay chen vào.
 *
 * Thứ tự vật giữ nguyên thứ tự dòng lệnh, và mỗi vật được gắn nhãn "Item 1/2…"
 * bằng một phần text đứng TRƯỚC nó, để câu hỏi tham chiếu được vật nào là vật nào.
 *
 * Dùng:  node hoi-nhieu-vat.mjs "<câu hỏi đóng YES/NO>" <vật1> <vật2> …
 * Thoát: 0 = YES · 1 = NO · 2 = KHÔNG CHẠY ĐƯỢC.
 * Env:   OPENROUTER_API_KEY (bắt buộc) · VLM_MODEL (mặc định google/gemini-3.7-flash)
 * KHÔNG in giá trị khoá ra bất kỳ đâu.
 */
import { readFileSync, statSync } from 'node:fs';
import { extname, basename } from 'node:path';

const [question, ...files] = process.argv.slice(2);
if (!question || files.length === 0) {
  console.error('dùng: hoi-nhieu-vat "<câu hỏi>" <vật1> [vật2 …]');
  process.exit(2);
}

const key = process.env.OPENROUTER_API_KEY;
if (!key) { console.error('hoi-nhieu-vat: chưa đặt OPENROUTER_API_KEY'); process.exit(2); }
const MODEL = process.env.VLM_MODEL || 'google/gemini-3.7-flash';

const IMG = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp' };
const VID = { '.mp4': 'video/mp4', '.webm': 'video/webm', '.mov': 'video/quicktime' };

const parts = [];
const ghi = [];
for (let i = 0; i < files.length; i++) {
  const f = files[i];
  const ext = extname(f).toLowerCase();
  let b64, bytes;
  try { bytes = statSync(f).size; b64 = readFileSync(f).toString('base64'); }
  catch (e) { console.error(`hoi-nhieu-vat: không đọc được ${f}: ${e.message}`); process.exit(2); }

  parts.push({ type: 'text', text: `Item ${i + 1}:` });
  if (IMG[ext]) {
    parts.push({ type: 'image_url', image_url: { url: `data:${IMG[ext]};base64,${b64}` } });
    ghi.push(`Item ${i + 1} = ẢNH ${basename(f)} (${bytes} byte)`);
  } else if (VID[ext]) {
    parts.push({ type: 'video_url', video_url: { url: `data:${VID[ext]};base64,${b64}` } });
    ghi.push(`Item ${i + 1} = VIDEO ${basename(f)} (${bytes} byte)`);
  } else {
    console.error(`hoi-nhieu-vat: đuôi không hỗ trợ: ${ext}`);
    process.exit(2);
  }
}
parts.push({ type: 'text', text: `Answer with exactly one word, YES or NO. ${question}` });

let res;
try {
  res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({ model: MODEL, temperature: 0, messages: [{ role: 'user', content: parts }] }),
  });
} catch (e) { console.error(`hoi-nhieu-vat: lỗi mạng: ${e.message}`); process.exit(2); }

if (!res.ok) {
  let body = '';
  try { body = (await res.text()).slice(0, 300); } catch { /* status đủ */ }
  console.error(`hoi-nhieu-vat: API ${res.status}: ${body}`);
  process.exit(2);
}

let data;
try { data = await res.json(); } catch (e) {
  console.error(`hoi-nhieu-vat: phản hồi không đọc được: ${e.message}`); process.exit(2);
}
const text = String(data?.choices?.[0]?.message?.content ?? '').trim().toUpperCase();
const word = (text.match(/\b(YES|NO)\b/) || [])[1];
if (!word) {
  console.error(`hoi-nhieu-vat: trả lời không phải YES/NO: "${text.slice(0, 120)}"`);
  process.exit(2);
}
console.log(`${word} — ${question}  [${MODEL} · ${ghi.join(' · ')} · prompt_tokens=${data?.usage?.prompt_tokens ?? '?'}]`);
process.exit(word === 'YES' ? 0 : 1);
