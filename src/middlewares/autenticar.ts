import type { Request, Response, NextFunction } from "express";
import jwt, { type JwtPayload } from "jsonwebtoken";
import { prisma } from "../lib/prisma.ts";

// O token prova a identidade, mas o perfil mais recente é consultado no banco.
export async function autenticar(req: Request, res: Response, next: NextFunction) {
  const authorization = req.headers.authorization;
  if (!authorization) {
    res.set("WWW-Authenticate", "Bearer");
    return res.status(401).json({ erro: "Token ausente" });
  }
  const partes = authorization.split(" ");
  if (partes.length !== 2 || partes[0] !== "Bearer" || !partes[1]) {
    res.set("WWW-Authenticate", "Bearer");
    return res.status(401).json({ erro: "Use Authorization: Bearer <token>" });
  }
  try {
    const payload = jwt.verify(partes[1], process.env.JWT_SECRET!, { algorithms: ["HS256"] });
    if (typeof payload === "string" || !/^[1-9]\d*$/.test(String(payload.sub))) {
      return res.status(401).json({ erro: "Token inválido" });
    }
    const dados = payload as JwtPayload;
    const usuario = await prisma.user.findUnique({
      where: { id: Number(dados.sub) },
      select: { id: true, nome: true, email: true, role: true },
    });
    if (!usuario) return res.status(401).json({ erro: "Token inválido" });
    req.usuario = usuario;
    return next();
  } catch (erro) {
    return res.status(401).json({ erro: "Token inválido ou expirado" });
  }
}
