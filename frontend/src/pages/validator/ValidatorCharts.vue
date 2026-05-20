<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue';
import { Chart, registerables } from 'chart.js';
import zoomPlugin from 'chartjs-plugin-zoom';
import api from '@/api';

Chart.register(...registerables, zoomPlugin);

interface WeekStat {
  label: string; // ISO Monday date e.g. "2024-12-23"
  approvedCoverage: number;
  activeCoverage: number;
  submissions: number;
}

interface Stats {
  statusCounts: { Pending: number; Approved: number; Rejected: number };
  weeks: WeekStat[];
}

const stats = ref<Stats | null>(null);
const loading = ref(true);

const coverageCanvas = ref<HTMLCanvasElement | null>(null);
const donutCanvas = ref<HTMLCanvasElement | null>(null);
const submissionsCanvas = ref<HTMLCanvasElement | null>(null);

let chartInstances: Chart[] = [];

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

function isoToTs(iso: string): number {
  return new Date(iso + 'T00:00:00').getTime();
}

function currentMondayISO(): string {
  const d = new Date();
  const day = d.getDay();
  d.setDate(d.getDate() + (day === 0 ? -6 : 1 - day));
  return d.toISOString().slice(0, 10);
}

// Format a Unix timestamp as "23 Dec '24"
function fmtTs(value: number | string): string {
  return new Date(value as number).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: '2-digit',
  });
}

