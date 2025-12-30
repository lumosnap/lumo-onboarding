<script setup lang="ts">
import { computed } from 'vue'
import { Aperture, Image as ImageIcon, Layout, Zap, Monitor, Download } from 'lucide-vue-next'

const props = defineProps<{
    step: number
}>()

// Active state helpers
const isActive = (s: number) => props.step === s
</script>

<template>
    <div class="visuals-col">
        <div class="glass-frame">
            <!-- Step 1: Lens -->
            <div class="visual-item v-step-1" :class="{ active: isActive(1) }" id="v-1">
                <div class="lens-assembly">
                    <div class="lens-glow"></div>
                    <div class="lens-ring">
                        <div class="spinner"></div>
                        <div class="core">
                            <Aperture :size="40" />
                        </div>
                    </div>
                    <div class="float-card fc-1">
                        <ImageIcon />
                    </div>
                    <div class="float-card fc-2">
                        <Layout />
                    </div>
                </div>
            </div>

            <!-- Step 2: ID Card -->
            <div class="visual-item v-step-2" :class="{ active: isActive(2) }" id="v-2">
                <div class="id-card">
                    <div class="card-strip"></div>
                    <div class="card-row">
                        <div class="avatar-ph">
                            <Zap :size="20" />
                        </div>
                        <div style="flex:1">
                            <div class="skel-line" style="width: 50%; margin-bottom: 4px; background: var(--zinc-200)">
                            </div>
                            <div class="skel-line" style="width: 30%"></div>
                        </div>
                    </div>
                    <div style="margin-top: auto">
                        <div class="skel-line" style="width: 100%; margin-bottom: 6px"></div>
                        <div class="skel-line" style="width: 75%"></div>
                    </div>
                </div>
            </div>

            <!-- Step 3: Social -->
            <div class="visual-item v-step-3" :class="{ active: isActive(3) }" id="v-3">
                <div class="phone-mockup">
                    <div class="profile-ring">
                        <div class="profile-fill"></div>
                    </div>
                    <div class="grid-mock">
                        <div class="grid-item" v-for="n in 6" :key="n"></div>
                    </div>
                </div>
            </div>

            <!-- Step 4: Download -->
            <div class="visual-item v-step-4" :class="{ active: isActive(4) }" id="v-4">
                <div class="monitor-stack">
                    <Monitor :size="100" stroke-width="1" />
                    <div class="mon-badge">
                        <Download />
                    </div>
                    <div class="mon-glow"></div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
/* --- Visual Illustrations (Left Col) --- */
.visuals-col {
    display: none;
    flex: 1;
    height: 400px;
    align-items: center;
    justify-content: center;
    position: relative;
}

@media (min-width: 768px) {
    .visuals-col {
        display: flex;
    }
}

.glass-frame {
    position: absolute;
    inset: 1rem;
    background: rgba(255, 255, 255, 0.4);
    backdrop-filter: blur(12px);
    border-radius: 3rem;
    border: 1px solid rgba(255, 255, 255, 0.6);
    box-shadow: 0 25px 50px -12px rgba(224, 231, 255, 0.4);
    transition: all 0.5s;
}

.visual-item {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.7s cubic-bezier(0.16, 1, 0.3, 1);
    opacity: 0;
    pointer-events: none;
}

.visual-item.active {
    opacity: 1;
    pointer-events: auto;
}

/* Step 1 Visual: Lens */
.v-step-1 {
    transform: scale(0.75) rotate(12deg);
}

.v-step-1.active {
    transform: scale(1) rotate(0deg);
}

.lens-assembly {
    position: relative;
    width: 8rem;
    height: 8rem;
}

.lens-glow {
    position: absolute;
    inset: 0;
    background: rgba(167, 139, 250, 0.2);
    filter: blur(20px);
    border-radius: 50%;
}

.lens-ring {
    position: absolute;
    inset: 0;
    border: 6px solid rgba(255, 255, 255, 0.8);
    border-radius: 50%;
    background: linear-gradient(135deg, var(--violet-50), white);
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
    display: flex;
    align-items: center;
    justify-content: center;
}

