import React from 'react';
import {useCurrentFrame} from 'remotion';
import {SANS} from '../components/Line';
import {ACT} from '../cues';
import {ROWS} from './You';
import {easeOut, ell, INK, lerp, mix, pop, ramp, rrect, Shape, Stroke} from './draw';

export const WOOD = '#7A5233';
const WOOD_DARK = '#563621';
const PAPER = '#EFE5CF';
const GOLD_DEEP = '#A8741E';
const CHAIR = '#7E5836';
const CHAIR_LIGHT = '#A57A4C';

// 桌子 = 桌面 + 前挡板。split 前整块画一次；裂开后两边各画一份，用锯齿缝裁开（两半的缝对得上）。
const ZIGZAG = 'L 522 1124 L 558 1146 L 526 1166 L 556 1186 L 532 1206';
const CRACK = `M 548 1104 ${ZIGZAG}`;
const CLIP_LEFT = `M -1000 0 H 548 V 1104 ${ZIGZAG} V 2400 H -1000 Z`;
const CLIP_RIGHT = `M 2000 0 H 548 V 1104 ${ZIGZAG} V 2400 H 2000 Z`;

const TableBody: React.FC<{start: number; instant?: boolean}> = ({start, instant}) => {
	const s = instant ? -100 : start;
	return (
		<g>
			<Shape d={rrect(170, 1136, 740, 64, 6)} fill={WOOD_DARK} start={s + 4} dur={instant ? 1 : 10} />
			<Shape d={rrect(150, 1110, 780, 30, 8)} fill={WOOD} start={s} dur={instant ? 1 : 12} />
			<Stroke d="M 164 1115 H 916" start={s + 10} dur={instant ? 1 : 8} color="#B88A56" sw={2} />
			<Stroke d="M 184 1188 H 896" start={s + 12} dur={instant ? 1 : 8} color="#3B2516" sw={3} />
		</g>
	);
};

export const TableHalf: React.FC<{side: 'left' | 'right'; split: boolean}> = ({side, split}) => {
	const f = useCurrentFrame();
	const s = ACT('s2_wide');
	const left = side === 'left';
	const id = `tableClip-${side}`;
	return (
		<g>
			<path d={ell(left ? 345 : 735, 1336, 210, 18)} fill="#000" opacity={0.45 * ramp(f, s + 6, 10)} />
			<Shape d={rrect(left ? 196 : 858, 1196, 26, 136, 6)} fill={WOOD_DARK} start={s + 6} dur={8} />
			{split ? (
				<>
					<defs>
						<clipPath id={id}>
							<path d={left ? CLIP_LEFT : CLIP_RIGHT} />
						</clipPath>
					</defs>
					<g clipPath={`url(#${id})`}>
						<TableBody start={s} instant />
					</g>
					<path d={CRACK} stroke={INK} strokeWidth={6} fill="none" strokeLinejoin="round" clipPath={`url(#${id})`} />
				</>
			) : left ? (
				<TableBody start={s} />
			) : null}
		</g>
	);
};

export const Crack: React.FC = () => {
	const t = ACT('s7_split');
	return <Stroke d={CRACK} start={t} dur={4} color="#0C0805" sw={5} />;
};

export const Toolbox: React.FC = () => {
	const f = useCurrentFrame();
	const t = ACT('s2_box');
	if (f < t - 4) return null;
	const fall = ramp(f, t - 4, 4, (v) => v * v);
	const squash = f >= t ? 1 - 0.12 * Math.exp(-(f - t) / 3) * Math.cos((f - t) * 0.9) : 1;
	return (
		<g transform={`translate(0 ${(1 - fall) * -70}) translate(860 1112) scale(${2 - squash} ${squash}) translate(-860 -1112)`}>
			<path d="M 832 1052 V 1032 Q 832 1024 840 1024 H 880 Q 888 1024 888 1032 V 1052" stroke={INK} strokeWidth={7} fill="none" />
			<path d={rrect(792, 1050, 136, 62, 10)} fill="#9C4330" stroke={INK} strokeWidth={3} />
			<path d="M 792 1072 H 928" stroke={INK} strokeWidth={3} />
			<path d={rrect(850, 1064, 20, 16, 3)} fill="#D8B56A" stroke={INK} strokeWidth={2.5} />
		</g>
	);
};

