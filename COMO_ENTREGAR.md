# Como concluir a entrega no Teams e no GitHub

O enunciado da atividade pede **link do repositório no GitHub + apresentação em sala**. O arquivo ZIP serve para começar o trabalho e pode ser útil como anexo de backup, mas **não substitui o link** exigido pelo professor.

## 1. Preencher dados do grupo e validar tema

- Edite o início de `README.md` e `PESQUISA.md` com os nomes completos de até 3 integrantes.
- O tema escolhido para este exemplo é **Academia** (opção 7 da tabela da página 6). O professor exige que os grupos **não repitam o tema**. Se alguém já escolheu Academia, adapte o projeto para outra opção *antes* de enviar.
- Leia as 12 respostas de `PESQUISA.md` e altere a linguagem para a do grupo; o PDF proíbe entregar texto copiado sem compreensão e informa que ferramentas de IA devem ser citadas.

## 2. Instalar e rodar

Abra a pasta no VS Code e um terminal nela:

```bash
npm install
copy .env.example .env
```

No Linux/macOS, use `cp .env.example .env`. Depois abra o `.env` e substitua o valor de `JWT_SECRET` por uma chave aleatória. Gere uma com:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Depois:

```bash
npx prisma migrate dev
npx prisma generate
npx prisma db seed
npm run dev
```

Acesse `http://localhost:3000/` e `http://localhost:3000/painel`.

## 3. Executar e registrar testes

Abra outro terminal (mantendo o servidor ativo):

```bash
npm run test:api
```

Confirme se os cenários T1 a T10 receberam os códigos esperados. Tire prints reais de `200`, `201`, `401`, `403`, `404`, `409` e `429`. Também há testes manuais em `requests.http` (REST Client ou Thunder Client).

O teste `429` depende das requisições de login feitas na mesma janela de 15 minutos. Se executar outras chamadas antes, o limite pode começar mais cedo; reinicie a API antes de uma demonstração limpa.

## 4. Gerar o JWT demonstrativo

Depois da migração e do seed:

```bash
npm run token:exemplo
```

O terminal exibirá o JWT, seu header e payload. Cole **apenas esse token de demonstração** em `https://jwt.io` e veja os campos; capture um print e confira a explicação da questão 5 do `PESQUISA.md`. Nunca exponha tokens reais ou `JWT_SECRET` em prints.

## 5. Subir para o GitHub

Crie um repositório **vazio** no GitHub, com nome sugerido `api-segura-academia`. Dentro da pasta do projeto:

```bash
git init
git add .
git status
git commit -m "Estrutura inicial da API Academia"
git branch -M main
git remote add origin https://github.com/SEU-USUARIO/api-segura-academia.git
git push -u origin main
```

Substitua `SEU-USUARIO` pelo dono real do repositório e não copie literalmente um endereço fictício. Antes de fazer `git add`, confira `git status`: **não** podem entrar `.env`, `dev.db`, `node_modules/` nem `generated/`.

O professor recomenda pequenos commits e autoria demonstrada. Cada integrante deve participar de forma real: revisar pesquisa, fazer testes, explicar alguma parte e registrar alterações próprias em commits, sempre que possível.

## 6. Enviar no Teams

Na tela da atividade, use **Anexo** ou **Novo** para inserir um texto com o link do repositório no GitHub. O principal é o link do repo acessível pelo professor. No momento da entrega, confira se ele abre sem pedir permissão ou se o professor recebeu acesso ao repositório privado.

**Checklist final**

- [ ] Tema Academia validado com o professor e nomes preenchidos.
- [ ] `PESQUISA.md` com 12 respostas, 4+ fontes e 2+ oficiais, revisado pelo grupo.
- [ ] `README.md` completo, incluindo diagrama e matriz de permissões.
- [ ] `.env.example` presente, mas `.env` e o `.db` ausentes do GitHub.
- [ ] `npm install`, migração, `generate`, seed e servidor executados com sucesso no computador do grupo.
- [ ] T1 a T10 verificados em HTTP, incluindo `401`, `403` e `404`.
- [ ] Roteiro de 8–10 minutos ensaiado com a equipe e plano B gravado.
- [ ] Link do GitHub enviado pelo Teams dentro do prazo.

**Nota sobre autoria e testes:** o projeto foi preparado com auxílio do ChatGPT. O código precisa ser instalado e executado no computador do grupo antes de ser declarado como testado ou entregue. Não afirmem que algum teste passou sem tê-lo rodado.
