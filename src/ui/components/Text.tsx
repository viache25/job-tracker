import { Text as RNText, type TextProps as RNTextProps } from 'react-native';

import { useTheme } from '../theme';
import { typography, type TextVariant, type ThemeColors } from '../tokens';

export type TextColor = keyof Pick<
  ThemeColors,
  | 'text'
  | 'textMuted'
  | 'textSubtle'
  | 'primary'
  | 'danger'
  | 'success'
  | 'warning'
  | 'onPrimary'
  | 'onAccent'
  | 'onDanger'
>;

export type TextProps = RNTextProps & {
  variant?: TextVariant;
  color?: TextColor;
  align?: 'left' | 'center' | 'right';
  /** Explicit foreground, e.g. a stage color. Prefer `color`. */
  tint?: string;
};

export function Text({ variant = 'body', color = 'text', align, tint, style, ...rest }: TextProps) {
  const { colors } = useTheme();
  return (
    <RNText
      {...rest}
      style={[
        typography[variant],
        { color: tint ?? colors[color] },
        align && { textAlign: align },
        style,
      ]}
    />
  );
}
