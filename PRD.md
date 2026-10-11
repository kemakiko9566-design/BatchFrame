我先把它写成一份可以直接作为仓库根文档使用的 **PRD + 技术方案 v0.1**。这一版最重要的是把“批量边框”与“未来图片 Harness”同时兼容，但不让未来架构拖累 MVP。

# BatchFrame — PRD & Technical Development Plan

> Version: 0.1  
> Date: 2026-10-08  
> Status: `GO — Web/PWA MVP`  
> Product type: Local-first modular photo layout processor  
> First product surface: Web / PWA  
> Native migration: Android / iOS via Capacitor  
> Core principle: **Small Core, Everything Else Composable**

---

# 0. Executive Decision

## 0.1 项目结论

**立项。**

但 BatchFrame 不应被定义为“另一个图片编辑器”，也不应该从第一天开始做 Lightroom / Canva / 醒图式大而全编辑器。

第一阶段只解决一个非常具体的问题：

> 用户一次导入一批照片，BatchFrame 自动判断照片比例和目标场景，以一致的规则完成画布、边框、背景和排版，然后本地批量导出。

第一阶段核心链路：

```text
Import
  ↓
Analyze
  ↓
Layout
  ↓
Render
  ↓
Preview
  ↓
Batch
  ↓
Export
```

产品长期架构则定义为：

```text
BatchFrame

Core Runtime
    │
    ├── Plugin
    ├── Plugin
    ├── Plugin
    │
    └── Skill
          │
          └── Pipeline
```

也就是：

**现在做一个很好用的批量边框工具。**

但底层从第一天开始允许未来扩展成：

```text
边框
画布
EXIF
文字
水印
波点
颗粒
阴影
贴纸
拼贴
自动抠图
自动排版
社交媒体模板
智能推荐
```

而不是日后推翻重写。

---

# 1. Product Definition

## 1.1 一句话定义

**BatchFrame 是一个离线优先、模块化的照片批量排版与处理工具。**

用户导入照片后，可以通过 Preset / Skill 快速把大量图片转换成适合朋友圈、小红书、Instagram、Story、摄影展示等场景的统一成品。

---

# 2. 产品原则

所有后续需求必须服从以下原则：

### P0 — Local First

照片处理默认发生在用户设备。

默认：

```text
照片
↓
浏览器 / App 本地
↓
处理
↓
导出
```

不经过 BatchFrame Server。

未来即使增加 AI，也优先：

```text
ONNX / WASM / WebGPU
↓
Local inference
```

ONNX Runtime Web 官方本身支持浏览器端推理，并把数据不离开设备、离线工作和降低云端成本列为端侧推理优势。:chatgpt-content-reference{index="0"}

---

### P1 — Small Core

Core 不实现具体视觉效果。

Core 只负责：

```text
Document
Plugin Registry
Pipeline
Renderer
Task Queue
Cache
History
Export
```

“白边”不是核心功能。

“波点”不是核心功能。

“自动抠图”也不是核心功能。

它们都是能力模块。

---

### P2 — Batch First

任何处理能力必须首先考虑：

> 它能不能无人工干预地处理 1 张、10 张和 100 张图片？

不能只围绕单张图片编辑器设计。

---

### P3 — Non-destructive

所有编辑保存为参数。

禁止：

```text
修改一次
↓
直接覆盖像素
↓
再修改
↓
再压缩
```

采用：

```text
Source Image
+
Document State
+
Pipeline
↓
Render
```

原图始终不修改。

---

### P4 — Graceful Degradation

高级能力不能成为基础功能的依赖。

例如：

```text
WebGPU ✗
AI Cutout ✗

但：

Border ✓
Canvas ✓
Layout ✓
Export ✓
```

---

### P5 — Capability ≠ Skill

必须从架构层区分：

**Plugin = 能力**

例如：

```text
border
shadow
dots
cutout
text
grain
```

**Skill = 能力组合**

例如：

```text
Xiaohongshu Clean Photo

Canvas 3:4
+
White Background
+
Fit
+
Border
+
EXIF Caption
```

