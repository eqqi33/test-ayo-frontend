"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import AppShell from "@/components/AppShell";
import LoadingSpinner from "@/components/LoadingSpinner";
import ErrorMessage from "@/components/ErrorMessage";
import { reportsApi } from "@/lib/api";
import type { MatchReport } from "@/types";
import { ArrowLeft, Trophy, Target, TrendingUp } from "lucide-react";

function matchStatusColor(status: string) {
  if (status === "Tim Home Menang") return "text-blue-600 bg-blue-50 border-blue-200";
  if (status === "Tim Away Menang") return "text-purple-600 bg-purple-50 border-purple-200";
  return "text-gray-600 bg-gray-50 border-gray-200";
}

export default function ReportDetailPage() {
  const params = useParams();
  const router = useRouter();
  const matchId = Number(params.id);

  const [report, setReport] = useState<MatchReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    reportsApi.getByMatchId(matchId)
      .then(setReport)
      .catch((e) => setError(e instanceof Error ? e.message : "Laporan tidak ditemukan"))
      .finally(() => setLoading(false));
  }, [matchId]);

  if (loading) return <AppShell><LoadingSpinner message="Memuat laporan..." /></AppShell>;
  if (error || !report) return <AppShell><ErrorMessage message={error || "Laporan tidak ditemukan"} onRetry={() => router.back()} /></AppShell>;

  return (
    <AppShell>
      <div className="space-y-6 max-w-3xl">
        <button onClick={() => router.back()} className="btn-outline btn btn-sm">
          <ArrowLeft size={14} /> Kembali
        </button>

        {/* Score Card */}
        <div className="card p-6">
          <p className="text-sm text-gray-400 mb-1">Laporan Pertandingan #{report.match_id}</p>
          <p className="text-sm text-gray-500 mb-5">{report.match_date} · {report.match_time} WIB</p>

          <div className="grid grid-cols-3 items-center gap-4 text-center mb-5">
            <div>
              <p className="text-xl font-bold text-gray-900">{report.home_team}</p>
              <p className="text-xs text-gray-400 mt-1">Tuan Rumah</p>
            </div>
            <div>
              <p className="text-4xl font-extrabold text-gray-900 tracking-tight">
                {report.home_score} – {report.away_score}
              </p>
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900">{report.away_team}</p>
              <p className="text-xs text-gray-400 mt-1">Tim Tamu</p>
            </div>
          </div>

          <div className="text-center">
            <span className={`inline-block rounded-full border px-4 py-1.5 text-sm font-semibold ${matchStatusColor(report.match_status)}`}>
              {report.match_status}
            </span>
          </div>
        </div>

        {/* Win accumulation */}
        <div className="grid grid-cols-2 gap-4">
          <div className="card p-5 text-center">
            <TrendingUp size={20} className="mx-auto mb-2 text-blue-500" />
            <p className="text-3xl font-extrabold text-blue-600">{report.home_team_total_wins}</p>
            <p className="text-xs text-gray-500 mt-1">Total Kemenangan</p>
            <p className="text-sm font-medium text-gray-700">{report.home_team}</p>
            <p className="text-xs text-gray-400">(Akumulasi s/d pertandingan ini)</p>
          </div>
          <div className="card p-5 text-center">
            <TrendingUp size={20} className="mx-auto mb-2 text-purple-500" />
            <p className="text-3xl font-extrabold text-purple-600">{report.away_team_total_wins}</p>
            <p className="text-xs text-gray-500 mt-1">Total Kemenangan</p>
            <p className="text-sm font-medium text-gray-700">{report.away_team}</p>
            <p className="text-xs text-gray-400">(Akumulasi s/d pertandingan ini)</p>
          </div>
        </div>

        {/* Top Scorers */}
        {report.top_scorers.length > 0 && (
          <div className="card p-6">
            <div className="flex items-center gap-2 mb-4">
              <Trophy size={18} className="text-yellow-500" />
              <h2 className="font-semibold text-gray-900">Pencetak Gol Terbanyak</h2>
            </div>
            <div className="space-y-3">
              {report.top_scorers.map((ts, i) => (
                <div key={i} className="flex items-center justify-between rounded-lg bg-yellow-50 px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-yellow-200 text-yellow-800 font-bold text-sm">
                      {i + 1}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{ts.player_name}</p>
                      <p className="text-xs text-gray-500">{ts.team_name}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-extrabold text-yellow-700">{ts.goal_count}</p>
                    <p className="text-xs text-gray-400">gol</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Goal Timeline */}
        {report.goals.length > 0 && (
          <div className="card p-6">
            <div className="flex items-center gap-2 mb-4">
              <Target size={18} className="text-green-500" />
              <h2 className="font-semibold text-gray-900">Kronologi Gol</h2>
            </div>
            <div className="relative ml-4 space-y-0">
              {[...report.goals].sort((a, b) => a.minute - b.minute).map((goal, i) => {
                const isHome = report.home_team === goal.team_name;
                return (
                  <div key={i} className="flex items-start gap-3 pb-4 last:pb-0">
                    <div className="relative flex flex-col items-center">
                      <div className={`z-10 flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${isHome ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"}`}>
                        {goal.minute}&apos;
                      </div>
                      {i < report.goals.length - 1 && (
                        <div className="w-0.5 flex-1 bg-gray-200 mt-1 min-h-[16px]" />
                      )}
                    </div>
                    <div className="pt-1">
                      <p className="text-sm font-semibold text-gray-900">{goal.player_name}</p>
                      <p className={`text-xs font-medium ${isHome ? "text-blue-500" : "text-purple-500"}`}>
                        {goal.team_name}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
