"use client";
import Footer from "@/components/panel/footer";
import Header from "@/components/panel/header";
import Sidebar from "@/components/panel/side-bars";
import { menuItems } from "@/lib/menu-data";
import { usePathname, useRouter } from "next/navigation";
import { getUserId, getUserData, isAuthenticated, getUserRole } from "@/utils/auth";
import { useFindUniqueAccount } from "@/generated/hooks";
import { useEffect, useState } from "react";

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [userData, setUserData] = useState({ name: "Đang tải...", icon: null });
  
  const userId = getUserId();
  
  const { data: user } = useFindUniqueAccount(
    {
      where: { id: userId || '' },
      select: { username: true, email: true, role: true }
    },
    {
      enabled: !!userId
    }
  );

  useEffect(() => {
    if (user) {
      setUserData({ name: user.username, icon: null });
    } else {
      const localUserData = getUserData();
      if (localUserData) {
        setUserData({ name: localUserData.username, icon: null });
      }
    }
  }, [user]);

  if (!userId) {
    return <div className="flex items-center justify-center h-screen">Đang tải...</div>;
  }

  const findMenuLabel = (path: string): string => {
    const mainItem = menuItems.customer.find(item => item.pathname === path);
    if (mainItem) return mainItem.label;

    for (const item of menuItems.customer) {
      if (item.subMenu) {
        const subItem = item.subMenu.find(sub => sub.pathname === path);
        if (subItem) return subItem.label;
      }
    }

    return 'Trang chủ'; // Default fallback
  };

  return (
    <div className="min-h-screen bg-slate-100 flex gap-4 pr-4">
      <Sidebar />
      <div className="flex-1 flex flex-col gap-4 pt-2 max-h-screen">
        <Header pathName={findMenuLabel(pathname)} user={userData} />
        <main className="flex-1 overflow-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
          <div className="p-4 rounded-xl bg-white shadow-sm min-h-full">
            {children}
          </div>
        </main>
      </div>
      <Footer />
    </div>
  );
}