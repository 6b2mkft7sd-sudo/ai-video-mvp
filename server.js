const http = require("http");
const fs = require("fs");
const path = require("path");

loadEnvFile(path.join(__dirname, ".env"));

const PORT = Number(process.env.PORT || 3000);
const PUBLIC_DIR = path.join(__dirname, "public");
const IS_VERCEL = Boolean(process.env.VERCEL);
const AI_PROVIDER = (process.env.AI_PROVIDER || "openai").toLowerCase();
const OPENAI_BASE_URL = (process.env.OPENAI_BASE_URL || "https://api.openai.com/v1").replace(/\/$/, "");
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";
const DASHSCOPE_ENDPOINT = process.env.DASHSCOPE_ENDPOINT || "https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation";
const WANX_ENDPOINT = process.env.WANX_ENDPOINT || "https://dashscope.aliyuncs.com/api/v1/services/aigc/text2image/image-synthesis";
const WANX_TASK_ENDPOINT = (process.env.WANX_TASK_ENDPOINT || "https://dashscope.aliyuncs.com/api/v1/tasks").replace(/\/$/, "");
const WANX_MODEL = process.env.WANX_MODEL || "wanx-v1";
const WANX_SIZE = process.env.WANX_SIZE || "720*1280";

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml; charset=utf-8"
};

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;

  const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex === -1) continue;

    const key = trimmed.slice(0, separatorIndex).trim();
    let value = trimmed.slice(separatorIndex + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }

    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

function sendJson(res, statusCode, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(body)
  });
  res.end(body);
}

function readRequestJson(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", chunk => {
      body += chunk;
      if (body.length > 1_000_000) {
        req.destroy();
        reject(new Error("请求内容太大"));
      }
    });
    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        reject(new Error("JSON 格式不正确"));
      }
    });
    req.on("error", reject);
  });
}

function serveStatic(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const requestedPath = decodeURIComponent(url.pathname === "/" ? "/index.html" : url.pathname);
  const filePath = path.normalize(path.join(PUBLIC_DIR, requestedPath));

  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  fs.readFile(filePath, (error, content) => {
    if (error) {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("找不到页面");
      return;
    }

    const ext = path.extname(filePath);
    res.writeHead(200, { "Content-Type": mimeTypes[ext] || "application/octet-stream" });
    res.end(content);
  });
}

function pickTone(text) {
  if (/古风|宫|王爷|公主|仙|修炼|江湖/.test(text)) return "古风";
  if (/职场|老板|公司|会议|同事|客户/.test(text)) return "都市职场";
  if (/校园|同学|老师|考试|社团/.test(text)) return "校园青春";
  if (/悬疑|凶手|失踪|秘密|案件|真相/.test(text)) return "悬疑反转";
  if (/爱情|分手|复合|暗恋|表白/.test(text)) return "情感短剧";
  return "现代漫剧";
}

function buildMockStoryboards(prompt) {
  const cleanPrompt = prompt.trim().replace(/\s+/g, " ");
  const tone = pickTone(cleanPrompt);
  const lead = cleanPrompt.length > 42 ? `${cleanPrompt.slice(0, 42)}...` : cleanPrompt;
  const count = cleanPrompt.length > 80 ? 5 : 4;
  const beats = [
    {
      scene: `${tone}开场，主角所在的关键地点`,
      characters: "主角、重要关系人",
      action: "主角被突发事件打断，情绪从平静转为紧张。",
      dialogue: "主角：这件事，怎么会突然变成这样？",
      narration: `一句话钩子：${lead}`,
      prompt: `${tone}漫画分镜，电影感构图，主角震惊表情，环境细节清晰，竖屏短剧画面`
    },
    {
      scene: "冲突升级的近景空间",
      characters: "主角、对立角色",
      action: "对立角色抛出压力，主角被迫做出选择。",
      dialogue: "对立角色：你现在只有一个选择。",
      narration: "矛盾被推到台前，主角的弱点也被看见。",
      prompt: "漫画短剧，强对比光影，两人对峙，面部特写，紧张氛围，竖屏 9:16"
    },
    {
      scene: "隐藏线索出现的转折地点",
      characters: "主角、辅助角色",
      action: "主角发现一个细节，意识到事情另有隐情。",
      dialogue: "主角：等等，这里不对。",
      narration: "一个不起眼的线索，让故事方向发生反转。",
      prompt: "悬念漫画分镜，手部拿起关键物件，背景虚化，眼神坚定，故事转折感"
    },
    {
      scene: "情绪爆发的高潮场景",
      characters: "主角、对立角色、围观者",
      action: "主角当众揭开真相，局势瞬间逆转。",
      dialogue: "主角：真正该解释的人，不是我。",
      narration: "压抑的情绪释放，观众获得爽点。",
      prompt: "高燃漫画镜头，主角站在画面中心，众人震惊，动态线条，短视频封面级画面"
    },
    {
      scene: "结尾留钩子的安静场景",
      characters: "主角、神秘人物",
      action: "主角以为事情结束，新的信息却突然出现。",
      dialogue: "神秘人物：你看到的，只是第一层真相。",
      narration: "结尾留下下一集悬念，推动用户继续观看。",
      prompt: "漫画短剧结尾，手机消息特写，主角回头，冷暖光交错，悬念感，竖屏"
    }
  ];

  return beats.slice(0, count).map((beat, index) => ({
    id: index + 1,
    title: `分镜 ${index + 1}`,
    duration: count === 5 ? 6 : index === count - 1 ? 9 : 7,
    ...beat
  }));
}

