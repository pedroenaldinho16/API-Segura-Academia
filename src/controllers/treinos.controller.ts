import type { Request, Response } from "express";
import { prisma } from "../lib/prisma.ts";
import { texto, idValido } from "../utils/validacao.ts";

// Se USER, busca apenas o que pertence a ele. ADMIN vê todos.
export async function listarTreinos(req: Request, res: Response) {
  const filtro = req.usuario!.role === "ADMIN" ? {} : { ownerId: req.usuario!.id };
  const treinos = await prisma.treino.findMany({
    where: filtro, orderBy: { id: "asc" },
    include: { owner: { select: { id: true, nome: true } } },
  });
  return res.status(200).json({ treinos });
}

export async function criarTreino(req: Request, res: Response) {
  const titulo = texto(req.body?.titulo, 120);
  const objetivo = texto(req.body?.objetivo, 200);
  const exercicios = texto(req.body?.exercicios, 1000);
  if (!titulo || !objetivo || !exercicios) {
    return res.status(400).json({ erro: "Título, objetivo e exercícios são obrigatórios" });
  }
  const treino = await prisma.treino.create({
    data: { titulo, objetivo, exercicios, ownerId: req.usuario!.id }, // body.ownerId ignorado!
  });
  return res.status(201).json({ treino });
}

async function verificarAcesso(req: Request, res: Response) {
  const id = idValido(req.params.id as string);
  if (!id) { res.status(400).json({ erro: "ID deve ser um inteiro positivo" }); return null; }
  const treino = await prisma.treino.findUnique({ where: { id } });
  // Requisito: 404 antes de 403.
  if (!treino) { res.status(404).json({ erro: "Treino não encontrado" }); return null; }
  if (treino.ownerId !== req.usuario!.id && req.usuario!.role !== "ADMIN") {
    res.status(403).json({ erro: "Apenas o dono ou ADMIN pode acessar este treino" }); return null;
  }
  return treino;
}

export async function obterTreino(req: Request, res: Response) {
  const treino = await verificarAcesso(req, res);
  if (!treino) return;
  return res.status(200).json({ treino });
}

export async function atualizarTreino(req: Request, res: Response) {
  const treino = await verificarAcesso(req, res);
  if (!treino) return;
  const data: { titulo?: string; objetivo?: string; exercicios?: string; concluido?: boolean } = {};
  for (const campo of ["titulo", "objetivo", "exercicios"] as const) {
    if (req.body?.[campo] !== undefined) {
      const valor = texto(req.body[campo], campo === "exercicios" ? 1000 : 200);
      if (!valor) return res.status(400).json({ erro: `Campo ${campo} inválido` });
      data[campo] = valor;
    }
  }
  if (req.body?.concluido !== undefined) {
    if (typeof req.body.concluido !== "boolean") return res.status(400).json({ erro: "concluido precisa ser booleano" });
    data.concluido = req.body.concluido;
  }
  if (Object.keys(data).length === 0) return res.status(400).json({ erro: "Nenhum campo válido para atualizar" });
  const atualizado = await prisma.treino.update({ where: { id: treino.id }, data });
  return res.status(200).json({ treino: atualizado });
}

export async function excluirTreino(req: Request, res: Response) {
  const treino = await verificarAcesso(req, res);
  if (!treino) return;
  await prisma.treino.delete({ where: { id: treino.id } });
  return res.status(200).json({ mensagem: "Treino removido" });
}
