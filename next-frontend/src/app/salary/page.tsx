// Path: NextFrontend/src/app/salary/page.tsx
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { api, type Employee, type SalaryDefinition } from '@/lib/bridge';
import { SalaryForm } from '@/components/salary/SalaryForm';
import { SalaryTable } from '@/components/salary/SalaryTable';

export default function SalaryPage() {
    const { t } = useTranslation();
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [salaries, setSalaries] = useState<SalaryDefinition[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editSalary, setEditSalary] = useState<SalaryDefinition | null>(null);

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const [emps, sals] = await Promise.all([
                api.getEmployees(true),
                api.getSalaries(),
            ]);
            setEmployees(emps ?? []);
            setSalaries(sals ?? []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { loadData(); }, [loadData]);

    const handleSave = async (data: Partial<SalaryDefinition>) => {
        try {
            await api.upsertSalary(data);
            setShowForm(false);
            setEditSalary(null);
            await loadData();
        } catch (err) {
            console.error(err);
        }
    };

    const handleEdit = (salary: SalaryDefinition) => {
        setEditSalary(salary);
        setShowForm(true);
    };

    const handleDelete = async (id: number) => {
        try {
            await api.deleteSalary(id);
            await loadData();
        } catch (err) {
            console.error(err);
        }
    };

    // Employees that don't have an active salary yet
    const unassigned = employees.filter(
        (e) => !salaries.some((s) => s.employeeId === e.id)
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">{t('salary_title')}</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        {salaries.length} / {employees.length} {t('nav_employees')}
                    </p>
                </div>
                <button
                    onClick={() => { setEditSalary(null); setShowForm(true); }}
                    className="rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                    + {t('salary_define')}
                </button>
            </div>

            {/* Salary Table */}
            {loading ? (
                <p className="text-muted-foreground">{t('loading')}</p>
            ) : salaries.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border p-12 text-center">
                    <p className="text-lg text-muted-foreground">{t('salary_no_data')}</p>
                    <button
                        onClick={() => setShowForm(true)}
                        className="mt-4 rounded-lg bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                    >
                        + {t('salary_define')}
                    </button>
                </div>
            ) : (
                <SalaryTable
                    salaries={salaries}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                />
            )}

            {/* Salary Form Dialog */}
            {showForm && (
                <SalaryForm
                    employees={editSalary ? employees : unassigned.length > 0 ? unassigned : employees}
                    initialData={editSalary}
                    onSave={handleSave}
                    onClose={() => { setShowForm(false); setEditSalary(null); }}
                />
            )}
        </div>
    );
}