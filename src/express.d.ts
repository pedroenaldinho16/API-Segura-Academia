type Role = "USER" | "ADMIN";

declare global {
  namespace Express {
    interface Request {
      usuario?: { id: number; nome: string; email: string; role: Role };
    }
  }
}
export {};
