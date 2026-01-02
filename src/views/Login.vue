<template>
  <div class="login-container">
    <div class="login-card">
      <div class="login-header">
        <h1>SIEIRNEWS</h1>
        <p>Sistema de Monitoramento de Ativos</p>
      </div>

      <div v-if="alert.show" :class="`alert alert-${alert.type}`">
        {{ alert.message }}
      </div>

      <form @submit.prevent="handleLogin">
        <div class="input-group">
          <label for="email">Email</label>
          <input
            type="email"
            id="email"
            v-model="form.email"
            placeholder="seu@email.com"
            required
          />
        </div>

        <div class="input-group">
          <label for="password">Senha</label>
          <input
            type="password"
            id="password"
            v-model="form.password"
            placeholder="••••••••"
            required
          />
        </div>

        <button type="submit" class="btn btn-primary btn-block" :disabled="loading">
          <span v-if="loading" class="spinner"></span>
          <span v-else>Entrar</span>
        </button>
      </form>

      <div class="login-footer">
        <p>Não tem uma conta? <a href="#" @click.prevent="showRegister">Registre-se</a></p>
      </div>
    </div>
  </div>
</template>

<script>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import authService from '../services/authService';

export default {
  name: 'Login',
  setup() {
    const router = useRouter();
    const form = ref({
      email: '',
      password: '',
    });
    const loading = ref(false);
    const alert = ref({
      show: false,
      message: '',
      type: 'success',
    });

    const showAlert = (message, type = 'success') => {
      alert.value = {
        show: true,
        message,
        type,
      };
      setTimeout(() => {
        alert.value.show = false;
      }, 5000);
    };

    const handleLogin = async () => {
      loading.value = true;
      alert.value.show = false;

      try {
        await authService.login(form.value.email, form.value.password);
        showAlert('Login realizado com sucesso!', 'success');
        
        setTimeout(() => {
          router.push('/dashboard');
        }, 1000);
      } catch (error) {
        showAlert(error.message || 'Erro ao fazer login', 'error');
      } finally {
        loading.value = false;
      }
    };

    const showRegister = () => {
      alert.value = {
        show: true,
        message: 'Funcionalidade de registro será implementada em breve!',
        type: 'info',
      };
    };

    return {
      form,
      loading,
      alert,
      handleLogin,
      showRegister,
    };
  },
};
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  padding: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.login-card {
  background: white;
  border-radius: 20px;
  padding: 40px;
  width: 100%;
  max-width: 450px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.login-header {
  text-align: center;
  margin-bottom: 30px;
}

.login-header h1 {
  font-size: 36px;
  font-weight: 700;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin-bottom: 10px;
}

.login-header p {
  color: #666;
  font-size: 16px;
}

.btn-block {
  width: 100%;
  padding: 14px;
  font-size: 18px;
  margin-top: 10px;
}

.login-footer {
  text-align: center;
  margin-top: 20px;
  color: #666;
}

.login-footer a {
  color: #667eea;
  text-decoration: none;
  font-weight: 600;
}

.login-footer a:hover {
  text-decoration: underline;
}

.alert-info {
  background: #d1ecf1;
  color: #0c5460;
  border: 1px solid #bee5eb;
}

@media (max-width: 480px) {
  .login-card {
    padding: 30px 20px;
  }

  .login-header h1 {
    font-size: 28px;
  }
}
</style>
