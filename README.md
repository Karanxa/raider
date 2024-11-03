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

1. Build the Docker image:
   ```bash
   docker build -t simrata .
   ```

2. Run the container:
   ```bash
   docker run -d -p 5173:5173 --name simrata simrata
   ```

3. Access the application at `http://localhost:5173`

To stop and remove the container:
```bash
docker stop simrata
docker rm simrata
```

## Manual Installation

1. Clone the repository:
   ```bash
   git clone <your-repo-url>
   cd simrata
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   Create a `.env` file with:
   ```
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

## License

This project is licensed under the MIT License.