// Path: NextFrontend/src/app/employees/page.tsx
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { api, type Employee } from '@/lib/bridge';
import { EmployeeList } from '@/components/employees/EmployeeList';
import { EmployeeForm } from '@/components/employees/EmployeeForm';

export default function EmployeesPage() {
    const { t } = useTranslation();
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

    const loadEmployees = useCallback(async () => {
        setLoading(true);
        try {
            const data = searchTerm
                ? await api.searchEmployees(searchTerm)
                : await api.getEmployees(true);
            setEmployees(data ?? []);
        } catch (err) {
            console.error('Failed to load employees:', err);
        } finally {
            setLoading(false);
        }
    }, [searchTerm]);

    useEffect(() => {
        loadEmployees();
    }, [loadEmployees]);

    const handleSave = async (employee: Partial<Employee>) => {
        try {
            if (editingEmployee) {
                await api.updateEmployee(editingEmployee.id, employee);
            } else {
                await api.createEmployee(employee);
            }
            setShowForm(false);
            setEditingEmployee(null);
            await loadEmployees();
        } catch (err) {
            console.error('Failed to save employee:', err);
        }
    };

    const handleEdit = (employee: Employee) => {
        setEditingEmployee(employee);
        setShowForm(true);
    };

    const handleDelete = async (id: number) => {
        try {
            await api.deleteEmployee(id);
            await loadEmployees();
        } catch (err) {
            console.error('Failed to delete employee:', err);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-foreground">
                    {t('employee_list')}
                </h1>
                <button
                    onClick={() => { setEditingEmployee(null); setShowForm(true); }}
                    className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                    + {t('employee_add')}
                </button>
            </div>

            {/* Search */}
            <input
                type="text"
                placeholder={t('employee_search')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full max-w-md rounded-lg border border-input bg-background px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />

            {/* Employee List */}
            {loading ? (
                <p className="text-muted-foreground">{t('loading')}</p>
            ) : (
                <EmployeeList
                    employees={employees}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                />
            )}

            {/* Modal Form */}
            {showForm && (
                <EmployeeForm
                    employee={editingEmployee}
                    onSave={handleSave}
                    onClose={() => { setShowForm(false); setEditingEmployee(null); }}
                />
            )}
        </div>
    );
} 