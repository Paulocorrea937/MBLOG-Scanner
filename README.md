# MBLOG Scanner — protótipo v1 (modo simulação)

O projeto contém uma **PWA gratuita** para experimentar o aplicativo no Android e
um decodificador **Python de exemplo** para mensagens DM1/J1939. **Não existe
conexão com caminhões, leitura real, transmissão CAN ou limpeza de erros nesta versão.**
Todos os dados que aparecem no painel são gerados ficticiamente no próprio navegador.

## Começar no computador

1. Instale o Python 3.10+ (ou use outro servidor HTTP estático).
2. Abra um terminal na pasta `MBLOG_Scanner_v1` e execute:

   ```bash
   python -m http.server 8000
   ```

3. Acesse `http://localhost:8000` no navegador.
4. Clique em **Iniciar simulação** e **Simular falha**.

## Abrir no Android sem notebook durante a demonstração

Publique **apenas os arquivos do projeto público, sem as placas reais**, no
GitHub Pages: repositório → Settings → Pages → Deploy from a branch → main → / (root).
Abra o endereço HTTPS pelo navegador Chrome do Android; no menu, use
**Adicionar à tela inicial / Instalar aplicativo** se essa opção estiver disponível.
O aplicativo simula dados no próprio Android, inclusive offline após o primeiro acesso,
quando o navegador permitir o cache da PWA.

> O GitHub Pages hospeda arquivos estáticos, mas **não executa Python**. Ele não
> oferece leitura CAN/OBD pela tomada do caminhão.

## Cadastrar os veículos reais

O projeto público inclui somente placas fictícias `DEMO-01` a `DEMO-09`.
No app, clique em **Importar cadastro privado (.json)** e selecione o arquivo
`cadastro_privado_MBLOG.json` fornecido separadamente. O arquivo real será lido
localmente no navegador e salvo no armazenamento do dispositivo (`localStorage`).
**Não faça commit desse arquivo em repositório público** nem compartilhe o
endereço da página contendo informações pessoais, se houver.

Formato aceito:

```json
{"vehicles": [{"id":"MB01", "plate":"DEMO-01", "model":"Volkswagen 17.190 CRM", "year":2014}]}
```

O histórico pode ser exportado em CSV. O navegador pode apagar dados locais ao
limpar cache, reinstalar o app ou no modo anônimo; faça backup dos arquivos CSV.

## Testar o decodificador Python (offline)

Este exemplo trata o corpo de uma mensagem **J1939 DM1 (PGN 65226)**.
A entrada é uma string hexadecimal didática; ela **não veio de um veículo**:

```bash
python gateway/j1939.py "00 00 6E 00 03 01"
python -m unittest discover -s gateway -v
```

O exemplo exibe o código **SPN 110, FMI 3, ocorrência 1**. O parser não
reconstitui pacotes de transporte, não identifica módulos e não garante
compatibilidade com mensagens proprietárias.

## Plano para chegar ao diagnóstico REAL pelo celular

1. Confirmar no manual elétrico ou com oficina qual a pinagem, tensão e protocolo
   de cada veículo: VW, Mercedes e Ford. Fotos externas do conector não bastam.
2. Comprar/usar **interface automotiva certificada e compatível com 24 V**, que
   tenha suporte **documentado** a CAN/J1939 e conectividade Android por Wi-Fi,
   Bluetooth ou USB. Não assumir que todo ELM327 serve para caminhões.
3. Registrar primeiro leituras **passivas**, sem enviar comandos; validar RPM,
   temperatura e mensagens DM1 com um scanner profissional de referência.
4. Implementar uma camada específica de comunicação. Para rodar diretamente
   no celular, preferir um app Android com suporte nativo ao adaptador, ou
   um gateway sem fio que hospede a interface localmente. Um PWA hospedado
   via GitHub Pages não deve tentar contornar bloqueios de rede/segurança
   do navegador.
5. Só liberar funções adicionais após validação específica por marca e módulo.

**Nunca ligar uma interface desconhecida apenas porque o encaixe combina.**
Não transmitir comandos de atuação, calibração, apagamento de falhas ou escrita de ECU
na fase experimental. Usar apenas em veículos autorizados e estacionados.

## Licença

Código demonstrativo entregue para uso e adaptação. O projeto não é ferramenta
profissional de diagnóstico e não deve orientar decisões de segurança veicular.
