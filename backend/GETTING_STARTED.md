# ⚡ Super Quick Start - No Docker!

## Prerequisites (Install These First)

### 1. Install Node.js
- Download from: https://nodejs.org/
- Or use: `sudo apt install nodejs npm` (Linux) / `brew install node` (macOS)

### 2. Install PostgreSQL
**Ubuntu/Debian:**
```bash
sudo apt-get update
sudo apt-get install postgresql postgresql-contrib
sudo service postgresql start
```

**macOS:**
```bash
brew install postgresql
brew services start postgresql
```

## Setup (4 Simple Steps)

```bash
# Step 1: Go to backend folder
cd backend

# Step 2: Install packages
npm install

# Step 3: Setup database (one command does everything!)
npm run db:setup

# Step 4: Start the server
npm run dev
```

## Start Simulator (Optional but recommended)
Open a **new terminal** and run:
```bash
cd backend
npm run simulator
```

## Test It Works

Open browser and visit: http://localhost:3001/health

Or run this:
```bash
curl http://localhost:3001/health
```

You should see: `{"status":"healthy","database":"connected",...}`

## 🎉 Done!

Your backend is running on **http://localhost:3001**

### What to do next?
- Test API endpoints (see API_DOCS.md)
- Import Postman collection
- Build your frontend

## ⚠️ Problems?

### "npm: command not found"
Install Node.js first (see Prerequisites above)

### "psql: command not found" or "database connection failed"
Install PostgreSQL first (see Prerequisites above)

### "port 3001 already in use"
Change PORT in `.env` file or kill the process:
```bash
lsof -ti:3001 | xargs kill -9
```

### "database 'smartpark' does not exist"
Run: `npm run db:setup`

### PostgreSQL won't start?
```bash
# Linux
sudo service postgresql restart

# macOS  
brew services restart postgresql
```

### Still stuck?
See [SIMPLE_SETUP.md](./SIMPLE_SETUP.md) for detailed troubleshooting

## All Commands You Need

```bash
npm install          # Install everything
npm run db:setup     # Setup database
npm run dev          # Start server
npm run simulator    # Start simulator
```

That's it! 🚀