function createCharts(s: Stats) {
  const currentTs = isoToTs(currentMondayISO());

  // Initial visible window: 9 weeks before → 4 weeks ahead
  const initialMin = currentTs - 9 * WEEK_MS;
  const initialMax = currentTs + 4 * WEEK_MS;

  // Shared x-scale: linear + timestamp → smooth pan
  const xScale = {
    type: 'linear' as const,
    grid: { display: false },
    min: initialMin,
    max: initialMax,
    ticks: {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      callback: (v: any) => fmtTs(v),
      maxTicksLimit: 8,
    },
  };

  const panOptions = { pan: { enabled: true, mode: 'x' as const } };

  const tooltipTitle = {
    callbacks: {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      title: (items: any[]) => fmtTs(items[0].parsed.x),
    },
  };

  // --- Coverage chart ---
  if (coverageCanvas.value) {
    chartInstances.push(
      new Chart(coverageCanvas.value, {
        type: 'line',
        data: {
          datasets: [
            {
              label: 'Approved',
              data: s.weeks.map((w) => ({ x: isoToTs(w.label), y: w.approvedCoverage })),
              borderColor: '#1ab394',
              backgroundColor: 'rgba(26,179,148,0.15)',
              fill: true,
              tension: 0.4,
              pointRadius: 0,
              pointHoverRadius: 5,
              borderWidth: 2,
            },
            {
              label: 'Approved + Pending',
              data: s.weeks.map((w) => ({ x: isoToTs(w.label), y: w.activeCoverage })),
              borderColor: '#74c0d8',
              backgroundColor: 'rgba(116,192,216,0.12)',
              fill: true,
              tension: 0.4,
              pointRadius: 0,
              pointHoverRadius: 5,
              borderWidth: 2,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: { mode: 'index', intersect: false },
          plugins: { legend: { position: 'top' }, zoom: panOptions, tooltip: tooltipTitle },
          scales: { x: xScale, y: { beginAtZero: true, ticks: { stepSize: 1 } } },
        },
      }),
    );
  }

  // --- Donut chart ---
  if (donutCanvas.value) {
    const { Pending, Approved, Rejected } = s.statusCounts;
    chartInstances.push(
      new Chart(donutCanvas.value, {
        type: 'doughnut',
        data: {
          labels: ['Pending', 'Approved', 'Rejected'],
          datasets: [
            {
              data: [Pending, Approved, Rejected],
              backgroundColor: ['#f0ad4e', '#1ab394', '#e86464'],
              borderWidth: 0,
              hoverOffset: 10,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: '55%',
          plugins: {
            legend: {
              position: 'top',
              labels: { padding: 20, boxWidth: 14, boxHeight: 14, font: { size: 13 } },
            },
          },
        },
      }),
    );
  }

  // --- Submissions chart ---
  if (submissionsCanvas.value) {
    chartInstances.push(
      new Chart(submissionsCanvas.value, {
        type: 'line',
        data: {
          datasets: [
            {
              label: 'Submitted',
              data: s.weeks.map((w) => ({ x: isoToTs(w.label), y: w.submissions })),
              borderColor: '#5b8de8',
              backgroundColor: 'rgba(91,141,232,0.12)',
              fill: true,
              tension: 0.4,
              pointRadius: 0,
              pointHoverRadius: 5,
              borderWidth: 2,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: { mode: 'index', intersect: false },
          plugins: { legend: { position: 'top' }, zoom: panOptions, tooltip: tooltipTitle },
          scales: { x: xScale, y: { beginAtZero: true, ticks: { stepSize: 1 } } },
        },
      }),
    );
  }
}

onMounted(async () => {
  try {
    const res = await api.get<{ success: true; data: Stats }>('/vacations/stats');
    stats.value = res.data.data;
  } finally {
    loading.value = false;
  }
  await nextTick();
  if (stats.value) createCharts(stats.value);
});

onUnmounted(() => {
  chartInstances.forEach((c) => c.destroy());
  chartInstances = [];
});

const totalRequests = () => {
  if (!stats.value) return 0;
  const { Pending, Approved, Rejected } = stats.value.statusCounts;
  return Pending + Approved + Rejected;
};
</script>

<template>
  <div>
    <h1 class="page-title">Statistics & Charts</h1>

    <div v-if="loading" class="loading">Loading…</div>

    <template v-else-if="stats">
      <!-- Summary chips -->
      <div class="summary-row">
        <div class="summary-chip">
          <span class="chip-value">{{ totalRequests() }}</span>
          <span class="chip-label">Total requests</span>
        </div>
        <div class="summary-chip chip-approved">
          <span class="chip-value">{{ stats.statusCounts.Approved }}</span>
          <span class="chip-label">Approved</span>
        </div>
        <div class="summary-chip chip-pending">
          <span class="chip-value">{{ stats.statusCounts.Pending }}</span>
          <span class="chip-label">Pending</span>
        </div>
        <div class="summary-chip chip-rejected">
          <span class="chip-value">{{ stats.statusCounts.Rejected }}</span>
          <span class="chip-label">Rejected</span>
        </div>
      </div>

      <!-- Coverage area chart -->
      <div class="chart-card">
        <div class="chart-card-header">
          <span class="chart-title">Users on vacation per week</span>
          <span class="chart-hint"><i class="pi pi-arrows-h" /> drag to pan</span>
        </div>
        <div class="chart-body chart-body--large">
          <canvas ref="coverageCanvas" />
        </div>
      </div>

      <!-- Bottom row: donut + submissions -->
      <div class="bottom-row">
        <div class="chart-card chart-card--donut">
          <div class="chart-card-header">
            <span class="chart-title">Request breakdown</span>
          </div>
          <div class="chart-body chart-body--donut">
            <canvas ref="donutCanvas" />
          </div>
        </div>

        <div class="chart-card chart-card--submissions">
          <div class="chart-card-header">
            <span class="chart-title">Requests submitted per week</span>
            <span class="chart-hint"><i class="pi pi-arrows-h" /> drag to pan</span>
          </div>
          <div class="chart-body chart-body--submissions">
            <canvas ref="submissionsCanvas" />
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.page-title {
  font-size: 1.4rem;
  font-weight: 600;
  color: #333;
  margin-bottom: 1.25rem;
}

.loading {
  color: #888;
  padding: 2rem 0;
}

.summary-row {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.25rem;
}

.summary-chip {
  flex: 1;
  background: #fff;
  border-radius: 8px;
  padding: 1rem 1.25rem;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
  border-left: 4px solid #ddd;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.chip-approved { border-left-color: #1ab394; }
.chip-pending  { border-left-color: #f0ad4e; }
.chip-rejected { border-left-color: #e86464; }

.chip-value {
  font-size: 1.6rem;
  font-weight: 700;
  color: #333;
  line-height: 1;
}

.chip-label {
  font-size: 0.78rem;
  color: #999;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.chart-card {
  background: #fff;
  border-radius: 8px;
  padding: 1.25rem 1.5rem;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
  margin-bottom: 1.25rem;
}

.chart-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
}

.chart-title {
  font-size: 0.95rem;
  font-weight: 600;
  color: #333;
}

.chart-hint {
  font-size: 0.75rem;
  color: #bbb;
  display: flex;
  align-items: center;
  gap: 0.3rem;
}

.chart-body { position: relative; }

.chart-body--large       { height: 280px; }
.chart-body--donut       { height: 240px; }
.chart-body--submissions { height: 240px; }

.bottom-row {
  display: flex;
  gap: 1.25rem;
  align-items: flex-start;
}

.chart-card--donut {
  flex: 0 0 280px;
  margin-bottom: 0;
}

.chart-card--submissions {
  flex: 1;
  margin-bottom: 0;
}
</style>
