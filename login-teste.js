import { criarTesteLogin } from './login-teste-core.js';

const email = document.querySelector('#email');
const codigo = document.querySelector('#codigo');
const solicitar = document.querySelector('#solicitar');
const verificar = document.querySelector('#verificar');
const mensagem = document.querySelector('#mensagem');
let cliente;
let ocupado = false;
let aguardarAte = 0;
let destinatario = '';
try { cliente = criarTesteLogin(window.TRAMPOFACIL_SUPABASE); }
catch { mensagem.textContent = 'Configuração inválida. Teste indisponível.'; solicitar.disabled = true; }

async function executar(operacao) {
  if (ocupado) return;
  ocupado = true; solicitar.disabled = true; verificar.disabled = true;
  try { await operacao(); }
  catch (erro) {
    mensagem.textContent = erro instanceof TypeError || erro.name === 'TimeoutError'
      ? 'Falha de conexão. O resultado pode ser incerto. Aguarde antes de repetir.' : erro.message;
  } finally {
    ocupado = false; solicitar.disabled = !cliente;
    verificar.disabled = !destinatario;
  }
}
document.querySelector('#envio').addEventListener('submit', evento => {
  evento.preventDefault();
  if (!cliente || ocupado) return;
  if (Date.now() < aguardarAte) { mensagem.textContent = 'Aguarde um minuto entre os envios.'; return; }
  executar(async () => {
    destinatario = ''; codigo.value = '';
    aguardarAte = Date.now() + 60000;
    const valor = email.value.trim().toLowerCase();
    await cliente.solicitar(valor);
    destinatario = valor;
    mensagem.textContent = 'Pedido enviado. Confira seu e-mail e o spam. Digite o código somente nesta página.';
    codigo.focus();
  });
});
document.querySelector('#confirmacao').addEventListener('submit', evento => {
  evento.preventDefault();
  if (!cliente || ocupado || !destinatario) return;
  executar(async () => {
    const valor = codigo.value.trim(); codigo.value = '';
    mensagem.textContent = 'Verificando e encerrando a sessão de teste…';
    await cliente.verificar(destinatario, valor);
    destinatario = '';
    mensagem.textContent = 'Teste aprovado: código aceito, identidade confirmada e sessão de teste encerrada. Avise o Nex: login aprovado.';
  });
});
window.addEventListener('pagehide', () => { codigo.value = ''; email.value = ''; destinatario = ''; });
