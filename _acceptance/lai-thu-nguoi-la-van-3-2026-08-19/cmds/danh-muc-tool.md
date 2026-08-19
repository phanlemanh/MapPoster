# Danh mục tool đo được — ván #3

Sinh từ `tools/list` của cầu nối, **ghi thẳng ra tệp** (qua đường ống thì bị
cắt ở 64 KiB — xem mục "Không quy được cho sản phẩm" của hồ sơ tổng).

```
tổng byte phản hồi:   107345
số tool: 11

kích thước lược đồ từng tool (ký tự JSON):
   4910 render_map
   9926 render_variants
   5373 render_animation
   5265 render_clip
    206 geocode_place
   5265 compile_motion
     85 list_fonts
     85 list_themes
     85 list_formats
     85 list_recipes
    430 render_recipe
```

## Preset chuyển động: mô tả nói 3, lược đồ có 6

```
MÔ TẢ  : Render a short text-free camera-motion map clip (MP4) + a rest-state settle still. motion: {preset: approach|pushIn|drift} or {script}.

LƯỢC ĐỒ: "preset":{"type":"string","enum":["approach","pushIn","drift","follow","tour","converge"]
```

## `output` không điều khiển đầu ra

```
khoá cấp cao nhất: location, basemap, highlight, format, theme, chrome, camera, placeName, labels, layers, detail, font, routes, output, measure, delivery, motion

render_clip.output = {"type":"object","properties":{"quality":{"type":"string","enum":["draft","standard","high"]}},"additionalProperties":false}

outPath    không có
filename   không có
outDir     không có
basename   không có
overwrite  không có
slug       không có
```
