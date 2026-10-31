// 回传用：每镜画了什么 / 落在哪个 beat / 屏上字数；抽帧时刻；屏显与 LOCK 逐字比对。
// 用法：node scripts/report-shots.mjs table | frames | lock <LOCK_FILE>
import {existsSync, readFileSync} from 'node:fs';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const load = (p) => JSON.parse(readFileSync(join(root, 'src', p), 'utf8'));
const def = load('actions.json');
const beats = load('beats.json');
const copy = load('copy.json');
const base = load('timeline.base.json');
const FPS = 30;

const han = (s) => (s.match(/\p{Script=Han}/gu) ?? []).length;
const actT = (a) => beats.actions?.[a.id]?.t ?? (beats.cues?.[a.cue]?.start ?? base.cues.find((c) => c.id === a.cue).start) + a.offset;
const LABEL_SHOTS = new Set(['02', '06']);

const cmd = process.argv[2];

if (cmd === 'table') {
	console.log('| 镜 | 画了什么（代码画出的图形） | 落在哪个 beat（秒 · 帧 · 音效） | 屏上字（汉字数） |');
	console.log('|---|---|---|---|');
	for (const shot of def.shots) {
		const acts = def.actions.filter((a) => shot.cues.includes(a.cue));
		const beatCol = acts
			.map((a) => {
				const r = beats.actions?.[a.id];
				const how = r?.onset != null ? '瞬态' : '基准';
				const t = actT(a);
				return `${t.toFixed(2)}s/f${Math.round(t * FPS)} ${a.what.split('，')[0]}${a.sfx ? `〔${a.sfx}〕` : ''}（${how}）`;
			})
			.join('<br>');
		const line = copy.lines[shot.line];
		const big = line.segs.filter((s) => s.role === 'big');
		const small = line.segs.filter((s) => s.role !== 'big');
		const labels = LABEL_SHOTS.has(shot.n) ? 2 : 0;
		const words = [
			big.length ? `大 ${big.map((s) => `「${s.t}」`).join('')} ${big.reduce((n, s) => n + han(s.t), 0)} 字` : null,
			small.length ? `小 ${small.map((s) => `「${s.t}」`).join('')} ${small.reduce((n, s) => n + han(s.t), 0)} 字` : null,
			labels ? `角色名「她」「你」2 字` : null,
		]
			.filter(Boolean)
			.join('<br>');
		console.log(`| ${shot.n} | ${shot.drew} | ${beatCol} | ${words} |`);
	}
} else if (cmd === 'frames') {
	const t = Object.fromEntries(def.actions.map((a) => [a.id, actT(a)]));
	const picks = [t.s1_tear + 0.2, t.s2_box + 0.3, t.s4_shake + 0.4, t.s5_tick3 + 0.3, t.s6_think + 0.45, t.s7_cold + 0.15, t.s7_split + 0.6, base.duration - 0.05];
	console.log(picks.map((s) => Math.min(Math.round(s * FPS), base.duration * FPS - 1)).join(' '));
} else if (cmd === 'lock') {
	const lockFile = process.argv[3];
	const bad = copy.lines.filter((l) => l.segs.map((s) => s.t).join('') !== l.text);
	if (bad.length) {
		console.log(`❌ 屏上分段拼回去与 LOCK 句不一致：${bad.map((l) => l.text).join(' ')}`);
	} else if (!lockFile || !existsSync(lockFile)) {
		console.log(`❌ 未找到 LOCK 文件，只核对了屏上分段拼回去与 \`src/copy.json\` 的 6 句一致，未与 LOCK 原文逐字比对`);
	} else {
		const flat = readFileSync(lockFile, 'utf8').replace(/\s/gu, '');
		const miss = copy.lines.filter((l) => !flat.includes(l.text)).map((l) => l.text);
		console.log(
			miss.length
				? `❌ LOCK 文件中找不到：${miss.join(' ')}（须人工核对）`
				: `✅ 6 句屏显（含气泡分段）拼回去与 LOCK 文件逐字一致（\`${lockFile}\`）`,
		);
	}
} else {
	console.error('用法：node scripts/report-shots.mjs table | frames | lock <LOCK_FILE>');
	process.exit(2);
}
