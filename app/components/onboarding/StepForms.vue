<script setup lang="ts">
import { ref, watch, computed, nextTick, onMounted } from 'vue'
import { Loader2, Check, ArrowRight, Instagram, Monitor, Laptop, Zap, Apple, X, Download, Copy, ExternalLink } from 'lucide-vue-next'
import { createAuthClient } from "better-auth/vue"

// useRoute is auto-imported in Nuxt 4
const route = useRoute()
// Route is auto-imported in Nuxt 4

const props = defineProps<{
    step: number
    direction: number
    data: { business: string; insta: string }
    isAuthenticated: boolean
}>()

const emit = defineEmits<{
    (e: 'update:step', step: number): void
    (e: 'update:data', data: { business: string; insta: string }): void
}>()

const localData = computed({
    get: () => props.data,
    set: (val) => emit('update:data', val)
})

const isLoading = ref(false)
const dlLoading = ref(false)
const isProfileCompleted = ref(false)
const isProfileLoading = ref(false)

// Modal states
const showPlatformsModal = ref(false)
const copiedChecksum = ref<string | null>(null)

// OS Detection
type OSType = 'macos' | 'windows' | 'linux' | 'unknown'

const detectedOS = ref<OSType>('unknown')

const detectOS = (): OSType => {
    if (typeof window === 'undefined') return 'unknown'
    
    const userAgent = window.navigator.userAgent.toLowerCase()
    const platform = window.navigator.platform?.toLowerCase() || ''
    
    if (platform.includes('mac') || userAgent.includes('mac')) {
        return 'macos'
    } else if (platform.includes('win') || userAgent.includes('win')) {
        return 'windows'
    } else if (platform.includes('linux') || userAgent.includes('linux')) {
        return 'linux'
    }
    
    return 'unknown'
}

// Download packages configuration
const RELEASE_VERSION = 'v0.1.3-alpha'
const RELEASE_BASE_URL = 'https://github.com/lumosnap/lumo-desktop/releases/download'

const releaseVersion = ref(RELEASE_VERSION)

interface DownloadPackage {
    name: string
    filename: string
    url: string
    size: string
    checksum: string
    os: OSType
    isPrimary?: boolean
}

const downloadPackages = ref<DownloadPackage[]>([
    // macOS
    {
        name: 'macOS (DMG)',
        filename: 'lumosnap-0.1.1-alpha.dmg',
        url: `${RELEASE_BASE_URL}/${RELEASE_VERSION}/lumosnap-0.1.1-alpha.dmg`,
        size: '127 MB',
        checksum: 'sha256:85173fffba4c2e82b5630790c4defe9a9193d73ce2daaf781a375e88f6d01786',
        os: 'macos',
        isPrimary: true
    },
    // Windows
    {
        name: 'Windows (Installer)',
        filename: 'lumosnap-0.1.1-alpha-setup.exe',
        url: `${RELEASE_BASE_URL}/${RELEASE_VERSION}/lumosnap-0.1.1-alpha-setup.exe`,
        size: '109 MB',
        checksum: 'sha256:bec6627a0f056d4ef112dc3528bc7b8f0b49334c64ec2f46d59523d013bd89f7',
        os: 'windows',
        isPrimary: true
    },
    // Linux - AppImage (primary)
    {
        name: 'Linux (AppImage)',
        filename: 'lumosnap-0.1.1-alpha.AppImage',
        url: `${RELEASE_BASE_URL}/${RELEASE_VERSION}/lumosnap-0.1.1-alpha.AppImage`,
        size: '147 MB',
        checksum: 'sha256:d1504e1dbd87ecaffd035dee1dfc45f01a9774050fc69dc1bd84041eee7f3406',
        os: 'linux',
        isPrimary: true
    }
])

function detectPlatform(filename: string): OSType {
    if (filename.endsWith('.dmg')) return 'macos'
    if (filename.endsWith('.exe')) return 'windows'
    if (filename.endsWith('.AppImage') || filename.endsWith('.deb') || filename.endsWith('.snap')) return 'linux'
    return 'unknown'
}