Skill 本质上是配置，不是代码。

---

# 3. Target User

第一阶段不追求“大众修图用户”。

Primary User：

```text
摄影用户
相机用户
内容创作者
社交媒体发图用户
需要批量处理图片的人
```

典型场景：

### Scenario A

相机拍了 40 张照片。

用户不想：

```text
导电脑
Lightroom
Photoshop
逐张加框
逐张导出
```

而希望：

```text
导入 40 张
↓
选择「白边摄影」
↓
全部处理
↓
导出
```

---

### Scenario B

一组照片横竖比例不统一。

目标：

```text
小红书 3:4
```

BatchFrame 自动：

```text
照片比例
↓
计算 Fit
↓
保持完整照片
↓
统一外部 3:4 Canvas
```

而不是直接裁掉照片。

---

### Scenario C

未来：

```text
人像
↓
Auto Cutout
↓
Sticker Outline
↓
Shadow
↓
Random Collage
↓
Dot Pattern
```

形成：

**Sticker Collage Skill**

---

# 4. MVP Scope

## V0.1 必须实现

### Import

支持：

```text
JPEG
PNG
WebP
```

支持：

```text
单张导入
多张导入
Drag & Drop
```

---

### Image Analyzer

读取：

```text
width
height
aspect ratio
orientation
file size
filename
mime
```

并生成：

```text
landscape
portrait
square
panorama
ultra-tall
```

分类。

后续再读取完整 EXIF。

---

### Canvas

支持：

```text
Original
1:1
3:4
4:5
9:16
16:9
Custom
```

---

### Fit

支持：

```text
Contain
Cover
Original
```

V1 默认优先：

**Contain**

因为 BatchFrame 第一阶段的核心价值不是裁图，而是保护摄影作品完整性。

---

### Border

至少提供：

```text
Uniform Border
Vertical / Horizontal Independent
Relative Border %
Absolute px
```

---

### Background

```text
White
Black
Custom Color
Transparent
```

---

### Preset / Skill

默认提供至少：

```text
Clean White
Clean Black
Xiaohongshu 3:4
Instagram 4:5
Story 9:16
Square
Panorama
```

---

### Batch

支持：

```text
Apply to All
Apply to Selected
Override Individual
```

---

### Export

支持：

```text
JPEG
PNG
WebP
```

参数：

```text
quality
resolution
filename rule
```

---

# 5. Explicit Non-goals — V1 不做什么

V1 明确不做：

```text
RAW 编辑
完整 Lightroom 调色
图层 Photoshop
曲线
HSL
Liquify
复杂画笔
云同步
账号系统
在线素材市场
多人协作
第三方 executable plugin
AI 自动抠图
HEIC 完整支持
```

这些不是“永远不做”。

而是：

**不得阻塞 MVP。**

---

# 6. Core Architecture

推荐：

```text
                   UI
                    │
               Application
                    │
             Document Store
                    │
              Skill Engine
                    │
             Plugin Registry
                    │
              Render Graph
                    │
          ┌─────────┴──────────┐
          │                    │
    Preview Renderer      Export Renderer
          │                    │
       Canvas              Worker
                               │
                       OffscreenCanvas
```

其中一个极其重要的决定是：

## Render Core 不依赖 React

错误：

```text
React Component
      ↓
Konva
      ↓
Export
```

正确：

```text
Document
   ↓
RenderGraph
   ↓
Renderer Interface
   ├── Canvas2D
   ├── Preview
   ├── WebGL     future
   └── WebGPU    future
```

因此 Core 可以：

```text
Web
Worker
Android WebView
iOS WKWebView
测试环境
```

复用。

---

# 7. Render Model

统一使用 Render Node。

例如：

```ts
type RenderNode =
  | ImageNode
  | RectNode
  | TextNode
  | PatternNode
  | MaskNode
  | GroupNode;
```

一个普通白边照片实际上是：

```text
Group
│
├── Rect
│     background = white
│
└── Image
      fit = contain
```

