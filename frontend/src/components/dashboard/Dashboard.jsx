import React from "react";
import { useApp } from "../../contexts/AppContext";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../../components/ui/dropdown-menu";
import { Toaster } from "../../components/ui/toaster";
import { 
  Activity, AlertTriangle, Building2, CheckCircle2, CircleDot, CircleOff, Clock, Download,
  Filter, Grid3X3, Hospital, Library, Menu, Printer, Search, Server, Settings, Thermometer, Truck
} from "lucide-react";

// Color constants per spec
const COLORS = {
  primary: "#1976D2",
  secondary: "#388E3C",
  success: "#4CAF50",
  warning: "#FF9800",
  error: "#F44336",
  bg: "#FAFAFA",
  surface: "#FFFFFF",
  text: "#212121",
  textSecondary: "#757575",
};

function formatBandwidth(v) {
  if (v >= 1000) return (v / 1000).toFixed(2) + " Gbps";
  if (v >= 1) return v.toFixed(1) + " Mbps";
  return (v * 1000).toFixed(0) + " Kbps";
}
function formatPercent(v) { return `${Math.max(0, Math.min(100, v)).toFixed(0)}%`; }
function formatRssi(v) { return `${v} dBm`; }
function formatDate(ts) { return new Date(ts).toLocaleString(); }

function healthScore(d) {
  // Rough health metric 0-100
  let score = 100;
  if (d.rssi < -80) score -= 25;
  if (d.errorRate > 2) score -= 25;
  if (d.bandwidth < 100) score -= 20;
  if (d.status === "warning") score -= 10;
  if (d.status === "critical" || d.status === "offline") score -= 30;
  return Math.max(0, Math.min(100, score));
}

function useNow() {
  const [now, setNow] = React.useState(new Date());
  React.useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return now;
}

function Header() {
  const now = useNow();
  const { connectionStatus } = useApp();
  const statusColor = {
    connected: COLORS.success,
    connecting: COLORS.warning,
    disconnected: COLORS.error,
  }[connectionStatus];

  return (
    <header className="sticky top-0 z-30 w-full border-b bg-white/80 backdrop-blur">
      <div className="mx-auto max-w-[1400px] px-6 py-3 flex items-center gap-4">
        <button className="md:hidden" aria-label="Open navigation">
          <Menu color={COLORS.text} />
        </button>
        <div className="flex items-center gap-2">
          <Server color={COLORS.primary} />
          <h1 className="text-[24px] md:text-[28px] font-semibold" style={{ color: COLORS.text }}>
            Enterprise WLAN Monitor
          </h1>
        </div>
        <div className="ml-auto flex items-center gap-6">
          <div className="flex items-center gap-2" aria-live="polite" aria-label="Connection status">
            <span className="inline-block h-3 w-3 rounded-full" style={{ backgroundColor: statusColor }} />
            <span className="text-sm text-gray-600 capitalize">{connectionStatus}</span>
          </div>
          <div className="hidden md:flex items-center gap-2 text-gray-700">
            <Clock size={18} />
            <span className="text-sm" aria-label="Current time">{now.toLocaleTimeString()}</span>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2" aria-label="Settings">
                <Settings size={16} /> Settings
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => window.print()} className="gap-2">
                <Printer size={16} /> Print
              </DropdownMenuItem>
              <DropdownMenuItem className="gap-2" onClick={() => {
                const btn = document.createElement('button');
                btn.disabled = true; // a simple visual cue could be added later
              }}>
                <Filter size={16} /> Placeholder
              </DropdownMenuItem>
              <DropdownMenuItem className="gap-2" onClick={() => {
                try { window.__SYNC__?.(); } catch(e) {}
              }}>
                <Download size={16} /> Sync mocks to backend
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <a href="https://emergent.sh" target="_blank" rel="noreferrer" className="flex gap-2 items-center">
                  <Activity size={16} /> About
                </a>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}

