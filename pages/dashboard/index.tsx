import { useState, useEffect } from 'react';
import { GetServerSideProps } from 'next';
import { getSession } from 'next-auth/react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import CompanyProfileCard from '@/components/company/CompanyProfileCard';
import { prisma } from '@/lib/prisma';
import { t } from '@/lib/translations';

const DashboardStats = [
  { name: 'Total Invoices', stat: '0', href: '/dashboard/invoices' },
  { name: 'Total Offers', stat: '0', href: '/dashboard/offers' },
  { name: 'Total Customers', stat: '0', href: '/dashboard/customers' },
];

interface DashboardProps {
  company: any;
  stats: {
    invoicesCount: number;
    offersCount: number;
    customersCount: number;
  };
}

export default function Dashboard({ company, stats }: DashboardProps) {
  const dashboardStats = [
    { name: t('dashboard.totalInvoices'), stat: stats.invoicesCount.toString(), href: '/dashboard/invoices' },
    { name: t('dashboard.totalOffers'), stat: stats.offersCount.toString(), href: '/dashboard/offers' },
    { name: t('dashboard.totalCustomers'), stat: stats.customersCount.toString(), href: '/dashboard/customers' },
  ];

  return (
    <>
      <Head>
        <title>Dashboard | Curiosity Invoicing</title>
      </Head>

      <DashboardLayout>
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
        </div>

        {/* Stats */}
        <div>
          <dl className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-3">
            {dashboardStats.map((item) => (
              <div key={item.name} className="overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6">
                <dt className="truncate text-sm font-medium text-gray-500">{item.name}</dt>
                <dd className="mt-1 text-3xl font-semibold tracking-tight text-gray-900">{item.stat}</dd>
                <div className="mt-4">
                  <Link href={item.href} className="text-sm font-medium text-primary-600 hover:text-primary-500">
                    View all <span aria-hidden="true">&rarr;</span>
                  </Link>
                </div>
              </div>
            ))}
          </dl>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Company Profile Card */}
          <div>
            <h2 className="text-lg font-medium text-gray-900 mb-3">{t('company.title')}</h2>
            <CompanyProfileCard company={company} />
          </div>

          {/* Recent Activity */}
          <div>
            <h2 className="text-lg font-medium text-gray-900 mb-3">{t('dashboard.recentActivity')}</h2>
            <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
              <div className="p-6">
                <div className="text-center text-gray-500 py-6">
                  <p>{t('dashboard.noRecentActivity')}</p>
                </div>
              </div>
            </div>
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
    // Get user and company
    const user = await prisma.user.findUnique({
      where: { email: session.user?.email as string },
      include: { company: true },
    });

    if (!user) {
      return {
        redirect: {
          destination: '/',
          permanent: false,
        },
      };
    }

    // Get counts for dashboard stats
    let stats = {
      invoicesCount: 0,
      offersCount: 0,
      customersCount: 0,
    };

    if (user.company) {
      // Get invoice count
      const invoicesCount = await prisma.document.count({
        where: {
          companyId: user.company.id,
          type: 'INVOICE',
        },
      });

      // Get offer count
      const offersCount = await prisma.document.count({
        where: {
          companyId: user.company.id,
          type: 'OFFER',
        },
      });

      // Get customer count
      const customersCount = await prisma.customer.count({
        where: {
          companyId: user.company.id,
        },
      });

      stats = {
        invoicesCount,
        offersCount,
        customersCount,
      };
    }

    return {
      props: {
        company: user.company ? JSON.parse(JSON.stringify(user.company)) : null,
        stats,
      },
    };
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return {
      props: {
        company: null,
        stats: {
          invoicesCount: 0,
          offersCount: 0,
          customersCount: 0,
        },
      },
    };
  }
};