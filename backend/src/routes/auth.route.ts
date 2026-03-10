import { Router } from "express";
import { loginWithCredentials, registerUser, upsertOAuthUser } from "../controllers/auth.controller";

const router = Router();

router.post("/register", registerUser);
router.post("/login", loginWithCredentials);
router.post("/oauth", upsertOAuthUser);

export default router;

