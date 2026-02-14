// Path: NextFrontend/src/components/reports/ReportExportCard.tsx
'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface ReportExportCardProps {
    titleKey: string;
    icon: string;
    description?: string;
    onExport: () => Promise<{ filePath: string }>;
}

export function ReportExportCard({ titleKey, icon, description, onExport }: ReportExportCardProps) {
    const { t } = useTranslation();
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleExport = async () => {
        setLoading(true);
        setResult(null);
        setError(null);

        try {
            const res = await onExport();
            setResult(res.filePath);
        } catch (err: any) {
            setError(err.message ?? t('error'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="transition-all hover:shadow-md hover:border-primary/20">
            <CardContent className="p-5">
                <div className="flex items-start gap-4">
                    <span className="text-3xl">{icon}</span>
                    <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-foreground">{t(titleKey)}</h3>
                        {description && (
                            <p className="mt-1 text-xs text-muted-foreground">{description}</p>
                        )}

                        <Button
                            size="sm"
                            className="mt-3"
                            loading={loading}
                            onClick={handleExport}
                        >
                            {loading ? t('reports_generating') : t('reports_export')}
                        </Button>

                        {result && (
                            <p className="mt-2 text-xs text-green-600 break-all">
                                ✅ {t('reports_success')}<br />
                                <span className="text-muted-foreground">{result}</span>
                            </p>
                        )}

                        {error && (
                            <p className="mt-2 text-xs text-red-600">❌ {error}</p>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
} 