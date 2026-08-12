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
 */
import { z } from 'zod';
import type { RenderMapParams } from './resolveConfig';
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
