<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
    step: number
}>()

const stepClass = computed(() => `step-${props.step}`)
</script>

<template>
    <div class="orb-layer" :class="stepClass">
        <div class="orb orb-1"></div>
        <div class="orb orb-2"></div>
    </div>
</template>

<style scoped>
/* Dynamic Background Orbs */
.orb-layer {
    position: absolute;
    inset: 0;
    overflow: hidden;
    pointer-events: none;
    z-index: 0;
}

.orb {
    position: absolute;
    border-radius: 50%;
    filter: blur(100px);
    opacity: 0.4;
    transition: all 1s cubic-bezier(0.16, 1, 0.3, 1);
}

.orb-1 {
    top: -20%;
    right: -10%;
    width: 70vw;
    height: 70vw;
}

.orb-2 {
    bottom: -10%;
    left: -10%;
    width: 60vw;
    height: 60vw;
    transition-delay: 0.1s;
}

/* Orb Transformations per Step - Using parent class to drive it, but here we can use local classes toggled by prop logic if needed. 
   However, the original CSS relied on #app.step-X .orb-1. 
   To encapsulate, we can bind specific styles or classes to the orbs themselves based on step. 
*/

/* 
   We will move the logic from global #app.step-X to local classes here.
   Let's accept that the wrapper div has the "step-X" class and we style .orb based on that nesting.
*/

.step-1 .orb-1 {
    background-color: #93c5fd;
    transform: translate(0, 0) scale(1);
}

.step-1 .orb-2 {
    background-color: #a5f3fc;
}

.step-2 .orb-1 {
    background-color: #c4b5fd;
    transform: translate(0, 40px) scale(1.1);
}

.step-2 .orb-2 {
    background-color: #e9d5ff;
}

.step-3 .orb-1 {
    background-color: #f0abfc;
    transform: translate(0, -40px) scale(0.9);
}

.step-3 .orb-2 {
    background-color: #fecdd3;
}

.step-4 .orb-1 {
    background-color: #a5b4fc;
    transform: translate(0, 0) scale(1);
}

.step-4 .orb-2 {
    background-color: #bfdbfe;
}
</style>
