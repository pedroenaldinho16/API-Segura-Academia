import "dotenv/config";
import bcrypt from "bcryptjs";
import { prisma } from "../src/lib/prisma.ts";

async function main() {
  const senhaTeste = "Treino@123"; // Demonstração local: não usar em produção.
  const password = await bcrypt.hash(senhaTeste, 12);
  const pessoas = [
    { nome: "Professora Ana", email: "admin@academia.test", role: "ADMIN" as const },
    { nome: "João", email: "joao@academia.test", role: "USER" as const },
    { nome: "Maria", email: "maria@academia.test", role: "USER" as const },
  ];
  for (const dados of pessoas) {
    await prisma.user.upsert({
      where: { email: dados.email },
      update: { nome: dados.nome, role: dados.role, password },
      create: { ...dados, password },
    });
  }
  const joao = await prisma.user.findUniqueOrThrow({ where: { email: "joao@academia.test" } });
  const maria = await prisma.user.findUniqueOrThrow({ where: { email: "maria@academia.test" } });
  await prisma.treino.deleteMany({ where: { ownerId: { in: [joao.id, maria.id] } } });
  await prisma.treino.createMany({ data: [
    { titulo: "Treino A - Peito", objetivo: "Hipertrofia", exercicios: "Supino reto 3x10; flexão 3x12", ownerId: joao.id },
    { titulo: "Treino B - Pernas", objetivo: "Resistência", exercicios: "Agachamento 3x12; leg press 3x12", ownerId: maria.id },
  ] });
  console.log("Seed concluído: 1 ADMIN, 2 USERs e 2 treinos. Senha demonstrativa:", senhaTeste);
}
main().catch((e) => { console.error(e); process.exitCode = 1; }).finally(async () => prisma.$disconnect());
