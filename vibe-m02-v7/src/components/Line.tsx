import React from 'react';
import {Easing, interpolate, useCurrentFrame} from 'remotion';

export const SANS = '"PingFang SC", "Noto Sans CJK SC", "Hiragino Sans GB", sans-serif';
export const SERIF = '"Songti SC", "Noto Serif CJK SC", "STSong", serif';

export const IVORY = '#F2ECE2';
export const GOLD = '#E2C27B';
export const GOLD_MUTED = '#BFA77A';

const easeOut = Easing.bezier(0.22, 1, 0.36, 1);
const easeIn = Easing.bezier(0.55, 0, 0.75, 0.2);

type Props = {
	t: string;
	gold?: string;
	startF: number;
	endF: number | null;
	y: number;
	variant: 'big' | 'small';
};

// 字只做注脚：放在画面下方，大字 64px、小字 44px。
const STYLE = {
	big: {fontFamily: SANS, fontSize: 64, fontWeight: 700, letterSpacing: '0.06em', color: IVORY},
	small: {fontFamily: SERIF, fontSize: 44, fontWeight: 500, letterSpacing: '0.14em', color: GOLD_MUTED},
} as const;

export const Line: React.FC<Props> = ({t, gold, startF, endF, y, variant}) => {
	const frame = useCurrentFrame();
	if (frame < startF || (endF !== null && frame > endF)) return null;

	const gi = gold ? t.indexOf(gold) : -1;
	const chars = [...t].map((ch, i) => ({ch, gold: gi >= 0 && i >= gi && i < gi + gold!.length}));
	const exit =
		endF === null
			? 0
			: interpolate(frame, [endF - 8, endF], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: easeIn});
	const stagger = variant === 'big' ? 1.2 : 1.5;

	return (
		<div
			style={{
				position: 'absolute',
				left: 0,
				right: 0,
				top: y,
				transform: `translateY(-50%) translateY(${-exit * 8}px)`,
				opacity: 1 - exit,
				filter: `blur(${exit * 5}px)`,
				textAlign: 'center',
				...STYLE[variant],
				whiteSpace: 'pre',
				lineHeight: 1.25,
			}}
		>
			{chars.map(({ch, gold: g}, i) => {
				const p = interpolate(frame - startF - i * stagger, [0, 10], [0, 1], {
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
							transform: `translateY(${(1 - p) * 12}px)`,
							filter: `blur(${(1 - p) * 8}px)`,
							color: g ? GOLD : undefined,
							textShadow: g ? '0 0 22px rgba(226,194,123,0.3)' : '0 2px 14px rgba(0,0,0,0.6)',
						}}
					>
						{ch}
					</span>
				);
			})}
		</div>
	);
};
