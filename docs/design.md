# Дизайн-токены

Источник правды в коде — `src/ui/tokens.ts`. Этот файл описывает те же значения словами. Холст с макетами держит владелец проекта; если макеты и токены разойдутся, правим токены здесь и в коде одним PR.

Тест `src/ui/tokens.test.ts` проверяет контраст: весь текст и подписи этапов — не ниже 4.5:1 (WCAG AA) в обеих темах.

## Цвета

Тёплая нейтральная гамма, один основной цвет (синий) и акцент (терракота).

| Токен | Светлая | Тёмная | Где |
|---|---|---|---|
| background | `#F6F5F2` | `#141413` | фон экранов |
| surface | `#FFFFFF` | `#1E1E1C` | карточки, поля, листы |
| surfaceAlt | `#EFEDE8` | `#282825` | чипы, поиск, полосы таблицы |
| surfacePressed | `#E7E4DD` | `#33322F` | нажатое состояние |
| border / borderStrong | `#E3E0D9` / `#C9C5BC` | `#34332F` / `#4A4843` | разделители |
| text | `#1A1A18` | `#F2F1EE` | основной текст |
| textMuted | `#5A5751` | `#B3B0A8` | вторичный текст |
| textSubtle | `#6E6A63` | `#9C988F` | подсказки, даты |
| primary / onPrimary | `#3450D1` / `#FFFFFF` | `#8EA2FF` / `#0E1330` | главные кнопки, ссылки, выбранное |
| accent / onAccent | `#C2461D` / `#FFFFFF` | `#FF8A5C` / `#2A0F04` | акцентная кнопка |
| danger | `#BF3029` | `#FF7B72` | удаление, ошибки |
| success / warning | `#2B7A4B` / `#9A5B00` | `#6FD39A` / `#F2B65A` | баннеры |

### Цвета этапов

Каждый цвет — пара «мягкий фон + насыщенный текст» для каждой темы: `slate`, `blue`, `teal`, `amber`, `violet`, `orange`, `green`, `red`, `pink`, `gray`. В базе этап хранит ключ цвета, а не hex, поэтому тема переключается без миграций.

## Типографика

Шрифт **Onest** (`@expo-google-fonts/onest`), начертания 400/500/600/700. Текст масштабируется системной настройкой; в тесных местах (чипы, бейджи) стоит предел `maxFontSizeMultiplier`.

| Вариант | Размер / строка | Начертание |
|---|---|---|
| display | 28 / 34 | Bold — заголовки вкладок |
| title | 22 / 28 | SemiBold |
| headline | 17 / 22 | SemiBold — заголовки секций |
| body / bodyStrong | 16 / 22 | Regular / Medium |
| callout | 15 / 20 | Regular |
| subhead | 14 / 19 | Medium — подписи полей |
| footnote | 13 / 18 | Regular |
| caption | 12 / 16 | Medium — чипы этапов |

## Отступы, радиусы, размеры

- Отступы: `xxs 2`, `xs 4`, `sm 8`, `md 12`, `lg 16`, `xl 20`, `xxl 24`, `xxxl 32`.
- Радиусы: `sm 6`, `md 10` (поля, кнопки), `lg 14` (карточки), `xl 20` (нижний лист), `pill`.
- Зона нажатия — не меньше 44 pt (`size.hit`). Поле и кнопка — 48, маленькая кнопка — 36 с расширенной зоной нажатия.
- Ширина столбцов таблицы: узкий 96, обычный 140, широкий 220.

## Компоненты

`src/ui`: Text, Button (primary, secondary, ghost, accent, danger, loading), IconButton, Card, Tag, StagePill, TextField, TextArea, Segmented, Select (нижний лист), BottomSheet, EmptyState, ListSection/ListRow, SwitchRow, Banner, Badge, Loading, Row/Stack, Screen, ScreenHeader. Все видны на витрине `/dev/ui` (Настройки → UI showcase в dev-сборке).
