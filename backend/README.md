# Nexteer Hack Backend

Backend server built with Express, Socket.io, and PostgreSQL.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file based on `.env.example`:
```bash
cp .env.example .env
```

3. Update the `.env` file with your PostgreSQL credentials.

4. Make sure PostgreSQL is installed and running on your system.

5. Create the database (if it doesn't exist):
```bash
psql -U postgres
CREATE DATABASE nexteer_hack;
\q
```

## Running the Server

Development mode (with auto-restart):
```bash
npm run dev
```

Production mode:
```bash
npm start
```

## API Endpoints

- `GET /` - Welcome message
- `GET /health` - Health check endpoint (includes database connection status)

## Socket.io Events

- `connection` - Client connects to the server
- `disconnect` - Client disconnects from the server
- `message` - Example message event (broadcasts to all clients)

## Technologies

- **Express** - Web framework
- **Socket.io** - Real-time bidirectional communication
- **pg** - PostgreSQL client for Node.js
- **dotenv** - Environment variable management
- **cors** - Cross-Origin Resource Sharing middleware
