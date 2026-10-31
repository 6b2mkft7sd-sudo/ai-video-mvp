import React from 'react';
import {useCurrentFrame} from 'remotion';
import {ACT, CUES} from '../cues';
import {easeInOut, easeOut, ell, INK, lerp, Limb, pop, ramp, rrect, Shape, Stroke} from './draw';

export const YOU = {
	skin: '#E2BC95',
	skinShade: '#C5976F',
	hair: '#1C1712',
	shirt: '#3D4B57',
	shirtShade: '#2E3943',
	pen: '#D8B56A',
	pants: '#2A2F36',
	shoe: '#15120F',
};

const CX = 770;
export const ROWS = [955, 1010, 1065];

type P = [number, number];
const lerpP = (a: P, b: P, t: number): P => [lerp(a[0], b[0], t), lerp(a[1], b[1], t)];

const usePose = () => {
	const f = useCurrentFrame();
	const s = ACT('s2_wide') + 2;
	const ask = ramp(f, ACT('s2_ask') - 3, 6) * (1 - ramp(f, CUES.s2a.endF ?? CUES.s4.startF, 8));
	const busy = ramp(f, ACT('s5_pan'), 6);
	const away = ramp(f, ACT('s7_split'), 18, easeInOut);

	const ticks = [ACT('s5_tick1'), ACT('s5_tick2'), ACT('s5_tick3')];
	// 笔尖在每个勾落下的那一刻正好到该行的勾选框，手握在笔杆中段。
	const tipAt = (i: number) => [640, ROWS[i] - 4] as P;
	let tip: P = tipAt(0);
	ticks.forEach((t, i) => {
		if (i > 0) tip = lerpP(tip, tipAt(i), ramp(f, t - 5, 5, easeInOut));
	});
	const hand: P = [tip[0] + 20, tip[1] - 26];
	const rest: P = [700, 1104];
	const raised: P = [636, 858];
	let left = lerpP(rest, raised, ask);
	left = lerpP(left, hand, busy);
	const ctrl = lerpP(lerpP([652, 990], [620, 960], ask), [650, 930], busy);
	return {f, s, ask, busy, away, left, ctrl, tip};
};

// 你的左臂拆两层：胳膊在清单板后面，握笔的手在板子前面（不挡住勾）。
export const YouArm: React.FC<{part: 'limb' | 'hand'}> = ({part}) => {
	const {f, s, busy, left, ctrl, tip} = usePose();
	if (part === 'limb') {
		return <Limb d={`M 690 832 Q ${ctrl[0]} ${ctrl[1]} ${left[0]} ${left[1]}`} color={YOU.shirt} width={32} start={s + 5} />;
	}
	const end: P = [tip[0] + 46, tip[1] - 60];
	const cap: P = lerpP(tip, end, 0.72);
	return (
		<g opacity={ramp(f, s + 12, 6)}>
			{busy > 0 ? (
				<g opacity={busy} strokeLinecap="round">
					<path d={`M ${tip[0]} ${tip[1]} L ${end[0]} ${end[1]}`} stroke={INK} strokeWidth={13} />
					<path d={`M ${tip[0] + 3} ${tip[1] - 4} L ${end[0]} ${end[1]}`} stroke="#34404A" strokeWidth={8} />
					<path d={`M ${cap[0]} ${cap[1]} L ${end[0]} ${end[1]}`} stroke={YOU.pen} strokeWidth={8} />
				</g>
			) : null}
			<path d={ell(left[0], left[1], 16, 14)} fill={YOU.skin} stroke={INK} strokeWidth={3} />
			{busy > 0 ? <path d={ell(left[0] - 10, left[1] + 6, 8, 6)} fill={YOU.skin} stroke={INK} strokeWidth={2.5} opacity={busy} /> : null}
		</g>
	);
};

