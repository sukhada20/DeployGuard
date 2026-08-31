"use client";

import React, { useId } from "react";
import { AreaChart, Area, ResponsiveContainer, YAxis } from "recharts";

interface SparklineChartProps {
  data: number[];
  isAnomaly: boolean;
  color?: string;
}

export const SparklineChart: React.FC<SparklineChartProps> = ({ data, isAnomaly, color }) => {
  const gradId = useId();
  const chartData = data.map((val, idx) => ({ index: idx, value: val }));
  const strokeColor = color || (isAnomaly ? "#f43f5e" : "#10b981");

  return (
    <div className="w-full h-11 border-t border-border/40 pt-1.5 mt-1.5">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 2, right: 0, left: 0, bottom: 2 }}>
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={strokeColor} stopOpacity={0.25} />
              <stop offset="100%" stopColor={strokeColor} stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <YAxis domain={["dataMin - 1", "dataMax + 1"]} hide />
          <Area
            type="monotone"
            dataKey="value"
            stroke={strokeColor}
            strokeWidth={1.5}
            fill={`url(#${gradId})`}
            isAnimationActive={true}
            animationDuration={600}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
