import { Router } from "express";
import { autenticar } from "../middlewares/autenticar.ts";
import {
  listarTreinos, criarTreino, obterTreino, atualizarTreino, excluirTreino,
} from "../controllers/treinos.controller.ts";

export const treinosRouter = Router();
treinosRouter.use(autenticar);
treinosRouter.get("/", listarTreinos);
treinosRouter.post("/", criarTreino);
treinosRouter.get("/:id", obterTreino);
treinosRouter.put("/:id", atualizarTreino);
treinosRouter.delete("/:id", excluirTreino);
