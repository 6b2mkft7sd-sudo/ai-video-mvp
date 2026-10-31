// 代码合成音效 → public/sfx/*.wav（48k 单声道 16bit，峰值归一到 -1 dBFS；实际音量在画面里按 BGM 响度压低）
import {mkdirSync, writeFileSync} from 'node:fs';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(root, 'public', 'sfx');
const SR = 48000;

let seed = 1234567;
const noise = () => {
	seed = (seed * 1103515245 + 12345) & 0x7fffffff;
	return (seed / 0x3fffffff) - 1;
};

const synth = (dur, fn) => {
	const n = Math.round(dur * SR);
	const x = new Float64Array(n);
	const st = {phase: 0, lp: 0, lp2: 0};
	for (let i = 0; i < n; i++) x[i] = fn(i / SR, st);
	return x;
};

const osc = (st, f) => {
	st.phase += (2 * Math.PI * f) / SR;
	return Math.sin(st.phase);
};
const glide = (t, f0, f1, d) => f0 * Math.pow(f1 / f0, Math.min(1, t / d));
const attack = (t, a) => Math.min(1, t / a);

const SFX = {
	// 气泡弹出：短促下滑正弦 + 一点点噪声起音
	pop: synth(0.12, (t, st) => {
		const env = attack(t, 0.002) * Math.exp(-t / 0.028);
		return env * (osc(st, glide(t, 820, 240, 0.08)) + 0.15 * noise() * Math.exp(-t / 0.003));
	}),
	// 打勾/落桌：木质短击
	tick: synth(0.07, (t, st) => {
		const env = attack(t, 0.0008) * Math.exp(-t / 0.007);
		const body = osc(st, 2300) * 0.7 + Math.sin(2 * Math.PI * 1250 * t) * 0.5;
		return env * body + 0.35 * noise() * Math.exp(-t / 0.0015);
	}),
	// 泪滴：上滑的水滴声
	drop: synth(0.16, (t, st) => {
		const env = attack(t, 0.003) * Math.exp(-t / 0.045);
		return env * osc(st, glide(t, 520, 1500, 0.06));
	}),
	// 镜头移动 / 温度下降：带通扫频噪声，前后柔包络
	whoosh: synth(0.42, (t, st) => {
		const p = t / 0.42;
		const env = Math.pow(Math.sin(Math.PI * Math.min(1, p)), 2);
		const cutoff = 300 + 2200 * Math.sin(Math.PI * p);
		const a = 1 - Math.exp((-2 * Math.PI * cutoff) / SR);
		const w = noise();
		st.lp += a * (w - st.lp);
		st.lp2 += 0.02 * (st.lp - st.lp2);
		return env * (st.lp - st.lp2);
	}),
	// 桌子裂开：低频闷击
	thud: synth(0.45, (t, st) => {
		const env = attack(t, 0.002) * Math.exp(-t / 0.11);
		const w = noise();
		st.lp += 0.05 * (w - st.lp);
		return env * (osc(st, glide(t, 120, 42, 0.25)) + 0.8 * st.lp * Math.exp(-t / 0.03));
	}),
};

const toWav = (x) => {
	let peak = 0;
	for (const v of x) peak = Math.max(peak, Math.abs(v));
	const g = (Math.pow(10, -1 / 20) / (peak || 1)) * 32767;
	const fade = Math.round(0.004 * SR);
	const buf = Buffer.alloc(44 + x.length * 2);
	buf.write('RIFF', 0);
	buf.writeUInt32LE(36 + x.length * 2, 4);
	buf.write('WAVE', 8);
	buf.write('fmt ', 12);
	buf.writeUInt32LE(16, 16);
	buf.writeUInt16LE(1, 20);
	buf.writeUInt16LE(1, 22);
	buf.writeUInt32LE(SR, 24);
	buf.writeUInt32LE(SR * 2, 28);
	buf.writeUInt16LE(2, 32);
	buf.writeUInt16LE(16, 34);
	buf.write('data', 36);
	buf.writeUInt32LE(x.length * 2, 40);
	x.forEach((v, i) => {
		const tail = Math.min(1, (x.length - 1 - i) / fade);
		buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, v * tail * (g / 32767))) * 32767), 44 + i * 2);
	});
	return buf;
};

mkdirSync(outDir, {recursive: true});
for (const [name, x] of Object.entries(SFX)) {
	writeFileSync(join(outDir, `${name}.wav`), toWav(x));
	console.log(`SFX ${name}.wav ${(x.length / SR).toFixed(2)}s peak -1 dBFS`);
}
