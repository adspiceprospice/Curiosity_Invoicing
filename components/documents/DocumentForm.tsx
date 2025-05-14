import { useState, useEffect } from 'react';
import { Customer, Document as DocumentModel, DocumentType, LineItem, Template } from '@prisma/client';
import { t } from '@/lib/translations';
import LineItemsTable from './LineItemsTable';

interface DocumentFormProps {
  documentType: DocumentType;
  document?: DocumentModel & {
    lineItems: LineItem[];
  };
  customers: Customer[];
  templates: Template[];
  onSubmit: (data: Partial<DocumentModel> & { lineItems: Partial<LineItem>[] }) => void;
  isSubmitting: boolean;
}

export default function DocumentForm({
  documentType,
  document,
  customers,
  templates,
  onSubmit,
  isSubmitting,
}: DocumentFormProps) {
  const [formData, setFormData] = useState<Partial<DocumentModel>>({
    type: documentType,
    customerId: '',
    languageCode: 'en',
    templateId: '',
    issueDate: new Date().toISOString().split('T')[0],
    dueDate: documentType === 'INVOICE' ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] : undefined,
    validUntil: documentType === 'OFFER' ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] : undefined,
    notes: '',
    paymentTerms: '',
  });

  const [lineItems, setLineItems] = useState<Partial<LineItem>[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Initialize form with document data if editing
  useEffect(() => {
    if (document) {
      setFormData({
        ...document,
        issueDate: new Date(document.issueDate).toISOString().split('T')[0],
        dueDate: document.dueDate ? new Date(document.dueDate).toISOString().split('T')[0] : undefined,
        validUntil: document.validUntil ? new Date(document.validUntil).toISOString().split('T')[0] : undefined,
      });
      
      setLineItems(document.lineItems.map(item => ({
        ...item,
      })));
    }
  }, [document]);

  // Auto-select template based on language when language changes
  useEffect(() => {
    if (formData.languageCode && templates.length > 0) {
      const defaultTemplate = templates.find(t => 
        t.type === documentType && 
        t.languageCode === formData.languageCode && 
        t.isDefault
      );
      
      if (defaultTemplate && !formData.templateId) {
        setFormData(prev => ({
          ...prev,
          templateId: defaultTemplate.id,
        }));
      }
    }
  }, [formData.languageCode, templates, documentType, formData.templateId]);

  // Auto-select language based on customer's preferred language
  useEffect(() => {
    if (formData.customerId && customers.length > 0) {
      const selectedCustomer = customers.find(c => c.id === formData.customerId);
      
      if (selectedCustomer?.preferredLanguage) {
        setFormData(prev => ({
          ...prev,
          languageCode: selectedCustomer.preferredLanguage || 'en',
        }));
      }
    }
  }, [formData.customerId, customers]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));

    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const handleAddLineItem = () => {
    setLineItems(prev => [
      ...prev,
      {
        description: '',
        quantity: 1,
        unitPrice: 0,
        discount: 0,
        taxRate: 21, // Default VAT rate in the Netherlands
      },
    ]);
  };

  const handleUpdateLineItem = (index: number, data: Partial<LineItem>) => {
    setLineItems(prev => {
      const newItems = [...prev];
      newItems[index] = {
        ...newItems[index],
        ...data,
      };
      return newItems;
    });
  };

  const handleRemoveLineItem = (index: number) => {
    setLineItems(prev => prev.filter((_, i) => i !== index));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.customerId) {
      newErrors.customerId = t('error.required');
    }

    if (!formData.templateId) {
      newErrors.templateId = t('error.required');
    }

    if (!formData.issueDate) {
      newErrors.issueDate = t('error.required');
    }

    if (documentType === 'INVOICE' && !formData.dueDate) {
      newErrors.dueDate = t('error.required');
    }

    if (documentType === 'OFFER' && !formData.validUntil) {
      newErrors.validUntil = t('error.required');
    }

    if (lineItems.length === 0) {
      newErrors.lineItems = t('error.noLineItems');
    }

    // Validate each line item
    const lineItemErrors = lineItems.some(item => 
      !item.description || 
      !item.quantity || 
      item.quantity <= 0 || 
      !item.unitPrice || 
      item.unitPrice < 0
    );

    if (lineItemErrors) {
      newErrors.lineItems = t('error.invalidLineItems');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (validateForm()) {
      onSubmit({
        ...formData,
        lineItems,
      });
    }
  };

  // Filter templates by document type and language
  const filteredTemplates = templates.filter(template => 
    template.type === documentType && 
    template.languageCode === formData.languageCode
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6">
        <div className="md:grid md:grid-cols-3 md:gap-6">
          <div className="md:col-span-1">
            <h3 className="text-lg font-medium leading-6 text-gray-900">
              {documentType === 'OFFER' ? t('offers.details') : t('invoices.details')}
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {documentType === 'OFFER' ? t('offers.formDescription') : t('invoices.formDescription')}
            </p>
          </div>
          <div className="mt-5 md:mt-0 md:col-span-2">
            <div className="grid grid-cols-6 gap-6">
              <div className="col-span-6 sm:col-span-3">
                <label htmlFor="customerId" className="block text-sm font-medium text-gray-700">
                  {t('document.customer')} *
                </label>
                <select
                  id="customerId"
                  name="customerId"
                  value={formData.customerId}
                  onChange={handleChange}
                  className={`mt-1 block w-full py-2 px-3 border ${
                    errors.customerId ? 'border-red-300' : 'border-gray-300'
                  } bg-white rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm`}
                >
                  <option value="">{t('document.selectCustomer')}</option>
                  {customers.map(customer => (
                    <option key={customer.id} value={customer.id}>
                      {customer.companyName}
                    </option>
                  ))}
                </select>
                {errors.customerId && (
                  <p className="mt-2 text-sm text-red-600">{errors.customerId}</p>
                )}
              </div>

              <div className="col-span-6 sm:col-span-3">
                <label htmlFor="languageCode" className="block text-sm font-medium text-gray-700">
                  {t('document.language')} *
                </label>
                <select
                  id="languageCode"
                  name="languageCode"
                  value={formData.languageCode}
                  onChange={handleChange}
                  className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                >
                  <option value="en">English</option>
                  <option value="nl">Nederlands</option>
                </select>
              </div>

              <div className="col-span-6 sm:col-span-3">
                <label htmlFor="templateId" className="block text-sm font-medium text-gray-700">
                  {t('document.template')} *
                </label>
                <select
                  id="templateId"
                  name="templateId"
                  value={formData.templateId}
                  onChange={handleChange}
                  className={`mt-1 block w-full py-2 px-3 border ${
                    errors.templateId ? 'border-red-300' : 'border-gray-300'
                  } bg-white rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm`}
                >
                  <option value="">{t('document.selectTemplate')}</option>
                  {filteredTemplates.map(template => (
                    <option key={template.id} value={template.id}>
                      {template.name}
                      {template.isDefault && ` (${t('templates.default')})`}
                    </option>
                  ))}
                </select>
                {errors.templateId && (
                  <p className="mt-2 text-sm text-red-600">{errors.templateId}</p>
                )}
              </div>

              <div className="col-span-6 sm:col-span-3">
                <label htmlFor="issueDate" className="block text-sm font-medium text-gray-700">
                  {t('document.issueDate')} *
                </label>
                <input
                  type="date"
                  name="issueDate"
                  id="issueDate"
                  value={formData.issueDate}
                  onChange={handleChange}
                  className={`mt-1 block w-full py-2 px-3 border ${
                    errors.issueDate ? 'border-red-300' : 'border-gray-300'
                  } rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm`}
                />
                {errors.issueDate && (
                  <p className="mt-2 text-sm text-red-600">{errors.issueDate}</p>
                )}
              </div>

              {documentType === 'INVOICE' && (
                <div className="col-span-6 sm:col-span-3">
                  <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700">
                    {t('document.dueDate')} *
                  </label>
                  <input
                    type="date"
                    name="dueDate"
                    id="dueDate"
                    value={formData.dueDate}
                    onChange={handleChange}
                    className={`mt-1 block w-full py-2 px-3 border ${
                      errors.dueDate ? 'border-red-300' : 'border-gray-300'
                    } rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm`}
                  />
                  {errors.dueDate && (
                    <p className="mt-2 text-sm text-red-600">{errors.dueDate}</p>
                  )}
                </div>
              )}

              {documentType === 'OFFER' && (
                <div className="col-span-6 sm:col-span-3">
                  <label htmlFor="validUntil" className="block text-sm font-medium text-gray-700">
                    {t('document.validUntil')} *
                  </label>
                  <input
                    type="date"
                    name="validUntil"
                    id="validUntil"
                    value={formData.validUntil}
                    onChange={handleChange}
                    className={`mt-1 block w-full py-2 px-3 border ${
                      errors.validUntil ? 'border-red-300' : 'border-gray-300'
                    } rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm`}
                  />
                  {errors.validUntil && (
                    <p className="mt-2 text-sm text-red-600">{errors.validUntil}</p>
                  )}
                </div>
              )}

              <div className="col-span-6">
                <label htmlFor="paymentTerms" className="block text-sm font-medium text-gray-700">
                  {t('document.paymentTerms')}
                </label>
                <input
                  type="text"
                  name="paymentTerms"
                  id="paymentTerms"
                  value={formData.paymentTerms}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                />
              </div>

              <div className="col-span-6">
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                  {t('document.notes')}
                </label>
                <textarea
                  id="notes"
                  name="notes"
                  rows={3}
                  value={formData.notes}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">{t('document.lineItems')}</h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            {t('document.lineItemsDescription')}
          </p>
        </div>
        <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
          <LineItemsTable
            lineItems={lineItems as LineItem[]}
            onAddItem={handleAddLineItem}
            onUpdateItem={handleUpdateLineItem}
            onRemoveItem={handleRemoveLineItem}
          />
        </div>
        {errors.lineItems && (
          <p className="mt-2 px-6 pb-4 text-sm text-red-600">{errors.lineItems}</p>
        )}
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => window.history.back()}
          className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          {t('actions.cancel')}
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
        >
          {isSubmitting ? t('actions.saving') : t('actions.save')}
        </button>
      </div>
    </form>
  );
}