.spinner {
    position: absolute;
    inset: 0;
    border: 2px solid rgba(221, 214, 254, 0.5);
    border-radius: 50%;
    border-top-color: transparent;
    animation: spin 12s linear infinite;
}

.core {
    width: 5rem;
    height: 5rem;
    background: linear-gradient(45deg, var(--violet-600), var(--indigo-600));
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.2);
}

.float-card {
    position: absolute;
    background: rgba(255, 255, 255, 0.9);
    backdrop-filter: blur(4px);
    border: 1px solid white;
    border-radius: 0.75rem;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    animation: float 3s ease-in-out infinite;
}

.fc-1 {
    top: -2rem;
    right: -2rem;
    width: 3.5rem;
    height: 5rem;
    transform: rotate(12deg);
    color: var(--violet-400);
}

.fc-2 {
    bottom: -1.5rem;
    left: -2rem;
    width: 4rem;
    height: 3rem;
    transform: rotate(-6deg);
    color: var(--indigo-400);
    animation-delay: 1.5s;
}

/* Step 2 Visual: Card */
.v-step-2 {
    transform: scale(0.75) translateX(3rem);
}

.v-step-2.active {
    transform: scale(1) translateX(0);
}

.id-card {
    width: 12rem;
    height: 8rem;
    background: rgba(255, 255, 255, 0.9);
    backdrop-filter: blur(8px);
    border-radius: 1rem;
    border: 1px solid white;
    box-shadow: 0 20px 25px -5px rgba(167, 139, 250, 0.5);
    display: flex;
    flex-direction: column;
    padding: 1.25rem;
    position: relative;
    overflow: hidden;
    transition: transform 0.5s;
}

.id-card:hover {
    transform: translateY(-5px);
}

.card-strip {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 6px;
    background: linear-gradient(to right, var(--violet-500), var(--pink-500));
}

.card-row {
    display: flex;
    gap: 0.75rem;
    align-items: center;
    margin-bottom: 1rem;
    margin-top: 0.5rem;
}

.avatar-ph {
    width: 2.5rem;
    height: 2.5rem;
    background: var(--violet-50);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--violet-600);
}

.skel-line {
    background: var(--zinc-100);
    border-radius: 99px;
    height: 0.5rem;
}

/* Step 3 Visual: Social */
.v-step-3 {
    transform: scale(0.75);
    opacity: 0;
}

.v-step-3.active {
    transform: scale(1);
    opacity: 1;
}

.phone-mockup {
    width: 9rem;
    height: 13rem;
    background: rgba(255, 255, 255, 0.9);
    backdrop-filter: blur(8px);
    border-radius: 2rem;
    border: 4px solid white;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.1);
    display: flex;
    flex-direction: column;
    align-items: center;
    padding-top: 2rem;
    overflow: hidden;
}

.profile-ring {
    width: 3.5rem;
    height: 3.5rem;
    border-radius: 50%;
    padding: 3px;
    border: 2px solid #fce7f3;
    margin-bottom: 1rem;
}

.profile-fill {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    background: linear-gradient(to top right, #fdba74, #ec4899);
}

.grid-mock {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1px;
    width: 100%;
    background: var(--zinc-100);
    margin-top: auto;
}

.grid-item {
    aspect-ratio: 1;
    background: white;
}

/* Step 4 Visual: Download */
.v-step-4 {
    transform: scale(0.75);
}

.v-step-4.active {
    transform: scale(1);
}

.monitor-stack {
    position: relative;
    color: rgba(161, 161, 170, 0.8);
}

.mon-badge {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 3.5rem;
    height: 2.5rem;
    background: var(--indigo-600);
    border-radius: 0.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    box-shadow: 0 10px 15px -3px rgba(79, 70, 229, 0.4);
    z-index: 10;
}

.mon-glow {
    position: absolute;
    bottom: -2rem;
    left: 50%;
    transform: translateX(-50%);
    width: 8rem;
    height: 1.5rem;
    background: #6366f1;
    filter: blur(24px);
    opacity: 0.3;
}
</style>
