"use client";

import React from "react";
import { AreaChart, Area, ResponsiveContainer, YAxis } from "recharts";

interface SparklineChartProps {
  data: number[];
  isAnomaly: boolean;
  color?: string;
}

export const SparklineChart: React.FC<SparklineChartProps> = ({ data, isAnomaly, color }) => {
  const chartData = data.map((val, idx) => ({ index: idx, value: val }));
  const strokeColor = color || (isAnomaly ? "#f43f5e" : "#10b981");
  const fillColor = isAnomaly ? "rgba(244, 63, 94, 0.2)" : "rgba(16, 185, 129, 0.2)";

  return (
    <div className="w-full h-12">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 2, right: 0, left: 0, bottom: 2 }}>
          <defs>
            <linearGradient id={`grad-${isAnomaly ? 'red' : 'green'}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={strokeColor} stopOpacity={0.4} />
              <stop offset="100%" stopColor={strokeColor} stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <YAxis domain={["dataMin - 1", "dataMax + 1"]} hide />
          <Area
            type="monotone"
            dataKey="value"
            stroke={strokeColor}
            strokeWidth={1.75}
            fill={`url(#grad-${isAnomaly ? 'red' : 'green'})`}
            isAnimationActive={true}
            animationDuration={800}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
