SKILLS = {
    "transformer_architecture": {
        "name": "Transformer 架构图",
        "trigger": ["transformer", "注意力机制", "attention", "encoder-decoder", "自注意力", "self-attention"],
        "description": "展示 Transformer 完整架构的数据流"
    },
    "neural_network_flow": {
        "name": "神经网络流程图",
        "trigger": ["神经网络", "前向传播", "反向传播", "cnn", "卷积", "池化", "全连接"],
        "description": "展示神经网络各层数据处理流程"
    },
    "attention_detail": {
        "name": "注意力机制详解",
        "trigger": ["qkv", "query key value", "注意力计算", "注意力权重", "softmax"],
        "description": "详细展示 Q/K/V 计算过程"
    },
    "generic_pipeline": {
        "name": "通用流程图",
        "trigger": ["流程", "步骤", "过程", "pipeline", "workflow"],
        "description": "通用多步骤流程图"
    }
}


def get_skill_prompt():
    return """## 可视化 Skill 系统

系统支持三种可视化：```html（优先）、```mermaid、```svg。所有复杂可视化必须优先用 HTML。SVG 仅在特殊需要时使用。

### HTML 可视化规范（最重要！）

#### 1. 布局规则
- **只用 Flexbox 和 Grid，绝对不要用 position:absolute 或手算坐标**
- 水平排列：`display:flex; align-items:center; gap:16px; flex-wrap:wrap`
- 垂直排列：`display:flex; flex-direction:column; gap:12px`
- 居中：`justify-content:center`
- 禁止：position:absolute、硬编码像素坐标、负 margin

#### 2. 整体结构
```html
<div style="max-width:860px;margin:0 auto;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <h2 style="text-align:center;font-size:18px;margin-bottom:20px;color:inherit">标题</h2>
  <!-- 水平行 -->
  <div style="display:flex;align-items:center;justify-content:center;gap:16px;flex-wrap:wrap">
    <div class="block">模块A</div>
    <span style="color:inherit;opacity:0.3">→</span>
    <div class="block">模块B</div>
  </div>
</div>
```

#### 3. 方块样式（用 CSS class）
```css
.block{
  border-radius:10px; padding:12px 18px; text-align:center;
  border:1.5px solid; min-width:120px;
  transition:all .2s; cursor:pointer;
}
.block:hover{ filter:brightness(1.15); transform:translateY(-1px); }
.block .title{ font-size:13px; font-weight:700; }
.block .dim{ font-size:10px; opacity:0.4; margin-top:4px; font-family:monospace; }
```

#### 4. 配色（低透明度填充 + 主色边框）
| 用途 | 主色 | 用法 |
|------|------|------|
| 强调/输入/输出 | #d97706 | fill:#d9770612; border:#d97706 |
| 注意力/计算 | #2563eb | fill:#2563eb12; border:#2563eb |
| 归一化/残差 | #16a34a | fill:#16a34a12; border:#16a34a |
| FFN/Value | #7c3aed | fill:#7c3aed12; border:#7c3aed |
| Query/Wo | #e11d48 | fill:#e11d4812; border:#e11d48 |
| Key | #0d9488 | fill:#0d948812; border:#0d9488 |
| 辅助/通用 | #475569 | fill:#47556912; border:#475569 |

#### 5. 箭头和连线
- 水平箭头用文字 `→` 或 `⟶`（opacity:0.3），不要画 SVG 线条
- 垂直箭头用 `↓` 或 `⬇`，放在 flex-column 的 gap 中
- 简单直接，不要复杂化

#### 6. 主题适配
- 背景色用 `transparent`（跟随页面主题）
- 文字颜色用 `color:inherit`（自动适配深浅色）
- 方块填充用低透明度（`#d9770612` 即 hex+alpha），深浅色都好看

#### 7. 交互
- `.block:hover` 加 `filter:brightness(1.15)` 和 `transform:translateY(-1px)` 微动画
- 可选：点击展开详情（用 `<details><summary>` 原生 HTML）

### 高质量 HTML 示例（Transformer 数据流）

```html
<div style="max-width:860px;margin:0 auto;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:inherit;background:transparent">
<style>
.b{border-radius:10px;padding:12px 18px;text-align:center;border:1.5px solid;min-width:120px;transition:all .2s;cursor:pointer}
.b:hover{filter:brightness(1.15);transform:translateY(-1px)}
.b .t{font-size:13px;font-weight:700}
.b .d{font-size:10px;opacity:.4;margin-top:4px;font-family:monospace}
.row{display:flex;align-items:center;justify-content:center;gap:14px;flex-wrap:wrap;margin-bottom:16px}
.col{display:flex;flex-direction:column;align-items:center;gap:8px;margin-bottom:16px}
.arrow{font-size:18px;opacity:.25;color:inherit}
.sec{font-size:11px;opacity:.4;font-weight:600;margin-bottom:6px;text-align:center}
.c-amber{background:#d9770612;border-color:#d97706}
.c-blue{background:#2563eb12;border-color:#2563eb}
.c-green{background:#16a34a12;border-color:#16a34a}
.c-purple{background:#7c3aed12;border-color:#7c3aed}
.c-rose{background:#e11d4812;border-color:#e11d48}
.c-teal{background:#0d948812;border-color:#0d9488}
.c-slate{background:#47556912;border-color:#475569}
.c-orange{background:#ea580c12;border-color:#ea580c}
</style>

<h2 style="text-align:center;font-size:18px;margin-bottom:20px">Transformer 架构 — 数据流</h2>

<div class="sec">输入处理</div>
<div class="row">
  <div class="b c-slate"><div class="t">输入序列</div><div class="d">"我 喜欢 AI"</div></div>
  <span class="arrow">→</span>
  <div class="b c-amber"><div class="t">Token Embedding</div><div class="d">词→向量 512维</div></div>
  <span class="arrow">→</span>
  <div class="b c-orange"><div class="t">位置编码</div><div class="d">sin/cos</div></div>
  <span class="arrow">→</span>
  <div class="b c-amber" style="border-style:dashed"><div class="t">输入表示</div></div>
</div>

<span class="arrow">↓</span>

<div class="sec">编码器 × N 层</div>
<div class="col">
  <div class="b c-blue" style="min-width:340px"><div class="t">多头自注意力</div><div class="d">Q·Kᵀ/√d → softmax → ·V</div></div>
  <span class="arrow">↓</span>
  <div class="b c-green" style="min-width:340px"><div class="t">Add & LayerNorm</div><div class="d">残差连接 + 层归一化</div></div>
  <span class="arrow">↓</span>
  <div class="b c-purple" style="min-width:340px"><div class="t">前馈网络 FFN</div><div class="d">512 → 2048 → 512</div></div>
  <span class="arrow">↓</span>
  <div class="b c-green" style="min-width:340px"><div class="t">Add & LayerNorm</div></div>
</div>

<span class="arrow">↓</span>

<div class="sec">输出</div>
<div class="row">
  <div class="b c-slate"><div class="t">Linear</div><div class="d">512 → vocab</div></div>
  <span class="arrow">→</span>
  <div class="b c-amber"><div class="t">Softmax</div></div>
  <span class="arrow">→</span>
  <div class="b c-rose"><div class="t">预测输出</div></div>
</div>
</div>
```

### 可用的 Skill 类型
- **Transformer 架构图** (transformer_architecture): transformer, attention, 自注意力
- **神经网络流程图** (neural_network_flow): 神经网络, CNN, 卷积, 池化
- **注意力机制详解** (attention_detail): QKV, 注意力权重, softmax
- **通用流程图** (generic_pipeline): 流程, 步骤, pipeline

### 使用规则
1. 涉及架构/流程/数据变换/神经网络结构/算法步骤 → **必须用 ```html**
2. 简单关系图/时序图/饼图 → 用 ```mermaid
3. 每个可视化要包含维度信息和简要说明，文字全部中文
4. **布局口诀：flex 排列不手算，方块用 class 样式，箭头用文字符号，颜色低透明度**"""
