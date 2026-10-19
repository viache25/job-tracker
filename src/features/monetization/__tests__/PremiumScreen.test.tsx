import { fireEvent, render, screen } from '@testing-library/react-native';
import { I18nextProvider } from 'react-i18next';

import PremiumScreen from '../../../../app/premium';
import i18n from '@/i18n';
import { ThemeProvider } from '@/ui';

import { purchase } from '../purchases';
import { useMonetization } from '../store';

jest.mock('../purchases', () => ({
  loadPackages: jest.fn(async () => [
    { id: 'lifetime', title: 'No ads', price: '€2.99', period: null, raw: {} },
  ]),
  purchase: jest.fn(async () => 'purchased'),
  restorePurchases: jest.fn(async () => false),
}));

const renderScreen = () =>
  render(
    <I18nextProvider i18n={i18n}>
      <ThemeProvider>
        <PremiumScreen />
      </ThemeProvider>
    </I18nextProvider>,
  );

beforeAll(() => i18n.changeLanguage('en'));

describe('PremiumScreen', () => {
  beforeEach(() => useMonetization.setState({ premium: false, purchasesReady: true }));

  it('lists packages from the offering and buys one', async () => {
    await renderScreen();
    const buy = await screen.findByRole('button', { name: 'Buy for €2.99' });
    expect(screen.getByText('One-time purchase')).toBeTruthy();
    await fireEvent.press(buy);
    expect(purchase).toHaveBeenCalledWith(expect.objectContaining({ id: 'lifetime' }));
  });

  it('shows the thank-you state for premium users', async () => {
    useMonetization.setState({ premium: true });
    await renderScreen();
    expect(screen.getByText('No more ads')).toBeTruthy();
  });
});
