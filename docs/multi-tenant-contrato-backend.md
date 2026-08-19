# Multi-tenant — o que o backend precisa expor

Documento de contrato entre front e back para a feature de multi-tenant, onde
um **admin do sistema** cadastra e gerencia as empresas que usam a plataforma.

O front desta branch (`feat/multi-tenant-admin-sistema`) já está escrito contra
este contrato. Quando o backend entregar os endpoints abaixo, o front passa a
consumir dados reais mexendo em **um arquivo só**: `src/lib/empresas.ts`.

> **Atenção ao vocabulário.** São dois papéis distintos e o nome parecido
> confunde:
>
> - **admin do sistema** — quem opera a plataforma VoiceMatch. Cadastra
>   empresas, suspende, vê todas. Não pertence a nenhuma empresa.
> - **admin da empresa** — quem administra a conta de uma empresa cliente.
>   Enxerga só a própria empresa.
>
> Este documento chama o primeiro de `admin_sistema` e o segundo de
> `admin_empresa`, sem abreviar, justamente para não se misturarem.

## Estado atual (levantado em 19/08/2026)

Não existe nada de multi-tenant no backend hoje:

| O que | Situação |
| --- | --- |
| `TipoUsuario` (`app/models/enums.py`) | tem **um único** valor: `recrutador` |
| Entidade `Empresa` | **não existe** |
| `Recrutador.empresa` | `String(255)` — texto livre, sem normalização |
| `Habilidade.empresa_id` | UUID **sem foreign key**, aponta para tabela inexistente |
| Rotas de empresa/admin | **nenhuma** (auth, usuario, candidato, vaga, candidatura, entrevista, audio, habilidade) |

Como `empresa` é texto livre, "Acme", "ACME LTDA" e "acme" são hoje três
empresas diferentes para o banco. Isso importa para a migration (ver adiante).

## 1. Modelagem

### Nova tabela `empresa`

| Campo | Tipo | Observação |
| --- | --- | --- |
| `id` | UUID, PK | |
| `nome` | String(255), not null | nome de exibição |
| `cnpj` | String(14), null, **unique** | só dígitos, como já é em `recrutador.cnpj` |
| `status` | enum `StatusEmpresa` | `ativa` \| `suspensa` |
| `data_criacao` | timestamptz | `server_default=now()` |

O `unique` no CNPJ é o que impede a duplicata que hoje acontece por digitação.
Fica nulo porque o cadastro atual de recrutador já aceita CNPJ vazio — mas dois
registros com CNPJ preenchido e igual devem ser recusados.

### `StatusEmpresa`

`ativa` e `suspensa`. Empresa suspensa deve recusar login dos usuários dela
(403), sem apagar dado nenhum — é corte de acesso, não exclusão.

### `TipoUsuario` ganha dois valores

```python
class TipoUsuario(str, Enum):
    recrutador = "recrutador"
    admin_empresa = "admin_empresa"      # administra uma empresa cliente
    admin_sistema = "admin_sistema"      # opera a plataforma
```

Como é enum no Postgres (`tipo_usuario_enum`), a migration precisa de
`ALTER TYPE ... ADD VALUE` — não basta mudar o Python.

### `Recrutador.empresa` (texto) → `empresa_id` (FK)

Este é o ponto delicado da migration. Sugestão de passos:

1. Criar a tabela `empresa`.
2. Popular a partir dos valores distintos de `recrutador.empresa`, normalizando
   (trim + casefold) para agrupar as variações de digitação.
3. Adicionar `recrutador.empresa_id` (FK → `empresa.id`), preenchendo pelo
   mesmo critério.
4. Manter `recrutador.empresa` por uma versão, para não quebrar o front antigo,
   e remover depois.

Vale conferir os dados antes: hoje o banco tem 1 recrutador e 11 vagas, então o
backfill é trivial agora e vai ficar mais caro conforme entrarem clientes.

### `admin_sistema` não tem empresa

Ele opera a plataforma, não pertence a um cliente. Então `empresa_id` precisa
ser nulo para esse papel — e a autorização não pode assumir que todo usuário
tem empresa.

## 2. Endpoints

Todos exigem `Authorization: Bearer <token>`. Os de empresa exigem
`tipo_usuario == admin_sistema`; qualquer outro papel recebe **403**.

### `GET /empresas`

Lista para o painel do admin do sistema. O front mostra uma tabela com contagem,
então os agregados vêm daqui — sem isso o front cairia num N+1 igual ao que
acabamos de remover de `/vagas`.

```json
[
  {
    "id": "uuid",
    "nome": "Acme Recrutamento",
    "cnpj": "12345678000199",
    "status": "ativa",
    "data_criacao": "2026-08-19T12:00:00Z",
    "total_usuarios": 3,
    "total_vagas": 11,
    "total_candidaturas": 46
  }
]
```

