# Especificação - Document Management System

## 1. Objetivo

Permitir que usuários enviem, listem e baixem seus documentos, mantendo os arquivos no filesystem local e os metadados em memória.

## 2. Escopo

### Dentro do escopo

- Envio de um documento por requisição.
- Listagem dos documentos associados ao usuário solicitante.
- Download de um documento pelo identificador, respeitando a propriedade.
- Persistência dos arquivos em `storage`, usando `multer` com `diskStorage`.
- Persistência dos metadados em memória durante a execução do servidor.
- Interface web para envio, listagem e download.

### Fora do escopo

- Armazenamento em nuvem ou em serviços externos.
- Versionamento, edição ou exclusão de documentos.
- Persistência durável dos metadados ou recuperação após reiniciar o servidor.
- Cadastro, autenticação e autorização completas de usuários.
- Compartilhamento de documentos entre usuários.

## 3. Requisitos funcionais

| ID | Requisito |
| --- | --- |
| RF-01 | O sistema deve aceitar um arquivo enviado como `multipart/form-data`, no campo `file`. |
| RF-02 | O sistema deve gravar o arquivo no filesystem local com `multer` e `diskStorage`. |
| RF-03 | Após o envio, o sistema deve criar e retornar metadados com identificador único, nome original, tamanho, data de envio e proprietário. |
| RF-04 | O sistema deve listar somente documentos pertencentes ao usuário solicitante. |
| RF-05 | O sistema deve permitir baixar um documento pelo identificador quando ele pertencer ao usuário solicitante. |
| RF-06 | O sistema deve retornar erro apropriado quando o arquivo estiver ausente, o identificador não existir ou o documento não pertencer ao solicitante. |
| RF-07 | A interface deve permitir enviar um arquivo, consultar a lista de documentos e iniciar o download de um documento. |
| RF-08 | A interface deve apresentar estados de carregamento e mensagens de erro para falhas nas operações. |

## 4. Requisitos não funcionais

| ID | Requisito |
| --- | --- |
| RNF-01 | Os arquivos devem permanecer no armazenamento local em `storage`; não usar provedores externos. |
| RNF-02 | Os metadados devem ser mantidos em memória nesta fase. Reiniciar o processo pode perder os metadados. |
| RNF-03 | Configurações como porta, diretório de armazenamento e limite de upload devem ser parametrizadas por variáveis de ambiente. |
| RNF-04 | O backend deve seguir o fluxo `routes -> controllers -> services -> repositories`. |
| RNF-05 | O backend deve usar Node.js, Express e CommonJS; os testes devem usar `node:test`. |
| RNF-06 | O frontend deve usar React, Vite e `fetch`, chamando a API pelo prefixo `/api`. |
| RNF-07 | O servidor deve validar entradas e tratar erros de upload e de acesso ao filesystem sem expor detalhes internos ao cliente. |

## 5. Modelo de dados

### Documento

| Campo | Tipo | Descrição |
| --- | --- | --- |
| `id` | string | Identificador único, não derivado do nome do arquivo. |
| `originalName` | string | Nome original fornecido no upload; usado como metadado e nome sugerido no download. |
| `storageName` | string | Nome interno gerado pelo servidor para armazenar o arquivo sem colisões. Não deve ser exposto como caminho local. |
| `size` | number | Tamanho do arquivo em bytes. |
| `uploadedAt` | string | Data e hora do upload em ISO 8601. |
| `owner` | string | Identificador do usuário proprietário. |
| `mimeType` | string | Tipo MIME informado ou detectado no upload, se disponível. |

O repositório em memória deve indexar os metadados por `id`. O caminho físico deve ser construído pelo repositório a partir do diretório configurado e do `storageName`, sem aceitar caminhos fornecidos pelo cliente.

### Identidade do usuário

O repositório não define um mecanismo de autenticação. Para que propriedade e isolamento de listagem sejam verificáveis, a implementação deve receber a identidade do usuário de uma fonte confiável. A adoção de um cabeçalho fornecido pelo cliente, como `X-User-Id`, é apenas adequada para demonstração e não constitui autenticação segura. A fonte de identidade precisa ser definida antes de expor o sistema em produção.

## 6. Contratos de API

As rotas do backend são sem prefixo. Durante o desenvolvimento, o Vite encaminha `/api/*` ao backend e remove o prefixo `/api`.

### `POST /upload`

Envia um documento.

- **Entrada:** `multipart/form-data`, campo `file` obrigatório.
- **Identidade:** usuário solicitante obtido pelo mecanismo de identidade definido para a aplicação.
- **Sucesso:** `201 Created`.

