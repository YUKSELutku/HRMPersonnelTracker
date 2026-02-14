// Path: NextFrontend/src/components/payroll/PayrollTable.tsx
'use client';

import { useTranslation } from 'react-i18next';
import type { PayrollRecord } from '@/lib/bridge';
import { formatCurrency } from '@/lib/utils';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell, TableFooter } from '@/components/ui/table';

interface PayrollTableProps {
    records: PayrollRecord[];
}

export function PayrollTable({ records }: PayrollTableProps) {
    const { t } = useTranslation();

    if (records.length === 0) {
        return (
            <div className="rounded-lg border border-border bg-card p-8 text-center text-muted-foreground">
                {t('payroll_no_data')}
            </div>
        );
    }

    const totalBase = records.reduce((sum, r) => sum + r.grossSalary, 0);
    const totalAllowances = records.reduce((sum, r) => sum + (r.totalGross - r.grossSalary - (r.overtimePay || 0)), 0);
    const totalOvertime = records.reduce((sum, r) => sum + (r.overtimePay || 0), 0);
    const totalDeductions = records.reduce((sum, r) => sum + r.totalDeductions, 0);
    const totalNet = records.reduce((sum, r) => sum + r.netSalary, 0);

    return (
        <div className="rounded-lg border border-border">
            <Table>
                <TableHeader>
                    <TableRow className="bg-muted/50">
                        <TableHead>{t('employee_name')}</TableHead>
                        <TableHead>{t('employee_department')}</TableHead>
                        <TableHead className="text-right">{t('payroll_base_salary')}</TableHead>
                        <TableHead className="text-right">{t('payroll_allowances')}</TableHead>
                        <TableHead className="text-right">{t('payroll_overtime_pay')}</TableHead>
                        <TableHead className="text-right">{t('payroll_deductions')}</TableHead>
                        <TableHead className="text-right">{t('payroll_net_salary')}</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {records.map((rec) => (
                        <TableRow key={rec.id}>
                            <TableCell className="font-medium">
                                {rec.employee?.fullName ?? '-'}
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                                {rec.employee?.department ?? '-'}
                            </TableCell>
                            <TableCell className="text-right tabular-nums">
                                {formatCurrency(rec.grossSalary)}
                            </TableCell>
                            <TableCell className="text-right tabular-nums text-green-600">
                                +{formatCurrency(rec.totalGross - rec.grossSalary - (rec.overtimePay || 0))}
                            </TableCell>
                            <TableCell className="text-right tabular-nums text-amber-600">
                                {(rec.overtimePay || 0) > 0 ? `+${formatCurrency(rec.overtimePay)}` : '-'}
                            </TableCell>
                            <TableCell className="text-right tabular-nums text-red-600">
                                -{formatCurrency(rec.totalDeductions)}
                            </TableCell>
                            <TableCell className="text-right tabular-nums font-bold">
                                {formatCurrency(rec.netSalary)}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
                <TableFooter>
                    <TableRow>
                        <TableCell colSpan={2} className="font-bold">
                            TOPLAM / TOTAL
                        </TableCell>
                        <TableCell className="text-right font-bold tabular-nums">
                            {formatCurrency(totalBase)}
                        </TableCell>
                        <TableCell className="text-right font-bold tabular-nums text-green-700">
                            +{formatCurrency(totalAllowances)}
                        </TableCell>
                        <TableCell className="text-right font-bold tabular-nums text-amber-700">
                            {totalOvertime > 0 ? `+${formatCurrency(totalOvertime)}` : '-'}
                        </TableCell>
                        <TableCell className="text-right font-bold tabular-nums text-red-700">
                            -{formatCurrency(totalDeductions)}
                        </TableCell>
                        <TableCell className="text-right font-bold tabular-nums text-primary">
                            {formatCurrency(totalNet)}
                        </TableCell>
                    </TableRow>
                </TableFooter>
            </Table>
        </div>
    );
}