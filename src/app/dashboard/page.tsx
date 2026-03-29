"use client";

import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import StatCard from "@/components/StatCard";
import { teamsApi, matchesApi, reportsApi } from "@/lib/api";
import { Users, Calendar, CheckCircle, BarChart3 } from "lucide-react";
import Link from "next/link";
import type { Match, MatchReport } from "@/types";
import { useAuth } from "@/contexts/AuthContext";

interface Stats {
  teams: number;
  scheduled: number;
  completed: number;
  reports: number;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats>({ teams: 0, scheduled: 0, completed: 0, reports: 0 });
  const [recentMatches, setRecentMatches] = useState<Match[]>([]);
  const [recentReports, setRecentReports] = useState<MatchReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [teamsRes, scheduledRes, completedRes, reportsRes] = await Promise.all([
          teamsApi.getAll({ limit: 1 }),
          matchesApi.getAll({ limit: 1, status: "scheduled" }),
          matchesApi.getAll({ limit: 5, status: "completed" }),
          reportsApi.getAll({ limit: 5 }),
        ]);
        setStats({
          teams: teamsRes.meta.total,
          scheduled: scheduledRes.meta.total,
          completed: completedRes.meta.total,
          reports: reportsRes.meta.total,
        });
        setRecentMatches(completedRes.items);
        setRecentReports(reportsRes.items.slice(0, 3));
      } catch {
        // silently fail — show zeros
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const statusBadge = (status: string) => {
    if (status === "scheduled")
      return <span className="badge bg-yellow-100 text-yellow-700">Terjadwal</span>;
    return <span className="badge bg-green-100 text-green-700">Selesai</span>;
  };

  const matchResultBadge = (status: string) => {
    if (status === "Tim Home Menang")
      return <span className="badge bg-blue-100 text-blue-700">{status}</span>;
    if (status === "Tim Away Menang")
      return <span className="badge bg-purple-100 text-purple-700">{status}</span>;
    return <span className="badge bg-gray-100 text-gray-600">{status}</span>;
  };

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">
            Selamat datang, <span className="font-medium">{user?.name}</span> — ringkasan sistem manajemen tim XYZ
          </p>
        </div>

        {/* Stats */}
        {loading ? (
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="card h-24 animate-pulse bg-gray-100" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard
              title="Total Tim"
              value={stats.teams}
              icon={<Users size={22} />}
              color="blue"
            />
            <StatCard
              title="Terjadwal"
              value={stats.scheduled}
              icon={<Calendar size={22} />}
              color="yellow"
            />
            <StatCard
              title="Selesai"
              value={stats.completed}
              icon={<CheckCircle size={22} />}
              color="green"
            />
            <StatCard
              title="Laporan"
              value={stats.reports}
              icon={<BarChart3 size={22} />}
              color="purple"
            />
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Recent Matches */}
          <div className="card">
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
              <h2 className="font-semibold text-gray-900">Pertandingan Terkini</h2>
              <Link href="/matches" className="text-xs text-blue-600 hover:underline">
                Lihat semua
              </Link>
            </div>
            <div className="divide-y divide-gray-50">
              {recentMatches.length === 0 ? (
                <p className="px-5 py-8 text-center text-sm text-gray-400">
                  Belum ada pertandingan selesai
                </p>
              ) : (
                recentMatches.map((m) => (
                  <div key={m.id} className="flex items-center justify-between px-5 py-3">
                    <div>
                      <p className="text-sm font-medium text-gray-800">
                        {m.home_team?.name ?? `Tim #${m.home_team_id}`}{" "}
                        <span className="text-gray-400">vs</span>{" "}
                        {m.away_team?.name ?? `Tim #${m.away_team_id}`}
                      </p>
                      <p className="text-xs text-gray-400">
                        {m.match_date} · {m.match_time}
                      </p>
                    </div>
                    {statusBadge(m.status)}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Recent Reports */}
          <div className="card">
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
              <h2 className="font-semibold text-gray-900">Laporan Terbaru</h2>
              <Link href="/reports" className="text-xs text-blue-600 hover:underline">
                Lihat semua
              </Link>
            </div>
            <div className="divide-y divide-gray-50">
              {recentReports.length === 0 ? (
                <p className="px-5 py-8 text-center text-sm text-gray-400">
                  Belum ada laporan
                </p>
              ) : (
                recentReports.map((r) => (
                  <Link
                    key={r.match_id}
                    href={`/reports/${r.match_id}`}
                    className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 transition-colors"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-800">
                        {r.home_team} <span className="font-bold">{r.home_score}–{r.away_score}</span> {r.away_team}
                      </p>
                      <p className="text-xs text-gray-400">
                        {r.match_date} · {r.match_time}
                      </p>
                    </div>
                    {matchResultBadge(r.match_status)}
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
