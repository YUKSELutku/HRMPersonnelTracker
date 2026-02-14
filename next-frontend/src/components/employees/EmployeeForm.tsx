// Path: NextFrontend/src/components/employees/EmployeeForm.tsx
'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Employee } from '@/lib/bridge';

interface EmployeeFormProps {
    employee: Employee | null;
    onSave: (data: Partial<Employee>) => void;
    onClose: () => void;
}

export function EmployeeForm({ employee, onSave, onClose }: EmployeeFormProps) {
    const { t } = useTranslation();
    const isEdit = employee !== null;

    const [form, setForm] = useState({
        fullName: employee?.fullName ?? '',
        tc_No: employee?.tc_No ?? '',
        birthDate: employee?.birthDate?.split('T')[0] ?? '',
        phone: employee?.phone ?? '',
        email: employee?.email ?? '',
        department: employee?.department ?? '',
        title: employee?.title ?? '',
        hireDate: employee?.hireDate?.split('T')[0] ?? new Date().toISOString().split('T')[0],
        activeStatus: employee?.activeStatus ?? true,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(form);
    };

    const update = (field: string, value: any) =>
        setForm((prev) => ({ ...prev, [field]: value }));

    const fields: { key: string; field: string; type: string }[] = [
        { key: 'employee_name', field: 'fullName', type: 'text' },
        { key: 'employee_tc', field: 'tc_No', type: 'text' },
        { key: 'employee_birth_date', field: 'birthDate', type: 'date' },
        { key: 'employee_phone', field: 'phone', type: 'tel' },
        { key: 'employee_email', field: 'email', type: 'email' },
        { key: 'employee_department', field: 'department', type: 'text' },
        { key: 'employee_title', field: 'title', type: 'text' },
        { key: 'employee_hire_date', field: 'hireDate', type: 'date' },
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="w-full max-w-lg rounded-xl bg-card p-6 shadow-xl">
                <h2 className="mb-6 text-lg font-semibold text-foreground">
                    {isEdit ? t('employee_edit') : t('employee_add')}
                </h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {fields.map(({ key, field, type }) => (
                        <div key={field}>
                            <label className="mb-1 block text-sm font-medium text-foreground">
                                {t(key)}
                            </label>
                            <input
                                type={type}
                                value={(form as any)[field]}
                                onChange={(e) => update(field, e.target.value)}
                                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                                required={field === 'fullName'}
                            />
                        </div>
                    ))}

                    {/* Active Status Toggle */}
                    <label className="flex items-center gap-3 text-sm">
                        <input
                            type="checkbox"
                            checked={form.activeStatus}
                            onChange={(e) => update('activeStatus', e.target.checked)}
                            className="h-4 w-4 rounded border-input"
                        />
                        {t('employee_active')}
                    </label>

                    {/* Actions */}
                    <div className="flex justify-end gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-accent transition-colors"
                        >
                            {t('btn_cancel')}
                        </button>
                        <button
                            type="submit"
                            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                        >
                            {t('btn_save')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
} 