function formatBytes(bytes: number, decimals = 1): string {
    if (!+bytes) return '0 Bytes'
    const k = 1024
    const dm = decimals < 0 ? 0 : decimals
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
}

function getDownloadName(filename: string, os: OSType): string {
    if (os === 'macos') return 'macOS (DMG)'
    if (os === 'windows') return 'Windows (Installer)'
    if (filename.endsWith('.AppImage')) return 'Linux (AppImage)'
    if (filename.endsWith('.deb')) return 'Linux (DEB)'
    if (filename.endsWith('.snap')) return 'Linux (Snap)'
    return `Linux (${filename.split('.').pop()})`
}

function isPrimaryPackage(filename: string): boolean {
    return filename.endsWith('.dmg') || filename.endsWith('.exe') || filename.endsWith('.AppImage')
}

async function fetchChecksums(assets: any[]): Promise<Record<string, string>> {
    const checksums: Record<string, string> = {}
    const ymlFiles = ['latest.yml', 'latest-mac.yml', 'latest-linux.yml']
    
    // Find URL for each yml file
    const fetchPromises = ymlFiles.map(async (filename) => {
        const asset = assets.find((a: any) => a.name === filename)
        if (!asset) return

        try {
            const res = await fetch(asset.browser_download_url)
            if (!res.ok) return
            const text = await res.text()
            
            // Simple parsing for sha512: <hash>
            // We look for "sha512: <base64string>"
            // Or "  sha512: <base64string>" under a file entry
            
            // Matches: sha512: <hash> (globally or per file)
            // Ideally we map filename -> sha512.
            // Format example:
            // files:
            //   - url: <filename>
            //     sha512: <hash>
            
            const lines = text.split('\n')
            let currentFile = ''
            
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i].trim()
                if (line.startsWith('url:')) {
                    currentFile = line.replace('url:', '').trim()
                } else if (line.startsWith('- url:')) {
                    currentFile = line.replace('- url:', '').trim()
                } else if (line.startsWith('sha512:')) {
                    const hash = line.replace('sha512:', '').trim()
                    if (currentFile && hash) {
                        checksums[currentFile] = `sha512:${hash}`
                    }
                }
            }
        } catch (err) {
            console.error(`Failed to fetch checksums from ${filename}`, err)
        }
    })
    
    await Promise.all(fetchPromises)
    return checksums
}

async function getLatestRelease() {
    const CACHE_KEY = 'lumosnap_latest_release'
    const CACHE_TIME_KEY = 'lumosnap_latest_release_time'
    const CACHE_DURATION = 30 * 60 * 1000 // 30 minutes

    try {
        // Check cache first
        const cachedTime = localStorage.getItem(CACHE_TIME_KEY)
        if (cachedTime) {
            const age = Date.now() - parseInt(cachedTime, 10)
            if (age < CACHE_DURATION) {
                const cachedData = localStorage.getItem(CACHE_KEY)
                if (cachedData) {
                    const data = JSON.parse(cachedData)
                    downloadPackages.value = data.packages
                    releaseVersion.value = data.version
                    return
                }
            }
        }

        const response = await fetch('https://api.github.com/repos/lumosnap/lumo-desktop/releases/latest')
        if (!response.ok) throw new Error('Failed to fetch release')
        
        const release = await response.json()
        
        // Fetch checksums from YML files
        const checksums = await fetchChecksums(release.assets)

        const packages = release.assets
            .map((asset: any) => {
                const os = detectPlatform(asset.name)
                // Filter out blockmap files and unknown platforms
                if (os === 'unknown' || asset.name.endsWith('.blockmap') || asset.name.endsWith('.iso')) return null
                
                // Get checksum: prioritize digest from API (if available), then parsed YML
                let checksum = asset.digest || checksums[asset.name] || ''
                
                return {
                    name: getDownloadName(asset.name, os),
                    filename: asset.name,
                    url: asset.browser_download_url,
                    size: formatBytes(asset.size),
                    checksum: checksum,
                    os: os,
                    isPrimary: isPrimaryPackage(asset.name)
                }
            })
            .filter((p: any) => p !== null) as DownloadPackage[]
            
        // Sort packages to keep a consistent order (mac, win, linux-appimage, others etc if desired, but default returned order is usually alphabetical or upload order. 
        // We can sort by OS priority for display if needed: Mac, Windows, Linux)
        // For now, simple filter is enough.
        
        if (packages.length > 0) {
            downloadPackages.value = packages
            releaseVersion.value = release.tag_name
            
            // Cache the result
            localStorage.setItem(CACHE_KEY, JSON.stringify({ packages, version: release.tag_name }))
            localStorage.setItem(CACHE_TIME_KEY, Date.now().toString())
        }
    } catch (error) {
        console.error('Failed to fetch latest release:', error)
        // Keep using default hardcoded values if fetch fails
    }
}

