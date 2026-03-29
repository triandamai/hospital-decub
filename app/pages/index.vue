<template>
    <main class="form-wrapper">
        <!-- Processing Overlay -->
        <div v-if="isProcessing" class="loading-overlay">
            <div class="spinner"></div>
            <p>Menyimpan data...</p>
        </div>

        <Head>
            <Title>Monitoring Reposisi Pasien | RSUP Fatmawati</Title>
            <Meta
                name="description"
                content="Form monitoring reposisi pasien untuk pencegahan dekubitus"
            />
        </Head>

        <header class="form-header">
            <h1 class="form-title">Monitoring Reposisi Pasien</h1>
            <p class="form-subtitle">
                Pencegahan Dekubitus &bull; Teratai 2 Selatan - RSUP Fatmawati
            </p>

            <div class="header-actions">
                <NuxtLink to="/dashboard" class="outline-btn"
                    >Lihat Dashboard</NuxtLink
                >
            </div>
        </header>

        <form
            @submit.prevent="handleSubmit"
            class="glass-form"
            :class="{ submitted: isSubmitted }"
        >
            <div class="form-content" v-if="!isSubmitted">
                <div class="input-group">
                    <input
                        type="text"
                        id="patientName"
                        v-model="form.patientName"
                        required
                    />
                    <label for="patientName" class="floating-label"
                        >Nama Pasien <span class="required">*</span></label
                    >
                    <div class="focus-border"></div>
                </div>

                <div class="input-group">
                    <input
                        type="text"
                        id="bedNumber"
                        v-model="form.bedNumber"
                        required
                    />
                    <label for="bedNumber" class="floating-label"
                        >Kamar / Nomor Bed
                        <span class="required">*</span></label
                    >
                    <div class="focus-border"></div>
                </div>

                <div class="input-group checkbox-group">
                    <label class="group-label"
                        >Posisi Pasien <span class="required">*</span></label
                    >
                    <div class="checkboxes">
                        <label class="custom-checkbox">
                            <input
                                type="checkbox"
                                value="Miring Kanan"
                                v-model="form.positions"
                            />
                            <span class="checkmark"></span>
                            <span class="text">Miring Kanan</span>
                        </label>
                        <label class="custom-checkbox">
                            <input
                                type="checkbox"
                                value="Miring Kiri"
                                v-model="form.positions"
                            />
                            <span class="checkmark"></span>
                            <span class="text">Miring Kiri</span>
                        </label>
                        <label class="custom-checkbox">
                            <input
                                type="checkbox"
                                value="Telentang"
                                v-model="form.positions"
                            />
                            <span class="checkmark"></span>
                            <span class="text">Telentang</span>
                        </label>
                    </div>
                </div>

                <div class="input-group">
                    <input
                        type="text"
                        id="nurseName"
                        v-model="form.nurseName"
                        required
                    />
                    <label for="nurseName" class="floating-label"
                        >Nama Perawat <span class="required">*</span></label
                    >
                    <div class="focus-border"></div>
                </div>

                <div class="input-group">
                    <label class="group-label"
                        >Foto Bukti Tindakan
                        <span class="required">*</span></label
                    >
                    <div class="image-upload-wrapper">
                        <input
                            type="file"
                            id="patientImage"
                            accept="image/*"
                            @change="handleImageChange"
                            hidden
                            ref="imageInput"
                        />
                        <div
                            class="upload-area"
                            :class="{ 'has-image': imagePreview }"
                            @click="imageInput.click()"
                        >
                            <div
                                v-if="!imagePreview"
                                class="upload-placeholder"
                            >
                                <svg
                                    width="24"
                                    height="24"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    stroke-width="2"
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                >
                                    <rect
                                        x="3"
                                        y="3"
                                        width="18"
                                        height="18"
                                        rx="2"
                                        ry="2"
                                    ></rect>
                                    <circle cx="8.5" cy="8.5" r="1.5"></circle>
                                    <polyline
                                        points="21 15 16 10 5 21"
                                    ></polyline>
                                </svg>
                                <span>Ambil Foto / Pilih Gambar</span>
                            </div>
                            <img
                                v-else
                                :src="imagePreview"
                                class="preview-img"
                            />
                        </div>
                        <button
                            v-if="imagePreview"
                            type="button"
                            class="remove-img-btn"
                            @click.stop="clearImage"
                        >
                            Hapus & Ganti Foto
                        </button>
                    </div>
                </div>

                <button type="submit" class="submit-btn" :disabled="!isValid">
                    <span>Kirim Laporan</span>
                    <div class="btn-ripple"></div>
                </button>
            </div>

            <div class="success-message" v-else>
                <div class="success-icon">
                    <svg viewBox="0 0 24 24" fill="none" class="checkmark-svg">
                        <path
                            d="M5 13l4 4L19 7"
                            stroke="currentColor"
                            stroke-width="2"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                        />
                    </svg>
                </div>
                <h2>Laporan Berhasil Disimpan</h2>
                <p>Terima kasih atas laporan Anda.</p>
                <button type="button" class="reset-btn" @click="resetForm">
                    Kirim Laporan Baru
                </button>
                <br /><br />
                <NuxtLink to="/dashboard" class="outline-btn"
                    >Kembali ke Dashboard</NuxtLink
                >
            </div>
        </form>
    </main>
