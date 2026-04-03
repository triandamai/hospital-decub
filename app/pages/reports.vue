<template>
    <main class="reports-wrapper">
        <Head>
            <Title>Statistik | Monitoring Reposisi Pasien</Title>
        </Head>

        <header class="reports-header glass-panel">
            <div class="header-left">
                <NuxtLink to="/dashboard" class="back-btn">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <line x1="19" y1="12" x2="5" y2="12"></line>
                        <polyline points="12 19 5 12 12 5"></polyline>
                    </svg>
                </NuxtLink>
                <div>
                    <h1 class="reports-title">Laporan Statistik</h1>
                    <p class="reports-subtitle">Analisis Perawatan Pasien</p>
                </div>
            </div>
            <div class="header-actions">
                <div class="month-selector glass-panel">
                    <button @click="changeMonth(-1)" class="icon-btn">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <polyline points="15 18 9 12 15 6"></polyline>
                        </svg>
                    </button>
                    <span class="current-month">{{ monthLabel }}</span>
                    <button @click="changeMonth(1)" class="icon-btn">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <polyline points="9 18 15 12 9 6"></polyline>
                        </svg>
                    </button>
                </div>
                <button @click="exportToExcel" class="export-btn glass-panel" :disabled="filteredLogs.length === 0">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v4"></path>
                        <polyline points="7 10 12 15 17 10"></polyline>
                        <line x1="12" y1="15" x2="12" y2="3"></line>
                    </svg>
                    Simpan Excel
                </button>
            </div>
        </header>

        <div v-if="isLoading" class="loading-state">
            <div class="spinner"></div>
            <p>Memuat data statistik...</p>
        </div>

        <div v-else class="reports-content">
            <!-- Summary Grid -->
            <section class="summary-grid">
                <div class="stat-card glass-panel">
                    <div class="stat-icon actions">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                            <polyline points="14 2 14 8 20 8"></polyline>
                            <line x1="16" y1="13" x2="8" y2="13"></line>
                            <line x1="16" y1="17" x2="8" y2="17"></line>
                            <polyline points="10 9 9 9 8 9"></polyline>
                        </svg>
                    </div>
                    <div class="stat-info">
                        <span class="stat-label">Total Tindakan</span>
                        <h2 class="stat-value">{{ stats.totalActions }}</h2>
                    </div>
                </div>

                <div class="stat-card glass-panel">
                    <div class="stat-icon on-time">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                            <polyline points="22 4 12 14.01 9 11.01"></polyline>
                        </svg>
                    </div>
                    <div class="stat-info">
                        <span class="stat-label">Tepat Waktu</span>
                        <h2 class="stat-value">{{ stats.onTimeActions }}</h2>
                    </div>
                </div>

                <div class="stat-card glass-panel">
                    <div class="stat-icon delayed">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="12" y1="8" x2="12" y2="12"></line>
                            <line x1="12" y1="16" x2="12.01" y2="16"></line>
                        </svg>
                    </div>
                    <div class="stat-info">
                        <span class="stat-label">Terlambat</span>
                        <h2 class="stat-value">{{ stats.delayedActions }}</h2>
                    </div>
                </div>

                <div class="stat-card glass-panel">
                    <div class="stat-icon patients">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                            <circle cx="9" cy="7" r="4"></circle>
                            <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                        </svg>
                    </div>
                    <div class="stat-info">
                        <span class="stat-label">Pasien Aktif</span>
                        <h2 class="stat-value">{{ stats.activePatients }}</h2>
                    </div>
                </div>
            </section>

            <!-- Charts Section -->
            <section class="charts-grid">
                <div class="chart-container glass-panel main-chart">
                    <h3 class="chart-title">Volume Tindakan Harian</h3>
                    <div class="chart-wrapper">
                        <Bar v-if="barChartData" :data="barChartData" :options="barOptions" />
                    </div>
                </div>

                <div class="chart-container glass-panel side-chart">
                    <h3 class="chart-title">Efisiensi Reposisi</h3>
                    <div class="chart-wrapper">
                        <Pie v-if="pieChartData" :data="pieChartData" :options="pieOptions" />
                    </div>
                </div>
            </section>

            <!-- Table Section -->
            <section class="log-section glass-panel">
                <h3 class="section-title">Ringkasan Per Pasien</h3>
                <div class="table-responsive">
                    <table class="report-table">
                        <thead>
                            <tr>
                                <th>Nama Pasien</th>
                                <th>Bed</th>
                                <th>Total Tindakan</th>
                                <th>Terlambat</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="p in patientSummary" :key="p.id">
                                <td>{{ p.name }}</td>
                                <td><span class="bed-badge">Bed {{ p.bed }}</span></td>
                                <td>{{ p.total }}</td>
                                <td :class="{ 'text-danger': p.delayed > 0 }">{{ p.delayed }}</td>
                                <td>
                                    <span class="status-chip" :class="p.delayRate > 30 ? 'warning' : 'success'">
                                        {{ p.delayRate > 30 ? 'Perlu Perhatian' : 'Sesuai Prosedur' }}
                                    </span>
                                </td>
                            </tr>
                            <tr v-if="patientSummary.length === 0">
                                <td colspan="5" class="empty-row">Tidak ada data untuk bulan ini.</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    </main>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { usePatientStore } from '#imports';
