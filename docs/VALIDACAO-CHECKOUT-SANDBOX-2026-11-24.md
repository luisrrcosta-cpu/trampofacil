# Verificação de checkout sandbox — 24/11/2026

Base: 8e06bbbbfb4984ec92d376a8d8cc51ded7893fce, branch codex/v16-seguranca-integracoes.

Consulta da homologação asdszqtpydiowgerxwee confirmou funções ativas criar-checkout-sandbox v1, webhook-pagbank-sandbox v1 e preparar-pagamento-teste v15. Implantação ativa não comprova credencial válida ou integração concluída.

Sondagens HTTP sem sessão ou assinatura, com corpo vazio JSON, retornaram:
- criar-checkout-sandbox: 401 NAO_AUTENTICADO.
- webhook-pagbank-sandbox: 401 ASSINATURA_INVALIDA.

Não foi criada sessão administrativa, checkout ou evento assinado. Nenhuma alteração no banco ou implantação foi realizada.

Validação local: 22 testes de checkout, chave, assinatura e receptor aprovados antes da ampliação. Adicionado cenário com doze respostas divergentes/malformadas do provedor: referência, estado, valor, quantidade, acréscimo, desconto, recorrência, entrega, links duplicados/externos e resposta ausente/incompleta. Todas recusadas com erro genérico e apenas um envio. Suíte checkout após ampliação: 9 testes aprovados, zero falhas.

Permanece pendente comprovar checkout e notificação reais do sandbox com identidade autenticada legítima e credenciais do servidor. As sondagens 401 não verificam validade das credenciais, compatibilidade do payload do provedor ou processamento de pagamento. Não solicitar repetição dos testes manuais de contratação/nota já concluídos.

Produção, pagamentos e repasses reais permanecem fora do escopo.
