# Template reutilizável de deep research

## Resumo executivo

Abaixo está um **template pronto para colar e executar** assim que o tema for informado. Ele já exige que o relatório final seja **analítico, rigoroso e em pt-BR**, começando por **resumo executivo**, com **citações para todas as afirmações factuais** e **explicitação de lacunas de dados**. O modelo prioriza **fontes primárias e oficiais**, organiza a busca em bases acadêmicas e governamentais, solicita **tabelas comparativas**, **gráficos** e **diagramas Mermaid** quando apropriado, e inclui um **cronograma estimado em horas**.

## Bloco de preenchimento mínimo

```text
TEMA: {{tema}}
Geografia: {{Brasil / região / global}}
Período: {{anos, intervalo ou "últimos X anos"}}
Público: {{executivo / técnico / regulatório / acadêmico / misto}}
Profundidade: {{baixa / média / alta}}
Foco: {{mercado / regulação / tecnologia / custo / risco / implementação / impacto / comparação}}
```

## Prompt pronto para colar


Realize uma pesquisa profunda sobre o tema abaixo e produza um relatório em pt-BR, analítico e rigoroso, iniciando obrigatoriamente com um resumo executivo.

Tema e escopo:
- TEMA: {{tema}}
- Geografia: {{geografia}}
- Período: {{período}}
- Público: {{público}}
- Profundidade: {{profundidade}}
- Foco: {{foco}}

Instruções gerais:
- Cite todas as afirmações factuais no corpo do texto.
- Explicite lacunas de dados, inconsistências entre fontes e limitações metodológicas.
- Priorize fontes primárias e oficiais; use fontes secundárias apenas como apoio.
- Quando houver conflito entre fontes, compare-as criticamente e indique qual é mais robusta.
- Diferencie claramente fatos, inferências e recomendações.
- Se algum parâmetro do escopo não estiver definido, assuma uma premissa conservadora e registre-a.

Estrutura obrigatória do relatório:
## Resumo executivo
Apresente os principais achados, implicações, riscos e conclusões em linguagem clara e sintética.

## Objetivos da pesquisa
Defina o que a pesquisa pretende responder, esclarecer, comparar ou subsidiar.

## Perguntas de pesquisa
Liste as perguntas centrais e subsidiárias que orientam a investigação.

## Metodologia
Descreva a abordagem de pesquisa, priorizando nesta ordem:
1. Sites oficiais e documentação primária
2. Dados governamentais e regulatórios
3. Artigos originais e publicações acadêmicas em pt-BR e EN
4. Organismos multilaterais e padrões técnicos
5. Relatórios setoriais e análises de mercado como complemento

Inclua:
- critérios de inclusão e exclusão de fontes;
- recorte geográfico e temporal;
- método de triangulação e validação cruzada;
- distinção entre evidência quantitativa e qualitativa.

## Critérios de qualidade das fontes
Avalie cada fonte por:
- primariedade;
- autoridade institucional;
- atualidade;
- transparência metodológica;
- relevância para o tema;
- consistência com outras fontes;
- possível conflito de interesse;
- granularidade dos dados.

## Plano de busca
Use e cite, quando relevantes:
- Google Scholar
- SciELO
- PubMed
- arXiv / SSRN
- IEEE Xplore / ACM Digital Library
- repositórios governamentais: IBGE, Ipea, DataSUS, gov.br e órgãos reguladores aplicáveis
- organismos multilaterais: World Bank, OECD, WHO e equivalentes relevantes ao tema

Monte a estratégia de busca em pt-BR e EN.

Palavras-chave em pt-BR:
- "{{tema}}"
- "{{tema}} definição"
- "{{tema}} panorama"
- "{{tema}} dados"
- "{{tema}} indicadores"
- "{{tema}} comparação"
- "{{tema}} custo"
- "{{tema}} vantagens"
- "{{tema}} limitações"
- "{{tema}} riscos"
- "{{tema}} implementação"
- "{{tema}} regulação"
- "{{tema}} estudo de caso"
- "{{tema}} revisão sistemática"

