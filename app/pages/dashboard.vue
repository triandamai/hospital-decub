<template>
  <main class="dashboard-wrapper">
    <!-- Processing Overlay -->
    <div v-if="isProcessing" class="loading-overlay">
      <div class="spinner"></div>
      <p>Memproses tindakan...</p>
    </div>

    <Head>
      <Title>Dashboard | Monitoring Reposisi Pasien</Title>
    </Head>

    <header class="dashboard-header glass-panel">
      <div>
        <h1 class="dashboard-title">Dashboard Ruangan</h1>
        <p class="dashboard-subtitle">Teratai 2 Selatan</p>
      </div>
      <div>
        <NuxtLink to="/" class="primary-btn">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          Laporan Baru
        </NuxtLink>
      </div>
    </header>

    <div class="dashboard-content">
      <!-- Action Card -->
      <section v-if="displayedCardPatient" class="action-section">
        <h2 class="section-title">
          <span class="status-dot" :class="{ 'pulse': !isIncoming, 'pulse-incoming': isIncoming }"></span>
          {{ isIncoming ? 'Reposisi Berikutnya (Incoming)' : 'Perlu Tindakan Segera' }}
        </h2>
        
        <Transition name="fade-slide" mode="out-in">
          <div :key="displayedCardPatient.id + (isIncoming ? '-incoming' : '-urgent')" class="urgent-card glass-panel" :class="{ 'incoming-style': isIncoming }">
            <div class="urgent-info">
              <div class="urgent-header">
                <div class="header-left">
                  <span class="bed-badge">Bed {{ displayedCardPatient.bed }}</span>
                  <span class="time-elapsed">{{ displayedCardPatient.timeElapsed }} yang lalu</span>
                </div>
                <!-- <button class="icon-btn delete-btn" @click.stop="handleDelete(displayedCardPatient)" title="Hapus Data Pasien">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    <line x1="10" y1="11" x2="10" y2="17"></line>
                    <line x1="14" y1="11" x2="14" y2="17"></line>
                  </svg>
                </button> -->
              </div>
              <h3 class="patient-name">{{ displayedCardPatient.name }}</h3>
              <p class="patient-status">Posisi saat ini: <strong>{{ displayedCardPatient.position }}</strong></p>
              <p class="patient-warning" v-if="!isIncoming">Waktunya reposisi pasien untuk mencegah dekubitus.</p>
              <p class="patient-warning" v-else>Mendekati batas waktu reposisi selanjutnya.</p>
            </div>
            
            <div class="urgent-actions">
              <button class="action-btn" @click="patientStore.takeAction(displayedCardPatient)">
                Ambil Tindakan
              </button>
              <button v-if="!isIncoming" class="skip-btn" @click="handleSkipUrgent">
                Lewati Pasien
              </button>
            </div>
          </div>
        </Transition>
      </section>

      <section class="action-section" v-else>
        <div class="glass-panel all-clear">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="check-icon">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
          </svg>
          <h3>Semua Pasien Aman</h3>
          <p>Belum ada pasien yang membutuhkan reposisi saat ini.</p>
        </div>
      </section>

      <!-- Patient List -->
      <section class="list-section">
        <div class="list-header">
          <h2 class="section-title">Daftar Pasien</h2>
          <button @click="patientStore.simulateAlert()" class="simulate-btn" title="Simulasikan Peringatan Baru">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21.5 2v6h-6M2.13 15.57a10 10 0 1 0 3.43-11.4l-4-4"></path>
            </svg>
            Simulasi Peringatan
          </button>
        </div>
        
        <div class="patient-grid">
          <div v-for="patient in paginatedPatients" :key="patient.id" class="patient-card glass-panel" :class="{'needs-action': patient.status === 'warning'}">
            <div class="card-top">
              <span class="bed-num">Bed {{ patient.bed }}</span>
              <div class="card-actions">
                <span class="status-dot" :class="patient.status"></span>
                <button class="icon-btn delete-btn" @click.stop="handleDelete(patient)" title="Hapus Data Pasien">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    <line x1="10" y1="11" x2="10" y2="17"></line>
                    <line x1="14" y1="11" x2="14" y2="17"></line>
                  </svg>
                </button>
              </div>
            </div>
            <div class="card-mid">
              <h4>{{ patient.name }}</h4>
              <p class="position">{{ patient.position }}</p>
            </div>
            <div class="card-bot">
              <span class="time-label">Terakhir reposisi:</span>
              <span class="time-val">{{ patient.lastUpdate }}</span>
            </div>
          </div>
        </div>

        <!-- Pagination Controls -->
        <div class="pagination" v-if="totalPages > 1">
          <button class="page-btn" :disabled="currentPage === 1" @click="prevPage">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
            Sebelumnya
          </button>
          
          <div class="page-info">
            Halaman <span>{{ currentPage }}</span> dari {{ totalPages }}
          </div>
          
          <button class="page-btn" :disabled="currentPage === totalPages" @click="nextPage">
            Selanjutnya
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </button>
        </div>
      </section>
    </div>

    <!-- Alert Popup (Toast) -->
    <Transition name="toast">
      <div v-if="showPopup && popupPatient" class="alert-popup glass-panel">
        <div class="popup-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
            <line x1="12" y1="9" x2="12" y2="13"></line>
            <line x1="12" y1="17" x2="12.01" y2="17"></line>
          </svg>
        </div>
        <div class="popup-content">
          <h4>Perlu Tindakan Segera</h4>
          <p>{{ popupPatient.name }} (Bed {{ popupPatient.bed }}) sudah lebih dari batas waktu.</p>
        </div>
        <button class="close-popup" @click="closePopup">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
    </Transition>

    <!-- Delete Confirmation Dialog -->
    <Transition name="fade-scale">
      <div v-if="showDeleteDialog" class="dialog-overlay" @click.self="showDeleteDialog = false">
        <div class="dialog-content glass-panel">
          <div class="dialog-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
              <line x1="12" y1="9" x2="12" y2="13"></line>
              <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
          </div>
          <h3>Konfirmasi Hapus</h3>
          <p>Apakah Anda yakin ingin menghapus data pasien <strong class="text-light">{{ patientToDelete?.name }}</strong> di <strong class="text-light">Bed {{ patientToDelete?.bed }}</strong>? Tindakan ini tidak dapat dibatalkan.</p>
          <div class="dialog-actions">
            <button class="dialog-btn-cancel" @click="showDeleteDialog = false">Batal</button>
            <button class="dialog-btn-confirm" @click="confirmDelete">Ya, Hapus</button>
          </div>
        </div>
      </div>
    </Transition>
  </main>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { storeToRefs } from 'pinia'
