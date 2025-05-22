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

export const toast = (props: ToastProps) => {
  try {
    const { toast: toastFn } = useToastOriginal();
    return toastFn(props);
  } catch (error) {
    console.error("Toast context not found, make sure you're using it in a client component", error);
    
    console.log("Toast:", props.title, props.description);
    return null;
  }
}; 