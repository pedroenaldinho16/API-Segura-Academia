# PARTE 3 — Roteiro de apresentação (8–10 minutos)

**Projeto:** API Segura Academia  
**Antes de começar:** fazer `npx prisma db seed`, deixar `npm run dev` em execução, abrir `http://localhost:3000/painel` e ter os tokens de João e ADMIN prontos no `requests.http`. Cada integrante precisa saber explicar **todos** os trechos: o professor pode sortear a pergunta.

## Integrante 1 — Abertura e conceito (aprox. 2 minutos)

> "Nosso tema é academia, e o recurso principal é o treino. Cada aluno pode criar, consultar, editar e excluir seus próprios treinos. Também existe o perfil ADMIN, que representa um instrutor e tem acesso a todos os treinos e à administração de usuários."
>
> "A diferença principal é que autenticação confirma quem está pedindo acesso, e autorização define o que essa pessoa pode fazer. Por isso, usamos JWT para identificar o usuário e regras de perfil e de propriedade para liberar as ações."
>
> "Na relação do banco, um usuário pode ter muitos treinos, mas cada treino pertence a exatamente um usuário. A senha não fica salva como texto: usamos bcrypt para transformá-la em hash com salt."

**Mostrar:** `prisma/schema.prisma`, campos de `User` e `Treino`.

## Integrante 2 — Fluxo de autenticação (aprox. 2 minutos)

> "Quando o aluno se cadastra, validamos os campos, aplicamos bcrypt e criamos uma conta USER. O usuário não pode se cadastrar como ADMIN só escrevendo isso no JSON."
>
> "No login, a API procura o e-mail e confere a senha com bcrypt.compare. Quando as credenciais estão certas, ela devolve um JWT com o identificador do usuário, o role e a validade de duas horas."
>
> "A requisição protegida vai com Authorization: Bearer e o token. O middleware autenticar verifica a assinatura e expiração com jwt.verify e busca o usuário atual no banco. Um token ausente ou inválido recebe HTTP 401."

**Mostrar:** diagrama Mermaid do README, `auth.controller.ts`, `autenticar.ts`.

## Integrante 3 — Demonstração prática (aprox. 4 minutos)

Abra `requests.http` ou Thunder Client. Mostre nesta ordem:

| Passo | Requisição | Resposta | Frase para explicar |
|---|---|---|---|
| 1 | Login do João `POST /auth/login` | 200 + token | "O servidor compara a senha e assina o JWT." |
| 2 | Cole o token de demonstração em jwt.io | Header e payload | "O payload não é criptografado; a assinatura evita modificações não autorizadas." |
| 3 | `GET /auth/me` sem token | 401 | "A API ainda não sabe quem fez a requisição." |
| 4 | `GET /auth/me` com JWT do João | 200 | "O token é válido e o usuário foi identificado." |
| 5 | `PUT /treinos/:id` do treino da Maria com token do João | 403 | "João está logado, mas não é dono do treino." |
| 6 | `GET /users` com token do João | 403 | "O perfil USER não tem autorização para esta rota." |
| 7 | `GET /users` com token ADMIN | 200 | "O instrutor é ADMIN e tem permissão." |

Se sobrar tempo: apresente o painel visual, a troca de senha e o bloqueio de login por excesso de tentativas (429).

## Conclusão e arguição (aprox. 1–2 minutos)

> "Nossa API protege os dados de duas formas: confirma a identidade pelo JWT e confere o que o usuário pode fazer por perfil e por dono. O backend nunca aceita o dono informado no corpo da requisição. Além disso, a senha não é retornada em nenhuma resposta, e a chave secreta não vai para o GitHub."

### Perguntas prováveis (prepare cada integrante)

**1. Onde a senha vira hash?** Em `auth.controller.ts`, `bcrypt.hash(senha, 12)`. Dois hashes podem diferir por causa do salt aleatório.

**2. Se eu mudar a assinatura do JWT?** `jwt.verify` não aceitará; o middleware devolve `401`.

**3. Por que `try/catch` em `jwt.verify`?** Porque tokens inválidos, adulterados ou expirados causam exceção; o servidor transforma isso em resposta `401`.

**4. Por que `autorizar` vem depois de `autenticar`?** Porque primeiro precisamos obter `req.usuario`, depois verificar o perfil.

**5. De onde vem o `ownerId`?** De `req.usuario.id`, preenchido depois da validação do JWT, e não do body.

**6. Se um USER virar ADMIN, o token antigo muda?** Não. Mas nosso middleware consulta o perfil atual no banco a cada requisição, então a nova permissão já passa a valer; o token antigo continua assinado e válido até expirar.

**7. Onde fica a chave secreta?** Em `.env`, não enviado ao GitHub. Se vazar, alguém poderia forjar tokens.

**8. Diferença entre `401` e `403`?** `401` é ausência de credenciais válidas; `403` é identidade válida, mas sem autorização.

**9. O logout revoga o token?** Não neste protótipo. O painel só apaga a variável local; revogação exigiria mecanismo adicional.

**10. Qual é o ponto extra?** Limite de cinco tentativas de login a cada 15 min (`429`), troca de senha verificando a atual e painel HTML + `fetch`.

### Plano B se a demonstração ao vivo falhar

Grave um vídeo curto **depois de testar a API de verdade** passando pelos sete passos principais. Não entregue um vídeo que não tenha sido feito pelo grupo. O professor permite um vídeo de reserva, mas a demonstração ao vivo é exigida.
