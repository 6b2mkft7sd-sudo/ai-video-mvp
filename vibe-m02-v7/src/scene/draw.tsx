import React from 'react';
import {Easing, spring, useCurrentFrame} from 'remotion';
import {FPS} from '../cues';

export const INK = '#20170F';
export const GOLD_LINE = '#E7C882';

export const easeOut = Easing.bezier(0.22, 1, 0.36, 1);
export const easeInOut = Easing.bezier(0.65, 0, 0.35, 1);
export const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
export const ramp = (f: number, start: number, dur: number, ease: (v: number) => number = easeOut) =>
	ease(clamp01((f - start) / dur));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const pop = (f: number, start: number, damping = 11) =>
	f < start ? 0 : spring({frame: f - start, fps: FPS, config: {damping, stiffness: 190, mass: 0.6}});

const hex = (c: string) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));
export const mix = (a: string, b: string, t: number) => {
	const A = hex(a);
	const B = hex(b);
	return `rgb(${A.map((v, i) => Math.round(lerp(v, B[i], clamp01(t)))).join(',')})`;
};

export const ell = (cx: number, cy: number, rx: number, ry: number) =>
	`M ${cx - rx} ${cy} A ${rx} ${ry} 0 1 0 ${cx + rx} ${cy} A ${rx} ${ry} 0 1 0 ${cx - rx} ${cy} Z`;
export const rrect = (x: number, y: number, w: number, h: number, r: number) =>
	`M ${x + r} ${y} H ${x + w - r} Q ${x + w} ${y} ${x + w} ${y + r} V ${y + h - r} Q ${x + w} ${y + h} ${x + w - r} ${y + h} H ${x + r} Q ${x} ${y + h} ${x} ${y + h - r} V ${y + r} Q ${x} ${y} ${x + r} ${y} Z`;

type ShapeProps = {
	d: string;
	fill?: string;
	start: number;
	dur?: number;
	sw?: number;
	ink?: string;
	fillOpacity?: number;
};

// 逐笔画出：金线沿路径描一遍 → 填色浮上来 → 描边退成墨线。
export const Shape: React.FC<ShapeProps> = ({d, fill, start, dur = 11, sw = 3, ink = INK, fillOpacity = 1}) => {
	const f = useCurrentFrame();
	const draw = ramp(f, start, dur, easeInOut);
	if (draw <= 0) return null;
	const settle = ramp(f, start + dur * 0.55, 9);
	return (
		<path
			d={d}
			pathLength={1}
			strokeDasharray="1 1"
			strokeDashoffset={1 - draw}
			stroke={mix(GOLD_LINE, ink, settle)}
			strokeWidth={sw}
			strokeLinejoin="round"
			strokeLinecap="round"
			fill={fill ?? 'none'}
			fillOpacity={fill ? settle * fillOpacity : 0}
		/>
	);
};

// 四肢：从肩膀「长」出来的粗线。
export const Limb: React.FC<{d: string; color: string; width: number; start: number; dur?: number}> = ({
	d,
	color,
	width,
	start,
	dur = 10,
}) => {
	const f = useCurrentFrame();
	const draw = ramp(f, start, dur, easeInOut);
	if (draw <= 0) return null;
	const settle = ramp(f, start + dur * 0.5, 8);
	return (
		<>
			<path
				d={d}
				pathLength={1}
				strokeDasharray="1 1"
				strokeDashoffset={1 - draw}
				stroke={INK}
				strokeWidth={width + 6}
				strokeLinecap="round"
				fill="none"
				opacity={settle}
			/>
			<path
				d={d}
				pathLength={1}
				strokeDasharray="1 1"
				strokeDashoffset={1 - draw}
				stroke={mix(GOLD_LINE, color, settle)}
				strokeWidth={lerp(4, width, settle)}
				strokeLinecap="round"
				fill="none"
			/>
		</>
	);
};

// 一次性的线（眉、嘴、对勾、裂缝）：描出来就留着，颜色不换。
export const Stroke: React.FC<{d: string; start: number; dur?: number; color?: string; sw?: number; opacity?: number}> = ({
	d,
	start,
	dur = 6,
	color = INK,
	sw = 4,
	opacity = 1,
}) => {
	const f = useCurrentFrame();
	const draw = ramp(f, start, dur, easeOut);
	if (draw <= 0) return null;
	return (
		<path
			d={d}
			pathLength={1}
			strokeDasharray="1 1"
			strokeDashoffset={1 - draw}
			stroke={color}
			strokeWidth={sw}
			strokeLinecap="round"
			strokeLinejoin="round"
			fill="none"
			opacity={opacity}
		/>
	);
};
