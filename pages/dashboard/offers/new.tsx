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

interface NewOfferProps {
  customers: Customer[];
  templates: Template[];
}

export default function NewOffer({ customers, templates }: NewOfferProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (data: Partial<DocumentModel> & { lineItems: Partial<LineItem>[] }) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/offers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create offer');
      }

      const offer = await response.json();
      
      // Redirect to the new offer
      router.push(`/dashboard/offers/${offer.id}`);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An unexpected error occurred');
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Head>
        <title>{t('offers.new')} | Curiosity Invoicing</title>
      </Head>

      <DashboardLayout>
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">{t('offers.new')}</h1>
          <p className="mt-1 text-sm text-gray-500">
            {t('offers.newDescription')}
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
          documentType="OFFER"
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

    // Get customers
    const customers = await prisma.customer.findMany({
      where: { companyId },
      orderBy: { companyName: 'asc' },
    });

    // Get templates for offers
    const templates = await prisma.template.findMany({
      where: {
        companyId,
        type: 'OFFER',
      },
      orderBy: { name: 'asc' },
    });

    // Check if we have at least one template for each supported language
    const supportedLanguages = ['en', 'nl'];
    const missingTemplates = [];

    for (const lang of supportedLanguages) {
      const hasTemplate = templates.some(t => t.languageCode === lang);
      if (!hasTemplate) {
        missingTemplates.push(lang);
      }
    }

    // If we're missing templates, redirect to create them
    if (missingTemplates.length > 0) {
      return {
        redirect: {
          destination: `/dashboard/settings/templates?missing=${missingTemplates.join(',')}`,
          permanent: false,
        },
      };
    }

    return {
      props: {
        customers: JSON.parse(JSON.stringify(customers)), // Handle serialization of dates
        templates: JSON.parse(JSON.stringify(templates)),
      },
    };
  } catch (error) {
    console.error('Error fetching data:', error);
    return {
      props: {
        customers: [],
        templates: [],
      },
    };
  }
};