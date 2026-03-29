import type { ApiResponse, PaginatedData } from "@/types";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080/api/v1";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("auth_token");
}

interface RequestOptions {
  method?: string;
  body?: unknown;
  token?: string | null;
}

async function request<T>(
  path: string,
  { method = "GET", body, token }: RequestOptions = {}
): Promise<T> {
  const resolvedToken = token !== undefined ? token : getToken();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (resolvedToken) {
    headers["Authorization"] = `Bearer ${resolvedToken}`;
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const json: ApiResponse<T> = await res.json();

  if (!res.ok || json.status === "error") {
    throw new Error(json.message ?? "Request failed");
  }

  return json.data as T;
}

// ─── Auth ──────────────────────────────────────────────────────────────────────

export const authApi = {
  register: (payload: { name: string; email: string; password: string }) =>
    request<{ id: number; name: string; email: string }>("/auth/register", {
      method: "POST",
      body: payload,
      token: null,
    }),

  login: (payload: { email: string; password: string }) =>
    request<{ token: string; user: { id: number; name: string; email: string } }>(
      "/auth/login",
      { method: "POST", body: payload, token: null }
    ),

  logout: () =>
    request<null>("/auth/logout", { method: "POST" }),
};

// ─── Teams ────────────────────────────────────────────────────────────────────

export const teamsApi = {
  getAll: (params?: { page?: number; limit?: number; search?: string }) => {
    const qs = new URLSearchParams();
    if (params?.page) qs.set("page", String(params.page));
    if (params?.limit) qs.set("limit", String(params.limit));
    if (params?.search) qs.set("search", params.search);
    return request<PaginatedData<import("@/types").Team>>(`/teams?${qs}`);
  },

  getById: (id: number) =>
    request<import("@/types").Team>(`/teams/${id}`),

  create: (payload: import("@/types").CreateTeamPayload) =>
    request<import("@/types").Team>("/teams", { method: "POST", body: payload }),

  update: (id: number, payload: import("@/types").UpdateTeamPayload) =>
    request<import("@/types").Team>(`/teams/${id}`, { method: "PUT", body: payload }),

  delete: (id: number) =>
    request<null>(`/teams/${id}`, { method: "DELETE" }),
};

// ─── Players ──────────────────────────────────────────────────────────────────

export const playersApi = {
  getByTeam: (
    teamId: number,
    params?: { page?: number; limit?: number; search?: string; position?: string }
  ) => {
    const qs = new URLSearchParams();
    if (params?.page) qs.set("page", String(params.page));
    if (params?.limit) qs.set("limit", String(params.limit));
    if (params?.search) qs.set("search", params.search);
    if (params?.position) qs.set("position", params.position);
    return request<PaginatedData<import("@/types").Player>>(
      `/teams/${teamId}/players?${qs}`
    );
  },

  getById: (id: number) =>
    request<import("@/types").Player>(`/players/${id}`),

  create: (teamId: number, payload: import("@/types").CreatePlayerPayload) =>
    request<import("@/types").Player>(`/teams/${teamId}/players`, {
      method: "POST",
      body: payload,
    }),

  update: (id: number, payload: import("@/types").UpdatePlayerPayload) =>
    request<import("@/types").Player>(`/players/${id}`, {
      method: "PUT",
      body: payload,
    }),

  delete: (id: number) =>
    request<null>(`/players/${id}`, { method: "DELETE" }),
};

// ─── Matches ──────────────────────────────────────────────────────────────────

export const matchesApi = {
  getAll: (params?: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
  }) => {
    const qs = new URLSearchParams();
    if (params?.page) qs.set("page", String(params.page));
    if (params?.limit) qs.set("limit", String(params.limit));
    if (params?.status) qs.set("status", params.status);
    if (params?.search) qs.set("search", params.search);
    return request<PaginatedData<import("@/types").Match>>(`/matches?${qs}`);
  },

  getById: (id: number) =>
    request<import("@/types").Match>(`/matches/${id}`),

  create: (payload: import("@/types").CreateMatchPayload) =>
    request<import("@/types").Match>("/matches", { method: "POST", body: payload }),

  update: (id: number, payload: import("@/types").UpdateMatchPayload) =>
    request<import("@/types").Match>(`/matches/${id}`, {
      method: "PUT",
      body: payload,
    }),

  delete: (id: number) =>
    request<null>(`/matches/${id}`, { method: "DELETE" }),

  getResult: (id: number) =>
    request<import("@/types").MatchResult>(`/matches/${id}/result`),

  reportResult: (id: number, payload: import("@/types").ReportMatchResultPayload) =>
    request<import("@/types").MatchResult>(`/matches/${id}/result`, {
      method: "POST",
      body: payload,
    }),
};

// ─── Reports ──────────────────────────────────────────────────────────────────

export const reportsApi = {
  getAll: (params?: { page?: number; limit?: number }) => {
    const qs = new URLSearchParams();
    if (params?.page) qs.set("page", String(params.page));
    if (params?.limit) qs.set("limit", String(params.limit));
    return request<PaginatedData<import("@/types").MatchReport>>(
      `/reports/matches?${qs}`
    );
  },

  getByMatchId: (matchId: number) =>
    request<import("@/types").MatchReport>(`/reports/matches/${matchId}`),
};
