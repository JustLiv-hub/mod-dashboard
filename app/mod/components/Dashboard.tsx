"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Zap,
  Hourglass,
  Ban,
  Wrench,
  RefreshCcw,
  UserPlus,
  Send,
  Repeat,
  Settings as Cog,
  ShieldAlert,
} from "lucide-react";
import { prisma } from "@/lib/prisma";


/* ---------- Types ---------- */
export type Member = {
  username: string;
  tier: number;
  start: string; // ISO or YYYY-MM-DD
  end: string;   // ISO or YYYY-MM-DD
  isModerator?: boolean;
};

export type Stats = {
  active: number;
  expiring: number;
  lapsed: number;
  expiringSoon: Member[];
  moderators: Member[];
};

export const runtime = "nodejs";

export type RoleMapping = { plan: string; tier: number; discordRole: string };

type DashboardProps = {
  initialMembers?: Member[];
  initialStats?: Stats;
  initialRoleMappings?: RoleMapping[];
};

/* ---------- Constants ---------- */
const DAY = 24 * 60 * 60 * 1000;

/* ---------- Helpers ---------- */
function parseDate(v: string) {
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d;
}

function computeStats(members: Member[], expiringDays = 14, graceDays = 3): Stats {
  const now = new Date();
  const soonCut = new Date(now.getTime() + expiringDays * DAY);
  const graceCut = new Date(now.getTime() - graceDays * DAY);

  let active = 0, expiring = 0, lapsed = 0;
  const soon: Member[] = [];
  const moderators: Member[] = [];

  for (const m of members) {
    if (m.isModerator) moderators.push(m);
    const end = parseDate(m.end);
    if (!end) continue;

    if (end < graceCut) lapsed++;
    else if (end >= now && end <= soonCut) { active++; expiring++; soon.push(m); }
    else active++;
  }

  soon.sort((a, b) => parseDate(a.end)!.getTime() - parseDate(b.end)!.getTime());
  return { active, expiring, lapsed, expiringSoon: soon.slice(0, 10), moderators };
}

function fmtDate(v: string) {
  const d = parseDate(v);
  return d
    ? d.toLocaleDateString(undefined, { month: "short", day: "2-digit", year: "numeric" })
    : "—";
}

/* ---------- Demo data (fallbacks) ---------- */
const DEMO_MEMBERS: Member[] = [
  { username: "Shawn",      tier: 1, start: "2025-01-01", end: "2025-08-31", isModerator: true },
  { username: "HorrorGirl", tier: 1, start: "2025-01-01", end: "2025-09-23", isModerator: true },
  { username: "Syd",        tier: 1, start: "2025-01-01", end: "2025-12-31", isModerator: true },
  { username: "Alice",      tier: 2, start: "2025-06-01", end: "2025-09-02" },
  { username: "Bob",        tier: 3, start: "2025-07-10", end: "2025-09-10" },
  { username: "Charlie",    tier: 2, start: "2025-08-01", end: "2025-08-28" },
];

const DEMO_ROLE_MISMATCHES = ["Bob", "Sherman"];
const DEMO_SETTINGS: RoleMapping[] = [
  { plan: "Tiktok - 1 month",  tier: 1, discordRole: "NEWB" },
  { plan: "Tiktok - 2 month",  tier: 2, discordRole: "Krashista" },
  { plan: "Tiktok - 3 month",  tier: 3, discordRole: "Krashout Lite" },
  { plan: "Tiktok - 6 month",  tier: 4, discordRole: "Krazy Krashout" },
  { plan: "Tiktok - 12 month", tier: 5, discordRole: "OG Krashout" },
];

const STORAGE_KEY = "moddash.members.v1";

