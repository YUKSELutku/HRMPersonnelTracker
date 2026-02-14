// Path: NextFrontend/src/components/layout/LoadingState.tsx
'use client';

import { useTranslation } from 'react-i18next';
import { Skeleton } from '@/components/ui/skeleton';

interface LoadingStateProps {
    rows?: number;
    type?: 'table' | 'cards' | 'spinner';
}

export function LoadingState({ rows = 5, type = 'table' }: LoadingStateProps) {
    const { t } = useTranslation();

    if (type === 'spinner') {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="flex flex-col items-center gap-3">
                    <svg
                        className="h-8 w-8 animate-spin text-primary"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                    >
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    <p className="text-sm text-muted-foreground">{t('loading')}</p>
                </div>
            </div>
        );
    }

    if (type === 'cards') {
        return (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: rows }).map((_, i) => (
                    <Skeleton key={i} className="h-32 w-full rounded-xl" />
                ))}
            </div>
        );
    }

    // Table skeleton
    return (
        <div className="rounded-lg border border-border">
            <div className="space-y-0">
                <Skeleton className="h-12 w-full rounded-t-lg" />
                {Array.from({ length: rows }).map((_, i) => (
                    <Skeleton key={i} className="h-14 w-full" />
                ))}
            </div>
        </div>
    );
} 