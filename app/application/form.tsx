import { router, Stack as RouterStack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import type { Application } from '@/db/schema';
import { ApplicationForm } from '@/features/applications/components/ApplicationForm';
import { DuplicateBanner } from '@/features/applications/components/DuplicateBanner';
import {
  emptyFormValues,
  valuesFromApplication,
  type ApplicationFormValues,
} from '@/features/applications/formSchema';
import { applicationsRepo, useApplication } from '@/features/applications/hooks';
import { createFromForm, updateFromForm } from '@/features/applications/save';
import { useStages } from '@/features/stages/hooks';
import { Loading, Screen } from '@/ui';

/** Create (optionally prefilled with ?url=) or edit (?id=) an application by hand. */
export default function ApplicationFormScreen() {
  const params = useLocalSearchParams<{ id?: string; url?: string }>();
  const { t } = useTranslation();
  const stages = useStages();
  const { application, loaded } = useApplication(params.id ?? '');
  const editing = !!params.id;

  if (stages.length === 0 || (editing && !loaded)) return <Loading />;
  if (editing && application) {
    return (
      <Screen scroll>
        <RouterStack.Screen options={{ title: t('form.editTitle') }} />
        <ApplicationForm
          initialValues={valuesFromApplication(application)}
          stages={stages}
          submitLabel={t('form.update')}
          onSubmit={async (values, dirty) => {
            await updateFromForm(applicationsRepo, application, values, dirty);
            router.back();
          }}
        />
      </Screen>
    );
  }
  const defaultStage = stages.find((s) => s.key === 'wishlist') ?? stages[0]!;
  return (
    <CreateForm initialValues={{ ...emptyFormValues(defaultStage.id), url: params.url ?? '' }} />
  );
}

function CreateForm({ initialValues }: { initialValues: ApplicationFormValues }) {
  const { t } = useTranslation();
  const stages = useStages();
  const [duplicate, setDuplicate] = useState<Application>();
  const [pending, setPending] = useState<ApplicationFormValues>();

  const save = async (values: ApplicationFormValues, allowDuplicate = false) => {
    const result = await createFromForm(applicationsRepo, values, { allowDuplicate });
    if (result.ok) router.replace(`/application/${result.application.id}`);
    else {
      setDuplicate(result.duplicate);
      setPending(values);
    }
  };

  return (
    <Screen scroll>
      <RouterStack.Screen options={{ title: t('form.newTitle') }} />
      <ApplicationForm
        initialValues={initialValues}
        stages={stages}
        submitLabel={t('form.create')}
        onSubmit={(values) => save(values)}
        beforeSubmit={
          duplicate ? (
            <DuplicateBanner
              duplicate={duplicate}
              onAddAnyway={() => pending && void save(pending, true)}
            />
          ) : null
        }
      />
    </Screen>
  );
}
