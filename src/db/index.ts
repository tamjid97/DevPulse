import { Pool } from "pg";
import config from "../config";

// Vercel যেন কোনোভাবেই এটিকে undefined না পায়, তাই সরাসরি ব্যাকআপ দেওয়া হলো
const connectionString = config.connectionString || process.env.DATABASE_URL;

export const pool = new Pool({
  connectionString: connectionString,
  ssl: {
    rejectUnauthorized: false, // Neon DB ক্লাউড কানেকশনের জন্য এটি বাধ্যতামূলক
  },
});

export const initDB = async () => {
  try {
    // USERS TABLE (AUTH)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role VARCHAR(20) DEFAULT 'contributor',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // ISSUES TABLE
    await pool.query(`
      CREATE TABLE IF NOT EXISTS issues (
        id SERIAL PRIMARY KEY,
        title VARCHAR(150) NOT NULL,
        description TEXT NOT NULL,
        type VARCHAR(20) CHECK (type IN ('bug','feature_request')) NOT NULL,
        status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open','in_progress','resolved')),
        reporter_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    console.log("Database connected and tables initialized successfully!");
  } catch (error) {
    console.error("Database connection/initialization failed:", error);
    throw error; // মেইন ফাংশনে এররটি পাস করার জন্য
  }
};

// ❌ ফাইলের ভেতর থেকে সরাসরি initDB(); কলটি কেটে দেওয়া হয়েছে।