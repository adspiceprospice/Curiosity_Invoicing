import { CompanyTranslation } from '@prisma/client';

/**
 * Fetch company translations
 */
export async function fetchCompanyTranslations(): Promise<CompanyTranslation[]> {
  try {
    const response = await fetch('/api/settings/company/translations');
    
    if (!response.ok) {
      throw new Error(`Error fetching company translations: ${response.statusText}`);
    }
    
    return response.json();
  } catch (error) {
    console.error('Error fetching company translations:', error);
    throw error;
  }
}

/**
 * Create or update company translation
 */
export async function createOrUpdateCompanyTranslation(
  translationData: Partial<CompanyTranslation> & { languageCode: string }
): Promise<CompanyTranslation> {
  try {
    const response = await fetch('/api/settings/company/translations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(translationData),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Error updating company translation');
    }
    
    return response.json();
  } catch (error) {
    console.error('Error updating company translation:', error);
    throw error;
  }
}