export const Clipboard: React.FC = () => {
	const f = useCurrentFrame();
	const s = ACT('s5_pan');
	const ticks = [ACT('s5_tick1'), ACT('s5_tick2'), ACT('s5_tick3')];
	const lift = pop(f, s, 12);
	if (lift <= 0) return null;
	return (
		<g transform={`translate(0 ${(1 - lift) * 40})`}>
			<Shape d={rrect(600, 900, 130, 212, 10)} fill={PAPER} start={s} dur={8} />
			<Shape d={rrect(640, 888, 50, 24, 6)} fill="#C9A45C" start={s + 3} dur={6} />
			{ROWS.map((y, i) => (
				<g key={y}>
					<Shape d={rrect(614, y - 14, 26, 26, 5)} start={s + 4 + i * 2} dur={5} sw={3} />
					<Shape d={rrect(650, y - 5, 64, 10, 5)} fill="#B9AD95" start={s + 5 + i * 2} dur={5} sw={0} />
					<Stroke d={`M 616 ${y - 2} L 626 ${y + 9} L 646 ${y - 20}`} start={ticks[i]} dur={3} color="#3F6E4E" sw={7} />
				</g>
			))}
		</g>
	);
};

export const Chair: React.FC = () => {
	const f = useCurrentFrame();
	const s = ACT('s6_chair');
	const glow = ramp(f, s + 4, 14);
	return (
		<g>
			<defs>
				<radialGradient id="chairGlow">
					<stop offset="0%" stopColor="#F2C978" stopOpacity={0.55} />
					<stop offset="100%" stopColor="#F2C978" stopOpacity={0} />
				</radialGradient>
			</defs>
			<ellipse cx={522} cy={1010} rx={170} ry={190} fill="url(#chairGlow)" opacity={glow} />
			<Shape d={rrect(462, 930, 18, 184, 6)} fill={CHAIR} start={s} dur={10} />
			<Shape d={rrect(564, 930, 18, 184, 6)} fill={CHAIR} start={s + 1} dur={10} />
			<Shape d="M 452 936 C 452 904 488 896 522 896 C 556 896 592 904 592 936 V 954 H 452 Z" fill={CHAIR_LIGHT} start={s + 3} dur={9} />
			{[492, 522, 552].map((x, i) => (
				<Shape key={x} d={rrect(x - 6, 954, 12, 64, 4)} fill={CHAIR} start={s + 6 + i} dur={6} />
			))}
			<Shape d={rrect(462, 1016, 120, 16, 5)} fill={CHAIR_LIGHT} start={s + 8} dur={6} />
		</g>
	);
};

type BubbleProps = {x: number; y: number; w: number; h: number; tail: [number, number]; start: number; end: number; children?: React.ReactNode};

export const SpeechBubble: React.FC<BubbleProps> = ({x, y, w, h, tail, start, end, children}) => {
	const f = useCurrentFrame();
	const sc = pop(f, start, 10) * (1 - ramp(f, end - 6, 6));
	const fade = 1 - ramp(f, end - 6, 6);
	if (sc <= 0.01) return null;
	const cx = x + w / 2;
	const cy = y + h / 2;
	const r = h / 2;
	const bx = Math.min(Math.max(tail[0], x + r), x + w - r);
	return (
		<g transform={`translate(${tail[0]} ${tail[1]}) scale(${sc}) translate(${-tail[0]} ${-tail[1]})`} opacity={fade}>
			<path d={`M ${bx - 18} ${y + h - 4} L ${tail[0]} ${tail[1]} L ${bx + 16} ${y + h - 4} Z`} fill={PAPER} stroke={INK} strokeWidth={3} strokeLinejoin="round" />
			<path d={rrect(x, y, w, h, r)} fill={PAPER} stroke={INK} strokeWidth={3} />
			<path d={`M ${bx - 16} ${y + h - 1.5} H ${bx + 14}`} stroke={PAPER} strokeWidth={5} />
			<g transform={`translate(${cx} ${cy})`}>{children}</g>
		</g>
	);
};

export const BubbleText: React.FC<{t: string; gold?: string; size?: number; dx?: number}> = ({t, gold, size = 46, dx = 0}) => {
	const i = gold ? t.indexOf(gold) : -1;
	const parts = i >= 0 ? [t.slice(0, i), gold!, t.slice(i + gold!.length)] : [t, '', ''];
	return (
		<text x={dx} y={size * 0.36} textAnchor="middle" fontFamily={SANS} fontSize={size} fontWeight={700} fill={INK} letterSpacing={1}>
			<tspan>{parts[0]}</tspan>
			<tspan fill={GOLD_DEEP}>{parts[1]}</tspan>
			<tspan>{parts[2]}</tspan>
		</text>
	);
};

