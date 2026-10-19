# Job Tracker

[![CI](https://github.com/viache25/job-tracker/actions/workflows/ci.yml/badge.svg)](https://github.com/viache25/job-tracker/actions/workflows/ci.yml)

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

В Expo Go работает всё, кроме рекламы и покупок: их нативного кода там нет, и приложение просто показывается без рекламы.

## Сборки в облаке (EAS)

Xcode не нужен: EAS собирает в облаке Expo. Профили — в [`eas.json`](eas.json).

```bash
npm install -g eas-cli
eas login                      # аккаунт Expo @viache25
eas init                       # один раз: создаёт проект в Expo и пишет его id в app.json
eas build -p android --profile preview       # APK с тестовой рекламой — поставить на телефон
eas build -p android --profile production    # AAB для Google Play
eas build -p ios --profile production        # нужен Apple Developer; сертификаты EAS сделает сам
eas submit -p android                        # отправка в стор (ключ сервисного аккаунта Google)
eas submit -p ios                            # отправка в App Store Connect / TestFlight
```

Перед релизом:

1. App ID AdMob (`app.json`) и ID рекламных блоков (`src/features/monetization/config.ts`) уже боевые. В dev-сборках реклама всегда тестовая; на свою настоящую рекламу не нажимать.
2. В EAS → Environment variables задать `EXPO_PUBLIC_REVENUECAT_IOS_KEY`, `EXPO_PUBLIC_REVENUECAT_ANDROID_KEY`, `EXPO_PUBLIC_SENTRY_DSN` (образец — `.env.example`). Для source maps в Sentry — секрет `SENTRY_AUTH_TOKEN` и убрать `SENTRY_DISABLE_AUTO_UPLOAD` из `eas.json`.

Как устроены реклама и покупка — [`docs/decisions/0004-monetization-ads.md`](docs/decisions/0004-monetization-ads.md).

## Web-превью

`npx expo start --web` подходит для быстрого взгляда на вёрстку (`/dev/ui`, настройки). Открывайте не корень, а, например, `http://localhost:8081/settings`: заголовки cross-origin isolation, нужные SQLite в браузере, ставятся на эти пути. Web-версия expo-sqlite нестабильна на синхронных запросах, поэтому экраны с данными проверяем на iPhone или в симуляторе. Разбор ссылок в браузере не работает из-за CORS — только на телефоне.

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