未来波点：

```text
Group
│
├── PatternNode
│      type = dots
│
└── Image
```

未来贴纸：

```text
Group
│
├── Image
│
├── Mask
│
├── Outline
│
└── Shadow
```

因此不需要不断增加：

```text
renderWhiteBorder()
renderSticker()
renderCollage()
```

而是组合 Render Nodes。

---

# 8. Plugin Architecture

建议定义：

```ts
interface BatchFramePlugin {
  manifest: PluginManifest;

  register(context: PluginContext): void;
}
```

Manifest：

```ts
interface PluginManifest {
  id: string;
  version: string;
  name: string;

  category:
    | "source"
    | "layout"
    | "transform"
    | "effect"
    | "decoration"
    | "metadata"
    | "ai"
    | "export";

  schema: unknown;
}
```

---

## V1 Built-in Plugins

```text
image.source
canvas.base
image.fit
background.color
border.simple
export.jpeg
export.png
export.webp
```

---

## V1.5

```text
metadata.exif
text.basic
watermark
shadow
dots
grain
```

---

## V2

```text
sticker.outline
collage.free
collage.grid
collage.random
mask.basic
```

---

## V3

```text
ai.segmentation
ai.cutout
auto.layout
```

---

# 9. Skill Architecture

Skill 必须是 declarative。

示例：

```json
{
  "schemaVersion": 1,
  "name": "Xiaohongshu Clean",
  "pipeline": [
    {
      "plugin": "canvas.base",
      "params": {
        "ratio": "3:4",
        "background": "#ffffff"
      }
    },
    {
      "plugin": "image.fit",
      "params": {
        "mode": "contain"
      }
    },
    {
      "plugin": "border.simple",
      "params": {
        "size": 0.08
      }
    }
  ]
}
```

用户未来可以：

```text
Export Skill
Import Skill
Share Skill
```

但它仍然只是：

**JSON 数据。**

不是远程 JavaScript。

这是非常重要的跨平台决策。

Apple 当前 App Review Guideline 2.5.2 明确限制 App 下载、安装或运行能够引入或改变 App 功能的代码，因此把社区扩展定义为“声明式 Skill / Preset”，而不是下载 JS 插件，会明显降低未来 iOS 分发风险。:chatgpt-content-reference{index="1"}

---

# 10. Technology Selection Criteria

任何核心依赖都按下面标准评分。

| 判断指标 | 权重 |
|---|---:|
| 本地/离线能力 | 20% |
| Web / Android / iOS 复用 | 20% |
| 大图片性能与内存 | 20% |
| 模块化扩展能力 | 15% |
| 长期维护与生态 | 10% |
| 开发复杂度 | 10% |
| 平台政策风险 | 5% |

技术选择不能因为：

> “这个库看起来很酷。”

而通过。

核心技术必须达到：

**≥ 75 / 100**

才可进入主链。

---

# 11. Frontend Technology

## Candidate

```text
React
Vue
Svelte
```

### Decision

**React + TypeScript**

理由：

项目已经有 React / TS 技术积累，同时插件、复杂交互、Canvas UI、Capacitor 和未来社区生态都比较容易组合。

React 当前 19.x 仍持续维护，官方在 2026 年 9 月发布了 React 19.3。:chatgpt-content-reference{index="2"}

选择：

```text
React 19.x
TypeScript
```

不使用 Next.js。

因为 BatchFrame：

```text
不需要 SSR
不依赖 Server
不需要 SEO 页面渲染
```

Next.js 只会增加架构重量。

---

# 12. Build Tool

## Decision

**Vite 8.x**

Vite 8 已切换为 Rolldown 统一构建体系；2026 年 6 月已经发布 Vite 8.1。:chatgpt-content-reference{index="3"}

推荐：

```text
Vite
React
TypeScript
```

而不是：

```text
CRA
Next.js
Electron-first
```

---

# 13. Native Strategy

比较：

