"use client";

import { useEffect, useState, useCallback } from "react";
import AppShell from "@/components/AppShell";
import Pagination from "@/components/Pagination";
import LoadingSpinner from "@/components/LoadingSpinner";
import ErrorMessage from "@/components/ErrorMessage";
import { reportsApi } from "@/lib/api";
import type { MatchReport, PaginationMeta } from "@/types";
import { BarChart3, Eye, Trophy } from "lucide-react";
import Link from "next/link";

function matchStatusBadge(status: string) {
  if (status === "Tim Home Menang")
    return <span className="badge bg-blue-100 text-blue-700">{status}</span>;
  if (status === "Tim Away Menang")
    return <span className="badge bg-purple-100 text-purple-700">{status}</span>;
  return <span className="badge bg-gray-100 text-gray-600">{status}</span>;
}

export default function ReportsPage() {
  const [reports, setReports] = useState<MatchReport[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchReports = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await reportsApi.getAll({ page, limit: 10 });
      setReports(res.items);
      setMeta(res.meta);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal memuat laporan");
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { fetchReports(); }, [fetchReports]);

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Laporan Pertandingan</h1>
          <p className="mt-1 text-sm text-gray-500">
            Hasil dan statistik lengkap semua pertandingan yang telah selesai
          </p>
        </div>

        <div className="card overflow-hidden">
          {loading ? (
            <LoadingSpinner message="Memuat laporan..." />
          ) : error ? (
            <ErrorMessage message={error} onRetry={fetchReports} />
          ) : reports.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <BarChart3 size={48} className="mb-3 text-gray-300" />
              <p className="text-sm text-gray-500">Belum ada laporan pertandingan</p>
              <p className="text-xs text-gray-400 mt-1">Laporan tersedia setelah pertandingan selesai dilaporkan</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-gray-100 bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium text-gray-600">Tanggal</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-600">Pertandingan</th>
                      <th className="px-4 py-3 text-center font-medium text-gray-600">Skor</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-600">Status</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-600">Top Scorer</th>
                      <th className="px-4 py-3 text-center font-medium text-gray-600">Home Wins</th>
                      <th className="px-4 py-3 text-center font-medium text-gray-600">Away Wins</th>
                      <th className="px-4 py-3 text-right font-medium text-gray-600">Detail</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {reports.map((r) => (
                      <tr key={r.match_id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-800">{r.match_date}</p>
                          <p className="text-xs text-gray-400">{r.match_time} WIB</p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-900">{r.home_team}</p>
                          <p className="text-xs text-gray-400">vs {r.away_team}</p>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="text-lg font-extrabold text-gray-900">
                            {r.home_score} – {r.away_score}
                          </span>
                        </td>
                        <td className="px-4 py-3">{matchStatusBadge(r.match_status)}</td>
                        <td className="px-4 py-3">
                          {r.top_scorers.length > 0 ? (
                            <div className="space-y-0.5">
                              {r.top_scorers.map((ts, i) => (
                                <div key={i} className="flex items-center gap-1 text-xs">
                                  <Trophy size={10} className="text-yellow-500 flex-shrink-0" />
                                  <span className="text-gray-700 font-medium">{ts.player_name}</span>
                                  <span className="text-gray-400">({ts.goal_count} gol)</span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400">–</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="inline-flex items-center justify-center min-w-[2rem] rounded-full bg-blue-50 px-2 py-0.5 text-sm font-bold text-blue-700">
                            {r.home_team_total_wins}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="inline-flex items-center justify-center min-w-[2rem] rounded-full bg-purple-50 px-2 py-0.5 text-sm font-bold text-purple-700">
                            {r.away_team_total_wins}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Link href={`/reports/${r.match_id}`} className="btn-outline btn btn-sm p-1.5" title="Detail Laporan">
                            <Eye size={14} />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {meta && <Pagination meta={meta} onPageChange={setPage} />}
            </>
          )}
        </div>
      </div>
    </AppShell>
  );
}
