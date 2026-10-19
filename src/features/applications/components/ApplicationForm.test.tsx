import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { I18nextProvider } from 'react-i18next';

import i18n from '@/i18n';
import { makeStage } from '@/test/factories';
import { ThemeProvider } from '@/ui';

import { emptyFormValues } from '../formSchema';
import { ApplicationForm } from './ApplicationForm';

const stages = [makeStage({ id: 'wishlist' }), makeStage({ id: 'applied', position: 1 })];

function renderForm(onSubmit = jest.fn(), fieldSources = {}) {
  return render(
    <I18nextProvider i18n={i18n}>
      <ThemeProvider>
        <ApplicationForm
          initialValues={emptyFormValues('wishlist')}
          stages={stages}
          submitLabel="Save"
          onSubmit={onSubmit}
          fieldSources={fieldSources}
        />
      </ThemeProvider>
    </I18nextProvider>,
  );
}

beforeAll(() => i18n.changeLanguage('en'));

describe('ApplicationForm', () => {
  it('does not save without title and company and shows errors at the fields', async () => {
    const onSubmit = jest.fn();
    await renderForm(onSubmit);
    await fireEvent.press(screen.getByTestId('form-submit'));
    await waitFor(() => expect(screen.getAllByText('Required')).toHaveLength(2));
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('saves with title and company and reports edited fields', async () => {
    const onSubmit = jest.fn();
    await renderForm(onSubmit);
    await fireEvent.changeText(screen.getByTestId('field-title'), 'Frontend Developer');
    await fireEvent.changeText(screen.getByTestId('field-company'), 'ACME');
    await fireEvent.press(screen.getByTestId('form-submit'));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    const [values, dirty] = onSubmit.mock.calls[0]!;
    expect(values).toMatchObject({
      title: 'Frontend Developer',
      company: 'ACME',
      stageId: 'wishlist',
    });
    expect(dirty).toMatchObject({ title: true, company: true });
  });

  it('shows where prefilled values came from', async () => {
    await renderForm(jest.fn(), { title: 'markup', company: 'meta' });
    expect(screen.getByText('Markup')).toBeTruthy();
    expect(screen.getByText('Meta tags')).toBeTruthy();
  });
});
