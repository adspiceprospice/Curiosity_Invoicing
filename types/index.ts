/**
 * Shared TypeScript type definitions
 */

import { Customer, Document as DocumentModel, DocumentType, DocumentStatus, LineItem, Template } from '@prisma/client';

// Extended model types with relations
export type DocumentWithRelations = DocumentModel & {
  customer: Customer;
  lineItems: LineItem[];
  template?: Template;
};

export type CustomerWithCounts = Customer & {
  _count?: {
    documents?: number;
  };
};

// Form data types
export interface CustomerFormData {
  companyName: string;
  contactPerson?: string;
  email?: string;
  phoneNumber?: string;
  billingAddress?: string;
  shippingAddress?: string;
  vatId?: string;
  preferredLanguage?: string;
  notes?: string;
}

export interface DocumentFormData {
  type: DocumentType;
  customerId: string;
  languageCode: string;
  templateId: string;
  issueDate: string;
  dueDate?: string;
  validUntil?: string;
  notes?: string;
  paymentTerms?: string;
  lineItems: Partial<LineItem>[];
}

export interface LineItemFormData {
  description: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  taxRate: number;
}

// UI Component Props
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  options: { value: string; label: string }[];
}

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export interface BadgeProps {
  variant?: 'gray' | 'blue' | 'green' | 'red' | 'yellow' | 'primary';
  size?: 'sm' | 'md';
  children: React.ReactNode;
}

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

// Utility types
export type ValidationErrors = Record<string, string>;

export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface FilterParams {
  status?: DocumentStatus[];
  customerId?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

// Status types
export const DOCUMENT_STATUSES: Record<DocumentStatus, string> = {
  DRAFT: 'draft',
  SENT: 'sent',
  ACCEPTED: 'accepted',
  DECLINED: 'declined',
  EXPIRED: 'expired',
  PAID: 'paid',
  PARTIALLY_PAID: 'partiallyPaid',
  OVERDUE: 'overdue',
  VOIDED: 'voided',
};

// Translation keys (for type safety)
export type TranslationKey = string;
