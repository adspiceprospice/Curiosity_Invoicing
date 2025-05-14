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
import { Document as DocumentModel, LineItem, Customer, Template } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { t } from '@/lib/translations';

interface OfferDetailsProps {
  offer: DocumentModel & {
    customer: Customer;
    lineItems: LineItem[];
    template: Template;
  };
}

export default function OfferDetails({ offer }: OfferDetailsProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Format date
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString();
  };

  const handleGeneratePDF = async () => {
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch(`/api/offers/${offer.id}/generate-pdf`, {
        method: 'POST',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to generate PDF');
      }

      const result = await response.json();
      setSuccessMessage('PDF generated successfully');

      // Reload the offer to show the updated PDF URL
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

    try {
      const response = await fetch(`/api/offers/${offer.id}/send-email`, {
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
      setSuccessMessage('Offer sent successfully via email');

      // Reload the offer to update status
      router.reload();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConvertToInvoice = async () => {
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch(`/api/offers/${offer.id}/convert-to-invoice`, {
        method: 'POST',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to convert offer to invoice');
      }

      const result = await response.json();
      setSuccessMessage('Offer successfully converted to invoice');

      // Redirect to the new invoice
      router.push(`/dashboard/invoices/${result.invoice.id}`);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An unexpected error occurred');
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch(`/api/offers/${offer.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update offer status');
      }

      const result = await response.json();
      setSuccessMessage(`Offer status changed to ${newStatus}`);

      // Reload the offer to show updated status
      router.reload();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteOffer = async () => {
    if (!confirm(t('offers.confirmDelete'))) {
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch(`/api/offers/${offer.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete offer');
      }

      setSuccessMessage('Offer deleted successfully');

      // Redirect to the offers list
      router.push('/dashboard/offers');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An unexpected error occurred');
      setIsLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>{offer.documentNumber} | Curiosity Invoicing</title>
      </Head>

      <DashboardLayout>
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">{offer.documentNumber}</h1>
            <p className="mt-1 text-sm text-gray-500">
              {t('offers.createdOn')} {formatDate(offer.issueDate)}
            </p>
          </div>
          <div className="flex space-x-3">
            {offer.status === 'DRAFT' && (
              <Link
                href={`/dashboard/offers/${offer.id}/edit`}
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
              <DocumentDetails document={offer} />
            </div>

            <div className="mt-6 bg-white shadow overflow-hidden sm:rounded-lg">
              <div className="px-4 py-5 sm:px-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">{t('document.lineItems')}</h3>
              </div>
              <div className="border-t border-gray-200">
                <LineItemsTable lineItems={offer.lineItems} readonly showTotals />
              </div>
            </div>
          </div>

          <div>
            <DocumentActions
              document={offer}
              isLoading={isLoading}
              onDeleteDocument={handleDeleteOffer}
              onGeneratePDF={handleGeneratePDF}
              onSendEmail={handleSendEmail}
              onConvertToInvoice={offer.status === 'ACCEPTED' ? handleConvertToInvoice : undefined}
              onChangeStatus={handleStatusChange}
            />
          </div>
        </div>
      </DashboardLayout>
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

    // Get the offer with related data
    const offer = await prisma.document.findFirst({
      where: {
        id,
        companyId,
        type: 'OFFER',
      },
      include: {
        customer: true,
        lineItems: true,
        template: true,
      },
    });

    if (!offer) {
      return {
        notFound: true,
      };
    }

    return {
      props: {
        offer: JSON.parse(JSON.stringify(offer)), // Handle serialization of dates
      },
    };
  } catch (error) {
    console.error('Error fetching offer:', error);
    return {
      notFound: true,
    };
  }
};