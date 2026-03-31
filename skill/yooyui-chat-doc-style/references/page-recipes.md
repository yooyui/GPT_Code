# Page Recipes

## How to choose a recipe

先判断页面的核心任务：

- 让用户进入体系：用首页 / 入口页
- 介绍项目与设计观：用 About
- 同步更新和提醒：用 Announcement
- 解释数据流与处理规则：用 Privacy
- 说明使用边界和责任：用 Agreement

如果工作区没有任何起始页面，优先从：

- `templates/base-doc-page.html`
- `examples/landing-sample.html`
- `examples/about-sample.html`
- `examples/announcement-sample.html`
- `examples/privacy-sample.html`
- `examples/agreement-sample.html`

三者之一开始。

## 1. Landing / Home

建议起点：`examples/landing-sample.html`

特点：

- hero 权重最高
- 可以没有完整 `doc-nav`
- 页面更像入口海报 + 条款速读

推荐顺序：

1. 背景层
2. hero
3. `section-head`
4. `cards`
5. `notice`

推荐内容：

- hero 直接说清服务定位
- 右侧 panel 给出 4 个速读点
- cards 展开条款、风险、费用、来源、隐私、免责

## 2. About

建议起点：`examples/about-sample.html`

推荐顺序：

1. `doc-nav`
2. hero
3. `marquee-banner`
4. `section-head`
5. `detail-grid`
6. `cards`
7. `quote-box`
8. `notice`
9. footer

适合内容：

- 项目定位
- 为什么采用这套页面风格
- 来源与致谢
- 后续扩展方向

## 3. Announcement

建议起点：`examples/announcement-sample.html`

推荐顺序：

1. `doc-nav`
2. hero
3. `marquee-banner`
4. `section-head`
5. `timeline-board`
6. `section-head`
7. `cards`
8. `notice`
9. footer

适合内容：

- 最近更新
- 运行提醒
- 高峰期说明
- 变更通知机制
- 联系与反馈渠道

## 4. Privacy

建议起点：`examples/privacy-sample.html`

推荐顺序：

1. `doc-nav`
2. hero
3. `marquee-banner`
4. `section-head`
5. `timeline-board`
6. `section-head`
7. `cards`
8. `quote-box`
9. `notice`
10. footer

适合内容：

- 数据流向
- 日志、链路、上游模型关系
- 收集目的
- 保护方式
- 用户选择权

写法重点：

- 用路径和阶段解释复杂概念
- 不要只有抽象定义和套话

## 5. Agreement

建议起点：`examples/agreement-sample.html`

推荐顺序：

1. `doc-nav`
2. hero
3. `marquee-banner` 或 `detail-grid`
4. `section-head`
5. `detail-grid`
6. `cards`
7. `quote-box`
8. `notice`
9. footer

适合内容：

- 服务范围
- 费用
- 使用要求
- 稳定性免责
- 合规与接受方式

写法重点：

- 先给条款结构速读
- 再展开卡片
- 最后用高对比 `notice` 收束风险提醒

## Recipe adjustments

### If content is short

- 保留 hero
- 中段只留一种模块，不要为了像模板而硬塞板块

### If content is long

- 用 `section-head` 分段
- 先摘要，再细化
- 保持每一屏都能读到一个明确主题

### If using an existing theme

- 保留当前项目里已经稳定存在的命名与骨架
- 用配方决定模块顺序，不强制复制 starter HTML 的全部类名

### If adding a new page type

仍然优先复用：

- `doc-nav`
- hero 双栏
- 2 到 4 列摘要模块
- `cards`
- `notice` 或 `quote-box`

新页面可以换内容，但不要换掉这套节奏。
