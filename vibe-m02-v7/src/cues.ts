import beats from './beats.json';
import base from './timeline.base.json';

export const FPS = 30;
export const DURATION_SEC = base.duration;

export type Seg = {t: string; gold?: boolean};
export type CueId = 's1' | 's2a' | 's2b' | 's4' | 's5' | 's6' | 's7a' | 's7b';
export type Cue = {startF: number; endF: number | null};

type Sec = {start: number; end: number | null};
const resolved = (beats as {cues?: Record<string, Sec>}).cues;

const toF = (s: number) => Math.round(s * FPS);

export const CUES = Object.fromEntries(
	base.cues.map((c) => {
		const r = resolved?.[c.id] ?? c;
		return [c.id, {startF: toF(r.start), endF: r.end === null ? null : toF(r.end)}];
	}),
) as Record<CueId, Cue>;

export const HAS_SOUNDTRACK = Boolean((beats as {hasSoundtrack?: boolean}).hasSoundtrack);
