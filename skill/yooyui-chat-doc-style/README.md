# YOOYUI Doc Style

一个可独立发布的 pastel glassmorphism 文档页 skill 包。

## 包含内容

- `SKILL.md`：主 skill 说明
- `agents/openai.yaml`：agent 展示与默认提示
- `references/style-guide.md`：视觉系统与模块说明
- `references/page-recipes.md`：不同页面类型的结构配方
- `templates/base-doc-page.html`：基础页面骨架
- `templates/docs-theme.base.css`：基础主题文件
- `examples/landing-sample.html`：入口页示例
- `examples/about-sample.html`：About 页示例
- `examples/announcement-sample.html`：公告页示例
- `examples/privacy-sample.html`：隐私页示例
- `examples/agreement-sample.html`：协议页示例

## 使用方式

### 如果当前项目已有共享主题

直接把本包里的风格规则和页面配方映射到现有 CSS / HTML 结构中，优先复用原有主题系统。

### 如果当前项目没有共享主题

直接复制：

- `templates/base-doc-page.html`
- `templates/docs-theme.base.css`

然后再按 `references/page-recipes.md` 调整页面结构与内容。
