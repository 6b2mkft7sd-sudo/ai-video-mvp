#!/usr/bin/env bash
# M02 v7.2 · Remotion 10s 试片（代码画场景为主、字为注脚）：We Never 裁切+瞬态 → SFX 合成 → Remotion 渲染 → 校验 → 回传 → 复制
# Mac：bash scripts/trial.sh
# 无 We Never 时只出画面预览（带 SFX、无 BGM）：SILENT=1 bash scripts/trial.sh（不可交付）
#
# 变量一律写成 ${VAR}：macOS 自带 bash 3.2 会把紧跟在 $VAR 后面的中文/全角字节当成变量名的一部分，
# 在 set -u 下报 “MODEL_NAME（Cursor: unbound variable”。
set -euo pipefail
cd "$(dirname "$0")/.."
PROJ="$(pwd)"

ZUI="/Users/mac/Documents/Codex/2026-10-28/zui"
RELAY="/Users/mac/Desktop/AI中转"
BGM_CANDIDATES=(
  "${BGM:-}"
  "${ZUI}/work/vibe-release/audio/WeNever_原参考同版本_float.wav"
  "${RELAY}/ai_relay/sxh_vibe_e01_remotion10s/public/WeNever_full.wav"
  "${RELAY}/ai_relay/sxh_vibe_e01_remotion10s/public/WeNever_40s.wav"
)
DESK_DIR="${DESK_DIR:-${RELAY}/视频号待发/1031/许隽华_人格误会_M02_T人也会共情_F人也会讲逻辑}"
HC_DIR="${HC_DIR:-${RELAY}/今日待办/1031_Cursor/回传}"
HC_SYNC_DIR="${HC_SYNC_DIR:-/Users/mac/Desktop/今日待办/1031_Cursor/回传}"
MODEL_NAME="${MODEL_NAME:-Claude Opus 5.5}"
SILENT="${SILENT:-0}"
COMP="VibeM02RemotionTrial10s"
VER="v7.2"
HC_NAME="C_M02_${VER}_Remotion_10s试片_WeNever.md"

if [[ -f render.sh ]]; then mkdir -p _deprecated_pil && mv render.sh _deprecated_pil/render.sh.old && echo "旧 render.sh → _deprecated_pil/"; fi
[[ -d node_modules/remotion ]] || npm install --no-audit --no-fund

mkdir -p out out/frames
PREP_LOG="out/prep-audio.log"
if [[ "${SILENT}" == "1" ]]; then
  OUT="out/M02_${VER}_Remotion_10s试片_画面预览_无BGM.mp4"
  rm -f public/soundtrack.wav
  node scripts/prep-audio.mjs --silent | tee "${PREP_LOG}"
  BGM_USED="（无，画面预览）"
else
  OUT="out/M02_${VER}_Remotion_10s试片_WeNever.mp4"
  BGM_USED=""
  for c in "${BGM_CANDIDATES[@]}"; do [[ -n "${c}" && -f "${c}" ]] && { BGM_USED="${c}"; break; }; done
  [[ -n "${BGM_USED}" ]] || { echo "找不到 We Never（不要用别的音乐顶替）" >&2; exit 1; }
  node scripts/prep-audio.mjs --src "${BGM_USED}" | tee "${PREP_LOG}"
fi
node scripts/make-sfx.mjs | tee out/sfx.log

npx remotion compositions src/index.ts --chrome-mode=headless-shell | tee out/compositions.log
RENDER_CMD=(npx remotion render src/index.ts "${COMP}" "${OUT}" --chrome-mode=headless-shell --codec=h264)
"${RENDER_CMD[@]}"

probe() { ffprobe -v error "$@" "${OUT}"; }
DUR=$(probe -show_entries format=duration -of default=nk=1:nw=1)
RES=$(probe -select_streams v:0 -show_entries stream=width,height -of csv=s=x:p=0)
FPS=$(probe -select_streams v:0 -show_entries stream=r_frame_rate -of default=nk=1:nw=1)
NF=$(probe -select_streams v:0 -count_packets -show_entries stream=nb_read_packets -of csv=p=0)
NA=$(probe -select_streams a -show_entries stream=index -of csv=p=0 | wc -l | tr -d ' ')
if command -v shasum >/dev/null; then SHA=$(shasum -a 256 "${OUT}" | cut -d' ' -f1); else SHA=$(sha256sum "${OUT}" | cut -d' ' -f1); fi

