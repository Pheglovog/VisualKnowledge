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
        "name": "环形/链表可视化（JS动态计算）",
        "trigger": ["环形", "链表", "环", "cycle", "ring", "floyd", "判圈", "龟兔赛跑", "快慢指针", "循环链表", "环形链表", "约瑟夫"],
        "description": "用 JS 动态计算坐标画环形链表/Floyd判圈/循环队列，绝不手算坐标"
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

### ⚠️ 环形/链表可视化规范（ring_graph）— 矩形环 + JS 动态计算

**核心原则：用矩形画环，不用圆形！** 环形结构画成矩形路径（上排→右下→下排←左上闭合），坐标由 JS 自动计算。

#### 为什么用矩形？
1. 矩形只需要水平/垂直线，无需三角函数，坐标100%正确
2. 圆形需要 sin/cos 计算角度，AI 极易算错导致节点错位、箭头断开
3. 矩形环更清晰：上排→右转→下排→左转→回到入口，首尾相连就是环

#### 矩形环布局原理
```
[tail...] → [5] → [4] → [6]      ← 上排（环的前半，从左到右）
             ↑              ↓
             [8] ← [7]            ← 下排（环的后半，从右到左，最终连回入口）
```

- 上排 = ringNodes 的前半部分，从左到右，用 → 连接
- 下排 = ringNodes 的后半部分，从右到左，用 ← 连接
- 右侧 = 上排末尾 ↓ 连到下排首个
- 左侧 = 下排末尾 ↑ 连回入口（环闭合！）

#### 必须照搬的 JS 模板（直接复制，只改数据部分）

