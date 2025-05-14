import { useState, useEffect } from 'react';
import { GetServerSideProps } from 'next';
import { getSession } from 'next-auth/react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { Company } from '@prisma/client';
import { t } from '@/lib/translations';
import { fetchCompanyProfile, createOrUpdateCompanyProfile } from '@/lib/api/company';
import { prisma } from '@/lib/prisma';

interface CompanySettingsProps {
  initialCompany: Company | null;
}

export default function CompanySettings({ initialCompany }: CompanySettingsProps) {
  const router = useRouter();
  const [company, setCompany] = useState<Partial<Company> | null>(initialCompany);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState('');

  // Initialize form with empty values if no company yet
  useEffect(() => {
    if (!company) {
      setCompany({
        name: '',
        addressLine1: '',
        addressLine2: '',
        city: '',
        postalCode: '',
        country: '',
        vatId: '',
        phoneNumber: '',
        email: '',
        website: '',
        bankAccountName: '',
        bankAccountNumber: '',
        bankAccountBIC: '',
        logoUrl: '',
      });
    }
  }, [company]);

  // Handle input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    setCompany(prev => ({
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

    // Clear success message
    if (successMessage) {
      setSuccessMessage('');
    }
  };

  // Validate form
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!company?.name?.trim()) {
      newErrors.name = t('company.errors.nameRequired');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm() || !company) {
      return;
    }

    setIsSubmitting(true);

    try {
      const updatedCompany = await createOrUpdateCompanyProfile(company);
      
      setCompany(updatedCompany);
      setSuccessMessage(t('company.success.profileUpdated'));
      
      // Scroll to top to show success message
      window.scrollTo(0, 0);
    } catch (error) {
      console.error('Error updating company profile:', error);
      setErrors({ submit: t('company.errors.updateFailed') });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!company) {
    return null; // Or a loading indicator
  }

  return (
    <>
      <Head>
        <title>{t('settings.companyProfile')} | Curiosity Invoicing</title>
      </Head>

      <DashboardLayout>
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">{t('settings.companyProfile')}</h1>
          <p className="mt-1 text-sm text-gray-500">
            {t('company.description')}
          </p>
        </div>

        {successMessage && (
          <div className="mb-6 p-4 rounded-md bg-green-50 border border-green-200">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-green-800">
                  {successMessage}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <form onSubmit={handleSubmit} className="p-6">
            {errors.submit && (
              <div className="mb-6 p-4 rounded-md bg-red-50 border border-red-200">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-red-800">
                      {errors.submit}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-8">
              {/* Company Information Section */}
              <div>
                <h3 className="text-lg font-medium leading-6 text-gray-900">{t('company.basicInfo')}</h3>
                <p className="mt-1 text-sm text-gray-500">{t('company.basicInfoHelp')}</p>

                <div className="mt-6 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                  {/* Company Name */}
                  <div className="sm:col-span-4">
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                      {t('company.name')} *
                    </label>
                    <div className="mt-1">
                      <input
                        type="text"
                        name="name"
                        id="name"
                        value={company.name || ''}
                        onChange={handleChange}
                        className={`shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md ${
                          errors.name ? 'border-red-300' : ''
                        }`}
                      />
                      {errors.name && (
                        <p className="mt-2 text-sm text-red-600">{errors.name}</p>
                      )}
                    </div>
                  </div>

                  {/* Address Line 1 */}
                  <div className="sm:col-span-6">
                    <label htmlFor="addressLine1" className="block text-sm font-medium text-gray-700">
                      {t('company.addressLine1')}
                    </label>
                    <div className="mt-1">
                      <input
                        type="text"
                        name="addressLine1"
                        id="addressLine1"
                        value={company.addressLine1 || ''}
                        onChange={handleChange}
                        className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      />
                    </div>
                  </div>

                  {/* Address Line 2 */}
                  <div className="sm:col-span-6">
                    <label htmlFor="addressLine2" className="block text-sm font-medium text-gray-700">
                      {t('company.addressLine2')}
                    </label>
                    <div className="mt-1">
                      <input
                        type="text"
                        name="addressLine2"
                        id="addressLine2"
                        value={company.addressLine2 || ''}
                        onChange={handleChange}
                        className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      />
                    </div>
                  </div>

                  {/* City */}
                  <div className="sm:col-span-2">
                    <label htmlFor="city" className="block text-sm font-medium text-gray-700">
                      {t('company.city')}
                    </label>
                    <div className="mt-1">
                      <input
                        type="text"
                        name="city"
                        id="city"
                        value={company.city || ''}
                        onChange={handleChange}
                        className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      />
                    </div>
                  </div>

                  {/* Postal Code */}
                  <div className="sm:col-span-2">
                    <label htmlFor="postalCode" className="block text-sm font-medium text-gray-700">
                      {t('company.postalCode')}
                    </label>
                    <div className="mt-1">
                      <input
                        type="text"
                        name="postalCode"
                        id="postalCode"
                        value={company.postalCode || ''}
                        onChange={handleChange}
                        className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      />
                    </div>
                  </div>

                  {/* Country */}
                  <div className="sm:col-span-2">
                    <label htmlFor="country" className="block text-sm font-medium text-gray-700">
                      {t('company.country')}
                    </label>
                    <div className="mt-1">
                      <input
                        type="text"
                        name="country"
                        id="country"
                        value={company.country || ''}
                        onChange={handleChange}
                        className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-gray-200">
                <h3 className="text-lg font-medium leading-6 text-gray-900">{t('company.contactInfo')}</h3>
                <p className="mt-1 text-sm text-gray-500">{t('company.contactInfoHelp')}</p>

                <div className="mt-6 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                  {/* VAT ID */}
                  <div className="sm:col-span-3">
                    <label htmlFor="vatId" className="block text-sm font-medium text-gray-700">
                      {t('company.vatId')}
                    </label>
                    <div className="mt-1">
                      <input
                        type="text"
                        name="vatId"
                        id="vatId"
                        value={company.vatId || ''}
                        onChange={handleChange}
                        className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      />
                    </div>
                  </div>

                  {/* Phone Number */}
                  <div className="sm:col-span-3">
                    <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700">
                      {t('company.phoneNumber')}
                    </label>
                    <div className="mt-1">
                      <input
                        type="text"
                        name="phoneNumber"
                        id="phoneNumber"
                        value={company.phoneNumber || ''}
                        onChange={handleChange}
                        className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div className="sm:col-span-3">
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                      {t('company.email')}
                    </label>
                    <div className="mt-1">
                      <input
                        type="email"
                        name="email"
                        id="email"
                        value={company.email || ''}
                        onChange={handleChange}
                        className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      />
                    </div>
                  </div>

                  {/* Website */}
                  <div className="sm:col-span-3">
                    <label htmlFor="website" className="block text-sm font-medium text-gray-700">
                      {t('company.website')}
                    </label>
                    <div className="mt-1">
                      <input
                        type="text"
                        name="website"
                        id="website"
                        value={company.website || ''}
                        onChange={handleChange}
                        className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-gray-200">
                <h3 className="text-lg font-medium leading-6 text-gray-900">{t('company.bankInfo')}</h3>
                <p className="mt-1 text-sm text-gray-500">{t('company.bankInfoHelp')}</p>

                <div className="mt-6 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                  {/* Bank Account Name */}
                  <div className="sm:col-span-2">
                    <label htmlFor="bankAccountName" className="block text-sm font-medium text-gray-700">
                      {t('company.bankAccountName')}
                    </label>
                    <div className="mt-1">
                      <input
                        type="text"
                        name="bankAccountName"
                        id="bankAccountName"
                        value={company.bankAccountName || ''}
                        onChange={handleChange}
                        className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      />
                    </div>
                  </div>

                  {/* Bank Account Number */}
                  <div className="sm:col-span-2">
                    <label htmlFor="bankAccountNumber" className="block text-sm font-medium text-gray-700">
                      {t('company.bankAccountNumber')}
                    </label>
                    <div className="mt-1">
                      <input
                        type="text"
                        name="bankAccountNumber"
                        id="bankAccountNumber"
                        value={company.bankAccountNumber || ''}
                        onChange={handleChange}
                        className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      />
                    </div>
                  </div>

                  {/* Bank Account BIC */}
                  <div className="sm:col-span-2">
                    <label htmlFor="bankAccountBIC" className="block text-sm font-medium text-gray-700">
                      {t('company.bankAccountBIC')}
                    </label>
                    <div className="mt-1">
                      <input
                        type="text"
                        name="bankAccountBIC"
                        id="bankAccountBIC"
                        value={company.bankAccountBIC || ''}
                        onChange={handleChange}
                        className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-gray-200">
                <h3 className="text-lg font-medium leading-6 text-gray-900">{t('company.branding')}</h3>
                <p className="mt-1 text-sm text-gray-500">{t('company.brandingHelp')}</p>

                <div className="mt-6 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                  {/* Logo URL */}
                  <div className="sm:col-span-6">
                    <label htmlFor="logoUrl" className="block text-sm font-medium text-gray-700">
                      {t('company.logoUrl')}
                    </label>
                    <div className="mt-1">
                      <input
                        type="text"
                        name="logoUrl"
                        id="logoUrl"
                        value={company.logoUrl || ''}
                        onChange={handleChange}
                        className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      />
                    </div>
                    <p className="mt-2 text-sm text-gray-500">
                      {t('company.logoUrlHelp')}
                    </p>
                  </div>

                  {/* Logo Preview */}
                  {company.logoUrl && (
                    <div className="sm:col-span-6">
                      <label className="block text-sm font-medium text-gray-700">
                        {t('company.logoPreview')}
                      </label>
                      <div className="mt-1">
                        <img
                          src={company.logoUrl}
                          alt="Company Logo"
                          className="h-16 w-auto border border-gray-200 rounded-md p-2"
                          onError={(e) => {
                            // Handle image load error
                            (e.target as HTMLImageElement).src = '/placeholder-logo.png';
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="pt-5 mt-8 border-t border-gray-200">
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  {isSubmitting ? t('common.saving') : t('common.save')}
                </button>
              </div>
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
    // Get user and company
    const user = await prisma.user.findUnique({
      where: { email: session.user?.email as string },
      include: { company: true },
    });

    const initialCompany = user?.company || null;

    return {
      props: {
        initialCompany: JSON.parse(JSON.stringify(initialCompany)),
      },
    };
  } catch (error) {
    console.error('Error fetching company:', error);
    return {
      props: {
        initialCompany: null,
      },
    };
  }
};