| 路线 | Web复用 | Android | iOS | 图像Core复用 | 开发成本 |
|---|---:|---:|---:|---:|---:|
| Capacitor | ★★★★★ | ★★★★☆ | ★★★★☆ | ★★★★★ | ★★★★☆ |
| React Native | ★★☆☆☆ | ★★★★★ | ★★★★★ | ★★★☆☆ | ★★★☆☆ |
| Flutter | ★☆☆☆☆ | ★★★★★ | ★★★★★ | ★★☆☆☆ | ★★☆☆☆ |
| Native 双开发 | ☆☆☆☆☆ | ★★★★★ | ★★★★★ | ★☆☆☆☆ | ★☆☆☆☆ |

## Decision

**Web → PWA → Capacitor Android → Capacitor iOS**

Capacitor 当前稳定文档为 v8，并正式支持 Web、Android 与 iOS，同时允许需要时通过 Swift / Java 等访问原生 API。:chatgpt-content-reference{index="4"}

所以：

```text
packages/core
packages/plugins
packages/skills

        ↓

Web App

        ↓

Capacitor

   ┌────┴────┐
Android     iOS
```

核心不重写。

---

# 14. Rendering Technology Research

## Option A — Raw Canvas 2D

优点：

```text
轻
浏览器原生
容易 Worker 化
容易 OffscreenCanvas
跨平台最好
导出直接
```

缺点：

```text
交互编辑能力需要自己做
复杂滤镜能力有限
```

---

## Option B — Konva

优点：

```text
Canvas scene graph
React binding
Transform / Drag / Layer
Touch interaction
成熟
```

React-Konva 官方提供 React 声明式 Canvas 组件，并明确支持通过 Web 环境运行；对于已有 Web 编辑器，放入 WebView 也是官方提到的可行路线。:chatgpt-content-reference{index="5"}

缺点：

```text
增加抽象层
批量无UI渲染没有必要依赖它
核心如果绑定 Konva 会降低独立性
```

---

## Option C — Fabric.js

最大优势：

```text
Object model
Selection
Transform
Serialization
SVG
JSON
```

Fabric 官方本身就提供 Canvas 对象管理、交互、序列化/反序列化以及图像导出。:chatgpt-content-reference{index="6"}

适合：

```text
Canva-like editor
```

但对于 BatchFrame 第一阶段来说：

**过重。**

---

## Option D — PixiJS

优势：

```text
WebGL
WebGPU
GPU Rendering
Shaders
大量 Sprite
```

PixiJS 当前生产环境仍推荐 WebGL，WebGPU renderer 虽然功能完整但官方仍称其处于成熟过程中。:chatgpt-content-reference{index="7"}

它非常适合：

```text
实时视觉
动画
游戏
大量 Sprite
GPU Effects
```

但 BatchFrame V1 是：

```text
静态图片
参数变化
批量导出
```

所以暂时没有必要承担 GPU Engine 的复杂度。

---

# 15. Rendering Decision

最终选择：

## V1

```text
Custom Render Graph
        ↓
Canvas2DRenderer
        ↓
OffscreenCanvas
        ↓
Worker
```

## V2 Editor

```text
Render Graph
    ↓
Konva Adapter
```

Konva只负责：

```text
拖拽
缩放
旋转
选中
交互
```

不成为 Core。

## V3 GPU

真正出现性能需求后，再增加：

```text
WebGL Renderer
or
WebGPU Renderer
```

而不是现在。

---

# 16. Worker Architecture

所有高分辨率批量渲染不得长期占据 Main Thread。

推荐：

```text
Main Thread

UI
Document
Thumbnail
Interaction

      │
      ↓

Worker Pool

Decode
Layout
Render
Encode

      │
      ↓

Blob
```

`OffscreenCanvas` 已属于广泛可用 Web API，并可运行在 Web Worker；`createImageBitmap()` 同样可以在 Worker 中完成高效图片准备。:chatgpt-content-reference{index="8"}

输出使用：

```text
OffscreenCanvas.convertToBlob()
```

