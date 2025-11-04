/**
 * Utility functions for document status handling
 */

import { DocumentStatus } from '@prisma/client';
import type { BadgeProps } from '@/types';

/**
 * Get the appropriate badge variant for a document status
 */
export function getStatusBadgeVariant(status: DocumentStatus): BadgeProps['variant'] {
  const statusMap: Record<DocumentStatus, BadgeProps['variant']> = {
    DRAFT: 'gray',
    SENT: 'blue',
    ACCEPTED: 'green',
    DECLINED: 'red',
    EXPIRED: 'yellow',
    PAID: 'green',
    PARTIALLY_PAID: 'yellow',
    OVERDUE: 'red',
    VOIDED: 'gray',
  };

  return statusMap[status] || 'gray';
}

/**
 * Get the color classes for a status badge (legacy support)
 */
export function getStatusColor(status: DocumentStatus): string {
  const colorMap: Record<DocumentStatus, string> = {
    DRAFT: 'bg-gray-100 text-gray-800',
    SENT: 'bg-blue-100 text-blue-800',
    ACCEPTED: 'bg-green-100 text-green-800',
    DECLINED: 'bg-red-100 text-red-800',
    EXPIRED: 'bg-yellow-100 text-yellow-800',
    PAID: 'bg-green-100 text-green-800',
    PARTIALLY_PAID: 'bg-yellow-100 text-yellow-800',
    OVERDUE: 'bg-red-100 text-red-800',
    VOIDED: 'bg-gray-100 text-gray-800',
  };

  return colorMap[status] || 'bg-gray-100 text-gray-800';
}

/**
 * Check if a status is final (cannot be changed)
 */
export function isFinalStatus(status: DocumentStatus): boolean {
  return ['PAID', 'VOIDED', 'DECLINED'].includes(status);
}

/**
 * Check if a status allows editing
 */
export function canEditDocument(status: DocumentStatus): boolean {
  return status === 'DRAFT';
}

/**
 * Get available status transitions for a document
 */
export function getAvailableStatusTransitions(
  currentStatus: DocumentStatus,
  documentType: 'OFFER' | 'INVOICE'
): DocumentStatus[] {
  if (documentType === 'OFFER') {
    switch (currentStatus) {
      case 'DRAFT':
        return ['SENT', 'VOIDED'];
      case 'SENT':
        return ['ACCEPTED', 'DECLINED', 'EXPIRED', 'VOIDED'];
      case 'ACCEPTED':
        return ['VOIDED'];
      default:
        return [];
    }
  } else {
    // INVOICE
    switch (currentStatus) {
      case 'DRAFT':
        return ['SENT', 'VOIDED'];
      case 'SENT':
        return ['PAID', 'PARTIALLY_PAID', 'OVERDUE', 'VOIDED'];
      case 'PARTIALLY_PAID':
        return ['PAID', 'OVERDUE', 'VOIDED'];
      case 'OVERDUE':
        return ['PAID', 'PARTIALLY_PAID', 'VOIDED'];
      default:
        return [];
    }
  }
}
