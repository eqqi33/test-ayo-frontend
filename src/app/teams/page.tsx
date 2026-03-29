"use client";

import { useEffect, useState, useCallback } from "react";
import AppShell from "@/components/AppShell";
import Modal from "@/components/Modal";
import Pagination from "@/components/Pagination";
import LoadingSpinner from "@/components/LoadingSpinner";
import ErrorMessage from "@/components/ErrorMessage";
import { teamsApi } from "@/lib/api";
import type { Team, PaginationMeta, CreateTeamPayload, UpdateTeamPayload } from "@/types";
import { Plus, Search, Pencil, Trash2, Eye, Building2 } from "lucide-react";
import toast from "react-hot-toast";
import Link from "next/link";
import Image from "next/image";

const EMPTY_CREATE: CreateTeamPayload = {
  name: "", logo: "", year_founded: new Date().getFullYear(), address: "", city: "",
};

export default function TeamsPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Modals
  const [createOpen, setCreateOpen] = useState(false);
  const [editTeam, setEditTeam] = useState<Team | null>(null);
  const [deleteTeam, setDeleteTeam] = useState<Team | null>(null);

  // Form
  const [form, setForm] = useState<CreateTeamPayload>(EMPTY_CREATE);
  const [saving, setSaving] = useState(false);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  const fetchTeams = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await teamsApi.getAll({ page, limit: 10, search: debouncedSearch });
      setTeams(res.items);
      setMeta(res.meta);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal memuat tim");
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch]);

  useEffect(() => {
    fetchTeams();
  }, [fetchTeams]);

  // Reset page on search change
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  function openCreate() {
    setForm(EMPTY_CREATE);
    setCreateOpen(true);
  }

  function openEdit(team: Team) {
    setForm({ name: team.name, logo: team.logo, year_founded: team.year_founded, address: team.address, city: team.city });
    setEditTeam(team);
  }

  function handleFormChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: name === "year_founded" ? Number(value) : value }));
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await teamsApi.create(form);
      toast.success("Tim berhasil ditambahkan");
      setCreateOpen(false);
      fetchTeams();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menambahkan tim");
    } finally {
      setSaving(false);
    }
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editTeam) return;
    setSaving(true);
    try {
      const payload: UpdateTeamPayload = { ...form };
      await teamsApi.update(editTeam.id, payload);
      toast.success("Tim berhasil diperbarui");
      setEditTeam(null);
      fetchTeams();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal memperbarui tim");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTeam) return;
    setSaving(true);
    try {
      await teamsApi.delete(deleteTeam.id);
      toast.success("Tim berhasil dihapus");
      setDeleteTeam(null);
      fetchTeams();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menghapus tim");
    } finally {
      setSaving(false);
    }
  }

  const TeamForm = ({ onSubmit }: { onSubmit: (e: React.FormEvent) => void }) => (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className="label mb-1">Nama Tim *</label>
        <input name="name" className="input" value={form.name} onChange={handleFormChange} required minLength={2} maxLength={100} placeholder="Persija Jakarta" />
      </div>
      <div>
        <label className="label mb-1">URL Logo</label>
        <input name="logo" className="input" value={form.logo} onChange={handleFormChange} placeholder="https://example.com/logo.png" type="url" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label mb-1">Tahun Berdiri *</label>
          <input name="year_founded" className="input" type="number" value={form.year_founded} onChange={handleFormChange} required min={1800} max={2100} />
        </div>
        <div>
          <label className="label mb-1">Kota *</label>
          <input name="city" className="input" value={form.city} onChange={handleFormChange} required placeholder="Jakarta" />
        </div>
      </div>
      <div>
        <label className="label mb-1">Alamat Markas *</label>
        <input name="address" className="input" value={form.address} onChange={handleFormChange} required placeholder="Jl. Menteng Raya No.71" />
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <button type="button" className="btn-outline btn" onClick={() => { setCreateOpen(false); setEditTeam(null); }}>Batal</button>
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
            <h1 className="text-2xl font-bold text-gray-900">Tim Sepak Bola</h1>
            <p className="mt-1 text-sm text-gray-500">Kelola semua tim yang dinaungi perusahaan XYZ</p>
          </div>
          <button onClick={openCreate} className="btn-primary btn">
            <Plus size={16} /> Tambah Tim
          </button>
        </div>

        {/* Search */}
        <div className="relative max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            className="input pl-9"
            placeholder="Cari nama atau kota..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Table */}
        <div className="card overflow-hidden">
          {loading ? (
            <LoadingSpinner message="Memuat data tim..." />
          ) : error ? (
            <ErrorMessage message={error} onRetry={fetchTeams} />
          ) : teams.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Building2 size={48} className="mb-3 text-gray-300" />
              <p className="text-sm text-gray-500">Belum ada tim</p>
              <button onClick={openCreate} className="btn-primary btn btn-sm mt-3">Tambah Tim Pertama</button>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-gray-100 bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium text-gray-600">Tim</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-600">Kota</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-600">Berdiri</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-600">Alamat</th>
                      <th className="px-4 py-3 text-right font-medium text-gray-600">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {teams.map((team) => (
                      <tr key={team.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            {team.logo ? (
                              <div className="relative h-9 w-9 flex-shrink-0 overflow-hidden rounded-full border border-gray-200">
                                <Image src={team.logo} alt={team.name} fill className="object-contain" unoptimized />
                              </div>
                            ) : (
                              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-700 font-bold text-sm">
                                {team.name.charAt(0).toUpperCase()}
                              </div>
                            )}
                            <span className="font-medium text-gray-900">{team.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-600">{team.city}</td>
                        <td className="px-4 py-3 text-gray-600">{team.year_founded}</td>
                        <td className="px-4 py-3 text-gray-500 max-w-[200px] truncate">{team.address}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <Link href={`/teams/${team.id}`} className="btn-outline btn btn-sm p-1.5" title="Detail">
                              <Eye size={14} />
                            </Link>
                            <button onClick={() => openEdit(team)} className="btn-outline btn btn-sm p-1.5" title="Edit">
                              <Pencil size={14} />
                            </button>
                            <button onClick={() => setDeleteTeam(team)} className="btn btn-sm p-1.5 border border-red-200 text-red-500 hover:bg-red-50" title="Hapus">
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

      {/* Create Modal */}
      <Modal title="Tambah Tim Baru" open={createOpen} onClose={() => setCreateOpen(false)}>
        <TeamForm onSubmit={handleCreate} />
      </Modal>

      {/* Edit Modal */}
      <Modal title="Edit Tim" open={!!editTeam} onClose={() => setEditTeam(null)}>
        <TeamForm onSubmit={handleEdit} />
      </Modal>

      {/* Delete Confirm */}
      <Modal title="Hapus Tim" open={!!deleteTeam} onClose={() => setDeleteTeam(null)} size="sm">
        <p className="text-sm text-gray-600 mb-5">
          Yakin ingin menghapus tim <span className="font-semibold">{deleteTeam?.name}</span>?
          Data akan dihapus secara permanen (soft delete).
        </p>
        <div className="flex justify-end gap-3">
          <button className="btn-outline btn" onClick={() => setDeleteTeam(null)}>Batal</button>
          <button className="btn-danger btn" onClick={handleDelete} disabled={saving}>
            {saving ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> : null}
            Hapus
          </button>
        </div>
      </Modal>
    </AppShell>
  );
}
