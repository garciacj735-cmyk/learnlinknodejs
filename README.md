# LearnLink Node.js

Node.js clone of the Laravel LearnLink system.

## Run

```powershell
npm start
```

Default URL:

- `http://127.0.0.1:3001`

Admin login:

- `http://127.0.0.1:3001/admin/login`

## Project Structure

- `server.js` - server entrypoint
- `src/app.js` - active request runtime
- `src/config/` - server config and shared constants
- `src/routes/` - route maps
- `src/controllers/` - controller groups and action manifests
- `src/models/` - schema references
- `src/views/` - view manifests
- `src/services/` - runtime services
- `src/middleware/` - middleware extraction area
- `public/` - CSS and JS assets
- `data/` - SQLite database
