import actionsDef from './actions.json';
import beats from './beats.json';
import copy from './copy.json';
import base from './timeline.base.json';

export const FPS = 30;
export const DURATION_SEC = base.duration;

export type Seg = {t: string; role: 'small' | 'big' | 'bubble'; gold?: string};
export type CueId = 's1' | 's2a' | 's2b' | 's4' | 's5' | 's6' | 's7a' | 's7b';
export type Cue = {startF: number; endF: number | null};

type Sec = {start: number; end: number | null};
type Beats = {
	hasSoundtrack?: boolean;
	bgmMeanDb?: number | null;
	cues?: Record<string, Sec>;
	actions?: Record<string, {t: number}>;
};
const B = beats as Beats;

const toF = (s: number) => Math.round(s * FPS);

const cueSec = Object.fromEntries(base.cues.map((c) => [c.id, B.cues?.[c.id] ?? c])) as Record<CueId, Sec>;

export const CUES = Object.fromEntries(
	Object.entries(cueSec).map(([id, r]) => [id, {startF: toF(r.start), endF: r.end === null ? null : toF(r.end)}]),
) as Record<CueId, Cue>;

export type ActId = (typeof actionsDef.actions)[number]['id'];
export type SfxName = 'pop' | 'tick' | 'drop' | 'whoosh' | 'thud';

export const ACTIONS = actionsDef.actions.map((a) => {
	const t = B.actions?.[a.id]?.t ?? cueSec[a.cue as CueId].start + a.offset;
	return {id: a.id as ActId, f: toF(t), sfx: a.sfx as SfxName | null};
});

const actF = Object.fromEntries(ACTIONS.map((a) => [a.id, a.f])) as Record<ActId, number>;
export const ACT = (id: ActId) => actF[id];

export const LINES = copy.lines.map((l) => ({cue: l.cue as CueId, text: l.text, segs: l.segs as Seg[]}));
export const LABELS = copy.labels;

export const HAS_SOUNDTRACK = Boolean(B.hasSoundtrack);

// SFX 峰值压到 BGM 平均响度之下 4 dB（短瞬态的响度远低于峰值，听感明显低于 BGM）；无 BGM 时按 -18 dB 估。
const SFX_TRIM: Record<SfxName, number> = {pop: 0, tick: -2, drop: 0, whoosh: -5, thud: 1};
export const sfxVolume = (name: SfxName) => {
	const bgm = B.bgmMeanDb ?? -18;
	const peakDb = bgm - 4 + SFX_TRIM[name];
	return Math.min(1, Math.pow(10, (peakDb + 1) / 20));
};
