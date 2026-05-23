import { Pool } from "pg";
import config from "../config";


console.log("DATABASE_URL:", process.env.DATABASE_URL);

export const pool = new Pool({
  connectionString: config.connectionString,
  ssl: {
    rejectUnauthorized: false,
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
)
    `);

    // ISSUES TABLE
    await pool.query(`
      CREATE TABLE IF NOT EXISTS issues (
        id SERIAL PRIMARY KEY,
        title VARCHAR(150) NOT NULL,
        description TEXT NOT NULL,
        type VARCHAR(20) CHECK (type IN ('bug','feature_request')) NOT NULL,
        status VARCHAR(20) DEFAULT 'open'
          CHECK (status IN ('open','in_progress','resolved')),
        reporter_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    console.log("Database connected successfully!");
  } catch (error) {
    console.log(error);
  }
};

initDB();