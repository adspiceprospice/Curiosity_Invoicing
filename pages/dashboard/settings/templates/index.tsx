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
  typeFilter: DocumentType | '';
  languageFilter: string;
}

export default function TemplatesList({ templates, typeFilter, languageFilter }: TemplatesListProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  
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

  // Group templates by type and language for better organization
  const groupedTemplates: Record<string, Record<string, Template[]>> = {};
  
  filteredTemplates.forEach(template => {
    if (!groupedTemplates[template.type]) {
      groupedTemplates[template.type] = {};
    }
    
    if (!groupedTemplates[template.type][template.languageCode]) {
      groupedTemplates[template.type][template.languageCode] = [];
    }
    
    groupedTemplates[template.type][template.languageCode].push(template);
  });

  return (
    <>
      <Head>
        <title>{t('templates.title')} | Curiosity Invoicing</title>
      </Head>

      <DashboardLayout>
        <div className="mb-6 flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-gray-900">{t('templates.title')}</h1>
          <Link
            href="/dashboard/settings/templates/new"
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
              <div className="w-full md:w-64">
                <label htmlFor="type" className="sr-only">
                  Document Type
                </label>
                <select
                  id="type"
                  name="type"
                  className="block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  value={typeFilter}
                  onChange={(e) => handleFilterChange('type', e.target.value)}
                >
                  <option value="">{t('templates.allTypes')}</option>
                  <option value="OFFER">{t('templates.typeOffer')}</option>
                  <option value="INVOICE">{t('templates.typeInvoice')}</option>
                </select>
              </div>

              {/* Language filter */}
              <div className="w-full md:w-64">
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
                  <option value="nl">Nederlands</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Templates list */}
        {Object.keys(groupedTemplates).length > 0 ? (
          Object.entries(groupedTemplates).map(([type, languageGroups]) => (
            <div key={type} className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                {type === 'OFFER' ? t('templates.typeOffer') : t('templates.typeInvoice')}
              </h2>
              
              {Object.entries(languageGroups).map(([language, templateList]) => (
                <div key={`${type}-${language}`} className="mb-6">
                  <h3 className="text-lg font-medium text-gray-700 mb-3">
                    {language === 'en' ? 'English' : 'Nederlands'}
                  </h3>
                  
                  <div className="bg-white shadow overflow-hidden sm:rounded-md">
                    <ul className="divide-y divide-gray-200">
                      {templateList.map((template) => (
                        <li key={template.id}>
                          <Link
                            href={`/dashboard/settings/templates/${template.id}`}
                            className="block hover:bg-gray-50"
                          >
                            <div className="px-4 py-4 sm:px-6">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                  <div className="flex-shrink-0">
                                    <span className="inline-flex items-center justify-center h-10 w-10 rounded-full bg-primary-100">
                                      <svg className="h-6 w-6 text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                                      </svg>
                                    </span>
                                  </div>
                                  <div className="ml-4">
                                    <div className="text-sm font-medium text-primary-600">
                                      {template.name}
                                    </div>
                                    <div className="text-sm text-gray-500 flex items-center">
                                      {template.isDefault && (
                                        <span className="mr-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                          {t('templates.default')}
                                        </span>
                                      )}
                                      <span>
                                        {t('templates.lastUpdated')}: {new Date(template.updatedAt).toLocaleDateString()}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                <div className="ml-2 flex-shrink-0 flex">
                                  <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                  </svg>
                                </div>
                              </div>
                            </div>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          ))
        ) : (
          <div className="bg-white shadow sm:rounded-md p-6 text-center text-gray-500">
            {searchTerm.trim() !== '' || typeFilter !== '' || languageFilter !== ''
              ? t('templates.noFilteredTemplates')
              : t('templates.noTemplates')}
          </div>
        )}

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
                  <Link href="/dashboard/settings/templates/new" className="whitespace-nowrap font-medium text-blue-700 hover:text-blue-600">
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
  const typeFilter = type as DocumentType | '' || '';
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
        templates: JSON.parse(JSON.stringify(templates)), // Handle serialization of dates
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