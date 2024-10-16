
# Social Media Forum

A web-based social media forum for musicians where users can create posts in various formats, including text, video, and audio, as well as comment and interact with others. This project is built using HTML, CSS, JavaScript, Handlebars, Express, Node.js, and SQLite for the backend.

## Table of Contents
- [Features](#features)
- [Installation](#installation)
- [Usage](#usage)
- [Project Structure](#project-structure)
- [Technologies Used](#technologies-used)
- [Database](#database)
  
## Features
- User registration and login (with sessions).
- Users can create posts in various formats:
  - **Text**: Standard forum-style posts.
  - **Video**: Upload video files as part of posts.
  - **Audio**: Upload audio files as part of posts.
- Commenting system for users to engage with posts.
- Posts and comments are stored persistently using SQLite.
- Responsive design for a better user experience on various devices.
- Template-based rendering using Handlebars for dynamic HTML generation.

## Installation

### Prerequisites
- Node.js and npm must be installed on your machine.
- SQLite is required for database operations.

### Steps
1. Clone the repository to your local machine:
   \`\`\`bash
   git clone https://github.com/your-username/social-media-forum.git
   \`\`\`
2. Navigate to the project directory:
   \`\`\`bash
   cd social-media-forum
   \`\`\`
3. Install the dependencies:
   \`\`\`bash
   npm install
   \`\`\`
4. Set up the SQLite database:
   - Run the script to initialize the database:
     \`\`\`bash
     node scripts/initDatabase.js
     \`\`\`
   - You can modify the \`config/database.js\` file to change the database path if necessary.

5. Start the server:
   \`\`\`bash
   npm start
   \`\`\`
6. Open your browser and navigate to \`http://localhost:3000\` to view the app.

## Usage
Once the server is running, you can:
- Register a new account.
- Log in and create posts with the following options:
  - **Text** posts (standard forum-style content).
  - **Video** uploads (accepted formats: MP4, AVI, etc.).
  - **Audio** uploads (accepted formats: MP3, WAV, etc.).
- Comment on existing posts.
- Edit or delete your own posts.

### Admin Features
If you are the admin, you can:
- Manage user accounts.
- Moderate posts and comments, including text, video, and audio content.

## Project Structure
The project follows the MVC (Model-View-Controller) design pattern. Below is a breakdown of the key folders:

\`\`\`
├── public              # Frontend assets (CSS, JS, images, video, audio)
├── views               # Handlebars templates
├── routes              # Express routes for handling HTTP requests
├── models              # Database models and logic
├── config              # Configuration files (e.g., database, environment)
├── scripts             # Scripts for tasks like database setup
├── uploads             # Directory to store uploaded media (video, audio)
├── app.js              # Main entry point of the application
└── README.md           # Project documentation
\`\`\`

## Technologies Used
- **HTML5/CSS3**: For creating the structure and styling the front end.
- **JavaScript**: For client-side interactivity.
- **Handlebars**: For dynamic rendering of HTML pages.
- **Node.js**: Backend JavaScript runtime environment.
- **Express**: Framework for building the web server and handling routes.
- **SQLite**: Lightweight SQL database used to store user data, posts, and comments.
- **bcrypt**: For password hashing and user authentication.
- **Multer**: Middleware for handling file uploads, such as videos and audio files.

## Database
The application uses an SQLite database to store information. The main tables include:
- **Users**: Stores user information such as username, email, password hash.
- **Posts**: Stores forum posts created by users, including text, video, and audio.
- **Comments**: Stores comments on posts made by users.
