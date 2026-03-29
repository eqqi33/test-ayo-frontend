"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import AppShell from "@/components/AppShell";
import Modal from "@/components/Modal";
import LoadingSpinner from "@/components/LoadingSpinner";
import ErrorMessage from "@/components/ErrorMessage";
import { matchesApi, playersApi } from "@/lib/api";
import type { Match, MatchResult, Player, GoalInput } from "@/types";
import { ArrowLeft, Flag, ClipboardList, Plus, Trash2, Pencil } from "lucide-react";
import toast from "react-hot-toast";
import Link from "next/link";

export default function MatchDetailPage() {
  const params = useParams();
  const router = useRouter();
  const matchId = Number(params.id);

  const [match, setMatch] = useState<Match | null>(null);
  const [result, setResult] = useState<MatchResult | null>(null);
  const [loadingMatch, setLoadingMatch] = useState(true);
  const [loadingResult, setLoadingResult] = useState(true);
  const [error, setError] = useState("");

  // Result form state
  const [resultOpen, setResultOpen] = useState(false);
  const [homeScore, setHomeScore] = useState(0);
  const [awayScore, setAwayScore] = useState(0);
  const [goals, setGoals] = useState<GoalInput[]>([]);
  const [homePlayers, setHomePlayers] = useState<Player[]>([]);
  const [awayPlayers, setAwayPlayers] = useState<Player[]>([]);
  const [saving, setSaving] = useState(false);

  const fetchMatch = useCallback(async () => {
    setLoadingMatch(true);
    try {
      const m = await matchesApi.getById(matchId);
      setMatch(m);
    } catch {
      setError("Pertandingan tidak ditemukan");
    } finally {
      setLoadingMatch(false);
    }
  }, [matchId]);

  const fetchResult = useCallback(async () => {
    setLoadingResult(true);
    try {
      const r = await matchesApi.getResult(matchId);
      setResult(r);
    } catch {
      setResult(null);
    } finally {
      setLoadingResult(false);
    }
  }, [matchId]);

  useEffect(() => {
    fetchMatch();
    fetchResult();
  }, [fetchMatch, fetchResult]);

  // Load players when opening result modal
  async function openResultModal() {
    if (!match) return;
    try {
      const [homeRes, awayRes] = await Promise.all([
        playersApi.getByTeam(match.home_team_id, { limit: 50 }),
        playersApi.getByTeam(match.away_team_id, { limit: 50 }),
      ]);
      setHomePlayers(homeRes.items);
      setAwayPlayers(awayRes.items);

      if (result) {
        setHomeScore(result.home_score);
        setAwayScore(result.away_score);
        setGoals(result.goals.map((g) => ({ player_id: g.player_id, minute: g.minute })));
      } else {
        setHomeScore(0);
        setAwayScore(0);
        setGoals([]);
      }
      setResultOpen(true);
    } catch {
      toast.error("Gagal memuat data pemain");
    }
  }

  function addGoal() {
    const allPlayers = [...homePlayers, ...awayPlayers];
    setGoals((prev) => [...prev, { player_id: allPlayers[0]?.id ?? 0, minute: 1 }]);
  }

  function removeGoal(index: number) {
    setGoals((prev) => prev.filter((_, i) => i !== index));
  }

  function updateGoal(index: number, field: "player_id" | "minute", value: number) {
    setGoals((prev) => prev.map((g, i) => (i === index ? { ...g, [field]: value } : g)));
  }

  async function handleSubmitResult(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const r = await matchesApi.reportResult(matchId, {
        home_score: homeScore,
        away_score: awayScore,
        goals,
      });
      setResult(r);
      setResultOpen(false);
      fetchMatch();
      toast.success("Hasil pertandingan berhasil dilaporkan");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal melaporkan hasil");
    } finally {
      setSaving(false);
    }
  }

  const allPlayers = [...homePlayers, ...awayPlayers];

  const statusBadge = (status: string) => {
    if (status === "scheduled")
      return <span className="badge bg-yellow-100 text-yellow-700 px-3 py-1 text-sm">Terjadwal</span>;
    return <span className="badge bg-green-100 text-green-700 px-3 py-1 text-sm">Selesai</span>;
  };

  if (loadingMatch) return <AppShell><LoadingSpinner message="Memuat data pertandingan..." /></AppShell>;
  if (error || !match) return <AppShell><ErrorMessage message={error || "Pertandingan tidak ditemukan"} onRetry={() => router.back()} /></AppShell>;

  return (
    <AppShell>
      <div className="space-y-6 max-w-3xl">
        {/* Back */}
        <button onClick={() => router.back()} className="btn-outline btn btn-sm">
          <ArrowLeft size={14} /> Kembali
        </button>

        {/* Match Header */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-gray-400">Pertandingan #{match.id}</p>
              <p className="text-sm text-gray-500 mt-0.5">{match.match_date} · {match.match_time} WIB</p>
            </div>
            {statusBadge(match.status)}
          </div>

          <div className="grid grid-cols-3 items-center gap-4 text-center">
            <div>
              <p className="text-lg font-bold text-gray-900">
                {match.home_team?.name ?? `Tim #${match.home_team_id}`}
              </p>
              <p className="text-xs text-gray-400">Tuan Rumah</p>
            </div>
            <div>
              {result ? (
                <div>
                  <p className="text-3xl font-extrabold text-gray-900 tracking-tight">
                    {result.home_score} – {result.away_score}
                  </p>
                  <p className={`mt-1 text-sm font-medium ${
                    result.final_status === "Tim Home Menang" ? "text-blue-600" :
                    result.final_status === "Tim Away Menang" ? "text-purple-600" :
                    "text-gray-500"
                  }`}>{result.final_status}</p>
                </div>
              ) : (
                <p className="text-xl font-bold text-gray-300">vs</p>
              )}
            </div>
            <div>
              <p className="text-lg font-bold text-gray-900">
                {match.away_team?.name ?? `Tim #${match.away_team_id}`}
              </p>
              <p className="text-xs text-gray-400">Tim Tamu</p>
            </div>
          </div>

          {match.status === "scheduled" && (
            <div className="mt-5 pt-4 border-t border-gray-100 flex justify-center">
              <button onClick={openResultModal} className="btn-success btn">
                <Flag size={15} /> Laporkan Hasil Pertandingan
              </button>
            </div>
          )}
          {match.status === "completed" && (
            <div className="mt-5 pt-4 border-t border-gray-100 flex justify-between items-center">
              <Link href={`/reports/${match.id}`} className="btn-outline btn btn-sm">
                <ClipboardList size={14} /> Lihat Laporan Lengkap
              </Link>
              <button onClick={openResultModal} className="btn-outline btn btn-sm text-amber-600 border-amber-200 hover:bg-amber-50">
                <Pencil size={14} /> Koreksi Hasil
              </button>
            </div>
          )}
        </div>

        {/* Goals */}
        {!loadingResult && result && result.goals.length > 0 && (
          <div className="card p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-4">Detail Gol</h2>
            <div className="space-y-2">
              {result.goals.map((goal, i) => (
                <div key={i} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 text-green-700 text-xs font-bold flex-shrink-0">
                    {goal.minute}&apos;
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{goal.player_name}</p>
                    <p className="text-xs text-gray-400">{goal.team_name}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Result Modal */}
      <Modal
        title={result ? "Koreksi Hasil Pertandingan" : "Laporkan Hasil Pertandingan"}
        open={resultOpen}
        onClose={() => setResultOpen(false)}
        size="lg"
      >
        <form onSubmit={handleSubmitResult} className="space-y-5">
          {/* Scores */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label mb-1">
                Skor {match.home_team?.name ?? "Home"}
              </label>
              <input
                type="number"
                min="0"
                className="input text-center text-xl font-bold"
                value={homeScore}
                onChange={(e) => setHomeScore(Number(e.target.value))}
              />
            </div>
            <div>
              <label className="label mb-1">
                Skor {match.away_team?.name ?? "Away"}
              </label>
              <input
                type="number"
                min="0"
                className="input text-center text-xl font-bold"
                value={awayScore}
                onChange={(e) => setAwayScore(Number(e.target.value))}
              />
            </div>
          </div>

          {/* Goals */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="label">Detail Gol</label>
              <button type="button" onClick={addGoal} className="btn-outline btn btn-sm">
                <Plus size={13} /> Tambah Gol
              </button>
            </div>
            {goals.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4 border border-dashed border-gray-200 rounded-lg">
                Belum ada gol yang ditambahkan
              </p>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {goals.map((goal, i) => (
                  <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-gray-50">
                    <select
                      className="input flex-1"
                      value={goal.player_id}
                      onChange={(e) => updateGoal(i, "player_id", Number(e.target.value))}
                      required
                    >
                      <option value="">Pilih pemain...</option>
                      {homePlayers.length > 0 && (
                        <optgroup label={match.home_team?.name ?? "Home"}>
                          {homePlayers.map((p) => (
                            <option key={p.id} value={p.id}>#{p.jersey_number} {p.name}</option>
                          ))}
                        </optgroup>
                      )}
                      {awayPlayers.length > 0 && (
                        <optgroup label={match.away_team?.name ?? "Away"}>
                          {awayPlayers.map((p) => (
                            <option key={p.id} value={p.id}>#{p.jersey_number} {p.name}</option>
                          ))}
                        </optgroup>
                      )}
                    </select>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <input
                        type="number"
                        min="1"
                        max="120"
                        className="input w-20 text-center"
                        value={goal.minute}
                        onChange={(e) => updateGoal(i, "minute", Number(e.target.value))}
                        placeholder="Menit"
                        required
                      />
                      <span className="text-xs text-gray-400">&apos;</span>
                    </div>
                    <button type="button" onClick={() => removeGoal(i)} className="text-red-400 hover:text-red-600 p-1">
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
            {allPlayers.length === 0 && (
              <p className="mt-2 text-xs text-amber-600">
                ⚠ Kedua tim belum memiliki pemain terdaftar. Tambahkan pemain terlebih dahulu.
              </p>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" className="btn-outline btn" onClick={() => setResultOpen(false)}>Batal</button>
            <button type="submit" disabled={saving} className="btn-success btn">
              {saving ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> : null}
              {saving ? "Menyimpan..." : "Simpan Hasil"}
            </button>
          </div>
        </form>
      </Modal>
    </AppShell>
  );
}

