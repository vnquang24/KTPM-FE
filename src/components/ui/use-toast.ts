import { useToast as useToastOriginal, type ToastActionElement, ToastContextProvider } from "@/components/ui/toast";

export { type ToastActionElement, ToastContextProvider };

export const useToast = useToastOriginal;

export type ToastProps = {
  title?: string;
  description?: string;
  action?: ToastActionElement;
  variant?: "default" | "destructive";
  id?: string;
  duration?: number;
};

// Export toast function trực tiếp từ hook
export const toast = (props: ToastProps) => {
  // Lưu ý: Đây là implementation tốt nhất cho toast function
  // nhưng nó sẽ không hoạt động ở server components
  // Chỉ nên dùng trong client components
  try {
    const { toast: toastFn } = useToastOriginal();
    return toastFn(props);
  } catch (error) {
    console.error("Toast context not found, make sure you're using it in a client component", error);
    
    // Fallback implementation (không có hiệu ứng UI)
    console.log("Toast:", props.title, props.description);
    return null;
  }
}; 