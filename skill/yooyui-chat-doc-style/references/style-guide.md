# Style Guide

## Design target

这份风格说明是**独立于任何特定仓库结构**的。  
你可以把它用于两类场景：

1. 当前项目已经有共享主题：把这里的令牌和模块映射回你自己的 CSS。
2. 当前项目没有共享主题：直接从 `templates/docs-theme.base.css` 启动。

## Bundled starter assets

- `templates/base-doc-page.html`：最小可运行页面骨架
- `templates/docs-theme.base.css`：基础主题文件
- `examples/landing-sample.html`：入口页示例
- `examples/about-sample.html`：About 页示例

## Visual DNA

### 1. Base mood

- 关键词：糖果色、玻璃拟态、空气感、轻科幻、文档友好
- 第一眼感受应当是明亮、轻盈、可进入
- 第二层感受才是“这是条款、说明或公告”

### 2. Color system

基础颜色建议：

- `--bg-1: #fff8f2`
- `--bg-2: #ffe3eb`
- `--bg-3: #dff7ff`
- `--ink: #24304a`
- `--ink-soft: #5b6785`
- `--card: rgba(255, 255, 255, 0.82)`
- `--line: rgba(255, 255, 255, 0.65)`
- `--accent-1: #ff5c8a`
- `--accent-2: #1db9ff`
- `--accent-3: #ffb347`
- `--mint: #4ee0c3`
- `--yellow: #ffd65c`
- `--indigo: #6d7dff`

常用 accent 组合：

- Landing / Agreement：粉 + 蓝 + 橙
- About：橙 + 薄荷绿 + 蓝
- Announcement：橙 + 黄 + 粉
- Privacy：蓝 + 薄荷绿 + 靛蓝

规则：

- 背景要浅，强调色只占少数面积
- 标题、badge、下划线、ribbon、状态标签才用高饱和渐变
- 正文色必须稳重，不要跟背景抢视觉

## Background layers

页面不是纯白底，而是多层叠加：

1. 远景：整页浅色多重 radial + linear gradient
2. 中景：`grid`
3. 中景：`sparkles`
4. 中景：`energy-lines`
5. 中景：`bg-aurora`
6. 中景：`bg-wave`
7. 近景：`bg-bubbles`

原则：

- 这些层固定定位、不可交互、透明度低
- 作用是制造空间感，不是挡正文

## Layout rhythm

- 主容器：`main.page`
- 版心特征：居中、大留白、呼吸感明显
- 圆角普遍偏大：18 / 22 / 24 / 28 / 30 / 32
- 阴影柔和偏扩散，不要重压黑边
- 卡片间距通常在 16 到 28px

## Navigation

`doc-nav` 是这组页面的稳定识别点：

- sticky 顶部悬浮
- 半透明白底 + blur
- 左侧品牌名，右侧胶囊导航
- active 链接要明显高亮，但仍保持圆润

除首页外，新增页面默认应带这类导航。

## Hero formula

hero 是最重要的统一骨架，通常包含：

1. `hero-top`：2 到 3 个 tag
2. `hero-grid`：左文右板
3. 左侧 `hero-copy`
4. 右侧 `hero-panel`
5. 装饰层：`hero-glow`、`hero-orbits`、`hero::after` ribbon

左侧文案规则：

- `lead`：全大写短语，像章节引导
- `h1`：两段式标题，第二行常做渐变强调
- `title-note`：中英或中日混排副标
- 一段 2 到 4 行的总述
- 2 到 3 个 `hero-chip`

右侧面板规则：

- `panel-title`
- `status-grid`
- 4 个 `status-item`
- 每个 item 有 label、strong、badge、短说明
- 底部可接 `summary`

## Reusable modules

### cards

适用于：核心条款、能力说明、边界说明、要点拆分。

结构：

- `card-top`
- `icon`
- `eyebrow`
- `h3`
- `p` 或 `ul`

表现：

- hover 有轻微上浮与 shine
- icon 用浅渐变底
- 一张卡只讲一个中心信息

### marquee-banner

适用于三列速读摘要：

- 英文大写 label
- 中文主结论
- 下一行补一小段解释

### timeline-board

适用于公告、数据链路、流程说明、更新记录：

- 左侧时间或阶段点
- 垂直渐变线
- 每项突出节点名，再补说明

### detail-grid

适用于三列项目画像、Why / What / Next、条款分类速读。

### quote-box

适用于一句立场总结、品牌宣言、边界提醒。

### notice

适用于最后的重点提醒或高对比结论：

- 比普通卡片更深、更重
- 一页通常一个就够

## Typography and copy

- 字体：系统中文 sans，强调处混排英文
- 标题很大，但正文依然以可读性优先
- 常见混排方式：
  - 中文主标题 + 英文副标
  - 中文主标题 + 日文片假名点缀
  - 英文眉标 + 中文正文

文案气质：

- 不官腔
- 不堆术语
- 要把边界、提醒、风险、用途说清楚
- 允许带一点品牌语感，但不要空泛

## Motion

常见动效关键词：

- `drift`
- `revealUp`
- `revealSoft`
- `auroraFloat`
- `waveShift`
- `twinkle`
- `ribbonShift`
- `glowPulse`
- `spinRing`
- `panelFloat`
- `badgeBounce`
- `shineSweep`
- `underlineFlow`
- `cardShine`
- `iconBob`

原则：

- 首屏模块分批 reveal
- 长时间运行的动效保持慢速、低幅度
- 页面看起来是“活的”，但不能喧闹

## Portability rules

- 不要在 skill 文档、模板和示例里写死某个仓库的文件路径
- 所有 starter asset 之间尽量使用相对路径
- 公共样式收敛到一份主题文件，再用页面级变量覆盖 accent
- 如果工作区已有现成主题，优先把这里的模块映射到现有系统，而不是把整个 starter CSS 生搬过去

## Do / Don't

### Do

- 让法律和说明内容先被看见，再被读完
- 用模块化摘要降低理解门槛
- 用 accent 差异区分页面主题
- 维持整站统一的玻璃拟态和装饰背景

### Don't

- 不要改成深色后台科技风
- 不要去掉所有装饰后只剩普通白卡片
- 不要写成纯法务条文墙
- 不要让动画抢走正文可读性
- 不要引入明显不合群的按钮、表格和阴影体系
