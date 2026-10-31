#!/usr/bin/env bash
# M02 v7.1 活人感 · We Never 10s 试片（幕1 → 幕2「两个人都觉得：对方不在乎。」悬住）
# 纯卡点字 · 静底 · 无旁白/TTS · 音轨只挂 We Never
#
# 用法（Mac）：
#   bash render.sh                 # 默认读 BGM_DEFAULT，产出 + 复制 + 回传
#   BGM=/path/to.wav bash render.sh
#   NO_BGM=1 bash render.sh        # 只出无声画面预览（不可当成片交付）
set -euo pipefail

ROOT_DEFAULT="/Users/mac/Documents/Codex/2026-10-28/zui"
ROOT="${ROOT:-$ROOT_DEFAULT}"
WORK="${WORK:-$ROOT/work/vibe-m02-v7}"
BGM="${BGM:-$ROOT/work/vibe-release/audio/WeNever_原参考同版本_float.wav}"
DESK_DIR="${DESK_DIR:-/Users/mac/Desktop/AI中转/视频号待发/1031/许隽华_人格误会_M02_T人也会共情_F人也会讲逻辑}"
# 派工卡回传目录：今日待办/1031_Cursor/回传/ 的绝对路径（未设置则跳过并提示）
HUICHUAN_DIR="${HUICHUAN_DIR:-}"
MODEL_NAME="${MODEL_NAME:-Claude Opus 5.5}"
NO_BGM="${NO_BGM:-0}"

W=1080; H=1920; FPS=30
DUR=12.00
FI=0.45   # 字淡入
FO=0.35   # 字淡出
BG="0x111110"
C_BIG="0xF1ECE3"
C_SMALL="0x9A938A"
S_BIG=84
S_SMALL=54

pick_font() {
  if [[ -n "${FONT:-}" ]]; then echo "$FONT"; return; fi
  local c
  for c in \
    "/System/Library/Fonts/PingFang.ttc" \
    "/System/Library/Fonts/Hiragino Sans GB.ttc" \
    "/System/Library/Fonts/STHeiti Medium.ttc" \
    "/Library/Fonts/Arial Unicode.ttf" \
    "/usr/share/fonts/truetype/wqy/wqy-microhei.ttc" \
    "/usr/share/fonts/truetype/droid/DroidSansFallbackFull.ttf"; do
    [[ -f "$c" ]] && { echo "$c"; return; }
  done
  echo "找不到中文字体，请用 FONT=/path/to/font 指定" >&2; exit 1
}
FONT_FILE="$(pick_font)"

OUT_DIR="$WORK/out"
TMP_DIR="$WORK/build"
mkdir -p "$OUT_DIR" "$TMP_DIR/text"

# 屏显时间轴：id|start|end|size|color|y_center|text
# end=HOLD 表示悬到片尾不淡出。镜间至少 ~0.55s 空底（淡出 + 间隙）。
# 「帮你弄」淡出后空 0.6s 半拍再「摇头」。
TIMELINE=(
  "s1|0.30|1.90|$S_SMALL|$C_SMALL|900|她眼睛红了。"
  "s2a|2.15|4.25|$S_BIG|$C_BIG|860|你问：怎么了？"
  "s2b|2.65|4.25|$S_BIG|$C_BIG|990|要不要我帮你弄？"
  "s4|4.85|6.55|$S_BIG|$C_BIG|920|她摇头，不说话了。"
  "s5|6.80|8.10|$S_BIG|$C_BIG|920|你急着把事弄好。"
  "s6|8.30|9.50|$S_SMALL|$C_SMALL|920|她只想你先坐下来。"
  "s7a|9.75|HOLD|$S_BIG|$C_BIG|860|于是两个人都觉得："
  "s7b|10.35|HOLD|$S_BIG|$C_BIG|990|对方不在乎。"
)

alpha_expr() {  # smoothstep 淡入/淡出
  local s="$1" e="$2"
  local fin="clip((t-$s)/$FI\,0\,1)"
  local ein="($fin*$fin*(3-2*$fin))"
  if [[ "$e" == "HOLD" ]]; then
    echo "$ein"
  else
    local fout="clip(($e-t)/$FO\,0\,1)"
    echo "min($ein\,($fout*$fout*(3-2*$fout)))"
  fi
}

FILTER="color=c=$BG:s=${W}x${H}:r=$FPS:d=$DUR,format=yuv420p"
for row in "${TIMELINE[@]}"; do
  IFS='|' read -r id s e size color y text <<<"$row"
  tf="$TMP_DIR/text/$id.txt"
  printf '%s' "$text" >"$tf"
  if [[ "$e" == "HOLD" ]]; then en="gte(t\,$s)"; else en="between(t\,$s\,$e)"; fi
  FILTER+=",drawtext=fontfile='$FONT_FILE':textfile='$tf':fontsize=$size:fontcolor=$color"
  FILTER+=":x=(w-text_w)/2:y=$y-text_h/2:enable='$en':alpha='$(alpha_expr "$s" "$e")'"
done
FILTER+="[v]"

