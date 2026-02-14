// Path: NextFrontend/src/components/salary/SalaryForm.tsx
'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { type Employee, type SalaryDefinition } from '@/lib/bridge';
import { formatCurrency } from '@/lib/utils';

interface Props {
    employees: Employee[];
    initialData: SalaryDefinition | null;
    onSave: (data: Partial<SalaryDefinition>) => void;
    onClose: () => void;
}

export function SalaryForm({ employees, initialData, onSave, onClose }: Props) {
    const { t } = useTranslation();
    const [saving, setSaving] = useState(false);

    const [form, setForm] = useState({
        employeeId: initialData?.employeeId ?? (employees[0]?.id ?? 0),
        grossSalary: initialData?.grossSalary ?? 0,
        paymentPeriod: initialData?.paymentPeriod ?? 'Monthly',
        mealAllowance: initialData?.mealAllowance ?? 0,
        transportAllowance: initialData?.transportAllowance ?? 0,
        privateHealthInsurance: initialData?.privateHealthInsurance ?? 0,
        familyAllowance: initialData?.familyAllowance ?? 0,
        housingAllowance: initialData?.housingAllowance ?? 0,
        educationAllowance: initialData?.educationAllowance ?? 0,
        monthlyBonus: initialData?.monthlyBonus ?? 0,
        effectiveDate: initialData?.effectiveDate?.split('T')[0] ?? new Date().toISOString().split('T')[0],
        notes: initialData?.notes ?? '',
    });

    const set = (key: string, value: any) => setForm((f) => ({ ...f, [key]: value }));
    const num = (key: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
        set(key, parseFloat(e.target.value) || 0);

    const approxMealMonthly = form.mealAllowance * 22; // ~22 weekdays average
    const totalAllowances =
        approxMealMonthly + form.transportAllowance + form.privateHealthInsurance +
        form.familyAllowance + form.housingAllowance + form.educationAllowance + form.monthlyBonus;

    const totalPackage = form.grossSalary + totalAllowances;

    // Approximate net (simplified — real calc is server-side)
    const sgk = form.grossSalary * 0.14;
    const unemp = form.grossSalary * 0.01;
    const taxable = form.grossSalary - sgk - unemp;
    const tax = taxable * 0.15; // First bracket approximation
    const stamp = totalPackage * 0.00759;
    const approxNet = totalPackage - sgk - unemp - tax - stamp;

    const handleSubmit = async () => {
        setSaving(true);
        try {
            await onSave(form);
        } finally {
            setSaving(false);
        }
    };

    const inputClass = "w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30";
    const labelClass = "block text-xs font-medium text-muted-foreground mb-1";

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-4 overflow-y-auto">
            <div className="w-full max-w-2xl rounded-xl bg-card border border-border shadow-xl my-8">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-border px-6 py-4">
                    <h2 className="text-lg font-semibold">
                        {initialData ? t('salary_edit') : t('salary_define')}
                    </h2>
                    <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-xl">&times;</button>
                </div>

                <div className="space-y-6 p-6">
                    {/* Employee & Payment Period */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className={labelClass}>{t('employee_name')}</label>
                            <select
                                value={form.employeeId}
                                onChange={(e) => set('employeeId', parseInt(e.target.value))}
                                disabled={!!initialData}
                                className={inputClass}
                            >
                                {employees.map((emp) => (
                                    <option key={emp.id} value={emp.id}>{emp.fullName}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className={labelClass}>{t('salary_payment_period')}</label>
                            <select value={form.paymentPeriod} onChange={(e) => set('paymentPeriod', e.target.value)} className={inputClass}>
                                <option value="Monthly">{t('salary_monthly')}</option>
                                <option value="BiWeekly">{t('salary_biweekly')}</option>
                                <option value="Weekly">{t('salary_weekly')}</option>
                            </select>
                        </div>
                    </div>

                    {/* Section: Core Salary */}
                    <div>
                        <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                            <span className="inline-block w-1 h-4 bg-primary rounded" />
                            {t('salary_section_core')}
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className={labelClass}>{t('salary_gross')} (₺)</label>
                                <input type="number" value={form.grossSalary || ''} onChange={num('grossSalary')} className={inputClass} placeholder="55,000" />
                            </div>
                            <div>
                                <label className={labelClass}>{t('salary_effective_date')}</label>
                                <input type="date" value={form.effectiveDate} onChange={(e) => set('effectiveDate', e.target.value)} className={inputClass} />
                            </div>
                        </div>
                    </div>

                    {/* Section: Benefits */}
                    <div>
                        <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                            <span className="inline-block w-1 h-4 bg-green-500 rounded" />
                            {t('salary_section_benefits')}
                        </h3>
                        <div className="grid grid-cols-3 gap-4">
                            {/* Meal Allowance — special: daily with hint */}
                            <div>
                                <label className={labelClass}>{t('salary_meal')} (₺)</label>
                                <input
                                    type="number"
                                    value={form.mealAllowance || ''}
                                    onChange={num('mealAllowance')}
                                    className={inputClass}
                                    placeholder="0"
                                />
                                <p className="text-[10px] text-muted-foreground mt-0.5">{t('salary_meal_hint')}</p>
                            </div>
                            {[
                                ['transportAllowance', 'salary_transport'],
                                ['privateHealthInsurance', 'salary_health_insurance'],
                                ['familyAllowance', 'salary_family'],
                                ['housingAllowance', 'salary_housing'],
                                ['educationAllowance', 'salary_education'],
                            ].map(([key, label]) => (
                                <div key={key}>
                                    <label className={labelClass}>{t(label)} (₺)</label>
                                    <input
                                        type="number"
                                        value={(form as any)[key] || ''}
                                        onChange={num(key)}
                                        className={inputClass}
                                        placeholder="0"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Section: Bonus */}
                    <div>
                        <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                            <span className="inline-block w-1 h-4 bg-amber-500 rounded" />
                            {t('salary_section_bonus')}
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className={labelClass}>{t('salary_bonus')} (₺)</label>
                                <input type="number" value={form.monthlyBonus || ''} onChange={num('monthlyBonus')} className={inputClass} placeholder="0" />
                            </div>
                            <div>
                                <label className={labelClass}>{t('salary_notes')}</label>
                                <input type="text" value={form.notes} onChange={(e) => set('notes', e.target.value)} className={inputClass} placeholder="..." />
                            </div>
                        </div>
                    </div>

                    {/* Summary Card */}
                    <div className="rounded-lg bg-muted/50 p-4 space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">{t('salary_gross')}</span>
                            <span className="font-medium">{formatCurrency(form.grossSalary)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">{t('salary_total_allowances')}</span>
                            <span className="font-medium text-green-600">+ {formatCurrency(totalAllowances)}</span>
                        </div>
                        <div className="flex justify-between border-t border-border pt-2">
                            <span className="font-semibold">{t('salary_total_cost')}</span>
                            <span className="font-bold text-lg">{formatCurrency(totalPackage)}</span>
                        </div>
                        <div className="flex justify-between text-muted-foreground">
                            <span>{t('salary_net_approx')}</span>
                            <span>≈ {formatCurrency(approxNet > 0 ? approxNet : 0)}</span>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-3 border-t border-border px-6 py-4">
                    <button onClick={onClose} className="rounded-lg border border-input px-4 py-2 text-sm hover:bg-accent">{t('btn_cancel')}</button>
                    <button
                        onClick={handleSubmit}
                        disabled={saving || !form.employeeId || form.grossSalary <= 0}
                        className="rounded-lg bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                    >
                        {saving ? t('loading') : t('btn_save')}
                    </button>
                </div>
            </div>
        </div>
    );
}