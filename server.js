require('dotenv').config();

const multer = require('multer');
const upload = multer({ dest: 'public/uploads/' });

const express = require('express');
const session = require('express-session');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const exphbs = require('express-handlebars');
const sqlite3 = require('sqlite3').verbose();
const sqlite = require('sqlite');
const path = require('path');
const crypto = require('crypto');
const dbPath = path.resolve(__dirname, process.env.DATABASE_FILE);
const canvas = require('canvas');
const Handlebars = require('handlebars');

//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Configuration and Setup
//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

const app = express();
const PORT = process.env.PORT || 3000;

//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Server Activation
//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Open Database
//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

let db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error(`Error opening database: ${err.message}`);
    } else {
        console.log('Connected to the SQLite database.');
    }
});

/*
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    Handlebars Helpers

    Handlebars helpers are custom functions that can be used within the templates 
    to perform specific tasks. They enhance the functionality of templates and 
    help simplify data manipulation directly within the view files.

    In this project, two helpers are provided:
    
    1. toLowerCase:
       - Converts a given string to lowercase.
       - Usage example: {{toLowerCase 'SAMPLE STRING'}} -> 'sample string'

    2. ifCond:
       - Compares two values for equality and returns a block of content based on 
         the comparison result.
       - Usage example: 
            {{#ifCond value1 value2}}
                <!-- Content if value1 equals value2 -->
            {{else}}
                <!-- Content if value1 does not equal value2 -->
            {{/ifCond}}
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
*/

// Set up Handlebars view engine with custom helpers
//



Handlebars.registerHelper('extractYouTubeEmbedUrl', function(url) {
    const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/ ]{11})/;
    const match = url.match(regex);
    return match ? `https://www.youtube.com/embed/${match[1]}` : null;
});
app.engine(
    'handlebars',
    exphbs.engine({
        helpers: {
            toLowerCase: function (str) {
                return str.toLowerCase();
            },
            ifCond: function (v1, v2, options) {
                if (v1 === v2) {
                    return options.fn(this);
                }
                return options.inverse(this);
            },
           
            extractYouTubeEmbedUrl: Handlebars.helpers.extractYouTubeEmbedUrl      
        },
    })
);




app.set('view engine', 'handlebars');
app.set('views', './views');

//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Middleware
//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true
}));

app.use((req, res, next) => {
    res.locals.appName = 'Tooters';
    res.locals.copyrightYear = 2024;
    res.locals.postNeoType = 'Toot';
    res.locals.loggedIn = req.session.loggedIn || false;
    res.locals.userId = req.session.userId || '';
    res.locals.user = req.session.user || {};
    next();
});

//app.use(express.static('public'));
app.use(express.static(path.join(__dirname, 'public')));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(passport.initialize());
app.use(passport.session());

const dbPromise = sqlite.open({ filename: dbPath, driver: sqlite3.Database });

// Passport configuration
passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: process.env.CALLBACK_URL
}, async (token, tokenSecret, profile, done) => {
    const db = await dbPromise;
    const googleId = profile.id;
    const hashedGoogleId = crypto.createHash('sha256').update(googleId).digest('hex');
    const timestamp = new Date().toISOString();
    const formattedTimestamp = formatTimestamp(timestamp, false);

    let user = await db.get('SELECT * FROM users WHERE hashedGoogleId = ?', [hashedGoogleId]);

    // check for user's account
    if (user) {
        // User exists
        if (user.username) {
            // User has a username, log them in directly
            console.log("User exists with username:", user.username);
            return done(null, user);
        } else {
            // User exists but has no username, store details in session
            console.log("User exists without username.");
            return done(null, { id: user.id, googleId, memberSince: formattedTimestamp });
        }
    } else {
        // New user, store details in session
        console.log("New user detected.");
        return done(null, { googleId, memberSince: formattedTimestamp });
    }
}));

passport.serializeUser((user, done) => {
    done(null, user);
});

