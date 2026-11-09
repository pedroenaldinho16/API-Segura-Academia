import express, { type ErrorRequestHandler } from "express";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { authRouter } from "./routes/auth.routes.ts";
import { treinosRouter } from "./routes/treinos.routes.ts";
import { usersRouter } from "./routes/users.routes.ts";

const app = express();
app.disable("x-powered-by");
app.use(express.json({ limit: "20kb" }));
app.get("/", (_req, res) => res.status(200).json({
  projeto: "API Segura Academia", status: "online", mensagem: "Acesse /painel para testar a interface",
}));
const pastaPublica = join(dirname(fileURLToPath(import.meta.url)), "../public");
app.get("/painel", (_req, res) => res.sendFile(join(pastaPublica, "index.html")));
app.use(express.static(pastaPublica));
app.use("/auth", authRouter);
app.use("/treinos", treinosRouter);
app.use("/users", usersRouter);
app.use((_req, res) => res.status(404).json({ erro: "Rota inexistente" }));
const tratarErro: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof SyntaxError && "body" in err) {
    res.status(400).json({ erro: "JSON inválido" }); return;
  }
  console.error("Erro interno:", err);
  res.status(500).json({ erro: "Erro interno do servidor" });
};
app.use(tratarErro);
export { app };
