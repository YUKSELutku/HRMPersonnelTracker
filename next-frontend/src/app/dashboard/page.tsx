// Path: NextFrontend/src/app/dashboard/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { api, type DashboardData } from '@/lib/bridge';
import { cn } from '@/lib/utils';

export default function DashboardPage() {
    const { t } = useTranslation();
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.getDashboard()
            .then(setData)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    const kpiCards = [
        {
            key: 'dashboard_active_employees',
            value: data?.activeEmployees ?? '—',
            icon: '👥',
            color: 'bg-blue-50 text-blue-700 border-blue-200',
        },
        {
            key: 'dashboard_late_arrivals',
            value: data?.lateArrivals ?? '—',
            icon: '⏰',
            color: 'bg-amber-50 text-amber-700 border-amber-200',
        },
    ];

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-foreground">
                    {t('dashboard_title')}
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                    {t('dashboard_subtitle')}
                </p>
            </div>

            {/* KPI Cards */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {kpiCards.map((card) => (
                    <div
                        key={card.key}
                        className={cn(
                            'rounded-xl border p-6 transition-shadow hover:shadow-md',
                            card.color
                        )}
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium opacity-80">{t(card.key)}</p>
                                <p className="mt-2 text-4xl font-bold">
                                    {loading ? '...' : card.value}
                                </p>
                            </div>
                            <span className="text-4xl opacity-50">{card.icon}</span>
                        </div>
                    </div>
                ))}

                {/* Date card */}
                <div className="rounded-xl border border-border bg-card p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">
                                {t('attendance_date')}
                            </p>
                            <p className="mt-2 text-2xl font-bold text-foreground">
                                {data?.date
                                    ? new Date(data.date).toLocaleDateString(
                                        t('lang_tr') === 'Türkçe' ? 'tr-TR' : 'en-US',
                                        { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }
                                    )
                                    : '...'}
                            </p>
                        </div>
                        <span className="text-4xl opacity-50">📅</span>
                    </div>
                </div>
            </div>
        </div>
    );
} 