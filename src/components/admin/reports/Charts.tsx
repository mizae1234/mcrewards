'use client';

import React from 'react';
import {
    BarChart as ReBarChart, Bar,
    LineChart as ReLineChart, Line,
    PieChart as RePieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

const COLORS = ['#FFBC0D', '#DB0007', '#27251F', '#DA291C', '#FFC72C'];

interface ChartProps {
    data: any[];
    dataKey: string;
    categoryKey: string;
    type: 'bar' | 'line' | 'pie';
    height?: number;
    color?: string;
    title?: string;
}

export const Chart: React.FC<ChartProps> = ({
    data,
    dataKey,
    categoryKey,
    type,
    height = 300,
    color = '#FFBC0D'
}) => {
    if (type === 'bar') {
        return (
            <ResponsiveContainer width="100%" height={height}>
                <ReBarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey={categoryKey} fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip
                        cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    />
                    <Bar dataKey={dataKey} fill={color} radius={[4, 4, 0, 0]} />
                </ReBarChart>
            </ResponsiveContainer>
        );
    }

    if (type === 'line') {
        return (
            <ResponsiveContainer width="100%" height={height}>
                <ReLineChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey={categoryKey} fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    />
                    <Line type="monotone" dataKey={dataKey} stroke={color} strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                </ReLineChart>
            </ResponsiveContainer>
        );
    }

    if (type === 'pie') {
        return (
            <ResponsiveContainer width="100%" height={height}>
                <RePieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey={dataKey}
                    >
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Pie>
                    <Tooltip />
                    <Legend verticalAlign="bottom" height={36} />
                </RePieChart>
            </ResponsiveContainer>
        );
    }

    return null;
};
