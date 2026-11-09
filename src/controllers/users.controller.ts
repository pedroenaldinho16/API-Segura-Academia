import type { Request, Response } from "express";
import { prisma } from "../lib/prisma.ts";
import { idValido, usuarioSeguro } from "../utils/validacao.ts";

export async function listarUsuarios(_req: Request, res: Response) {
  const usuarios = await prisma.user.findMany({
    select: usuarioSeguro, orderBy: { id: "asc" },
  });
  return res.status(200).json({ usuarios });
}

export async function alterarRole(req: Request, res: Response) {
  const id = idValido(req.params.id as string);
  if (!id) return res.status(400).json({ erro: "ID inválido" });
  const role = req.body?.role;
  if (role !== "USER" && role !== "ADMIN") return res.status(400).json({ erro: "Use USER ou ADMIN" });
  const usuario = await prisma.user.findUnique({ where: { id }, select: { id: true } });
  if (!usuario) return res.status(404).json({ erro: "Usuário não encontrado" });
  // Não deixar que um ADMIN remova a própria permissão por engano.
  if (id === req.usuario!.id && role !== "ADMIN") {
    return res.status(400).json({ erro: "Não remova seu próprio acesso de administrador" });
  }
  const atualizado = await prisma.user.update({ where: { id }, data: { role }, select: usuarioSeguro });
  return res.status(200).json({ usuario: atualizado });
}
