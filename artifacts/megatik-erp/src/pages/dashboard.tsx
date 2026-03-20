import React from "react";
import { useGetDashboardStats, useGetDashboardCharts } from "@workspace/api-client-react";
import { useI18n } from "@/lib/i18n";
import { PageHeader, formatCurrency } from "@/components/ui-extras";
import { Users, UserCheck, Activity, CreditCard, Wallet, TrendingUp } from "lucide-react";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Legend
} from 'recharts';

function StatCard({ title, value, icon: Icon, trend, trendUp }: any) {
  return (
    <div className="bg-card rounded-2xl p-6 border border-border shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
      <div className="absolute top-0 end-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
        <Icon className="h-16 w-16 text-primary transform group-hover:scale-110 transition-transform duration-500" />
      </div>
      <div className="relative z-10">
        <p className="text-sm font-medium text-muted-foreground mb-1">{title}</p>
        <h3 className="text-3xl font-bold tracking-tight text-foreground">{value}</h3>
        {trend && (
          <p className={`text-xs font-medium mt-2 flex items-center ${trendUp ? 'text-emerald-500' : 'text-rose-500'}`}>
            <TrendingUp className={`h-3 w-3 me-1 ${!trendUp && 'rotate-180'}`} />
            {trend}
          </p>
        )}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { t } = useI18n();
  const { data: stats, isLoading: statsLoading } = useGetDashboardStats();
  const { data: charts, isLoading: chartsLoading } = useGetDashboardCharts({ period: "30d" });

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  if (statsLoading || chartsLoading) {
    return <div className="animate-pulse space-y-8">
      <div className="h-10 bg-muted rounded w-1/4"></div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1,2,3,4].map(i => <div key={i} className="h-32 bg-muted rounded-2xl"></div>)}
      </div>
    </div>;
  }

  return (
    <div>
      <PageHeader 
        title={t('dashboard')} 
        description="Overview of your network performance and financials." 
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
        <StatCard 
          title={t('total_subscribers')} 
          value={stats?.totalSubscribers || 0} 
          icon={Users} 
          trend="+12% this month"
          trendUp={true}
        />
        <StatCard 
          title={t('active')} 
          value={stats?.activeSubscribers || 0} 
          icon={UserCheck} 
          trend="85% of total"
          trendUp={true}
        />
        <StatCard 
          title={t('revenue_month')} 
          value={formatCurrency(stats?.totalRevenueMonth || 0)} 
          icon={Wallet} 
          trend="+5% vs last month"
          trendUp={true}
        />
        <StatCard 
          title={t('total_debts')} 
          value={formatCurrency(stats?.totalDebts || 0)} 
          icon={CreditCard} 
          trend={`${stats?.pendingDebts || 0} pending`}
          trendUp={false}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Revenue Chart */}
        <div className="bg-card rounded-2xl border border-border shadow-sm p-6 lg:col-span-2 flex flex-col">
          <h3 className="text-lg font-bold mb-6">Revenue Trend (30 Days)</h3>
          <div className="flex-1 min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={charts?.revenueByDay || []}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: 'hsl(var(--muted-foreground))', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: 'hsl(var(--muted-foreground))', fontSize: 12}} dx={-10} tickFormatter={(v) => `£${v}`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                  itemStyle={{ color: 'hsl(var(--foreground))' }}
                />
                <Area type="monotone" dataKey="amount" stroke="hsl(var(--primary))" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Subscriber Status Chart */}
        <div className="bg-card rounded-2xl border border-border shadow-sm p-6 flex flex-col">
          <h3 className="text-lg font-bold mb-6">Subscribers Status</h3>
          <div className="flex-1 min-h-[300px] flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={charts?.subscribersByStatus || []}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="count"
                  nameKey="status"
                >
                  {(charts?.subscribersByStatus || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '8px' }} />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
