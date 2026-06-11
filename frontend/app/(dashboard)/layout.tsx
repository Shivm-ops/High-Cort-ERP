import Sidebar from "@/components/layout/Sidebar";
import AuthGuard from "@/components/auth/AuthGuard";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <div className="flex h-screen overflow-hidden bg-workspace-bg print:h-auto print:overflow-visible print:bg-white print:block">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden print:overflow-visible print:block">
          <main className="flex-1 overflow-y-auto print:overflow-visible">
            {children}
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}
