# Joaninha V152: palavras aleatórias

A versão mantém os gestos e os inputs da V150, preservada na branch
`backup-v150-antes-curadoria-avancada`. O experimento não modifica os TXT existentes,
as categorias anteriores, o formato das listas numeradas anteriores nem
seus códigos de posição.

## Uso

1. Para uma demonstração comum, pedir "Liste 10 mil palavras aleatórias"
   com o teclado normal. São 10.000 linhas reais, com marcadores de bolinha. A V151 prioriza
   palavras familiares de três a seis letras.
   A V145 revela a parte inicial linha por linha no ritmo das outras listas,
   com a lista inteira pronta antes da animação; qualquer rolagem revela
   de imediato todas as linhas restantes.
2. Para o modo especial, informar a palavra no input manual já existente
   (dois toques rápidos em Work) ou via Inject 5156. O manual tem prioridade.
3. Usar o teclado secreto já existente, com 01 para a primeira letra,
   02 para a segunda, 03 para a terceira e assim por diante.
4. Enviar o pedido de palavras aleatórias. A lista inicial não tem filtro de letra.
   Sem rolagem, a lista permanece aleatória, independentemente do tempo.
5. Rolar a lista em qualquer direção. Depois que a rolagem efetiva parar
   por três segundos, o efeito é armado automaticamente (V148) e o
   primeiro pontinho fica invisível. As palavras continuam aleatórias.
   Não há mais gesto no cabeçalho. O modo comum não ativa o efeito.
6. A próxima rolagem efetiva ativa a primeira letra. Todas as palavras
   da lista passam a conter essa letra na posição solicitada.
7. Uma pausa de três segundos torna a próxima fase disponível, sem mudar
   o indicador entre letras. Quando termina a pausa da última letra,
   os três pontinhos reaparecem, mas a lista ainda não muda.
   Só a próxima rolagem, em qualquer direção, devolve a lista aleatória normal.

A fase mantém a mesma quantidade de linhas e a mesma altura. Uma troca
muito lenta ou curta pode ser perceptível, por isso é necessário testar
o gesto em um iPhone real antes de considerar o experimento pronto
para performance.

## Limites

O vocabulário é local, em português brasileiro. As posições disponíveis
são 01 a 09, desde que o corpus contenha ao menos 40 palavras para cada
combinação. Acentos, espaços e hífens da palavra secreta são normalizados.
Combinações pouco frequentes podem ser recusadas; não há substituição
silenciosa por letras erradas ou palavras fabricadas. A lista normal e a lista filtrada repetem palavras, com espaçamento
entre repetições. A V151 seleciona palavras por familiaridade, comprimento e família
morfológica. A lista normal tem até 2.600 palavras de três a seis letras,
uma forma por família na seleção sem posição, com repetições espaçadas.
A seleção das fases leva em conta as famílias de palavras: até 360
formas curtas; quando houver poucas, acrescenta palavras mais longas
progressivamente para chegar a 120 alternativas quando possível.
Quando necessário, formas da mesma família são usadas, mas o sorteio
tenta mantê-las afastadas sem violar a regra de repetição exata. As 188
combinações da V150 continuam disponíveis, com a inclusão de X na
primeira posição. As posições 07 a 09 continuam disponíveis.
Não há novas dependências nem chamadas de rede: os índices das seleções
e famílias ficam no final do próprio TXT como metadados opcionais,
compatíveis com a leitura antiga. Uma entrada manual
inválida não é consumida. O histórico registra a lista aleatória inicial,
não as fases secretas.

Testes automatizados: `node --test tests/palavras.test.cjs`.
Créditos e licença do corpus: [PALAVRAS-LICENCAS.md](PALAVRAS-LICENCAS.md).

## V152: troca preparada durante a pausa

O vocabulário e a seleção V151 permanecem iguais. Por cerca de 160 ms
de imobilidade, durante a pausa já existente de três segundos, a próxima
fase é montada em uma segunda camada invisível. Ambas compartilham a
mesma altura e célula de layout. Após a pausa e a primeira rolagem
efetiva, a visibilidade é alternada sem reescrever 10.000 linhas no
instante da troca, sem animações e sem reposicionar a rolagem. A camada
anterior permanece anexada durante o toque, para preservar os eventos do
gesto; depois é reutilizada ou removida. Se a preparação falhar ou as
alturas divergirem, o código usa a troca tradicional da V151.

A versão não altera as regras de ativação, os indicadores ou o input.
O código também observa deslocamento real durante touchmove, sem antecipar
o efeito por um mero toque ou por previsão de movimento.

Teste local em Chromium, 13 trocas de listas de 10.000 linhas:
mediana do trabalho síncrono de troca e layout de 18,8 ms (V151) para
0,3 ms (V152). Não é uma medição de latência do iPhone; a renderização
final e a velocidade percebida no Safari precisam de teste no aparelho.
A V151 permanece no backup `backup-v151-antes-troca-otimizada`.
