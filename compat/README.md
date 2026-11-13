# Joaninha LAB, auditoria de compatibilidade

Esta pasta é uma cópia isolada da Joaninha **V90**, destinada exclusivamente a testes de compatibilidade

Links previstos após publicação:
- Teste: `https://100ratings.github.io/gpt/compat/`
- Teste com diagnóstico no aparelho real: `https://100ratings.github.io/gpt/compat/?diagnostico=1`
- Simulador de tamanhos (em CSS): `https://100ratings.github.io/gpt/compat/qa.html`

## Proteções

- A raiz `/gpt/` continua com a V90 e o mesmo código original
- Todos os `localStorage` da cópia têm prefixo `joaninha-compat-`
- O Service Worker da cópia é registrado com escopo `/gpt/compat/`, sem tocar no SW de `/gpt/`
- Os Cache Storage da cópia usam nomes exclusivos `joaninha-compat-shell-v1-` e `joaninha-compat-offline-meta-v1`
- O marcador de atualização isolado permanece em `compat/index-version.json` com a versão 901
- As listas originais e os ícones têm cópias dentro da pasta de testes

## Alterações experimentais iniciais

- Identificação de Android separada da prévia de computador, evitando barra de status simulada no Android
- Remoção do deslocamento fixo de teclado medido em iPhone quando o aparelho é Android
- Ajustes para telas estreitas, altura curta e posição paisagem
- Reavaliação de altura base em Android quando o teclado fecha
- Diagnóstico local para coleta de dimensão, teclado e geometrias sem transmissão de dados

## Limitações de validação

A página `qa.html` apenas simula **largura e altura em CSS**, não emula o teclado, notch, WebKit ou gestos físicos de um smartphone real

O diagnóstico embutido captura parâmetros do próprio celular real, porém os testes de toque, instalação PWA, teclado e gestos secretos dependem de execução física em aparelhos iOS e Android

Não promover para a versão principal sem:
1. Teste em tela de 320 a 430 CSS px
2. Teste do teclado nativo em iOS e Android
3. Teste de segurar Work e Chat por 1 s
4. Teste de peeks e forças 1, 10, 100
5. Teste de importação TXT e backup JSON
6. Teste de reinstalação, atualização e offline
