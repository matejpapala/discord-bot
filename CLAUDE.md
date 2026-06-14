# Discord Bot "Pavel"

Czech Discord bot built with Node.js (CommonJS) and discord.js v14.

**Important: Whenever a new command or feature is added to the bot, update `README.md` to document it (command list, features section, and project structure as relevant).**

## Running

- Bot runs via **pm2** on a Raspberry Pi
- Deploy workflow: push to git → pull on RPi → `pm2 restart`
- Local dev: `node index.js`
- Lint: `npx eslint .`
- No test suite

## Project structure

```
index.js                  — Entry point, command loader, cron jobs
database.js               — SQLite setup (better-sqlite3), schema definitions
constants.js              — GAMBLE_CHANNEL_ID, GENERAL_CHANNEL_ID
commands/
  economy/
    balance.js            — /balance — show user balance (creates account if missing)
    daily.js              — /daily  — claim 50 coins once per day
    top.js                — /top    — top 5 gamblers leaderboard this month
  fun/
    sayHi.js              — /ahoj        — greet the user
    sayGoodnight.js       — /dobrounoc   — wish goodnight (roasts one specific user ID)
    sendImage.js          — /obrazek     — send a random image from commands/images/
  gamble/
    blackjack.js          — /blackjack <sazka> — full blackjack with hit/stand buttons
    dices.js              — /dices <sazka>     — bet on dice sum (under/exactly/over 7)
    roulette.js           — /ruleta <sazka>    — European roulette (red/black, even/odd 2x, exact number 35x via modal)
    slots.js              — /slots <sazka>     — fruit machine (min 10), jackpot 50x
  util/
    banik.js              — /banik             — FC Banik Ostrava results + fixtures (FlashScore API)
    lfg.js                — /lfg <hra> [hracu] — looking-for-group with join/leave buttons
    wishlist.js           — /wishlist          — show wishlist with live prices (CheapShark)
    wishlist-add.js       — /wishlist-add <nazev> — search & add game via dropdown
    wishlist-remove.js    — /wishlist-remove   — remove game via dropdown (ephemeral)
cron/
  wishlistCheck.js        — Daily 10:00 Prague time: notify new deals ≥20% off
```

## Command pattern

Every command file exports `{ data, execute }`:
- `data` — slash command definition (name, description, options). Option `type: 4` = INTEGER, `type: 3` = STRING.
- `execute(interaction)` — async command handler

Commands are auto-loaded recursively from `commands/` subdirectories in `index.js`.

## Gamble channel behavior

If a gamble result is sent **outside** `GAMBLE_CHANNEL_ID`, the message is auto-deleted after 15 seconds. In-channel messages persist. This applies to blackjack, dices, and slots.

## Button/component collectors

Gambling commands use `createMessageComponentCollector` with:
- `filter: (i) => i.user.id === userId` — only the invoker can interact
- `time: 60000` — 60s timeout; on timeout the reply is deleted and an ephemeral message is sent

LFG uses a 1-hour collector on the public message. No user filter — anyone can join/leave.

## Database

SQLite via better-sqlite3 with WAL mode.

| Table | Columns |
|---|---|
| `users` | user_id, balance (default 100), daily_last_claimed, total_gambled, biggest_win, months_won |
| `archived_messages` | message_id, author_id, content, saved_at |
| `metadata` | key, value — used for `last_monthly_reset` tracking |
| `wishlist_games` | game_id (CheapShark), title, thumb, added_by, added_at |
| `wishlist_notifications` | game_id, deal_id, notified_at, price — dedup to avoid re-notifying |

User accounts are created lazily on first use of `/balance` or `/daily`. Gamble commands require an existing account.

**Important: Always ask before running any database schema changes. Describe the exact SQL that will be executed and wait for approval.**

## Cron jobs (index.js)

- `0 * 1 * *` — Monthly reset on the 1st: announce top gambler to GENERAL_CHANNEL_ID, increment their `months_won`, reset all `total_gambled` to 0.
- `0 10 * * *` — Daily wishlist check at 10:00 Prague time. Notifies GENERAL_CHANNEL_ID of deals ≥20% off. Deduped via `wishlist_notifications`. Old entries cleaned up after 30 days.

## External APIs

- **FlashScore** (`api.sportdb.dev`) — football results and fixtures. Requires `FLASHSCORE_API_KEY` env var.
- **CheapShark** (`cheapshark.com/api/1.0`) — game price tracking (no API key needed). Used by all wishlist commands.

## Environment variables (.env)

- `DISCORD_TOKEN` — Discord bot token
- `FLASHSCORE_API_KEY` — API key for football data (used in banik command)

## Language conventions

- **User-facing text** (replies, embeds, descriptions): Czech
- **Code, variable names, comments, error logs**: English