import { Bar, Pie } from 'vue-chartjs';
import * as XLSX from 'xlsx';
import {
    Chart as ChartJS,
    Title,
    Tooltip,
    Legend,
    BarElement,
    CategoryScale,
    LinearScale,
    ArcElement
} from 'chart.js';

ChartJS.register(
    Title,
    Tooltip,
    Legend,
    BarElement,
    CategoryScale,
    LinearScale,
    ArcElement
);

const patientStore = usePatientStore();
const isLoading = ref(true);
const selectedDate = ref(new Date());
const allLogs = ref([]);
const activePatientsList = ref([]);

const monthLabel = computed(() => {
    return selectedDate.value.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
});

const changeMonth = (delta) => {
    const d = new Date(selectedDate.value);
    d.setMonth(d.getMonth() + delta);
    selectedDate.value = d;
};

const fetchData = async () => {
    isLoading.value = true;
    try {
        allLogs.value = await patientStore.fetchAllLogs();
        activePatientsList.value = patientStore.allStructuredPatients;
    } catch (e) {
        console.error("Error loading report data:", e);
    } finally {
        isLoading.value = false;
    }
};

onMounted(fetchData);

// Data Processing
const filteredLogs = computed(() => {
    const year = selectedDate.value.getFullYear();
    const month = selectedDate.value.getMonth();
    
    return allLogs.value.filter(log => {
        const logDate = new Date(log.action_time);
        return logDate.getFullYear() === year && logDate.getMonth() === month;
    });
});

const stats = computed(() => {
    const total = filteredLogs.value.length;
    const delayed = filteredLogs.value.filter(l => l.is_delayed).length;
    
    return {
        totalActions: total,
        delayedActions: delayed,
        onTimeActions: total - delayed,
        activePatients: activePatientsList.value.length
    };
});

const patientSummary = computed(() => {
    const summary = {};
    
    filteredLogs.value.forEach(log => {
        const pid = log.patient_id;
        if (!summary[pid]) {
            summary[pid] = {
                id: pid,
                name: log.patient_name,
                bed: log.bed_number,
                total: 0,
                delayed: 0
            };
        }
        summary[pid].total++;
        if (log.is_delayed) summary[pid].delayed++;
    });

    return Object.values(summary).map(p => ({
        ...p,
        delayRate: p.total > 0 ? (p.delayed / p.total) * 100 : 0
    })).sort((a, b) => b.total - a.total);
});

// Excel Export Logic
const exportToExcel = () => {
    try {
        const wb = XLSX.utils.book_new();

        // 1. Summary Sheet
        const summaryData = [
            { Item: "Bulan", Value: monthLabel.value },
            { Item: "Total Tindakan", Value: stats.value.totalActions },
            { Item: "Tepat Waktu", Value: stats.value.onTimeActions },
            { Item: "Terlambat", Value: stats.value.delayedActions },
            { Item: "Tingkat Kepatuhan", Value: stats.value.totalActions > 0 
                ? ((stats.value.onTimeActions / stats.value.totalActions) * 100).toFixed(1) + "%" 
                : "0%" 
            },
            { Item: "Total Pasien", Value: stats.value.activePatients }
        ];
        const wsSummary = XLSX.utils.json_to_sheet(summaryData);
        XLSX.utils.book_append_sheet(wb, wsSummary, "Ringkasan");

        // 2. Performance Sheet
        const performanceData = patientSummary.value.map(p => ({
            "Nama Pasien": p.name,
            "Bed": p.bed,
            "Total Tindakan": p.total,
            "Terlambat": p.delayed,
            "Tingkat Keterlambatan": p.delayRate.toFixed(1) + "%",
            "Keterangan": p.delayRate > 30 ? "Perlu Perhatian" : "Sesuai Prosedur"
        }));
        const wsPerformance = XLSX.utils.json_to_sheet(performanceData);
        XLSX.utils.book_append_sheet(wb, wsPerformance, "Performa Pasien");

        // 3. Raw Logs Sheet
        const logsData = filteredLogs.value.map(log => ({
            "Waktu": new Date(log.action_time).toLocaleString('id-ID'),
            "Nama Pasien": log.patient_name,
            "Bed": log.bed_number,
            "Perawat": log.nurse_name,
            "Posisi": log.positions,
            "Terlambat": log.is_delayed ? "Ya" : "Tidak"
        }));
        const wsLogs = XLSX.utils.json_to_sheet(logsData);
        XLSX.utils.book_append_sheet(wb, wsLogs, "Log Tindakan");

        // Generate filename: Laporan_Reposisi_April_2024.xlsx
        const filename = `Laporan_Reposisi_${monthLabel.value.replace(' ', '_')}.xlsx`;
        
        XLSX.writeFile(wb, filename);
    } catch (error) {
        console.error("Export factor failed:", error);
        alert("Gagal mengekspor data ke Excel.");
    }
};

