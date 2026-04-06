/**
 * AssistantMessage - AI 消息组件
 *
 * 渲染头像 + ContentSegment 列表（TextPart / MermaidWidget / HtmlWidget / SvgWidget）
 * + TypingIndicator（流式输出中时）
 */

import { html } from 'htm/react';
import { TextPart } from './TextPart.jsx';
import { TypingIndicator } from './TypingIndicator.jsx';
import { MermaidWidget } from './widgets/MermaidWidget.jsx';
import { HtmlWidget } from './widgets/HtmlWidget.jsx';
import { SvgWidget } from './widgets/SvgWidget.jsx';

export function AssistantMessage({ message, isStreaming, onFullscreen }) {
  const segments = message.segments || [];

  const handleMermaidZoom = (svgContent, chartType) => {
    if (onFullscreen) {
      onFullscreen({ widgetType: 'mermaid', title: chartType, content: svgContent });
    }
  };

  const handleHtmlFullscreen = (html) => {
    if (onFullscreen) {
      onFullscreen({ widgetType: 'html', title: '交互式可视化', content: html });
    }
  };

  const handleSvgZoom = (svgContent) => {
    if (onFullscreen) {
      onFullscreen({ widgetType: 'svg', title: 'SVG 可视化', content: svgContent });
    }
  };

  return html`
    <div class="message assistant">
      <div class="avatar">C</div>
      <div class="content">
        ${segments.map((seg, i) => {
          switch (seg.type) {
            case 'text':
              return html`<${TextPart} key=${seg.id || i} content=${seg.content} isStreaming=${isStreaming && i === segments.length - 1} />`;
            case 'mermaid':
              return html`<${MermaidWidget} key=${seg.id || i} code=${seg.content} onZoom=${handleMermaidZoom} />`;
            case 'html':
              return html`<${HtmlWidget} key=${seg.id || i} html=${seg.content} onFullscreen=${handleHtmlFullscreen} />`;
            case 'svg':
              return html`<${SvgWidget} key=${seg.id || i} svg=${seg.content} onZoom=${handleSvgZoom} />`;
            default:
              return null;
          }
        })}
        ${isStreaming ? html`<${TypingIndicator} />` : ''}
      </div>
    </div>
  `;
}
