// Path: NextFrontend/src/app/payroll/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { api, type PayrollRecord } from '@/lib/bridge';
import { formatCurrency, getCurrentPeriod } from '@/lib/utils';
import { PayrollDetail } from '@/components/payroll/PayrollDetail';

export default function PayrollPage() {
    const { t } = useTranslation();
    const [period, setPeriod] = useState(getCurrentPeriod());
    const [records, setRecords] = useState<PayrollRecord[]>([]);
    const [loading, setLoading] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [selectedRecord, setSelectedRecord] = useState<PayrollRecord | null>(null);

    const loadPayroll = async () => {
        setLoading(true);
        try {
            const data = await api.getPayroll(period);
            setRecords(data ?? []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadPayroll(); }, [period]);

    const handleGenerate = async () => {
        setGenerating(true);
        try {
            await api.generatePayroll(period);
            await loadPayroll();
        } catch (err) {
            console.error(err);
        } finally {
            setGenerating(false);
        }
    };

    const handleRegenerate = async () => {
        setGenerating(true);
        try {
            await api.deletePeriodPayroll(period);
            await api.generatePayroll(period);
            await loadPayroll();
        } catch (err) {
            console.error(err);
        } finally {
            setGenerating(false);
        }
    };

    const totals = records.reduce(
        (acc, r) => ({
            gross: acc.gross + (r.totalGross ?? 0),
            deductions: acc.deductions + (r.totalDeductions ?? 0),
            net: acc.net + (r.netSalary ?? 0),
            employerCost: acc.employerCost + (r.totalEmployerCost ?? 0),
        }),
        { gross: 0, deductions: 0, net: 0, employerCost: 0 }
    );

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold">{t('payroll_title')}</h1>

            {/* Controls */}
            <div className="flex flex-wrap items-end gap-3">
                <div>
                    <label className="mb-1 block text-xs font-medium text-muted-foreground">{t('payroll_period')}</label>
                    <input
                        type="month"
                        value={period}
                        onChange={(e) => setPeriod(e.target.value)}
                        className="rounded-lg border border-input bg-background px-3 py-2 text-sm"
                    />
                </div>
                <button
                    onClick={handleGenerate}
                    disabled={generating}
                    className="rounded-lg bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
                >
                    {generating ? t('loading') : t('payroll_generate')}
                </button>
                {records.length > 0 && (
                    <button
                        onClick={handleRegenerate}
                        disabled={generating}
                        className="rounded-lg border border-input px-4 py-2 text-sm font-medium hover:bg-accent disabled:opacity-50 transition-colors"
                    >
                        {t('payroll_regenerate')}
                    </button>
                )}
            </div>

            {/* Summary Cards */}
            {records.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <SummaryCard label={t('payroll_total_gross')} value={totals.gross} color="text-foreground" />
                    <SummaryCard label={t('payroll_total_deductions')} value={totals.deductions} color="text-red-600" />
                    <SummaryCard label={t('payroll_net_salary')} value={totals.net} color="text-primary" />
                    <SummaryCard label={t('payroll_employer_cost')} value={totals.employerCost} color="text-muted-foreground" />
                </div>
            )}

            {/* Payroll Table */}
            {loading ? (
                <p className="text-muted-foreground">{t('loading')}</p>
            ) : records.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border p-12 text-center">
                    <p className="text-muted-foreground">{t('payroll_no_data')}</p>
                </div>
            ) : (
                <div className="overflow-x-auto rounded-lg border border-border">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b bg-muted/50">
                                <th className="px-4 py-3 text-left font-medium text-muted-foreground">{t('employee_name')}</th>
                                <th className="px-4 py-3 text-left font-medium text-muted-foreground">{t('employee_department')}</th>
                                <th className="px-4 py-3 text-right font-medium text-muted-foreground">{t('salary_gross')}</th>
                                <th className="px-4 py-3 text-right font-medium text-muted-foreground">{t('payroll_allowances')}</th>
                                <th className="px-4 py-3 text-right font-medium text-muted-foreground">{t('payroll_total_gross')}</th>
                                <th className="px-4 py-3 text-right font-medium text-muted-foreground">{t('payroll_deductions')}</th>
                                <th className="px-4 py-3 text-right font-medium text-muted-foreground">{t('payroll_net_salary')}</th>
                                <th className="px-4 py-3 text-center font-medium text-muted-foreground">{t('payroll_detail')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {records.map((rec) => {
                                const allowances = (rec.totalGross ?? 0) - (rec.grossSalary ?? 0);
                                return (
                                    <tr key={rec.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                                        <td className="px-4 py-3 font-medium">{rec.employee?.fullName ?? '-'}</td>
                                        <td className="px-4 py-3 text-muted-foreground">{rec.employee?.department ?? '-'}</td>
                                        <td className="px-4 py-3 text-right">{formatCurrency(rec.grossSalary ?? 0)}</td>
                                        <td className="px-4 py-3 text-right text-green-600">{formatCurrency(allowances)}</td>
                                        <td className="px-4 py-3 text-right font-medium">{formatCurrency(rec.totalGross ?? 0)}</td>
                                        <td className="px-4 py-3 text-right text-red-600">{formatCurrency(rec.totalDeductions ?? 0)}</td>
                                        <td className="px-4 py-3 text-right font-bold">{formatCurrency(rec.netSalary ?? 0)}</td>
                                        <td className="px-4 py-3 text-center">
                                            <button
                                                onClick={() => setSelectedRecord(rec)}
                                                className="rounded-md px-3 py-1 text-xs font-medium text-primary hover:bg-primary/10 transition-colors"
                                                title={t('payroll_detail')}
                                            >
                                                🔍
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                        <tfoot>
                            <tr className="border-t-2 bg-muted/30 font-semibold">
                                <td className="px-4 py-3" colSpan={2}>TOPLAM</td>
                                <td className="px-4 py-3 text-right">{formatCurrency(records.reduce((s, r) => s + (r.grossSalary ?? 0), 0))}</td>
                                <td className="px-4 py-3 text-right text-green-600">{formatCurrency(records.reduce((s, r) => s + ((r.totalGross ?? 0) - (r.grossSalary ?? 0)), 0))}</td>
                                <td className="px-4 py-3 text-right">{formatCurrency(totals.gross)}</td>
                                <td className="px-4 py-3 text-right text-red-600">{formatCurrency(totals.deductions)}</td>
                                <td className="px-4 py-3 text-right font-bold">{formatCurrency(totals.net)}</td>
                                <td className="px-4 py-3" />
                            </tr>
                        </tfoot>
                    </table>
                </div>
            )}

            {selectedRecord && (
                <PayrollDetail record={selectedRecord} onClose={() => setSelectedRecord(null)} />
            )}
        </div>
    );
}

function SummaryCard({ label, value, color }: { label: string; value: number; color: string }) {
    return (
        <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className={`text-xl font-bold mt-1 ${color}`}>{formatCurrency(value)}</p>
        </div>
    );
}