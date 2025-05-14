import { DocumentType } from '@prisma/client';

// Helper function to get default template content based on type and language
export function getDefaultTemplateContent(type: DocumentType, language: string): string {
  // This is a simplified example - in a real application, you'd have more complex templates
  // with placeholders for company details, customer info, etc.
  const defaultContent = {
    OFFER: {
      en: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Offer</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 0;
      padding: 20px;
      color: #333;
    }
    .header {
      margin-bottom: 30px;
    }
    .company-name {
      font-size: 24px;
      font-weight: bold;
      color: #2563eb;
    }
    .document-title {
      font-size: 28px;
      font-weight: bold;
      margin: 20px 0;
      color: #1f2937;
    }
    .section {
      margin-bottom: 20px;
    }
    .section-title {
      font-size: 18px;
      font-weight: bold;
      margin-bottom: 10px;
      color: #4b5563;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
    }
    th {
      background-color: #f3f4f6;
      padding: 10px;
      text-align: left;
      font-weight: bold;
      border-bottom: 1px solid #d1d5db;
    }
    td {
      padding: 10px;
      border-bottom: 1px solid #e5e7eb;
    }
    .totals {
      margin-top: 20px;
      text-align: right;
    }
    .total-row {
      margin-bottom: 5px;
    }
    .grand-total {
      font-weight: bold;
      font-size: 18px;
      margin-top: 10px;
    }
    .footer {
      margin-top: 50px;
      font-size: 12px;
      color: #6b7280;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="company-name">{{company.name}}</div>
    <div>{{company.addressLine1}}</div>
    <div>{{company.addressLine2}}</div>
    <div>{{company.postalCode}} {{company.city}}</div>
    <div>{{company.country}}</div>
    <div>VAT: {{company.vatId}}</div>
  </div>

  <div class="customer-info">
    <div class="section-title">Bill To:</div>
    <div>{{customer.companyName}}</div>
    <div>{{customer.contactPerson}}</div>
    <div>{{customer.billingAddress}}</div>
    <div>VAT: {{customer.vatId}}</div>
  </div>

  <h1 class="document-title">OFFER: {{document.documentNumber}}</h1>

  <div class="section">
    <div class="section-title">Offer Details</div>
    <div>Date: {{document.issueDate}}</div>
    <div>Valid Until: {{document.validUntil}}</div>
  </div>

  <div class="section">
    <table>
      <thead>
        <tr>
          <th>Description</th>
          <th>Quantity</th>
          <th>Unit Price</th>
          <th>Discount</th>
          <th>Tax Rate</th>
          <th>Total</th>
        </tr>
      </thead>
      <tbody>
        {{#each lineItems}}
        <tr>
          <td>{{description}}</td>
          <td>{{quantity}}</td>
          <td>{{formatCurrency unitPrice}}</td>
          <td>{{discount}}%</td>
          <td>{{taxRate}}%</td>
          <td>{{formatCurrency total}}</td>
        </tr>
        {{/each}}
      </tbody>
    </table>
  </div>

  <div class="totals">
    <div class="total-row">Subtotal: {{formatCurrency document.totalAmount}}</div>
    <div class="total-row">Tax: {{formatCurrency document.totalTax}}</div>
    <div class="total-row">Discount: {{formatCurrency document.totalDiscount}}</div>
    <div class="grand-total">Total: {{formatCurrency grandTotal}}</div>
  </div>

  <div class="section">
    <div class="section-title">Terms & Conditions</div>
    <div>{{document.paymentTerms}}</div>
    <div>{{document.notes}}</div>
  </div>

  <div class="footer">
    <div>{{company.name}} | {{company.addressLine1}}, {{company.city}} | {{company.phoneNumber}} | {{company.email}}</div>
    <div>Bank Account: {{company.bankAccountName}} | Account Number: {{company.bankAccountNumber}} | BIC: {{company.bankAccountBIC}}</div>
  </div>
</body>
</html>
      `,
      nl: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Offerte</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 0;
      padding: 20px;
      color: #333;
    }
    .header {
      margin-bottom: 30px;
    }
    .company-name {
      font-size: 24px;
      font-weight: bold;
      color: #2563eb;
    }
    .document-title {
      font-size: 28px;
      font-weight: bold;
      margin: 20px 0;
      color: #1f2937;
    }
    .section {
      margin-bottom: 20px;
    }
    .section-title {
      font-size: 18px;
      font-weight: bold;
      margin-bottom: 10px;
      color: #4b5563;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
    }
    th {
      background-color: #f3f4f6;
      padding: 10px;
      text-align: left;
      font-weight: bold;
      border-bottom: 1px solid #d1d5db;
    }
    td {
      padding: 10px;
      border-bottom: 1px solid #e5e7eb;
    }
    .totals {
      margin-top: 20px;
      text-align: right;
    }
    .total-row {
      margin-bottom: 5px;
    }
    .grand-total {
      font-weight: bold;
      font-size: 18px;
      margin-top: 10px;
    }
    .footer {
      margin-top: 50px;
      font-size: 12px;
      color: #6b7280;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="company-name">{{company.name}}</div>
    <div>{{company.addressLine1}}</div>
    <div>{{company.addressLine2}}</div>
    <div>{{company.postalCode}} {{company.city}}</div>
    <div>{{company.country}}</div>
    <div>BTW: {{company.vatId}}</div>
  </div>

  <div class="customer-info">
    <div class="section-title">Factuuradres:</div>
    <div>{{customer.companyName}}</div>
    <div>{{customer.contactPerson}}</div>
    <div>{{customer.billingAddress}}</div>
    <div>BTW: {{customer.vatId}}</div>
  </div>

  <h1 class="document-title">OFFERTE: {{document.documentNumber}}</h1>

  <div class="section">
    <div class="section-title">Offerte Details</div>
    <div>Datum: {{document.issueDate}}</div>
    <div>Geldig tot: {{document.validUntil}}</div>
  </div>

  <div class="section">
    <table>
      <thead>
        <tr>
          <th>Omschrijving</th>
          <th>Aantal</th>
          <th>Prijs per stuk</th>
          <th>Korting</th>
          <th>BTW</th>
          <th>Totaal</th>
        </tr>
      </thead>
      <tbody>
        {{#each lineItems}}
        <tr>
          <td>{{description}}</td>
          <td>{{quantity}}</td>
          <td>{{formatCurrency unitPrice}}</td>
          <td>{{discount}}%</td>
          <td>{{taxRate}}%</td>
          <td>{{formatCurrency total}}</td>
        </tr>
        {{/each}}
      </tbody>
    </table>
  </div>

  <div class="totals">
    <div class="total-row">Subtotaal: {{formatCurrency document.totalAmount}}</div>
    <div class="total-row">BTW: {{formatCurrency document.totalTax}}</div>
    <div class="total-row">Korting: {{formatCurrency document.totalDiscount}}</div>
    <div class="grand-total">Totaal: {{formatCurrency grandTotal}}</div>
  </div>

  <div class="section">
    <div class="section-title">Voorwaarden</div>
    <div>{{document.paymentTerms}}</div>
    <div>{{document.notes}}</div>
  </div>

  <div class="footer">
    <div>{{company.name}} | {{company.addressLine1}}, {{company.city}} | {{company.phoneNumber}} | {{company.email}}</div>
    <div>Bankrekening: {{company.bankAccountName}} | Rekeningnummer: {{company.bankAccountNumber}} | BIC: {{company.bankAccountBIC}}</div>
  </div>
</body>
</html>
      `,
    },
    INVOICE: {
      en: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Invoice</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 0;
      padding: 20px;
      color: #333;
    }
    .header {
      margin-bottom: 30px;
    }
    .company-name {
      font-size: 24px;
      font-weight: bold;
      color: #2563eb;
    }
    .document-title {
      font-size: 28px;
      font-weight: bold;
      margin: 20px 0;
      color: #1f2937;
    }
    .section {
      margin-bottom: 20px;
    }
    .section-title {
      font-size: 18px;
      font-weight: bold;
      margin-bottom: 10px;
      color: #4b5563;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
    }
    th {
      background-color: #f3f4f6;
      padding: 10px;
      text-align: left;
      font-weight: bold;
      border-bottom: 1px solid #d1d5db;
    }
    td {
      padding: 10px;
      border-bottom: 1px solid #e5e7eb;
    }
    .totals {
      margin-top: 20px;
      text-align: right;
    }
    .total-row {
      margin-bottom: 5px;
    }
    .grand-total {
      font-weight: bold;
      font-size: 18px;
      margin-top: 10px;
    }
    .footer {
      margin-top: 50px;
      font-size: 12px;
      color: #6b7280;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="company-name">{{company.name}}</div>
    <div>{{company.addressLine1}}</div>
    <div>{{company.addressLine2}}</div>
    <div>{{company.postalCode}} {{company.city}}</div>
    <div>{{company.country}}</div>
    <div>VAT: {{company.vatId}}</div>
  </div>

  <div class="customer-info">
    <div class="section-title">Bill To:</div>
    <div>{{customer.companyName}}</div>
    <div>{{customer.contactPerson}}</div>
    <div>{{customer.billingAddress}}</div>
    <div>VAT: {{customer.vatId}}</div>
  </div>

  <h1 class="document-title">INVOICE: {{document.documentNumber}}</h1>

  <div class="section">
    <div class="section-title">Invoice Details</div>
    <div>Date: {{document.issueDate}}</div>
    <div>Due Date: {{document.dueDate}}</div>
  </div>

  <div class="section">
    <table>
      <thead>
        <tr>
          <th>Description</th>
          <th>Quantity</th>
          <th>Unit Price</th>
          <th>Discount</th>
          <th>Tax Rate</th>
          <th>Total</th>
        </tr>
      </thead>
      <tbody>
        {{#each lineItems}}
        <tr>
          <td>{{description}}</td>
          <td>{{quantity}}</td>
          <td>{{formatCurrency unitPrice}}</td>
          <td>{{discount}}%</td>
          <td>{{taxRate}}%</td>
          <td>{{formatCurrency total}}</td>
        </tr>
        {{/each}}
      </tbody>
    </table>
  </div>

  <div class="totals">
    <div class="total-row">Subtotal: {{formatCurrency document.totalAmount}}</div>
    <div class="total-row">Tax: {{formatCurrency document.totalTax}}</div>
    <div class="total-row">Discount: {{formatCurrency document.totalDiscount}}</div>
    <div class="grand-total">Total: {{formatCurrency grandTotal}}</div>
  </div>

  <div class="section">
    <div class="section-title">Payment Details</div>
    <div>Payment Terms: {{document.paymentTerms}}</div>
    <div>{{document.notes}}</div>
  </div>

  <div class="footer">
    <div>{{company.name}} | {{company.addressLine1}}, {{company.city}} | {{company.phoneNumber}} | {{company.email}}</div>
    <div>Bank Account: {{company.bankAccountName}} | Account Number: {{company.bankAccountNumber}} | BIC: {{company.bankAccountBIC}}</div>
  </div>
</body>
</html>
      `,
      nl: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Factuur</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 0;
      padding: 20px;
      color: #333;
    }
    .header {
      margin-bottom: 30px;
    }
    .company-name {
      font-size: 24px;
      font-weight: bold;
      color: #2563eb;
    }
    .document-title {
      font-size: 28px;
      font-weight: bold;
      margin: 20px 0;
      color: #1f2937;
    }
    .section {
      margin-bottom: 20px;
    }
    .section-title {
      font-size: 18px;
      font-weight: bold;
      margin-bottom: 10px;
      color: #4b5563;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
    }
    th {
      background-color: #f3f4f6;
      padding: 10px;
      text-align: left;
      font-weight: bold;
      border-bottom: 1px solid #d1d5db;
    }
    td {
      padding: 10px;
      border-bottom: 1px solid #e5e7eb;
    }
    .totals {
      margin-top: 20px;
      text-align: right;
    }
    .total-row {
      margin-bottom: 5px;
    }
    .grand-total {
      font-weight: bold;
      font-size: 18px;
      margin-top: 10px;
    }
    .footer {
      margin-top: 50px;
      font-size: 12px;
      color: #6b7280;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="company-name">{{company.name}}</div>
    <div>{{company.addressLine1}}</div>
    <div>{{company.addressLine2}}</div>
    <div>{{company.postalCode}} {{company.city}}</div>
    <div>{{company.country}}</div>
    <div>BTW: {{company.vatId}}</div>
  </div>

  <div class="customer-info">
    <div class="section-title">Factuuradres:</div>
    <div>{{customer.companyName}}</div>
    <div>{{customer.contactPerson}}</div>
    <div>{{customer.billingAddress}}</div>
    <div>BTW: {{customer.vatId}}</div>
  </div>

  <h1 class="document-title">FACTUUR: {{document.documentNumber}}</h1>

  <div class="section">
    <div class="section-title">Factuur Details</div>
    <div>Datum: {{document.issueDate}}</div>
    <div>Vervaldatum: {{document.dueDate}}</div>
  </div>

  <div class="section">
    <table>
      <thead>
        <tr>
          <th>Omschrijving</th>
          <th>Aantal</th>
          <th>Prijs per stuk</th>
          <th>Korting</th>
          <th>BTW</th>
          <th>Totaal</th>
        </tr>
      </thead>
      <tbody>
        {{#each lineItems}}
        <tr>
          <td>{{description}}</td>
          <td>{{quantity}}</td>
          <td>{{formatCurrency unitPrice}}</td>
          <td>{{discount}}%</td>
          <td>{{taxRate}}%</td>
          <td>{{formatCurrency total}}</td>
        </tr>
        {{/each}}
      </tbody>
    </table>
  </div>

  <div class="totals">
    <div class="total-row">Subtotaal: {{formatCurrency document.totalAmount}}</div>
    <div class="total-row">BTW: {{formatCurrency document.totalTax}}</div>
    <div class="total-row">Korting: {{formatCurrency document.totalDiscount}}</div>
    <div class="grand-total">Totaal: {{formatCurrency grandTotal}}</div>
  </div>

  <div class="section">
    <div class="section-title">Betalingsgegevens</div>
    <div>Betalingstermijn: {{document.paymentTerms}}</div>
    <div>{{document.notes}}</div>
  </div>

  <div class="footer">
    <div>{{company.name}} | {{company.addressLine1}}, {{company.city}} | {{company.phoneNumber}} | {{company.email}}</div>
    <div>Bankrekening: {{company.bankAccountName}} | Rekeningnummer: {{company.bankAccountNumber}} | BIC: {{company.bankAccountBIC}}</div>
  </div>
</body>
</html>
      `,
    },
  };

  try {
    return defaultContent[type][language] || defaultContent['OFFER']['en'];
  } catch (error) {
    return defaultContent['OFFER']['en'];
  }
}