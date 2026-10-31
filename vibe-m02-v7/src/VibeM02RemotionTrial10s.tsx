import React from 'react';
import {AbsoluteFill, Audio, Easing, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {CUES, HAS_SOUNDTRACK} from './cues';
import {Backdrop} from './components/Backdrop';
import {Chrome} from './components/Chrome';
import {Line} from './components/Line';

const CENTER = 920;

// 结尾「两个人」：两道细线从并排慢慢分开，只做情绪，不抢字。
const ApartLines: React.FC<{startF: number}> = ({startF}) => {
	const frame = useCurrentFrame();
	const {durationInFrames} = useVideoConfig();
	if (frame < startF) return null;
	const o = interpolate(frame, [startF, startF + 20], [0, 0.6], {extrapolateRight: 'clamp'});
	const gap = interpolate(frame, [startF + 8, durationInFrames], [14, 230], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
		easing: Easing.bezier(0.33, 0, 0.2, 1),
	});
	const bar = (x: number) => (
		<div
			style={{
				position: 'absolute',
				top: 1290,
				left: x - 1,
				width: 2,
				height: 96,
				opacity: o,
				background: 'linear-gradient(180deg, rgba(226,194,123,0), rgba(226,194,123,0.85), rgba(226,194,123,0))',
			}}
		/>
	);
	return (
		<>
			{bar(540 - gap / 2)}
			{bar(540 + gap / 2)}
		</>
	);
};

export const VibeM02RemotionTrial10s: React.FC = () => {
	const frame = useCurrentFrame();
	const {durationInFrames} = useVideoConfig();
	const c = CUES;

	const hold = c.s7a.startF;
	const cool = interpolate(frame, [hold, durationInFrames], [0, 1], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	const push = interpolate(frame, [hold, durationInFrames], [1, 1.03], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});

	return (
		<AbsoluteFill>
			<Backdrop cool={cool} />
			<Chrome />
			<AbsoluteFill style={{transform: `scale(${push})`}}>
				<Line variant="small" segs={[{t: '她眼睛红了。'}]} startF={c.s1.startF} endF={c.s1.endF} y={CENTER} stagger={2} />

				<Line variant="big" segs={[{t: '你问：怎么了？'}]} startF={c.s2a.startF} endF={c.s2a.endF} y={CENTER - 70} />
				<Line
					variant="big"
					segs={[{t: '要不要我'}, {t: '帮你弄', gold: true}, {t: '？'}]}
					startF={c.s2b.startF}
					endF={c.s2b.endF}
					y={CENTER + 70}
				/>

				<Line
					variant="big"
					segs={[{t: '她'}, {t: '摇头', gold: true}, {t: '，不说话了。'}]}
					startF={c.s4.startF}
					endF={c.s4.endF}
					y={CENTER}
					stagger={2}
				/>

				<Line
					variant="big"
					segs={[{t: '你'}, {t: '急着', gold: true}, {t: '把事弄好。'}]}
					startF={c.s5.startF}
					endF={c.s5.endF}
					y={CENTER}
				/>

				<Line
					variant="small"
					segs={[{t: '她只想你先'}, {t: '坐下来', gold: true}, {t: '。'}]}
					startF={c.s6.startF}
					endF={c.s6.endF}
					y={CENTER}
					stagger={1.4}
				/>

				<Line variant="big" segs={[{t: '于是两个人都觉得：'}]} startF={c.s7a.startF} endF={null} y={CENTER - 80} />
				<Line
					variant="hero"
					segs={[{t: '对方'}, {t: '不在乎', gold: true}, {t: '。'}]}
					startF={c.s7b.startF}
					endF={null}
					y={CENTER + 70}
					stagger={3}
				/>
				<ApartLines startF={c.s7b.startF + 12} />
			</AbsoluteFill>
			{HAS_SOUNDTRACK ? <Audio src={staticFile('soundtrack.wav')} /> : null}
		</AbsoluteFill>
	);
};
