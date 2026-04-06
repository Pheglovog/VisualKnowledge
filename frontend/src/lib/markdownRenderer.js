/**
 * Markdown + KaTeX Renderer
 *
 * 封装 marked.parse 和 katex 渲染逻辑。
 * 依赖全局变量: marked, katex（通过 CDN <script> 加载）
 */

/**
 * 将原始文本渲染为 HTML
 * 处理：[VISUALIZE:] 标签移除、代码块过滤、marked 解析、KaTeX 公式渲染
 *
 * @param {string} text - 原始 Markdown 文本
 * @returns {string} 渲染后的 HTML 字符串
 */
export function renderMarkdown(text) {
  let cleaned = text;

  // 移除可视化标签
  cleaned = cleaned.replace(/^\[VISUALIZE:\s*(yes|no)\]\s*\n?/m, '');

  // 移除可视化代码块（由独立 Widget 渲染器处理）
  cleaned = cleaned.replace(/```mermaid\s*\n[\s\S]*?```/g, '');
  cleaned = cleaned.replace(/```mermaid[\s\S]*$/g, '');
  cleaned = cleaned.replace(/```html\s*\n[\s\S]*?```/g, '');
  cleaned = cleaned.replace(/```html[\s\S]*$/g, '');
  cleaned = cleaned.replace(/```svg\s*\n[\s\S]*?```/g, '');
  cleaned = cleaned.replace(/```svg[\s\S]*$/g, '');

  // 移除 visualization placeholder 注释
  const phRegex = new RegExp('<' + '!-- visualization placeholder -->\\s*', 'g');
  cleaned = cleaned.replace(phRegex, '');

  try {
    const html = marked.parse(cleaned);
    return renderMath(html);
  } catch (e) {
    // fallback: 转义后返回纯文本
    if (typeof escapeHtml !== 'undefined') {
      return escapeHtml(cleaned);
    }
    return cleaned
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }
}

/**
 * 在 HTML 中渲染 KaTeX 数学公式
 *
 * @param {string} html - 包含 $...$ / $$...$$ 标记的 HTML
 * @returns {string} 渲染后的 HTML
 */
export function renderMath(html) {
  if (typeof katex === 'undefined') return html;

  try {
    // 块级公式 $$...$$
    let result = html.replace(/\$\$([\s\S]+?)\$\$/g, (_, tex) => {
      try {
        return katex.renderToString(tex.trim(), { displayMode: true, throwOnError: false });
      } catch {
        return `$$${tex}$$`;
      }
    });

    // 行内公式 $...$
    result = result.replace(/\$([^\$\n]+?)\$/g, (_, tex) => {
      try {
        return katex.renderToString(tex.trim(), { displayMode: false, throwOnError: false });
      } catch {
        return `$${tex}$`;
      }
    });

    return result;
  } catch (e) {
    return html;
  }
}