function buildStoryboardText(userPrompt, storyboards, modeLabel) {
  const lines = [
    "AI 漫剧分镜文案",
    "",
    `生成模式：${modeLabel}`,
    `用户剧情：${userPrompt.trim()}`,
    "",
    "分镜列表",
    ""
  ];

  for (const item of storyboards) {
    lines.push(`${item.title}（${item.duration} 秒）`);
    lines.push(`场景：${item.scene}`);
    lines.push(`人物：${item.characters}`);
    lines.push(`动作：${item.action}`);
    lines.push(`台词：${item.dialogue}`);
    lines.push(`旁白：${item.narration}`);
    lines.push(`画面提示词：${item.prompt}`);
    lines.push(`图片状态：${item.imageUrl ? "通义万相生成完成" : item.imageError || item.imageStatus || "未生成"}`);
    if (item.imageUrl) {
      lines.push(`图片地址：${item.imageUrl}`);
    }
    lines.push("");
  }

  return lines.join("\n");
}

function extractJsonObject(text) {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;
  try {
    return JSON.parse(text.slice(start, end + 1));
  } catch {
    return null;
  }
}

function maskApiKey(apiKey) {
  if (!apiKey) return "未读取到";
  if (apiKey.length <= 10) return `${apiKey.slice(0, 4)}...`;
  return `${apiKey.slice(0, 8)}...${apiKey.slice(-4)}`;
}

function getAIConfig() {
  if (AI_PROVIDER === "dashscope") {
    return {
      provider: "dashscope",
      apiKey: process.env.DASHSCOPE_API_KEY,
      model: OPENAI_MODEL || "qwen-plus",
      successMessage: "通义千问真实模型模式",
      failedMessage: "通义千问连接失败，已切换本地模拟模式",
      errorName: "通义千问"
    };
  }

  return {
    provider: "openai",
    apiKey: process.env.OPENAI_API_KEY,
    baseUrl: OPENAI_BASE_URL.includes("dashscope") ? "https://api.openai.com/v1" : OPENAI_BASE_URL,
    model: OPENAI_MODEL || "gpt-4o-mini",
    successMessage: "真实模型模式",
    failedMessage: "OpenAI连接失败，已切换本地模拟模式",
    errorName: "OpenAI"
  };
}

function getWanxConfig() {
  const keySource = process.env.WANX_API_KEY ? "WANX_API_KEY" : "DASHSCOPE_API_KEY";
  return {
    apiKey: process.env.WANX_API_KEY || process.env.DASHSCOPE_API_KEY,
    keySource,
    endpoint: WANX_ENDPOINT,
    taskEndpoint: WANX_TASK_ENDPOINT,
    model: WANX_MODEL,
    size: WANX_SIZE
  };
}

function inferDashScopeRegion(endpoint) {
  if (endpoint.includes("dashscope-intl.aliyuncs.com")) return "国际站/海外地域";
  if (endpoint.includes("dashscope.aliyuncs.com")) return "中国内地（北京）";
  return "未知地域";
}

