import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
} from "recharts";
import { TrendingUp, TrendingDown, Award, Target, FlaskConical, Clock } from "lucide-react";

const monthlyThroughput = [
  { month: "Aug", experiments: 18, samples: 82, protocols: 5 },
  { month: "Sep", experiments: 22, samples: 97, protocols: 7 },
  { month: "Oct", experiments: 28, samples: 124, protocols: 9 },
  { month: "Nov", experiments: 25, samples: 108, protocols: 6 },
  { month: "Dec", experiments: 30, samples: 133, protocols: 11 },
  { month: "Jan", experiments: 35, samples: 151, protocols: 8 },
  { month: "Feb", experiments: 24, samples: 138, protocols: 4 },
];

const successByCategory = [
  { category: "In Vitro", rate: 91, experiments: 24 },
  { category: "Mol. Bio.", rate: 88, experiments: 18 },
  { category: "Biochem.", rate: 85, experiments: 16 },
  { category: "Analyt.", rate: 94, experiments: 12 },
  { category: "PK", rate: 79, experiments: 9 },
];

const researcherPerformance = [
  { name: "Dr. Kim", completed: 19, ongoing: 5, success: 92 },
  { name: "Dr. Osei", completed: 15, ongoing: 3, success: 88 },
  { name: "Dr. Chen", completed: 13, ongoing: 4, success: 85 },
  { name: "Dr. Lee", completed: 11, ongoing: 2, success: 94 },
  { name: "Dr. Mehta", completed: 9, ongoing: 3, success: 81 },
];

const timelineData = [
  { week: "W1", started: 3, completed: 2, failed: 0 },
  { week: "W2", started: 5, completed: 4, failed: 1 },
  { week: "W3", started: 4, completed: 5, failed: 0 },
  { week: "W4", started: 6, completed: 3, failed: 1 },
  { week: "W5", started: 5, completed: 6, failed: 0 },
  { week: "W6", started: 7, completed: 5, failed: 0 },
  { week: "W7", started: 4, completed: 7, failed: 1 },
  { week: "W8", started: 6, completed: 4, failed: 0 },
];

const radarData = [
  { metric: "Throughput", score: 82 },
  { metric: "Success Rate", score: 87 },
  { metric: "Documentation", score: 91 },
  { metric: "Safety", score: 96 },
  { metric: "Timeline", score: 74 },
  { metric: "Resource Use", score: 79 },
];

const phaseDistribution = [
  { name: "Phase I", value: 28, color: "#6366f1" },
  { name: "Phase II", value: 42, color: "#3b82f6" },
  { name: "Phase III", value: 30, color: "#0ea5e9" },
];

const kpis = [
  {
    label: "Avg. Experiment Duration",
    value: "18.4 days",
    trend: -2.1,
    positive: true,
    sub: "vs 21.2 days last month",
    icon: Clock,
    color: "text-blue-600",
    bg: "bg-blue-50",
  },
  {
    label: "Overall Success Rate",
    value: "87.4%",
    trend: +2.1,
    positive: true,
    sub: "Target: 85%",
    icon: Target,
    color: "text-emerald-600",
    bg: "bg-emerald-50",
  },
  {
    label: "Protocol Compliance",
    value: "96.2%",
    trend: +0.8,
    positive: true,
    sub: "SOPs followed",
    icon: Award,
    color: "text-violet-600",
    bg: "bg-violet-50",
  },
  {
    label: "Experiments / Researcher",
    value: "4.8",
    trend: +0.3,
    positive: true,
    sub: "Active experiments",
    icon: FlaskConical,
    color: "text-amber-600",
    bg: "bg-amber-50",
  },
];

