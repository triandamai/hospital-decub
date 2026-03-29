import { defineStore } from "pinia";
import { ref, computed } from "vue";

export const usePatientStore = defineStore("patient", () => {
  const supabase = useSupabaseClient();

  // State
  const dbRecords = ref([]);
  const isProcessing = ref(false);
  const skippedIds = ref([]);
  const isInitialized = ref(false);

  let pollInterval = null;
  let timeoutChecker = null;
  let realtimeChannel = null;

  // Helper functions
  const formatTimeLabel = (isoString) => {
    if (!isoString) return "--:--";
    const date = new Date(isoString);
    return `${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`;
  };

  const computeElapsed = (isoString) => {
    if (!isoString) return "Baru saja";
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) return `${hours} jam ${minutes} menit`;
    if (minutes > 0) return `${minutes} menit`;
    return `Kurang dari 1 menit`;
  };

  // Getters (Computed Properties)
  const allStructuredPatients = computed(() => {
    if (!dbRecords.value) return [];

    // Since tb_patient_records now only stores the latest record per bed,
    // we just need to map them to the UI structure.
    return dbRecords.value.map((record) => ({
      id: record.id,
      name: record.patient_name,
      bed: record.bed_number,
      position: record.positions,
      lastUpdate: formatTimeLabel(record.last_repositioned_at),
      rawLastUpdate: record.last_repositioned_at,
      timeElapsed: computeElapsed(record.last_repositioned_at),
      status: record.status,
      urgent: record.is_urgent,
    }));
  });

  const urgentPatient = computed(() => {
    return allStructuredPatients.value.find(
      (p) => p.urgent && !skippedIds.value.includes(p.id),
    );
  });

  const incomingPatient = computed(() => {
    if (allStructuredPatients.value.length === 0) return null;

    const okPatients = allStructuredPatients.value.filter((p) => !p.urgent);
    if (okPatients.length === 0) return null;

    // The closest patient to the 2-hour mark is the one with the oldest lastUpdate
    return okPatients.reduce((oldest, p) => {
      return new Date(p.rawLastUpdate) < new Date(oldest.rawLastUpdate)
        ? p
        : oldest;
    }, okPatients[0]);
  });

  const displayedCardPatient = computed(() => {
    return urgentPatient.value || incomingPatient.value;
  });

  const isIncoming = computed(() => {
    return !urgentPatient.value && incomingPatient.value != null;
  });

  const patients = computed(() => {
    return allStructuredPatients.value.filter(
      (p) => p.id !== displayedCardPatient.value?.id,
    );
  });

  // Actions
  const fetchRecords = async () => {
    // using useAsyncData in pages causes hydration issues when moved into pinia natively without context,
    // so we just do a raw fetch instead here.
    const { data, error } = await supabase
      .from("tb_patient_records")
      .select("*")
      .order("last_repositioned_at", { ascending: true });

    if (error) {
      console.error("Error fetching patients:", error);
    } else {
      dbRecords.value = data || [];
    }
  };

  const TIMEOUT = 2 * 60 * 60 * 1000; // 2 jam
  // const TIMEOUT = 6 * 60 * 1000 // 30 menit

  const checkTwoHourTimeouts = async () => {
    for (const p of allStructuredPatients.value) {
      if (p.status === "ok" && !p.urgent && p.rawLastUpdate) {
        const diffMs = new Date() - new Date(p.rawLastUpdate);
        if (diffMs >= TIMEOUT) {
          await supabase
            .from("tb_patient_records")
            .update({ is_urgent: true, status: "warning" })
            .eq("id", p.id);
          fetchRecords();
        }
      }
    }
  };

  const initRealtimeAndCron = async () => {
    if (isInitialized.value) return;
    isInitialized.value = true;

    await fetchRecords();

    realtimeChannel = supabase
      .channel("public:tb_patient_records")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tb_patient_records" },
        async () => {
          await fetchRecords();
        },
      )
      .subscribe();

    pollInterval = setInterval(() => {
      // Force reactivity update on elapsed times
      dbRecords.value = [...dbRecords.value];
    }, 1000);

    timeoutChecker = setInterval(() => {
      checkTwoHourTimeouts();
    }, 1000);
  };

  const cleanup = () => {
    if (pollInterval) clearInterval(pollInterval);
    if (timeoutChecker) clearInterval(timeoutChecker);
    if (realtimeChannel) supabase.removeChannel(realtimeChannel);
    isInitialized.value = false;
  };

  const skipUrgent = () => {
    const patient = urgentPatient.value;
    if (patient) {
      skippedIds.value.push(patient.id);
      setTimeout(() => {
        skippedIds.value = skippedIds.value.filter((id) => id !== patient.id);
      }, 10000);
    }
  };

  const takeAction = async (patient, newPositions, nurseName, imageFile) => {
    if (!patient || isProcessing.value) return;

    isProcessing.value = true;
    try {
      const now = new Date().toISOString();
      const posStr = newPositions.join(", ");
      let imageUrl = "";

      // 0. Upload Image if exists
      if (imageFile) {
        const fileExt = imageFile.name.split(".").pop();
        const fileName = `${patient.id}-${Date.now()}.${fileExt}`;
        const filePath = `actions/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("patient-logs")
          .upload(filePath, imageFile);

        if (uploadError) {
          console.error("Error uploading image:", uploadError);
        } else {
          const { data: publicUrlData } = supabase.storage
            .from("patient-logs")
            .getPublicUrl(filePath);
          imageUrl = publicUrlData.publicUrl;
        }
      }

      // 1. Update master table (tb_patient_records)
      const { error: updateError } = await supabase
        .from("tb_patient_records")
        .update({
          positions: posStr,
          nurse_name: nurseName,
          status: "ok",
          is_urgent: false,
          last_repositioned_at: now,
        })
        .eq("id", patient.id);

      if (updateError) throw updateError;

      // 2. Insert into log table (tb_patient_logs)
      const { error: logError } = await supabase
        .from("tb_patient_logs")
        .insert({
          patient_name: patient.name,
          bed_number: patient.bed,
          positions: posStr,
          nurse_name: nurseName,
          image_positions: imageUrl,
          patient_id: patient.id,
          action_time: now,
        });

      if (logError) {
        console.warn(
          "Logging to tb_patient_logs failed, but record updated.",
          logError,
        );
      }

      await fetchRecords();
    } catch (error) {
      console.error("Error taking action:", error);
      return "Gagal menyimpan tindakan ke database.";
    } finally {
      isProcessing.value = false;
    }
  };

  const submitNewPatientForm = async (formPayload, imageFile) => {
    isProcessing.value = true;
    let errorMessage = null;

    try {
      const now = new Date().toISOString();
      const posStr = formPayload.positions.join(", ");
      let imageUrl = "";

      // 1. Insert/Upsert into master table (tb_patient_records)
      // Standardizing on "one record per bed" for the master table.
      // Use .select() to get the generated ID
      const { data, error: recordError } = await supabase
        .from("tb_patient_records")
        .insert({
          patient_name: formPayload.patientName,
          bed_number: formPayload.bedNumber,
          positions: posStr,
          nurse_name: formPayload.nurseName,
          status: "ok",
          is_urgent: false,
          last_repositioned_at: now,
        })
        .select();

      if (recordError) throw recordError;
      const newRecordId = data && data[0] ? data[0].id : null;

      // 2. Upload Image if exists
      if (imageFile && newRecordId) {
        const fileExt = imageFile.name.split(".").pop();
        const fileName = `${newRecordId}-${Date.now()}.${fileExt}`;
        const filePath = `actions/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("patient-logs")
          .upload(filePath, imageFile);

        if (uploadError) {
          console.error("Error uploading image:", uploadError);
        } else {
          const { data: publicUrlData } = supabase.storage
            .from("patient-logs")
            .getPublicUrl(filePath);
          imageUrl = publicUrlData.publicUrl;
        }
      }

      // 3. Insert into log table (tb_patient_logs)
      const { error: logError } = await supabase
        .from("tb_patient_logs")
        .insert({
          patient_name: formPayload.patientName,
          bed_number: formPayload.bedNumber,
          positions: posStr,
          nurse_name: formPayload.nurseName,
          patient_id: newRecordId, // ID from the master record
          image_positions: imageUrl,
          action_time: now,
        });

      if (logError) {
        console.warn("Initial logging to tb_patient_logs failed.", logError);
      }
    } catch (error) {
      console.error("Error saving to Supabase:", error);
      errorMessage = "Gagal menyimpan laporan ke database.";
    } finally {
      isProcessing.value = false;
    }
    return errorMessage;
  };

  const fetchLogs = async (patientId) => {
    const { data, error } = await supabase
      .from("tb_patient_logs")
      .select("*")
      .eq("patient_id", patientId)
      .order("action_time", { ascending: false });

    if (error) {
      console.error("Error fetching logs:", error);
      return [];
    }
    return data || [];
  };

  const fetchPatientById = async (patientId) => {
    const { data, error } = await supabase
      .from("tb_patient_records")
      .select("*")
      .eq("id", patientId)
      .single();

    if (error) {
      console.error("Error fetching patient:", error);
      return null;
    }
    return data;
  };

  const deletePatient = async (bedNumber, patientName) => {
    isProcessing.value = true;
    try {
      await supabase
        .from("tb_patient_records")
        .delete()
        .match({ bed_number: bedNumber, patient_name: patientName });

      await fetchRecords();
    } catch (error) {
      console.error("Error deleting patient:", error);
    } finally {
      isProcessing.value = false;
    }
  };

  // Developer Simulation
  const simulateAlert = async () => {
    const okPatient = allStructuredPatients.value.find(
      (p) => p.status === "ok",
    );
    if (okPatient) {
      await supabase
        .from("tb_patient_records")
        .update({ is_urgent: true, status: "warning" })
        .eq("id", okPatient.id);
      await fetchRecords();
    } else if (allStructuredPatients.value.length > 0) {
      await supabase
        .from("tb_patient_records")
        .update({ is_urgent: true, status: "warning" })
        .eq("id", allStructuredPatients.value[0].id);
      await fetchRecords();
    }
  };

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
    fetchLogs,
    fetchPatientById,
    deletePatient,
    simulateAlert,
  };
});