function getWanxCompatibilityNotes(wanxConfig) {
  const region = inferDashScopeRegion(wanxConfig.endpoint);
  const notes = [];

  if (wanxConfig.model === "wanx-v1") {
    notes.push("wanx-v1 属于通义万相 V1，官方文档说明仅适用于中国内地（北京）地域，需使用该地域 API Key。");
  }

  if (wanxConfig.endpoint !== "https://dashscope.aliyuncs.com/api/v1/services/aigc/text2image/image-synthesis") {
    notes.push("当前 WANX_ENDPOINT 不是中国内地（北京）官方文生图 endpoint，请确认地域和 API Key 是否对应。");
  }

  if (!["1024*1024", "720*1280", "768*1152", "1280*720"].includes(wanxConfig.size)) {
    notes.push("当前 WANX_SIZE 不在 wanx-v1 官方支持的尺寸列表中。");
  }

  return { region, notes };
}

function normalizeStoryboards(storyboards) {
  return storyboards.slice(0, 5).map((item, index) => ({
    id: index + 1,
    title: item.title || `分镜 ${index + 1}`,
    duration: Number(item.duration || 7),
    scene: item.scene || "",
    characters: item.characters || "",
    action: item.action || "",
    dialogue: item.dialogue || "",
    narration: item.narration || "",
    prompt: item.prompt || ""
  }));
}

function buildStoryboardSystemPrompt() {
  return [
    "你是短视频漫剧编剧和分镜导演。",
    "请把用户剧情拆成 3-5 个分镜，适合 30 秒左右的竖屏漫剧。",
    "每个分镜必须具体、可拍、节奏紧凑，有短视频反转或钩子。",
    "画面提示词用于后续文生图，请写成清晰的中文视觉描述，包含漫画风格、构图、人物状态、氛围和 9:16 竖屏。",
    "请只返回 JSON，不要 Markdown，不要解释。",
    "JSON 格式必须是：{\"storyboards\":[{\"title\":\"分镜 1\",\"duration\":7,\"scene\":\"\",\"characters\":\"\",\"action\":\"\",\"dialogue\":\"\",\"narration\":\"\",\"prompt\":\"\"}]}"
  ].join("\n");
}

function parseModelStoryboards(text) {
  const parsed = extractJsonObject(text || "");
  if (!parsed || !Array.isArray(parsed.storyboards)) {
    throw new Error("大模型返回格式不正确");
  }
  return normalizeStoryboards(parsed.storyboards);
}

