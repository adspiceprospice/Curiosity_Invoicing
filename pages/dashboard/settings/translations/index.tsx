import { useState, useEffect } from 'react';
import { GetServerSideProps } from 'next';
import { getSession } from 'next-auth/react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { CompanyTranslation } from '@prisma/client';
import { t } from '@/lib/translations';
import { fetchCompanyTranslations, createOrUpdateCompanyTranslation } from '@/lib/api/companyTranslations';
import { prisma } from '@/lib/prisma';

interface CompanyTranslationsProps {
  initialTranslations: CompanyTranslation[];
}

export default function CompanyTranslations({ initialTranslations }: CompanyTranslationsProps) {
  const router = useRouter();
  const [translations, setTranslations] = useState<Record<string, CompanyTranslation>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [activeLanguage, setActiveLanguage] = useState<string>('en');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Supported languages - simplified to just English and Dutch
  const supportedLanguages = [
    { code: 'en', name: 'English' },
    { code: 'nl', name: 'Dutch' },
  ];

  // Process the initial translations into a record by language code
  useEffect(() => {
    const translationsRecord: Record<string, CompanyTranslation> = {};
    initialTranslations.forEach(translation => {
      translationsRecord[translation.languageCode] = translation;
    });

    // Initialize empty translations for languages that don't have one yet
    supportedLanguages.forEach(lang => {
      if (!translationsRecord[lang.code]) {
        translationsRecord[lang.code] = {
          id: '',
          languageCode: lang.code,
          addressLine1: '',
          addressLine2: '',
          paymentTermsText: '',
          invoiceFooterText: '',
          offerFooterText: '',
          companyId: '',
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      }
    });

    setTranslations(translationsRecord);
  }, [initialTranslations]);

  // Handle input change
  const handleInputChange = (field: string, value: string) => {
    setTranslations(prevTranslations => ({
      ...prevTranslations,
      [activeLanguage]: {
        ...prevTranslations[activeLanguage],
        [field]: value,
      },
    }));

    // Clear messages when user starts editing
    setSuccessMessage('');
    setErrorMessage('');
  };

  // Save the current language translation
  const handleSave = async () => {
    setIsLoading(true);
    setSuccessMessage('');
    setErrorMessage('');

    try {
      const translation = translations[activeLanguage];
      
      const updatedTranslation = await createOrUpdateCompanyTranslation({
        languageCode: activeLanguage,
        addressLine1: translation.addressLine1,
        addressLine2: translation.addressLine2,
        paymentTermsText: translation.paymentTermsText,
        invoiceFooterText: translation.invoiceFooterText,
        offerFooterText: translation.offerFooterText,
      });

      // Update the translations state
      setTranslations(prevTranslations => ({
        ...prevTranslations,
        [activeLanguage]: updatedTranslation,
      }));

      setSuccessMessage(t('translations.saveSuccess'));
      
      // Scroll to top to show success message
      window.scrollTo(0, 0);
    } catch (error) {
      console.error('Error saving translation:', error);
      setErrorMessage(t('translations.saveError'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>{t('translations.title')} | Curiosity Invoicing</title>
      </Head>

      <DashboardLayout>
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">{t('translations.title')}</h1>
          <p className="mt-1 text-sm text-gray-500">
            {t('translations.description')}
          </p>
        </div>

        {/* Success message */}
        {successMessage && (
          <div className="mb-6 p-4 bg-green-50 rounded-md border border-green-200">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-green-800">{successMessage}</p>
              </div>
            </div>
          </div>
        )}

        {/* Error message */}
        {errorMessage && (
          <div className="mb-6 p-4 bg-red-50 rounded-md border border-red-200">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-red-800">{errorMessage}</p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="p-6">
            {/* Language tabs */}
            <div className="border-b border-gray-200 mb-6">
              <nav className="-mb-px flex space-x-6" aria-label="Languages">
                {supportedLanguages.map(language => (
                  <button
                    key={language.code}
                    onClick={() => setActiveLanguage(language.code)}
                    className={`
                      whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm 
                      ${activeLanguage === language.code
                        ? 'border-primary-500 text-primary-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }
                    `}
                  >
                    {language.name}
                  </button>
                ))}
              </nav>
            </div>

            {translations[activeLanguage] && (
              <div className="space-y-6">
                {/* Address */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900">{t('translations.addressSection')}</h3>
                  <p className="mt-1 text-sm text-gray-500">{t('translations.addressSectionHelp')}</p>

                  <div className="mt-4 grid grid-cols-1 gap-y-6 sm:grid-cols-6 gap-x-4">
                    <div className="sm:col-span-6">
                      <label htmlFor="addressLine1" className="block text-sm font-medium text-gray-700">
                        {t('company.addressLine1')}
                      </label>
                      <div className="mt-1">
                        <input
                          type="text"
                          name="addressLine1"
                          id="addressLine1"
                          value={translations[activeLanguage].addressLine1 || ''}
                          onChange={(e) => handleInputChange('addressLine1', e.target.value)}
                          className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        />
                      </div>
                    </div>

                    <div className="sm:col-span-6">
                      <label htmlFor="addressLine2" className="block text-sm font-medium text-gray-700">
                        {t('company.addressLine2')}
                      </label>
                      <div className="mt-1">
                        <input
                          type="text"
                          name="addressLine2"
                          id="addressLine2"
                          value={translations[activeLanguage].addressLine2 || ''}
                          onChange={(e) => handleInputChange('addressLine2', e.target.value)}
                          className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Payment Terms */}
                <div className="pt-6 border-t border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">{t('translations.paymentTermsSection')}</h3>
                  <p className="mt-1 text-sm text-gray-500">{t('translations.paymentTermsSectionHelp')}</p>

                  <div className="mt-4">
                    <label htmlFor="paymentTermsText" className="block text-sm font-medium text-gray-700">
                      {t('translations.paymentTermsText')}
                    </label>
                    <div className="mt-1">
                      <textarea
                        id="paymentTermsText"
                        name="paymentTermsText"
                        rows={3}
                        value={translations[activeLanguage].paymentTermsText || ''}
                        onChange={(e) => handleInputChange('paymentTermsText', e.target.value)}
                        className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        placeholder={t('translations.paymentTermsPlaceholder')}
                      />
                    </div>
                  </div>
                </div>

                {/* Invoice Footer */}
                <div className="pt-6 border-t border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">{t('translations.invoiceFooterSection')}</h3>
                  <p className="mt-1 text-sm text-gray-500">{t('translations.invoiceFooterSectionHelp')}</p>

                  <div className="mt-4">
                    <label htmlFor="invoiceFooterText" className="block text-sm font-medium text-gray-700">
                      {t('translations.invoiceFooterText')}
                    </label>
                    <div className="mt-1">
                      <textarea
                        id="invoiceFooterText"
                        name="invoiceFooterText"
                        rows={3}
                        value={translations[activeLanguage].invoiceFooterText || ''}
                        onChange={(e) => handleInputChange('invoiceFooterText', e.target.value)}
                        className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        placeholder={t('translations.invoiceFooterPlaceholder')}
                      />
                    </div>
                  </div>
                </div>

                {/* Offer Footer */}
                <div className="pt-6 border-t border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">{t('translations.offerFooterSection')}</h3>
                  <p className="mt-1 text-sm text-gray-500">{t('translations.offerFooterSectionHelp')}</p>

                  <div className="mt-4">
                    <label htmlFor="offerFooterText" className="block text-sm font-medium text-gray-700">
                      {t('translations.offerFooterText')}
                    </label>
                    <div className="mt-1">
                      <textarea
                        id="offerFooterText"
                        name="offerFooterText"
                        rows={3}
                        value={translations[activeLanguage].offerFooterText || ''}
                        onChange={(e) => handleInputChange('offerFooterText', e.target.value)}
                        className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        placeholder={t('translations.offerFooterPlaceholder')}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Save button */}
            <div className="pt-6 mt-6 border-t border-gray-200 flex justify-end">
              <button
                type="button"
                onClick={handleSave}
                disabled={isLoading}
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                {isLoading ? t('common.saving') : t('common.save')}
              </button>
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

    if (!user || !user.company) {
      return {
        redirect: {
          destination: '/dashboard/settings/company',
          permanent: false,
        },
      };
    }

    const companyId = user.company.id;

    // Get company translations
    const translations = await prisma.companyTranslation.findMany({
      where: { companyId },
    });

    return {
      props: {
        initialTranslations: JSON.parse(JSON.stringify(translations)),
      },
    };
  } catch (error) {
    console.error('Error fetching company translations:', error);
    return {
      props: {
        initialTranslations: [],
      },
    };
  }
};