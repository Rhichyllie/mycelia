# Modelo de Dominio Inicial (Fase 0)

## Entidades principais

### Workspace

- Agrupa projetos.
- Campos basicos: `id`, `slug`, `name`, `ownerIdentity`, timestamps.
- `ownerIdentity` permanece apenas como compatibilidade historica; autorizacao ativa ja depende de `workspace_memberships` + role.

### Project

- Unidade de trabalho principal.
- Pertence a `Workspace`.
- `template` continua existindo apenas como compatibilidade legada (`sitemap`, `flowchart`, `erd`, `graph`).
- A identidade canonica do diagrama nao fica mais em `Project.template`; ela vive no snapshot.
- `slug` continua obrigatorio tecnicamente no backend, mas na UX da Fase 5.2 e tratado como `ID tecnico` (somente leitura em area avancada).

### Node (canonico)

- Representa elemento de informacao, entidade, pagina, passo de fluxo etc.
- Sempre pertence a um `Project`.
- Mantem `position`, `data` e `externalRefs`.

### Edge (canonico)

- Relaciona `Node -> Node`.
- Sempre pertence a um `Project`.
- Mantem `kind`, `label`, `data` e `externalRefs`.

### ExternalRef

- Referencia um elemento externo (manual/Postgres/Prisma inicialmente).
- Nao expor payload bruto de importador para a UI.
- Usado para rastreabilidade e futuras sincronizacoes.

### WorkingSnapshot

- Estado mutavel atual do projeto no editor.
- Persistido hoje em `GraphVersion` com `versionNumber = 1` por compatibilidade de storage.
- Contrato ativo:
  - `document`: parte estrutural canônica/versionável (`nodes`, `edges`, `diagramType`, `diagramView`, metadados de layout)
  - `viewport`: estado editorial operacional
  - `snapshot`: materialização interna/compatível de `document + viewport`, não faz parte do wire principal
  - `revision`: controle de concorrência otimista

### EditorSnapshotVersion

- Checkpoint imutavel do working snapshot.
- Persistido em `EditorSnapshotVersion`.
- Contrato ativo:
  - `document`: parte estrutural canônica congelada na versão
  - `capturedViewport`: viewport congelado junto da versão
  - `snapshot`: helper materializado para compatibilidade localizada, nao shape principal de API

### ViewportState

- Estado de viewport do editor (`x`, `y`, `zoom`).
- Faz parte do estado editorial/operacional.
- No working snapshot ele vive separado do documento estrutural.
- Em versoes imutaveis ele e persistido como `capturedViewport`.

### AuditEvent

- Registro minimo de eventos relevantes (acao, entidade, ator, payload).

### WizardDraft

- Rascunho persistido do wizard por projeto.
- Guarda `status`, `currentStep`, `payload` e `lastError`.
- Payload e validado por Zod antes de persistir/retornar.
- Em `payload.config`, os campos de UX/politica relevantes incluem:
  - `generateRootNode?: boolean`
  - `rootNodeName?: string`
  - `allowReapplyLayout?: boolean`

## Regra central

Todas as views (arvore, grafo, sitemap, fluxograma, ERD, timeline) devem projetar o mesmo grafo canonico, sem modelos paralelos.

## Relacoes (persistencia)

- `Workspace 1:N Project`
- `Project 1:N Node`
- `Project 1:N Edge`
- `Project 1:N GraphVersion`
- `Project 1:1 WizardDraft (opcional)`
- `Project 1:N ExternalRef`
- `Project/Workspace 1:N AuditEvent`
- `Edge N:1 Node(source)` e `Edge N:1 Node(target)`

## Snapshot (MVP consolidado na Fase 2B)

- `GraphSnapshotDocument`: contrato estrutural ativo para storage/versionamento
  - `nodes`, `edges`
  - `diagramType`
  - `diagramView`
  - `layoutOptions?`
  - `rootNodeName?`
  - `allowReapplyLayout?`
- `GraphVersion.snapshot`: JSON com `GraphSnapshotDocument`
- Metadados canonicos de identidade:
  - `diagramType?: "graph" | "tree" | "flow" | "mindmap"`
  - `diagramView?: "graph" | "erd" | "timeline" | "tree" | "sitemap" | "flow" | "mindmap"`
- Metadados opcionais de UX/politica no snapshot canonico:
  - `rootNodeName?: string`
  - `allowReapplyLayout?: boolean`
- `GraphVersion.viewport`: JSON separado com `ViewportState`
- `EditorSnapshotVersion.snapshot`: JSON com envelope `{ document, capturedViewport }`
- `GraphSnapshot`: continua existindo como boundary materializada (`document + viewport`)
- Boundaries de escrita/persistencia agora usam schemas strict:
  - working snapshot write aceita `GraphSnapshot` sem chaves top-level extras;
  - working snapshot exige `storageSlot=1` e `versionNumber=1`;
  - `EditorSnapshotVersion` exige envelope `{ document, capturedViewport }` sem `document.viewport` nem `snapshot` paralelo.
