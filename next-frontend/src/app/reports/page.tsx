// Path: NextFrontend/src/app/reports/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { api, type Employee } from '@/lib/bridge';
import { getCurrentPeriod } from '@/lib/utils';

export default function ReportsPage() {
    const { t } = useTranslation();
    const [period, setPeriod] = useState(getCurrentPeriod());
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [selectedEmployee, setSelectedEmployee] = useState<number>(0); // 0 = all
    const [exporting, setExporting] = useState<string | null>(null);
    const [lastFile, setLastFile] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        api.getEmployees().then(setEmployees).catch(console.error);
    }, []);

    const handleExport = useCallback(async (key: string, action: () => Promise<{ filePath: string }>) => {
        setExporting(key);
        setLastFile(null);
        setError(null);
        try {
            const result = await action();
            setLastFile(result.filePath);
        } catch (err: any) {
            console.error(`Export failed:`, err);
            setError(err?.message || 'Export failed');
        } finally {
            setExporting(null);
        }
    }, []);

    const selectedName = employees.find(e => e.id === selectedEmployee)?.fullName;

    const cardClass = (disabled: boolean) =>
        `flex items-center gap-3 rounded-xl border border-border bg-card p-5 text-left transition-all
     hover:shadow-md hover:border-primary/30 disabled:opacity-50 disabled:cursor-not-allowed
     ${disabled ? 'opacity-40 pointer-events-none' : ''}`;

    return (
        <div className="space-y-8">
            <h1 className="text-2xl font-bold">{t('reports_title')}</h1>

            {/* ── Filters ──────────────────────────────────────── */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div>
                    <label className="mb-1 block text-sm font-medium">{t('reports_select_period')}</label>
                    <input
                        type="month"
                        value={period}
                        onChange={(e) => setPeriod(e.target.value)}
                        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                    />
                </div>
                <div>
                    <label className="mb-1 block text-sm font-medium">{t('reports_select_employee')}</label>
                    <select
                        value={selectedEmployee}
                        onChange={(e) => setSelectedEmployee(parseInt(e.target.value))}
                        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                    >
                        <option value={0}>{t('reports_all_employees')}</option>
                        {employees.map((emp) => (
                            <option key={emp.id} value={emp.id}>{emp.fullName}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* ── Section: Attendance Reports ──────────────────── */}
            <div>
                <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <span className="inline-block w-1 h-5 bg-blue-500 rounded" />
                    {t('reports_attendance_section')}
                    {selectedEmployee > 0 && (
                        <span className="text-sm font-normal text-muted-foreground">
                            — {selectedName}
                        </span>
                    )}
                </h2>

                <div className="grid gap-4 sm:grid-cols-2">
                    {/* All Employees PDF */}
                    {selectedEmployee === 0 && (
                        <>
                            <button
                                onClick={() => handleExport('att_pdf_all',
                                    () => api.exportAttendancePdf(period))}
                                disabled={exporting !== null}
                                className={cardClass(false)}
                            >
                                <span className="text-3xl">📄</span>
                                <div>
                                    <p className="font-medium">{t('reports_attendance_pdf')}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {exporting === 'att_pdf_all' ? t('reports_generating') : t('reports_all_employees')}
                                    </p>
                                </div>
                            </button>

                            <button
                                onClick={() => handleExport('att_xlsx_all',
                                    () => api.exportAttendanceExcel(period))}
                                disabled={exporting !== null}
                                className={cardClass(false)}
                            >
                                <span className="text-3xl">📊</span>
                                <div>
                                    <p className="font-medium">{t('reports_attendance_excel')}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {exporting === 'att_xlsx_all' ? t('reports_generating') : t('reports_all_employees')}
                                    </p>
                                </div>
                            </button>
                        </>
                    )}

                    {/* Per Employee PDF */}
                    {selectedEmployee > 0 && (
                        <>
                            <button
                                onClick={() => handleExport('att_pdf_emp',
                                    () => api.exportEmployeeAttendancePdf(period, selectedEmployee))}
                                disabled={exporting !== null}
                                className={cardClass(false)}
                            >
                                <span className="text-3xl">📄</span>
                                <div>
                                    <p className="font-medium">{t('reports_emp_attendance_pdf')}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {exporting === 'att_pdf_emp' ? t('reports_generating') : selectedName}
                                    </p>
                                </div>
                            </button>

                            <button
                                onClick={() => handleExport('att_xlsx_emp',
                                    () => api.exportEmployeeAttendanceExcel(period, selectedEmployee))}
                                disabled={exporting !== null}
                                className={cardClass(false)}
                            >
                                <span className="text-3xl">📊</span>
                                <div>
                                    <p className="font-medium">{t('reports_emp_attendance_excel')}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {exporting === 'att_xlsx_emp' ? t('reports_generating') : selectedName}
                                    </p>
                                </div>
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* ── Section: Payroll Reports ─────────────────────── */}
            <div>
                <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <span className="inline-block w-1 h-5 bg-green-500 rounded" />
                    {t('reports_payroll_section')}
                </h2>

                <div className="grid gap-4 sm:grid-cols-2">
                    <button
                        onClick={() => handleExport('pay_pdf',
                            () => api.exportPayrollPdf(period))}
                        disabled={exporting !== null}
                        className={cardClass(false)}
                    >
                        <span className="text-3xl">📄</span>
                        <div>
                            <p className="font-medium">{t('reports_payroll_pdf')}</p>
                            <p className="text-xs text-muted-foreground">
                                {exporting === 'pay_pdf' ? t('reports_generating') : t('reports_export')}
                            </p>
                        </div>
                    </button>

                    <button
                        onClick={() => handleExport('pay_xlsx',
                            () => api.exportPayrollExcel(period))}
                        disabled={exporting !== null}
                        className={cardClass(false)}
                    >
                        <span className="text-3xl">📊</span>
                        <div>
                            <p className="font-medium">{t('reports_payroll_excel')}</p>
                            <p className="text-xs text-muted-foreground">
                                {exporting === 'pay_xlsx' ? t('reports_generating') : t('reports_export')}
                            </p>
                        </div>
                    </button>
                </div>
            </div>

            {/* ── Success ──────────────────────────────────────── */}
            {lastFile && (
                <div className="rounded-lg border border-green-200 bg-green-50 dark:bg-green-950/30 dark:border-green-800 p-4">
                    <p className="text-sm font-medium text-green-800 dark:text-green-300">
                        ✅ {t('reports_success')}
                    </p>
                    <p className="mt-1 text-xs text-green-600 dark:text-green-400 break-all">
                        {lastFile}
                    </p>
                </div>
            )}

            {/* ── Error ────────────────────────────────────────── */}
            {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-950/30 dark:border-red-800 p-4">
                    <p className="text-sm font-medium text-red-800 dark:text-red-300">
                        ❌ {error}
                    </p>
                </div>
            )}
        </div>
    );
}