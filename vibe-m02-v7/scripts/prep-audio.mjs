// We Never → public/soundtrack.wav（裁 DUR，首 50ms / 尾 150ms 淡化）+ 实测瞬态 → src/beats.json
// cues（句子入场，v7.1 已过听感）算法不动；actions（每个画面动作）在 cue 之上再吸附一次瞬态。
// 用法：node scripts/prep-audio.mjs --src <wav> | --silent
import {execFileSync, spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {existsSync, mkdirSync, readFileSync, writeFileSync} from 'node:fs';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const arg = (k, d) => {
	const i = process.argv.indexOf(`--${k}`);
	return i >= 0 ? process.argv[i + 1] : d;
};

const base = JSON.parse(readFileSync(join(root, 'src', 'timeline.base.json'), 'utf8'));
const dur = base.duration;
const beatsPath = join(root, 'src', 'beats.json');

const SNAP_WINDOW = 0.22;
const MIN_STRENGTH = 0.35;
const HALF_BEAT = 0.5;
const MIN_GAP = 0.2;

const resolveCues = (onsets) => {
	const snap = (t) => {
		let best = t;
		let bestScore = 0;
		for (const o of onsets) {
			const d = Math.abs(o.t - t);
			if (d > SNAP_WINDOW || o.s < MIN_STRENGTH) continue;
			const score = o.s * (1 - d / SNAP_WINDOW);
			if (score > bestScore) {
				bestScore = score;
				best = o.t;
			}
		}
		return best;
	};
	const B = Object.fromEntries(base.cues.map((c) => [c.id, c]));
	const start = Object.fromEntries(base.cues.map((c) => [c.id, snap(c.start)]));
	start.s2b = Math.max(start.s2b, start.s2a + 0.4);
	start.s7b = Math.max(start.s7b, start.s7a + 0.4);

	const order = ['s1', 's2a', 's4', 's5', 's6', 's7a'];
	const end = {};
	order.forEach((id, i) => {
		if (B[id].end === null) return void (end[id] = null);
		const gap = id === 's2a' ? HALF_BEAT : MIN_GAP;
		end[id] = Math.min(start[id] + (B[id].end - B[id].start), start[order[i + 1]] - gap);
	});
	end.s2b = end.s2a;
	end.s7b = null;
	const r3 = (v) => (v === null ? null : Number(v.toFixed(3)));
	return Object.fromEntries(base.cues.map((c) => [c.id, {start: r3(start[c.id]), end: r3(end[c.id])}]));
};

const printCues = (cues) => {
	for (const c of base.cues) {
		const r = cues[c.id];
		const moved = Math.abs(r.start - c.start) > 1e-6 ? `（基准 ${c.start}s → 吸附瞬态）` : '';
		console.log(`CUE ${c.id} ${r.start.toFixed(2)}–${r.end === null ? 'HOLD' : r.end.toFixed(2)} ${c.text}${moved}`);
	}
};

const actDef = JSON.parse(readFileSync(join(root, 'src', 'actions.json'), 'utf8'));

// offset 0 的动作钉在句子入场（cues 已吸附、已过听感）；其余动作在前后动作之间吸附，
// 全片保持先后、相隔 ≥ minGap；吸附不到就留在基准时刻。
const resolveActions = (onsets, cues) => {
	const {window: W, minStrength, minGap} = actDef.snap;
	const list = actDef.actions;
	const out = {};
	let prev = null;
	list.forEach((a, i) => {
		const base = cues[a.cue].start + a.offset;
		if (a.offset === 0) {
			const on = onsets.find((o) => Math.abs(o.t - base) < 1e-6) ?? null;
			out[a.id] = {t: Number(base.toFixed(3)), base: Number(base.toFixed(3)), onset: on ? on.t : null, strength: on ? on.s : null, anchor: true};
			prev = {t: base};
			return;
		}
		const next = list.slice(i + 1).find((b) => b.offset === 0);
		const floor = prev ? prev.t + minGap : -Infinity;
		const ceil = next ? cues[next.cue].start - minGap : Infinity;
		let best = null;
		let bestScore = 0;
		for (const o of onsets) {
			const d = Math.abs(o.t - base);
			if (d > W || o.s < minStrength || o.t < floor || o.t > ceil) continue;
			const score = o.s * (1 - d / W);
			if (score > bestScore) {
				bestScore = score;
				best = o;
			}
		}
		const t = best ? best.t : Math.max(base, floor);
		out[a.id] = {
			t: Number(t.toFixed(3)),
			base: Number(base.toFixed(3)),
			onset: best ? best.t : null,
			strength: best ? best.s : null,
		};
		prev = {t};
	});
	return out;
};

const printActions = (acts) => {
	for (const a of actDef.actions) {
		const r = acts[a.id];
		const pin = r.anchor ? '= 句子入场，' : '';
		const how = r.onset === null ? `${pin}无瞬态，留基准` : `${pin}吸附瞬态 ${r.onset}s（强度 ${r.strength}）`;
		console.log(`ACT ${a.id} ${r.t.toFixed(3)}s ${a.sfx ?? '-'} ${a.what}（${how}）`);
	}
};

if (process.argv.includes('--silent')) {
	const cues = resolveCues([]);
	const actions = resolveActions([], cues);
	writeFileSync(
		beatsPath,
		JSON.stringify({hasSoundtrack: false, source: null, bgmMeanDb: null, onsets: [], cues, actions}, null, 2) + '\n',
	);
	printCues(cues);
	printActions(actions);
	process.exit(0);
}

const src = arg('src');
if (!src || !existsSync(src)) {
	console.error(`BGM 不存在：${src}（只允许 We Never，不要用别的音乐顶替）`);
	process.exit(1);
}

const outWav = join(root, 'public', 'soundtrack.wav');
mkdirSync(dirname(outWav), {recursive: true});
mkdirSync(join(root, 'out'), {recursive: true});
const fadeOutStart = (dur - 0.15).toFixed(3);
execFileSync('ffmpeg', [
	'-hide_banner', '-loglevel', 'error', '-y', '-i', src,
	'-t', String(dur),
	'-af', `afade=t=in:st=0:d=0.05,afade=t=out:st=${fadeOutStart}:d=0.15`,
	'-ar', '48000', '-ac', '2', '-c:a', 'pcm_s16le', outWav,
]);

execFileSync('ffmpeg', [
	'-hide_banner', '-loglevel', 'error', '-y', '-i', outWav,
	'-filter_complex', 'showwavespic=s=1600x320:split_channels=0:colors=0xE2C27B',
	'-frames:v', '1', join(root, 'out', 'soundtrack_waveform.png'),
]);

// 单声道 22.05k float，spectral flux 取瞬态
const SR = 22050;
const pcm = execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-i', outWav, '-ac', '1', '-ar', String(SR), '-f', 'f32le', '-'], {
	maxBuffer: 1 << 28,
});
const x = new Float32Array(pcm.buffer, pcm.byteOffset, pcm.byteLength / 4);