passport.deserializeUser(async (user, done) => {
    done(null, user);
});

//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Routes
//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~


// NEW CODE START HERE

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname, 'public')));

(async () => {
    const db = await sqlite.open({ filename: dbPath, driver: sqlite3.Database });

    const columns = await db.all(`PRAGMA table_info(posts)`);
    const columnNames = columns.map(column => column.name);

    if (!columnNames.includes('mediaPath')) {
        await db.run(`ALTER TABLE posts ADD COLUMN mediaPath TEXT`);
    }
    if (!columnNames.includes('mediaType')) {
        await db.run(`ALTER TABLE posts ADD COLUMN mediaType TEXT`);
    }
    if (!columnNames.includes('mediaUrl')) {
        await db.run(`ALTER TABLE posts ADD COLUMN mediaUrl TEXT`);
    }

    console.log('Database schema checked and updated successfully.');
})();


function handleMediaTypeChange() {
    const mediaType = document.getElementById('mediaType').value;
    const mediaUrlContainer = document.getElementById('mediaUrlContainer');
    const youtubeUrlContainer = document.getElementById('youtubeUrlContainer');

    if (mediaType === 'youtube') {
        mediaUrlContainer.style.display = 'none';
        youtubeUrlContainer.style.display = 'block';
    } else {
        mediaUrlContainer.style.display = 'block';
        youtubeUrlContainer.style.display = 'none';
    }
}

// NEW CODE STOP HERE







// Route to initiate Google authentication
app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

// Route to handle Google authentication callback
app.get('/auth/google/callback', passport.authenticate('google', { failureRedirect: '/login' }), async (req, res) => {
    if (!req.user.username) {
        req.session.tempUser = req.user;
        res.redirect('/registerUsername');
    } else {
        req.session.userId = req.user.id;
        req.session.loggedIn = true;
        req.session.user = req.user;
        console.log("User logged in:", req.user.username);
        res.redirect('/');
    }
});

// Route to render the username registration page
app.get('/registerUsername', (req, res) => {
    res.render('registerUsername');
});

// Route to handle username registration
app.post('/registerUsername', async (req, res) => {
    const { username } = req.body;
    const db = await dbPromise;

    // Check if the username is already taken
    const existingUser = await db.get('SELECT * FROM users WHERE username = ?', [username]);
    if (existingUser) {
        res.render('registerUsername', { error: 'Username already exists' });
    } else {
        const user = req.session.tempUser;
        const hashedGoogleId = crypto.createHash('sha256').update(user.googleId).digest('hex');
        const avatarUrl = generateAvatar(username);
        await db.run('INSERT INTO users (username, hashedGoogleId, avatar_url, memberSince) VALUES (?, ?, ?, ?)', [username, hashedGoogleId, avatarUrl, user.memberSince]);
        const newUser = await db.get('SELECT * FROM users WHERE username = ?', [username]);
        req.session.userId = newUser.id;
        req.session.loggedIn = true;
        req.session.user = newUser;
        res.redirect('/');
    }
});



// Route to render the home page with posts sorted by specified criteria
app.get('/', async (req, res) => {
    const sort = req.query.sort || 'time_desc'; // default sorting
    const posts = await getPosts(sort);
    const user = req.session.user || {};
    
    let feedTitle = 'Toots Feed';
    switch (sort) {
        case 'time_asc':
            feedTitle = 'Oldest Toots';
            break;
        case 'time_desc':
            feedTitle = 'Recent Toots';
            break;
        case 'likes_asc':
            feedTitle = 'Least Liked Toots';
            break;
        case 'likes_desc':
            feedTitle = 'Most Liked Toots';
            break;
        default:
            feedTitle = 'Toots Feed';
            break;
    }

    res.render('home', { posts, user, sort, feedTitle });
});

