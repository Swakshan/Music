// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { useAtomValue, useSetAtom } from "jotai";
import { useMemo } from "react";
import { I18nManager, View } from "react-native";

import { PlaybackControls } from "~/stores/Playback/actions";
import { usePreferenceStore } from "~/stores/Preference/store";

import { Waveform, useWaveformSamples } from "./Waveform";
import {
  animatedPositionAtom,
  isSeekingAtom,
  renderedPositionAtom,
} from "../helpers/Seekbar.context";

import { Seconds } from "~/utils/date";
import { clamp } from "~/utils/number";
import { CachedSlider } from "~/components/Form/Slider";
import { Em } from "~/components/Typography/StyledText";
import { Badge } from "~/navigation/screens/tracks/sheets/TrackSheet";

interface SeekBarProps {
  id: string;
  uri: string;
  trackLength: number;
  format: string;
}

export function SeekBar(props: SeekBarProps) {
  const waveformSlider = usePreferenceStore(
    (s) => s.seekbarDesign === "waveform",
  );
  const samples = useWaveformSamples(props.id, props.uri);
  const timedPosition = useAtomValue(animatedPositionAtom);
  const setIsSeeking = useSetAtom(isSeekingAtom);
  const renderedPos = useAtomValue(renderedPositionAtom);

  const showFormat = usePreferenceStore((s) => s.showFormat);
  const format = props.format
  const shouldShowFormat = showFormat && format.length > 0

  const sharedSliderOptions = useMemo(
    () => ({
      initValue: 0,
      liveValue: timedPosition,
      min: 0,
      max: props.trackLength,
      getInteractionStatus: setIsSeeking,
      onComplete: PlaybackControls.seekTo,
      inverted: I18nManager.isRTL,
    }),
    [timedPosition, setIsSeeking, props.trackLength],
  );

  const clampedPos = clamp(0, renderedPos, props.trackLength);

  return (
    <View>
      {waveformSlider ? (
        <View className="relative mb-2 h-10">
          <Waveform
            amplitudes={samples}
            height={40}
            progress={clampedPos}
            maxProgress={props.trackLength}
          />
          <CachedSlider
            {...sharedSliderOptions}
            thickness={40}
            transparent
            _className="absolute top-0 left-0 w-full"
          />
        </View>
      ) : (
        <CachedSlider
          {...sharedSliderOptions}
          hitSlop={8}
          trackColor="surfaceContainerHigh"
          roundedEndStop
        />
      )}
      <View className="flex-row justify-between rtl:flex-row-reverse">
        <Em>{Seconds.toReadableTime(clampedPos)}</Em>
        {/* Reverse space for format and control it via opacity
        so that there is no visual shift/jump when toggled */}
        <View className={`${shouldShowFormat ? 'opacity-100' : 'opacity-0'}`}>
          <Badge>{shouldShowFormat ? format.toUpperCase() : ""}</Badge>
        </View>
        <Em>{Seconds.toReadableTime(props.trackLength)}</Em>
      </View>
    </View>
  );
}
