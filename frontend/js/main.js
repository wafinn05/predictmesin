/**
 * PredictMaint — Frontend Logic
 * Handles: slider sync, real-time computed features, API call, result display, gauge animation
 */

'use strict';

// ── Type encoding map (same as sklearn LabelEncoder: H=0, L=1, M=2) ──
const TYPE_ENCODING = { H: 0, L: 1, M: 2 };

// ── Gauge constants ──
const GAUGE_RADIUS = 60;
const GAUGE_CIRCUMFERENCE = 2 * Math.PI * GAUGE_RADIUS; // 376.99

// DOM REFERENCES
const refs = {
  form: document.getElementById('prediction-form'),
  predictBtn: document.getElementById('predict-btn'),
  machineType: document.getElementById('machine-type'),

  // Sliders and number inputs
  airTemp: document.getElementById('air-temp'),
  airTempNum: document.getElementById('air-temp-num'),
  airTempDisplay: document.getElementById('air-temp-display'),

  procTemp: document.getElementById('proc-temp'),
  procTempNum: document.getElementById('proc-temp-num'),
  procTempDisplay: document.getElementById('proc-temp-display'),

  rpm: document.getElementById('rpm'),
  rpmNum: document.getElementById('rpm-num'),
  rpmDisplay: document.getElementById('rpm-display'),

  torque: document.getElementById('torque'),
  torqueNum: document.getElementById('torque-num'),
  torqueDisplay: document.getElementById('torque-display'),

  toolWear: document.getElementById('tool-wear'),
  toolWearNum: document.getElementById('tool-wear-num'),
  toolWearDisplay: document.getElementById('tool-wear-display'),

  // Computed feature displays
  cTempDiff: document.getElementById('c-temp-diff'),
  cPower: document.getElementById('c-power'),
  cTorqueWear: document.getElementById('c-torque-wear'),
  cTypeEnc: document.getElementById('c-type-enc'),

  // Result areas
  resultIdle: document.getElementById('result-idle'),
  resultActive: document.getElementById('result-active'),

  // Gauge
  gaugeArc: document.getElementById('gauge-arc'),
  gaugeValueText: document.getElementById('gauge-value-text'),

  // Status
  statusCard: document.getElementById('status-card-element'),
  statusLabel: document.getElementById('status-label'),

  // Probability bars
  barNormal: document.getElementById('bar-normal'),
  barFailure: document.getElementById('bar-failure'),
  pctNormal: document.getElementById('pct-normal'),
  pctFailure: document.getElementById('pct-failure'),
};

// HELPER: Slider <-> Number Input Sync
/**
 * Binds a range input, a number input, and an optional display span.
 * When either input changes, the other updates, and computed features refresh.
 */
function bindSlider(slider, numInput, displayEl, unit, decimals = 1) {
  const fmt = (v) => parseFloat(v).toFixed(decimals) + (unit ? ' ' + unit : '');

  const onSliderChange = () => {
    const v = parseFloat(slider.value);
    numInput.value = v.toFixed(decimals);
    if (displayEl) displayEl.textContent = fmt(v);
    updateComputedFeatures();
    updateSliderBackground(slider);
  };

  const onNumChange = () => {
    let v = parseFloat(numInput.value);
    const min = parseFloat(numInput.min);
    const max = parseFloat(numInput.max);
    if (isNaN(v)) return;
    v = Math.max(min, Math.min(max, v));
    numInput.value = v.toFixed(decimals);
    slider.value = v;
    if (displayEl) displayEl.textContent = fmt(v);
    updateComputedFeatures();
    updateSliderBackground(slider);
  };

  slider.addEventListener('input', onSliderChange);
  numInput.addEventListener('input', onNumChange);
  numInput.addEventListener('blur', onNumChange); // re-clamp on blur

  // Initialize background on page load
  updateSliderBackground(slider);
}

/**
 * Updates the gradient fill of a range slider based on its current value.
 */
function updateSliderBackground(slider) {
  const min = parseFloat(slider.min);
  const max = parseFloat(slider.max);
  const val = parseFloat(slider.value);
  const pct = ((val - min) / (max - min)) * 100;
  slider.style.background =
    `linear-gradient(to right, var(--blue) 0%, var(--blue) ${pct}%, var(--border-sm) ${pct}%, var(--border-sm) 100%)`;
}

// HELPER: Machine Type Selector
function initTypeSelector() {
  const buttons = document.querySelectorAll('.type-btn');
  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      buttons.forEach(b => {
        b.classList.remove('active');
        b.setAttribute('aria-pressed', 'false');
      });
      btn.classList.add('active');
      btn.setAttribute('aria-pressed', 'true');
      refs.machineType.value = btn.dataset.type;
      updateComputedFeatures();
    });
  });
}

// REAL-TIME COMPUTED FEATURES
function updateComputedFeatures() {
  const airTemp = parseFloat(refs.airTemp.value);
  const procTemp = parseFloat(refs.procTemp.value);
  const rpm = parseFloat(refs.rpm.value);
  const torque = parseFloat(refs.torque.value);
  const toolWear = parseFloat(refs.toolWear.value);
  const machType = refs.machineType.value;

  const tempDiff = procTemp - airTemp;
  const powerKW = (torque * rpm) / 9550;
  const torqueWear = torque * toolWear;
  const typeEncoded = TYPE_ENCODING[machType] ?? 2;

  setComputedValue(refs.cTempDiff, tempDiff.toFixed(2) + ' K');
  setComputedValue(refs.cPower, powerKW.toFixed(3) + ' kW');
  setComputedValue(refs.cTorqueWear, torqueWear.toFixed(2));
  setComputedValue(refs.cTypeEnc, `${machType} = ${typeEncoded}`);
}

