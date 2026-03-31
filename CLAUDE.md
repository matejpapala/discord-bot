# Discord Bot "Pavel"

Czech Discord bot built with Node.js (CommonJS) and discord.js v14.

## Running

- Bot runs via **pm2** on a Raspberry Pi
- Deploy workflow: push to git → pull on RPi → `pm2 restart`
- Local dev: `node index.js`
- Lint: `npx eslint .`
- No test suite

## Project structure

```
index.js          — Entry point, command loader, cron jobs
database.js       — SQLite setup (better-sqlite3), schema definitions'
constants.js      — Constants for use in project
commands/
  economy/        — balance, daily
  fun/            — sayHi, sayGoodnight, sendImage
  gamble/         — blackjack, dices, slots
  util/           — banik (football scores), lfg (looking for group)
```

## Command pattern

Every command file exports `{ data, execute }`:
- `data` — slash command definition (name, description, options)
- `execute(interaction)` — command handler

## Language conventions

- **User-facing text** (replies, embeds, descriptions): Czech
- **Code, variable names, comments, error logs**: English

## Database

SQLite via better-sqlite3 with WAL mode. Two tables:

- `users` — user_id, balance, daily_last_claimed, total_gambled, biggest_win, months_won
- `archived_messages` — message_id, author_id, content, saved_at

**Important: Always ask before running any database schema changes. Describe the exact SQL that will be executed and wait for approval.**

## Environment variables (.env)

- `DISCORD_TOKEN` — Discord bot token
- `FLASHSCORE_API_KEY` — API key for football data (used in banik command)
