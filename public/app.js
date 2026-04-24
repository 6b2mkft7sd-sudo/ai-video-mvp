const storyInput = document.querySelector("#storyInput");
const generateBtn = document.querySelector("#generateBtn");
const sampleBtn = document.querySelector("#sampleBtn");
const storyboardList = document.querySelector("#storyboardList");
const storyboardCount = document.querySelector("#storyboardCount");
const modelMode = document.querySelector("#modelMode");
const videoStatusText = document.querySelector("#videoStatusText");
const videoProgress = document.querySelector("#videoProgress");
const videoPreview = document.querySelector("#videoPreview .preview-screen");
const downloadBtn = document.querySelector("#downloadBtn");
const generateVideoBtn = document.querySelector("#generateVideoBtn");
let currentStoryboards = [];
let currentPrompt = "";
let currentStoryboardText = "";
let storyboardDownloadUrl = "";

const sampleStory = "一个刚毕业的女孩被同事抢走创意，还被老板当众批评。她没有争辩，而是在第二天的客户提案会上拿出隐藏证据，反转全场。";
const modeLabels = {
  dashscope: "通义千问真实模型模式",
  dashscope_failed: "通义千问连接失败，已切换本地模拟模式",
  model: "真实模型模式",
  openai_failed: "OpenAI连接失败，已切换本地模拟模式",
  mock: "本地模拟模式"
};

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function setLoading(isLoading) {
  generateBtn.disabled = isLoading;
  generateBtn.innerHTML = isLoading
    ? '<span class="button-icon">…</span> 生成中…'
    : '<span class="button-icon">▶</span> 生成分镜';
}

function revokeStoryboardDownloadUrl() {
  if (storyboardDownloadUrl) {
    URL.revokeObjectURL(storyboardDownloadUrl);
    storyboardDownloadUrl = "";
  }
}

function buildStoryboardText(prompt, storyboards, modeLabel) {
  const lines = [
    "AI 漫剧分镜文案",
    "",
    `生成模式：${modeLabel || modelMode.textContent || "模拟视频结果"}`,
    `用户剧情：${(prompt || currentPrompt || "").trim() || "未填写"}`,
    "",
    "分镜列表",
    ""
  ];

  storyboards.forEach(item => {
    lines.push(`${item.title}（${item.duration} 秒）`);
    lines.push(`场景：${item.scene}`);
    lines.push(`人物：${item.characters}`);
    lines.push(`动作：${item.action}`);
    lines.push(`台词：${item.dialogue}`);
    lines.push(`旁白：${item.narration}`);
    lines.push(`画面提示词：${item.prompt}`);
    lines.push(`图片状态：${item.imageUrl ? "通义万相生成完成" : item.imageError || item.imageStatus || "前端占位图"}`);
    if (item.imageUrl) {
      lines.push(`图片地址：${item.imageUrl}`);
    }
    lines.push("");
  });

  return lines.join("\n");
}

function enableStoryboardDownload(text) {
  revokeStoryboardDownloadUrl();
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  storyboardDownloadUrl = URL.createObjectURL(blob);
  downloadBtn.classList.remove("disabled");
  downloadBtn.removeAttribute("aria-disabled");
  downloadBtn.href = storyboardDownloadUrl;
  downloadBtn.download = "demo-storyboard.txt";
  downloadBtn.textContent = "下载分镜文案";
}

function resetVideo() {
  revokeStoryboardDownloadUrl();
  videoStatusText.textContent = "未开始";
  videoProgress.style.width = "0%";
  videoPreview.innerHTML = '<div class="play-mark">▶</div><p>等待分镜生成</p>';
  generateVideoBtn.disabled = true;
  generateVideoBtn.textContent = "生成视频";
  downloadBtn.classList.add("disabled");
  downloadBtn.setAttribute("aria-disabled", "true");
  downloadBtn.href = "#";
  downloadBtn.textContent = "下载分镜文案";
}

