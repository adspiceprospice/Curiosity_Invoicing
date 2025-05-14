import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Company } from '@prisma/client';
import { t } from '@/lib/translations';

interface CompanyProfileCardProps {
  company: Company | null;
  showEditButton?: boolean;
  className?: string;
}

export default function CompanyProfileCard({ company, showEditButton = true, className = '' }: CompanyProfileCardProps) {
  // If no company is provided, display placeholder with setup message
  if (!company) {
    return (
      <div className={`rounded-lg border border-gray-200 bg-white shadow-sm ${className}`}>
        <div className="p-6">
          <h3 className="text-lg font-medium text-gray-900">{t('company.noProfileTitle')}</h3>
          <p className="mt-1 text-sm text-gray-500">
            {t('company.noProfileDescription')}
          </p>
          <div className="mt-4">
            <Link
              href="/dashboard/settings/company"
              className="inline-flex items-center rounded-md border border-transparent bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
            >
              {t('company.setupProfile')}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Display company information
  return (
    <div className={`rounded-lg border border-gray-200 bg-white shadow-sm ${className}`}>
      <div className="p-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">{company.name}</h3>
          {showEditButton && (
            <Link
              href="/dashboard/settings/company"
              className="text-sm font-medium text-primary-600 hover:text-primary-500"
            >
              {t('common.edit')}
            </Link>
          )}
        </div>
        
        <div className="mt-4 space-y-4">
          {/* Address */}
          {(company.addressLine1 || company.city || company.country) && (
            <div>
              <h4 className="text-sm font-medium text-gray-500">{t('company.address')}</h4>
              <div className="mt-1 text-sm text-gray-900">
                {company.addressLine1 && <div>{company.addressLine1}</div>}
                {company.addressLine2 && <div>{company.addressLine2}</div>}
                {company.city && company.postalCode && (
                  <div>
                    {company.postalCode} {company.city}
                  </div>
                )}
                {company.country && <div>{company.country}</div>}
              </div>
            </div>
          )}

          {/* Contact Information */}
          {(company.email || company.phoneNumber || company.website) && (
            <div>
              <h4 className="text-sm font-medium text-gray-500">{t('company.contactInfo')}</h4>
              <div className="mt-1 text-sm text-gray-900">
                {company.email && (
                  <div>
                    <span className="font-medium">{t('company.email')}:</span> {company.email}
                  </div>
                )}
                {company.phoneNumber && (
                  <div>
                    <span className="font-medium">{t('company.phoneNumber')}:</span> {company.phoneNumber}
                  </div>
                )}
                {company.website && (
                  <div>
                    <span className="font-medium">{t('company.website')}:</span>{' '}
                    <a
                      href={company.website.startsWith('http') ? company.website : `https://${company.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary-600 hover:text-primary-500"
                    >
                      {company.website}
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Tax Information */}
          {company.vatId && (
            <div>
              <h4 className="text-sm font-medium text-gray-500">{t('company.taxInfo')}</h4>
              <div className="mt-1 text-sm text-gray-900">
                <div>
                  <span className="font-medium">{t('company.vatId')}:</span> {company.vatId}
                </div>
              </div>
            </div>
          )}

          {/* Banking Information */}
          {(company.bankAccountName || company.bankAccountNumber || company.bankAccountBIC) && (
            <div>
              <h4 className="text-sm font-medium text-gray-500">{t('company.bankInfo')}</h4>
              <div className="mt-1 text-sm text-gray-900">
                {company.bankAccountName && (
                  <div>
                    <span className="font-medium">{t('company.bankAccountName')}:</span> {company.bankAccountName}
                  </div>
                )}
                {company.bankAccountNumber && (
                  <div>
                    <span className="font-medium">{t('company.bankAccountNumber')}:</span> {company.bankAccountNumber}
                  </div>
                )}
                {company.bankAccountBIC && (
                  <div>
                    <span className="font-medium">{t('company.bankAccountBIC')}:</span> {company.bankAccountBIC}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Company Logo */}
          {company.logoUrl && (
            <div>
              <h4 className="text-sm font-medium text-gray-500">{t('company.logo')}</h4>
              <div className="mt-2">
                <img
                  src={company.logoUrl}
                  alt={`${company.name} logo`}
                  className="h-12 w-auto"
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
  );
}