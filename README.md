# Tech_Titansss — Research Links (POLAROPS · SIH 2026)

A small shared board where the team can save research links for the project.
No dependencies — only Node.js (v16 or newer) is needed.

## Run

    node server.js
    # or: npm start

Open http://localhost:3000

To use another port: `PORT=8080 node server.js` (Windows PowerShell: `$env:PORT=8080; node server.js`)

## Share with teammates
Everyone on the same Wi-Fi can open `http://<your-computer-IP>:3000`.
To keep it online, deploy the folder to any Node host (Render, Railway, etc.) — start command: `node server.js`.
Note: some free hosts wipe local files on restart, so use Export JSON as a backup.

## Files
- `server.js` — web server + REST API (`/api/links`)
- `public/index.html` — the web page
- `data/links.json` — where links are stored (edit or back it up freely)
- `package.json` — project info / `npm start`

## API
- `GET /api/links` · `POST /api/links` · `PUT /api/links/:id` · `DELETE /api/links/:id` · `POST /api/links/import`