```html
<div style="max-width:860px;margin:0 auto;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:inherit;background:transparent;padding:20px">
<style>
.ring-legend{display:flex;gap:16px;justify-content:center;flex-wrap:wrap;margin-top:16px;font-size:12px}
.ring-legend span{display:flex;align-items:center;gap:4px}
.ring-dot{width:12px;height:12px;border-radius:50%;display:inline-block}
</style>

<h3 style="text-align:center;font-size:16px;margin-bottom:4px">Floyd 判圈算法 — 龟兔赛跑</h3>
<p style="text-align:center;font-size:12px;opacity:0.5;margin-bottom:16px">slow 走 1 步 · fast 走 2 步 · 必在环内相遇</p>

<div id="ring-container"></div>

<script>
(function() {
  // ===== 只需修改这里的数据 =====
  var tailNodes = [3, 2, 1];        // tail 部分（从左到右）
  var ringNodes = [5, 4, 6, 7, 8];  // 环部分（顺序排列，第一个是入口）
  var entryIdx = 0;                  // 环入口在 ringNodes 中的下标
  var meetIdx = 3;                   // 相遇点下标（-1=无）
  // ==============================

  var NR = 24;           // 节点半径
  var GAP = 90;          // 同行节点间距
  var V_GAP = 110;       // 上下排间距
  var PAD = 50;          // 左右边距
  var ARROW_PAD = 6;     // 箭头离节点边缘的间隙

  var ringLen = ringNodes.length;
  var tailLen = tailNodes.length;

  // 将环节点分成上排和下排
  var topCount = Math.ceil(ringLen / 2);
  var botCount = ringLen - topCount;

  // 计算上排起始 X（让上排在 tail 右侧）
  var tailEndX = tailLen > 0 ? PAD + (tailLen - 1) * GAP : PAD - GAP;
  var ringStartX = tailEndX + GAP;
  var topY = PAD + NR;
  var botY = topY + V_GAP;

  // 所有节点坐标（统一索引）
  var nodes = []; // { x, y, val, role }

  // Tail 节点
  for (var i = 0; i < tailLen; i++) {
    nodes.push({ x: PAD + i * GAP, y: topY, val: tailNodes[i], role: 'tail' });
  }

  // 上排环节点
  var topStart = nodes.length;
  for (var i = 0; i < topCount; i++) {
    var ri = i;
    nodes.push({ x: ringStartX + i * GAP, y: topY, val: ringNodes[ri], role: 'ring', ringIdx: ri });
  }

  // 下排环节点（从右到左排列，所以 X 从上排末尾开始递减）
  var botStart = nodes.length;
  for (var i = 0; i < botCount; i++) {
    var ri = topCount + i;
    nodes.push({ x: ringStartX + (topCount - 1) * GAP - i * GAP, y: botY, val: ringNodes[ri], role: 'ring', ringIdx: ri });
  }

  // SVG 尺寸
  var allX = nodes.map(function(n){ return n.x; });
  var W = Math.max.apply(null, allX) + PAD + NR + 10;
  var H = botY + NR + PAD;

  // 边缘点计算（从圆心出发，沿方向偏移半径）
  function edgePt(x1, y1, x2, y2, r) {
    var dx = x2 - x1, dy = y2 - y1;
    var len = Math.sqrt(dx * dx + dy * dy);
    if (len < 1) return { x: x1, y: y1 };
    return { x: x1 + dx / len * r, y: y1 + dy / len * r };
  }

  // 画箭头连线
  function line(x1, y1, x2, y2, color, marker) {
    var p1 = edgePt(x1, y1, x2, y2, NR + ARROW_PAD);
    var p2 = edgePt(x2, y2, x1, y1, NR + ARROW_PAD);
    return '<line x1="' + p1.x.toFixed(1) + '" y1="' + p1.y.toFixed(1) +
           '" x2="' + p2.x.toFixed(1) + '" y2="' + p2.y.toFixed(1) +
           '" stroke="' + color + '" stroke-width="2" marker-end="url(#' + marker + ')"/>';
  }

  // 画节点
  function circle(n, fill, stroke, sw) {
    var s = '<circle cx="' + n.x.toFixed(1) + '" cy="' + n.y.toFixed(1) + '" r="' + NR +
            '" fill="' + fill + '" stroke="' + stroke + '" stroke-width="' + sw + '"/>';
    s += '<text x="' + n.x.toFixed(1) + '" y="' + n.y.toFixed(1) +
         '" fill="#f1f5f9" font-size="14" font-weight="bold" text-anchor="middle" dominant-baseline="central">' + n.val + '</text>';
    return s;
  }

  var svg = '<svg viewBox="0 0 ' + W + ' ' + H + '" style="width:100%;max-width:' + W + 'px;margin:0 auto;display:block">';
  svg += '<defs>';
  svg += '<marker id="arr" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto"><path d="M0,0 L8,3 L0,6" fill="#94a3b8"/></marker>';
  svg += '<marker id="arr-g" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto"><path d="M0,0 L8,3 L0,6" fill="#16a34a"/></marker>';
  svg += '<marker id="arr-r" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto"><path d="M0,0 L8,3 L0,6" fill="#e11d48"/></marker>';
  svg += '</defs>';

  // ---- Step 1: 画连线（先画线，节点覆盖在上面）----

  // Tail → Tail 箭头
  for (var i = 0; i < tailLen - 1; i++) {
    svg += line(nodes[i].x, nodes[i].y, nodes[i+1].x, nodes[i+1].y, '#94a3b8', 'arr');
  }

  // Tail 末尾 → 环入口（上排第一个）
  if (tailLen > 0) {
    svg += line(nodes[tailLen-1].x, nodes[tailLen-1].y, nodes[topStart].x, nodes[topStart].y, '#16a34a', 'arr-g');
    // "a 步" 标注
    var mx = (nodes[tailLen-1].x + nodes[topStart].x) / 2;
    var my = nodes[topStart].y - NR - 10;
    svg += '<text x="' + mx.toFixed(0) + '" y="' + my.toFixed(0) + '" fill="#16a34a" font-size="11" text-anchor="middle">a 步</text>';
  }

  // 上排 → 箭头（从左到右）
  for (var i = 0; i < topCount - 1; i++) {
    svg += line(nodes[topStart+i].x, nodes[topStart+i].y, nodes[topStart+i+1].x, nodes[topStart+i+1].y, '#94a3b8', 'arr');
  }

  // 上排末尾 ↓ 下排首个（右侧垂直箭头）
  if (botCount > 0) {
    svg += line(nodes[topStart+topCount-1].x, nodes[topStart+topCount-1].y,
                nodes[botStart].x, nodes[botStart].y, '#94a3b8', 'arr');
  }

  // 下排 ← 箭头（从右到左）
  for (var i = 0; i < botCount - 1; i++) {
    svg += line(nodes[botStart+i].x, nodes[botStart+i].y, nodes[botStart+i+1].x, nodes[botStart+i+1].y, '#94a3b8', 'arr');
  }

  // 下排末尾 ↑ 回到环入口（左侧闭合箭头！这是环的关键！）
  var closeFrom = nodes[botStart + botCount - 1];
  var closeTo = nodes[topStart]; // 入口 = 上排第一个
  svg += line(closeFrom.x, closeFrom.y, closeTo.x, closeTo.y, '#16a34a', 'arr-g');

  // ---- Step 2: 画节点（覆盖在连线上面）----

  // Tail 节点
  for (var i = 0; i < tailLen; i++) {
    svg += circle(nodes[i], '#1e293b', '#64748b', 2);
  }

  // 环节点
  for (var i = 0; i < ringLen; i++) {
    var n = nodes[topStart + i];
    var fill = '#1e293b', stroke = '#64748b', sw = 2, label = '';
    if (i === entryIdx) {
      fill = '#16a34a20'; stroke = '#16a34a'; sw = 3; label = '入口';
    } else if (i === meetIdx) {
      fill = '#e11d4820'; stroke = '#e11d48'; sw = 3; label = '相遇点';
    }
    svg += circle(n, fill, stroke, sw);
    if (label) {
      var ly = n.y < (topY + botY) / 2 ? n.y - NR - 10 : n.y + NR + 14;
      svg += '<text x="' + n.x.toFixed(1) + '" y="' + ly.toFixed(1) + '" fill="' + stroke + '" font-size="10" text-anchor="middle">' + label + '</text>';
    }
  }

  // 起点指针标注
  if (tailLen > 0) {
    var p = nodes[0];
    svg += '<text x="' + p.x.toFixed(0) + '" y="' + (p.y + NR + 16).toFixed(0) + '" fill="#d97706" font-size="11" font-weight="bold" text-anchor="middle">🐢 slow</text>';
    svg += '<text x="' + p.x.toFixed(0) + '" y="' + (p.y + NR + 30).toFixed(0) + '" fill="#2563eb" font-size="11" font-weight="bold" text-anchor="middle">🐇 fast</text>';
  }

  svg += '</svg>';
  document.getElementById('ring-container').innerHTML = svg;
})();
</script>

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

#### 使用规则（必读）
1. **直接复制上面的模板**，只修改 `tailNodes`、`ringNodes`、`entryIdx`、`meetIdx` 这4个数据变量
2. **绝不手写 SVG 坐标** — JS 自动计算所有矩形布局位置
3. **绝不手算三角函数** — 矩形布局只需要水平/垂直间距
4. 环的闭合由代码自动处理：下排末尾 ↑ 连回上排入口（入口 = `ringNodes[entryIdx]`）
5. `entryIdx` = 环入口在 `ringNodes` 中的下标，`meetIdx` = 相遇点下标（无则设 -1）
6. 可根据具体算法修改标题、副标题、图例和底部公式
7. 节点数量建议 ≤ 8，太多可适当合并
8. **分步确认流程**：① 确认 tail→entry 连线正确 ② 确认上排→右转→下排方向正确 ③ 确认下排末尾连回入口形成闭环

### 使用规则
1. 涉及架构/流程/数据变换/神经网络结构/算法步骤 → **必须用 ```html**
2. 简单关系图/时序图/饼图 → 用 ```mermaid
3. 每个可视化要包含维度信息和简要说明，文字全部中文
4. **布局口诀：flex 排列不手算，方块用 class 样式，箭头用文字符号，颜色低透明度**"""
