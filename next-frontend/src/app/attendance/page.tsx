// Path: NextFrontend/src/app/attendance/page.tsx
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { api, type Employee, type Attendance } from '@/lib/bridge';
import { cn } from '@/lib/utils';

export default function AttendancePage() {
    const { t } = useTranslation();
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [records, setRecords] = useState<Attendance[]>([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState<{ text: string; type: 'ok' | 'err' } | null>(null);

    // ── Form state ────────────────────────────────────────────
    const [selectedEmpId, setSelectedEmpId] = useState<number | null>(null);
    const [selectedDate, setSelectedDate] = useState(todayStr());
    const [checkInTime, setCheckInTime] = useState('09:00');
    const [checkOutTime, setCheckOutTime] = useState('18:00');

    // ── Edit state ────────────────────────────────────────────
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editIn, setEditIn] = useState('');
    const [editOut, setEditOut] = useState('');

    // ── Load data ─────────────────────────────────────────────
    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const [emps, atts] = await Promise.all([
                api.getEmployees(true),
                api.getAttendanceByDate(selectedDate),
            ]);
            setEmployees(emps ?? []);
            setRecords(atts ?? []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [selectedDate]);

    useEffect(() => { loadData(); }, [loadData]);

    const flash = (text: string, type: 'ok' | 'err' = 'ok') => {
        setMessage({ text, type });
        setTimeout(() => setMessage(null), 3000);
    };

    // ── Actions ───────────────────────────────────────────────
    const handleCheckIn = async () => {
        if (!selectedEmpId) return;
        try {
            await api.checkIn(selectedEmpId, selectedDate, checkInTime);
            flash(t('success'));
            await loadData();
        } catch (err: any) {
            flash(err.message ?? t('error'), 'err');
        }
    };

    const handleCheckOut = async () => {
        if (!selectedEmpId) return;
        try {
            await api.checkOut(selectedEmpId, selectedDate, checkOutTime);
            flash(t('success'));
            await loadData();
        } catch (err: any) {
            flash(err.message ?? t('error'), 'err');
        }
    };

    const handleEdit = (rec: Attendance) => {
        setEditingId(rec.id);
        setEditIn(rec.checkInTime ?? '');
        setEditOut(rec.checkOutTime ?? '');
    };

    const handleSaveEdit = async () => {
        if (!editingId) return;
        try {
            await api.updateAttendance(editingId, editIn || undefined, editOut || undefined);
            setEditingId(null);
            flash(t('success'));
            await loadData();
        } catch (err: any) {
            flash(err.message ?? t('error'), 'err');
        }
    };

    const handleDelete = async (id: number) => {
        try {
            await api.deleteAttendance(id);
            flash(t('success'));
            await loadData();
        } catch (err: any) {
            flash(err.message ?? t('error'), 'err');
        }
    };

    const inputClass = "rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30";
    const labelClass = "block text-xs font-medium text-muted-foreground mb-1";

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold">{t('attendance_title')}</h1>

            {/* ── Entry Panel ──────────────────────────────────────── */}
            <div className="rounded-xl border border-border bg-card p-6 space-y-4">
                {/* Row 1: Employee + Date */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className={labelClass}>{t('attendance_select_employee')}</label>
                        <select
                            value={selectedEmpId ?? ''}
                            onChange={(e) => setSelectedEmpId(Number(e.target.value) || null)}
                            className={cn(inputClass, 'w-full')}
                        >
                            <option value="">{t('attendance_select_employee')}</option>
                            {employees.map((emp) => (
                                <option key={emp.id} value={emp.id}>
                                    {emp.fullName} — {emp.department}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className={labelClass}>{t('attendance_date')}</label>
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className={cn(inputClass, 'w-full')}
                        />
                    </div>
                </div>

                {/* Row 2: Times + Buttons */}
                <div className="flex flex-wrap items-end gap-3">
                    <div>
                        <label className={labelClass}>{t('attendance_checkin_time')}</label>
                        <input
                            type="time"
                            value={checkInTime}
                            onChange={(e) => setCheckInTime(e.target.value)}
                            className={inputClass}
                        />
                    </div>
                    <button
                        onClick={handleCheckIn}
                        disabled={!selectedEmpId}
                        className="rounded-lg bg-green-600 px-5 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50 transition-colors"
                    >
                        ▶ {t('attendance_check_in')}
                    </button>

                    <div className="w-px h-8 bg-border mx-1" />

                    <div>
                        <label className={labelClass}>{t('attendance_checkout_time')}</label>
                        <input
                            type="time"
                            value={checkOutTime}
                            onChange={(e) => setCheckOutTime(e.target.value)}
                            className={inputClass}
                        />
                    </div>
                    <button
                        onClick={handleCheckOut}
                        disabled={!selectedEmpId}
                        className="rounded-lg bg-red-600 px-5 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
                    >
                        ■ {t('attendance_check_out')}
                    </button>
                </div>

                {/* Message */}
                {message && (
                    <p className={cn(
                        'text-sm font-medium',
                        message.type === 'ok' ? 'text-green-600' : 'text-red-600'
                    )}>
                        {message.type === 'ok' ? '✓' : '✗'} {message.text}
                    </p>
                )}
            </div>

            {/* ── Records Table ────────────────────────────────────── */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold">
                        {t('attendance_records')} — {formatDisplayDate(selectedDate)}
                    </h2>
                    <span className="text-sm text-muted-foreground">
                        {records.length} {t('attendance_record_count')}
                    </span>
                </div>

                {loading ? (
                    <p className="text-muted-foreground">{t('loading')}</p>
                ) : records.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-border p-12 text-center">
                        <p className="text-muted-foreground">{t('attendance_no_records')}</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto rounded-lg border border-border">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b bg-muted/50">
                                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">{t('employee_name')}</th>
                                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">{t('employee_department')}</th>
                                    <th className="px-4 py-3 text-center font-medium text-muted-foreground">{t('attendance_checkin_time')}</th>
                                    <th className="px-4 py-3 text-center font-medium text-muted-foreground">{t('attendance_checkout_time')}</th>
                                    <th className="px-4 py-3 text-center font-medium text-muted-foreground">{t('attendance_late')}</th>
                                    <th className="px-4 py-3 text-center font-medium text-muted-foreground">{t('attendance_overtime')}</th>
                                    <th className="px-4 py-3 text-center font-medium text-muted-foreground">{t('attendance_actions')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {records.map((rec) => {
                                    const isEditing = editingId === rec.id;

                                    return (
                                        <tr key={rec.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                                            <td className="px-4 py-3 font-medium">
                                                {rec.employee?.fullName ?? `#${rec.employeeId}`}
                                            </td>
                                            <td className="px-4 py-3 text-muted-foreground">
                                                {rec.employee?.department ?? '-'}
                                            </td>

                                            {/* Check-in */}
                                            <td className="px-4 py-3 text-center">
                                                {isEditing ? (
                                                    <input
                                                        type="time"
                                                        value={editIn}
                                                        onChange={(e) => setEditIn(e.target.value)}
                                                        className={cn(inputClass, 'w-28 text-center')}
                                                    />
                                                ) : (
                                                    <span className={rec.checkInTime ? '' : 'text-muted-foreground'}>
                                                        {rec.checkInTime ?? '-'}
                                                    </span>
                                                )}
                                            </td>

                                            {/* Check-out */}
                                            <td className="px-4 py-3 text-center">
                                                {isEditing ? (
                                                    <input
                                                        type="time"
                                                        value={editOut}
                                                        onChange={(e) => setEditOut(e.target.value)}
                                                        className={cn(inputClass, 'w-28 text-center')}
                                                    />
                                                ) : (
                                                    <span className={rec.checkOutTime ? '' : 'text-muted-foreground'}>
                                                        {rec.checkOutTime ?? '-'}
                                                    </span>
                                                )}
                                            </td>

                                            {/* Late */}
                                            <td className="px-4 py-3 text-center">
                                                <span className={cn(
                                                    'inline-flex rounded-full px-2 py-0.5 text-xs font-medium',
                                                    rec.isLate ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                                                )}>
                                                    {rec.isLate ? t('yes') : t('no')}
                                                </span>
                                            </td>

                                            {/* Overtime */}
                                            <td className="px-4 py-3 text-center">
                                                {rec.overtimeHours > 0 ? (
                                                    <span className="text-amber-600 font-medium">{rec.overtimeHours}h</span>
                                                ) : '-'}
                                            </td>

                                            {/* Actions */}
                                            <td className="px-4 py-3 text-center">
                                                {isEditing ? (
                                                    <div className="flex items-center justify-center gap-1">
                                                        <button
                                                            onClick={handleSaveEdit}
                                                            className="rounded-md px-2 py-1 text-xs font-medium text-green-600 hover:bg-green-50 transition-colors"
                                                        >
                                                            ✓ {t('btn_save')}
                                                        </button>
                                                        <button
                                                            onClick={() => setEditingId(null)}
                                                            className="rounded-md px-2 py-1 text-xs font-medium text-muted-foreground hover:bg-muted transition-colors"
                                                        >
                                                            ✗
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center justify-center gap-1">
                                                        <button
                                                            onClick={() => handleEdit(rec)}
                                                            className="rounded-md px-2 py-1 text-xs font-medium text-primary hover:bg-primary/10 transition-colors"
                                                        >
                                                            {t('btn_edit')}
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(rec.id)}
                                                            className="rounded-md px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors"
                                                        >
                                                            {t('btn_delete')}
                                                        </button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}

// ── Helpers ─────────────────────────────────────────────────

function todayStr(): string {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function formatDisplayDate(dateStr: string): string {
    try {
        return new Date(dateStr + 'T00:00:00').toLocaleDateString('tr-TR', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    } catch {
        return dateStr;
    }
}