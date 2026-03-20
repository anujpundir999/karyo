"use client";
import { useEffect, useRef, useState } from "react";
import { X, Loader2, AlertCircle } from "lucide-react";
import api from "@/lib/api";
import { Task, TaskStatus, ProjectMember } from "@/types";

interface NewTaskModalProps {
    projectId: string;
    members: ProjectMember[];
    currentUserId: string | null;
    onClose: () => void;
    onCreated: (task: Task) => void;
}

const STATUS_OPTIONS: { value: TaskStatus; label: string }[] = [
    { value: "TODO", label: "To Do" },
    { value: "IN_PROGRESS", label: "In Progress" },
    { value: "DONE", label: "Done" },
];

export default function NewTaskModal({
    projectId,
    members,
    currentUserId,
    onClose,
    onCreated,
}: NewTaskModalProps) {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [status, setStatus] = useState<TaskStatus>("TODO");
    const [dueDate, setDueDate] = useState("");
    const [assignedTo, setAssignedTo] = useState<string>(currentUserId ?? "");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const titleRef = useRef<HTMLInputElement>(null);

    // Auto-focus & close on Escape
    useEffect(() => {
        titleRef.current?.focus();
        const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [onClose]);

    const submit = async () => {
        if (!title.trim()) { setError("Title is required."); return; }
        setLoading(true);
        setError("");
        try {
            const { data } = await api.post<Task>(`/tasks/projects/${projectId}`, {
                title: title.trim(),
                description: description.trim() || null,
                status,
                due_date: dueDate || null,
                assigned_to: assignedTo || null,
            });
            onCreated(data);
        } catch (err: unknown) {
            setError(
                (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
                "Failed to create task. Please try again."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        /* Backdrop */
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
        >
            {/* Panel */}
            <div className="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900/95 backdrop-blur-xl shadow-2xl shadow-black/60 animate-fadeIn">
                {/* Header */}
                <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-slate-800">
                    <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-indigo-600/25 flex items-center justify-center">
                            <span className="text-indigo-400 text-sm font-bold">+</span>
                        </div>
                        <h2 id="modal-title" className="text-base font-bold text-white tracking-tight">
                            New Task
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        aria-label="Close modal"
                        className="text-slate-500 hover:text-white transition-colors p-1 rounded-lg hover:bg-slate-800"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Body */}
                <div className="px-6 py-5 space-y-4">
                    {/* Error */}
                    {error && (
                        <div className="flex items-start gap-2 px-3.5 py-2.5 rounded-xl bg-red-500/10 border border-red-500/25 text-red-400 text-sm">
                            <AlertCircle size={15} className="shrink-0 mt-0.5" />
                            {error}
                        </div>
                    )}

                    {/* Title */}
                    <div>
                        <label htmlFor="task-title" className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
                            Title <span className="text-red-400">*</span>
                        </label>
                        <input
                            ref={titleRef}
                            id="task-title"
                            type="text"
                            placeholder="e.g. Design the login screen"
                            value={title}
                            onChange={(e) => { setTitle(e.target.value); if (error) setError(""); }}
                            onKeyDown={(e) => e.key === "Enter" && submit()}
                            className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-600
                                       focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label htmlFor="task-desc" className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
                            Description <span className="text-slate-600 normal-case font-normal">optional</span>
                        </label>
                        <textarea
                            id="task-desc"
                            rows={3}
                            placeholder="Add details, context, or acceptance criteria…"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-600
                                       focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition resize-none"
                        />
                    </div>

                    {/* Assign To */}
                    <div>
                        <label htmlFor="task-assign" className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
                            Assign To
                        </label>
                        <select
                            id="task-assign"
                            value={assignedTo}
                            onChange={(e) => setAssignedTo(e.target.value)}
                            className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-200
                                       focus:outline-none focus:ring-2 focus:ring-indigo-500 transition cursor-pointer appearance-none"
                        >
                            <option value="">— Unassigned —</option>
                            {members.map((m) => (
                                <option key={m.user_id} value={m.user_id}>
                                    {m.username || m.email}
                                    {m.user_id === currentUserId ? " (you)" : ""}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Status + Due Date row */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label htmlFor="task-status" className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
                                Status
                            </label>
                            <select
                                id="task-status"
                                value={status}
                                onChange={(e) => setStatus(e.target.value as TaskStatus)}
                                className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-200
                                           focus:outline-none focus:ring-2 focus:ring-indigo-500 transition cursor-pointer appearance-none"
                            >
                                {STATUS_OPTIONS.map((s) => (
                                    <option key={s.value} value={s.value}>
                                        {s.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="task-due" className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
                                Due Date
                            </label>
                            <input
                                id="task-due"
                                type="date"
                                value={dueDate}
                                onChange={(e) => setDueDate(e.target.value)}
                                className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-200
                                           focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                            />
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex gap-2.5 px-6 pb-5">
                    <button
                        onClick={onClose}
                        className="flex-1 py-2.5 rounded-xl border border-slate-700 text-slate-400 hover:text-white hover:border-slate-600
                                   text-sm font-medium transition-all"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={submit}
                        disabled={loading}
                        className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white text-sm font-semibold
                                   transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2
                                   shadow-lg shadow-indigo-500/25"
                    >
                        {loading ? <><Loader2 size={15} className="animate-spin" />Creating…</> : "Create Task"}
                    </button>
                </div>
            </div>
        </div>
    );
}
