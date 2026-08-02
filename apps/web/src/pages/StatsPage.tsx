import { useEffect, useState } from "react";
import { getAdminStats, type AdminStats } from "../lib/api";
import { useT } from "../lib/i18n";

function shortDay(iso: string | null): string {
  if (!iso) return "—";
  return iso.slice(0, 10);
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-cream-100 bg-white px-3 py-3 text-center dark:border-slate-700 dark:bg-slate-800">
      <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
        {value}
      </div>
      <div className="mt-0.5 text-xs text-stone-500 dark:text-slate-400">
        {label}
      </div>
    </div>
  );
}

export function StatsPage() {
  const t = useT();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [denied, setDenied] = useState(false);

  useEffect(() => {
    getAdminStats()
      .then(setStats)
      .catch(() => setDenied(true));
  }, []);

  if (denied) {
    return (
      <div className="mx-auto max-w-md px-4 py-6">
        <p className="text-sm text-slate-600 dark:text-slate-300">
          {t.statsAccessDenied}
        </p>
      </div>
    );
  }
  if (!stats) {
    return (
      <div className="mx-auto max-w-md px-4 py-6">
        <p className="text-sm text-slate-500 dark:text-slate-400">{t.loading}</p>
      </div>
    );
  }

  const maxDaily = Math.max(1, ...stats.dailyActive.map((d) => d.users));

  return (
    <div className="mx-auto max-w-md px-4 py-6">
      <h1 className="mb-4 text-xl font-bold text-slate-900 dark:text-slate-100">
        {t.statsTitle}
      </h1>

      <div className="mb-6 grid grid-cols-2 gap-2">
        <Stat label={t.statsTotalUsers} value={stats.totals.users} />
        <Stat label={t.statsActiveToday} value={stats.totals.active_today} />
        <Stat label={t.statsActive7d} value={stats.totals.active_7d} />
        <Stat label={t.statsReturning} value={stats.totals.returning_users} />
      </div>

      <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-stone-500 dark:text-slate-400">
        {t.statsDailyActive}
      </h2>
      <div className="mb-6 space-y-1">
        {stats.dailyActive.length === 0 && (
          <p className="text-sm text-slate-400">—</p>
        )}
        {stats.dailyActive.map((d) => (
          <div key={d.day} className="flex items-center gap-2 text-xs">
            <span className="w-20 shrink-0 text-stone-500 dark:text-slate-400">
              {d.day.slice(5)}
            </span>
            <div className="h-3 flex-1 overflow-hidden rounded bg-cream-100 dark:bg-slate-700">
              <div
                className="h-full rounded bg-sage-500"
                style={{ width: `${(d.users / maxDaily) * 100}%` }}
              />
            </div>
            <span className="w-6 text-right tabular-nums text-slate-600 dark:text-slate-300">
              {d.users}
            </span>
          </div>
        ))}
      </div>

      <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-stone-500 dark:text-slate-400">
        {t.statsPerUser}
      </h2>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="text-stone-500 dark:text-slate-400">
              <th className="py-1 pr-2 font-medium">{t.statsColUser}</th>
              <th className="py-1 pr-2 font-medium">{t.statsColSignup}</th>
              <th className="py-1 pr-2 font-medium">{t.statsColLastSeen}</th>
              <th className="py-1 pr-2 text-right font-medium">{t.statsColDays}</th>
              <th className="py-1 text-right font-medium">{t.statsColVisits}</th>
            </tr>
          </thead>
          <tbody>
            {stats.users.map((u) => (
              <tr
                key={u.email}
                className="border-t border-cream-100 dark:border-slate-700"
              >
                <td className="py-1 pr-2 text-slate-800 dark:text-slate-100">
                  {u.email}
                </td>
                <td className="py-1 pr-2 text-slate-500 dark:text-slate-400">
                  {shortDay(u.signup_at)}
                </td>
                <td className="py-1 pr-2 text-slate-500 dark:text-slate-400">
                  {shortDay(u.last_seen ?? u.last_login_at)}
                </td>
                <td className="py-1 pr-2 text-right tabular-nums">
                  {u.active_days}
                </td>
                <td className="py-1 text-right tabular-nums">{u.visits}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
