#!/usr/bin/env node
/* vlm-assert.mjs — seam `executors.ui.vlm_assert`, đường OpenRouter.
 *
 * Ý kiến thứ hai KHÁC HỌ trên một khung hình đã lưu: một họ mô hình khác đọc
 * lại ảnh và trả lời ĐÚNG MỘT câu hỏi ĐÓNG dạng YES/NO. Đây là KHẲNG ĐỊNH,
 * không phải giám khảo — câu mở ("trông có đẹp không?") thuộc về design-pass.
 * Người chấm cùng họ chia chung thiên lệch "trông xong rồi"; một họ thứ hai
 * cắt sai-số-tương-quan đúng ở lớp bằng chứng mà ảo giác hoàn-thành hay sống:
 * ảnh chụp.
 *
 * Dùng:  node vlm-assert.mjs <ảnh> "<câu hỏi đóng YES/NO>"
 * Thoát: 0 = YES · 1 = NO · 2 = KHÔNG CHẠY ĐƯỢC (thiếu tham số/ảnh/khoá/API/
 *        trả lời không phải YES-NO) — 2 ánh xạ sang cannotRun/BLOCKED, KHÔNG
 *        BAO GIỜ xanh giả.
 * Env:   OPENROUTER_API_KEY (bắt buộc)
 *        VLM_MODEL (mặc định google/gemini-3.7-flash — slug lấy từ chính
 *        https://openrouter.ai/api/v1/models, không gõ tay)
 * Node >= 18 (fetch có sẵn). Không phụ thuộc npm.
 */
import { readFileSync } from 'node:fs';
import { extname } from 'node:path';

const [image, question] = process.argv.slice(2);
if (!image || !question) {
  console.error('dùng: vlm-assert <ảnh> "<câu hỏi đóng YES/NO>"');
  process.exit(2);
}

let b64;
try {
  b64 = readFileSync(image).toString('base64');
} catch (e) {
  console.error(`vlm-assert: không đọc được ảnh ${image}: ${e.message}`);
  process.exit(2);
}

const key = process.env.OPENROUTER_API_KEY;
if (!key) {
  console.error('vlm-assert: chưa đặt OPENROUTER_API_KEY');
  process.exit(2);
}

const MIME = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.gif': 'image/gif' }[extname(image).toLowerCase()] || 'image/png';
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
          { type: 'image_url', image_url: { url: `data:${MIME};base64,${b64}` } },
          { type: 'text', text: `Answer with exactly one word, YES or NO. ${question}` },
        ],
      }],
    }),
  });
} catch (e) {
  console.error(`vlm-assert: lỗi mạng: ${e.message}`);
  process.exit(2);
}
// Đọc body cũng có thể ném (phản hồi cụt/rác) — đó vẫn là "không chạy được"
// (thoát 2), không bao giờ là NO: rejection không bắt sẽ thoát 1.
if (!res.ok) {
  let body = '';
  try { body = (await res.text()).slice(0, 300); } catch { /* riêng status là đủ */ }
  console.error(`vlm-assert: API ${res.status}: ${body}`);
  process.exit(2);
}
let data;
try {
  data = await res.json();
} catch (e) {
  console.error(`vlm-assert: phản hồi API không đọc được: ${e.message}`);
  process.exit(2);
}
const text = String(data?.choices?.[0]?.message?.content ?? '').trim().toUpperCase();
const word = (text.match(/\b(YES|NO)\b/) || [])[1];
if (!word) {
  console.error(`vlm-assert: trả lời không phải YES/NO: "${text.slice(0, 120)}"`);
  process.exit(2);
}
console.log(`${word} — ${question}  [${MODEL}]`);
process.exit(word === 'YES' ? 0 : 1);
