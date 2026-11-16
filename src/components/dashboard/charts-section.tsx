'use client';

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Cell,
} from 'recharts';
import { FiTrendingUp, FiClipboard, FiCalendar } from 'react-icons/fi';
import type { DashboardCharts } from '@/lib/data/dashboard-charts';

const SISYPHUS = '#0078D4';
const STAGE_COLORS: Record<string, string> = { Πριν: '#8B5CF6', Κατά: '#0078D4', Μετά: '#14B8A6' };
const AXIS = 'hsl(25 8% 42%)';
const GRID = 'hsl(30 10% 89%)';

function Panel({
  title,
  Icon,
  children,
  empty,
}: {
  title: string;
  Icon: typeof FiTrendingUp;
  children: React.ReactNode;
  empty?: boolean;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="rounded-md p-1.5 bg-primary/10 text-primary">
          <Icon className="h-4 w-4" />
        </span>
        <h3 className="font-semibold text-sm">{title}</h3>
      </div>
      {empty ? (
        <div className="h-[200px] flex items-center justify-center text-sm text-muted-foreground">Δεν υπάρχουν δεδομένα ακόμη</div>
      ) : (
        children
      )}
    </div>
  );
}

const tip = {
  contentStyle: {
    background: 'hsl(0 0% 100%)',
    border: '1px solid hsl(30 10% 89%)',
    borderRadius: 8,
    fontSize: 12,
    boxShadow: '0 4px 12px rgba(0,0,0,.08)',
  },
};

export function ChartsSection({ data }: { data: DashboardCharts }) {
  const callsTotal = data.callsPerDay.reduce((s, d) => s + d.calls, 0);
  const reqTotal = data.requestsByCategory.reduce((s, d) => s + d.count, 0);
  const apptTotal = data.appointmentsByStage.reduce((s, d) => s + d.count, 0);

  return (
    <div className="space-y-6">
      <Panel title="Συνεδρίες concierge — τελευταίες 14 ημέρες" Icon={FiTrendingUp} empty={callsTotal === 0}>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={data.callsPerDay} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
            <defs>
              <linearGradient id="gCalls" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={SISYPHUS} stopOpacity={0.35} />
                <stop offset="100%" stopColor={SISYPHUS} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke={GRID} />
            <XAxis dataKey="label" tick={{ fill: AXIS, fontSize: 11 }} tickLine={false} axisLine={{ stroke: GRID }} />
            <YAxis allowDecimals={false} width={32} tick={{ fill: AXIS, fontSize: 11 }} tickLine={false} axisLine={false} />
            <Tooltip {...tip} cursor={{ stroke: SISYPHUS, strokeOpacity: 0.3 }} />
            <Area type="monotone" dataKey="calls" name="Συνεδρίες" stroke={SISYPHUS} strokeWidth={2} fill="url(#gCalls)" dot={false} activeDot={{ r: 4 }} />
          </AreaChart>
        </ResponsiveContainer>
      </Panel>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Panel title="Αιτήματα ανά κατηγορία" Icon={FiClipboard} empty={reqTotal === 0}>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data.requestsByCategory} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 4 }}>
              <CartesianGrid horizontal={false} stroke={GRID} />
              <XAxis type="number" allowDecimals={false} tick={{ fill: AXIS, fontSize: 11 }} tickLine={false} axisLine={{ stroke: GRID }} />
              <YAxis type="category" dataKey="category" width={100} tick={{ fill: AXIS, fontSize: 11 }} tickLine={false} axisLine={false} />
              <Tooltip {...tip} cursor={{ fill: 'hsl(40 12% 95%)' }} />
              <Bar dataKey="count" name="Αιτήματα" fill={SISYPHUS} radius={[0, 4, 4, 0]} barSize={16} />
            </BarChart>
          </ResponsiveContainer>
        </Panel>

        <Panel title="Ραντεβού ανά φάση" Icon={FiCalendar} empty={apptTotal === 0}>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data.appointmentsByStage} margin={{ top: 4, right: 8, left: -16, bottom: 4 }}>
              <CartesianGrid vertical={false} stroke={GRID} />
              <XAxis dataKey="stage" tick={{ fill: AXIS, fontSize: 11 }} tickLine={false} axisLine={{ stroke: GRID }} />
              <YAxis allowDecimals={false} width={32} tick={{ fill: AXIS, fontSize: 11 }} tickLine={false} axisLine={false} />
              <Tooltip {...tip} cursor={{ fill: 'hsl(40 12% 95%)' }} />
              <Bar dataKey="count" name="Ραντεβού" radius={[4, 4, 0, 0]} barSize={48}>
                {data.appointmentsByStage.map((d) => (
                  <Cell key={d.stage} fill={STAGE_COLORS[d.stage] ?? SISYPHUS} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Panel>
      </div>
    </div>
  );
}
