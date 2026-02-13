import type { User } from "@/types/auth";
import type { Workspace, Pagination } from "@/types/workspace";
import type { Document } from "@/types/document";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";

export type AuthHelpers = {
  getAccessToken: () => string | null;
  refreshAndGetToken: () => Promise<string | null>;
};

async function request<T>(
  path: string,
  options: RequestInit & { token?: string } = {}
): Promise<{ success: true; data: T } | { success: false; error: { code: string; message: string } }> {
  const { token, ...init } = options;
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(init.headers as Record<string, string>),
  };
  if (token) {
    (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
  }
  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, { ...init, headers });
  } catch (err) {
    const message =
      err instanceof TypeError && err.message === "Failed to fetch"
        ? "Could not reach the server. Make sure the backend is running."
        : err instanceof Error ? err.message : "Network error";
    return { success: false, error: { code: "NETWORK_ERROR", message } };
  }
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    return {
      success: false,
      error: json?.error ?? { code: "REQUEST_FAILED", message: res.statusText },
    };
  }
  return json as { success: true; data: T };
}

type ApiError = { code: string; message: string };
type ApiResult<T> = { success: true; data: T } | { success: false; error: ApiError };
type AnyApiResult = ApiResult<unknown> | ({ success: true } & Record<string, unknown>) | ({ success: false; error: ApiError });

/** Run an authenticated request; on 401 tries refresh once and retries. Use with auth from useAuth(). */
async function withAuthRetry<R extends AnyApiResult>(
  run: (token: string) => Promise<R>,
  auth: AuthHelpers
): Promise<R> {
  let token = auth.getAccessToken();
  if (!token) token = await auth.refreshAndGetToken();
  if (!token) return { success: false, error: { code: "UNAUTHORIZED", message: "Session expired. Please sign in again." } } as R;
  let result = await run(token);
  if (!result.success && "error" in result && result.error?.code === "UNAUTHORIZED") {
    const newToken = await auth.refreshAndGetToken();
    if (newToken) {
      result = await run(newToken);
    } else {
      return { success: false, error: { code: "UNAUTHORIZED", message: "Session expired. Please sign in again." } } as R;
    }
  }
  return result;
}

/** GET /api/auth/google → { url } */
export async function getGoogleAuthUrl(): Promise<
  { success: true; data: { url: string } } | { success: false; error: { code: string; message: string } }
> {
  return request<{ url: string }>("/api/auth/google");
}

/** POST /api/auth/google/callback with { code } */
export async function exchangeCodeForTokens(code: string): Promise<
  | { success: true; data: { user: User; accessToken: string; refreshToken: string; expiresIn: number } }
  | { success: false; error: { code: string; message: string } }
> {
  return request<{ user: User; accessToken: string; refreshToken: string; expiresIn: number }>(
    "/api/auth/google/callback",
    { method: "POST", body: JSON.stringify({ code }) }
  );
}

/** GET /api/auth/me with Bearer token */
export async function getMe(token: string): Promise<
  | { success: true; data: User & { workspaces?: string[] } }
  | { success: false; error: { code: string; message: string } }
> {
  return request<User & { workspaces?: string[] }>("/api/auth/me", { token });
}

/** PATCH /api/auth/me with Bearer token. Body: { name?: string, avatar?: string } */
export async function patchMe(
  token: string,
  data: { name?: string; avatar?: string }
): Promise<
  | { success: true; data: User & { workspaces?: string[] } }
  | { success: false; error: { code: string; message: string } }
> {
  return request<User & { workspaces?: string[] }>("/api/auth/me", {
    method: "PATCH",
    token,
    body: JSON.stringify(data),
  });
}

/** POST /api/auth/me/avatar with Bearer token. FormData with field "avatar" (file). Returns updated user. */
export async function uploadAvatarPhoto(
  token: string,
  file: File
): Promise<
  | { success: true; data: User & { workspaces?: string[] } }
  | { success: false; error: { code: string; message: string } }
