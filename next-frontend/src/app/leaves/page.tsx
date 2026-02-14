// Path: NextFrontend/src/app/leaves/page.tsx
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { api, invoke, type Employee } from '@/lib/bridge';
import { Button } from '@/components/ui/button';
import { LeaveForm } from '@/components/leave/LeaveForm';
import { LeaveList } from '@/components/leave/LeaveList';

interface LeaveRecord {
    id: number;
    employeeId: number;
    startDate: string;
    endDate: string;
    type: string;
    status: string;
    totalDays: number;
    employee?: { fullName: string; department?: string };
}

export default function LeavesPage() {
    const { t } = useTranslation();
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [leaves, setLeaves] = useState<LeaveRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const [emps, lvs] = await Promise.all([
                api.getEmployees(true),
                invoke<LeaveRecord[]>('getLeaves', {}),
            ]);
            setEmployees(emps ?? []);
            setLeaves(lvs ?? []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleSubmitLeave = async (data: {
        employeeId: number;
        startDate: string;
        endDate: string;
        type: string;
    }) => {
        await invoke('createLeave', data);
        await loadData();
    };

    const handleApprove = async (id: number) => {
        await invoke('updateLeaveStatus', { id, status: 'Approved' });
        await loadData();
    };

    const handleReject = async (id: number) => {
        await invoke('updateLeaveStatus', { id, status: 'Rejected' });
        await loadData();
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">{t('nav_leaves')}</h1>
                <Button onClick={() => setShowForm(true)}>
                    + {t('leave_add')}
                </Button>
            </div>

            {loading ? (
                <p className="text-muted-foreground">{t('loading')}</p>
            ) : (
                <LeaveList
                    records={leaves}
                    onApprove={handleApprove}
                    onReject={handleReject}
                />
            )}

            {showForm && (
                <LeaveForm
                    employees={employees}
                    onSubmit={handleSubmitLeave}
                    onClose={() => setShowForm(false)}
                />
            )}
        </div>
    );
} 