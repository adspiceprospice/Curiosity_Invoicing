import { LineItem } from '@prisma/client';
import { t } from '@/lib/translations';

interface LineItemsTableProps {
  lineItems: LineItem[];
  readonly?: boolean;
  onAddItem?: () => void;
  onUpdateItem?: (index: number, item: Partial<LineItem>) => void;
  onRemoveItem?: (index: number) => void;
  showTotals?: boolean;
  currency?: string;
}

export default function LineItemsTable({
  lineItems,
  readonly = false,
  onAddItem,
  onUpdateItem,
  onRemoveItem,
  showTotals = true,
  currency = 'EUR'
}: LineItemsTableProps) {
  // Calculate subtotals and totals
  const calculateSubtotal = (item: LineItem) => {
    const quantity = parseFloat(item.quantity.toString());
    const unitPrice = parseFloat(item.unitPrice.toString());
    const discount = parseFloat(item.discount.toString()) / 100; // Convert percentage to decimal
    
    return quantity * unitPrice * (1 - discount);
  };

  const calculateTax = (item: LineItem) => {
    const subtotal = calculateSubtotal(item);
    const taxRate = parseFloat(item.taxRate.toString()) / 100; // Convert percentage to decimal
    
    return subtotal * taxRate;
  };

  const calculateTotal = (item: LineItem) => {
    const subtotal = calculateSubtotal(item);
    const tax = calculateTax(item);
    
    return subtotal + tax;
  };

  const totalBeforeTax = lineItems.reduce((acc, item) => acc + calculateSubtotal(item), 0);
  const totalTax = lineItems.reduce((acc, item) => acc + calculateTax(item), 0);
  const grandTotal = totalBeforeTax + totalTax;

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('nl-NL', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const handleChange = (index: number, field: keyof LineItem, value: string | number) => {
    if (!onUpdateItem) return;
    
    onUpdateItem(index, { [field]: value });
  };

  return (
    <div className="overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              {t('document.item.description')}
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              {t('document.item.quantity')}
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              {t('document.item.unitPrice')}
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              {t('document.item.discount')}
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              {t('document.item.tax')}
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              {t('document.total')}
            </th>
            {!readonly && (
              <th scope="col" className="relative px-6 py-3">
                <span className="sr-only">{t('actions.edit')}</span>
              </th>
            )}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {lineItems.map((item, index) => (
            <tr key={index}>
              <td className="px-6 py-4 whitespace-nowrap">
                {readonly ? (
                  <span className="text-sm text-gray-900">{item.description}</span>
                ) : (
                  <input
                    type="text"
                    className="block w-full text-sm border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                    value={item.description}
                    onChange={(e) => handleChange(index, 'description', e.target.value)}
                  />
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {readonly ? (
                  <span className="text-sm text-gray-900">{parseFloat(item.quantity.toString())}</span>
                ) : (
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className="block w-full text-sm border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                    value={parseFloat(item.quantity.toString())}
                    onChange={(e) => handleChange(index, 'quantity', parseFloat(e.target.value) || 0)}
                  />
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {readonly ? (
                  <span className="text-sm text-gray-900">{formatCurrency(parseFloat(item.unitPrice.toString()))}</span>
                ) : (
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className="block w-full text-sm border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                    value={parseFloat(item.unitPrice.toString())}
                    onChange={(e) => handleChange(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                  />
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {readonly ? (
                  <span className="text-sm text-gray-900">{parseFloat(item.discount.toString())}%</span>
                ) : (
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    className="block w-full text-sm border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                    value={parseFloat(item.discount.toString())}
                    onChange={(e) => handleChange(index, 'discount', parseFloat(e.target.value) || 0)}
                  />
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {readonly ? (
                  <span className="text-sm text-gray-900">{parseFloat(item.taxRate.toString())}%</span>
                ) : (
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    className="block w-full text-sm border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                    value={parseFloat(item.taxRate.toString())}
                    onChange={(e) => handleChange(index, 'taxRate', parseFloat(e.target.value) || 0)}
                  />
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className="text-sm text-gray-900 font-medium">
                  {formatCurrency(calculateTotal(item))}
                </span>
              </td>
              {!readonly && (
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    type="button"
                    className="text-red-600 hover:text-red-900"
                    onClick={() => onRemoveItem && onRemoveItem(index)}
                  >
                    {t('document.removeItem')}
                  </button>
                </td>
              )}
            </tr>
          ))}
          {lineItems.length === 0 && (
            <tr>
              <td colSpan={readonly ? 6 : 7} className="px-6 py-4 text-center text-sm text-gray-500">
                {t('document.noItems')}
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {!readonly && (
        <div className="mt-4 ml-6">
          <button
            type="button"
            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            onClick={onAddItem}
          >
            {t('document.addItem')}
          </button>
        </div>
      )}

      {showTotals && lineItems.length > 0 && (
        <div className="mt-6 border-t border-gray-200 pt-4">
          <div className="flex justify-end">
            <div className="w-64 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">{t('document.subtotal')}:</span>
                <span className="text-gray-900 font-medium">{formatCurrency(totalBeforeTax)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">{t('document.taxTotal')}:</span>
                <span className="text-gray-900 font-medium">{formatCurrency(totalTax)}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-gray-200 text-base">
                <span className="text-gray-900 font-medium">{t('document.total')}:</span>
                <span className="text-gray-900 font-semibold">{formatCurrency(grandTotal)}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}