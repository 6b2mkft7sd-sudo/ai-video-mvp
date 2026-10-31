import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {GOLD_MUTED, SANS, SERIF} from './Line';

// 版头（系列名 + 镜号）与版尾，对标纸偶小剧场的排版：左标题、右页码、细线。
export const Chrome: React.FC<{shot: number}> = ({shot}) => {
	const frame = useCurrentFrame();
	const o = interpolate(frame, [0, 24], [0, 1], {extrapolateRight: 'clamp'});
	return (
		<AbsoluteFill style={{opacity: o}}>
			<div style={{position: 'absolute', top: 132, left: 72, fontFamily: SERIF, fontSize: 34, letterSpacing: '0.24em', color: GOLD_MUTED}}>
				人格误会 · 02
			</div>
			<div style={{position: 'absolute', top: 134, right: 72, fontFamily: SANS, fontSize: 30, letterSpacing: '0.12em', color: GOLD_MUTED, opacity: 0.85}}>
				{String(shot).padStart(2, '0')}
			</div>
			<div
				style={{
					position: 'absolute',
					top: 200,
					left: 72,
					right: 72,
					height: 1,
					background: 'linear-gradient(90deg, rgba(191,167,122,0.55), rgba(191,167,122,0.18))',
				}}
			/>
			<div
				style={{
					position: 'absolute',
					top: 1772,
					left: 0,
					right: 0,
					textAlign: 'center',
					fontFamily: SANS,
					fontSize: 26,
					letterSpacing: '0.5em',
					color: GOLD_MUTED,
					opacity: 0.5,
				}}
			>
				VIBE 知识大赏
			</div>
		</AbsoluteFill>
	);
};
