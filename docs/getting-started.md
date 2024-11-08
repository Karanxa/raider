# Getting Started with Raider

## Prerequisites

- Node.js 18.x or higher
- npm 9.x or higher
- A Supabase account and project

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/raider.git
   cd raider
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   Create a `.env` file in the root directory with:
   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

## First Steps

1. Create an account or sign in
2. Configure your API keys in Settings
3. Start with a basic security scan

## Configuration

### API Keys
Configure your API keys in the Settings page:
- OpenAI API key for LLM scanning
- GitHub token for repository scanning
- Custom API endpoints

### Notification Settings
Set up notifications through:
- Email
- Slack
- Custom webhooks

## Usage Examples

### Running Your First Scan
```typescript
// Example of using the LLM Scanner
const scanner = new LLMScanner({
  apiKey: 'your-api-key',
  model: 'gpt-4o'
});

await scanner.analyze(prompt);
```