// Get primary download for current OS
const currentOSDownload = computed(() => {
    const os = detectedOS.value
    return downloadPackages.value.find(pkg => pkg.os === os && pkg.isPrimary) || downloadPackages.value[0]
})

// Get OS display name
const osDisplayName = computed(() => {
    switch (detectedOS.value) {
        case 'macos': return 'Apple Silicon'
        case 'windows': return 'Windows'
        case 'linux': return 'Linux'
        default: return 'your system'
    }
})

// Get OS short name for button
const osShortName = computed(() => {
    switch (detectedOS.value) {
        case 'macos': return 'macOS'
        case 'windows': return 'Windows'
        case 'linux': return 'Linux'
        default: return 'Desktop'
    }
})

// Get other platforms text
const otherPlatformsText = computed(() => {
    switch (detectedOS.value) {
        case 'macos': return 'Windows or Linux'
        case 'windows': return 'macOS or Linux'
        case 'linux': return 'macOS or Windows'
        default: return 'other platforms'
    }
})

// Copy checksum to clipboard
const copyChecksum = async (checksum: string) => {
    try {
        await navigator.clipboard.writeText(checksum)
        copiedChecksum.value = checksum
        setTimeout(() => {
            copiedChecksum.value = null
        }, 2000)
    } catch (err) {
        console.error('Failed to copy checksum:', err)
    }
}

// Better Auth client
const authClient = createAuthClient({
    baseURL: `${useRuntimeConfig().public.apiBaseUrl}/auth`
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
 * Send token and user data to callback URL via fetch
 */
const sendToCallback = async () => {
    if (!callbackUrl.value || !session.value?.data) {
        return
    }

    const token = session.value.data.session?.token
    const user = session.value.data.user

    if (!token || !user) {
        console.error('Failed to get authentication token or user data')
        return
    }

    // Base64 encode user JSON
    const userJson = JSON.stringify(user)
    const base64User = base64Encode(userJson)

    try {
        await fetch(`${callbackUrl.value}?token=${encodeURIComponent(token)}&user=${encodeURIComponent(base64User)}`, {
            method: 'GET',
            mode: 'no-cors'
        })
    } catch (err) {
        console.error('Failed to send to callback URL:', err)
    }
}

/**
 * Fetch user profile to check completion status
 */
const fetchProfile = async () => {
    try {
        isProfileLoading.value = true
        const token = session.value?.data?.session?.token
        if (!token) {
            throw new Error('No authentication token available')
        }

        const response = await fetch(`${useRuntimeConfig().public.apiBaseUrl}/v1/profile`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        })

        if (!response.ok) {
            throw new Error('Failed to fetch profile')
        }

        const profileData = await response.json()
        
        // Access nested data property
        if (profileData.data) {
            isProfileCompleted.value = profileData.data.profileCompleted === true
            
            // If profile has data, pre-fill the form
            if (profileData.data.businessName) {
                emit('update:data', { business: profileData.data.businessName, insta: props.data.insta })
            }
            if (profileData.data.instaId) {
                emit('update:data', { business: props.data.business, insta: profileData.data.instaId })
            }
        }

        return profileData
    } catch (err: any) {
        throw err
    } finally {
        isProfileLoading.value = false
    }
}

/**
 * Update user profile with business and Instagram details
 */
const updateProfile = async () => {
    isProfileLoading.value = true
    const token = session.value?.data?.session?.token
    if (!token) {
        isProfileLoading.value = false
        throw new Error('No authentication token available')
    }

    try {
        const response = await fetch(`${useRuntimeConfig().public.apiBaseUrl}/v1/profile`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                businessName: localData.value.business,
                instaId: localData.value.insta
            })
        })

        if (!response.ok) {
            throw new Error('Failed to update profile')
        }

        const profileData = await response.json()
        
        // Access nested data property
        if (profileData.data) {
            isProfileCompleted.value = profileData.data.profileCompleted === true
        }
        
        return profileData
    } catch (err: any) {
        throw err
    } finally {
        isProfileLoading.value = false
    }
}

