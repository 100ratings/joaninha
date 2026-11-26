# Vocabulário de palavras aleatórias

O corpus original da V142 continha 28.000 palavras, derivadas
de [FrequencyWords, Hermit Dave, lista pt_BR de 2018](https://github.com/hermitdave/FrequencyWords/blob/525f9b560de45753a5ea01069454e72e9aa541c6/content/2018/pt_br/pt_br_50k.txt),
sob a licença [Creative Commons Attribution-ShareAlike 4.0 International](https://creativecommons.org/licenses/by-sa/4.0/).
A lista derivada é disponibilizada sob essa mesma licença, exclusivamente
para o arquivo de vocabulário.

Alterações: remoção das contagens, filtragem de comprimento e caracteres,
correção ortográfica, remoção de palavras inadequadas e de duplicatas
equivalentes sem acentos, e seleção das 28.000 palavras mais frequentes
que permaneceram.

A correção foi verificada com [VERO](https://github.com/LibreOffice/dictionaries/tree/master/pt_BR),
de Raimundo Santos Moura e colaboradores, licenciado em LGPLv3 e MPL.
Uma [lista de palavras inadequadas](https://github.com/LDNOOBW/List-of-Dirty-Naughty-Obscene-and-Otherwise-Bad-Words)
(CC BY 4.0) foi usada apenas como filtro adicional. Esses dois arquivos de
referência não são distribuídos neste repositório. A filtragem não garante
a ausência de todas as palavras ou expressões potencialmente inadequadas.

O script `scripts/build-palavras.py` descreve a preparação do corpus.

## Curadoria V149

A versão V149 continha 25.109 palavras, das quais 6.568 têm de três a seis
letras. A lista anterior foi cruzada com [palavras-ptbr, de Gerson Locci](https://github.com/gelocci/palavras-ptbr/tree/3c6d064999d7b7112d660361d3968a5631341823)
(CC BY 4.0), que utiliza os corpora por-br_newscrawl_2011_1M e
por_news_2024_1M da Leipzig Corpora Collection e o dicionário VERO.
A curadoria considera somente entradas minúsculas classificadas como
corretas, descarta abreviações, nomes e outros termos indesejados, utiliza
frequência de ocorrência e consulta o léxico [MorphoBr](https://github.com/LR-POR/MorphoBr/tree/eb6fbe335c2607c708915c25f79383f4fda6b72c)
(Apache 2.0) para priorizar vocábulos reconhecidos e formas canônicas.
Foram acrescentadas 18 entradas verificadas por essas referências para
preservar as combinações válidas de posição e letra da V148.
O corpus derivado permanece sob CC BY-SA 4.0; os arquivos de
referência não são redistribuídos neste repositório.

A curadoria é reproduzível com `scripts/curate-palavras.py` e o corpus da
V148 (commit `0ab0f803c60f5eb3cb47dc6bb69f54780d86f71c`). A filtragem é linguística e de frequência,
não uma revisão manual de cada palavra.

## Curadoria avançada V151

O corpus contém 25.471 palavras, das quais 6.777 têm de três a seis letras.
Partindo da V150 (commit `65db9ab42def3e9781013795d6b45d4af66988cf`), foram recuperados 522
vocábulos e retiradas 160 entradas. O arquivo
`scripts/palavras-curadoria-v151.txt` contém propostas editoriais
de vocábulos cotidianos, organizadas por categorias; as adições são
confirmadas com a lista de frequência ou o léxico MorphoBr, nas mesmas
revisões e licenças documentadas na V149. A análise morfológica usa as
formas e os lemas desse léxico, regras conservadoras de conjugação
produtiva e alguns agrupamentos editoriais. A classificação é heurística,
não uma análise linguística perfeita de cada contexto.

O script reproduzível `scripts/refine-palavras.py` cria as 189 seleções
por combinação, as 10 seleções normais e os agrupamentos necessários de
famílias. Os índices codificados em base 36 nos registros #pool e #family
referenciam o vocabulário do mesmo arquivo; versões anteriores ignoram
essas linhas. O texto e os metadados derivados continuam sob CC BY-SA 4.0.
O corpus ainda inclui palavras menos frequentes, necessárias a posições
incomuns, e não promete que todas sejam igualmente familiares. Não são
adicionadas palavras inventadas quando uma combinação não é suportada.
