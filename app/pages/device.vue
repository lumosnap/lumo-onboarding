<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { createAuthClient } from 'better-auth/vue'
import { Loader2, ShieldCheck, ShieldX, KeyRound } from 'lucide-vue-next'
import BackgroundOrbs from '~/components/onboarding/BackgroundOrbs.vue'
import OnboardingHeader from '~/components/onboarding/OnboardingHeader.vue'
import VisualsDisplay from '~/components/onboarding/VisualsDisplay.vue'
import { normalizeUserCode, setPendingDeviceAuth } from '~/composables/usePendingDeviceAuth'

type ValidationState = 'idle' | 'validating' | 'valid' | 'invalid'
type ActionState = 'idle' | 'approving' | 'denying' | 'approved' | 'denied'

const route = useRoute()
const authClient = createAuthClient({
  baseURL: `${useRuntimeConfig().public.apiBaseUrl}/auth`
})
const session = authClient.useSession()

const userCode = ref('')
const validatedCode = ref('')
const validationState = ref<ValidationState>('idle')
const validationMessage = ref('')
const actionState = ref<ActionState>('idle')
const actionError = ref('')
const authCheckDone = ref(false)

const isAuthenticated = computed(() => !!session.value?.data?.user)
const pageStep = computed(() => {
  if (actionState.value === 'approved' || actionState.value === 'denied') return 4
  if (validationState.value === 'valid') return 3
  return 2
})

const canValidate = computed(() => validationState.value !== 'validating' && actionState.value !== 'approving' && actionState.value !== 'denying')
const canApproveOrDeny = computed(() => validationState.value === 'valid' && actionState.value === 'idle')

const normalize = (value: string) => normalizeUserCode(value)

const setInvalidState = (message = 'Invalid or expired code') => {
  validationState.value = 'invalid'
  validationMessage.value = message
  validatedCode.value = ''
}

const getCodeError = (value: string): string | null => {
  if (!value) return 'Enter your 8-character device code.'
  if (!/^[A-Z0-9]+$/.test(value)) return 'Code must contain only letters and numbers.'
  if (value.length !== 8) return 'Code must be exactly 8 characters.'
  return null
}

const hydrateFromQuery = () => {
  const fromQuery = route.query.user_code
  const raw = Array.isArray(fromQuery) ? fromQuery[0] : fromQuery
  userCode.value = normalize(typeof raw === 'string' ? raw : '')
}

const maybeRedirectForLogin = async () => {
  const pendingFlag = session.value as any
  if (!pendingFlag) return
  if (pendingFlag?.isPending === true || pendingFlag?.isLoading === true) return

  if (!isAuthenticated.value) {
    setPendingDeviceAuth(userCode.value || null)
    authCheckDone.value = true
    await navigateTo('/')
    return
  }

  authCheckDone.value = true
  if (userCode.value) {
    await validateCode()
  }
}

const validateCode = async () => {
  const normalizedCode = normalize(userCode.value)
  userCode.value = normalizedCode
  actionError.value = ''

  const codeError = getCodeError(normalizedCode)
  if (codeError) {
    setInvalidState(codeError)
    return
  }

  validationState.value = 'validating'
  validationMessage.value = ''

  try {
    const response = await fetch(
      `${useRuntimeConfig().public.apiBaseUrl}/api/auth/device?user_code=${encodeURIComponent(normalizedCode)}`,
      { method: 'GET' }
    )
    const payload = await response.json().catch(() => null)
    const hasErrorPayload = !!payload?.error || payload?.success === false

    if (!response.ok || hasErrorPayload) {
      setInvalidState('Invalid or expired code')
      return
    }

    validationState.value = 'valid'
    validationMessage.value = 'Code verified. Choose to approve or deny this device.'
    validatedCode.value = normalizedCode
  } catch {
    setInvalidState('Unable to validate the code. Please try again.')
  }
}

const onCodeInput = () => {
  userCode.value = normalize(userCode.value)
  actionError.value = ''
  if (validationState.value !== 'idle') {
    validationState.value = 'idle'
    validationMessage.value = ''
    validatedCode.value = ''
  }
  if (actionState.value === 'approved' || actionState.value === 'denied') {
    actionState.value = 'idle'
  }
}

