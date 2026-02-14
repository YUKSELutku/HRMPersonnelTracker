// Path: NextFrontend/src/components/ui/toast.tsx
'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

// ── Types ────────────────────────────────────────────────────
interface Toast {
    id: string;
    title: string;
    description?: string;
    variant?: 'default' | 'success' | 'destructive';
    duration?: number;
}

interface ToastContextValue {
    toasts: Toast[];
    addToast: (toast: Omit<Toast, 'id'>) => void;
    removeToast: (id: string) => void;
}

const ToastContext = React.createContext<ToastContextValue>({
    toasts: [],
    addToast: () => { },
    removeToast: () => { },
});

// ── Provider ─────────────────────────────────────────────────
export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = React.useState<Toast[]>([]);

    const addToast = React.useCallback((toast: Omit<Toast, 'id'>) => {
        const id = `toast_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
        const newToast = { ...toast, id };
        setToasts((prev) => [...prev, newToast]);

        // Auto-remove after duration
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, toast.duration ?? 4000);
    }, []);

    const removeToast = React.useCallback((id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    return (
        <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
            {children}
            <ToastViewport />
        </ToastContext.Provider>
    );
}

// ── Hook ─────────────────────────────────────────────────────
export function useToast() {
    const context = React.useContext(ToastContext);
    return {
        toast: context.addToast,
        dismiss: context.removeToast,
        toasts: context.toasts,
    };
}

// ── Viewport (renders all active toasts) ─────────────────────
function ToastViewport() {
    const { toasts, removeToast } = React.useContext(ToastContext);

    if (toasts.length === 0) return null;

    return (
        <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 w-full max-w-sm">
            {toasts.map((toast) => (
                <div
                    key={toast.id}
                    className={cn(
                        'rounded-lg border p-4 shadow-lg animate-in slide-in-from-right-full',
                        'transition-all duration-300',
                        toast.variant === 'destructive'
                            ? 'border-red-200 bg-red-50 text-red-900'
                            : toast.variant === 'success'
                                ? 'border-green-200 bg-green-50 text-green-900'
                                : 'border-border bg-card text-card-foreground'
                    )}
                >
                    <div className="flex items-start justify-between gap-2">
                        <div>
                            <p className="text-sm font-semibold">{toast.title}</p>
                            {toast.description && (
                                <p className="mt-1 text-xs opacity-80">{toast.description}</p>
                            )}
                        </div>
                        <button
                            onClick={() => removeToast(toast.id)}
                            className="rounded p-1 opacity-50 hover:opacity-100 transition-opacity text-xs"
                        >
                            ✕
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
} 