"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/api";
import { Project } from "@/types";
import { FolderKanban, Plus, Calendar } from "lucide-react";

export default function ProjectsPage() {
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get<Project[]>("/projects/").then(({ data }) => setProjects(data)).finally(() => setLoading(false));
    }, []);

    return (
        <div className="max-w-5xl">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-white">Projects</h1>
                    <p className="text-slate-400 text-sm mt-0.5">All projects you own or are a member of</p>
                </div>
                <Link
                    href="/projects/new"
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-all duration-150 shadow-md shadow-indigo-500/20"
                >
                    <Plus size={16} /> New Project
                </Link>
            </div>

            {loading ? (
                <div className="grid grid-cols-2 gap-4 animate-pulse">
                    {[1, 2, 3, 4].map((i) => <div key={i} className="bg-slate-800/50 rounded-2xl h-28" />)}
                </div>
            ) : projects.length === 0 ? (
                <div className="text-center py-20 border border-dashed border-slate-700 rounded-2xl">
                    <FolderKanban size={48} className="text-slate-600 mx-auto mb-4" />
                    <p className="text-slate-300 font-medium">No projects yet</p>
                    <p className="text-slate-500 text-sm mt-1 mb-6">Create a project to get started</p>
                    <Link
                        href="/projects/new"
                        className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-all"
                    >
                        <Plus size={16} /> Create project
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-2 gap-4">
                    {projects.map((p) => (
                        <Link
                            key={p.id}
                            href={`/projects/${p.id}`}
                            className="group bg-slate-900 border border-slate-800 hover:border-indigo-500/50 rounded-2xl p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-indigo-500/10"
                        >
                            <div className="flex items-start gap-3 mb-3">
                                <div className="w-10 h-10 rounded-xl bg-indigo-600/20 flex items-center justify-center shrink-0 mt-0.5">
                                    <FolderKanban size={20} className="text-indigo-400" />
                                </div>
                                <div>
                                    <h2 className="font-semibold text-white group-hover:text-indigo-300 transition leading-tight">
                                        {p.name}
                                    </h2>
                                    <p className="text-slate-500 text-xs mt-0.5 line-clamp-2">{p.description || "No description"}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-1 text-slate-600 text-xs">
                                <Calendar size={13} />
                                {new Date(p.created_at).toLocaleDateString()}
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
