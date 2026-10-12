# JobTracker

Трекер откликов на вакансии для iOS и Android: делишься ссылкой — вакансия сама раскладывается по столбцам, этапы и напоминания ведут до оффера.

- Что строим: [`docs/PRD.md`](docs/PRD.md)
- Почему такой стек: [`docs/decisions/0001-stack.md`](docs/decisions/0001-stack.md)
- Правила для разработки (и для Claude Code): [`CLAUDE.md`](CLAUDE.md)
- Задачи: GitHub Issues и доска Project этого репозитория

## Что нужно на Mac

- Node.js LTS, Git
- Xcode (симулятор iPhone и сборки под iOS)
- Android Studio (Android SDK и эмулятор)
- GitHub CLI: `brew install gh`, затем `gh auth login`
- На iPhone — приложение Expo Go
- VS Code с расширением Claude Code

## Запуск

```bash
npm install
npx expo start
```

Отсканируй QR-код камерой iPhone — приложение откроется в Expo Go. `i` в терминале открывает симулятор iPhone, `a` — эмулятор Android.

Когда появятся нативные модули («Поделиться», покупки), понадобится development build:

```bash
npx expo run:ios --device     # через Xcode, бесплатная подпись (сборка живёт 7 дней)
# или, с аккаунтом Apple Developer:
npx eas build --profile development --platform ios
```

## Проверки

```bash
npm run check   # типы, линтер, тесты
```

## Бэклог

Исходный план — `backlog/BACKLOG.md`. Импорт в GitHub (метки, вехи, задачи, доска):

```bash
gh auth refresh -s project                      # один раз, права на доски
node scripts/create-backlog.mjs <owner>/<repo> --dry-run                    # посмотреть, что будет создано
node scripts/create-backlog.mjs <owner>/<repo> --project "JobTracker"       # создать
```

Скрипт можно запускать повторно: задачи с такими же названиями не дублируются.
