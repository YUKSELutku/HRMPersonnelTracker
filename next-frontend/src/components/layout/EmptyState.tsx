// Path: NextFrontend/src/components/layout/EmptyState.tsx
'use client';

import { Button } from '@/components/ui/button';

interface EmptyStateProps {
    icon: string;
    title: string;
    description?: string;
    action?: {
        label: string;
        onClick: () => void;
    };
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
    return (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card/50 p-12 text-center">
            <span className="text-5xl mb-4">{icon}</span>
            <h3 className="text-lg font-semibold text-foreground">{title}</h3>
            {description && (
                <p className="mt-1 text-sm text-muted-foreground max-w-sm">{description}</p>
            )}
            {action && (
                <Button className="mt-4" onClick={action.onClick}>
                    {action.label}
                </Button>
            )}
        </div>
    );
} 