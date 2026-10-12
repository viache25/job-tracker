import { zodResolver } from '@hookform/resolvers/zod';
import { X } from 'lucide-react-native';
import { useState, type ReactNode } from 'react';
import { Controller, useForm, type Control, type FieldPath } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { StyleSheet } from 'react-native';

import {
  EMPLOYMENT_TYPES,
  SALARY_PERIODS,
  WORK_MODES,
  type FieldSource,
  type Stage,
} from '@/db/schema';
import { stageColor, stageLabel } from '@/features/stages/label';
import {
  Badge,
  Button,
  ListSection,
  Row,
  Segmented,
  Select,
  StageDot,
  Stack,
  SwitchRow,
  Tag,
  Text,
  TextArea,
  TextField,
  type TextFieldProps,
} from '@/ui';

import { applicationFormSchema, type ApplicationFormValues } from '../formSchema';

const COUNTRIES = ['AT', 'DE', 'CH', 'LI'] as const;
const CURRENCIES = ['EUR', 'CHF', 'USD', 'GBP'] as const;

export type ApplicationFormProps = {
  initialValues: ApplicationFormValues;
  stages: readonly Stage[];
  submitLabel: string;
  onSubmit: (
    values: ApplicationFormValues,
    dirty: Partial<Record<keyof ApplicationFormValues, unknown>>,
  ) => void | Promise<void>;
  /** Where each prefilled value came from; shown as a small badge next to the label. */
  fieldSources?: Partial<Record<string, FieldSource>>;
  /** Rendered above the submit button (e.g. a duplicate warning). */
  beforeSubmit?: ReactNode;
};

export function ApplicationForm({
  initialValues,
  stages,
  submitLabel,
  onSubmit,
  fieldSources = {},
  beforeSubmit,
}: ApplicationFormProps) {
  const { t } = useTranslation();
  const { control, handleSubmit, formState } = useForm<ApplicationFormValues>({
    resolver: zodResolver(applicationFormSchema),
    defaultValues: initialValues,
    mode: 'onTouched',
  });
  const dirty = formState.dirtyFields as Partial<Record<keyof ApplicationFormValues, unknown>>;

  const badge = (field: keyof ApplicationFormValues) => {
    const source = dirty[field] ? undefined : fieldSources[field];
    return source && source !== 'user' ? (
      <Badge label={t(`fieldSource.${source}`)} tone="primary" />
    ) : null;
  };
  const field = (
    name: FieldPath<ApplicationFormValues>,
    props: Omit<TextFieldProps, 'value' | 'onChangeText'>,
  ) => (
    <FormTextField
      control={control}
      name={name}
      badge={badge(name as keyof ApplicationFormValues)}
      {...props}
    />
  );

  return (
    <Stack gap="xl">
      <Stack gap="md">
        {field('url', {
          label: t('field.url'),
          placeholder: 'https://',
          autoCapitalize: 'none',
          autoCorrect: false,
          keyboardType: 'url',
          testID: 'field-url',
        })}
        {field('title', { label: t('field.title'), required: true, testID: 'field-title' })}
        {field('company', { label: t('field.company'), required: true, testID: 'field-company' })}
        <Controller
          control={control}
          name="stageId"
          render={({ field: f }) => (
            <Select
              label={t('field.stage')}
              value={f.value}
              onChange={f.onChange}
              placeholder={t('field.stage')}
              closeLabel={t('common.close')}
              options={stages
                .filter((s) => !s.hidden || s.id === f.value)
                .map((s) => ({
                  value: s.id,
                  label: stageLabel(s, t),
                  left: <StageDot color={stageColor(s)} />,
                }))}
              testID="field-stage"
            />
          )}
        />
      </Stack>

      <Stack gap="md">
        <Text variant="headline">{t('form.sectionPlace')}</Text>
        {field('city', { label: t('field.city') })}
        <Controller
          control={control}
          name="country"
          render={({ field: f }) => (
            <Select
              label={t('field.country')}
              value={f.value}
              onChange={f.onChange}
              placeholder={t('common.notSet')}
              closeLabel={t('common.close')}
              options={[
                ...COUNTRIES.map((c) => ({ value: c, label: t(`country.${c}`) })),
                { value: '', label: t('common.notSet') },
              ]}
            />
          )}
        />
        <Labeled label={t('field.workMode')} badge={badge('workMode')}>
          <Controller
            control={control}
            name="workMode"
            render={({ field: f }) => (
              <Segmented
                accessibilityLabel={t('field.workMode')}
                value={f.value}
                onChange={(v) => f.onChange(v === f.value ? null : v)}
                options={WORK_MODES.map((m) => ({ value: m, label: t(`workMode.${m}`) }))}
              />
            )}
          />
        </Labeled>
        <Controller
          control={control}
          name="employmentType"
          render={({ field: f }) => (
            <Select
              label={t('field.employmentType')}
              value={f.value}
              onChange={f.onChange}
              placeholder={t('common.notSet')}
              closeLabel={t('common.close')}
              options={EMPLOYMENT_TYPES.map((e) => ({ value: e, label: t(`employmentType.${e}`) }))}
            />
          )}
        />
      </Stack>

      <Stack gap="md">
        <Row>
          <Text variant="headline">{t('field.salary')}</Text>
          {badge('salaryMin')}
        </Row>
        <Row align="flex-start" gap="md">
          <Stack style={styles.half}>
            {field('salaryMin', {
              label: t('field.salaryMin'),
              keyboardType: 'decimal-pad',
              testID: 'field-salary-min',
            })}
          </Stack>
          <Stack style={styles.half}>
            {field('salaryMax', {
              label: t('field.salaryMax'),
              keyboardType: 'decimal-pad',
              testID: 'field-salary-max',
            })}
          </Stack>
        </Row>
        <Controller
          control={control}
          name="salaryPeriod"
          render={({ field: f }) => (
            <Segmented
              accessibilityLabel={t('field.salaryPeriod')}
              value={f.value}
              onChange={f.onChange}
              options={SALARY_PERIODS.map((p) => ({ value: p, label: t(`salaryPeriodName.${p}`) }))}
            />
          )}
        />
        <Controller
          control={control}
          name="salaryCurrency"
          render={({ field: f }) => (
            <Select
              label={t('field.salaryCurrency')}
              value={f.value}
              onChange={f.onChange}
              placeholder="EUR"
              closeLabel={t('common.close')}
              options={CURRENCIES.map((c) => ({ value: c, label: c }))}
            />
          )}
        />
        <ListSection>
          <Controller
            control={control}
            name="salaryIsNet"
            render={({ field: f }) => (
              <SwitchRow
                label={t('field.salaryIsNet')}
                value={f.value}
                onChange={f.onChange}
                last
              />
            )}
          />
        </ListSection>
      </Stack>

      <Controller
        control={control}
        name="stack"
        render={({ field: f }) => (
          <StackInput value={f.value} onChange={f.onChange} badge={badge('stack')} />
        )}
      />

      {field('deadline', {
        label: t('field.deadline'),
        placeholder: t('form.datePlaceholder'),
        hint: t('form.dateHint'),
        keyboardType: 'numbers-and-punctuation',
        testID: 'field-deadline',
      })}

      <Stack gap="md">
        <Text variant="headline">{t('card.contact')}</Text>
        {field('contactName', { label: t('field.contactName'), autoComplete: 'name' })}
        {field('contactEmail', {
          label: t('field.contactEmail'),
          keyboardType: 'email-address',
          autoCapitalize: 'none',
          autoComplete: 'email',
        })}
      </Stack>

      <Controller
        control={control}
        name="notes"
        render={({ field: f }) => (
          <TextArea
            label={t('field.notes')}
            value={f.value}
            onChangeText={f.onChange}
            onBlur={f.onBlur}
          />
        )}
      />

      {beforeSubmit}
      <Button
        label={submitLabel}
        onPress={handleSubmit((values) => onSubmit(values, dirty))}
        loading={formState.isSubmitting}
        testID="form-submit"
      />
    </Stack>
  );
}

