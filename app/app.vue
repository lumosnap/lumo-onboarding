<script setup lang="ts">
import { ref, computed } from 'vue'
import BackgroundOrbs from '~/components/onboarding/BackgroundOrbs.vue'
import OnboardingHeader from '~/components/onboarding/OnboardingHeader.vue'
import VisualsDisplay from '~/components/onboarding/VisualsDisplay.vue'
import StepForms from '~/components/onboarding/StepForms.vue'
import { createAuthClient } from "better-auth/vue"

// --- Better Auth client ---
const authClient = createAuthClient({
    baseURL: `${useRuntimeConfig().public.apiBaseUrl}/auth`
})

// Get session data
const session = authClient.useSession()

// --- State ---
const step = ref(1)
const direction = ref(1)
const formData = ref({
  business: '',
  insta: ''
})

// Authentication status
const isAuthenticated = computed(() => !!session.value?.data?.user)

// --- Actions ---
const onStepUpdate = (newStep: number) => {
  if (newStep === step.value) return
  direction.value = newStep > step.value ? 1 : -1
  step.value = newStep
}


</script>

<template>
  <div id="app" :class="`step-${step}`">
    <BackgroundOrbs :step="step" />
    <OnboardingHeader :step="step" />

    <main>
      <div class="content-container">
        <!-- Left: Visuals -->
        <VisualsDisplay :step="step" />

        <!-- Right: Forms -->
        <StepForms :step="step" :direction="direction" v-model:data="formData" :is-authenticated="isAuthenticated" @update:step="onStepUpdate" />
      </div>
    </main>

    <footer>
      <!-- <p><span style="opacity:0.6">Trusted by creators at</span> <strong style="color:var(--zinc-800)">Linear</strong>,
        <strong style="color:var(--zinc-800)">Vercel</strong>, & <strong style="color:var(--zinc-800)">Airbnb</strong>.
      </p> -->
    </footer>
  </div>
</template>

<style scoped>
#app {
  min-height: 100vh;
  width: 100%;
  position: relative;
  display: flex;
  flex-direction: column;
  transition: background-color 1s cubic-bezier(0.16, 1, 0.3, 1);
}

/* Dynamic Background Colors based on State */
#app.step-1 {
  background-color: var(--blue-50);
}

#app.step-2 {
  background-color: var(--violet-50);
}

#app.step-3 {
  background-color: var(--fuchsia-50);
}

#app.step-4 {
  background-color: var(--indigo-50);
}

/* --- Main Layout --- */
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

/* Footer */
footer {
  position: absolute;
  bottom: 1.5rem;
  width: 100%;
  text-align: center;
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--zinc-500);
  pointer-events: none;
}
</style>
