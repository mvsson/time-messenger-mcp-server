# time-messenger-mcp-server

MCP (Model Context Protocol) сервер для корпоративного мессенджера [Time Messenger](https://time-messenger.ru/) (на базе Mattermost) от Т-Банка.

Позволяет AI-ассистентам (Claude, OpenCode и др.) работать с Time Messenger: читать и отправлять сообщения, управлять тредами, искать каналы и пользователей, отслеживать непрочитанные сообщения.

## Установка

Только из исходников — собирайте из запиненного коммита этого форка и запускайте
`node dist/index.js`. Установка через `npx`/`npm -g` намеренно не поддерживается:
она тянула бы стороннюю/устаревшую версию из npm в обход аудита и хардненинга
(см. [SECURITY_AUDIT.md](SECURITY_AUDIT.md)).

```bash
git clone https://github.com/mvsson/time-messenger-mcp-server.git
cd time-messenger-mcp-server
npm install
npm run build
node dist/index.js
```

## Настройка

### Переменные окружения

| Переменная | Описание | Обязательно |
|---|---|---|
| `TIME_URL` | URL вашего экземпляра Time Messenger | Да |
| `TIME_TOKEN` | Personal Access Token | Один из способов |
| `TIME_LOGIN_ID` | Email или логин | Один из способов |
| `TIME_PASSWORD` | Пароль | Вместе с LOGIN_ID |
| `TIME_ALLOW_WRITE` | Включить инструменты записи (по умолчанию `false`) | Нет |
| `TIME_REQUEST_TIMEOUT_MS` | Таймаут запроса к API, мс (по умолчанию `30000`) | Нет |
| `TIME_USER_AGENT` | Переопределить User-Agent (по умолчанию браузерный — для обхода WAF) | Нет |

### Безопасность (хардненинг этого форка)

Этот форк усилен по результатам [аудита безопасности](SECURITY_AUDIT.md):

- **Read-only по умолчанию.** Инструменты записи (`send_message`, `follow_thread`,
  `unfollow_thread`, `mark_thread_read`) отключены, пока не задан
  `TIME_ALLOW_WRITE=true`. Это ограничивает радиус поражения prompt-injection:
  чужое сообщение, прочитанное моделью, не сможет ничего отправить от вашего имени.
- **Таймаут сети.** Все запросы ограничены `AbortController` (`TIME_REQUEST_TIMEOUT_MS`,
  по умолчанию 30с) — зависший апстрим не подвесит MCP-вызов.
- **Лимит пагинации.** `per_page` ограничен диапазоном 1–200 (защита от раздувания контекста).
- **Кодирование путей.** Все ID проходят `encodeURIComponent` — параметр с `../`/`?`/`#`
  не может переехать на другой API-эндпоинт.
- **Обрезка ошибок.** Текст ошибок API, уходящий в модель, ограничен по длине.
- **Цепочка поставок.** Запускайте сборку из запиненного коммита этого форка
  (`node dist/index.js`), а не `npx -y` — чтобы исключить авто-подтягивание будущих версий.
- **Совместимость с WAF.** Запросы шлются с браузерным `User-Agent` (переопределяемо
  через `TIME_USER_AGENT`) — некоторые инсталляции за WAF молча роняют не-браузерные UA.
- **MFA/2FA.** Распознаётся любой `mfa.*`-ответ сервера на логин без кода (не только
  `mfa.totp_required`), после чего используйте инструмент `login_with_mfa`.

> Если включаете `TIME_ALLOW_WRITE=true`, полагайтесь на подтверждение вызова инструмента
> в UI MCP-клиента (Claude Desktop / Claude Code) как на human-in-the-loop для записи.

### Способ 1: Personal Access Token (рекомендуется)

Personal Access Token — постоянный токен, который не истекает.

**Как получить:**

1. Откройте Time Messenger в браузере
2. Аватарка → **Настройки аккаунта** → **Безопасность** → **Персональные токены доступа**
3. Создайте токен с описанием "MCP Server"
4. Скопируйте токен (показывается только один раз!)

### Способ 2: Логин и пароль

Токен сессии получается автоматически. Если включена MFA — потребуется ввести код через tool `login_with_mfa`.

### Способ 3: OAuth2

Только для веб-приложений (требует браузерный редирект). [Документация](https://docs.time-messenger.ru/integrations/oauth2_service_provider)

## Интеграция с AI-клиентами

### Claude Desktop

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`

**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

С токеном:
```json
{
  "mcpServers": {
    "time": {
      "command": "node",
      "args": ["/absolute/path/to/time-messenger-mcp-server/dist/index.js"],
      "env": {
        "TIME_URL": "https://your-instance.time-messenger.ru",
        "TIME_TOKEN": "your_token_here"
      }
    }
  }
}
```

С логином/паролем:
```json
{
  "mcpServers": {
    "time": {
      "command": "node",
      "args": ["/absolute/path/to/time-messenger-mcp-server/dist/index.js"],
      "env": {
        "TIME_URL": "https://your-instance.time-messenger.ru",
        "TIME_LOGIN_ID": "your@email.com",
        "TIME_PASSWORD": "your_password"
      }
    }
  }
}
```

### OpenCode

`~/.config/opencode/opencode.json`:

```json
{
  "mcp": {
    "time": {
      "type": "local",
      "command": ["node", "/absolute/path/to/time-messenger-mcp-server/dist/index.js"],
      "enabled": true,
      "environment": {
        "TIME_URL": "https://your-instance.time-messenger.ru",
        "TIME_TOKEN": "your_token_here"
      }
    }
  }
}
```

### Любой MCP-совместимый клиент

```bash
node /absolute/path/to/time-messenger-mcp-server/dist/index.js
```

Сервер использует stdio transport — стандартный для MCP.

## Доступные инструменты

### Аутентификация

| Инструмент | Описание |
|---|---|
| `login_with_mfa` | Ввести MFA код при двухфакторной авторизации |

### Сообщения

| Инструмент | Описание |
|---|---|
| `send_message` | Отправить сообщение в канал или ответить в треде |
| `get_channel_messages` | Получить сообщения из канала (с пагинацией) |
| `get_thread_messages` | Получить все сообщения в треде |
| `search_messages` | Поиск сообщений в команде |

### Треды

| Инструмент | Описание |
|---|---|
| `list_threads` | Список отслеживаемых тредов в команде |
| `get_thread_stats` | Статистика непрочитанных тредов |
| `get_thread` | Информация о конкретном треде |
| `follow_thread` | Начать отслеживание треда |
| `unfollow_thread` | Прекратить отслеживание треда |
| `mark_thread_read` | Отметить тред как прочитанный |

### Каналы

| Инструмент | Описание |
|---|---|
| `list_channels` | Список каналов в команде |
| `get_channel` | Информация о канале |
| `search_channels` | Поиск каналов |
| `get_channel_unread` | Непрочитанные сообщения в канале |

### Команды

| Инструмент | Описание |
|---|---|
| `list_teams` | Список команд пользователя |
| `get_team` | Информация о команде |
| `get_teams_unread` | Непрочитанные во всех командах |
| `get_team_unread` | Непрочитанные в конкретной команде |

### Пользователи

| Инструмент | Описание |
|---|---|
| `get_me` | Информация о текущем пользователе |
| `get_user` | Информация о пользователе по ID |
| `search_users` | Поиск пользователей |

## MFA (двухфакторная аутентификация)

Если на вашем аккаунте включена MFA:

1. При первом запросе получите ошибку: `MFA verification required`
2. Используйте инструмент `login_with_mfa` с 6-значным кодом из аутентификатора
3. После успешного ввода все инструменты будут работать до конца сессии

## Разработка

```bash
# Установка зависимостей
npm install

# Сборка
npm run build

# Разработка
npm run dev

# Проверка типов
npm run typecheck
```

## Структура проекта

```
src/
├── index.ts              # MCP сервер
├── client/
│   └── time-client.ts    # Time API клиент
├── tools/
│   ├── auth.ts           # MFA аутентификация
│   ├── messages.ts       # Сообщения
│   ├── threads.ts        # Треды
│   ├── channels.ts       # Каналы
│   ├── teams.ts          # Команды
│   ├── users.ts          # Пользователи
│   └── types.ts          # Типы инструментов
└── types/
    └── time-api.ts       # TypeScript типы для Time API
```

## API документация

- [Time Messenger API v4](https://docs.time-messenger.ru/api/v4/введение)
- [Time Messenger API v5](https://docs.time-messenger.ru/api/v5/errors)

## Требования

- Node.js 18+

## Лицензия

MIT