- O frontend do editor agora consome `document + viewport/capturedViewport` diretamente nas rotas principais; `snapshot` fica restrito ao alias compatível `/editor-snapshot`.
- Os nomes físicos herdados do banco (`graph_versions`, `editor_snapshot_versions`) ficam confinados ao boundary `src/server/db/snapshot-storage.ts`.

## Diff e restore (Fase 2B)

- Diff de versao contra working snapshot opera sobre:
  - `document`: mudancas estruturais/canonicas
  - `editorial`: mudancas de viewport
- Restore recompõe o working snapshot a partir da versao imutavel:
  - usa `document` como verdade estrutural
  - reaplica `capturedViewport` como estado editorial restaurado
- Os campos flat antigos (`nodesAdded`, `viewportChanged`, etc.) continuam apenas no payload HTTP de diff como compatibilidade transitória; helpers e consumidores internos do editor usam `document` e `editorial`.
- O contrato interno de diff agora valida explicitamente:
  - `document.hasChanges` precisa bater com os vetores de mudanca;
  - `summary` precisa bater com `document/editorial`;
  - os campos flat compatíveis, quando materializados no boundary HTTP, precisam espelhar exatamente `document/editorial`.

## Invariantes finais da Fase 2 (2C-B)

- Working snapshot mutavel:
  - sempre ocupa o slot fixo `versionNumber=1`;
  - `document` e `viewport` sao a fonte ativa;
  - `snapshot` materializado nao pode divergir desses campos.
- Versao imutavel:
  - sempre persiste `document + capturedViewport`;
  - `snapshot` materializado e apenas derivado;
  - payload novo nao pode misturar envelope ativo e boundary compatível.
- Restore:
  - reidrata working snapshot a partir da versao imutavel;
  - override semantico so pode ser pedido em modo `technical`.

## Projecoes de UX (Fase 5.2)

- Dashboard lista cada projeto com metadados derivados (read model de UI):
  - `selectedDiagramType?: "graph" | "tree" | "flow" | "mindmap"` (derivado do snapshot quando existir)
  - `hasInitialSnapshot: boolean`
  - `snapshotVersionCount: number`
- Esses campos nao alteram o modelo canonico; sao composicoes de consulta para leitura.
- O Editor permite nomear versoes localmente para consulta rapida:
  - nome local nao altera entidade `EditorSnapshotVersion`
  - persistencia apenas no `localStorage` do navegador por `projectId`

## Identidade canonica do diagrama (Fase 2A)

### Fonte de verdade

- `snapshot.diagramType` e a identidade estrutural canonica do diagrama.
- `snapshot.diagramView` e a projecao visual/experiencia usada para abrir o mesmo grafo.
- `Project.template` permanece no `Project` apenas como compatibilidade de fluxos legados.

### Regras de compatibilidade

- Pares validos atualmente:
  - `graph` -> `graph | erd | timeline`
  - `tree` -> `tree | sitemap`
  - `flow` -> `flow`
  - `mindmap` -> `mindmap`
- Snapshots legados ainda podem chegar sem `diagramView` ou com `diagramType` legado; o schema normaliza isso para o par canonico.
- `flowchart` nao e tipo canonico. Ele e normalizado para `diagramType=flow` e `diagramView=flow`.

### Boundary de criacao e view

- `initialView`, `layout`, `profile`, `startStrategy` e similares pertencem ao create flow.
- Essas escolhas podem influenciar o snapshot inicial, mas nao substituem a identidade canonica persistida.
- Renderers, modos de editor e aliases legados devem consumir `diagramView`/compatibilidade de boundary, nao disputar o papel de fonte de verdade.

### Layout de dominio vs renderer de UI

- O dominio persiste somente snapshot canonico (nos/arestas/viewport + identidade estrutural + metadados de layout).
- A renderizacao do canvas (nodeTypes/edgeTypes/background/minimap) fica no frontend via renderer registry e segue `diagramView`.
- Consequencia: evolucao visual nao altera o contrato estrutural do grafo.

## Invariantes do grafo (Fase 2A)

As invariantes abaixo complementam o schema estrutural (Zod) e sao aplicadas:

- apos leitura do snapshot (defensivo)
- apos aplicar command no editor
- antes de persistir snapshot (obrigatorio)

### Regras minimas

- `node.id` deve ser unico no snapshot.
- `edge.id` deve ser unico no snapshot.
- Toda edge deve ter `sourceNodeId` e `targetNodeId` nao vazios.
- Toda edge deve referenciar nodes existentes no snapshot.
- `node.position.x` e `node.position.y` devem ser numeros finitos.
- `viewport.x`, `viewport.y` e `viewport.zoom` devem ser numeros finitos.
- Labels de nodes/edges sao normalizadas com `trim`.
- Label de node nao pode ficar vazia apos `trim`.

### Politica de remocao de node (edges orfas)

- Ao remover um node no editor, as edges conectadas sao removidas automaticamente (cascade local no snapshot em memoria).
- Essa politica evita persistir edges orfas e reduz carga de validacao na UI.

### Politica de duplicidade de edge

- Edge duplicada exata (`sourceNodeId + targetNodeId + kind`) nao e permitida.
- Quando detectada, o backend retorna erro de dominio claro (`GRAPH_DUPLICATE_EDGE_RELATION`).
