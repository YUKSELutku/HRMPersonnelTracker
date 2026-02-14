// Path: NextFrontend/src/components/employees/EmployeeList.tsx
'use client';

import { useTranslation } from 'react-i18next';
import type { Employee } from '@/lib/bridge';
import { formatDate } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface EmployeeListProps {
    employees: Employee[];
    onEdit: (employee: Employee) => void;
    onDelete: (id: number) => void;
}

/**
 * Localized employee table.
 * Every column header and status badge is driven by translation keys.
 */
export function EmployeeList({ employees, onEdit, onDelete }: EmployeeListProps) {
    const { t, i18n } = useTranslation();
    const locale = i18n.language === 'tr' ? 'tr-TR' : 'en-US';

    if (employees.length === 0) {
        return (
            <div className="rounded-lg border border-border bg-card p-8 text-center text-muted-foreground">
                {t('employee_no_results')}
            </div>
        );
    }

    return (
        <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm">
                <thead>
                    <tr className="border-b border-border bg-muted/50">
                        <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                            {t('employee_name')}
                        </th>
                        <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                            {t('employee_department')}
                        </th>
                        <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                            {t('employee_title')}
                        </th>
                        <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                            {t('employee_hire_date')}
                        </th>
                        <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                            {t('employee_status')}
                        </th>
                        <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                            {/* Actions */}
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {employees.map((emp) => (
                        <tr
                            key={emp.id}
                            className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
                        >
                            <td className="px-4 py-3 font-medium text-foreground">
                                {emp.fullName}
                            </td>
                            <td className="px-4 py-3 text-muted-foreground">
                                {emp.department ?? '-'}
                            </td>
                            <td className="px-4 py-3 text-muted-foreground">
                                {emp.title ?? '-'}
                            </td>
                            <td className="px-4 py-3 text-muted-foreground">
                                {formatDate(emp.hireDate, locale)}
                            </td>
                            <td className="px-4 py-3">
                                <span
                                    className={cn(
                                        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
                                        emp.activeStatus
                                            ? 'bg-green-100 text-green-800'
                                            : 'bg-gray-100 text-gray-600'
                                    )}
                                >
                                    {emp.activeStatus ? t('employee_active') : t('employee_inactive')}
                                </span>
                            </td>
                            <td className="px-4 py-3 text-right">
                                <div className="flex justify-end gap-2">
                                    <button
                                        onClick={() => onEdit(emp)}
                                        className="rounded px-3 py-1 text-xs font-medium text-primary hover:bg-primary/10 transition-colors"
                                    >
                                        {t('btn_edit')}
                                    </button>
                                    <button
                                        onClick={() => onDelete(emp.id)}
                                        className="rounded px-3 py-1 text-xs font-medium text-destructive hover:bg-destructive/10 transition-colors"
                                    >
                                        {t('btn_delete')}
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
} 