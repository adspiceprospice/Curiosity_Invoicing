import { useState } from 'react';
import { GetServerSideProps } from 'next';
import { getSession } from 'next-auth/react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import CustomerForm from '@/components/customers/CustomerForm';
import { prisma } from '@/lib/prisma';
import { Customer } from '@prisma/client';
import { t } from '@/lib/translations';

interface NewCustomerProps {
  companyId: string;
}

export default function NewCustomer({ companyId }: NewCustomerProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleSubmit = async (data: Partial<Customer>) => {
    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/customers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          companyId,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create customer');
      }
      
      const result = await response.json();
      router.push(`/dashboard/customers/${result.id}`);
    } catch (error) {
      console.error('Error creating customer:', error);
      setIsSubmitting(false);
      // TODO: Show error notification
    }
  };

  return (
    <>
      <Head>
        <title>{t('customers.new')} | Curiosity Invoicing</title>
      </Head>

      <DashboardLayout>
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">{t('customers.new')}</h1>
        </div>

        <CustomerForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />
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

    return {
      props: {
        companyId: user.company.id,
      },
    };
  } catch (error) {
    console.error('Error fetching company data:', error);
    return {
      redirect: {
        destination: '/dashboard',
        permanent: false,
      },
    };
  }
};