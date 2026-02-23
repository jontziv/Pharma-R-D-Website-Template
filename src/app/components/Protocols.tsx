import { useState } from "react";
import {
  ClipboardList,
  Search,
  Plus,
  Download,
  Eye,
  Edit,
  Star,
  StarOff,
  CheckCircle2,
  AlertCircle,
  Clock,
  Filter,
  ChevronDown,
  FileText,
  Calendar,
  User,
  ArrowUpRight,
  Shield,
} from "lucide-react";

const protocols = [
  {
    id: "SOP-PCR-007",
    title: "Quantitative PCR Protocol for Gene Expression",
    category: "Molecular Biology",
    version: "v3.2",
    status: "Approved",
    author: "Dr. Sarah Chen",
    lastUpdated: "Jan 15, 2026",
    reviewDue: "Jul 15, 2026",
    usageCount: 47,
    starred: true,
    description:
      "Standard operating procedure for qPCR-based gene expression analysis using SYBR Green chemistry. Includes primer design guidelines, sample preparation, and data analysis workflows.",
    tags: ["PCR", "gene-expression", "SYBR-Green"],
  },
  {
    id: "SOP-CAT-002",
    title: "Cell Viability Assay – MTT Method",
    category: "In Vitro",
    version: "v2.1",
    status: "Approved",
    author: "Dr. Rachel Kim",
    lastUpdated: "Feb 1, 2026",
    reviewDue: "Aug 1, 2026",
    usageCount: 63,
    starred: true,
    description:
      "Detailed procedure for assessing cell viability and proliferation using the MTT colorimetric assay. Covers cell seeding, treatment, formazan extraction, and absorbance measurement.",
    tags: ["MTT", "cell-viability", "in-vitro"],
  },
  {
    id: "SOP-HPLC-015",
    title: "Reverse-Phase HPLC for Drug Purity Analysis",
    category: "Analytical Chemistry",
    version: "v4.0",
    status: "Approved",
    author: "Dr. Marcus Lee",
    lastUpdated: "Jan 28, 2026",
    reviewDue: "Jul 28, 2026",
    usageCount: 29,
    starred: false,
    description:
      "Protocol for determining drug purity and impurity profiles using RP-HPLC. Includes method validation parameters, system suitability criteria, and reporting templates.",
    tags: ["HPLC", "purity", "analytical"],
  },
  {
    id: "SOP-PKS-009",
    title: "Pharmacokinetic Sample Collection & Analysis",
    category: "Pharmacokinetics",
    version: "v2.0",
    status: "Under Review",
    author: "Dr. James Osei",
    lastUpdated: "Feb 10, 2026",
    reviewDue: "Feb 27, 2026",
    usageCount: 18,
    starred: false,
    description:
      "Comprehensive SOP for PK study design, biological sample collection, processing, and bioanalytical method application. Includes WinNonlin analysis guidelines.",
    tags: ["PK", "bioanalysis", "sampling"],
  },
  {
    id: "SOP-BIO-021",
    title: "Western Blot – Protein Detection Protocol",
    category: "Biochemistry",
    version: "v1.5",
    status: "Approved",
    author: "Dr. Rachel Kim",
    lastUpdated: "Dec 20, 2025",
    reviewDue: "Jun 20, 2026",
    usageCount: 52,
    starred: true,
    description:
      "Step-by-step guide for SDS-PAGE separation and western blot transfer, blocking, antibody incubation, and detection using chemiluminescence (ECL).",
    tags: ["western-blot", "protein", "SDS-PAGE"],
  },
  {
    id: "SOP-SAF-003",
    title: "Chemical Safety & Hazardous Waste Disposal",
    category: "Safety",
    version: "v5.1",
    status: "Approved",
    author: "Lab Safety Officer",
    lastUpdated: "Nov 30, 2025",
    reviewDue: "Mar 1, 2026",
    usageCount: 124,
    starred: false,
    description:
      "Mandatory safety protocol covering chemical hazard classification, PPE requirements, spill response, and hazardous waste disposal procedures per regulatory requirements.",
    tags: ["safety", "hazardous-waste", "PPE"],
  },
  {
    id: "SOP-NUC-004",
    title: "RNA Extraction – TRIzol Method",
    category: "Molecular Biology",
    version: "v2.3",
    status: "Expired",
    author: "Dr. James Osei",
    lastUpdated: "Jan 5, 2025",
    reviewDue: "Jan 5, 2026",
    usageCount: 35,
    starred: false,
    description:
      "Standard procedure for total RNA isolation from cell lines and tissue samples using TRIzol reagent. Includes quality assessment by NanoDrop and Bioanalyzer.",
    tags: ["RNA", "extraction", "TRIzol"],
  },
];

