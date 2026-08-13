/**
 * Recipe catalog — công thức tham số hoá, KHÔNG phải khái niệm mới của engine.
 *
 * Ranh giới do spec §2 đặt ra và file này giữ đúng: một recipe là một hàm
 * `compile` nhận dữ liệu thật của dự án rồi trả về **đúng bộ tham số mà
 * `render_clip` đã nhận** — không có track mới, preset mới, hay trường
 * RenderConfig mới nào ra đời ở đây. Hệ quả trực tiếp, và là lý do chọn hình
 * dạng này: mọi bảo đảm của `render_clip` (AC-9 ép `chrome:'clean'`, trần
 * `MAPPOSTER_MAX_CLIP_FRAMES`, khe `MAPPOSTER_CLIP_CONCURRENCY`, nhánh degrade
 * khi encode hỏng, trần `MAPPOSTER_CLIP_MAX_BYTES`, `resolved.anchors`) được
 * **kế thừa**, không phải suy diễn lại. Một recipe tự gọi `deps.renderClip`
 * là một recipe sẽ lặng lẽ trôi khỏi những bảo đảm đó.
 *
 * Khách hàng là AI agent KHÔNG nhìn thấy ảnh. Nên hai luật ở đây:
 *   1. Tên recipe lạ bị TỪ CHỐI, không rơi về mặc định — cùng chính sách
 *      `theme`/`icon`/`format` đã có.
 *   2. Schema tham số là `.strict()`: một khoá gõ sai bị từ chối chứ không bị
 *      lặng lẽ bỏ qua. Với caller không nhìn thấy ảnh, một tham số bị lờ đi là
 *      một sai lệch vô hình — nó trả về clip "thành công" nhưng sai nội dung.
 *
 *      **Nhưng qua MCP thì `.strict()` chỉ bắt được MỘT NỬA, và đây là giới
 *      hạn không vá được ở phía ta.** MCP SDK dựng `z.object(inputSchema)` từ
 *      hình dạng tool KHAI (`RECIPE_TOOL_SHAPE` trong tools.ts) và Zod **loại
 *      bỏ** mọi khoá không có trong đó TRƯỚC khi handler chạy. Nên:
 *        - khoá gõ sai TRÙNG tham số của một recipe khác (`pois` gửi cho
 *          `region-spotlight`) → tới được handler → `.strict()` TỪ CHỐI ✓
 *        - khoá gõ sai KHÔNG trùng recipe nào (`them`, `khoaRac`) → bị SDK
 *          nuốt trước → handler không bao giờ thấy → lời gọi THÀNH CÔNG ✗
 *      Đo trực tiếp qua một server MCP dựng mới: `{recipe:'region-spotlight',
 *      region:'…', khoaRac:1}` render ra clip bình thường. Không thể từ chối
 *      thứ chưa bao giờ nhận — chỉ có thể khai đúng nó ở đây.
 */
import { z } from 'zod';
import type { RenderMapParams } from './resolveConfig';
import { MARKER_ICONS } from '../../src/data/markers';
import type { MarkerIconKey } from '../../src/types';
import type { motionParamSchema } from './motionCompiler';

/** Đúng hình dạng `render_clip` nhận. Recipe không được trả gì khác. */
export type CompiledRecipeCall = RenderMapParams & { motion: z.infer<typeof motionParamSchema> };

export interface RecipeSpec {
  /** Một câu: recipe này dựng cảnh gì. Đi thẳng vào `list_recipes`. */
  description: string;
  /** Mô tả từng tham số cho agent. Khoá phải TRÙNG KHÍT khoá của `schema` —
   *  có eval bất biến canh, vì catalog mô tả sai còn tệ hơn không mô tả. */
  params: Record<string, string>;
  schema: z.ZodTypeAny;
  /** Thời lượng mặc định (giây) — agent cần biết trước để dựng timeline. */
  durationSec: number;
  /** Một lời gọi HỢP LỆ, không phải minh hoạ. Eval bất biến bắt nó phải
   *  compile được — một ví dụ không chạy là tài liệu nói dối. */
  example: Record<string, unknown>;
  compile: (params: never) => CompiledRecipeCall;
}

// Bỏ mọi khoá `undefined` trước khi giao cho render_clip: `{theme: undefined}`
// và `{}` khác nhau ở tầng Zod optional, và truyền khoá rỗng xuống là mời một
// lớp lỗi "có mặt nhưng vô nghĩa" mà tầng dưới phải đoán ý.
function compact<T extends Record<string, unknown>>(o: T): T {
  return Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined)) as T;
}

