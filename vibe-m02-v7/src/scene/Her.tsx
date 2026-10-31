import React from 'react';
import {useCurrentFrame} from 'remotion';
import {ACT, CUES} from '../cues';
import {clamp01, easeInOut, ell, INK, lerp, Limb, pop, ramp, rrect, Shape, Stroke} from './draw';

export const HER = {
	skin: '#E6C09A',
	skinShade: '#C99B74',
	hair: '#2B1D15',
	sweater: '#8A5A3A',
	sweaterShade: '#6E452C',
	red: '#C8504A',
	tear: '#A9CDE8',
	pants: '#3A2A22',
	shoe: '#1A130E',
};

const CX = 330;

// 她：坐在桌子左边。所有表情都挂在 beats.json 的动作帧上。
export const Her: React.FC = () => {
	const f = useCurrentFrame();
	const s = ACT('s1_draw');
	const red = ramp(f, ACT('s1_red'), 10);

	const shake0 = ACT('s4_shake');
	const shake = f >= shake0 && f < shake0 + 26 ? 10 * Math.sin(((f - shake0) / 10) * 2 * Math.PI) * Math.exp(-(f - shake0) / 16) : 0;
	const down = ramp(f, CUES.s2a.endF ?? CUES.s4.startF, 12) * (1 - 0.7 * ramp(f, ACT('s6_chair'), 10));
	const toChair = ramp(f, ACT('s6_chair') + 4, 8) * (1 - ramp(f, ACT('s7_split'), 8));
	const away = ramp(f, ACT('s7_split'), 18, easeInOut);
	const headRot = shake + toChair * 4 - away * 10 + down * 3;
	const pupil = toChair * 5 - away * 6;

	const mute = ramp(f, ACT('s4_mute'), 6);
	const mouthMid = lerp(820, 829, mute);
	const mouthEnd = lerp(833, 829, mute);
	const mouthHalf = lerp(19, 15, mute);

	const tear0 = ACT('s1_tear');
	const tg = pop(f, tear0, 9);
	const ts = ramp(f, tear0 + 7, 14, (v) => v * v);
	const tf = 1 - ramp(f, tear0 + 17, 8);

	const dot0 = CUES.s4.startF + 3;
	const dotIn = pop(f, dot0, 12);
	const dotOut = ramp(f, ACT('s4_mute'), 7);
	const dotScale = dotIn * (1 - dotOut);

	return (
		<g>
			<Shape d={rrect(282, 1196, 32, 118, 13)} fill={HER.pants} start={s + 4} dur={8} />
			<Shape d={rrect(346, 1196, 32, 118, 13)} fill={HER.pants} start={s + 5} dur={8} />
			<Shape d={ell(294, 1318, 25, 10)} fill={HER.shoe} start={s + 9} dur={5} />
			<Shape d={ell(366, 1318, 25, 10)} fill={HER.shoe} start={s + 9} dur={5} />
			<Shape d="M 214 1128 C 220 990 242 926 292 906 L 368 906 C 418 926 440 990 446 1128 Z" fill={HER.sweater} start={s + 2} dur={12} />
			<Shape d="M 300 906 C 312 936 348 936 360 906 Z" fill={HER.sweaterShade} start={s + 6} dur={6} />
			<Limb d="M 252 962 Q 228 1062 300 1104" color={HER.sweater} width={34} start={s + 5} />
			<Limb d="M 408 962 Q 432 1062 360 1104" color={HER.sweater} width={34} start={s + 6} />
			<Shape d={ell(312, 1106, 17, 14)} fill={HER.skin} start={s + 12} dur={6} />
			<Shape d={ell(348, 1106, 17, 14)} fill={HER.skin} start={s + 12} dur={6} />

			<g transform={`rotate(${headRot} ${CX} 870) translate(0 ${down * 12})`}>
				<Shape
					d="M 238 772 C 228 652 298 638 330 638 C 362 638 432 652 422 772 L 430 884 C 404 900 382 886 374 866 L 286 866 C 278 886 256 900 230 884 Z"
					fill={HER.hair}
					start={s}
					dur={13}
				/>
				<Shape d="M 314 836 C 316 870 314 892 306 910 Q 330 922 354 910 C 346 892 344 870 346 836 Z" fill={HER.skinShade} start={s + 3} dur={6} />
				<Shape d={ell(CX, 766, 78, 90)} fill={HER.skin} start={s + 2} dur={12} />
				<Shape
					d="M 252 762 C 246 690 290 660 334 662 C 380 662 416 692 410 748 C 382 722 350 702 318 712 C 296 722 272 740 252 762 Z"
					fill={HER.hair}
					start={s + 5}
					dur={10}
				/>

				<g opacity={red}>
					<path d={ell(300, 790, 22, 9)} fill={HER.red} opacity={0.42} />
					<path d={ell(360, 790, 22, 9)} fill={HER.red} opacity={0.42} />
					<path d={ell(300, 773, 16, 13)} fill="none" stroke={HER.red} strokeWidth={4} />
					<path d={ell(360, 773, 16, 13)} fill="none" stroke={HER.red} strokeWidth={4} />
				</g>
				<Shape d={ell(300 + pupil, 772, 7, 9)} fill={INK} start={s + 11} dur={5} />
				<Shape d={ell(360 + pupil, 772, 7, 9)} fill={INK} start={s + 11} dur={5} />
				<g opacity={red}>
					<circle cx={302 + pupil} cy={768} r={2.6} fill="#FFF6E8" />
					<circle cx={362 + pupil} cy={768} r={2.6} fill="#FFF6E8" />
				</g>
				<Stroke d="M 282 744 L 316 734" start={s + 10} sw={5} color={HER.hair} />
				<Stroke d="M 344 734 L 378 744" start={s + 10} sw={5} color={HER.hair} />
				<Stroke d="M 330 786 Q 325 802 335 804" start={s + 12} sw={3} color={HER.skinShade} />
				<path
					d={`M ${CX - mouthHalf} ${mouthEnd} Q ${CX} ${mouthMid} ${CX + mouthHalf} ${mouthEnd}`}
					stroke={INK}
					strokeWidth={4}
					strokeLinecap="round"
					fill="none"
					opacity={ramp(f, s + 13, 4)}
				/>

				{tg > 0 && tf > 0 ? (
					<g transform={`translate(${376 + ts * 4} ${792 + ts * 78}) scale(${tg})`} opacity={tf}>
						<path d="M 0 -15 C 6 -5 10 1 10 6 A 10 10 0 1 1 -10 6 C -10 1 -6 -5 0 -15 Z" fill={HER.tear} stroke={INK} strokeWidth={2} />
						<circle cx={-3} cy={4} r={2.5} fill="#FFFFFF" opacity={0.9} />
					</g>
				) : null}

				{dotScale > 0.01 ? (
					<g transform={`translate(436 806) scale(${dotScale})`}>
						<path d="M -46 -30 H 46 Q 62 -30 62 -14 V 14 Q 62 30 46 30 H -20 L -40 46 L -34 30 H -46 Q -62 30 -62 14 V -14 Q -62 -30 -46 -30 Z" fill="#EFE5CF" stroke={INK} strokeWidth={3} />
						{[-22, 0, 22].map((x) => (
							<circle key={x} cx={x} cy={0} r={5.5} fill={INK} />
						))}
					</g>
				) : null}
			</g>
		</g>
	);
};

