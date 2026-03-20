"use client";
import { useState } from "react";
import { Task, TaskStatus, ProjectMember } from "@/types";
import KanbanColumn from "./KanbanColumn";
import api from "@/lib/api";

const COLUMNS: TaskStatus[] = ["TODO", "IN_PROGRESS", "DONE"];

interface KanbanBoardProps {
    tasks: Task[];
    canEdit: boolean;
    members: ProjectMember[];
    onTasksChange: (tasks: Task[]) => void;
}

export default function KanbanBoard({ tasks, canEdit, members, onTasksChange }: KanbanBoardProps) {
    const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null);

    const handleDrop = async (targetStatus: TaskStatus) => {
        if (!draggingTaskId || !canEdit) return;

        const task = tasks.find((t) => t.id === draggingTaskId);
        if (!task || task.status === targetStatus) {
            setDraggingTaskId(null);
            return;
        }

        // Optimistic update
        const prev = tasks;
        onTasksChange(tasks.map((t) => (t.id === draggingTaskId ? { ...t, status: targetStatus } : t)));
        setDraggingTaskId(null);

        try {
            const { data } = await api.patch<Task>(`/tasks/${draggingTaskId}/status`, { status: targetStatus });
            // Sync with server response
            onTasksChange(prev.map((t) => (t.id === data.id ? data : t)));
        } catch {
            // Rollback on failure
            onTasksChange(prev);
        }
    };

    const handleStatusChange = async (taskId: string, status: TaskStatus) => {
        if (!canEdit) return;

        const prev = tasks;
        onTasksChange(tasks.map((t) => (t.id === taskId ? { ...t, status } : t)));

        try {
            const { data } = await api.patch<Task>(`/tasks/${taskId}/status`, { status });
            onTasksChange(prev.map((t) => (t.id === data.id ? data : t)));
        } catch {
            onTasksChange(prev);
        }
    };

    return (
        <div
            className="grid grid-cols-1 sm:grid-cols-3 gap-4 min-w-0"
            role="application"
            aria-label="Kanban board"
        >
            {COLUMNS.map((status) => (
                <KanbanColumn
                    key={status}
                    status={status}
                    tasks={tasks.filter((t) => t.status === status)}
                    canEdit={canEdit}
                    members={members}
                    draggingTaskId={draggingTaskId}
                    onDragStart={(id) => setDraggingTaskId(id)}
                    onDrop={handleDrop}
                    onStatusChange={handleStatusChange}
                />
            ))}
        </div>
    );
}
