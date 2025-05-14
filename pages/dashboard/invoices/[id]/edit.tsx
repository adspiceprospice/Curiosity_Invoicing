import { useState } from 'react';
import { GetServerSideProps } from 'next';
import { getSession } from 'next-auth/react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import DocumentForm from '@/components/documents/DocumentForm';
import { Customer, Template, Document as DocumentModel, LineItem } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { t } from '@/lib/translations';

interface EditInvoiceProps {
  invoice: DocumentModel & {
    lineItems: LineItem[];
  };
  customers: Customer[];
  templates: Template[];
}

export default function EditInvoice({ invoice, customers, templates }: EditInvoiceProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Only draft invoices can be edited
  if (invoice.status !== 'DRAFT') {
    return (
      <>
        <Head>
          <title>{t('invoices.edit')} | Curiosity Invoicing</title>
        </Head>

        <DashboardLayout>
          <div className="mb-6">
            <h1 className="text-2xl font-semibold text-gray-900">{t('invoices.edit')}</h1>
          </div>

          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  {t('invoices.cannotEditNonDraft')}
                </p>
                <div className="mt-4">
                  <div className="-mx-2 -my-1.5 flex">
                    <button
                      type="button"
                      onClick={() => router.push(`/dashboard/invoices/${invoice.id}`)}
                      className="px-2 py-1.5 rounded-md text-sm font-medium text-yellow-800 hover:bg-yellow-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
                    >
                      {t('actions.viewInvoice')}
                    </button>
                    <button
                      type="button"
                      onClick={() => router.push('/dashboard/invoices')}
                      className="ml-3 px-2 py-1.5 rounded-md text-sm font-medium text-yellow-800 hover:bg-yellow-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
                    >
                      {t('actions.backToInvoices')}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </DashboardLayout>
      </>
    );
  }

  const handleSubmit = async (data: Partial<DocumentModel> & { lineItems: Partial<LineItem>[] }) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/invoices/${invoice.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update invoice');
      }

      const updatedInvoice = await response.json();
      
      // Redirect to the invoice
      router.push(`/dashboard/invoices/${invoice.id}`);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An unexpected error occurred');
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Head>
        <title>{t('invoices.edit')} | Curiosity Invoicing</title>
      </Head>

      <DashboardLayout>
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">{t('invoices.edit')}</h1>
          <p className="mt-1 text-sm text-gray-500">
            {t('invoices.editDescription')}
          </p>
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

        <DocumentForm
          documentType="INVOICE"
          document={invoice}
          customers={customers}
          templates={templates}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
        />
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

    // Get the invoice with line items
    const invoice = await prisma.document.findFirst({
      where: {
        id,
        companyId,
        type: 'INVOICE',
      },
      include: {
        lineItems: true,
      },
    });

    if (!invoice) {
      return {
        notFound: true,
      };
    }

    // Get customers
    const customers = await prisma.customer.findMany({
      where: { companyId },
      orderBy: { companyName: 'asc' },
    });

    // Get templates for invoices
    const templates = await prisma.template.findMany({
      where: {
        companyId,
        type: 'INVOICE',
      },
      orderBy: { name: 'asc' },
    });

    return {
      props: {
        invoice: JSON.parse(JSON.stringify(invoice)), // Handle serialization of dates
        customers: JSON.parse(JSON.stringify(customers)),
        templates: JSON.parse(JSON.stringify(templates)),
      },
    };
  } catch (error) {
    console.error('Error fetching data:', error);
    return {
      notFound: true,
    };
  }
};