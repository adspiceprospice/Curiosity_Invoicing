import { Document as DocumentModel, DocumentStatus, DocumentType, LineItem } from '@prisma/client';
import { t } from '@/lib/translations';
import LineItemsTable from './LineItemsTable';

interface DocumentDetailsProps {
  document: DocumentModel & {
    lineItems: LineItem[];
    customer: {
      companyName: string;
      contactPerson?: string | null;
      email?: string | null;
      phoneNumber?: string | null;
      billingAddress?: string | null;
      vatId?: string | null;
    };
    template: {
      name: string;
    };
  };
}

export default function DocumentDetails({ document }: DocumentDetailsProps) {
  // Format date
  const formatDate = (date: Date | null | undefined) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString();
  };

  // Get status badge color
  const getStatusColor = (status: DocumentStatus) => {
    switch (status) {
      case 'DRAFT':
        return 'bg-gray-100 text-gray-800';
      case 'SENT':
        return 'bg-blue-100 text-blue-800';
      case 'ACCEPTED':
        return 'bg-green-100 text-green-800';
      case 'DECLINED':
        return 'bg-red-100 text-red-800';
      case 'EXPIRED':
        return 'bg-yellow-100 text-yellow-800';
      case 'PAID':
        return 'bg-green-100 text-green-800';
      case 'PARTIALLY_PAID':
        return 'bg-indigo-100 text-indigo-800';
      case 'OVERDUE':
        return 'bg-red-100 text-red-800';
      case 'VOIDED':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Get document type label
  const getDocumentTypeLabel = (type: DocumentType) => {
    return type === 'OFFER' ? t('offers.title') : t('invoices.title');
  };

  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-lg">
      <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
        <div>
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            {getDocumentTypeLabel(document.type)} {document.documentNumber}
          </h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            {document.type === 'OFFER'
              ? t('offers.detailsDescription')
              : t('invoices.detailsDescription')}
          </p>
        </div>
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(document.status)}`}>
          {t(`${document.type === 'OFFER' ? 'offers' : 'invoices'}.status.${document.status.toLowerCase()}`)}
        </span>
      </div>
      <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
        <dl className="sm:divide-y sm:divide-gray-200">
          <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-500">
              {document.type === 'OFFER' ? t('offers.number') : t('invoices.number')}
            </dt>
            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
              {document.documentNumber}
            </dd>
          </div>
          
          <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-500">
              {t('document.customer')}
            </dt>
            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
              <div>
                <p className="font-medium">{document.customer.companyName}</p>
                {document.customer.contactPerson && (
                  <p>{document.customer.contactPerson}</p>
                )}
                {document.customer.email && (
                  <p>
                    <a href={`mailto:${document.customer.email}`} className="text-primary-600 hover:text-primary-500">
                      {document.customer.email}
                    </a>
                  </p>
                )}
                {document.customer.phoneNumber && (
                  <p>
                    <a href={`tel:${document.customer.phoneNumber}`} className="text-primary-600 hover:text-primary-500">
                      {document.customer.phoneNumber}
                    </a>
                  </p>
                )}
                {document.customer.billingAddress && (
                  <p className="whitespace-pre-line">{document.customer.billingAddress}</p>
                )}
                {document.customer.vatId && (
                  <p>VAT/BTW: {document.customer.vatId}</p>
                )}
              </div>
            </dd>
          </div>
          
          <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-500">
              {t('document.template')}
            </dt>
            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
              {document.template.name}
            </dd>
          </div>
          
          <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-500">
              {t('document.language')}
            </dt>
            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {document.languageCode.toUpperCase()}
              </span>
            </dd>
          </div>
          
          <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-500">
              {t('document.issueDate')}
            </dt>
            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
              {formatDate(document.issueDate)}
            </dd>
          </div>
          
          {document.type === 'INVOICE' && document.dueDate && (
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">
                {t('document.dueDate')}
              </dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {formatDate(document.dueDate)}
              </dd>
            </div>
          )}
          
          {document.type === 'OFFER' && document.validUntil && (
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">
                {t('document.validUntil')}
              </dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {formatDate(document.validUntil)}
              </dd>
            </div>
          )}
          
          {document.paymentTerms && (
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">
                {t('document.paymentTerms')}
              </dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {document.paymentTerms}
              </dd>
            </div>
          )}
          
          {document.notes && (
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">
                {t('document.notes')}
              </dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 whitespace-pre-line">
                {document.notes}
              </dd>
            </div>
          )}
        </dl>
      </div>
      
      <div className="px-4 py-5 sm:px-6 border-t border-gray-200">
        <h3 className="text-lg leading-6 font-medium text-gray-900">
          {t('document.lineItems')}
        </h3>
        <div className="mt-4">
          <LineItemsTable
            lineItems={document.lineItems}
            readonly={true}
          />
        </div>
      </div>
    </div>
  );
}