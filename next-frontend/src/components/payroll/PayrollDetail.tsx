// Path: NextFrontend/src/components/payroll/PayrollDetail.tsx
'use client';

import { useTranslation } from 'react-i18next';
import { type PayrollRecord } from '@/lib/bridge';
import { formatCurrency } from '@/lib/utils';

interface Props {
    record: PayrollRecord;
    onClose: () => void;
}

export function PayrollDetail({ record, onClose }: Props) {
    const { t } = useTranslation();

    const Row = ({ label, value, bold, color }: {
        label: string; value: number; bold?: boolean; color?: string;
    }) => (
        <div className={`flex justify-between py-1.5 ${bold ? 'font-semibold' : ''}`}>
            <span className="text-muted-foreground">{label}</span>
            <span className={color ?? (bold ? 'text-foreground' : '')}>{formatCurrency(value)}</span>
        </div>
    );

    const Divider = () => <hr className="border-border my-2" />;

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-4 overflow-y-auto">
            <div className="w-full max-w-lg rounded-xl bg-card border border-border shadow-xl my-8">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-border px-6 py-4">
                    <div>
                        <h2 className="text-lg font-semibold">{t('payroll_detail')}</h2>
                        <p className="text-sm text-muted-foreground">
                            {record.employee?.fullName} · {record.period}
                        </p>
                    </div>
                    <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-xl">&times;</button>
                </div>

                <div className="p-6 space-y-4 text-sm">
                    {/* ── Earnings ────────────────────────────────────── */}
                    <div>
                        <h3 className="text-xs font-bold uppercase tracking-wide text-green-600 mb-2">
                            {t('payroll_earnings')}
                        </h3>
                        <Row label={t('salary_gross')} value={record.grossSalary} />
                        {record.mealAllowance > 0 && (
                            <div className="flex justify-between py-1.5">
                                <span className="text-muted-foreground">
                                    {t('salary_meal')}
                                    <span className="ml-1 text-xs opacity-60">({record.mealWorkDays} {t('payroll_meal_days')})</span>
                                </span>
                                <span className="text-green-600">{formatCurrency(record.mealAllowance)}</span>
                            </div>
                        )}
                        {record.transportAllowance > 0 && <Row label={t('salary_transport')} value={record.transportAllowance} color="text-green-600" />}
                        {record.privateHealthInsurance > 0 && <Row label={t('salary_health_insurance')} value={record.privateHealthInsurance} color="text-green-600" />}
                        {record.familyAllowance > 0 && <Row label={t('salary_family')} value={record.familyAllowance} color="text-green-600" />}
                        {record.housingAllowance > 0 && <Row label={t('salary_housing')} value={record.housingAllowance} color="text-green-600" />}
                        {record.educationAllowance > 0 && <Row label={t('salary_education')} value={record.educationAllowance} color="text-green-600" />}
                        {record.bonusAmount > 0 && <Row label={t('salary_bonus')} value={record.bonusAmount} color="text-amber-600" />}
                        {record.overtimePay > 0 && (
                            <div className="flex justify-between py-1.5">
                                <span className="text-muted-foreground">
                                    {t('payroll_overtime_pay')}
                                    <span className="ml-1 text-xs opacity-60">({record.overtimeHours}h · {t('payroll_overtime_formula')})</span>
                                </span>
                                <span className="text-amber-600">{formatCurrency(record.overtimePay)}</span>
                            </div>
                        )}
                        <Divider />
                        <Row label={t('payroll_total_gross')} value={record.totalGross} bold />
                    </div>

                    {/* ── Legal Deductions ──────────────────────────── */}
                    <div>
                        <h3 className="text-xs font-bold uppercase tracking-wide text-red-600 mb-2">
                            {t('payroll_legal_deductions')}
                        </h3>
                        <Row label={t('payroll_sgk_worker')} value={record.sgkWorker} color="text-red-600" />
                        <Row label={t('payroll_unemployment')} value={record.unemploymentWorker} color="text-red-600" />
                        <Row label={t('payroll_income_tax')} value={record.incomeTax} color="text-red-600" />
                        <Row label={t('payroll_stamp_tax')} value={record.stampTax} color="text-red-600" />
                        <Divider />
                        <Row label={t('payroll_total_deductions')} value={record.totalDeductions} bold color="text-red-700" />
                    </div>

                    {/* ── Net ──────────────────────────────────────── */}
                    <div className="rounded-lg bg-primary/5 border border-primary/20 p-4">
                        <div className="flex justify-between items-center">
                            <span className="text-base font-semibold">{t('payroll_net_salary')}</span>
                            <span className="text-2xl font-bold text-primary">{formatCurrency(record.netSalary)}</span>
                        </div>
                    </div>

                    {/* ── Employer Cost (info) ─────────────────────── */}
                    <div className="rounded-lg bg-muted/40 p-4 space-y-1">
                        <h3 className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-2">
                            {t('payroll_employer_cost')}
                        </h3>
                        <Row label={t('payroll_sgk_employer')} value={record.sgkEmployer} />
                        <Row label={t('payroll_unemployment_employer')} value={record.unemploymentEmployer} />
                        <Divider />
                        <Row label={t('payroll_employer_cost')} value={record.totalEmployerCost} bold />
                    </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end border-t border-border px-6 py-4">
                    <button
                        onClick={onClose}
                        className="rounded-lg border border-input px-4 py-2 text-sm hover:bg-accent"
                    >
                        {t('btn_close')}
                    </button>
                </div>
            </div>
        </div>
    );
}