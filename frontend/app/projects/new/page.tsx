"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, FolderPlus } from "lucide-react";

const schema = z.object({
    name: z.string().min(3, "Min 3 characters").max(100, "Max 100 characters"),
    description: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function NewProjectPage() {
    const router = useRouter();
    const [serverError, setServerError] = useState("");
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<FormData>({ resolver: zodResolver(schema) });

    const onSubmit = async (data: FormData) => {
        setServerError("");
        try {
            const res = await api.post("/projects/", data);
            router.push(`/projects/${res.data.id}`);
        } catch (err: unknown) {
            const msg =
                (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
                "Failed to create project.";
            setServerError(msg);
        }
    };

    return (
        <div className="max-w-lg">
            <Link
                href="/projects"
                className="inline-flex items-center gap-1.5 text-slate-400 hover:text-white text-sm mb-6 transition"
            >
                <ArrowLeft size={15} /> Back to projects
            </Link>

            <h1 className="text-2xl font-bold text-white mb-1">New Project</h1>
            <p className="text-slate-400 text-sm mb-8">Fill in the details to create a new project</p>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-xl">
                {serverError && (
                    <div className="mb-4 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                        {serverError}
                    </div>
                )}

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1.5">Project Name</label>
                        <input
                            type="text"
                            placeholder="My awesome project"
                            {...register("name")}
                            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                        />
                        {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name.message}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1.5">
                            Description <span className="text-slate-600">(optional)</span>
                        </label>
                        <textarea
                            rows={3}
                            placeholder="What is this project about?"
                            {...register("description")}
                            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition resize-none"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-semibold rounded-xl py-2.5 transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        <FolderPlus size={18} />
                        {isSubmitting ? "Creating…" : "Create Project"}
                    </button>
                </form>
            </div>
        </div>
    );
}
