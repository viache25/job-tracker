import { router, Stack as RouterStack, useLocalSearchParams } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import {
  Archive,
  ArchiveRestore,
  Banknote,
  Briefcase,
  Clock,
  Ellipsis,
  ExternalLink,
  Laptop,
  Mail,
  MapPin,
  Pencil,
  Trash,
} from 'lucide-react-native';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Linking, StyleSheet, View } from 'react-native';

import { NotesEditor } from '@/features/applications/components/NotesEditor';
import { applicationsRepo, useApplication, useStageEvents } from '@/features/applications/hooks';
import { locationText, salaryText } from '@/features/applications/present';
import { useLocale } from '@/features/settings/preferences';
import { useStageMap, useStages } from '@/features/stages/hooks';
import { stageColor, stageLabel } from '@/features/stages/label';
import { formatDate } from '@/lib/format';
import {
  BottomSheet,
  Button,
  Card,
  EmptyState,
  Icon,
  IconButton,
  ListRow,
  ListSection,
  Loading,
  Row,
  Screen,
  radius,
  Select,
  StageDot,
  Stack,
  Tag,
  Text,
  useTheme,
} from '@/ui';

const DESCRIPTION_PREVIEW = 600;

export default function ApplicationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const { locale } = useLocale();
  const { colors } = useTheme();
  const { application: a, loaded } = useApplication(id);
  const events = useStageEvents(id);
  const stages = useStages();
  const stageById = useStageMap();
  const [menuOpen, setMenuOpen] = useState(false);
  const [showFull, setShowFull] = useState(false);

  if (!loaded) return <Loading />;
  if (!a) {
    return (
      <Screen>
        <EmptyState
          icon={Briefcase}
          title={t('card.notFound')}
          actionLabel={t('common.close')}
          onAction={() => router.back()}
        />
      </Screen>
    );
  }

  const salary = salaryText(a, t, locale);
  const location = locationText(a);
  const description = a.description ?? '';
  const longDescription = description.length > DESCRIPTION_PREVIEW;

  const confirmDelete = () => {
    setMenuOpen(false);
    Alert.alert(t('card.deleteConfirmTitle'), t('card.deleteConfirmBody'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: () => {
          applicationsRepo.remove(a.id);
          router.back();
        },
      },
    ]);
  };

  const details: [string, string | null | undefined][] = [
    [t('field.employmentType'), a.employmentType ? t(`employmentType.${a.employmentType}`) : null],
    [t('field.postedAt'), a.postedAt ? formatDate(a.postedAt, locale) : null],
    [t('field.deadline'), a.deadline ? formatDate(a.deadline, locale) : null],
    [t('field.language'), a.language?.toUpperCase()],
    [t('field.source'), a.source],
    [t('card.created'), formatDate(a.createdAt, locale)],
    [t('field.updatedAt'), formatDate(a.updatedAt, locale)],
  ];
  const visibleDetails = details.filter(([, v]) => v);

  return (
    <Screen scroll testID="application-screen">
      <RouterStack.Screen
        options={{
          title: '',
          headerRight: () => (
            <IconButton
              icon={Ellipsis}
              accessibilityLabel={t('card.menu')}
              onPress={() => setMenuOpen(true)}
              testID="card-menu"
            />
          ),
        }}
      />

      <Stack gap="sm">
        <Text variant="subhead" color="textMuted">
          {a.company}
        </Text>
        <Text variant="title" accessibilityRole="header">
          {a.title}
        </Text>
        {a.archivedAt ? <Tag label={t('card.archived')} icon={Archive} /> : null}
        <Row wrap gap="xs">
          {location ? <Tag label={location} icon={MapPin} /> : null}
          {a.workMode ? <Tag label={t(`workMode.${a.workMode}`)} icon={Laptop} /> : null}
          {salary ? <Tag label={salary} icon={Banknote} /> : null}
          {a.deadline ? (
            <Tag label={`${t('field.deadline')}: ${formatDate(a.deadline, locale)}`} icon={Clock} />
          ) : null}
        </Row>
        {a.stack.length > 0 ? (
          <Row wrap gap="xs">
            {a.stack.map((tech) => (
              <Tag key={tech} label={tech} />
            ))}
          </Row>
        ) : null}
      </Stack>

      <Select
        label={t('card.stage')}
        value={a.stageId}
        onChange={(stageId) => applicationsRepo.changeStage(a.id, stageId)}
        placeholder={t('card.stage')}
        closeLabel={t('common.close')}
        options={stages
          .filter((s) => !s.hidden || s.id === a.stageId)
          .map((s) => ({
            value: s.id,
            label: stageLabel(s, t),
            left: <StageDot color={stageColor(s)} />,
          }))}
        testID="stage-select"
      />

      {a.url ? (
        <Button
          label={t('card.openVacancy')}
          icon={ExternalLink}
          variant="secondary"
          onPress={() => void WebBrowser.openBrowserAsync(a.url!)}
          testID="open-vacancy"
        />
      ) : null}

      <NotesEditor
        key={a.id}
        initial={a.notes ?? ''}
        onSave={(notes) => applicationsRepo.update(a.id, { notes })}
      />

      {a.contactName || a.contactEmail ? (
        <ListSection title={t('card.contact')}>
          {a.contactName ? <ListRow title={a.contactName} last={!a.contactEmail} /> : null}
          {a.contactEmail ? (
            <ListRow
              title={a.contactEmail}
              left={<Icon icon={Mail} color="textMuted" />}
              accessibilityHint={t('card.writeEmail')}
              onPress={() => void Linking.openURL(`mailto:${a.contactEmail}`)}
              last
            />
          ) : null}
        </ListSection>
      ) : null}

      <ListSection title={t('card.timeline')}>
        {events.map((event, index) => {
          const stage = stageById.get(event.toStageId);
          return (
            <ListRow
              key={event.id}
              left={<StageDot color={stageColor(stage)} />}
              title={stageLabel(stage, t)}
              value={formatDate(event.at, locale)}
              last={index === events.length - 1}
            />
          );
        })}
      </ListSection>

      {visibleDetails.length > 0 ? (
        <ListSection title={t('card.details')}>
          {visibleDetails.map(([label, value], index) => (
            <ListRow
              key={label}
              title={label}
              value={value ?? ''}
              last={index === visibleDetails.length - 1}
            />
          ))}
        </ListSection>
      ) : null}

      {description ? (
        <Card>
          <Text variant="headline">{t('card.description')}</Text>
          <Text variant="callout" color="textMuted" selectable>
            {showFull || !longDescription
              ? description
              : `${description.slice(0, DESCRIPTION_PREVIEW).trimEnd()}…`}
          </Text>
          {longDescription ? (
            <Button
              label={showFull ? t('card.showLess') : t('card.showMore')}
              variant="ghost"
              size="small"
              onPress={() => setShowFull(!showFull)}
            />
          ) : null}
        </Card>
      ) : null}

      <BottomSheet
        visible={menuOpen}
        onClose={() => setMenuOpen(false)}
        title={t('card.menu')}
        closeLabel={t('common.close')}
      >
        <View style={[styles.menu, { borderColor: colors.border }]}>
          <ListRow
            title={t('common.edit')}
            left={<MenuIcon icon="edit" />}
            onPress={() => {
              setMenuOpen(false);
              router.push({ pathname: '/application/form', params: { id: a.id } });
            }}
            testID="menu-edit"
          />
          <ListRow
            title={a.archivedAt ? t('card.unarchive') : t('card.archive')}
            left={<MenuIcon icon={a.archivedAt ? 'unarchive' : 'archive'} />}
            onPress={() => {
              setMenuOpen(false);
              if (a.archivedAt) applicationsRepo.unarchive(a.id);
              else applicationsRepo.archive(a.id);
            }}
            testID="menu-archive"
          />
          <ListRow
            title={t('card.delete')}
            left={<MenuIcon icon="delete" />}
            destructive
            onPress={confirmDelete}
            last
            testID="menu-delete"
          />
        </View>
      </BottomSheet>
    </Screen>
  );
}

function MenuIcon({ icon }: { icon: 'edit' | 'archive' | 'unarchive' | 'delete' }) {
  const glyph = { edit: Pencil, archive: Archive, unarchive: ArchiveRestore, delete: Trash }[icon];
  return <Icon icon={glyph} color={icon === 'delete' ? 'danger' : 'textMuted'} />;
}

const styles = StyleSheet.create({
  menu: { borderRadius: radius.lg, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
});