const statusConfig: Record<string, { color: string; icon: React.ReactNode }> = {
  Approved: { color: "bg-emerald-100 text-emerald-700", icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
  "Under Review": { color: "bg-amber-100 text-amber-700", icon: <Clock className="w-3.5 h-3.5" /> },
  Expired: { color: "bg-red-100 text-red-700", icon: <AlertCircle className="w-3.5 h-3.5" /> },
};

const categoryColors: Record<string, string> = {
  "Molecular Biology": "bg-blue-100 text-blue-700",
  "In Vitro": "bg-violet-100 text-violet-700",
  "Analytical Chemistry": "bg-amber-100 text-amber-700",
  Pharmacokinetics: "bg-emerald-100 text-emerald-700",
  Biochemistry: "bg-indigo-100 text-indigo-700",
  Safety: "bg-red-100 text-red-700",
};

const categories = ["All", "Molecular Biology", "In Vitro", "Analytical Chemistry", "Pharmacokinetics", "Biochemistry", "Safety"];
const statuses = ["All", "Approved", "Under Review", "Expired"];

export function Protocols() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [status, setStatus] = useState("All");
  const [starred, setStarred] = useState<Record<string, boolean>>(
    Object.fromEntries(protocols.map((p) => [p.id, p.starred]))
  );
  const [showNew, setShowNew] = useState(false);
  const [selectedProtocol, setSelectedProtocol] = useState<typeof protocols[0] | null>(null);

  const filtered = protocols.filter((p) => {
    const matchSearch =
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.id.toLowerCase().includes(search.toLowerCase());
    const matchCat = category === "All" || p.category === category;
    const matchStatus = status === "All" || p.status === status;
    return matchSearch && matchCat && matchStatus;
  });

  return (
    <div className="space-y-5">
      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Protocols", value: protocols.length, icon: ClipboardList, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Approved", value: protocols.filter((p) => p.status === "Approved").length, icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "Needs Attention", value: protocols.filter((p) => p.status !== "Approved").length, icon: AlertCircle, color: "text-amber-600", bg: "bg-amber-50" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <div className={`w-9 h-9 ${s.bg} rounded-xl flex items-center justify-center mb-3`}>
              <s.icon className={`w-5 h-5 ${s.color}`} />
            </div>
            <p className="text-2xl font-bold text-gray-800">{s.value}</p>
            <p className="text-xs text-gray-500">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search protocols by name or ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-400 transition"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="pl-9 pr-8 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none appearance-none cursor-pointer text-gray-700"
              >
                {categories.map((c) => <option key={c}>{c}</option>)}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
            </div>
            <div className="relative">
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="pl-4 pr-8 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none appearance-none cursor-pointer text-gray-700"
              >
                {statuses.map((s) => <option key={s}>{s}</option>)}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
            </div>
            <button
              onClick={() => setShowNew(true)}
              className="flex items-center gap-2 bg-[#2563eb] hover:bg-[#1d4ed8] text-white px-4 py-2 rounded-xl text-sm font-medium transition"
            >
              <Plus className="w-4 h-4" />
              New Protocol
            </button>
          </div>
        </div>
      </div>

      {/* Protocol List */}
      <div className="grid gap-3">
        {filtered.map((p) => {
          const s = statusConfig[p.status];
          return (
            <div
              key={p.id}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow p-5"
            >
              <div className="flex flex-col sm:flex-row gap-4">
                {/* Icon */}
                <div className="w-11 h-11 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0">
                  {p.category === "Safety" ? (
                    <Shield className="w-5 h-5 text-red-500" />
                  ) : (
                    <FileText className="w-5 h-5 text-blue-600" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="text-xs text-blue-600 font-semibold">{p.id}</span>
                    <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{p.version}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${categoryColors[p.category] ?? "bg-gray-100 text-gray-600"}`}>
                      {p.category}
                    </span>
                  </div>
                  <h4 className="text-gray-800 font-medium mb-1">{p.title}</h4>
                  <p className="text-xs text-gray-500 leading-relaxed mb-2 line-clamp-2">{p.description}</p>

                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-1.5 text-xs text-gray-400">
                      <User className="w-3.5 h-3.5" />
                      {p.author}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-gray-400">
                      <Calendar className="w-3.5 h-3.5" />
                      Updated: {p.lastUpdated}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-gray-400">
                      <ArrowUpRight className="w-3.5 h-3.5" />
                      Used {p.usageCount} times
                    </div>
                  </div>
                </div>

                {/* Right */}
                <div className="flex sm:flex-col items-center sm:items-end gap-3 sm:gap-2 shrink-0">
                  <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${s.color}`}>
                    {s.icon}
                    {p.status}
                  </span>

                  {p.status !== "Approved" && (
                    <p className="text-xs text-red-500 font-medium">Review: {p.reviewDue}</p>
                  )}

                  <div className="flex items-center gap-1 mt-1">
                    <button
                      onClick={() =>
                        setStarred((prev) => ({ ...prev, [p.id]: !prev[p.id] }))
                      }
                      className="p-1.5 rounded-lg hover:bg-gray-100 transition"
                    >
                      {starred[p.id] ? (
                        <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                      ) : (
                        <StarOff className="w-4 h-4 text-gray-400" />
                      )}
                    </button>
                    <button
                      onClick={() => setSelectedProtocol(p)}
                      className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition">
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Protocol Detail Modal */}
      {selectedProtocol && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs text-blue-600 font-semibold">{selectedProtocol.id}</span>
                  <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{selectedProtocol.version}</span>
                </div>
                <h2 className="text-gray-800">{selectedProtocol.title}</h2>
              </div>
              <button onClick={() => setSelectedProtocol(null)} className="text-gray-400 hover:text-gray-600 ml-4">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-gray-600 leading-relaxed">{selectedProtocol.description}</p>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-400 mb-1">Author</p>
                  <p className="text-gray-700 font-medium">{selectedProtocol.author}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-400 mb-1">Last Updated</p>
                  <p className="text-gray-700 font-medium">{selectedProtocol.lastUpdated}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-400 mb-1">Review Due</p>
                  <p className="text-gray-700 font-medium">{selectedProtocol.reviewDue}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-400 mb-1">Times Used</p>
                  <p className="text-gray-700 font-medium">{selectedProtocol.usageCount}</p>
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-2">Tags</p>
                <div className="flex gap-2 flex-wrap">
                  {selectedProtocol.tags.map((t) => (
                    <span key={t} className="text-xs bg-blue-50 text-blue-600 px-2.5 py-1 rounded-full">{t}</span>
                  ))}
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-gray-100 flex gap-3 justify-end">
              <button className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition">
                <Download className="w-4 h-4" /> Download PDF
              </button>
              <button className="flex items-center gap-2 px-5 py-2.5 bg-[#2563eb] hover:bg-[#1d4ed8] text-white rounded-xl text-sm font-medium transition">
                <Edit className="w-4 h-4" /> Edit Protocol
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Protocol Modal */}
      {showNew && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-gray-800">New Protocol</h3>
              <p className="text-xs text-gray-500 mt-0.5">Create a new standard operating procedure</p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-sm text-gray-700 block mb-1.5">Protocol Title</label>
                <input type="text" placeholder="Enter protocol name..." className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-400 transition" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-gray-700 block mb-1.5">Category</label>
                  <select className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none appearance-none">
                    {categories.filter((c) => c !== "All").map((c) => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm text-gray-700 block mb-1.5">Version</label>
                  <input type="text" placeholder="e.g. v1.0" className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none transition" />
                </div>
              </div>
              <div>
                <label className="text-sm text-gray-700 block mb-1.5">Description</label>
                <textarea rows={3} placeholder="Brief description..." className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none transition resize-none" />
              </div>
            </div>
            <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
              <button onClick={() => setShowNew(false)} className="px-4 py-2.5 text-sm border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition">Cancel</button>
              <button onClick={() => setShowNew(false)} className="px-5 py-2.5 text-sm bg-[#2563eb] hover:bg-[#1d4ed8] text-white rounded-xl font-medium transition">Create Protocol</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
