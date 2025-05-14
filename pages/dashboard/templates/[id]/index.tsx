import { useState } from 'react';
import { GetServerSideProps } from 'next';
import { getSession } from 'next-auth/react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { Template } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { t } from '@/lib/translations';

interface TemplateDetailProps {
  template: Template;
}

export default function TemplateDetail({ template }: TemplateDetailProps) {
  const router = useRouter();
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [previewPdf, setPreviewPdf] = useState<string | null>(null);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [isDeleteLoading, setIsDeleteLoading] = useState(false);

  // Format date
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString();
  };

  // Get type badge color
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'INVOICE':
        return 'bg-blue-100 text-blue-800';
      case 'OFFER':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Handle preview
  const handlePreview = async () => {
    setIsPreviewLoading(true);
    try {
      const response = await fetch(`/api/templates/${template.id}/preview`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setPreviewPdf(data.previewPdf);
      } else {
        console.error('Error generating preview');
      }
    } catch (error) {
      console.error('Error generating preview:', error);
    } finally {
      setIsPreviewLoading(false);
    }
  };

  // Set as default
  const handleSetDefault = async () => {
    try {
      const response = await fetch(`/api/templates/${template.id}/set-default`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        router.reload();
      }
    } catch (error) {
      console.error('Error setting template as default:', error);
    }
  };

  // Handle duplicate
  const handleDuplicate = async () => {
    try {
      const response = await fetch(`/api/templates/${template.id}/duplicate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        router.push(`/dashboard/templates/${data.template.id}`);
      }
    } catch (error) {
      console.error('Error duplicating template:', error);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    setIsDeleteLoading(true);
    try {
      const response = await fetch(`/api/templates/${template.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        router.push('/dashboard/templates');
      } else {
        const data = await response.json();
        if (data.documentsCount) {
          alert(`Cannot delete template that is being used by ${data.documentsCount} documents.`);
        } else {
          alert('Error deleting template');
        }
      }
    } catch (error) {
      console.error('Error deleting template:', error);
    } finally {
      setIsDeleteLoading(false);
      setIsConfirmingDelete(false);
    }
  };

  return (
    <>
      <Head>
        <title>{template.name} | Curiosity Invoicing</title>
      </Head>

      <DashboardLayout>
        {/* Header */}
        <div className="mb-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <h1 className="text-2xl font-semibold text-gray-900">{template.name}</h1>
              {template.isDefault && (
                <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Default
                </span>
              )}
            </div>

            <div className="flex space-x-2">
              <Link
                href="/dashboard/templates"
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                Back to List
              </Link>
              <Link
                href={`/dashboard/templates/${template.id}/edit`}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                Edit Template
              </Link>
            </div>
          </div>
          <div className="mt-1 flex flex-col sm:flex-row sm:flex-wrap sm:mt-0 sm:space-x-6">
            <div className="mt-2 flex items-center text-sm text-gray-500">
              <span className={`mr-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(template.type)}`}>
                {template.type}
              </span>
            </div>
            <div className="mt-2 flex items-center text-sm text-gray-500">
              <span className="mr-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                {template.languageCode.toUpperCase()}
              </span>
            </div>
            <div className="mt-2 flex items-center text-sm text-gray-500">
              <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
              </svg>
              Created: {formatDate(new Date(template.createdAt))}
            </div>
            <div className="mt-2 flex items-center text-sm text-gray-500">
              <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
              </svg>
              Updated: {formatDate(new Date(template.updatedAt))}
            </div>
          </div>
        </div>

        {/* Template actions */}
        <div className="mb-6 flex space-x-2">
          <button
            type="button"
            onClick={handlePreview}
            disabled={isPreviewLoading}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            {isPreviewLoading ? 'Generating Preview...' : 'Preview Template'}
          </button>
          {!template.isDefault && (
            <button
              type="button"
              onClick={handleSetDefault}
              className="inline-flex items-center px-4 py-2 border border-green-300 text-sm font-medium rounded-md text-green-700 bg-white hover:bg-green-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              Set as Default
            </button>
          )}
          <button
            type="button"
            onClick={handleDuplicate}
            className="inline-flex items-center px-4 py-2 border border-blue-300 text-sm font-medium rounded-md text-blue-700 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Duplicate
          </button>
          <button
            type="button"
            onClick={() => setIsConfirmingDelete(true)}
            className="inline-flex items-center px-4 py-2 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            Delete
          </button>
        </div>

        {/* Preview PDF */}
        {previewPdf && (
          <div className="mb-6">
            <h2 className="text-lg font-medium text-gray-900 mb-2">Template Preview</h2>
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              <iframe
                src={`data:application/pdf;base64,${previewPdf}`}
                className="w-full h-screen"
                title="Template Preview"
              />
            </div>
          </div>
        )}

        {/* Template Content */}
        <div>
          <h2 className="text-lg font-medium text-gray-900 mb-2">Template Content</h2>
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="p-4">
              <pre className="whitespace-pre-wrap text-sm text-gray-700 font-mono border border-gray-200 p-4 rounded-md bg-gray-50 overflow-auto max-h-96">
                {template.content}
              </pre>
            </div>
          </div>
        </div>

        {/* Delete confirmation modal */}
        {isConfirmingDelete && (
          <div className="fixed z-10 inset-0 overflow-y-auto">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
              </div>

              <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

              <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
                <div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-headline">
                      Delete Template
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Are you sure you want to delete this template? This action cannot be undone.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                  <button
                    type="button"
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                    onClick={handleDelete}
                    disabled={isDeleteLoading}
                  >
                    {isDeleteLoading ? 'Deleting...' : 'Delete'}
                  </button>
                  <button
                    type="button"
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:w-auto sm:text-sm"
                    onClick={() => setIsConfirmingDelete(false)}
                  >
                    Cancel
                  </button>
                </div>
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

  const { id } = context.params as { id: string };

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

    // Get template
    const template = await prisma.template.findFirst({
      where: {
        id,
        companyId,
      },
    });

    if (!template) {
      return {
        notFound: true,
      };
    }

    return {
      props: {
        template: JSON.parse(JSON.stringify(template)),
      },
    };
  } catch (error) {
    console.error('Error fetching template:', error);
    return {
      notFound: true,
    };
  }
};