Palavras-chave em EN:
- "{{topic in English}}"
- "{{topic in English}} definition"
- "{{topic in English}} overview"
- "{{topic in English}} data"
- "{{topic in English}} indicators"
- "{{topic in English}} comparison"
- "{{topic in English}} cost"
- "{{topic in English}} benefits"
- "{{topic in English}} limitations"
- "{{topic in English}} risks"
- "{{topic in English}} implementation"
- "{{topic in English}} regulation"
- "{{topic in English}} case study"
- "{{topic in English}} systematic review"

Se útil, use operadores como:
- site:gov.br
- site:.gov
- site:.edu
- filetype:pdf
- intitle:"{{tema}}"

## Achados principais
Consolide os achados em ordem de relevância, com evidências comparáveis, sempre citadas.

## Análise crítica e síntese
Compare evidências, identifique convergências e divergências, avalie robustez metodológica e extraia implicações práticas para o público-alvo.

## Cronograma estimado do trabalho
Apresente o cronograma em horas, em quadro pequeno, cobrindo:
- revisão inicial e enquadramento;
- busca e triagem;
- revisão de literatura;
- extração de dados;
- síntese analítica;
- visualização;
- revisão final.

## Entregáveis
Liste e entregue, conforme aplicável:
- resumo executivo;
- relatório detalhado;
- tabelas comparativas;
- gráficos;
- diagramas Mermaid;
- imagens/diagramas online, se realmente úteis.

Saídas visuais esperadas:
- tabelas comparativas;
- Mermaid flowchart para processo, fluxo operacional ou cadeia causal;
- Mermaid timeline para evolução histórica, marcos regulatórios ou roadmap;
- Mermaid ER para entidades, atores, sistemas ou relações estruturais;
- gráfico de barras para comparações entre categorias;
- gráfico de linha para séries temporais;
- gráfico de pizza apenas para composições simples;
- imagens/diagramas online apenas se aumentarem a compreensão e vierem de fontes confiáveis.

Solicitação explícita de comparação:
- Produza tabelas comparativas sempre que houver produtos, soluções, estudos, políticas, cenários ou abordagens comparáveis.
- Produza gráficos quando houver dados quantitativos suficientes e comparáveis.
- Produza diagramas Mermaid quando ajudarem a explicar estrutura, tempo ou fluxo.

Modelos mínimos de tabelas:
### Comparação de produtos/soluções
| Nome | Tipo | Ano | Fonte | Principais métricas | Vantagens | Limitações | Custo/Escopo |
|---|---|---:|---|---|---|---|---|

### Comparação de estudos/evidências
| Nome | Tipo | Ano | Fonte | Principais métricas | Vantagens | Limitações | Custo/Escopo |
|---|---|---:|---|---|---|---|---|

### Comparação de políticas/abordagens/cenários
| Nome | Tipo | Ano | Fonte | Principais métricas | Vantagens | Limitações | Custo/Escopo |
|---|---|---:|---|---|---|---|---|

Cronograma estimado em horas:
| Etapa | Horas estimadas |
|---|---:|
| Enquadramento e hipóteses | 0,5–1,0 |
| Busca inicial e triagem | 1,0–2,0 |
| Revisão de literatura e documentos | 3,0–6,0 |
| Extração estruturada de dados | 2,0–3,0 |
| Síntese analítica | 2,0–4,0 |
| Visualizações e tabelas | 1,0–1,5 |
| Revisão final e lacunas | 0,5–1,0 |

Passos detalhados esperados:
1. Delimitar problema, escopo e hipóteses.
2. Buscar e priorizar fontes primárias e oficiais.
3. Triar estudos por qualidade e aderência.
4. Extrair dados e métricas comparáveis.
5. Sintetizar evidências quantitativas e qualitativas.
6. Construir tabelas, gráficos e Mermaid quando apropriado.
7. Revisar inconsistências, lacunas e limites.
8. Encerrar com conclusão sintética e recomendações condicionadas às evidências.

Premissas a registrar se o tema ainda vier incompleto:
- tema ainda não totalmente delimitado;
- escopo geográfico pode precisar refinamento;
- período pode precisar ajuste conforme disponibilidade de dados;
- público-alvo pode exigir mais ou menos tecnicidade;
- profundidade técnica pode alterar o nível de detalhe metodológico.

