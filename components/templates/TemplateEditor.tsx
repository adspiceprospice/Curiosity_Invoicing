import { useState, useEffect } from 'react';
import { Template, DocumentType } from '@prisma/client';
import { t } from '@/lib/translations';
import { getDefaultTemplateContent } from './defaultTemplates';
import TemplateSettingsForm from './TemplateSettingsForm';
import TemplateContentEditor from './TemplateContentEditor';

interface TemplateEditorProps {
  template?: Template;
  onSubmit: (data: Partial<Template>) => void;
  isSubmitting: boolean;
  onPreview?: (templateData: Partial<Template>) => void;
  previewLoading?: boolean;
}

export default function TemplateEditor({
  template,
  onSubmit,
  isSubmitting,
  onPreview,
  previewLoading = false,
}: TemplateEditorProps) {
  const [formData, setFormData] = useState<Partial<Template>>({
    name: '',
    type: 'OFFER',
    languageCode: 'en',
    isDefault: false,
    content: getDefaultTemplateContent('OFFER', 'en'),
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Initialize form with template data if editing
  useEffect(() => {
    if (template) {
      setFormData({
        ...template,
      });
    }
  }, [template]);

  // Update content when type or language changes
  useEffect(() => {
    if (!template && (formData.type !== 'OFFER' || formData.languageCode !== 'en')) {
      setFormData(prev => ({
        ...prev,
        content: getDefaultTemplateContent(prev.type as DocumentType, prev.languageCode as string),
      }));
    }
  }, [formData.type, formData.languageCode, template]);

  const handleSettingsChange = (settings: Partial<Template>) => {
    setFormData(prev => ({
      ...prev,
      ...settings,
    }));

    // Clear errors for changed fields
    const clearedErrors = { ...errors };
    Object.keys(settings).forEach(key => {
      if (clearedErrors[key]) {
        delete clearedErrors[key];
      }
    });
    
    setErrors(clearedErrors);
  };

  const handleContentChange = (content: string) => {
    setFormData(prev => ({
      ...prev,
      content,
    }));

    // Clear error for content
    if (errors.content) {
      setErrors(prev => ({
        ...prev,
        content: '',
      }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name) {
      newErrors.name = t('error.required');
    }

    if (!formData.type) {
      newErrors.type = t('error.required');
    }

    if (!formData.languageCode) {
      newErrors.languageCode = t('error.required');
    }

    if (!formData.content) {
      newErrors.content = t('error.required');
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

  const handlePreview = () => {
    if (onPreview && validateForm()) {
      onPreview(formData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Template Settings */}
      <TemplateSettingsForm
        settings={formData}
        onChange={handleSettingsChange}
        errors={errors}
        isEditing={!!template}
      />

      {/* Template Content */}
      <TemplateContentEditor
        content={formData.content || ''}
        onChange={handleContentChange}
        error={errors.content}
        onPreview={onPreview ? handlePreview : undefined}
        previewLoading={previewLoading}
      />

      {/* Form Actions */}
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