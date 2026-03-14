"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  type ReactNode
} from "react";
import { Toaster, toast as hotToast } from "react-hot-toast";

type ToastVariant = "success" | "error";

interface ToastContextValue {
  toast: (title: string, variant?: ToastVariant) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const toast = useCallback((title: string, variant: ToastVariant = "success") => {
    if (variant === "error") {
      hotToast.error(title);
      return;
    }

    hotToast.success(title);
  }, []);

  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3500,
          style: {
            borderRadius: "18px",
            border: "1px solid rgba(148, 163, 184, 0.2)",
            background: "rgba(255, 255, 255, 0.96)",
            color: "#0f172a",
            boxShadow: "0 24px 60px -28px rgba(23, 52, 111, 0.28)",
            backdropFilter: "blur(12px)"
          },
          success: {
            iconTheme: {
              primary: "#2f8f3b",
              secondary: "#ffffff"
            }
          },
          error: {
            iconTheme: {
              primary: "#dc2626",
              secondary: "#ffffff"
            }
          }
        }}
      />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error("useToast must be used within ToastProvider.");
  }

  return context;
}

