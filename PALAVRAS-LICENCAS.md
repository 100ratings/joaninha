# Vocabulário de palavras aleatórias (V142)

O arquivo `joaninha-palavras-ptbr.txt` contém 28.000 palavras, derivadas
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