它可以直接在 Worker 中产生 Blob，并支持至少 PNG，浏览器通常还支持 JPEG/WebP。:chatgpt-content-reference{index="9"}

---

# 17. Image Memory Strategy

这是 BatchFrame 最容易做崩的地方。

一张：

```text
6000 × 4000
```

24MP 图片解码为 RGBA 后大约：

```text
6000 × 4000 × 4
≈ 96MB
```

20 张同时解码就接近：

```text
≈ 1.9GB
```

所以禁止：

```text
一次 decode 全部原图
```

采用：

### Thumbnail Pipeline

导入时：

```text
File
↓
Metadata
↓
small ImageBitmap
↓
Thumbnail
```

`createImageBitmap` 本身提供 resizeWidth / resizeHeight / resizeQuality，可以在解码路径生成更小的 bitmap。:chatgpt-content-reference{index="10"}

---

### Export Pipeline

```text
Queue
↓
Decode 1~N
↓
Render
↓
Encode
↓
bitmap.close()
↓
Next
```

严格释放：

```ts
imageBitmap.close()
```

---

## 初期并发

Desktop：

```text
2–4 jobs
```

Mobile：

```text
1–2 jobs
```

不得简单：

```ts
Promise.all(100Images)
```

---

# 18. File API Strategy

## Baseline

必须依赖：

```text
<input type=file multiple>
File
Blob
Drag & Drop
```

保证最大兼容。

---

## Enhancement

支持浏览器时再加入：

```text
File System Access API
```

File System API 可以提供设备文件与目录访问，但需要安全上下文和用户授权；文件权限本身也存在生命周期限制。:chatgpt-content-reference{index="11"}

所以它只能是：

**Progressive Enhancement**

不能成为 BatchFrame 的必要依赖。

---

# 19. Offline Strategy

Web 版应成为真正的 PWA。

首次加载完成后：

```text
App Shell
JS
CSS
Icons
Built-in Skills
WASM modules
```

可以被本地缓存。

Service Worker + Cache API 本身就是 PWA 实现离线资源加载的标准机制。:chatgpt-content-reference{index="12"}

目标：

```text
首次访问需要网络

之后：

断网
↓
打开 BatchFrame
↓
导入照片
↓
处理
↓
导出
```

仍可完成核心任务。

---

# 20. Local Storage

V1 不保存原图。

默认：

```text
User File
     ↓
Session
     ↓
Render
```

关闭项目即可释放。

本地持久化只保存：

```text
Settings
Skills
Recent Parameters
UI Preferences
```

推荐：

```text
IndexedDB
```

未来大型缓存：

```text
OPFS
```

例如：

```text
AI model
temporary cache
generated preview
```

---

# 21. State Management

推荐：

**Zustand**

用途：

```text
UI State
Document State
Selection
Job State
Preferences
```

而：

```text
Pixel data
ImageBitmap
Blob
```

不要塞进 Zustand。

Zustand 提供轻量的 TypeScript store、selector 和持久化中间件能力。:chatgpt-content-reference{index="13"}

---

# 22. Schema

推荐：

**Zod**

必须验证：

```text
Plugin Manifest
Skill
Preset
Project File
Plugin Parameters
```

Zod 4 当前稳定，并支持 TypeScript 类型推断和 JSON Schema 转换。:chatgpt-content-reference{index="14"}

这样社区 Skill：

```text
unknown.json
```

进入程序前先：

```text
Zod.parse()
```

不合法直接拒绝。

---

# 23. EXIF

推荐：

**exifr**

用途：

```text
Camera
Lens
ISO
Aperture
Shutter
Focal Length
Orientation
GPS optional
```

exifr 支持模块化浏览器构建，因此可以只引入需要的 EXIF 能力而不是整个完整包。:chatgpt-content-reference{index="15"}

V1：

只使用必要 orientation / metadata。

V1.5：

加入 EXIF Card。

---

# 24. Batch Download

Web 浏览器直接触发：

```text
100 次下载
```

用户体验不好。

因此 Batch Export 推荐：