/** Flash the value with a color change to signal update. */
function setComputedValue(el, value) {
  if (!el) return;
  if (el.textContent !== value) {
    el.textContent = value;
    el.classList.add('updated');
    setTimeout(() => el.classList.remove('updated'), 600);
  }
}

// GAUGE UPDATE
function updateGauge(pct) {
  const offset = GAUGE_CIRCUMFERENCE * (1 - pct / 100);
  refs.gaugeArc.style.strokeDashoffset = offset;
  refs.gaugeValueText.textContent = pct.toFixed(1) + '%';

  // Color gradient based on risk level
  let color;
  if (pct < 25) color = 'var(--accent-success)';
  else if (pct < 55) color = 'var(--accent-warning)';
  else color = 'var(--accent-danger)';
  refs.gaugeArc.style.stroke = color;
}

// ICONS


// DISPLAY PREDICTION RESULT
function displayResult(data) {
  const isFailure = data.prediction === 1;
  const failurePct = data.probability_failure;
  const normalPct = data.probability_normal;

  // Show active result, hide idle
  refs.resultIdle.classList.add('hidden');
  refs.resultActive.classList.remove('hidden');

  // Status label
  refs.statusLabel.textContent = isFailure ? 'FAILURE' : 'NORMAL';
  refs.statusLabel.className = 'status-label ' + (isFailure ? 'failure' : 'normal');

  // Status card background
  if (isFailure) {
    refs.statusCard.classList.add('is-failure');
    refs.statusCard.classList.remove('is-normal');
  } else {
    refs.statusCard.classList.add('is-normal');
    refs.statusCard.classList.remove('is-failure');
  }



  // Gauge — animate after small delay for visual impact
  setTimeout(() => updateGauge(failurePct), 80);

  // Probability bars
  refs.barNormal.style.width = normalPct + '%';
  refs.barFailure.style.width = failurePct + '%';
  refs.pctNormal.textContent = normalPct.toFixed(1) + '%';
  refs.pctFailure.textContent = failurePct.toFixed(1) + '%';
}

// ERROR TOAST
function showToast(message) {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = 'Error: ' + message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 4000);
}

// FORM SUBMIT: API CALL

// API URL.
const API_URL = "https://wafinn05-tubesuas.hf.space";

async function handleSubmit(e) {
  e.preventDefault();

  const btn = refs.predictBtn;
  btn.classList.add('loading');
  btn.disabled = true;
  btn.querySelector('.btn-text').textContent = 'Running...';

  const payload = {
    type: refs.machineType.value,
    air_temp: parseFloat(refs.airTemp.value),
    process_temp: parseFloat(refs.procTemp.value),
    rpm: parseFloat(refs.rpm.value),
    torque: parseFloat(refs.torque.value),
    tool_wear: parseFloat(refs.toolWear.value),
  };

  try {
    const response = await fetch(`${API_URL}/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.error || 'Prediction failed');
    }

    displayResult(data);

  } catch (err) {
    console.error(err);
    showToast(err.message || 'Network error. Make sure Flask server is running.');
  } finally {
    btn.classList.remove('loading');
    btn.disabled = false;
    btn.querySelector('.btn-text').textContent = 'Run Prediction';
  }
}

// PWA & FULLSCREEN LOGIC
function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('sw.js')
        .then(registration => {
          console.log('SW registered: ', registration.scope);
        })
        .catch(err => {
          console.log('SW registration failed: ', err);
        });
    });
  }
}

function initFullscreen() {
  const fsBtn = document.getElementById('fullscreen-btn');
  const iconEnter = document.getElementById('fs-icon-enter');
  const iconExit = document.getElementById('fs-icon-exit');

  if (!fsBtn) return;

  fsBtn.addEventListener('click', () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.log(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  });

  document.addEventListener('fullscreenchange', () => {
    if (document.fullscreenElement) {
      iconEnter.classList.add('hidden');
      iconExit.classList.remove('hidden');
    } else {
      iconEnter.classList.remove('hidden');
      iconExit.classList.add('hidden');
    }
  });
}

// INIT
function init() {
  // Bind all sliders
  bindSlider(refs.airTemp, refs.airTempNum, refs.airTempDisplay, 'K', 1);
  bindSlider(refs.procTemp, refs.procTempNum, refs.procTempDisplay, 'K', 1);
  bindSlider(refs.rpm, refs.rpmNum, refs.rpmDisplay, 'rpm', 0);
  bindSlider(refs.torque, refs.torqueNum, refs.torqueDisplay, 'Nm', 1);
  bindSlider(refs.toolWear, refs.toolWearNum, refs.toolWearDisplay, 'min', 0);

  // PWA & Fullscreen
  registerServiceWorker();
  initFullscreen();

  // Machine type buttons
  initTypeSelector();

  // Initial computed features render
  updateComputedFeatures();

  // Form submission
  refs.form.addEventListener('submit', handleSubmit);

  // Animate metric bars on load
  document.querySelectorAll('.metric-bar-fill').forEach(el => {
    const target = el.style.width;
    el.style.width = '0%';
    requestAnimationFrame(() => {
      setTimeout(() => { el.style.width = target; }, 200);
    });
  });
}

document.addEventListener('DOMContentLoaded', init);
