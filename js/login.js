$$('[data-cuenta]').forEach(
  (b) =>
    (b.onclick = () => {
      $('#correo').value = b.dataset.cuenta + '@demo.local';
      $('#clave').value = 'Demo2026!';
    })
);
$('#formLogin').addEventListener('submit', async (e) => {
  e.preventDefault();
  $('#errorLogin').hidden = true;
  $('#btnIngresar').disabled = true;
  try {
    await api('/login', 'POST', { correo: $('#correo').value, clave: $('#clave').value });
    location.href = 'panel.html';
  } catch (error) {
    mostrarError('#errorLogin', error);
  } finally {
    $('#btnIngresar').disabled = false;
  }
});
