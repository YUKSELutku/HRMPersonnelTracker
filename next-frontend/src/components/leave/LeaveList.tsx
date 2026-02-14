// Path: NextFrontend/src/components/leave/LeaveList.tsx
'use client';

import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { formatDate } from '@/lib/utils';

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

interface LeaveListProps {
    records: LeaveRecord[];
    onApprove?: (id: number) => void;
    onReject?: (id: number) => void;
}

export function LeaveList({ records, onApprove, onReject }: LeaveListProps) {
    const { t, i18n } = useTranslation();
    const locale = i18n.language === 'tr' ? 'tr-TR' : 'en-US';

    const leaveTypeMap: Record<string, string> = {
        Annual: t('leave_annual'),
        Sick: t('leave_sick'),
        Maternity: t('leave_maternity'),
        Unpaid: t('leave_unpaid'),
        Other: t('leave_other'),
    };

    const statusVariant = (status: string): 'warning' | 'success' | 'danger' => {
        switch (status) {
            case 'Approved': return 'success';
            case 'Rejected': return 'danger';
            default: return 'warning';
        }
    };

    const statusLabel = (status: string): string => {
        switch (status) {
            case 'Approved': return t('status_approved');
            case 'Rejected': return t('status_rejected');
            default: return t('status_pending');
        }
    };

    if (records.length === 0) {
        return (
            <div className="rounded-lg border border-border bg-card p-8 text-center text-muted-foreground">
                {t('employee_no_results')}
            </div>
        );
    }

    return (
        <div className="rounded-lg border border-border">
            <Table>
                <TableHeader>
                    <TableRow className="bg-muted/50">
                        <TableHead>{t('employee_name')}</TableHead>
                        <TableHead>{t('leave_type')}</TableHead>
                        <TableHead>{t('leave_start_date')}</TableHead>
                        <TableHead>{t('leave_end_date')}</TableHead>
                        <TableHead>{t('leave_total_days')}</TableHead>
                        <TableHead>{t('employee_status')}</TableHead>
                        {(onApprove || onReject) && <TableHead></TableHead>}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {records.map((rec) => (
                        <TableRow key={rec.id}>
                            <TableCell className="font-medium">
                                {rec.employee?.fullName ?? `#${rec.employeeId}`}
                            </TableCell>
                            <TableCell>{leaveTypeMap[rec.type] ?? rec.type}</TableCell>
                            <TableCell>{formatDate(rec.startDate, locale)}</TableCell>
                            <TableCell>{formatDate(rec.endDate, locale)}</TableCell>
                            <TableCell className="font-medium">{rec.totalDays}</TableCell>
                            <TableCell>
                                <Badge variant={statusVariant(rec.status)}>
                                    {statusLabel(rec.status)}
                                </Badge>
                            </TableCell>
                            {(onApprove || onReject) && (
                                <TableCell>
                                    {rec.status === 'Pending' && (
                                        <div className="flex gap-1">
                                            {onApprove && (
                                                <button
                                                    onClick={() => onApprove(rec.id)}
                                                    className="rounded px-2 py-1 text-xs font-medium text-green-700 hover:bg-green-50"
                                                >
                                                    ✓ {t('status_approved')}
                                                </button>
                                            )}
                                            {onReject && (
                                                <button
                                                    onClick={() => onReject(rec.id)}
                                                    className="rounded px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-50"
                                                >
                                                    ✕ {t('status_rejected')}
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </TableCell>
                            )}
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
} 