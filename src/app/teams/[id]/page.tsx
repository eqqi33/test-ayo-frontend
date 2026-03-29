"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import AppShell from "@/components/AppShell";
import Modal from "@/components/Modal";
import Pagination from "@/components/Pagination";
import LoadingSpinner from "@/components/LoadingSpinner";
import ErrorMessage from "@/components/ErrorMessage";
import { teamsApi, playersApi } from "@/lib/api";
import type {
  Team, Player, PaginationMeta,
  CreatePlayerPayload, UpdatePlayerPayload, PlayerPosition,
} from "@/types";
import { ArrowLeft, Plus, Pencil, Trash2, User, Search } from "lucide-react";
import toast from "react-hot-toast";
import Image from "next/image";

const POSITIONS: PlayerPosition[] = ["penyerang", "gelandang", "bertahan", "penjaga gawang"];

const positionColors: Record<PlayerPosition, string> = {
  penyerang: "bg-red-100 text-red-700",
  gelandang: "bg-blue-100 text-blue-700",
  bertahan: "bg-green-100 text-green-700",
  "penjaga gawang": "bg-yellow-100 text-yellow-700",
};

const EMPTY_PLAYER: CreatePlayerPayload = {
  name: "", height: 0, weight: 0, position: "penyerang", jersey_number: 1,
};

