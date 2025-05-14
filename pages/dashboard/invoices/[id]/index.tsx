import { useState } from 'react';
import { GetServerSideProps } from 'next';
import { getSession } from 'next-auth/react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import DocumentDetails from '@/components/documents/DocumentDetails';
import DocumentActions from '@/components/documents/DocumentActions';
import LineItemsTable from '@/components/documents/LineItemsTable';
import SendEmailModal from '@/components/documents/SendEmailModal';
import { Document as DocumentModel, LineItem, Customer, Template, DocumentStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { t } from '@/lib/translations';

interface InvoiceDetailsProps {
  invoice: DocumentModel & {
    customer: Customer;
    lineItems: LineItem[];
    template: Template;
  };
}

export default function InvoiceDetails({ invoice }: InvoiceDetailsProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);

  // Format date
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString();
  };

  const handleGeneratePDF = async () => {
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch(`/api/invoices/${invoice.id}/generate-pdf`, {
        method: 'POST',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to generate PDF');
      }

      const result = await response.json();
      setSuccessMessage('PDF generated successfully');

      // Reload the invoice to show the updated PDF URL
      router.reload();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendEmail = async (emailData: { subject: string; body: string; recipientEmail?: string }) => {
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);
    setIsEmailModalOpen(false);

    try {
      const response = await fetch(`/api/invoices/${invoice.id}/send-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emailData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to send email');
      }

      const result = await response.json();
      setSuccessMessage('Invoice sent successfully via email');

      // Reload the invoice to update status
      router.reload();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch(`/api/invoices/${invoice.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update invoice status');
      }

      const result = await response.json();
      setSuccessMessage(`Invoice status changed to ${newStatus}`);

      // Reload the invoice to show updated status
      router.reload();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkAsPaid = async () => {
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch(`/api/invoices/${invoice.id}/mark-as-paid`, {
        method: 'POST',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to mark invoice as paid');
      }

      const result = await response.json();
      setSuccessMessage('Invoice marked as paid successfully');

      // Reload the invoice to show updated status
      router.reload();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkAsPartiallyPaid = async () => {
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch(`/api/invoices/${invoice.id}/mark-as-partially-paid`, {
        method: 'POST',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to mark invoice as partially paid');
      }

      const result = await response.json();
      setSuccessMessage('Invoice marked as partially paid successfully');

      // Reload the invoice to show updated status
      router.reload();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteInvoice = async () => {
    if (!confirm(t('invoices.confirmDelete'))) {
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch(`/api/invoices/${invoice.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete invoice');
      }

      setSuccessMessage('Invoice deleted successfully');

      // Redirect to the invoices list
      router.push('/dashboard/invoices');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An unexpected error occurred');
      setIsLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>{invoice.documentNumber} | Curiosity Invoicing</title>
      </Head>

      <DashboardLayout>
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">{invoice.documentNumber}</h1>
            <p className="mt-1 text-sm text-gray-500">
              {t('invoices.createdOn')} {formatDate(invoice.issueDate)}
            </p>
          </div>
          <div className="flex space-x-3">
            {invoice.status === 'DRAFT' && (
              <Link
                href={`/dashboard/invoices/${invoice.id}/edit`}
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                {t('actions.edit')}
              </Link>
            )}
            <button
              type="button"
              onClick={() => window.history.back()}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              {t('actions.back')}
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-md bg-red-50 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {successMessage && (
          <div className="mb-6 rounded-md bg-green-50 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-green-700">{successMessage}</p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              <DocumentDetails document={invoice} />
            </div>

            <div className="mt-6 bg-white shadow overflow-hidden sm:rounded-lg">
              <div className="px-4 py-5 sm:px-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">{t('document.lineItems')}</h3>
              </div>
              <div className="border-t border-gray-200">
                <LineItemsTable lineItems={invoice.lineItems} readonly showTotals />
              </div>
            </div>

            {/* Payment Tracking Section */}
            {invoice.status !== DocumentStatus.DRAFT && (
              <div className="mt-6 bg-white shadow overflow-hidden sm:rounded-lg">
                <div className="px-4 py-5 sm:px-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">{t('invoices.paymentTracking')}</h3>
                  <p className="mt-1 max-w-2xl text-sm text-gray-500">
                    {t('invoices.paymentTrackingDescription')}
                  </p>
                </div>
                <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-sm font-medium text-gray-700">{t('invoices.currentStatus')}: </span>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          invoice.status === 'PAID' ? 'bg-green-100 text-green-800' :
                          invoice.status === 'PARTIALLY_PAID' ? 'bg-yellow-100 text-yellow-800' :
                          invoice.status === 'OVERDUE' ? 'bg-red-100 text-red-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {t(`invoices.status.${invoice.status.toLowerCase()}`)}
                        </span>
                      </div>
                      <div className="flex space-x-3">
                        {invoice.status !== DocumentStatus.PAID && (
                          <button
                            type="button"
                            onClick={handleMarkAsPaid}
                            disabled={isLoading}
                            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                          >
                            {t('invoices.markAsPaid')}
                          </button>
                        )}
                        {invoice.status !== DocumentStatus.PARTIALLY_PAID && invoice.status !== DocumentStatus.PAID && (
                          <button
                            type="button"
                            onClick={handleMarkAsPartiallyPaid}
                            disabled={isLoading}
                            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 disabled:opacity-50"
                          >
                            {t('invoices.markAsPartiallyPaid')}
                          </button>
                        )}
                      </div>
                    </div>
                    {invoice.dueDate && (
                      <div>
                        <span className="text-sm font-medium text-gray-700">{t('invoices.dueDate')}: </span>
                        <span className="text-sm text-gray-900">{formatDate(invoice.dueDate)}</span>
                        {new Date(invoice.dueDate) < new Date() && invoice.status !== DocumentStatus.PAID && (
                          <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            {t('invoices.overdue')}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div>
            <DocumentActions
              document={invoice}
              isLoading={isLoading}
              onDeleteDocument={handleDeleteInvoice}
              onGeneratePDF={handleGeneratePDF}
              onSendEmail={() => setIsEmailModalOpen(true)}
              onChangeStatus={handleStatusChange}
            />
          </div>
        </div>
      </DashboardLayout>

      {/* Email Modal */}
      {isEmailModalOpen && (
        <SendEmailModal
          document={invoice}
          isOpen={isEmailModalOpen}
          onClose={() => setIsEmailModalOpen(false)}
          onSend={handleSendEmail}
          isLoading={isLoading}
        />
      )}
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getSession(context);
  
  if (!session) {
    return {
      redirect: {
        destination: '/',
        permanent: false,
      },
    };
  }

  try {
    const id = context.params?.id as string;

    // Get user's company
    const user = await prisma.user.findUnique({
      where: { email: session.user?.email as string },
      include: { company: true },
    });

    if (!user || !user.company) {
      return {
        redirect: {
          destination: '/dashboard/settings/company',
          permanent: false,
        },
      };
    }

    const companyId = user.company.id;

    // Get the invoice with related data
    const invoice = await prisma.document.findFirst({
      where: {
        id,
        companyId,
        type: 'INVOICE',
      },
      include: {
        customer: true,
        lineItems: true,
        template: true,
      },
    });

    if (!invoice) {
      return {
        notFound: true,
      };
    }

    return {
      props: {
        invoice: JSON.parse(JSON.stringify(invoice)), // Handle serialization of dates
      },
    };
  } catch (error) {
    console.error('Error fetching invoice:', error);
    return {
      notFound: true,
    };
  }
};