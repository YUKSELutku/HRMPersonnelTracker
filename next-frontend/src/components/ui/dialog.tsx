// Path: NextFrontend/src/components/ui/dialog.tsx
'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

// ── Context ──────────────────────────────────────────────────
interface DialogContextValue {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const DialogContext = React.createContext<DialogContextValue>({
    open: false,
    onOpenChange: () => { },
});

// ── Dialog Root ──────────────────────────────────────────────
interface DialogProps {
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    children: React.ReactNode;
}

function Dialog({ open = false, onOpenChange, children }: DialogProps) {
    const [internalOpen, setInternalOpen] = React.useState(open);
    const isControlled = onOpenChange !== undefined;
    const isOpen = isControlled ? open : internalOpen;

    const handleOpenChange = React.useCallback(
        (newOpen: boolean) => {
            if (isControlled) {
                onOpenChange?.(newOpen);
            } else {
                setInternalOpen(newOpen);
            }
        },
        [isControlled, onOpenChange]
    );

    return (
        <DialogContext.Provider value={{ open: isOpen, onOpenChange: handleOpenChange }}>
            {children}
        </DialogContext.Provider>
    );
}

// ── Trigger ──────────────────────────────────────────────────
interface DialogTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    asChild?: boolean;
}

const DialogTrigger = React.forwardRef<HTMLButtonElement, DialogTriggerProps>(
    ({ onClick, children, ...props }, ref) => {
        const { onOpenChange } = React.useContext(DialogContext);
        return (
            <button
                ref={ref}
                onClick={(e) => {
                    onOpenChange(true);
                    onClick?.(e);
                }}
                {...props}
            >
                {children}
            </button>
        );
    }
);
DialogTrigger.displayName = 'DialogTrigger';

// ── Overlay ──────────────────────────────────────────────────
const DialogOverlay = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
    ({ className, ...props }, ref) => {
        const { open, onOpenChange } = React.useContext(DialogContext);
        if (!open) return null;

        return (
            <div
                ref={ref}
                className={cn(
                    'fixed inset-0 z-50 bg-black/50 backdrop-blur-sm animate-in fade-in-0',
                    className
                )}
                onClick={() => onOpenChange(false)}
                {...props}
            />
        );
    }
);
DialogOverlay.displayName = 'DialogOverlay';

// ── Content ──────────────────────────────────────────────────
const DialogContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
    ({ className, children, ...props }, ref) => {
        const { open, onOpenChange } = React.useContext(DialogContext);
        if (!open) return null;

        // Close on Escape
        React.useEffect(() => {
            const handler = (e: KeyboardEvent) => {
                if (e.key === 'Escape') onOpenChange(false);
            };
            document.addEventListener('keydown', handler);
            return () => document.removeEventListener('keydown', handler);
        }, [onOpenChange]);

        return (
            <>
                <DialogOverlay />
                <div
                    ref={ref}
                    className={cn(
                        'fixed left-[50%] top-[50%] z-50 w-full max-w-lg translate-x-[-50%] translate-y-[-50%]',
                        'rounded-xl border border-border bg-card p-6 shadow-xl',
                        'animate-in fade-in-0 zoom-in-95',
                        className
                    )}
                    onClick={(e) => e.stopPropagation()}
                    {...props}
                >
                    {children}
                    <button
                        onClick={() => onOpenChange(false)}
                        className="absolute right-4 top-4 rounded-sm p-1 text-muted-foreground opacity-70 hover:opacity-100 transition-opacity"
                    >
                        <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M11.7816 4.03157C12.0062 3.80702 12.0062 3.44295 11.7816 3.2184C11.5571 2.99385 11.193 2.99385 10.9685 3.2184L7.50005 6.68682L4.03164 3.2184C3.80708 2.99385 3.44301 2.99385 3.21846 3.2184C2.99391 3.44295 2.99391 3.80702 3.21846 4.03157L6.68688 7.49999L3.21846 10.9684C2.99391 11.193 2.99391 11.557 3.21846 11.7816C3.44301 12.0061 3.80708 12.0061 4.03164 11.7816L7.50005 8.31316L10.9685 11.7816C11.193 12.0061 11.5571 12.0061 11.7816 11.7816C12.0062 11.557 12.0062 11.193 11.7816 10.9684L8.31322 7.49999L11.7816 4.03157Z"
                                fill="currentColor" fillRule="evenodd" clipRule="evenodd" />
                        </svg>
                    </button>
                </div>
            </>
        );
    }
);
DialogContent.displayName = 'DialogContent';

// ── Header / Footer / Title / Description ────────────────────
const DialogHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
    <div className={cn('flex flex-col space-y-1.5 text-center sm:text-left mb-4', className)} {...props} />
);
DialogHeader.displayName = 'DialogHeader';

const DialogFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
    <div className={cn('flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 mt-6', className)} {...props} />
);
DialogFooter.displayName = 'DialogFooter';

const DialogTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
    ({ className, ...props }, ref) => (
        <h2 ref={ref} className={cn('text-lg font-semibold leading-none tracking-tight', className)} {...props} />
    )
);
DialogTitle.displayName = 'DialogTitle';

const DialogDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
    ({ className, ...props }, ref) => (
        <p ref={ref} className={cn('text-sm text-muted-foreground', className)} {...props} />
    )
);
DialogDescription.displayName = 'DialogDescription';

export {
    Dialog,
    DialogTrigger,
    DialogContent,
    DialogHeader,
    DialogFooter,
    DialogTitle,
    DialogDescription,
    DialogOverlay,
};