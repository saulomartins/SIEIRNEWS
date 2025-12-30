const API_URL = 'http://localhost:3000/api';

document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const loginBtn = document.getElementById('loginBtn');
  const alertContainer = document.getElementById('alert-container');
  
  // Limpar alertas anteriores
  alertContainer.innerHTML = '';
  
  // Desabilitar botão durante o login
  loginBtn.disabled = true;
  loginBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Entrando...';
  
  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      // Salvar token no localStorage
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      // Mostrar mensagem de sucesso
      showAlert('Login realizado com sucesso! Redirecionando...', 'success');
      
      // Redirecionar para dashboard
      setTimeout(() => {
        window.location.href = 'dashboard.html';
      }, 1000);
    } else {
      showAlert(data.message || 'Erro ao fazer login', 'danger');
      loginBtn.disabled = false;
      loginBtn.innerHTML = 'Entrar';
    }
  } catch (error) {
    console.error('Erro:', error);
    showAlert('Erro ao conectar com o servidor', 'danger');
    loginBtn.disabled = false;
    loginBtn.innerHTML = 'Entrar';
  }
});

function showAlert(message, type) {
  const alertContainer = document.getElementById('alert-container');
  const alert = document.createElement('div');
  alert.className = `alert alert-${type} alert-dismissible fade show`;
  alert.role = 'alert';
  alert.innerHTML = `
    ${message}
    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
  `;
  alertContainer.appendChild(alert);
}

// Verificar se já está logado
if (localStorage.getItem('token')) {
  window.location.href = 'dashboard.html';
}
