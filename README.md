# Telegram ProfTest Bot

This is a Telegram bot designed to help users (primarily students) determine their professional interests and inclinations by offering various psychological and career-oriented tests. The bot supports different grade groups and provides tailored test methodologies for each group.

## Features

- Interactive Telegram bot interface
- Multiple test methodologies for different grade groups (1-4, 5-7, 8-9, 10-11)
- Session management for users
- Inline keyboard navigation
- Modular handler structure for different tests

## Setup

1. **Clone the repository:**

   ```bash
   git clone <repo-url>
   cd telegram-proftest-bot
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Configure environment variables:**
   - Create a `.env` file in the root directory.
   - Add your Telegram bot token:

     ```env
     BOT_TOKEN=your-telegram-bot-token
     ```

4. **Run the bot:**

   ```bash
   npm start
   ```

   Or, for development with auto-reload:

   ```bash
   npm run dev
   ```

## Project Structure

- `src/bot.ts` - Main bot logic and entry point
- `src/handlers/` - Handlers for different test types
- `src/data/` - Test data for each methodology
- `src/tests.ts` - Test definitions and utilities

## License

See [LICENSE](LICENSE) for license information.
