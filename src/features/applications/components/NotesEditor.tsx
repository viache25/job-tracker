import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Text, TextArea } from '@/ui';

const SAVE_DELAY_MS = 700;

/** Notes with autosave: writes shortly after typing stops and on blur. */
export function NotesEditor({
  initial,
  onSave,
}: {
  initial: string;
  onSave: (notes: string) => void;
}) {
  const { t } = useTranslation();
  const [value, setValue] = useState(initial);
  const [saved, setSaved] = useState(false);
  const lastSaved = useRef(initial);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const pending = useRef(initial);
  const save = useRef(onSave);
  useEffect(() => {
    save.current = onSave;
  }, [onSave]);

  const flush = () => {
    clearTimeout(timer.current);
    if (pending.current === lastSaved.current) return;
    lastSaved.current = pending.current;
    save.current(pending.current);
    setSaved(true);
  };

  // Save pending text when the screen goes away.
  useEffect(
    () => () => {
      clearTimeout(timer.current);
      if (pending.current !== lastSaved.current) save.current(pending.current);
    },
    [],
  );

  return (
    <>
      <TextArea
        label={t('card.notes')}
        placeholder={t('card.notesPlaceholder')}
        value={value}
        onChangeText={(text) => {
          setValue(text);
          pending.current = text;
          setSaved(false);
          clearTimeout(timer.current);
          timer.current = setTimeout(flush, SAVE_DELAY_MS);
        }}
        onBlur={flush}
        testID="notes-input"
      />
      {saved ? (
        <Text variant="footnote" color="textSubtle" accessibilityLiveRegion="polite">
          {t('card.saved')}
        </Text>
      ) : null}
    </>
  );
}
