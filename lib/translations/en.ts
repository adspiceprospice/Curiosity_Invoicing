export const en = {
  common: {
    cancel: 'Cancel',
    save: 'Save',
    create: 'Create',
    edit: 'Edit',
    delete: 'Delete',
    duplicate: 'Duplicate',
    preview: 'Preview',
    back: 'Back',
    view: 'View',
    default: 'Default',
    setAsDefault: 'Set as Default',
    search: 'Search',
    all: 'All',
    actions: 'Actions',
    createdAt: 'Created',
    updatedAt: 'Updated',
    name: 'Name',
    type: 'Type',
    language: 'Language',
    content: 'Content',
    required: 'Required',
    error: 'Error',
    success: 'Success'
  },
  templates: {
    title: 'Templates',
    new: 'New Template',
    edit: 'Edit Template',
    createTitle: 'Create New Template',
    editTitle: 'Edit Template',
    duplicateTitle: 'Duplicate Template',
    templateName: 'Template Name',
    templateType: 'Template Type',
    templateLanguage: 'Template Language',
    templateContent: 'Template Content',
    setAsDefaultDescription: 'Set as default template for this type and language',
    templateContentHelp: 'Use HTML and custom template variables to create your template.',
    previewTemplate: 'Preview Template',
    duplicateTemplate: 'Duplicate Template',
    deleteTemplate: 'Delete Template',
    deleteConfirmation: 'Are you sure you want to delete this template? This action cannot be undone.',
    createFirstTemplate: 'Create your first template',
    helpText: 'Templates allow you to customize the appearance of your invoices and offers.',
    sourceTemplate: 'Source Template',
    newTemplateName: 'New Template Name',
    duplicateDescription: 'The duplicate template will have the same content, type, and language as the original, but will not be set as the default.',
    noTemplates: 'You don\'t have any templates yet. Create your first one to get started.',
    noFilteredTemplates: 'No templates match your filters.',
    allTypes: 'All Types',
    allLanguages: 'All Languages',
    types: {
      invoice: 'Invoice',
      offer: 'Offer'
    },
    success: {
      created: 'Template created successfully',
      updated: 'Template updated successfully',
      deleted: 'Template deleted successfully',
      duplicated: 'Template duplicated successfully',
      setAsDefault: 'Template set as default successfully'
    },
    error: {
      create: 'Error creating template',
      update: 'Error updating template',
      delete: 'Error deleting template',
      duplicate: 'Error duplicating template',
      setAsDefault: 'Error setting template as default',
      preview: 'Error generating preview',
      inUse: 'Cannot delete template that is being used by documents'
    }
  },
  invoices: {
    title: 'Invoices',
    new: 'New Invoice',
    allCustomers: 'All Customers',
    status: {
      draft: 'Draft',
      sent: 'Sent',
      paid: 'Paid',
      partially_paid: 'Partially Paid',
      overdue: 'Overdue',
      voided: 'Voided'
    },
    noInvoices: 'You don\'t have any invoices yet. Create your first one to get started.',
    noFilteredInvoices: 'No invoices match your filters.',
    helpText: 'Invoices allow you to bill your customers for products or services.',
    createFirstInvoice: 'Create your first invoice'
  },
  offers: {
    title: 'Offers',
    new: 'New Offer',
    allCustomers: 'All Customers',
    status: {
      draft: 'Draft',
      sent: 'Sent',
      accepted: 'Accepted',
      rejected: 'Rejected',
      expired: 'Expired',
      converted: 'Converted'
    },
    noOffers: 'You don\'t have any offers yet. Create your first one to get started.',
    noFilteredOffers: 'No offers match your filters.',
    helpText: 'Offers allow you to provide quotes to your customers before creating an invoice.',
    createFirstOffer: 'Create your first offer'
  },
  customers: {
    title: 'Customers',
    new: 'New Customer'
  },
  settings: {
    title: 'Settings',
    companyProfile: 'Company Profile',
    userProfile: 'User Profile',
    billing: 'Billing',
    integrations: 'Integrations',
    translations: 'Translations'
  }
};