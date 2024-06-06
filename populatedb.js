const sqlite = require('sqlite');
const sqlite3 = require('sqlite3');


const dbFileName = 'database.db';


async function initializeDB() {
   const db = await sqlite.open({ filename: dbFileName, driver: sqlite3.Database });


   // Drop existing tables if they exist
   await db.exec(`
       DROP TABLE IF EXISTS users;
       DROP TABLE IF EXISTS posts;
       DROP TABLE IF EXISTS comments;
   `);


   // Create new tables
   await db.exec(`
       CREATE TABLE IF NOT EXISTS users (
           id INTEGER PRIMARY KEY AUTOINCREMENT,
           username TEXT NOT NULL UNIQUE,
           hashedGoogleId TEXT NOT NULL UNIQUE,
           avatar_url TEXT,
           memberSince DATETIME NOT NULL
       );


       CREATE TABLE IF NOT EXISTS posts (
           id INTEGER PRIMARY KEY AUTOINCREMENT,
           title TEXT NOT NULL,
           content TEXT NOT NULL,
           username TEXT NOT NULL,
           timestamp DATETIME NOT NULL,
           likes INTEGER NOT NULL,
           likedBy TEXT DEFAULT '[]'
       );


       CREATE TABLE IF NOT EXISTS comments (
           id INTEGER PRIMARY KEY AUTOINCREMENT,
           postId INTEGER NOT NULL,
           username TEXT NOT NULL,
           content TEXT NOT NULL,
           timestamp DATETIME NOT NULL,
           FOREIGN KEY(postId) REFERENCES posts(id),
           FOREIGN KEY(username) REFERENCES users(username)
       );
   `);


   // Combined sample data
   const users = [
       { username: 'user1', hashedGoogleId: 'hashedGoogleId1', avatar_url: '', memberSince: '2024-01-01 12:00' },
       { username: 'user2', hashedGoogleId: 'hashedGoogleId2', avatar_url: '', memberSince: '2024-01-02 12:00' },
       { username: 'musicLover', hashedGoogleId: 'uniqueHashedGoogleId1', avatar_url: 'https://example.com/avatar1.png', memberSince: '2024-01-01 12:00' },
       { username: 'guitarHero', hashedGoogleId: 'uniqueHashedGoogleId2', avatar_url: 'https://example.com/avatar2.png', memberSince: '2024-01-02 12:00' },
       { username: 'drummerBoy', hashedGoogleId: 'uniqueHashedGoogleId3', avatar_url: 'https://example.com/avatar3.png', memberSince: '2024-01-03 12:00' },
       { username: 'pianoQueen', hashedGoogleId: 'uniqueHashedGoogleId4', avatar_url: 'https://example.com/avatar4.png', memberSince: '2024-01-04 12:00' }
   ];


   const posts = [
       { title: 'First Post', content: 'This is the first post', username: 'user1', timestamp: '2024-01-01 12:30', likes: 0},
       { title: 'Second Post', content: 'This is the second post', username: 'user2', timestamp: '2024-01-02 12:30', likes: 0},
       { title: 'Favorite Guitar Riffs', content: 'What are your favorite guitar riffs of all time?', username: 'musicLover', timestamp: '2024-01-01 12:30', likes: 10 },
       { title: 'Top 10 Drumming Techniques', content: 'Here are my top 10 drumming techniques for beginners.', username: 'drummerBoy', timestamp: '2024-01-02 13:30', likes: 20 },
       { title: 'Learning Piano as an Adult', content: 'It\'s never too late to learn piano. Here are some tips.', username: 'pianoQueen', timestamp: '2024-01-03 14:30', likes: 30 },
       { title: 'The Evolution of Music Genres', content: 'A deep dive into how music genres have evolved over the years.', username: 'guitarHero', timestamp: '2024-01-04 15:30', likes: 40 }
   ];


   const comments = [
       { postId: 1, username: 'user2', content: 'Great post!', timestamp: '2024-01-01 13:00' },
       { postId: 2, username: 'user1', content: 'Thanks for sharing!', timestamp: '2024-01-02 13:00' }
   ];


   // Insert sample data into the database
   await Promise.all([
       Promise.all(users.map(user => {
           return db.run(
               'INSERT INTO users (username, hashedGoogleId, avatar_url, memberSince) VALUES (?, ?, ?, ?)',
               [user.username, user.hashedGoogleId, user.avatar_url, user.memberSince]
           );
       })),
       Promise.all(posts.map(post => {
           return db.run(
               'INSERT INTO posts (title, content, username, timestamp, likes) VALUES (?, ?, ?, ?, ?)',
               [post.title, post.content, post.username, post.timestamp, post.likes]
           );
       })),
       Promise.all(comments.map(comment => {
           return db.run(
               'INSERT INTO comments (postId, username, content, timestamp) VALUES (?, ?, ?, ?)',
               [comment.postId, comment.username, comment.content, comment.timestamp]
           );
       }))
   ]);


   console.log('Database populated with initial data.');
   await db.close();
}


initializeDB().catch(err => {
   console.error('Error initializing database:', err);
});



