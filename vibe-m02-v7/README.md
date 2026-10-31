# vibe-m02-v7 · M02 v7.2 · Remotion 10s 试片（We Never）

Remotion 4 真工程，Composition `VibeM02RemotionTrial10s`（1080×1920 · 30fps · 360f）。只渲幕1 → 幕2「于是两个人都觉得：对方不在乎。」悬住。音轨：We Never + 代码合成 SFX，无旁白。

v7.2 回应「画面只有文字」：画面主角是代码画出来的纸偶小剧场（她 / 你、桌子、聊天气泡、工具箱、清单板、空椅子、念头泡、温度计），SVG 路径金线逐笔描出再填色；字退成画面下方的注脚。文案 LOCK_v7.1 不改，v7.1 的句子卡点算法不改。

## Mac 上出试片

```bash
rsync -a --exclude node_modules --exclude out ./ \
  "/Users/mac/Documents/Codex/2026-10-28/zui/work/vibe-m02-v7/"
cd "/Users/mac/Documents/Codex/2026-10-28/zui/work/vibe-m02-v7"
bash scripts/trial.sh
```

产出 `out/M02_v7.2_Remotion_10s试片_WeNever.mp4`。`scripts/trial.sh` 按顺序：

1. 找 We Never（`zui/work/vibe-release/audio/WeNever_原参考同版本_float.wav`，找不到再用 E01 工程里的备用拷贝），找不到就报错退出，不顶替
2. `scripts/prep-audio.mjs`：裁 12s、首 50ms / 尾 150ms 淡化 → `public/soundtrack.wav`；spectral flux 测瞬态 → `src/beats.json`
   - `cues`：每句入场吸附到 ±0.22s 内最强瞬态（v7.1 原算法）
   - `actions`：`src/actions.json` 里每个画面动作（= 所属句子入场 + offset）再吸附到 ±0.2s 内的瞬态（同句内保持先后）
   - `bgmMeanDb`：BGM 平均响度，SFX 音量据此压低
3. `scripts/make-sfx.mjs`：代码合成 pop / tick / drop / whoosh / thud → `public/sfx/`
4. `npx remotion render src/index.ts VibeM02RemotionTrial10s out/M02_v7.2_Remotion_10s试片_WeNever.mp4 --chrome-mode=headless-shell --codec=h264`
5. ffprobe + sha256 + 响度对比 + 抽帧 `out/contact_sheet.png`；屏显（含气泡分段）逐字比对 LOCK 文件
6. 写 `回传_Remotion_10s试片.md`（每镜画了什么 / 落在哪个 beat / 屏上字数 / 自打分），复制 mp4 + 回传到视频号待发目录，派工回传写 `AI中转/今日待办/1031_Cursor/回传/`（`~/Desktop/今日待办/…` 存在则双写）

路径都能用环境变量覆盖：`BGM`、`LOCK_FILE`、`DESK_DIR`、`HC_DIR`、`HC_SYNC_DIR`、`MODEL_NAME`。`SILENT=1` 只出无 BGM 画面预览（带 SFX，状态 HOLD，不可交付）。

脚本里变量一律写成 `${VAR}`：macOS 自带 bash 3.2 会把紧跟在 `$VAR` 后的中文/全角字节当成变量名，`set -u` 下会报 `MODEL_NAME（Cursor: unbound variable`。

## 改动入口

- 文案（屏上分段）：`src/copy.json`；句子时间轴基准：`src/timeline.base.json`
- 画面动作与音效：`src/actions.json`（每镜描述也在这里，回传表格从这里生成）
- 场景：`src/scene/Stage.tsx`（组装 + 结尾裂桌）、`Her.tsx`、`You.tsx`、`Props.tsx`、`draw.tsx`（逐笔描出的基础图形）
- 机位：`src/VibeM02RemotionTrial10s.tsx` 的 `POSES`
- 预览：`npm run studio`
