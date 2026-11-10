import type { ReactNode } from 'react';
import { Toaster, toast } from 'sonner';
import { useTheme } from './theme-provider';

const notifications = {
  success: (title: string, description?: string) => toast.success(title, { description }),
  error: (title: string, description?: string) => toast.error(title, { description, duration: 7000 }),
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const { theme } = useTheme();

  return (
    <>
      {children}
      <Toaster
        theme={theme}
        position="top-right"
        duration={5000}
        richColors
        closeButton
        toastOptions={{ closeButtonAriaLabel: 'Close notification' }}
      />
    </>
  );
}

export function useToast() {
  return notifications;
}