</template>

<script setup>
import { ref, reactive, computed } from "vue";
import { useRoute } from "vue-router";
import { storeToRefs } from "pinia";
import { usePatientStore } from "#imports";

const route = useRoute();
const patientStore = usePatientStore();

const { isProcessing } = storeToRefs(patientStore);
const isSubmitted = ref(false);

const form = reactive({
    patientName: route.query.patient || "",
    bedNumber: route.query.bed || "",
    positions: [],
    nurseName: "",
});

const imageFile = ref(null);
const imagePreview = ref(null);
const imageInput = ref(null);

const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
        imageFile.value = file;
        const reader = new FileReader();
        reader.onload = (event) => {
            imagePreview.value = event.target.result;
        };
        reader.readAsDataURL(file);
    }
};

const clearImage = () => {
    imageFile.value = null;
    imagePreview.value = null;
    if (imageInput.value) imageInput.value.value = "";
};

const isValid = computed(() => {
    return (
        form.patientName.trim() !== "" &&
        form.bedNumber.trim() !== "" &&
        form.positions.length > 0 &&
        form.nurseName.trim() !== "" &&
        imageFile.value !== null
    );
});

const handleSubmit = async () => {
    if (isValid.value && !isProcessing.value) {
        const errorMsg = await patientStore.submitNewPatientForm(
            form,
            imageFile.value,
        );
        if (errorMsg) {
            alert(errorMsg);
        } else {
            isSubmitted.value = true;
        }
    }
};

const resetForm = () => {
    form.patientName = "";
    form.bedNumber = "";
    form.positions = [];
    form.nurseName = "";
    clearImage();
    isSubmitted.value = false;
};
</script>

<style scoped>
/* Main Form Wrapper */
.form-wrapper {
    position: relative;
    z-index: 1;
    width: 100%;
    max-width: 650px;
    display: flex;
    flex-direction: column;
    gap: 2.5rem;
    margin: 0 auto;
}

.form-header {
    text-align: center;
    animation: slideDown 0.8s ease-out;
}

.form-title {
    font-size: 2.5rem;
    font-weight: 700;
    background: linear-gradient(135deg, #e0e7ff, #fbcfe8);
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
    margin-bottom: 0.5rem;
    line-height: 1.2;
}

.form-subtitle {
    color: var(--text-muted);
    font-size: 1.1rem;
    font-weight: 300;
    letter-spacing: 0.5px;
    margin-bottom: 1.5rem;
}

.header-actions {
    display: flex;
    justify-content: center;
}

.outline-btn {
    display: inline-block;
    padding: 0.6rem 1.5rem;
    background: transparent;
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 8px;
    color: var(--text-light);
    font-family: inherit;
    font-size: 0.95rem;
    font-weight: 500;
    text-decoration: none;
    cursor: pointer;
    transition: all 0.3s ease;
}

.outline-btn:hover {
    background: rgba(255, 255, 255, 0.1);
    border-color: rgba(255, 255, 255, 0.4);
    transform: translateY(-2px);
}

/* Glassmorphism Form */
.glass-form {
    background: var(--glass-bg);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1px solid var(--glass-border);
    border-radius: 24px;
    padding: 3rem;
    box-shadow: var(--glass-shadow);
    transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
    animation: fadeIn 1s ease-out;
}

.glass-form:hover {
    border-color: rgba(255, 255, 255, 0.15);
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.4);
}

