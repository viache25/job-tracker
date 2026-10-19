import * as Clipboard from 'expo-clipboard';
import { router, useLocalSearchParams } from 'expo-router';
import { ClipboardPaste, FileText, Link as LinkIcon, PencilLine } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import type { Application, FieldSource } from '@/db/schema';
import { ApplicationForm } from '@/features/applications/components/ApplicationForm';
import { DuplicateBanner } from '@/features/applications/components/DuplicateBanner';
import { valuesFromParsed, type ApplicationFormValues } from '@/features/applications/formSchema';
import { applicationsRepo } from '@/features/applications/hooks';
import type { ApplicationInput } from '@/features/applications/repo';
import { createFromForm } from '@/features/applications/save';
import { onApplicationCreated } from '@/features/monetization/ads';
import { useStages } from '@/features/stages/hooks';
import { extractUrl, isHttpUrl } from '@/lib/url';
import { parseText, parseVacancy, type ParseErrorCode } from '@/parser';
import { Banner, Button, Loading, Row, Screen, Stack, Text, TextArea, TextField } from '@/ui';

type Draft = {
  values: ApplicationFormValues;
  extras: Partial<ApplicationInput>;
  fieldSources: Partial<Record<string, FieldSource>>;
  complete: boolean;
  fromText: boolean;
};

type State =
  | { step: 'input' }
  | { step: 'loading'; url: string }
  | { step: 'error'; url: string; error: ParseErrorCode }
  | { step: 'text' }
  | { step: 'result'; draft: Draft; duplicate?: Application };

