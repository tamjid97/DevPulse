import { pool } from "../../db";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const signup = async (payload: any) => {
  const { name, email, password, role = "contributor" } = payload;

  const exist = await pool.query("SELECT id FROM users WHERE email=$1", [
    email,
  ]);

  if (exist.rows.length > 0) {
    throw new Error("User already exists");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const result = await pool.query(
    `
    INSERT INTO users(name,email,password,role)
    VALUES($1,$2,$3,$4)
    RETURNING id,name,email,role,created_at,updated_at
    `,
    [name, email, hashedPassword, role],
  );

  return result.rows[0];
};

const login = async (payload: any) => {
  const { email, password } = payload;

  const result = await pool.query(
    `
    SELECT id,name,email,password,role,created_at,updated_at
    FROM users
    WHERE email=$1
    `,
    [email],
  );

  if (result.rows.length === 0) {
    throw new Error("User not found");
  }

  const user = result.rows[0];

  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    throw new Error("Invalid password");
  }

  const token = jwt.sign(
    {
      id: user.id,
      name: user.name,
      role: user.role,
    },
    process.env.JWT_SECRET as string,
    { expiresIn: "7d" },
  );

  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      created_at: user.created_at,
      updated_at: user.updated_at,
    },
  };
};

export const authService = {
  signup,
  login,
};
