import "dotenv/config";
import { app } from "./app.ts";
import { prisma } from "./lib/prisma.ts";

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  throw new Error("JWT_SECRET deve ter pelo menos 32 caracteres (configure no .env)");
}
const porta = Number(process.env.PORT ?? 3000);
const servidor = app.listen(porta, () => {
  console.log(`API Segura Academia: http://localhost:${porta}`);
  console.log(`Painel de demonstração: http://localhost:${porta}/painel`);
});
const encerrar = async () => {
  servidor.close();
  await prisma.$disconnect();
};
process.once("SIGTERM", () => { void encerrar(); });
process.once("SIGINT", () => { void encerrar(); });
