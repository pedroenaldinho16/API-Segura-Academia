import type { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt, { type SignOptions } from "jsonwebtoken";
import { prisma } from "../lib/prisma.ts";
import { emailValido, texto, usuarioSeguro } from "../utils/validacao.ts";

function tokenPara(usuario: { id: number; role: string }): string {
  return jwt.sign(
    { role: usuario.role },
    process.env.JWT_SECRET!,
    { algorithm: "HS256", subject: String(usuario.id), expiresIn: process.env.JWT_EXPIRES_IN || "2h" } as SignOptions,
  );
}

export async function register(req: Request, res: Response) {
  const nome = texto(req.body?.nome, 100);
  const email = emailValido(req.body?.email);
  const senha = req.body?.senha;
  if (!nome || !email || typeof senha !== "string" || senha.length < 6 || senha.length > 72) {
    return res.status(400).json({ erro: "Informe nome, e-mail válido e senha de 6 a 72 caracteres" });
  }
  const jaExiste = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (jaExiste) return res.status(409).json({ erro: "Não foi possível cadastrar este e-mail" });
  const password = await bcrypt.hash(senha, 12);
  try {
    const user = await prisma.user.create({
      data: { nome, email, password }, // Nunca aceitar role enviado no body.
      select: usuarioSeguro,
    });
    return res.status(201).json({ mensagem: "Cadastro realizado", usuario: user });
  } catch (err: any) {
    if (err?.code === "P2002") return res.status(409).json({ erro: "Não foi possível cadastrar este e-mail" });
    throw err;
  }
}

export async function login(req: Request, res: Response) {
  const email = emailValido(req.body?.email);
  const senha = req.body?.senha;
  if (!email || typeof senha !== "string") return res.status(401).json({ erro: "E-mail ou senha inválidos" });
  const usuario = await prisma.user.findUnique({ where: { email } });
  const senhaOk = usuario ? await bcrypt.compare(senha, usuario.password) : false;
  if (!usuario || !senhaOk) return res.status(401).json({ erro: "E-mail ou senha inválidos" });
  return res.status(200).json({
    token: tokenPara(usuario),
    tipo: "Bearer",
    expiresIn: process.env.JWT_EXPIRES_IN || "2h",
    usuario: { id: usuario.id, nome: usuario.nome, email: usuario.email, role: usuario.role },
  });
}

export async function me(req: Request, res: Response) {
  const usuario = await prisma.user.findUnique({
    where: { id: req.usuario!.id }, select: usuarioSeguro,
  });
  if (!usuario) return res.status(401).json({ erro: "Usuário não encontrado" });
  return res.status(200).json({ usuario });
}

// Extra (+0,2): exige senha atual, troca hash e não retorna senha.
export async function mudarSenha(req: Request, res: Response) {
  const { senhaAtual, novaSenha } = req.body ?? {};
  if (typeof senhaAtual !== "string" || typeof novaSenha !== "string" || novaSenha.length < 6 || novaSenha.length > 72) {
    return res.status(400).json({ erro: "Informe senha atual e nova senha de 6 a 72 caracteres" });
  }
  const usuario = await prisma.user.findUnique({ where: { id: req.usuario!.id } });
  if (!usuario || !(await bcrypt.compare(senhaAtual, usuario.password))) {
    return res.status(401).json({ erro: "Senha atual incorreta" });
  }
  await prisma.user.update({ where: { id: usuario.id }, data: { password: await bcrypt.hash(novaSenha, 12) } });
  return res.status(200).json({ mensagem: "Senha atualizada" });
}
