import { Template, DocumentType } from '@prisma/client';

interface TemplateFilters {
  search?: string;
  type?: DocumentType | string;
  languageCode?: string;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
}

/**
 * Fetch templates with optional filtering
 */
export async function fetchTemplates(filters: TemplateFilters = {}): Promise<Template[]> {
  const queryParams = new URLSearchParams();
  
  if (filters.search) queryParams.append('search', filters.search);
  if (filters.type) queryParams.append('type', filters.type);
  if (filters.languageCode) queryParams.append('languageCode', filters.languageCode);
  if (filters.sortBy) queryParams.append('sortBy', filters.sortBy);
  if (filters.sortDirection) queryParams.append('sortDirection', filters.sortDirection);
  
  const queryString = queryParams.toString();
  const url = `/api/templates${queryString ? `?${queryString}` : ''}`;
  
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`Error fetching templates: ${response.statusText}`);
  }
  
  return response.json();
}

/**
 * Fetch a single template by ID
 */
export async function fetchTemplate(id: string): Promise<Template> {
  const response = await fetch(`/api/templates/${id}`);
  
  if (!response.ok) {
    throw new Error(`Error fetching template: ${response.statusText}`);
  }
  
  return response.json();
}

/**
 * Create a new template
 */
export async function createTemplate(templateData: Partial<Template>): Promise<Template> {
  const response = await fetch('/api/templates', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(templateData),
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Error creating template');
  }
  
  return response.json();
}

/**
 * Update an existing template
 */
export async function updateTemplate(id: string, templateData: Partial<Template>): Promise<Template> {
  const response = await fetch(`/api/templates/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(templateData),
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Error updating template');
  }
  
  return response.json();
}

/**
 * Delete a template
 */
export async function deleteTemplate(id: string): Promise<void> {
  const response = await fetch(`/api/templates/${id}`, {
    method: 'DELETE',
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Error deleting template');
  }
}

/**
 * Duplicate a template
 */
export async function duplicateTemplate(id: string, name?: string): Promise<{ message: string; template: Template }> {
  const response = await fetch(`/api/templates/${id}/duplicate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name }),
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Error duplicating template');
  }
  
  return response.json();
}

/**
 * Set a template as the default for its type and language
 */
export async function setDefaultTemplate(id: string): Promise<{ message: string; template: Template }> {
  const response = await fetch(`/api/templates/${id}/set-default`, {
    method: 'POST',
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Error setting template as default');
  }
  
  return response.json();
}

/**
 * Generate a preview for a template
 */
export async function previewTemplate(id: string): Promise<{ message: string; previewPdf: string }> {
  const response = await fetch(`/api/templates/${id}/preview`, {
    method: 'POST',
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Error generating template preview');
  }
  
  return response.json();
}