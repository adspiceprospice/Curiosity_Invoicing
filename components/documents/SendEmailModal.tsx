import { useState } from 'react';
import { Document as DocumentModel, Customer } from '@prisma/client';
import { t } from '@/lib/translations';
import { Modal, Button, Input, Textarea } from '@/components/ui';
import { isValidEmail } from '@/lib/utils';

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

    if (recipientEmail && !isValidEmail(recipientEmail)) {
      newErrors.recipientEmail = t('error.invalidEmail');
    }

    if (!recipientEmail && !document.customer.email) {
      newErrors.recipientEmail = t('error.noRecipientEmail');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
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

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={document.type === 'OFFER' ? t('offers.sendOffer') : t('invoices.sendInvoice')}
      description={document.type === 'OFFER' ? t('offers.sendOfferDescription') : t('invoices.sendInvoiceDescription')}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          type="email"
          label={t('email.recipient')}
          placeholder={document.customer.email || t('email.recipientPlaceholder')}
          value={recipientEmail}
          onChange={(e) => setRecipientEmail(e.target.value)}
          error={errors.recipientEmail}
          helperText={!document.customer.email && !recipientEmail ? t('email.noCustomerEmail') : undefined}
        />

        <Input
          type="text"
          label={t('email.subject')}
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          error={errors.subject}
          required
        />

        <Textarea
          label={t('email.body')}
          rows={8}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          error={errors.body}
          required
        />

        <div className="flex justify-end space-x-3 pt-4">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={isLoading}
          >
            {t('actions.cancel')}
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={isLoading}
            disabled={isLoading}
          >
            {t('actions.send')}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
