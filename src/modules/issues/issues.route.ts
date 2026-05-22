import { Router } from "express";
import { issuesController } from "./issues.controller";
import { authMiddleware } from "../../middleware/auth.middleware";
import { requireRole } from "../../middleware/role.middleware";

const router = Router();

router.post("/", authMiddleware, issuesController.createIssue);

router.get("/", issuesController.getAllIssues);

router.get("/:id", authMiddleware, issuesController.getIssueById);

router.patch("/:id", authMiddleware, issuesController.updateIssue);

router.delete(
  "/:id",
  authMiddleware,
  requireRole(["maintainer"]),
  issuesController.deleteIssue
);

export const issuesRouter = router;