// Chart Data: Bar (Daily Volume)
const barChartData = computed(() => {
    const daysInMonth = new Date(selectedDate.value.getFullYear(), selectedDate.value.getMonth() + 1, 0).getDate();
    const labels = Array.from({ length: daysInMonth }, (_, i) => (i + 1).toString());
    const dataOnTime = new Array(daysInMonth).fill(0);
    const dataDelayed = new Array(daysInMonth).fill(0);

    filteredLogs.value.forEach(log => {
        const day = new Date(log.action_time).getDate();
        if (log.is_delayed) {
            dataDelayed[day - 1]++;
        } else {
            dataOnTime[day - 1]++;
        }
    });

    return {
        labels,
        datasets: [
            {
                label: 'Tepat Waktu',
                backgroundColor: '#10b981',
                data: dataOnTime,
                borderRadius: 4,
            },
            {
                label: 'Terlambat',
                backgroundColor: '#fb7185',
                data: dataDelayed,
                borderRadius: 4,
            }
        ]
    };
});

const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: {
            position: 'bottom',
            labels: { color: '#94a3b8', font: { family: 'Outfit' } }
        }
    },
    scales: {
        x: {
            stacked: true,
            grid: { display: false },
            ticks: { color: '#94a3b8' }
        },
        y: {
            stacked: true,
            grid: { color: 'rgba(255, 255, 255, 0.05)' },
            ticks: { color: '#94a3b8' }
        }
    }
};

// Chart Data: Pie (Efficiency)
const pieChartData = computed(() => {
    return {
        labels: ['Tepat Waktu', 'Terlambat'],
        datasets: [
            {
                backgroundColor: ['#10b981', '#fb7185'],
                borderColor: 'transparent',
                data: [stats.value.onTimeActions, stats.value.delayedActions],
                hoverOffset: 10
            }
        ]
    };
});

const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: {
            position: 'bottom',
            labels: { color: '#94a3b8', font: { family: 'Outfit', padding: 20 } }
        }
    }
};
</script>

<style scoped>
.reports-wrapper {
    width: 100%;
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem;
    color: var(--text-light);
    display: flex;
    flex-direction: column;
    gap: 2rem;
}

.reports-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.5rem 2rem;
}

.header-left {
    display: flex;
    align-items: center;
    gap: 1.5rem;
}

.back-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid var(--glass-border);
    border-radius: 12px;
    color: var(--text-light);
    transition: all 0.3s ease;
}

.back-btn:hover {
    background: rgba(255, 255, 255, 0.1);
    transform: translateX(-3px);
}

.reports-title {
    font-size: 1.8rem;
    font-weight: 700;
}

.reports-subtitle {
    color: var(--text-muted);
    font-size: 1rem;
}

.header-actions {
    display: flex;
    align-items: center;
    gap: 1rem;
}

.month-selector {
    display: flex;
    align-items: center;
    padding: 0.5rem 1rem;
    gap: 1.5rem;
}

.export-btn {
    display: flex;
    align-items: center;
    gap: 0.8rem;
    padding: 0.6rem 1.2rem;
    background: var(--primary);
    border: none;
    border-radius: 12px;
    color: white;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
}

.export-btn:hover:not(:disabled) {
    background: var(--primary-hover);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
}

.export-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.current-month {
    font-weight: 600;
    min-width: 150px;
    text-align: center;
}