/**
 * Handle successful authentication
 */
const handleAuthSuccess = async () => {
    // Wait a bit for session to be available
    await new Promise(resolve => setTimeout(resolve, 100))

    try {
        // Fetch profile to determine next step
        await fetchProfile()

        // If profile is completed, go to ready for launch screen
        if (isProfileCompleted.value) {
            emit('update:step', 4)
        } else {
            // Determine which step to go to based on filled data
            if (localData.value.business && localData.value.insta) {
                emit('update:step', 4)
            } else if (localData.value.business) {
                emit('update:step', 3)
            } else {
                emit('update:step', 2)
            }
        }
    } catch (err) {
        // If profile fetch fails, default to step 2
        emit('update:step', 2)
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
    // Detect OS on mount
    detectedOS.value = detectOS()
    // Fetch latest release
    await getLatestRelease()
    
    await nextTick()
    
    // If user is already authenticated, check profile status first
    // This ensures we're on the correct step before setting focus
    if (session.value?.data) {
        await handleAuthSuccess()
    }
    
    // Set focus after step is determined
    await nextTick()
    if (props.step === 2) {
        businessInput.value?.focus()
    } else if (props.step === 3) {
        instaInput.value?.focus()
    }
})

// Watch for session changes (for OAuth callback handling)
watch(() => session.value?.data, async (newData, oldData) => {
    const hasSession = newData && newData.session?.token && newData.user
    const hadSession = oldData && oldData.session?.token && oldData.user

    // User just logged in (session appeared)
    if (hasSession && !hadSession) {
        // Fetch profile and determine appropriate step
        await handleAuthSuccess()
    }
})

// Auto-send token when on step 4 with active session and callback URL
watch([() => props.step, () => callbackUrl.value], async ([newStep, newCallbackUrl]) => {
    if (newStep === 4 && newCallbackUrl && session.value?.data?.session?.token) {
        // Send token to callback URL via GET request
        await sendToCallback()
    }
})

// Validation
const isBusinessValid = computed(() => localData.value.business.length > 2)
const isInstaValid = computed(() => localData.value.insta.length > 1)

// Actions
const startGoogle = async () => {
    isLoading.value = true

    // Redirect back to the current page after OAuth completes
    await authClient.signIn.social({
        provider: 'google',
        callbackURL: window.location.href
    })

    // OAuth redirect will handle the callback automatically
    // Better Auth will redirect to callbackURL after successful authentication
}

const next = async () => {
    // If on step 3 (Instagram input), update profile before proceeding
    if (props.step === 3) {
        try {
            await updateProfile()
            emit('update:step', props.step + 1)
        } catch (err) {
            // Error is handled in updateProfile
        }
    } else {
        emit('update:step', props.step + 1)
    }
}

const download = async () => {
    if (dlLoading.value) return
    dlLoading.value = true
    
    // Trigger actual download
    const pkg = currentOSDownload.value
    if (pkg) {
        window.open(pkg.url, '_blank') // Use window.open for explicit new tab/download
    }
    
    // Show loading feedback
    setTimeout(() => {
        dlLoading.value = false
    }, 1500)
}

const launchApp = () => {
    window.location.href = 'lumosnap://open'
}