export default function TeamDetailPage() {
  const params = useParams();
  const router = useRouter();
  const teamId = Number(params.id);

  const [team, setTeam] = useState<Team | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [posFilter, setPosFilter] = useState("");
  const [loadingTeam, setLoadingTeam] = useState(true);
  const [loadingPlayers, setLoadingPlayers] = useState(true);
  const [error, setError] = useState("");

  // Modals
  const [createOpen, setCreateOpen] = useState(false);
  const [editPlayer, setEditPlayer] = useState<Player | null>(null);
  const [deletePlayer, setDeletePlayer] = useState<Player | null>(null);

  const [form, setForm] = useState<CreatePlayerPayload>(EMPTY_PLAYER);
  const [saving, setSaving] = useState(false);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    teamsApi.getById(teamId)
      .then(setTeam)
      .catch(() => setError("Tim tidak ditemukan"))
      .finally(() => setLoadingTeam(false));
  }, [teamId]);

  const fetchPlayers = useCallback(async () => {
    setLoadingPlayers(true);
    try {
      const res = await playersApi.getByTeam(teamId, {
        page, limit: 10, search: debouncedSearch, position: posFilter,
      });
      setPlayers(res.items);
      setMeta(res.meta);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal memuat pemain");
    } finally {
      setLoadingPlayers(false);
    }
  }, [teamId, page, debouncedSearch, posFilter]);

  useEffect(() => { fetchPlayers(); }, [fetchPlayers]);
  useEffect(() => { setPage(1); }, [debouncedSearch, posFilter]);

  function handleFormChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    const numFields = ["height", "weight", "jersey_number"];
    setForm((prev) => ({ ...prev, [name]: numFields.includes(name) ? Number(value) : value }));
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await playersApi.create(teamId, form);
      toast.success("Pemain berhasil ditambahkan");
      setCreateOpen(false);
      fetchPlayers();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menambahkan pemain");
    } finally {
      setSaving(false);
    }
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editPlayer) return;
    setSaving(true);
    try {
      const payload: UpdatePlayerPayload = { ...form };
      await playersApi.update(editPlayer.id, payload);
      toast.success("Pemain berhasil diperbarui");
      setEditPlayer(null);
      fetchPlayers();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal memperbarui pemain");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deletePlayer) return;
    setSaving(true);
    try {
      await playersApi.delete(deletePlayer.id);
      toast.success("Pemain berhasil dihapus");
      setDeletePlayer(null);
      fetchPlayers();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menghapus pemain");
    } finally {
      setSaving(false);
    }
  }

  function openCreate() {
    setForm(EMPTY_PLAYER);
    setCreateOpen(true);
  }

  function openEdit(player: Player) {
    setForm({
      name: player.name,
      height: player.height,
      weight: player.weight,
      position: player.position,
      jersey_number: player.jersey_number,
    });
    setEditPlayer(player);
  }

  const PlayerForm = ({ onSubmit }: { onSubmit: (e: React.FormEvent) => void }) => (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className="label mb-1">Nama Pemain *</label>
        <input name="name" className="input" value={form.name} onChange={handleFormChange} required minLength={2} maxLength={100} placeholder="Bambang Pamungkas" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label mb-1">Tinggi Badan (cm) *</label>
          <input name="height" type="number" step="0.1" min="1" className="input" value={form.height || ""} onChange={handleFormChange} required placeholder="172" />
        </div>
        <div>
          <label className="label mb-1">Berat Badan (kg) *</label>
          <input name="weight" type="number" step="0.1" min="1" className="input" value={form.weight || ""} onChange={handleFormChange} required placeholder="68" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label mb-1">Posisi *</label>
          <select name="position" className="input" value={form.position} onChange={handleFormChange} required>
            {POSITIONS.map((p) => (
              <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label mb-1">Nomor Punggung *</label>
          <input name="jersey_number" type="number" min="1" max="99" className="input" value={form.jersey_number || ""} onChange={handleFormChange} required />
        </div>
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <button type="button" className="btn-outline btn" onClick={() => { setCreateOpen(false); setEditPlayer(null); }}>Batal</button>
        <button type="submit" disabled={saving} className="btn-primary btn">
          {saving ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> : null}
          {saving ? "Menyimpan..." : "Simpan"}
        </button>
      </div>
    </form>
  );

  if (loadingTeam) return <AppShell><LoadingSpinner message="Memuat data tim..." /></AppShell>;
  if (error || !team) return <AppShell><ErrorMessage message={error || "Tim tidak ditemukan"} onRetry={() => router.back()} /></AppShell>;

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Back + Header */}
        <div>
          <button onClick={() => router.back()} className="btn-outline btn btn-sm mb-4">
            <ArrowLeft size={14} /> Kembali
          </button>
          <div className="flex items-center gap-4">
            {team.logo ? (
              <div className="relative h-16 w-16 overflow-hidden rounded-xl border border-gray-200">
                <Image src={team.logo} alt={team.name} fill className="object-contain" unoptimized />
              </div>
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-blue-100 text-blue-700 text-2xl font-bold">
                {team.name.charAt(0)}
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{team.name}</h1>
              <p className="text-sm text-gray-500">
                {team.city} · Berdiri {team.year_founded} · {team.address}
              </p>
            </div>
          </div>
        </div>

        {/* Players */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Daftar Pemain</h2>
            <button onClick={openCreate} className="btn-primary btn btn-sm">
              <Plus size={14} /> Tambah Pemain
            </button>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-3">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input className="input pl-8 w-56" placeholder="Cari nama pemain..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <select className="input w-44" value={posFilter} onChange={(e) => setPosFilter(e.target.value)}>
              <option value="">Semua Posisi</option>
              {POSITIONS.map((p) => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
            </select>
          </div>

          <div className="card overflow-hidden">
            {loadingPlayers ? (
              <LoadingSpinner message="Memuat pemain..." />
            ) : players.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <User size={48} className="mb-3 text-gray-300" />
                <p className="text-sm text-gray-500">Belum ada pemain</p>
                <button onClick={openCreate} className="btn-primary btn btn-sm mt-3">Tambah Pemain Pertama</button>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="border-b border-gray-100 bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left font-medium text-gray-600">#</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-600">Nama</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-600">Posisi</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-600">TB / BB</th>
                        <th className="px-4 py-3 text-right font-medium text-gray-600">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {players.map((player) => (
                        <tr key={player.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3">
                            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-gray-700">
                              {player.jersey_number}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-medium text-gray-900">{player.name}</td>
                          <td className="px-4 py-3">
                            <span className={`badge ${positionColors[player.position]}`}>
                              {player.position}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-500">
                            {player.height} cm / {player.weight} kg
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-1">
                              <button onClick={() => openEdit(player)} className="btn-outline btn btn-sm p-1.5" title="Edit">
                                <Pencil size={14} />
                              </button>
                              <button onClick={() => setDeletePlayer(player)} className="btn btn-sm p-1.5 border border-red-200 text-red-500 hover:bg-red-50" title="Hapus">
                                <Trash2 size={14} />
                              </button>
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
      </div>

      <Modal title="Tambah Pemain" open={createOpen} onClose={() => setCreateOpen(false)}>
        <PlayerForm onSubmit={handleCreate} />
      </Modal>

      <Modal title="Edit Pemain" open={!!editPlayer} onClose={() => setEditPlayer(null)}>
        <PlayerForm onSubmit={handleEdit} />
      </Modal>

      <Modal title="Hapus Pemain" open={!!deletePlayer} onClose={() => setDeletePlayer(null)} size="sm">
        <p className="text-sm text-gray-600 mb-5">
          Yakin ingin menghapus pemain <span className="font-semibold">{deletePlayer?.name}</span>?
        </p>
        <div className="flex justify-end gap-3">
          <button className="btn-outline btn" onClick={() => setDeletePlayer(null)}>Batal</button>
          <button className="btn-danger btn" onClick={handleDelete} disabled={saving}>
            {saving ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> : null}
            Hapus
          </button>
        </div>
      </Modal>
    </AppShell>
  );
}