function prepareVideoGeneration() {
  const count = currentStoryboards.length;
  videoStatusText.textContent = count > 0 ? "模拟视频可生成" : "等待分镜";
  videoProgress.style.width = count > 0 ? "20%" : "0%";
  videoPreview.innerHTML = `<div class="play-mark">▶</div><p>${count > 0 ? `已准备 ${count} 个分镜文案` : "等待分镜生成"}</p>`;
  generateVideoBtn.disabled = count === 0;
  downloadBtn.classList.add("disabled");
  downloadBtn.setAttribute("aria-disabled", "true");
  downloadBtn.href = "#";
}

async function generateVideo() {
  if (currentStoryboards.length === 0) {
    videoStatusText.textContent = "缺少分镜";
    videoPreview.innerHTML = '<div class="play-mark">!</div><p>请先生成分镜</p>';
    return;
  }

  generateVideoBtn.disabled = true;
  generateVideoBtn.textContent = "生成中…";
  videoStatusText.textContent = "生成中";
  videoProgress.style.width = "55%";
  videoPreview.innerHTML = '<div class="play-mark">…</div><p>正在生成模拟视频结果</p>';

  try {
    const response = await fetch("/api/generate-video", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt: currentPrompt,
        storyboards: currentStoryboards,
        modeLabel: modelMode.textContent
      })
    });
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "视频生成失败");
    }

    const text = data.storyboardText || currentStoryboardText || buildStoryboardText(currentPrompt, currentStoryboards, modelMode.textContent);
    currentStoryboardText = text;
    videoStatusText.textContent = "模拟完成";
    videoProgress.style.width = "100%";
    videoPreview.innerHTML = '<div class="play-mark">✓</div><p>当前为模拟视频，真实视频生成将在下一阶段接入。</p>';
    enableStoryboardDownload(text);
  } catch (error) {
    videoStatusText.textContent = "生成失败";
    videoProgress.style.width = "0%";
    videoPreview.innerHTML = `<div class="play-mark">!</div><p>${escapeHtml(error.message)}</p>`;
  } finally {
    generateVideoBtn.disabled = false;
    generateVideoBtn.textContent = "生成视频";
  }
}

function renderStoryboards(storyboards) {
  currentStoryboards = storyboards;
  storyboardCount.textContent = `${storyboards.length} 个分镜`;
  storyboardList.classList.remove("empty-state");
  storyboardList.innerHTML = storyboards
    .map((item, index) => {
      const hue = (index * 72 + 18) % 360;
      const imageBlock = item.imageUrl
        ? `<img class="storyboard-image" src="${escapeHtml(item.imageUrl)}" alt="${escapeHtml(item.title)} 画面" loading="lazy" />`
        : `<div class="mock-image" style="background: linear-gradient(160deg, hsla(${hue}, 74%, 42%, 0.92), hsla(${(hue + 104) % 360}, 64%, 42%, 0.9));">
            <span>${item.imageStatus === "failed" ? "图片生成失败" : item.imageStatus === "placeholder" ? "占位图" : "图片生成中…"}</span>
          </div>`;
      const retryButton = item.imageStatus === "failed"
        ? `<button class="retry-image-button" type="button" data-index="${index}">重新生成该图片</button>`
        : "";
      return `
        <article class="storyboard-card">
          <div class="image-frame">${imageBlock}</div>
          <div class="card-content">
            <h3>${escapeHtml(item.title)} · ${escapeHtml(item.duration)} 秒</h3>
            <div class="meta-grid">
              <div class="field">
                <strong>场景</strong>
                <p>${escapeHtml(item.scene)}</p>
              </div>
              <div class="field">
                <strong>人物</strong>
                <p>${escapeHtml(item.characters)}</p>
              </div>
              <div class="field">
                <strong>动作</strong>
                <p>${escapeHtml(item.action)}</p>
              </div>
              <div class="field">
                <strong>台词</strong>
                <p>${escapeHtml(item.dialogue)}</p>
              </div>
              <div class="field full">
                <strong>旁白</strong>
                <p>${escapeHtml(item.narration)}</p>
              </div>
              <div class="field full">
                <strong>画面提示词</strong>
                <p>${escapeHtml(item.prompt)}</p>
              </div>
              <div class="field full">
                <strong>图片状态</strong>
                <p>${escapeHtml(item.imageUrl ? "通义万相生成完成" : item.imageError || (item.imageStatus === "placeholder" ? "前端占位图" : "图片生成中…"))}</p>
                ${retryButton}
              </div>
            </div>
          </div>
        </article>
      `;
    })
    .join("");
}

