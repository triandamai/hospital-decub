<template>
    <main class="logs-wrapper">
        <Head>
            <Title
                >Log Aktivitas: {{ patient?.patient_name || "Loading..." }} |
                RSUP Fatmawati</Title
            >
        </Head>

        <header class="logs-header">
            <div class="header-content">
                <NuxtLink to="/dashboard" class="back-link">
                    <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        class="back-icon"
                    >
                        <line x1="19" y1="12" x2="5" y2="12"></line>
                        <polyline points="12 19 5 12 12 5"></polyline>
                    </svg>
                    Kembali ke Dashboard
                </NuxtLink>

                <div class="patient-summary" v-if="patient">
                    <h1 class="patient-name">{{ patient.patient_name }}</h1>
                    <p class="patient-meta">
                        Bed {{ patient.bed_number }} &bull; Teratai 2 Selatan
                    </p>
                </div>
            </div>
        </header>

        <div class="logs-container glass-panel">
            <div v-if="loading" class="loading-state">
                <div class="spinner"></div>
                <p>Memuat log aktivitas...</p>
            </div>

            <div v-else-if="logs.length === 0" class="empty-state">
                <div class="empty-icon">
                    <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                    >
                        <path
                            d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
                        ></path>
                        <polyline points="14 2 14 8 20 8"></polyline>
                        <line x1="16" y1="13" x2="8" y2="13"></line>
                        <line x1="16" y1="17" x2="8" y2="17"></line>
                        <polyline points="10 9 9 9 8 9"></polyline>
                    </svg>
                </div>
                <p>Belum ada log aktivitas untuk pasien ini.</p>
            </div>

            <div v-else class="logs-timeline">
                <div v-for="log in logs" :key="log.id" class="timeline-item">
                    <div class="log-time">
                        <span class="time-main">{{
                            formatDateTime(log.action_time).time
                        }}</span>
                        <span class="date-sub">{{
                            formatDateTime(log.action_time).date
                        }}</span>
                    </div>

                    <div class="timeline-marker">
                        <div class="marker-dot"></div>
                        <div class="marker-line"></div>
                    </div>

                    <div class="log-details-card">
                        <div class="detail-row">
                            <span class="label">Posisi</span>
                            <span class="value position-badge">{{
                                log.positions
                            }}</span>
                        </div>
                        <div class="detail-row">
                            <span class="label">Perawat</span>
                            <span class="value">{{ log.nurse_name }}</span>
                        </div>
                        <div
                            v-if="log.image_positions"
                            class="detail-row action-image-row"
                        >
                            <span class="label">Bukti</span>
                            <div class="log-image-wrapper">
                                <img
                                    :src="log.image_positions"
                                    alt="Bukti Tindakan"
                                    class="log-action-img"
                                    @click="openImage(log.image_positions)"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </main>

    <!-- Image Lightbox Modal -->
    <Transition name="fade">
        <div
            v-if="selectedImage"
            class="image-modal-overlay"
            @click="closeImage"
        >
            <div class="image-modal-content">
                <img :src="selectedImage" alt="Bukti Tindakan Full" />
                <button class="close-modal-btn" @click="closeImage">
                    <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                    >
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
            </div>
        </div>
    </Transition>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRoute } from "vue-router";
import { usePatientStore } from "#imports";

const route = useRoute();
const patientStore = usePatientStore();

const patientId = route.params.id;
const patient = ref(null);
const logs = ref([]);
const loading = ref(true);
const selectedImage = ref(null);

const openImage = (url) => {
    selectedImage.value = url;
};

const closeImage = () => {
    selectedImage.value = null;
};

const formatDateTime = (isoString) => {
    if (!isoString) return { time: "--:--", date: "--" };
    const date = new Date(isoString);

    const time = date.toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
    });

    const day = date.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
    });

    return { time, date: day };
};

onMounted(async () => {
    try {
        const [patientData, logsData] = await Promise.all([
            patientStore.fetchPatientById(patientId),
            patientStore.fetchLogs(patientId),
        ]);

        patient.value = patientData;
        logs.value = logsData;
    } catch (error) {
        console.error("Error loading logs page:", error);
    } finally {
        loading.value = false;
    }
});
</script>

<style scoped>
.logs-wrapper {
    max-width: 800px;
    margin: 0 auto;
    padding: 2rem 1rem;
    min-height: 100vh;
    position: relative;
    z-index: 1;
}

.logs-header {
    margin-bottom: 2rem;
    animation: slideDown 0.5s ease-out;
}

.back-link {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    color: var(--text-muted);
    text-decoration: none;
    font-size: 0.95rem;
    margin-bottom: 1.5rem;
    transition: all 0.3s ease;
    padding: 0.5rem 1rem;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 10px;
    border: 1px solid rgba(255, 255, 255, 0.1);
}

.back-link:hover {
    color: var(--text-light);
    background: rgba(255, 255, 255, 0.1);
    transform: translateX(-5px);
}

.back-icon {
    width: 18px;
    height: 18px;
}

