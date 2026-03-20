"use client";
import { useState, useRef } from "react";
import { Task, TaskStatus, ProjectMember } from "@/types";
import TaskCard from "./TaskCard";
import { Circle, Clock, CheckCircle2 } from "lucide-react";

const COLUMN_META: Record<TaskStatus, {
    label: string;
    dotClass: string;
    glowClass: string;
    icon: React.ReactNode;
    headerGradient: string;
}> = {
    TODO: {
        label: "To Do",
        dotClass: "bg-slate-400",
        glowClass: "border-slate-500/20 shadow-slate-900",
        icon: <Circle size={14} className="text-slate-400" />,
        headerGradient: "from-slate-500/10 to-transparent",
    },
    IN_PROGRESS: {
        label: "In Progress",
        dotClass: "bg-amber-400",
        glowClass: "border-amber-500/20 shadow-amber-900/10",
        icon: <Clock size={14} className="text-amber-400" />,
        headerGradient: "from-amber-500/10 to-transparent",
    },
    DONE: {
        label: "Done",
        dotClass: "bg-emerald-400",
        glowClass: "border-emerald-500/20 shadow-emerald-900/10",
        icon: <CheckCircle2 size={14} className="text-emerald-400" />,
        headerGradient: "from-emerald-500/10 to-transparent",
    },
};

interface KanbanColumnProps {
    status: TaskStatus;
    tasks: Task[];
    canEdit: boolean;
    members: ProjectMember[];
    draggingTaskId: string | null;
    onDragStart: (taskId: string) => void;
    onDrop: (targetStatus: TaskStatus) => void;
    onStatusChange: (taskId: string, status: TaskStatus) => void;
}

export default function KanbanColumn({
    status,
    tasks,
    canEdit,
    members,
    draggingTaskId,
    onDragStart,
    onDrop,
    onStatusChange,
}: KanbanColumnProps) {
    const [isDragOver, setIsDragOver] = useState(false);
    const dropRef = useRef<HTMLDivElement>(null);
    const meta = COLUMN_META[status];

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        setIsDragOver(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        // Only clear if we actually left this column (not just entering a child)
        if (!dropRef.current?.contains(e.relatedTarget as Node)) {
            setIsDragOver(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
        onDrop(status);
    };

    // Is the currently dragging task already in this column?
    const isDraggingIntoSelf =
        draggingTaskId && tasks.some((t) => t.id === draggingTaskId);

    return (
        <div
            ref={dropRef}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`
                flex flex-col rounded-2xl border transition-all duration-200
                bg-slate-900/60 backdrop-blur-sm
                ${isDragOver && !isDraggingIntoSelf
                    ? `border-indigo-500/60 shadow-lg shadow-indigo-500/10 bg-indigo-950/40`
                    : `border-slate-800/80 ${meta.glowClass}`
                }
            `}
            role="region"
            aria-label={`${meta.label} column`}
            aria-dropeffect={canEdit ? "move" : "none"}
        >
            {/* Column Header */}
            <div className={`px-4 pt-4 pb-3 rounded-t-2xl bg-gradient-to-b ${meta.headerGradient}`}>
                <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${meta.dotClass} shrink-0`} aria-hidden="true" />
                    {meta.icon}
                    <span className="text-sm font-semibold text-slate-200 tracking-tight">{meta.label}</span>
                    <span
                        className="ml-auto text-xs font-bold text-slate-500 bg-slate-800/80 px-2.5 py-0.5 rounded-full border border-slate-700/50"
                        aria-label={`${tasks.length} tasks`}
                    >
                        {tasks.length}
                    </span>
                </div>
            </div>

            {/* Task List */}
            <div
                className="flex-1 px-3 pb-3 space-y-2 overflow-y-auto max-h-[calc(100vh-260px)] min-h-[120px]"
                style={{ scrollbarGutter: "stable" }}
            >
                {tasks.map((task) => (
                    <TaskCard
                        key={task.id}
                        task={task}
                        canEdit={canEdit}
                        members={members}
                        onDragStart={onDragStart}
                        onStatusChange={onStatusChange}
                    />
                ))}

                {/* Drop zone indicator */}
                {isDragOver && !isDraggingIntoSelf && (
                    <div
                        className="rounded-xl border-2 border-dashed border-indigo-500/50 bg-indigo-500/5 h-14
                                   flex items-center justify-center text-indigo-400 text-xs font-medium
                                   animate-pulse"
                        aria-hidden="true"
                    >
                        Drop here
                    </div>
                )}

                {/* Empty state (only when not dragging over) */}
                {tasks.length === 0 && !isDragOver && (
                    <div className="text-center py-8 text-slate-700 text-xs select-none">
                        No tasks
                    </div>
                )}
            </div>
        </div>
    );
}