```text
Files
↓
ZIP
```

推荐：

**fflate**

它支持异步 Worker 压缩，因此大量文件压缩时可以避免阻塞 UI。:chatgpt-content-reference{index="16"}

Native App 则未来可以：

```text
Save to Photos
Save to Folder
Share Sheet
```

不需要 ZIP。

---

# 25. HEIC Decision

## V1

**不承诺 HEIC。**

原因不是“做不了”。

而是浏览器解码 API 与格式支持仍然不够统一。

例如 WebCodecs `ImageDecoder` 当前仍不是 Baseline 能力。:chatgpt-content-reference{index="17"}

## V2

评估：

```text
libheif WASM
```

libheif 官方项目支持通过 Emscripten 编译到 JavaScript / WASM。:chatgpt-content-reference{index="18"}

但是 WASM：

```text
增加包体
增加初始化时间
增加维护复杂度
```

所以做成：

```text
Codec Plugin
```

而不是 Core。

---

# 26. AI Cutout Technology

V1：

```text
NO
```

但必须预留：

```text
MaskNode
AI Plugin
```

V3 首选：

```text
ONNX Runtime Web
```

Pipeline：

```text
Image
↓
Resize
↓
ONNX model
↓
Mask
↓
Post Process
↓
MaskNode
```

Backend：

```text
WebGPU
   ↓ fallback
WASM
```

ONNX Runtime Web 官方建议轻量模型使用 WASM，而计算量更大的模型可以利用 WebGPU。:chatgpt-content-reference{index="19"}

因此架构：

```text
ai.cutout
│
├── WebGPU provider
└── WASM provider
```

而不是：

```text
WebGPU required
```

---

# 27. Effects Strategy

波点、网格、条纹这种效果：

**不要 AI。**

直接：

```text
PatternNode
```

参数：

```text
dotRadius
gap
rotation
opacity
foreground
background
offsetX
offsetY
```

---

简单 Grain：

```text
Effect Plugin
```

Sticker Outline：

```text
Mask
↓
Dilate
↓
Fill
```

Shadow：

```text
Mask
↓
Blur
↓
Offset
```

需要注意 Canvas 2D 的 `filter` 属性目前仍不是所有主流浏览器的 Baseline 能力，因此重要效果不能把它作为唯一实现。:chatgpt-content-reference{index="20"}

必要时使用：

```text
pixel algorithm
WASM
WebGL
```

实现稳定 fallback。

---

# 28. Suggested Repository

```text
batchframe/

apps/
│
├── web/
├── android/
└── ios/

packages/
│
├── core/
│   ├── document/
│   ├── pipeline/
│   ├── registry/
│   ├── render-graph/
│   └── task/
│
├── renderer-canvas/
│
├── plugins/
│   ├── canvas/
│   ├── fit/
│   ├── border/
│   ├── background/
│   └── export/
│
├── skill-engine/
│
├── schemas/
│
└── shared/

workers/
│
├── render.worker.ts
└── export.worker.ts
```

---

# 29. Dependency Rule

核心层：

```text
core
```

禁止依赖：

```text
React
Capacitor
Konva
DOM
```

即：

```text
core ← pure TypeScript
```

Renderer：

```text
renderer-canvas
↓
Canvas APIs
```

UI：

```text
React
↓
Core
```

Native：

```text
Capacitor
↓
Web App
```

这是整个项目最重要的工程规则之一。

---

# 30. Recommended Stack

最终建议：

| Layer | Selection |
|---|---|
| Language | TypeScript |
| UI | React 19.x |
| Builder | Vite 8.x |
| Package | pnpm |
| Native | Capacitor 8 |
| Core Renderer | Canvas 2D |
| Background Render | OffscreenCanvas |
| Thread | Web Worker |
| Decode | createImageBitmap |
| Interactive Editor | Konva（V2） |
| State | Zustand |
| Schema | Zod |
| EXIF | exifr |
| ZIP | fflate |
| Offline | PWA + Service Worker |
| AI Runtime | ONNX Runtime Web（V3） |
| GPU | WebGPU optional |
| HEIC | libheif WASM optional |
| Core | Pure TypeScript |

