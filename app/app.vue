<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import BackgroundOrbs from '~/components/onboarding/BackgroundOrbs.vue'
import OnboardingHeader from '~/components/onboarding/OnboardingHeader.vue'
import VisualsDisplay from '~/components/onboarding/VisualsDisplay.vue'
import StepForms from '~/components/onboarding/StepForms.vue'

// --- State ---
const STORAGE_KEY = "lumosnap_state_v2"
const step = ref(1)
const direction = ref(1)
const formData = ref({
  business: '',
  insta: ''
})

// --- Persistence ---
onMounted(() => {
  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved) {
    try {
      const parsed = JSON.parse(saved)
      step.value = parsed.step || 1
      direction.value = parsed.direction || 1
      if (parsed.data) {
        formData.value = { ...formData.value, ...parsed.data }
      }
    } catch (e) {
      localStorage.removeItem(STORAGE_KEY)
    }
  }
})

watch([step, formData], () => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    step: step.value,
    direction: direction.value,
    data: formData.value
  }))
}, { deep: true })

// --- Actions ---
const onStepUpdate = (newStep: number) => {
  if (newStep === step.value) return
  direction.value = newStep > step.value ? 1 : -1
  step.value = newStep
}

const onReset = () => {
  localStorage.removeItem(STORAGE_KEY)
  step.value = 1
  direction.value = 1
  formData.value = { business: '', insta: '' }
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
        <StepForms :step="step" :direction="direction" v-model:data="formData" @update:step="onStepUpdate"
          @reset="onReset" />
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
