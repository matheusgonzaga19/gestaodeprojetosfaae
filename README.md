# FAAE Projetos

This project runs a full-stack task management system. To start the development server you need to configure environment variables in a `.env` file.

## Setup
1. Copy `.env.example` to `.env` and fill in the Firebase values.
2. Add a `DATABASE_URL` variable pointing to your PostgreSQL database, e.g.
   ```
   DATABASE_URL=postgres://user:password@host:5432/dbname
   ```
3. Install dependencies and run the dev server:
   ```bash
   npm install
   npm run dev
   ```

The server will fail to start if `DATABASE_URL` is missing, so make sure it is defined before running.