---

# 31. Why NOT Fabric / Pixi as Core

## Fabric

适合：

```text
Canva / whiteboard / design editor
```

而当前核心是：

```text
pipeline processor
```

所以：

`NO`

但未来可以重新评估。

---

## Pixi

适合：

```text
GPU-heavy
real-time
animation
shader
large sprite scene
```

BatchFrame V1 没有足够收益覆盖复杂度。

所以：

`NO FOR NOW`

---

## Konva

非常适合未来：

```text
interactive collage editor
```

但不适合作为 Batch Processor 的基础。

所以：

`EDITOR ONLY`

---

## Native Canvas / Canvas2D

简单、可预测、Worker 友好。

所以：

`YES — Core Renderer V1`

---

# 32. Development Roadmap

## Phase 0 — Architecture Spike

目标：

验证：

```text
File
↓
Worker
↓
createImageBitmap
↓
OffscreenCanvas
↓
Border
↓
JPEG Blob
```

只做 1 张图片。

通过标准：

```text
原图正确
方向正确
比例正确
质量正确
Worker 正常
```

---

# Phase 1 — Core MVP

实现：

```text
Document
RenderGraph
Canvas
Image
Fit
Border
Background
Export
```

此时不用漂亮 UI。

成功标志：

> 代码能批量处理 20 张照片。

---

# Phase 2 — Product UI

加入：

```text
Gallery
Preview
Sidebar
Preset
Canvas ratio
Border controls
Background
Export dialog
```

---

# Phase 3 — Batch System

实现：

```text
Job Queue
Concurrency
Progress
Cancel
Retry
Memory Cleanup
```

---

# Phase 4 — PWA

实现：

```text
Install
Offline
Cache
Update
```

---

# Phase 5 — Skill System

实现：

```text
Manifest
Registry
Skill JSON
Import
Export
Validation
```

---

# Phase 6 — Mobile

顺序：

```text
Android
↓
iOS
```

通过 Capacitor。

增加：

```text
native file picker
save to gallery
share
permissions
```

---

# Phase 7 — Creative Plugins

加入：

```text
EXIF
Text
Dots
Grain
Shadow
Sticker Outline
```

---

# Phase 8 — Collage

加入：

```text
Konva
drag
resize
rotate
layer
snap
```

---

# Phase 9 — AI

加入：

```text
ONNX Runtime
Segmentation
Cutout
Auto Layout
```

---

# 33. Performance Gates

不能只说：

> 感觉挺快。

必须建立 benchmark。

## Desktop Benchmark

测试照片：

```text
24MP JPEG
6000×4000
```

目标：

### Import 50 photos

UI：

```text
不得冻结
```

Thumbnail：

```text
渐进出现
```

Main thread：

```text
避免持续 >200ms blocking task
```

---

### Export

至少连续导出：

```text
20 × 24MP
```

不得：

```text
Crash
Out of Memory
明显内存持续增长
```

---

# 34. Mobile Benchmark

测试：

```text
12MP JPEG × 20
```

目标：

```text
导入成功
预览成功
连续导出成功
不会因为并发 Decode 崩溃
```

如果失败：

首先：

```text
降低并发
```

而不是降低成品质量。

---

# 35. Image Quality Gate

输入测试：

```text
Landscape
Portrait
Square
Panorama
Transparent PNG
Large JPEG
EXIF rotation
```

检查：

```text
无拉伸
无错误裁切
无方向错误
无明显色彩异常
无重复 JPEG 压缩
```

---

# 36. Plugin Gate

任何新插件进入 Core Distribution 前必须满足：

### Isolation

移除插件以后：

```text
Core仍可运行
```

### Schema

参数必须：

```text
Zod validated
```

### Batch

必须支持：

```text
single
batch
```

### Serialization

参数能够：

```text
JSON serialize
```

### Determinism

相同：

