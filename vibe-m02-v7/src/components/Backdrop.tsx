import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';

const Bokeh: React.FC<{x: number; y: number; r: number; o: number; phase: number}> = ({x, y, r, o, phase}) => {
	const frame = useCurrentFrame();
	const {durationInFrames} = useVideoConfig();
	const k = frame / durationInFrames;
	const dx = Math.sin(k * Math.PI * 0.9 + phase) * 22;
	const dy = Math.cos(k * Math.PI * 0.7 + phase) * 16;
	return (
		<div
			style={{
				position: 'absolute',
				left: x - r + dx,
				top: y - r + dy,
				width: r * 2,
				height: r * 2,
				borderRadius: '50%',
				background: 'radial-gradient(circle, rgba(214,170,96,0.9) 0%, rgba(214,170,96,0) 68%)',
				opacity: o,
				filter: 'blur(40px)',
			}}
		/>
	);
};

// 静底：暖金景深 + 静态颗粒 + 暗角，只做极慢漂移；cool 0→1 让底色在结尾稍微变冷。
export const Backdrop: React.FC<{cool: number}> = ({cool}) => {
	const frame = useCurrentFrame();
	const intro = interpolate(frame, [0, 10], [0, 1], {extrapolateRight: 'clamp'});
	const warm = 1 - cool * 0.55;

	return (
		<AbsoluteFill style={{background: '#0A0907'}}>
			<AbsoluteFill style={{opacity: intro}}>
				<AbsoluteFill
					style={{
						background: `radial-gradient(ellipse 75% 42% at 50% 47%, rgba(96,72,38,${0.42 * warm}) 0%, rgba(10,9,7,0) 72%)`,
					}}
				/>
				<AbsoluteFill
					style={{
						background: `radial-gradient(ellipse 70% 40% at 50% 50%, rgba(70,80,96,${0.22 * cool}) 0%, rgba(10,9,7,0) 70%)`,
					}}
				/>
				<Bokeh x={180} y={420} r={300} o={0.07 * warm} phase={0.4} />
				<Bokeh x={930} y={1240} r={360} o={0.06 * warm} phase={2.1} />
				<Bokeh x={760} y={300} r={180} o={0.05 * warm} phase={4.2} />
				<Bokeh x={260} y={1580} r={220} o={0.045 * warm} phase={5.3} />
			</AbsoluteFill>
			<AbsoluteFill style={{opacity: 0.08, mixBlendMode: 'overlay'}}>
				<svg width="1080" height="1920">
					<filter id="grain">
						<feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="7" stitchTiles="stitch" />
						<feColorMatrix type="saturate" values="0" />
					</filter>
					<rect width="100%" height="100%" filter="url(#grain)" />
				</svg>
			</AbsoluteFill>
			<AbsoluteFill
				style={{
					background: 'radial-gradient(ellipse 85% 70% at 50% 50%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.72) 100%)',
				}}
			/>
		</AbsoluteFill>
	);
};
