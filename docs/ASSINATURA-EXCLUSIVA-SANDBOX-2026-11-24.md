# Exclusividade de assinatura no receptor sandbox

24/11/2026, base remota 9c534b492d1eb223a4239ea1c12582661ec6a36e.

O receptor HTTP aceitava x-payload-signature mesmo na presença de x-authenticity-token. A assinatura ECDSA continuava obrigatória; não foi identificado bypass criptográfico. A divergência era a ausência de recusa explícita de modelos misturados, prevista no checklist.

Corrigido para retornar 401 ASSINATURA_INVALIDA antes de leitura do corpo, obtenção da chave e registro quando houver cabeçalho legado, inclusive vazio. O teste usa assinatura ECDSA válida com cabeçalho legado, verifica zero consultas/registros e confirma que ECDSA sozinho continua aceito.

Validação local: 24 testes aprovados, zero falhas, nos arquivos checkout-sandbox, chave-pagbank-sandbox, webhook-assinatura-sandbox, webhook-chave-sandbox e webhook-receptor-sandbox. Estas cinco suítes passam a integrar também o workflow financeiro, com npm ci --ignore-scripts. A suíte geral já as executava; o workflow financeiro anterior não as incluía.

Implantação: somente webhook-pagbank-sandbox, projeto asdszqtpydiowgerxwee, versão 2 ACTIVE. Pacote recuperado da implantação anterior, preservando todos os arquivos exceto server/webhook-receptor-sandbox.js. Sem mudança de banco, credenciais, JWT ou processamento financeiro.

Logs de funções consultados: apenas inicialização/encerramento na janela disponível. Advisors permanecem com nove INFO em tabelas privadas bloqueadas e WARN preexistente de proteção contra senhas vazadas. Não houve enfraquecimento de segurança.

Teste HTTP remoto com assinatura fictícia e cabeçalhos misturados retornou 401 ASSINATURA_INVALIDA. Não comprova evento autêntico do PagBank; o teste local com chave gerada cobre a diferença específica. Checkout completo do provedor ainda depende de sessão legítima e confirmação das credenciais de sandbox. Nenhuma cobrança, repasse ou produção ativada.