import { usePatientStore } from '#imports'

const patientStore = usePatientStore()

const { 
  isProcessing,
  displayedCardPatient,
  isIncoming,
  urgentPatient,
  patients 
} = storeToRefs(patientStore)

// Pagination logic
const currentPage = ref(1)
const itemsPerPage = 6

const totalPages = computed(() => {
  return Math.ceil(patients.value.length / itemsPerPage)
})

const paginatedPatients = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  const end = start + itemsPerPage
  return patients.value.slice(start, end)
})

watch(totalPages, (newTotal) => {
  if (currentPage.value > newTotal && newTotal > 0) {
    currentPage.value = newTotal
  }
})

const prevPage = () => {
  if (currentPage.value > 1) currentPage.value--
}

const nextPage = () => {
  if (currentPage.value < totalPages.value) currentPage.value++
}

const handleSkipUrgent = () => {
  const patient = urgentPatient.value
  if (patient) {
    patientStore.skipUrgent()
    if (popupPatient.value && popupPatient.value.id === patient.id) {
      closePopup()
    }
  }
}

const showDeleteDialog = ref(false)
const patientToDelete = ref(null)

const handleDelete = (patient) => {
  patientToDelete.value = patient
  showDeleteDialog.value = true
}

const confirmDelete = async () => {
  const patient = patientToDelete.value
  if (patient) {
    showDeleteDialog.value = false
    await patientStore.deletePatient(patient.bed, patient.name)
    if (popupPatient.value && popupPatient.value.id === patient.id) {
      closePopup()
    }
    patientToDelete.value = null
  }
}