export const HerMini: React.FC<{x: number; y: number; r: number; cold?: number}> = ({x, y, r, cold = 0}) => (
	<g>
		<path d={ell(x, y + r * 0.15, r * 1.12, r * 1.15)} fill={HER.hair} stroke={INK} strokeWidth={2} />
		<path d={ell(x, y, r * 0.86, r * 0.94)} fill={cold ? `rgb(${lerp(230, 160, cold)},${lerp(192, 184, cold)},${lerp(154, 205, cold)})` : HER.skin} stroke={INK} strokeWidth={2} />
		<path d={`M ${x - r * 0.88} ${y - r * 0.05} C ${x - r * 0.8} ${y - r * 0.9} ${x + r * 0.8} ${y - r * 0.9} ${x + r * 0.88} ${y - r * 0.15} C ${x + r * 0.3} ${y - r * 0.5} ${x - r * 0.4} ${y - r * 0.45} ${x - r * 0.88} ${y - r * 0.05} Z`} fill={HER.hair} />
		<circle cx={x - r * 0.3} cy={y + r * 0.1} r={r * 0.09} fill={INK} />
		<circle cx={x + r * 0.3} cy={y + r * 0.1} r={r * 0.09} fill={INK} />
		<path d={`M ${x - r * 0.22} ${y + r * (0.52 + 0.08 * clamp01(cold))} Q ${x} ${y + r * (0.44 + 0.0)} ${x + r * 0.22} ${y + r * (0.52 + 0.08 * clamp01(cold))}`} stroke={INK} strokeWidth={2} fill="none" />
	</g>
);