.icon-btn {
    background: none;
    border: none;
    color: var(--text-muted);
    cursor: pointer;
    transition: color 0.2s;
    display: flex;
    align-items: center;
}

.icon-btn:hover {
    color: var(--text-light);
}

/* Summary Grid */
.summary-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    gap: 1.5rem;
}

.stat-card {
    padding: 1.5rem;
    display: flex;
    align-items: center;
    gap: 1.5rem;
    transition: transform 0.3s ease;
}

.stat-card:hover {
    transform: translateY(-5px);
}

.stat-icon {
    width: 50px;
    height: 50px;
    border-radius: 15px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.stat-icon.actions { background: rgba(99, 102, 241, 0.15); color: #818cf8; }
.stat-icon.on-time { background: rgba(16, 185, 129, 0.15); color: #34d399; }
.stat-icon.delayed { background: rgba(251, 113, 133, 0.15); color: #fb7185; }
.stat-icon.patients { background: rgba(59, 130, 246, 0.15); color: #60a5fa; }

.stat-info {
    display: flex;
    flex-direction: column;
}

.stat-label {
    font-size: 0.9rem;
    color: var(--text-muted);
}

.stat-value {
    font-size: 1.8rem;
    font-weight: 700;
}

/* Charts Grid */
.charts-grid {
    display: grid;
    grid-template-columns: 1fr 350px;
    gap: 1.5rem;
}

.chart-container {
    padding: 2rem;
    display: flex;
    flex-direction: column;
}

.chart-title {
    font-size: 1.2rem;
    font-weight: 600;
    margin-bottom: 2rem;
}

.chart-wrapper {
    flex: 1;
    min-height: 300px;
    position: relative;
}

/* Table Section */
.log-section {
    padding: 2rem;
}

.section-title {
    margin-bottom: 1.5rem;
}

.table-responsive {
    overflow-x: auto;
}

.report-table {
    width: 100%;
    border-collapse: collapse;
    text-align: left;
}

.report-table th {
    padding: 1rem;
    color: var(--text-muted);
    font-weight: 500;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.report-table td {
    padding: 1.2rem 1rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.bed-badge {
    background: rgba(255, 255, 255, 0.05);
    padding: 0.3rem 0.6rem;
    border-radius: 6px;
    font-size: 0.9rem;
}

.status-chip {
    padding: 0.4rem 0.8rem;
    border-radius: 20px;
    font-size: 0.85rem;
    font-weight: 500;
}

.status-chip.success { background: rgba(16, 185, 129, 0.1); color: #34d399; }
.status-chip.warning { background: rgba(245, 158, 11, 0.1); color: #fbbf24; }

.text-danger { color: #f87171; }

.empty-row {
    text-align: center;
    color: var(--text-muted);
    padding: 3rem !important;
}

.loading-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 5rem;
    gap: 1.5rem;
}

.spinner {
    width: 40px;
    height: 40px;
    border: 3px solid rgba(255, 255, 255, 0.1);
    border-top-color: var(--primary);
    border-radius: 50%;
    animation: spin 1s linear infinite;
}

@keyframes spin {
    to { transform: rotate(360deg); }
}

@media (max-width: 1024px) {
    .charts-grid {
        grid-template-columns: 1fr;
    }
}

@media (max-width: 768px) {
    .reports-wrapper {
        padding: 1rem;
        gap: 1.5rem;
    }

    .reports-header {
        padding: 1.2rem;
        flex-direction: column;
        align-items: stretch;
        gap: 1.5rem;
    }

    .header-actions {
        flex-direction: column;
        width: 100%;
        gap: 0.8rem;
    }

    .export-btn {
        width: 100%;
        justify-content: center;
    }

    .header-left {
        gap: 1rem;
    }

    .reports-title {
        font-size: 1.5rem;
    }

    .month-selector {
        width: 100%;
        justify-content: space-between;
        padding: 0.8rem;
    }

    .current-month {
        min-width: auto;
        flex: 1;
    }

    .chart-container {
        padding: 1.2rem;
    }

    .main-chart {
        overflow-x: auto;
    }

    .main-chart .chart-wrapper {
        min-width: 600px;
    }

    .summary-grid {
        grid-template-columns: 1fr;
    }

    .log-section {
        padding: 1.2rem;
    }
}

@media (max-width: 480px) {
    .stat-card {
        padding: 1.2rem;
        gap: 1rem;
    }

    .stat-value {
        font-size: 1.5rem;
    }
}
</style>
