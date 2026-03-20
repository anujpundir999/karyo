import Sidebar from "@/components/Sidebar";

export default function ProjectsLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex min-h-screen bg-slate-950">
            <Sidebar />
            <main className="ml-60 flex-1 p-8">{children}</main>
        </div>
    );
}
