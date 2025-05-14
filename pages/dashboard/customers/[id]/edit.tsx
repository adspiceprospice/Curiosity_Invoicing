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

interface EditCustomerProps {
  customer: Customer;
}

export default function EditCustomer({ customer }: EditCustomerProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleSubmit = async (data: Partial<Customer>) => {
    setIsSubmitting(true);
    
    try {
      const response = await fetch(`/api/customers/${customer.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update customer');
      }
      
      router.push(`/dashboard/customers/${customer.id}`);
    } catch (error) {
      console.error('Error updating customer:', error);
      setIsSubmitting(false);
      // TODO: Show error notification
    }
  };

  return (
    <>
      <Head>
        <title>{t('customers.edit')} | {customer.companyName}</title>
      </Head>

      <DashboardLayout>
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">{t('customers.edit')}</h1>
          <p className="mt-1 text-sm text-gray-500">{customer.companyName}</p>
        </div>

        <CustomerForm customer={customer} onSubmit={handleSubmit} isSubmitting={isSubmitting} />
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

    // Get customer
    const customer = await prisma.customer.findFirst({
      where: {
        id: customerId,
        companyId,
      },
    });

    if (!customer) {
      return {
        notFound: true,
      };
    }

    return {
      props: {
        customer: JSON.parse(JSON.stringify(customer)), // Handle serialization of dates
      },
    };
  } catch (error) {
    console.error('Error fetching customer data:', error);
    return {
      notFound: true,
    };
  }
};