const showPopup = ref(false)
const popupPatient = ref(null)
let popupTimeout = null

const playAlertSound = () => {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)()
    const oscillator = audioCtx.createOscillator()
    const gainNode = audioCtx.createGain()
    
    oscillator.connect(gainNode)
    gainNode.connect(audioCtx.destination)
    
    oscillator.type = 'sine'
    
    oscillator.frequency.setValueAtTime(523.25, audioCtx.currentTime)
    gainNode.gain.setValueAtTime(0, audioCtx.currentTime)
    gainNode.gain.linearRampToValueAtTime(0.4, audioCtx.currentTime + 0.05)
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3)
    
    oscillator.frequency.setValueAtTime(659.25, audioCtx.currentTime + 0.3)
    gainNode.gain.setValueAtTime(0, audioCtx.currentTime + 0.3)
    gainNode.gain.linearRampToValueAtTime(0.4, audioCtx.currentTime + 0.35)
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.8)
    
    oscillator.start(audioCtx.currentTime)
    oscillator.stop(audioCtx.currentTime + 1)
  } catch(e) {
    console.warn("Audio not supported or blocked", e)
  }
}

const triggerAlert = (patient) => {
  popupPatient.value = patient
  showPopup.value = true
  playAlertSound()
  
  if (popupTimeout) clearTimeout(popupTimeout)
  popupTimeout = setTimeout(() => {
    closePopup()
  }, 6000)
}

const closePopup = () => {
  showPopup.value = false
}

watch(urgentPatient, (newVal, oldVal) => {
  if (newVal && (!oldVal || newVal.id !== oldVal.id)) {
    triggerAlert(newVal)
  }
})

onMounted(() => {
  if (urgentPatient.value) {
    setTimeout(() => {
      triggerAlert(urgentPatient.value)
    }, 500)
  }

  patientStore.initRealtimeAndCron()
})

onUnmounted(() => {
  patientStore.cleanup()
})
</script>

<style scoped>
.dashboard-wrapper {
  width: 100%;
  max-width: 1000px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 2rem;
  z-index: 1;
  position: relative;
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 2rem;
  animation: slideDown 0.6s ease-out;
}

.dashboard-title {
  font-size: 1.8rem;
  font-weight: 700;
  color: var(--text-light);
  margin-bottom: 0.2rem;
  background: linear-gradient(135deg, #e0e7ff, #a5b4fc);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

.dashboard-subtitle {
  color: var(--text-muted);
  font-size: 0.95rem;
}

.primary-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.8rem 1.5rem;
  background: linear-gradient(135deg, var(--primary), var(--secondary));
  border: none;
  border-radius: 10px;
  color: white;
  font-family: inherit;
  font-weight: 600;
  text-decoration: none;
  box-shadow: 0 4px 15px rgba(99, 102, 241, 0.4);
  transition: all 0.3s ease;
}

.primary-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(99, 102, 241, 0.6);
}

.dashboard-content {
  display: flex;
  flex-direction: column;
  gap: 2.5rem;
  animation: fadeIn 0.8s ease-out 0.2s both;
}

.section-title {
  font-size: 1.4rem;
  font-weight: 600;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.8rem;
}

.urgent-card {
  padding: 2rem;
  border-left: 4px solid var(--error);
  display: flex;
  justify-content: space-between;
  align-items: stretch;
  gap: 2rem;
  background: linear-gradient(to right, rgba(239, 68, 68, 0.05), rgba(30, 41, 59, 0.6));
}

.incoming-style {
  border-left: 5px solid var(--warning);
  background: linear-gradient(to right, rgba(245, 158, 11, 0.05), rgba(30, 41, 59, 0.6));
}

.urgent-info {
  flex: 1;
}

.urgent-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.bed-badge {
  background: rgba(239, 68, 68, 0.15);
  color: #fca5a5;
  padding: 0.3rem 0.8rem;
  border-radius: 20px;
  font-weight: 600;
  font-size: 0.9rem;
  border: 1px solid rgba(239, 68, 68, 0.3);
}

.time-elapsed {
  color: #fca5a5;
  font-size: 0.9rem;
}

