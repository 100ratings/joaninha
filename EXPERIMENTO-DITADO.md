# Experimento de ditado por voz da Joaninha

Esta experiência está isolada em [experimento-ditado.html](experimento-ditado.html), baseada na V85, sem substituir o aplicativo principal

## Como testar no iPhone

1. Abra **https://100ratings.github.io/gpt/experimento-ditado.html** no Safari do iPhone
2. Toque no campo de mensagem para abrir o teclado nativo
3. Toque no ícone de microfone e autorize o reconhecimento, caso o iPhone solicite
4. A barra de gravação aparece no lugar do campo, com X, onda animada, parar e seta azul
5. Fale em português, por exemplo: `Liste 100 animais`
6. Toque no quadrado para concluir e transcrever, o texto entra no campo e pode ser editado
7. Toque novamente no microfone para uma segunda gravação e conferir se ela acrescenta texto
8. Faça uma gravação de teste e toque no X, o texto anterior deve permanecer
9. Em outra gravação, toque na seta azul, a frase reconhecida deve ser enviada após a finalização do reconhecimento
10. Para testar o Peek, pressione e segure apenas o botão circular à esquerda do microfone, que não recebe mais esta função

## Comportamento esperado

- O microfone **inicia ditado real**, sem gerar palavras fictícias
- O reconhecimento utiliza `window.SpeechRecognition || window.webkitSpeechRecognition`, com `lang = pt-BR`, `continuous = true` e `interimResults = true`
- O texto reconhecido fica retido até o usuário parar ou enviar, seguindo a gravação de referência
- O X cancela sem alterar a mensagem original
- O quadrado para e preserva o texto no campo
- A seta azul conclui o reconhecimento e envia a mensagem, caso haja texto
- A onda sonora animada é **uma aproximação visual, não um medidor real de amplitude**
- O campo `textarea` transparente permanece no DOM e focado sob a barra, para tentar preservar o teclado original
- O indicador circular continua como Quick Peek, mas o microfone fica exclusivo para o ditado
- A transcrição é desabilitada enquanto o modo secreto está armado, para proteger os códigos ocultos e o mecanismo de forças
- O navegador poderá depender de serviços externos de reconhecimento de voz, conforme a implementação do WebKit, embora este código não envie gravações a servidores próprios

## Limitações e atenção

O navegador pode solicitar permissão de microfone/reconhecimento, encerrar gravações após pausas, exigir rede e não disponibilizar `SpeechRecognition` no modo instalado do iPhone

Há registros de falhas de várias sessões consecutivas no WebKit de versões específicas do iOS, portanto o objetivo principal deste experimento é validar o funcionamento real no aparelho antes de portar a experiência para a versão principal

O projeto possui tratamento de `onstart`, `onresult`, `onerror` e `onend`, inclusive com fallback de encerramento, sem simular uma transcrição quando o reconhecimento falhar

## Segurança da versão principal

- O arquivo principal `index.html` permanece na **V85**
- O marcador `index-version.json` permanece na **V85**
- O Service Worker, os TXT de forças e os ajustes originais não foram modificados
- A experiência isolada é acessada apenas pelo link de teste
- Backup anterior ao protótipo: `backup-v85-antes-prototipo-ditado`

A incorporação à Joaninha principal depende da confirmação dos testes no iPhone
