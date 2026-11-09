import "dotenv/config";
import jwt from "jsonwebtoken";
import { prisma } from "../src/lib/prisma.ts";

try {
  const usuario = await prisma.user.findUniqueOrThrow({ where: { email: "joao@academia.test" } });
  const token = jwt.sign({ role: usuario.role }, process.env.JWT_SECRET!, {
    algorithm: "HS256", subject: String(usuario.id), expiresIn: "2h",
  });
  console.log("JWT DEMONSTRATIVO (não publique token real):\n", token);
  console.log("\nHeader e payload decodificados:\n", JSON.stringify(jwt.decode(token, { complete: true }), null, 2));
} finally {
  await prisma.$disconnect();
}
