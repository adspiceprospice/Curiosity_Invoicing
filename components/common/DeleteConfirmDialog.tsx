import { t } from '@/lib/translations';
import { ConfirmDialog } from '@/components/ui';

interface DeleteConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  warningMessage?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDeleting: boolean;
}

/**
 * Delete confirmation dialog - uses shared ConfirmDialog component
 */
export default function DeleteConfirmDialog({
  isOpen,
  title,
  message,
  warningMessage,
  onConfirm,
  onCancel,
  isDeleting,
}: DeleteConfirmDialogProps) {
  return (
    <ConfirmDialog
      isOpen={isOpen}
      title={title}
      message={message}
      warningMessage={warningMessage}
      confirmLabel={isDeleting ? t('actions.deleting') : t('actions.delete')}
      cancelLabel={t('actions.cancel')}
      onConfirm={onConfirm}
      onCancel={onCancel}
      isLoading={isDeleting}
      variant="danger"
    />
  );
}
