import * as WebBrowser from 'expo-web-browser';
import { Linking } from 'react-native';

import { LEGAL_LINKS } from './config';

export function openLegal(link: keyof typeof LEGAL_LINKS): void {
  const url = LEGAL_LINKS[link];
  if (url.startsWith('mailto:')) void Linking.openURL(url);
  else void WebBrowser.openBrowserAsync(url);
}
