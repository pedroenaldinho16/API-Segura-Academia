import { Router } from "express";
import { autenticar } from "../middlewares/autenticar.ts";
import { autorizar } from "../middlewares/autorizar.ts";
import { listarUsuarios, alterarRole } from "../controllers/users.controller.ts";

export const usersRouter = Router();
usersRouter.use(autenticar, autorizar("ADMIN"));
usersRouter.get("/", listarUsuarios);
usersRouter.patch("/:id/role", alterarRole);