Aceitar `?status=ativa|suspensa` e `?busca=<texto>` (nome ou CNPJ) é desejável,
mas o front funciona sem — ele filtra em memória enquanto não existir.

### `POST /empresas`

```json
{ "nome": "Acme Recrutamento", "cnpj": "12345678000199" }
```

- **201** devolve o objeto igual ao do `GET`, com os totais zerados.
- **409** se o CNPJ já existir. O front trata esse status especificamente para
  dizer "já existe empresa com esse CNPJ" em vez de um erro genérico.

### `GET /empresas/{id}`

Mesmo objeto do `GET /empresas`. **404** se não existir.

### `PATCH /empresas/{id}`

```json
{ "status": "suspensa" }
```

Aceitar também `nome` e `cnpj` para correção de cadastro. Devolve o objeto
atualizado.

### `POST /empresas/{id}/usuarios`

Cria o **admin da empresa** — o primeiro acesso do cliente. Sem isso o admin do
sistema cadastra a empresa e ninguém consegue entrar nela.

```json
{ "nome_completo": "Fulano", "email": "fulano@acme.com", "senha": "..." }
```

Cria `Usuario` com `tipo_usuario = admin_empresa` e `empresa_id` da rota.
**409** se o e-mail já existir.

### `GET /empresas/{id}/usuarios`

Lista quem pertence à empresa, para o detalhe no painel do admin do sistema.

```json
[
  {
    "id": "uuid",
    "nome_completo": "Ana Souza",
    "email": "ana@acme.com",
    "tipo_usuario": "admin_empresa",
    "data_criacao": "2026-08-01T12:00:00Z"
  }
]
```

Só identificação e papel — nada de dado de candidato, pelo mesmo motivo da
seção 3.

### `GET /admin/usuarios` e `POST /admin/usuarios`

Os administradores do sistema — quem opera a plataforma. População separada da
de usuários de empresa: aqui não há `empresa_id`.

O `POST` recebe `{ nome_completo, email, senha }` e cria `Usuario` com
`tipo_usuario = admin_sistema` e `empresa_id` nulo. **409** se o e-mail já
existir.

Vale uma trava que o front não tem como garantir: **não deixar o sistema ficar
sem nenhum admin_sistema**. Se um dia existir exclusão deste papel, recusar a
remoção do último.

### `GET /auth/me` — dois campos novos

```json
{
  "id": "uuid",
  "nome_completo": "Fulano",
  "email": "fulano@acme.com",
  "tipo_usuario": "admin_sistema",
  "empresa_id": null,
  "data_criacao": "..."
}
```

`tipo_usuario` já existe na resposta; o que muda é passar a devolver os valores
novos. `empresa_id` é novo e é nulo para `admin_sistema`.

## 3. Escopo por tenant — a parte que não pode ser esquecida

Criar a tabela e os endpoints **não** entrega multi-tenant. Enquanto as rotas
que já existem devolverem tudo para qualquer usuário autenticado, um cliente
enxerga os dados do outro. Precisam passar a filtrar por `empresa_id` do token:

- `GET /vagas` — só as da empresa do usuário
- `GET /candidaturas`, `GET /candidaturas/vaga/{id}` — idem
- `GET /candidatos` — só quem se candidatou a vagas da empresa
- `GET /habilidades` — o `empresa_id` órfão do modelo vira FK de verdade

Para `admin_sistema`, a decisão de produto é: ele **não** deveria ver
candidatos e currículos dos clientes só por operar a plataforma. Sugestão é
limitá-lo aos agregados de `/empresas` e não liberar as rotas de dado pessoal —
menos exposição de dado sensível e menos risco de LGPD.

## 4. Ordem sugerida de entrega

1. Tabela `empresa` + enum `StatusEmpresa` + valores novos em `TipoUsuario`
2. `GET /empresas` e `POST /empresas` (destrava o painel do front)
3. `empresa_id` no `/auth/me`
4. `POST /empresas/{id}/usuarios`
5. `PATCH /empresas/{id}`
6. Escopo por tenant nas rotas existentes

Do passo 2 em diante o front já troca do modo de demonstração para dado real.

## 5. O que o front faz enquanto isso

`src/lib/empresas.ts` tenta os endpoints acima. Enquanto eles responderem 404,
ele serve um conjunto fixo de empresas de exemplo e **avisa na tela**, com uma
faixa permanente, que aquilo é demonstração. A regra vale aqui como valeu para
os relatórios: dado inventado não pode se passar por dado real.

Quando os endpoints existirem, o modo de demonstração se desliga sozinho — não
há flag para lembrar de trocar.
