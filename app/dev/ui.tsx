import { Redirect } from 'expo-router';
import { Briefcase, Inbox, MapPin, Plus, Search, Trash } from 'lucide-react-native';
import { useState } from 'react';

import {
  Badge,
  Banner,
  Button,
  Card,
  EmptyState,
  IconButton,
  ListRow,
  ListSection,
  Row,
  Screen,
  Segmented,
  Select,
  STAGE_COLORS,
  StageDot,
  StagePill,
  Stack,
  SwitchRow,
  Tag,
  Text,
  TextArea,
  TextField,
  typography,
  type TextVariant,
} from '@/ui';

/**
 * Component showcase. Dev builds only; developer-facing, so strings are not translated.
 */
export default function UiShowcase() {
  const [segment, setSegment] = useState<'a' | 'b' | 'c'>('a');
  const [select, setSelect] = useState<string>('wishlist');
  const [toggle, setToggle] = useState(true);
  const [chip, setChip] = useState(true);
  if (!__DEV__) return <Redirect href="/" />;

  return (
    <Screen scroll>
      <Section title="Text">
        {(Object.keys(typography) as TextVariant[]).map((variant) => (
          <Text key={variant} variant={variant}>
            {variant} · Frontend Entwickler:in
          </Text>
        ))}
        <Text color="textMuted">textMuted</Text>
        <Text color="textSubtle">textSubtle</Text>
      </Section>

      <Section title="Button">
        <Button label="Primary" onPress={() => undefined} />
        <Button label="Secondary" variant="secondary" icon={Plus} onPress={() => undefined} />
        <Button label="Ghost" variant="ghost" onPress={() => undefined} />
        <Button label="Accent" variant="accent" onPress={() => undefined} />
        <Button label="Danger" variant="danger" icon={Trash} onPress={() => undefined} />
        <Button label="Loading" loading />
        <Button label="Disabled" disabled />
        <Row>
          <Button label="Small" size="small" onPress={() => undefined} />
          <Button
            label="Small secondary"
            size="small"
            variant="secondary"
            onPress={() => undefined}
          />
        </Row>
        <Row>
          <IconButton icon={Search} accessibilityLabel="Search" onPress={() => undefined} />
          <IconButton
            icon={Plus}
            accessibilityLabel="Add"
            variant="filled"
            onPress={() => undefined}
          />
          <IconButton
            icon={Briefcase}
            accessibilityLabel="Selected"
            selected
            onPress={() => undefined}
          />
        </Row>
      </Section>

      <Section title="Tags & stages">
        <Row wrap>
          <Tag label="Wien" icon={MapPin} />
          <Tag label="React" />
          <Tag label="Filter chip" selected={chip} onPress={() => setChip(!chip)} />
          <Badge label="JSON-LD" tone="primary" />
          <Badge label="manual" />
        </Row>
        <Row wrap>
          {STAGE_COLORS.map((color) => (
            <StagePill key={color} label={color} color={color} />
          ))}
        </Row>
      </Section>

      <Section title="Inputs">
        <TextField label="Company" placeholder="ACME GmbH" required />
        <TextField label="With error" value="" error="Required field" />
        <TextField label="With icon" icon={Search} placeholder="Search" hint="Hint text" />
        <TextArea label="Notes" placeholder="Anything worth remembering" />
        <Segmented
          value={segment}
          onChange={setSegment}
          options={[
            { value: 'a', label: 'On-site' },
            { value: 'b', label: 'Hybrid' },
            { value: 'c', label: 'Remote' },
          ]}
        />
        <Select
          label="Stage"
          value={select}
          onChange={setSelect}
          placeholder="Choose"
          closeLabel="Close"
          options={[
            { value: 'wishlist', label: 'Wishlist', left: <StageDot color="slate" /> },
            { value: 'applied', label: 'Applied', left: <StageDot color="blue" /> },
            { value: 'interview', label: 'Interview', left: <StageDot color="orange" /> },
          ]}
        />
      </Section>

      <Section title="Lists">
        <ListSection title="Section" count={3} footer="Footer text">
          <ListRow title="Row with chevron" value="Value" onPress={() => undefined} />
          <ListRow title="Row with subtitle" subtitle="Subtitle" />
          <SwitchRow label="Switch" value={toggle} onChange={setToggle} />
          <ListRow title="Destructive" destructive onPress={() => undefined} last />
        </ListSection>
      </Section>

      <Section title="Feedback">
        <Banner
          tone="success"
          title="All fields found"
          body="Title, company and salary came from the page."
        />
        <Banner tone="warning" title="Partly found" body="Please check the highlighted fields." />
        <Banner tone="error" title="Page not available" body="Paste the text instead.">
          <Button label="Paste text" size="small" variant="secondary" onPress={() => undefined} />
        </Banner>
        <Card>
          <EmptyState
            icon={Inbox}
            title="No applications yet"
            body="Share a vacancy link or add one by hand."
            actionLabel="Add"
            onAction={() => undefined}
          />
        </Card>
      </Section>
    </Screen>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Stack gap="md">
      <Text variant="title">{title}</Text>
      {children}
    </Stack>
  );
}