export function Analytics() {
  return (
    <div className="space-y-5">
      {/* KPI Row */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-start justify-between mb-3">
              <div className={`w-10 h-10 ${kpi.bg} rounded-xl flex items-center justify-center`}>
                <kpi.icon className={`w-5 h-5 ${kpi.color}`} />
              </div>
              <div
                className={`flex items-center gap-1 text-xs font-medium ${
                  kpi.positive ? "text-emerald-600" : "text-red-500"
                }`}
              >
                {kpi.positive ? (
                  <TrendingUp className="w-3.5 h-3.5" />
                ) : (
                  <TrendingDown className="w-3.5 h-3.5" />
                )}
                {kpi.trend > 0 ? "+" : ""}{kpi.trend}%
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-800">{kpi.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{kpi.label}</p>
            <p className="text-xs text-gray-400 mt-1">{kpi.sub}</p>
          </div>
        ))}
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Monthly Throughput */}
        <div className="xl:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-gray-800">Monthly Throughput</h3>
              <p className="text-xs text-gray-400 mt-0.5">Experiments, samples & protocols over time</p>
            </div>
            <select className="text-xs border border-gray-200 rounded-lg px-3 py-1.5 bg-gray-50 text-gray-600 focus:outline-none">
              <option>Last 7 months</option>
            </select>
          </div>
          <ResponsiveContainer width="100%" height={230}>
            <BarChart data={monthlyThroughput} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e5e7eb", fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 12, paddingTop: 12 }} />
              <Bar dataKey="experiments" name="Experiments" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="samples" name="Samples" fill="#818cf8" radius={[4, 4, 0, 0]} />
              <Bar dataKey="protocols" name="Protocols" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Phase Distribution */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="mb-5">
            <h3 className="text-gray-800">Phase Distribution</h3>
            <p className="text-xs text-gray-400 mt-0.5">Experiments by trial phase</p>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie
                data={phaseDistribution}
                cx="50%"
                cy="50%"
                outerRadius={80}
                paddingAngle={4}
                dataKey="value"
                label={({ name, value }) => `${name}: ${value}`}
                labelLine={false}
              >
                {phaseDistribution.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: 10, fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2 mt-2">
            {phaseDistribution.map((p) => (
              <div key={p.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color }} />
                  <span className="text-xs text-gray-600">{p.name}</span>
                </div>
                <span className="text-xs font-semibold text-gray-700">{p.value} exp.</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Second Row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Timeline */}
        <div className="xl:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="mb-5">
            <h3 className="text-gray-800">8-Week Experiment Timeline</h3>
            <p className="text-xs text-gray-400 mt-0.5">Started vs. completed experiments by week</p>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={timelineData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="startedGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="completedGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="week" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 12, paddingTop: 12 }} />
              <Area type="monotone" dataKey="started" name="Started" stroke="#3b82f6" strokeWidth={2} fill="url(#startedGrad)" />
              <Area type="monotone" dataKey="completed" name="Completed" stroke="#10b981" strokeWidth={2} fill="url(#completedGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Lab Performance Radar */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="mb-4">
            <h3 className="text-gray-800">Lab Performance</h3>
            <p className="text-xs text-gray-400 mt-0.5">Key performance dimensions</p>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="#e5e7eb" />
              <PolarAngleAxis dataKey="metric" tick={{ fontSize: 10, fill: "#9ca3af" }} />
              <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
              <Radar
                name="Performance"
                dataKey="score"
                stroke="#3b82f6"
                fill="#3b82f6"
                fillOpacity={0.15}
                strokeWidth={2}
              />
              <Tooltip contentStyle={{ borderRadius: 10, fontSize: 12 }} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* Success Rate by Category */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="mb-5">
            <h3 className="text-gray-800">Success Rate by Category</h3>
            <p className="text-xs text-gray-400 mt-0.5">Experiment success rate per research area</p>
          </div>
          <div className="space-y-4">
            {successByCategory.map((item) => (
              <div key={item.category}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm text-gray-700">{item.category}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">{item.experiments} exp.</span>
                    <span className="text-sm font-semibold text-gray-800">{item.rate}%</span>
                  </div>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${item.rate}%`,
                      background:
                        item.rate >= 90
                          ? "#10b981"
                          : item.rate >= 80
                          ? "#3b82f6"
                          : "#f59e0b",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Researcher Performance */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="mb-5">
            <h3 className="text-gray-800">Researcher Performance</h3>
            <p className="text-xs text-gray-400 mt-0.5">Experiments completed & success rate</p>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart
              data={researcherPerformance}
              layout="vertical"
              margin={{ top: 0, right: 40, left: 20, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fontSize: 11, fill: "#6b7280" }}
                axisLine={false}
                tickLine={false}
                width={65}
              />
              <Tooltip contentStyle={{ borderRadius: 10, fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 12, paddingTop: 12 }} />
              <Bar dataKey="completed" name="Completed" fill="#3b82f6" radius={[0, 4, 4, 0]} />
              <Bar dataKey="ongoing" name="Ongoing" fill="#818cf8" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
