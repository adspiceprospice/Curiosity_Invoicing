import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  PDFViewer,
  Image,
  Font,
} from '@react-pdf/renderer';
import { Customer, Document as DocumentModel, LineItem, Template } from '@prisma/client';

// Register custom fonts
Font.register({
  family: 'Roboto',
  fonts: [
    { src: 'https://fonts.gstatic.com/s/roboto/v27/KFOmCnqEu92Fr1Me5Q.ttf', fontWeight: 400 },
    { src: 'https://fonts.gstatic.com/s/roboto/v27/KFOlCnqEu92Fr1MmEU9vAw.ttf', fontWeight: 500 },
    { src: 'https://fonts.gstatic.com/s/roboto/v27/KFOlCnqEu92Fr1MmWUlvAw.ttf', fontWeight: 700 },
  ],
});

// Define styles
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 40,
    fontFamily: 'Roboto',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 40,
  },
  companyInfo: {
    width: '60%',
  },
  logo: {
    width: 150,
    marginBottom: 10,
  },
  companyName: {
    fontSize: 18,
    fontWeight: 700,
    marginBottom: 5,
  },
  companyDetails: {
    fontSize: 10,
    color: '#444444',
  },
  docInfo: {
    width: '35%',
    alignItems: 'flex-end',
  },
  docTitle: {
    fontSize: 24,
    fontWeight: 700,
    marginBottom: 10,
    color: '#0369a1', // primary-700
  },
  docNumber: {
    fontSize: 14,
    marginBottom: 5,
  },
  docDate: {
    fontSize: 12,
    marginBottom: 3,
    color: '#444444',
  },
  customerSection: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 500,
    marginBottom: 5,
    color: '#444444',
  },
  customerName: {
    fontSize: 14,
    fontWeight: 500,
    marginBottom: 5,
  },
  customerDetails: {
    fontSize: 10,
    color: '#444444',
  },
  items: {
    marginBottom: 30,
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
    paddingBottom: 5,
    marginBottom: 10,
    fontWeight: 500,
    fontSize: 11,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
    paddingBottom: 5,
    paddingTop: 5,
    fontSize: 10,
  },
  descCol: {
    width: '40%',
  },
  qtyCol: {
    width: '10%',
    textAlign: 'center',
  },
  priceCol: {
    width: '15%',
    textAlign: 'right',
  },
  taxCol: {
    width: '10%',
    textAlign: 'right',
  },
  discountCol: {
    width: '10%',
    textAlign: 'right',
  },
  totalCol: {
    width: '15%',
    textAlign: 'right',
  },
  summary: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 20,
  },
  summaryInfo: {
    width: '25%',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
    fontSize: 11,
  },
  summaryTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
    marginTop: 5,
    paddingTop: 5,
    fontSize: 12,
    fontWeight: 700,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
    paddingTop: 10,
    fontSize: 10,
    color: '#666666',
  },
  notes: {
    marginTop: 40,
    fontSize: 11,
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
    paddingTop: 10,
  },
  notesTitle: {
    fontSize: 12,
    fontWeight: 500,
    marginBottom: 5,
  },
  dueDate: {
    marginTop: 20,
    fontSize: 11,
    color: '#0369a1', // primary-700
    fontWeight: 500,
  },
});

interface DocumentPDFProps {
  document: DocumentModel & {
    customer: Customer;
    lineItems: LineItem[];
    template: Template;
  };
  company: {
    name: string;
    addressLine1?: string | null;
    addressLine2?: string | null;
    city?: string | null;
    postalCode?: string | null;
    country?: string | null;
    vatId?: string | null;
    email?: string | null;
    phoneNumber?: string | null;
    website?: string | null;
    bankAccountName?: string | null;
    bankAccountNumber?: string | null;
    bankAccountBIC?: string | null;
    logoUrl?: string | null;
  };
  translations: {
    documentTitle: string;
    issueDateLabel: string;
    dueDateLabel: string;
    validUntilLabel: string;
    customerLabel: string;
    descriptionLabel: string;
    quantityLabel: string;
    unitPriceLabel: string;
    taxLabel: string;
    discountLabel: string;
    totalLabel: string;
    subtotalLabel: string;
    taxTotalLabel: string;
    discountTotalLabel: string;
    grandTotalLabel: string;
    notesLabel: string;
    paymentInfoLabel: string;
    paymentTermsLabel: string;
  };
}

