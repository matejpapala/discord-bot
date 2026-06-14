# Pavel — Discord Bot

Pavel is a Czech-language Discord bot built with [discord.js](https://discord.js.org/) v14 on Node.js. It combines a small coin-based economy, a set of gambling games, and a few handy utilities (football results, looking-for-group, game price tracking).

User-facing messages are in Czech; the codebase is in English.

## Features

### Economy
- `/balance` — Show your coin balance (creates an account on first use).
- `/daily` — Claim 50 coins once per day.
- `/top` — Leaderboard of the top 5 gamblers this month.

A monthly cron job announces the top gambler, increments their win count, and resets the monthly totals.

### Gambling
- `/blackjack <sazka>` — Full blackjack with hit/stand buttons.
- `/dices <sazka>` — Bet on the dice sum (under / exactly / over 7).
- `/ruleta <sazka>` — European roulette: red/black & even/odd pay 2x, an exact number pays 35x (entered via modal).
- `/slots <sazka>` — Fruit-machine slots (minimum bet 10), with a 50x jackpot.

> Gambling results sent outside the designated gamble channel are auto-deleted after 15 seconds to keep other channels clean.

### Fun
- `/ahoj` — Greets the user.
- `/dobrounoc` — Wishes everyone goodnight.
- `/obrazek` — Sends a random image.

### Utility
- `/banik` — FC Baník Ostrava results and upcoming fixtures (FlashScore API).
- `/lfg <hra> [hracu]` — Post a looking-for-group request with join/leave buttons.
- `/wishlist` — Show your game wishlist with live prices (CheapShark).
- `/wishlist-add <nazev>` — Search for a game and add it via a dropdown.
- `/wishlist-remove` — Remove a game from the wishlist via a dropdown.

A daily cron job (10:00 Prague time) notifies the general channel about wishlist deals that are at least 20% off.

## Tech stack

- **Node.js** (CommonJS)
- **discord.js** v14
- **better-sqlite3** — local SQLite storage (WAL mode)
- **node-cron** — scheduled jobs
- **dotenv** — environment configuration

## Getting started

### Prerequisites
- Node.js (18+ recommended)
- A Discord bot token ([Discord Developer Portal](https://discord.com/developers/applications))

### Installation

```bash
git clone <repo-url>
cd discord-bot
npm install
```

### Configuration

Create a `.env` file in the project root:

```env
DISCORD_TOKEN=your_discord_bot_token
FLASHSCORE_API_KEY=your_flashscore_api_key
```

| Variable | Required | Purpose |
|---|---|---|
| `DISCORD_TOKEN` | Yes | Discord bot authentication |
| `FLASHSCORE_API_KEY` | For `/banik` | Football results/fixtures via the FlashScore API |

Channel IDs are configured in `constants.js`.

### Running

```bash
node index.js
```

The SQLite database (`database.sqlite`) is created automatically on first run. Slash commands are auto-loaded recursively from the `commands/` directory.

In production the bot runs on a Raspberry Pi under [pm2](https://pm2.keymetrics.io/):

```bash
# deploy workflow
git pull
pm2 restart discord-bot
```

### Linting

```bash
npx eslint .
```

## Project structure

```
index.js          — Entry point: command loader and cron jobs
database.js       — SQLite setup and schema
constants.js      — Channel IDs
commands/
  economy/        — /balance, /daily, /top
  fun/            — /ahoj, /dobrounoc, /obrazek
  gamble/         — /blackjack, /dices, /ruleta, /slots
  util/           — /banik, /lfg, /wishlist, /wishlist-add, /wishlist-remove
cron/             — Scheduled jobs (wishlist deal checks)
```

## External APIs

- **CheapShark** (`cheapshark.com/api/1.0`) — game price tracking (no API key required).
- **FlashScore** (`api.sportdb.dev`) — football results and fixtures (requires `FLASHSCORE_API_KEY`).
