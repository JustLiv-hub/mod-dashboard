// /app/mod/page.tsx
import { prisma } from "@/lib/prisma";
import Dashboard from "./components/Dashboard";

// Infer types from actual Prisma calls (robust even if your schema evolves)
type DbMember      = Awaited<ReturnType<typeof prisma.member.findMany>>[number];
type DbRoleMapping = Awaited<ReturnType<typeof prisma.roleMapping.findMany>>[number];

// Server-side stats using real Date objects
function computeStatsServer(members: DbMember[]) {
  const now = new Date();
  const DAY = 86_400_000;
  const soonCut = new Date(now.getTime() + 14 * DAY);
  const graceCut = new Date(now.getTime() - 3 * DAY);

  let active = 0;
  let expiring = 0;
  let lapsed = 0;

  const expiringSoon: DbMember[] = [];
  const moderators: DbMember[] = [];

  for (const m of members) {
    if (m.isModerator) moderators.push(m);

    if (m.end < graceCut) {
      lapsed++;
    } else if (m.end >= now && m.end <= soonCut) {
      active++;
      expiring++;
      expiringSoon.push(m);
    } else {
      active++;
    }
  }

  // Make the comparator explicit to avoid TS7006
  expiringSoon.sort((a: DbMember, b: DbMember) => a.end.getTime() - b.end.getTime());

  return { active, expiring, lapsed, expiringSoon, moderators };
}

// Helper to project Prisma Member -> client Member shape (strings for dates)
function pickClientMember(m: DbMember) {
  return {
    username: m.username,
    tier: m.tier,
    start: m.start.toISOString(),
    end: m.end.toISOString(),
    isModerator: m.isModerator,
  };
}

export default async function ModHome() {
  // Pull from DB (no API routes needed)
  const [members, roleMappings] = await Promise.all([
    prisma.member.findMany({ orderBy: { end: "asc" } }),
    prisma.roleMapping.findMany({ orderBy: { tier: "asc" } }),
  ]);

  const stats = computeStatsServer(members);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
      <Dashboard
        initialMembers={(members.length ? members : []).map(pickClientMember)}
        initialStats={{
          active: stats.active,
          expiring: stats.expiring,
          lapsed: stats.lapsed,
          expiringSoon: stats.expiringSoon.map(pickClientMember),
          moderators: stats.moderators.map(pickClientMember),
        }}
        initialRoleMappings={roleMappings.map((r: DbRoleMapping) => ({
          plan: r.plan,
          tier: r.tier,
          discordRole: r.discordRole,
        }))}
      />
    </div>
  );
}
