# vibe-m02-v7 · M02 v7.1 活人感 · We Never 10s 试片

纯卡点字、静底、无旁白；音轨只挂 We Never。只渲幕1 → 幕2「于是两个人都觉得：对方不在乎。」悬住（12.0s）。

依赖：`ffmpeg`（带 freetype / drawtext，Homebrew 版即可）。字体自动选 PingFang → 冬青黑 → 华文黑体，可用 `FONT=` 覆盖。

在 Mac 上：

```bash
mkdir -p /Users/mac/Documents/Codex/2026-10-28/zui/work/vibe-m02-v7
cp render.sh /Users/mac/Documents/Codex/2026-10-28/zui/work/vibe-m02-v7/
cd /Users/mac/Documents/Codex/2026-10-28/zui/work/vibe-m02-v7
HUICHUAN_DIR="<今日待办绝对路径>/1031_Cursor/回传" bash render.sh
```

产出：

- `out/M02_v7_10s试片_WeNever.mp4` + `out/回传_10s试片.md`
- 复制到桌面 `AI中转/视频号待发/1031/许隽华_人格误会_M02_T人也会共情_F人也会讲逻辑/`（mp4 + 回传）
- `$HUICHUAN_DIR/C_M02_v7_10s试片_WeNever.md`

BGM 缺失会直接报错退出，不会用别的音乐顶替。`NO_BGM=1` 只出无声画面预览，不可交付。

屏显时间轴在 `render.sh` 的 `TIMELINE`；听过 We Never 后若字进字出与拍点错位，只改这里的秒数。
