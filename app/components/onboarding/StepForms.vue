<script setup lang="ts">
import { ref, watch, computed, nextTick, onMounted } from 'vue'
import { ChevronLeft, Loader2, Check, ArrowRight, Instagram, Monitor, Laptop } from 'lucide-vue-next'
import { createAuthClient } from "better-auth/vue"

// useRoute is auto-imported in Nuxt 4
const route = useRoute()

const props = defineProps<{
    step: number
    direction: number
    data: { business: string; insta: string }
}>()

const emit = defineEmits<{
    (e: 'update:step', step: number): void
    (e: 'update:data', data: { business: string; insta: string }): void
    (e: 'reset'): void
}>()

const localData = computed({
    get: () => props.data,
    set: (val) => emit('update:data', val)
})

const isLoading = ref(false)
const dlLoading = ref(false)
const error = ref('')

// Better Auth client
const authClient = createAuthClient({
    baseURL: useRuntimeConfig().public.authBaseUrl
})

// Reactive state
const isSignUp = ref(false)
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
    if (callbackUrl.value) {
        redirectToCallback()
    } else {
        // Continue to next step in onboarding
        emit('update:step', 2)
    }
}

// Toggle between sign in and sign up
const toggleMode = () => {
    isSignUp.value = !isSignUp.value
    error.value = ''
    formData.value = { name: '', email: '', password: '' }
}

// Handle email/password sign in or sign up
const handleSubmit = async () => {
    try {
        isLoading.value = true
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
                    isLoading.value = false
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
                    isLoading.value = false
                }
            })
        }
    } catch (err: any) {
        error.value = err.message || (isSignUp.value ? 'Sign up failed' : 'Sign in failed')
        isLoading.value = false
    }
}

// Handle sign out
const handleSignOut = async () => {
    try {
        isLoading.value = true
        await authClient.signOut()
        isLoading.value = false
    } catch (err: any) {
        error.value = err.message || 'Sign out failed'
        isLoading.value = false
    }
}

// Refs for inputs
const businessInput = ref<HTMLInputElement | null>(null)
const instaInput = ref<HTMLInputElement | null>(null)

// Watch step changes to auto-focus
watch(() => props.step, async (newStep) => {
    await nextTick()
    if (newStep === 2) {
        businessInput.value?.focus()
    } else if (newStep === 3) {
        instaInput.value?.focus()
    }
})

onMounted(async () => {
    await nextTick()
    if (props.step === 2) {
        businessInput.value?.focus()
    } else if (props.step === 3) {
        instaInput.value?.focus()
    }

    // If user is already authenticated and callback URL exists, redirect
    if (session.value?.data && callbackUrl.value) {
        await redirectToCallback()
    } else if (session.value?.data && props.step === 1) {
        // If already logged in and on step 1, move to step 2
        emit('update:step', 2)
    }
})

// Watch for session changes (for OAuth callback handling)
watch(() => session.value?.data, (newData) => {
    if (newData && newData.session?.token && newData.user) {
        console.log('Session detected after OAuth callback')
        if (callbackUrl.value) {
            setTimeout(() => {
                redirectToCallback()
            }, 500)
        } else if (props.step === 1) {
            emit('update:step', 2)
        }
    }
}, { immediate: true })

// Validation
const isBusinessValid = computed(() => localData.value.business.length > 2)
const isInstaValid = computed(() => localData.value.insta.length > 1)

// Actions
const startGoogle = async () => {
    try {
        isLoading.value = true
        error.value = ''

        await authClient.signIn.social({
            provider: 'google',
            callbackURL: callbackUrl.value ? '/' : undefined // This logic might need adjustment based on how callbackUrl is structured
        })

        // Note: OAuth redirect will handle the callback
        // The handleAuthSuccess or watch session will be called after redirect back
    } catch (err: any) {
        error.value = err.message || 'Google sign in failed'
        isLoading.value = false
    }
}

const next = () => {
    emit('update:step', props.step + 1)
}

const download = () => {
    if (dlLoading.value) return
    dlLoading.value = true
    setTimeout(() => {
        dlLoading.value = false
        alert("Onboarding Complete! Resetting demo.")
        emit('reset')
    }, 2000)
}

// Enter key handlers
const onBusinessEnter = () => {
    if (isBusinessValid.value) next()
}

const onInstaEnter = () => {
    if (isInstaValid.value) next()
}
</script>

