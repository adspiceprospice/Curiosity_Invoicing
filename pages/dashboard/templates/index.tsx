import { useState } from 'react';
import { GetServerSideProps } from 'next';
import { getSession } from 'next-auth/react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { Template, DocumentType } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { t } from '@/lib/translations';

interface TemplatesListProps {
  templates: Template[];
  typeFilter: DocumentType | string;
  languageFilter: string;
}

export default function TemplatesList({ templates: initialTemplates, typeFilter, languageFilter }: TemplatesListProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [templates, setTemplates] = useState(initialTemplates);
  
  // Get type badge color
  const getTypeColor = (type: DocumentType) => {
    switch (type) {
      case 'INVOICE':
        return 'bg-blue-100 text-blue-800';
      case 'OFFER':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  // Filter templates
  const filteredTemplates = templates.filter(template => {
    // Filter by search term
    const searchMatch = searchTerm.trim() === '' || 
      template.name.toLowerCase().includes(searchTerm.toLowerCase());
    
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
  
  // Set template as default
  const handleSetDefault = async (id: string) => {
    try {
      const response = await fetch(`/api/templates/${id}/set-default`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        // Update the templates list
        setTemplates(prevTemplates => 
          prevTemplates.map(template => ({
            ...template,
            isDefault: template.id === id ? true : 
              (template.type === templates.find(t => t.id === id)?.type && 
               template.languageCode === templates.find(t => t.id === id)?.languageCode) 
                ? false 
                : template.isDefault
          }))
        );
      }
    } catch (error) {
      console.error('Error setting template as default:', error);
    }
  };

  return (
    <>
      <Head>
        <title>{t('templates.title')} | Curiosity Invoicing</title>
      </Head>

      <DashboardLayout>
        <div className="mb-6 flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-gray-900">{t('templates.title')}</h1>
          <Link
            href="/dashboard/templates/new"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            {t('templates.new')}
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
                    placeholder="Search templates..."
                    type="search"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              {/* Type filter */}
              <div className="w-full md:w-48">
                <label htmlFor="type" className="sr-only">
                  Type
                </label>
                <select
                  id="type"
                  name="type"
                  className="block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  value={typeFilter}
                  onChange={(e) => handleFilterChange('type', e.target.value)}
                >
                  <option value="">{t('templates.allTypes')}</option>
                  <option value="INVOICE">{t('templates.types.invoice')}</option>
                  <option value="OFFER">{t('templates.types.offer')}</option>
                </select>
              </div>

              {/* Language filter */}
              <div className="w-full md:w-48">
                <label htmlFor="language" className="sr-only">
                  Language
                </label>
                <select
                  id="language"
                  name="language"
                  className="block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  value={languageFilter}
                  onChange={(e) => handleFilterChange('language', e.target.value)}
                >
                  <option value="">{t('templates.allLanguages')}</option>
                  <option value="en">English</option>
                  <option value="de">German</option>
                  <option value="nl">Dutch</option>
                  <option value="fr">French</option>
                  <option value="es">Spanish</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Templates list */}
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {filteredTemplates.length > 0 ? (
              filteredTemplates.map((template) => (
                <li key={template.id}>
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <span className={`inline-flex items-center justify-center h-10 w-10 rounded-full ${getTypeColor(template.type)}`}>
                            <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            </svg>
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="flex items-center">
                            <div className="text-sm font-medium text-primary-600">
                              {template.name}
                            </div>
                            {template.isDefault && (
                              <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                Default
                              </span>
                            )}
                          </div>
                          <div className="flex mt-1 space-x-2">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(template.type)}`}>
                              {template.type}
                            </span>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              {template.languageCode.toUpperCase()}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {!template.isDefault && (
                          <button
                            type="button"
                            onClick={() => handleSetDefault(template.id)}
                            className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                          >
                            Set as Default
                          </button>
                        )}
                        <Link
                          href={`/dashboard/templates/${template.id}/duplicate`}
                          className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                        >
                          Duplicate
                        </Link>
                        <Link
                          href={`/dashboard/templates/${template.id}`}
                          className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                        >
                          View
                        </Link>
                        <Link
                          href={`/dashboard/templates/${template.id}/edit`}
                          className="inline-flex items-center px-2.5 py-1.5 border border-primary-300 text-xs font-medium rounded text-primary-700 bg-white hover:bg-primary-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                        >
                          Edit
                        </Link>
                      </div>
                    </div>
                  </div>
                </li>
              ))
            ) : (
              <li className="px-4 py-6 text-center text-gray-500">
                {searchTerm.trim() !== '' || typeFilter !== '' || languageFilter !== ''
                  ? t('templates.noFilteredTemplates')
                  : t('templates.noTemplates')}
              </li>
            )}
          </ul>
        </div>

        {/* Help text */}
        {templates.length === 0 && (
          <div className="mt-6 rounded-md bg-blue-50 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3 flex-1 md:flex md:justify-between">
                <p className="text-sm text-blue-700">
                  {t('templates.helpText')}
                </p>
                <p className="mt-3 text-sm md:mt-0 md:ml-6">
                  <Link href="/dashboard/templates/new" className="whitespace-nowrap font-medium text-blue-700 hover:text-blue-600">
                    {t('templates.createFirstTemplate')} <span aria-hidden="true">&rarr;</span>
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
  const { type, language } = context.query;
  const typeFilter = type as DocumentType | string || '';
  const languageFilter = language as string || '';

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
    };

    // Add type filter
    if (typeFilter) {
      where.type = typeFilter;
    }

    // Add language filter
    if (languageFilter) {
      where.languageCode = languageFilter;
    }

    // Get templates
    const templates = await prisma.template.findMany({
      where,
      orderBy: [
        { type: 'asc' },
        { languageCode: 'asc' },
        { name: 'asc' },
      ],
    });

    return {
      props: {
        templates: JSON.parse(JSON.stringify(templates)),
        typeFilter,
        languageFilter,
      },
    };
  } catch (error) {
    console.error('Error fetching templates:', error);
    return {
      props: {
        templates: [],
        typeFilter: '',
        languageFilter: '',
      },
    };
  }
};