.patient-name {
    font-size: 2.2rem;
    font-weight: 700;
    background: linear-gradient(135deg, #e0e7ff, #fbcfe8);
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
    margin-bottom: 0.25rem;
}

.patient-meta {
    color: var(--text-muted);
    font-size: 1.1rem;
    font-weight: 300;
}

.logs-container {
    padding: 2rem;
    min-height: 400px;
    animation: fadeIn 0.8s ease-out;
}

.loading-state,
.empty-state {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    height: 300px;
    color: var(--text-muted);
    gap: 1rem;
}

.spinner {
    width: 48px;
    height: 48px;
    border: 4px solid rgba(255, 255, 255, 0.1);
    border-left-color: var(--primary);
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 1rem;
}

.empty-icon {
    width: 64px;
    height: 64px;
    opacity: 0.3;
    margin-bottom: 0.5rem;
}

.logs-timeline {
    display: flex;
    flex-direction: column;
    padding: 1rem 0;
}

.timeline-item {
    display: flex;
    gap: 1.5rem;
}

.log-time {
    display: flex;
    flex-direction: column;
    min-width: 80px;
    text-align: right;
    padding-top: 1.25rem;
}

.time-main {
    font-size: 1.2rem;
    font-weight: 600;
    color: var(--text-light);
    line-height: 1.2;
}

.date-sub {
    font-size: 0.75rem;
    color: var(--text-muted);
}

.timeline-marker {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 20px;
    flex-shrink: 0;
}

.marker-dot {
    width: 14px;
    height: 14px;
    background: var(--primary);
    border-radius: 50%;
    border: 3px solid var(--bg-dark);
    z-index: 2;
    box-shadow: 0 0 10px rgba(99, 102, 241, 0.4);
    margin-top: 1.4rem;
}

.marker-line {
    flex: 1;
    width: 2px;
    background: repeating-linear-gradient(
        to bottom,
        rgba(255, 255, 255, 0.1) 0,
        rgba(255, 255, 255, 0.1) 4px,
        transparent 4px,
        transparent 8px
    );
    margin-top: 4px;
}

.timeline-item:last-child .marker-line {
    display: none;
}

.log-details-card {
    flex: 1;
    padding: 1.5rem;
    background: rgba(15, 23, 42, 0.4);
    border: 1px solid rgba(255, 255, 255, 0.05);
    border-radius: 20px;
    margin-bottom: 2rem;
    transition: all 0.3s ease;
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
}

.log-details-card:hover {
    transform: translateY(-5px);
    background: rgba(15, 23, 42, 0.6);
    border-color: rgba(99, 102, 241, 0.2);
}

.detail-row {
    display: flex;
    align-items: center;
    gap: 1rem;
}

.label {
    font-size: 0.85rem;
    color: var(--text-muted);
    width: 70px;
    text-transform: uppercase;
    letter-spacing: 1px;
}

.value {
    color: #e2e8f0;
    font-weight: 500;
    font-size: 1.05rem;
}

.position-badge {
    display: inline-block;
    padding: 0.3rem 1rem;
    background: rgba(99, 102, 241, 0.1);
    color: #c7d2fe;
    border-radius: 10px;
    font-size: 0.95rem;
    border: 1px solid rgba(99, 102, 241, 0.2);
}

.action-image-row {
    align-items: flex-start !important;
}

.log-image-wrapper {
    margin-top: 0.5rem;
    width: 100%;
    max-width: 300px;
    border-radius: 12px;
    overflow: hidden;
    border: 1px solid rgba(255, 255, 255, 0.1);
}

.log-action-img {
    width: 100%;
    height: auto;
    display: block;
    cursor: pointer;
    transition: transform 0.3s ease;
}

.log-action-img:hover {
    transform: scale(1.05);
}

.image-modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.9);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
    backdrop-filter: blur(10px);
    padding: 2rem;
}

.image-modal-content {
    position: relative;
    max-width: 90%;
    max-height: 90%;
}

.image-modal-content img {
    max-width: 100%;
    max-height: 90vh;
    border-radius: 12px;
    box-shadow: 0 0 40px rgba(0, 0, 0, 0.5);
}

.close-modal-btn {
    position: absolute;
    top: -40px;
    right: 0;
    background: transparent;
    border: none;
    color: white;
    cursor: pointer;
    padding: 10px;
}

.close-modal-btn svg {
    width: 24px;
    height: 24px;
}

.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
    opacity: 0;
}

@keyframes spin {
    to {
        transform: rotate(360deg);
    }
}

@keyframes slideDown {
    from {
        opacity: 0;
        transform: translateY(-30px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

@keyframes fadeIn {
    from {
        opacity: 0;
    }
    to {
        opacity: 1;
    }
}

@media (max-width: 640px) {
    .timeline-item {
        gap: 0.75rem;
    }

    .log-time {
        min-width: 60px;
        padding-top: 1.4rem;
    }

    .time-main {
        font-size: 0.95rem;
    }

    .date-sub {
        font-size: 0.65rem;
    }

    .marker-dot {
        width: 12px;
        height: 12px;
        margin-top: 1.5rem;
    }

    .log-details-card {
        padding: 1.25rem 1rem;
        margin-bottom: 1.5rem;
    }

    .detail-row {
        gap: 0.75rem;
    }

    .label {
        width: 50px;
        font-size: 0.75rem;
    }

    .value {
        font-size: 0.9rem;
    }

    .logs-container {
        padding: 1.25rem 0.75rem;
    }

    .patient-name {
        font-size: 1.7rem;
    }
}
</style>
