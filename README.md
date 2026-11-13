# Joaninha

Aplicativo: https://100ratings.github.io/gpt/index.html

Versão principal: **V90**, com funcionamento offline após a primeira preparação bem-sucedida

## Configuração de forças diretamente na prévia do Work, V90

- Em **Configurar Work**, as dez opções exibidas para cada lista agora são botões selecionáveis
- A força atualmente definida aparece destacada em azul, inclusive quando foi escolhida anteriormente pelo gesto do Work
- Tocar em uma opção muda o destaque da prévia, a alteração é aplicada ao tocar em **Salvar configuração**
- A prévia e o Work compartilham os mesmos registros de força, mantendo os armazenamentos originais de Músicas, Celebridades e Animais e o armazenamento por categoria das outras listas
- Ao salvar, a configuração fecha os dois painéis e retorna diretamente à tela principal da Joaninha
- O X e **Cancelar** da configuração continuam voltando ao Gerenciador de Listas, sem salvar mudanças pendentes nas forças ou nas colunas
- Validação assíncrona verifica que a escolha de força ainda pertence às primeiras dez opções da respectiva lista antes de aplicar
- As mudanças pendentes não são aplicadas se o usuário cancelar durante um carregamento
- O gesto original de um segundo, arrastar e soltar no Work permanece inalterado
- Backup anterior à V90: `backup-v89-before-work-preview-force-selection`

## Work com três colunas personalizáveis, V89

- Novo botão **Configurar Work** no início do Gerenciador de Listas, aberto ao segurar Chat por 1 segundo
- Três seletores permitem escolher qualquer combinação de três listas diferentes, sem trocar o layout atual do Work
- A tela mostra uma prévia dos primeiros dez itens de cada lista, conforme a ordem do TXT ou da edição
- Listas com menos de dez itens não podem ser escolhidas para o Work, mantendo as dez posições por coluna
- A força escolhida em cada categoria é salva independentemente, mantendo as chaves originais de Músicas, Celebridades e Animais
- Seleções antigas de força continuam válidas após alternar quais listas aparecem no Work
- A configuração das três colunas é salva no aparelho e incluída no JSON de exportação completa
- A importação de um backup completo pode restaurar também as colunas escolhidas, preservando compatibilidade com backups antigos
- Ao excluir uma lista selecionada, o sistema escolhe outra válida para ocupar a vaga, sem exibir listas inexistentes
- O botão X e Cancelar da configuração retornam ao Gerenciador de Listas, sem fechar a Joaninha
- As regras de ordenação interna, peeks, gesto de seleção e tempo de pressão do Work foram preservados
- `joaninha-work-config.js` foi incluído no cache offline do PWA
- Backup anterior: `backup-v88-before-work-custom-columns`

## Ordem alfabética no Gerenciador de Listas, V88

- As listas no Gerenciador são exibidas em ordem alfabética por nome, incluindo listas recém-criadas e importadas
- A ordenação considera acentos e letras maiúsculas/minúsculas segundo a língua portuguesa
- A ordem dos itens dentro de cada lista permanece rigorosamente igual, preservando as posições especiais dos truques
- O armazenamento e a ordem de reconhecimento das categorias não são modificados
- Backup da V87: `backup-v87-before-alphabetical-list-manager`

## Navegação do X no editor de listas, V87

- Ao tocar no X durante a edição de uma lista, a Joaninha volta ao Gerenciador de Listas, exatamente como o botão Cancelar
- No Gerenciador de Listas, tocar no X fecha o painel e retorna ao aplicativo principal
- Nenhum outro comportamento do gerenciamento, das listas ou do Work foi alterado
- Backup da V86: `backup-v86-before-editor-x-navigation`

## Gerenciador de Listas e Palavras-chave na V86