const N = 1024;
const HOP = 256;
const win = Float32Array.from({length: N}, (_, i) => 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / N));

const fftMag = (frame) => {
	const re = Float64Array.from(frame);
	const im = new Float64Array(N);
	for (let i = 1, j = 0; i < N; i++) {
		let bit = N >> 1;
		for (; j & bit; bit >>= 1) j ^= bit;
		j ^= bit;
		if (i < j) [re[i], re[j]] = [re[j], re[i]];
	}
	for (let len = 2; len <= N; len <<= 1) {
		const ang = (-2 * Math.PI) / len;
		for (let i = 0; i < N; i += len) {
			for (let k = 0; k < len / 2; k++) {
				const wr = Math.cos(ang * k);
				const wi = Math.sin(ang * k);
				const a = i + k;
				const b = a + len / 2;
				const tr = re[b] * wr - im[b] * wi;
				const ti = re[b] * wi + im[b] * wr;
				re[b] = re[a] - tr;
				im[b] = im[a] - ti;
				re[a] += tr;
				im[a] += ti;
			}
		}
	}
	const mag = new Float64Array(N / 2);
	for (let k = 0; k < N / 2; k++) mag[k] = Math.log1p(100 * Math.hypot(re[k], im[k]));
	return mag;
};

const flux = [];
let prev = null;
const buf = new Float32Array(N);
for (let p = 0; p + N <= x.length; p += HOP) {
	for (let i = 0; i < N; i++) buf[i] = x[p + i] * win[i];
	const mag = fftMag(buf);
	let f = 0;
	if (prev) for (let k = 0; k < mag.length; k++) f += Math.max(0, mag[k] - prev[k]);
	flux.push(f);
	prev = mag;
}

const maxF = Math.max(...flux) || 1;
const nf = flux.map((v) => v / maxF);
const W = 12;
const onsets = [];
let lastT = -1;
for (let i = 0; i < nf.length; i++) {
	let isMax = true;
	let sum = 0;
	let cnt = 0;
	for (let j = Math.max(0, i - W); j <= Math.min(nf.length - 1, i + W); j++) {
		if (Math.abs(j - i) <= 3 && nf[j] > nf[i]) isMax = false;
		sum += nf[j];
		cnt++;
	}
	const t = (i * HOP + N / 2) / SR;
	if (isMax && nf[i] > sum / cnt + 0.06 && t - lastT > 0.12) {
		onsets.push({t: Number(t.toFixed(3)), s: nf[i]});
		lastT = t;
	}
}
const maxS = Math.max(...onsets.map((o) => o.s), 1e-9);
for (const o of onsets) o.s = Number((o.s / maxS).toFixed(3));

const vd = spawnSync('ffmpeg', ['-hide_banner', '-i', outWav, '-af', 'volumedetect', '-f', 'null', '-'], {encoding: 'utf8'});
const meanMatch = /mean_volume:\s*(-?[\d.]+) dB/.exec(vd.stderr ?? '');
const bgmMeanDb = meanMatch ? Number(meanMatch[1]) : null;

const sha = createHash('sha256').update(readFileSync(src)).digest('hex');
const cues = resolveCues(onsets);
const actions = resolveActions(onsets, cues);
writeFileSync(
	beatsPath,
	JSON.stringify({hasSoundtrack: true, source: src, sourceSha256: sha, duration: dur, bgmMeanDb, onsets, cues, actions}, null, 2) +
		'\n',
);
const strong = onsets.filter((o) => o.s >= MIN_STRENGTH);
console.log(`SOURCE_SHA256=${sha}`);
console.log(`BGM_MEAN_DB=${bgmMeanDb}`);
console.log(`ONSETS total=${onsets.length} strong=${strong.length}: ${strong.map((o) => o.t).join(', ')}`);
printCues(cues);
printActions(actions);
