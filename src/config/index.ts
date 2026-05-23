import dotenv from "dotenv";

dotenv.config();

const config = {
  connectionString: process.env.DATABASE_URL,
  port: process.env.PORT,
  jwt_secret: process.env.JWT_SECRET,
};

export default config;