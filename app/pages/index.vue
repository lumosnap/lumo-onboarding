<script setup lang="ts">
import { ref, computed } from 'vue'
import { createAuthClient } from 'better-auth/vue'
import BackgroundOrbs from '~/components/onboarding/BackgroundOrbs.vue'
import OnboardingHeader from '~/components/onboarding/OnboardingHeader.vue'
import VisualsDisplay from '~/components/onboarding/VisualsDisplay.vue'
import StepForms from '~/components/onboarding/StepForms.vue'

const authClient = createAuthClient({
  baseURL: `${useRuntimeConfig().public.apiBaseUrl}/auth`
})

const session = authClient.useSession()

const step = ref(1)
const direction = ref(1)
const formData = ref({
  business: '',
  insta: ''
})

const isAuthenticated = computed(() => !!session.value?.data?.user)

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
        <VisualsDisplay :step="step" />
        <StepForms
          :step="step"
          :direction="direction"
          v-model:data="formData"
          :is-authenticated="isAuthenticated"
          @update:step="onStepUpdate"
        />
      </div>
    </main>
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
</style>
