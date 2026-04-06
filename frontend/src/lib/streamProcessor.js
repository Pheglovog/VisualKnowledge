/**
 * StreamProcessor - 纯函数式流式文本解析器
 *
 * 将 SSE 流式文本按代码块边界（```mermaid / ```html / ```svg）拆分为 ContentSegment 列表。
 * 完全无 DOM 依赖，可在任何环境运行和测试。
 *
 * State Machine:
 *   text ──[检测到 ```lang]──> codeblock ──[检测到 ``` 关闭]──> text
 */

let _uidCounter = 0;
function _nextId(prefix = 'seg') {
  return `${prefix}_${Date.now()}_${++_uidCounter}`;
}

export class StreamProcessor {
  constructor() {
    this.reset();
  }

  /**
   * 重置状态机（用于开始处理新一条消息）
   */
  reset() {
    this._phase = 'text';          // 'text' | 'codeblock'
    this._currentLang = '';         // '' | 'mermaid' | 'html' | 'svg'
    this._buffer = '';              // 当前阶段累积的文本缓冲区
    this._tickCount = 0;            // 反引号计数器
    this._segments = [];            // 已完成的段列表
    this._activeText = '';          // 当前活跃的文字段内容
  }

  /**
   * 输入新的文本块
   * @param {string} chunk - 从 SSE 接收的新文本片段
   */
  feed(chunk) {
    // 过滤 [VISUALIZE:] 标签
    chunk = chunk.replace(/^\[VISUALIZE:\s*(yes|no)\]\s*\n?/m, '');

    if (this._phase === 'text') {
      this._activeText += chunk;

      // 检测代码块起始
      const hit = this._detectBlockStart(chunk);
      if (hit) {
        this._phase = 'codeblock';
        this._currentLang = hit.lang;
        this._buffer = '';
        this._tickCount = 0;

        // 冻结当前文字为 text segment
        const before = this._activeText.substring(0, hit.absIdx);
        if (before.trim()) {
          this._segments.push({
            id: _nextId('txt'),
            type: 'text',
            content: before,
            renderedContent: null,
            renderStatus: 'pending',
            renderError: null,
          });
        }

        // 创建新的 codeblock segment 占位（content 将在 codeblock 阶段累积）
        this._segments.push({
          id: _nextId(this._currentLang),
          type: this._currentLang,
          content: '',
          renderedContent: null,
          renderStatus: 'pending',
          renderError: null,
        });

        // 重置文字累积
        this._activeText = '';
        return;
      }

      // 仍在 text 阶段，无需特殊处理（调用方会 getSegments）
      return;
    }

    // === codeblock 阶段 ===
    for (let i = 0; i < chunk.length; i++) {
      const ch = chunk[i];
      if (ch === '`') {
        this._tickCount++;
      } else {
        if (this._tickCount >= 3) {
          // 检测到代码块关闭
          this._phase = 'text';
          this._tickCount = 0;

          // 更新当前 codeblock segment 的 content
          const codeSeg = this._segments[this._segments.length - 1];
          if (codeSeg) {
            codeSeg.content = this._buffer;
          }

          this._buffer = '';
          this._currentLang = '';

          // 开始新的文字累积
          this._activeText = '';
          continue; // 跳过当前字符（它是关闭 ``` 的一部分）
        }
        if (this._tickCount > 0) {
          this._buffer += '`'.repeat(this._tickCount);
          this._tickCount = 0;
        }
        this._buffer += ch;
      }
    }
  }

  /**
   * 获取当前所有已解析的段列表
   * 包含：
   * - 已完成冻结的 segments
   * - 当前活跃的 text 段（如果有的话，作为最后一个 segment 返回）
   * - 当前活跃的 codeblock 段（如果在 codeblock 阶段）
   * @returns {Array} ContentSegment[]
   */
  getSegments() {
    // 返回 segments 的快照，包含当前活跃段
    const result = [...this._segments];

    // 更新活跃的 codeblock segment，将流式缓冲区内容暴露给组件
    if (this._phase === 'codeblock') {
      const lastSeg = result[result.length - 1];
      if (lastSeg && (lastSeg.type === 'mermaid' || lastSeg.type === 'html' || lastSeg.type === 'svg')) {
        lastSeg.content = this._buffer;
      }
    }

    // 如果有活跃的文字段且不在 segments 中，追加它
    if (this._phase === 'text' && this._activeText) {
      // 检查是否已有未完成的 text segment（最后一个 segment 可能是待更新的 text）
      const lastSeg = result[result.length - 1];
      if (lastSeg && lastSeg.type === 'text' && lastSeg.renderStatus === 'pending' && !lastSeg.content) {
        // 更新已有的空 text segment
        lastSeg.content = this._activeText;
      } else if (this._activeText.trim()) {
        result.push({
          id: _nextId('txt_live'),
          type: 'text',
          content: this._activeText,
          renderedContent: null,
          renderStatus: 'pending',
          renderError: null,
        });
      }
    }

    return result;
  }

  /**
   * 结束流式解析，返回最终段列表
   * 处理未闭合的 codeblock 等边缘情况
   * @returns {Array} ContentSegment[]
   */
  finalize() {
    // 如果仍在 codeblock 阶段，强制结束
    if (this._phase === 'codeblock') {
      const codeSeg = this._segments[this._segments.length - 1];
      if (codeSeg) {
        codeSeg.content = this._buffer;
      }
      this._phase = 'text';
    }

    // 收集最终文字段
    if (this._activeText.trim()) {
      // 去重：检查最后是否已有相同内容的 text segment
      const lastSeg = this._segments[this._segments.length - 1];
      if (!(lastSeg && lastSeg.type === 'text' && lastSeg.content === this._activeText)) {
        this._segments.push({
          id: _nextId('txt_final'),
          type: 'text',
          content: this._activeText,
          renderedContent: null,
          renderStatus: 'pending',
          renderError: null,
        });
      }
    }

    return this._segments;
  }

  /**
   * 在最新文本中检测代码块起始标记
   * @param {string} newChunk - 最新接收到的文本块
   * @returns {{ lang: string, absIdx: number } | null}
   * @private
   */
  _detectBlockStart(newChunk) {
    const lookback = this._activeText.substring(
      Math.max(0, this._activeText.length - 30)
    );
    for (const lang of ['mermaid', 'html', 'svg']) {
      const marker = '```' + lang;
      const idx = lookback.lastIndexOf(marker);
      if (idx !== -1) {
        const absIdx = this._activeText.length - lookback.length + idx;
        return { lang, absIdx };
      }
    }
    return null;
  }
}
