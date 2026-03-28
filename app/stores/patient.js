import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const usePatientStore = defineStore('patient', () => {
  const supabase = useSupabaseClient()

  // State
  const dbRecords = ref([])
  const isProcessing = ref(false)
  const skippedIds = ref([])
  const isInitialized = ref(false)

  let pollInterval = null
  let timeoutChecker = null
  let realtimeChannel = null

  // Helper functions
  const formatTimeLabel = (isoString) => {
    if (!isoString) return '--:--'
    const date = new Date(isoString)
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
  }

  const computeElapsed = (isoString) => {
    if (!isoString) return 'Baru saja'
    const date = new Date(isoString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const hours = Math.floor(diffMs / (1000 * 60 * 60))
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))

    if (hours > 0) return `${hours} jam ${minutes} menit`
    if (minutes > 0) return `${minutes} menit`
    return `Kurang dari 1 menit`
  }

  // Getters (Computed Properties)
  const allStructuredPatients = computed(() => {
    if (!dbRecords.value) return []

    const map = new Map()
    for (const record of dbRecords.value) {
      const existing = map.get(record.bed_number)
      const recordDate = new Date(record.last_repositioned_at)

      // Always keep the newest record per bed
      if (!existing || recordDate > new Date(existing.rawLastUpdate)) {
        map.set(record.bed_number, {
          id: record.id,
          name: record.patient_name,
          bed: record.bed_number,
          position: record.positions,
          lastUpdate: formatTimeLabel(record.last_repositioned_at),
          rawLastUpdate: record.last_repositioned_at,
          timeElapsed: computeElapsed(record.last_repositioned_at),
          status: record.status,
          urgent: record.is_urgent
        })
      }
    }
    return Array.from(map.values())
  })

  const urgentPatient = computed(() => {
    return allStructuredPatients.value.find(p => p.urgent && !skippedIds.value.includes(p.id))
  })

  const incomingPatient = computed(() => {
    if (allStructuredPatients.value.length === 0) return null

    const okPatients = allStructuredPatients.value.filter(p => !p.urgent)
    if (okPatients.length === 0) return null

    // The closest patient to the 2-hour mark is the one with the oldest lastUpdate
    return okPatients.reduce((oldest, p) => {
      return new Date(p.rawLastUpdate) < new Date(oldest.rawLastUpdate) ? p : oldest
    }, okPatients[0])
  })

  const displayedCardPatient = computed(() => {
    return urgentPatient.value || incomingPatient.value
  })

  const isIncoming = computed(() => {
    return !urgentPatient.value && incomingPatient.value != null
  })

  const patients = computed(() => {
    return allStructuredPatients.value.filter(p => p.id !== displayedCardPatient.value?.id)
  })

  // Actions
  const fetchRecords = async () => {
    // using useAsyncData in pages causes hydration issues when moved into pinia natively without context,
    // so we just do a raw fetch instead here.
    const { data, error } = await supabase
      .from('tb_patient_records')
      .select('*')
      .order('last_repositioned_at', { ascending: true })

    if (error) {
      console.error('Error fetching patients:', error)
    } else {
      dbRecords.value = data || []
    }
  }

  const TIMEOUT = 2 * 60 * 60 * 1000 // 2 jam
  // const TIMEOUT = 6 * 60 * 1000 // 30 menit

  const checkTwoHourTimeouts = async () => {
    for (const p of allStructuredPatients.value) {
      if (p.status === 'ok' && !p.urgent && p.rawLastUpdate) {
        const diffMs = new Date() - new Date(p.rawLastUpdate)
        if (diffMs >= TIMEOUT) {
          await supabase.from('tb_patient_records')
            .update({ is_urgent: true, status: 'warning' })
            .eq('id', p.id)
          fetchRecords()
        }
      }
    }
  }

  const initRealtimeAndCron = async () => {
    if (isInitialized.value) return
    isInitialized.value = true

    await fetchRecords()

    realtimeChannel = supabase.channel('public:tb_patient_records')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tb_patient_records' }, async () => {
        await fetchRecords()
      })
      .subscribe()

    pollInterval = setInterval(() => {
      // Force reactivity update on elapsed times
      dbRecords.value = [...dbRecords.value]
    }, 1000)

    timeoutChecker = setInterval(() => {
      checkTwoHourTimeouts()
    }, 1000)
  }

  const cleanup = () => {
    if (pollInterval) clearInterval(pollInterval)
    if (timeoutChecker) clearInterval(timeoutChecker)
    if (realtimeChannel) supabase.removeChannel(realtimeChannel)
    isInitialized.value = false
  }

  const skipUrgent = () => {
    const patient = urgentPatient.value
    if (patient) {
      skippedIds.value.push(patient.id)
      setTimeout(() => {
        skippedIds.value = skippedIds.value.filter(id => id !== patient.id)
      }, 10000)
    }
  }

  const takeAction = async (patient, router) => {
    if (!patient || isProcessing.value) return

    isProcessing.value = true
    try {
      await supabase.from('tb_patient_records')
        .update({
          is_urgent: false,
          status: 'ok',
          last_repositioned_at: new Date().toISOString()
        })
        .eq('id', patient.id)

      await fetchRecords()

      if (router) {
        router.push(`/?patient=${encodeURIComponent(patient.name)}&bed=${encodeURIComponent(patient.bed)}`)
      }
    } catch (error) {
      console.error('Error taking action:', error)
    } finally {
      isProcessing.value = false
    }
  }

  const submitNewPatientForm = async (formPayload) => {
    isProcessing.value = true
    let errorMessage = null

    try {
      const { error } = await supabase.from('tb_patient_records').insert({
        patient_name: formPayload.patientName,
        bed_number: formPayload.bedNumber,
        positions: formPayload.positions.join(', '),
        nurse_name: formPayload.nurseName,
        status: 'ok',
        is_urgent: false,
        last_repositioned_at: new Date().toISOString()
      })

      if (error) throw error

    } catch (error) {
      console.error('Error saving to Supabase:', error)
      errorMessage = 'Gagal menyimpan laporan ke database.'
    } finally {
      isProcessing.value = false
    }
    return errorMessage
  }

  const deletePatient = async (bedNumber, patientName) => {
    isProcessing.value = true
    try {
      await supabase.from('tb_patient_records')
        .delete()
        .match({ bed_number: bedNumber, patient_name: patientName })

      await fetchRecords()
    } catch (error) {
      console.error('Error deleting patient:', error)
    } finally {
      isProcessing.value = false
    }
  }

  // Developer Simulation
  const simulateAlert = async () => {
    const okPatient = allStructuredPatients.value.find(p => p.status === 'ok')
    if (okPatient) {
      await supabase.from('tb_patient_records')
        .update({ is_urgent: true, status: 'warning' })
        .eq('id', okPatient.id)
      await fetchRecords()
    } else if (allStructuredPatients.value.length > 0) {
      await supabase.from('tb_patient_records')
        .update({ is_urgent: true, status: 'warning' })
        .eq('id', allStructuredPatients.value[0].id)
      await fetchRecords()
    }
  }

  return {
    dbRecords,
    isProcessing,
    allStructuredPatients,
    urgentPatient,
    incomingPatient,
    displayedCardPatient,
    isIncoming,
    patients,
    initRealtimeAndCron,
    cleanup,
    skipUrgent,
    takeAction,
    submitNewPatientForm,
    deletePatient,
    simulateAlert
  }
})
