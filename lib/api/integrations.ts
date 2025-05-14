/**
 * API client for integration settings
 */

// Type for integration settings
export interface IntegrationSettings {
  'resend.enabled'?: string;
  'resend.domain'?: string;
  'resend.fromEmail'?: string;
  'resend.fromName'?: string;
  'google-drive.enabled'?: string;
  'google-drive.baseFolderName'?: string;
  'google-drive.useTemplateLanguageFolders'?: string;
  'google-drive.fileNamingPattern'?: string;
  'gemini.enabled'?: string;
  'gemini.temperature'?: string;
  'gemini.maxTokens'?: string;
  [key: string]: string | undefined;
}

/**
 * Fetch integration settings
 */
export async function fetchIntegrationSettings(): Promise<IntegrationSettings> {
  try {
    const response = await fetch('/api/settings/integrations');
    
    if (!response.ok) {
      throw new Error(`Error fetching integration settings: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching integration settings:', error);
    throw error;
  }
}

/**
 * Update integration settings
 */
export async function updateIntegrationSettings(settings: Partial<IntegrationSettings>): Promise<{ message: string }> {
  try {
    const response = await fetch('/api/settings/integrations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(settings),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Error updating integration settings');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error updating integration settings:', error);
    throw error;
  }
}

/**
 * Test an integration
 */
export async function testIntegration(integration: 'resend' | 'google-drive' | 'gemini'): Promise<{
  success: boolean;
  message: string;
  details?: any;
}> {
  try {
    const response = await fetch('/api/settings/integrations/test', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ integration }),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || `Error testing ${integration} integration`);
    }
    
    return data;
  } catch (error) {
    console.error(`Error testing ${integration} integration:`, error);
    throw error;
  }
}