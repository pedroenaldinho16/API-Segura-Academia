# PARTE 1 — Pesquisa: autenticação, autorização e JWT

**ETECAMP | 3º AI | Projeto API Segura — Academia**  
**Integrantes:** [Nome completo 1] · [Nome completo 2] · [Nome completo 3]  
**Data:** 09/11/2026

As respostas usam como exemplo o projeto **API Segura Academia**, em que usuários criam treinos próprios e administradores têm acesso ampliado. O código e a pesquisa foram organizados com apoio de IA; a equipe deve revisar com suas palavras e conseguir explicar cada conceito na apresentação.

## A. Fundamentos

### 1. Autenticação × autorização

Autenticação é o processo de confirmar quem está tentando usar um sistema, por exemplo, verificar e-mail e senha no login da academia.  
Autorização vem depois: determina quais ações a pessoa já identificada pode realizar.  
No projeto, o aluno João pode alterar o treino dele, mas não pode modificar o treino da Maria.  
Se falta um token válido, a API retorna `401`, porque ainda não foi comprovada a identidade; se João está autenticado, mas tenta editar um treino da Maria, retorna `403`, porque ele não tem permissão. [1, 5]

### 2. Stateful × stateless

No modelo *stateful*, como a sessão `$_SESSION` do PHP, o servidor armazena os dados da sessão e o navegador envia um identificador. É mais simples revogar uma sessão específica, mas exige armazenamento e coordenação entre servidores.  
No modelo *stateless*, o cliente apresenta um token assinado, como o JWT da academia; o servidor valida a assinatura e o tempo de validade, sem precisar armazenar uma sessão do token.  
A vantagem é facilitar requisições distribuídas; a desvantagem é que revogar um JWT emitido antes de ele expirar requer um mecanismo adicional.  
Embora a autenticação use JWT, nossa API faz consulta ao banco para obter o perfil atual do usuário; portanto ela **não é totalmente independente de estado** durante a autorização. [1, 2]

### 3. Hash × criptografia × encoding

*Hash* é uma transformação de sentido único: ao guardar a senha, usamos `bcrypt` para calcular um valor que não deve ser revertido para descobrir a senha original.  
Criptografia é reversível por quem tem a chave apropriada; serve para proteger dados que precisam ser recuperados depois.  
*Encoding*, como Base64URL, é apenas uma forma de representar dados e pode ser facilmente decodificado.  
As senhas da API são guardadas com hash `bcrypt`, enquanto o header e o payload do JWT são codificados em Base64URL, **não criptografados**. Por isso, não colocamos senha ou outras informações sigilosas no payload. [1, 2, 3]

### 4. bcrypt, salt e custo

MD5 e SHA-256 foram projetados para calcular hashes rapidamente; isso facilita ataques com muitas tentativas quando usados diretamente em senhas.  
O `bcrypt` é intencionalmente mais lento e inclui um *salt* aleatório, que faz senhas iguais produzirem hashes diferentes.  
O *custo* controla o trabalho necessário para calcular o hash; valores maiores tornam tanto o login legítimo quanto ataques mais lentos.  
No cadastro e no seed usamos `bcrypt.hash(senha, 12)` e, no login, `bcrypt.compare()`. Em produção, Argon2id seria uma opção ainda mais recomendada pela OWASP em muitos cenários. [3, 10]

## B. JWT

### 5. Estrutura de um JWT