- Pressionar e segurar **Chat por 1 segundo**, no mesmo tempo de Work, abre o Gerenciador de Listas; toque normal no Chat permanece como antes
- Apresenta as 13 listas originais com contagem de itens e palavras-chave; permite criar, editar e excluir listas com confirmação
- Editor com nome da lista, campo de gatilhos separados por vírgulas e itens com uma palavra ou frase por linha
- É possível colar texto diretamente, importar TXT, copiar TXT, baixar TXT e copiar o JSON de uma lista
- Exportação JSON completa inclui conteúdo e gatilhos de todas as listas; importação JSON restaura uma coleção completa ou adiciona uma lista copiada do editor
- Palavras-chave duplicadas entre listas são rejeitadas, sem incluir controles de prioridade ou perfis
- Configuração salva apenas no localStorage do aparelho, sem servidor e sem interferir nos arquivos TXT originais
- Botão **Restaurar padrões** repõe as 13 listas originais, mesmo após exclusões
- Regras especiais existentes, Work e seleções de força permanecem intactas para as listas padrão; caches de Work são invalidados após alterações
- O Service Worker passa a incluir `joaninha-list-manager.js` no pacote offline da V86
- Backup da V85: branch `backup-v85-before-list-manager`

## Ícone de volume de 20 × 20 px na V85

- Somente o ícone **Ouvir resposta**, representado pelo alto-falante, foi ajustado para **20 × 20 px** com a escala padrão de fontes em 109%
- O desenho acompanha proporcionalmente a escala de fontes, seguindo a fórmula `20 × escala / 109`
- Os demais ícones continuam com os tamanhos da V84: Copiar e Compartilhar 19 px, Gostei e Não gostei 17 px e Mais opções 20 px
- Alterações restritas a uma regra CSS do SVG, uma variável de escala e à numeração da versão, sem mudar botões HTML, seus listeners, o espaçamento ou áreas de toque
- Histórico, Quick Peek persistente, gestos secretos, teclado e demais controles preservados
- Backup anterior à modificação: `backup-v84-antes-volume-20px`

## Tamanhos dos ícones e Quick Peek permanente na V84

- Os desenhos da barra de respostas mantêm os mesmos SVGs aprovados, mas seguem agora três tamanhos de referência no ajuste padrão de fontes (109%): 19 px para Copiar/Ouvir/Compartilhar, 17 px para Gostei/Não gostei e 20 px para Mais opções
- Os três tamanhos aumentam e diminuem na mesma proporção do controle de tamanho de fontes, usando a fórmula `base × escala / 109`
- Ícones das ações de conversas restauradas também seguem as mesmas dimensões
- A área clicável de cada botão, o espaço entre ações e os listeners JavaScript desses botões não foram modificados
- O botão circular Quick Peek e o microfone agora podem recuperar sempre o **último código secreto completo**, mesmo depois de enviar mensagens normais, alternar modos, abrir uma nova conversa ou restaurar histórico
- O último código completo é salvo no armazenamento local do aparelho e recuperado após fechar e reabrir o PWA, se os dados do site não forem apagados
- A leitura do código em andamento ainda tem prioridade enquanto o modo secreto estiver ativo
- O código especial `00` continua aparecendo como `100`, e códigos com zero inicial (ex.: `01`) preservam o formato exibido
- A visualização automática temporizada continua existindo, mas não apaga o último valor recuperável pelo Quick Peek
- Backup integral: `backup-v83-antes-tamanhos-e-ultimo-peek`
- Validado com cenários simulados de restauração, envio normal, código 100 e ajustes de escala, teste físico no iPhone ainda necessário

## Ícones proporcionais às fontes na V83

- Os seis ícones da barra de resposta agora usam o mesmo tamanho visual, **19 px no ajuste padrão de fontes de 109%**
- Quando o usuário altera o tamanho das fontes nas configurações, os seis ícones acompanham proporcionalmente pela fórmula `19 × (escala / 109)`
- Exemplo: 75% resulta em 13,07 px, 109% em 19 px, 150% em 26,15 px
- Mantidos os SVGs de desenho refinado aprovados na V82, sem mudanças no HTML ou nos eventos de clicar, avaliar, copiar, ouvir ou compartilhar
- A largura e altura foram modificadas apenas nos SVGs, as propriedades CSS dos botões e o espaçamento de 13 px permanecem inalterados
- Modos claro e escuro, teclado, Peek, Work, forças, listas e atualização offline preservados
- Backup completo do estado anterior: `backup-v82-antes-icones-proporcionais`
- A prévia de comparação `experimento-icones.html` permanece com o tamanho original maior

## Ícones da barra de resposta na V82

