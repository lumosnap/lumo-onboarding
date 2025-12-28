<template>
  <div class="auth-container">
    <div class="auth-card">
      <h1>{{ isSignUp ? 'Create Account' : 'Sign In' }}</h1>

      <!-- Google OAuth Button -->
      <button
        @click="handleGoogleSignIn"
        class="google-btn"
        :disabled="loading"
      >
        <svg width="20" height="20" viewBox="0 0 24 24">
          <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        Continue with Google
      </button>

      <div class="divider">
        <span>or</span>
      </div>

      <!-- Email/Password Form -->
      <form @submit.prevent="handleSubmit" class="auth-form">
        <div v-if="isSignUp" class="form-group">
          <label for="name">Name</label>
          <input
            id="name"
            v-model="formData.name"
            type="text"
            placeholder="Your name"
            required
          />
        </div>

        <div class="form-group">
          <label for="email">Email</label>
          <input
            id="email"
            v-model="formData.email"
            type="email"
            placeholder="your@email.com"
            required
          />
        </div>

        <div class="form-group">
          <label for="password">Password</label>
          <input
            id="password"
            v-model="formData.password"
            type="password"
            placeholder="••••••••"
            required
          />
        </div>

        <button type="submit" class="submit-btn" :disabled="loading">
          {{ loading ? 'Processing...' : (isSignUp ? 'Sign Up' : 'Sign In') }}
        </button>
      </form>

      <!-- Error Message -->
      <div v-if="error" class="error-message">
        {{ error }}
      </div>

      <!-- Toggle between Sign In/Sign Up -->
      <p class="toggle-text">
        {{ isSignUp ? 'Already have an account?' : "Don't have an account?" }}
        <button @click="toggleMode" class="toggle-btn">
          {{ isSignUp ? 'Sign In' : 'Sign Up' }}
        </button>
      </p>
    </div>

    <!-- Session Display (for debugging) -->
    <div v-if="session?.data && !callbackUrl" class="session-card">
      <h2>Session Active</h2>
      <div class="session-info">
        <p><strong>User:</strong> {{ session.data.user?.name || session.data.user?.email }}</p>
        <p><strong>Email:</strong> {{ session.data.user?.email }}</p>
        <p><strong>Session ID:</strong> {{ session.data.session?.token }}</p>
        <div class="token-display">
          <p><strong>Token:</strong></p>
          <code class="token">{{ session.data.session?.token }}</code>
        </div>
      </div>
      <button @click="handleSignOut" class="signout-btn">Sign Out</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { createAuthClient } from "better-auth/vue"

// useRoute is auto-imported in Nuxt 4
const route = useRoute()

// Better Auth client
const authClient = createAuthClient({
  baseURL: useRuntimeConfig().public.authBaseUrl
})

// Reactive state
const isSignUp = ref(false)
const loading = ref(false)
const error = ref('')

const formData = ref({
  name: '',
  email: '',
  password: ''
})

// Get session data
const session = authClient.useSession()

// Parse callback URL from query params
const callbackUrl = computed(() => {
  const callback = route.query.callback as string
  return callback ? decodeURIComponent(callback) : null
})

/**
 * Base64 encode a string (URL-safe)
 */
