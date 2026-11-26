# Joaninha V142 experimental: palavras aleatórias

A versão está isolada da V141. O experimento não modifica os TXT existentes,
as categorias anteriores, o formato das listas numeradas anteriores nem
seus códigos de posição.

## Uso

1. Para uma demonstração comum, pedir "Liste 10 mil palavras aleatórias"
   com o teclado normal. São 10.000 linhas reais, com marcadores de bolinha.
2. Para o modo especial, informar a palavra no input manual já existente
   (três toques rápidos em Work) ou via Inject 5156. O manual tem prioridade.
3. Usar o teclado secreto já existente, com 01 para a primeira letra,
   02 para a segunda, 03 para a terceira e assim por diante.
4. Enviar o pedido de palavras aleatórias. A lista inicial não tem filtro.
   Rolar livremente para demonstrá-la antes de ativar.
5. Dar dois toques rápidos no espaço vazio central do cabeçalho, sem
   pressionar os botões. A lista não muda nesse momento.
6. O primeiro pontinho do menu fica invisível para confirmar a ativação (V143).
   A próxima rolagem efetiva ativa a primeira letra. Todas as palavras
   da lista passam a conter essa letra na posição solicitada.
7. Uma pausa de três segundos torna a próxima fase disponível: o primeiro
   pontinho reaparece e o terceiro fica invisível (V144). A lista
   só muda na rolagem seguinte, em qualquer direção. A última pausa
   seguida de nova rolagem devolve uma lista aleatória normal. A cada
   troca o primeiro pontinho fica invisível novamente; no fim, os três aparecem.

A fase mantém a mesma quantidade de linhas e a mesma altura. Uma troca
muito lenta ou curta pode ser perceptível, por isso é necessário testar
o gesto em um iPhone real antes de considerar o experimento pronto
para performance.

## Limites

O vocabulário é local, em português brasileiro. As posições disponíveis
são 01 a 09, desde que o corpus contenha ao menos 40 palavras para cada
combinação. Acentos, espaços e hífens da palavra secreta são normalizados.
Combinações pouco frequentes podem ser recusadas; não há substituição
silenciosa por letras erradas ou palavras fabricadas. A lista filtrada
repete palavras, com espaçamento entre repetições. Uma entrada manual
inválida não é consumida. O histórico registra a lista aleatória inicial,
não as fases secretas.

Testes automatizados: `node --test tests/palavras.test.cjs`.
Créditos e licença do corpus: [PALAVRAS-LICENCAS.md](PALAVRAS-LICENCAS.md).
