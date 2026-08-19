#!/usr/bin/env node
/* vlm-video-assert.mjs — anh em của `vlm-assert.mjs`, nhưng đầu vào là VIDEO.
 *
 * Vì sao tồn tại: ván #1 và #2 chỉ chấm được ảnh tĩnh (khung settle), nên mọi
 * câu hỏi về CHUYỂN ĐỘNG — camera có đi đúng preset không, có khung đóng băng
 * không, chữ có đọc được trong lúc động không — chưa ai trả lời được bằng bằng
 * chứng. Endpoint `/models` khai google/gemini-3.7-flash nhận `video`, và
 * `tools/tham-do-duong-video.mjs` đã chứng minh bằng lời gọi thật rằng model
 * PHÂN BIỆT được clip động với clip đứng yên (chứ không đoán mò): xem
 * `cmds/tham-do-duong-video.md`.
 *
 * Gửi THẲNG mp4 dưới dạng data-URI `video_url` — không tách khung, không nội suy.
 *
 * Dùng:  node vlm-video-assert.mjs <video.mp4> "<câu hỏi đóng YES/NO>"
 * Thoát: 0 = YES · 1 = NO · 2 = KHÔNG CHẠY ĐƯỢC — 2 KHÔNG BAO GIỜ là xanh giả.
 * Env:   OPENROUTER_API_KEY (bắt buộc) · VLM_MODEL (mặc định google/gemini-3.7-flash)
 * KHÔNG in giá trị khoá ra bất kỳ đâu.
 */
import { readFileSync, statSync } from 'node:fs';

const [video, question] = process.argv.slice(2);
if (!video || !question) {
  console.error('dùng: vlm-video-assert <video.mp4> "<câu hỏi đóng YES/NO>"');
  process.exit(2);
}

const key = process.env.OPENROUTER_API_KEY;
if (!key) { console.error('vlm-video-assert: chưa đặt OPENROUTER_API_KEY'); process.exit(2); }

let b64, bytes;
try {
  bytes = statSync(video).size;
  b64 = readFileSync(video).toString('base64');
} catch (e) {
  console.error(`vlm-video-assert: không đọc được ${video}: ${e.message}`);
  process.exit(2);
}

const MODEL = process.env.VLM_MODEL || 'google/gemini-3.7-flash';

let res;
try {
  res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: MODEL,
      temperature: 0,
      messages: [{
        role: 'user',
        content: [
          { type: 'video_url', video_url: { url: `data:video/mp4;base64,${b64}` } },
          { type: 'text', text: `Answer with exactly one word, YES or NO. ${question}` },
        ],
      }],
    }),
  });
} catch (e) {
  console.error(`vlm-video-assert: lỗi mạng: ${e.message}`);
  process.exit(2);
}

if (!res.ok) {
  let body = '';
  try { body = (await res.text()).slice(0, 300); } catch { /* status là đủ */ }
  console.error(`vlm-video-assert: API ${res.status}: ${body}`);
  process.exit(2);
}

let data;
try { data = await res.json(); } catch (e) {
  console.error(`vlm-video-assert: phản hồi không đọc được: ${e.message}`);
  process.exit(2);
}

const text = String(data?.choices?.[0]?.message?.content ?? '').trim().toUpperCase();
const word = (text.match(/\b(YES|NO)\b/) || [])[1];
const tok = data?.usage?.prompt_tokens ?? '?';
if (!word) {
  console.error(`vlm-video-assert: trả lời không phải YES/NO: "${text.slice(0, 120)}"`);
  process.exit(2);
}
// prompt_tokens in kèm để người đọc kiểm được video CÓ vào prompt (chỉ-chữ ≈ 41).
console.log(`${word} — ${question}  [${MODEL} · ${bytes} byte · prompt_tokens=${tok}]`);
process.exit(word === 'YES' ? 0 : 1);
