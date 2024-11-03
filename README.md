# Simrata

A comprehensive web application for security analysis and scanning.

## Features

- Domain scanning and analysis
- LLM-powered security scanning
- Real-time dashboard
- Nuclei integration for vulnerability scanning
- Scheduled scans
- Mobile-responsive design

## Local Development with Docker

### Prerequisites for Docker Setup
- Docker installed on your system
- Git (optional, you can also download the source code directly)

### Docker Setup Steps

1. Clone the repository (if using Git):
   ```bash
   git clone <your-repo-url>
   cd simrata
   ```

2. Build the Docker image:
   ```bash
   docker build -t simrata .
   ```

3. Run the container with environment variables:
   ```bash
   docker run -d \
     -p 5173:5173 \
     --name simrata \
     -e VITE_SUPABASE_URL=https://facextdabmrqllgdzkms.supabase.co \
     -e VITE_SUPABASE_ANON_KEY=your_supabase_anon_key \
     simrata
   ```

   Note: Replace `your_supabase_anon_key` with your actual Supabase anon key.

4. Verify the container is running:
   ```bash
   docker ps
   ```

5. View container logs (optional):
   ```bash
   docker logs -f simrata
   ```

6. Access the application at `http://localhost:5173`

### Managing the Docker Container

To stop the container:
```bash
docker stop simrata
```

To start an existing container:
```bash
docker start simrata
```

To remove the container:
```bash
docker rm simrata
```

To remove the image:
```bash
docker rmi simrata
```

## Manual Installation

### Prerequisites for Manual Setup
- Node.js 20.x or later
- npm 9.x or later
- Git (optional, you can also download the source code directly)
- A text editor of your choice (VS Code recommended)
- Basic knowledge of terminal/command line operations

### Detailed Setup Steps

1. Clone the repository:
   ```bash
   git clone <your-repo-url>
   cd simrata
   ```

2. Install dependencies:
   ```bash
   npm install
   ```
   
   If you encounter any permission errors:
   ```bash
   npm install --legacy-peer-deps
   # or with sudo (not recommended)
   sudo npm install
   ```

3. Set up environment variables:
   
   Create a `.env` file in the root directory:
   ```bash
   touch .env
   ```
   
   Add the following variables to your `.env` file:
   ```
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

   Note: For development, you can use these values:
   ```
   VITE_SUPABASE_URL=https://facextdabmrqllgdzkms.supabase.co
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```
   
   The application will be available at `http://localhost:5173`

### Development Commands

- `npm run dev` - Start the development server
- `npm run build` - Create a production build
- `npm run preview` - Preview the production build locally
- `npm run lint` - Run ESLint to check code quality
- `npm run test` - Run tests (if configured)

### Troubleshooting Common Issues

1. Port 5173 already in use:
   ```bash
   # Find the process using the port
   lsof -i :5173
   # Kill the process
   kill -9 <PID>
   ```

2. Node modules issues:
   ```bash
   # Remove node_modules and reinstall
   rm -rf node_modules
   rm package-lock.json
   npm install
   ```

3. Environment variables not loading:
   - Ensure your `.env` file is in the root directory
   - Make sure variable names start with `VITE_`
   - Restart the development server

## Project Structure

```
simrata/
├── src/                    # Source code
│   ├── components/         # React components
│   ├── pages/             # Page components
│   ├── hooks/             # Custom React hooks
│   ├── integrations/      # Third-party integrations
│   └── types/             # TypeScript type definitions
├── public/                # Static assets
├── .env                   # Environment variables
└── package.json           # Project dependencies
```

## License

This project is licensed under the MIT License.