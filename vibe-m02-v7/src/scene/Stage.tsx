import React from 'react';
import {useCurrentFrame, useVideoConfig} from 'remotion';
import {ACT, CUES, LABELS, LINES} from '../cues';
import {Her, HER, HerMini} from './Her';
import {BubbleText, Chair, Clipboard, Crack, Floor, SceneLabel, SpeechBubble, TableHalf, ThoughtBubble, Thermometer, Toolbox, Wrench} from './Props';
import {easeInOut, INK, lerp, ramp, rrect} from './draw';
import {You, YOU, YouArm, YouMini} from './You';

const bubbleSegs = LINES[1].segs.filter((s) => s.role === 'bubble');

// 她的念头：两个人并排坐着。
const SitTogether: React.FC = () => (
	<g>
		<ellipse cx={0} cy={6} rx={92} ry={52} fill="#F2C978" opacity={0.35} />
		<path d={rrect(-78, 38, 156, 12, 6)} fill="#8B6440" stroke={INK} strokeWidth={2.5} />
		<path d={rrect(-58, 2, 40, 40, 15)} fill={HER.sweater} stroke={INK} strokeWidth={2.5} />
		<path d={rrect(18, 2, 40, 40, 15)} fill={YOU.shirt} stroke={INK} strokeWidth={2.5} />
		<HerMini x={-38} y={-20} r={21} />
		<YouMini x={38} y={-22} r={21} />
	</g>
);

const Mind: React.FC<{who: 'her' | 'you'; cold: number}> = ({who, cold}) => (
	<g>
		{who === 'her' ? <YouMini x={-38} y={-8} r={34} cold={cold} /> : <HerMini x={-38} y={-8} r={34} cold={cold} />}
		<Thermometer x={46} y={-4} cold={cold} />
	</g>
);

export const Stage: React.FC = () => {
	const f = useCurrentFrame();
	const {durationInFrames} = useVideoConfig();
	const split0 = ACT('s7_split');
	const split = f >= split0;
	const apart = split ? lerp(0, 1, ramp(f, split0, 40, easeInOut)) * 44 + ((f - split0) / (durationInFrames - split0)) * 10 : 0;
	const tilt = split ? ramp(f, split0, 30, easeInOut) * 1.6 : 0;
	const cold = ramp(f, ACT('s7_cold'), 16, easeInOut);

	const labelsOn =
		ramp(f, ACT('s2_wide') + 12, 10) * (1 - ramp(f, CUES.s4.startF, 6)) + ramp(f, ACT('s7_bubbles'), 10);
	const s2End = CUES.s2a.endF ?? CUES.s4.startF;
	const s6End = CUES.s6.endF ?? CUES.s7a.startF;

	return (
		<g>
			<Floor />

			<g transform={`translate(${-apart} 0) rotate(${-tilt} 540 1330)`}>
				<Chair />
				<Her />
				<TableHalf side="left" split={split} />
				<SceneLabel x={330} t={LABELS.her} opacity={labelsOn} />
				<ThoughtBubble x={300} y={500} rx={150} ry={96} dots={[[420, 642], [404, 610]]} start={ACT('s6_think')} end={s6End}>
					<g transform="scale(1.22)">
						<SitTogether />
					</g>
				</ThoughtBubble>
				<ThoughtBubble x={250} y={466} rx={128} ry={118} dots={[[250, 634], [244, 604]]} start={ACT('s7_bubbles')} end={null} tint={cold}>
					<g transform="scale(1.12)">
						<Mind who="her" cold={cold} />
					</g>
				</ThoughtBubble>
			</g>

			<g transform={`translate(${apart} 0) rotate(${tilt} 540 1330)`}>
				<You />
				<TableHalf side="right" split={split} />
				<YouArm part="limb" />
				<Clipboard />
				<Toolbox />
				<YouArm part="hand" />
				<SceneLabel x={770} t={LABELS.you} opacity={labelsOn} />
				<ThoughtBubble x={830} y={398} rx={128} ry={118} dots={[[846, 562], [838, 534]]} start={ACT('s7_bubbles') + 3} end={null} tint={cold}>
					<g transform="scale(1.12)">
						<Mind who="you" cold={cold} />
					</g>
				</ThoughtBubble>
			</g>
			{split && apart < 4 ? <Crack /> : null}

			<SpeechBubble x={676} y={326} w={262} h={92} tail={[806, 548]} start={ACT('s2_ask')} end={s2End}>
				<BubbleText t={bubbleSegs[0].t} gold={bubbleSegs[0].gold} />
			</SpeechBubble>
			<SpeechBubble x={262} y={446} w={496} h={92} tail={[716, 574]} start={ACT('s2_offer')} end={s2End}>
				<Wrench x={-196} y={2} s={0.95} />
				<BubbleText t={bubbleSegs[1].t} gold={bubbleSegs[1].gold} dx={28} />
			</SpeechBubble>
		</g>
	);
};
