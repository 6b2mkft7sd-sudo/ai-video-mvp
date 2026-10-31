import React from 'react';
import {Composition} from 'remotion';
import {VibeM02RemotionTrial10s} from './VibeM02RemotionTrial10s';
import {DURATION_SEC, FPS} from './cues';

export const RemotionRoot: React.FC = () => (
	<Composition
		id="VibeM02RemotionTrial10s"
		component={VibeM02RemotionTrial10s}
		durationInFrames={Math.round(DURATION_SEC * FPS)}
		fps={FPS}
		width={1080}
		height={1920}
	/>
);
