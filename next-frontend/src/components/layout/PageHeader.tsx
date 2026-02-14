// Path: NextFrontend/src/components/layout/PageHeader.tsx
'use client';

import { Button } from '@/components/ui/button';

interface PageHeaderProps {
    title: string;
    subtitle?: string;
    action?: {
        label: string;
        onClick: () => void;
        icon?: string;
    };
}

export function PageHeader({ title, subtitle, action }: PageHeaderProps) {
    return (
        <div className="flex items-start justify-between">
            <div>
                <h1 className="text-2xl font-bold text-foreground">{title}</h1>
                {subtitle && (
                    <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
                )}
            </div>
            {action && (
                <Button onClick={action.onClick}>
                    {action.icon && <span className="mr-1.5">{action.icon}</span>}
                    {action.label}
                </Button>
            )}
        </div>
    );
} 