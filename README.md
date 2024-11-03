# Simrata

A comprehensive web application for security analysis and scanning.

## Features

- Domain scanning and analysis
- LLM-powered security scanning
- Real-time dashboard
- Nuclei integration for vulnerability scanning
- Scheduled scans
- Mobile-responsive design

## Setup Options

### 1. WSL (Windows Subsystem for Linux) Setup

1. Install WSL if not already installed:
   ```powershell
   wsl --install
   ```

2. Install Ubuntu from Microsoft Store (recommended) or via command:
   ```powershell
   wsl --install -d Ubuntu
   ```

3. Open Ubuntu terminal and navigate to your project directory:
   ```bash
   cd /mnt/c/your/project/path
   ```

4. Install Node.js and npm:
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```

5. Clone and setup the project:
   ```bash
   git clone <your-repo-url>
   cd simrata
   npm install
   ```

6. Create .env file and add Supabase credentials:
   ```bash
   echo "VITE_SUPABASE_URL=https://facextdabmrqllgdzkms.supabase.co" >> .env
   echo "VITE_SUPABASE_ANON_KEY=your_supabase_anon_key" >> .env
   ```

7. Start the development server:
   ```bash
   npm run dev
   ```

### 2. Docker Setup

1. Build the Docker image:
   ```bash
   docker build -t simrata .
   ```

2. Run the container:
   ```bash
   docker run -d \
     -p 5173:5173 \
     --name simrata \
     -e VITE_SUPABASE_URL=https://facextdabmrqllgdzkms.supabase.co \
     -e VITE_SUPABASE_ANON_KEY=your_supabase_anon_key \
     simrata
   ```

### 3. Manual Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up environment variables in `.env`:
   ```
   VITE_SUPABASE_URL=https://facextdabmrqllgdzkms.supabase.co
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

3. Start development server:
   ```bash
   npm run dev
   ```

## Development Commands

- `npm run dev` - Start development server
- `npm run build` - Create production build
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Project Structure

```
simrata/
├── src/              # Source code
│   ├── components/   # React components
│   ├── pages/        # Page components
│   ├── hooks/        # Custom React hooks
│   ├── integrations/ # Third-party integrations
│   └── types/        # TypeScript definitions
├── public/           # Static assets
└── .env             # Environment variables
```

## License

MIT License