- Incorporados os seis desenhos vetoriais aprovados na versão de ensaio `experimento-icones.html`
- Os ícones Copiar, Gostei, Não gostei, Ouvir, Compartilhar e Mais opções receberam proporções, curvas e traços mais próximos da referência visual iOS
- A troca ficou restrita aos SVGs internos dos botões e a três regras CSS para as dimensões dos desenhos
- O JavaScript da V81 permanece integralmente igual, exceto pelo número da versão
- Mantidos os atributos e áreas de clique dos seis botões, além do tratamento das avaliações, cópia, leitura e opções
- Modos claro e escuro, teclado, Peek, Work, segredos, listas e comportamento offline preservados
- Backup do estado anterior: `backup-v81-antes-incorporar-icones`
- A experiência isolada `experimento-icones.html` foi mantida para comparações

## Deslize para fechar na faixa inferior na V81

- Com teclado aberto, a área inferior vazia entre o `+` e o medidor mantém a divisão esquerda/normal e direita/secreto da V80
- Tocar e soltar à esquerda ativa modo normal, tocar e soltar à direita ativa modo secreto, sem fechar o teclado
- **Deslizar para baixo em qualquer lado da faixa inferior** fecha o teclado, reutilizando o mesmo gesto e critério da faixa superior, pelo menos 58 px verticais e movimento horizontal compatível
- O modo não é alterado durante o gesto de deslizar, pois a seleção só ocorre quando o dedo é solto em um toque curto
- Arrastar para cima, lateralmente ou de forma curta não fecha o teclado e não ativa modos acidentalmente
- Há tratamento para eventos touch e pointer do WebKit, com prevenção de duplicação e cancelamento seguro
- Os controles `+`, medidor/peek, microfone e envio/voz permanecem fora da área de ativação
- A faixa superior, as cores, as preferências e os truques permanecem intactos
- Backup anterior à alteração: `backup-v80-antes-swipe-inferior`
- 24 cenários simulados de gestos validados, confirmação física do teclado do iPhone pendente

## Alternância pelas duas faixas do campo na V80

- Quando o teclado está aberto, tocar na região vazia da **linha inferior** entre o botão `+` e o indicador circular ativa o modo normal ou secreto conforme a posição horizontal do toque
- Lado esquerdo da linha inferior ativa **modo normal**, lado direito ativa **modo secreto**, sem fechar o teclado
- A divisão horizontal é **exatamente a mesma** usada na faixa superior, calculada a partir do texto `Perguntar ao ChatGPT`
- É possível alternar entre os modos repetidamente, inclusive sem digitar nenhum caractere entre os toques
- O funcionamento da parte superior permanece inalterado, tanto com teclado aberto quanto fechado
- A interação só opera com teclado aberto e sem texto digitado, seguindo as restrições já existentes na faixa superior
- Os toques no botão `+`, indicador de peek, microfone e botão azul não são capturados pelas regiões novas
- Um toque na região inferior vazia preserva o foco no textarea nativo do iPhone e não dispensa o teclado
- Não foram adicionados botões nem cores, nenhuma alteração visual
- Backup integral anterior à mudança: `backup-v79-antes-zonas-inferiores`
- Testes simulados de 17 cenários de toque passaram, o funcionamento no iPhone precisa ser confirmado no aparelho

## Peek numérico unificado na V79

- Somente o estilo do peek dos números digitados no White Mode foi modificado
- Cor e sombra seguem agora exatamente as regras originais do Dark Mode, sem qualquer sobrescrita exclusiva do tema claro
- Posição, tamanho, opacidade, duração, comportamento do Quick Peek e entradas secretas inalterados
- Nenhuma mudança nas demais cores do White Mode ou nos gestos do teclado
- Backup completo: `backup-v78-antes-peek-white`

## Teclado e menu lateral na V78

- Ao abrir o menu lateral, a Joaninha fecha o teclado nativo do iPhone, evitando que ele cubra a navegação
- A tentativa de manter o teclado deslocado parcialmente com o menu, como no aplicativo nativo ChatGPT, não é implementável de forma fiel em um PWA, pois o teclado não é parte do DOM
- A proteção de foco dos controles superiores reconhece quando o menu está aberto e não reabre o teclado por engano
- Fechar o menu não abre o teclado automaticamente, tocar no campo de mensagem continua sendo a forma de reabri-lo
- Tocar na área de conversa continua fechando o teclado, mas rolar as mensagens ou listas em qualquer direção não fecha
- Deslizar para baixo no campo `Perguntar ao ChatGPT` continua fechando o teclado
- Outras interações, incluindo Chat, Work e chat temporário, permanecem com o comportamento anterior
- Backup integral da V77: `backup-v77-antes-fechar-teclado-no-menu`
- Testes simulados de estados do menu e foco, sem teste físico do teclado iOS

