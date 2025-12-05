# MongoDB Atlas Setup Guide

Follow these steps to set up your free MongoDB database for the CP Tracker application.

## Step 1: Create MongoDB Atlas Account

1. Go to [https://www.mongodb.com/cloud/atlas/register](https://www.mongodb.com/cloud/atlas/register)
2. Sign up with your email or Google account
3. Complete the registration

## Step 2: Create a Cluster

1. After logging in, click **"Build a Database"**
2. Select **"M0 FREE"** tier (perfect for this project)
3. Choose a cloud provider (AWS, Google Cloud, or Azure - any works)
4. Select a region closest to you
5. Click **"Create"**
6. Wait 1-3 minutes for the cluster to be created

## Step 3: Create Database User

1. Click **"Database Access"** in the left sidebar
2. Click **"Add New Database User"**
3. Choose **"Password"** authentication
4. Enter a username (e.g., `cptracker`)
5. Click **"Autogenerate Secure Password"** and **SAVE THIS PASSWORD**
6. Set privileges to **"Read and write to any database"**
7. Click **"Add User"**

## Step 4: Allow Network Access

1. Click **"Network Access"** in the left sidebar
2. Click **"Add IP Address"**
3. Click **"Allow Access from Anywhere"** (for development)
   - This adds `0.0.0.0/0` which allows connections from any IP
   - For production, you'd restrict this to specific IPs
4. Click **"Confirm"**

## Step 5: Get Connection String

1. Go back to **"Database"** in the left sidebar
2. Click **"Connect"** on your cluster
3. Click **"Connect your application"**
4. Copy the connection string (looks like this):
   ```
   mongodb+srv://cptracker:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
5. **Replace `<password>` with the actual password** you saved in Step 3
6. Add the database name after `.net/`:
   ```
   mongodb+srv://cptracker:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/cp-tracker?retryWrites=true&w=majority
   ```

## Step 6: Add to Your Application

1. Open `cp-tracker/backend/.env` file
2. Replace the `MONGODB_URI` value with your connection string:
   ```
   MONGODB_URI=mongodb+srv://cptracker:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/cp-tracker?retryWrites=true&w=majority
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   PORT=5000
   NODE_ENV=development
   ```
3. Save the file

## Step 7: Test the Connection

1. Start your backend server:
   ```bash
   cd cp-tracker/backend
   npm run dev
   ```
2. You should see: `✅ Connected to MongoDB`
3. If you see an error, double-check:
   - Password is correct (no < > brackets)
   - Network access is set to 0.0.0.0/0
   - Connection string format is correct

## Troubleshooting

**Error: "Authentication failed"**
- Check that you replaced `<password>` with your actual password
- Make sure there are no extra spaces in the connection string

**Error: "Connection timeout"**
- Check Network Access settings in MongoDB Atlas
- Make sure 0.0.0.0/0 is in the IP Access List

**Error: "Server selection timed out"**
- Your cluster might still be starting up (wait 2-3 minutes)
- Check your internet connection

## You're Done!

Your MongoDB database is now ready. When you create a team in the CP Tracker app, it will automatically:
- Create the team in MongoDB
- Seed 370+ problems from TLE, USACO, and CSES
- Store all user progress in the cloud

You can view your data anytime by:
1. Going to MongoDB Atlas
2. Clicking "Browse Collections"
3. Viewing the `cp-tracker` database
