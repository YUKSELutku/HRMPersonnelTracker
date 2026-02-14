// Path: NextFrontend/src/components/attendance/TimeTracker.tsx
'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { api, type Employee } from '@/lib/bridge';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface TimeTrackerProps {
    employees: Employee[];
    onAction: () => void;
}

export function TimeTracker({ employees, onAction }: TimeTrackerProps) {
    const { t } = useTranslation();
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
    const [clock, setClock] = useState(new Date());

    // Live clock
    useEffect(() => {
        const timer = setInterval(() => setClock(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const handleAction = async (action: 'checkIn' | 'checkOut') => {
        if (!selectedId) return;
        setLoading(true);
        setMessage(null);

        try {
            if (action === 'checkIn') {
                await api.checkIn(selectedId);
            } else {
                await api.checkOut(selectedId);
            }
            setMessage({ text: t('success'), type: 'success' });
            onAction();
        } catch (err: any) {
            setMessage({ text: err.message ?? t('error'), type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const selectedEmployee = employees.find((e) => e.id === selectedId);

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center justify-between">
                    <span>{t('attendance_title')}</span>
                    <span className="text-2xl font-mono text-primary tabular-nums">
                        {clock.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Employee Select */}
                <div>
                    <label className="mb-1.5 block text-sm font-medium text-foreground">
                        {t('attendance_select_employee')}
                    </label>
                    <select
                        value={selectedId ?? ''}
                        onChange={(e) => {
                            setSelectedId(Number(e.target.value) || null);
                            setMessage(null);
                        }}
                        className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                        <option value="">{t('attendance_select_employee')}</option>
                        {employees.map((emp) => (
                            <option key={emp.id} value={emp.id}>
                                {emp.fullName} — {emp.department ?? ''}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Selected Employee Info */}
                {selectedEmployee && (
                    <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-lg font-bold text-primary">
                            {selectedEmployee.fullName.charAt(0)}
                        </div>
                        <div>
                            <p className="font-medium text-foreground">{selectedEmployee.fullName}</p>
                            <p className="text-xs text-muted-foreground">
                                {selectedEmployee.department} · {selectedEmployee.title}
                            </p>
                        </div>
                        <Badge variant={selectedEmployee.activeStatus ? 'success' : 'secondary'} className="ml-auto">
                            {selectedEmployee.activeStatus ? t('employee_active') : t('employee_inactive')}
                        </Badge>
                    </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3">
                    <Button
                        variant="success"
                        size="lg"
                        className="flex-1"
                        disabled={!selectedId || loading}
                        loading={loading}
                        onClick={() => handleAction('checkIn')}
                    >
                        ▶ {t('attendance_check_in')}
                    </Button>
                    <Button
                        variant="destructive"
                        size="lg"
                        className="flex-1"
                        disabled={!selectedId || loading}
                        loading={loading}
                        onClick={() => handleAction('checkOut')}
                    >
                        ■ {t('attendance_check_out')}
                    </Button>
                </div>

                {/* Status Message */}
                {message && (
                    <div
                        className={`rounded-lg p-3 text-sm font-medium ${message.type === 'success'
                                ? 'bg-green-50 text-green-800 border border-green-200'
                                : 'bg-red-50 text-red-800 border border-red-200'
                            }`}
                    >
                        {message.type === 'success' ? '✅' : '❌'} {message.text}
                    </div>
                )}
            </CardContent>
        </Card>
    );
} 