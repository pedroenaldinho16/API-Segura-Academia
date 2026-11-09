import type { Request, Response, NextFunction } from "express";
type Role = "USER" | "ADMIN";

export function autorizar(...perfis: Role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.usuario) return res.status(401).json({ erro: "Faça login" });
    if (!perfis.includes(req.usuario.role)) {
      return res.status(403).json({ erro: "Acesso proibido para este perfil" });
    }
    return next();
  };
}
