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
  
  // Lấy userId từ access token
  const userId = getUserId();
  
  // Fetch user data dựa vào userId từ access token nếu cần
  const { data: user } = useFindUniqueAccount(
    {
      where: { id: userId || '' },
      select: { username: true, email: true, role: true }
    },
    {
      // Chỉ gọi API khi userId có giá trị
      enabled: !!userId
    }
  );

  // Cập nhật userData khi user data được tải về từ API hoặc từ local storage
  useEffect(() => {
    // Ưu tiên dữ liệu từ API
    if (user) {
      setUserData({ name: user.username, icon: null });
    } else {
      // Fallback về dữ liệu từ local storage/cookie
      const localUserData = getUserData();
      if (localUserData) {
        setUserData({ name: localUserData.username, icon: null });
      }
    }
  }, [user]);

  // Early return nếu không có userId
  if (!userId) {
    return <div className="flex items-center justify-center h-screen">Đang tải...</div>;
  }

  // Function to find menu item label by pathname
  const findMenuLabel = (path: string): string => {
    // Check main menu items
    const mainItem = menuItems.customer.find(item => item.pathname === path);
    if (mainItem) return mainItem.label;

    // Check submenu items
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