Dimensões em aberto a confirmar:
- escopo geográfico;
- período de análise;
- público-alvo;
- profundidade técnica;
- foco comparativo;
- necessidade de benchmarking internacional;
- requisitos regulatórios específicos;
- prioridade entre custo, desempenho, risco, adoção ou implementação.

Regra final:
O relatório deve começar com um resumo executivo, manter tom expositivo e rigoroso, citar todas as afirmações factuais e explicitar qualquer lacuna de dados, limitação das fontes ou incerteza analítica.


## Modelos de tabelas

### Produtos ou soluções

| Nome | Tipo | Ano | Fonte | Principais métricas | Vantagens | Limitações | Custo/Escopo |
|---|---|---:|---|---|---|---|---|

### Estudos ou evidências

| Nome | Tipo | Ano | Fonte | Principais métricas | Vantagens | Limitações | Custo/Escopo |
|---|---|---:|---|---|---|---|---|

### Políticas, abordagens ou cenários

| Nome | Tipo | Ano | Fonte | Principais métricas | Vantagens | Limitações | Custo/Escopo |
|---|---|---:|---|---|---|---|---|

## Saídas visuais e cronograma

As saídas visuais a solicitar quando o tema for informado são: **tabelas comparativas**, **Mermaid ER**, **Mermaid timeline**, **Mermaid flowchart**, **gráficos de barra**, **linha** e, apenas quando fizer sentido, **pizza**, além de **imagens/diagramas online** se ajudarem a explicar o tema com base em fontes confiáveis.

| Etapa | Horas estimadas |
|---|---:|
| Enquadramento e hipóteses | 0,5–1,0 |
| Busca inicial e triagem | 1,0–2,0 |
| Revisão de literatura e documentos | 3,0–6,0 |
| Extração de dados | 2,0–3,0 |
| Síntese analítica | 2,0–4,0 |
| Visualização | 1,0–1,5 |
| Revisão final | 0,5–1,0 |

## Premissas e dimensões em aberto

As premissas atuais são que o **tema ainda não foi informado**, o relatório final deve ser **em pt-BR**, com **resumo executivo no início**, **citações para todas as afirmações factuais**, ênfase em **fontes primárias e oficiais**, e **comparações estruturadas** sempre que houver objetos comparáveis.

As dimensões a confirmar depois são: **geografia**, **período**, **público-alvo**, **profundidade técnica**, **foco analítico**, **recorte regulatório**, **necessidade de benchmarking internacional** e **nível de detalhamento das visualizações**.

## Nível de confiança das evidências

Classifique os principais achados como:
- Alta confiança
- Média confiança
- Baixa confiança

Baseando-se em:
- qualidade metodológica;
- convergência entre fontes;
- tamanho da amostra;
- robustez estatística;
- atualidade;
- risco de viés.

## Hierarquia de confiança:
1. Legislação/documentação oficial
2. Dados governamentais primários
3. Papers revisados por pares
4. Organismos multilaterais
5. Dados setoriais
6. Artigos jornalísticos
7. Blogs/opiniões

## Contradições e divergências

Quando houver conflito entre fontes:
- identifique explicitamente;
- explique possíveis causas;
- compare metodologia;
- indique limitações;
- evite falsa equivalência.

Nunca invente:
- números;
- citações;
- papers;
- estatísticas;
- regulamentações;
- estudos.

Se dados forem insuficientes:
declare explicitamente a ausência.

## Toda comparação deve definir:
- critérios;
- métricas;
- pesos;
- limitações comparativas;
- contexto operacional.

## Implicações estratégicas

Explique:
- impacto operacional;
- impacto financeiro;
- impacto regulatório;
- risco futuro;
- oportunidades;
- tendências emergentes.

## Toda conclusão importante deve indicar:
- quais evidências sustentam;
- quais limitações existem;
- quais premissas foram assumidas.

## Incertezas relevantes

Liste:
- perguntas sem resposta;
- dados inexistentes;
- evidências insuficientes;
- limitações estruturais;
- hipóteses não confirmadas.