function Labeled({
  label,
  badge,
  children,
}: {
  label: string;
  badge?: ReactNode;
  children: ReactNode;
}) {
  return (
    <Stack gap="xs">
      <Row>
        <Text variant="subhead" color="textMuted">
          {label}
        </Text>
        {badge}
      </Row>
      {children}
    </Stack>
  );
}

function FormTextField({
  control,
  name,
  ...props
}: { control: Control<ApplicationFormValues>; name: FieldPath<ApplicationFormValues> } & Omit<
  TextFieldProps,
  'value' | 'onChangeText'
>) {
  const { t } = useTranslation();
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <TextField
          {...props}
          value={typeof field.value === 'string' ? field.value : ''}
          onChangeText={field.onChange}
          onBlur={field.onBlur}
          error={
            fieldState.error?.message
              ? t(fieldState.error.message as 'form.errors.required')
              : undefined
          }
        />
      )}
    />
  );
}

function StackInput({
  value,
  onChange,
  badge,
}: {
  value: string[];
  onChange: (value: string[]) => void;
  badge?: ReactNode;
}) {
  const { t } = useTranslation();
  const [draft, setDraft] = useState('');
  const add = () => {
    const items = draft
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    if (items.length > 0) onChange([...new Set([...value, ...items])]);
    setDraft('');
  };
  return (
    <Stack gap="sm">
      <TextField
        label={t('field.stack')}
        badge={badge}
        value={draft}
        onChangeText={setDraft}
        onSubmitEditing={add}
        onBlur={add}
        placeholder={t('form.stackPlaceholder')}
        returnKeyType="done"
        submitBehavior="submit"
        autoCapitalize="none"
        testID="field-stack"
      />
      {value.length > 0 ? (
        <Row wrap gap="xs">
          {value.map((tech) => (
            <Tag
              key={tech}
              label={tech}
              icon={X}
              onPress={() => onChange(value.filter((v) => v !== tech))}
              accessibilityLabel={t('form.removeTag', { tag: tech })}
            />
          ))}
        </Row>
      ) : null}
    </Stack>
  );
}

const styles = StyleSheet.create({
  half: { flex: 1 },
});