```text
input + parameters
```

应获得相同输出。

---

# 37. Dependency Gate

引入任何 npm dependency 前回答：

```text
1. 浏览器原生 API 能不能解决？
2. 是否进入核心运行链？
3. 包大小是多少？
4. 是否支持 Worker？
5. 是否依赖 DOM？
6. 是否同时支持 Safari / Chrome / WebView？
7. 最近是否维护？
8. 是否可以替换？
9. License 是否兼容？
```

如果只是为了：

> 少写 20 行代码

不要引入。

---

# 38. Feature Gate

任何功能必须回答：

### Value

是否明显减少用户操作？

### Batch

是否适用于批量？

### Local

能否本地实现？

### Modular

能否作为插件实现？

### Performance

会不会拖慢基础链路？

### Platform

Web / Android / iOS 是否可接受？

---

# 39. Stop Conditions

出现以下情况需要停止并重新设计：

```text
Core开始依赖React
Plugin需要直接访问整个App
每加一个效果都修改Renderer主逻辑
批处理必须通过DOM
所有照片同时decode
移动端必须重新实现整个core
Skill开始执行任意JavaScript
AI成为基础边框功能依赖
```

这些都是架构恶化信号。

---

# 40. MVP Success Definition

MVP 不是：

> 页面做得漂亮。

真正的 MVP 完成标准是：

用户能够：

```text
选择 30 张照片
↓
BatchFrame 正确读取
↓
选择「小红书 3:4 白边」
↓
预览
↓
一键应用
↓
本地批量处理
↓
导出
```

整个过程：

```text
无需注册
无需上传
无需服务器
无需专业修图软件
```

---

# 41. 最终技术判断

当前架构建议正式冻结为：

```text
React + TypeScript
        │
        ▼
Pure TS Core
        │
        ▼
Plugin Runtime
        │
        ▼
Render Graph
        │
        ▼
Canvas2D Renderer
        │
        ▼
Web Worker
        │
        ▼
OffscreenCanvas
```

平台：

```text
Web / PWA
     │
     ▼
Capacitor
 ┌───┴───┐
Android iOS
```

未来：

```text
                   ┌─ EXIF
                   ├─ Text
                   ├─ Dots
Core ─ Plugin ─────├─ Grain
                   ├─ Sticker
                   ├─ Collage
                   └─ AI Cutout
```

而：

```text
Skill
```

负责把这些能力组合起来。

---

# 42. Final Decision

## GO

立即开始：

**Web/PWA MVP。**

### 技术冻结

```text
React
TypeScript
Vite
Canvas2D
OffscreenCanvas
Web Worker
Zustand
Zod
exifr
fflate
```

### 移动端

```text
Capacitor
```

### 暂缓

```text
Konva
ONNX Runtime
WebGPU
libheif
```

这些全部预留接口，但不进入第一阶段核心依赖。

---

# 43. First Development Milestone

第一阶段不要先做 UI。

先建立一个：

```text
technical-spike/
```

只证明这条链：

```text
10 张 JPEG
      ↓
Worker Pool
      ↓
createImageBitmap
      ↓
Canvas Layout
      ↓
White Border
      ↓
OffscreenCanvas
      ↓
JPEG
      ↓
ZIP
```

如果这一条链：

```text
正确
稳定
不卡 UI
移动端浏览器可运行
```

则进入正式产品开发。

如果这一条链都跑不稳，则在任何 UI 工作开始之前调整架构。

**这是 BatchFrame 的第一个工程门禁。**

这版我已经把最重要的几个选择定死了：**Pure TS Core、Canvas2D 首发、Worker 批处理、Plugin/Skill 分离、Web-first + Capacitor、AI/WebGPU/HEIC 全部延后且插件化。**

下一步最值得做的不是继续写概念，而是直接进入 **Phase 0 技术 Spike**：建立仓库结构，并把「10 张照片 → Worker → 白边 → 批量导出」这条最小链真正跑通。这样很快就能验证这套架构是不是纸上谈兵。