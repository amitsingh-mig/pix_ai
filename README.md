# AI Media Management System 🚀✨

A premium, full-stack AI-powered media management platform designed for scale and performance. This system handles large-scale media libraries (images/videos) with automatic AI tagging, optimized storage, and advanced metadata extraction.

## 🌟 Key Features

- **AI-Powered Intelligence**: Real-time face detection and scene tagging using **AWS Rekognition**.
- **Performance Optimized**: Automated thumbnail generation via **Sharp** (400px) for blazing fast gallery loads.
- **Scalable Architecture**: Monthly partitioned local storage (`/data/media/YYYY-MM/`) to handle millions of files without OS degradation.
- **Advanced Metadata**: Deep EXIF extraction for photos (Camera, ISO, Lens) and FFmpeg-probed metadata for videos.
- **Pro Video Streaming**: Full range-header support for fluid 4K video seeking and streaming.
- **Global State Management**: Integrated `AlbumContext` for seamless data synchronization across the dashboard and upload flows.
- **Secure by Design**: Role-based access (Admin/User), JWT authentication, and hardened CORS/Request-limit policies.

## 🛠 Tech Stack

**Frontend:**
- React (Vite) + SCSS
- Framer Motion (Animations)
- Three.js (3D Loading State)
- Lucide React (Icons)
- Context API (State Management)

**Backend:**
- Node.js + Express 5
- MongoDB (Advanced Indexing)
- Sharp (Image Processing)
- FFmpeg (Video Processing)
- AWS Rekognition & S3 (Optional)

## 🏗 Audit & Stability Fixes

This system has undergone a rigorous technical audit. Significant improvements include:
- **Memory Safety**: 25MB limits on EXIF processing to prevent OOM crashes.
- **Concurrency Control**: Promise-pool limited bulk uploads (max 5 parallel).
- **API Stability**: 1s throttling for Nominatim Geocoding to prevent rate-limit bans.
- **Storage Integrity**: Critical fixes to local file deletion and partitioned directory creation.

## 🚀 Quick Start

### 1. Prerequisites
- Node.js (v18+)
- MongoDB (Local or Atlas)
- FFmpeg (Installed on system)

### 2. Backend Installation
```bash
cd server
npm install
# Configure server/.env (see below)
npm run dev
```

### 3. Frontend Installation
```bash
cd client
npm install
npm run dev
```

## 🔐 Environment Variables (`server/.env`)

```env
PORT=5000
MONGO_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
ALLOWED_ORIGINS=http://localhost:5173

# Optional: AWS Integration (Required for AI Tagging)
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=...
AWS_BUCKET_NAME=...

# Optional: AI
OPENAI_API_KEY=...
```

## 📸 Screenshots
*(Visuals coming soon - See `client/src/components/Loader3D` for a preview of the premium aesthetics!)*

---
*Built with precision for the AI Media Management Audit Phase.*
