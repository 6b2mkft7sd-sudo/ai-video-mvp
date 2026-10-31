import React from 'react';
import {AbsoluteFill, Audio, Easing, interpolate, Sequence, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {ACT, ACTIONS, CUES, HAS_SOUNDTRACK, LINES, sfxVolume} from './cues';
import {Backdrop} from './components/Backdrop';
import {Chrome} from './components/Chrome';
import {Line} from './components/Line';
import {Stage} from './scene/Stage';

type Pose = {at: number; s: number; x: number; y: number};

// 每镜一个机位，切换从该镜第一个动作的瞬态起跳，前几帧走完大半（落点在拍上）。
const POSES: Pose[] = [
	{at: CUES.s1.startF, s: 2.75, x: 330, y: 778},
	{at: ACT('s2_wide'), s: 1.12, x: 545, y: 850},
	{at: ACT('s4_shake'), s: 1.9, x: 345, y: 805},
	{at: ACT('s5_pan'), s: 1.7, x: 705, y: 880},
	{at: ACT('s6_chair'), s: 1.5, x: 410, y: 830},
	{at: ACT('s7_bubbles'), s: 1.04, x: 540, y: 820},
];
const MOVE = 18;
const moveEase = Easing.bezier(0.16, 1, 0.3, 1);
const SCREEN_X = 540;
const SCREEN_Y = 900;

const useCamera = () => {
	const f = useCurrentFrame();
	let i = 0;
	while (i + 1 < POSES.length && f >= POSES[i + 1].at) i++;
	const cur = POSES[i];
	const prev = POSES[Math.max(0, i - 1)];
	const p = i === 0 ? 1 : moveEase(Math.min(1, Math.max(0, (f - cur.at) / MOVE)));
	const drift = 1 + 0.012 * Math.max(0, f - cur.at) / 30;
	const s = Math.exp(Math.log(prev.s) + (Math.log(cur.s) - Math.log(prev.s)) * p) * drift;
	return {shot: i + 1, s, x: prev.x + (cur.x - prev.x) * p, y: prev.y + (cur.y - prev.y) * p};
};

const CAP_Y = 1600;

export const VibeM02RemotionTrial10s: React.FC = () => {
	const frame = useCurrentFrame();
	const {durationInFrames} = useVideoConfig();
	const cam = useCamera();
	const c = CUES;
	const [l1, l2, l4, l5, l6, l7] = LINES;

	const cool = interpolate(frame, [ACT('s7_split'), ACT('s7_split') + 45], [0, 1], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});

	return (
		<AbsoluteFill>
			<Backdrop cool={cool} />
			<AbsoluteFill>
				<svg width={1080} height={1920} viewBox="0 0 1080 1920">
					<g transform={`translate(${SCREEN_X} ${SCREEN_Y}) scale(${cam.s}) translate(${-cam.x} ${-cam.y})`}>
						<Stage />
					</g>
				</svg>
			</AbsoluteFill>
			<AbsoluteFill
				style={{
					background: 'radial-gradient(ellipse 80% 60% at 50% 46%, rgba(0,0,0,0) 50%, rgba(0,0,0,0.6) 100%)',
				}}
			/>
			<AbsoluteFill style={{background: '#3E5A7A', mixBlendMode: 'color', opacity: 0.38 * cool}} />
			<AbsoluteFill
				style={{
					background: 'linear-gradient(180deg, rgba(10,9,7,0) 74%, rgba(10,9,7,0.82) 82%, rgba(10,9,7,0.9) 100%)',
				}}
			/>

			<Chrome shot={cam.shot} />

			<Line variant="small" t={l1.segs[0].t} gold={l1.segs[0].gold} startF={c.s1.startF} endF={c.s1.endF} y={CAP_Y} />
			<Line variant="small" t={l2.segs[0].t} startF={c.s2a.startF} endF={c.s2a.endF} y={CAP_Y} />
			<Line variant="big" t={l4.segs[0].t} gold={l4.segs[0].gold} startF={c.s4.startF} endF={c.s4.endF} y={CAP_Y} />
			<Line variant="big" t={l5.segs[0].t} gold={l5.segs[0].gold} startF={c.s5.startF} endF={c.s5.endF} y={CAP_Y} />
			<Line variant="small" t={l6.segs[0].t} gold={l6.segs[0].gold} startF={c.s6.startF} endF={c.s6.endF} y={CAP_Y} />
			<Line variant="small" t={l7.segs[0].t} startF={c.s7a.startF} endF={null} y={CAP_Y - 66} />
			<Line variant="big" t={l7.segs[1].t} gold={l7.segs[1].gold} startF={c.s7b.startF} endF={null} y={CAP_Y + 22} />

			{HAS_SOUNDTRACK ? <Audio src={staticFile('soundtrack.wav')} /> : null}
			{ACTIONS.filter((a) => a.sfx).map((a) => (
				<Sequence key={a.id} from={a.f} durationInFrames={Math.min(18, durationInFrames - a.f)} layout="none">
					<Audio src={staticFile(`sfx/${a.sfx}.wav`)} volume={sfxVolume(a.sfx!)} />
				</Sequence>
			))}
		</AbsoluteFill>
	);
};
