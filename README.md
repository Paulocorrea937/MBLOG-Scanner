# MBLOG Scanner v3.0 — aplicativo com abas

**Aplicativo web progressivo (PWA)** para gestão de atendimentos da frota e geração de PDF localmente. Sem custos de hospedagem pelo GitHub Pages.

## O que está disponível

- Abas: **Visão geral**, **Leituras**, **Sistemas**, **Falhas**, **Histórico**, **Relatórios** e **Configurações**.
- Cadastro privado de até 200 veículos importado por arquivo `.json` no próprio celular.
- Relatórios técnicos A4 em PDF com placa, modelo, data, técnico, atendimento, observações e indicação da origem dos dados.
- Histórico de atendimentos salvo no navegador do aparelho e reexportação de cada relatório em PDF.
- Demonstração opcional em Configurações, com números e códigos de falha **explicitamente fictícios**.
- Interface adaptada ao Android, instalável pelo Chrome quando a PWA estiver publicada via HTTPS.

## O que NÃO está disponível nesta versão

A **leitura eletrônica real**, incluindo falhas SPN/FMI, motor, ABS e outros módulos, **não funciona ainda**. O aplicativo não se conecta à rede CAN nem comunica com adaptadores Bluetooth ou Wi-Fi. Ainda é necessário selecionar e validar interface elétrica, pinagem, protocolos e integração. Quando não há leitura real, indicadores aparecem com `—` e os PDFs são identificados como **REGISTRO MANUAL / SEM LEITURA ELETRÔNICA**. Não use o relatório para atestar ausência de defeitos.

## Atualizar o GitHub Pages

1. Extraia o ZIP e abra a pasta `MBLOG_Scanner_v3`.
2. Envie **todos os arquivos desta pasta**, preservando `icons/` e `gateway/`, para a **raiz** do mesmo repositório no GitHub (o `index.html` deve estar na raiz). Substitua arquivos da versão antiga.
3. Aguarde a publicação em **Settings → Pages** (branch `main`, diretório `/(root)`).
4. No Chrome do celular, abra a URL do GitHub Pages, atualize a página e, se necessário, feche e reabra o aplicativo para renovar o cache.
5. Para instalar/atualizar atalho PWA, use menu do Chrome → **Instalar aplicativo** ou **Adicionar à tela inicial**.

## Importar os veículos no celular

- Baixe separadamente o arquivo `cadastro_privado_MBLOG.json` no Android (pasta Downloads).
- Na versão 3, abra **Configurações (ícone da engrenagem no alto à direita) → Minha frota → Importar cadastro**.
- Escolha o JSON salvo no dispositivo. O aplicativo exibe os nove veículos no seletor superior.
- **Nunca envie o JSON privado para um repositório público, issue ou GitHub Pages.** O dado fica no armazenamento local do navegador e não é sincronizado entre celulares.

## Relatórios e segurança

- Em **Relatórios**, digite nome do responsável, tipo de atendimento e observações, depois use **Exportar PDF**.
- Para preservar atendimentos no histórico local, toque em **Salvar atendimento**.
- Faça backup dos PDFs; limpar dados do navegador pode apagar o cadastro e o histórico.
- A demonstração (Configurações) é separada das funções normais: qualquer valor eletrônico gerado por ela aparece claramente identificado como fictício, inclusive no PDF.

## Tecnologias

HTML, CSS e JavaScript local. PDF escrito no navegador sem CDNs nem serviços externos. `gateway/` contém apenas utilitários Python J1939 exploratórios, sem interface real configurada.
