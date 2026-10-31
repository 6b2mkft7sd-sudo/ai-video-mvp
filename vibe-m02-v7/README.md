# vibe-m02-v7 · M02 v7.1 · Remotion 10s 试片（We Never）

Remotion 4 真工程，Composition `VibeM02RemotionTrial10s`（1080×1920 · 30fps · 360f）。只渲幕1 → 幕2「于是两个人都觉得：对方不在乎。」悬住。音轨只挂 We Never，无旁白。

上一版 ffmpeg drawtext 管线已作废，移入 `_deprecated_pil/`，不参与主渲。

## Mac 上出试片

```bash
rsync -a --exclude node_modules --exclude out ./ \
  "/Users/mac/Documents/Codex/2026-10-28/zui/work/vibe-m02-v7/"
cd "/Users/mac/Documents/Codex/2026-10-28/zui/work/vibe-m02-v7"
bash scripts/trial.sh
```

`scripts/trial.sh` 按顺序：

1. 找 We Never（`zui/work/vibe-release/audio/WeNever_原参考同版本_float.wav`，找不到再用 E01 工程里的备用拷贝），找不到就报错退出，不顶替
2. `scripts/prep-audio.mjs`：裁 12s、首 50ms / 尾 150ms 淡化 → `public/soundtrack.wav`；spectral flux 测瞬态，把每句入场吸附到 ±0.22s 内最强的瞬态（顺序与「帮你弄」后半拍不变）→ `src/beats.json`；画波形 `out/soundtrack_waveform.png`
3. `npx remotion render src/index.ts VibeM02RemotionTrial10s out/M02_v7_Remotion_10s试片_WeNever.mp4 --chrome-mode=headless-shell --codec=h264`
4. ffprobe + sha256 + 抽帧 `out/contact_sheet.png`，屏显逐字比对 LOCK 文件
5. 写 `回传_Remotion_10s试片.md`，复制 mp4 + 回传到视频号待发目录，派工回传写 `AI中转/今日待办/1031_Cursor/回传/`（`~/Desktop/今日待办/…` 存在则双写）

路径都能用环境变量覆盖：`BGM`、`LOCK_FILE`、`DESK_DIR`、`HC_DIR`、`HC_SYNC_DIR`。`SILENT=1` 只出无声画面预览（状态 HOLD，不可交付）。

## 改动入口

- 时间轴基准：`src/timeline.base.json`
- 画面：`src/VibeM02RemotionTrial10s.tsx`，底 `src/components/Backdrop.tsx`，字 `src/components/Line.tsx`
- 预览：`npm run studio`
