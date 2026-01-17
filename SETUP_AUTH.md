# Authentication & Database Setup Guide

## Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```env
# MongoDB Connection String
# Replace <db_password> with your actual password (123 in your case)
MONGODB_URI=mongodb+srv://hetjani818_db_user:123@cluster0.ey1vj9t.mongodb.net/invoify?retryWrites=true&w=majority

# JWT Secret Key (change this to a secure random string in production)
JWT_SECRET=your-super-secret-jwt-key-change-in-production-min-32-chars

# Nodemailer (if you're using email features)
NODEMAILER_EMAIL=your-email@example.com
NODEMAILER_PW=your-email-password

# Google Search Console (optional)
GOOGLE_SC_VERIFICATION=
```

## Features

1. **User Authentication**
   - Sign up with email and password
   - Login with credentials
   - JWT token stored in HTTP-only cookies
   - Logout functionality

2. **Invoice Storage**
   - When logged in: Invoices are saved to MongoDB database
   - When not logged in: Invoices are saved to localStorage (as before)
   - Users can access their invoices from any device after login

3. **Database Collections**
   - `users`: Stores user accounts
   - `invoices`: Stores user invoices

## How It Works

- **Login/Signup**: Available in the navbar
- **Saving Invoices**: Automatically saves to database if logged in, otherwise uses localStorage
- **Loading Invoices**: Fetches from database when logged in, from localStorage otherwise
- **Access Anywhere**: Once logged in, all invoices are synced to the database and accessible from any device

## Installation

The required packages have been added to `package.json`. Run:

```bash
npm install
```

Then create the `.env.local` file with your MongoDB connection string and JWT secret.

