export function texto(valor: unknown, limite = 150): string | null {
  return typeof valor === "string" && valor.trim().length > 0 && valor.trim().length <= limite
    ? valor.trim()
    : null;
}

export function emailValido(valor: unknown): string | null {
  if (typeof valor !== "string") return null;
  const email = valor.trim().toLowerCase();
  return email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    ? email
    : null;
}

export function idValido(valor: string): number | null {
  if (!/^[1-9]\d*$/.test(valor)) return null;
  const n = Number(valor);
  return Number.isSafeInteger(n) && n > 0 ? n : null;
}

export const usuarioSeguro = {
  id: true, nome: true, email: true, role: true, createdAt: true,
} as const;
