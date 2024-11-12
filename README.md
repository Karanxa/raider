# Raider

A comprehensive web application for security analysis and scanning, designed to help security professionals and developers identify vulnerabilities and potential security risks.

## Features

- **Domain Scanning and Analysis**
  - Subdomain enumeration
  - JavaScript file discovery
  - Endpoint detection
  - Live domain verification

- **LLM-powered Security Scanning**
  - AI-driven vulnerability assessment
  - Custom prompt engineering
  - Multiple LLM provider support
  - Batch scanning capabilities

- **Real-time Dashboard**
  - Live scan results
  - Interactive data visualization
  - Detailed findings reports
  - Export capabilities

- **Nuclei Integration**
  - Automated vulnerability scanning
  - Custom template support
  - Severity-based categorization
  - Detailed vulnerability reports

- **Additional Features**
  - Dark/light theme support
  - Real-time chat support
  - Data export capabilities
  - Team collaboration

## Quick Start

### Prerequisites

- Node.js 18.x or higher
- npm 9.x or higher
- A Supabase account and project

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/raider.git
   cd raider
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables in `.env`:
   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. Start development server:
   ```bash
   npm run dev
   ```

## Technology Stack

- **Frontend**: React with TypeScript
- **UI Components**: shadcn/ui
- **Styling**: Tailwind CSS
- **State Management**: TanStack Query
- **Backend**: Supabase
- **Authentication**: Supabase Auth
- **Database**: PostgreSQL (via Supabase)
- **Build Tool**: Vite

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## License

MIT License - see the [LICENSE](LICENSE) file for details