const openUrl = (url: string) => {
    if (url) window.open(url, '_blank')
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

            <!-- Show unauthorized message if not authenticated -->
            <ClientOnly>
                <div v-if="!isAuthenticated && !isLoading" style="background: var(--red-50); border: 1px solid var(--red-200); padding: 1rem; border-radius: 0.5rem; margin-bottom: 1rem;">
                    <p style="color: var(--red-600); font-size: 0.875rem; font-weight: 500; margin: 0;">
                        Please sign in to continue
                    </p>
                </div>
            </ClientOnly>

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
                <p class="dl-meta">Running natively on <strong style="color:var(--zinc-900)">{{ osDisplayName }}</strong> for
                    maximum color accuracy.</p>

                <div class="btn-group">
                    <button class="btn-dl" :class="{ loading: dlLoading }" @click="download" :disabled="dlLoading">
                        <div class="loading-bar"></div>
                        <Download :size="20" /> Download <span style="font-weight:400; opacity:0.7">for {{ osShortName }}</span>
                    </button>
                    <button class="btn-launch" @click="launchApp">
                        <ExternalLink :size="18" /> Launch
                    </button>
                </div>
            </div>

            <div style="width:100%; text-align:center">
                <a href="#" @click.prevent="showPlatformsModal = true"
                    style="text-decoration:none; color:var(--zinc-400); font-size:0.875rem; font-weight:500; display:inline-flex; align-items:center; gap:0.5rem">
                    <Laptop :size="14" /> Looking for {{ otherPlatformsText }}?
                </a>
            </div>
        </div>



        <!-- All Platforms Modal -->
        <Teleport to="body">
            <Transition name="modal">
                <div v-if="showPlatformsModal" class="modal-overlay" @click.self="showPlatformsModal = false">
                    <div class="modal-content modal-wide">
                        <button class="modal-close" @click="showPlatformsModal = false">
                            <X :size="20" />
                        </button>
                        <div class="modal-icon">
                            <img src="/logo.png" alt="LumoSnap" class="modal-logo" />
                        </div>
                        <h3 class="modal-title">Download for All Platforms</h3>
                        <p class="modal-desc">Choose the right package for your operating system.</p>
                        
                        <div class="packages-list">
                            <div v-for="pkg in downloadPackages" :key="pkg.filename" class="package-item" @click="openUrl(pkg.url)">
                                <div class="package-info">
                                    <div class="package-header">
                                        <span class="package-name">{{ pkg.name }}</span>
                                        <span class="package-size">{{ pkg.size }}</span>
                                    </div>
                                    <div class="package-filename">{{ pkg.filename }}</div>
                                    <div class="package-checksum" v-if="pkg.checksum">
                                        <span class="checksum-text">{{ pkg.checksum }}</span>
                                        <button class="copy-btn" @click.stop="copyChecksum(pkg.checksum)" :title="copiedChecksum === pkg.checksum ? 'Copied!' : 'Copy checksum'">
                                            <Check v-if="copiedChecksum === pkg.checksum" :size="14" class="c-green" />
                                            <Copy v-else :size="14" />
                                        </button>
                                    </div>
                                </div>
                                <a :href="pkg.url" class="package-download" target="_blank" rel="noopener" @click.stop>
                                    <Download :size="16" />
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </Transition>
        </Teleport>
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

/* Button Group */
.btn-group {
    display: flex;
    gap: 0.75rem;
    width: 100%;
}

.btn-group .btn-dl {
    flex: 1;
}

.btn-launch {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.875rem 1.25rem;
    background: var(--zinc-100);
    color: var(--zinc-700);
    border: 1px solid var(--zinc-200);
    border-radius: 0.75rem;
    font-size: 0.9375rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
}

.btn-launch:hover {
    background: var(--zinc-200);
    color: var(--zinc-900);
}

/* Modal Styles */
.modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(4px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 1rem;
}

.modal-content {
    background: white;
    border-radius: 1.25rem;
    padding: 2rem;
    max-width: 400px;
    width: 100%;
    position: relative;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
    text-align: center;
}

.modal-content.modal-wide {
    max-width: 560px;
    text-align: left;
}

.modal-close {
    position: absolute;
    top: 1rem;
    right: 1rem;
    width: 2rem;
    height: 2rem;
    border-radius: 0.5rem;
    background: var(--zinc-100);
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--zinc-500);
    transition: all 0.2s ease;
}

