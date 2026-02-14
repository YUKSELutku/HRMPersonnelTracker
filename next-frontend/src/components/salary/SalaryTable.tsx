// Path: NextFrontend/src/components/salary/SalaryTable.tsx
'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { type SalaryDefinition } from '@/lib/bridge';
import { formatCurrency, formatDate } from '@/lib/utils';

interface Props {
    salaries: SalaryDefinition[];
    onEdit: (salary: SalaryDefinition) => void;
    onDelete: (id: number) => void;
}

export function SalaryTable({ salaries, onEdit, onDelete }: Props) {
    const { t } = useTranslation();
    const [expandedId, setExpandedId] = useState<number | null>(null);

    const periodLabel = (p: string) => {
        const map: Record<string, string> = {
            Monthly: t('salary_monthly'),
            BiWeekly: t('salary_biweekly'),
            Weekly: t('salary_weekly'),
        };
        return map[p] ?? p;
    };

    return (
        <div className="space-y-3">
            {salaries.map((s) => {
                const isExpanded = expandedId === s.id;
                const totalPackage = s.grossSalary + (s.totalAllowances ?? 0);

                return (
                    <div key={s.id} className="rounded-lg border border-border bg-card overflow-hidden">
                        {/* Main Row */}
                        <div
                            className="flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-muted/30 transition-colors"
                            onClick={() => setExpandedId(isExpanded ? null : s.id)}
                        >
                            {/* Employee Info */}
                            <div className="flex-1 min-w-0">
                                <p className="font-medium truncate">{s.employee?.fullName ?? `#${s.employeeId}`}</p>
                                <p className="text-xs text-muted-foreground">
                                    {s.employee?.department ?? ''} · {periodLabel(s.paymentPeriod)}
                                </p>
                            </div>

                            {/* Gross */}
                            <div className="text-right">
                                <p className="text-xs text-muted-foreground">{t('salary_gross')}</p>
                                <p className="font-semibold">{formatCurrency(s.grossSalary)}</p>
                            </div>

                            {/* Benefits */}
                            <div className="text-right">
                                <p className="text-xs text-muted-foreground">{t('salary_benefits')}</p>
                                <p className="font-medium text-green-600">+{formatCurrency(s.totalAllowances ?? 0)}</p>
                            </div>

                            {/* Total Package */}
                            <div className="text-right">
                                <p className="text-xs text-muted-foreground">{t('salary_total_cost')}</p>
                                <p className="font-bold text-lg">{formatCurrency(totalPackage)}</p>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={(e) => { e.stopPropagation(); onEdit(s); }}
                                    className="rounded-md px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/10 transition-colors"
                                >
                                    {t('btn_edit')}
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); onDelete(s.id); }}
                                    className="rounded-md px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors"
                                >
                                    {t('btn_delete')}
                                </button>
                                <span className="text-muted-foreground text-sm ml-1">{isExpanded ? '▲' : '▼'}</span>
                            </div>
                        </div>

                        {/* Expanded Detail */}
                        {isExpanded && (
                            <div className="border-t border-border bg-muted/20 px-5 py-4">
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                                    <DetailItem label={t('salary_meal')} value={s.mealAllowance} />
                                    <DetailItem label={t('salary_transport')} value={s.transportAllowance} />
                                    <DetailItem label={t('salary_health_insurance')} value={s.privateHealthInsurance} />
                                    <DetailItem label={t('salary_family')} value={s.familyAllowance} />
                                    <DetailItem label={t('salary_housing')} value={s.housingAllowance} />
                                    <DetailItem label={t('salary_education')} value={s.educationAllowance} />
                                    <DetailItem label={t('salary_bonus')} value={s.monthlyBonus} highlight />
                                    <div>
                                        <p className="text-xs text-muted-foreground">{t('salary_effective_date')}</p>
                                        <p className="font-medium">{formatDate(s.effectiveDate)}</p>
                                    </div>
                                </div>
                                {s.notes && (
                                    <p className="mt-3 text-xs text-muted-foreground italic">📝 {s.notes}</p>
                                )}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}

function DetailItem({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
    return (
        <div>
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className={`font-medium ${highlight ? 'text-amber-600' : value > 0 ? 'text-green-600' : ''}`}>
                {value > 0 ? formatCurrency(value) : '-'}
            </p>
        </div>
    );
}