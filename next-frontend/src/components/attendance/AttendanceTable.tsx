// Path: NextFrontend/src/components/attendance/AttendanceTable.tsx
'use client';

import { useTranslation } from 'react-i18next';
import type { Attendance } from '@/lib/bridge';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';

interface AttendanceTableProps {
    records: Attendance[];
}

export function AttendanceTable({ records }: AttendanceTableProps) {
    const { t } = useTranslation();

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
                        <TableHead>{t('employee_department')}</TableHead>
                        <TableHead>{t('attendance_checkin_time')}</TableHead>
                        <TableHead>{t('attendance_checkout_time')}</TableHead>
                        <TableHead>{t('attendance_late')}</TableHead>
                        <TableHead>{t('attendance_overtime')}</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {records.map((rec) => (
                        <TableRow key={rec.id}>
                            <TableCell className="font-medium">
                                {rec.employee?.fullName ?? `#${rec.employeeId}`}
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                                {(rec.employee as any)?.department ?? '-'}
                            </TableCell>
                            <TableCell>
                                {rec.checkInTime ?? '-'}
                            </TableCell>
                            <TableCell>
                                {rec.checkOutTime ?? '-'}
                            </TableCell>
                            <TableCell>
                                <Badge variant={rec.isLate ? 'danger' : 'success'}>
                                    {rec.isLate ? t('yes') : t('no')}
                                </Badge>
                            </TableCell>
                            <TableCell>
                                {rec.overtimeHours > 0 ? `${rec.overtimeHours}h` : '-'}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
} 