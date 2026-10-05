"use client";

import { useQuery } from "@tanstack/react-query";
import { BrainCircuit } from "lucide-react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PieChart, Pie, Cell, AreaChart, Area, LineChart, Line,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchJson } from "@/lib/fetcher";
import { DISASTER_META, RISK_LEVEL_COLORS, type DisasterType } from "@/lib/constants";

interface Analytics {
  byType: { name: string; value: number }[];
  bySeverity: { name: string; value: number }[];
  overTime: { name: string; alerts: number }[];
  topRegions: { name: string; value: number }[];
  byChannel: { name: string; value: number }[];
  reportsByStatus: { name: string; value: number }[];
  preparedness: { name: string; users: number }[];
  engagement: { name: string; value: number }[];
  demoNote: string;
}

const tooltipStyle = { backgroundColor: "#101c30", border: "1px solid #24354f", borderRadius: 8, color: "#e8eef7", fontSize: 12 };

export default function AdminAnalyticsPage() {
  const { data, isLoading } = useQuery({ queryKey: ["admin-analytics"], queryFn: () => fetchJson<Analytics>("/api/admin/analytics") });

  if (isLoading || !data) {
    return (
      <div className="mx-auto max-w-7xl space-y-5 p-1">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 lg:grid-cols-2">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-72 rounded-xl" />)}</div>
      </div>
    );
  }

  const typeData = data.byType.map((t) => ({ ...t, label: DISASTER_META[(t.name as DisasterType)]?.label ?? t.name, color: DISASTER_META[(t.name as DisasterType)]?.color ?? "#22d3ee" }));

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-xl border border-cyan-400/25 bg-cyan-400/10"><BrainCircuit className="h-5 w-5 text-cyan-400" /></span>
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Platform Analytics</h1>
          <p className="text-sm text-muted-foreground">{data.demoNote}</p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* alerts over time */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2"><CardTitle className="text-base">Alerts over time (last 8 weeks)</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={data.overTime}>
                <defs>
                  <linearGradient id="alertGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.45} />
                    <stop offset="100%" stopColor="#22d3ee" stopOpacity={0.03} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1d2b44" />
                <XAxis dataKey="name" stroke="#8ba0bd" fontSize={11} />
                <YAxis stroke="#8ba0bd" fontSize={11} allowDecimals={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Area type="monotone" dataKey="alerts" stroke="#22d3ee" strokeWidth={2} fill="url(#alertGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* by disaster type */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Alerts by disaster type</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={typeData} layout="vertical" margin={{ left: 12 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1d2b44" horizontal={false} />
                <XAxis type="number" stroke="#8ba0bd" fontSize={11} allowDecimals={false} />
                <YAxis type="category" dataKey="label" stroke="#8ba0bd" fontSize={10} width={92} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(34,211,238,0.06)" }} />
                <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                  {typeData.map((t) => <Cell key={t.name} fill={t.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* by severity */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Alerts by severity</CardTitle></CardHeader>
          <CardContent className="flex justify-center">
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={data.bySeverity} dataKey="value" nameKey="name" innerRadius={60} outerRadius={95} paddingAngle={3} strokeWidth={0}>
                  {data.bySeverity.map((s) => (
                    <Cell key={s.name} fill={RISK_LEVEL_COLORS[s.name as keyof typeof RISK_LEVEL_COLORS] ?? "#22d3ee"} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
                <Legend formatter={(v: string) => <span style={{ color: "#8ba0bd", fontSize: 12 }}>{v}</span>} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* most affected regions */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Most affected regions</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={data.topRegions}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1d2b44" vertical={false} />
                <XAxis dataKey="name" stroke="#8ba0bd" fontSize={10} angle={-22} textAnchor="end" height={54} interval={0} />
                <YAxis stroke="#8ba0bd" fontSize={11} allowDecimals={false} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(34,211,238,0.06)" }} />
                <Bar dataKey="value" fill="#f97316" radius={[6, 6, 0, 0]} name="Alerts" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* notification engagement */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Notification engagement</CardTitle></CardHeader>
          <CardContent className="flex justify-center">
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={data.engagement} dataKey="value" nameKey="name" innerRadius={60} outerRadius={95} paddingAngle={3} strokeWidth={0}
                  label={(p: { name?: string }) => p.name}>
                  {data.engagement.map((e, i) => <Cell key={e.name} fill={i === 0 ? "#22c55e" : "#475569"} />)}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* channel mix */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Delivery channels (simulated)</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={data.byChannel}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1d2b44" vertical={false} />
                <XAxis dataKey="name" stroke="#8ba0bd" fontSize={11} />
                <YAxis stroke="#8ba0bd" fontSize={11} allowDecimals={false} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(34,211,238,0.06)" }} />
                <Bar dataKey="value" fill="#22d3ee" radius={[6, 6, 0, 0]} name="Messages" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* community reports */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Community reports by status</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={data.reportsByStatus}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1d2b44" />
                <XAxis dataKey="name" stroke="#8ba0bd" fontSize={11} />
                <YAxis stroke="#8ba0bd" fontSize={11} allowDecimals={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Line type="monotone" dataKey="value" stroke="#eab308" strokeWidth={2.5} dot={{ fill: "#eab308", r: 4 }} name="Reports" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* preparedness distribution */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2"><CardTitle className="text-base">Preparedness score distribution</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={data.preparedness}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1d2b44" vertical={false} />
                <XAxis dataKey="name" stroke="#8ba0bd" fontSize={11} />
                <YAxis stroke="#8ba0bd" fontSize={11} allowDecimals={false} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(34,211,238,0.06)" }} />
                <Bar dataKey="users" fill="#a78bfa" radius={[6, 6, 0, 0]} name="Users" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
