"use client";
import { useRef, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Calendar, GripVertical, Clock, CheckCircle2, Circle, ChevronDown } from "lucide-react";
import { Task, TaskStatus, ProjectMember } from "@/types";

const STATUS_META: Record<TaskStatus, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
    TODO: {
        label: "To Do",
        color: "text-slate-400",
        bg: "bg-slate-500/15 border-slate-500/25",
        icon: <Circle size={11} />,
    },
    IN_PROGRESS: {
        label: "In Progress",
        color: "text-amber-400",
        bg: "bg-amber-500/15 border-amber-500/25",
        icon: <Clock size={11} />,
    },
    DONE: {
        label: "Done",
        color: "text-emerald-400",
        bg: "bg-emerald-500/15 border-emerald-500/25",
        icon: <CheckCircle2 size={11} />,
    },
};

const STATUS_ORDER: TaskStatus[] = ["TODO", "IN_PROGRESS", "DONE"];

function getInitials(name: string): string {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
}

interface TaskCardProps {
    task: Task;
    canEdit: boolean;
    members: ProjectMember[];
    onDragStart: (taskId: string) => void;
    onStatusChange: (taskId: string, status: TaskStatus) => void;
}

export default function TaskCard({ task, canEdit, members, onDragStart, onStatusChange }: TaskCardProps) {
    const dragRef = useRef<HTMLDivElement>(null);
    const btnRef = useRef<HTMLButtonElement>(null);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [dropPos, setDropPos] = useState<{ top: number; left: number } | null>(null);
    const meta = STATUS_META[task.status];

    const isOverdue =
        task.due_date && task.status !== "DONE"
            ? new Date(task.due_date) < new Date()
            : false;

    const assignee = task.assigned_to
        ? members.find((m) => m.user_id === task.assigned_to)
        : null;
    const assigneeName = assignee?.username || assignee?.email || null;
    const initials = assigneeName ? getInitials(assigneeName) : null;

    // Calculate portal position from the button's bounding rect
    const openDropdown = () => {
        if (!canEdit) return;
        const rect = btnRef.current?.getBoundingClientRect();
        if (rect) {
            setDropPos({ top: rect.bottom + 4, left: rect.left });
        }
        setDropdownOpen(true);
    };

    // Close on outside click
    useEffect(() => {
        if (!dropdownOpen) return;
        const close = () => setDropdownOpen(false);
        document.addEventListener("mousedown", close);
        return () => document.removeEventListener("mousedown", close);
    }, [dropdownOpen]);

    const handleDragStart = (e: React.DragEvent) => {
        if (!canEdit) { e.preventDefault(); return; }
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", task.id);
        onDragStart(task.id);
        setTimeout(() => {
            if (dragRef.current) dragRef.current.setAttribute("data-dragging", "true");
        }, 0);
    };

    const handleDragEnd = () => {
        if (dragRef.current) dragRef.current.removeAttribute("data-dragging");
    };

    return (
        <div
            ref={dragRef}
            draggable={canEdit}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            className={`
                group relative rounded-2xl border p-3.5 space-y-2.5 transition-all duration-200
                bg-white/[0.04] backdrop-blur-md border-white/[0.08]
                hover:bg-white/[0.07] hover:border-indigo-500/30 hover:shadow-lg hover:shadow-indigo-500/10 hover:-translate-y-0.5
                data-[dragging=true]:opacity-40 data-[dragging=true]:scale-95
                ${canEdit ? "cursor-grab active:cursor-grabbing" : "cursor-default"}
                focus-within:ring-2 focus-within:ring-indigo-500/50
            `}
            tabIndex={0}
            role="article"
            aria-label={`Task: ${task.title}`}
        >
            {/* Row 1: Drag handle + Title + Assignee Avatar */}
            <div className="flex items-start gap-2">
                {canEdit ? (
                    <GripVertical
                        size={14}
                        className="text-slate-600 group-hover:text-slate-400 mt-0.5 shrink-0 transition-colors"
                        aria-hidden="true"
                    />
                ) : (
                    <div className="relative group/tip shrink-0 mt-0.5">
                        <GripVertical size={14} className="text-slate-700" aria-hidden="true" />
                        <div
                            role="tooltip"
                            className="absolute left-full top-0 ml-2 z-50 whitespace-nowrap px-2.5 py-1.5 rounded-lg text-xs font-medium
                                       bg-slate-800 border border-slate-700 text-slate-300 shadow-xl
                                       opacity-0 pointer-events-none group-hover/tip:opacity-100 transition-opacity duration-150"
                        >
                            You don&apos;t have permission to edit this task
                        </div>
                    </div>
                )}

                <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-100 leading-snug">{task.title}</p>
                    {task.description && (
                        <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                            {task.description}
                        </p>
                    )}
                </div>

                {initials && (
                    <div className="relative group/avatar shrink-0 ml-1">
                        <div
                            aria-label={`Assigned to ${assigneeName}`}
                            className="w-6 h-6 rounded-full bg-indigo-600/30 border border-indigo-500/40
                                       flex items-center justify-center text-[10px] font-bold text-indigo-300
                                       select-none cursor-default"
                        >
                            {initials}
                        </div>
                        <div
                            role="tooltip"
                            className="absolute right-0 top-full mt-1.5 z-50 whitespace-nowrap px-2.5 py-1.5 rounded-lg text-xs font-medium
                                       bg-slate-800 border border-slate-700 text-slate-300 shadow-xl
                                       opacity-0 pointer-events-none group-hover/avatar:opacity-100 transition-opacity duration-150"
                        >
                            Assigned to: {assigneeName}
                        </div>
                    </div>
                )}
            </div>

            {/* Footer: due date + status badge */}
            <div className="flex items-center justify-between gap-2 pt-0.5">
                {task.due_date ? (
                    <div className={`flex items-center gap-1 text-xs font-medium ${isOverdue ? "text-red-400" : "text-slate-500"}`}>
                        <Calendar size={11} className={isOverdue ? "text-red-400" : "text-slate-600"} />
                        {new Date(task.due_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        {isOverdue && <span className="text-red-400 font-semibold">&nbsp;Overdue</span>}
                    </div>
                ) : (
                    <span />
                )}

                {/* Status badge — opens a portal dropdown to escape the scroll container */}
                <button
                    ref={btnRef}
                    onClick={(e) => { e.stopPropagation(); openDropdown(); }}
                    aria-haspopup="listbox"
                    aria-expanded={dropdownOpen}
                    aria-label="Change task status"
                    className={`
                        flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-full border transition-all
                        ${meta.color} ${meta.bg}
                        ${canEdit ? "hover:opacity-90 cursor-pointer" : "opacity-70 cursor-not-allowed"}
                    `}
                >
                    {meta.icon}
                    {meta.label}
                    {canEdit && <ChevronDown size={10} className="opacity-60" />}
                </button>
            </div>

            {/* Portal dropdown — rendered at document.body to escape overflow clipping */}
            {dropdownOpen && canEdit && dropPos && createPortal(
                <ul
                    role="listbox"
                    aria-label="Select status"
                    onMouseDown={(e) => e.stopPropagation()}
                    style={{ top: dropPos.top, left: dropPos.left }}
                    className="fixed z-[9999] w-36
                               bg-slate-800 border border-slate-700 rounded-xl shadow-2xl shadow-black/60 overflow-hidden"
                >
                    {STATUS_ORDER.map((s) => {
                        const m = STATUS_META[s];
                        return (
                            <li
                                key={s}
                                role="option"
                                aria-selected={task.status === s}
                                onClick={() => {
                                    setDropdownOpen(false);
                                    if (task.status !== s) onStatusChange(task.id, s);
                                }}
                                className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold cursor-pointer transition-colors
                                    ${task.status === s
                                        ? `${m.color} bg-white/5`
                                        : "text-slate-400 hover:text-white hover:bg-white/5"
                                    }`}
                            >
                                <span className={task.status === s ? m.color : "text-slate-600"}>
                                    {m.icon}
                                </span>
                                {m.label}
                            </li>
                        );
                    })}
                </ul>,
                document.body
            )}
        </div>
    );
}
