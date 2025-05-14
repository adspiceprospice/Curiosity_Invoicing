import Link from 'next/link';
import { Document as DocumentModel, DocumentStatus } from '@prisma/client';
import { t } from '@/lib/translations';

interface CustomerDocumentsProps {
  customerId: string;
  documents: (DocumentModel & {
    _count: {
      lineItems: number;
    };
  })[];
}

export default function CustomerDocuments({ customerId, documents }: CustomerDocumentsProps) {
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

  return (
    <div className="space-y-6">
      {/* Create document buttons */}
      <div className="flex space-x-4">
        <Link
          href={{
            pathname: '/dashboard/offers/new',
            query: { customerId },
          }}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          {t('customers.createOffer')}
        </Link>
        <Link
          href={{
            pathname: '/dashboard/invoices/new',
            query: { customerId },
          }}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          {t('customers.createInvoice')}
        </Link>
      </div>

      {/* Document list */}
      {documents.length > 0 ? (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {documents.map((doc) => (
              <li key={doc.id}>
                <Link
                  href={`/dashboard/${doc.type === 'OFFER' ? 'offers' : 'invoices'}/${doc.id}`}
                  className="block hover:bg-gray-50"
                >
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          {doc.type === 'OFFER' ? (
                            <svg className="h-6 w-6 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          ) : (
                            <svg className="h-6 w-6 text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          )}
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-900">
                            {doc.documentNumber}
                          </p>
                          <p className="text-sm text-gray-500">
                            {formatDate(doc.issueDate)} • {doc._count.lineItems} items
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(doc.status)}`}>
                          {t(`${doc.type === 'OFFER' ? 'offers' : 'invoices'}.status.${doc.status.toLowerCase()}`)}
                        </span>
                        <p className="ml-4 text-sm font-medium text-gray-900">
                          {new Intl.NumberFormat('nl-NL', {
                            style: 'currency',
                            currency: 'EUR',
                          }).format(parseFloat(doc.totalAmount.toString()))}
                        </p>
                      </div>
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-md p-6 text-center text-gray-500">
          No documents found for this customer.
        </div>
      )}
    </div>
  );
}