.form-content {
    display: flex;
    flex-direction: column;
    gap: 2rem;
}

/* Input Styles */
.input-group {
    position: relative;
    margin-bottom: 0.5rem;
}

.input-group input[type="text"] {
    width: 100%;
    padding: 1.8rem 1.2rem 0.6rem;
    background: rgba(15, 23, 42, 0.5);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    color: var(--text-light);
    font-family: inherit;
    font-size: 1.05rem;
    transition: all 0.3s ease;
    outline: none;
}

.input-group input[type="text"]:focus {
    background: rgba(15, 23, 42, 0.8);
    border-color: var(--primary);
    box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.15);
}

.input-group .floating-label {
    position: absolute;
    left: 1.2rem;
    top: 50%;
    transform: translateY(-50%);
    color: var(--text-muted);
    font-size: 1.05rem;
    pointer-events: none;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.input-group input[type="text"]:focus ~ .floating-label,
.input-group input[type="text"]:valid ~ .floating-label {
    top: 1rem;
    font-size: 0.8rem;
    color: #c7d2fe;
}

.input-group
    input[type="text"]:not(:focus):not(:placeholder-shown):valid
    ~ .floating-label {
    color: var(--text-muted);
}

.required {
    color: var(--error);
    margin-left: 2px;
}

/* Image Upload Styles */
.image-upload-wrapper {
    display: flex;
    flex-direction: column;
    gap: 0.8rem;
    margin-top: 0.5rem;
}

.upload-area {
    width: 100%;
    aspect-ratio: 16 / 9;
    background: rgba(15, 23, 42, 0.5);
    border: 2px dashed rgba(255, 255, 255, 0.15);
    border-radius: 12px;
    display: flex;
    justify-content: center;
    align-items: center;
    cursor: pointer;
    overflow: hidden;
    transition: all 0.3s ease;
}

.upload-area:hover {
    border-color: var(--primary);
    background: rgba(15, 23, 42, 0.8);
}

.upload-area.has-image {
    border-style: solid;
    border-color: rgba(255, 255, 255, 0.1);
}

.upload-placeholder {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.8rem;
    color: var(--text-muted);
}

.upload-placeholder svg {
    width: 32px;
    height: 32px;
    opacity: 0.6;
}

.upload-placeholder span {
    font-size: 0.95rem;
}

.preview-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.remove-img-btn {
    padding: 0.6rem;
    background: rgba(239, 68, 68, 0.1);
    border: 1px solid rgba(239, 68, 68, 0.2);
    border-radius: 8px;
    color: #fca5a5;
    font-size: 0.9rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
}

.remove-img-btn:hover {
    background: rgba(239, 68, 68, 0.2);
    color: #ef4444;
}

/* Custom Checkboxes */
.checkbox-group {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.group-label {
    font-weight: 500;
    color: #e2e8f0;
    margin-bottom: 0.5rem;
    display: block;
}

.checkboxes {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    gap: 1rem;
}

.custom-checkbox {
    position: relative;
    display: flex;
    align-items: center;
    cursor: pointer;
    padding: 1rem;
    background: rgba(15, 23, 42, 0.5);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    transition: all 0.3s ease;
    overflow: hidden;
}

.custom-checkbox:hover {
    background: rgba(15, 23, 42, 0.8);
    border-color: rgba(255, 255, 255, 0.25);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.custom-checkbox input {
    position: absolute;
    opacity: 0;
    cursor: pointer;
    height: 0;
    width: 0;
}

.checkmark {
    position: relative;
    height: 24px;
    width: 24px;
    background-color: rgba(0, 0, 0, 0.2);
    border: 2px solid var(--text-muted);
    border-radius: 6px;
    margin-right: 12px;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    display: flex;
    justify-content: center;
    align-items: center;
}

.custom-checkbox input:checked ~ .checkmark {
    background-color: var(--primary);
    border-color: var(--primary);
    animation: popIn 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 0 10px rgba(99, 102, 241, 0.5);
}

.checkmark:after {
    content: "";
    position: absolute;
    display: none;
    left: 7px;
    top: 3px;
    width: 6px;
    height: 12px;
    border: solid white;
    border-width: 0 2px 2px 0;
    transform: rotate(45deg);
}

.custom-checkbox input:checked ~ .checkmark:after {
    display: block;
    animation: drawCheck 0.3s ease-out forwards;
}

.custom-checkbox input:checked ~ .text {
    color: white;
    font-weight: 500;
}

/* Submit Button */
.submit-btn {
    width: 100%;
    padding: 1.2rem;
    border: none;
    border-radius: 12px;
    background: linear-gradient(135deg, var(--primary), var(--secondary));
    color: white;
    font-family: inherit;
    font-size: 1.15rem;
    font-weight: 600;
    letter-spacing: 0.5px;
    cursor: pointer;
    position: relative;
    overflow: hidden;
    transition: all 0.3s ease;
    margin-top: 1rem;
    box-shadow: 0 10px 20px rgba(99, 102, 241, 0.3);
}

.submit-btn:disabled {
    background: linear-gradient(135deg, #475569, #334155);
    color: #94a3b8;
    cursor: not-allowed;
    box-shadow: none;
    opacity: 0.7;
}

.submit-btn:not(:disabled):hover {
    transform: translateY(-3px);
    box-shadow: 0 15px 30px rgba(236, 72, 153, 0.4);
}

.submit-btn span {
    position: relative;
    z-index: 1;
}

/* Success State */
.success-message {
    text-align: center;
    padding: 3rem 1rem;
    animation: scaleUp 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

.success-icon {
    width: 80px;
    height: 80px;
    margin: 0 auto 1.5rem;
    background: rgba(16, 185, 129, 0.1);
    border-radius: 50%;
    display: flex;
    justify-content: center;
    align-items: center;
    color: #10b981;
    box-shadow: 0 0 30px rgba(16, 185, 129, 0.2);
}

.checkmark-svg {
    width: 40px;
    height: 40px;
    stroke-dasharray: 100;
    stroke-dashoffset: 100;
    animation: drawStroke 0.8s ease-out forwards 0.2s;
}

.success-message h2 {
    font-size: 2.2rem;
    margin-bottom: 0.8rem;
    color: #34d399;
}

.success-message p {
    color: var(--text-muted);
    margin-bottom: 2.5rem;
    font-size: 1.1rem;
}

.reset-btn {
    padding: 1rem 2.5rem;
    background: transparent;
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 10px;
    color: var(--text-light);
    font-family: inherit;
    font-size: 1.05rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.3s ease;
}

.reset-btn:hover {
    background: rgba(255, 255, 255, 0.1);
    border-color: rgba(255, 255, 255, 0.4);
    transform: translateY(-2px);
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

/* Animations */
@keyframes slideDown {
    from {
        opacity: 0;
        transform: translateY(-40px);
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

@keyframes popIn {
    0% {
        transform: scale(0.8);
    }
    50% {
        transform: scale(1.15);
    }
    100% {
        transform: scale(1);
    }
}

@keyframes scaleUp {
    from {
        opacity: 0;
        transform: scale(0.9);
    }
    to {
        opacity: 1;
        transform: scale(1);
    }
}

@keyframes drawStroke {
    to {
        stroke-dashoffset: 0;
    }
}

@keyframes spin {
    to {
        transform: rotate(360deg);
    }
}

/* Responsive Styles */
@media (max-width: 640px) {
    .glass-form {
        padding: 2rem 1.5rem;
    }

    .form-title {
        font-size: 2rem;
    }

    .checkboxes {
        grid-template-columns: 1fr;
    }

    .input-group input[type="text"] {
        padding: 1.6rem 1rem 0.5rem;
    }
}
</style>
