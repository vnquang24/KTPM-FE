import Header from "@/components/header";
import Sidebar from "@/components/side-bars";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = {
    name: "John Doe",
    icon: null
  };

  return (
    <div className="min-h-screen bg-slate-100 flex gap-4 pr-4">
      <Sidebar />
      <div className="flex-1 flex flex-col gap-4 pt-2">
        <Header pathName="Trang chủ" user={user} />
        <main className="flex-1 p-2 rounded-xl bg-white shadow-sm">
          {children}
        </main>
      </div>
    </div>
  );
}