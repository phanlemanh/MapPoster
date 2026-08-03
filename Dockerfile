# MapPoster HTTP (REST /render + MCP) cho Render.com.
#
# Vì sao image Playwright chứ không phải node:alpine + apt-get chromium:
# renderFrame lái CHÍNH Chromium của Playwright (`browserPool.ts:88`
# `chromium.launch()`) với `--use-angle=swiftshader` để có WebGL BẰNG PHẦN MỀM
# (maplibre-gl vẽ bản đồ trên canvas WebGL — không có GPU trên Render). Image
# chính hãng đã mang đủ shared-lib cho Chromium + swiftshader; tự cài lẻ là
# đường dài dò thiếu .so.
#
# Tag GHIM ĐÚNG version trong package-lock (1.61.1): Playwright kiểm bản browser
# khớp bản library, lệch tag = "Executable doesn't exist" lúc launch.
FROM mcr.microsoft.com/playwright:v1.61.1-noble

WORKDIR /app

# ffmpeg cho /render-clip + render_clip (mcp-server/src/encodeAnimation.ts).
# Playwright's own image bundles an ffmpeg it uses internally for video
# capture, but NOT on PATH under the name "ffmpeg" — `ffmpegBin()` defaults to
# bare "ffmpeg" and MAPPOSTER_FFMPEG is unset in render.yaml, so without this
# every clip encode would silently fail and degrade to settle-only (still
# `HTTP 200 {ok:true, ...}` — see the startup probe in http.ts/stdio.ts for
# the loud-at-boot half of this fix). apt-get update + install + rm lists in
# ONE layer so the package index isn't left behind bloating the image.
RUN apt-get update && apt-get install -y --no-install-recommends ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# Lớp cache riêng cho dep (chỉ vỡ khi lockfile đổi).
COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# `dist/render.html` = khung mà headless browser mở để chụp bản đồ
# (`ensureDist.ts:19`). Build SẴN lúc dựng image: nếu để runtime, request đầu
# tiên phải chờ `vite build` (~10s) và mọi restart trả lại cái chờ đó.
# Chạy `npx vite build` chứ KHÔNG `npm run build` — script build của repo còn
# kèm `vitest run`, test không thuộc việc dựng image.
# `--mode production` + `NODE_ENV=production` ghim rõ ràng (Finding H): đo
# được trên bản Vite cài ở đây (8.1.4), một NODE_ENV kế thừa (vd "test") THẮNG
# `--mode` khi tính import.meta.env.DEV/PROD — và main.tsx dùng đúng cờ DEV đó
# để cắt hẳn một hook chỉ-dành-cho-test khỏi bundle production. Image build
# không có NODE_ENV lạ kế thừa, nhưng ghim cả hai cho chắc thay vì dựa vào đó.
ENV NODE_ENV=production
RUN npx vite build --mode production

# Server mặc định bind 127.0.0.1 và fail-closed theo Host header (http.ts:124,
# :131). Trên Render bắt buộc bind 0.0.0.0; danh sách Host được phép khai ở
# render.yaml (MAPPOSTER_HTTP_ALLOWED_HOSTS) — thiếu nó thì MỌI request → 403.
# (NODE_ENV=production đã ghim ở trên, trước bước build — không lặp lại ở đây.)
ENV MAPPOSTER_HTTP_HOST=0.0.0.0

# tsx (devDependency, đã có sau npm ci) — chạy TS trực tiếp, cùng đường
# `npm run mcp:http` của repo, không thêm bước compile riêng cho server.
CMD ["npx", "tsx", "mcp-server/src/http.ts"]
