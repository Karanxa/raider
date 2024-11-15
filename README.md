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

- **Scheduled Scans**
  - Automated recurring scans
  - Customizable schedules
  - Email notifications
  - Scan history tracking

- **Additional Features**
  - Mobile-responsive design
  - Dark/light theme support
  - Real-time chat support
  - Data export capabilities

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
   VITE_SUPABASE_URL=https://facextdabmrqllgdzkms.supabase.co
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. Start development server:
   ```bash
   npm run dev
   ```

## Project Structure

```
raider/
├── src/                    # Source code
│   ├── components/         # Reusable React components
│   │   ├── ui/            # UI components (buttons, cards, etc.)
│   │   └── ...            # Feature-specific components
│   ├── pages/             # Page components
│   ├── hooks/             # Custom React hooks
│   ├── integrations/      # Third-party service integrations
│   ├── types/             # TypeScript type definitions
│   └── utils/             # Utility functions
├── public/                # Static assets
├── supabase/             # Supabase configuration and functions
└── .env                  # Environment variables
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Create production build
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Technology Stack

- **Frontend Framework**: React with TypeScript
- **UI Components**: shadcn/ui
- **Styling**: Tailwind CSS
- **State Management**: TanStack Query
- **Backend**: Supabase
- **Authentication**: Supabase Auth
- **Database**: PostgreSQL (via Supabase)
- **Build Tool**: Vite

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## Security

For security concerns, please email [security@yourdomain.com](mailto:security@yourdomain.com)

## License

MIT License - see the [LICENSE](LICENSE) file for details

## Support

For support, email [support@yourdomain.com](mailto:support@yourdomain.com) or open an issue in the repository.