// 你：站在桌子右边。问 → 帮你弄 → 急着打勾 → 扭头。
export const You: React.FC = () => {
	const {f, s, ask, busy, away} = usePose();

	const browLift = ask * -8;
	const furrow = Math.max(busy, away * 0.7);
	const headRot = away * 10 + busy * -3 * (1 - away);

	const sweat = pop(f, ACT('s5_tick3'), 10);
	const sweatSlide = ramp(f, ACT('s5_tick3') + 6, 20, easeOut);

	return (
		<g>
			<Shape d="M 652 1128 C 652 904 680 800 730 786 L 810 786 C 860 800 888 904 888 1128 Z" fill={YOU.shirt} start={s + 2} dur={12} />
			<Shape d={rrect(716, 1196, 40, 128, 14)} fill={YOU.pants} start={s + 4} dur={8} />
			<Shape d={rrect(784, 1196, 40, 128, 14)} fill={YOU.pants} start={s + 5} dur={8} />
			<Shape d={ell(730, 1326, 30, 11)} fill={YOU.shoe} start={s + 9} dur={5} />
			<Shape d={ell(810, 1326, 30, 11)} fill={YOU.shoe} start={s + 9} dur={5} />
			<Shape d="M 744 786 L 770 826 L 796 786 Z" fill={YOU.skinShade} start={s + 7} dur={6} />
			<Limb d="M 852 832 Q 902 982 858 1102" color={YOU.shirt} width={32} start={s + 6} />
			<Shape d={ell(858, 1104, 16, 14)} fill={YOU.skin} start={s + 12} dur={6} />

			<g transform={`rotate(${headRot} ${CX} 780)`}>
				<Shape d="M 754 724 C 756 756 754 774 746 792 Q 770 804 794 792 C 786 774 784 756 786 724 Z" fill={YOU.skinShade} start={s + 3} dur={6} />
				<Shape d={ell(694, 664, 10, 16)} fill={YOU.skin} start={s + 4} dur={6} />
				<Shape d={ell(846, 664, 10, 16)} fill={YOU.skin} start={s + 4} dur={6} />
				<Shape d={ell(CX, 656, 76, 86)} fill={YOU.skin} start={s} dur={12} />
				<Shape
					d="M 692 652 C 684 580 728 554 772 554 C 824 554 858 584 850 652 C 832 616 802 600 772 606 C 740 600 712 618 692 652 Z"
					fill={YOU.hair}
					start={s + 3}
					dur={10}
				/>
				<path
					d={`M 734 ${624 + browLift - furrow * 4} L 762 ${622 + browLift + furrow * 6}`}
					stroke={YOU.hair}
					strokeWidth={6}
					strokeLinecap="round"
					opacity={ramp(f, s + 10, 4)}
				/>
				<path
					d={`M 778 ${622 + browLift + furrow * 6} L 806 ${624 + browLift - furrow * 4}`}
					stroke={YOU.hair}
					strokeWidth={6}
					strokeLinecap="round"
					opacity={ramp(f, s + 10, 4)}
				/>
				<Shape d={ell(748 - busy * 6 - away * 4, 654 + busy * 6, 7, 9)} fill={INK} start={s + 11} dur={5} />
				<Shape d={ell(792 - busy * 6 + away * 4, 654 + busy * 6, 7, 9)} fill={INK} start={s + 11} dur={5} />
				<Stroke d="M 770 668 Q 766 682 775 684" start={s + 12} sw={3} color={YOU.skinShade} />
				<g opacity={ramp(f, s + 13, 4)}>
					{ask > 0.5 ? (
						<path d={ell(770, 706, 8, 10)} fill={INK} />
					) : (
						<path
							d={`M 754 ${703 + away * 3} Q 770 ${lerp(708, 699, Math.max(busy, away))} 786 ${703 + away * 3}`}
							stroke={INK}
							strokeWidth={4}
							strokeLinecap="round"
							fill="none"
						/>
					)}
				</g>
				{sweat > 0 ? (
					<g transform={`translate(${850 + sweatSlide * 6} ${606 + sweatSlide * 30}) scale(${sweat})`} opacity={1 - ramp(f, CUES.s6.startF, 8)}>
						<path d="M 0 -13 C 5 -4 9 1 9 6 A 9 9 0 1 1 -9 6 C -9 1 -5 -4 0 -13 Z" fill="#BFDDF0" stroke={INK} strokeWidth={2.5} />
					</g>
				) : null}
			</g>
		</g>
	);
};

export const YouMini: React.FC<{x: number; y: number; r: number; cold?: number}> = ({x, y, r, cold = 0}) => (
	<g>
		<path
			d={ell(x, y, r * 0.9, r)}
			fill={cold ? `rgb(${lerp(226, 158, cold)},${lerp(188, 182, cold)},${lerp(149, 204, cold)})` : YOU.skin}
			stroke={INK}
			strokeWidth={2}
		/>
		<path
			d={`M ${x - r * 0.92} ${y - r * 0.05} C ${x - r} ${y - r * 1.05} ${x + r} ${y - r * 1.05} ${x + r * 0.92} ${y - r * 0.05} C ${x + r * 0.5} ${y - r * 0.55} ${x - r * 0.5} ${y - r * 0.55} ${x - r * 0.92} ${y - r * 0.05} Z`}
			fill={YOU.hair}
		/>
		<circle cx={x - r * 0.3} cy={y + r * 0.08} r={r * 0.09} fill={INK} />
		<circle cx={x + r * 0.3} cy={y + r * 0.08} r={r * 0.09} fill={INK} />
		<path d={`M ${x - r * 0.22} ${y + r * 0.5} Q ${x} ${y + r * 0.42} ${x + r * 0.22} ${y + r * 0.5}`} stroke={INK} strokeWidth={2} fill="none" />
	</g>
);
