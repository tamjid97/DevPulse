import express, {
  type Application,
  type Request,
  type Response,
} from "express";
import config from "./config";
import { initDB, pool } from "./db";
import { userRouter } from "./modules/user/user.rout";
import { authRouter } from "./modules/auth/auth.route";
import { issuesRouter } from "./modules/issues/issues.route";

const app: Application = express();


app.use(express.json());
app.use(express.text());
app.use(express.urlencoded({ extended: true }));


app.use('/api/users', userRouter)
app.use("/api/auth", authRouter);    // auth module
app.use("/api/issues", issuesRouter);

export default app