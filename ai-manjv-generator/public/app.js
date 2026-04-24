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

function resetVideo() {
  videoStatusText.textContent = "未开始";
  videoProgress.style.width = "0%";
  videoPreview.innerHTML = '<div class="play-mark">▶</div><p>等待分镜生成</p>';
  generateVideoBtn.disabled = true;
  generateVideoBtn.textContent = "生成视频";
  downloadBtn.classList.add("disabled");
  downloadBtn.setAttribute("aria-disabled", "true");
  downloadBtn.href = "#";
}

function prepareVideoGeneration() {
  const readyImages = currentStoryboards.filter(item => item.imageUrl).length;
  videoStatusText.textContent = readyImages > 0 ? "可生成" : "等待图片";
  videoProgress.style.width = readyImages > 0 ? "20%" : "0%";
  videoPreview.innerHTML = `<div class="play-mark">▶</div><p>${readyImages > 0 ? `已准备 ${readyImages} 张图片` : "等待分镜图片生成"}</p>`;
  generateVideoBtn.disabled = readyImages === 0;
  downloadBtn.classList.add("disabled");
  downloadBtn.setAttribute("aria-disabled", "true");
  downloadBtn.href = "#";
}

async function generateVideo() {
  const storyboardsWithImages = currentStoryboards.filter(item => item.imageUrl);
  if (storyboardsWithImages.length === 0) {
    videoStatusText.textContent = "缺少图片";
    videoPreview.innerHTML = '<div class="play-mark">!</div><p>请先生成分镜图片</p>';
    return;
  }

  generateVideoBtn.disabled = true;
  generateVideoBtn.textContent = "生成中…";
  videoStatusText.textContent = "生成中";
  videoProgress.style.width = "55%";
  videoPreview.innerHTML = '<div class="play-mark">…</div><p>正在拼接 mp4 视频</p>';

  try {
    const response = await fetch("/api/generate-video", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ storyboards: storyboardsWithImages })
    });
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "视频生成失败");
    }

    videoStatusText.textContent = "生成完成";
    videoProgress.style.width = "100%";
    videoPreview.innerHTML = `<video class="result-video" src="${escapeHtml(data.videoUrl)}" controls playsinline></video>`;
    downloadBtn.classList.remove("disabled");
    downloadBtn.removeAttribute("aria-disabled");
    downloadBtn.href = data.downloadUrl;
    downloadBtn.download = "storyboard-video.mp4";
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
            <span>${item.imageStatus === "failed" ? "图片生成失败" : "图片生成中…"}</span>
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
                <p>${escapeHtml(item.imageUrl ? "通义万相生成完成" : item.imageError || "图片生成中…")}</p>
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
  let imageNumber = 1;
  storyboardList.innerHTML = `<p>正在生成第 ${imageNumber} 张图片…</p>`;

  return setInterval(() => {
    imageNumber = Math.min(imageNumber + 1, 5);
    storyboardList.innerHTML = `<p>正在生成第 ${imageNumber} 张图片…</p>`;
  }, 24000);
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
  resetVideo();
  storyboardCount.textContent = "生成中…";
  storyboardList.classList.add("empty-state");
  storyboardList.innerHTML = "<p>生成中…正在拆解剧情，并按顺序为每个分镜生成通义万相图片。</p>";
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
    videoPreview.innerHTML = '<div class="play-mark">▶</div><p>点击“生成视频”后会在这里播放 mp4</p>';
  }
});

storyInput.addEventListener("keydown", event => {
  if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
    generateStoryboards();
  }
});