## Correção do fechamento do teclado na V77

- Toque curto na área da conversa continua fechando o teclado, tanto na tela vazia quanto com mensagens e listas
- Deslizar para cima, para baixo ou lateralmente sobre as mensagens ou a lista **não fecha o teclado**, apenas preserva o gesto de rolagem da conversa
- Somente deslizar para baixo no campo `Perguntar ao ChatGPT` continua fechando o teclado por arrasto
- Botões do cabeçalho, abas Chat/Work e chat temporário continuam preservando o teclado
- Nenhuma alteração em forces, peeks, histórico, seleção Work, temas, listas ou atualização
- Backup integral antes do ajuste: `backup-v76-antes-ajuste-rolagem`
- Testes simulados de 15 cenários passaram, aguarda confirmação no teclado real do iPhone

## Gestos e persistência do teclado na V76

- Depois de aberto pelo usuário, o teclado nativo continua aberto ao tocar no menu superior esquerdo, nas abas Chat/Work e no botão de chat temporário
- O teclado **não fecha automaticamente ao enviar uma mensagem** nem ao restaurar uma conversa salva
- O gesto de deslizar para baixo no campo `Perguntar ao ChatGPT` continua fechando o teclado
- O toque rápido na área livre da conversa, com ou sem uma lista ou mensagem gerada, fecha o teclado
- Deslizar para baixo na área de conteúdo ou das mensagens também fecha o teclado, mesmo se o WebKit cancelar eventos de ponteiro durante a rolagem (comportamento histórico da V76, corrigido na V77)
- Deslizar para cima ou na horizontal não é um gesto deliberado de fechamento
- Tocar em botões de ações da resposta, no cabeçalho, no campo de mensagem ou em elementos dos ajustes não é interpretado como toque na conversa para fechar o teclado
- Quando o Safari desvia o foco do campo ao tocar na navegação superior, a Joaninha tenta recuperá-lo no mesmo toque, sem abrir o teclado caso ele já estivesse fechado
- Só gestos explícitos de fechamento desativam a preferência de reabrir o teclado
- Preservados os peeks, a seleção Work, chat temporário, temas, listas, sistema de atualização e Service Worker
- Backup integral: `backup-v75-antes-gestos-teclado`
- Validado com testes simulados de gestos, a confirmação no teclado nativo do iPhone ainda depende de teste no aparelho

## Ícone de chat temporário e check na V75