// NEW CODE
app.post('/posts', isAuthenticated, upload.single('media'), async (req, res) => {
    const { title, content, mediaType, mediaUrl } = req.body;
    const user = req.session.user;

    if (user) {
        const db = await dbPromise;
        const timestamp = new Date().toISOString();
        const formattedTimestamp = formatTimestamp(timestamp, true);
        let mediaPath = null;

        if (req.file) {
            mediaPath = `/uploads/${req.file.filename}`;
        }

        await db.run('INSERT INTO posts (title, content, username, timestamp, likes, mediaPath, mediaType, mediaUrl) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', 
                     [title, content, user.username, formattedTimestamp, 0, mediaPath, mediaType, mediaUrl]);
        res.redirect('/');
    } else {
        res.redirect('/login');
    }
});

// Route to serve uploaded media files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
// NEW CODE STOP HERE



// Route to render the login/register page for login
app.get('/login', (req, res) => {
    res.render('loginRegister', { appName: 'Tooters' });
});

// Route to render the login/register page for registration
app.get('/register', (req, res) => {
    res.render('loginRegister', { regError: req.query.error });
});

// Route to handle user logout
app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/googleLogout');
});

// Route to render the Google logout page
app.get('/googleLogout', (req, res) => {
    res.render('googleLogout');
});

// Route to render the page for adding a new post
app.get('/addPost', isAuthenticated, (req, res) => {
    res.render('addPost');
});

// Route to render the detail of a specific post
app.get('/post/:id', async (req, res) => {
    const db = await dbPromise;
    const post = await db.get('SELECT * FROM posts WHERE id = ?', [req.params.id]);
    const comments = await db.all('SELECT * FROM comments WHERE postId = ?', [req.params.id]);
    if (post) {
        res.render('postDetail', { post, comments, user: req.session.user });
    } else {
        res.redirect('/error');
    }
});

/* OLD CODE
// Route to handle creating a new post
app.post('/posts', isAuthenticated, async (req, res) => {
    const { title, content } = req.body;
    const user = req.session.user;

    if (user) {
        const db = await dbPromise;
        const timestamp = new Date().toISOString();
        const formattedTimestamp = formatTimestamp(timestamp, true);
        await db.run('INSERT INTO posts (title, content, username, timestamp, likes) VALUES (?, ?, ?, ?, ?)', [title, content, user.username, formattedTimestamp, 0]);
        res.redirect('/');
    } else {
        res.redirect('/login');
    }
});
*/ 

// Route to handle liking/unliking a post
app.post('/like/:id', isAuthenticated, async (req, res) => {
    const user = req.session.user;
    if (user) {
        const db = await dbPromise;
        const post = await db.get('SELECT * FROM posts WHERE id = ?', [req.params.id]);
        if (post && post.username !== user.username) {
            const likedBy = JSON.parse(post.likedBy || '[]');
            const userIndex = likedBy.indexOf(user.id);
            if (userIndex === -1) {
                likedBy.push(user.id);
                post.likes += 1;
            } else {
                likedBy.splice(userIndex, 1);
                post.likes -= 1;
            }
            await db.run('UPDATE posts SET likes = ?, likedBy = ? WHERE id = ?', [post.likes, JSON.stringify(likedBy), post.id]);
        }
    }
    res.redirect('/');
});

// Route to render the user's profile page with their posts
app.get('/profile', isAuthenticated, async (req, res) => {
    const user = req.session.user;
    if (user) {
        const db = await dbPromise;
        const userPosts = await db.all('SELECT * FROM posts WHERE username = ?', [user.username]);
        res.render('profile', { user, posts: userPosts });
    } else {
        res.redirect('/login');
    }
});

// Route to generate and serve an avatar for a user
app.get('/avatar/:username', async (req, res) => {
    const db = await dbPromise;
    const user = await db.get('SELECT * FROM users WHERE username = ?', [req.params.username]);
    if (user) {
        const avatar = generateAvatar(user.username[0]);
        res.type('png');
        res.send(avatar);
    } else {
        res.redirect('/error');
    }
});

