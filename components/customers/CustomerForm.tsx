import { useState, useEffect } from 'react';
import { Customer } from '@prisma/client';
import { t } from '@/lib/translations';

interface CustomerFormProps {
  customer?: Customer;
  onSubmit: (data: Partial<Customer>) => void;
  isSubmitting: boolean;
}

export default function CustomerForm({ customer, onSubmit, isSubmitting }: CustomerFormProps) {
  const [formData, setFormData] = useState<Partial<Customer>>({
    companyName: '',
    contactPerson: '',
    email: '',
    phoneNumber: '',
    billingAddress: '',
    shippingAddress: '',
    vatId: '',
    preferredLanguage: '',
    notes: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Initialize form with customer data if editing
  useEffect(() => {
    if (customer) {
      setFormData({
        companyName: customer.companyName || '',
        contactPerson: customer.contactPerson || '',
        email: customer.email || '',
        phoneNumber: customer.phoneNumber || '',
        billingAddress: customer.billingAddress || '',
        shippingAddress: customer.shippingAddress || '',
        vatId: customer.vatId || '',
        preferredLanguage: customer.preferredLanguage || '',
        notes: customer.notes || '',
      });
    }
  }, [customer]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.companyName) {
      newErrors.companyName = t('error.required');
    }

    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = t('error.invalidEmail');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (validateForm()) {
      onSubmit(formData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6">
        <div className="md:grid md:grid-cols-3 md:gap-6">
          <div className="md:col-span-1">
            <h3 className="text-lg font-medium leading-6 text-gray-900">{t('customers.information')}</h3>
            <p className="mt-1 text-sm text-gray-500">
              {t('customers.formDescription')}
            </p>
          </div>
          <div className="mt-5 md:mt-0 md:col-span-2">
            <div className="grid grid-cols-6 gap-6">
              <div className="col-span-6 sm:col-span-4">
                <label htmlFor="companyName" className="block text-sm font-medium text-gray-700">
                  {t('customers.name')} *
                </label>
                <input
                  type="text"
                  name="companyName"
                  id="companyName"
                  value={formData.companyName}
                  onChange={handleChange}
                  className={`mt-1 block w-full shadow-sm sm:text-sm rounded-md ${
                    errors.companyName
                      ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                      : 'border-gray-300 focus:ring-primary-500 focus:border-primary-500'
                  }`}
                />
                {errors.companyName && (
                  <p className="mt-2 text-sm text-red-600">{errors.companyName}</p>
                )}
              </div>

              <div className="col-span-6 sm:col-span-4">
                <label htmlFor="contactPerson" className="block text-sm font-medium text-gray-700">
                  {t('customers.contactPerson')}
                </label>
                <input
                  type="text"
                  name="contactPerson"
                  id="contactPerson"
                  value={formData.contactPerson}
                  onChange={handleChange}
                  className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              <div className="col-span-6 sm:col-span-4">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  {t('customers.email')}
                </label>
                <input
                  type="email"
                  name="email"
                  id="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`mt-1 block w-full shadow-sm sm:text-sm rounded-md ${
                    errors.email
                      ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                      : 'border-gray-300 focus:ring-primary-500 focus:border-primary-500'
                  }`}
                />
                {errors.email && (
                  <p className="mt-2 text-sm text-red-600">{errors.email}</p>
                )}
              </div>

              <div className="col-span-6 sm:col-span-4">
                <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700">
                  {t('customers.phone')}
                </label>
                <input
                  type="text"
                  name="phoneNumber"
                  id="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              <div className="col-span-6">
                <label htmlFor="billingAddress" className="block text-sm font-medium text-gray-700">
                  {t('customers.address')}
                </label>
                <textarea
                  name="billingAddress"
                  id="billingAddress"
                  rows={3}
                  value={formData.billingAddress}
                  onChange={handleChange}
                  className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              <div className="col-span-6 sm:col-span-4">
                <label htmlFor="vatId" className="block text-sm font-medium text-gray-700">
                  {t('customers.vatId')}
                </label>
                <input
                  type="text"
                  name="vatId"
                  id="vatId"
                  value={formData.vatId}
                  onChange={handleChange}
                  className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              <div className="col-span-6 sm:col-span-3">
                <label htmlFor="preferredLanguage" className="block text-sm font-medium text-gray-700">
                  {t('customers.preferredLanguage')}
                </label>
                <select
                  id="preferredLanguage"
                  name="preferredLanguage"
                  value={formData.preferredLanguage}
                  onChange={handleChange}
                  className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                >
                  <option value="">{t('customers.selectLanguage')}</option>
                  <option value="en">English</option>
                  <option value="nl">Nederlands</option>
                </select>
              </div>

              <div className="col-span-6">
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                  {t('customers.notes')}
                </label>
                <textarea
                  id="notes"
                  name="notes"
                  rows={3}
                  value={formData.notes}
                  onChange={handleChange}
                  className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>
          </div>
        </div>
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