- Ícone do canto superior direito atualizado para o contorno tracejado de chat temporário, baseado no componente `TemporaryChatGlyph` do projeto de código aberto [bryanrg22/chatgpt-ios-ui](https://github.com/bryanrg22/chatgpt-ios-ui), licenciado sob MIT
- SVG desenhado diretamente no HTML do PWA, sem dependências externas, mantendo o botão e sua área interativa de 44 × 44 px
- Toque simples mantém o comportamento anterior de ligar ou desligar o chat temporário
- O check é mostrado **quando o chat temporário está ativo OU quando uma versão nova do aplicativo está disponível**
- Ao desativar o chat temporário, o check some se não houver atualização pendente, e permanece caso exista atualização
- Ao concluir a atualização, o check some se o chat temporário estiver desativado
- Não há mais preenchimento roxo nem destaque colorido ao ativar o chat temporário, nos temas claro e escuro
- A falha de preparação dos arquivos offline permanece registrada internamente, mas não mostra o mesmo check de atualização, para não confundir os estados
- Pressão de três segundos para ajustes de Peek, detecção de novas versões, teclado, Work e truques preservados
- Backup integral da versão anterior: `backup-v74-antes-icone-temporario`

## Experimento de restauração do teclado na V74

- Quando o usuário abre o teclado nativo normalmente pela primeira vez, a Joaninha grava localmente a preferência `joaninha-keyboard-start-open-v1=1`
- Em uma inicialização nova do PWA instalado no iPhone, tenta colocar foco no campo de texto sem exigir o primeiro toque
- O iOS pode aceitar o foco e **não** abrir o teclado de fato, essa limitação do sistema não é contornada pelo código
- Durante a tentativa, a interface **permanece com o teclado fechado** e só muda para o estado aberto se a `visualViewport` confirmar que o teclado real surgiu
- Após 900 ms sem confirmação, o foco experimental é liberado, sem deixar teclado visual fantasma e mantendo a preferência para a próxima tentativa
- Se o usuário tocar no campo durante a tentativa, o toque manual prevalece, o temporizador não pode desfazer sua interação
- Fechar deliberadamente com gesto de arrastar o campo para baixo ou toque na área da conversa desativa a preferência; abrir outra vez reativa
- Fechar o teclado ao enviar uma mensagem ou acessar ajustes **não** desativa a preferência
- Retomar do segundo plano continua seguindo o comportamento original, sem nova tentativa de foco
- O código salva somente a preferência de abertura, nunca o texto digitado ou os números secretos
- O resultado de abrir o teclado sem toque após encerrar totalmente o PWA depende do iOS, requer teste real no aparelho
- Backup: `backup-v73-antes-restaurar-teclado`

## Refino do White Mode na V73

- Ajuste visual baseado na captura de referência do ChatGPT real em modo claro, sem modificar dimensões ou comportamento
- Fundo principal passa de branco puro para cinza quase branco `#FCFCFC`, texto principal próximo do preto `#0D0D0D`
- Bolha da pergunta usa azul muito claro `#EDF3FF` com texto azul `#2459E8`
- Botões superiores, campo de mensagem e botão de rolagem usam branco, bordas discretas ou transparentes e sombra suave
- Atualizados os gradientes de topo e rodapé para combinar com o fundo claro
- Dark Mode, seleção Sistema, teclado, listas, forces, peeks, Work, offline e atualização permanecem intactos
- Backup integral: `backup-v72-antes-cores-white`

## Aparência na V72

- O botão do **canto superior esquerdo** mantém o toque curto para abrir o menu lateral
- **Pressionar por 3 segundos** abre um seletor de aparência com três opções, na ordem: `Dark mode`, `White mode` e `Sistema`
- `Dark mode`: visual escuro original, que permanece como padrão para quem ainda não escolheu outro tema
- `White mode`: estilo claro completo, mantendo a estrutura, dimensões, gestos e funções originais
- `Sistema`: acompanha automaticamente a preferência claro ou escuro do iOS, sem necessidade de selecionar novamente
- A seleção é salva localmente na chave `joaninha-appearance-v1` e aplicada antes do primeiro desenho da página para evitar troca de cor perceptível ao abrir
- A escolha não altera os peeks, forces, teclado, Work, espaçamento, listas, verificação de atualizações nem Service Worker
- Um gesto de 670 ms continua não abrindo o menu por engano, e arrastar ou cancelar antes de 3 segundos interrompe o seletor
- Backup integral de antes desta alteração: `backup-v71-antes-temas`

## Arquivos em produção

| Arquivo | Uso |
| --- | --- |
| `index.html` | Interface e lógica dos truques |
| `sw.js` | Service Worker: funcionamento offline, cache e recuperação de arquivos |
| `index-version.json` | Aviso “Deseja atualizar o app” |
| `manifest.webmanifest` | Configuração da instalação na tela de início |
| `icon-192.png`, `icon-512.png` | Ícones da PWA |
| `chat-test-gpt-2-diag.js` | Diagnóstico utilizado pelo aplicativo |
| `chat-test-gpt-2-listas/` | 13 listas TXT, incluindo animais, celebridades e músicas aleatórias |
| `index-v58-backup.html` | Backup do HTML da última versão anterior |

Os nomes históricos do script e da pasta de listas **não devem ser alterados** sem atualizar todas as referências do HTML e do Service Worker

## Seleção das listas de músicas

- Pedidos de músicas sem `aleatória` ou `aleatórias` continuam usando `chat-test-gpt-2-listas/musicas.txt`
- Pedidos de músicas com `aleatória` ou `aleatórias`, com ou sem acento, usam `chat-test-gpt-2-listas/aleatorias.txt`
- O termo `aleatória` ou `aleatórias` isolado também identifica a nova lista
- A nova lista contém 100 entradas, com as mesmas regras de ordem, embaralhamento e force das listas comuns
- As duas listas de músicas ficam disponíveis offline após a preparação da V70

## Reversão V65

O peek temporário acionado pelos três pontinhos foi retirado, restaurando o comportamento original da V64, sem mudanças nas listas ou nos demais recursos

## Correção do peek rápido na V68

- Os dois controles de peek, medidor circular e microfone, só revelam o número enquanto o **teclado estiver aberto**
- O modo secreto pode estar ativado ou desativado, quando ainda não há dígitos de um novo código, reaproveita-se o **último force válido**
- Ao digitar novos dígitos secretos, a consulta mostra o código em andamento, incluindo `05` e `00` (100)
- Com o teclado fechado, pressionar o microfone não mostra o peek
- O número continua ocultando-se imediatamente ao soltar, sem alterar o peek original de cinco segundos ou a posição ancorada no botão azul
- Backup completo anterior à alteração: branch `backup-v67-antes-ajuste-peek`

## Peek rápido nos controles do campo de mensagem

- Os controles **medidor circular** e **microfone** são usados para consultar momentaneamente o código secreto somente quando o teclado está aberto
- Pressionar qualquer um mostra o peek imediatamente; **o número fica visível só enquanto o dedo está pressionado** e some ao soltar, cancelar o gesto ou sair do aplicativo
- O toque não deve transferir o foco do campo de mensagem nem fechar o teclado, e esses controles não executam uma segunda ação no clique
- Se houver código secreto em digitação, o peek mostra seus dígitos; `00` representa 100 e `05` preserva o zero inicial
- Depois de enviar uma lista com force, o último código digitado continua disponível para consulta; sem código conhecido não aparece número
- O elemento de peek está **ancorado dentro do próprio botão azul**, portanto as coordenadas configuradas permanecem estáveis entre as aparências de flecha e viva-voz e com teclado aberto ou fechado
- O temporizador original de cinco segundos continua funcionando fora do gesto manual, e o botão azul mantém as ações de envio/voz/revelação que já possuía
- Antes de publicar esta versão, foi criada a branch de segurança `backup-v66-antes-peek-duplo` com o código e arquivos da V66

## Ajustes de fontes e espaçamento

- Em `Ajustes da Joaninha > Fontes`, o controle `Espaçamento` aparece abaixo de `Tamanho dos textos`
- A régua e os botões `−` e `+` ajustam o espaço vertical entre itens das respostas, de **−6 a +24 px**, com **0 px** como padrão
- O ajuste ocorre **apenas entre itens consecutivos**: o primeiro item continua ancorado no topo original e os demais se deslocam para baixo ao aumentar a distância
- O espaçamento se aplica tanto às listas atuais quanto às respostas arquivadas da conversa, sem alterar os títulos, o tamanho da fonte nem o seletor Work
- A preferência é salva automaticamente em `localStorage` e restaurada ao reabrir o aplicativo
- No painel Fontes, `Restaurar ajustes` redefine tanto o tamanho dos textos quanto o espaçamento padrão

## Seletor Work de forças

- Pressionar o botão `Work` por **1 segundo** abre o seletor de 10 itens por categoria, sem rolagem
- Colunas na ordem: **Músicas**, **Celebridades**, **Animais**
- A coluna Músicas mostra somente o título, em uma linha, extraído das 10 primeiras entradas de `musicas.txt`, sem o nome do artista
- A escolha continua guardando o texto completo da entrada, para manter o force correto na lista normal de músicas, sem modificar `musicas.txt`
- Cada categoria conserva seu force separadamente em `localStorage`, mantendo a seleção ao reabrir o app
- A lista `aleatorias.txt` e os efeitos anteriores não são modificados pelo seletor

## Sequência dos animais no modo secreto

A lista de animais enviada para a V58 traz **Formiga 🐜** na posição 11 e **Elefante 🐘** na posição 12

No modo secreto, **Formiga** aparece imediatamente acima do force escolhido pelo Work e **Elefante** imediatamente abaixo, com comportamento circular nas posições 1 e 100

A lista normal continua sendo embaralhada aleatoriamente, incluindo Pulga e Baleia como animais comuns

## Intervalo de verificação na V71

- A consulta periódica a `index-version.json` passou de **15 segundos** para **60 segundos**, enquanto o aplicativo estiver visível e online
- Continuam as verificações imediatas ao abrir, ganhar foco, voltar à tela, recuperar a conexão e abrir o menu
- O cache offline, o Service Worker e a confirmação manual de atualizações permanecem inalterados

## Detecção automática de atualizações na V70

- Corrigida a ausência de consultas automáticas enquanto a Joaninha permanecia aberta em primeiro plano
- A verificação do arquivo `index-version.json` agora ocorre imediatamente ao iniciar e a cada **15 segundos**, apenas quando o aplicativo está visível e conectado
- Também ocorre ao retornar ao aplicativo, recuperar o foco, voltar a ficar online e abrir o menu lateral
- O check do botão superior e a mensagem `Deseja atualizar o app` continuam sincronizados pela mesma rotina de atualização, e o check passa a poder surgir **antes que o usuário abra o menu**
- Os avisos continuam persistentes quando a versão nova já foi detectada e o aparelho fica offline
- O `sw.js`, o fluxo de atualização consentida, o cache offline, os truques e as listas não foram alterados
- **Limitação:** a detecção não é instantânea no momento da publicação, pode levar até aproximadamente 15 segundos enquanto o app está ativo, mais o tempo de rede, e timers do iOS podem atrasar em segundo plano
- Backup integral anterior à alteração: `backup-v69-antes-check-automatico`

## Indicador de pendências

O ícone de balão com check no canto superior direito é um alerta **somente quando há uma pendência**:

- Aparece enquanto os arquivos offline ainda não foram verificados, quando algum arquivo falta ou quando uma versão mais recente é conhecida
- Desaparece quando os 18 recursos necessários estão em cache e não existe atualização conhecida pendente
- O aviso de atualização continua acessível no menu lateral: `Deseja atualizar o app`
- Após aceitar a atualização e abrir a nova versão, o check desaparece quando a verificação offline confirma os recursos
- O conhecimento de uma atualização disponível fica salvo no aparelho, inclusive durante a desconexão
- O botão continua ativando o chat temporário e continua com o gesto longo existente, mas o modo temporário é diferenciado por um balão sutilmente destacado, sem utilizar o check
- A mensagem anterior `Pronto para funcionar offline` foi retirada

Se o check aparecer por recursos ausentes, abrir o app com internet aciona a recuperação automática, se aparecer por atualização, abrir o menu e aceitar a atualização resolve a pendência

**Limitação:** sem internet o aplicativo não consegue descobrir novas atualizações, o alerta reflete a última versão conhecida, e se o iOS apagar todos os dados o próprio app pode deixar de abrir até reconectar

## Operação offline

1. Abrir a Joaninha com internet após atualizar para a V70
2. O Service Worker salva automaticamente o HTML, as 13 listas, o script, os ícones e o manifesto
3. Quando todos os arquivos estiverem íntegros e não houver atualização conhecida, o botão de check não aparece
4. Depois disso, abrir e usar o aplicativo sem internet, inclusive após fechá-lo, funciona a partir dos arquivos locais
5. A indicação discreta “Offline” só aparece quando o aparelho informa que está sem conexão
6. Se algum arquivo local estiver faltando, o check aparece e a recuperação ocorre automaticamente na próxima abertura online

Não há confirmação repetitiva durante aberturas online normais e **não é necessário transferir arquivos manualmente para o iPhone**

### Atualizações

- Primeiro publicar e verificar o novo `index.html` e os TXT, mantendo os números de versão coerentes
- Publicar **por último** a nova versão em `index-version.json`
- Ao detectar uma versão mais recente online, a Joaninha oferece o aviso de atualização já existente
- O usuário escolhe quando atualizar, e o Service Worker baixa **todos** os recursos da nova versão antes de ativar o cache atualizado
- Uma falha durante a preparação deixa a última versão funcional preservada
- Não modificar `sw.js` apenas para aumentar o número de versão, a atualização é controlada por mensagens do próprio aplicativo
- Se a estrutura de arquivos mudar, atualizar também a lista `FILES` em `sw.js`

### Limitação do iOS

O Safari/iOS pode remover armazenamento local por políticas de espaço, remoção de dados do site ou outros motivos, não há garantia de retenção permanente

Se o código ainda abrir, a Joaninha verifica os arquivos e tenta recuperá-los online, se o iOS remover integralmente a PWA e os dados enquanto estiver offline, será necessário obter conexão para abrir e preparar novamente

## Histórico e segurança

O backup anterior mais recente na pasta principal é `index-v58-backup.html`

A ramificação [backup-repositorio-v56-antes-da-limpeza](https://github.com/100ratings/gpt/tree/backup-repositorio-v56-antes-da-limpeza) conserva o estado integral do repositório antes da limpeza de novembro de 2026