const hexColor = z.string().regex(/^#(?:[0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i);
// Rút TỪ nguồn duy nhất (src/data/markers.ts) chứ không chép sáu tên vào đây:
// một danh sách chép tay sẽ trôi khỏi engine trong im lặng, đúng lớp lỗi mà
// bất biến 'params mô tả == params schema' ở test đang canh cho catalog.
const markerIcon = z.enum(MARKER_ICONS.map((m) => m.key) as [MarkerIconKey, ...MarkerIconKey[]]);
const lngLat = z.object({ lng: z.number().min(-180).max(180), lat: z.number().min(-90).max(90) }).strict();
/** Tên địa danh (resolve live từ OSM) hoặc toạ độ. Cùng hình dạng `location` của render_clip. */
const placeRef = z.union([z.string().min(1), lngLat]);

/**
 * `location` của render_clip nhận `{lng, lat}`, còn `routes[].route.from/to`
 * nhận TUPLE `[lng, lat]` (`RouteInput` trong resolveConfig.ts:20-21). Hai
 * hình dạng khác nhau cho cùng một khái niệm là chuyện nội bộ của engine —
 * tầng recipe che nó đi thay vì bắt agent nhớ, vì agent chỉ đọc catalog.
 */
function asRouteEnd(v: string | { lng: number; lat: number }): string | [number, number] {
  return typeof v === 'string' ? v : [v.lng, v.lat];
}

/**
 * GIỚI HẠN CỦA MÔ HÌNH RECIPE — đọc trước khi thêm recipe mới.
 *
 * `compile()` là hàm ĐỒNG BỘ, THUẦN, không có deps, và nó chạy **trước**
 * `resolveConfig` (tools.ts: parse → compile → render_clip). Nên nó **không
 * biết toạ độ thật** của bất cứ thứ gì caller đặt bằng tên: toạ độ chỉ tồn tại
 * sau khi geocoder chạy, tức sau khi compile đã trả về.
 *
 * Hệ quả cứng: mọi recipe cần **camera keyframe tuyệt đối** (tour dừng ở từng
 * chặng, "zoom về dự án ở cuối", follow một tuyến) **không authored được ở tầng
 * này**. Chúng chỉ khả thi khi tự tính bbox — mà làm vậy là chép `zoomFromSpan`
 * vào tầng recipe rồi trôi khỏi bản gốc trong im lặng.
 *
 * Vì vậy mọi recipe dưới đây dùng **preset**, không dùng MotionScript thô: preset
 * được compile SAU khi config đã resolve, nên nó có toạ độ thật. Khung hình thì
 * để `resolveConfig` tự auto-frame theo union của highlight — đó là đường duy
 * nhất tầng recipe có để "ôm trọn nhiều đối tượng" mà không đoán toạ độ.
 *
 * **Và đó cũng là LỐI GIẢI khi thật sự cần keyframe tuyệt đối:** đẩy việc
 * authoring xuống tầng preset. `route-journey` cần camera bám đầu tuyến — bất
 * khả ở đây — nên nó gọi preset `follow`, và chính preset đó lấy mẫu hình học
 * tuyến rồi phát ra keyframe. Một recipe muốn tour nhiều chặng hay "zoom về
 * đích ở cuối" thì đi đường này, đừng cố tính bbox trong `compile`.
 *
 * Giới hạn thứ hai, từ `motionScript.ts`: **không được có quá một track one-shot
 * cùng loại** trong một script. Nên mọi nhịp "so le" (pin drop từng POI theo
 * nhịp, highlight lần lượt từng dự án) là bất khả — và các mô tả catalog dưới
 * đây nói đúng thứ recipe làm được, chứ không nói thứ spec mong muốn.
 */

const regionSpotlightSchema = z
  .object({
    region: z.string().min(1),
    theme: z.string().min(1).optional(),
    format: z.string().min(1).optional(),
    color: hexColor.optional(),
    fps: z.number().int().optional(),
    durationSec: z.number().optional(),
  })
  .strict();

type RegionSpotlightParams = z.infer<typeof regionSpotlightSchema>;

export const RECIPES: Record<string, RecipeSpec> = {
  'region-spotlight': {
    description:
      'Bay vào một vùng hành chính, vẽ dần viền ranh giới của nó, làm mờ mọi thứ ngoài vùng, rồi dừng ở trạng thái nghỉ. Vùng được resolve live từ OpenStreetMap theo tên.',
    params: {
      region: 'Tên vùng cần làm nổi bật, ví dụ "Quận 1, TP.HCM". Vừa là nơi camera khung tới, vừa là ranh giới được vẽ.',
      theme: 'Một id trong list_themes. Bỏ trống thì dùng mặc định của engine.',
      format: 'Một tên trong list_formats, ví dụ "tiktok". Mặc định "tiktok".',
      color: 'Màu hex cho vùng, ví dụ "#e8b04b". Bỏ trống thì dùng accent của theme.',
      fps: 'Ghi đè fps của preset approach.',
      durationSec: 'Ghi đè thời lượng của preset approach.',
    },
    schema: regionSpotlightSchema,
    durationSec: 6,
    example: { recipe: 'region-spotlight', region: 'Hoàn Kiếm, Hà Nội', theme: 'midnight-blue', format: 'tiktok' },
    compile: (p: RegionSpotlightParams): CompiledRecipeCall =>
      compact({
        // `location` = chính vùng đó: auto-frame bám bbox của region, và
        // country anchor cho highlight cũng rút ra từ đây — nên vùng cùng tên
        // ở nước khác không thể lặng lẽ kéo cả khung đi (README §Vietnamese).
        location: p.region,
        format: p.format ?? 'tiktok',
        theme: p.theme,
        highlight: compact({
          regions: [p.color ? { name: p.region, color: p.color } : p.region],
          // `dim` KHÔNG phải tham số, có chủ đích: bỏ dim đi thì đây không còn
          // là spotlight mà chỉ là preset `approach` trần — thứ caller gọi
          // thẳng `render_clip` được. Một recipe mà tắt được đặc trưng của
          // chính nó là một recipe không có ranh giới.
          dim: true,
          fill: true,
        }),
        motion: compact({ preset: 'approach' as const, fps: p.fps, durationSec: p.durationSec }),
      }),
  },

  'property-intro': {
    description:
      'Bay từ tầm rộng vào đúng ranh giới một dự án, vẽ dần viền ranh rồi thả ghim lên dự án và dừng. Ranh giới nhận tên vùng OSM hoặc GeoJSON tự cấp — nền vector theo theme, không có ảnh vệ tinh. Khác region-spotlight: bối cảnh xung quanh KHÔNG bị làm mờ, vì đó chính là thứ đang bán.',
    params: {
      location: 'Chính DỰ ÁN — nơi ghim rơi xuống, và là anchor quốc gia để resolve tên vùng. Tên ("Vinhomes Grand Park, Thủ Đức") hoặc {lng,lat}. Truyền tên thành phố ở đây thì ghim rơi vào tâm thành phố.',
      boundary: 'Ranh giới được vẽ dần và cũng là thứ camera ôm khung. Tên vùng hành chính (resolve live từ OSM) HOẶC một FeatureCollection GeoJSON của chính lô đất — dạng GeoJSON là lối duy nhất cho dự án chưa có trong OSM.',
      theme: 'Một id trong list_themes. Bỏ trống thì dùng mặc định của engine.',
      format: 'Một tên trong list_formats, ví dụ "tiktok". Mặc định "tiktok".',
      color: 'Màu hex của ranh giới, ví dụ "#e8b04b". Bỏ trống thì dùng accent của theme.',
      icon: `Biểu tượng ghim dự án — một trong: ${MARKER_ICONS.map((m) => m.key).join(', ')}. Mặc định "home".`,
      fps: 'Ghi đè fps của preset approach (12..30).',
      durationSec: 'Ghi đè thời lượng của preset approach (2..12 giây); mọi mốc nhịp co giãn theo tỉ lệ.',
    },
    schema: z
      .object({
        location: placeRef,
        // GeoJSON phải là FeatureCollection — engine kiểm sâu hơn (assertGeojson,
        // trần 2 MiB), nhưng chốt hình dạng ở đây để một LineString xuất từ
        // KML/CAD bị từ chối bằng tên trước khi tiêu một lượt render, thay vì
        // ra một "ranh giới" là sợi chỉ không khép.
        boundary: z.union([z.string().min(1), z.object({ type: z.literal('FeatureCollection'), features: z.array(z.unknown()).min(1) })]),
        theme: z.string().min(1).optional(),
        format: z.string().min(1).optional(),
        color: hexColor.optional(),
        icon: markerIcon.optional(),
        fps: z.number().int().optional(),
        durationSec: z.number().optional(),
      })
      .strict(),
    durationSec: 6,
    example: {
      recipe: 'property-intro',
      location: 'Vinhomes Grand Park, Thủ Đức',
      boundary: 'Long Bình, Thủ Đức',
      theme: 'midnight-blue',
      format: 'tiktok',
      icon: 'home',
    },
    compile: (p: {
      location: string | { lng: number; lat: number };
      boundary: string | { type: 'FeatureCollection'; features: unknown[] };
      theme?: string;
      format?: string;
      color?: string;
      icon?: MarkerIconKey;
      fps?: number;
      durationSec?: number;
    }): CompiledRecipeCall =>
      compact({
        location: p.location,
        format: p.format ?? 'tiktok',
        theme: p.theme,
        highlight: {
          // Đúng MỘT region, luôn index 0 — regionReveal của preset approach
          // mặc định trỏ regionIndex 0, nên đây là ranh giới được vẽ dần.
          regions: [
            typeof p.boundary === 'string'
              ? p.color
                ? { name: p.boundary, color: p.color }
                : p.boundary
              : compact({ geojson: p.boundary, color: p.color }),
          ],
          // Đúng MỘT điểm. KHÔNG phải trang trí: có điểm thì preset approach
          // mới phát thêm track pinDrop — cú "tới nơi rồi cắm cờ" là đặc trưng
          // của recipe này, và caller không có công tắc tắt nó.
          points: [typeof p.location === 'string' ? { query: p.location, icon: p.icon ?? 'home' } : { ...p.location, icon: p.icon ?? 'home' }],
          fill: true,
          // `dim` CỐ Ý vắng mặt và cũng không phải tham số: dim đi thì đây
          // thành region-spotlight. Đây là video bán hàng — trường học, trục
          // đường, sông quanh dự án là hàng hoá, không phải nhiễu.
        },
        motion: compact({ preset: 'approach' as const, fps: p.fps, durationSec: p.durationSec }),
      }),
  },

  amenities: {
    description:
      'Đẩy vào dự án rồi phát sóng lan quanh nó, với các tiện ích lân cận hiện cùng khung dưới dạng ghim. Trả kèm khoảng cách đường chim bay từ dự án tới từng tiện ích trong resolved.measures. LƯU Ý: các ghim hiện CÙNG LÚC — engine không dựng được nhịp so le từng tiện ích.',
    params: {
      location: 'Dự án trung tâm — camera đẩy vào đây và sóng lan quanh nó. Tên hoặc {lng,lat}.',
      pois: 'Danh sách tiện ích lân cận, mỗi mục là tên ("Trường Quốc tế Úc") hoặc {query, icon, color}. Tối đa 12 — mỗi tên là một lượt geocode nối tiếp.',
      theme: 'Một id trong list_themes.',
      format: 'Một tên trong list_formats. Mặc định "tiktok".',
      icon: `Biểu tượng mặc định cho tiện ích chưa tự khai icon — một trong: ${MARKER_ICONS.map((m) => m.key).join(', ')}. Mặc định "circle".`,
      fps: 'Ghi đè fps của preset pushIn (12..30).',
      durationSec: 'Ghi đè thời lượng của preset pushIn (2..12 giây).',
    },
    schema: z
      .object({
        location: placeRef,
        // Trần 12: mỗi POI đặt bằng tên là một lượt Nominatim nối tiếp sau bộ
        // hạn tốc >=1 req/s. Cùng lý do MAX_HIGHLIGHTS tồn tại.
        pois: z
          .array(z.union([z.string().min(1), z.object({ query: z.string().min(1), icon: markerIcon.optional(), color: hexColor.optional() }).strict()]))
          .min(1)
          .max(12),
        theme: z.string().min(1).optional(),
        format: z.string().min(1).optional(),
        icon: markerIcon.optional(),
        fps: z.number().int().optional(),
        durationSec: z.number().optional(),
      })
      .strict(),
    durationSec: 5.5,
    example: {
      recipe: 'amenities',
      location: 'Vinhomes Grand Park, Thủ Đức',
      pois: ['Bệnh viện Quân y 175', { query: 'Trường Quốc tế Úc, TP.HCM', icon: 'star' }],
      format: 'tiktok',
    },
    compile: (p: {
      location: string | { lng: number; lat: number };
      pois: (string | { query: string; icon?: MarkerIconKey; color?: string })[];
      theme?: string;
      format?: string;
      icon?: MarkerIconKey;
      fps?: number;
      durationSec?: number;
    }): CompiledRecipeCall =>
      compact({
        location: p.location,
        format: p.format ?? 'tiktok',
        theme: p.theme,
        highlight: {
          // Dự án luôn ở index 0 — preset pushIn đẩy vào và pulse quanh ĐIỂM
          // ĐẦU, nên thứ tự này là đặc trưng của recipe, không phải tình cờ.
          points: [
            typeof p.location === 'string' ? { query: p.location, icon: 'home' as const } : { ...p.location, icon: 'home' as const },
            ...p.pois.map((poi) =>
              typeof poi === 'string' ? { query: poi, icon: p.icon ?? ('circle' as const) } : compact({ ...poi, icon: poi.icon ?? p.icon ?? ('circle' as const) }),
            ),
          ],
        },
        // Khoảng cách chim bay từ dự án (index 0) tới từng tiện ích. Đây là
        // phần "đo được" của recipe: tầng DOM in số km cạnh mỗi ghim, lấy vị
        // trí từ resolved.anchors.
        measure: { pairs: p.pois.map((_, i): [number, number] => [0, i + 1]) },
        motion: compact({ preset: 'pushIn' as const, fps: p.fps, durationSec: p.durationSec }),
      }),
  },

  'compare-locations': {
    description:
      'Ôm trọn nhiều dự án cùng một điểm quy chiếu trong một khung, trôi chậm quanh khung đó, và trả khoảng cách đường chim bay từ điểm quy chiếu tới từng dự án. LƯU Ý: các dự án hiện CÙNG LÚC — engine không dựng được nhịp làm nổi lần lượt.',
    params: {
      subjects: 'Các dự án cần so sánh — mỗi mục là tên hoặc {lng,lat}. Từ 2 tới 6.',
      reference: 'Điểm quy chiếu mà mọi khoảng cách đo về, ví dụ "Chợ Bến Thành". Tên hoặc {lng,lat}.',
      theme: 'Một id trong list_themes.',
      format: 'Một tên trong list_formats. Mặc định "tiktok".',
      icon: `Biểu tượng cho các dự án — một trong: ${MARKER_ICONS.map((m) => m.key).join(', ')}. Mặc định "home". Điểm quy chiếu luôn dùng "star" để phân biệt.`,
      fps: 'Ghi đè fps của preset drift (12..30).',
      durationSec: 'Ghi đè thời lượng của preset drift (2..12 giây).',
    },
    schema: z
      .object({
        subjects: z.array(placeRef).min(2).max(6),
        reference: placeRef,
        theme: z.string().min(1).optional(),
        format: z.string().min(1).optional(),
        icon: markerIcon.optional(),
        fps: z.number().int().optional(),
        durationSec: z.number().optional(),
      })
      .strict(),
    durationSec: 6,
    example: {
      recipe: 'compare-locations',
      subjects: ['Vinhomes Grand Park, Thủ Đức', 'Masteri Thảo Điền, TP.HCM'],
      reference: 'Chợ Bến Thành, TP.HCM',
      format: 'tiktok',
    },
    compile: (p: {
      subjects: (string | { lng: number; lat: number })[];
      reference: string | { lng: number; lat: number };
      theme?: string;
      format?: string;
      icon?: MarkerIconKey;
      fps?: number;
      durationSec?: number;
    }): CompiledRecipeCall =>
      compact({
        // Điểm quy chiếu làm `location`: nó cấp country anchor cho mọi tên còn
        // lại. Khung hình KHÔNG lấy từ đây — resolveConfig auto-frame theo
        // union mọi điểm, nên cả điểm quy chiếu lẫn mọi dự án đều lọt khung.
        location: p.reference,
        format: p.format ?? 'tiktok',
        theme: p.theme,
        highlight: {
          // Điểm quy chiếu ở index 0 để measure.pairs đọc được, và mang icon
          // khác để phân biệt với các dự án — clip không có chữ (AC-9), nên
          // hình dạng ghim là thứ duy nhất phân biệt được trong pixel.
          points: [
            typeof p.reference === 'string' ? { query: p.reference, icon: 'star' as const } : { ...p.reference, icon: 'star' as const },
            ...p.subjects.map((s) =>
              typeof s === 'string' ? { query: s, icon: p.icon ?? ('home' as const) } : { ...s, icon: p.icon ?? ('home' as const) },
            ),
          ],
        },
        measure: { pairs: p.subjects.map((_, i): [number, number] => [0, i + 1]) },
        // `drift` chứ không phải script thô: script đòi camera keyframe TUYỆT
        // ĐỐI, mà compile() chạy trước geocode nên không có toạ độ (xem ghi chú
        // GIỚI HẠN ở đầu file). drift để engine tự trôi quanh khung đã auto-frame.
        motion: compact({ preset: 'drift' as const, fps: p.fps, durationSec: p.durationSec }),
      }),
  },

  'route-journey': {
    description:
      'Vẽ dần một tuyến bám đường thật từ điểm đi tới điểm đến, camera bám theo đầu nét vẽ, dừng khi tuyến đủ. Trả kèm quãng đường và thời gian router báo về trong resolved.routes.',
    params: {
      from: 'Điểm đi — tên ("Chợ Bến Thành") hoặc {lng,lat}. Cũng là nơi camera bắt đầu.',
      to: 'Điểm đến — tên hoặc {lng,lat}.',
      mode: 'Phương tiện: car | moto | walk. Mặc định "car". Lưu ý moto ánh xạ sang profile driving của OSRM và điều đó được báo lại trong resolved.routes[0].provider.',
      theme: 'Một id trong list_themes.',
      format: 'Một tên trong list_formats. Mặc định "tiktok".',
      color: 'Màu hex của tuyến, ví dụ "#ff5a3c". Nên đặt rõ: accent của phần lớn theme nằm sát dải màu đường bộ nên tuyến dễ chìm vào nền.',
      width: 'Bề rộng nét tuyến, 1..16. Mặc định 8 — dày hơn mặc định 4 của render_clip vì tuyến ở đây là chủ thể, không phải nền.',
      fps: 'Ghi đè fps của preset follow (12..30).',
      durationSec: 'Ghi đè thời lượng của preset follow (2..12 giây).',
    },
    schema: z
      .object({
        from: placeRef,
        to: placeRef,
        mode: z.enum(['car', 'moto', 'walk']).optional(),
        theme: z.string().min(1).optional(),
        format: z.string().min(1).optional(),
        color: hexColor.optional(),
        width: z.number().min(1).max(16).optional(),
        fps: z.number().int().optional(),
        durationSec: z.number().optional(),
      })
      .strict(),
    durationSec: 6,
    example: {
      recipe: 'route-journey',
      from: 'Chợ Đồng Xuân, Hà Nội',
      to: 'Nhà hát Lớn Hà Nội',
      mode: 'car',
      color: '#ff5a3c',
      format: 'tiktok',
    },
    compile: (p: {
      from: string | { lng: number; lat: number };
      to: string | { lng: number; lat: number };
      mode?: 'car' | 'moto' | 'walk';
      theme?: string;
      format?: string;
      color?: string;
      width?: number;
      fps?: number;
      durationSec?: number;
    }): CompiledRecipeCall =>
      compact({
        // `location` = điểm đi: nó cấp country anchor cho `to` khi `to` là một
        // cái tên, cùng cơ chế highlight dùng — nên một địa danh trùng tên ở
        // nước khác không thể lặng lẽ kéo tuyến đi.
        location: p.from,
        format: p.format ?? 'tiktok',
        theme: p.theme,
        routes: [compact({ route: compact({ from: asRouteEnd(p.from), to: asRouteEnd(p.to), mode: p.mode ?? 'car' }), color: p.color, width: p.width ?? 8 })],
        // `follow` là đặc trưng không tắt được: bỏ nó đi thì đây chỉ là một
        // tuyến tĩnh, thứ gọi thẳng render_clip được. Preset này cũng là chỗ
        // DUY NHẤT trong catalog phát ra camera keyframe tuyệt đối — nó làm
        // được vì compile của PRESET chạy SAU resolveConfig, khác compile của
        // RECIPE (xem khối GIỚI HẠN ở đầu tệp).
        motion: compact({ preset: 'follow' as const, fps: p.fps, durationSec: p.durationSec }),
      }),
  },
};

/** Tên recipe lạ bị từ chối kèm danh sách tên hợp lệ — không rơi về mặc định. */
export function getRecipe(name: string): RecipeSpec {
  if (!Object.hasOwn(RECIPES, name)) {
    throw new Error(`Unknown recipe: ${name}. Known recipes: ${Object.keys(RECIPES).join(', ')}`);
  }
  return RECIPES[name];
}

/** Catalog tự mô tả cho `list_recipes`. */
export function listRecipes(): {
  recipes: { name: string; description: string; params: Record<string, string>; durationSec: number; example: Record<string, unknown> }[];
} {
  return {
    recipes: Object.entries(RECIPES).map(([name, r]) => ({
      name,
      description: r.description,
      params: r.params,
      durationSec: r.durationSec,
      example: r.example,
    })),
  };
}