// Route to handle deleting a post by its owner
app.post('/delete/:id', isAuthenticated, async (req, res) => {
    const user = req.session.user;
    const postId = req.params.id;
    const redirectUrl = req.query.redirect || '/';

    if (user) {
        const db = await dbPromise;
        const post = await db.get('SELECT * FROM posts WHERE id = ?', [postId]);

        if (post && post.username === user.username) {
            // Only allow the owner to delete
            await db.run('DELETE FROM posts WHERE id = ?', [postId]);
        }
    }
    res.redirect(redirectUrl);
});

app.get('/write-post', isAuthenticated, (req, res) => {
    res.render('write-post', { user: req.session.user });
});

app.post('/comments', isAuthenticated, async (req, res) => {
    const { postId, content } = req.body;
    const user = req.session.user;
    if (user) {
        const db = await dbPromise;
        const timestamp = new Date().toISOString();
        const formattedTimestamp = formatTimestamp(timestamp, true);
        await db.run('INSERT INTO comments (postId, username, content, timestamp) VALUES (?, ?, ?, ?)', [postId, user.username, content, formattedTimestamp]);
        res.redirect(`/post/${postId}`);
    } else {
        res.redirect('/login');
    }
});

app.post('/delete-comment/:id', isAuthenticated, async (req, res) => {
    const user = req.session.user;
    const commentId = req.params.id;
    const postId = req.body.postId;

    if (user) {
        const db = await dbPromise;
        const comment = await db.get('SELECT * FROM comments WHERE id = ?', [commentId]);

        if (comment && comment.username === user.username) {
            // Only allow the owner to delete
            await db.run('DELETE FROM comments WHERE id = ?', [commentId]);
        }
    }
    res.redirect(`/post/${postId}`);
});

//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// Support Functions and Variables
//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

// Function to find a user by id
async function findUserById(userId) {
    const db = await dbPromise;
    return await db.get('SELECT * FROM users WHERE id = ?', [userId]);
}

// Function to get all posts, with custom sorting order
async function getPosts(sort = 'time_desc') {
    const db = await dbPromise;
    let orderByClause;

    switch (sort) {
        case 'time_asc':
            orderByClause = 'ORDER BY timestamp ASC';
            break;
        case 'time_desc':
            orderByClause = 'ORDER BY timestamp DESC';
            break;
        case 'likes_asc':
            orderByClause = 'ORDER BY likes ASC';
            break;
        case 'likes_desc':
            orderByClause = 'ORDER BY likes DESC';
            break;
        default:
            orderByClause = 'ORDER BY timestamp DESC';
            break;
    }

    return await db.all(`SELECT * FROM posts ${orderByClause}`);
}

// Middleware to check if user is authenticated
function isAuthenticated(req, res, next) {
    if (req.session.userId) {
        next();
    } else {
        res.redirect('/login');
    }
}

// format time helper function
function formatTimestamp(isoString, includeTime = true) {
    const date = new Date(isoString); 

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    if (includeTime) {
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${year}-${month}-${day} ${hours}:${minutes}`;
    } else {
        return `${year}-${month}-${day}`;
    }
}

// Function to generate an image avatar
function generateAvatar(letter, width = 100, height = 100) {
    const newCanvas = canvas.createCanvas(width, height);
    const ctx = newCanvas.getContext('2d');
    const colors = ['#FF5733', '#33FF57', '#3357FF', '#F333FF', '#FF33F6',
        '#FFBD33', '#33FFBD', '#BD33FF', '#FF5733', '#FF3380',
        '#3380FF', '#80FF33', '#33FF80', '#3380FF', '#FF8033',
        '#8033FF', '#3380FF', '#FF3380', '#80FF33', '#33FF80'];
    const colorIndex = (letter.charCodeAt(0) + letter.length) % colors.length;
    const color = colors[colorIndex];

    ctx.fillStyle = color;
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = 'white';
    ctx.font = 'bold 50px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(letter, width / 2, height / 2);

    return newCanvas.toBuffer();
}
