(function () {
  const state = {
    query: "SK hynix recent investment points",
    ticker: "000660",
    market: "KR",
    timeFrom: "2026-03-01T00:00:00",
    timeTo: "2026-03-13T23:59:59",
    compareMode: "BOTH",
    sortBy: "confidence",
    modeFilter: "ALL",
    minConfidence: "0",
    queryFilter: "",
    loading: false,
    listLoading: false,
    error: "",
    recentSessions: [],
    selectedSessionId: "",
    currentDetail: null
  };

  const app = document.getElementById("app");
  const popupOverlay = document.getElementById("popup-overlay");
  const popupTitle = document.getElementById("popup-title");
  const popupContent = document.getElementById("popup-content");
  document.getElementById("popup-close").addEventListener("click", closePopup);
  popupOverlay.addEventListener("click", function (e) {
    if (e.target === popupOverlay) closePopup();
  });

  function api(path, options) {
    return fetch(path, options).then(async (res) => {
      const body = await res.json();
      if (!res.ok) {
        throw new Error(body && body.message ? body.message : "Request failed");
      }
      return body.data;
    });
  }

  function openPopup(title, text) {
    popupTitle.textContent = title;
    popupContent.textContent = text || "";
    popupOverlay.classList.remove("hidden");
  }

  function closePopup() {
    popupOverlay.classList.add("hidden");
  }

  function escapeHtml(value) {
    if (value === null || value === undefined) return "";
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function computeConfidence(detail) {
    const p = detail && detail.pipeline ? detail.pipeline.answer.confidenceScore : 0;
    const t = detail && detail.toolCalling ? detail.toolCalling.answer.confidenceScore : 0;
    return Math.max(p, t);
  }

  function sortSessions(items, sortBy) {
    const copied = items.slice();

    if (sortBy === "createdAt") {
      return copied.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    return copied.sort((a, b) => b.confidence - a.confidence);
  }

  function filterSessions(items, modeFilter, minConfidence, queryFilter) {
    const min = Number(minConfidence || "0");
    const keyword = (queryFilter || "").trim().toLowerCase();

    return items.filter((item) => {
      const modeMatch = modeFilter === "ALL" ? true : item.mode === modeFilter;
      const confidenceMatch = item.confidence >= min;
      const queryMatch =
        keyword === ""
          ? true
          : item.queryText.toLowerCase().includes(keyword) ||
            item.title.toLowerCase().includes(keyword);

      return modeMatch && confidenceMatch && queryMatch;
    });
  }

  function pinSelectedSessionToTop(items, selectedSessionId) {
    if (!selectedSessionId) {
      return items;
    }

    const selected = items.find((item) => item.sessionId === selectedSessionId);
    if (!selected) {
      return items;
    }

    const others = items.filter((item) => item.sessionId !== selectedSessionId);
    return [selected].concat(others);
  }

  function buildDiffSummary(detail) {
    const messages = [];
    if (!detail || detail.mode !== "BOTH" || !detail.pipeline || !detail.toolCalling) {
      return messages;
    }

    const pipelineConfidence = detail.pipeline.answer.confidenceScore;
    const toolConfidence = detail.toolCalling.answer.confidenceScore;

    if (pipelineConfidence > toolConfidence) {
      messages.push("PIPELINE confidence is higher (" + pipelineConfidence + " > " + toolConfidence + ")");
    } else if (toolConfidence > pipelineConfidence) {
      messages.push("TOOL_CALLING confidence is higher (" + toolConfidence + " > " + pipelineConfidence + ")");
    } else {
      messages.push("Both modes have the same confidence (" + pipelineConfidence + ")");
    }

    const pipelineToolCount = detail.pipeline.toolTrace.length;
    const toolToolCount = detail.toolCalling.toolTrace.length;

    if (pipelineToolCount > toolToolCount) {
      messages.push("PIPELINE uses more tool trace entries (" + pipelineToolCount + ")");
    } else if (toolToolCount > pipelineToolCount) {
      messages.push("TOOL_CALLING uses more tool trace entries (" + toolToolCount + ")");
    } else {
      messages.push("Both modes use the same number of tool trace entries (" + pipelineToolCount + ")");
    }

    const pipelineCitationCount = detail.pipeline.citations.length;
    const toolCitationCount = detail.toolCalling.citations.length;

    if (pipelineCitationCount > toolCitationCount) {
      messages.push("PIPELINE contains more citations (" + pipelineCitationCount + ")");
    } else if (toolCitationCount > pipelineCitationCount) {
      messages.push("TOOL_CALLING contains more citations (" + toolCitationCount + ")");
    } else {
      messages.push("Both modes contain the same number of citations (" + pipelineCitationCount + ")");
    }

    const pipelineHasTrace = !!detail.pipeline.retrievalTrace;
    const toolHasTrace = !!detail.toolCalling.retrievalTrace;

    if (pipelineHasTrace && !toolHasTrace) {
      messages.push("Only PIPELINE contains retrieval trace");
    } else if (!pipelineHasTrace && toolHasTrace) {
      messages.push("Only TOOL_CALLING contains retrieval trace");
    } else if (pipelineHasTrace && toolHasTrace) {
      messages.push("Both modes contain retrieval trace");
    } else {
      messages.push("Neither mode contains retrieval trace");
    }

    return messages;
  }

  function renderResultPane(result) {
    if (!result) {
      return "<div>No Result</div>";
    }

    const retrievalFallbackTable = result.retrievalTrace
      ? `
      <div class="section-title">Retrieval Trace - Source Fallback</div>
      <table class="inner-table">
        <thead>
          <tr>
            <th>SourceType</th>
            <th>Retrieved</th>
            <th>Used</th>
          </tr>
        </thead>
        <tbody>
          ${result.retrievalTrace.sourceFallbacks.map((item) => `
            <tr>
              <td>${escapeHtml(item.sourceType)}</td>
              <td>${escapeHtml(item.retrievedCount)}</td>
              <td>${escapeHtml(item.used)}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>

      <div class="section-title">Reranked Results</div>
      <table class="inner-table">
        <thead>
          <tr>
            <th>Document</th>
            <th>Rerank Score</th>
            <th>Expanded Text</th>
          </tr>
        </thead>
        <tbody>
          ${result.retrievalTrace.rerankedResults.map((item, index) => `
            <tr>
              <td>${escapeHtml(item.documentTitle)}</td>
              <td>${escapeHtml(item.rerankScore)}</td>
              <td><button type="button" class="js-open-expanded" data-index="${index}" data-result-id="${escapeHtml(result.sessionId)}">Open</button></td>
            </tr>
          `).join("")}
        </tbody>
      </table>
      `
      : "";

    return `
      <table class="inner-table">
        <tbody>
          <tr><td>SessionId</td><td>${escapeHtml(result.sessionId)}</td></tr>
          <tr><td>Intent</td><td>${escapeHtml(result.queryIntent)}</td></tr>
          <tr><td>Summary</td><td>${escapeHtml(result.answer.summary)}</td></tr>
          <tr><td>Confidence</td><td>${escapeHtml(result.answer.confidenceScore)}</td></tr>
          <tr><td>Uncertainty</td><td>${escapeHtml(result.answer.uncertaintyNote)}</td></tr>
          <tr><td>Full Text</td><td><button type="button" class="js-open-text" data-text="${encodeURIComponent(result.answer.fullText)}" data-title="Full Text">Open</button></td></tr>
        </tbody>
      </table>

      <div class="section-title">Tool Trace</div>
      <table class="inner-table">
        <thead><tr><th>Tool</th><th>Status</th></tr></thead>
        <tbody>
          ${result.toolTrace.map((item) => `
            <tr>
              <td>${escapeHtml(item.toolName)}</td>
              <td>${escapeHtml(item.status)}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>

      <div class="section-title">Citations</div>
      <table class="inner-table">
        <thead><tr><th>Title</th><th>Source</th></tr></thead>
        <tbody>
          ${result.citations.length === 0
            ? `<tr><td colspan="2">No Citations</td></tr>`
            : result.citations.map((item) => `
              <tr>
                <td>${escapeHtml(item.title)}</td>
                <td>${escapeHtml(item.sourceName)}</td>
              </tr>
            `).join("")
          }
        </tbody>
      </table>

      ${retrievalFallbackTable}
    `;
  }

  function render() {
    const visibleSessions = pinSelectedSessionToTop(
      sortSessions(
        filterSessions(
          state.recentSessions,
          state.modeFilter,
          state.minConfidence,
          state.queryFilter
        ),
        state.sortBy
      ),
      state.selectedSessionId
    );

    const currentSessionInfo =
      state.recentSessions.find((item) => item.sessionId === state.selectedSessionId) || null;

    const detail = state.currentDetail;
    const mode = detail ? detail.mode : state.compareMode;
    const diffSummary = detail ? buildDiffSummary(detail) : [];

    let resultHtml = "";
    if (detail) {
      resultHtml += `
        <table class="inner-table">
          <tbody>
            <tr class="current-session-row">
              <td style="width:20%">Current Session</td>
              <td>${currentSessionInfo
                ? `${escapeHtml(currentSessionInfo.sessionId)} / ${escapeHtml(currentSessionInfo.mode)} / ${escapeHtml(currentSessionInfo.confidence.toFixed(2))} / ${escapeHtml(currentSessionInfo.createdAt)}`
                : `NEW RUN / ${escapeHtml(mode)}`}</td>
            </tr>
          </tbody>
        </table>
      `;

      if (mode === "BOTH") {
        resultHtml += `
          <div class="diff-box">
            <div class="section-title">Diff Summary</div>
            <table class="inner-table">
              <tbody>
                ${diffSummary.map((msg, idx) => `<tr><td>${idx + 1}. ${escapeHtml(msg)}</td></tr>`).join("")}
              </tbody>
            </table>
          </div>
          <table class="main-table">
            <thead>
              <tr>
                <th style="width:50%">PIPELINE</th>
                <th style="width:50%">TOOL_CALLING</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>${renderResultPane(detail.pipeline)}</td>
                <td>${renderResultPane(detail.toolCalling)}</td>
              </tr>
            </tbody>
          </table>
        `;
      } else if (mode === "PIPELINE") {
        resultHtml += `
          <table class="main-table">
            <thead><tr><th>PIPELINE</th></tr></thead>
            <tbody><tr><td>${renderResultPane(detail.pipeline)}</td></tr></tbody>
          </table>
        `;
      } else {
        resultHtml += `
          <table class="main-table">
            <thead><tr><th>TOOL_CALLING</th></tr></thead>
            <tbody><tr><td>${renderResultPane(detail.toolCalling)}</td></tr></tbody>
          </table>
        `;
      }
    }

    app.innerHTML = `
      <table class="form-table">
        <tbody>
          <tr>
            <td>Query</td>
            <td colspan="5">
              <input id="query" value="${escapeHtml(state.query)}" class="input-long" />
            </td>
          </tr>
          <tr>
            <td>Ticker</td>
            <td><input id="ticker" value="${escapeHtml(state.ticker)}" /></td>
            <td>Market</td>
            <td><input id="market" value="${escapeHtml(state.market)}" /></td>
            <td>Mode</td>
            <td>
              <select id="compareMode">
                <option value="BOTH" ${state.compareMode === "BOTH" ? "selected" : ""}>BOTH</option>
                <option value="PIPELINE" ${state.compareMode === "PIPELINE" ? "selected" : ""}>PIPELINE only</option>
                <option value="TOOL_CALLING" ${state.compareMode === "TOOL_CALLING" ? "selected" : ""}>TOOL_CALLING only</option>
              </select>
            </td>
          </tr>
          <tr>
            <td>From</td>
            <td colspan="2"><input id="timeFrom" value="${escapeHtml(state.timeFrom)}" class="input-long" /></td>
            <td>To</td>
            <td><input id="timeTo" value="${escapeHtml(state.timeTo)}" class="input-long" /></td>
            <td><button id="runButton" type="button">${state.loading ? "Running..." : "Run"}</button></td>
          </tr>
        </tbody>
      </table>

      ${state.error ? `<div class="error-box">${escapeHtml(state.error)}</div>` : ""}

      ${resultHtml}

      <div class="section-title">Recent Sessions</div>

      <table class="form-table">
        <tbody>
          <tr>
            <td style="width:15%">Sort By</td>
            <td style="width:18%">
              <select id="sortBy">
                <option value="confidence" ${state.sortBy === "confidence" ? "selected" : ""}>confidence desc</option>
                <option value="createdAt" ${state.sortBy === "createdAt" ? "selected" : ""}>createdAt desc</option>
              </select>
            </td>

            <td style="width:15%">Mode Filter</td>
            <td style="width:18%">
              <select id="modeFilter">
                <option value="ALL" ${state.modeFilter === "ALL" ? "selected" : ""}>ALL</option>
                <option value="PIPELINE" ${state.modeFilter === "PIPELINE" ? "selected" : ""}>PIPELINE</option>
                <option value="TOOL_CALLING" ${state.modeFilter === "TOOL_CALLING" ? "selected" : ""}>TOOL_CALLING</option>
                <option value="BOTH" ${state.modeFilter === "BOTH" ? "selected" : ""}>BOTH</option>
              </select>
            </td>

            <td style="width:15%">Min Confidence</td>
            <td style="width:19%">
              <input id="minConfidence" value="${escapeHtml(state.minConfidence)}" />
            </td>
          </tr>

          <tr>
            <td>Query Filter</td>
            <td colspan="3">
              <input id="queryFilter" value="${escapeHtml(state.queryFilter)}" placeholder="queryText / title filter" class="input-long" />
            </td>

            <td>Reset</td>
            <td><button id="resetFilters" type="button">Reset Filters</button></td>
          </tr>
        </tbody>
      </table>

      <table class="inner-table">
        <thead>
          <tr>
            <th style="width:10%">SessionId</th>
            <th style="width:10%">Mode</th>
            <th style="width:10%">Confidence</th>
            <th style="width:20%">Title</th>
            <th style="width:35%">Query</th>
            <th style="width:15%">CreatedAt</th>
          </tr>
        </thead>
        <tbody>
          ${state.listLoading
            ? `<tr><td colspan="6">Loading...</td></tr>`
            : visibleSessions.length === 0
              ? `<tr><td colspan="6">No Sessions</td></tr>`
              : visibleSessions.map((item) => `
                <tr data-session-id="${escapeHtml(item.sessionId)}" class="js-session-row ${state.selectedSessionId === item.sessionId ? "selected-row" : ""}">
                  <td>${escapeHtml(item.sessionId)}</td>
                  <td>${escapeHtml(item.mode)}</td>
                  <td>${escapeHtml(item.confidence.toFixed(2))}</td>
                  <td>${escapeHtml(item.title)}</td>
                  <td>${escapeHtml(item.queryText)}</td>
                  <td>${escapeHtml(item.createdAt)}</td>
                </tr>
              `).join("")
          }
        </tbody>
      </table>
    `;

    bindEvents();
  }

  function bindEvents() {
    document.getElementById("query").addEventListener("input", (e) => {
      state.query = e.target.value;
    });
    document.getElementById("ticker").addEventListener("input", (e) => {
      state.ticker = e.target.value;
    });
    document.getElementById("market").addEventListener("input", (e) => {
      state.market = e.target.value;
    });
    document.getElementById("timeFrom").addEventListener("input", (e) => {
      state.timeFrom = e.target.value;
    });
    document.getElementById("timeTo").addEventListener("input", (e) => {
      state.timeTo = e.target.value;
    });
    document.getElementById("compareMode").addEventListener("change", (e) => {
      state.compareMode = e.target.value;
      render();
    });

    document.getElementById("sortBy").addEventListener("change", (e) => {
      state.sortBy = e.target.value;
      render();
    });
    document.getElementById("modeFilter").addEventListener("change", (e) => {
      state.modeFilter = e.target.value;
      render();
    });
    document.getElementById("minConfidence").addEventListener("input", (e) => {
      state.minConfidence = e.target.value;
      render();
    });
    document.getElementById("queryFilter").addEventListener("input", (e) => {
      state.queryFilter = e.target.value;
      render();
    });
    document.getElementById("resetFilters").addEventListener("click", () => {
      state.sortBy = "confidence";
      state.modeFilter = "ALL";
      state.minConfidence = "0";
      state.queryFilter = "";
      render();
    });
    document.getElementById("runButton").addEventListener("click", handleRun);

    document.querySelectorAll(".js-session-row").forEach((row) => {
      row.addEventListener("click", () => {
        handleSelectSession(row.getAttribute("data-session-id"));
      });
    });

    document.querySelectorAll(".js-open-text").forEach((button) => {
      button.addEventListener("click", () => {
        openPopup(button.getAttribute("data-title") || "Detail", decodeURIComponent(button.getAttribute("data-text") || ""));
      });
    });

    document.querySelectorAll(".js-open-expanded").forEach((button) => {
      button.addEventListener("click", () => {
        const resultId = button.getAttribute("data-result-id");
        const idx = Number(button.getAttribute("data-index"));
        const current = state.currentDetail;
        if (!current) return;
        const result = current.pipeline && current.pipeline.sessionId === resultId
          ? current.pipeline
          : current.toolCalling && current.toolCalling.sessionId === resultId
            ? current.toolCalling
            : null;
        if (!result || !result.retrievalTrace || !result.retrievalTrace.rerankedResults[idx]) return;
        openPopup("Expanded Context", result.retrievalTrace.rerankedResults[idx].expandedText);
      });
    });
  }

  async function handleRun() {
    state.loading = true;
    state.error = "";
    render();

    try {
      const payload = {
        query: state.query,
        ticker: state.ticker,
        market: state.market,
        timeFrom: state.timeFrom,
        timeTo: state.timeTo,
        saveResult: true,
        analysisMode: state.compareMode
      };

      const endpoint = state.compareMode === "BOTH"
        ? "/api/v1/analysis/compare"
        : "/api/v1/analysis/query";

      const detail = await api(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      state.currentDetail = detail;
      state.selectedSessionId = detail.sessionId;
      state.loading = false;

      await loadSessions();
    } catch (err) {
      state.loading = false;
      state.error = err instanceof Error ? err.message : "Unexpected error";
      render();
    }
  }

  async function handleSelectSession(sessionId) {
    state.loading = true;
    state.error = "";
    render();

    try {
      const detail = await api("/api/v1/analysis/sessions/" + sessionId, { method: "GET" });
      state.currentDetail = detail;
      state.selectedSessionId = sessionId;
      state.compareMode = detail.mode;
      state.loading = false;
      render();
    } catch (err) {
      state.loading = false;
      state.error = err instanceof Error ? err.message : "Unexpected error";
      render();
    }
  }

  async function loadSessions() {
    state.listLoading = true;
    render();

    try {
      const items = await api("/api/v1/analysis/sessions", { method: "GET" });
      state.recentSessions = items;
      state.listLoading = false;
      render();
    } catch (err) {
      state.listLoading = false;
      state.error = err instanceof Error ? err.message : "Unexpected error";
      render();
    }
  }

  async function init() {
    await loadSessions();
    if (state.recentSessions.length > 0) {
      await handleSelectSession(state.recentSessions[0].sessionId);
    } else {
      render();
    }
  }

  init();
})();
