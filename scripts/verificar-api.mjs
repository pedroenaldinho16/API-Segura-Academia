// Testes automatizados de integração contra a API rodando com o seed já aplicado.
// Executar: npm run test:api   (use um banco de demonstração: cria/exclui dados)
const BASE = process.env.API_URL || "http://localhost:3000";
const ts = Date.now();
let admin, joao, maria, novo;
let sucesso = 0;
let falhas = 0;

async function request(metodo, caminho, body, token) {
  const h = {};
  if (body !== undefined) h["Content-Type"] = "application/json";
  if (token) h.Authorization = `Bearer ${token}`;
  const resposta = await fetch(BASE + caminho, { method: metodo, headers: h, body: body === undefined ? undefined : JSON.stringify(body) });
  const json = await resposta.json().catch(() => ({}));
  return { status: resposta.status, json };
}
function verificar(nome, recebido, esperado, extra = true) {
  const ok = recebido.status === esperado && extra;
  console.log(`${ok ? "OK  " : "ERRO"} ${nome}: esperado ${esperado}, recebido ${recebido.status}${extra ? "" : " (regra adicional falhou)"}`);
  if (ok) sucesso++; else falhas++;
}

try {
  let r = await request("GET", "/");
  verificar("GET /", r, 200);

  // Apenas 4 logins até aqui. O extra 429 é testado no final.
  r = await request("POST", "/auth/login", { email: "admin@academia.test", senha: "Treino@123" });
  verificar("Login ADMIN", r, 200); admin = r.json.token;
  r = await request("POST", "/auth/login", { email: "joao@academia.test", senha: "Treino@123" });
  verificar("Login João", r, 200); joao = r.json.token;
  r = await request("POST", "/auth/login", { email: "maria@academia.test", senha: "Treino@123" });
  verificar("Login Maria", r, 200); maria = r.json.token;

  r = await request("POST", "/auth/register", { nome: "Aluno Integração", email: `integracao${ts}@academia.test`, senha: "Senha@123", role: "ADMIN" });
  verificar("T1 - Cadastro 201 sem senha e USER", r, 201, !!r.json.usuario && !("password" in r.json.usuario) && r.json.usuario.role === "USER");
  novo = r.json.usuario?.id;
  r = await request("POST", "/auth/register", { nome: "Duplicado", email: `integracao${ts}@academia.test`, senha: "Senha@123" });
  verificar("T2 - E-mail repetido", r, 409);
  r = await request("POST", "/auth/login", { email: "joao@academia.test", senha: "errada" });
  verificar("T3 - Senha errada", r, 401);
  r = await request("GET", "/auth/me"); verificar("T4 - Sem token", r, 401);
  r = await request("GET", "/auth/me", undefined, joao); verificar("T5 - Token válido", r, 200);
  r = await request("GET", "/auth/me", undefined, "quebrado"); verificar("R6 - Token inválido", r, 401);
  const respFormato = await fetch(BASE + "/auth/me", { headers: { Authorization: "Token errado" } });
  verificar("R6 - Bearer incorreto", { status: respFormato.status }, 401);

  const treinos = await request("GET", "/treinos", undefined, maria);
  verificar("Maria vê apenas seus treinos", treinos, 200, treinos.json.treinos?.length >= 1 && treinos.json.treinos.every((t) => t.owner.nome === "Maria"));
  const treinoMaria = treinos.json.treinos?.[0]?.id;
  r = await request("POST", "/treinos", { titulo: "Teste automático", objetivo: "Resistência", exercicios: "Agachamento 3x10", ownerId: treinoMaria }, joao);
  const novoTreino = r.json.treino?.id;
  const perfilJoao = await request("GET", "/auth/me", undefined, joao);
  verificar("T6 - Dono do body ignorado", r, 201, r.json.treino?.ownerId === perfilJoao.json.usuario?.id);
  r = await request("PUT", `/treinos/${treinoMaria}`, { titulo: "Invasão" }, joao); verificar("T7 - Alterar treino alheio", r, 403);
  r = await request("GET", "/users", undefined, joao); verificar("T8 - USER em rota ADMIN", r, 403);
  r = await request("GET", "/users", undefined, admin);
  verificar("T9 - ADMIN em rota ADMIN sem senhas", r, 200, Array.isArray(r.json.usuarios) && r.json.usuarios.every((u) => !("password" in u)));
  r = await request("DELETE", "/treinos/999999", undefined, joao); verificar("T10 - Recurso inexistente", r, 404);
  r = await request("PUT", `/treinos/${novoTreino}`, { concluido: true }, joao); verificar("Dono altera o próprio treino", r, 200, r.json.treino?.concluido === true);
  r = await request("DELETE", `/treinos/${novoTreino}`, undefined, joao); verificar("Dono exclui o próprio treino", r, 200);
  r = await request("PATCH", `/users/${novo}/role`, { role: "ADMIN" }, joao); verificar("USER não altera perfil", r, 403);
  r = await request("PATCH", `/users/${novo}/role`, { role: "ADMIN" }, admin); verificar("ADMIN altera perfil", r, 200, r.json.usuario?.role === "ADMIN");

  // O quinto login é aceito; o sexto é bloqueado com 429 (extra).
  r = await request("POST", "/auth/login", { email: "nenhum@academia.test", senha: "errada" });
  verificar("Quinta tentativa de login", r, 401);
  r = await request("POST", "/auth/login", { email: "nenhum@academia.test", senha: "errada" });
  verificar("Extra - Bloqueio de login", r, 429);
} catch (erro) {
  console.error("Falha ao acessar a API. Inicie com npm run dev e aplique o seed.", erro);
  process.exitCode = 1;
}
console.log(`\nRESULTADO: ${sucesso} verificações corretas, ${falhas} falhas.`);
if (falhas) process.exitCode = 1;
