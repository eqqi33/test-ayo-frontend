// ─── Generic API Response ──────────────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  status: "success" | "error";
  message: string;
  data?: T;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface PaginatedData<T> {
  items: T[];
  meta: PaginationMeta;
}

// ─── Auth ──────────────────────────────────────────────────────────────────────

export interface User {
  id: number;
  name: string;
  email: string;
}

export interface AuthLoginData {
  token: string;
  user: User;
}

// ─── Team ──────────────────────────────────────────────────────────────────────

export interface Team {
  id: number;
  name: string;
  logo: string;
  year_founded: number;
  address: string;
  city: string;
  created_at: string;
  updated_at: string;
}

export interface CreateTeamPayload {
  name: string;
  logo?: string;
  year_founded: number;
  address: string;
  city: string;
}

export interface UpdateTeamPayload {
  name?: string;
  logo?: string;
  year_founded?: number;
  address?: string;
  city?: string;
}

// ─── Player ────────────────────────────────────────────────────────────────────

export type PlayerPosition = "penyerang" | "gelandang" | "bertahan" | "penjaga gawang";

export interface Player {
  id: number;
  team_id: number;
  name: string;
  height: number;
  weight: number;
  position: PlayerPosition;
  jersey_number: number;
  created_at: string;
  updated_at: string;
}

export interface CreatePlayerPayload {
  name: string;
  height: number;
  weight: number;
  position: PlayerPosition;
  jersey_number: number;
}

export interface UpdatePlayerPayload {
  name?: string;
  height?: number;
  weight?: number;
  position?: PlayerPosition;
  jersey_number?: number;
}

// ─── Match ────────────────────────────────────────────────────────────────────

export type MatchStatus = "scheduled" | "completed";

export interface Match {
  id: number;
  match_date: string; // "YYYY-MM-DD"
  match_time: string; // "HH:MM"
  home_team_id: number;
  away_team_id: number;
  home_team?: Team;
  away_team?: Team;
  status: MatchStatus;
  created_at: string;
  updated_at: string;
}

export interface CreateMatchPayload {
  match_date: string;
  match_time: string;
  home_team_id: number;
  away_team_id: number;
}

export interface UpdateMatchPayload {
  match_date?: string;
  match_time?: string;
  home_team_id?: number;
  away_team_id?: number;
}

// ─── Match Result ─────────────────────────────────────────────────────────────

export interface GoalDetail {
  player_id: number;
  player_name: string;
  team_name: string;
  minute: number;
}

export interface MatchResult {
  match_id: number;
  home_score: number;
  away_score: number;
  final_status: string;
  goals: GoalDetail[];
  created_at: string;
  updated_at: string;
}

export interface GoalInput {
  player_id: number;
  minute: number;
}

export interface ReportMatchResultPayload {
  home_score: number;
  away_score: number;
  goals: GoalInput[];
}

// ─── Report ───────────────────────────────────────────────────────────────────

export interface TopScorer {
  player_id: number;
  player_name: string;
  team_name: string;
  goal_count: number;
}

export interface MatchReport {
  match_id: number;
  match_date: string;
  match_time: string;
  home_team: string;
  away_team: string;
  home_score: number;
  away_score: number;
  match_status: string;
  top_scorers: TopScorer[];
  home_team_total_wins: number;
  away_team_total_wins: number;
  goals: GoalDetail[];
}
