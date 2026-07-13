import express from "express";
import auth from "../../middlewares/auth";
import { UserController } from "./user.controller";

const router = express.Router();

router.get("/:userId", auth(), UserController.getUserById);

export const UserRoutes = router;
