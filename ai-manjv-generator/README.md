# AI 漫剧生成网站 MVP

这是一个本地可运行的最小闭环 demo，面向自媒体短剧创作者和短视频内容创作者。

## 已实现

- 输入一句话或一段剧情
- 点击按钮调用真实大模型生成 3-5 个分镜
- 每个分镜展示场景、人物、动作、台词、旁白、画面提示词
- 使用占位图模拟画面生成
- 使用进度条模拟 30 秒短剧视频合成
- 生成完成后提供模拟下载按钮
- 如果没有填写 API Key，会自动退回本地模拟模式，方便先跑通页面

## 第一次启动步骤

1. 打开终端。
2. 进入项目目录：

```bash
cd /Users/mac/Documents/Codex/2026-04-24/ai-3-5-30-1-2
```

3. 启动项目：

```bash
npm start
```

如果你的电脑提示 `npm: command not found`，可以先用这个备用命令启动：

```bash
/Users/mac/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node server.js
```

4. 看到类似下面这行，就说明启动成功：

```bash
AI 漫剧生成 MVP 已启动：http://localhost:3000
```

5. 打开浏览器访问：

```text
http://localhost:3000
```

6. 在网页里输入剧情，点击“生成分镜”。

## 接入真实大模型 API

这一版默认使用通义千问 DashScope 官方 HTTP 接口，国内网络通常更容易访问。

### 1. 准备 API Key

你需要先准备一个 DashScope API Key。

申请入口：

```text
https://bailian.console.aliyun.com/?tab=model#/api-key
```

如果没有阿里云账号，需要先登录或注册，然后进入“模型服务灵积 / 百炼”的 API Key 页面创建 Key。

拿到以后，复制它，通常长得像：

```text
sk-xxxxxxxxxxxxxxxx
```

### 2. 填写 API Key

打开项目根目录里的这个文件：

```text
/Users/mac/Documents/Codex/2026-04-24/ai-3-5-30-1-2/.env
```

找到这一行：

```bash
DASHSCOPE_API_KEY=
```

把你的 Key 填到等号后面，例如：

```bash
DASHSCOPE_API_KEY=sk-你的真实key
```

注意：等号前后不要加空格。

通义万相图片生成默认也复用这个 Key。如果你想为图片生成单独配置 Key，可以填写：

```bash
WANX_API_KEY=sk-你的真实key
```

如果 DashScope 返回 `Arrearage Access denied`，说明阿里云账号欠费、额度不足或模型服务未开通，需要先在阿里云控制台处理账单/额度后再重试。

### 3. 确认模型配置

`.env` 里默认已经写好了：

```bash
AI_PROVIDER=dashscope
DASHSCOPE_ENDPOINT=https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation
WANX_ENDPOINT=https://dashscope.aliyuncs.com/api/v1/services/aigc/text2image/image-synthesis
WANX_TASK_ENDPOINT=https://dashscope.aliyuncs.com/api/v1/tasks
WANX_MODEL=wanx-v1
WANX_SIZE=720*1280
OPENAI_MODEL=qwen-plus
PORT=3000
```

小白用户先不要改这几行。

### 4. 重新启动项目

如果项目正在运行，先在终端按：

```bash
Control + C
```

然后重新启动：

```bash
npm start
```

如果你的电脑提示 `npm: command not found`，用备用命令：

```bash
/Users/mac/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node server.js
```

### 5. 验证是否走真实模型

打开：

```text
http://localhost:3000
```

输入一段剧情并点击“生成分镜”。如果 API Key 正确，页面右上角会显示：

```text
通义千问真实模型模式
```

如果显示“本地模拟模式”，说明 `.env` 里还没有填 DashScope Key，或者 Key 没有被正确读取。

如果显示“通义千问连接失败，已切换本地模拟模式”，说明已经尝试调用 DashScope，但网络、Key、额度或服务配置有问题，页面会自动用本地模拟分镜继续跑通。

## 停止项目

在运行项目的终端里按：

```bash
Control + C
```

## 代码位置

- API Key 填写位置：`.env`
- 后端真实模型调用代码：`server.js` 里的 `generateWithCompatibleAI` 函数
- 前端页面：`public/index.html`
- 前端交互：`public/app.js`

## 部署到公网

推荐使用 Render 或 Railway 的 Docker 部署。这个项目已经包含 `Dockerfile`，服务器里会安装 `ffmpeg`，用于把分镜图片合成为 mp4。

### 推荐：Render

1. 把项目推送到 GitHub 仓库。
2. 打开 Render，新建 `Web Service`。
3. 选择你的 GitHub 仓库。
4. Runtime/Environment 选择 `Docker`。
5. 添加环境变量，不要上传本地 `.env` 文件：

```bash
DASHSCOPE_API_KEY=你的真实key
AI_PROVIDER=dashscope
DASHSCOPE_ENDPOINT=https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation
WANX_ENDPOINT=https://dashscope.aliyuncs.com/api/v1/services/aigc/text2image/image-synthesis
WANX_TASK_ENDPOINT=https://dashscope.aliyuncs.com/api/v1/tasks
WANX_MODEL=wanx-v1
WANX_SIZE=720*1280
OPENAI_MODEL=qwen-plus
```

6. 点击 Deploy。
7. 部署完成后，Render 会给你一个公网地址，形如：

```text
https://你的服务名.onrender.com
```

### Railway

1. 把项目推送到 GitHub 仓库。
2. 在 Railway 新建 Project，选择 Deploy from GitHub repo。
3. Railway 会识别根目录的 `Dockerfile`。
4. 在 Variables 中添加上面同样的环境变量。
5. 部署完成后，在 Settings/Networking 里生成公网域名。

### 重要说明

- API Key 只放在平台的环境变量里，不能写进前端代码，也不要提交 `.env`。
- 免费实例可能会因为图片和视频生成耗时较长而超时或休眠；如果多人使用，建议升级到付费实例。
- `generated/` 目录是临时文件目录，适合 MVP。生产版建议接对象存储 OSS/S3 保存图片和视频。