<template>
    <div class="forms-col">

        <!-- Step 1 Form -->
        <div class="step-container"
            :class="{ active: step === 1, 'animate-in-up': step === 1 && direction > 0, 'animate-in-down': step === 1 && direction < 0 }">
            <div class="badge">
                <span class="dot"></span> v2.0 Beta
            </div>
            <h1>Deliver your <br> <span class="gradient-text">masterpiece.</span></h1>
            <p class="subtitle">The premium tool for creators to curate, package, and wow clients with zero friction.
            </p>

            <button class="btn-google" @click="startGoogle" :disabled="isLoading">
                <div v-if="isLoading" class="loader-overlay">
                    <span class="spin">
                        <Loader2 :size="20" />
                    </span>
                </div>
                <span class="content" :style="{ visibility: isLoading ? 'hidden' : 'visible' }"
                    style="display:flex; align-items:center; gap:0.5rem">
                    <svg width="20" height="20" viewBox="0 0 24 24">
                        <path
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                            fill="#4285F4" />
                        <path
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                            fill="#34A853" />
                        <path
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                            fill="#FBBC05" />
                        <path
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                            fill="#EA4335" />
                    </svg>
                    Continue with Google
                </span>
            </button>

            <div
                style="display:flex; gap:1.5rem; margin-top:1rem; font-size:0.75rem; color:var(--zinc-400); font-weight:500">
                <span style="display:flex; align-items:center; gap:4px">
                    <Check :size="12" class="c-green" /> Free for 14 days
                </span>
                <span style="display:flex; align-items:center; gap:4px">
                    <Check :size="12" class="c-green" /> No credit card
                </span>
            </div>
        </div>

        <!-- Step 2 Form -->
        <div class="step-container"
            :class="{ active: step === 2, 'animate-in-up': step === 2 && direction > 0, 'animate-in-down': step === 2 && direction < 0 }">
            <div class="label-sm c-violet">
                <Zap :size="14" /> Studio Details
            </div>
            <h2 style="font-size:1.875rem; font-weight:700; color:var(--zinc-800); margin-bottom:2rem">What's your brand
                called?</h2>

            <input type="text" ref="businessInput" v-model="localData.business" placeholder="e.g. Lumo Photography"
                class="input-lg" @keypress.enter="onBusinessEnter">

            <div class="next-wrap" :class="{ visible: isBusinessValid }">
                <button class="btn-black" @click="next">
                    Continue
                    <ArrowRight :size="16" />
                </button>
            </div>
        </div>

        <!-- Step 3 Form -->
        <div class="step-container"
            :class="{ active: step === 3, 'animate-in-up': step === 3 && direction > 0, 'animate-in-down': step === 3 && direction < 0 }">
            <div class="label-sm c-pink">
                <Instagram :size="14" /> Social Presence
            </div>
            <h2 style="font-size:1.875rem; font-weight:700; color:var(--zinc-800); margin-bottom:2rem">What is your
                Instagram ID</h2>

            <div class="insta-wrap">
                <span class="at-sign">@</span>
                <input type="text" ref="instaInput" v-model="localData.insta" placeholder="username" class="input-lg"
                    style="margin-bottom: 0; padding-bottom: 1rem; border-bottom: 2px solid var(--zinc-200); margin-left: -2px; width: 100%;"
                    @keypress.enter="onInstaEnter">
            </div>
            <!-- Inline style override for focus color handled in CSS by specific class selections if possible, or we rely on the main.css .insta-wrap styles -->

            <div class="next-wrap" :class="{ visible: isInstaValid }">
                <button class="btn-black" @click="next">
                    Finish Setup
                    <ArrowRight :size="16" />
                </button>
            </div>
        </div>

        <!-- Step 4 Form -->
        <div class="step-container"
            :class="{ active: step === 4, 'animate-in-up': step === 4 && direction > 0, 'animate-in-down': step === 4 && direction < 0 }">
            <div
                style="width:3.5rem; height:3.5rem; background:var(--indigo-100); color:var(--indigo-600); border-radius:1rem; display:flex; align-items:center; justify-content:center; margin-bottom:1.5rem">
                <Check :size="28" :stroke-width="3" />
            </div>
            <h2 style="font-size:2.5rem; font-weight:700; color:var(--zinc-900); margin-bottom:0.5rem">Ready for launch.
            </h2>
            <p class="subtitle">Your workspace for <strong style="color:var(--zinc-900)">{{ localData.business || `your
                    brand` }}</strong> has been provisioned.</p>

            <div class="dl-card">
                <div class="dl-header">
                    <span
                        style="font-size:0.75rem; font-weight:700; color:var(--zinc-400); text-transform:uppercase">System
                        Check</span>
                    <span class="tag-opt">
                        <Check :size="10" /> Optimized
                    </span>
                </div>
                <p class="dl-meta">Running natively on <strong style="color:var(--zinc-900)">Apple Silicon</strong> for
                    maximum color accuracy.</p>

                <button class="btn-dl" :class="{ loading: dlLoading }" @click="download">
                    <div class="loading-bar"></div>
                    <Monitor :size="20" /> Download <span style="font-weight:400; opacity:0.7">for macOS</span>
                </button>
            </div>

            <div style="width:100%; text-align:center">
                <a href="#"
                    style="text-decoration:none; color:var(--zinc-400); font-size:0.875rem; font-weight:500; display:inline-flex; align-items:center; gap:0.5rem">
                    <Laptop :size="14" /> Looking for Windows?
                </a>
            </div>
        </div>
    </div>
</template>

<style scoped>
.forms-col {
    width: 100%;
    max-width: 28rem;
    position: relative;
    min-height: 420px;
    display: flex;
    flex-direction: column;
    justify-content: center;
}

.back-btn {
    position: absolute;
    top: -3.5rem;
    left: -0.75rem;
    background: none;
    border: none;
    color: var(--zinc-400);
    font-weight: 600;
    font-size: 0.875rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 0.25rem;
    padding: 0.5rem;
    border-radius: 0.5rem;
    transition: all 0.3s;
}

.back-btn:hover {
    color: var(--zinc-800);
    background: rgba(0, 0, 0, 0.05);
}

.back-btn.hidden {
    opacity: 0;
    pointer-events: none;
    transform: translateY(0.5rem);
}

.step-container {
    display: none;
    /* controlled by Vue/CSS toggle */
    width: 100%;
    flex-direction: column;
    align-items: flex-start;
}

.step-container.active {
    display: flex;
}

/* Animation Classes for Form Steps */
.animate-in-up {
    animation: slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

.animate-in-down {
    animation: slideDown 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

.loader-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
}
</style>