function Sidebar({ onExportCSV, onSearchFocus }) {
  const { sectors, activeSector, setActiveSector, search, setSearch } = useApp();

  const iconMap = {
    all: Grid3X3,
    education: Library,
    healthcare: Hospital,
    logistics: Truck,
    government: Building2,
  };

  return (
    <aside className="hidden md:block w-[260px] shrink-0 border-r bg-white" aria-label="Sidebar navigation">
      <div className="p-6 space-y-6">
        <div>
          <div className="text-xs uppercase tracking-wider text-gray-500 mb-2">Sectors</div>
          <nav className="space-y-2">
            {sectors.map((s) => {
              const Icon = iconMap[s.key];
              const active = activeSector === s.key;
              return (
                <button
                  key={s.key}
                  className={`w-full flex items-center justify-between rounded-lg px-3 py-2 text-left transition-colors ${
                    active ? "bg-blue-50 text-blue-700" : "hover:bg-gray-50"
                  }`}
                  onClick={() => setActiveSector(s.key)}
                >
                  <span className="flex items-center gap-2">
                    <Icon size={18} color={active ? COLORS.primary : COLORS.text} />
                    {s.label}
                  </span>
                  <span className="text-xs text-gray-500">{s.count}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="space-y-3" aria-label="Search and actions">
          <div className="flex items-center gap-2">
            <div className="relative w-full">
              <Search className="absolute left-2 top-2.5 text-gray-400" size={16} />
              <input
                aria-label="Search devices"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onFocus={onSearchFocus}
                placeholder="Search devices..."
                className="w-full rounded-md border px-8 py-2 text-sm focus:outline-none focus:ring-2"
                style={{
                  borderColor: "#E0E0E0",
                  boxShadow: "0 0 0 0 rgba(0,0,0,0)",
                }}
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button className="gap-2" onClick={onExportCSV} style={{ backgroundColor: COLORS.primary, color: "#fff" }}>
              <Download size={16} /> Export CSV
            </Button>
          </div>
        </div>
      </div>
    </aside>
  );
}

function SummaryCards() {
  const { filteredDevices, alerts } = useApp();
  const online = filteredDevices.filter((d) => d.status !== "offline").length;
  const offline = filteredDevices.length - online;
  const critical = alerts.filter((a) => a.severity === "critical").length;
  const warning = alerts.filter((a) => a.severity === "warning").length;
  const info = alerts.filter((a) => a.severity === "info").length;
  const avgHealth = Math.round(
    filteredDevices.reduce((acc, d) => acc + healthScore(d), 0) / Math.max(filteredDevices.length, 1)
  );
  const totalRate = filteredDevices.reduce((acc, d) => acc + d.bandwidth, 0);

  const Item = ({ title, value, sub, color, icon: Icon }) => (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm" style={{ color: COLORS.textSecondary }}>{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex items-end justify-between">
        <div>
          <div className="text-2xl font-semibold" style={{ color: COLORS.text }}>{value}</div>
          <div className="text-xs" style={{ color: COLORS.textSecondary }}>{sub}</div>
        </div>
        <div className="p-3 rounded-full" style={{ backgroundColor: `${color}20` }}>
          <Icon color={color} />
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      <Item title="Devices Online" value={online} sub={`${offline} offline`} color={COLORS.success} icon={CheckCircle2} />
      <Item title="Active Alerts" value={critical + warning + info} sub={`${critical} Critical / ${warning} Warn`} color={COLORS.error} icon={AlertTriangle} />
      <Item title="Avg. Network Health" value={formatPercent(avgHealth)} sub="Health score" color={COLORS.secondary} icon={Activity} />
      <Item title="Data Transfer" value={formatBandwidth(totalRate)} sub="Current total" color={COLORS.primary} icon={Download} />
    </div>
  );
}

function MiniLine({ points, color = COLORS.primary }) {
  // points: array of numbers 0..100
  const path = points
    .map((v, i) => `${(i / (points.length - 1)) * 100},${100 - v}`)
    .join(" ");
  return (
    <svg width="100%" height="40" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
      <polyline fill="none" stroke={color} strokeWidth="2" points={path} />
    </svg>
  );
}

function Charts() {
  // Simple placeholder charts using random data
  const [sig, setSig] = React.useState(Array.from({ length: 20 }, () => 50 + Math.random() * 40));
  const [bw, setBw] = React.useState(Array.from({ length: 20 }, () => 30 + Math.random() * 60));
  const [al, setAl] = React.useState(Array.from({ length: 20 }, () => Math.random() * 100));
  React.useEffect(() => {
    const t = setInterval(() => {
      setSig((p) => [...p.slice(1), Math.max(0, Math.min(100, p[p.length - 1] + (Math.random() - 0.5) * 12))]);
      setBw((p) => [...p.slice(1), Math.max(0, Math.min(100, p[p.length - 1] + (Math.random() - 0.5) * 10))]);
      setAl((p) => [...p.slice(1), Math.max(0, Math.min(100, p[p.length - 1] + (Math.random() - 0.5) * 25))]);
    }, 3500);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-4" aria-label="Realtime charts">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm" style={{ color: COLORS.textSecondary }}>Signal Strength Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <MiniLine points={sig} color={COLORS.primary} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm" style={{ color: COLORS.textSecondary }}>Bandwidth Utilization</CardTitle>
        </CardHeader>
        <CardContent>
          <MiniLine points={bw} color={COLORS.secondary} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm" style={{ color: COLORS.textSecondary }}>Alerts Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <MiniLine points={al} color={COLORS.error} />
        </CardContent>
      </Card>
    </div>
  );
}

function StatusPill({ status }) {
  const map = {
    online: { label: "Online", color: COLORS.success },
    warning: { label: "Warning", color: COLORS.warning },
    critical: { label: "Critical", color: COLORS.error },
    offline: { label: "Offline", color: COLORS.textSecondary },
  };
  const s = map[status] || map.online;
  return (
    <span className="px-2 py-0.5 rounded-full text-xs" style={{ backgroundColor: `${s.color}20`, color: s.color }}>
      {s.label}
    </span>
  );
}

function DeviceTable() {
  const { filteredDevices, setSelectedDeviceId, selectedDeviceId } = useApp();
  const [sort, setSort] = React.useState({ key: "id", dir: "asc" });
  const [page, setPage] = React.useState(1);
  const pageSize = 10;

  const sorted = React.useMemo(() => {
    const arr = [...filteredDevices];
    arr.sort((a, b) => {
      const k = sort.key;
      const va = a[k];
      const vb = b[k];
      if (typeof va === "number" && typeof vb === "number") return sort.dir === "asc" ? va - vb : vb - va;
      return sort.dir === "asc" ? String(va).localeCompare(String(vb)) : String(vb).localeCompare(String(va));
    });
    return arr;
  }, [filteredDevices, sort]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const pageItems = sorted.slice((page - 1) * pageSize, page * pageSize);

  function th(label, key) {
    return (
      <TableHead
        onClick={() => setSort((s) => ({ key, dir: s.key === key && s.dir === "asc" ? "desc" : "asc" }))}
        className="cursor-pointer select-none"
        aria-sort={sort.key === key ? (sort.dir === "asc" ? "ascending" : "descending") : "none"}
      >
        <div className="flex items-center gap-1">{label} {sort.key === key ? (sort.dir === "asc" ? "↑" : "↓") : ""}</div>
      </TableHead>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm" style={{ color: COLORS.textSecondary }}>Devices</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="w-full overflow-x-auto" role="region" aria-label="Device status table">
          <Table>
            <TableHeader>
              <TableRow>
                {th("Device ID", "id")}
                {th("Sector", "sector")}
                {th("Location", "location")}
                {th("Signal (RSSI)", "rssi")}
                {th("Bandwidth", "bandwidth")}
                {th("Clients", "clients")}
                {th("Error %", "errorRate")}
                {th("Temp °C", "temperature")}
                {th("Status", "status")}
              </TableRow>
            </TableHeader>
            <TableBody>
              {pageItems.map((d) => (
                <TableRow
                  key={d.id}
                  className={selectedDeviceId === d.id ? "bg-blue-50" : ""}
                  onClick={() => setSelectedDeviceId(d.id)}
                  onDoubleClick={() => alert(`Device ${d.id} details (mock modal)`)}
                >
                  <TableCell className="font-medium">{d.id}</TableCell>
                  <TableCell className="capitalize">{d.sector}</TableCell>
                  <TableCell>{d.location}</TableCell>
                  <TableCell title={formatRssi(d.rssi)}>{d.rssi}</TableCell>
                  <TableCell title={formatBandwidth(d.bandwidth)}>{d.bandwidth.toFixed(1)}</TableCell>
                  <TableCell>{d.clients}</TableCell>
                  <TableCell>{d.errorRate.toFixed(1)}</TableCell>
                  <TableCell>{d.temperature.toFixed(1)}</TableCell>
                  <TableCell><StatusPill status={d.status} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className="flex items-center justify-between mt-3">
          <div className="text-sm text-gray-500">Page {page} of {totalPages}</div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>Prev</Button>
            <Button variant="outline" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Next</Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function AlertsPanel() {
  const { alerts, setSelectedDeviceId } = useApp();
  const ref = React.useRef(null);
  React.useEffect(() => {
    // Auto-scroll to bottom on new alert
    if (ref.current) ref.current.scrollTop = ref.current.scrollHeight;
  }, [alerts]);

  function badgeColor(sev) {
    return sev === "critical" ? COLORS.error : sev === "warning" ? COLORS.warning : COLORS.primary;
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm" style={{ color: COLORS.textSecondary }}>Alerts</CardTitle>
      </CardHeader>
      <CardContent>
        <div ref={ref} className="max-h-[260px] overflow-y-auto pr-2" role="log" aria-live="polite">
          {alerts.slice(-50).map((a) => (
            <div key={a.id} className="flex items-start justify-between gap-2 py-2 border-b last:border-none">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full text-xs" style={{ backgroundColor: `${badgeColor(a.severity)}20`, color: badgeColor(a.severity) }}>
                    {a.severity.toUpperCase()}
                  </span>
                  <button className="text-sm text-blue-700 underline" onClick={() => setSelectedDeviceId(a.deviceId)}>
                    {a.deviceId}
                  </button>
                </div>
                <div className="text-sm" style={{ color: COLORS.text }}>{a.message}</div>
                <div className="text-xs" style={{ color: COLORS.textSecondary }}>{formatDate(a.timestamp)}</div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const { setSearch, syncMocksToBackend } = useApp();
  React.useEffect(() => { window.__SYNC__ = syncMocksToBackend; return () => { delete window.__SYNC__; }; }, [syncMocksToBackend]);

  // Keyboard shortcuts
  React.useEffect(() => {
    function onKey(e) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "r") {
        e.preventDefault();
        window.location.reload();
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "f") {
        e.preventDefault();
        const el = document.querySelector("input[aria-label='Search devices']");
        if (el) el.focus();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function exportCSV() {
    const rows = [[
      "Device ID","Sector","Location","RSSI","Bandwidth","Clients","ErrorRate","Temperature","Status","LastSeen"
    ]];
    const table = document.querySelector("table");
    if (table) {
      // fall back to data from DOM to keep simple in mock phase
      const trs = table.querySelectorAll("tbody tr");
      trs.forEach((tr) => {
        const tds = Array.from(tr.querySelectorAll("td")).map((td) => td.textContent.trim());
        if (tds.length) rows.push(tds);
      });
    }
    const csv = rows.map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `devices_${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: COLORS.bg, color: COLORS.text, fontFamily: "Roboto, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif" }}>
      <Header />
      <main className="mx-auto max-w-[1400px] px-6 py-6 grid grid-cols-1 md:grid-cols-[260px_1fr] gap-6">
        <Sidebar onExportCSV={exportCSV} onSearchFocus={() => {}} />
        <section className="space-y-6">
          <SummaryCards />
          <Charts />
          <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-4">
            <DeviceTable />
            <AlertsPanel />
          </div>
        </section>
      </main>
      <footer className="border-t bg-white">
        <div className="mx-auto max-w-[1400px] px-6 py-4 text-sm flex items-center justify-between">
          <div className="text-gray-600">© 2025 Your Company</div>
          <div className="text-gray-500 flex items-center gap-2">
            <CircleDot size={14} color={COLORS.secondary} /> System nominal
          </div>
        </div>
      </footer>
      <Toaster />
      {/* Print styles */}
      <style>{`@media print { header, aside, footer, button { display: none !important; } main { padding: 0 !important; } table { font-size: 12px; } }`}</style>
    </div>
  );
}