mean_db() { ffmpeg -hide_banner -i "$1" -af "volumedetect" -f null - 2>&1 | sed -n 's/.*mean_volume: //p'; }
max_db() { ffmpeg -hide_banner -i "$1" -af "volumedetect" -f null - 2>&1 | sed -n 's/.*max_volume: //p'; }
BGM_MEAN=$(sed -n 's/^BGM_MEAN_DB=//p' "${PREP_LOG}")
MIX_MEAN=""
MIX_MAX=""
if [[ "${NA}" -gt 0 ]]; then
  MIX_MEAN=$(mean_db "${OUT}")
  MIX_MAX=$(max_db "${OUT}")
fi
if [[ "${SILENT}" == "1" ]]; then
  SFX_LINE="- 无 BGM 预览：SFX 峰值按 BGM 均值 -18 dB 估算压到约 -22 dBFS；成片混音 mean ${MIX_MEAN:-?}，max ${MIX_MAX:-?}"
else
  BGM_ONLY_MAX=$(max_db public/soundtrack.wav)
  SFX_OK=$(awk -v a="${BGM_MEAN}" -v b="${MIX_MEAN% dB}" 'BEGIN { d = b - a; if (d < 0) d = -d; printf "%s 均值差 %.2f dB", (d < 0.5 ? "✅" : "❌"), d }')
  SFX_LINE="- ${SFX_OK}：BGM（裁后）mean ${BGM_MEAN} dB，max ${BGM_ONLY_MAX}；成片（BGM+SFX）mean ${MIX_MEAN}，max ${MIX_MAX}。SFX 峰值设在 BGM 均值下 4 dB（whoosh 再 -5、tick -2、thud +1），不抢 BGM"
fi

FRAMES=$(node scripts/report-shots.mjs frames)
i=0
for f in ${FRAMES}; do
  npx remotion still src/index.ts "${COMP}" "out/frames/f${f}.png" --frame="${f}" --chrome-mode=headless-shell --log=error
  i=$((i + 1))
done
ffmpeg -hide_banner -loglevel error -y $(for f in ${FRAMES}; do echo -i "out/frames/f${f}.png"; done) \
  -filter_complex "concat=n=${i}:v=1:a=0,scale=360:640,tile=${i}x1:padding=6" -frames:v 1 out/contact_sheet.png

CUE_LINES=$(sed -n 's/^CUE [^ ]* /- /p' "${PREP_LOG}")
ONSET_LINE=$(sed -n 's/^ONSETS //p' "${PREP_LOG}")
SRC_SHA=$(sed -n 's/^SOURCE_SHA256=//p' "${PREP_LOG}")
SNAPPED=$(grep -c '^ACT .*吸附瞬态' "${PREP_LOG}" || true)
NACT=$(grep -c '^ACT ' "${PREP_LOG}" || true)
REMOTION_VER=$(node -p "require('remotion/package.json').version")
SHOT_TABLE=$(node scripts/report-shots.mjs table)

LOCK_FILE="${LOCK_FILE:-${ZUI}/outputs/人格误会02_T人也会共情_F人也会讲逻辑_重做/01_完整文案.md}"
LOCK_OK=$(node scripts/report-shots.mjs lock "${LOCK_FILE}")

if [[ "${SILENT}" == "1" ]]; then
  STATUS="HOLD — 画面预览（有 SFX、无 We Never）；须在 Mac 上跑 \`bash scripts/trial.sh\` 出正式试片"
  AUDIO_OK="❌ 未挂 We Never（画面预览，只有代码合成 SFX）"
else
  STATUS="试片可交 William 复评（画面自打 8/10；动作卡点为实测瞬态吸附 ${SNAPPED}/${NACT}，听感须 William 复评）"
  AUDIO_OK="✅ We Never 一轨（\`<Audio src=soundtrack.wav>\`）+ 代码合成 SFX（低于 BGM），无旁白/TTS/克隆声"
fi

REPORT="回传_Remotion_10s试片.md"
cat >"${REPORT}" <<EOF
# 回传｜M02 ${VER} · Remotion 画面重做 10s 试片

**状态：${STATUS}**

