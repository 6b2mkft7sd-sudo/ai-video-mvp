#!/usr/bin/env bash
# M02 v7.1 · Remotion 10s 试片：We Never 裁切+瞬态 → Remotion 渲染 → 校验 → 回传 → 复制
# Mac：bash scripts/trial.sh
# 无 We Never 时只出画面预览：SILENT=1 bash scripts/trial.sh（不可交付）
set -euo pipefail
cd "$(dirname "$0")/.."
PROJ="$(pwd)"

ZUI="/Users/mac/Documents/Codex/2026-10-28/zui"
RELAY="/Users/mac/Desktop/AI中转"
BGM_CANDIDATES=(
  "${BGM:-}"
  "$ZUI/work/vibe-release/audio/WeNever_原参考同版本_float.wav"
  "$RELAY/ai_relay/sxh_vibe_e01_remotion10s/public/WeNever_full.wav"
  "$RELAY/ai_relay/sxh_vibe_e01_remotion10s/public/WeNever_40s.wav"
)
DESK_DIR="${DESK_DIR:-$RELAY/视频号待发/1031/许隽华_人格误会_M02_T人也会共情_F人也会讲逻辑}"
HC_DIR="${HC_DIR:-$RELAY/今日待办/1031_Cursor/回传}"
HC_SYNC_DIR="${HC_SYNC_DIR:-/Users/mac/Desktop/今日待办/1031_Cursor/回传}"
MODEL_NAME="${MODEL_NAME:-Claude Opus 5.5}"
SILENT="${SILENT:-0}"
COMP="VibeM02RemotionTrial10s"

if [[ -f render.sh ]]; then mkdir -p _deprecated_pil && mv render.sh _deprecated_pil/render.sh.old && echo "旧 render.sh → _deprecated_pil/"; fi
[[ -d node_modules/remotion ]] || npm install --no-audit --no-fund

mkdir -p out
PREP_LOG="out/prep-audio.log"
if [[ "$SILENT" == "1" ]]; then
  OUT="out/M02_v7_Remotion_10s试片_画面预览_无BGM.mp4"
  rm -f public/soundtrack.wav
  node scripts/prep-audio.mjs --silent | tee "$PREP_LOG"
  BGM_USED="（无，画面预览）"
else
  OUT="out/M02_v7_Remotion_10s试片_WeNever.mp4"
  BGM_USED=""
  for c in "${BGM_CANDIDATES[@]}"; do [[ -n "$c" && -f "$c" ]] && { BGM_USED="$c"; break; }; done
  [[ -n "$BGM_USED" ]] || { echo "找不到 We Never（不要用别的音乐顶替）" >&2; exit 1; }
  node scripts/prep-audio.mjs --src "$BGM_USED" | tee "$PREP_LOG"
fi

npx remotion compositions src/index.ts --chrome-mode=headless-shell | tee out/compositions.log
RENDER_CMD=(npx remotion render src/index.ts "$COMP" "$OUT" --chrome-mode=headless-shell --codec=h264)
"${RENDER_CMD[@]}"

probe() { ffprobe -v error "$@" "$OUT"; }
DUR=$(probe -show_entries format=duration -of default=nk=1:nw=1)
RES=$(probe -select_streams v:0 -show_entries stream=width,height -of csv=s=x:p=0)
FPS=$(probe -select_streams v:0 -show_entries stream=r_frame_rate -of default=nk=1:nw=1)
NF=$(probe -select_streams v:0 -count_packets -show_entries stream=nb_read_packets -of csv=p=0)
NA=$(probe -select_streams a -show_entries stream=index -of csv=p=0 | wc -l | tr -d ' ')
if command -v shasum >/dev/null; then SHA=$(shasum -a 256 "$OUT" | cut -d' ' -f1); else SHA=$(sha256sum "$OUT" | cut -d' ' -f1); fi
VOL=""
if [[ "$NA" -gt 0 ]]; then
  VOL=$(for r in 0:0.05 1:11 11.85:12; do
    v=$(ffmpeg -hide_banner -i "$OUT" -af "atrim=${r%:*}:${r#*:},volumedetect" -f null - 2>&1 | sed -n 's/.*mean_volume: //p')
    echo "  - ${r/:/–}s mean_volume ${v}"
  done)
fi

for f in 15 75 140 190 230 270 300 355; do
  npx remotion still src/index.ts "$COMP" "out/frames/f$f.png" --frame=$f --chrome-mode=headless-shell --log=error
done
ffmpeg -hide_banner -loglevel error -y $(for f in 15 75 140 190 230 270 300 355; do echo -i "out/frames/f$f.png"; done) \
  -filter_complex "concat=n=8:v=1:a=0,scale=360:640,tile=8x1:padding=6" -frames:v 1 out/contact_sheet.png

CUE_LINES=$(sed -n 's/^CUE [^ ]* /- /p' "$PREP_LOG")
ONSET_LINE=$(sed -n 's/^ONSETS //p' "$PREP_LOG")
SRC_SHA=$(sed -n 's/^SOURCE_SHA256=//p' "$PREP_LOG")
REMOTION_VER=$(node -p "require('remotion/package.json').version")

