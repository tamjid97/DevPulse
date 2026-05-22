import express, {
  type Application,
  type Request,
  type Response,
} from "express";
import config from "./config";
import { initDB, pool } from "./db";
import { userRouter } from "./modules/user/user.rout";

const app: Application = express();


app.use(express.json());
app.use(express.text());
app.use(express.urlencoded({ extended: true }));


app.use('/api/users', userRouter)


export default app