/* ---------- Component ---------- */
export default function Dashboard({
  initialMembers,
  initialStats,
  initialRoleMappings,
}: DashboardProps) {
  // 1) Members: from server props -> localStorage -> demo fallback
  const [members, setMembers] = useState<Member[]>(
    () => initialMembers ?? (() => {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) return JSON.parse(raw) as Member[];
      } catch {}
      return DEMO_MEMBERS;
    })()
  );

  // 2) Role mappings & stats: from server props -> compute fallback
  const [roleMappings] = useState<RoleMapping[]>(initialRoleMappings ?? DEMO_SETTINGS);
  const computed = useMemo(() => computeStats(members), [members]);
  const stats: Stats = initialStats ?? computed;

  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(members));
    } catch {}
  }, [members]);

  async function handleFiles(files: FileList | null) {
    const f = files?.[0];
    if (!f) return;
    try {
      // xlsx or csv
      let parsed: Member[] = [];
      if (/\.(xlsx|xlsb|xlsm|xls)$/i.test(f.name) || (f.type && f.type.includes("sheet"))) {
        const XLSX = await import("xlsx");
        const wb = XLSX.read(await f.arrayBuffer(), { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json<Record<string, any>>(ws, { defval: "" });
        parsed = rows.map(r => ({
          username: String(r.username ?? "").trim(),
          tier: Number(r.tier ?? 1),
          start: String(r.start ?? "").trim(),
          end: String(r.end ?? "").trim(),
          isModerator: /^true$/i.test(String(r.isModerator ?? "")),
        }));
      } else {
        const text = await f.text();
        const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
        const header = lines.shift()?.split(",").map(s => s.trim().toLowerCase()) ?? [];
        const ix = {
          username: header.indexOf("username"),
          tier: header.indexOf("tier"),
          start: header.indexOf("start"),
          end: header.indexOf("end"),
          mod: header.indexOf("ismoderator"),
        };
        parsed = lines.map(line => {
          const cols = line.split(",").map(s => s.trim());
          return {
            username: cols[ix.username] ?? "",
            tier: Number(cols[ix.tier] ?? 1),
            start: cols[ix.start] ?? "",
            end: cols[ix.end] ?? "",
            isModerator: /^true$/i.test(cols[ix.mod] ?? ""),
          };
        }).filter(r => r.username && r.end);
      }
      if (!parsed.length) return alert("No rows found. Headers: username,tier,start,end[,isModerator]");
      setMembers(parsed);
    } catch (e) {
      console.error(e);
      alert("Import failed. Make sure your file has the correct headers.");
    }
  }

  function onDragOver(e: React.DragEvent) { e.preventDefault(); setDragging(true); }
  function onDragLeave() { setDragging(false); }
  function onDrop(e: React.DragEvent) { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files); }

  /* ----- Button handlers (stubs) ----- */
  const assignMod = () => alert("Assign Mod clicked");
  const sendExpiringSoon = () => alert("Send Expiring Soon clicked");
  const refreshChannel = () => alert("Refresh Channel clicked");
  const syncRoles = () => alert("Sync Roles clicked");
  const recomputeStats = () => alert("Recompute Stats clicked");
  const openSettings = () => alert("Settings clicked");

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* HARD CAP the red container width here */}
      <div className="mx-auto w-full max-w-[980px]">
        <section className="relative rounded-3xl bg-brand-red text-white p-6 sm:p-8 lg:p-10 ring-1 ring-white/15 shadow-[0_18px_60px_rgba(0,0,0,0.35)]">
          {/* gradient overlay */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-3xl"
            style={{
              background:
                "linear-gradient(180deg, rgba(255,255,255,.16) 0%, rgba(255,255,255,.10) 14%, rgba(255,255,255,.06) 32%, rgba(255,255,255,0) 70%)",
            }}
          />

          <div className="relative z-10 space-y-8 sm:space-y-10">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Mod Dashboard</h1>

            {/* Stat cards (with icons) */}
            <div className="grid grid-cols-1 min-[520px]:grid-cols-2 min-[900px]:grid-cols-3 gap-6 sm:gap-8">
              <StatCard label="Active" value={stats.active} Icon={Zap} />
              <StatCard label="Expiring" value={stats.expiring} Icon={Hourglass} />
              <StatCard label="Lapsed" value={stats.lapsed} Icon={Ban} />
            </div>

            {/* Import card */}
            <div
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              className={`rounded-2xl border p-5 sm:p-6 transition
                ${dragging ? "bg-white/20 border-white/40" : "bg-white/12 border-white/20 hover:bg-white/16"}`}
            >
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="text-2xl sm:text-3xl font-extrabold leading-tight">Import</div>
                  <div className="text-sm sm:text-base opacity-90">csv or xlsx</div>
                </div>
                <label
                  htmlFor="member-file"
                  className={`shrink-0 inline-flex items-center gap-2 rounded-2xl border px-4 py-2 text-sm cursor-pointer
                    ${dragging ? "bg-white/30 border-white/40" : "bg-white/20 border-white/25 hover:bg-white/30"}`}
                >
                  <RefreshCcw className="w-4 h-4" />
                  <span>Upload</span>
                </label>
                <input
                  id="member-file"
                  type="file"
                  accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                  onChange={(e) => handleFiles(e.target.files)}
                  className="hidden"
                />
              </div>
              <p className="mt-3 text-xs opacity-80">Tip: drag & drop a file anywhere on this card.</p>
            </div>

            {/* Existing tables */}
            <div className="grid grid-cols-1 min-[700px]:grid-cols-2 gap-6 sm:gap-8">
              <Card title="Moderators Exempt">
                <Table
                  headers={["Username", "Sub Status", "Mod Since"]}
                  rows={stats.moderators.map(m => [m.username, "Active", fmtDate(m.start)])}
                />
              </Card>
              <Card title="Expiring Soon">
                <Table
                  headers={["Username", "Tier", "Renewal Date"]}
                  rows={stats.expiringSoon.map(m => [m.username, `Tier ${m.tier}`, fmtDate(m.end)])}
                />
              </Card>
            </div>

            {/* Role Mismatches + Settings */}
            <div className="grid grid-cols-1 min-[700px]:grid-cols-2 gap-6 sm:gap-8">
              <Card title="Role Mismatches">
                <div className="rounded-xl bg-white/10 p-4 border border-white/10">
                  <div className="text-sm font-semibold opacity-90 border-b border-white/20 pb-2 mb-3">Discord Role</div>
                  <ul className="space-y-3">
                    {DEMO_ROLE_MISMATCHES.length === 0 ? (
                      <li className="text-sm opacity-80">No mismatches 🎉</li>
                    ) : DEMO_ROLE_MISMATCHES.map((name) => (
                      <li key={name} className="flex items-center justify-between">
                        <span className="text-base">{name}</span>
                        <Wrench className="w-5 h-5 opacity-90" />
                      </li>
                    ))}
                  </ul>
                </div>
              </Card>

              <Card title="Settings">
                <Table
                  headers={["Mapping", "Tier", "Discord Role"]}
                  rows={(roleMappings ?? DEMO_SETTINGS).map(r => [r.plan, `Tier ${r.tier}`, r.discordRole])}
                />
              </Card>
            </div>

            {/* Six red rounded buttons */}
            <div className="grid grid-cols-2 min-[520px]:grid-cols-3 gap-4 sm:gap-6">
              <DashButton label="Assign Mod" Icon={UserPlus} onClick={assignMod} />
              <DashButton label="Send Expiring Soon" Icon={Send} onClick={sendExpiringSoon} />
              <DashButton label="Refresh Channel" Icon={RefreshCcw} onClick={refreshChannel} />
              <DashButton label="Sync Roles" Icon={Repeat} onClick={syncRoles} />
              <DashButton label="Recompute Stats" Icon={ShieldAlert} onClick={recomputeStats} />
              <DashButton label="Settings" Icon={Cog} onClick={openSettings} />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

/* ---------- Presentational bits ---------- */
function StatCard({
  label,
  value,
  Icon,
}: {
  label: string;
  value: number;
  Icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
}) {
  return (
    <section className="flex items-center justify-between gap-4 min-w-0 rounded-2xl bg-white/12 border border-white/20 p-5 sm:p-6 shadow">
      <div>
        <h3 className="text-base sm:text-lg font-extrabold">{label}</h3>
        <div className="mt-2 text-3xl sm:text-4xl font-extrabold tabular-nums">{value.toLocaleString()}</div>
      </div>
      <Icon className="w-8 h-8 text-white/85" />
    </section>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="min-w-0 rounded-2xl bg-white/12 border border-white/20 p-5 sm:p-6 shadow">
      <h3 className="text-xl sm:text-2xl font-extrabold mb-3">{title}</h3>
      {children}
    </section>
  );
}

function Table({ headers, rows }: { headers: string[]; rows: (string | number)[][] }) {
  return (
    <div className="overflow-hidden rounded-xl">
      <table className="w-full table-fixed text-left">
        <thead className="text-white/95">
          <tr>
            {headers.map((h) => (
              <th key={h} className="px-5 py-3 text-base font-semibold">
                <div className="border-b border-white/40 pb-1 truncate">{h}</div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="text-white/95">
          {rows.length === 0 ? (
            <tr>
              <td className="px-5 py-4 text-sm opacity-80" colSpan={headers.length}>
                No data
              </td>
            </tr>
          ) : (
            rows.map((r, i) => (
              <tr key={i} className="odd:bg-white/0 even:bg-white/10">
                {r.map((c, j) => (
                  <td key={j} className="px-5 py-3 text-base truncate">{String(c)}</td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

function DashButton({
  label,
  Icon,
  onClick,
}: {
  label: string;
  Icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="
        group flex flex-col items-center justify-center text-center
        rounded-2xl h-24 sm:h-28
        bg-white/10 hover:bg-white/15
        border border-white/20 hover:border-white/30
        transition
        px-3
      "
    >
      <Icon className="w-6 h-6 mb-2 opacity-90 group-hover:opacity-100" />
      <span className="text-sm font-semibold leading-tight">
        {label}
      </span>
    </button>
  );
}
