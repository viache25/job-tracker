# Фикстуры парсера

**Сейчас здесь синтетические страницы**, собранные по известной разметке площадок (JSON-LD `JobPosting`, Open Graph, типичные заголовки). Реальные HTML по задаче #1 ещё не собраны: в облачной среде разработки нет доступа к сайтам вакансий.

Когда будут реальные страницы — кладите их сюда как `<площадка>-<что-проверяем>.html` (без личных данных) и добавляйте ожидания в `src/parser/fixtures.test.ts`.

| Файл | Что моделирует |
|---|---|
| `karriere-at-graph.html` | JSON-LD в `@graph`, адрес PostalAddress, зарплата по австрийскому закону в тексте |
| `greenhouse-basic.html` | JSON-LD c `hiringOrganization` строкой-объектом, описание в HTML-сущностях |
| `personio-salary-range.html` | `baseSalary` QuantitativeValue с min/max за год, `@type` массивом |
| `stepstone-array.html` | Несколько JSON-LD блоков, массив на верхнем уровне, BreadcrumbList рядом |
| `lever-meta-only.html` | Нет JSON-LD, только `og:title` «Должность – Компания» |
| `company-title-only.html` | Только `<title>` вида «Должность bei Компания \| Karriere» |
| `broken-jsonld.html` | Битый JSON-LD (управляющие символы, висячая запятая) + запасные мета-теги |
| `swiss-chf-remote.html` | `jobLocationType: TELECOMMUTE`, CHF, `applicantLocationRequirements` |
| `hourly-parttime.html` | Почасовая ставка `unitText: HOUR`, `PART_TIME` |
| `login-wall.html` | Страница входа без вакансии |
