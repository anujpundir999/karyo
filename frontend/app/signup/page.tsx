"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { UserPlus } from "lucide-react";
import { useState } from "react";

const schema = z.object({
    email: z.string().email("Invalid email"),
    username: z.string().min(6, "Min 6 characters").max(30, "Max 30 characters"),
    password: z.string().min(8, "Min 8 characters").max(128, "Max 128 characters"),
});

type FormData = z.infer<typeof schema>;

export default function SignupPage() {
    const router = useRouter();
    const [serverError, setServerError] = useState("");
    const [success, setSuccess] = useState(false);
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<FormData>({ resolver: zodResolver(schema) });

    const onSubmit = async (data: FormData) => {
        setServerError("");
        try {
            await api.post("/auth/signup", data);
            setSuccess(true);
            setTimeout(() => router.push("/login"), 1500);
        } catch (err: unknown) {
            const msg =
                (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
                "Signup failed. Please try again.";
            setServerError(msg);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-600 mb-4 shadow-lg shadow-indigo-500/30">
                        <span className="text-white text-2xl font-bold">K</span>
                    </div>
                    <h1 className="text-3xl font-bold text-white">Create your account</h1>
                    <p className="text-slate-400 mt-1">Join Karyo and start managing projects</p>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-xl">
                    {serverError && (
                        <div className="mb-4 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                            {serverError}
                        </div>
                    )}
                    {success && (
                        <div className="mb-4 px-4 py-3 rounded-lg bg-green-500/10 border border-green-500/30 text-green-400 text-sm">
                            Account created! Redirecting to login…
                        </div>
                    )}

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1.5">Email</label>
                            <input
                                type="email"
                                placeholder="you@example.com"
                                {...register("email")}
                                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                            />
                            {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1.5">Username</label>
                            <input
                                type="text"
                                placeholder="cooluser123"
                                {...register("username")}
                                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                            />
                            {errors.username && <p className="text-red-400 text-xs mt-1">{errors.username.message}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1.5">Password</label>
                            <input
                                type="password"
                                placeholder="••••••••"
                                {...register("password")}
                                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                            />
                            {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password.message}</p>}
                        </div>

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-semibold rounded-xl py-2.5 transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            <UserPlus size={18} />
                            {isSubmitting ? "Creating account…" : "Create account"}
                        </button>
                    </form>

                    <p className="text-center text-slate-500 text-sm mt-6">
                        Already have an account?{" "}
                        <Link href="/login" className="text-indigo-400 hover:text-indigo-300 transition">
                            Sign in
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