async function regenerateImage(index) {
  const item = currentStoryboards[index];
  if (!item) return;

  currentStoryboards[index] = {
    ...item,
    imageUrl: "",
    imageStatus: "pending",
    imageError: "图片生成中…"
  };
  renderStoryboards(currentStoryboards);

  try {
    const response = await fetch("/api/regenerate-image", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(item)
    });
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.imageError || data.error || "生成超时，请重试");
    }

    currentStoryboards[index] = {
      ...item,
      ...data
    };
  } catch (error) {
    currentStoryboards[index] = {
      ...item,
      imageUrl: "",
      imageStatus: "failed",
      imageError: error.message || "生成超时，请重试"
    };
  }

  renderStoryboards(currentStoryboards);
}

function startImageProgressMessage() {
  let dotCount = 1;
  storyboardList.innerHTML = "<p>正在生成分镜…</p>";

  return setInterval(() => {
    dotCount = dotCount >= 3 ? 1 : dotCount + 1;
    storyboardList.innerHTML = `<p>正在生成分镜${"…".repeat(dotCount)}</p>`;
  }, 2000);
}

async function generateStoryboards() {
  const prompt = storyInput.value.trim();
  if (!prompt) {
    storyInput.focus();
    storyboardList.classList.add("empty-state");
    storyboardList.innerHTML = "<p>请先输入剧情，再点击生成。</p>";
    return;
  }

  setLoading(true);
  currentPrompt = prompt;
  currentStoryboardText = "";
  resetVideo();
  storyboardCount.textContent = "生成中…";
  storyboardList.classList.add("empty-state");
  storyboardList.innerHTML = "<p>生成中…正在拆解剧情，Vercel 部署版会优先返回分镜并使用占位图。</p>";
  const progressTimer = startImageProgressMessage();

  try {
    const response = await fetch("/api/storyboards", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt })
    });
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "生成失败");
    }

    modelMode.textContent = data.statusMessage || modeLabels[data.mode] || "本地模拟模式";
    currentStoryboardText = data.storyboardText || buildStoryboardText(prompt, data.storyboards || [], modelMode.textContent);
    renderStoryboards(data.storyboards);
    prepareVideoGeneration();
  } catch (error) {
    storyboardCount.textContent = "生成失败";
    storyboardList.classList.add("empty-state");
    storyboardList.innerHTML = `<p>${escapeHtml(error.message)}</p>`;
  } finally {
    clearInterval(progressTimer);
    setLoading(false);
  }
}

sampleBtn.addEventListener("click", () => {
  storyInput.value = sampleStory;
  storyInput.focus();
});

generateBtn.addEventListener("click", generateStoryboards);
generateVideoBtn.addEventListener("click", generateVideo);

storyboardList.addEventListener("click", event => {
  const button = event.target.closest(".retry-image-button");
  if (!button) return;
  regenerateImage(Number(button.dataset.index));
});

videoPreview.addEventListener("click", () => {
  if (!videoPreview.querySelector("video")) {
    videoPreview.innerHTML = '<div class="play-mark">▶</div><p>当前为模拟视频，真实视频生成将在下一阶段接入。</p>';
  }
});

storyInput.addEventListener("keydown", event => {
  if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
    generateStoryboards();
  }
});
