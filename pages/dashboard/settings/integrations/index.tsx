import { useState, useEffect } from 'react';
import { GetServerSideProps } from 'next';
import { getSession } from 'next-auth/react';
import Head from 'next/head';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { t } from '@/lib/translations';
import { fetchIntegrationSettings, updateIntegrationSettings, testIntegration } from '@/lib/api/integrations';
import { prisma } from '@/lib/prisma';

export default function IntegrationSettings() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isTesting, setIsTesting] = useState<Record<string, boolean>>({
    resend: false,
    'google-drive': false,
    gemini: false,
  });
  const [testResults, setTestResults] = useState<Record<string, { success: boolean; message: string; details?: any }>>({});
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Fetch initial settings
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const data = await fetchIntegrationSettings();
        setSettings(data);
      } catch (error) {
        console.error('Error loading integration settings:', error);
        setErrorMessage(t('integrations.loadError'));
      }
    };

    loadSettings();
  }, []);

  // Handle input change
  const handleInputChange = (key: string, value: string) => {
    setSettings(prev => ({
      ...prev,
      [key]: value,
    }));

    // Clear messages when user starts editing
    setSuccessMessage('');
    setErrorMessage('');
  };

  // Handle toggle change for enabled/disabled switches
  const handleToggleChange = (key: string) => {
    const currentValue = settings[key] === 'true';
    
    setSettings(prev => ({
      ...prev,
      [key]: (!currentValue).toString(),
    }));

    // Clear messages when user starts editing
    setSuccessMessage('');
    setErrorMessage('');
  };

  // Save settings
  const handleSave = async () => {
    setIsLoading(true);
    setSuccessMessage('');
    setErrorMessage('');

    try {
      await updateIntegrationSettings(settings);
      setSuccessMessage(t('integrations.saveSuccess'));
      
      // Scroll to top to show success message
      window.scrollTo(0, 0);
    } catch (error) {
      console.error('Error saving integration settings:', error);
      setErrorMessage(t('integrations.saveError'));
    } finally {
      setIsLoading(false);
    }
  };

  // Test integration
  const handleTestIntegration = async (integration: 'resend' | 'google-drive' | 'gemini') => {
    setIsTesting({
      ...isTesting,
      [integration]: true,
    });

    try {
      const result = await testIntegration(integration);
      
      setTestResults({
        ...testResults,
        [integration]: result,
      });
    } catch (error) {
      console.error(`Error testing ${integration} integration:`, error);
      
      setTestResults({
        ...testResults,
        [integration]: {
          success: false,
          message: error instanceof Error ? error.message : t('integrations.testError'),
        },
      });
    } finally {
      setIsTesting({
        ...isTesting,
        [integration]: false,
      });
    }
  };

  return (
    <>
      <Head>
        <title>{t('integrations.title')} | Curiosity Invoicing</title>
      </Head>

      <DashboardLayout>
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">{t('integrations.title')}</h1>
          <p className="mt-1 text-sm text-gray-500">
            {t('integrations.description')}
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
            {/* Google Drive Integration */}
            <div className="mb-8">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">{t('integrations.googleDrive.title')}</h3>
                  <p className="mt-1 text-sm text-gray-500">{t('integrations.googleDrive.description')}</p>
                </div>
                <div className="flex items-center">
                  <button
                    type="button"
                    onClick={() => handleToggleChange('google-drive.enabled')}
                    className={`
                      relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer 
                      transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500
                      ${settings['google-drive.enabled'] === 'true' ? 'bg-primary-600' : 'bg-gray-200'}
                    `}
                    aria-pressed={settings['google-drive.enabled'] === 'true'}
                  >
                    <span className="sr-only">{t('integrations.enable')}</span>
                    <span
                      className={`
                        pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 
                        transition ease-in-out duration-200
                        ${settings['google-drive.enabled'] === 'true' ? 'translate-x-5' : 'translate-x-0'}
                      `}
                    />
                  </button>
                </div>
              </div>

              {settings['google-drive.enabled'] === 'true' && (
                <div className="mt-4 grid grid-cols-1 gap-y-6 sm:grid-cols-6 gap-x-4">
                  <div className="sm:col-span-6">
                    <label htmlFor="google-drive.baseFolderName" className="block text-sm font-medium text-gray-700">
                      {t('integrations.googleDrive.baseFolderName')}
                    </label>
                    <div className="mt-1">
                      <input
                        type="text"
                        id="google-drive.baseFolderName"
                        name="google-drive.baseFolderName"
                        value={settings['google-drive.baseFolderName'] || 'Curiosity_Invoicing'}
                        onChange={(e) => handleInputChange('google-drive.baseFolderName', e.target.value)}
                        className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      />
                    </div>
                    <p className="mt-1 text-sm text-gray-500">{t('integrations.googleDrive.baseFolderNameHelp')}</p>
                  </div>

                  <div className="sm:col-span-6">
                    <div className="flex items-center">
                      <input
                        id="google-drive.useTemplateLanguageFolders"
                        name="google-drive.useTemplateLanguageFolders"
                        type="checkbox"
                        checked={settings['google-drive.useTemplateLanguageFolders'] === 'true'}
                        onChange={() => handleInputChange(
                          'google-drive.useTemplateLanguageFolders',
                          settings['google-drive.useTemplateLanguageFolders'] !== 'true' ? 'true' : 'false'
                        )}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      />
                      <label htmlFor="google-drive.useTemplateLanguageFolders" className="ml-2 block text-sm text-gray-700">
                        {t('integrations.googleDrive.useTemplateLanguageFolders')}
                      </label>
                    </div>
                    <p className="mt-1 text-sm text-gray-500">{t('integrations.googleDrive.useTemplateLanguageFoldersHelp')}</p>
                  </div>

                  <div className="sm:col-span-6">
                    <label htmlFor="google-drive.fileNamingPattern" className="block text-sm font-medium text-gray-700">
                      {t('integrations.googleDrive.fileNamingPattern')}
                    </label>
                    <div className="mt-1">
                      <input
                        type="text"
                        id="google-drive.fileNamingPattern"
                        name="google-drive.fileNamingPattern"
                        value={settings['google-drive.fileNamingPattern'] || '{type}_{number}_{date}'}
                        onChange={(e) => handleInputChange('google-drive.fileNamingPattern', e.target.value)}
                        className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      />
                    </div>
                    <p className="mt-1 text-sm text-gray-500">{t('integrations.googleDrive.fileNamingPatternHelp')}</p>
                  </div>

                  {/* Test connection button */}
                  <div className="sm:col-span-6">
                    <button
                      type="button"
                      onClick={() => handleTestIntegration('google-drive')}
                      disabled={isTesting['google-drive']}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                    >
                      {isTesting['google-drive'] ? t('integrations.testing') : t('integrations.testConnection')}
                    </button>

                    {testResults['google-drive'] && (
                      <div className={`mt-2 p-3 rounded-md ${testResults['google-drive'].success ? 'bg-green-50' : 'bg-red-50'}`}>
                        <p className={`text-sm ${testResults['google-drive'].success ? 'text-green-700' : 'text-red-700'}`}>
                          {testResults['google-drive'].message}
                        </p>
                        {testResults['google-drive'].details && (
                          <pre className="mt-1 text-xs overflow-auto max-h-32">
                            {JSON.stringify(testResults['google-drive'].details, null, 2)}
                          </pre>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Resend Integration */}
            <div className="pt-8 border-t border-gray-200 mb-8">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">{t('integrations.resend.title')}</h3>
                  <p className="mt-1 text-sm text-gray-500">{t('integrations.resend.description')}</p>
                </div>
                <div className="flex items-center">
                  <button
                    type="button"
                    onClick={() => handleToggleChange('resend.enabled')}
                    className={`
                      relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer 
                      transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500
                      ${settings['resend.enabled'] === 'true' ? 'bg-primary-600' : 'bg-gray-200'}
                    `}
                    aria-pressed={settings['resend.enabled'] === 'true'}
                  >
                    <span className="sr-only">{t('integrations.enable')}</span>
                    <span
                      className={`
                        pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 
                        transition ease-in-out duration-200
                        ${settings['resend.enabled'] === 'true' ? 'translate-x-5' : 'translate-x-0'}
                      `}
                    />
                  </button>
                </div>
              </div>

              {settings['resend.enabled'] === 'true' && (
                <div className="mt-4 grid grid-cols-1 gap-y-6 sm:grid-cols-6 gap-x-4">
                  <div className="sm:col-span-3">
                    <label htmlFor="resend.domain" className="block text-sm font-medium text-gray-700">
                      {t('integrations.resend.domain')}
                    </label>
                    <div className="mt-1">
                      <input
                        type="text"
                        id="resend.domain"
                        name="resend.domain"
                        value={settings['resend.domain'] || ''}
                        onChange={(e) => handleInputChange('resend.domain', e.target.value)}
                        className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        placeholder="yourdomain.com"
                      />
                    </div>
                    <p className="mt-1 text-sm text-gray-500">{t('integrations.resend.domainHelp')}</p>
                  </div>

                  <div className="sm:col-span-3">
                    <label htmlFor="resend.fromEmail" className="block text-sm font-medium text-gray-700">
                      {t('integrations.resend.fromEmail')}
                    </label>
                    <div className="mt-1">
                      <input
                        type="email"
                        id="resend.fromEmail"
                        name="resend.fromEmail"
                        value={settings['resend.fromEmail'] || ''}
                        onChange={(e) => handleInputChange('resend.fromEmail', e.target.value)}
                        className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        placeholder="invoicing@yourdomain.com"
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-6">
                    <label htmlFor="resend.fromName" className="block text-sm font-medium text-gray-700">
                      {t('integrations.resend.fromName')}
                    </label>
                    <div className="mt-1">
                      <input
                        type="text"
                        id="resend.fromName"
                        name="resend.fromName"
                        value={settings['resend.fromName'] || ''}
                        onChange={(e) => handleInputChange('resend.fromName', e.target.value)}
                        className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        placeholder="Your Company Name"
                      />
                    </div>
                  </div>

                  {/* Test connection button */}
                  <div className="sm:col-span-6">
                    <button
                      type="button"
                      onClick={() => handleTestIntegration('resend')}
                      disabled={isTesting.resend}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                    >
                      {isTesting.resend ? t('integrations.testing') : t('integrations.testConnection')}
                    </button>

                    {testResults.resend && (
                      <div className={`mt-2 p-3 rounded-md ${testResults.resend.success ? 'bg-green-50' : 'bg-red-50'}`}>
                        <p className={`text-sm ${testResults.resend.success ? 'text-green-700' : 'text-red-700'}`}>
                          {testResults.resend.message}
                        </p>
                        {testResults.resend.details && (
                          <p className="mt-1 text-xs text-gray-700">
                            {testResults.resend.details}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Google Gemini Integration */}
            <div className="pt-8 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">{t('integrations.gemini.title')}</h3>
                  <p className="mt-1 text-sm text-gray-500">{t('integrations.gemini.description')}</p>
                </div>
                <div className="flex items-center">
                  <button
                    type="button"
                    onClick={() => handleToggleChange('gemini.enabled')}
                    className={`
                      relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer 
                      transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500
                      ${settings['gemini.enabled'] === 'true' ? 'bg-primary-600' : 'bg-gray-200'}
                    `}
                    aria-pressed={settings['gemini.enabled'] === 'true'}
                  >
                    <span className="sr-only">{t('integrations.enable')}</span>
                    <span
                      className={`
                        pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 
                        transition ease-in-out duration-200
                        ${settings['gemini.enabled'] === 'true' ? 'translate-x-5' : 'translate-x-0'}
                      `}
                    />
                  </button>
                </div>
              </div>

              {settings['gemini.enabled'] === 'true' && (
                <div className="mt-4 grid grid-cols-1 gap-y-6 sm:grid-cols-6 gap-x-4">
                  <div className="sm:col-span-3">
                    <label htmlFor="gemini.temperature" className="block text-sm font-medium text-gray-700">
                      {t('integrations.gemini.temperature')}
                    </label>
                    <div className="mt-1">
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="1"
                        id="gemini.temperature"
                        name="gemini.temperature"
                        value={settings['gemini.temperature'] || '0.7'}
                        onChange={(e) => handleInputChange('gemini.temperature', e.target.value)}
                        className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      />
                    </div>
                    <p className="mt-1 text-sm text-gray-500">{t('integrations.gemini.temperatureHelp')}</p>
                  </div>

                  <div className="sm:col-span-3">
                    <label htmlFor="gemini.maxTokens" className="block text-sm font-medium text-gray-700">
                      {t('integrations.gemini.maxTokens')}
                    </label>
                    <div className="mt-1">
                      <input
                        type="number"
                        min="1"
                        max="32768"
                        id="gemini.maxTokens"
                        name="gemini.maxTokens"
                        value={settings['gemini.maxTokens'] || '4096'}
                        onChange={(e) => handleInputChange('gemini.maxTokens', e.target.value)}
                        className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      />
                    </div>
                    <p className="mt-1 text-sm text-gray-500">{t('integrations.gemini.maxTokensHelp')}</p>
                  </div>

                  {/* Test connection button */}
                  <div className="sm:col-span-6">
                    <button
                      type="button"
                      onClick={() => handleTestIntegration('gemini')}
                      disabled={isTesting.gemini}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                    >
                      {isTesting.gemini ? t('integrations.testing') : t('integrations.testConnection')}
                    </button>

                    {testResults.gemini && (
                      <div className={`mt-2 p-3 rounded-md ${testResults.gemini.success ? 'bg-green-50' : 'bg-red-50'}`}>
                        <p className={`text-sm ${testResults.gemini.success ? 'text-green-700' : 'text-red-700'}`}>
                          {testResults.gemini.message}
                        </p>
                        {testResults.gemini.details && (
                          <p className="mt-1 text-xs text-gray-700">
                            {testResults.gemini.details.response}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Save button */}
            <div className="pt-8 mt-8 border-t border-gray-200 flex justify-end">
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

    return {
      props: {},
    };
  } catch (error) {
    console.error('Error checking user or company:', error);
    return {
      props: {},
    };
  }
};
