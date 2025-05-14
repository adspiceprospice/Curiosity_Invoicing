import { Company } from '@prisma/client';

/**
 * Fetch company profile
 */
export async function fetchCompanyProfile(): Promise<Company | null> {
  try {
    const response = await fetch('/api/settings/company');
    
    if (response.status === 404) {
      return null;
    }
    
    if (!response.ok) {
      throw new Error(`Error fetching company profile: ${response.statusText}`);
    }
    
    return response.json();
  } catch (error) {
    console.error('Error fetching company profile:', error);
    throw error;
  }
}

/**
 * Create or update company profile
 */
export async function createOrUpdateCompanyProfile(companyData: Partial<Company>): Promise<Company> {
  try {
    const response = await fetch('/api/settings/company', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(companyData),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Error updating company profile');
    }
    
    return response.json();
  } catch (error) {
    console.error('Error updating company profile:', error);
    throw error;
  }
}