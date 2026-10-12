import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { I18nextProvider } from 'react-i18next';

import i18n from '@/i18n';
import { ThemeProvider } from '@/ui';

import { NotesEditor } from './NotesEditor';

describe('NotesEditor', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  const renderEditor = (onSave: jest.Mock) =>
    render(
      <I18nextProvider i18n={i18n}>
        <ThemeProvider>
          <NotesEditor initial="" onSave={onSave} />
        </ThemeProvider>
      </I18nextProvider>,
    );

  it('saves shortly after typing stops', async () => {
    const onSave = jest.fn();
    await renderEditor(onSave);
    await fireEvent.changeText(screen.getByTestId('notes-input'), 'Call Anna');
    expect(onSave).not.toHaveBeenCalled();
    await act(() => jest.advanceTimersByTime(800));
    expect(onSave).toHaveBeenCalledWith('Call Anna');
  });

  it('saves pending text on unmount', async () => {
    const onSave = jest.fn();
    const view = await renderEditor(onSave);
    await fireEvent.changeText(screen.getByTestId('notes-input'), 'Draft');
    await view.unmount();
    expect(onSave).toHaveBeenCalledWith('Draft');
  });
});
