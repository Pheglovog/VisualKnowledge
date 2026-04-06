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
    "ring_graph": {
        "name": "环形/链表可视化",
        "trigger": ["环形", "链表", "环", "cycle", "ring", "floyd", "判圈", "龟兔赛跑", "快慢指针", "循环链表", "环形链表", "约瑟夫"],
        "description": "展示环形链表、Floyd判圈算法、循环队列等需要闭合回路的图"
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
- **环形/链表可视化** (ring_graph): 环形链表、判圈算法、快慢指针、循环队列
- **通用流程图** (generic_pipeline): 流程, 步骤, pipeline

---

### ⚠️ 环形/链表可视化规范（ring_graph）

环形链表、判圈算法、循环队列等**必须用内嵌 SVG**，不要用 flex+文字箭头，因为环路无法用 → ↓ 闭合。

#### 核心原则
1. **节点位置用三角函数计算**：把环上的节点均匀放在圆上，用 `(cx + r*cos(θ), cy + r*sin(θ))` 定位
2. **非环节点排成一条直线**（tail 部分水平排列），最后一个非环节点指向环节点
3. **箭头用 SVG `<line>` + `<marker>` 箭头标记**
4. **整个 SVG 放在一个 HTML 容器 `<div>` 中**，配合标题和图例

#### 布局方法
```
tail 节点（水平直线）        环上的节点（圆形排列）
  3 → 2 → 1 → 5 ← 4
              ↓       ↑
              6 → 7 → 8
```

- tail 部分：从左到右水平排列，间距固定
- 环部分：用圆排列，节点均匀分布在圆周上
- 连线：SVG `<line>` 元素 + 箭头 marker

#### 节点和箭头样式
```css
/* 节点 */
.node {
  fill: #1e293b;           /* 深色填充 */
  stroke: #64748b;         /* 边框 */
  stroke-width: 2;
  r: 22;                   /* 半径 */
}
.node-label {
  fill: #f1f5f9;           /* 白色文字 */
  font-size: 14px;
  font-weight: bold;
  text-anchor: middle;
  dominant-baseline: central;
}

/* 箭头连线 */
.edge {
  stroke: #94a3b8;
  stroke-width: 2;
  marker-end: url(#arrow);
}

/* 特殊高亮 */
.node-entry { fill: #16a34a20; stroke: #16a34a; stroke-width: 3; }  /* 环入口 - 绿 */
.node-meet  { fill: #e11d4820; stroke: #e11d48; stroke-width: 3; }  /* 相遇点 - 红 */
.node-slow  { stroke: #d97706; stroke-width: 2.5; stroke-dasharray: 5,3; } /* 慢指针 - 橙 */
.node-fast  { stroke: #2563eb; stroke-width: 2.5; stroke-dasharray: 8,4; } /* 快指针 - 蓝 */
```

#### 高质量示例：Floyd 判圈算法

```html
<div style="max-width:860px;margin:0 auto;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:inherit;background:transparent;padding:20px">
<style>
.ring-legend{display:flex;gap:16px;justify-content:center;flex-wrap:wrap;margin-top:16px;font-size:12px}
.ring-legend span{display:flex;align-items:center;gap:4px}
.ring-dot{width:12px;height:12px;border-radius:50%;display:inline-block}
</style>

<h3 style="text-align:center;font-size:16px;margin-bottom:4px">Floyd 判圈算法 — 龟兔赛跑</h3>
<p style="text-align:center;font-size:12px;opacity:0.5;margin-bottom:16px">slow 走 1 步 · fast 走 2 步 · 必在环内相遇</p>

<svg viewBox="0 0 700 380" style="width:100%;max-width:700px;margin:0 auto;display:block">
<defs>
  <marker id="arrow" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
    <path d="M0,0 L8,3 L0,6" fill="#94a3b8"/>
  </marker>
  <marker id="arrow-green" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
    <path d="M0,0 L8,3 L0,6" fill="#16a34a"/>
  </marker>
</defs>

<!-- Tail 部分 (非环节点) -->
<circle cx="80" cy="80" r="22" fill="#1e293b" stroke="#64748b" stroke-width="2"/>
<text x="80" y="80" fill="#f1f5f9" font-size="14" font-weight="bold" text-anchor="middle" dominant-baseline="central">3</text>
<line x1="102" y1="80" x2="148" y2="80" stroke="#94a3b8" stroke-width="2" marker-end="url(#arrow)"/>

<circle cx="170" cy="80" r="22" fill="#1e293b" stroke="#64748b" stroke-width="2"/>
<text x="170" y="80" fill="#f1f5f9" font-size="14" font-weight="bold" text-anchor="middle" dominant-baseline="central">2</text>
<line x1="192" y1="80" x2="238" y2="80" stroke="#94a3b8" stroke-width="2" marker-end="url(#arrow)"/>

<circle cx="260" cy="80" r="22" fill="#1e293b" stroke="#64748b" stroke-width="2"/>
<text x="260" y="80" fill="#f1f5f9" font-size="14" font-weight="bold" text-anchor="middle" dominant-baseline="central">1</text>
<line x1="282" y1="80" x2="418" y2="240" stroke="#94a3b8" stroke-width="2" marker-end="url(#arrow)"/>

<!-- Tail → Entry 标注 -->
<text x="360" y="140" fill="#16a34a" font-size="11" text-anchor="middle">a 步（到入口）</text>

<!-- 环上的节点 (圆形排列，圆心 440,260 半径 100) -->
<!-- 5: θ=270° → (440, 160) -->
<circle cx="440" cy="160" r="22" fill="#16a34a20" stroke="#16a34a" stroke-width="3"/>
<text x="440" y="160" fill="#f1f5f9" font-size="14" font-weight="bold" text-anchor="middle" dominant-baseline="central">5</text>
<text x="440" y="130" fill="#16a34a" font-size="10" text-anchor="middle">入口</text>

<!-- 4: θ=342° → (535, 229) -->
<circle cx="535" cy="229" r="22" fill="#1e293b" stroke="#64748b" stroke-width="2"/>
<text x="535" y="229" fill="#f1f5f9" font-size="14" font-weight="bold" text-anchor="middle" dominant-baseline="central">4</text>

<!-- 6: θ=54° → (499, 341) -->
<circle cx="499" cy="341" r="22" fill="#1e293b" stroke="#64748b" stroke-width="2"/>
<text x="499" y="341" fill="#f1f5f9" font-size="14" font-weight="bold" text-anchor="middle" dominant-baseline="central">6</text>

<!-- 7: θ=126° → (381, 341) -->
<circle cx="381" cy="341" r="22" fill="#e11d4820" stroke="#e11d48" stroke-width="3"/>
<text x="381" y="341" fill="#f1f5f9" font-size="14" font-weight="bold" text-anchor="middle" dominant-baseline="central">7</text>
<text x="381" y="374" fill="#e11d48" font-size="10" text-anchor="middle">相遇点</text>

<!-- 8: θ=198° → (345, 229) -->
<circle cx="345" cy="229" r="22" fill="#1e293b" stroke="#64748b" stroke-width="2"/>
<text x="345" y="229" fill="#f1f5f9" font-size="14" font-weight="bold" text-anchor="middle" dominant-baseline="central">8</text>

<!-- 环上的箭头连线 (5→4→6→7→8→5) -->
<line x1="461" y1="152" x2="514" y2="219" stroke="#94a3b8" stroke-width="2" marker-end="url(#arrow)"/>
<line x1="555" y1="238" x2="518" y2="328" stroke="#94a3b8" stroke-width="2" marker-end="url(#arrow)"/>
<line x1="489" y1="357" x2="395" y2="353" stroke="#94a3b8" stroke-width="2" marker-end="url(#arrow)"/>
<line x1="363" y1="333" x2="328" y2="241" stroke="#94a3b8" stroke-width="2" marker-end="url(#arrow)"/>
<line x1="348" y1="211" x2="418" y2="171" stroke="#94a3b8" stroke-width="2" marker-end="url(#arrow)"/>

<!-- 距离标注 -->
<text x="388" y="310" fill="#94a3b8" font-size="10" text-anchor="middle">b</text>
<text x="330" y="276" fill="#94a3b8" font-size="10" text-anchor="middle">c</text>

<!-- 图例说明 -->
<text x="440" y="260" fill="#94a3b8" font-size="11" text-anchor="middle" font-style="italic">环长 c = b + 剩余</text>

<!-- 指针 -->
<text x="100" y="110" fill="#d97706" font-size="11" font-weight="bold">🐢 slow</text>
<text x="100" y="124" fill="#2563eb" font-size="11" font-weight="bold">🐇 fast</text>
<line x1="140" y1="107" x2="170" y2="90" stroke="#d97706" stroke-width="1.5" stroke-dasharray="4,2"/>
<line x1="140" y1="120" x2="170" y2="90" stroke="#2563eb" stroke-width="1.5" stroke-dasharray="6,3"/>
</svg>

<div class="ring-legend">
  <span><span class="ring-dot" style="background:#16a34a"></span> 环入口</span>
  <span><span class="ring-dot" style="background:#e11d48"></span> 相遇点</span>
  <span><span class="ring-dot" style="background:#d97706"></span> 🐢 慢指针</span>
  <span><span class="ring-dot" style="background:#2563eb"></span> 🐇 快指针</span>
</div>

<p style="text-align:center;font-size:13px;margin-top:16px;opacity:0.7">
<strong>关键公式：</strong>a + b = k·c → <strong>a = k·c − b</strong><br/>
从起点走 a 步 = 从相遇点走 a 步 → 必在<strong style="color:#16a34a">入口</strong>汇合
</p>
</div>
```

#### 环形图绘制要点（必读）
1. **先算坐标再画**：确定圆心 `(cx, cy)` 和半径 `r`，用 `θ = i × 360°/n` 计算每个节点位置
2. **箭头要指向圆心方向偏移**：`marker-end` 自动朝向，但起点要从节点边缘出发（不是圆心），终点停在目标节点边缘
3. **Tail 节点水平排列**，最后一个 tail 节点画一条指向环节点的箭头线
4. **闭合箭头**：最后一个环节点必须画箭头回到第一个环节点（这是关键！）
5. **节点数量 ≤ 8**：太多节点看不清，适当合并或简化
6. **用 `<text>` 标注距离**（a, b, c）和关键位置（入口、相遇点）
7. **viewBox 要足够大**：确保所有节点和标注都在可视区域内

### 使用规则
1. 涉及架构/流程/数据变换/神经网络结构/算法步骤 → **必须用 ```html**
2. 简单关系图/时序图/饼图 → 用 ```mermaid
3. 每个可视化要包含维度信息和简要说明，文字全部中文
4. **布局口诀：flex 排列不手算，方块用 class 样式，箭头用文字符号，颜色低透明度**"""
