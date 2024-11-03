# Use Node.js LTS version as the base image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Install dependencies first (for better caching)
COPY package*.json ./
RUN npm install

# Copy project files
COPY . .

# Create .env file from example if it doesn't exist
RUN touch .env

# Set default environment variables (these can be overridden at runtime)
ENV VITE_SUPABASE_URL=https://facextdabmrqllgdzkms.supabase.co
ENV VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZhY2V4dGRhYm1ycWxsZ2R6a21zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzA2MjcyMjMsImV4cCI6MjA0NjIwMzIyM30.GouDaqFh1hacbylYiHDHtsjSwKYX6lCIl0chwX2y0gI

# Expose port 5173 (Vite's default port)
EXPOSE 5173

# Start the development server with host set to 0.0.0.0 and with --strictPort
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--strictPort"]