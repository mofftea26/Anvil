import React, { memo, useMemo } from "react";
import { View } from "react-native";
import Svg, { Rect } from "react-native-svg";

import { useTheme } from "@/shared/ui";
import { hexToRgba } from "@/features/profile/utils/trainerProfileUtils";

export const MiniBarChart = memo(function MiniBarChart(props: {
  values: number[];
  height?: number;
}) {
  const theme = useTheme();
  const height = props.height ?? 64;
  const width = 240;

  const { bars, max } = useMemo(() => {
    const vals = props.values.map((v) => (Number.isFinite(v) ? Math.max(0, v) : 0));
    const m = Math.max(1, ...vals);
    return { bars: vals, max: m };
  }, [props.values]);

  const gap = 6;
  const barW = Math.max(6, Math.floor((width - gap * (bars.length - 1)) / Math.max(1, bars.length)));

  return (
    <View style={{ height, width }}>
      <Svg width={width} height={height}>
        {bars.map((v, i) => {
          const h = Math.max(3, Math.round((v / max) * (height - 6)));
          const x = i * (barW + gap);
          const y = height - h;
          return (
            <Rect
              key={i}
              x={x}
              y={y}
              width={barW}
              height={h}
              rx={6}
              fill={hexToRgba(theme.colors.accent, 0.85)}
            />
          );
        })}
      </Svg>
    </View>
  );
});

