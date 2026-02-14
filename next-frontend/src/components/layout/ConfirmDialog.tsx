// Path: NextFrontend/src/components/layout/ConfirmDialog.tsx
'use client';

import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';

interface ConfirmDialogProps {
    open: boolean;
    title: string;
    description: string;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: 'destructive' | 'default';
    loading?: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}

export function ConfirmDialog({
    open,
    title,
    description,
    confirmLabel,
    cancelLabel,
    variant = 'destructive',
    loading = false,
    onConfirm,
    onCancel,
}: ConfirmDialogProps) {
    const { t } = useTranslation();

    return (
        <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
            <DialogContent className="max-w-sm">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>{description}</DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button variant="outline" onClick={onCancel} disabled={loading}>
                        {cancelLabel ?? t('btn_cancel')}
                    </Button>
                    <Button
                        variant={variant}
                        onClick={onConfirm}
                        loading={loading}
                    >
                        {confirmLabel ?? t('btn_confirm')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
} 