.patient-name {
  font-size: 2.2rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
}

.patient-status {
  color: var(--text-light);
  font-size: 1.1rem;
  margin-bottom: 0.5rem;
}

.patient-warning {
  color: var(--error);
  font-size: 0.9rem;
  margin: 0;
}

.incoming-style .patient-warning {
  color: var(--warning);
}

.urgent-actions {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  min-width: 200px;
}

.action-btn {
  display: block;
  text-align: center;
  padding: 1.2rem;
  background: var(--error);
  color: white;
  text-decoration: none;
  border-radius: 12px;
  font-weight: 600;
  font-size: 1.1rem;
  box-shadow: 0 4px 15px rgba(239, 68, 68, 0.4);
  transition: all 0.3s ease;
}

.action-btn:hover {
  background: #f87171;
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(239, 68, 68, 0.5);
}

.skip-btn {
  padding: 0.8rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: var(--text-muted);
  border-radius: 10px;
  font-family: inherit;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.skip-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: var(--text-light);
}

.all-clear {
  text-align: center;
  padding: 4rem 2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  border-color: rgba(16, 185, 129, 0.2);
}

.check-icon {
  color: var(--success);
  margin-bottom: 1.5rem;
  filter: drop-shadow(0 0 10px rgba(16, 185, 129, 0.4));
}

.all-clear h3 {
  font-size: 1.8rem;
  color: var(--success);
  margin-bottom: 0.5rem;
}

.all-clear p {
  color: var(--text-muted);
}

.patient-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
}

/* Pagination */
.pagination {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 2rem;
  padding: 1rem 1.5rem;
  background: rgba(30, 41, 59, 0.4);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.page-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: var(--text-light);
  padding: 0.6rem 1rem;
  border-radius: 8px;
  cursor: pointer;
  font-family: inherit;
  font-weight: 500;
  font-size: 0.9rem;
  transition: all 0.2s ease;
}

.page-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.15);
  border-color: rgba(255, 255, 255, 0.2);
}

.page-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.page-info {
  color: var(--text-muted);
  font-size: 0.95rem;
}

.page-info span {
  color: var(--text-light);
  font-weight: 600;
}

.patient-card {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  transition: all 0.3s ease;
}

.patient-card:hover {
  transform: translateY(-5px);
  border-color: rgba(255, 255, 255, 0.2);
  background: rgba(30, 41, 59, 0.8);
}

.patient-card.needs-action {
  border-color: rgba(245, 158, 11, 0.3);
}

.card-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.bed-num {
  font-weight: 600;
  color: var(--text-muted);
  font-size: 0.9rem;
  background: rgba(255,255,255,0.05);
  padding: 0.2rem 0.6rem;
  border-radius: 6px;
}

.status-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.status-dot.ok {
  background-color: var(--success);
  box-shadow: 0 0 8px var(--success);
}

.status-dot.warning {
  background-color: var(--warning);
  box-shadow: 0 0 8px var(--warning);
}

.card-actions {
  display: flex;
  align-items: center;
  gap: 0.8rem;
}

.icon-btn.delete-btn {
  background: transparent;
  border: none;
  color: rgba(255, 255, 255, 0.25);
  cursor: pointer;
  padding: 4px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.icon-btn.delete-btn:hover {
  background: rgba(239, 68, 68, 0.15);
  color: #ef4444;
}

.card-mid h4 {
  font-size: 1.4rem;
  margin-bottom: 0.2rem;
}

.position {
  color: var(--text-muted);
  font-size: 0.95rem;
}

.card-bot {
  background: rgba(0, 0, 0, 0.2);
  padding: 0.8rem;
  border-radius: 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.85rem;
}

.time-label {
  color: var(--text-muted);
}

.time-val {
  font-weight: 600;
  color: var(--text-light);
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.simulate-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.6rem 1rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: var(--text-muted);
  border-radius: 8px;
  font-family: inherit;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.simulate-btn:hover {
  background: rgba(255, 255, 255, 0.15);
  color: var(--text-light);
  border-color: rgba(255, 255, 255, 0.3);
}

.alert-popup {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  max-width: 400px;
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 1.2rem;
  border-left: 4px solid var(--error);
  z-index: 50;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
}

.popup-icon {
  color: var(--error);
  background: rgba(239, 68, 68, 0.1);
  padding: 0.5rem;
  border-radius: 50%;
  flex-shrink: 0;
}

.popup-content h4 {
  color: var(--text-light);
  margin-bottom: 0.2rem;
  font-size: 1.1rem;
}

.popup-content p {
  color: var(--text-muted);
  font-size: 0.9rem;
  line-height: 1.4;
}

.close-popup {
  background: transparent;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  padding: 0.2rem;
  transition: color 0.2s ease;
}

.close-popup:hover {
  color: var(--text-light);
}

.toast-enter-active,
.toast-leave-active {
  transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(50px) scale(0.9);
}

.toast-leave-to {
  opacity: 0;
  transform: translateY(20px);
}

@keyframes pulseRed {
  0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); }
  70% { box-shadow: 0 0 0 6px rgba(239, 68, 68, 0); }
  100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
}

