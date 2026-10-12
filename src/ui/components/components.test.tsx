import { fireEvent, render, screen } from '@testing-library/react-native';
import { Search } from 'lucide-react-native';

import { ThemeProvider } from '../theme';
import { Button } from './Button';
import { IconButton } from './IconButton';
import { Segmented } from './Segmented';
import { Select } from './Select';
import { TextField } from './TextField';

const wrap = (ui: React.ReactElement) =>
  render(<ThemeProvider preference="dark">{ui}</ThemeProvider>);

describe('ui components', () => {
  it('Button calls onPress', async () => {
    const onPress = jest.fn();
    await wrap(<Button label="Save" onPress={onPress} />);
    await fireEvent.press(screen.getByRole('button', { name: 'Save' }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('Button is disabled while loading', async () => {
    await wrap(<Button label="Busy" onPress={() => undefined} loading />);
    expect(screen.getByRole('button', { name: 'Busy' })).toBeDisabled();
  });

  it('IconButton exposes its label', async () => {
    await wrap(<IconButton icon={Search} accessibilityLabel="Search" onPress={() => undefined} />);
    expect(screen.getByRole('button', { name: 'Search' })).toBeTruthy();
  });

  it('TextField shows the error', async () => {
    await wrap(<TextField label="Company" error="Required" />);
    expect(screen.getByText('Required')).toBeTruthy();
  });

  it('Segmented reports the chosen option', async () => {
    const onChange = jest.fn();
    await wrap(
      <Segmented
        value="a"
        onChange={onChange}
        options={[
          { value: 'a', label: 'A' },
          { value: 'b', label: 'B' },
        ]}
      />,
    );
    await fireEvent.press(screen.getByRole('radio', { name: 'B' }));
    expect(onChange).toHaveBeenCalledWith('b');
  });

  it('Select opens a sheet and picks an option', async () => {
    const onChange = jest.fn();
    await wrap(
      <Select
        label="Stage"
        value="x"
        onChange={onChange}
        placeholder="Choose"
        closeLabel="Close"
        options={[
          { value: 'x', label: 'Applied' },
          { value: 'y', label: 'Interview' },
        ]}
      />,
    );
    await fireEvent.press(screen.getByRole('button', { name: 'Stage: Applied' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Interview' }));
    expect(onChange).toHaveBeenCalledWith('y');
  });
});
