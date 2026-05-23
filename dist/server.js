

   import { createRequire } from 'module';

   const require = createRequire(import.meta.url);

  

// src/app.ts
import express from "express";

// src/modules/auth/auth.route.ts
import { Router } from "express";

// src/db/index.ts
import { Pool } from "pg";

// src/config/index.ts
import dotenv from "dotenv";
import path from "path";
dotenv.config({
  path: path.join(process.cwd(), ".env")
});
var config = {
  connection_string: process.env.connectionString,
  port: process.env.PORT
};
var config_default = config;

// src/db/index.ts
var pool = new Pool({
  connectionString: config_default.connection_string
});
var initDB = async () => {
  try {
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

// src/modules/auth/auth.service.ts
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
var signup = async (payload) => {
  const { name, email, password, role = "contributor" } = payload;
  const exist = await pool.query("SELECT id FROM users WHERE email=$1", [
    email
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
    [name, email, hashedPassword, role]
  );
  return result.rows[0];
};
var login = async (payload) => {
  const { email, password } = payload;
  const result = await pool.query(
    `
    SELECT id,name,email,password,role,created_at,updated_at
    FROM users
    WHERE email=$1
    `,
    [email]
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
      role: user.role
    },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      created_at: user.created_at,
      updated_at: user.updated_at
    }
  };
};
var authService = {
  signup,
  login
};

// src/modules/auth/auth.controller.ts
var signup2 = async (req, res) => {
  try {
    const result = await authService.signup(req.body);
    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
var login2 = async (req, res) => {
  try {
    const result = await authService.login(req.body);
    res.status(200).json({
      success: true,
      message: "Login successful",
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
var authController = {
  signup: signup2,
  login: login2
};

// src/modules/auth/auth.route.ts
var router = Router();
router.post("/signup", authController.signup);
router.post("/login", authController.login);
var authRouter = router;

// src/modules/issues/issues.route.ts
import { Router as Router2 } from "express";

// src/modules/issues/issues.service.ts
var createIssue = async (payload, user) => {
  const { title, description, type } = payload;
  if (!title || !description || !type) {
    throw new Error("Missing required fields");
  }
  const reporter_id = user.id;
  const result = await pool.query(
    `
    INSERT INTO issues (title, description, type, status, reporter_id)
    VALUES ($1, $2, $3, 'open', $4)
    RETURNING *
    `,
    [title, description, type, reporter_id]
  );
  return result.rows[0];
};
var getAllIssues = async (query) => {
  const { sort = "newest", type, status } = query;
  let sql = `SELECT * FROM issues WHERE 1=1`;
  const params = [];
  if (type) {
    params.push(type);
    sql += ` AND type = $${params.length}`;
  }
  if (status) {
    params.push(status);
    sql += ` AND status = $${params.length}`;
  }
  sql += ` ORDER BY created_at ${sort === "oldest" ? "ASC" : "DESC"}`;
  const issuesRes = await pool.query(sql, params);
  const issues = issuesRes.rows;
  if (issues.length === 0) return [];
  const reporterIds = [...new Set(issues.map((i) => i.reporter_id))];
  const usersRes = await pool.query(
    `
    SELECT id, name, role
    FROM users
    WHERE id = ANY($1)
    `,
    [reporterIds]
  );
  const usersMap = new Map(usersRes.rows.map((u) => [u.id, u]));
  return issues.map((issue) => ({
    ...issue,
    reporter: usersMap.get(issue.reporter_id) || null
  }));
};
var getIssueById = async (id) => {
  if (!id) throw new Error("ID is required");
  const issueRes = await pool.query(
    `SELECT * FROM issues WHERE id=$1`,
    [id]
  );
  if (issueRes.rows.length === 0) {
    throw new Error("Issue not found");
  }
  const issue = issueRes.rows[0];
  const userRes = await pool.query(
    `SELECT id, name, role FROM users WHERE id=$1`,
    [issue.reporter_id]
  );
  return {
    ...issue,
    reporter: userRes.rows[0] || null
  };
};
var updateIssue = async (id, payload, user) => {
  if (!id) throw new Error("ID is required");
  const issueRes = await pool.query(
    `SELECT * FROM issues WHERE id=$1`,
    [id]
  );
  if (issueRes.rows.length === 0) {
    throw new Error("Issue not found");
  }
  const issue = issueRes.rows[0];
  if (user.role === "contributor") {
    if (issue.reporter_id !== user.id) {
      throw new Error("Forbidden");
    }
    if (issue.status !== "open") {
      throw new Error("Only open issues can be updated");
    }
  }
  const { title, description, type } = payload;
  const result = await pool.query(
    `
    UPDATE issues
    SET 
      title = COALESCE($1, title),
      description = COALESCE($2, description),
      type = COALESCE($3, type),
      updated_at = NOW()
    WHERE id=$4
    RETURNING *
    `,
    [title, description, type, id]
  );
  return result.rows[0];
};
var deleteIssue = async (id, user) => {
  if (!id) throw new Error("ID is required");
  const issueRes = await pool.query(
    `SELECT * FROM issues WHERE id=$1`,
    [id]
  );
  if (issueRes.rows.length === 0) {
    throw new Error("Issue not found");
  }
  if (user.role !== "maintainer") {
    throw new Error("Forbidden");
  }
  await pool.query(`DELETE FROM issues WHERE id=$1`, [id]);
};
var issuesService = {
  createIssue,
  getAllIssues,
  getIssueById,
  updateIssue,
  deleteIssue
};

// src/modules/issues/issues.controller.ts
var createIssue2 = async (req, res) => {
  try {
    const result = await issuesService.createIssue(
      req.body,
      req.user
    );
    res.status(201).json({
      success: true,
      message: "Issue created successfully",
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
var getAllIssues2 = async (req, res) => {
  try {
    const result = await issuesService.getAllIssues(req.query);
    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
var getIssueById2 = async (req, res) => {
  try {
    const id = req.params.id;
    if (!id || Array.isArray(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid issue id"
      });
    }
    const result = await issuesService.getIssueById(id);
    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
var updateIssue2 = async (req, res) => {
  try {
    const id = req.params.id;
    if (!id || Array.isArray(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid issue id"
      });
    }
    const result = await issuesService.updateIssue(
      id,
      req.body,
      req.user
    );
    res.status(200).json({
      success: true,
      message: "Issue updated successfully",
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
var deleteIssue2 = async (req, res) => {
  try {
    const id = req.params.id;
    if (!id || Array.isArray(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid issue id"
      });
    }
    await issuesService.deleteIssue(id, req.user);
    res.status(200).json({
      success: true,
      message: "Issue deleted successfully"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
var issuesController = {
  createIssue: createIssue2,
  getAllIssues: getAllIssues2,
  getIssueById: getIssueById2,
  updateIssue: updateIssue2,
  deleteIssue: deleteIssue2
};

// src/middleware/auth.middleware.ts
import jwt2 from "jsonwebtoken";
var authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: "No token provided"
      });
    }
    const token = authHeader.split(" ")[1];
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Token missing"
      });
    }
    const decoded = jwt2.verify(
      token,
      process.env.JWT_SECRET
    );
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token"
    });
  }
};

// src/middleware/role.middleware.ts
var requireRole = (roles) => {
  return (req, res, next) => {
    const user = req.user;
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized"
      });
    }
    if (!roles.includes(user.role)) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: insufficient permissions"
      });
    }
    next();
  };
};

// src/modules/issues/issues.route.ts
var router2 = Router2();
router2.post("/", authMiddleware, issuesController.createIssue);
router2.get("/", issuesController.getAllIssues);
router2.get("/:id", authMiddleware, issuesController.getIssueById);
router2.patch("/:id", authMiddleware, issuesController.updateIssue);
router2.delete(
  "/:id",
  authMiddleware,
  requireRole(["maintainer"]),
  issuesController.deleteIssue
);
var issuesRouter = router2;

// src/app.ts
var app = express();
app.use(express.json());
app.use(express.text());
app.use(express.urlencoded({ extended: true }));
app.get("/", (req, res) => {
  res.send("Server is running!");
});
app.use("/api/auth", authRouter);
app.use("/api/issues", issuesRouter);
var app_default = app;

// src/server.ts
var main = () => {
  initDB();
  app_default.listen(config_default.port, () => {
    console.log(`Example app listening on port ${config_default.port}`);
  });
};
main();
//# sourceMappingURL=server.js.map