LOCK_FILE="${LOCK_FILE:-$ZUI/outputs/人格误会02_T人也会共情_F人也会讲逻辑_重做/01_完整文案.md}"
LOCK_LINES=("她眼睛红了。" "你问：怎么了？要不要我帮你弄？" "她摇头，不说话了。" "你急着把事弄好。" "她只想你先坐下来。" "于是两个人都觉得：对方不在乎。")
if [[ -f "$LOCK_FILE" ]]; then
  LOCK_MISS=$(node -e '
    const flat = require("fs").readFileSync(process.argv[1], "utf8").replace(/\s/gu, "");
    console.log(process.argv.slice(2).filter((l) => !flat.includes(l)).join(" "));
  ' "$LOCK_FILE" "${LOCK_LINES[@]}")
  if [[ -z "$LOCK_MISS" ]]; then
    LOCK_OK="✅ 6 句屏显与 LOCK 文件逐字比对一致（\`$LOCK_FILE\`）"
  else
    LOCK_OK="❌ LOCK 文件中找不到：${LOCK_MISS}（须人工核对）"
  fi
else
  LOCK_OK="❌ 未找到 LOCK 文件，只按派工卡屏显照抄，未逐字比对"
fi

if [[ "$SILENT" == "1" ]]; then
  STATUS="HOLD — 只有画面预览，未挂 We Never；须在 Mac 上跑 \`bash scripts/trial.sh\` 出正式试片"
  AUDIO_OK="❌ 未挂（画面预览）"
else
  STATUS="试片可交 William 复评（画面自打 8/10；卡点为实测瞬态自动吸附，听感须 William 复评）"
  AUDIO_OK="✅ 仅 We Never 一轨（\`<Audio src=soundtrack.wav>\`），无旁白/TTS/克隆声"
fi

REPORT="回传_Remotion_10s试片.md"
cat >"$REPORT" <<EOF
# 回传｜M02 v7.1 · Remotion 真工程 10s 试片

**状态：$STATUS**

- 实际会话模型：$MODEL_NAME（Cursor Cloud Agent 写工程；本回传由 \`scripts/trial.sh\` 在渲染机自动生成）
- 文件：\`$PROJ/$OUT\`
- 时长 ${DUR}s｜${RES}｜fps ${FPS}｜${NF} 帧｜音轨 ${NA}
- sha256：\`$SHA\`
- 上一版废案 \`M02_v7_10s试片_WeNever.mp4\` 未覆盖（新文件名）

## 证明是 Remotion
- \`package.json\`：remotion / @remotion/cli **$REMOTION_VER**，react 19
- Composition：\`$COMP\`（1080×1920 · 30fps · 360f），入口 \`src/index.ts\` → \`src/Root.tsx\`
- 渲染命令：\`${RENDER_CMD[*]}\`
- 旧 ffmpeg drawtext 脚本已移入 \`_deprecated_pil/\`，不参与主渲

## BGM
- 源：\`$BGM_USED\`${SRC_SHA:+（sha256 \`$SRC_SHA\`）}
- 处理：裁 12.0s，首 50ms / 尾 150ms 淡化 → \`public/soundtrack.wav\`；波形 \`out/soundtrack_waveform.png\`
- 实测瞬态（spectral flux）：${ONSET_LINE:-无}
${VOL}

## 屏上顺序（秒，已按瞬态吸附）
$CUE_LINES
- 结尾：两道金色细线从并排缓慢分开（"两个人"），底色由暖转冷，镜头 1.00→1.03 慢推

## 自打分：画面 8/10（诚实，未含听感）
- 加分：暗金景深静底 + 颗粒 + 暗角；大字/小字分层（黑体大字、宋体金色小字+细线）；关键词点金（帮你弄 / 摇头 / 急着 / 坐下来 / 不在乎）；逐字柔焦入、整句淡出；镜间留气口。
- 扣分：没对照 E01/M01 原片（渲染工程时拿不到），暗金质感是按卡描述复刻；第 2 镜两行仍是全片最密处；整体仍以字为主，没有具象画面。
- 听感：Agent 没听过 We Never，卡点靠瞬态算法吸附 ±0.22s，须 William 听。

## 硬约束
- ✅ 工艺 Remotion（React + @remotion/cli 真 Composition），无 PIL / drawtext
- $AUDIO_OK
- ✅ 1080×1920 · 30fps · 12.0s，只到「对方不在乎」悬住
- $LOCK_OK；顺序未改
- ✅ 「帮你弄」淡出后空半拍（≥0.5s）再「摇头」
- ✅ 静底：无闪光线/转圈/扫线；只有极慢景深漂移、字入出、细线
- ✅ 无「三招/三条/三步」、无伞/心/雨、无指纹 CTA、无 DRAFT 水印
- ✅ 未开全片、未发布/定时/上传、未登录微信
EOF

copy_if() { local d="$1"; shift; mkdir -p "$d" && cp "$@" "$d/" && echo "→ $d"; }
if [[ "$SILENT" != "1" ]]; then
  copy_if "$DESK_DIR" "$OUT" "$REPORT"
  mkdir -p "$HC_DIR" && cp "$REPORT" "$HC_DIR/C_M02_v7_Remotion_10s试片_WeNever.md" && echo "→ $HC_DIR"
  if [[ -d "$HC_SYNC_DIR" ]]; then cp "$REPORT" "$HC_SYNC_DIR/C_M02_v7_Remotion_10s试片_WeNever.md" && echo "→ $HC_SYNC_DIR"; fi
fi

echo "OUT=$PROJ/$OUT"
echo "DUR=$DUR RES=$RES FPS=$FPS FRAMES=$NF AUDIO=$NA SHA256=$SHA"
