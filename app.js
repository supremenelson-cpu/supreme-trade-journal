const STORAGE_KEY = "supremeTradeJournalMarkII";
let trades = loadTrades();
let editingTradeId = null;
const pageCopy = {
  dashboard: {
    title: "Dashboard",
    subtitle: "Track disciplined reps, not just profits.",
  },
  "new-trade": {
    title: "New Trade",
    subtitle: "Capture the full decision-making process.",
  },
  "trade-review": {
    title: "Trade Review",
    subtitle: "Study the story behind every rep.",
  },
  analytics: {
    title: "Analytics",
    subtitle: "Turn repetitions into evidence.",
  },
};
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("trade-date").valueAsDate = new Date();
  setupNavigation();
  setupTradeForm();
  setupSearch();
  setupExport();
  renderEverything();
});
function loadTrades() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}
function saveTrades() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(trades));
}
function setupNavigation() {
  document.querySelectorAll(".nav-button").forEach((button) =>
    button.addEventListener("click", () => {
      const target = button.dataset.view;
      document
        .querySelectorAll(".nav-button")
        .forEach((item) => item.classList.remove("active"));
      document
        .querySelectorAll(".view")
        .forEach((view) => view.classList.remove("active"));
      button.classList.add("active");
      document.getElementById(target).classList.add("active");
      document.getElementById("page-title").textContent =
        pageCopy[target].title;
      document.getElementById("page-subtitle").textContent =
        pageCopy[target].subtitle;
      if (target === "analytics") {
  requestAnimationFrame(() => {
    drawPnlChart();
    drawEquityCurve();
  });
}
    }),
  );
}
function setupTradeForm() {
  const form = document.getElementById("trade-form");
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const entry = num("entry-price"),
      exit = num("exit-price"),
      contracts = num("contracts"),
      direction = val("direction");
    const pnlPerContract =
      (direction === "Call" ? exit - entry : entry - exit) * 100;
    const imageInput = document.getElementById("trade-image");

let chartImageId = null;

if (editingTradeId !== null) {
  const existingTrade = trades.find(
    (item) => item.id === editingTradeId
  );

  chartImageId = existingTrade?.chartImageId || null;
}

if (imageInput.files.length > 0) {
  chartImageId = await saveTradeImage(
    imageInput.files[0]
  );
}  
    const trade = {
     id: editingTradeId ?? Date.now(), 
      date: val("trade-date"),
      ticker: val("ticker").toUpperCase(),
     chartImageId: chartImageId, 
      direction,
      strategy: val("strategy"),
      entryPrice: entry,
      exitPrice: exit,
      contracts,
      setupGrade: val("setup-grade"),
      decisionQuality: num("decision-quality"),
      emotionalControl: num("emotional-control"),
      pnl: pnlPerContract * contracts,
      outcome:
        pnlPerContract > 0 ? "Win" : pnlPerContract < 0 ? "Loss" : "Breakeven",
      context: {
        dailyAligned: chk("daily-aligned"),
        fourHourAligned: chk("four-hour-aligned"),
        oneHourAligned: chk("one-hour-aligned"),
        fifteenMinuteAligned: chk("fifteen-minute-aligned"),
        supportResistanceChecked: chk("support-resistance-checked"),
        waitedForEntry: chk("waited-for-entry"),
      },
      thesis: val("trade-thesis"),
      lesson: val("trade-lesson"),
      tags: val("trade-tags")
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
    };
  if (editingTradeId !== null) {
  const tradeIndex = trades.findIndex(
    (item) => item.id === editingTradeId
  );

  if (tradeIndex !== -1) {
    trades[tradeIndex] = trade;
  }

  editingTradeId = null;

  form.querySelector(
    'button[type="submit"]'
  ).textContent = "Save Trade";
} else {
  trades.unshift(trade);
}
    saveTrades();
    form.reset();
    document.getElementById("trade-date").valueAsDate = new Date();
    renderEverything();
    showToast("Trade saved for " + trade.ticker);
    document.querySelector('[data-view="dashboard"]').click();
  });
}
function setupSearch() {
  document
    .getElementById("trade-search")
    .addEventListener("input", (e) => renderTradeReview(e.target.value));
}
function setupExport() {
  document.getElementById("export-data").addEventListener("click", () => {
    const file = new Blob([JSON.stringify(trades, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(file);
    const link = document.createElement("a");
    link.href = url;
    link.download = "supreme-trade-journal-mark-ii.json";
    link.click();
    URL.revokeObjectURL(url);
  });
}
function renderEverything() {
  renderDashboard();
  renderTradeReview();
  renderAnalytics();
}
function renderDashboard() {
  const total = trades.length,
    closed = trades.filter((t) => t.outcome !== "Breakeven"),
    wins = trades.filter((t) => t.outcome === "Win").length,
    winRate = closed.length ? (wins / closed.length) * 100 : 0,
    net = trades.reduce((s, t) => s + t.pnl, 0),
    avgDecision = average(trades.map((t) => t.decisionQuality));
  setText("total-trades", total);
  setText("win-rate", winRate.toFixed(1) + "%");
  setText("net-pnl", currency(net));
  setText("decision-score", avgDecision.toFixed(1));
  const pnlEl = document.getElementById("net-pnl");
  pnlEl.classList.toggle("positive", net > 0);
  pnlEl.classList.toggle("negative", net < 0);
  setText("rep-number", Math.min(total, 100) + " / 100");
  document.getElementById("progress-fill").style.width =
    Math.min(total, 100) + "%";
  let message = "Log your first trade to begin.";
  if (total > 0 && total < 25)
    message = "Foundation phase: focus on clean execution.";
  else if (total < 50 && total >= 25)
    message = "Patterns are beginning to emerge.";
  else if (total < 75 && total >= 50)
    message = "Protect process quality as confidence grows.";
  else if (total < 100 && total >= 75)
    message = "Finish the dataset without forcing trades.";
  else if (total >= 100) message = "100 reps complete. Review before scaling.";
  setText("progress-message", message);
  renderRecentTrades();
}
function renderRecentTrades() {
  const c = document.getElementById("recent-trades");
  if (!trades.length) {
    c.innerHTML = '<div class="empty-state">No trades logged yet.</div>';
    return;
  }
  c.innerHTML = `<table class="trade-table"><thead><tr><th>Date</th><th>Ticker</th><th>Strategy</th><th>Grade</th><th>P&amp;L</th></tr></thead><tbody>${trades
    .slice(0, 5)
    .map(
      (t) =>
        `<tr><td>${esc(t.date)}</td><td><strong>${esc(t.ticker)}</strong></td><td>${esc(t.strategy)}</td><td>${esc(t.setupGrade)}</td><td class="${t.pnl > 0 ? "positive" : t.pnl < 0 ? "negative" : ""}">${currency(t.pnl)}</td></tr>`,
    )
    .join("")}</tbody></table>`;
}
async function renderTradeReview(search = "") {
  const c = document.getElementById("trade-review-list"),
    q = search.trim().toLowerCase(),
    filtered = trades.filter((t) =>
      [
        t.ticker,
        t.strategy,
        t.direction,
        t.setupGrade,
        t.thesis,
        t.lesson,
        ...(t.tags || []),
      ]
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  if (!filtered.length) {
    c.innerHTML = '<div class="empty-state">No matching trades.</div>';
    return;
  }
  c.innerHTML = filtered
    .map(
      (t) =>
        `<article class="review-card"><div class="review-card-header"><div><h4>${esc(t.ticker)} — ${esc(t.direction)} — ${esc(t.strategy)}</h4><p>${esc(t.date)} · ${esc(t.outcome)} · ${currency(t.pnl)}</p></div><strong class="${t.pnl > 0 ? "positive" : t.pnl < 0 ? "negative" : ""}">${esc(t.setupGrade)} setup</strong></div><div class="chip-row"><span class="chip">Decision ${t.decisionQuality}/10</span><span class="chip">Emotion ${t.emotionalControl}/10</span>${(t.tags || []).map((tag) => `<span class="chip">${esc(tag)}</span>`).join("")}</div><p><strong>Thesis:</strong> ${esc(t.thesis)}</p><p><strong>Lesson:</strong> ${esc(t.lesson)}</p><div class="review-actions">

    <button class="secondary-button" onclick="openTradeModal(${t.id})">
  View Details
</button>
      <button class="secondary-button"
        onclick="editTrade(${t.id})">
        Edit
    </button>

    <button class="danger-button"
        onclick="deleteTrade(${t.id})">
        Delete
    </button>

</div></article>`,
    )
    .join("");
    const reviewCards = c.querySelectorAll(".review-card");

await Promise.all(
  filtered.map(async (trade, index) => {
    if (!trade.chartImageId) {
      return;
    }

    const imageRecord = await getTradeImage(
      trade.chartImageId
    );

    if (!imageRecord?.file) {
      return;
    }

    const imageUrl = URL.createObjectURL(
      imageRecord.file
    );

    const imageWrapper =
      document.createElement("div");

    imageWrapper.className =
      "trade-chart-wrapper";

    const image = document.createElement("img");

    image.src = imageUrl;
    image.alt =
      `${trade.ticker} chart screenshot`;

    image.className = "trade-chart-image";

    image.addEventListener(
      "load",
      () => URL.revokeObjectURL(imageUrl),
      { once: true }
    );

    imageWrapper.appendChild(image);

    const card = reviewCards[index];

    const actions =
      card.querySelector(".review-actions");

    if (actions) {
      card.insertBefore(imageWrapper, actions);
    } else {
      card.appendChild(imageWrapper);
    }
  })
);
}
function renderAnalytics() {
  const stats = {};
  trades.forEach((t) => {
    if (!stats[t.strategy])
      stats[t.strategy] = {
        count: 0,
        wins: 0,
        losses: 0,
        pnl: 0,
        decisionScores: [],
      };
    const s = stats[t.strategy];
    s.count++;
    s.wins += t.outcome === "Win" ? 1 : 0;
    s.losses += t.outcome === "Loss" ? 1 : 0;
    s.pnl += t.pnl;
    s.decisionScores.push(t.decisionQuality);
  });
  const best = Object.entries(stats).sort((a, b) => b[1].pnl - a[1].pnl)[0],
    high = trades.filter(
      (t) => t.setupGrade === "A+" || t.setupGrade === "A",
    ).length,
    highRate = trades.length ? (high / trades.length) * 100 : 0,
    avgEmotion = average(trades.map((t) => t.emotionalControl)),
    processWins = trades.filter(
      (t) => t.decisionQuality >= 8 && t.emotionalControl >= 8,
    ).length;
  setText("best-strategy", best ? best[0] : "—");
  setText("high-grade-rate", highRate.toFixed(1) + "%");
  setText("average-emotion", avgEmotion.toFixed(1));
  setText("process-wins", processWins);
 const c = document.getElementById("strategy-performance");

if (!Object.keys(stats).length) {
  c.innerHTML =
    '<div class="empty-state">No strategy data yet.</div>';
} else {
  const strategyRows = Object.entries(stats)
    .sort((a, b) => b[1].pnl - a[1].pnl)
    .map(([strategy, strategyStats]) => {
      const completedTrades =
        strategyStats.wins + strategyStats.losses;

      const winRate = completedTrades
        ? (strategyStats.wins / completedTrades) * 100
        : 0;

      const averageDecision = average(
        strategyStats.decisionScores
      );

      const pnlClass =
        strategyStats.pnl > 0
          ? "positive"
          : strategyStats.pnl < 0
            ? "negative"
            : "";

      return `
        <tr>
          <td>
            <strong>${esc(strategy)}</strong>
          </td>

          <td>${strategyStats.count}</td>

          <td>${strategyStats.wins}</td>

          <td>${strategyStats.losses}</td>

          <td>${winRate.toFixed(1)}%</td>

          <td>${averageDecision.toFixed(1)}</td>

          <td class="${pnlClass}">
            ${currency(strategyStats.pnl)}
          </td>
        </tr>
      `;
    })
    .join("");

  c.innerHTML = `
    <div class="analytics-table-wrapper">
      <table class="analytics-table">
        <thead>
          <tr>
            <th>Strategy</th>
            <th>Trades</th>
            <th>Wins</th>
            <th>Losses</th>
            <th>Win Rate</th>
            <th>Avg. Decision</th>
            <th>Net P&amp;L</th>
          </tr>
        </thead>

        <tbody>
          ${strategyRows}
        </tbody>
      </table>
    </div>
  `;
}
  requestAnimationFrame(() => {
  drawPnlChart();
  drawEquityCurve();
});
}
function drawPnlChart() {
  const canvas = document.getElementById("pnl-chart");
  if (!canvas || !canvas.offsetParent) return;
  const dpr = window.devicePixelRatio || 1,
    width = canvas.clientWidth || 760,
    height = 320;
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  const ctx = canvas.getContext("2d");
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, width, height);
  const data = trades
      .slice()
      .reverse()
      .map((t) => t.pnl),
    padding = 42;
  ctx.font = "12px system-ui";
  ctx.fillStyle = "#94a0bd";
  if (!data.length) {
    ctx.fillText("Log trades to populate this chart.", padding, height / 2);
    return;
  }
  const max = Math.max(...data.map(Math.abs), 1),
    chartWidth = width - padding * 2,
    chartHeight = height - padding * 2,
    zero = padding + chartHeight / 2;
  ctx.strokeStyle = "rgba(255,255,255,.12)";
  ctx.beginPath();
  ctx.moveTo(padding, zero);
  ctx.lineTo(width - padding, zero);
  ctx.stroke();
  const gap = 8,
    barWidth = Math.max(
      8,
      (chartWidth - gap * (data.length - 1)) / data.length,
    );
  data.forEach((v, i) => {
    const x = padding + i * (barWidth + gap),
      barHeight = (Math.abs(v) / max) * (chartHeight / 2 - 12),
      y = v >= 0 ? zero - barHeight : zero;
    ctx.fillStyle = v >= 0 ? "#42d392" : "#ff7484";
    ctx.fillRect(x, y, barWidth, barHeight || 2);
  });
  ctx.fillStyle = "#94a0bd";
  ctx.fillText(currency(max), 4, padding + 4);
  ctx.fillText(currency(-max), 4, height - padding + 4);
}
  function drawEquityCurve() {
  const canvas = document.getElementById("equity-chart");

  if (!canvas) return;

  const context = canvas.getContext("2d");
  const ratio = window.devicePixelRatio || 1;
  const width = canvas.clientWidth;
  const height = canvas.clientHeight || 280;

  canvas.width = width * ratio;
  canvas.height = height * ratio;

  context.scale(ratio, ratio);
  context.clearRect(0, 0, width, height);

  const sortedTrades = [...trades].sort(
    (a, b) => new Date(a.date) - new Date(b.date)
  );

  if (sortedTrades.length === 0) {
    context.fillStyle = "#94a3b8";
    context.font = "14px sans-serif";
    context.textAlign = "center";
    context.fillText(
      "Your equity curve will appear after you log a trade.",
      width / 2,
      height / 2
    );

    return;
  }

  let runningPnl = 0;

  const points = sortedTrades.map((trade) => {
    runningPnl += Number(trade.pnl || 0);
    return runningPnl;
  });

  const padding = {
    top: 30,
    right: 30,
    bottom: 40,
    left: 65
  };

  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const minimumValue = Math.min(0, ...points);
  const maximumValue = Math.max(0, ...points);
  const valueRange = maximumValue - minimumValue || 1;

  const getX = (index) => {
    if (points.length === 1) {
      return padding.left + chartWidth / 2;
    }

    return padding.left + (index / (points.length - 1)) * chartWidth;
  };

  const getY = (value) =>
    padding.top +
    chartHeight -
    ((value - minimumValue) / valueRange) * chartHeight;

  const zeroY = getY(0);

  // Zero line
  context.beginPath();
  context.moveTo(padding.left, zeroY);
  context.lineTo(width - padding.right, zeroY);
  context.strokeStyle = "rgba(148, 163, 184, 0.35)";
  context.lineWidth = 1;
  context.stroke();

  // Equity line
  context.beginPath();

  points.forEach((value, index) => {
    const x = getX(index);
    const y = getY(value);

    if (index === 0) {
      context.moveTo(x, y);
    } else {
      context.lineTo(x, y);
    }
  });

  context.strokeStyle =
    points[points.length - 1] >= 0 ? "#6bd89a" : "#ff7185";
  context.lineWidth = 3;
  context.lineJoin = "round";
  context.lineCap = "round";
  context.stroke();

  // Data points
  points.forEach((value, index) => {
    context.beginPath();
    context.arc(getX(index), getY(value), 4, 0, Math.PI * 2);
    context.fillStyle = value >= 0 ? "#6bd89a" : "#ff7185";
    context.fill();
  });

  // Value labels
  context.fillStyle = "#94a3b8";
  context.font = "12px sans-serif";
  context.textAlign = "right";

  context.fillText(
    currency(maximumValue),
    padding.left - 10,
    padding.top + 4
  );

  context.fillText(
    currency(minimumValue),
    padding.left - 10,
    height - padding.bottom
  );

  context.textAlign = "center";
  context.fillText(
    `${sortedTrades.length} trade${sortedTrades.length === 1 ? "" : "s"}`,
    width / 2,
    height - 12
  );
}
  
function editTrade(id) {
  const trade = trades.find((item) => item.id === id);

  if (!trade) {
    return;
  }

  editingTradeId = id;

  document.getElementById("trade-date").value = trade.date;
  document.getElementById("ticker").value = trade.ticker;
  document.getElementById("direction").value = trade.direction;
  document.getElementById("strategy").value = trade.strategy;
  document.getElementById("entry-price").value = trade.entryPrice;
  document.getElementById("exit-price").value = trade.exitPrice;
  document.getElementById("contracts").value = trade.contracts;
  document.getElementById("setup-grade").value = trade.setupGrade;
  document.getElementById("decision-quality").value =
    trade.decisionQuality;
  document.getElementById("emotional-control").value =
    trade.emotionalControl;

  document.getElementById("daily-aligned").checked =
    trade.context?.dailyAligned || false;

  document.getElementById("four-hour-aligned").checked =
    trade.context?.fourHourAligned || false;

  document.getElementById("one-hour-aligned").checked =
    trade.context?.oneHourAligned || false;

  document.getElementById("fifteen-minute-aligned").checked =
    trade.context?.fifteenMinuteAligned || false;

  document.getElementById("support-resistance-checked").checked =
    trade.context?.supportResistanceChecked || false;

  document.getElementById("waited-for-entry").checked =
    trade.context?.waitedForEntry || false;

  document.getElementById("trade-thesis").value = trade.thesis;
  document.getElementById("trade-lesson").value = trade.lesson;
  document.getElementById("trade-tags").value =
    (trade.tags || []).join(", ");

  document.querySelector('[data-view="new-trade"]').click();

  document.querySelector(
    '#trade-form button[type="submit"]'
  ).textContent = "Update Trade";

  window.scrollTo({
    top: 0,
    behavior: "smooth",
  });
}
async function openTradeModal(id) {
  const trade = trades.find((item) => item.id === id);

  if (!trade) {
    return;
  }

  const modal = document.getElementById("trade-modal");
  const modalBody = document.getElementById("trade-modal-body");

  let imageHtml = "";

  if (trade.chartImageId) {
    const imageRecord = await getTradeImage(trade.chartImageId);

    if (imageRecord?.file) {
      const imageUrl = URL.createObjectURL(imageRecord.file);

      imageHtml = `
        <div class="trade-modal-image-wrapper">
          <img
            class="trade-modal-image"
            src="${imageUrl}"
            alt="${esc(trade.ticker)} chart screenshot"
          />
        </div>
      `;
    }
  }

  const checklistItems = [
    ["Daily EMA20 aligned", trade.context?.dailyAligned],
    ["4H EMA20 aligned", trade.context?.fourHourAligned],
    ["1H EMA20 aligned", trade.context?.oneHourAligned],
    ["15M EMA20 aligned", trade.context?.fifteenMinuteAligned],
    [
      "Support / Resistance checked",
      trade.context?.supportResistanceChecked
    ],
    ["Waited for entry", trade.context?.waitedForEntry]
  ];

  modalBody.innerHTML = `
    <div class="trade-modal-header">
      <div>
        <p class="eyebrow">Trade Detail</p>
        <h2 id="trade-modal-title">
          ${esc(trade.ticker)} — ${esc(trade.direction)}
        </h2>
        <p>
          ${esc(trade.date)} · ${esc(trade.strategy)} ·
          ${esc(trade.setupGrade)} setup
        </p>
      </div>

      <strong class="${trade.pnl >= 0 ? "positive" : "negative"}">
        ${currency(trade.pnl)}
      </strong>
    </div>

    <div class="trade-detail-grid">
      <div>
        <span>Entry</span>
        <strong>${currency(trade.entryPrice)}</strong>
      </div>

      <div>
        <span>Exit</span>
        <strong>${currency(trade.exitPrice)}</strong>
      </div>

      <div>
        <span>Contracts</span>
        <strong>${trade.contracts}</strong>
      </div>

      <div>
        <span>Decision</span>
        <strong>${trade.decisionQuality}/10</strong>
      </div>

      <div>
        <span>Emotion</span>
        <strong>${trade.emotionalControl}/10</strong>
      </div>

      <div>
        <span>Outcome</span>
        <strong>${esc(trade.outcome)}</strong>
      </div>
    </div>

    <section class="trade-modal-section">
      <h3>Context Checklist</h3>

      <div class="modal-checklist">
        ${checklistItems
          .map(
            ([label, completed]) => `
              <div class="${completed ? "complete" : "incomplete"}">
                <span>${completed ? "✓" : "—"}</span>
                ${label}
              </div>
            `
          )
          .join("")}
      </div>
    </section>

    <section class="trade-modal-section">
      <h3>Trade Thesis</h3>
      <p>${esc(trade.thesis || "No thesis recorded.")}</p>
    </section>

    <section class="trade-modal-section">
      <h3>Main Lesson</h3>
      <p>${esc(trade.lesson || "No lesson recorded.")}</p>
    </section>

    ${
      trade.tags?.length
        ? `
          <section class="trade-modal-section">
            <h3>Tags</h3>
            <div class="chip-row">
              ${trade.tags
                .map((tag) => `<span class="chip">${esc(tag)}</span>`)
                .join("")}
            </div>
          </section>
        `
        : ""
    }

    ${imageHtml}
  `;

  modal.classList.add("open");
  modal.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");
}
function closeTradeModal() {
  const modal = document.getElementById("trade-modal");

  modal.classList.remove("open");
  modal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("modal-open");
}
function deleteTrade(id) {
  if (!window.confirm("Delete this trade permanently?")) return;
  trades = trades.filter((t) => t.id !== id);
  saveTrades();
  renderEverything();
  showToast("Trade deleted.");
}
const IMAGE_DATABASE_NAME =
  "supremeTradeJournalImages";

const IMAGE_STORE_NAME = "tradeImages";

function openImageDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(
      IMAGE_DATABASE_NAME,
      1
    );

    request.onupgradeneeded = () => {
      const database = request.result;

      if (
        !database.objectStoreNames.contains(
          IMAGE_STORE_NAME
        )
      ) {
        database.createObjectStore(
          IMAGE_STORE_NAME,
          {
            keyPath: "id"
          }
        );
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}

async function saveTradeImage(file) {
  const database = await openImageDatabase();

  const imageId =
    "image-" +
    Date.now() +
    "-" +
    crypto.randomUUID();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(
      IMAGE_STORE_NAME,
      "readwrite"
    );

    const store = transaction.objectStore(
      IMAGE_STORE_NAME
    );

    store.put({
      id: imageId,
      file: file,
      fileName: file.name,
      fileType: file.type,
      createdAt: new Date().toISOString()
    });

    transaction.oncomplete = () => {
      database.close();
      resolve(imageId);
    };

    transaction.onerror = () => {
      database.close();
      reject(transaction.error);
    };
  });
}

async function getTradeImage(imageId) {
  if (!imageId) {
    return null;
  }

  const database = await openImageDatabase();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(
      IMAGE_STORE_NAME,
      "readonly"
    );

    const store = transaction.objectStore(
      IMAGE_STORE_NAME
    );

    const request = store.get(imageId);

    request.onsuccess = () => {
      database.close();
      resolve(request.result || null);
    };

    request.onerror = () => {
      database.close();
      reject(request.error);
    };
  });
}
function val(id) {
  return document.getElementById(id).value.trim();
}
function num(id) {
  return Number(document.getElementById(id).value);
}
function chk(id) {
  return document.getElementById(id).checked;
}
function average(values) {
  const nums = values.map(Number).filter(Number.isFinite);
  return nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : 0;
}
function currency(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(Number(value) || 0);
}
function setText(id, text) {
  document.getElementById(id).textContent = text;
}
function showToast(message) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove("show"), 2200);
}
function esc(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
