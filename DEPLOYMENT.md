# 🚀 MS PRO — Deployment Guide (Render.com)

This application is configured as a **unified Fullstack service**. When deployed to **Render.com**, a single free Web Service hosts both your **React frontend** and **Express backend** with direct connection to your **MongoDB Atlas Cloud**.

---

## 📋 Pre-Flight Checklist

- [x] React frontend builds to `dist/` with relative `/api` paths
- [x] Express backend configured to serve `dist/` and handle client routing (`/login`, `/projects`, `/sheet/*`, `/admin`)
- [x] MongoDB Atlas Cloud connection string ready
- [x] Render blueprint `render.yaml` included in root

---

## Step 1: Initialize Git and Push to GitHub

In your terminal (inside the project root `/Users/hiteshsuthar/Documents/Code/MS`):

```bash
# 1. Initialize git
git init -b main

# 2. Add all project files (.env is already protected in .gitignore)
git add .

# 3. Create initial commit
git commit -m "Initial commit: MS PRO ready for Render deployment"

# 4. Create a new repository on GitHub (e.g. named ms-pro) and link it:
git remote add origin https://github.com/YOUR_GITHUB_USERNAME/YOUR_REPO_NAME.git

# 5. Push to GitHub
git push -u origin main
```

---

## Step 2: Deploy on Render.com (Free)

1. Go to **[Render.com](https://render.com)** and log in (or sign up with GitHub).
2. Click the **"New +"** button at the top right and select **"Web Service"**.
3. Choose **"Build and deploy from a Git repository"** and select your GitHub repository.
4. Render will ask for service details. Enter the following:

| Setting | Value |
|---|---|
| **Name** | `ms-pro` (or any name you like) |
| **Region** | Singapore / Frankfurt / Oregon (closest to you) |
| **Branch** | `main` |
| **Root Directory** | *(leave blank)* |
| **Runtime** | `Node` |
| **Build Command** | `npm install && npm run build` |
| **Start Command** | `npm start` |
| **Instance Type** | **Free** ($0/month) |

---

## Step 3: Add Environment Variables

In the **Environment Variables** section on Render, add these 3 variables:

| Key | Value |
|---|---|
| `MONGO_URI` | `mongodb+srv://hiteshsutharvfx_db_user:16Ib0lm1oavtiYvX@cluster0.7hzqmcn.mongodb.net/ms-pro?retryWrites=true&w=majority&appName=Cluster0` |
| `JWT_SECRET` | `ms_pro_super_secret_jwt_key_2025` |
| `NODE_ENV` | `production` |

---

## Step 4: MongoDB Atlas Network Access

Make sure your MongoDB Atlas cluster allows incoming connections from Render:
1. Open **[MongoDB Atlas](https://cloud.mongodb.com/)**.
2. Go to **Network Access** under Security in the left sidebar.
3. Check if `0.0.0.0/0` (Allow Access from Anywhere) is active:
   - If not, click **"Add IP Address"** -> choose **"Allow Access From Anywhere" (`0.0.0.0/0`)** -> click **Confirm**.

---

## Step 5: Click "Create Web Service"

Render will automatically:
1. Install dependencies.
2. Build the React production bundle.
3. Launch Node.js on port 10000 (Render automatically provides `PORT`).
4. Connect to MongoDB Atlas and seed the initial users (`admin`, `jagdish`, `madanlal`).
5. Provide you with a free public SSL URL: `https://ms-pro-xxxx.onrender.com`.

---

## 🔑 Default Accounts on Live Site

| User | Username | Password | Role |
|---|---|---|---|
| **ADMIN** | `admin` | `admin@123` | SUPER ADMIN |
| **JAGDISH** | `jagdish` | `jagdish@123` | USER |
| **MADANLAL** | `madanlal` | `madanlal@123` | USER |
