import { useState } from 'react';
import Link from 'next/link';
import { Document as DocumentModel, DocumentStatus, DocumentType } from '@prisma/client';
import { t } from '@/lib/translations';
import DeleteConfirmDialog from '../common/DeleteConfirmDialog';

interface DocumentActionsProps {
  document: DocumentModel;
  onChangeStatus: (status: DocumentStatus) => void;
  onDelete: () => void;
  onSendEmail?: () => void;
  onViewPdf?: () => void;
  onConvertToInvoice?: () => void;
  isProcessing: boolean;
}

export default function DocumentActions({
  document,
  onChangeStatus,
  onDelete,
  onSendEmail,
  onViewPdf,
  onConvertToInvoice,
  isProcessing,
}: DocumentActionsProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showActionMenu, setShowActionMenu] = useState(false);

  // Status actions for offers
  const offerStatusActions = [
    { status: 'DRAFT', label: t('offers.markAsSent'), nextStatus: 'SENT', show: document.status === 'DRAFT' },
    { status: 'SENT', label: t('offers.markAsAccepted'), nextStatus: 'ACCEPTED', show: document.status === 'SENT' },
    { status: 'SENT', label: t('offers.markAsDeclined'), nextStatus: 'DECLINED', show: document.status === 'SENT' },
    { status: 'SENT', label: t('offers.markAsExpired'), nextStatus: 'EXPIRED', show: document.status === 'SENT' },
    { status: 'ACCEPTED', label: t('offers.markAsVoided'), nextStatus: 'VOIDED', show: document.status === 'ACCEPTED' },
    { status: 'DECLINED', label: t('offers.markAsVoided'), nextStatus: 'VOIDED', show: document.status === 'DECLINED' },
    { status: 'EXPIRED', label: t('offers.markAsVoided'), nextStatus: 'VOIDED', show: document.status === 'EXPIRED' },
  ];

  // Status actions for invoices
  const invoiceStatusActions = [
    { status: 'DRAFT', label: t('invoices.markAsSent'), nextStatus: 'SENT', show: document.status === 'DRAFT' },
    { status: 'SENT', label: t('invoices.markAsPaid'), nextStatus: 'PAID', show: document.status === 'SENT' || document.status === 'OVERDUE' },
    { status: 'SENT', label: t('invoices.markAsPartiallyPaid'), nextStatus: 'PARTIALLY_PAID', show: document.status === 'SENT' || document.status === 'OVERDUE' },
    { status: 'SENT', label: t('invoices.markAsOverdue'), nextStatus: 'OVERDUE', show: document.status === 'SENT' },
    { status: 'PARTIALLY_PAID', label: t('invoices.markAsPaid'), nextStatus: 'PAID', show: document.status === 'PARTIALLY_PAID' },
    { status: 'PARTIALLY_PAID', label: t('invoices.markAsOverdue'), nextStatus: 'OVERDUE', show: document.status === 'PARTIALLY_PAID' },
    { status: 'OVERDUE', label: t('invoices.markAsPartiallyPaid'), nextStatus: 'PARTIALLY_PAID', show: document.status === 'OVERDUE' },
    { status: 'OVERDUE', label: t('invoices.markAsPaid'), nextStatus: 'PAID', show: document.status === 'OVERDUE' },
    { status: 'PAID', label: t('invoices.markAsVoided'), nextStatus: 'VOIDED', show: document.status === 'PAID' },
  ];

  const statusActions = document.type === 'OFFER' ? offerStatusActions : invoiceStatusActions;
  const visibleStatusActions = statusActions.filter(action => action.show);

  return (
    <div className="flex flex-wrap items-center space-x-2">
      {/* Edit button */}
      {document.status === 'DRAFT' && (
        <Link
          href={`/dashboard/${document.type === 'OFFER' ? 'offers' : 'invoices'}/${document.id}/edit`}
          className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          {t('actions.edit')}
        </Link>
      )}

      {/* View PDF button */}
      {onViewPdf && (
        <button
          type="button"
          onClick={onViewPdf}
          className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          {t('actions.viewPdf')}
        </button>
      )}

      {/* Send email button */}
      {onSendEmail && document.status !== 'DRAFT' && (
        <button
          type="button"
          onClick={onSendEmail}
          disabled={isProcessing}
          className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
        >
          {t('actions.sendEmail')}
        </button>
      )}

      {/* Convert to invoice button (only for accepted offers) */}
      {document.type === 'OFFER' && document.status === 'ACCEPTED' && onConvertToInvoice && (
        <button
          type="button"
          onClick={onConvertToInvoice}
          disabled={isProcessing}
          className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
        >
          {t('offers.convertToInvoice')}
        </button>
      )}

      {/* Status dropdown */}
      {visibleStatusActions.length > 0 && (
        <div className="relative inline-block text-left">
          <div>
            <button
              type="button"
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              onClick={() => setShowActionMenu(!showActionMenu)}
            >
              {t('actions.changeStatus')}
              <svg className="-mr-1 ml-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>

          {showActionMenu && (
            <div className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
              <div className="py-1" role="none">
                {visibleStatusActions.map((action, index) => (
                  <button
                    key={index}
                    type="button"
                    className="text-gray-700 block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                    onClick={() => {
                      onChangeStatus(action.nextStatus as DocumentStatus);
                      setShowActionMenu(false);
                    }}
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Delete button */}
      {(document.status === 'DRAFT' || document.status === 'VOIDED') && (
        <button
          type="button"
          onClick={() => setShowDeleteConfirm(true)}
          className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
        >
          {t('actions.delete')}
        </button>
      )}

      {/* Delete confirmation dialog */}
      <DeleteConfirmDialog
        isOpen={showDeleteConfirm}
        title={document.type === 'OFFER' ? t('offers.deleteOffer') : t('invoices.deleteInvoice')}
        message={document.type === 'OFFER' ? t('offers.deleteConfirmation') : t('invoices.deleteConfirmation')}
        onConfirm={onDelete}
        onCancel={() => setShowDeleteConfirm(false)}
        isDeleting={isProcessing}
      />
    </div>
  );
}