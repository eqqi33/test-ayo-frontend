"use client";

import { useEffect, useState, useCallback } from "react";
import AppShell from "@/components/AppShell";
import Modal from "@/components/Modal";
import Pagination from "@/components/Pagination";
import LoadingSpinner from "@/components/LoadingSpinner";
import ErrorMessage from "@/components/ErrorMessage";
import { matchesApi, teamsApi } from "@/lib/api";
import type { Match, Team, PaginationMeta, CreateMatchPayload } from "@/types";
import { Plus, Search, Pencil, Trash2, Eye, Calendar } from "lucide-react";
import toast from "react-hot-toast";
import Link from "next/link";

const EMPTY_MATCH: CreateMatchPayload = {
  match_date: "", match_time: "19:00", home_team_id: 0, away_team_id: 0,
};

export default function MatchesPage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [teams, setTeams] = useState<Team[]>([]);

  // Modals
  const [createOpen, setCreateOpen] = useState(false);
  const [editMatch, setEditMatch] = useState<Match | null>(null);
  const [deleteMatch, setDeleteMatch] = useState<Match | null>(null);

  const [form, setForm] = useState<CreateMatchPayload>(EMPTY_MATCH);
  const [saving, setSaving] = useState(false);

  // Load all teams for selects
  useEffect(() => {
    teamsApi.getAll({ limit: 50 }).then((r) => setTeams(r.items)).catch(() => {});
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  const fetchMatches = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await matchesApi.getAll({
        page, limit: 10, search: debouncedSearch, status: statusFilter,
      });
      setMatches(res.items);
      setMeta(res.meta);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal memuat pertandingan");
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, statusFilter]);

  useEffect(() => { fetchMatches(); }, [fetchMatches]);
  useEffect(() => { setPage(1); }, [debouncedSearch, statusFilter]);

  function handleFormChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    const numFields = ["home_team_id", "away_team_id"];
    setForm((prev) => ({ ...prev, [name]: numFields.includes(name) ? Number(value) : value }));
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (form.home_team_id === form.away_team_id) {
      toast.error("Tim tuan rumah dan tamu tidak boleh sama");
      return;
    }
    setSaving(true);
    try {
      await matchesApi.create(form);
      toast.success("Jadwal pertandingan berhasil dibuat");
      setCreateOpen(false);
      fetchMatches();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal membuat jadwal");
    } finally {
      setSaving(false);
    }
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editMatch) return;
    if (form.home_team_id && form.away_team_id && form.home_team_id === form.away_team_id) {
      toast.error("Tim tuan rumah dan tamu tidak boleh sama");
      return;
    }
    setSaving(true);
    try {
      await matchesApi.update(editMatch.id, form);
      toast.success("Jadwal pertandingan berhasil diperbarui");
      setEditMatch(null);
      fetchMatches();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal memperbarui jadwal");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteMatch) return;
    setSaving(true);
    try {
      await matchesApi.delete(deleteMatch.id);
      toast.success("Jadwal pertandingan berhasil dihapus");
      setDeleteMatch(null);
      fetchMatches();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menghapus jadwal");
    } finally {
      setSaving(false);
    }
  }

  function openCreate() {
    setForm(EMPTY_MATCH);
    setCreateOpen(true);
  }

  function openEdit(match: Match) {
    setForm({
      match_date: match.match_date,
      match_time: match.match_time,
      home_team_id: match.home_team_id,
      away_team_id: match.away_team_id,
    });
    setEditMatch(match);
  }

  const statusBadge = (status: string) => {
    if (status === "scheduled")
      return <span className="badge bg-yellow-100 text-yellow-700">Terjadwal</span>;
    return <span className="badge bg-green-100 text-green-700">Selesai</span>;
  };

  const MatchForm = ({ onSubmit, isEdit }: { onSubmit: (e: React.FormEvent) => void; isEdit?: boolean }) => (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label mb-1">Tanggal *</label>
          <input name="match_date" type="date" className="input" value={form.match_date} onChange={handleFormChange} required={!isEdit} />
        </div>
        <div>
          <label className="label mb-1">Waktu *</label>
          <input name="match_time" type="time" className="input" value={form.match_time} onChange={handleFormChange} required={!isEdit} />
        </div>
      </div>
      <div>
        <label className="label mb-1">Tim Tuan Rumah (Home) *</label>
        <select name="home_team_id" className="input" value={form.home_team_id || ""} onChange={handleFormChange} required={!isEdit}>
          <option value="">Pilih tim...</option>
          {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
      </div>
      <div>
        <label className="label mb-1">Tim Tamu (Away) *</label>
        <select name="away_team_id" className="input" value={form.away_team_id || ""} onChange={handleFormChange} required={!isEdit}>
          <option value="">Pilih tim...</option>
          {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <button type="button" className="btn-outline btn" onClick={() => { setCreateOpen(false); setEditMatch(null); }}>Batal</button>
        <button type="submit" disabled={saving} className="btn-primary btn">
          {saving ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> : null}
          {saving ? "Menyimpan..." : "Simpan"}
        </button>
      </div>
    </form>
  );

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Pertandingan</h1>
            <p className="mt-1 text-sm text-gray-500">Kelola jadwal dan hasil pertandingan</p>
          </div>
          <button onClick={openCreate} className="btn-primary btn">
            <Plus size={16} /> Buat Jadwal
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input className="input pl-9 w-56" placeholder="Cari nama tim..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <select className="input w-40" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">Semua Status</option>
            <option value="scheduled">Terjadwal</option>
            <option value="completed">Selesai</option>
          </select>
        </div>

        {/* Table */}
        <div className="card overflow-hidden">
          {loading ? (
            <LoadingSpinner message="Memuat data pertandingan..." />
          ) : error ? (
            <ErrorMessage message={error} onRetry={fetchMatches} />
          ) : matches.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Calendar size={48} className="mb-3 text-gray-300" />
              <p className="text-sm text-gray-500">Belum ada pertandingan</p>
              <button onClick={openCreate} className="btn-primary btn btn-sm mt-3">Buat Jadwal Pertama</button>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-gray-100 bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium text-gray-600">Tanggal & Waktu</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-600">Home</th>
                      <th className="px-4 py-3 text-center font-medium text-gray-600">vs</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-600">Away</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-600">Status</th>
                      <th className="px-4 py-3 text-right font-medium text-gray-600">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {matches.map((match) => (
                      <tr key={match.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-900">{match.match_date}</p>
                          <p className="text-xs text-gray-400">{match.match_time} WIB</p>
                        </td>
                        <td className="px-4 py-3 font-medium text-gray-800">
                          {match.home_team?.name ?? `Tim #${match.home_team_id}`}
                        </td>
                        <td className="px-4 py-3 text-center text-gray-400 font-bold">vs</td>
                        <td className="px-4 py-3 font-medium text-gray-800">
                          {match.away_team?.name ?? `Tim #${match.away_team_id}`}
                        </td>
                        <td className="px-4 py-3">{statusBadge(match.status)}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <Link href={`/matches/${match.id}`} className="btn-outline btn btn-sm p-1.5" title="Detail">
                              <Eye size={14} />
                            </Link>
                            {match.status === "scheduled" && (
                              <>
                                <button onClick={() => openEdit(match)} className="btn-outline btn btn-sm p-1.5" title="Edit">
                                  <Pencil size={14} />
                                </button>
                                <button onClick={() => setDeleteMatch(match)} className="btn btn-sm p-1.5 border border-red-200 text-red-500 hover:bg-red-50" title="Hapus">
                                  <Trash2 size={14} />
                                </button>
                              </>
                            )}
                          </div>
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

      <Modal title="Buat Jadwal Pertandingan" open={createOpen} onClose={() => setCreateOpen(false)}>
        <MatchForm onSubmit={handleCreate} />
      </Modal>

      <Modal title="Edit Jadwal Pertandingan" open={!!editMatch} onClose={() => setEditMatch(null)}>
        <MatchForm onSubmit={handleEdit} isEdit />
      </Modal>

      <Modal title="Hapus Jadwal" open={!!deleteMatch} onClose={() => setDeleteMatch(null)} size="sm">
        <p className="text-sm text-gray-600 mb-5">
          Yakin ingin menghapus jadwal pertandingan{" "}
          <span className="font-semibold">
            {deleteMatch?.home_team?.name ?? `Tim #${deleteMatch?.home_team_id}`} vs{" "}
            {deleteMatch?.away_team?.name ?? `Tim #${deleteMatch?.away_team_id}`}
          </span>?
        </p>
        <div className="flex justify-end gap-3">
          <button className="btn-outline btn" onClick={() => setDeleteMatch(null)}>Batal</button>
          <button className="btn-danger btn" onClick={handleDelete} disabled={saving}>
            {saving ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> : null}
            Hapus
          </button>
        </div>
      </Modal>
    </AppShell>
  );
}
