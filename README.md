## HH Hack 2025 Backend

Backend service for aggregating and summarizing news feeds. Built with NestJS.

## Быстрый старт

```bash
pnpm install
pnpm run dev
```

Сервис поднимается на `http://localhost:3000`. Swagger UI доступен по `http://localhost:3000/swagger-ui`.

## Конфигурация

Переменные в `.env`:

| Переменная | Назначение | Значение по умолчанию |
| --- | --- | --- |
| `OLLAMA_ENABLED` | Включить генерацию через локальную LLM | `true` |
| `OLLAMA_HOST` | Endpoint Ollama API | `http://127.0.0.1:11434` |
| `OLLAMA_MODEL` | Имя модели | `llama3.1:8b` |
| `OLLAMA_TEMPERATURE` | Температура модели | `0.2` |
| `OLLAMA_TIMEOUT_MS` | Таймаут запроса к Ollama | `15000` |
| `FALLBACK_CHAR_LIMIT` | Макс. длина fallback-резюме | `420` |
| `SUMMARIZER_MIN_LENGTH` | Минимальная длина текста для обращения к LLM | `40` |

Если Ollama недоступна или отключена, сервис возвращает сокращённый текст по простому эвристическому алгоритму.

## Локальный запуск Ollama

1. Установите [Ollama](https://ollama.com/download).
2. Скачайте модель:

```bash
ollama pull llama3.1:8b
```

3. Запустите сервер (обычно стартует автоматически):

```bash
ollama serve
```

Теперь бэкенд будет отправлять запросы к `http://127.0.0.1:11434/api/generate`.

## Запуск в Docker

```bash
docker build -t hh-hack-backend .
docker run --rm -p 3000:3000 --env-file .env hh-hack-backend
```

Убедитесь, что контейнер имеет доступ к Ollama (например, пробросьте порт 11434 с хоста).

## Тесты

```bash
pnpm run test
```
