import { Router } from "express";
import { rateLimit } from "express-rate-limit";
import { register, login, me, mudarSenha } from "../controllers/auth.controller.ts";
import { autenticar } from "../middlewares/autenticar.ts";

export const authRouter = Router();
// Extra (+0,3): após 5 requisições em 15 minutos, responde 429.
const limitarLogin = rateLimit({
  windowMs: 15 * 60 * 1000, limit: 5,
  standardHeaders: "draft-8", legacyHeaders: false,
  message: { erro: "Muitas tentativas. Tente novamente em 15 minutos." },
});
authRouter.post("/register", register);
authRouter.post("/login", limitarLogin, login);
authRouter.get("/me", autenticar, me);
authRouter.patch("/senha", autenticar, mudarSenha);
