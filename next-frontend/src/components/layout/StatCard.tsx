// Path: NextFrontend/src/components/layout/StatCard.tsx
'use client';

import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface StatCardProps {
    title: string;
    value: string | number;
    icon: string;
    colorClass?: string;
    loading?: boolean;
    subtitle?: string;
}

export function StatCard({ title, value, icon, colorClass, loading, subtitle }: StatCardProps) {
    return (
        <Card className={cn('transition-shadow hover:shadow-md', colorClass)}>
            <CardContent className="p-6">
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <p className="text-sm font-medium opacity-80">{title}</p>
                        {loading ? (
                            <Skeleton className="h-10 w-20" />
                        ) : (
                            <p className="text-4xl font-bold tabular-nums">{value}</p>
                        )}
                        {subtitle && (
                            <p className="text-xs opacity-60">{subtitle}</p>
                        )}
                    </div>
                    <span className="text-4xl opacity-40">{icon}</span>
                </div>
            </CardContent>
        </Card>
    );
} 