const base64Encode = (str: string): string => {
  return btoa(str)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

/**
 * Redirect to callback URL with token and user data
 */
const redirectToCallback = () => {
  if (!callbackUrl.value || !session.value?.data) {
    return
  }

  const token = session.value.data.session?.token
  const user = session.value.data.user

  if (!token || !user) {
    error.value = 'Failed to get authentication token or user data'
    return
  }

  // Base64 encode user JSON
  const userJson = JSON.stringify(user)
  const base64User = base64Encode(userJson)

  // Construct callback URL with parameters
  const finalCallbackUrl = `${callbackUrl.value}?token=${encodeURIComponent(token)}&user=${encodeURIComponent(base64User)}`

  // Redirect to callback URL
  window.location.href = finalCallbackUrl
}

/**
 * Handle successful authentication
 */
const handleAuthSuccess = async () => {
  // Wait a bit for session to be available
  await new Promise(resolve => setTimeout(resolve, 100))

  // Redirect to callback URL if available
  redirectToCallback()
}

// Toggle between sign in and sign up
const toggleMode = () => {
  isSignUp.value = !isSignUp.value
  error.value = ''
  formData.value = { name: '', email: '', password: '' }
}

// Handle Google OAuth sign in
const handleGoogleSignIn = async () => {
  try {
    loading.value = true
    error.value = ''

    await authClient.signIn.social({
      provider: 'google',
      callbackURL: callbackUrl.value ? '/' : undefined
    })

    // Note: OAuth redirect will handle the callback
    // The handleAuthSuccess will be called after redirect back
  } catch (err: any) {
    error.value = err.message || 'Google sign in failed'
    loading.value = false
  }
}

// Handle email/password sign in or sign up
const handleSubmit = async () => {
  try {
    loading.value = true
    error.value = ''

    if (isSignUp.value) {
      // Sign up
      const result = await authClient.signUp.email({
        email: formData.value.email,
        password: formData.value.password,
        name: formData.value.name,
      }, {
        onSuccess: async (ctx) => {
          console.log('Sign up successful', ctx)
          await handleAuthSuccess()
        },
        onError: (ctx) => {
          error.value = ctx.error.message
          loading.value = false
        }
      })
    } else {
      // Sign in
      const result = await authClient.signIn.email({
        email: formData.value.email,
        password: formData.value.password,
      }, {
        onSuccess: async (ctx) => {
          console.log('Sign in successful', ctx)
          await handleAuthSuccess()
        },
        onError: (ctx) => {
          error.value = ctx.error.message
          loading.value = false
        }
      })
    }
  } catch (err: any) {
    error.value = err.message || (isSignUp.value ? 'Sign up failed' : 'Sign in failed')
    loading.value = false
  }
}

// Handle sign out
const handleSignOut = async () => {
  try {
    loading.value = true
    await authClient.signOut()
    loading.value = false
  } catch (err: any) {
    error.value = err.message || 'Sign out failed'
    loading.value = false
  }
}

// Check for session on mount and redirect if callback URL exists
onMounted(async () => {
  // If user is already authenticated and callback URL exists, redirect
  if (session.value?.data && callbackUrl.value) {
    await redirectToCallback()
  }
})

// Watch for session changes (for OAuth callback handling)
watch(() => session.value?.data, (newData) => {
  if (newData && newData.session?.token && newData.user && callbackUrl.value) {
    console.log('Session detected after OAuth callback, redirecting...')
    setTimeout(() => {
      redirectToCallback()
    }, 500)
  }
}, { immediate: true })
</script>

<style scoped>
.auth-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.auth-card, .session-card {
  background: white;
  border-radius: 12px;
  padding: 40px;
  width: 100%;
  max-width: 400px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  margin-bottom: 20px;
}

.session-card {
  max-width: 500px;
}

h1, h2 {
  text-align: center;
  margin-bottom: 30px;
  color: #333;
}

.google-btn {
  width: 100%;
  padding: 12px 20px;
  border: 2px solid #ddd;
  border-radius: 8px;
  background: white;
  color: #333;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  transition: all 0.3s ease;
}

.google-btn:hover:not(:disabled) {
  background: #f8f9fa;
  border-color: #ccc;
}

.google-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.divider {
  display: flex;
  align-items: center;
  margin: 25px 0;
  color: #666;
}

.divider::before,
.divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: #ddd;
}

.divider span {
  padding: 0 15px;
  font-size: 14px;
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

label {
  font-size: 14px;
  font-weight: 500;
  color: #555;
}

input {
  padding: 12px 16px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 16px;
  transition: border-color 0.3s ease;
}

input:focus {
  outline: none;
  border-color: #667eea;
}

.submit-btn {
  padding: 14px 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.submit-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 5px 20px rgba(102, 126, 234, 0.4);
}

.submit-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  transform: none;
}

.error-message {
  padding: 12px 16px;
  background: #fee2e2;
  color: #dc2626;
  border-radius: 8px;
  font-size: 14px;
  margin-top: 20px;
  border-left: 4px solid #dc2626;
}

.toggle-text {
  text-align: center;
  margin-top: 20px;
  color: #666;
  font-size: 14px;
}

.toggle-btn {
  background: none;
  border: none;
  color: #667eea;
  font-weight: 600;
  cursor: pointer;
  padding: 0;
  font-size: 14px;
}

.toggle-btn:hover {
  text-decoration: underline;
}

.session-info {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.session-info p {
  margin-bottom: 12px;
  color: #333;
  font-size: 14px;
}

.session-info strong {
  color: #555;
}

.token-display {
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px solid #e0e0e0;
}

.token {
  display: block;
  padding: 10px 12px;
  background: #f1f3f4;
  border-radius: 6px;
  font-size: 12px;
  color: #333;
  word-break: break-all;
  font-family: 'Courier New', monospace;
  max-height: 100px;
  overflow-y: auto;
}

.signout-btn {
  width: 100%;
  padding: 12px 20px;
  background: #dc2626;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.3s ease;
}

.signout-btn:hover {
  background: #b91c1c;
}

@media (max-width: 480px) {
  .auth-card, .session-card {
    padding: 25px;
  }
}
</style>
