// Path: NextFrontend/src/components/leave/LeaveForm.tsx
'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { Employee } from '@/lib/bridge';

interface LeaveFormProps {
    employees: Employee[];
    onSubmit: (data: {
        employeeId: number;
        startDate: string;
        endDate: string;
        type: string;
    }) => Promise<void>;
    onClose: () => void;
}

export function LeaveForm({ employees, onSubmit, onClose }: LeaveFormProps) {
    const { t } = useTranslation();
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({
        employeeId: 0,
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
        type: 'Annual',
    });

    const leaveTypes = [
        { value: 'Annual', label: t('leave_annual') },
        { value: 'Sick', label: t('leave_sick') },
        { value: 'Maternity', label: t('leave_maternity') },
        { value: 'Unpaid', label: t('leave_unpaid') },
        { value: 'Other', label: t('leave_other') },
    ];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.employeeId) return;
        setLoading(true);
        try {
            await onSubmit(form);
            onClose();
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="w-full max-w-md rounded-xl bg-card p-6 shadow-xl">
                <h2 className="mb-6 text-lg font-semibold">{t('leave_add')}</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Employee Selection */}
                    <div>
                        <Label>{t('employee_name')}</Label>
                        <select
                            value={form.employeeId}
                            onChange={(e) => setForm((p) => ({ ...p, employeeId: Number(e.target.value) }))}
                            className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            required
                        >
                            <option value={0}>{t('attendance_select_employee')}</option>
                            {employees.map((emp) => (
                                <option key={emp.id} value={emp.id}>
                                    {emp.fullName}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Leave Type */}
                    <div>
                        <Label>{t('leave_type')}</Label>
                        <select
                            value={form.type}
                            onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))}
                            className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        >
                            {leaveTypes.map((lt) => (
                                <option key={lt.value} value={lt.value}>
                                    {lt.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Dates */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label>{t('leave_start_date')}</Label>
                            <Input
                                type="date"
                                value={form.startDate}
                                onChange={(e) => setForm((p) => ({ ...p, startDate: e.target.value }))}
                                className="mt-1"
                                required
                            />
                        </div>
                        <div>
                            <Label>{t('leave_end_date')}</Label>
                            <Input
                                type="date"
                                value={form.endDate}
                                onChange={(e) => setForm((p) => ({ ...p, endDate: e.target.value }))}
                                className="mt-1"
                                required
                            />
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-3 pt-4">
                        <Button type="button" variant="outline" onClick={onClose}>
                            {t('btn_cancel')}
                        </Button>
                        <Button type="submit" loading={loading}>
                            {t('btn_save')}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
} 