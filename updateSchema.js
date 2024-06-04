require('dotenv').config();
const sqlite3 = require('sqlite3').verbose();
const sqlite = require('sqlite');
const path = require('path');
const dbPath = path.resolve(__dirname, process.env.DATABASE_FILE);

(async () => {
    const db = await sqlite.open({ filename: dbPath, driver: sqlite3.Database });
    await db.run(`ALTER TABLE posts ADD COLUMN mediaPath TEXT`);
    await db.run(`ALTER TABLE posts ADD COLUMN mediaType TEXT`);
    await db.run(`ALTER TABLE posts ADD COLUMN mediaUrl TEXT`);
    console.log('Database schema updated successfully.');
})();
