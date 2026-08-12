/**
 * Bộ giải PNG tối thiểu — chỉ đủ để ĐẾM PIXEL trên ảnh do chính bộ render
 * sinh ra (canvas.toDataURL: 8-bit, không interlace, RGBA hoặc RGB).
 *
 * Vì sao cần: `demo-routes.ts` render 5 ảnh rồi ghi ra đĩa mà KHÔNG khẳng định
 * gì về nội dung — xoá hẳn lớp `route-line` khỏi mapStyle vẫn cho 9/9 phép
 * kiểm xanh, nên mệnh đề "tuyến đi hết đường tới pixel" của E16 không có ai
 * canh. So bytes hai ảnh cũng không đủ: ảnh đến từ tile mạng, khác nhau vì lý
 * do khác cũng qua. Đếm pixel ĐÚNG MÀU caller đặt thì phân biệt được.
 */
import zlib from 'node:zlib';

export interface Raster {
  width: number;
  height: number;
  channels: 3 | 4;
  data: Buffer;
}

const PNG_MAGIC = 0x89504e47;

export function decodePng(buf: Buffer): Raster {
  if (buf.length < 8 || buf.readUInt32BE(0) !== PNG_MAGIC) throw new Error('không phải PNG');

  const idat: Buffer[] = [];
  let width = 0;
  let height = 0;
  let depth = 0;
  let colorType = 0;
  let interlace = 0;

  for (let off = 8; off + 8 <= buf.length; ) {
    const len = buf.readUInt32BE(off);
    const type = buf.toString('ascii', off + 4, off + 8);
    const data = buf.subarray(off + 8, off + 8 + len);
    if (type === 'IHDR') {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      depth = data[8];
      colorType = data[9];
      interlace = data[12];
    } else if (type === 'IDAT') {
      idat.push(data);
    } else if (type === 'IEND') {
      break;
    }
    off += 12 + len;
  }

  const channels = colorType === 6 ? 4 : colorType === 2 ? 3 : 0;
  if (!channels || depth !== 8 || interlace !== 0) {
    throw new Error(`PNG ngoài phạm vi bộ giải này (depth=${depth}, colorType=${colorType}, interlace=${interlace})`);
  }

  const raw = zlib.inflateSync(Buffer.concat(idat));
  const stride = width * channels;
  const out = Buffer.alloc(height * stride);

  // Gỡ filter theo PNG §9.2 — mỗi dòng mang một byte filter ở đầu.
  let p = 0;
  for (let y = 0; y < height; y++) {
    const filter = raw[p++];
    const line = raw.subarray(p, p + stride);
    p += stride;
    const cur = out.subarray(y * stride, (y + 1) * stride);
    const prev = y > 0 ? out.subarray((y - 1) * stride, y * stride) : null;
    for (let x = 0; x < stride; x++) {
      const a = x >= channels ? cur[x - channels] : 0;
      const b = prev ? prev[x] : 0;
      const c = prev && x >= channels ? prev[x - channels] : 0;
      let v = line[x];
      if (filter === 1) v += a;
      else if (filter === 2) v += b;
      else if (filter === 3) v += Math.floor((a + b) / 2);
      else if (filter === 4) {
        const pp = a + b - c;
        const pa = Math.abs(pp - a);
        const pb = Math.abs(pp - b);
        const pc = Math.abs(pp - c);
        v += pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
      }
      cur[x] = v & 0xff;
    }
  }

  return { width, height, channels, data: out };
}

/** Số pixel mang ĐÚNG mã màu `#rrggbb` (lõi nét vẽ; viền khử răng cưa không tính). */
export function countExactColor(png: Buffer, hex: string): number {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) throw new Error(`mã màu phải là #rrggbb, nhận '${hex}'`);
  const want = Number.parseInt(m[1], 16);
  const [r, g, b] = [(want >> 16) & 0xff, (want >> 8) & 0xff, want & 0xff];

  const { width, height, channels, data } = decodePng(png);
  let n = 0;
  for (let i = 0; i < width * height; i++) {
    const o = i * channels;
    if (data[o] === r && data[o + 1] === g && data[o + 2] === b) n++;
  }
  return n;
}
