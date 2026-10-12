import { render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';

it('renders a component', async () => {
  await render(<Text>Hello</Text>);
  expect(screen.getByText('Hello')).toBeTruthy();
});