async function generateWithDashScope(prompt, aiConfig) {
  if (!aiConfig.apiKey) return null;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 45000);
  const headers = {
    "Authorization": `Bearer ${aiConfig.apiKey}`,
    "Content-Type": "application/json"
  };
  const requestBody = {
    model: "qwen-plus",
    input: {
      messages: [
        { role: "system", content: buildStoryboardSystemPrompt() },
        { role: "user", content: `用户剧情：${prompt}` }
      ]
    },
    parameters: {
      result_format: "message",
      temperature: 0.8
    }
  };

  let response;
  let responseText = "";

  console.log("[DashScope] 环境变量读取检查", {
    provider: AI_PROVIDER,
    keyPrefix: maskApiKey(aiConfig.apiKey),
    hasKey: Boolean(aiConfig.apiKey),
    keyLength: aiConfig.apiKey ? aiConfig.apiKey.length : 0
  });
  console.log("[DashScope] 请求URL", DASHSCOPE_ENDPOINT);
  console.log("[DashScope] 请求headers", {
    ...headers,
    Authorization: `Bearer ${maskApiKey(aiConfig.apiKey)}`
  });
  console.log("[DashScope] 请求body", JSON.stringify(requestBody, null, 2));

  try {
    response = await fetch(DASHSCOPE_ENDPOINT, {
      method: "POST",
      signal: controller.signal,
      headers,
      body: JSON.stringify(requestBody)
    });
    responseText = await response.text();
    console.log("[DashScope] 返回状态码", response.status);
    console.log("[DashScope] 返回完整response", responseText);
  } catch (error) {
    if (error.name === "AbortError") {
      console.error("[DashScope] 请求超时", {
        endpoint: DASHSCOPE_ENDPOINT,
        model: "qwen-plus",
        timeoutMs: 45000,
        keyPrefix: maskApiKey(aiConfig.apiKey)
      });
      throw new Error("连接通义千问超时，请检查网络或稍后重试。");
    }
    console.error("[DashScope] 网络请求失败", {
      endpoint: DASHSCOPE_ENDPOINT,
      model: "qwen-plus",
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    throw new Error("连接通义千问失败，请检查网络、API Key 或 DashScope 服务状态。");
  } finally {
    clearTimeout(timeout);
  }

  let data;
  try {
    data = JSON.parse(responseText);
  } catch (error) {
    console.error("[DashScope] 响应不是合法 JSON", {
      status: response.status,
      statusText: response.statusText,
      body: responseText
    });
    throw new Error("通义千问返回内容不是合法 JSON。");
  }

  if (!response.ok) {
    console.error("[DashScope] API 返回错误", {
      status: response.status,
      statusText: response.statusText,
      requestId: data.request_id || data.requestId,
      code: data.code,
      message: data.message,
      body: responseText
    });
    throw new Error(`通义千问 API 调用失败：${data.code || response.status} ${data.message || response.statusText}`);
  }

  const content = data.output?.choices?.[0]?.message?.content || "";
  if (!content) {
    console.error("[DashScope] 响应缺少 message.content", {
      requestId: data.request_id || data.requestId,
      body: responseText
    });
    throw new Error("通义千问返回内容为空。");
  }

  try {
    return parseModelStoryboards(content);
  } catch (error) {
    console.error("[DashScope] 分镜 JSON 解析失败", {
      requestId: data.request_id || data.requestId,
      content,
      body: responseText
    });
    throw error;
  }
}

async function generateWithOpenAICompatible(prompt, aiConfig) {
  if (!aiConfig.apiKey) return null;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  let response;
  try {
    response = await fetch(`${aiConfig.baseUrl}/chat/completions`, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${aiConfig.apiKey}`
      },
      body: JSON.stringify({
        model: aiConfig.model,
        messages: [
          {
            role: "system",
            content: buildStoryboardSystemPrompt()
          },
          {
            role: "user",
            content: `用户剧情：${prompt}`
          }
        ],
        temperature: 0.8,
        response_format: { type: "json_object" }
      })
    });
  } catch (error) {
    if (error.name === "AbortError") {
      throw new Error(`连接 ${aiConfig.errorName} 超时，请检查网络或稍后重试。`);
    }
    throw new Error(`连接 ${aiConfig.errorName} 失败，请检查网络或 API 地址配置。`);
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`大模型调用失败：${message}`);
  }

  const data = await response.json();
  const text = data.choices?.[0]?.message?.content || "";
  return parseModelStoryboards(text);
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function buildWanxPrompt(storyboard) {
  return [
    storyboard.prompt,
    `场景：${storyboard.scene}`,
    `人物：${storyboard.characters}`,
    `动作：${storyboard.action}`,
    "高质量漫画短剧分镜，竖屏构图，人物表情清晰，画面有电影感，不要出现文字、水印、字幕、Logo"
  ].filter(Boolean).join("，");
}

async function createWanxTask(storyboard, wanxConfig) {
  const headers = {
    "Authorization": `Bearer ${wanxConfig.apiKey}`,
    "Content-Type": "application/json",
    "X-DashScope-Async": "enable"
  };
  const requestBody = {
    model: wanxConfig.model,
    input: {
      prompt: buildWanxPrompt(storyboard),
      negative_prompt: "文字，水印，字幕，Logo，低清晰度，畸形手指，多余肢体，脸部扭曲"
    },
    parameters: {
      style: "<auto>",
      size: wanxConfig.size,
      n: 1
    }
  };
  const compatibility = getWanxCompatibilityNotes(wanxConfig);

  console.log("[Wanx] 配置匹配检查", {
    model: wanxConfig.model,
    endpoint: wanxConfig.endpoint,
    taskEndpoint: wanxConfig.taskEndpoint,
    inferredRegion: compatibility.region,
    keySource: wanxConfig.keySource,
    keyPrefix: maskApiKey(wanxConfig.apiKey),
    keyLength: wanxConfig.apiKey ? wanxConfig.apiKey.length : 0,
    size: wanxConfig.size,
    notes: compatibility.notes
  });
  console.log(`[Wanx] 创建图片任务：${storyboard.title}`, {
    url: wanxConfig.endpoint,
    headers: {
      ...headers,
      Authorization: `Bearer ${maskApiKey(wanxConfig.apiKey)}`
    },
    body: requestBody
  });

  const response = await fetch(wanxConfig.endpoint, {
    method: "POST",
    headers,
    body: JSON.stringify(requestBody)
  });
  const responseText = await response.text();
  console.log(`[Wanx] 创建任务返回：${storyboard.title}`, {
    status: response.status,
    statusText: response.statusText,
    response: responseText
  });

  let data;
  try {
    data = JSON.parse(responseText);
  } catch {
    throw new Error(`通义万相创建任务返回不是 JSON：${responseText}`);
  }

  if (!response.ok) {
    throw new Error(`通义万相创建任务失败：${data.code || response.status} ${data.message || response.statusText}`);
  }

  const taskId = data.output?.task_id;
  if (!taskId) {
    throw new Error(`通义万相创建任务成功但缺少 task_id：${responseText}`);
  }

  return taskId;
}

async function pollWanxTask(taskId, storyboard, wanxConfig) {
  const url = `${wanxConfig.taskEndpoint}/${taskId}`;
  const headers = {
    "Authorization": `Bearer ${wanxConfig.apiKey}`
  };
  const intervalMs = 2000;
  const timeoutMs = 60000;
  const startedAt = Date.now();
  let attempt = 0;

  await sleep(intervalMs);

  while (Date.now() - startedAt < timeoutMs) {
    attempt += 1;
    const response = await fetch(url, { headers });
    const responseText = await response.text();
    console.log(`[Wanx] 查询任务：${storyboard.title}`, {
      url,
      attempt,
      timeoutMs,
      elapsedMs: Date.now() - startedAt,
      status: response.status,
      response: responseText
    });

    let data;
    try {
      data = JSON.parse(responseText);
    } catch {
      throw new Error(`通义万相查询任务返回不是 JSON：${responseText}`);
    }

    if (!response.ok) {
      throw new Error(`通义万相查询任务失败：${data.code || response.status} ${data.message || response.statusText}`);
    }

    const taskStatus = data.output?.task_status;
    if (taskStatus === "SUCCEEDED") {
      const imageUrl = data.output?.results?.[0]?.url;
      if (!imageUrl) {
        throw new Error(`通义万相任务成功但没有图片 URL：${responseText}`);
      }
      return {
        imageUrl,
        imageStatus: "succeeded",
        imageTaskId: taskId
      };
    }

    if (["FAILED", "CANCELED", "UNKNOWN"].includes(taskStatus)) {
      throw new Error(`通义万相任务失败：${taskStatus} ${data.output?.message || data.message || ""}`);
    }

    await sleep(intervalMs);
  }

  console.warn(`[Wanx] 图片任务超过 60 秒，判定生成失败：${storyboard.title}`, {
    taskId,
    checkedTimes: attempt,
    timeoutMs
  });
  throw new Error("生成超时，请重试");
}

async function generateWanxImage(storyboard, wanxConfig) {
  const taskId = await createWanxTask(storyboard, wanxConfig);
  return pollWanxTask(taskId, storyboard, wanxConfig);
}

async function generateWanxImageWithRetry(storyboard, wanxConfig) {
  try {
    return await generateWanxImage(storyboard, wanxConfig);
  } catch (firstError) {
    console.warn(`[Wanx] 图片生成失败，3 秒后重试 1 次：${storyboard.title}`, {
      message: firstError.message
    });
    await sleep(3000);

    try {
      return await generateWanxImage(storyboard, wanxConfig);
    } catch (secondError) {
      console.error(`[Wanx] 图片重试后仍失败：${storyboard.title}`, {
        firstError: firstError.message,
        secondError: secondError.message,
        stack: secondError.stack
      });
      throw secondError;
    }
  }
}

async function attachWanxImages(storyboards) {
  const wanxConfig = getWanxConfig();
  if (!wanxConfig.apiKey) {
    console.warn("[Wanx] 未读取到 WANX_API_KEY 或 DASHSCOPE_API_KEY，跳过图片生成。");
    return storyboards.map(item => ({
      ...item,
      imageStatus: "skipped",
      imageError: "未配置 WANX_API_KEY 或 DASHSCOPE_API_KEY"
    }));
  }

  console.log("[Wanx] 环境变量读取检查", {
    keyPrefix: maskApiKey(wanxConfig.apiKey),
    hasKey: Boolean(wanxConfig.apiKey),
    keyLength: wanxConfig.apiKey.length,
    keySource: wanxConfig.keySource,
    endpoint: wanxConfig.endpoint,
    taskEndpoint: wanxConfig.taskEndpoint,
    model: wanxConfig.model,
    size: wanxConfig.size
  });

  const results = [];
  for (const storyboard of storyboards) {
    try {
      console.log(`[Wanx] 串行生成开始：${storyboard.title}`);
      const image = await generateWanxImageWithRetry(storyboard, wanxConfig);
      results.push({ ...storyboard, ...image });
      console.log(`[Wanx] 串行生成完成：${storyboard.title}`);
    } catch (error) {
      console.error(`[Wanx] 图片生成失败：${storyboard.title}`, {
        message: error.message,
        stack: error.stack
      });
      results.push({
        ...storyboard,
        imageStatus: "failed",
        imageError: error.message
      });
    }
    console.log("[Wanx] 等待 3 秒后处理下一张图片");
    await sleep(3000);
  }

  return results;
}

function shouldGenerateWanxImages() {
  if (process.env.ENABLE_WANX_IMAGES === "true") return true;
  if (IS_VERCEL) return false;
  return process.env.DISABLE_WANX_IMAGES !== "true";
}

function attachPlaceholderImages(storyboards, reason) {
  return storyboards.map(item => ({
    ...item,
    imageUrl: "",
    imageStatus: "placeholder",
    imageError: reason
  }));
}

async function handleWanxDebug(req, res) {
  try {
    const { prompt } = await readRequestJson(req);
    const wanxConfig = getWanxConfig();

    if (!wanxConfig.apiKey) {
      sendJson(res, 400, {
        error: "未读取到 WANX_API_KEY 或 DASHSCOPE_API_KEY",
        config: {
          keySource: wanxConfig.keySource,
          endpoint: wanxConfig.endpoint,
          taskEndpoint: wanxConfig.taskEndpoint,
          model: wanxConfig.model,
          size: wanxConfig.size,
          region: inferDashScopeRegion(wanxConfig.endpoint)
        }
      });
      return;
    }

    const storyboard = {
      title: "Wanx 调试图片",
      scene: "现代办公室，电影感光影",
      characters: "一位年轻短剧创作者",
      action: "站在白板前展示分镜脚本",
      prompt: prompt || "漫画风格，竖屏 9:16，现代办公室，年轻短剧创作者站在白板前展示分镜脚本，电影感光影"
    };
    const image = await generateWanxImage(storyboard, wanxConfig);

    sendJson(res, 200, {
      ok: true,
      image,
      config: {
        keySource: wanxConfig.keySource,
        keyPrefix: maskApiKey(wanxConfig.apiKey),
        endpoint: wanxConfig.endpoint,
        taskEndpoint: wanxConfig.taskEndpoint,
        model: wanxConfig.model,
        size: wanxConfig.size,
        region: inferDashScopeRegion(wanxConfig.endpoint)
      }
    });
  } catch (error) {
    console.error("[Wanx] 调试接口失败", {
      message: error.message,
      stack: error.stack
    });
    sendJson(res, 502, { error: error.message });
  }
}

async function handleRegenerateImage(req, res) {
  try {
    const storyboard = await readRequestJson(req);
    if (!storyboard || !storyboard.prompt) {
      sendJson(res, 400, { error: "缺少画面提示词，无法重新生成图片" });
      return;
    }

    const wanxConfig = getWanxConfig();
    if (!wanxConfig.apiKey) {
      sendJson(res, 400, { error: "未读取到 WANX_API_KEY 或 DASHSCOPE_API_KEY" });
      return;
    }

    const image = await generateWanxImageWithRetry(storyboard, wanxConfig);
    sendJson(res, 200, image);
  } catch (error) {
    console.error("[Wanx] 重新生成图片失败", {
      message: error.message,
      stack: error.stack
    });
    sendJson(res, 502, {
      imageStatus: "failed",
      imageError: error.message || "生成超时，请重试"
    });
  }
}

async function handleGenerateVideo(req, res) {
  try {
    const { prompt, storyboards, modeLabel } = await readRequestJson(req);
    const storyboardText = buildStoryboardText(
      prompt || "未提供剧情",
      Array.isArray(storyboards) ? storyboards : [],
      modeLabel || "模拟视频结果"
    );
    sendJson(res, 200, {
      simulated: true,
      statusMessage: "当前为模拟视频，真实视频生成将在下一阶段接入。",
      fileName: "demo-storyboard.txt",
      storyboardText
    });
  } catch (error) {
    console.error("[Video] 模拟视频结果生成失败", {
      message: error.message,
      stack: error.stack
    });
    sendJson(res, 500, { error: error.message || "模拟视频结果生成失败" });
  }
}

async function generateWithAI(prompt) {
  const aiConfig = getAIConfig();
  if (aiConfig.provider === "dashscope") {
    return generateWithDashScope(prompt, aiConfig);
  }
  return generateWithOpenAICompatible(prompt, aiConfig);
}

async function handleGenerateStoryboards(req, res) {
  try {
    const { prompt } = await readRequestJson(req);
    if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
      sendJson(res, 400, { error: "请输入剧情内容" });
      return;
    }

    let fromModel = null;
    let mode = "mock";
    let statusMessage = "本地模拟模式";
    const aiConfig = getAIConfig();

    if (aiConfig.apiKey) {
      try {
        fromModel = await generateWithAI(prompt);
        mode = aiConfig.provider === "dashscope" ? "dashscope" : "model";
        statusMessage = aiConfig.successMessage;
      } catch (error) {
        console.error(`${aiConfig.errorName} 调用失败：${error.message}`);
        mode = `${aiConfig.provider}_failed`;
        statusMessage = aiConfig.failedMessage;
      }
    }

    let storyboards = fromModel || buildMockStoryboards(prompt);
    if (shouldGenerateWanxImages()) {
      storyboards = await attachWanxImages(storyboards);
    } else {
      storyboards = attachPlaceholderImages(storyboards, "Vercel 无文件写入版：使用前端占位图，不保存图片文件。");
    }
    const storyboardText = buildStoryboardText(prompt, storyboards, statusMessage);

    sendJson(res, 200, {
      storyboards,
      mode,
      statusMessage,
      storyboardText,
      video: {
        status: "simulated",
        title: "模拟视频结果",
        fileName: "demo-storyboard.txt"
      }
    });
  } catch (error) {
    sendJson(res, 500, { error: error.message || "生成失败，请稍后重试" });
  }
}

const server = http.createServer((req, res) => {
  if (req.method === "POST" && req.url === "/api/storyboards") {
    handleGenerateStoryboards(req, res);
    return;
  }

  if (req.method === "POST" && req.url === "/api/wanx-debug") {
    handleWanxDebug(req, res);
    return;
  }

  if (req.method === "POST" && req.url === "/api/regenerate-image") {
    handleRegenerateImage(req, res);
    return;
  }

  if (req.method === "POST" && req.url === "/api/generate-video") {
    handleGenerateVideo(req, res);
    return;
  }

  if (req.method === "GET" && req.url.startsWith("/storyboard-video.mp4")) {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Vercel 无文件写入版暂不生成本地 mp4，请使用页面里的“下载分镜文案”。");
    return;
  }

  if (req.method === "GET" && req.url === "/demo-storyboard.txt") {
    res.writeHead(200, {
      "Content-Type": "text/plain; charset=utf-8",
      "Content-Disposition": "attachment; filename=\"demo-storyboard.txt\""
    });
    res.end("请先在页面点击“生成分镜”，再使用浏览器内存生成的“下载分镜文案”按钮下载本次内容。");
    return;
  }

  if (req.method === "GET" && req.url === "/demo-video.txt") {
    res.writeHead(200, {
      "Content-Type": "text/plain; charset=utf-8",
      "Content-Disposition": "attachment; filename=\"demo-video-result.txt\""
    });
    res.end("这是第一版 MVP 的模拟视频下载文件。后续可以替换为真实视频合成结果。");
    return;
  }

  if (req.method === "GET") {
    serveStatic(req, res);
    return;
  }

  res.writeHead(405, { "Content-Type": "text/plain; charset=utf-8" });
  res.end("Method Not Allowed");
});

server.listen(PORT, () => {
  console.log(`AI 漫剧生成 MVP 已启动：http://localhost:${PORT}`);
});
