import { useState } from 'react';
import { Document as DocumentModel, Customer } from '@prisma/client';
import { t } from '@/lib/translations';

interface SendEmailModalProps {
  document: DocumentModel & {
    customer: Customer;
  };
  isOpen: boolean;
  onClose: () => void;
  onSend: (data: { subject: string; body: string; recipientEmail?: string }) => void;
  isLoading: boolean;
}

export default function SendEmailModal({
  document,
  isOpen,
  onClose,
  onSend,
  isLoading,
}: SendEmailModalProps) {
  const [subject, setSubject] = useState(`${document.type === 'OFFER' ? t('offers.emailSubject') : t('invoices.emailSubject')} ${document.documentNumber}`);
  const [body, setBody] = useState(getDefaultEmailBody(document));
  const [recipientEmail, setRecipientEmail] = useState(document.customer.email || '');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Generate default email body based on document type and language
  function getDefaultEmailBody(document: DocumentModel & { customer: Customer }): string {
    const greeting = document.languageCode === 'nl' ? 'Geachte' : 'Dear';
    const contactName = document.customer.contactPerson || document.customer.companyName;
    
    let emailBody = '';
    
    if (document.type === 'OFFER') {
      if (document.languageCode === 'nl') {
        emailBody = `${greeting} ${contactName},\n\nHierbij sturen wij u onze offerte ${document.documentNumber}. U vindt de offerte als bijlage in deze e-mail.\n\nAls u vragen heeft over deze offerte, neem dan gerust contact met ons op.\n\nMet vriendelijke groet,\n[Uw naam]\n[Uw bedrijf]`;
      } else {
        emailBody = `${greeting} ${contactName},\n\nPlease find attached our offer ${document.documentNumber}. You will find the offer as an attachment to this email.\n\nIf you have any questions about this offer, please don't hesitate to contact us.\n\nBest regards,\n[Your name]\n[Your company]`;
      }
    } else {
      if (document.languageCode === 'nl') {
        emailBody = `${greeting} ${contactName},\n\nHierbij sturen wij u onze factuur ${document.documentNumber}. U vindt de factuur als bijlage in deze e-mail.\n\nAls u vragen heeft over deze factuur, neem dan gerust contact met ons op.\n\nMet vriendelijke groet,\n[Uw naam]\n[Uw bedrijf]`;
      } else {
        emailBody = `${greeting} ${contactName},\n\nPlease find attached our invoice ${document.documentNumber}. You will find the invoice as an attachment to this email.\n\nIf you have any questions about this invoice, please don't hesitate to contact us.\n\nBest regards,\n[Your name]\n[Your company]`;
      }
    }
    
    return emailBody;
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!subject.trim()) {
      newErrors.subject = t('error.required');
    }

    if (!body.trim()) {
      newErrors.body = t('error.required');
    }

    if (recipientEmail && !validateEmail(recipientEmail)) {
      newErrors.recipientEmail = t('error.invalidEmail');
    }

    if (!recipientEmail && !document.customer.email) {
      newErrors.recipientEmail = t('error.noRecipientEmail');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateEmail = (email: string) => {
    const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return re.test(email);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (validateForm()) {
      onSend({
        subject,
        body,
        recipientEmail: recipientEmail || undefined,
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-10 overflow-y-auto">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
        </div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
          <div className="sm:flex sm:items-start">
            <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                {document.type === 'OFFER' ? t('offers.sendOffer') : t('invoices.sendInvoice')}
              </h3>
              <div className="mt-2">
                <p className="text-sm text-gray-500">
                  {document.type === 'OFFER' ? t('offers.sendOfferDescription') : t('invoices.sendInvoiceDescription')}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                <div>
                  <label htmlFor="recipient" className="block text-sm font-medium text-gray-700">
                    {t('email.recipient')}
                  </label>
                  <input
                    type="email"
                    name="recipient"
                    id="recipient"
                    className={`mt-1 block w-full border ${
                      errors.recipientEmail ? 'border-red-300' : 'border-gray-300'
                    } rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm`}
                    placeholder={document.customer.email || t('email.recipientPlaceholder')}
                    value={recipientEmail}
                    onChange={(e) => setRecipientEmail(e.target.value)}
                  />
                  {!document.customer.email && !recipientEmail && (
                    <p className="mt-1 text-xs text-gray-500">
                      {t('email.noCustomerEmail')}
                    </p>
                  )}
                  {errors.recipientEmail && (
                    <p className="mt-2 text-sm text-red-600">{errors.recipientEmail}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-gray-700">
                    {t('email.subject')} *
                  </label>
                  <input
                    type="text"
                    name="subject"
                    id="subject"
                    className={`mt-1 block w-full border ${
                      errors.subject ? 'border-red-300' : 'border-gray-300'
                    } rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm`}
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                  />
                  {errors.subject && (
                    <p className="mt-2 text-sm text-red-600">{errors.subject}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="body" className="block text-sm font-medium text-gray-700">
                    {t('email.body')} *
                  </label>
                  <textarea
                    name="body"
                    id="body"
                    rows={8}
                    className={`mt-1 block w-full border ${
                      errors.body ? 'border-red-300' : 'border-gray-300'
                    } rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm`}
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                  />
                  {errors.body && (
                    <p className="mt-2 text-sm text-red-600">{errors.body}</p>
                  )}
                </div>

                <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                  >
                    {isLoading ? t('actions.sending') : t('actions.send')}
                  </button>
                  <button
                    type="button"
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:w-auto sm:text-sm"
                    onClick={onClose}
                    disabled={isLoading}
                  >
                    {t('actions.cancel')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}