// ——— Auth ———
export interface User {
    id: string;
    email: string;
    username: string;
    created_at: string;
}

export interface LoginResponse {
    message: string;
    access_token: string;
    refresh_token: string;
}

// ——— Projects ———
export interface Project {
    id: string;
    name: string;
    description: string | null;
    owner_id: string;
    created_at: string;
}

export interface ProjectMember {
    id: string;
    user_id: string;
    username: string;
    email: string;
    project_id: string;
    role: string;
    joined_at: string;
}

// ——— Tasks ———
export type TaskStatus = "TODO" | "IN_PROGRESS" | "DONE";

export interface Task {
    id: string;
    title: string;
    description: string | null;
    status: TaskStatus;
    project_id: string;
    assigned_to: string | null;
    due_date: string | null;
    created_at: string;
}
