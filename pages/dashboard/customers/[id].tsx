import { useState } from 'react';
import { GetServerSideProps } from 'next';
import { getSession } from 'next-auth/react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import CustomerDetails from '@/components/customers/CustomerDetails';
import CustomerDocuments from '@/components/customers/CustomerDocuments';
import CustomerStats from '@/components/customers/CustomerStats';
import DeleteConfirmDialog from '@/components/common/DeleteConfirmDialog';
import { prisma } from '@/lib/prisma';
import { Customer, Document as DocumentModel } from '@prisma/client';
import { t } from '@/lib/translations';

interface CustomerDetailPageProps {
  customer: Customer & {
    documents: (DocumentModel & {
      _count: {
        lineItems: number;
      };
    })[];
  };
  documentCounts: {
    offers: number;
    invoices: number;
    paid: number;
    unpaid: number;
    overdue: number;
    draft: number;
  };
}

export default function CustomerDetailPage({ customer, documentCounts }: CustomerDetailPageProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'details' | 'documents'>('details');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Handle customer deletion
  const handleDelete = async () => {
    if (!customer) return;
    
    setIsDeleting(true);
    
    try {
      const response = await fetch(`/api/customers/${customer.id}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        router.push('/dashboard/customers');
      } else {
        throw new Error('Failed to delete customer');
      }
    } catch (error) {
      console.error('Error deleting customer:', error);
      setIsDeleting(false);
      setShowDeleteConfirm(false);
      // TODO: Show error notification
    }
  };

  return (
    <>
      <Head>
        <title>{customer.companyName} | Curiosity Invoicing</title>
      </Head>

      <DashboardLayout>
        {/* Header */}
        <div className="mb-6 flex justify-between items-center">
          <div>
            <div className="flex items-center">
              <Link
                href="/dashboard/customers"
                className="mr-2 text-primary-600 hover:text-primary-800"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </Link>
              <h1 className="text-2xl font-semibold text-gray-900">{customer.companyName}</h1>
            </div>
            {customer.contactPerson && (
              <p className="text-sm text-gray-600">{customer.contactPerson}</p>
            )}
          </div>
          <div className="flex space-x-2">
            <Link
              href={`/dashboard/customers/${customer.id}/edit`}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              {t('actions.edit')}
            </Link>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              {t('actions.delete')}
            </button>
          </div>
        </div>

        {/* Stats */}
        <CustomerStats stats={documentCounts} />

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            <button
              className={`${
                activeTab === 'details'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm`}
              onClick={() => setActiveTab('details')}
            >
              {t('customers.details')}
            </button>
            <button
              className={`${
                activeTab === 'documents'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm`}
              onClick={() => setActiveTab('documents')}
            >
              {t('customers.documents')}
            </button>
          </nav>
        </div>

        {/* Content */}
        {activeTab === 'details' ? (
          <CustomerDetails customer={customer} />
        ) : (
          <CustomerDocuments customerId={customer.id} documents={customer.documents} />
        )}

        {/* Delete confirmation dialog */}
        <DeleteConfirmDialog
          isOpen={showDeleteConfirm}
          title={t('customers.deleteCustomer')}
          message={t('customers.deleteConfirmation')}
          warningMessage={
            customer.documents.length > 0
              ? t('customers.deleteWarning', { count: customer.documents.length })
              : undefined
          }
          onConfirm={handleDelete}
          onCancel={() => setShowDeleteConfirm(false)}
          isDeleting={isDeleting}
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
    const customerId = context.params?.id as string;

    if (!customerId) {
      return {
        notFound: true,
      };
    }

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

    // Get customer details
    const customer = await prisma.customer.findFirst({
      where: {
        id: customerId,
        companyId,
      },
      include: {
        documents: {
          orderBy: {
            issueDate: 'desc',
          },
          include: {
            _count: {
              select: {
                lineItems: true,
              },
            },
          },
        },
      },
    });

    if (!customer) {
      return {
        notFound: true,
      };
    }

    // Calculate document counts
    const documentCounts = {
      offers: customer.documents.filter(doc => doc.type === 'OFFER').length,
      invoices: customer.documents.filter(doc => doc.type === 'INVOICE').length,
      paid: customer.documents.filter(doc => doc.status === 'PAID').length,
      unpaid: customer.documents.filter(doc => doc.status === 'SENT' && doc.type === 'INVOICE').length,
      overdue: customer.documents.filter(doc => doc.status === 'OVERDUE').length,
      draft: customer.documents.filter(doc => doc.status === 'DRAFT').length,
    };

    return {
      props: {
        customer: JSON.parse(JSON.stringify(customer)), // Handle serialization of dates
        documentCounts,
      },
    };
  } catch (error) {
    console.error('Error fetching customer:', error);
    return {
      notFound: true,
    };
  }
};