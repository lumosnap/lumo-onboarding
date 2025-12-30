<script setup lang="ts">
import { Aperture } from 'lucide-vue-next'

defineProps<{
    step: number
}>()
</script>

<template>
    <header>
        <div class="logo-group">
            <div class="logo-icon">
                <Aperture :size="20" />
            </div>
            <span class="logo-text">LumoSnap</span>
        </div>

        <div class="progress-bar">
            <div class="bar" :class="{ active: step === 1, completed: step > 1 }"></div>
            <div class="bar" :class="{ active: step === 2, completed: step > 2 }"></div>
            <div class="bar" :class="{ active: step === 3, completed: step > 3 }"></div>
            <div class="bar" :class="{ active: step === 4, completed: step > 4 }"></div>
        </div>
    </header>
</template>

<style scoped>
header {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    padding: 1.5rem 1.5rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    z-index: 50;
}

@media(min-width: 768px) {
    header {
        padding: 1.5rem 3rem;
    }
}

.logo-group {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    cursor: pointer;
    transition: opacity 0.3s;
}

.logo-group:hover {
    opacity: 0.7;
}

.logo-icon {
    width: 2.5rem;
    height: 2.5rem;
    background: linear-gradient(135deg, var(--violet-600), var(--indigo-700));
    border-radius: 0.75rem;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    box-shadow: 0 10px 25px -5px rgba(167, 139, 250, 0.5);
}

.logo-text {
    font-size: 1.25rem;
    font-weight: 700;
    letter-spacing: -0.025em;
    color: var(--zinc-800);
}

.progress-bar {
    display: flex;
    gap: 0.5rem;
}

.bar {
    height: 0.5rem;
    border-radius: 9999px;
    background-color: var(--zinc-200);
    width: 0.5rem;
    transition: all 0.7s cubic-bezier(0.16, 1, 0.3, 1);
}

.bar.active {
    width: 2.5rem;
    background-color: var(--zinc-900);
}

.bar.completed {
    width: 0.5rem;
    background-color: var(--violet-400);
}
</style>
