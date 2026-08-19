#!/usr/bin/env node
// Cầu nối Lái-thử Người-lạ — biến thể MẶT AGENT (docs/lai-thu-nguoi-la.md §3).
// Nói chuyện với một MCP server stdio bằng JSON-RPC thô, để phiên người-lạ chỉ
// thấy đúng thứ một agent thật thấy: mô tả tool + phản hồi. Không đọc source.
//
//   node mcp-drive.mjs --cwd <repo> --server "<lệnh chạy server stdio>" list
//   node mcp-drive.mjs --cwd <repo> --server "<lệnh>" call <tool> '<json args>'
//
// Ví dụ (floorplanstudio):
//   node mcp-drive.mjs --cwd ~/dev/floorplanstudio \
//     --server "npx tsx mcp-server/src/stdio.ts" list
//
// In JSON phản hồi ra stdout; thời gian chờ in ra stderr (dữ liệu cho nhật ký
// vấp). Lưu ý vận hành: người điều phối cấp cho phiên người-lạ NGUYÊN VĂN lệnh
// đã điền sẵn --cwd/--server — đường dẫn kho nằm trong lệnh, không nằm trong
// đề bài, nên người-lạ không có gì để đi lục.

import { spawn } from 'node:child_process'

const argv = process.argv.slice(2)
function takeFlag(name) {
  const i = argv.indexOf(name)
  if (i < 0) return undefined
  const v = argv[i + 1]
  argv.splice(i, 2)
  return v
}

const cwd = takeFlag('--cwd')
const serverCmd = takeFlag('--server')
const [mode, toolName, argsJson] = argv

if (!cwd || !serverCmd || !mode) {
  console.error('dùng: node mcp-drive.mjs --cwd <repo> --server "<lệnh>" list | call <tool> <jsonArgs>')
  process.exit(2)
}

const child = spawn(serverCmd, { cwd, shell: true, stdio: ['pipe', 'pipe', 'pipe'] })

let buf = ''
const pending = new Map()
let nextId = 1

child.stdout.on('data', (chunk) => {
  buf += chunk.toString()
  let idx
  while ((idx = buf.indexOf('\n')) >= 0) {
    const line = buf.slice(0, idx).trim()
    buf = buf.slice(idx + 1)
    if (!line) continue
    let msg
    try { msg = JSON.parse(line) } catch { continue }
    if (msg.id !== undefined && pending.has(msg.id)) {
      pending.get(msg.id)(msg)
      pending.delete(msg.id)
    }
  }
})

const stderrChunks = []
child.stderr.on('data', (c) => stderrChunks.push(c.toString()))

// SAI LỆCH ĐÃ KHAI (ván #3): bản gốc trong kit chốt cứng 120s. Ván này phải sinh
// VIDEO, mà ván #2 đã đo route-journey vượt 120s (KC-7). Trần chờ lấy từ env,
// mặc định 600s. Chỉ nới thời gian chờ của cầu nối, không đụng sản phẩm.
const TIMEOUT_MS = Number(process.env.MCP_DRIVE_TIMEOUT_MS || 600_000)

function send(method, params) {
  const id = nextId++
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`TIMEOUT sau ${TIMEOUT_MS}ms ở ${method}`)), TIMEOUT_MS)
    pending.set(id, (msg) => { clearTimeout(timer); resolve(msg) })
    child.stdin.write(JSON.stringify({ jsonrpc: '2.0', id, method, params }) + '\n')
  })
}

function notify(method, params) {
  child.stdin.write(JSON.stringify({ jsonrpc: '2.0', method, params }) + '\n')
}

const t0 = Date.now()
try {
  await send('initialize', {
    protocolVersion: '2024-11-05',
    capabilities: {},
    clientInfo: { name: 'stranger-drive', version: '1' },
  })
  notify('notifications/initialized', {})

  let res
  if (mode === 'list') {
    res = await send('tools/list', {})
  } else if (mode === 'call') {
    res = await send('tools/call', {
      name: toolName,
      arguments: argsJson ? JSON.parse(argsJson) : {},
    })
  } else {
    console.error(`mode không hiểu: ${mode} (chỉ có list | call)`)
    process.exit(2)
  }

  const elapsed = Date.now() - t0
  console.log(JSON.stringify(res.result ?? res.error, null, 2))
  console.error(`\n[cầu nối] mất ${elapsed}ms`)
  process.exit(0)
} catch (err) {
  console.error(`[cầu nối] LỖI: ${err.message}`)
  if (stderrChunks.length) console.error(stderrChunks.join('').slice(-2000))
  process.exit(1)
}
