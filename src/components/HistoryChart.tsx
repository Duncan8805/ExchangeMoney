import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface HistoryChartProps {
    data: { date: string; rate: number }[];
    currency: string;
    color?: string;
}

export default function HistoryChart({ data, currency, color = '#8884d8' }: HistoryChartProps) {
    if (!data || data.length === 0) return null;

    const minRate = Math.min(...data.map(d => d.rate));
    const maxRate = Math.max(...data.map(d => d.rate));
    const domain = [minRate * 0.995, maxRate * 1.005]; // Add some padding

    return (
        <div className="w-full h-64 mt-6 bg-white/5 rounded-2xl p-4 border border-white/10 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h3 className="text-white text-sm font-medium mb-4 ml-2">
                {currency} History
            </h3>
            <div className="w-full h-48">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data}>
                        <defs>
                            <linearGradient id="colorRate" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                                <stop offset="95%" stopColor={color} stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                        <XAxis
                            dataKey="date"
                            stroke="rgba(255,255,255,0.5)"
                            tick={{ fontSize: 10 }}
                            tickFormatter={(str) => {
                                const date = new Date(str);
                                return `${date.getFullYear()}/${date.getMonth() + 1}`;
                            }}
                            minTickGap={30}
                        />
                        <YAxis
                            domain={domain}
                            stroke="rgba(255,255,255,0.5)"
                            tick={{ fontSize: 10 }}
                            width={40}
                            tickFormatter={(val) => val.toFixed(2)}
                        />
                        <Tooltip
                            contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: 'none', borderRadius: '8px', color: '#fff' }}
                            itemStyle={{ color: '#fff' }}
                            labelStyle={{ color: '#aaa', marginBottom: '4px' }}
                            formatter={(value: number) => [value.toFixed(4), currency]}
                            labelFormatter={(label) => new Date(label).toLocaleDateString()}
                        />
                        <Area
                            type="monotone"
                            dataKey="rate"
                            stroke={color}
                            fillOpacity={1}
                            fill="url(#colorRate)"
                            strokeWidth={2}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
