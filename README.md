# AI Media Management System

A full-stack media management system similar to Google Photos, built with MERN stack (MongoDB, Express, React, Node.js) and AWS S3.

## Features
- **Authentication**: JWT-based auth with User and Admin roles.
- **Media Gallery**: View images and videos in a responsive grid.
- **Upload**: Admin-only upload for images and videos to AWS S3.
- **AI Tagging**: Automatic tagging of uploaded media (Mock AI service included).
- **Search**: Filter media by title or AI-generated tags.

## Prerequisites
- Node.js installed
- MongoDB installed and running (or use MongoDB Atlas)
- AWS Account with S3 bucket (and optionally Rekognition access)

## Setup

### 1. Backend Setup
1. Navigate to the `server` directory:
   ```bash
   cd server
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure environment variables:
   - The `.env` file has been created. Open `server/.env` and update the values:
     ```env
     MONGO_URI=mongodb://localhost:27017/ai_media_system  # Or your Atlas URI
     JWT_SECRET=your_jwt_secret_key
     AWS_ACCESS_KEY_ID=your_aws_access_key
     AWS_SECRET_ACCESS_KEY=your_aws_secret_key
     AWS_BUCKET_NAME=your_bucket_name
     AWS_REGION=us-east-1
     ```
4. Start the server:
   ```bash
   npm start
   ```

### 2. Frontend Setup
1. Navigate to the `client` directory:
   ```bash
   cd client
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```

## Usage
- **Register**: Create a new account at `/register`.
- **Login**: Log in to access the dashboard.
- **Admin**: Functionality like "Upload" is restricted to users with `role: 'admin'`. You can manually update a user's role to 'admin' in your MongoDB database to test this feature.
- **Search**: Use the search bar to find media by title or tags (e.g., "nature", "summer").
