import { useState } from 'react';
import { GetServerSideProps } from 'next';
import { getSession } from 'next-auth/react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { DocumentType } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { t } from '@/lib/translations';

export default function NewTemplate() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    type: 'INVOICE' as DocumentType,
    languageCode: 'en',
    isDefault: false,
    content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{documentType}} {{documentNumber}}</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 0;
      padding: 20px;
      color: #333;
    }
    .header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 40px;
    }
    .company-info {
      margin-bottom: 30px;
    }
    .document-info {
      margin-bottom: 30px;
    }
    .customer-info {
      margin-bottom: 30px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 30px;
    }
    th, td {
      padding: 10px;
      text-align: left;
      border-bottom: 1px solid #ddd;
    }
    th {
      background-color: #f2f2f2;
    }
    .totals {
      margin-left: auto;
      width: 300px;
    }
    .totals table {
      margin-bottom: 30px;
    }
    .footer {
      margin-top: 50px;
      padding-top: 20px;
      border-top: 1px solid #ddd;
      font-size: 12px;
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <h1>{{company.name}}</h1>
    </div>
    <div>
      <h2>{{documentType}} {{documentNumber}}</h2>
    </div>
  </div>

  <div class="company-info">
    <p>{{company.address}}</p>
    <p>{{company.email}} | {{company.phone}}</p>
    <p>VAT: {{company.vatId}}</p>
  </div>

  <div class="document-info">
    <p><strong>Date:</strong> {{issueDate}}</p>
    {{#if dueDate}}
    <p><strong>Due Date:</strong> {{dueDate}}</p>
    {{/if}}
    {{#if validUntil}}
    <p><strong>Valid Until:</strong> {{validUntil}}</p>
    {{/if}}
  </div>

  <div class="customer-info">
    <h3>Bill To:</h3>
    <p>{{customer.companyName}}</p>
    <p>{{customer.contactPerson}}</p>
    <p>{{customer.billingAddress}}</p>
    <p>VAT: {{customer.vatId}}</p>
  </div>

  <table>
    <thead>
      <tr>
        <th>Description</th>
        <th>Quantity</th>
        <th>Unit Price</th>
        <th>Discount</th>
        <th>Tax Rate</th>
        <th>Total</th>
      </tr>
    </thead>
    <tbody>
      {{#each lineItems}}
      <tr>
        <td>{{description}}</td>
        <td>{{quantity}}</td>
        <td>{{formatCurrency unitPrice}}</td>
        <td>{{discount}}%</td>
        <td>{{taxRate}}%</td>
        <td>{{formatCurrency total}}</td>
      </tr>
      {{/each}}
    </tbody>
  </table>

  <div class="totals">
    <table>
      <tr>
        <td><strong>Subtotal:</strong></td>
        <td>{{formatCurrency subtotal}}</td>
      </tr>
      {{#if totalDiscount}}
      <tr>
        <td><strong>Discount:</strong></td>
        <td>{{formatCurrency totalDiscount}}</td>
      </tr>
      {{/if}}
      <tr>
        <td><strong>Tax:</strong></td>
        <td>{{formatCurrency totalTax}}</td>
      </tr>
      <tr>
        <td><strong>Total:</strong></td>
        <td><strong>{{formatCurrency totalAmount}}</strong></td>
      </tr>
    </table>
  </div>

  {{#if notes}}
  <div class="notes">
    <h3>Notes</h3>
    <p>{{notes}}</p>
  </div>
  {{/if}}

  {{#if paymentTerms}}
  <div class="payment-terms">
    <h3>Payment Terms</h3>
    <p>{{paymentTerms}}</p>
  </div>
  {{/if}}

  <div class="footer">
    <p>{{company.name}} | {{company.address}} | {{company.email}}</p>
  </div>
</body>
</html>`,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Handle input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));

    // Clear error when field is edited
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  // Handle checkbox change
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: checked,
    }));
  };

  // Validate form
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Template name is required';
    }

    if (!formData.content.trim()) {
      newErrors.content = 'Template content is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const data = await response.json();
        router.push(`/dashboard/templates/${data.id}`);
      } else {
        const data = await response.json();
        setErrors({ submit: data.message || 'Error creating template' });
      }
    } catch (error) {
      console.error('Error creating template:', error);
      setErrors({ submit: 'An unexpected error occurred' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Head>
        <title>New Template | Curiosity Invoicing</title>
      </Head>

      <DashboardLayout>
        <div className="mb-6 flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-gray-900">Create New Template</h1>
          <Link
            href="/dashboard/templates"
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            Cancel
          </Link>
        </div>

        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <form onSubmit={handleSubmit} className="p-6">
            {errors.submit && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">{errors.submit}</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Template Name */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Template Name *
                </label>
                <input
                  type="text"
                  name="name"
                  id="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="E.g., Standard Invoice Template"
                  className={`mt-1 block w-full shadow-sm sm:text-sm rounded-md ${
                    errors.name 
                      ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                      : 'border-gray-300 focus:ring-primary-500 focus:border-primary-500'
                  }`}
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                )}
              </div>

              {/* Template Type */}
              <div>
                <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
                  Template Type *
                </label>
                <select
                  name="type"
                  id="type"
                  value={formData.type}
                  onChange={handleChange}
                  className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                >
                  <option value="INVOICE">Invoice</option>
                  <option value="OFFER">Offer</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Language Code */}
              <div>
                <label htmlFor="languageCode" className="block text-sm font-medium text-gray-700 mb-1">
                  Language *
                </label>
                <select
                  name="languageCode"
                  id="languageCode"
                  value={formData.languageCode}
                  onChange={handleChange}
                  className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                >
                  <option value="en">English</option>
                  <option value="de">German</option>
                  <option value="nl">Dutch</option>
                  <option value="fr">French</option>
                  <option value="es">Spanish</option>
                </select>
              </div>

              {/* Is Default */}
              <div className="flex items-center h-full pt-6">
                <input
                  id="isDefault"
                  name="isDefault"
                  type="checkbox"
                  checked={formData.isDefault}
                  onChange={handleCheckboxChange}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor="isDefault" className="ml-2 block text-sm font-medium text-gray-700">
                  Set as default template for this type and language
                </label>
              </div>
            </div>

            {/* Template Content */}
            <div className="mb-6">
              <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">
                Template Content *
              </label>
              <div className="mt-1">
                <textarea
                  id="content"
                  name="content"
                  rows={20}
                  value={formData.content}
                  onChange={handleChange}
                  className={`shadow-sm block w-full sm:text-sm border-gray-300 rounded-md ${
                    errors.content 
                      ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                      : 'focus:ring-primary-500 focus:border-primary-500'
                  }`}
                />
              </div>
              {errors.content && (
                <p className="mt-1 text-sm text-red-600">{errors.content}</p>
              )}
              <p className="mt-2 text-sm text-gray-500">
                Use HTML and custom template variables like {{companyName}}, {{customerName}}, etc.
              </p>
            </div>

            <div className="flex justify-end space-x-3">
              <Link
                href="/dashboard/templates"
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                {isSubmitting ? 'Creating...' : 'Create Template'}
              </button>
            </div>
          </form>
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

    return {
      props: {},
    };
  } catch (error) {
    console.error('Error checking user company:', error);
    return {
      redirect: {
        destination: '/',
        permanent: false,
      },
    };
  }
};