```json
{
  "id": "document-id",
  "originalName": "relatorio.pdf",
  "size": 18342,
  "uploadedAt": "2026-10-29T12:00:00.000Z",
  "owner": "user-id",
  "mimeType": "application/pdf"
}
```

- **Erros:** `400` para arquivo ausente ou requisição inválida; `413` para arquivo acima do limite configurado; `500` para falha inesperada de gravação.

### `GET /documents`

Lista documentos do usuário solicitante.

- **Entrada:** sem corpo.
- **Sucesso:** `200 OK`, com uma lista. Lista vazia retorna `[]`.

```json
[
  {
    "id": "document-id",
    "originalName": "relatorio.pdf",
    "size": 18342,
    "uploadedAt": "2026-10-29T12:00:00.000Z",
    "owner": "user-id",
    "mimeType": "application/pdf"
  }
]
```

- **Erros:** `500` para falha inesperada ao consultar os metadados.

### `GET /documents/:id/download`

Baixa o conteúdo binário de um documento pertencente ao usuário solicitante.

- **Entrada:** identificador do documento no caminho.
- **Sucesso:** `200 OK`, conteúdo binário, com `Content-Disposition: attachment` e nome de arquivo apropriado.
- **Erros:** `404` para documento inexistente, não pertencente ao solicitante ou arquivo local ausente; `500` para outras falhas de leitura.

### Formato de erro

Os erros HTTP devem retornar JSON sem detalhes internos:

```json
{
  "error": {
    "code": "DOCUMENT_NOT_FOUND",
    "message": "Documento não encontrado."
  }
}
```

Códigos sugeridos incluem `FILE_REQUIRED`, `FILE_TOO_LARGE`, `DOCUMENT_NOT_FOUND` e `INTERNAL_ERROR`.

## 7. Decisões arquiteturais

- `routes/` registra endpoints, middleware de upload e encaminhamento aos controllers.
- `controllers/` valida a entrada HTTP, obtém a identidade disponível e traduz resultados em respostas HTTP.
- `services/` aplica regras de negócio, incluindo propriedade do documento.
- `repositories/` mantém metadados em memória e interage com os arquivos locais.
- `multer` com `diskStorage` grava uploads em `storage`. O nome físico é gerado pelo servidor, não pelo nome recebido do cliente.
- O frontend usa `fetch` através de `/api`; o proxy de desenvolvimento já está configurado no Vite.
- A identidade do usuário e os limites máximos de upload são decisões de configuração/integração a confirmar antes da implementação.
- A perda dos metadados após reiniciar é uma limitação conhecida desta fase; arquivos órfãos não são recuperados automaticamente.

## 8. Plano de execução

As etapas abaixo são planejamento futuro. Nenhum arquivo de implementação do backend ou frontend faz parte desta entrega documental.

1. **Definir configuração e estrutura backend.** Arquivos futuros: `app.js` e módulos em `routes`, `controllers/`, `services/` e `repositories/`. **Aceite:** dependências seguem a direção arquitetural definida; diretório de armazenamento, porta e limite de upload são configuráveis; rota de saúde existente continua funcionando.
2. **Implementar upload e metadados.** Arquivos futuros: módulos correspondentes nas quatro camadas e testes em `test`. **Aceite:** upload válido grava arquivo local e retorna metadados; ausência de arquivo e excesso de tamanho retornam erros definidos; o cliente não controla o nome físico nem o caminho.
3. **Implementar listagem e download.** Arquivos futuros: módulos de rota, controller, service e repository, além de testes backend. **Aceite:** listagem filtra pelo proprietário; download envia o binário correto; documento inexistente, sem propriedade ou sem arquivo local retorna `404`.
4. **Implementar interface e integração.** Arquivos futuros: componentes, página e serviço em `src`. **Aceite:** usuário consegue enviar arquivo, consultar documentos e baixar um item; erros e carregamento são apresentados; chamadas usam `/api`.
5. **Verificar o fluxo completo e documentar limitações.** Arquivos futuros: testes existentes em `test` e documentação do projeto se necessário. **Aceite:** testes backend passam, build frontend conclui, fluxo integrado funciona com o proxy Vite e as limitações de identidade e metadados em memória permanecem explícitas.

**Risco principal:** sem autenticação definida, a propriedade do documento não pode ser considerada um controle de segurança em produção. A identidade confiável deve ser decidida antes de disponibilizar o serviço fora de um ambiente de demonstração.

Created 5 todos