if [[ "$NO_BGM" == "1" ]]; then
  OUT="$OUT_DIR/M02_v7_10s试片_画面预览_无BGM.mp4"
  printf '%s' "$FILTER" >"$TMP_DIR/filter.txt"
  ffmpeg -hide_banner -loglevel error -y -filter_complex_script "$TMP_DIR/filter.txt" \
    -map "[v]" -c:v libx264 -preset slow -crf 16 -pix_fmt yuv420p -r $FPS -t $DUR \
    -movflags +faststart "$OUT"
else
  [[ -f "$BGM" ]] || { echo "BGM 不存在：$BGM（不要用别的音乐顶替）" >&2; exit 1; }
  OUT="$OUT_DIR/M02_v7_10s试片_WeNever.mp4"
  AFO_ST=$(awk "BEGIN{printf \"%.3f\", $DUR-0.15}")
  FILTER+=";[0:a]atrim=0:$DUR,asetpts=PTS-STARTPTS,afade=t=in:st=0:d=0.05,afade=t=out:st=$AFO_ST:d=0.15,aformat=sample_rates=48000:channel_layouts=stereo[a]"
  printf '%s' "$FILTER" >"$TMP_DIR/filter.txt"
  ffmpeg -hide_banner -loglevel error -y -i "$BGM" -filter_complex_script "$TMP_DIR/filter.txt" \
    -map "[v]" -map "[a]" -c:v libx264 -preset slow -crf 16 -pix_fmt yuv420p -r $FPS \
    -c:a aac -b:a 256k -t $DUR -movflags +faststart "$OUT"
fi

probe() { ffprobe -v error "$@" "$OUT"; }
DUR_OUT=$(probe -show_entries format=duration -of default=nk=1:nw=1)
RES=$(probe -select_streams v:0 -show_entries stream=width,height -of csv=s=x:p=0)
FPS_OUT=$(probe -select_streams v:0 -show_entries stream=r_frame_rate -of default=nk=1:nw=1)
NA=$(probe -select_streams a -show_entries stream=index -of csv=p=0 | wc -l | tr -d ' ')
if command -v shasum >/dev/null; then SHA=$(shasum -a 256 "$OUT" | cut -d' ' -f1); else SHA=$(sha256sum "$OUT" | cut -d' ' -f1); fi

REPORT="$OUT_DIR/回传_10s试片.md"
cat >"$REPORT" <<EOF
# 回传｜M02 v7.1 活人感 · We Never 10s 试片

- 实际会话模型：$MODEL_NAME（Cursor Cloud Agent）
- 文件：\`$(basename "$OUT")\`
- 时长：${DUR_OUT}s｜分辨率：${RES}｜帧率：${FPS_OUT}
- 音轨数：${NA}（$( [[ "$NO_BGM" == "1" ]] && echo "无声画面预览，未挂 BGM" || echo "仅 We Never，首 50ms / 尾 150ms 淡化，无旁白/TTS")）
- sha256：\`$SHA\`
- 字体：$(basename "$FONT_FILE")｜静底 #111110，无闪光线/转圈/扫线

## 屏上顺序（秒）
1. 0.30–1.90 小「她眼睛红了。」
2. 2.15–4.25 大「你问：怎么了？」→ 2.65 第二行「要不要我帮你弄？」
3. 4.25–4.85 空底半拍
4. 4.85–6.55 大「她摇头，不说话了。」
5. 6.80–8.10 大「你急着把事弄好。」
6. 8.30–9.50 小「她只想你先坐下来。」
7. 9.75 大「于是两个人都觉得：」→ 10.35「对方不在乎。」悬到片尾（${DUR}s）

## 自打分：6.5 / 10（诚实）
- 做到：照抄 LOCK 屏显顺序、字少、每镜一句、镜间有气口、静底、无「三条/三招」。
- 没做到/待验：卡点是按时间轴手排，**没对 We Never 的实际拍点对齐**（渲染时会话里拿不到这条音频，没听过）；若字进字出和鼓点/和弦切换错位，需按实际拍点微调 TIMELINE。
- 风险：纯字静底，活人感主要靠文案本身，画面层面偏素；第 2 镜两行字是全片最密的一处。
EOF

copy_to() { mkdir -p "$1"; cp "$OUT" "$1/"; cp "$REPORT" "$1/"; echo "已复制 → $1"; }
if [[ "$NO_BGM" != "1" ]]; then
  copy_to "$DESK_DIR"
  if [[ -n "$HUICHUAN_DIR" ]]; then
    mkdir -p "$HUICHUAN_DIR"; cp "$REPORT" "$HUICHUAN_DIR/C_M02_v7_10s试片_WeNever.md"
    echo "派工卡回传 → $HUICHUAN_DIR/C_M02_v7_10s试片_WeNever.md"
  else
    echo "提示：未设置 HUICHUAN_DIR，派工卡回传未写（今日待办/1031_Cursor/回传/）" >&2
  fi
fi

echo "OUT=$OUT"
echo "DUR=$DUR_OUT RES=$RES FPS=$FPS_OUT AUDIO_STREAMS=$NA"
echo "SHA256=$SHA"
