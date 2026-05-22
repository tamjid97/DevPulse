import { pool } from "../../db";

/**
 * CREATE ISSUE
 */
const createIssue = async (payload: any, user: any) => {
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

/**
 * GET ALL ISSUES (FILTER + SORT + NO JOIN RULE)
 */
const getAllIssues = async (query: any) => {
  const { sort = "newest", type, status } = query;

  let sql = `SELECT * FROM issues WHERE 1=1`;
  const params: any[] = [];

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
    reporter: usersMap.get(issue.reporter_id) || null,
  }));
};

/**
 * GET SINGLE ISSUE
 */
const getIssueById = async (id: string) => {
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
    reporter: userRes.rows[0] || null,
  };
};

/**
 * UPDATE ISSUE (ROLE RULE)
 */
const updateIssue = async (id: string, payload: any, user: any) => {
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

/**
 * DELETE ISSUE
 */
const deleteIssue = async (id: string, user: any) => {
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

export const issuesService = {
  createIssue,
  getAllIssues,
  getIssueById,
  updateIssue,
  deleteIssue,
};