@keyframes pulseYellow {
  0% { box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.4); }
  70% { box-shadow: 0 0 0 6px rgba(245, 158, 11, 0); }
  100% { box-shadow: 0 0 0 0 rgba(245, 158, 11, 0); }
}

.pulse {
  animation: pulseRed 2s infinite;
}

.pulse-incoming {
  animation: pulseYellow 2s infinite;
  background-color: var(--warning);
}

/* Card Transitions */
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.fade-slide-enter-from {
  opacity: 0;
  transform: translateX(30px);
}

.fade-slide-leave-to {
  opacity: 0;
  transform: translateX(-30px);
}

@keyframes slideDown {
  from { opacity: 0; transform: translateY(-30px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* Loading Overlay */
.loading-overlay {
  position: fixed;
  inset: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background: rgba(15, 23, 42, 0.75);
  backdrop-filter: blur(8px);
  z-index: 9999;
  color: var(--text-light);
  animation: fadeIn 0.3s ease;
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

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Dialog Styles */
.dialog-overlay {
  position: fixed;
  inset: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  background: rgba(15, 23, 42, 0.7);
  backdrop-filter: blur(5px);
  z-index: 100;
}

.dialog-content {
  width: 90%;
  max-width: 420px;
  padding: 2.5rem 2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 1rem;
  border-top: 4px solid var(--error);
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.8);
}

.dialog-icon {
  color: var(--error);
  background: rgba(239, 68, 68, 0.1);
  padding: 1.2rem;
  border-radius: 50%;
  margin-bottom: 0.5rem;
}

.dialog-content h3 {
  font-size: 1.5rem;
  color: var(--text-light);
  font-weight: 700;
}

.dialog-content p {
  color: var(--text-muted);
  line-height: 1.5;
  margin-bottom: 1.5rem;
  font-size: 1.05rem;
}

.text-light {
  color: var(--text-light);
}

.dialog-actions {
  display: flex;
  gap: 1rem;
  width: 100%;
}

.dialog-btn-cancel,
.dialog-btn-confirm {
  flex: 1;
  padding: 0.9rem;
  border-radius: 10px;
  font-family: inherit;
  font-weight: 600;
  font-size: 1.05rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.dialog-btn-cancel {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: var(--text-light);
}

.dialog-btn-cancel:hover {
  background: rgba(255, 255, 255, 0.1);
}

.dialog-btn-confirm {
  background: var(--error);
  border: none;
  color: white;
  box-shadow: 0 4px 15px rgba(239, 68, 68, 0.3);
}

.dialog-btn-confirm:hover {
  background: #f87171;
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(239, 68, 68, 0.4);
}

/* Dialog Transition */
.fade-scale-enter-active,
.fade-scale-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.fade-scale-enter-from,
.fade-scale-leave-to {
  opacity: 0;
}

.fade-scale-enter-from .dialog-content,
.fade-scale-leave-to .dialog-content {
  transform: scale(0.95) translateY(10px);
}

@media (max-width: 768px) {
  .urgent-card {
    flex-direction: column;
  }
  
  .urgent-actions {
    width: 100%;
  }
}
</style>
