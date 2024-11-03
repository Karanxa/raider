# Use Node.js LTS version as the base image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy project files
COPY . .

# Build the application
RUN npm run build

# Expose port 5173 (Vite's default port)
EXPOSE 5173

# Start the application
CMD ["npm", "run", "dev", "--", "--host"]