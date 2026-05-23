import dotenv from "dotenv";
import path from "path";

dotenv.config({
  path: path.join(process.cwd(), ".env"),
});

const config = {
  connectionString: process.env.DATABASE_URL as string,
  port: process.env.PORT,
  jwt_secret: process.env.JWT_SECRET as string,
};

export default config;