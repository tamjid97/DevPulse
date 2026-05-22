import { Router } from "express";
import { authController } from "./auth.controller";

const router =Router();

// SIGNUP
router.post("/signup", authController.signup);

// LOGIN
router.post("/login", authController.login);

export const authRouter = router;