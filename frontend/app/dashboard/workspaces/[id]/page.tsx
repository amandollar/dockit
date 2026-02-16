"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { Button } from "@/components/ui/button";
import {
  getWorkspace,
  updateWorkspace,
  deleteWorkspace,
  inviteWorkspaceByEmail,
  removeWorkspaceMember,
  updateWorkspaceMemberRole,
  listDocumentsByWorkspace,
  uploadDocument,
  downloadDocument,
  deleteDocument,
  summarizeDocument,
  askDocument,
} from "@/lib/api";
import type { Workspace, WorkspaceMemberRole } from "@/types/workspace";
import type { Document } from "@/types/document";
import { useWorkspaceChat } from "@/lib/use-workspace-chat";
import { WorkspaceChatPanel } from "@/components/dashboard/workspace-chat-panel";
import { ArrowLeft, FileText, Pencil, Trash2, Loader2, Upload, Download, UserPlus, Users, FileStack, Sparkles, MessageCircle } from "lucide-react";
import { isAllowedFile, ALLOWED_ACCEPT, SUPPORTED_TYPES_LABEL } from "@/lib/document-types";

export default function WorkspaceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { user: currentUser, isAuthenticated, loading: authLoading, getAccessToken, refreshAndGetToken } = useAuth();
  const auth = useMemo(() => ({ getAccessToken, refreshAndGetToken }), [getAccessToken, refreshAndGetToken]);
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Documents
  const [documents, setDocuments] = useState<Document[]>([]);
  const [docsLoading, setDocsLoading] = useState(false);
  const [docsError, setDocsError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [summarizingId, setSummarizingId] = useState<string | null>(null);
  const [summarizeError, setSummarizeError] = useState<string | null>(null);
  const [askDocId, setAskDocId] = useState<string | null>(null);
  const [askQuestion, setAskQuestion] = useState("");
  const [askAnswer, setAskAnswer] = useState<string | null>(null);
  const [askLoading, setAskLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const askDocIdRef = useRef<string | null>(null);
  askDocIdRef.current = askDocId;

  // Members (collaboration)
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<WorkspaceMemberRole>("viewer");
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [removingMemberId, setRemovingMemberId] = useState<string | null>(null);
  const [updatingRoleId, setUpdatingRoleId] = useState<string | null>(null);

  const { messages: chatMessages, status: chatStatus, errorMessage: chatError, send: sendChatMessage, reconnect: reconnectChat } = useWorkspaceChat(id, getAccessToken);

  const fetchWorkspace = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    const res = await getWorkspace(auth, id);
    setLoading(false);
    if (res.success) {
      setWorkspace(res.data);
      setEditName(res.data.name);
      setEditDescription(res.data.description ?? "");
    } else {
      setError(res.error?.message ?? "Workspace not found");
    }
  }, [auth, id]);

  const fetchDocuments = useCallback(async () => {
    if (!id) return;
    setDocsLoading(true);
    setDocsError(null);
    const res = await listDocumentsByWorkspace(auth, id);
    setDocsLoading(false);
    if (res.success) setDocuments(res.data);
    else setDocsError(res.error?.message ?? "Failed to load documents");
  }, [auth, id]);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      window.location.href = "/";
      return;
    }
    if (isAuthenticated && id) fetchWorkspace();
  }, [authLoading, isAuthenticated, id, fetchWorkspace]);

  useEffect(() => {
    if (isAuthenticated && id && workspace) fetchDocuments();
  }, [isAuthenticated, id, workspace, fetchDocuments]);

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setSaveError(null);
    setSaving(true);
    const res = await updateWorkspace(auth, id, {
      name: editName.trim(),
      description: editDescription.trim() || undefined,
    });
    setSaving(false);
    if (res.success) {
      setWorkspace(res.data);
      setEditing(false);
    } else {
      setSaveError(res.error?.message ?? "Failed to update");
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    setDeleting(true);
    const res = await deleteWorkspace(auth, id);
    setDeleting(false);
    setConfirmDelete(false);
    if (res.success) {
      router.push("/dashboard/workspaces");
    }
  };

  const processFiles = useCallback(
    async (files: FileList | null) => {
      if (!files?.length || !id) return;
      setUploadError(null);
      const accepted = Array.from(files).filter(isAllowedFile);
      if (accepted.length === 0) {
        setUploadError(`Please select documents (${SUPPORTED_TYPES_LABEL}).`);
        return;
      }
      if (accepted.length !== files.length) setUploadError("Some files were skipped (unsupported type).");
      setUploading(true);
      const added: Document[] = [];
      for (let i = 0; i < accepted.length; i++) {
        setUploadProgress(accepted.length > 1 ? `Uploading ${i + 1} of ${accepted.length}…` : null);
        const res = await uploadDocument(auth, id, accepted[i]);
        if (res.success) added.push(res.data);
        else setUploadError(res.error?.message ?? "Upload failed");
      }
      setUploadProgress(null);
      setUploading(false);
      if (added.length) setDocuments((prev) => [...added, ...prev]);
    },
    [auth, id]
  );

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    await processFiles(e.target.files);
    e.target.value = "";
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      processFiles(e.dataTransfer.files);
    },
    [processFiles]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!e.currentTarget.contains(e.relatedTarget as Node)) setIsDragging(false);
  }, []);

  const handleDownload = async (doc: Document) => {
    const res = await downloadDocument(auth, doc._id);
    if (!res.success) return;
    const url = URL.createObjectURL(res.blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = res.filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDeleteDocument = async (docId: string) => {
    setDeletingId(docId);
    const res = await deleteDocument(auth, docId);
    setDeletingId(null);
    if (res.success) setDocuments((prev) => prev.filter((d) => d._id !== docId));
  };

  const handleSummarize = async (doc: Document) => {
    setSummarizeError(null);
    setSummarizingId(doc._id);
    const res = await summarizeDocument(auth, doc._id);
    setSummarizingId(null);
    if (res.success) {
      setDocuments((prev) => prev.map((d) => (d._id === doc._id ? { ...d, summary: res.data.summary } : d)));
    } else {
      setSummarizeError(res.error?.message ?? "Summarization failed");
    }
  };

  const handleAsk = async (docId: string) => {
    if (!askQuestion.trim()) return;
    setAskLoading(true);
    setAskAnswer(null);
    const requestedDocId = docId;
    const res = await askDocument(auth, docId, askQuestion.trim());
    setAskLoading(false);
    // Only show answer if user is still viewing the same doc's ask panel (avoid showing A's answer under B)
    if (askDocIdRef.current !== requestedDocId) return;
    if (res.success) setAskAnswer(res.data.text);
    else setAskAnswer(`Error: ${res.error?.message ?? "Request failed"}`);
  };

  // Collaboration: current user is admin if they are owner or have admin role in members
  const isAdmin =
    workspace &&
    currentUser &&
    (() => {
      const ownerId = typeof workspace.owner === "object" ? workspace.owner._id : workspace.owner;
      if (ownerId === currentUser.id) return true;
      const member = workspace.members.find((m) => {
        const uid = typeof m.user === "object" ? m.user._id : m.user;
        return uid === currentUser.id;
      });
      return member?.role === "admin";
    })();

  const canUpload =
    workspace &&
    currentUser &&
    (() => {
      const ownerId = typeof workspace.owner === "object" ? workspace.owner._id : workspace.owner;
      if (ownerId === currentUser.id) return true;
      const member = workspace.members.find((m) => {
        const uid = typeof m.user === "object" ? m.user._id : m.user;
        return uid === currentUser.id;
      });
      return member?.role === "admin" || member?.role === "editor";
    })();

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !inviteEmail.trim()) return;
    setInviteError(null);
    setInviting(true);
    const res = await inviteWorkspaceByEmail(auth, id, inviteEmail.trim(), inviteRole);
    setInviting(false);
    if (res.success) {
      setWorkspace(res.data);
      setInviteEmail("");
      setInviteRole("viewer");
    } else {
      setInviteError(res.error?.message ?? "Invite failed");
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!id) return;
    setRemovingMemberId(userId);
    const res = await removeWorkspaceMember(auth, id, userId);
    setRemovingMemberId(null);
    if (res.success) fetchWorkspace();
  };

  const handleRoleChange = async (userId: string, role: WorkspaceMemberRole) => {
    if (!id) return;
    setUpdatingRoleId(userId);
    const res = await updateWorkspaceMemberRole(auth, id, userId, role);
    setUpdatingRoleId(null);
    if (res.success) setWorkspace(res.data);
  };

  const getUserId = (u: { _id: string } | string): string => (typeof u === "object" ? u._id : u);
  const getDisplayName = (u: { name?: string; email?: string } | string): string =>
    typeof u === "object" ? u.name || u.email || "—" : "—";
  const getDisplayEmail = (u: { email?: string } | string): string =>
    typeof u === "object" ? u.email || "" : "";

  const formatFileSize = (bytes: number): string =>
    bytes >= 1024 * 1024 ? `${(bytes / (1024 * 1024)).toFixed(1)} MB` : `${(bytes / 1024).toFixed(1)} KB`;
  const formatDocDate = (dateStr: string): string => {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: d.getFullYear() !== now.getFullYear() ? "numeric" : undefined });
  };

  if (authLoading) {
    return (
      <main className="min-h-screen bg-[#FDFBF7] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-neutral-300 border-t-neutral-900 rounded-full animate-spin" />
      </main>
    );
  }
  if (!isAuthenticated) return null;

  if (loading) {
    return (
      <main className="min-h-screen bg-[#FDFBF7]">
        <DashboardHeader />
        <div className="container mx-auto px-4 py-12 flex items-center gap-2 text-neutral-500">
          <Loader2 className="w-5 h-5 animate-spin" />
          Loading workspace…
        </div>
      </main>
    );
  }

  if (error || !workspace) {
    return (
      <main className="min-h-screen bg-[#FDFBF7]">
        <DashboardHeader />
        <div className="container mx-auto px-4 py-12">
          <Link href="/dashboard/workspaces" className="text-neutral-600 hover:text-neutral-900 text-sm mb-6 inline-block">
            ← Back to workspaces
          </Link>
          <p className="text-red-600">{error ?? "Workspace not found"}</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#FDFBF7]">
      <DashboardHeader />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-10 max-w-6xl">
        <Link
          href="/dashboard/workspaces"
          className="inline-flex items-center gap-2 text-neutral-600 hover:text-neutral-900 text-sm mb-6 font-medium transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to workspaces
        </Link>

        <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-8 xl:gap-10 items-start">
          <div className="space-y-6 min-w-0">
          {/* Workspace info — standard card */}
          <div className="bg-white border border-neutral-200 rounded-lg shadow-sm p-6">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="min-w-0 flex-1">
                {!editing ? (
                  <>
                    <h1 className="text-xl font-semibold text-neutral-900">{workspace.name}</h1>
                    {workspace.description && (
                      <p className="text-neutral-600 text-sm mt-1">{workspace.description}</p>
                    )}
                  </>
                ) : (
                  <form onSubmit={handleSaveEdit} className="space-y-3 max-w-md">
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1">Name</label>
                      <input
                        type="text"
                        required
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full rounded border border-neutral-300 px-3 py-2 text-neutral-900 text-sm focus:border-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1">Description</label>
                      <input
                        type="text"
                        placeholder="Optional"
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                        className="w-full rounded border border-neutral-300 px-3 py-2 text-neutral-900 text-sm placeholder:text-neutral-400 focus:border-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-500"
                      />
                    </div>
                    {saveError && <p className="text-red-600 text-sm">{saveError}</p>}
                    <div className="flex gap-2">
                      <Button type="submit" size="sm" disabled={saving}>
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save"}
                      </Button>
                      <Button type="button" variant="outline" size="sm" onClick={() => setEditing(false)}>
                        Cancel
                      </Button>
                    </div>
                  </form>
                )}
              </div>
              {!editing && isAdmin && (
                <div className="flex gap-2 shrink-0">
                  <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
                    <Pencil className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                  {!confirmDelete ? (
                    <Button variant="outline" size="sm" onClick={() => setConfirmDelete(true)}>
                      <Trash2 className="w-4 h-4 mr-1" />
                      Delete
                    </Button>
                  ) : (
                    <div className="flex gap-2 items-center">
                      <span className="text-sm text-neutral-500">Delete workspace?</span>
                      <Button size="sm" onClick={handleDelete} disabled={deleting}>
                        {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Yes"}
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setConfirmDelete(false)}>
                        No
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Members section */}
          <div className="bg-white border border-neutral-200 rounded-lg shadow-sm p-6">
            <h2 className="text-sm font-semibold text-neutral-900 uppercase tracking-wide flex items-center gap-2 mb-4">
              <Users className="w-4 h-4 text-neutral-500" />
              Members
            </h2>
            <ul className="space-y-2 mb-6">
              {/* Owner */}
              <li className="flex items-center gap-3 p-3 rounded-lg border border-neutral-100 bg-neutral-50/50">
                <div className="w-9 h-9 rounded-full bg-neutral-200 flex items-center justify-center shrink-0 text-sm font-medium text-neutral-600">
                  {getDisplayName(workspace.owner).slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-neutral-900">{getDisplayName(workspace.owner)}</p>
                  <p className="text-xs text-neutral-500">{getDisplayEmail(workspace.owner)}</p>
                </div>
                <span className="text-xs font-medium px-2 py-0.5 rounded bg-amber-100 text-amber-800 shrink-0">
                  Owner
                </span>
              </li>
              {workspace.members.map((m) => {
                const uid = getUserId(m.user);
                const isOwner = uid === getUserId(workspace.owner);
                if (isOwner) return null;
                return (
                  <li
                    key={uid}
                    className="flex items-center gap-3 p-3 rounded-lg border border-neutral-100 hover:bg-neutral-50/50 transition-colors"
                  >
                    <div className="w-9 h-9 rounded-full bg-neutral-200 flex items-center justify-center shrink-0 text-sm font-medium text-neutral-600">
                      {getDisplayName(m.user).slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-neutral-900">{getDisplayName(m.user)}</p>
                      <p className="text-xs text-neutral-500">{getDisplayEmail(m.user)}</p>
                    </div>
                    {isAdmin ? (
                      <div className="flex items-center gap-2 shrink-0">
                        <select
                          value={m.role}
                          onChange={(e) => handleRoleChange(uid, e.target.value as WorkspaceMemberRole)}
                          disabled={updatingRoleId === uid}
                          className="text-sm rounded border border-neutral-300 px-2 py-1 bg-white text-neutral-900"
                        >
                          <option value="viewer">Viewer</option>
                          <option value="editor">Editor</option>
                          <option value="admin">Admin</option>
                        </select>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveMember(uid)}
                          disabled={removingMemberId === uid}
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                          title="Remove from workspace"
                        >
                          {removingMemberId === uid ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    ) : (
                      <span className="text-xs font-medium px-2 py-0.5 rounded bg-neutral-100 text-neutral-600 capitalize shrink-0">
                        {m.role}
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
            {isAdmin && (
              <form onSubmit={handleInvite} className="flex flex-wrap items-end gap-3 p-3 rounded-lg bg-neutral-50 border border-neutral-100">
                <div className="flex-1 min-w-[180px]">
                  <label htmlFor="invite-email" className="block text-xs font-medium text-neutral-600 mb-1">
                    Invite by email
                  </label>
                  <input
                    id="invite-email"
                    type="email"
                    placeholder="teammate@example.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="w-full rounded border border-neutral-300 px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-500"
                  />
                </div>
                <div className="w-28">
                  <label htmlFor="invite-role" className="block text-xs font-medium text-neutral-600 mb-1">
                    Role
                  </label>
                  <select
                    id="invite-role"
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value as WorkspaceMemberRole)}
                    className="w-full rounded border border-neutral-300 px-3 py-2 text-sm bg-white text-neutral-900"
                  >
                    <option value="viewer">Viewer</option>
                    <option value="editor">Editor</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <Button type="submit" size="sm" disabled={inviting || !inviteEmail.trim()}>
                  {inviting ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4 mr-1" />}
                  Invite
                </Button>
              </form>
            )}
            {inviteError && <p className="text-red-600 text-sm mt-2">{inviteError}</p>}
            {isAdmin && (
              <p className="text-neutral-500 text-xs mt-3">
                The person must already have a DOCIT account (signed in with Google). Viewer: view docs. Editor: upload & delete. Admin: manage members and settings.
              </p>
            )}
          </div>

          {/* Documents section */}
          <div className="bg-white border border-neutral-200 rounded-lg shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-neutral-100">
              <div className="flex items-baseline justify-between gap-4 flex-wrap">
                <div>
                  <h2 className="text-sm font-semibold text-neutral-900 uppercase tracking-wide flex items-center gap-2">
                    <FileText className="w-4 h-4 text-neutral-500 shrink-0" />
                    Documents
                    {!docsLoading && documents.length > 0 && (
                      <span className="font-normal normal-case text-neutral-500">({documents.length})</span>
                    )}
                  </h2>
                  <p className="text-neutral-500 text-sm mt-0.5">Documents in this workspace. Download or manage below.</p>
                </div>
              </div>
            </div>

            <div className="p-5 space-y-5">
              {canUpload && (
                <>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept={ALLOWED_ACCEPT}
                    className="hidden"
                    onChange={handleUpload}
                    multiple
                  />
                  <div
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onClick={() => !uploading && fileInputRef.current?.click()}
                    className={`
                      rounded-xl border-2 border-dashed transition-all cursor-pointer
                      ${isDragging ? "border-neutral-900 bg-neutral-100 scale-[1.01]" : "border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50/80"}
                      ${documents.length === 0 ? "min-h-[160px] flex flex-col items-center justify-center py-8 px-6" : "py-3 px-4 flex items-center justify-center gap-3"}
                    `}
                  >
                    {uploading ? (
                      <div className="flex items-center gap-3 text-neutral-600">
                        <Loader2 className="w-6 h-6 animate-spin shrink-0" />
                        <span className="text-sm font-medium">{uploadProgress ?? "Uploading…"}</span>
                      </div>
                    ) : documents.length === 0 ? (
                      <>
                        <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center mb-2">
                          <FileStack className="w-6 h-6 text-red-600/80" />
                        </div>
                        <p className="font-semibold text-neutral-900 text-sm">Drop documents here or click to browse</p>
                        <p className="text-neutral-500 text-xs">{SUPPORTED_TYPES_LABEL}</p>
                      </>
                    ) : (
                      <span className="flex flex-col items-center gap-0.5 sm:flex-row sm:gap-2 text-sm font-medium text-neutral-600">
                        <span className="flex items-center gap-2">
                          <Upload className="w-4 h-4 shrink-0" />
                          Drop documents or click to add more
                        </span>
                        <span className="text-xs font-normal text-neutral-400">({SUPPORTED_TYPES_LABEL})</span>
                      </span>
                    )}
                  </div>
                </>
              )}

              {uploadError && (
                <p className="text-red-600 text-sm rounded-lg bg-red-50/80 px-3 py-2">{uploadError}</p>
              )}
              {summarizeError && (
                <p className="text-red-600 text-sm rounded-lg bg-amber-50 border border-amber-200 px-3 py-2">
                  Summarization: {summarizeError}
                </p>
              )}

              {docsLoading ? (
                <div className="flex items-center justify-center gap-2 text-neutral-500 text-sm py-10">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Loading documents…
                </div>
              ) : docsError ? (
                <p className="text-red-600 text-sm py-4">{docsError}</p>
              ) : documents.length === 0 && !canUpload ? (
                <p className="text-neutral-500 text-sm py-8 text-center">No documents in this workspace yet.</p>
              ) : documents.length > 0 ? (
                <div className="border border-neutral-100 rounded-xl overflow-hidden">
                  <ul className="divide-y divide-neutral-100">
                    {documents.map((doc) => {
                      const uploaderName =
                        typeof doc.uploadedBy === "object" && doc.uploadedBy?.name
                          ? doc.uploadedBy.name
                          : typeof doc.uploadedBy === "string" && currentUser?.id === doc.uploadedBy
                            ? currentUser.name ?? "—"
                            : "—";
                      const uploaderInitials = uploaderName !== "—" ? uploaderName.slice(0, 2).toUpperCase() : "—";
                      return (
                        <li
                          key={doc._id}
                          className="group flex flex-col gap-0 px-4 py-3 hover:bg-neutral-50/80 transition-colors"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center shrink-0">
                              <FileText className="w-5 h-5 text-red-600/80" />
                            </div>
                            <div className="min-w-0 flex-1 grid grid-cols-1 sm:grid-cols-[1fr_auto] sm:items-center gap-0.5 sm:gap-4">
                              <p className="font-medium text-neutral-900 truncate">{doc.title}</p>
                              <div className="flex items-center gap-2 text-xs text-neutral-500 sm:text-right">
                                <span>{formatFileSize(doc.fileSize)}</span>
                                <span aria-hidden>·</span>
                                <span>{formatDocDate(doc.createdAt)}</span>
                                <span aria-hidden>·</span>
                                <span className="flex items-center gap-1.5 min-w-0">
                                  <span className="w-5 h-5 rounded-full bg-neutral-200 flex items-center justify-center text-[10px] font-medium text-neutral-600 shrink-0">
                                    {uploaderInitials}
                                  </span>
                                  <span className="truncate">{uploaderName}</span>
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-0.5 shrink-0">
                              {canUpload && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleSummarize(doc)}
                                  disabled={summarizingId === doc._id}
                                  className="h-8 w-8 p-0 text-violet-600 hover:text-violet-700 hover:bg-violet-50"
                                  title="AI Summarize"
                                >
                                  {summarizingId === doc._id ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <Sparkles className="w-4 h-4" />
                                  )}
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDownload(doc)}
                                className="h-8 w-8 p-0"
                                title="Download"
                              >
                                <Download className="w-4 h-4" />
                              </Button>
                              {canUpload && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteDocument(doc._id)}
                                  disabled={deletingId === doc._id}
                                  className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                  title="Delete"
                                >
                                  {deletingId === doc._id ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <Trash2 className="w-4 h-4" />
                                  )}
                                </Button>
                              )}
                            </div>
                          </div>
                          {doc.summary && (
                            <div className="pl-14 pr-2 pb-1">
                              <p className="text-sm text-neutral-600 line-clamp-3">{doc.summary}</p>
                            </div>
                          )}
                          <div className="pl-14 pr-2 pb-2 space-y-2">
                            <button
                              type="button"
                              onClick={() => {
                                setAskDocId(askDocId === doc._id ? null : doc._id);
                                setAskQuestion("");
                                setAskAnswer(null);
                                setSummarizeError(null);
                              }}
                              className="flex items-center gap-1.5 text-xs font-medium text-violet-600 hover:text-violet-700"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                              {askDocId === doc._id ? "Hide ask" : "Ask about this doc"}
                            </button>
                            {askDocId === doc._id && (
                              <div className="flex flex-col gap-2">
                                <div className="flex gap-2">
                                  <input
                                    type="text"
                                    value={askQuestion}
                                    onChange={(e) => setAskQuestion(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && handleAsk(doc._id)}
                                    placeholder="Ask a question about this document…"
                                    className="flex-1 min-w-0 rounded-lg border border-neutral-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                                  />
                                  <Button
                                    size="sm"
                                    onClick={() => handleAsk(doc._id)}
                                    disabled={askLoading || !askQuestion.trim()}
                                    className="shrink-0 bg-violet-600 hover:bg-violet-700"
                                  >
                                    {askLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Ask"}
                                  </Button>
                                </div>
                                {askAnswer !== null && (
                                  <div className="rounded-lg bg-neutral-50 border border-neutral-100 p-3 text-sm text-neutral-700 whitespace-pre-wrap">
                                    {askAnswer}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ) : null}
            </div>
          </div>
          </div>

          {/* Workspace chat — sidebar on xl */}
          <aside className="xl:sticky xl:top-20">
            <WorkspaceChatPanel
              messages={chatMessages}
              status={chatStatus}
              errorMessage={chatError}
              onSend={sendChatMessage}
              onReconnect={reconnectChat}
              currentUserId={currentUser?.id}
            />
          </aside>
        </div>
      </div>
    </main>
  );
}
