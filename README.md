# Domain Reconnaissance Tool

A comprehensive web application for domain reconnaissance, LLM scanning, and security analysis.

## Features

- Domain scanning and analysis
- LLM-powered security scanning
- Real-time dashboard
- Nuclei integration for vulnerability scanning
- Scheduled scans
- Mobile-responsive design

## Prerequisites

- Node.js 20 or later
- npm or yarn package manager
- A Supabase account for backend services

## Installation

1. Clone the repository:
   ```bash
   git clone <your-repo-url>
   cd domain-reconnaissance
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up Supabase:
   - Create a new Supabase project at [https://supabase.com](https://supabase.com)
   - Copy your project URL and anon key from Project Settings -> API
   - Create a `.env` file in the root directory with the following variables:
   ```
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. Set up the database:
   - Go to the SQL editor in your Supabase dashboard
   - Run the following SQL commands to create the necessary tables:

   ```sql
   -- Create profiles table
   create table profiles (
     id uuid references auth.users not null primary key,
     email text not null,
     created_at timestamp with time zone default now()
   );

   -- Create nuclei_scan_results table
   create table nuclei_scan_results (
     id uuid default uuid_generate_v4() primary key,
     domain text not null,
     url text not null,
     scan_timestamp timestamp with time zone default now(),
     template_id text,
     severity text,
     finding_name text,
     finding_description text,
     matched_at text,
     user_id uuid references auth.users,
     created_at timestamp with time zone default now()
   );

   -- Create llm_scan_results table
   create table llm_scan_results (
     id uuid default uuid_generate_v4() primary key,
     user_id uuid references auth.users not null,
     prompt text not null,
     result text not null,
     provider text not null,
     model text,
     scan_type text not null,
     batch_id uuid,
     created_at timestamp with time zone default now(),
     batch_name text
   );

   -- Create scheduled_llm_scans table
   create table scheduled_llm_scans (
     id uuid default uuid_generate_v4() primary key,
     user_id uuid references auth.users not null,
     prompt text not null,
     provider text not null,
     model text,
     custom_endpoint text,
     curl_command text,
     prompt_placeholder text,
     custom_headers text,
     api_key text,
     schedule text not null,
     is_recurring boolean default false,
     next_run timestamp with time zone,
     last_run timestamp with time zone,
     created_at timestamp with time zone default now(),
     active boolean default true
   );

   -- Create trigger for new user profiles
   create or replace function handle_new_user()
   returns trigger as $$
   begin
     insert into public.profiles (id, email)
     values (new.id, new.email);
     return new;
   end;
   $$ language plpgsql security definer;

   create trigger on_auth_user_created
     after insert on auth.users
     for each row execute function handle_new_user();
   ```

5. Configure Edge Functions:
   - In your Supabase dashboard, go to Edge Functions and set up the following secrets:
     - `OPENAI_API_KEY`: Your OpenAI API key for LLM scanning
     - `NUCLEI_API_KEY`: Your Nuclei API key (if using Nuclei integration)
     - `NUCLEI_API_URL`: Your Nuclei API endpoint

6. Start the development server:
   ```bash
   npm run dev
   ```

The application will be available at `http://localhost:5173`

## Docker Support

To run the application using Docker:

```bash
# Build the image
docker build -t domain-recon .

# Run the container
docker run -p 5173:5173 domain-recon
```

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.