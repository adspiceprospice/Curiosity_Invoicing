import { GetServerSideProps } from 'next';
import { getSession } from 'next-auth/react';
import Head from 'next/head';
import Link from 'next/link';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { prisma } from '@/lib/prisma';
import { useEffect, useState } from 'react';

interface DashboardProps {
  stats: {
    totalCustomers: number;
    totalInvoices: number;
    totalOffers: number;
    unpaidInvoicesAmount: string;
    overDueInvoicesAmount: string;
    pendingOffersAmount: string;
  };
}

export default function Dashboard({ stats }: DashboardProps) {
  const [showAIWelcome, setShowAIWelcome] = useState(true);

  return (
    <>
      <Head>
        <title>Dashboard | Curiosity Invoicing</title>
      </Head>

      <DashboardLayout>
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
        </div>
        
        {showAIWelcome && (
          <div className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg shadow-md p-6">
            <div className="flex items-start">
              <div className="flex-1">
                <h2 className="text-lg font-medium text-gray-900">Welcome to Curiosity Invoicing with AI</h2>
                <p className="mt-1 text-sm text-gray-600">
                  Our application integrates with Google Gemini 2.5 Pro to streamline your workflow.
                  Ask the AI to help you create documents, manage templates, or automate tasks.
                </p>
                <div className="mt-3">
                  <Link 
                    href="/dashboard/ai-assistant"
                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  >
                    Try AI Assistant
                  </Link>
                </div>
              </div>
              <button 
                onClick={() => setShowAIWelcome(false)}
                className="ml-4 text-gray-400 hover:text-gray-500"
              >
                <span className="sr-only">Dismiss</span>
                <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        )}
        
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {/* Stats Cards */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-primary-100 rounded-md p-3">
                  <svg className="h-6 w-6 text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Unpaid Invoices</dt>
                    <dd>
                      <div className="text-lg font-medium text-gray-900">{stats.unpaidInvoicesAmount}</div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-5 py-3">
              <div className="text-sm">
                <Link href="/dashboard/invoices?status=SENT,OVERDUE" className="font-medium text-primary-600 hover:text-primary-500">
                  View all
                </Link>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-yellow-100 rounded-md p-3">
                  <svg className="h-6 w-6 text-yellow-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Overdue Invoices</dt>
                    <dd>
                      <div className="text-lg font-medium text-gray-900">{stats.overDueInvoicesAmount}</div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-5 py-3">
              <div className="text-sm">
                <Link href="/dashboard/invoices?status=OVERDUE" className="font-medium text-primary-600 hover:text-primary-500">
                  View all
                </Link>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-green-100 rounded-md p-3">
                  <svg className="h-6 w-6 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Pending Offers</dt>
                    <dd>
                      <div className="text-lg font-medium text-gray-900">{stats.pendingOffersAmount}</div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-5 py-3">
              <div className="text-sm">
                <Link href="/dashboard/offers?status=SENT" className="font-medium text-primary-600 hover:text-primary-500">
                  View all
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-5 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium leading-6 text-gray-900">Quick Actions</h3>
            </div>
            <div className="p-5">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Link 
                  href="/dashboard/offers/new"
                  className="relative rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm flex items-center space-x-3 hover:border-gray-400 focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary-500"
                >
                  <div className="flex-shrink-0 bg-primary-100 rounded-md p-2">
                    <svg className="h-5 w-5 text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="absolute inset-0" aria-hidden="true" />
                    <p className="text-sm font-medium text-gray-900">New Offer</p>
                    <p className="text-xs text-gray-500">Create a new sales offer</p>
                  </div>
                </Link>
                
                <Link 
                  href="/dashboard/invoices/new"
                  className="relative rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm flex items-center space-x-3 hover:border-gray-400 focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary-500"
                >
                  <div className="flex-shrink-0 bg-primary-100 rounded-md p-2">
                    <svg className="h-5 w-5 text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="absolute inset-0" aria-hidden="true" />
                    <p className="text-sm font-medium text-gray-900">New Invoice</p>
                    <p className="text-xs text-gray-500">Create a new invoice</p>
                  </div>
                </Link>
                
                <Link 
                  href="/dashboard/customers/new"
                  className="relative rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm flex items-center space-x-3 hover:border-gray-400 focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary-500"
                >
                  <div className="flex-shrink-0 bg-primary-100 rounded-md p-2">
                    <svg className="h-5 w-5 text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="absolute inset-0" aria-hidden="true" />
                    <p className="text-sm font-medium text-gray-900">New Customer</p>
                    <p className="text-xs text-gray-500">Add a new customer</p>
                  </div>
                </Link>
                
                <Link 
                  href="/dashboard/ai-assistant"
                  className="relative rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm flex items-center space-x-3 hover:border-gray-400 focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary-500"
                >
                  <div className="flex-shrink-0 bg-primary-100 rounded-md p-2">
                    <svg className="h-5 w-5 text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="absolute inset-0" aria-hidden="true" />
                    <p className="text-sm font-medium text-gray-900">AI Assistant</p>
                    <p className="text-xs text-gray-500">Use AI to help with tasks</p>
                  </div>
                </Link>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-5 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium leading-6 text-gray-900">Overview</h3>
            </div>
            <div className="p-5">
              <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">Total Customers</dt>
                  <dd className="mt-1 text-lg font-semibold text-gray-900">{stats.totalCustomers}</dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">Total Invoices</dt>
                  <dd className="mt-1 text-lg font-semibold text-gray-900">{stats.totalInvoices}</dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">Total Offers</dt>
                  <dd className="mt-1 text-lg font-semibold text-gray-900">{stats.totalOffers}</dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">Languages</dt>
                  <dd className="mt-1 text-lg font-semibold text-gray-900">English, Dutch</dd>
                </div>
              </dl>
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

    // Get statistics
    const totalCustomers = await prisma.customer.count({
      where: { companyId },
    });

    const totalInvoices = await prisma.document.count({
      where: { companyId, type: 'INVOICE' },
    });

    const totalOffers = await prisma.document.count({
      where: { companyId, type: 'OFFER' },
    });

    // Get unpaid invoices
    const unpaidInvoices = await prisma.document.aggregate({
      where: {
        companyId,
        type: 'INVOICE',
        status: { in: ['SENT', 'PARTIALLY_PAID'] },
      },
      _sum: {
        totalAmount: true,
      },
    });

    // Get overdue invoices
    const overDueInvoices = await prisma.document.aggregate({
      where: {
        companyId,
        type: 'INVOICE',
        status: 'OVERDUE',
      },
      _sum: {
        totalAmount: true,
      },
    });

    // Get pending offers
    const pendingOffers = await prisma.document.aggregate({
      where: {
        companyId,
        type: 'OFFER',
        status: 'SENT',
      },
      _sum: {
        totalAmount: true,
      },
    });

    // Format currency values
    const formatCurrency = (amount: number | null) => {
      if (amount === null) return '€0.00';
      return new Intl.NumberFormat('nl-NL', {
        style: 'currency',
        currency: 'EUR',
      }).format(amount);
    };

    return {
      props: {
        stats: {
          totalCustomers,
          totalInvoices,
          totalOffers,
          unpaidInvoicesAmount: formatCurrency(unpaidInvoices._sum.totalAmount?.toNumber() || 0),
          overDueInvoicesAmount: formatCurrency(overDueInvoices._sum.totalAmount?.toNumber() || 0),
          pendingOffersAmount: formatCurrency(pendingOffers._sum.totalAmount?.toNumber() || 0),
        },
      },
    };
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return {
      props: {
        stats: {
          totalCustomers: 0,
          totalInvoices: 0,
          totalOffers: 0,
          unpaidInvoicesAmount: '€0.00',
          overDueInvoicesAmount: '€0.00',
          pendingOffersAmount: '€0.00',
        },
      },
    };
  }
};