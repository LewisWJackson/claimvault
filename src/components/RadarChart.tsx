'use client';

import { Radar, RadarChart as RechartsRadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts';

interface RadarChartProps {
  data: { category: string; value: number; fullMark: number }[];
  size?: number;
}

export default function RadarChart({ data, size }: RadarChartProps) {
  return (
    <div style={{ width: '100%', height: size || 300 }}>
      <ResponsiveContainer>
        <RechartsRadarChart data={data} cx="50%" cy="50%" outerRadius="75%">
          <PolarGrid stroke="rgba(255,255,255,0.08)" />
          <PolarAngleAxis
            dataKey="category"
            tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }}
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 100]}
            tick={false}
            axisLine={false}
          />
          <Radar
            name="Accuracy"
            dataKey="value"
            stroke="#f97316"
            fill="url(#radarGradient)"
            fillOpacity={0.3}
            strokeWidth={2}
          />
          <Tooltip
            contentStyle={{
              background: 'rgba(10, 10, 26, 0.95)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
              color: '#fff',
              fontSize: '12px',
            }}
            formatter={(value: number) => [`${value}%`, 'Accuracy']}
          />
          <defs>
            <linearGradient id="radarGradient" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#f97316" stopOpacity={0.6} />
              <stop offset="100%" stopColor="#e040fb" stopOpacity={0.6} />
            </linearGradient>
          </defs>
        </RechartsRadarChart>
      </ResponsiveContainer>
    </div>
  );
}