const performDecision = async (decision: 'approve' | 'deny') => {
  if (!canApproveOrDeny.value || !validatedCode.value) return

  actionError.value = ''
  actionState.value = decision === 'approve' ? 'approving' : 'denying'

  try {
    const response = await fetch(`${useRuntimeConfig().public.apiBaseUrl}/api/auth/device/${decision}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ userCode: validatedCode.value })
    })

    if (response.status === 401 || response.status === 403) {
      setPendingDeviceAuth(validatedCode.value)
      await navigateTo('/')
      return
    }

    const payload = await response.json().catch(() => null)
    const hasErrorPayload = !!payload?.error || payload?.success === false
    if (!response.ok || hasErrorPayload) {
      actionState.value = 'idle'
      actionError.value = 'Unable to complete this request. Please try again.'
      return
    }

    actionState.value = decision === 'approve' ? 'approved' : 'denied'
  } catch {
    actionState.value = 'idle'
    actionError.value = 'Network error while sending your decision.'
  }
}

watch(
  () => session.value,
  async () => {
    if (authCheckDone.value) return
    await maybeRedirectForLogin()
  },
  { immediate: true, deep: true }
)

watch(
  () => route.query.user_code,
  () => {
    hydrateFromQuery()
    if (!authCheckDone.value || !isAuthenticated.value) return
    if (userCode.value) {
      validateCode()
    }
  },
  { immediate: true }
)
</script>

<template>
  <div id="device-page" :class="`step-${pageStep}`">
    <BackgroundOrbs :step="pageStep" />
    <OnboardingHeader :step="pageStep" />

    <main>
      <div class="content-container">
        <VisualsDisplay :step="pageStep" />

        <section class="forms-col">
          <div class="label-sm c-violet">
            <KeyRound :size="14" /> Device Authentication
          </div>
          <h1>Verify this device</h1>
          <p class="subtitle">Enter the code shown on your device to approve or deny access.</p>

          <div class="device-card">
            <label class="code-label" for="device-code">User Code</label>
            <input
              id="device-code"
              v-model="userCode"
              type="text"
              maxlength="8"
              autocomplete="off"
              placeholder="ABCD1234"
              class="input-lg code-input"
              @input="onCodeInput"
              @keyup.enter="validateCode"
            >

            <div class="status-row" v-if="validationState !== 'idle' || validationMessage">
              <span class="status" :class="validationState">{{ validationMessage }}</span>
            </div>

            <button class="btn-black action-btn" :disabled="!canValidate" @click="validateCode">
              <Loader2 v-if="validationState === 'validating'" :size="16" class="spin" />
              <span>{{ validationState === 'validating' ? 'Validating...' : 'Validate code' }}</span>
            </button>

            <div v-if="canApproveOrDeny" class="decision-row">
              <button class="btn-approve" @click="performDecision('approve')" :disabled="actionState !== 'idle'">
                <ShieldCheck :size="16" />
                Approve
              </button>
              <button class="btn-deny" @click="performDecision('deny')" :disabled="actionState !== 'idle'">
                <ShieldX :size="16" />
                Deny
              </button>
            </div>

            <p v-if="actionError" class="action-error">{{ actionError }}</p>

            <div v-if="actionState === 'approved'" class="result success">
              <strong>Device approved.</strong> You can close this tab now.
            </div>
            <div v-if="actionState === 'denied'" class="result denied">
              <strong>Request denied.</strong> You can close this tab now.
            </div>
          </div>
        </section>
      </div>
    </main>
  </div>
</template>

<style scoped>
#device-page {
  min-height: 100vh;
  width: 100%;
  position: relative;
  display: flex;
  flex-direction: column;
  transition: background-color 1s cubic-bezier(0.16, 1, 0.3, 1);
}

#device-page.step-2 {
  background-color: var(--violet-50);
}

#device-page.step-3 {
  background-color: var(--fuchsia-50);
}

#device-page.step-4 {
  background-color: var(--indigo-50);
}

main {
  flex-grow: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  padding: 0 1.5rem;
  z-index: 10;
}

.content-container {
  width: 100%;
  max-width: 64rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3rem;
  position: relative;
}

@media (min-width: 768px) {
  .content-container {
    flex-direction: row;
    gap: 8rem;
    justify-content: center;
  }
}

.forms-col {
  width: 100%;
  max-width: 30rem;
  position: relative;
  min-height: 420px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.device-card {
  width: 100%;
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(8px);
  border: 1px solid white;
  border-radius: 1.25rem;
  padding: 1.5rem;
  box-shadow: 0 20px 25px -5px rgba(224, 231, 255, 0.45);
}

.code-label {
  display: block;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--zinc-500);
}

.code-input {
  text-transform: uppercase;
  letter-spacing: 0.1em;
  font-size: 2rem;
  margin-top: 0.35rem;
}

.status-row {
  margin: 0.5rem 0 1rem;
}

.status {
  font-size: 0.875rem;
  font-weight: 600;
}

.status.valid {
  color: #059669;
}

.status.invalid {
  color: #dc2626;
}

.status.validating {
  color: var(--zinc-500);
}

.action-btn {
  width: 100%;
  justify-content: center;
}

.action-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.decision-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
  margin-top: 1rem;
}

.btn-approve,
.btn-deny {
  border: none;
  border-radius: 0.85rem;
  font-size: 0.95rem;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.45rem;
  padding: 0.85rem 1rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-approve {
  background: #059669;
  color: white;
}

.btn-approve:hover {
  background: #047857;
}

.btn-deny {
  background: #dc2626;
  color: white;
}

.btn-deny:hover {
  background: #b91c1c;
}

.btn-approve:disabled,
.btn-deny:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.action-error {
  margin-top: 0.9rem;
  color: #b91c1c;
  font-size: 0.875rem;
  font-weight: 600;
}

.result {
  margin-top: 1rem;
  border-radius: 0.85rem;
  padding: 0.9rem 1rem;
  font-size: 0.9rem;
  border: 1px solid;
}

.result.success {
  color: #065f46;
  background: #ecfdf5;
  border-color: #a7f3d0;
}

.result.denied {
  color: #7f1d1d;
  background: #fef2f2;
  border-color: #fecaca;
}
</style>
