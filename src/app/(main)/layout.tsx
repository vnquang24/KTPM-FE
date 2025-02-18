import Header from "@/components/panel/header";
import Sidebar from "@/components/panel/side-bars";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = {
    name: "Quang",
    icon: null
  };

  return (
    <div className="min-h-screen bg-slate-100 flex gap-4 pr-4">
      <Sidebar />
      <div className="flex-1 flex flex-col gap-4 pt-2 max-h-screen">
        <Header pathName="Trang chủ" user={user} />
        <main className="flex-1 p-4 rounded-xl bg-white shadow-sm overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}