Um JWT assinado normalmente tem três partes, separadas por pontos: `header.payload.signature`.  
O *header* informa o tipo do token e o algoritmo de assinatura, por exemplo, `typ: JWT` e `alg: HS256`. O *payload* contém informações (*claims*) como `sub`, `role`, `iat` e `exp`.  
A assinatura é criada a partir das duas primeiras partes e da chave secreta, permitindo identificar alterações não autorizadas.  
No projeto, o comando `npm run token:exemplo` gera um JWT de João e mostra exatamente o header e o payload decodificados; é possível colar esse **token apenas de demonstração** no [jwt.io](https://jwt.io) para visualizar os mesmos dados. [1, 2]

**Exemplo ilustrativo do header e payload que o comando exibirá (os valores reais de `iat`, `exp` e `sub` dependem da execução e do banco):**

```json
{
  "header": { "alg": "HS256", "typ": "JWT" },
  "payload": { "role": "USER", "iat": 1794229200, "exp": 1794236400, "sub": "2" }
}
```

**Comprovação durante a apresentação:** execute o comando depois do seed, capture os valores reais impressos e mostre a decodificação no jwt.io. Não publique a chave secreta no repositório.

### 6. Claims `sub`, `iat` e `exp`

`sub` (*subject*) identifica a pessoa à qual o token pertence; na academia, é o `id` do usuário convertido para texto.  
`iat` (*issued at*) indica quando o JWT foi emitido; `exp` (*expiration time*) indica o instante a partir do qual ele não deve mais ser aceito.  
Colocamos também `role` para indicar o perfil no momento do login e facilitar a explicação, mas o middleware consulta o **perfil atual** no SQLite.  
Não colocamos senha, hash de senha, documento pessoal ou dados que precisariam permanecer secretos, pois o payload de um JWT comum pode ser lido por qualquer pessoa que tenha o token. [1, 2]

### 7. Assinatura, `decode` e `verify`

No login, o servidor assina os dados do token com `JWT_SECRET` e o algoritmo HS256.  
Se alguém trocar `"role":"USER"` por `"ADMIN"` no payload, a assinatura anterior deixará de corresponder ao conteúdo e a validação falhará com `401`.  
`jwt.decode()` apenas lê o conteúdo; ele **não comprova** que o JWT foi emitido pelo servidor ou que a assinatura é válida.  
`jwt.verify()` valida a assinatura e rejeita tokens adulterados ou expirados; por isso é usado no middleware `autenticar`. A decisão final de permissão ainda usa o perfil consultado no banco. [1, 2, 9]

### 8. Validade, logout, mudança de perfil e refresh token

Apagar o token da interface no logout impede que ela continue enviando aquele valor, mas não apaga um JWT que já tenha sido copiado: ele continuará tecnicamente válido até expirar, se não houver mecanismo de revogação.  
No nosso exemplo, os JWTs duram 2 horas; a aplicação não implementa blacklist nem revogação global.  
Se um ADMIN muda um perfil, o texto do token antigo não é reescrito; porém o middleware consulta o perfil atual no banco e passa a aplicar a nova permissão imediatamente.  
Um *refresh token* é uma credencial separada, normalmente mais duradoura, usada para solicitar um novo token de acesso sem exigir novo login; precisaria ser armazenado e rotacionado de forma segura. [1, 7]

## C. Segurança na prática

### 9. Armazenamento, XSS e CSRF

O `localStorage` é fácil de acessar por JavaScript e mantém dados entre visitas, mas um ataque de XSS pode ler um token guardado ali.  
Um cookie `HttpOnly` não pode ser lido por JavaScript comum, o que ajuda contra o roubo direto do token via XSS, mas cookies enviados automaticamente exigem cuidados com CSRF.  
XSS ocorre quando código não confiável é executado no contexto da página; CSRF é quando uma página maliciosa faz o navegador da vítima enviar requisições autenticadas sem consentimento.  
No painel didático da academia, o token é guardado apenas em uma variável JavaScript **em memória**, e enviado no cabeçalho `Authorization: Bearer`; não é salvo em `localStorage` nem em cookie. Ainda é necessário prevenir XSS. [7, 8]

### 10. Chave secreta (`JWT_SECRET`)

A `JWT_SECRET` é usada pelo servidor para produzir e verificar a assinatura dos JWTs; quem tiver essa chave poderá criar tokens que passam pela verificação.  
O arquivo `.env` serve para manter a configuração privada fora do código compartilhado.  
Se a chave real for publicada no GitHub, um invasor pode assinar tokens falsos com `sub` de outro usuário e tentar assumir sua identidade, inclusive a de um ADMIN.  
Por isso, nosso `.gitignore` exclui `.env`, entregamos apenas `.env.example` e a chave real deve ser gerada localmente com pelo menos 32 caracteres. Se uma chave vazar, será necessário trocá-la e invalidar os tokens antigos. [1, 7]

### 11. RBAC e dono do recurso

RBAC (*Role-Based Access Control*) significa conceder acesso de acordo com o perfil do usuário, como `USER` ou `ADMIN`.  
No código, `src/middlewares/autorizar.ts` verifica o perfil e `src/routes/users.routes.ts` protege `/users` com `autorizar("ADMIN")`.  
A regra do dono é diferente: mesmo dois usuários com perfil `USER` não podem alterar os recursos um do outro.  
Em `src/controllers/treinos.controller.ts`, a criação define `ownerId: req.usuario!.id`, a listagem filtra pelo dono e a função `verificarAcesso` libera alteração/exclusão somente ao proprietário do treino ou ao ADMIN. [5, 8]

### 12. Duas recomendações da OWASP

A OWASP recomenda guardar senhas usando um algoritmo apropriado e lento, com salt, em vez de texto legível ou hashes rápidos. Nosso cadastro segue essa recomendação usando `bcrypt` com custo 12 e `bcrypt.compare()` no login.  
A OWASP também recomenda mensagens genéricas na autenticação para evitar revelar se um e-mail existe ou se apenas a senha foi digitada incorretamente.  
Nossa rota `/auth/login` devolve **“E-mail ou senha inválidos”** nas duas situações e usa um limitador de cinco tentativas a cada 15 minutos, reduzindo tentativas automatizadas.  
Há limites: a API didática ainda não tem MFA e a limitação em memória não é suficiente para um serviço distribuído em produção. [3, 4]

## Referências

Acesso em: **09 nov. 2026**.

1. JONES, M.; BRADLEY, J.; SAKIMURA, N. **RFC 7519 — JSON Web Token (JWT)**. IETF, 2015. Disponível em: <https://www.rfc-editor.org/rfc/rfc7519>.
2. AUTH0. **Introduction to JSON Web Tokens**. jwt.io. Disponível em: <https://jwt.io/introduction>.
3. OWASP. **Password Storage Cheat Sheet**. Disponível em: <https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html>.
4. OWASP. **Authentication Cheat Sheet**. Disponível em: <https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html>.
5. MOZILLA. **Códigos de status de respostas HTTP**. MDN Web Docs. Disponível em: <https://developer.mozilla.org/pt-BR/docs/Web/HTTP/Reference/Status>.
6. PRISMA. **SQLite — Prisma ORM 7**. Disponível em: <https://www.prisma.io/docs/orm/v7/core-concepts/supported-databases/sqlite>.
7. OWASP. **JSON Web Token Cheat Sheet**. Disponível em: <https://cheatsheetseries.owasp.org/cheatsheets/JSON_Web_Token_Cheat_Sheet.html>.
8. OWASP. **Cross Site Scripting Prevention Cheat Sheet**. Disponível em: <https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html>.
9. AUTH0. **jsonwebtoken**. Pacote npm. Disponível em: <https://www.npmjs.com/package/jsonwebtoken>.
10. Dcode. **bcrypt.js**. Pacote npm. Disponível em: <https://www.npmjs.com/package/bcryptjs>.
11. EXPRESS. **Using middleware**. Disponível em: <https://expressjs.com/en/guide/using-middleware.html>.

**Ferramentas usadas:** documentação oficial, Node.js, Express, Prisma, VS Code/REST Client ou Thunder Client (para execução dos testes), e **ChatGPT (OpenAI)** como apoio na preparação da estrutura, código e pesquisa. A equipe precisa ler, verificar e apresentar o funcionamento com entendimento próprio.
