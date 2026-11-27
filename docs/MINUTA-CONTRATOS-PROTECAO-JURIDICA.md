# Minuta v0.1 — proteção contratual TrampoFácil
27/11/2026 — RASCUNHO, não publicar como contrato vigente. Identificação da operadora, CNPJ, endereço e canais definitivos pendentes. Revisão jurídica e financeira antes da ativação.

## Minuta de responsabilidade profissional
1. O profissional identificado no orçamento assume a execução independente do escopo aceito, observando normas técnicas, segurança, qualificações e autorizações aplicáveis. A plataforma presta intermediação e responde por suas próprias obrigações e pelas responsabilidades que a legislação lhe atribuir.
2. O profissional discriminará mão de obra, materiais, responsável pela aquisição, especificações, prazo, etapas e exclusões. Não iniciará adicionais sem aprovação documentada, ressalvados direitos legais.
3. O profissional responde pelos defeitos e danos que lhe forem legalmente imputáveis, inclusive materiais inutilizados por negligência ou imperícia, e cooperará com apuração e reparação. Não responde automaticamente por mera insatisfação subjetiva.
4. O profissional poderá ressarcir a operadora por prejuízos comprovados que lhe sejam imputáveis, na proporção de sua responsabilidade, após comunicação e oportunidade de contestação, sem afastar direitos do consumidor. Compensação financeira somente quando legal e contratualmente cabível e suportada pelo provedor.
5. A entrega ou aprovação não elimina garantias legais nem direitos relativos a defeitos ocultos.

## Minuta de contrato individual
Partes: cliente e profissional identificados privadamente; operadora identificada como intermediadora. Anexar versão imutável do orçamento, local, escopo, resultado esperado, materiais e respectivas responsabilidades, preços discriminados, etapas, prazo, habilitação aplicável e condições de pagamento efetivamente disponíveis.
Ambas as partes poderão consultar e obter cópia antes e depois do aceite. Alteração material exige aditivo e novo aceite bilateral. O profissional executará o escopo contratado; o cliente facilitará acesso e fornecerá materiais quando ajustado. A conclusão registrará entrega e eventuais ressalvas sem quitação irrestrita.
Em caso de divergência, usar a central de reclamações, sem impedir acesso a Procon, Judiciário ou outros meios legais. Quando aplicável, o consumidor poderá escolher os remédios previstos no CDC art. 20, sem impor tentativa de reparo como condição universal. Preservar direito de arrependimento legal e garantias, inclusive especiais de construção quando aplicáveis.
Não prometer custódia, seguro, reembolso automático ou prazo de repasse ainda não confirmado.

## Requisitos técnicos (não implementados neste commit)
- Inspecionar esquema e transições existentes; não alterar pedidos históricos nem forjar aceites.
- Versões de documentos e snapshot canônico do orçamento, hash SHA-256 calculado no servidor, conteúdo integral preservado, identificador único. Hash isolado não prova autoria.
- Aceites individuais autenticados, manifestação explícita, timestamp do servidor, vinculação a versão/hash e identidade da sessão; reautenticação adequada ao risco; sem OTP em logs.
- RLS e RPC transacional: somente partes leem/aceitam; sem edição ou exclusão direta de aceites; auditoria de acesso administrativo restrito; regras de retenção e descarte LGPD a definir.
- Bloqueio de início para novos contratos sujeitos ao módulo até dois aceites válidos, no servidor e interface; concorrência, duplicidade, troca de sessão, versão obsoleta e alteração do orçamento devem ser testadas. Não bloquear retroativamente contratos antigos.
- Cópia PDF acessível às partes, evidências exportáveis, acessibilidade e clareza; não declarar assinatura avançada ou ICP-Brasil sem comprovação.
- Ativação comercial bloqueada até revisão jurídica, identificação da operadora, política de privacidade, regras de cancelamento e pagamentos confirmadas. Não alterar main/produção, RLS existente ou movimentar valores.

## Fontes primárias consultadas
- CDC arts. 14, 20, 25, 26, 46, 49, 51: https://planalto.gov.br/ccivil_03/leis/l8078compilado.htm
- Código Civil arts. 615–619 (empreitada): https://planalto.gov.br/ccivil_03/leis/2002/l10406compilada.htm
- MP 2.200-2 art. 10 §2 (autoria e integridade): https://www.planalto.gov.br/ccivil_03/mpv/antigas_2001/2200-2.htm
Nenhuma cláusula elimina responsabilidade legal ou impede processo. Próximos documentos: termos de uso, privacidade e política de garantia/cancelamento, além de revisão de jurisprudência específica de plataformas.
