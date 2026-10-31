import React from 'react';
import {Easing, interpolate, useCurrentFrame} from 'remotion';
import type {Seg} from '../cues';

export const SANS = '"PingFang SC", "Noto Sans CJK SC", "Hiragino Sans GB", sans-serif';
export const SERIF = '"Songti SC", "Noto Serif CJK SC", "STSong", serif';

export const IVORY = '#F2ECE2';
export const GOLD = '#E2C27B';
export const GOLD_MUTED = '#BFA77A';

const easeOut = Easing.bezier(0.22, 1, 0.36, 1);
const easeIn = Easing.bezier(0.55, 0, 0.75, 0.2);

type Props = {
	segs: Seg[];
	startF: number;
	endF: number | null;
	y: number;
	variant: 'big' | 'small' | 'hero';
	stagger?: number;
};

const STYLE = {
	big: {fontFamily: SANS, fontSize: 86, fontWeight: 600, letterSpacing: '0.04em', color: IVORY},
	hero: {fontFamily: SANS, fontSize: 108, fontWeight: 700, letterSpacing: '0.06em', color: IVORY},
	small: {fontFamily: SERIF, fontSize: 58, fontWeight: 500, letterSpacing: '0.16em', color: GOLD_MUTED},
} as const;

export const Line: React.FC<Props> = ({segs, startF, endF, y, variant, stagger = 1.2}) => {
	const frame = useCurrentFrame();
	if (frame < startF || (endF !== null && frame > endF)) return null;

	const chars = segs.flatMap((s) => [...s.t].map((ch) => ({ch, gold: Boolean(s.gold)})));
	const exit =
		endF === null
			? 0
			: interpolate(frame, [endF - 9, endF], [0, 1], {
					extrapolateLeft: 'clamp',
					extrapolateRight: 'clamp',
					easing: easeIn,
				});

	const rule =
		variant === 'small'
			? interpolate(frame - startF, [4, 34], [0, 1], {
					extrapolateLeft: 'clamp',
					extrapolateRight: 'clamp',
					easing: easeOut,
				})
			: 0;

	return (
		<div
			style={{
				position: 'absolute',
				left: 0,
				right: 0,
				top: y,
				transform: `translateY(-50%) translateY(${-exit * 10}px)`,
				opacity: 1 - exit,
				filter: `blur(${exit * 6}px)`,
				display: 'flex',
				flexDirection: 'column',
				alignItems: 'center',
			}}
		>
			{variant === 'small' ? (
				<div
					style={{
						width: 120 * rule,
						height: 1.5,
						marginBottom: 34,
						background: `linear-gradient(90deg, rgba(226,194,123,0), rgba(226,194,123,0.75), rgba(226,194,123,0))`,
					}}
				/>
			) : null}
			<div style={{...STYLE[variant], whiteSpace: 'pre', lineHeight: 1.25}}>
				{chars.map(({ch, gold}, i) => {
					const p = interpolate(frame - startF - i * stagger, [0, 13], [0, 1], {
						extrapolateLeft: 'clamp',
						extrapolateRight: 'clamp',
						easing: easeOut,
					});
					return (
						<span
							key={i}
							style={{
								display: 'inline-block',
								opacity: p,
								transform: `translateY(${(1 - p) * 18}px)`,
								filter: `blur(${(1 - p) * 10}px)`,
								color: gold ? GOLD : undefined,
								textShadow: gold
									? '0 0 28px rgba(226,194,123,0.32)'
									: '0 2px 18px rgba(0,0,0,0.55)',
							}}
						>
							{ch}
						</span>
					);
				})}
			</div>
		</div>
	);
};