export default function AddScreen() {
  const { t } = useTranslation();
  const params = useLocalSearchParams<{ url?: string }>();
  const stages = useStages();
  const [url, setUrl] = useState(params.url ?? '');
  const [text, setText] = useState('');
  const [state, setState] = useState<State>({ step: 'input' });
  const run = useRef(0);

  const defaultStageId = (stages.find((s) => s.key === 'wishlist') ?? stages[0])?.id ?? '';

  const parse = async (input: string) => {
    const target = extractUrl(input) ?? input.trim();
    if (!isHttpUrl(target)) {
      setState({ step: 'error', url: target, error: 'invalid_url' });
      return;
    }
    const id = ++run.current;
    setState({ step: 'loading', url: target });
    const result = await parseVacancy(target);
    if (id !== run.current) return; // cancelled or superseded
    if (!result.ok) {
      setState({ step: 'error', url: result.url ?? target, error: result.error });
      return;
    }
    const { vacancy } = result;
    const { values, extras } = valuesFromParsed(vacancy.fields, vacancy.url, defaultStageId);
    setState({
      step: 'result',
      draft: {
        values,
        extras,
        fieldSources: vacancy.fieldSources,
        complete: result.complete,
        fromText: false,
      },
      duplicate: applicationsRepo.findByUrlHash(vacancy.urlHash),
    });
  };

  // Links handed over by "Share" or a deep link are parsed right away.
  const initialUrl = useRef(params.url);
  useEffect(() => {
    if (initialUrl.current && stages.length > 0) {
      const u = initialUrl.current;
      initialUrl.current = undefined;
      void parse(u);
    }
  });

  const pasteFromClipboard = async () => {
    const value = await Clipboard.getStringAsync();
    const link = extractUrl(value);
    setUrl(link ?? value.trim());
    if (link) void parse(link);
  };

  const parsePastedText = () => {
    const { fields, fieldSources } = parseText(text);
    const { values, extras } = valuesFromParsed(fields, isHttpUrl(url) ? url : '', defaultStageId);
    setState({
      step: 'result',
      draft: {
        values,
        extras,
        fieldSources,
        complete: !!(fields.title && fields.company),
        fromText: true,
      },
    });
  };

  const manual = (prefillUrl?: string) =>
    router.replace({
      pathname: '/application/form',
      params: prefillUrl ? { url: prefillUrl } : {},
    });

  if (stages.length === 0) return <Loading />;

  switch (state.step) {
    case 'loading':
      return (
        <Screen>
          <Loading label={t('add.loading')} />
          <Button
            label={t('common.cancel')}
            variant="ghost"
            onPress={() => {
              run.current++;
              setState({ step: 'input' });
            }}
          />
        </Screen>
      );

    case 'result': {
      const { draft, duplicate } = state;
      return (
        <Screen scroll testID="add-result">
          {draft.fromText ? (
            <Banner tone="info" title={t('add.fromTextTitle')} body={t('add.checkFields')} />
          ) : draft.complete ? (
            <Banner
              tone="success"
              title={t('add.successTitle')}
              body={t('add.checkFields')}
              testID="add-success"
            />
          ) : (
            <Banner
              tone="warning"
              title={t('add.partialTitle')}
              body={t('add.partialBody')}
              testID="add-partial"
            />
          )}
          {duplicate ? <DuplicateBanner duplicate={duplicate} /> : null}
          <ApplicationForm
            initialValues={draft.values}
            fieldSources={draft.fieldSources}
            stages={stages}
            submitLabel={t('add.submit')}
            onSubmit={async (values, dirty) => {
              const result = await createFromForm(applicationsRepo, values, {
                extras: draft.extras,
                fieldSources: draft.fieldSources,
                dirty,
                allowDuplicate: !!duplicate,
              });
              if (result.ok) {
                router.replace(`/application/${result.application.id}`);
                onApplicationCreated();
              } else setState({ step: 'result', draft, duplicate: result.duplicate });
            }}
          />
          <Button
            label={t('add.startOver')}
            variant="ghost"
            onPress={() => setState({ step: 'input' })}
          />
        </Screen>
      );
    }

    case 'text':
      return (
        <Screen scroll>
          <Text variant="callout" color="textMuted">
            {t('add.textIntro')}
          </Text>
          <TextArea
            label={t('add.textLabel')}
            value={text}
            onChangeText={setText}
            placeholder={t('add.textPlaceholder')}
            testID="add-text"
          />
          <Button
            label={t('add.parseText')}
            onPress={parsePastedText}
            disabled={text.trim().length < 20}
          />
          <Button
            label={t('common.back')}
            variant="ghost"
            onPress={() => setState({ step: 'input' })}
          />
        </Screen>
      );

    case 'error':
    case 'input':
      return (
        <Screen scroll testID="add-screen">
          {state.step === 'error' ? (
            <Banner
              tone="error"
              title={t(`add.errors.${state.error}.title`)}
              body={t(`add.errors.${state.error}.body`)}
              testID="add-error"
            >
              <Button
                label={t('add.pasteText')}
                size="small"
                variant="secondary"
                icon={FileText}
                onPress={() => setState({ step: 'text' })}
              />
              <Button
                label={t('add.manual')}
                size="small"
                variant="secondary"
                icon={PencilLine}
                onPress={() => manual(isHttpUrl(state.url) ? state.url : undefined)}
              />
              {state.error === 'timeout' || state.error === 'network' ? (
                <Button
                  label={t('common.retry')}
                  size="small"
                  onPress={() => void parse(state.url)}
                />
              ) : null}
            </Banner>
          ) : (
            <Text variant="callout" color="textMuted">
              {t('add.intro')}
            </Text>
          )}
          <TextField
            label={t('field.url')}
            icon={LinkIcon}
            value={url}
            onChangeText={setUrl}
            placeholder="https://www.karriere.at/jobs/…"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            returnKeyType="go"
            onSubmitEditing={() => void parse(url)}
            testID="add-url"
          />
          <Row wrap>
            <Button
              label={t('add.paste')}
              icon={ClipboardPaste}
              variant="secondary"
              onPress={() => void pasteFromClipboard()}
            />
          </Row>
          <Button
            label={t('add.parse')}
            onPress={() => void parse(url)}
            disabled={!url.trim()}
            testID="add-parse"
          />
          <Stack gap="xs">
            <Button
              label={t('add.pasteText')}
              icon={FileText}
              variant="ghost"
              onPress={() => setState({ step: 'text' })}
            />
            <Button
              label={t('add.manual')}
              icon={PencilLine}
              variant="ghost"
              onPress={() => manual(isHttpUrl(url) ? url : undefined)}
            />
          </Stack>
        </Screen>
      );
  }
}
