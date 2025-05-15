import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { HiUser, HiCalendar, HiClock } from 'react-icons/hi';
import { format } from 'date-fns';

import DashboardLayout from '@/components/layouts/DashboardLayout';
import Card from '@/components/ui/Card';
import FormField from '@/components/ui/FormField';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';
import Loading from '@/components/ui/Loading';

import { fetchUserProfile, updateUserProfile, UserProfile, UserProfileUpdate } from '@/lib/api/userProfile';

export default function UserProfilePage() {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch
  } = useForm<UserProfileUpdate>();

  const watchImage = watch('image');

  useEffect(() => {
    const loadUserProfile = async () => {
      try {
        setIsLoading(true);
        const profile = await fetchUserProfile();
        setUserProfile(profile);
        
        // Set form values
        setValue('name', profile.name || '');
        setValue('image', profile.image || '');
        
        setIsLoading(false);
      } catch (err) {
        console.error('Error loading user profile:', err);
        setError(t('userProfile.errors.updateFailed'));
        setIsLoading(false);
      }
    };

    loadUserProfile();
  }, [t, setValue]);

  const onSubmit = async (data: UserProfileUpdate) => {
    try {
      setIsSaving(true);
      setError(null);
      setSuccess(null);
      
      const updated = await updateUserProfile(data);
      setUserProfile(updated);
      setSuccess(t('userProfile.saveSuccess'));
      setIsSaving(false);
    } catch (err) {
      console.error('Error updating user profile:', err);
      setError(t('userProfile.saveError'));
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loading />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-2">{t('userProfile.title')}</h1>
          <p className="text-gray-600">{t('userProfile.description')}</p>
        </div>

        {error && (
          <Alert type="error" className="mb-6">
            {error}
          </Alert>
        )}

        {success && (
          <Alert type="success" className="mb-6">
            {success}
          </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <Card>
              <Card.Header>
                <Card.Title>
                  <div className="flex items-center">
                    <HiUser className="mr-2" />
                    {t('userProfile.personalInfo')}
                  </div>
                </Card.Title>
                <Card.Description>{t('userProfile.personalInfoHelp')}</Card.Description>
              </Card.Header>
              <Card.Content>
                <form onSubmit={handleSubmit(onSubmit)}>
                  <div className="mb-6">
                    <FormField
                      label={t('userProfile.displayName')}
                      error={errors.name?.message}
                      required
                    >
                      <input
                        type="text"
                        {...register('name', {
                          required: t('userProfile.errors.nameRequired')
                        })}
                        className="form-input"
                      />
                    </FormField>
                  </div>

                  <div className="mb-6">
                    <FormField 
                      label={t('userProfile.profileImage')}
                      help={t('userProfile.profileImageHelp')}
                      error={errors.image?.message}
                    >
                      <input
                        type="text"
                        {...register('image')}
                        className="form-input"
                        placeholder="https://"
                      />
                    </FormField>

                    {watchImage && (
                      <div className="mt-4">
                        <p className="text-sm font-medium mb-2">{t('userProfile.profileImagePreview')}</p>
                        <div className="border rounded-lg p-4 w-32 h-32 flex items-center justify-center">
                          <img 
                            src={watchImage} 
                            alt={t('userProfile.profileImagePreview')} 
                            className="max-w-full max-h-full object-cover rounded"
                            onError={(e) => {
                              e.currentTarget.src = 'https://via.placeholder.com/200?text=No+Image';
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end">
                    <Button type="submit" variant="primary" isLoading={isSaving}>
                      {isSaving ? t('common.saving') : t('common.save')}
                    </Button>
                  </div>
                </form>
              </Card.Content>
            </Card>
          </div>

          <div>
            <Card>
              <Card.Header>
                <Card.Title>
                  <div className="flex items-center">
                    <HiClock className="mr-2" />
                    {t('userProfile.accountInfo')}
                  </div>
                </Card.Title>
                <Card.Description>{t('userProfile.accountInfoHelp')}</Card.Description>
              </Card.Header>
              <Card.Content>
                {userProfile && (
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-medium text-gray-600">{t('userProfile.email')}</p>
                      <p className="mt-1">{userProfile.email}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium text-gray-600">{t('userProfile.accountCreated')}</p>
                      <p className="mt-1 flex items-center">
                        <HiCalendar className="mr-2 text-gray-500" />
                        {format(new Date(userProfile.createdAt), 'PPP')}
                      </p>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium text-gray-600">{t('userProfile.lastUpdated')}</p>
                      <p className="mt-1 flex items-center">
                        <HiClock className="mr-2 text-gray-500" />
                        {format(new Date(userProfile.updatedAt), 'PPP')}
                      </p>
                    </div>
                  </div>
                )}
              </Card.Content>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