.modal-close:hover {
    background: var(--zinc-200);
    color: var(--zinc-700);
}

.modal-icon {
    width: 4rem;
    height: 4rem;
    border-radius: 1rem;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 1.5rem;
    overflow: hidden;
}

.modal-wide .modal-icon {
    margin: 0 0 1.5rem;
}

.modal-logo {
    width: 100%;
    height: 100%;
    object-fit: contain;
    border-radius: 0.5rem;
}

.modal-title {
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--zinc-900);
    margin-bottom: 0.5rem;
}

.modal-desc {
    font-size: 0.9375rem;
    color: var(--zinc-500);
    margin-bottom: 1.5rem;
    line-height: 1.5;
}

.modal-hint {
    font-size: 0.8125rem;
    color: var(--zinc-400);
    margin-top: 1rem;
}

.modal-hint a {
    color: var(--indigo-600);
    text-decoration: none;
    font-weight: 500;
}

.modal-hint a:hover {
    text-decoration: underline;
}

/* Launch Primary Button */
.btn-launch-primary {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    width: 100%;
    padding: 1rem 1.5rem;
    background: linear-gradient(135deg, var(--indigo-500), var(--indigo-600));
    color: white;
    border: none;
    border-radius: 0.75rem;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    text-decoration: none;
    transition: all 0.2s ease;
}

.btn-launch-primary:hover {
    background: linear-gradient(135deg, var(--indigo-600), var(--indigo-700));
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
}

/* Packages List */
.packages-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    max-height: 400px;
    overflow-y: auto;
}

.package-item {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem;
    background: var(--zinc-50);
    border: 1px solid var(--zinc-200);
    border-radius: 0.75rem;
    transition: all 0.2s ease;
}

.package-item:hover {
    border-color: var(--indigo-200);
    background: var(--indigo-50);
}

.package-info {
    flex: 1;
    min-width: 0;
}

.package-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 0.25rem;
}

.package-name {
    font-size: 0.9375rem;
    font-weight: 600;
    color: var(--zinc-900);
}

.package-size {
    font-size: 0.75rem;
    font-weight: 500;
    color: var(--zinc-500);
    background: var(--zinc-100);
    padding: 0.125rem 0.5rem;
    border-radius: 0.25rem;
}

.package-filename {
    font-size: 0.8125rem;
    color: var(--zinc-600);
    font-family: ui-monospace, SFMono-Regular, monospace;
    margin-bottom: 0.5rem;
}

.package-checksum {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.checksum-text {
    font-size: 0.6875rem;
    font-family: ui-monospace, SFMono-Regular, monospace;
    color: var(--zinc-400);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    max-width: 280px;
}

.copy-btn {
    flex-shrink: 0;
    width: 1.5rem;
    height: 1.5rem;
    border: none;
    background: transparent;
    cursor: pointer;
    color: var(--zinc-400);
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 0.25rem;
    transition: all 0.15s ease;
}

.copy-btn:hover {
    background: var(--zinc-100);
    color: var(--zinc-600);
}

.package-download {
    flex-shrink: 0;
    width: 2.5rem;
    height: 2.5rem;
    background: var(--indigo-500);
    color: white;
    border-radius: 0.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    text-decoration: none;
    transition: all 0.2s ease;
}

.package-download:hover {
    background: var(--indigo-600);
    transform: scale(1.05);
}

/* Modal Transitions */
.modal-enter-active,
.modal-leave-active {
    transition: all 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
    opacity: 0;
}

.modal-enter-from .modal-content,
.modal-leave-to .modal-content {
    transform: scale(0.95) translateY(10px);
}

.modal-enter-active .modal-content,
.modal-leave-active .modal-content {
    transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}
</style>