export const Wrench: React.FC<{x: number; y: number; s?: number}> = ({x, y, s = 1}) => (
	<g transform={`translate(${x} ${y}) rotate(-40) scale(${s})`}>
		<path d={rrect(-6, 4, 12, 38, 6)} fill={GOLD_DEEP} stroke={INK} strokeWidth={2.5} />
		<path d={ell(0, -6, 15, 15)} fill={GOLD_DEEP} stroke={INK} strokeWidth={2.5} />
		<path d={rrect(-6, -24, 12, 18, 2)} fill={PAPER} />
	</g>
);

// 念头泡：两颗小圆依次冒出，再弹出大泡。
export const ThoughtBubble: React.FC<{
	x: number;
	y: number;
	rx: number;
	ry: number;
	dots: [[number, number], [number, number]];
	start: number;
	end: number | null;
	tint?: number;
	children?: React.ReactNode;
}> = ({x, y, rx, ry, dots, start, end, tint = 0, children}) => {
	const f = useCurrentFrame();
	const out = end === null ? 0 : ramp(f, end - 6, 6);
	const c1 = pop(f, start - 4, 12);
	const c2 = pop(f, start - 2, 12);
	const big = pop(f, start, 10);
	if (c1 <= 0.01 || out >= 1) return null;
	const [p1, p2] = dots;
	const fill = mix(PAPER, '#D6E0E8', tint);
	return (
		<g opacity={1 - out}>
			<circle cx={p1[0]} cy={p1[1]} r={7 * c1} fill={fill} stroke={INK} strokeWidth={2.5} />
			<circle cx={p2[0]} cy={p2[1]} r={11 * c2} fill={fill} stroke={INK} strokeWidth={2.5} />
			{big > 0.01 ? (
				<g transform={`translate(${x} ${y}) scale(${big})`}>
					<path d={ell(0, 0, rx, ry)} fill={fill} stroke={INK} strokeWidth={3} />
					{children}
				</g>
			) : null}
		</g>
	);
};

export const Thermometer: React.FC<{x: number; y: number; cold: number}> = ({x, y, cold}) => {
	const level = lerp(78, 6, cold);
	const col = mix('#D9644A', '#6F9CC8', cold);
	return (
		<g transform={`translate(${x} ${y})`}>
			<path d={rrect(-11, -62, 22, 108, 11)} fill="#FBF7EE" stroke={INK} strokeWidth={2.5} />
			<path d={rrect(-5, 40 - level, 10, level + 10, 5)} fill={col} />
			<path d={ell(0, 54, 18, 18)} fill={col} stroke={INK} strokeWidth={2.5} />
			{[-40, -20, 0, 20].map((ty) => (
				<path key={ty} d={`M 13 ${ty} H 22`} stroke={INK} strokeWidth={2} />
			))}
			{cold > 0.6 ? (
				<g opacity={(cold - 0.6) / 0.4} stroke="#6F9CC8" strokeWidth={3} strokeLinecap="round">
					<path d="M 34 -50 V -26 M 24 -44 L 44 -32 M 44 -44 L 24 -32" />
				</g>
			) : null}
		</g>
	);
};

export const SceneLabel: React.FC<{x: number; t: string; opacity: number}> = ({x, t, opacity}) => (
	<text
		x={x}
		y={1392}
		textAnchor="middle"
		fontFamily='"Songti SC", "Noto Serif CJK SC", "STSong", serif'
		fontSize={40}
		fill="#BFA77A"
		opacity={opacity}
		letterSpacing={4}
	>
		{t}
	</text>
);

export const Floor: React.FC = () => {
	const f = useCurrentFrame();
	return (
		<g opacity={ramp(f, ACT('s2_wide') + 4, 14, easeOut)}>
			<defs>
				<linearGradient id="floor" x1="0" y1="0" x2="0" y2="1">
					<stop offset="0%" stopColor="#3A2A1A" stopOpacity={0.55} />
					<stop offset="100%" stopColor="#3A2A1A" stopOpacity={0} />
				</linearGradient>
			</defs>
			<rect x={-600} y={1330} width={2280} height={520} fill="url(#floor)" />
			<path d="M -600 1330 H 1680" stroke="#6B5236" strokeWidth={2} opacity={0.5} />
		</g>
	);
};
