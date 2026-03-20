export default function TaskCardSkeleton() {
    return (
        <div className="rounded-2xl border border-white/[0.05] bg-white/[0.03] p-3.5 space-y-2.5 animate-pulse">
            <div className="flex items-start gap-2">
                <div className="w-3.5 h-3.5 rounded bg-slate-800 shrink-0 mt-0.5" />
                <div className="flex-1 space-y-1.5">
                    <div className="h-3.5 w-3/4 bg-slate-800 rounded" />
                    <div className="h-2.5 w-full bg-slate-800/60 rounded" />
                    <div className="h-2.5 w-2/3 bg-slate-800/40 rounded" />
                </div>
            </div>
            <div className="flex justify-between pt-0.5">
                <div className="h-3 w-16 bg-slate-800 rounded" />
                <div className="h-5 w-20 bg-slate-800 rounded-full" />
            </div>
        </div>
    );
}
