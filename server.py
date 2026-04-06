import json
import os
import sys
import logging
from flask import Flask, request, Response, jsonify, send_from_directory
from anthropic import Anthropic

sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'skills'))
from visualize import get_skill_prompt

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(name)s: %(message)s'
)
logger = logging.getLogger('server')

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
app = Flask(__name__, static_folder=os.path.join(BASE_DIR, 'static'))

API_BASE_URL = os.environ.get(
    'ANTHROPIC_BASE_URL', 'https://open.bigmodel.cn/api/anthropic'
)
API_KEY = os.environ.get(
    'ANTHROPIC_AUTH_TOKEN',
    os.environ.get('ANTHROPIC_API_KEY', '')
)
MODEL = os.environ.get('ANTHROPIC_MODEL', 'GLM-5V-Turbo')

SKILL_PROMPT = get_skill_prompt()

SYSTEM_PROMPT = f"""你是一个优秀的AI助手，擅长用直观的可视化方式解释复杂概念。

{SKILL_PROMPT}

### Mermaid 图表（简单关系图使用）

对于简单的关系图、时序图、饼图等，可以使用 ```mermaid 代码块。

```mermaid
graph TD
    A[输入] --> B[处理]
    B --> C[输出]
```

### 回答风格
- 先用简洁语言解释核心概念
- **涉及架构、流程、数据变换、神经网络结构、算法步骤等，必须优先使用 ```html 可视化**
- 简单的关系图可以用 ```mermaid
- 代码块前后可以有文字说明
- 最后给出总结要点"""


@app.route('/')
def index():
    resp = send_from_directory(BASE_DIR, 'index.html')
    resp.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
    resp.headers['Pragma'] = 'no-cache'
    resp.headers['Expires'] = '0'
    return resp


@app.route('/api/models', methods=['GET'])
def get_models():
    models = {
        'current': MODEL,
        'available': [
            MODEL,
            os.environ.get('ANTHROPIC_DEFAULT_HAIKU_MODEL', 'GLM-4.5-air'),
            os.environ.get('ANTHROPIC_DEFAULT_OPUS_MODEL', 'GLM-5.1'),
        ]
    }
    return jsonify(models)


@app.route('/api/chat', methods=['POST'])
def chat():
    data = request.json or {}
    messages = data.get('messages', [])
    model = data.get('model', MODEL)

    if not messages:
        return jsonify({'error': 'No messages provided'}), 400

    if not API_KEY:
        logger.error("API key is not configured")
        return jsonify({'error': 'API key is not configured'}), 500

    client = Anthropic(api_key=API_KEY, base_url=API_BASE_URL)

    def generate():
        full_response = ""
        try:
            with client.messages.stream(
                model=model,
                max_tokens=8000,
                system=SYSTEM_PROMPT,
                messages=messages,
            ) as stream:
                for event in stream:
                    if event.type == 'content_block_delta':
                        if hasattr(event.delta, 'text'):
                            delta_text = event.delta.text
                            full_response += delta_text
                            payload = json.dumps(
                                {'type': 'text', 'content': delta_text},
                                ensure_ascii=False
                            )
                            yield f"data: {payload}\n\n"

            logger.info(f"Full response length: {len(full_response)} chars")

        except Exception as e:
            import traceback
            logger.error(f"Chat error: {e}\n{traceback.format_exc()}")
            payload = json.dumps(
                {'type': 'error', 'message': str(e)},
                ensure_ascii=False
            )
            yield f"data: {payload}\n\n"

        yield "data: [DONE]\n\n"

    resp = Response(generate(), mimetype='text/event-stream')
    resp.headers['Cache-Control'] = 'no-cache'
    resp.headers['X-Accel-Buffering'] = 'no'
    resp.headers['Connection'] = 'keep-alive'
    return resp


if __name__ == '__main__':
    import sys
    import io
    import argparse

    parser = argparse.ArgumentParser(description='VisualKnowledge Server')
    parser.add_argument('--port', type=int, default=5000, help='Port to listen on (default: 5000)')
    args = parser.parse_args()

    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    print(f"🚀 Claude Chat 启动中...")
    print(f"   API: {API_BASE_URL}")
    print(f"   模型: {MODEL}")
    print(f"   地址: http://localhost:{args.port}")
    app.run(host='0.0.0.0', port=args.port, debug=True)