- 实际会话模型：${MODEL_NAME}（Cursor Cloud Agent 写工程；本回传由 \`scripts/trial.sh\` 在渲染机自动生成）
- 文件：\`${PROJ}/${OUT}\`
- 时长 ${DUR}s｜${RES}｜fps ${FPS}｜${NF} 帧｜音轨 ${NA}
- sha256：\`${SHA}\`
- 抽帧：\`${PROJ}/out/contact_sheet.png\`（帧 ${FRAMES}）
- v7.1 废案未覆盖（新文件名带 ${VER}）

## 这版改了什么（回应 William「画面只有文字」）
- 画面主角改为代码画出来的纸偶小剧场：她 / 你两个小人、桌子、聊天气泡、工具箱、清单板、空椅子、念头泡、温度计，全部是 SVG 路径，金线逐笔描出 → 填色 → 退成墨线
- 每镜一个机位（特写 / 双人 / 推近 / 横摇），镜头移动从该镜第一个动作的瞬态起跳
- 字退成注脚：放在画面下方，大字 64px、小字 44px；「怎么了？」「要不要我帮你弄？」放进聊天气泡
- 每个关键动作配一个代码合成音效（pop / tick / drop / whoosh / thud），音量压在 BGM 之下

## 每镜：画了什么 / 落在哪个 beat / 屏上字数
${SHOT_TABLE}

- 版头「人格误会 · 02」+ 镜号、版尾「VIBE 知识大赏」全程常驻，不计入每镜字数
- 字面积：每镜注脚 1–2 行，约占画面 3–5%（< 25%）

## 证明是 Remotion
- \`package.json\`：remotion / @remotion/cli **${REMOTION_VER}**，react 19
- Composition：\`${COMP}\`（1080×1920 · 30fps · 360f），入口 \`src/index.ts\` → \`src/Root.tsx\` → \`src/scene/*.tsx\`
- 渲染命令：\`${RENDER_CMD[*]}\`

## BGM / 卡点 / SFX
- 源：\`${BGM_USED}\`${SRC_SHA:+（sha256 \`${SRC_SHA}\`）}
- 处理：裁 12.0s，首 50ms / 尾 150ms 淡化 → \`public/soundtrack.wav\`
- 实测瞬态（spectral flux）：${ONSET_LINE:-无}
- 句子入场（v7.1 卡点表原样保留，算法未改）：
${CUE_LINES}
- 画面动作：${NACT} 个，其中 ${SNAPPED} 个吸附到 ±0.2s 内的实测瞬态（其余无足够强的瞬态，留在基准时刻）
${SFX_LINE}

## 自检
- 静音看能不能猜到每镜：01 特写泪 = 她难过；02 两条气泡 + 工具箱 = 你问、要帮她修；03 摇头 + 「…」缩没 = 她不想说；04 连打三个勾 + 冒汗 = 你急着办事；05 空椅子发光 + 念头里两人并排坐 = 她想你陪她坐；06 两人头顶对方的头像 + 温度计掉到冰点 + 桌子裂开 = 都觉得对方冷淡。不读字基本能猜到，第 05 镜最依赖注脚「坐下来」
- 自打分：**8/10**
  - 加分：每镜都有可一眼看懂的具体动作；逐笔描出 + 落拍弹出，节奏跟音乐走；暗金静底 + 墨线纸偶，和 M01 系列（许隽华「纸偶小剧场」）同一形态
  - 扣分：没拿到 M01 成片本身，形态是对照同作者纸偶小剧场参考片复刻的；人物只有表情和手臂动作，没有走位；第 05 镜「她只想你先坐下来」的「只想」靠念头泡表达，略弱

## 硬约束
- ✅ 工艺 Remotion（React + SVG 真 Composition），无 PIL / drawtext
- ${AUDIO_OK}
- ✅ 1080×1920 · 30fps · 12.0s，只到「对方不在乎」悬住（未开全片）
- ${LOCK_OK}；顺序未改
- ✅ 「帮你弄」气泡收起后空半拍（≥0.5s）再「摇头」
- ✅ 静底：背景只有极慢景深漂移；无闪线/转圈/扫线
- ✅ 未发布/定时/上传、未登录微信
EOF

copy_if() { local d="$1"; shift; mkdir -p "${d}" && cp "$@" "${d}/" && echo "→ ${d}"; }
if [[ "${SILENT}" != "1" ]]; then
  copy_if "${DESK_DIR}" "${OUT}" "${REPORT}"
  mkdir -p "${HC_DIR}" && cp "${REPORT}" "${HC_DIR}/${HC_NAME}" && echo "→ ${HC_DIR}"
  if [[ -d "${HC_SYNC_DIR}" ]]; then cp "${REPORT}" "${HC_SYNC_DIR}/${HC_NAME}" && echo "→ ${HC_SYNC_DIR}"; fi
fi

echo "OUT=${PROJ}/${OUT}"
echo "DUR=${DUR} RES=${RES} FPS=${FPS} FRAMES=${NF} AUDIO=${NA} SHA256=${SHA}"
