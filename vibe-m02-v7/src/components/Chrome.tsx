import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {GOLD_MUTED, SANS, SERIF} from './Line';

const Rule: React.FC<{top: number; width: number}> = ({top, width}) => (
	<div
		style={{
			position: 'absolute',
			top,
			left: 540 - width / 2,
			width,
			height: 1,
			background: 'linear-gradient(90deg, rgba(191,167,122,0), rgba(191,167,122,0.55), rgba(191,167,122,0))',
		}}
	/>
);

export const Chrome: React.FC = () => {
	const frame = useCurrentFrame();
	const o = interpolate(frame, [0, 24], [0, 1], {extrapolateRight: 'clamp'});
	return (
		<AbsoluteFill style={{opacity: o}}>
			<div
				style={{
					position: 'absolute',
					top: 176,
					left: 0,
					right: 0,
					textAlign: 'center',
					fontFamily: SERIF,
					fontSize: 34,
					letterSpacing: '0.42em',
					color: GOLD_MUTED,
					opacity: 0.8,
				}}
			>
				人格误会 · 02
			</div>
			<Rule top={246} width={300} />
			<Rule top={1676} width={300} />
			<div
				style={{
					position: 'absolute',
					top: 1700,
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