export function DocumentPDF({ document, company, translations }: DocumentPDFProps) {
  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('nl-NL', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  // Format date
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat(document.languageCode === 'nl' ? 'nl-NL' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(new Date(date));
  };

  // Calculate item total
  const calculateItemTotal = (item: LineItem) => {
    const quantity = parseFloat(item.quantity.toString());
    const unitPrice = parseFloat(item.unitPrice.toString());
    const discount = parseFloat(item.discount.toString());
    const taxRate = parseFloat(item.taxRate.toString());

    const priceAfterDiscount = unitPrice * (1 - discount / 100);
    const itemTotal = quantity * priceAfterDiscount;
    const tax = itemTotal * (taxRate / 100);

    return itemTotal + tax;
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.companyInfo}>
            {company.logoUrl && (
              <Image style={styles.logo} src={company.logoUrl} />
            )}
            <Text style={styles.companyName}>{company.name}</Text>
            <Text style={styles.companyDetails}>
              {company.addressLine1}
              {company.addressLine2 && `, ${company.addressLine2}`}
            </Text>
            <Text style={styles.companyDetails}>
              {company.postalCode} {company.city}, {company.country}
            </Text>
            {company.vatId && (
              <Text style={styles.companyDetails}>BTW/VAT: {company.vatId}</Text>
            )}
            <Text style={styles.companyDetails}>
              {company.email} | {company.phoneNumber}
              {company.website && ` | ${company.website}`}
            </Text>
          </View>

          <View style={styles.docInfo}>
            <Text style={styles.docTitle}>
              {document.type === 'INVOICE' ? translations.documentTitle : translations.documentTitle}
            </Text>
            <Text style={styles.docNumber}>{document.documentNumber}</Text>
            <Text style={styles.docDate}>
              {translations.issueDateLabel}: {formatDate(document.issueDate)}
            </Text>
            {document.type === 'INVOICE' && document.dueDate && (
              <Text style={styles.docDate}>
                {translations.dueDateLabel}: {formatDate(document.dueDate)}
              </Text>
            )}
            {document.type === 'OFFER' && document.validUntil && (
              <Text style={styles.docDate}>
                {translations.validUntilLabel}: {formatDate(document.validUntil)}
              </Text>
            )}
          </View>
        </View>

        {/* Customer Section */}
        <View style={styles.customerSection}>
          <Text style={styles.sectionTitle}>{translations.customerLabel}</Text>
          <Text style={styles.customerName}>{document.customer.companyName}</Text>
          {document.customer.contactPerson && (
            <Text style={styles.customerDetails}>{document.customer.contactPerson}</Text>
          )}
          {document.customer.billingAddress && (
            <Text style={styles.customerDetails}>{document.customer.billingAddress}</Text>
          )}
          {document.customer.email && document.customer.phoneNumber && (
            <Text style={styles.customerDetails}>
              {document.customer.email} | {document.customer.phoneNumber}
            </Text>
          )}
          {document.customer.vatId && (
            <Text style={styles.customerDetails}>BTW/VAT: {document.customer.vatId}</Text>
          )}
        </View>

        {/* Items */}
        <View style={styles.items}>
          <View style={styles.tableHeader}>
            <Text style={styles.descCol}>{translations.descriptionLabel}</Text>
            <Text style={styles.qtyCol}>{translations.quantityLabel}</Text>
            <Text style={styles.priceCol}>{translations.unitPriceLabel}</Text>
            <Text style={styles.discountCol}>{translations.discountLabel}</Text>
            <Text style={styles.taxCol}>{translations.taxLabel}</Text>
            <Text style={styles.totalCol}>{translations.totalLabel}</Text>
          </View>

          {document.lineItems.map((item, index) => {
            const quantity = parseFloat(item.quantity.toString());
            const unitPrice = parseFloat(item.unitPrice.toString());
            const discount = parseFloat(item.discount.toString());
            const taxRate = parseFloat(item.taxRate.toString());
            const itemTotal = calculateItemTotal(item);

            return (
              <View key={index} style={styles.tableRow}>
                <Text style={styles.descCol}>{item.description}</Text>
                <Text style={styles.qtyCol}>{quantity.toString()}</Text>
                <Text style={styles.priceCol}>{formatCurrency(unitPrice)}</Text>
                <Text style={styles.discountCol}>{discount ? `${discount}%` : '-'}</Text>
                <Text style={styles.taxCol}>{taxRate ? `${taxRate}%` : '-'}</Text>
                <Text style={styles.totalCol}>{formatCurrency(itemTotal)}</Text>
              </View>
            );
          })}
        </View>

        {/* Summary */}
        <View style={styles.summary}>
          <View style={styles.summaryInfo}>
            <View style={styles.summaryRow}>
              <Text>{translations.subtotalLabel}</Text>
              <Text>{formatCurrency(parseFloat(document.totalAmount.toString()) - parseFloat(document.totalTax.toString()))}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text>{translations.taxTotalLabel}</Text>
              <Text>{formatCurrency(parseFloat(document.totalTax.toString()))}</Text>
            </View>
            {parseFloat(document.totalDiscount.toString()) > 0 && (
              <View style={styles.summaryRow}>
                <Text>{translations.discountTotalLabel}</Text>
                <Text>-{formatCurrency(parseFloat(document.totalDiscount.toString()))}</Text>
              </View>
            )}
            <View style={styles.summaryTotal}>
              <Text>{translations.grandTotalLabel}</Text>
              <Text>{formatCurrency(parseFloat(document.totalAmount.toString()))}</Text>
            </View>
          </View>
        </View>

        {/* Notes */}
        {document.notes && (
          <View style={styles.notes}>
            <Text style={styles.notesTitle}>{translations.notesLabel}</Text>
            <Text>{document.notes}</Text>
          </View>
        )}

        {/* Due Date Reminder for Invoices */}
        {document.type === 'INVOICE' && document.dueDate && (
          <Text style={styles.dueDate}>
            {translations.dueDateLabel}: {formatDate(document.dueDate)}
          </Text>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text>{translations.paymentInfoLabel}</Text>
          <Text>
            {company.bankAccountName} | {company.bankAccountNumber}
            {company.bankAccountBIC && ` | BIC: ${company.bankAccountBIC}`}
          </Text>
          {document.paymentTerms && (
            <Text>
              {translations.paymentTermsLabel}: {document.paymentTerms}
            </Text>
          )}
        </View>
      </Page>
    </Document>
  );
}

interface PDFViewerWrapperProps {
  document: DocumentModel & {
    customer: Customer;
    lineItems: LineItem[];
    template: Template;
  };
  company: any;
  translations: any;
}

export function PDFViewerWrapper({ document, company, translations }: PDFViewerWrapperProps) {
  return (
    <PDFViewer style={{ width: '100%', height: '100%', minHeight: '80vh' }}>
      <DocumentPDF document={document} company={company} translations={translations} />
    </PDFViewer>
  );
}