> {
  const formData = new FormData();
  formData.append("avatar", file);
  let res: Response;
  try {
    res = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000"}/api/auth/me/avatar`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
  } catch (err) {
    const message =
      err instanceof TypeError && err.message === "Failed to fetch"
        ? "Could not reach the server. Make sure the backend is running."
        : err instanceof Error ? err.message : "Network error";
    return { success: false, error: { code: "NETWORK_ERROR", message } };
  }
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    return {
      success: false,
      error: json?.error ?? { code: "REQUEST_FAILED", message: res.statusText },
    };
  }
  return json as { success: true; data: User & { workspaces?: string[] } };
}

/** GET /api/analytics/me – streak, activity grid, doc/workspace counts. */
export interface AnalyticsData {
  streak: number;
  lastActiveDate: string | null;
  days: Array<{ date: string; count: number }>;
  totalDocuments: number;
  totalWorkspaces: number;
}
export async function getAnalytics(
  tokenOrAuth: string | AuthHelpers
): Promise<
  | { success: true; data: AnalyticsData }
  | { success: false; error: { code: string; message: string } }
> {
  type Result = { success: true; data: AnalyticsData } | { success: false; error: { code: string; message: string } };
  const run = async (token: string): Promise<Result> => {
    let res: Response;
    try {
      res = await fetch(`${API_BASE}/api/analytics/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (err) {
      const message =
        err instanceof TypeError && err.message === "Failed to fetch"
          ? "Could not reach the server."
          : err instanceof Error ? err.message : "Network error";
      return { success: false, error: { code: "NETWORK_ERROR", message } };
    }
    const json = await res.json().catch(() => ({}));
    if (!res.ok) return { success: false, error: json?.error ?? { code: "REQUEST_FAILED", message: res.statusText } };
    return { success: true, data: json.data };
  };
  if (typeof tokenOrAuth === "string") return run(tokenOrAuth);
  return withAuthRetry(run, tokenOrAuth);
}

/** POST /api/auth/refresh with { refreshToken } */
export async function refreshAccessToken(refreshToken: string): Promise<
  | { success: true; data: { accessToken: string; expiresIn: number } }
  | { success: false; error: { code: string; message: string } }
> {
  return request<{ accessToken: string; expiresIn: number }>("/api/auth/refresh", {
    method: "POST",
    body: JSON.stringify({ refreshToken }),
  });
}

// --- Workspaces ---

/** GET /api/workspaces. Pass auth from useAuth() for auto token refresh on 401. */
export async function listWorkspaces(
  tokenOrAuth: string | AuthHelpers,
  page: number = 1,
  limit: number = 20
): Promise<
  | { success: true; data: Workspace[]; pagination: Pagination }
  | { success: false; error: { code: string; message: string } }
> {
  type ListResult = { success: true; data: Workspace[]; pagination: Pagination } | { success: false; error: { code: string; message: string } };
  const run = async (token: string): Promise<ListResult> => {
    let res: Response;
    try {
      res = await fetch(`${API_BASE}/api/workspaces?page=${page}&limit=${limit}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (err) {
      const message =
        err instanceof TypeError && err.message === "Failed to fetch"
          ? "Could not reach the server."
          : err instanceof Error ? err.message : "Network error";
      return { success: false, error: { code: "NETWORK_ERROR", message } };
    }
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { success: false, error: json?.error ?? { code: "REQUEST_FAILED", message: res.statusText } };
    }
    return {
      success: true,
      data: json.data ?? [],
      pagination: json.pagination ?? { page: 1, limit: 20, total: 0, totalPages: 0 },
    };
  };
  if (typeof tokenOrAuth === "string") return run(tokenOrAuth);
  return withAuthRetry(run, tokenOrAuth);
}

/** POST /api/workspaces body: { name, description? }. Pass auth from useAuth() for auto refresh. */
export async function createWorkspace(
  tokenOrAuth: string | AuthHelpers,
  name: string,
  description?: string
): Promise<
  | { success: true; data: Workspace }
  | { success: false; error: { code: string; message: string } }
> {
  if (typeof tokenOrAuth === "string") {
    return request<Workspace>("/api/workspaces", {
      method: "POST",
      token: tokenOrAuth,
      body: JSON.stringify({ name: name.trim(), description: description?.trim() || undefined }),
    });
  }
  return withAuthRetry(
    (token) =>
      request<Workspace>("/api/workspaces", {
        method: "POST",
        token,
        body: JSON.stringify({ name: name.trim(), description: description?.trim() || undefined }),
      }),
    tokenOrAuth
  );
}

/** GET /api/workspaces/:id. Pass auth from useAuth() for auto refresh. */
export async function getWorkspace(
  tokenOrAuth: string | AuthHelpers,
  id: string
): Promise<
  | { success: true; data: Workspace }
  | { success: false; error: { code: string; message: string } }
> {
  if (typeof tokenOrAuth === "string") return request<Workspace>(`/api/workspaces/${id}`, { token: tokenOrAuth });
  return withAuthRetry((token) => request<Workspace>(`/api/workspaces/${id}`, { token }), tokenOrAuth);
}

/** PATCH /api/workspaces/:id. Pass auth from useAuth() for auto refresh. */
export async function updateWorkspace(
  tokenOrAuth: string | AuthHelpers,
  id: string,
  updates: { name?: string; description?: string }
): Promise<
  | { success: true; data: Workspace }
  | { success: false; error: { code: string; message: string } }
> {
  if (typeof tokenOrAuth === "string") {
    return request<Workspace>(`/api/workspaces/${id}`, {
      method: "PATCH",
      token: tokenOrAuth,
      body: JSON.stringify(updates),
    });
  }
  return withAuthRetry(
    (token) =>
      request<Workspace>(`/api/workspaces/${id}`, {
        method: "PATCH",
        token,
        body: JSON.stringify(updates),
      }),
    tokenOrAuth
  );
}

/** DELETE /api/workspaces/:id. Pass auth from useAuth() for auto refresh. */
export async function deleteWorkspace(
  tokenOrAuth: string | AuthHelpers,
  id: string
): Promise<
  | { success: true }
  | { success: false; error: { code: string; message: string } }
> {
  type Result = { success: true } | { success: false; error: { code: string; message: string } };
  const run = async (token: string): Promise<Result> => {
    let res: Response;
    try {
      res = await fetch(`${API_BASE}/api/workspaces/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (err) {
      const message =
        err instanceof TypeError && err.message === "Failed to fetch"
          ? "Could not reach the server."
          : err instanceof Error ? err.message : "Network error";
      return { success: false, error: { code: "NETWORK_ERROR", message } };
    }
    if (res.status === 204) return { success: true };
    const json = await res.json().catch(() => ({}));
    if (!res.ok) return { success: false, error: json?.error ?? { code: "REQUEST_FAILED", message: res.statusText } };
    return { success: true };
  };
  if (typeof tokenOrAuth === "string") return run(tokenOrAuth);
  return withAuthRetry(run, tokenOrAuth);
}

// --- Workspace members (collaboration) ---

/** POST /api/workspaces/:id/invite. Pass auth from useAuth() for auto refresh. */
export async function inviteWorkspaceByEmail(
  tokenOrAuth: string | AuthHelpers,
  workspaceId: string,
  email: string,
  role: "admin" | "editor" | "viewer" = "viewer"
): Promise<
  | { success: true; data: Workspace }
  | { success: false; error: { code: string; message: string } }
> {
  if (typeof tokenOrAuth === "string") {
    return request<Workspace>(`/api/workspaces/${workspaceId}/invite`, {
      method: "POST",
      token: tokenOrAuth,
      body: JSON.stringify({ email: email.trim().toLowerCase(), role }),
    });
  }
  return withAuthRetry(
    (token) =>
      request<Workspace>(`/api/workspaces/${workspaceId}/invite`, {
        method: "POST",
        token,
        body: JSON.stringify({ email: email.trim().toLowerCase(), role }),
      }),
    tokenOrAuth
  );
}

/** DELETE /api/workspaces/:id/members/:userId. Pass auth from useAuth() for auto refresh. */
export async function removeWorkspaceMember(
  tokenOrAuth: string | AuthHelpers,
  workspaceId: string,
  userId: string
): Promise<
  | { success: true }
  | { success: false; error: { code: string; message: string } }
> {
  type Result = { success: true } | { success: false; error: { code: string; message: string } };
  const run = async (token: string): Promise<Result> => {
    let res: Response;
    try {
      res = await fetch(`${API_BASE}/api/workspaces/${workspaceId}/members/${userId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (err) {
      const message =
        err instanceof TypeError && err.message === "Failed to fetch"
          ? "Could not reach the server."
          : err instanceof Error ? err.message : "Network error";
      return { success: false, error: { code: "NETWORK_ERROR", message } };
    }
    if (res.status === 200 || res.status === 204) return { success: true };
    const json = await res.json().catch(() => ({}));
    if (!res.ok) return { success: false, error: json?.error ?? { code: "REQUEST_FAILED", message: res.statusText } };
    return { success: true };
  };
  if (typeof tokenOrAuth === "string") return run(tokenOrAuth);
  return withAuthRetry(run, tokenOrAuth);
}

/** PATCH /api/workspaces/:id/members/:userId/role. Pass auth from useAuth() for auto refresh. */
export async function updateWorkspaceMemberRole(
  tokenOrAuth: string | AuthHelpers,
  workspaceId: string,
  userId: string,
  role: "admin" | "editor" | "viewer"
): Promise<
  | { success: true; data: Workspace }
  | { success: false; error: { code: string; message: string } }
> {
  if (typeof tokenOrAuth === "string") {
    return request<Workspace>(`/api/workspaces/${workspaceId}/members/${userId}/role`, {
      method: "PATCH",
      token: tokenOrAuth,
      body: JSON.stringify({ role }),
    });
  }
  return withAuthRetry(
    (token) =>
      request<Workspace>(`/api/workspaces/${workspaceId}/members/${userId}/role`, {
        method: "PATCH",
        token,
        body: JSON.stringify({ role }),
      }),
    tokenOrAuth
  );
}

// --- Documents ---

/** GET /api/documents/workspace/:workspaceId. Pass auth from useAuth() for auto refresh. */
export async function listDocumentsByWorkspace(
  tokenOrAuth: string | AuthHelpers,
  workspaceId: string,
  page: number = 1,
  limit: number = 50
): Promise<
  | { success: true; data: Document[]; pagination: Pagination }
  | { success: false; error: { code: string; message: string } }
> {
  type Result = { success: true; data: Document[]; pagination: Pagination } | { success: false; error: { code: string; message: string } };
  const run = async (token: string): Promise<Result> => {
    let res: Response;
    try {
      res = await fetch(
        `${API_BASE}/api/documents/workspace/${workspaceId}?page=${page}&limit=${limit}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (err) {
      const message =
        err instanceof TypeError && err.message === "Failed to fetch"
          ? "Could not reach the server."
          : err instanceof Error ? err.message : "Network error";
      return { success: false, error: { code: "NETWORK_ERROR", message } };
    }
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { success: false, error: json?.error ?? { code: "REQUEST_FAILED", message: res.statusText } };
    }
    return {
      success: true,
      data: json.data ?? [],
      pagination: json.pagination ?? { page: 1, limit: 50, total: 0, totalPages: 0 },
    };
  };
  if (typeof tokenOrAuth === "string") return run(tokenOrAuth);
  return withAuthRetry(run, tokenOrAuth);
}

/** POST /api/documents/upload. Pass auth from useAuth() for auto refresh. */
export async function uploadDocument(
  tokenOrAuth: string | AuthHelpers,
  workspaceId: string,
  file: File
): Promise<
  | { success: true; data: Document }
  | { success: false; error: { code: string; message: string } }
> {
  type Result = { success: true; data: Document } | { success: false; error: { code: string; message: string } };
  const run = async (token: string): Promise<Result> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("workspaceId", workspaceId);
    let res: Response;
    try {
      res = await fetch(`${API_BASE}/api/documents/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
    } catch (err) {
      const message =
        err instanceof TypeError && err.message === "Failed to fetch"
          ? "Could not reach the server."
          : err instanceof Error ? err.message : "Network error";
      return { success: false, error: { code: "NETWORK_ERROR", message } };
    }
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { success: false, error: json?.error ?? { code: "REQUEST_FAILED", message: res.statusText } };
    }
    return json as { success: true; data: Document };
  };
  if (typeof tokenOrAuth === "string") return run(tokenOrAuth);
  return withAuthRetry(run, tokenOrAuth);
}

/** GET /api/documents/:id */
export async function getDocument(
  token: string,
  id: string
): Promise<
  | { success: true; data: Document }
  | { success: false; error: { code: string; message: string } }
> {
  return request<Document>(`/api/documents/${id}`, { token });
}

/** POST /api/documents/:id/summarize – AI summary (Vercel AI SDK + Gemini). Returns and stores summary on document. */
export async function summarizeDocument(
  tokenOrAuth: string | AuthHelpers,
  id: string
): Promise<
  | { success: true; data: { summary: string } }
  | { success: false; error: { code: string; message: string } }
> {
  type Result = { success: true; data: { summary: string } } | { success: false; error: { code: string; message: string } };
  const run = async (token: string): Promise<Result> => {
    let res: Response;
    try {
      res = await fetch(`${API_BASE}/api/documents/${id}/summarize`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (err) {
      const message =
        err instanceof TypeError && err.message === "Failed to fetch"
          ? "Could not reach the server."
          : err instanceof Error ? err.message : "Network error";
      return { success: false, error: { code: "NETWORK_ERROR", message } };
    }
    const json = await res.json().catch(() => ({}));
    if (!res.ok) return { success: false, error: json?.error ?? { code: "REQUEST_FAILED", message: res.statusText } };
    return { success: true, data: { summary: (json as { data?: { summary?: string } }).data?.summary ?? "" } };
  };
  if (typeof tokenOrAuth === "string") return run(tokenOrAuth);
  return withAuthRetry(run, tokenOrAuth);
}

/** POST /api/documents/summarize-file – one-off upload, get AI summary (no workspace). */
export async function summarizeFile(
  tokenOrAuth: string | AuthHelpers,
  file: File
): Promise<
  | { success: true; data: { summary: string } }
  | { success: false; error: { code: string; message: string } }
> {
  type Result = { success: true; data: { summary: string } } | { success: false; error: { code: string; message: string } };
  const run = async (token: string): Promise<Result> => {
    const formData = new FormData();
    formData.append("file", file);
    let res: Response;
    try {
      res = await fetch(`${API_BASE}/api/documents/summarize-file`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
    } catch (err) {
      const message =
        err instanceof TypeError && err.message === "Failed to fetch"
          ? "Could not reach the server."
          : err instanceof Error ? err.message : "Network error";
      return { success: false, error: { code: "NETWORK_ERROR", message } };
    }
    const json = await res.json().catch(() => ({}));
    if (!res.ok) return { success: false, error: json?.error ?? { code: "REQUEST_FAILED", message: res.statusText } };
    return { success: true, data: { summary: (json as { data?: { summary?: string } }).data?.summary ?? "" } };
  };
  if (typeof tokenOrAuth === "string") return run(tokenOrAuth);
  return withAuthRetry(run, tokenOrAuth);
}

/** POST /api/documents/:id/ask – streamed answer (Vercel AI SDK + Gemini). Reads full response as text. */
export async function askDocument(
  tokenOrAuth: string | AuthHelpers,
  id: string,
  question: string
): Promise<
  | { success: true; data: { text: string } }
  | { success: false; error: { code: string; message: string } }
> {
  type Result = { success: true; data: { text: string } } | { success: false; error: { code: string; message: string } };
  const run = async (token: string): Promise<Result> => {
    let res: Response;
    try {
      res = await fetch(`${API_BASE}/api/documents/${id}/ask`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ question: question.trim() }),
      });
    } catch (err) {
      const message =
        err instanceof TypeError && err.message === "Failed to fetch"
          ? "Could not reach the server."
          : err instanceof Error ? err.message : "Network error";
      return { success: false, error: { code: "NETWORK_ERROR", message } };
    }
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      return { success: false, error: json?.error ?? { code: "REQUEST_FAILED", message: res.statusText } };
    }
    const text = await res.text();
    return { success: true, data: { text } };
  };
  if (typeof tokenOrAuth === "string") return run(tokenOrAuth);
  return withAuthRetry(run, tokenOrAuth);
}

/** GET /api/documents/:id/download. Pass auth from useAuth() for auto refresh. */
export async function downloadDocument(
  tokenOrAuth: string | AuthHelpers,
  id: string
): Promise<
  | { success: true; blob: Blob; filename: string }
  | { success: false; error: { code: string; message: string } }
> {
  type Result = { success: true; blob: Blob; filename: string } | { success: false; error: { code: string; message: string } };
  const run = async (token: string): Promise<Result> => {
    let res: Response;
    try {
      res = await fetch(`${API_BASE}/api/documents/${id}/download`, {
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (err) {
      const message =
        err instanceof TypeError && err.message === "Failed to fetch"
          ? "Could not reach the server."
          : err instanceof Error ? err.message : "Network error";
      return { success: false, error: { code: "NETWORK_ERROR", message } };
    }
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      return { success: false, error: json?.error ?? { code: "REQUEST_FAILED", message: res.statusText } };
    }
    const blob = await res.blob();
    const disposition = res.headers.get("Content-Disposition");
    const filenameMatch = disposition?.match(/filename="?([^";\n]+)"?/);
    const filename = filenameMatch?.[1]?.trim() ?? "document";
    return { success: true, blob, filename };
  };
  if (typeof tokenOrAuth === "string") return run(tokenOrAuth);
  return withAuthRetry(run, tokenOrAuth);
}

/** DELETE /api/documents/:id. Pass auth from useAuth() for auto refresh. */
export async function deleteDocument(
  tokenOrAuth: string | AuthHelpers,
  id: string
): Promise<
  | { success: true }
  | { success: false; error: { code: string; message: string } }
> {
  type Result = { success: true } | { success: false; error: { code: string; message: string } };
  const run = async (token: string): Promise<Result> => {
    let res: Response;
    try {
      res = await fetch(`${API_BASE}/api/documents/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (err) {
      const message =
        err instanceof TypeError && err.message === "Failed to fetch"
          ? "Could not reach the server."
          : err instanceof Error ? err.message : "Network error";
      return { success: false, error: { code: "NETWORK_ERROR", message } };
    }
    if (res.status === 204) return { success: true };
    const json = await res.json().catch(() => ({}));
    if (!res.ok) return { success: false, error: json?.error ?? { code: "REQUEST_FAILED", message: res.statusText } };
    return { success: true };
  };
  if (typeof tokenOrAuth === "string") return run(tokenOrAuth);
  return withAuthRetry(run, tokenOrAuth);
}
