import { useState } from 'react';
import { GetServerSideProps } from 'next';
import { getSession } from 'next-auth/react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { Document as DocumentModel, DocumentStatus, Customer } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { t } from '@/lib/translations';

interface InvoicesListProps {
  invoices: (DocumentModel & {
    customer: {
      companyName: string;
    };
    _count: {
      lineItems: number;
    };
  })[];
  customers: Customer[];
  statusFilter: string[];
  customerFilter: string;
}

export default function InvoicesList({ invoices, customers, statusFilter, customerFilter }: InvoicesListProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  
  // Format date
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString();
  };
  
  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('nl-NL', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };
  
  // Get status badge color
  const getStatusColor = (status: DocumentStatus) => {
    switch (status) {
      case 'DRAFT':
        return 'bg-gray-100 text-gray-800';
      case 'SENT':
        return 'bg-blue-100 text-blue-800';
      case 'PAID':
        return 'bg-green-100 text-green-800';
      case 'PARTIALLY_PAID':
        return 'bg-yellow-100 text-yellow-800';
      case 'OVERDUE':
        return 'bg-red-100 text-red-800';
      case 'VOIDED':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  // Filter invoices
  const filteredInvoices = invoices.filter(invoice => {
    // Filter by search term
    const searchMatch = searchTerm.trim() === '' || 
      invoice.documentNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.customer.companyName.toLowerCase().includes(searchTerm.toLowerCase());
    
    return searchMatch;
  });
  
  // Handle filter changes
  const handleFilterChange = (name: string, value: string) => {
    const query = { ...router.query };
    
    if (value === '') {
      delete query[name];
    } else {
      query[name] = value;
    }
    
    router.push({
      pathname: router.pathname,
      query,
    });
  };
  
  // Handle status filter change
  const handleStatusFilterChange = (status: string) => {
    const query = { ...router.query };
    const currentStatusFilter = Array.isArray(query.status) 
      ? query.status 
      : query.status 
        ? [query.status as string] 
        : [];
    
    // If the status is already in the filter, remove it
    if (currentStatusFilter.includes(status)) {
      const updatedStatus = currentStatusFilter.filter(s => s !== status);
      if (updatedStatus.length === 0) {
        delete query.status;
      } else {
        query.status = updatedStatus;
      }
    }
    // Otherwise, add it
    else {
      query.status = [...currentStatusFilter, status];
    }
    
    router.push({
      pathname: router.pathname,
      query,
    });
  };

  return (
    <>
      <Head>
        <title>{t('invoices.title')} | Curiosity Invoicing</title>
      </Head>

      <DashboardLayout>
        <div className="mb-6 flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-gray-900">{t('invoices.title')}</h1>
          <Link
            href="/dashboard/invoices/new"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            {t('invoices.new')}
          </Link>
        </div>

        {/* Filters */}
        <div className="mb-6 bg-white p-4 shadow sm:rounded-lg">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4">
              {/* Search */}
              <div className="w-full md:w-64">
                <label htmlFor="search" className="sr-only">
                  Search
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <input
                    id="search"
                    name="search"
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    placeholder="Search invoices..."
                    type="search"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              {/* Customer filter */}
              <div className="w-full md:w-64">
                <label htmlFor="customer" className="sr-only">
                  Customer
                </label>
                <select
                  id="customer"
                  name="customer"
                  className="block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  value={customerFilter}
                  onChange={(e) => handleFilterChange('customer', e.target.value)}
                >
                  <option value="">{t('invoices.allCustomers')}</option>
                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.companyName}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Status filter buttons */}
            <div className="flex flex-wrap gap-2">
              {['DRAFT', 'SENT', 'PAID', 'PARTIALLY_PAID', 'OVERDUE', 'VOIDED'].map((status) => (
                <button
                  key={status}
                  type="button"
                  className={`inline-flex items-center px-2.5 py-1.5 rounded text-xs font-medium ${
                    statusFilter.includes(status) 
                      ? 'bg-primary-100 text-primary-800 hover:bg-primary-200'
                      : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                  }`}
                  onClick={() => handleStatusFilterChange(status)}
                >
                  {t(`invoices.status.${status.toLowerCase()}`)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Invoices list */}
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {filteredInvoices.length > 0 ? (
              filteredInvoices.map((invoice) => (
                <li key={invoice.id}>
                  <Link
                    href={`/dashboard/invoices/${invoice.id}`}
                    className="block hover:bg-gray-50"
                  >
                    <div className="px-4 py-4 sm:px-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="flex-shrink-0">
                            <span className="inline-flex items-center justify-center h-10 w-10 rounded-full bg-primary-100">
                              <svg className="h-6 w-6 text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-primary-600">
                              {invoice.documentNumber}
                            </div>
                            <div className="text-sm text-gray-500">
                              {invoice.customer.companyName}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(invoice.status)}`}>
                            {t(`invoices.status.${invoice.status.toLowerCase()}`)}
                          </span>
                          <div className="text-sm font-medium text-gray-900">
                            {formatCurrency(parseFloat(invoice.totalAmount.toString()))}
                          </div>
                          <div className="text-sm text-gray-500 hidden md:block">
                            {formatDate(invoice.issueDate)}
                          </div>
                          <div className="text-sm text-gray-500 hidden lg:block">
                            {invoice._count.lineItems} {invoice._count.lineItems === 1 ? 'item' : 'items'}
                          </div>
                          <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </Link>
                </li>
              ))
            ) : (
              <li className="px-4 py-6 text-center text-gray-500">
                {searchTerm.trim() !== '' || statusFilter.length > 0 || customerFilter !== ''
                  ? t('invoices.noFilteredInvoices')
                  : t('invoices.noInvoices')}
              </li>
            )}
          </ul>
        </div>

        {/* Help text */}
        {invoices.length === 0 && (
          <div className="mt-6 rounded-md bg-blue-50 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3 flex-1 md:flex md:justify-between">
                <p className="text-sm text-blue-700">
                  {t('invoices.helpText')}
                </p>
                <p className="mt-3 text-sm md:mt-0 md:ml-6">
                  <Link href="/dashboard/invoices/new" className="whitespace-nowrap font-medium text-blue-700 hover:text-blue-600">
                    {t('invoices.createFirstInvoice')} <span aria-hidden="true">&rarr;</span>
                  </Link>
                </p>
              </div>
            </div>
          </div>
        )}
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

  // Get query parameters
  const { status, customer } = context.query;
  const statusFilter = status 
    ? Array.isArray(status) 
      ? status 
      : [status as string]
    : [];
  const customerFilter = customer as string || '';

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

    // Build where clause
    const where: any = {
      companyId,
      type: 'INVOICE',
    };

    // Add status filter
    if (statusFilter.length > 0) {
      where.status = {
        in: statusFilter,
      };
    }

    // Add customer filter
    if (customerFilter) {
      where.customerId = customerFilter;
    }

    // Get invoices
    const invoices = await prisma.document.findMany({
      where,
      include: {
        customer: {
          select: {
            companyName: true,
          },
        },
        _count: {
          select: {
            lineItems: true,
          },
        },
      },
      orderBy: {
        issueDate: 'desc',
      },
    });

    // Get customers
    const customers = await prisma.customer.findMany({
      where: { companyId },
      orderBy: { companyName: 'asc' },
    });

    return {
      props: {
        invoices: JSON.parse(JSON.stringify(invoices)), // Handle serialization of dates
        customers: JSON.parse(JSON.stringify(customers)),
        statusFilter,
        customerFilter,
      },
    };
  } catch (error) {
    console.error('Error fetching invoices:', error);
    return {
      props: {
        invoices: [],
        customers: [],
        statusFilter: [],
        customerFilter: '',
      },
    };
  }
};