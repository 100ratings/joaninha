# Joaninha V149: palavras aleatórias

A versão mantém o funcionamento da V148, preservada na branch
`backup-v148-antes-curadoria-palavras`. O experimento não modifica os TXT existentes,
as categorias anteriores, o formato das listas numeradas anteriores nem
seus códigos de posição.

## Uso

1. Para uma demonstração comum, pedir "Liste 10 mil palavras aleatórias"
   com o teclado normal. São 10.000 linhas reais, com marcadores de bolinha. A V149 prioriza
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
entre repetições. A V149 ordena o corpus pela familiaridade e prioriza
palavras de três a seis letras, sempre com comprimento suficiente para a
posição escolhida. A seleção de cada letra utiliza até 480 palavras curtas;
se houver menos de 120, completa a seleção com palavras progressivamente
mais longas apenas quando disponíveis e necessárias para variedade. As
posições 07 a 09 continuam disponíveis, com comprimento correspondente.
A lista normal utiliza até 4.000 palavras curtas. Uma entrada manual
inválida não é consumida. O histórico registra a lista aleatória inicial,
não as fases secretas.

Testes automatizados: `node --test tests/palavras.test.cjs`.
Créditos e licença do corpus: [PALAVRAS-LICENCAS.md](PALAVRAS-LICENCAS.md).
