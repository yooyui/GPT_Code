---
name: yooyui-chat-doc-style
description: 'Use when the user wants a pastel glassmorphism static documentation page family with soft motion, readable information architecture, modular sections, and a unified visual rhythm across landing pages, about pages, announcements, privacy policies, agreements, or related long-form docs.'
---

# YOOYUI Doc Style

## Overview

这个版本是**可独立发布 / 可脱离仓库使用**的 skill。它的目标不是依赖某个现成项目页面，而是把一套可复用的**糖果色渐变、玻璃拟态、轻动效、文档可读性优先**页面语言，整理成：

- 可直接阅读的风格规则
- 可直接复制的基础模板
- 可直接启动的基础 CSS
- 可直接参考的示例页

它支持两种使用模式：

1. **Reuse mode**：当前工作区已经有共享主题文件或同风格页面家族，优先在原系统里扩展。
2. **Bootstrap mode**：当前工作区没有现成页面家族，直接从 skill 自带模板开始。

适合场景：

- 新增同风格静态说明页
- 把已有说明页改成同系列视觉
- 规划多页面静态文档站的统一视觉语言
- 需要从零起一套浅色玻璃拟态文档页模板
- 需要先分析风格，再给出可执行 HTML/CSS 改写方案

如果用户只是要普通企业官网、深色后台、极简法务纯文本页，不要套用这个 skill。

## Bundled assets

这个 skill 自带以下独立资产：

- 风格规则：`references/style-guide.md`
- 页面配方：`references/page-recipes.md`
- 基础模板：`templates/base-doc-page.html`
- 基础主题：`templates/docs-theme.base.css`
- 示例页：`examples/landing-sample.html`
- 示例页：`examples/about-sample.html`
- 示例页：`examples/announcement-sample.html`
- 示例页：`examples/privacy-sample.html`
- 示例页：`examples/agreement-sample.html`

## Quick start

1. 先检查当前工作区是否已经有共享主题文件，例如 `docs-theme.css`、统一导航、稳定模块类名。
2. **如果已有主题**，优先复用原有 CSS 和模块名，不要再平行造第二套样式系统。
3. **如果没有主题**，直接复制：
   - `templates/base-doc-page.html`
   - `templates/docs-theme.base.css`
4. 根据页面任务选择模块配方，见 `references/page-recipes.md`。
5. 需要快速起页时，可以从 `examples/landing-sample.html` 或 `examples/about-sample.html` 开始改。
6. 如果要按具体页型直接起稿，优先使用对应示例页，而不是把所有页面都从同一张模板硬改出来。

## Working modes

### A. Reuse mode

适用于当前工作区已经有共享主题、组件命名和多页面骨架。

规则：

- 优先延续原有主题文件
- 优先延续原有模块类名
- 通过变量或局部覆盖改 accent，不要复制整份 CSS
- 保持相对路径链接，方便静态部署

### B. Bootstrap mode

适用于工作区没有现成页面家族，或者用户明确要从零起稿。

规则：

- 用 `templates/base-doc-page.html` 起页
- 用 `templates/docs-theme.base.css` 做主主题
- 新页面尽量只在 `body.page-*` 上改变量，不要每页复制一大坨样式
- 先按页面配方组织骨架，再填文案

## Core rules

### 1. 视觉基因必须成套出现

这套风格不是只换个渐变色，而是以下元素共同成立：

- 暖白到粉蓝的浅色渐变底
- 固定定位的 `grid`、`sparkles`、`energy-lines`、`bg-aurora`、`bg-wave`、`bg-bubbles`
- 半透明白色卡片与模糊背景
- 高饱和 accent 只用于标题渐变、标签、徽章、下划线、装饰 ribbon
- 大标题偏品牌海报感，正文偏说明文档感

设计令牌、模块说明与边界见 `references/style-guide.md`。

### 2. 页面结构要有“先速读、后细读”的节奏

默认骨架：

1. 背景装饰层
2. `main.page`
3. `nav.doc-nav`（首页可弱化）
4. `section.hero`
5. 1 到 3 组中段信息模块
6. 强调块：`quote-box` 或 `notice`
7. `site-footer`

不要一开始就堆长段正文。先让用户看到摘要、边界、要点，再进入细节。

### 3. 文案气质

- 中文为主
- 英文大写短标签和少量日文片假名做气质点缀
- 语气轻盈、清楚、可扫读
- 即使是协议页和隐私页，也先给用户一个“速读入口”

推荐写法：

- hero 小标签：全大写英文短语
- 标题副标：英文短词或日文点缀
- 卡片眉标：`01 / Position`、`Data Path`、`Peak Time`
- 正文：短段落、少套话、把边界说清楚

## Page workflow

按页面任务选模块，而不是所有页面照搬同一版：

- 首页 / 入口页：更强 hero，更少导航，更像品牌入口
- About：`marquee-banner` + `detail-grid` + `cards` + `quote-box`
- Announcement：`marquee-banner` + `timeline-board` + `cards` + `notice`
- Privacy：`timeline-board` + `cards` + `notice`
- Agreement：`detail-grid` + `cards` + `notice`

模块顺序、适配场景与裁剪规则见 `references/page-recipes.md`。

## Implementation guardrails

### Reuse before invent

- 如果已有共享主题文件，优先扩展变量和模块，不要并行写第二份主题 CSS。
- 多页面场景优先共享一个主题文件，再在 `body.page-*` 上切换 accent。
- 导航和页面链接尽量保持相对路径，延续静态部署兼容性。

### Motion should stay soft

- 允许漂浮、呼吸、渐显、轻微旋转、shine sweep
- 不要用大位移、高频闪烁、强缩放
- 动效是为了空气感和能量感，不是做活动页炫技

### Cards are still documentation

- 卡片承载的是说明信息，不是后台 KPI
- 可以用 badge、eyebrow、icon 增强扫读，但正文必须能独立读懂
- 每张卡尽量只讲一个核心点，不要塞成条款墙

### Keep the family resemblance

做新页面时，至少保留下面四项里的三项：

1. hero 双栏结构
2. 玻璃拟态卡片系统
3. 糖果色强调标签和徽章
4. 中英或中日混排微文案

## Delivery checklist

交付前至少检查：

- 页面是否仍然是浅色、轻盈、糖果感，而不是通用商业蓝
- hero 是否一眼就能看出主题、边界和速读重点
- 卡片与时间线是否真的可扫读
- 若是多页面场景，新旧页面是否像同一个站
- 手机宽度下是否能自然堆叠
- 若使用 bootstrap mode，是否已经把公共主题提取回共享 CSS
- 若使用 reuse mode，是否继续复用原有主题文件与相对链接

## References

- 设计令牌与模块说明：`references/style-guide.md`
- 页面配方与页面类型映射：`references/page-recipes.md`
- 基础模板：`templates/base-doc-page.html`
- 基础主题：`templates/docs-theme.base.css`
- 示例起页：`examples/landing-sample.html`
- 示例起页：`examples/about-sample.html`
- 示例起页：`examples/announcement-sample.html`
- 示例起页：`examples/privacy-sample.html`
- 示例起页：`examples/agreement-sample.html`
