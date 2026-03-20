"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/api";
import { Project, Task } from "@/types";
import { FolderKanban, CheckCircle2, Clock, Plus } from "lucide-react";

export default function DashboardPage() {
    const [projects, setProjects] = useState<Project[]>([]);
    const [recentTasks, setRecentTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                const { data } = await api.get<Project[]>("/projects/");
                setProjects(data);
                // Fetch tasks for first 3 projects for the overview
                const taskLists = await Promise.allSettled(
                    data.slice(0, 3).map((p) =>
                        api.get<Task[]>(`/tasks/projects/${p.id}`)
                    )
                );
                const tasks = taskLists.flatMap((r) =>
                    r.status === "fulfilled" ? r.value.data : []
                );
                setRecentTasks(tasks.slice(0, 6));
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    const done = recentTasks.filter((t) => t.status === "DONE").length;
    const inProgress = recentTasks.filter((t) => t.status === "IN_PROGRESS").length;

    if (loading) return <DashSkeleton />;

    return (
        <div className="max-w-5xl animate-fadeIn">
            <h1 className="text-2xl font-bold text-white mb-1">Dashboard</h1>
            <p className="text-slate-400 text-sm mb-8">Your workspace at a glance</p>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mb-8">
                {[
                    {
                        label: "Projects",
                        value: projects.length,
                        icon: <FolderKanban size={22} className="text-indigo-400" />,
                        color: "bg-indigo-500/10 border-indigo-500/20",
                    },
                    {
                        label: "Tasks Done",
                        value: done,
                        icon: <CheckCircle2 size={22} className="text-green-400" />,
                        color: "bg-green-500/10 border-green-500/20",
                    },
                    {
                        label: "In Progress",
                        value: inProgress,
                        icon: <Clock size={22} className="text-amber-400" />,
                        color: "bg-amber-500/10 border-amber-500/20",
                    },
                ].map((s) => (
                    <div
                        key={s.label}
                        className={`border rounded-2xl p-5 flex items-center gap-4 ${s.color}`}
                    >
                        {s.icon}
                        <div>
                            <p className="text-2xl font-bold text-white">{s.value}</p>
                            <p className="text-slate-400 text-xs">{s.label}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Projects section */}
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-white">Your Projects</h2>
                <Link
                    href="/projects/new"
                    className="flex items-center gap-1 text-sm text-indigo-400 hover:text-indigo-300 transition"
                >
                    <Plus size={16} /> New project
                </Link>
            </div>

            {projects.length === 0 ? (
                <div className="text-center py-16 border border-dashed border-slate-700 rounded-2xl">
                    <FolderKanban size={40} className="text-slate-600 mx-auto mb-3" />
                    <p className="text-slate-400">No projects yet.</p>
                    <Link
                        href="/projects/new"
                        className="mt-3 inline-block text-indigo-400 hover:text-indigo-300 text-sm transition"
                    >
                        Create your first project →
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-2 gap-4">
                    {projects.slice(0, 4).map((p) => (
                        <Link
                            key={p.id}
                            href={`/projects/${p.id}`}
                            className="group bg-slate-900 border border-slate-800 hover:border-indigo-500/50 rounded-2xl p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-indigo-500/10"
                        >
                            <div className="flex items-start gap-3">
                                <div className="w-9 h-9 rounded-xl bg-indigo-600/20 flex items-center justify-center shrink-0">
                                    <FolderKanban size={18} className="text-indigo-400" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-white group-hover:text-indigo-300 transition">
                                        {p.name}
                                    </h3>
                                    <p className="text-slate-500 text-xs mt-0.5 line-clamp-1">{p.description || "No description"}</p>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}

function DashSkeleton() {
    return (
        <div className="max-w-5xl animate-pulse">
            <div className="h-7 w-40 bg-slate-800 rounded-lg mb-3" />
            <div className="grid grid-cols-3 gap-4 mb-8">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-slate-800/50 rounded-2xl h-24" />
                ))}
            </div>
            <div className="grid grid-cols-2 gap-4">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="bg-slate-800/50 rounded-2xl h-20" />
                ))}
            </div>
        </div>
    );
}
