"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import { Project, Task, TaskStatus, ProjectMember } from "@/types";
import { getAccessToken } from "@/lib/auth";
import {
    ArrowLeft,
    Plus,
    Users,
    LayoutGrid,
    UserPlus,
} from "lucide-react";
import KanbanBoard from "@/components/kanban/KanbanBoard";
import NewTaskModal from "@/components/kanban/NewTaskModal";
import TaskCardSkeleton from "@/components/kanban/TaskCardSkeleton";

// ─── Helpers ──────────────────────────────────────────────────────────────────
/** Decode the `sub` (user id) field from a JWT without a library */
function getUserIdFromToken(): string | null {
    try {
        const token = getAccessToken();
        if (!token) return null;
        const payload = JSON.parse(atob(token.split(".")[1]));
        return (payload?.user?.user_id as string) ?? null;
    } catch {
        return null;
    }
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function ProjectDetailPage() {
    const { id } = useParams<{ id: string }>();
    const [project, setProject] = useState<Project | null>(null);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [members, setMembers] = useState<ProjectMember[]>([]);
    const [tab, setTab] = useState<"board" | "team">("board");
    const [loading, setLoading] = useState(true);
    const [showTaskModal, setShowTaskModal] = useState(false);

    // Member add form
    const [addMemberEmail, setAddMemberEmail] = useState("");
    const [addMemberLoading, setAddMemberLoading] = useState(false);
    const [addMemberError, setAddMemberError] = useState("");

    useEffect(() => {
        const load = async () => {
            try {
                const [projectsRes, tasksRes, membersRes] = await Promise.all([
                    api.get<Project[]>("/projects/"),
                    api.get<Task[]>(`/tasks/projects/${id}`),
                    api.get<ProjectMember[]>(`/projects/${id}/members`),
                ]);
                const proj = projectsRes.data.find((p) => p.id === id) || null;
                setProject(proj);
                setTasks(tasksRes.data);
                setMembers(membersRes.data);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [id]);

    // Determine if current user can edit (is a project member or owner)
    const currentUserId = getUserIdFromToken();
    const canEdit =
        !!currentUserId &&
        members.some((m) => m.user_id === currentUserId);
    const isOwner =
        !!currentUserId &&
        members.some((m) => m.user_id === currentUserId && m.role === "OWNER");

    const addMember = async () => {
        if (!addMemberEmail.trim()) return;
        setAddMemberLoading(true);
        setAddMemberError("");
        try {
            await api.post<ProjectMember>(`/projects/${id}/add-member`, {
                email: addMemberEmail.trim(),
            });
            // Re-fetch the full member list so username/email are populated from the JOIN
            const membersRes = await api.get<ProjectMember[]>(`/projects/${id}/members`);
            setMembers(membersRes.data);
            setAddMemberEmail("");
        } catch (err: unknown) {
            setAddMemberError(
                (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
                "Could not add member."
            );
        } finally {
            setAddMemberLoading(false);
        }
    };

    if (loading) return <BoardSkeleton />;
    if (!project) return <p className="text-slate-400">Project not found.</p>;

    return (
        <div className="max-w-6xl">
            {/* Back link */}
            <Link
                href="/projects"
                className="inline-flex items-center gap-1.5 text-slate-400 hover:text-white text-sm mb-6 transition group"
            >
                <ArrowLeft size={15} className="group-hover:-translate-x-0.5 transition-transform" />
                All Projects
            </Link>

            {/* Page header */}
            <div className="flex items-start justify-between mb-6 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white tracking-tight">{project.name}</h1>
                    {project.description && (
                        <p className="text-slate-400 text-sm mt-1">{project.description}</p>
                    )}
                </div>

                {tab === "board" && (
                    <button
                        onClick={() => setShowTaskModal(true)}
                        className="shrink-0 flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 active:scale-95
                                   text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-all
                                   shadow-md shadow-indigo-500/25"
                    >
                        <Plus size={16} />
                        New Task
                    </button>
                )}
            </div>

            {/* Tabs */}
            <div className="flex gap-1 mb-6 bg-slate-900 border border-slate-800 rounded-xl p-1 w-fit">
                {[
                    { key: "board", label: "Board", icon: <LayoutGrid size={15} /> },
                    { key: "team", label: "Team", icon: <Users size={15} /> },
                ].map(({ key, label, icon }) => (
                    <button
                        key={key}
                        onClick={() => setTab(key as "board" | "team")}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === key
                            ? "bg-indigo-600 text-white shadow-md"
                            : "text-slate-400 hover:text-white"
                            }`}
                    >
                        {icon} {label}
                    </button>
                ))}
            </div>

            {/* ── Board Tab ── */}
            {tab === "board" && (
                /* Horizontal scroll wrapper for small screens */
                <div className="overflow-x-auto pb-2">
                    <div className="min-w-[640px]">
                        <KanbanBoard
                            tasks={tasks}
                            canEdit={canEdit}
                            members={members}
                            onTasksChange={setTasks}
                        />
                    </div>
                </div>
            )}

            {/* ── Team Tab ── */}
            {tab === "team" && (
                <div className="max-w-xl space-y-4">
                    {/* Add member form — owners only */}
                    {isOwner && (
                        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
                            <h3 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
                                <UserPlus size={16} className="text-indigo-400" /> Add Member
                            </h3>
                            <div className="flex gap-2">
                                <input
                                    type="email"
                                    placeholder="member@example.com"
                                    value={addMemberEmail}
                                    onChange={(e) => setAddMemberEmail(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && addMember()}
                                    className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-slate-100 placeholder-slate-500
                                           focus:outline-none focus:ring-2 focus:ring-indigo-500 transition text-sm"
                                />
                                <button
                                    onClick={addMember}
                                    disabled={addMemberLoading}
                                    className="bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-all disabled:opacity-60"
                                >
                                    {addMemberLoading ? "Adding…" : "Add"}
                                </button>
                            </div>
                            {addMemberError && (
                                <p className="text-red-400 text-xs mt-2">{addMemberError}</p>
                            )}
                        </div>
                    )}

                    {/* Members list */}
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl divide-y divide-slate-800">
                        {members.length === 0 ? (
                            <p className="text-slate-500 text-sm text-center py-8">No members yet</p>
                        ) : (
                            members.map((m) => (
                                <div key={m.id} className="flex items-center justify-between px-5 py-3.5">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-indigo-600/30 flex items-center justify-center text-indigo-300 text-sm font-bold">
                                            {(m.username || m.user_id || "?").slice(0, 2).toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="text-sm text-slate-200 font-medium">{m.username || m.user_id}</p>
                                            <p className="text-xs text-slate-500">{m.email || ""}</p>
                                        </div>
                                    </div>
                                    <span
                                        className={`text-xs font-medium px-2.5 py-1 rounded-full ${m.role === "owner"
                                            ? "bg-indigo-600/20 text-indigo-300"
                                            : "bg-slate-800 text-slate-400"
                                            }`}
                                    >
                                        {m.role}
                                    </span>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

            {/* New Task Modal */}
            {showTaskModal && (
                <NewTaskModal
                    projectId={id}
                    members={members}
                    currentUserId={currentUserId}
                    onClose={() => setShowTaskModal(false)}
                    onCreated={(task) => {
                        setTasks((prev) => [...prev, task]);
                        setShowTaskModal(false);
                    }}
                />
            )}
        </div>
    );
}

// ─── Loading skeleton ─────────────────────────────────────────────────────────
function BoardSkeleton() {
    return (
        <div className="max-w-6xl">
            <div className="h-5 w-28 bg-slate-800 rounded mb-6 animate-pulse" />
            <div className="h-8 w-56 bg-slate-800 rounded mb-2 animate-pulse" />
            <div className="h-4 w-80 bg-slate-800/60 rounded mb-8 animate-pulse" />
            <div className="grid grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-2 h-2 rounded-full bg-slate-700" />
                            <div className="h-3.5 w-20 bg-slate-800 rounded animate-pulse" />
                            <div className="h-4 w-6 bg-slate-800 rounded-full ml-auto animate-pulse" />
                        </div>
                        {[1, 2, 3].map((j) => (
                            <TaskCardSkeleton key={j} />
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
}
