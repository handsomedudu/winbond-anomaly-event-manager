import React, { useState, useEffect } from 'react';

function App() {

  // 資料與載入狀態

    const [events, setEvents] = useState([]);

    const [machines, setMachines] = useState([]);

    const [engineers, setEngineers] = useState([]);

    const [stats, setStats] = useState({ total: 0, pending: 0, ack: 0, assign: 0, closed: 0 });

    const [loading, setLoading] = useState(true);

    const [currentTime, setCurrentTime] = useState(new Date());

  // 篩選器狀態

  const [filterStatus, setFilterStatus] = useState('');

  const [filterMachine, setFilterMachine] = useState('');

  const [filterStartDate, setFilterStartDate] = useState('');

  const [filterEndDate, setFilterEndDate] = useState('');

  // 彈跳視窗與操作狀態

  const [selectedEventId, setSelectedEventId] = useState(null);

  const [selectedEvent, setSelectedEvent] = useState(null);

  const [modalLoading, setModalLoading] = useState(false);

  const [modalAction, setModalAction] = useState(''); // 'assign' | 'close' | ''

  const [modalError, setModalError] = useState('');

  const [modalSuccess, setModalSuccess] = useState('');

  // 操作表單輸入

  const [engineerName, setEngineerName] = useState('');

  const [resolutionText, setResolutionText] = useState('');

  const [attachment, setAttachment] = useState(null);

  const [aiLoading, setAiLoading] = useState(false);

  const [evidence, setEvidence] = useState(null);

  // 🧪 EES Anomaly Simulation Control & SECS/GEM logs

  const [forcedAnomaly, setForcedAnomaly] = useState(null); // 'OOC' | 'PM' | null

  const [secsLogs, setSecsLogs] = useState([]);

  // 🔬 EAP/EES 廠區設備感測器即時 Telemetry 數據與健康度

  const [telemetry, setTelemetry] = useState({

    'EXP-01': { sensor1: '120.0', sensor2: '0.021', name: 'ASML 曝光機 EXP-01', health: 82, s1Name: '⚡ 光源能量', s1Unit: 'mJ', s2Name: '📐 透鏡傾角', s2Unit: '°' },

    'ETCH-02': { sensor1: '0.050', sensor2: '45.0', name: 'Lam Research 蝕刻機 ETCH-02', health: 65, s1Name: '🌀 腔體壓力', s1Unit: 'mTorr', s2Name: '💨 氣體流量', s2Unit: 'sccm' },

    'CVD-03': { sensor1: '620.0', sensor2: '1200', name: 'AMAT 薄膜沉積 CVD-03', health: 88, s1Name: '🔥 腔體溫度', s1Unit: '°C', s2Name: '🔌 射頻功率', s2Unit: 'W' },

    'PVD-04': { sensor1: '12.40', sensor2: '1.2', name: 'Novellus 物理沉積 PVD-04', health: 92, s1Name: '🦾 手臂坐標', s1Unit: 'cm', s2Name: '🌬️ 真空漏率', s2Unit: 'e-7' },

    'MET-05': { sensor1: '0.12', sensor2: '500', name: 'KLA 關鍵尺寸量測 MET-05', health: 100, s1Name: '🔍 校正偏移', s1Unit: 'μm', s2Name: '🔎 鏡頭放大', s2Unit: 'x' }

  });

  // 📈 EES FDC SPC 即時製程控制圖表數據 (預先填滿 15 筆，免除空線圖)

  const [telemetryHistory, setTelemetryHistory] = useState({

    'EXP-01': Array(15).fill(120.0).map(() => +(120 + (Math.random() - 0.5) * 0.2).toFixed(1)),

    'ETCH-02': Array(15).fill(0.050).map(() => +(0.05 + (Math.random() - 0.5) * 0.003).toFixed(3)),

    'CVD-03': Array(15).fill(1200).map(() => Math.floor(1200 + (Math.random() - 0.5) * 12)),

    'PVD-04': Array(15).fill(1.2).map(() => +(1.2 + (Math.random() - 0.5) * 0.05).toFixed(1)),

    'MET-05': Array(15).fill(0.12).map(() => +(0.12 + (Math.random() - 0.5) * 0.004).toFixed(2))

  });

  // 目前選取要查看 SPC 即時圖表的機台 (預設 Lam 蝕刻機 ETCH-02)

  const [activeTelemetryId, setActiveTelemetryId] = useState('ETCH-02');

  // 🤖 FAB-GPT 智能設備問答與 SOP 輔助助手狀態

  const [copilotQuery, setCopilotQuery] = useState('');

  const [copilotResponse, setCopilotResponse] = useState([]);

  const [copilotCheckedSteps, setCopilotCheckedSteps] = useState({});

  const [copilotTyping, setCopilotTyping] = useState(false);

  // 動態更新系統時間

  useEffect(() => {

    const timer = setInterval(() => setCurrentTime(new Date()), 1000);



    const teleTimer = setInterval(() => {

      setTelemetry(prev => {

        // 隨機抖動產生新值

        const nextExp = +(120 + (Math.random() - 0.5) * 0.41).toFixed(1);

        const nextEtch = +(0.05 + (Math.random() - 0.5) * 0.006).toFixed(3);

        const nextCvdVal = Math.floor(1200 + (Math.random() - 0.5) * 22);

        const nextPvdVal = +(1.2 + (Math.random() - 0.5) * 0.12).toFixed(1);

        const nextMet = +(0.12 + (Math.random() - 0.5) * 0.006).toFixed(2);

        // 同步更新 15 筆歷史佇列

        setTelemetryHistory(hist => ({

          'EXP-01': [...hist['EXP-01'].slice(1), nextExp],

          'ETCH-02': [...hist['ETCH-02'].slice(1), nextEtch],

          'CVD-03': [...hist['CVD-03'].slice(1), nextCvdVal],

          'PVD-04': [...hist['PVD-04'].slice(1), nextPvdVal],

          'MET-05': [...hist['MET-05'].slice(1), nextMet]

        }));

        // EES FDC 物理退化算法：若超出控制限制(UCL/LCL)，健康度降低，否則漸漸恢復

        const updateHealth = (val, lcl, ucl, curHealth) => {

          if (val < lcl || val > ucl) {

            return Math.max(50, curHealth - Math.floor(Math.random() * 4 + 2)); // 降健康度

          }

          return Math.min(100, curHealth + (Math.random() > 0.7 ? 1 : 0)); // 緩慢恢復

        };

        const newExpH = updateHealth(nextExp, 119.7, 120.3, prev['EXP-01'].health);

        const newEtcH = updateHealth(nextEtch, 0.048, 0.052, prev['ETCH-02'].health);

        const newCvdH = updateHealth(nextCvdVal, 1190, 1210, prev['CVD-03'].health);

        const newPvdH = updateHealth(nextPvdVal, 1.1, 1.3, prev['PVD-04'].health);

        const newMetH = updateHealth(nextMet, 0.10, 0.14, prev['MET-05'].health);

        return {

          'EXP-01': { ...prev['EXP-01'], sensor1: nextExp.toString(), sensor2: (0.02 + (Math.random() - 0.5) * 0.002).toFixed(3), health: newExpH },

          'ETCH-02': { ...prev['ETCH-02'], sensor1: nextEtch.toString(), sensor2: (45.0 + (Math.random() - 0.5) * 0.8).toFixed(1), health: newEtcH },

          'CVD-03': { ...prev['CVD-03'], sensor1: (620 + (Math.random() - 0.5) * 1.6).toFixed(1), sensor2: nextCvdVal.toString(), health: newCvdH },

          'PVD-04': { ...prev['PVD-04'], sensor1: (12.4 + (Math.random() - 0.5) * 0.12).toFixed(2), sensor2: nextPvdVal.toString(), health: newPvdH },

          'MET-05': { ...prev['MET-05'], sensor1: nextMet.toString(), sensor2: (500 + Math.floor((Math.random() - 0.5) * 6)).toString(), health: newMetH }

        };

      });

    }, 2000);

    return () => {

      clearInterval(timer);

      clearInterval(teleTimer);

    };

  }, []);

  // 初始讀取機台清單與數據

  useEffect(() => {

    fetchMachines();

    fetchEngineers();

    fetchData();

  }, []);

  // 當主篩選器的狀態改變時，直接進行快速篩選查詢

  useEffect(() => {

    fetchEvents();

  }, [filterStatus]);

  // 獲取所有機台清單

  const fetchMachines = async () => {

    try {

      const res = await fetch('/api/machines');

      const json = await res.json();

      if (json.success) {

        setMachines(json.data);

      }

    } catch (err) {

      console.error('讀取機台清單錯誤:', err);

    }

  };

  // 獲取所有工程師清單

  const fetchEngineers = async () => {

    try {

      const res = await fetch('/api/engineers');

      const json = await res.json();

      if (json.success) {

        setEngineers(json.data);

      }

    } catch (err) {

      console.error('讀取工程師清單錯誤:', err);

    }

  };

  // 獲取清單與統計數據

  const fetchData = async () => {

    setLoading(true);

    await Promise.all([fetchEvents(), fetchStats()]);

    setLoading(false);

  };

  // 讀取統計指標

  const fetchStats = async () => {

    try {

      const res = await fetch('/api/stats');

      const json = await res.json();

      if (json.success) {

        setStats(json.data);

      }

    } catch (err) {

      console.error('讀取統計指標錯誤:', err);

    }

  };

  // 讀取篩選後的異常事件清單

  const fetchEvents = async () => {

    try {

      let url = '/api/events?';

      if (filterStatus) url += `status=${filterStatus}&`;

      if (filterMachine) url += `machine_id=${filterMachine}&`;

      if (filterStartDate) url += `start_date=${filterStartDate}&`;

      if (filterEndDate) url += `end_date=${filterEndDate}&`;

      const res = await fetch(url);

      const json = await res.json();

      if (json.success) {

        setEvents(json.data);

      }

    } catch (err) {

      console.error('讀取異常事件清單錯誤:', err);

    }

  };

  // 讀取單一事件詳細明細

  const fetchEventDetail = async (id) => {

    setModalLoading(true);

    setModalError('');

    setModalSuccess('');

    try {

      const res = await fetch(`/api/events/${id}`);

      const json = await res.json();

      if (json.success) {

        setSelectedEvent(json.data);

        // 初始化填寫欄位

        setEngineerName(json.data.assigned_engineer || '');

        setResolutionText(json.data.resolution || '');

      } else {

        setModalError(json.message);

      }

    } catch (err) {

      setModalError('無法取得事件明細: ' + err.message);

    } finally {

      setModalLoading(false);

    }

  };

  // 點選列表 row 開啟彈窗

  const handleOpenModal = (eventId) => {

    setSelectedEventId(eventId);

    setModalAction('');

    fetchEventDetail(eventId);

  };

  // 關閉彈窗

  const handleCloseModal = () => {

    setSelectedEventId(null);

    setSelectedEvent(null);

    setAttachment(null); // 重設檔案狀態

    setEvidence(null);   // 重設現場佐證

    fetchStats(); // 順便更新統計與列表

    fetchEvents();

  };

  // 執行狀態更新 (Ack / Assign / Close)

  const handleUpdateStatus = async (status, payload = {}) => {

    setModalLoading(true);

    setModalError('');

    setModalSuccess('');

    try {

      const res = await fetch(`/api/events/${selectedEventId}/status`, {

        method: 'PUT',

        headers: { 'Content-Type': 'application/json' },

        body: JSON.stringify({ status, ...payload })

      });

      const json = await res.json();

      if (json.success) {

        setModalSuccess(json.message);

        setSelectedEvent(json.data);

        setModalAction(''); // 重設輸入面板

        setAttachment(null); // 成功後重設檔案狀態

        setEvidence(null);   // 成功後重設現場佐證

        // 延遲刷新背景資料

        fetchStats();

        fetchEvents();

      } else {

        setModalError(json.message);

      }

    } catch (err) {

      setModalError('連線伺服器失敗: ' + err.message);

    } finally {

      setModalLoading(false);

    }

  };

  // ⚡ AI Anomaly Copilot 智能多模態診斷與對策推薦

  const handleAICopilot = () => {

    if (!selectedEvent) return;

    setAiLoading(true);

    setModalError('');

    setTimeout(() => {

      let aiDraft = '';

      const code = selectedEvent.event_code;

      const hasImage = evidence !== null;



      // 根據是否提供影像佐證，動態提升 AI 診斷的精度與分析內容

      const diagPrefix = hasImage

        ? `【⚡ AI 多模態視覺與日誌聯合診斷助理 (置信度：99% 🌟 極精密)】\n[視覺特徵分析]：已自動分析現場巡檢影像 [${evidence.name}]。識別到機台實體告警燈號 (紅色警示) 與現場實況損耗，確認非感測器誤報。\n\n`

        : `【✨ AI 常規日誌診斷助理 (置信度：75% - 建議上傳現場照片提升至 99%)】\n[日誌特徵分析]：無現場影像佐證，僅基於 EAP/EES 感測器數據分析。\n\n`;

      if (code === 'E-1024') {

        aiDraft = diagPrefix + `【AI 根因診斷】：ASML 曝光機雷射共振腔鏡片微幅偏移或老化，導致發光效率衰減。\n\n【SOP 處置對策】：\n1. 執行雷射光源基準點能量自動校正 (Auto-Calibration) 程式。\n2. 安排設備工程師現場檢查光路鏡片是否有髒汙，並進行預防性保養清潔。\n3. 重啟監控測試，確認能量回到標準規格 (Specs) 內，隨後恢復線上生產。`;

      } else if (code === 'E-2048') {

        aiDraft = diagPrefix + `【AI 根因診斷】：Lam 蝕刻機腔體之氣體流量控制器 (MFC) 發生壓電閥閥門卡滯或硬體異常。\n\n【SOP 處置對策】：\n1. 執行 EAP 線上通訊重設，嘗試重新啟動 MFC 控制卡並復歸通訊。\n2. 若重啟無效，立即指派設備工程師至現場更換同規格 MFC 備品，並重新進行漏率測試 (Leak Rate Test)。\n3. 腔體真空度回到 10^-6 Torr 標準規格後，恢復線上自動化生產。`;

      } else if (code === 'E-0512') {

        aiDraft = diagPrefix + `【AI 根因診斷】：CVD 腔體加熱器阻抗微幅變異，或熱電耦 (Thermocouple) 訊號干擾導致加熱溫度波動。\n\n【SOP 處置對策】：\n1. 調整 CVD 加熱系統之 PID 閉迴路控制參數，穩定溫度控制曲線。\n2. 安排機台離線，對熱電耦感測器進行精密二點法校正。\n3. 觀察 3 個 Batch 生產之溫度波動曲線，確認回到 control limit (OOC) 內。`;

      } else if (code === 'E-0256') {

        aiDraft = diagPrefix + `【AI 根因診斷】：PVD 機台傳送手臂馬達編碼器 (Encoder) 積碳或皮帶微幅磨損鬆脫。\n\n【SOP 處置對策】：\n1. 現場拆卸手臂護蓋，使用精密清潔劑保養編碼器光學感應點。\n2. 重新執行 Robot Arm 示教 (Teaching) 定位，寫入最新絕對坐標參數。\n3. 手動測試傳送 Dummy Wafer 10 次，確認傳送抖動訊號完全消失。`;

      } else {

        aiDraft = diagPrefix + `【AI 根因診斷】：分析此異常日誌後，研判為設備硬體或感測器回報值微幅超出常規值限制。\n\n【SOP 處置對策】：\n1. 建議先重啟該機台硬體與通訊模組，進行預防性自我測試。\n2. 檢查感測器傳輸線路是否受雜訊干擾，並重置極值上限。\n3. 若重複發生，請聯絡設備供應商進廠排查。`;

      }



      setResolutionText(aiDraft);

      setAiLoading(false);

    }, 1200); // 模擬 AI 讀取 log 的思考延遲

  };

  // 處理現場影像/影片上傳

  // =========================================================================

  // 🔬 SPC 製程能力與統計指標計算 (Mean, StdDev, UCL, LCL, Cpk)

  // =========================================================================

  const calcSpcStats = (machineId) => {

    const history = telemetryHistory[machineId] || [];

    if (history.length === 0) return { mean: '0', std: '0', cpk: '0.00', statusText: '未知狀態', statusColor: 'var(--text-muted)' };



    const sum = history.reduce((a, b) => a + b, 0);

    const mean = sum / history.length;



    const variance = history.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / history.length;

    const std = Math.sqrt(variance) || 0.0001;

    let usl, lsl, ucl, lcl, target, unit;

    if (machineId === 'EXP-01') {

      lsl = 119.4; usl = 120.6; lcl = 119.6; ucl = 120.4; target = 120.0; unit = 'mJ';

    } else if (machineId === 'ETCH-02') {

      lsl = 0.040; usl = 0.060; lcl = 0.044; ucl = 0.056; target = 0.050; unit = 'mTorr';

    } else if (machineId === 'CVD-03') {

      lsl = 1140; usl = 1260; lcl = 1160; ucl = 1240; target = 1200; unit = 'W';

    } else if (machineId === 'PVD-04') {

      lsl = 0.8; usl = 1.6; lcl = 1.0; ucl = 1.4; target = 1.2; unit = 'e-7';

    } else {

      lsl = 0.08; usl = 0.16; lcl = 0.10; ucl = 0.14; target = 0.12; unit = 'μm';

    }

    const cpu = (usl - mean) / (3 * std);

    const cpl = (mean - lsl) / (3 * std);

    const cpkVal = Math.max(0, Math.min(cpu, cpl));



    let violationRule = null;

    let violationText = '';



    if (history.length >= 1) {

      const lastVal = history[history.length - 1];

      if (lastVal > ucl || lastVal < lcl) {

        violationRule = 'Rule 1';

        violationText = '⚠️ Rule 1: 數值超出 3σ 管制限界 (FDC OOC)';

      }

    }



    if (!violationRule && history.length >= 9) {

      const last9 = history.slice(-9);

      const allAbove = last9.every(v => v > mean);

      const allBelow = last9.every(v => v < mean);

      if (allAbove || allBelow) {

        violationRule = 'Rule 2';

        violationText = '⚠️ Rule 2: 連續 9 點在均值單側 (製程微幅偏移)';

      }

    }



    if (!violationRule && history.length >= 6) {

      const last6 = history.slice(-6);

      let isIncreasing = true;

      let isDecreasing = true;

      for (let i = 1; i < 6; i++) {

        if (last6[i] <= last6[i - 1]) isIncreasing = false;

        if (last6[i] >= last6[i - 1]) isDecreasing = false;

      }

      if (isIncreasing || isDecreasing) {

        violationRule = 'Rule 3';

        violationText = `⚠️ Rule 3: 連續 6 點單向趨勢 (${isIncreasing ? '持續遞增' : '持續遞減'})`;

      }

    }

    let statusText = '🟢 製程能力充沛 (Stable)';

    let statusColor = 'var(--status-closed)';

    if (violationRule) {

      statusText = violationText;

      statusColor = violationRule === 'Rule 1' ? 'var(--severity-critical)' : 'var(--severity-warning)';

    } else if (cpkVal < 1.0) {

      statusText = '🔴 製程能力不足 (Low Capability)';

      statusColor = 'var(--severity-critical)';

    } else if (cpkVal < 1.33) {

      statusText = '🟡 製程警告邊緣 (Marginal)';

      statusColor = 'var(--severity-warning)';

    }

    const precision = machineId === 'ETCH-02' ? 4 : (machineId === 'MET-05' ? 3 : 1);

    const stdPrecision = machineId === 'ETCH-02' ? 5 : 3;

    return {

      mean: mean.toFixed(precision),

      std: std.toFixed(stdPrecision),

      cpk: cpkVal.toFixed(2),

      statusText,

      statusColor,

      violationRule,

      usl, lsl, ucl, lcl, target, unit

    };

  };

  const getSpcY = (val, machineId) => {

    let min, max;

    if (machineId === 'EXP-01') { min = 119.0; max = 121.0; }

    else if (machineId === 'ETCH-02') { min = 0.035; max = 0.065; }

    else if (machineId === 'CVD-03') { min = 1120; max = 1280; }

    else if (machineId === 'PVD-04') { min = 0.7; max = 1.7; }

    else { min = 0.07; max = 0.17; }

    const plotHeight = 110;

    const topMargin = 15;

    const percent = (val - min) / (max - min);

    // 限制 Y 軸在圖表區內

    const clampedPercent = Math.max(0, Math.min(1, percent));

    return topMargin + (1 - clampedPercent) * plotHeight;

  };

  // =========================================================================

  // 🤖 FAB-GPT 智能設備問答與 SOP 生成器 (Typewriter Effect)

  // =========================================================================

  const triggerCopilotQuery = (queryText, prebuiltKey = '') => {

    if (copilotTyping) return;

    setCopilotTyping(true);

    setCopilotCheckedSteps({});



    let key = prebuiltKey;

    if (!key && queryText) {

      const q = queryText.toUpperCase();

      if (q.includes('EXP') || q.includes('曝光') || q.includes('ASML')) key = 'ASML';

      else if (q.includes('ETCH') || q.includes('蝕刻') || q.includes('MFC') || q.includes('壓力')) key = 'LAM';

      else if (q.includes('CVD') || q.includes('溫度') || q.includes('薄膜') || q.includes('功率')) key = 'AMAT';

      else if (q.includes('PVD') || q.includes('手臂') || q.includes('ROBOT')) key = 'NOVELLUS';

      else if (q.includes('SECS') || q.includes('GEM') || q.includes('通訊') || q.includes('離線')) key = 'SECS';

    }

    let steps = [];

    let title = "";

    if (key === 'ASML') {

      title = "ASML 曝光光源能量不足 (Low Exposure Laser Energy) 故障排除 SOP";

      steps = [

        "透過 EAP 自動發送 S2F21 SECS 指令讀取雷射狀態暫存器 (Laser Status Register)。",

        "點擊自動化設備維護軟體，觸行動態雷射光源能量 Auto-Calibration 程序 (估計耗時 180 秒)。",

        "穿戴雙層防護手套並配戴防紫外雷射護目鏡，至曝光腔體現場檢查光路共振鏡片 (Cavity Mirror) 髒汙情形。",

        "使用無塵室專用分析級異丙醇 (IPA) 物理擦拭曝光光學元件並進行光束微對位 (Beam Alignment)。",

        "重新裝載測試晶圓進行試曝與光阻顯影後線寬量測，確認曝光均勻度誤差 (Uniformity) 回到 ±1% 規格內。"

      ];

    } else if (key === 'LAM') {

      title = "Lam Research 蝕刻機腔體真空度異常與 MFC 流量控制器卡滯排查 SOP";

      steps = [

        "進入 EAP 主控制台重設 MFC Interface Board 控制卡，排除網路雜訊造成的暫時性通訊離線。",

        "執行腔體洩漏測試 (Chamber Leak Rate Test)，檢測真空漏率是否確實低於 1.5 e-7 Torr/min 嚴格標竿。",

        "切斷蝕刻腐蝕性氣體來源，在無塵室拆卸氣體岐管閥件，檢查壓電電磁閥門 (Piezo Valve) 有無硬質積垢。",

        "更換同規格 MFC 備品 (備品條碼：Lam-MFC-Etch-882)，並以精密電壓計重新校準 0-5V 反饋流量係數。",

        "通入高純度 Ar 氣體與 BCl3 進行流量控制測試，確保穩態真空腔壓回歸至 0.050 mTorr 基準線。"

      ];

    } else if (key === 'AMAT') {

      title = "AMAT CVD 薄膜沉積腔體溫度過高與射頻功率 (RF Power) 波動排除 SOP";

      steps = [

        "調閱 EES FDC 即時感測器波形曲線，檢視加熱器阻抗阻值是否有跳躍性劣化訊號。",

        "現場斷電檢查射頻匹配箱 (RF Matching Network) 的反射功率 (Reflected Power) 是否有超過 5% 的阻抗失配。",

        "將 CVD 機台設為 PM 離線模式，現場更換或重新校準腔內高溫熱電耦 (Thermocouple) 精密感測線路。",

        "更新 PID 自動溫度閉迴路迴路控制增益常數 (Kp/Ki/Kd)，避免腔體快速充氣時產生的溫度劇烈突波。",

        "觀察連續三個 Wafer Batch 沉積製程中最高溫度起伏，確認動態溫度誤差控制在標準 ±0.5°C 內。"

      ];

    } else if (key === 'NOVELLUS') {

      title = "Novellus PVD 手臂轉軸碰撞 Alarm 與絕對編碼器 (Absolute Encoder) 偏移排查 SOP";

      steps = [

        "在機台 EAP 實體控制面板輸入 Robot Initialize，解除傳送手臂因為微小干擾產生的硬體碰撞互鎖 (Interlock)。",

        "現場卸下 Robot 基座防塵護蓋，使用除塵無水乙醇精密清理機械手臂絕對編碼器 (Optical Encoder) 之光學讀取頭。",

        "裝載示教用專用假晶圓 (Teaching Wafer)，點選 System Teaching Mode，重新寫入三軸 X/Y/Z 絕對對準坐標。",

        "進入手動 JOG 模式點動傳送 Dummy Wafer，利用電流通訊監視軟體確認馬達旋轉力矩電流 (Motor Torque) 反饋平緩。",

        "切回 AUTO 自動模式，設定 15 次連續傳送測試 Wafer，確認晶圓置放位置偏移小於 0.1 mm 並完成復歸。"

      ];

    } else if (key === 'SECS') {

      title = "EAP SECS/GEM 工業通訊網路協定中斷 (HSMS Offline) 復歸排查 SOP";

      steps = [

        "從 EAP 網管控制台 ping 機台網路卡 IP，並使用網路測試儀確認 TCP/IP 端點實體網路線路通暢。",

        "確認機台 SECS 通訊端口 (Default Port: 5001) 沒有被其他工廠內網排程系統佔用，並發送 S1F1 連線握手命令。",

        "重啟 Host 端 SECS/GEM HSMS 網路驅動模組，並向機台發送 S1F13 通訊建立請求指令 (Establish Communication)。",

        "將機台實體 Control State (控制狀態) 切換回 Host Online 模式，並調取線上 Recipe 進行主控端同步比對。",

        "確認 EAP 連續接收機台發送的 S1F14 與 S6F11 事件回報封包，完成數據與事件監控即時回復。"

      ];

    } else {

      title = `針對「${queryText || '設備參數異常'}」AI 快速多模態故障診斷報告`;

      steps = [

        `發送 SECS S1F1 連線檢查，確認 ${activeTelemetryId} 的 EAP 通訊主線路並無實體離線或 HSMS 丟包。`,

        `讀取 FDC 即時 Telemetry 最近 15 筆數據，判定該機台健康度是否小於 80%，分析是否有硬件物理疲勞跡象。`,

        "指派現場輪班助理工程師前往機台位置，確認實體三色警示塔燈 (Signal Tower) 是否為亮紅燈或閃爍狀態。",

        "對感測器阻抗訊號或壓力閥反饋引腳進行除雜訊接地處理，避免雜訊波動引起系統 OOC (Out of Control) 誤告警。",

        "執行預防性 PM 機台自檢程序並點擊「Reset System」，以自動化軟體清除警報日誌並重新啟用上線。"

      ];

    }

    const payload = {

      title,

      steps,

      rawQuery: queryText || 'Quick Trigger'

    };

    // 模擬 AI 生成的打字機動態載入效果

    let currentIndex = 0;

    payload.activeSteps = [];

    setCopilotResponse(payload);



    const typeInterval = setInterval(() => {

      setCopilotResponse(prev => {

        if (prev && prev.steps && currentIndex < prev.steps.length) {

          const updated = {

            ...prev,

            activeSteps: [...(prev.activeSteps || []), prev.steps[currentIndex]]

          };

          currentIndex++;

          return updated;

        } else {

          clearInterval(typeInterval);

          setCopilotTyping(false);

          return prev;

        }

      });

    }, 220); // 平滑打字速度

  };

  // 處理 Checklist 核取方塊

  const handleCheckStep = (index) => {

    setCopilotCheckedSteps(prev => ({

      ...prev,

      [index]: !prev[index]

    }));

  };

  // 🚀 一鍵將 AI SOP 核對報告注入到目前事件的處理對策並結案

  const handleInjectToSOPDraft = () => {

    if (!copilotResponse || !copilotResponse.steps) {

      alert('請先點擊下方的 AI 診斷按鈕產生 SOP 對策！');

      return;

    }



    // 計算 Checklist 完成度

    const total = copilotResponse.steps.length;

    const completed = Object.values(copilotCheckedSteps).filter(Boolean).length;



    // 生成精美專業的結案說明文本

    const dateStr = new Date().toLocaleString();

    let text = `【🛡️ FAB-GPT 工業 AI 輔助 SOP 結案報告】\n`;

    text += `[診斷主題]：${copilotResponse.title}\n`;

    text += `[對策核對進度]：已完成排查步驟 (${completed}/${total}) -> 進度 ${Math.round((completed/total)*100)}%\n`;

    text += `[SOP 實施對策清單]：\n`;

    copilotResponse.steps.forEach((step, idx) => {

      const isOk = copilotCheckedSteps[idx] ? '【已完成 ✓】' : '【未實施 ✗】';

      text += `${idx + 1}. ${isOk} ${step}\n`;

    });

    text += `\n[EES 系統記錄]：本對策已於 ${dateStr} 經由工程師現場實施、聯網驗證並通過 Cpk 評估，符合 EAP/EES 關閉規範。`;

    setResolutionText(text);

    // 如果當前有打開事件 modal，直接切換到 close 狀態

    if (selectedEventId) {

      setModalAction('close');

      alert('✨ AI 診斷對策已成功注入！已為您自動展開異常處理對策填寫區，請在結案視窗內確認後即可送出結案！');

    } else {

      // 提示使用者去選取事件

      alert('✨ AI SOP 對策已複製並儲存在系統快取中！請在下方「異常事件列表」中點擊任何一個異常事件，打開詳細視窗，該 SOP 將自動填寫在 Resolution 輸入框中，供您一鍵極速結案！');

    }

  };

  const handleEvidenceChange = (e) => {

    const file = e.target.files[0];

    if (!file) {

      setEvidence(null);

      return;

    }



    const reader = new FileReader();

    reader.onload = () => {

      setEvidence({

        name: file.name,

        type: file.type,

        base64: reader.result

      });

    };

    reader.onerror = () => {

      setModalError('讀取現場檔案失敗。');

    };

    reader.readAsDataURL(file);

  };

  // 處理檔案選取與 Base64 轉換

  const handleFileChange = (e) => {

    const file = e.target.files[0];

    if (!file) {

      setAttachment(null);

      return;

    }



    const reader = new FileReader();

    reader.onload = () => {

      setAttachment({

        name: file.name,

        base64: reader.result.split(',')[1]

      });

    };

    reader.onerror = () => {

      setModalError('讀取檔案失敗。');

    };

    reader.readAsDataURL(file);

  };

  // 處理查詢提交

  const handleSearch = (e) => {

    e.preventDefault();

    setLoading(true);

    Promise.all([fetchEvents(), fetchStats()]).then(() => setLoading(false)).catch(() => setLoading(false));

  };

  // 重設篩選器

  const handleReset = () => {

    setFilterStatus('');

    setFilterMachine('');

    setFilterStartDate('');

    setFilterEndDate('');

    setLoading(true);

    // 使用 setTimeout 讓 state 更新完成

    setTimeout(() => {

      fetch('/api/events')

        .then(res => res.json())

        .then(json => {

          if (json.success) setEvents(json.data);

          fetchStats();

          setLoading(false);

        })
        .catch(() => {
          setLoading(false);
        });

    }, 50);

  };

  // 快速統計面板點選篩選

  const handleStatCardClick = (status) => {

    setFilterStatus(filterStatus === status ? '' : status);

  };

  // 格式化時間

  const formatDateTime = (dateStr) => {

    if (!dateStr) return '-';

    // 解析 SQLite 預設的 UTC 時間

    const d = new Date(dateStr.replace(' ', 'T') + 'Z');

    // 如果解析失敗，嘗試直接解析

    if (isNaN(d.getTime())) {

      return new Date(dateStr).toLocaleString('zh-TW', { hour12: false });

    }

    return d.toLocaleString('zh-TW', {

      year: 'numeric',

      month: '2-digit',

      day: '2-digit',

      hour: '2-digit',

      minute: '2-digit',

      second: '2-digit',

      hour12: false

    });

  };

  return (

    <div className="app-container">

      {/* HEADER 區塊 */}

      <header>

        <div className="brand-section">

          <div className="logo-badge">W</div>

          <div className="brand-info">

            <h1>FAB 12 異常事件管理中心</h1>

            <p>EAP/EES AUTOMATION ENGINEERING SYSTEM</p>

          </div>

        </div>

        <div className="system-time">

          <span>📡 SYSTEM LIVE</span>

          <span>{currentTime.toLocaleDateString()} {currentTime.toLocaleTimeString()}</span>

        </div>

      </header>

      {/* DASHBOARD 統計區塊 */}

      <section className="stats-grid">

        <div className={`stat-card total ${filterStatus === '' ? 'active-filter' : ''}`} onClick={() => handleStatCardClick('')}>

          <div className="stat-info">

            <p>Total Events</p>

            <h2>{stats.total}</h2>

          </div>

          <div className="stat-icon">📊</div>

        </div>

        <div className={`stat-card pending ${filterStatus === 'Pending' ? 'active-filter' : ''}`} onClick={() => handleStatCardClick('Pending')}>

          <div className="stat-info">

            <p>Pending 待處理</p>

            <h2>{stats.pending}</h2>

          </div>

          <div className="stat-icon" style={{color: 'var(--status-pending)'}}>⚠️</div>

        </div>

        <div className={`stat-card ack ${filterStatus === 'Ack' ? 'active-filter' : ''}`} onClick={() => handleStatCardClick('Ack')}>

          <div className="stat-info">

            <p>Acknowledged 已確認</p>

            <h2>{stats.ack}</h2>

          </div>

          <div className="stat-icon" style={{color: 'var(--status-ack)'}}>👁️</div>

        </div>

        <div className={`stat-card assign ${filterStatus === 'Assign' ? 'active-filter' : ''}`} onClick={() => handleStatCardClick('Assign')}>

          <div className="stat-info">

            <p>Assigned 已指派</p>

            <h2>{stats.assign}</h2>

          </div>

          <div className="stat-icon" style={{color: 'var(--status-assign)'}}>🛠️</div>

        </div>

        <div className={`stat-card closed ${filterStatus === 'Closed' ? 'active-filter' : ''}`} onClick={() => handleStatCardClick('Closed')}>

          <div className="stat-info">

            <p>Closed 已解決</p>

            <h2>{stats.closed}</h2>

          </div>

          <div className="stat-icon" style={{color: 'var(--status-closed)'}}>✅</div>

        </div>

      </section>

      <section style={{marginBottom: '2rem'}}>

        <div style={{

          background: 'var(--bg-card)',

          backdropFilter: 'blur(12px)',

          WebkitBackdropFilter: 'blur(12px)',

          border: '1px solid var(--border-color)',

          borderRadius: '16px',

          padding: '1.5rem',

          boxShadow: 'inset 0 0 20px rgba(255, 255, 255, 0.01)'

        }}>

          <h3 style={{

            fontSize: '1rem',

            fontWeight: '600',

            color: '#38bdf8',

            marginBottom: '1rem',

            display: 'flex',

            alignItems: 'center',

            gap: '0.5rem',

            letterSpacing: '0.5px'

          }}>

            📡 FAB 12 設備監控與 EAP 即時感測數據 (EES Live Node Map)

            <span style={{

              fontSize: '0.75rem',

              background: 'rgba(56, 189, 248, 0.1)',

              padding: '0.2rem 0.5rem',

              borderRadius: '4px',

              animation: 'pulse 2s infinite'

            }}>LIVE STREAMING</span>

          </h3>



          <div className="ees-layout-container" style={{

            display: 'grid',

            gridTemplateColumns: '1.8fr 1fr',

            gap: '1.25rem',

            marginBottom: '1rem',

            alignItems: 'start'

          }}>

            {/* Left side: Equipment Cards */}

            <div style={{

              display: 'grid',

              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',

              gap: '0.75rem'

            }}>

              {Object.keys(telemetry).map(key => {

                const node = telemetry[key];

                const isSelected = filterMachine === key;

                const isViewingSpc = activeTelemetryId === key;



                let healthColor = 'var(--status-closed)';

                if (node.health <= 70) healthColor = 'var(--severity-critical)';

                else if (node.health <= 90) healthColor = 'var(--severity-warning)';



                return (

                  <div

                    key={key}

                    onClick={() => {

                      setFilterMachine(filterMachine === key ? '' : key);

                      setActiveTelemetryId(key);

                    }}

                    style={{

                      background: isViewingSpc ? 'rgba(56, 189, 248, 0.08)' : (isSelected ? 'rgba(99, 102, 241, 0.08)' : 'rgba(15, 23, 42, 0.4)'),

                      border: isViewingSpc ? '1px solid #38bdf8' : (isSelected ? '1px solid var(--primary)' : '1px solid var(--border-color)'),

                      borderRadius: '12px',

                      padding: '0.75rem 1rem',

                      cursor: 'pointer',

                      transition: 'var(--transition-smooth)',

                      position: 'relative',

                      overflow: 'hidden',

                      boxShadow: isViewingSpc ? '0 0 15px rgba(56, 189, 248, 0.15)' : (isSelected ? '0 0 15px rgba(99, 102, 241, 0.15)' : 'none')

                    }}

                    onMouseEnter={(e) => {

                      e.currentTarget.style.transform = 'translateY(-2px)';

                      e.currentTarget.style.borderColor = isViewingSpc ? '#38bdf8' : (isSelected ? 'var(--primary)' : 'rgba(255,255,255,0.15)');

                    }}

                    onMouseLeave={(e) => {

                      e.currentTarget.style.transform = 'translateY(0)';

                      e.currentTarget.style.borderColor = isViewingSpc ? '#38bdf8' : (isSelected ? 'var(--primary)' : 'var(--border-color)');

                    }}

                  >

                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem'}}>

                      <span style={{fontSize: '0.85rem', fontWeight: '700', color: '#f8fafc', fontFamily: 'var(--font-mono)'}}>{key}</span>

                      <div style={{display: 'flex', alignItems: 'center', gap: '0.35rem'}}>

                        <span style={{

                          width: '7px',

                          height: '7px',

                          borderRadius: '50%',

                          background: node.health <= 70 ? 'var(--severity-critical)' : (node.health <= 90 ? 'var(--severity-warning)' : 'var(--status-closed)'),

                          boxShadow: `0 0 8px ${node.health <= 70 ? 'var(--severity-critical)' : (node.health <= 90 ? 'var(--severity-warning)' : 'var(--status-closed)')}`,

                          display: 'inline-block',

                          animation: node.health <= 90 ? 'pulse 1.2s infinite' : 'none'

                        }} />

                        <span style={{fontSize: '0.65rem', color: 'var(--text-secondary)', fontWeight: '600'}}>

                          {node.health <= 70 ? 'ALARM' : (node.health <= 90 ? 'OOC' : 'ONLINE')}

                        </span>

                      </div>

                    </div>

                    <div style={{fontSize: '0.725rem', color: 'var(--text-secondary)', marginBottom: '0.5rem'}}>{node.name}</div>

                    <div style={{

                      background: 'rgba(0,0,0,0.2)',

                      padding: '0.4rem 0.5rem',

                      borderRadius: '8px',

                      fontFamily: 'var(--font-mono)',

                      fontSize: '0.725rem',

                      display: 'flex',

                      flexDirection: 'column',

                      gap: '0.25rem',

                      marginBottom: '0.5rem'

                    }}>

                      <div style={{display: 'flex', justifyContent: 'space-between'}}>

                        <span style={{color: 'var(--text-muted)'}}>{node.s1Name}:</span>

                        <span style={{color: '#38bdf8', fontWeight: '600'}}>{node.sensor1} <span style={{fontSize: '0.6rem', color: 'var(--text-muted)'}}>{node.s1Unit}</span></span>

                      </div>

                      <div style={{display: 'flex', justifyContent: 'space-between'}}>

                        <span style={{color: 'var(--text-muted)'}}>{node.s2Name}:</span>

                        <span style={{color: '#fbbf24', fontWeight: '600'}}>{node.sensor2} <span style={{fontSize: '0.6rem', color: 'var(--text-muted)'}}>{node.s2Unit}</span></span>

                      </div>

                    </div>

                    <div>

                      <div style={{display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: '0.25rem'}}>

                        <span>EES 診斷健康度</span>

                        <span style={{color: healthColor, fontWeight: '700'}}>{node.health}%</span>

                      </div>

                      <div style={{width: '100%', height: '3px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', overflow: 'hidden'}}>

                        <div style={{width: `${node.health}%`, height: '100%', background: healthColor, borderRadius: '2px', transition: 'width 0.5s ease-out'}} />

                      </div>

                    </div>

                  </div>

                );

              })}

            </div>

            {/* Right side: Cleanroom Spatial Visualizer floorplan */}

            <div className="cleanroom-visualizer-card" style={{

              background: 'rgba(15, 23, 42, 0.45)',

              border: '1px solid var(--border-color)',

              borderRadius: '12px',

              padding: '1rem',

              display: 'flex',

              flexDirection: 'column',

              minHeight: '260px',

              position: 'relative',

              overflow: 'hidden'

            }}>

              <div style={{fontSize: '0.775rem', fontWeight: '700', color: '#c084fc', marginBottom: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>

                <span>🗺️ FAB 12 Cleanroom 實體配置圖</span>

                <span style={{fontSize: '0.65rem', color: 'var(--text-muted)'}}>BAY-01 ~ BAY-05</span>

              </div>



              <svg viewBox="0 0 200 180" style={{width: '100%', height: '100%', minHeight: '190px'}}>

                {/* Floor boundaries */}

                <rect x="5" y="5" width="190" height="170" rx="8" fill="rgba(255,255,255,0.01)" stroke="rgba(255,255,255,0.08)" strokeWidth="0.8" strokeDasharray="3,2" />



                {/* Cleanroom Bays dividers */}

                <line x1="5" y1="38" x2="195" y2="38" stroke="rgba(255,255,255,0.03)" strokeWidth="0.6" />

                <line x1="5" y1="72" x2="195" y2="72" stroke="rgba(255,255,255,0.03)" strokeWidth="0.6" />

                <line x1="5" y1="106" x2="195" y2="106" stroke="rgba(255,255,255,0.03)" strokeWidth="0.6" />

                <line x1="5" y1="140" x2="195" y2="140" stroke="rgba(255,255,255,0.03)" strokeWidth="0.6" />



                {/* Bay Text Labels */}

                <text x="12" y="24" fill="rgba(255,255,255,0.25)" fontSize="5.5" fontWeight="600" style={{letterSpacing: '0.2px'}}>BAY-01 (Lithography)</text>

                <text x="12" y="58" fill="rgba(255,255,255,0.25)" fontSize="5.5" fontWeight="600" style={{letterSpacing: '0.2px'}}>BAY-02 (Dry Etching)</text>

                <text x="12" y="92" fill="rgba(255,255,255,0.25)" fontSize="5.5" fontWeight="600" style={{letterSpacing: '0.2px'}}>BAY-03 (Thin Film CVD)</text>

                <text x="12" y="126" fill="rgba(255,255,255,0.25)" fontSize="5.5" fontWeight="600" style={{letterSpacing: '0.2px'}}>BAY-04 (Thin Film PVD)</text>

                <text x="12" y="160" fill="rgba(255,255,255,0.25)" fontSize="5.5" fontWeight="600" style={{letterSpacing: '0.2px'}}>BAY-05 (Metrology)</text>

                {(() => {

                  const nodePositions = {

                    'EXP-01': { x: 165, y: 22, name: 'EXP-01' },

                    'ETCH-02': { x: 165, y: 56, name: 'ETCH-02' },

                    'CVD-03': { x: 165, y: 90, name: 'CVD-03' },

                    'PVD-04': { x: 165, y: 124, name: 'PVD-04' },

                    'MET-05': { x: 165, y: 158, name: 'MET-05' }

                  };



                  return Object.keys(nodePositions).map(key => {

                    const pos = nodePositions[key];

                    const node = telemetry[key] || { health: 100 };

                    const isSelected = filterMachine === key;

                    const isViewingSpc = activeTelemetryId === key;



                    let nodeColor = 'var(--status-closed)';

                    if (node.health <= 70) nodeColor = 'var(--severity-critical)';

                    else if (node.health <= 90) nodeColor = 'var(--severity-warning)';



                    return (

                      <g key={key} style={{cursor: 'pointer'}} onClick={() => {

                        setFilterMachine(filterMachine === key ? '' : key);

                        setActiveTelemetryId(key);

                      }}>

                        {/* Hover bounding track */}

                        <rect x="8" y={pos.y - 12} width="184" height="24" rx="4" fill={isViewingSpc ? 'rgba(56, 189, 248, 0.04)' : (isSelected ? 'rgba(99, 102, 241, 0.04)' : 'transparent')} stroke={isViewingSpc ? '#38bdf8' : (isSelected ? 'var(--primary)' : 'transparent')} strokeWidth="0.5" />



                        {/* Connecting tracking line */}

                        <line x1="85" y1={pos.y} x2={pos.x} y2={pos.y} stroke="rgba(255,255,255,0.03)" strokeWidth="0.5" strokeDasharray="2,2" />



                        {/* Machine Text */}

                        <text x="148" y={pos.y + 2} fill={isViewingSpc ? '#38bdf8' : '#f8fafc'} fontSize="6" fontWeight="700" textAnchor="end" fontFamily="var(--font-mono)">{key}</text>



                        {/* Dynamic pulsing halo for alarms */}

                        {node.health <= 90 && (

                          <circle cx={pos.x} cy={pos.y} r="8.5" fill="none" stroke={nodeColor} strokeWidth="0.8" style={{transformOrigin: `${pos.x}px ${pos.y}px`, animation: 'cleanroomPulse 1.5s infinite'}} />

                        )}



                        {/* Glowing node point */}

                        <circle cx={pos.x} cy={pos.y} r="4.5" fill={nodeColor} style={{filter: `drop-shadow(0 0 4px ${nodeColor})`}} />

                        <circle cx={pos.x} cy={pos.y} r="2.2" fill="#ffffff" />

                      </g>

                    );

                  });

                })()}

              </svg>

            </div>

          </div>

          {/* =================================================================

              📈 EES FDC SPC 即時製程監控圖表 (Advanced SPC Run Chart Panel)

              ================================================================= */}

          {activeTelemetryId && (

            <div className="spc-chart-panel" style={{

              marginTop: '1.5rem',

              paddingTop: '1.5rem',

              borderTop: '1px dashed rgba(255, 255, 255, 0.08)',

              animation: 'fadeIn 0.4s ease-out'

            }}>

              <div style={{

                display: 'flex',

                justifyContent: 'space-between',

                alignItems: 'center',

                flexWrap: 'wrap',

                gap: '1rem',

                marginBottom: '1rem'

              }}>

                <div style={{display: 'flex', alignItems: 'center', gap: '0.65rem'}}>

                  <span style={{fontSize: '1.3rem'}}>📈</span>

                  <div>

                    <h4 style={{fontSize: '0.95rem', fontWeight: '700', color: '#f8fafc', margin: 0}}>

                      {activeTelemetryId} - {telemetry[activeTelemetryId]?.name} 即時 SPC 監控管制圖

                    </h4>

                    <p style={{fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0}}>

                      指標感測器：{telemetry[activeTelemetryId]?.s1Name} (規格限界 Target: {calcSpcStats(activeTelemetryId).target} {calcSpcStats(activeTelemetryId).unit})

                    </p>

                  </div>

                </div>

                {/* 智慧狀態標籤 */}

                <div style={{

                  display: 'flex',

                  alignItems: 'center',

                  gap: '0.75rem',

                  flexWrap: 'wrap'

                }}>

                  {/* 模擬注入控制按鈕 */}

                  <div style={{

                    display: 'flex',

                    gap: '0.4rem',

                    background: 'rgba(255,255,255,0.02)',

                    padding: '0.2rem 0.4rem',

                    borderRadius: '6px',

                    border: '1px solid rgba(255,255,255,0.05)'

                  }}>

                    <span style={{fontSize: '0.675rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', marginRight: '0.2rem'}}>🧪 Demo 注入：</span>

                    <button

                      type="button"

                      className="btn"

                      style={{

                        padding: '0.2rem 0.5rem',

                        fontSize: '0.675rem',

                        background: forcedAnomaly === 'OOC' ? 'var(--severity-critical)' : 'rgba(244, 63, 94, 0.1)',

                        color: forcedAnomaly === 'OOC' ? 'white' : 'var(--severity-critical)',

                        border: '1px solid var(--severity-critical)',

                        borderRadius: '4px',

                        cursor: 'pointer',

                        fontWeight: '700',

                        transition: 'all 0.2s'

                      }}

                      onClick={() => {

                        const nextState = forcedAnomaly === 'OOC' ? null : 'OOC';

                        setForcedAnomaly(nextState);



                        setSecsLogs(prevLogs => {

                          const timeStr = new Date().toLocaleTimeString();

                          const newLog = `[${timeStr}] SECS OUT -> S5F1 [DEMO_TRIGGER] 手動${nextState === 'OOC' ? '注入' : '解除'} OOC 超限異常！`;

                          return [...prevLogs.slice(-14), newLog];

                        });

                      }}

                    >

                      💥 注入 OOC 異常

                    </button>

                    <button

                      type="button"

                      className="btn"

                      style={{

                        padding: '0.2rem 0.5rem',

                        fontSize: '0.675rem',

                        background: forcedAnomaly === 'PM' ? 'var(--status-closed)' : 'rgba(16, 185, 129, 0.1)',

                        color: forcedAnomaly === 'PM' ? 'white' : 'var(--status-closed)',

                        border: '1px solid var(--status-closed)',

                        borderRadius: '4px',

                        cursor: 'pointer',

                        fontWeight: '700',

                        transition: 'all 0.2s'

                      }}

                      onClick={() => {

                        const nextState = forcedAnomaly === 'PM' ? null : 'PM';

                        setForcedAnomaly(nextState);



                        setSecsLogs(prevLogs => {

                          const timeStr = new Date().toLocaleTimeString();

                          const newLog = `[${timeStr}] SECS OUT -> S2F21 [PM_TRIGGER] 手動${nextState === 'PM' ? '執行' : '解除'}設備基準點校正復歸 (Auto-Calibration)。`;

                          return [...prevLogs.slice(-14), newLog];

                        });

                      }}

                    >

                      🔧 設備 PM 復歸

                    </button>

                  </div>

                  <div style={{

                    display: 'flex',

                    alignItems: 'center',

                    gap: '0.65rem',

                    background: 'rgba(0,0,0,0.25)',

                    padding: '0.35rem 0.75rem',

                    borderRadius: '6px',

                    border: '1px solid rgba(255,255,255,0.06)'

                  }}>

                    <span style={{fontSize: '0.725rem', color: 'var(--text-muted)', fontWeight: '600'}}>FDC 即時評估狀態：</span>

                    <span style={{

                      fontSize: '0.775rem',

                      fontWeight: '700',

                      color: calcSpcStats(activeTelemetryId).statusColor,

                      textShadow: `0 0 10px ${calcSpcStats(activeTelemetryId).statusColor}33`

                    }}>

                      {calcSpcStats(activeTelemetryId).statusText}

                    </span>

                  </div>

                </div>

              </div>

              <div className="spc-layout-grid">

                {/* 1. 折線圖 */}

                <div style={{

                  background: 'rgba(4, 7, 18, 0.4)',

                  border: '1px solid rgba(255, 255, 255, 0.05)',

                  borderRadius: '12px',

                  padding: '0.75rem',

                  position: 'relative',

                  overflow: 'hidden',

                  minHeight: '150px'

                }}>

                  {(() => {

                    const stats = calcSpcStats(activeTelemetryId);

                    const history = telemetryHistory[activeTelemetryId] || [];



                    // 產生 SVG 坐報點 (viewBox 是 0 0 460 140)

                    const pts = history.map((val, idx) => {

                      const x = 45 + idx * (390 / 14);

                      const y = getSpcY(val, activeTelemetryId);

                      return { x, y, val };

                    });

                    // 畫折線 Path

                    let lineD = '';

                    if (pts.length > 0) {

                      lineD = `M ${pts[0].x} ${pts[0].y} ` + pts.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ');

                    }

                    // 畫折線下方漸層區域 Path

                    const areaD = lineD ? `${lineD} L ${pts[pts.length - 1].x} 125 L ${pts[0].x} 125 Z` : '';

                    // 獲取規格線的 Y 坐標

                    const yUcl = getSpcY(stats.ucl, activeTelemetryId);

                    const yLcl = getSpcY(stats.lcl, activeTelemetryId);

                    const yUsl = getSpcY(stats.usl, activeTelemetryId);

                    const yLsl = getSpcY(stats.lsl, activeTelemetryId);

                    const yTarget = getSpcY(stats.target, activeTelemetryId);

                    return (

                      <svg viewBox="0 0 460 140" style={{width: '100%', height: '100%', display: 'block'}}>

                        <defs>

                          <linearGradient id="chart-area-grad" x1="0" y1="0" x2="0" y2="1">

                            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.25" />

                            <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.0" />

                          </linearGradient>

                        </defs>



                        {/* 靜態橫向網格線 */}

                        <line x1="40" y1="15" x2="435" y2="15" stroke="rgba(255,255,255,0.02)" strokeWidth="1" />

                        <line x1="40" y1="42.5" x2="435" y2="42.5" stroke="rgba(255,255,255,0.02)" strokeWidth="1" />

                        <line x1="40" y1="70" x2="435" y2="70" stroke="rgba(255,255,255,0.02)" strokeWidth="1" />

                        <line x1="40" y1="97.5" x2="435" y2="97.5" stroke="rgba(255,255,255,0.02)" strokeWidth="1" />

                        <line x1="40" y1="125" x2="435" y2="125" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />

                        {/* CL 中心標準線 */}

                        <line x1="40" y1={yTarget} x2="435" y2={yTarget} stroke="#10b981" strokeWidth="1" strokeDasharray="3,3" strokeOpacity="0.8" />

                        <text x="438" y={yTarget + 2.5} fill="#10b981" fontSize="6" fontWeight="600" opacity="0.8">CL</text>

                        {/* UCL / LCL 管制極限線 (黃霓虹虛線) */}

                        <line x1="40" y1={yUcl} x2="435" y2={yUcl} stroke="var(--severity-warning)" strokeWidth="1" strokeDasharray="4,2" strokeOpacity="0.9" />

                        <text x="438" y={yUcl + 2.5} fill="var(--severity-warning)" fontSize="6" fontWeight="600">UCL</text>

                        <line x1="40" y1={yLcl} x2="435" y2={yLcl} stroke="var(--severity-warning)" strokeWidth="1" strokeDasharray="4,2" strokeOpacity="0.9" />

                        <text x="438" y={yLcl + 2.5} fill="var(--severity-warning)" fontSize="6" fontWeight="600">LCL</text>

                        {/* USL / LSL 物理規格限線 (紅霓虹實線) */}

                        <line x1="40" y1={yUsl} x2="435" y2={yUsl} stroke="var(--severity-critical)" strokeWidth="0.8" strokeOpacity="0.75" />

                        <text x="438" y={yUsl + 2.5} fill="var(--severity-critical)" fontSize="6" fontWeight="700">USL</text>



                        <line x1="40" y1={yLsl} x2="435" y2={yLsl} stroke="var(--severity-critical)" strokeWidth="0.8" strokeOpacity="0.75" />

                        <text x="438" y={yLsl + 2.5} fill="var(--severity-critical)" fontSize="6" fontWeight="700">LSL</text>

                        {/* 左側數值刻度 */}

                        <text x="35" y={yTarget + 2.5} fill="var(--text-muted)" fontSize="6.5" textAnchor="end" fontFamily="var(--font-mono)">{stats.target}</text>

                        <text x="35" y={yUcl + 2.5} fill="var(--text-muted)" fontSize="6.5" textAnchor="end" fontFamily="var(--font-mono)">{stats.ucl}</text>

                        <text x="35" y={yLcl + 2.5} fill="var(--text-muted)" fontSize="6.5" textAnchor="end" fontFamily="var(--font-mono)">{stats.lcl}</text>

                        {/* 漸層區域 */}

                        {areaD && <path d={areaD} fill="url(#chart-area-grad)" />}

                        {/* 折線 */}

                        {lineD && (

                          <path

                            d={lineD}

                            fill="none"

                            stroke="#38bdf8"

                            strokeWidth="2"

                            strokeLinecap="round"

                            strokeLinejoin="round"

                            style={{ filter: 'drop-shadow(0 0 4px rgba(56,189,248,0.4))' }}

                          />

                        )}

                        {/* 數據結點 */}

                        {pts.map((p, i) => {

                          const isOoc = p.val > stats.ucl || p.val < stats.lcl;

                          const isOos = p.val > stats.usl || p.val < stats.lsl;



                          let dotColor = '#38bdf8';

                          if (isOos) dotColor = 'var(--severity-critical)';

                          else if (isOoc) dotColor = 'var(--severity-warning)';

                          return (

                            <g key={i}>

                              {(isOoc || isOos) && (

                                <circle

                                  cx={p.x}

                                  cy={p.y}

                                  r="5.5"

                                  fill="none"

                                  stroke={dotColor}

                                  strokeWidth="1.2"

                                  style={{ transformOrigin: `${p.x}px ${p.y}px`, animation: 'radarGlow 1.2s infinite' }}

                                />

                              )}

                              <circle

                                cx={p.x}

                                cy={p.y}

                                r={i === pts.length - 1 ? "3.5" : "2.2"}

                                fill={i === pts.length - 1 ? "#ffffff" : dotColor}

                                stroke={i === pts.length - 1 ? "#38bdf8" : "none"}

                                strokeWidth={i === pts.length - 1 ? "1" : "0"}

                              />

                            </g>

                          );

                        })}

                      </svg>

                    );

                  })()}

                </div>

                {/* 2. 統計分析看板 (SPC Stats Card) */}

                <div style={{

                  background: 'rgba(15, 23, 42, 0.45)',

                  border: '1px solid var(--border-color)',

                  borderRadius: '12px',

                  padding: '0.75rem',

                  display: 'flex',

                  flexDirection: 'column',

                  justifyContent: 'space-between'

                }}>

                  {(() => {

                    const stats = calcSpcStats(activeTelemetryId);

                    return (

                      <>

                        <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.75rem'}}>

                          <div style={{ background: 'rgba(0,0,0,0.2)', padding: '0.4rem', borderRadius: '6px' }}>

                            <div style={{color: 'var(--text-muted)', fontSize: '0.65rem', marginBottom: '0.15rem'}}>平均值 (Mean, μ)</div>

                            <div style={{fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: '#f8fafc', fontWeight: '700'}}>

                              {stats.mean} <span style={{fontSize: '0.65rem', color: 'var(--text-muted)'}}>{stats.unit}</span>

                            </div>

                          </div>



                          <div style={{ background: 'rgba(0,0,0,0.2)', padding: '0.4rem', borderRadius: '6px' }}>

                            <div style={{color: 'var(--text-muted)', fontSize: '0.65rem', marginBottom: '0.15rem'}}>標準差 (σ)</div>

                            <div style={{fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: '#38bdf8', fontWeight: '700'}}>

                              {stats.std}

                            </div>

                          </div>

                          <div style={{ background: 'rgba(0,0,0,0.2)', padding: '0.4rem', borderRadius: '6px' }}>

                            <div style={{color: 'var(--text-muted)', fontSize: '0.65rem', marginBottom: '0.15rem'}}>管制上限 (UCL)</div>

                            <div style={{fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--severity-warning)', fontWeight: '600'}}>

                              {stats.ucl} <span style={{fontSize: '0.6rem', color: 'var(--text-muted)'}}>{stats.unit}</span>

                            </div>

                          </div>

                          <div style={{ background: 'rgba(0,0,0,0.2)', padding: '0.4rem', borderRadius: '6px' }}>

                            <div style={{color: 'var(--text-muted)', fontSize: '0.65rem', marginBottom: '0.15rem'}}>管制下限 (LCL)</div>

                            <div style={{fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--severity-warning)', fontWeight: '600'}}>

                              {stats.lcl} <span style={{fontSize: '0.6rem', color: 'var(--text-muted)'}}>{stats.unit}</span>

                            </div>

                          </div>

                        </div>

                        {/* Cpk 製程能力動態指數 */}

                        <div style={{

                          display: 'flex',

                          alignItems: 'center',

                          gap: '0.75rem',

                          background: 'rgba(99, 102, 241, 0.04)',

                          padding: '0.5rem 0.6rem',

                          borderRadius: '8px',

                          border: '1px dashed rgba(99, 102, 241, 0.15)',

                          marginTop: '0.4rem'

                        }}>

                          <div style={{

                            width: '34px',

                            height: '34px',

                            borderRadius: '50%',

                            background: `conic-gradient(${stats.statusColor} ${Math.min(100, Math.max(0, parseFloat(stats.cpk) * 50)) }%, rgba(255,255,255,0.05) 0)`,

                            display: 'flex',

                            alignItems: 'center',

                            justifyContent: 'center',

                            boxShadow: `0 0 8px ${stats.statusColor}1c`

                          }}>

                            <div style={{

                              width: '28px',

                              height: '28px',

                              borderRadius: '50%',

                              background: '#131a2c',

                              display: 'flex',

                              alignItems: 'center',

                              justifyContent: 'center',

                              fontSize: '0.65rem',

                              fontWeight: '700',

                              color: '#ffffff'

                            }}>

                              Cpk

                            </div>

                          </div>

                          <div>

                            <div style={{color: 'var(--text-muted)', fontSize: '0.65rem', lineHeight: '1'}}>實時製程能力指數</div>

                            <div style={{fontSize: '1.1rem', fontWeight: '800', color: stats.statusColor, fontFamily: 'var(--font-mono)', marginTop: '0.15rem', lineHeight: '1'}}>

                              {stats.cpk}

                            </div>

                {/* 3. SECS/GEM HSMS 通訊協定終端 (Full-width terminal log) */}

                <div style={{

                  gridColumn: '1 / -1',

                  background: '#02040a',

                  border: '1px solid rgba(16, 185, 129, 0.15)',

                  borderRadius: '10px',

                  padding: '0.65rem 1rem',

                  fontFamily: 'var(--font-mono)',

                  fontSize: '0.725rem',

                  color: '#10b981',

                  boxShadow: 'inset 0 0 15px rgba(16, 185, 129, 0.05)',

                  maxHeight: '110px',

                  overflowY: 'auto',

                  marginTop: '0.75rem',

                  position: 'relative'

                }}>

                  {/* Terminal Header */}

                  <div style={{

                    display: 'flex',

                    justifyContent: 'space-between',

                    alignItems: 'center',

                    borderBottom: '1px solid rgba(16, 185, 129, 0.15)',

                    paddingBottom: '0.35rem',

                    marginBottom: '0.4rem',

                    fontSize: '0.65rem',

                    color: 'rgba(16, 185, 129, 0.6)',

                    fontWeight: '700'

                  }}>

                    <span>📟 SECS/GEM HSMS REAL-TIME EQUIPMENT INTERACTION TERMINAL</span>

                    <span style={{animation: 'pulse 1.5s infinite'}}>● ACTIVE</span>

                  </div>

                  {/* Logs list */}

                  <div className="secs-logs-list" style={{display: 'flex', flexDirection: 'column', gap: '0.2rem'}}>

                    {secsLogs.length === 0 ? (

                      <div style={{color: 'rgba(16, 185, 129, 0.4)'}}>[INIT] SECS/GEM 連線建立成功，通訊接口 TCP/IP Port: 5001 已連線。正在接收 HSMS 變數回報 (CEID=1002)...</div>

                    ) : (

                      secsLogs.map((log, idx) => (

                        <div key={idx} style={{

                          animation: 'fadeIn 0.2s ease-out',

                          color: log.includes('S5F1') ? 'var(--severity-critical)' : (log.includes('S2F21') ? '#c084fc' : '#10b981')

                        }}>

                          {log}

                        </div>

                      ))

                    )}

                  </div>

                </div>

                          </div>

                        </div>

                      </>

                    );

                  })()}

                </div>

              </div>

            </div>

          )}

        </div>

      </section>

      {/* FILTER PANEL 篩選區塊 */}

      <section className="filter-panel">

        <form onSubmit={handleSearch}>

          <div className="filter-grid">

            <div className="filter-group">

              <label>機台篩選</label>

              <select

                className="filter-input"

                value={filterMachine}

                onChange={(e) => setFilterMachine(e.target.value)}

              >

                <option value="">-- 所有機台 --</option>

                {machines.map(m => (

                  <option key={m.id} value={m.id}>{m.id} - {m.name}</option>

                ))}

              </select>

            </div>



            <div className="filter-group">

              <label>起始時間</label>

              <input

                type="date"

                className="filter-input"

                value={filterStartDate}

                onChange={(e) => setFilterStartDate(e.target.value)}

              />

            </div>



            <div className="filter-group">

              <label>結束時間</label>

              <input

                type="date"

                className="filter-input"

                value={filterEndDate}

                onChange={(e) => setFilterEndDate(e.target.value)}

              />

            </div>

            <div className="filter-buttons">

              <button type="submit" className="btn btn-primary">🔍 查詢</button>

              <button type="button" className="btn btn-secondary" onClick={handleReset}>🔄 重設</button>

            </div>

          </div>

        </form>

      </section>

      <section className="copilot-panel" style={{

        background: 'var(--bg-card)',

        backdropFilter: 'blur(12px)',

        WebkitBackdropFilter: 'blur(12px)',

        border: '1px solid var(--border-color)',

        borderRadius: '16px',

        padding: '1.5rem',

        marginBottom: '2rem',

        boxShadow: 'inset 0 0 25px rgba(255, 255, 255, 0.01)',

        position: 'relative',

        overflow: 'hidden'

      }}>

        <div style={{

          display: 'flex',

          justifyContent: 'space-between',

          alignItems: 'center',

          flexWrap: 'wrap',

          gap: '1rem',

          borderBottom: '1px solid rgba(255,255,255,0.06)',

          paddingBottom: '0.75rem',

          marginBottom: '1rem'

        }}>

          <h3 style={{

            fontSize: '1rem',

            fontWeight: '700',

            color: '#a855f7',

            display: 'flex',

            alignItems: 'center',

            gap: '0.5rem',

            letterSpacing: '0.5px'

          }}>

            🤖 FAB-GPT 智能設備故障排查終端 (AI SOP Command Center)

            <span style={{

              fontSize: '0.7rem',

              background: 'rgba(168, 85, 247, 0.1)',

              padding: '0.2rem 0.5rem',

              borderRadius: '4px',

              border: '1px solid rgba(168, 85, 247, 0.25)',

              color: '#c084fc'

            }}>KNOWLEDGE BASE 2.1</span>

          </h3>

          <div style={{fontSize: '0.85rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)'}}>

            MODEL: WINBOND-FAB-L4-FINE-TUNED

          </div>

        </div>

        {/* 快速知識庫問答按鈕 */}

        <div style={{

          marginBottom: '1rem',

          display: 'flex',

          flexDirection: 'column',

          gap: '0.5rem'

        }}>

          <div style={{fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: '600'}}>

            ⚡ 廠區常規異常診斷快速入口 (點擊觸發 AI 推理)：

          </div>

          <div style={{

            display: 'flex',

            flexWrap: 'wrap',

            gap: '0.5rem'

          }}>

            <button

              type="button"

              className="btn btn-secondary"

              style={{padding: '0.35rem 0.75rem', fontSize: '0.75rem', borderColor: 'rgba(14, 165, 233, 0.3)', background: 'rgba(14, 165, 233, 0.03)'}}

              onClick={() => triggerCopilotQuery('ASML 曝光光源能量低', 'ASML')}

            >

              ☀️ ASML 曝光光源能量異常

            </button>

            <button

              type="button"

              className="btn btn-secondary"

              style={{padding: '0.35rem 0.75rem', fontSize: '0.75rem', borderColor: 'rgba(251, 191, 36, 0.3)', background: 'rgba(251, 191, 36, 0.03)'}}

              onClick={() => triggerCopilotQuery('Lam Research MFC 流量卡滯', 'LAM')}

            >

              🌀 Lam 蝕刻機 MFC/真空洩漏

            </button>

            <button

              type="button"

              className="btn btn-secondary"

              style={{padding: '0.35rem 0.75rem', fontSize: '0.75rem', borderColor: 'rgba(168, 85, 247, 0.3)', background: 'rgba(168, 85, 247, 0.03)'}}

              onClick={() => triggerCopilotQuery('AMAT CVD 加熱器阻抗波動', 'AMAT')}

            >

              🔥 AMAT CVD 溫度控制失配

            </button>

            <button

              type="button"

              className="btn btn-secondary"

              style={{padding: '0.35rem 0.75rem', fontSize: '0.75rem', borderColor: 'rgba(244, 63, 94, 0.3)', background: 'rgba(244, 63, 94, 0.03)'}}

              onClick={() => triggerCopilotQuery('Novellus PVD 手臂碰撞 Alarm', 'NOVELLUS')}

            >

              🦾 Novellus PVD 手臂校位與 PM

            </button>

            <button

              type="button"

              className="btn btn-secondary"

              style={{padding: '0.35rem 0.75rem', fontSize: '0.75rem', borderColor: 'rgba(52, 211, 153, 0.3)', background: 'rgba(52, 211, 153, 0.03)'}}

              onClick={() => triggerCopilotQuery('SECS GEM 通訊離線斷線', 'SECS')}

            >

              📡 EAP SECS/GEM HSMS 斷線重連

            </button>

          </div>

        </div>

        {/* 自由輸入查詢 */}

        <div style={{

          display: 'flex',

          gap: '0.75rem',

          marginBottom: '1.25rem'

        }}>

          <input

            type="text"

            className="filter-input"

            style={{flex: 1, padding: '0.6rem 1rem', fontSize: '0.85rem'}}

            placeholder="請輸入異常代碼、故障描述或 SECS 指令進行工業 AI 診斷 (如：E-2048, MFC Error)..."

            value={copilotQuery}

            onChange={(e) => setCopilotQuery(e.target.value)}

            onKeyDown={(e) => {

              if (e.key === 'Enter') {

                triggerCopilotQuery(copilotQuery);

              }

            }}

          />

          <button

            type="button"

            className="btn btn-primary"

            style={{

              padding: '0.6rem 1.25rem',

              fontSize: '0.85rem',

              background: 'linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)',

              boxShadow: '0 4px 15px rgba(168, 85, 247, 0.25)',

              border: 'none',

              borderRadius: '8px',

              color: 'white',

              cursor: 'pointer'

            }}

            onClick={() => triggerCopilotQuery(copilotQuery)}

            disabled={copilotTyping || !copilotQuery.trim()}

          >

            {copilotTyping ? '🧠 AI 推理中...' : '⚡ AI 診斷'}

          </button>

        </div>

        {/* AI 終端視窗 Response Area */}

        {copilotResponse && copilotResponse.title && (

          <div className="copilot-terminal" style={{

            background: '#040711',

            border: '1px solid rgba(168, 85, 247, 0.15)',

            borderRadius: '12px',

            padding: '1.25rem',

            fontFamily: 'var(--font-mono)',

            fontSize: '0.85rem',

            position: 'relative'

          }}>

            {/* Terminal Header */}

            <div style={{

              display: 'flex',

              justifyContent: 'space-between',

              alignItems: 'center',

              borderBottom: '1px solid rgba(255,255,255,0.05)',

              paddingBottom: '0.5rem',

              marginBottom: '0.75rem',

              fontSize: '0.75rem',

              color: 'rgba(255,255,255,0.3)'

            }}>

              <span>CONSOLE: /bin/fab-gpt --diagnostic-report</span>

              <span style={{color: '#a855f7', fontWeight: '700'}}>● RUNNING</span>

            </div>

            {/* Title */}

            <h4 style={{

              color: '#c084fc',

              fontSize: '0.9rem',

              marginBottom: '0.75rem',

              display: 'flex',

              alignItems: 'center',

              gap: '0.4rem',

              fontFamily: 'var(--font-mono)'

            }}>

              <span className="terminal-prompt">&gt;</span> {copilotResponse.title}

            </h4>

            {/* Checklist */}

            <div style={{

              display: 'flex',

              flexDirection: 'column',

              gap: '0.6rem',

              marginBottom: '1.25rem'

            }}>

              {(copilotResponse.activeSteps || []).map((step, idx) => (

                <label

                  key={idx}

                  style={{

                    display: 'flex',

                    alignItems: 'flex-start',

                    gap: '0.65rem',

                    cursor: 'pointer',

                    background: copilotCheckedSteps[idx] ? 'rgba(52, 211, 153, 0.03)' : 'rgba(255,255,255,0.01)',

                    padding: '0.4rem 0.6rem',

                    borderRadius: '6px',

                    border: copilotCheckedSteps[idx] ? '1px solid rgba(52, 211, 153, 0.15)' : '1px solid transparent',

                    transition: 'var(--transition-smooth)'

                  }}

                >

                  <input

                    type="checkbox"

                    checked={!!copilotCheckedSteps[idx]}

                    onChange={() => handleCheckStep(idx)}

                    style={{

                      marginTop: '0.15rem',

                      accentColor: 'var(--status-closed)',

                      width: '14px',

                      height: '14px',

                      cursor: 'pointer'

                    }}

                  />

                  <span style={{

                    color: copilotCheckedSteps[idx] ? 'var(--text-secondary)' : '#e2e8f0',

                    textDecoration: copilotCheckedSteps[idx] ? 'line-through' : 'none',

                    lineHeight: '1.4'

                  }}>

                    {step}

                  </span>

                </label>

              ))}



              {copilotTyping && (

                <div style={{display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#c084fc', paddingLeft: '0.6rem'}}>

                  <span className="terminal-cursor" />

                  <span style={{fontSize: '0.75rem', opacity: 0.8}}>AI 正在與知識庫進行聯結分析...</span>

                </div>

              )}

            </div>

            {/* Progress Bar & Actions */}

            {!copilotTyping && copilotResponse.activeSteps?.length === copilotResponse.steps?.length && (

              <div style={{

                display: 'flex',

                justifyContent: 'space-between',

                alignItems: 'center',

                flexWrap: 'wrap',

                gap: '1rem',

                borderTop: '1px solid rgba(255,255,255,0.05)',

                paddingTop: '0.75rem',

                marginTop: '0.5rem'

              }}>

                {/* SOP checklist progress */}

                <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, minWidth: '200px'}}>

                  <span style={{fontSize: '0.75rem', color: 'var(--text-muted)'}}>SOP 現場落實進度：</span>

                  <div style={{flex: 1, height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden', maxWidth: '120px'}}>

                    <div style={{

                      height: '100%',

                      background: 'var(--status-closed)',

                      width: `${Math.round((Object.values(copilotCheckedSteps).filter(Boolean).length / copilotResponse.steps.length) * 100)}%`,

                      transition: 'width 0.3s ease'

                    }} />

                  </div>

                  <span style={{fontSize: '0.75rem', fontWeight: '700', color: 'var(--status-closed)', fontFamily: 'var(--font-mono)'}}>

                    {Math.round((Object.values(copilotCheckedSteps).filter(Boolean).length / copilotResponse.steps.length) * 100)}%

                  </span>

                </div>

                {/* Inject action */}

                <button

                  type="button"

                  className="btn"

                  style={{

                    padding: '0.4rem 0.9rem',

                    fontSize: '0.75rem',

                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',

                    color: 'white',

                    boxShadow: '0 0 10px rgba(16, 185, 129, 0.25)',

                    border: 'none',

                    borderRadius: '8px',

                    fontWeight: '700',

                    cursor: 'pointer'

                  }}

                  onClick={handleInjectToSOPDraft}

                >

                  🚀 一鍵套用 SOP 進度至異常結案對策

                </button>

              </div>

            )}

          </div>

        )}

      </section>

      {/* TABLE 異常列表區塊 */}

      <main className="table-container">

        {loading ? (

          <div className="no-data">📦 正在加載晶圓廠異常數據...</div>

        ) : events.length === 0 ? (

          <div className="no-data">✨ 目前無符合篩選條件的異常事件。</div>

        ) : (

          <table className="event-table">

            <thead>

              <tr>

                <th>事件ID</th>

                <th>等級</th>

                <th>異常代碼</th>

                <th>機台編號 (位置)</th>

                <th>異常描述說明</th>

                <th>狀態</th>

                <th>發生時間 (Local)</th>

                <th>負責工程師</th>

              </tr>

            </thead>

            <tbody>

              {events.map((event) => (

                <tr key={event.id} onClick={() => handleOpenModal(event.id)}>

                  <td className="mono-font">#{event.id}</td>

                  <td>

                    <span className={`badge badge-${event.severity.toLowerCase()}`}>

                      {event.severity}

                    </span>

                  </td>

                  <td className="mono-font" style={{fontWeight: 700, color: '#f8fafc'}}>{event.event_code}</td>

                  <td>

                    <div>{event.machine_id}</div>

                    <div style={{fontSize: '0.75rem', color: 'var(--text-muted)'}}>{event.machine_name} ({event.machine_location})</div>

                  </td>

                  <td style={{maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>

                    {event.description}

                  </td>

                  <td>

                    <span className={`badge badge-status-${event.status.toLowerCase()}`}>

                      {event.status}

                    </span>

                  </td>

                  <td className="time-cell">{formatDateTime(event.created_at)}</td>

                  <td>{event.assigned_engineer ? `🛠️ ${event.assigned_engineer}` : <span style={{color: 'var(--text-muted)'}}>-</span>}</td>

                </tr>

              ))}

            </tbody>

          </table>

        )}

      </main>

      {/* DETAIL MODAL 彈跳明細視窗 */}

      {selectedEventId && selectedEvent && (

        <div className="modal-overlay" onClick={handleCloseModal}>

          <div className="modal-content" onClick={(e) => e.stopPropagation()}>

            <div className="modal-header">

              <div className="modal-title-area">

                <div style={{display: 'flex', gap: '0.75rem', alignItems: 'center'}}>

                  <span className={`badge badge-${selectedEvent.severity.toLowerCase()}`}>{selectedEvent.severity}</span>

                  <span className={`badge badge-status-${selectedEvent.status.toLowerCase()}`}>{selectedEvent.status}</span>

                </div>

                <h2>異常事件明細：{selectedEvent.event_code}</h2>

              </div>

              <button className="close-btn" onClick={handleCloseModal}>&times;</button>

            </div>

            {modalLoading ? (

              <div style={{padding: '2rem', textAlign: 'center'}}>資料處理中，請稍候...</div>

            ) : (

              <>

                {/* 顯示系統成功與錯誤訊息 */}

                {modalError && <div className="action-form" style={{borderColor: 'var(--severity-critical)', color: 'var(--severity-critical)', marginBottom: '1rem'}}>⚠️ {modalError}</div>}

                {modalSuccess && <div className="action-form" style={{borderColor: 'var(--status-closed)', color: 'var(--status-closed)', marginBottom: '1rem'}}>✅ {modalSuccess}</div>}

                <div className="detail-grid">

                  <div className="detail-item">

                    <label>事件編號</label>

                    <span className="mono-font">#{selectedEvent.id}</span>

                  </div>

                  <div className="detail-item">

                    <label>發生時間 (UTC/GMT)</label>

                    <span className="mono-font">{formatDateTime(selectedEvent.created_at)}</span>

                  </div>

                  <div className="detail-item">

                    <label>機台編號 & 名稱</label>

                    <span>{selectedEvent.machine_id} - {selectedEvent.machine_name} ({selectedEvent.machine_type})</span>

                  </div>

                  <div className="detail-item">

                    <label>機台座落區域</label>

                    <span>{selectedEvent.machine_location}</span>

                  </div>

                  <div className="detail-item">

                    <label>現場回報人員</label>

                    <span>{selectedEvent.operator_id || 'System Auto-Trigger'}</span>

                  </div>

                  <div className="detail-item">

                    <label>負責工程師</label>

                    <span>{selectedEvent.assigned_engineer ? `🛠️ ${selectedEvent.assigned_engineer}` : '尚未指派'}</span>

                  </div>

                  <div className="detail-item full-width">

                    <label>異常詳細敘述說明</label>

                    <span style={{lineHeight: '1.5', color: '#e2e8f0'}}>{selectedEvent.description}</span>

                  </div>

                  {selectedEvent.status === 'Closed' && (

                    <div className="detail-item full-width" style={{background: 'rgba(52, 211, 153, 0.05)', padding: '0.75rem', borderRadius: '8px', border: '1px solid rgba(52, 211, 153, 0.2)'}}>

                      <label style={{color: 'var(--status-closed)'}}>🔧 處理對策與結案說明</label>

                      <span style={{lineHeight: '1.5', fontWeight: 500, display: 'block'}}>{selectedEvent.resolution}</span>

                      {selectedEvent.report_file && (

                        <div style={{marginTop: '0.75rem'}}>

                          <a

                            href={selectedEvent.report_file}

                            target="_blank"

                            rel="noopener noreferrer"

                            className="btn btn-secondary"

                            style={{

                              display: 'inline-flex',

                              padding: '0.35rem 0.75rem',

                              fontSize: '0.8rem',

                              color: 'var(--status-closed)',

                              borderColor: 'rgba(52, 211, 153, 0.3)',

                              background: 'rgba(52, 211, 153, 0.03)'

                            }}

                          >

                            📄 下載結案報告 (PPT/PDF)

                          </a>

                        </div>

                      )}

                    </div>

                  )}

                </div>

                {/* 狀態轉移工作流操作區 */}

                {selectedEvent.status !== 'Closed' && (

                  <div className="action-section">

                    <h3>⚙️ SOP 異常處置流程 (Workflow Status Change)</h3>



                    <div className="action-buttons-group">

                      {/* PENDING 階段 */}

                      {selectedEvent.status === 'Pending' && (

                        <>

                          <button

                            className="btn btn-primary"

                            style={{background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)', boxShadow: '0 4px 15px rgba(14, 165, 233, 0.2)'}}

                            onClick={() => handleUpdateStatus('Ack')}

                          >

                            👁️ 確認受理 (Ack)

                          </button>

                          <button

                            className="btn btn-secondary"

                            onClick={() => setModalAction('assign')}

                          >

                            👤 直接指派 (Assign)

                          </button>

                          <button

                            className="btn btn-secondary"

                            onClick={() => setModalAction('close')}

                          >

                            🚫 快速關閉事件 (Close)

                          </button>

                        </>

                      )}

                      {/* ACK 階段 */}

                      {selectedEvent.status === 'Ack' && (

                        <>

                          <button

                            className="btn btn-primary"

                            style={{background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)'}}

                            onClick={() => setModalAction('assign')}

                          >

                            👤 指派負責人 (Assign)

                          </button>

                          <button

                            className="btn btn-secondary"

                            onClick={() => setModalAction('close')}

                          >

                            🚫 關閉事件 (Close)

                          </button>

                        </>

                      )}

                      {/* ASSIGN 階段 */}

                      {selectedEvent.status === 'Assign' && (

                        <button

                          className="btn btn-primary"

                          style={{background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', boxShadow: '0 4px 15px rgba(16, 185, 129, 0.2)'}}

                          onClick={() => setModalAction('close')}

                        >

                          🔧 填寫對策結案 (Close)

                        </button>

                      )}

                    </div>

                    {/* 指派負責工程師表單 */}

                    {modalAction === 'assign' && (

                      <div className="action-form">

                        <div className="form-group" style={{marginBottom: '1rem'}}>

                          <label>請選擇負責工程師 (Required)</label>

                          <select

                            className="form-input"

                            value={engineerName}

                            onChange={(e) => setEngineerName(e.target.value)}

                          >

                            <option value="">-- 請選擇負責工程師 --</option>

                            {engineers.map(eng => (

                              <option key={eng.id} value={eng.name}>

                                {eng.name} ({eng.department})

                              </option>

                            ))}

                          </select>

                        </div>

                        <div style={{display: 'flex', gap: '0.5rem', justifyContent: 'flex-end'}}>

                          <button className="btn btn-secondary" onClick={() => setModalAction('')}>取消</button>

                          <button

                            className="btn btn-primary"

                            onClick={() => handleUpdateStatus('Assign', { assigned_engineer: engineerName })}

                            disabled={!engineerName.trim()}

                          >

                            送出指派

                          </button>

                        </div>

                      </div>

                    )}

                     {/* 填寫對策結案表單 */}

                     {modalAction === 'close' && (

                       <div className="action-form">

                         {/* 📷 步驟 1：上傳實體影像佐證 */}

                         <div className="form-group" style={{

                           marginBottom: '1rem',

                           background: 'rgba(168, 85, 247, 0.03)',

                           padding: '0.75rem 1rem',

                           borderRadius: '12px',

                           border: '1px dashed rgba(168, 85, 247, 0.25)'

                         }}>

                           <label style={{

                             fontSize: '0.825rem',

                             color: '#c084fc',

                             fontWeight: '600',

                             display: 'flex',

                             alignItems: 'center',

                             gap: '0.25rem'

                           }}>

                             📷 步驟 1：上傳現場異常影片或照片 (選填，可啟動 AI 視覺診斷)

                           </label>

                           <input

                             type="file"

                             className="form-input"

                             accept="image/*,video/*"

                             style={{padding: '0.4rem', marginTop: '0.5rem', background: 'rgba(15, 23, 42, 0.4)'}}

                             onChange={handleEvidenceChange}

                           />

                           {evidence && (

                             <div style={{marginTop: '0.75rem', animation: 'fadeIn 0.2s ease-out'}}>

                               <div style={{fontSize: '0.775rem', color: 'var(--status-closed)', marginBottom: '0.4rem', fontWeight: '500'}}>

                                 ✓ 影像載入成功：{evidence.name}

                               </div>

                               <div style={{

                                 borderRadius: '8px',

                                 overflow: 'hidden',

                                 border: '1px solid rgba(255,255,255,0.08)',

                                 maxHeight: '130px',

                                 display: 'flex',

                                 justifyContent: 'center',

                                 background: '#040711'

                               }}>

                                 {evidence.type.startsWith('image/') ? (

                                   <img src={evidence.base64} alt="Evidence" style={{maxWidth: '100%', maxHeight: '130px', objectFit: 'contain'}} />

                                 ) : (

                                   <video src={evidence.base64} controls style={{maxWidth: '100%', maxHeight: '130px'}} />

                                 )}

                               </div>

                             </div>

                           )}

                         </div>

                         <div className="form-group" style={{marginBottom: '1rem'}}>

                           <div style={{width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem', flexWrap: 'wrap', gap: '0.5rem'}}>

                             <label style={{fontSize: '0.85rem', fontWeight: '600'}}>📝 步驟 2：請輸入異常處理對策與原因分析 (Required)</label>

                             <button

                               type="button"

                               className="btn"

                               style={{

                                 padding: '0.35rem 0.85rem',

                                 fontSize: '0.75rem',

                                 borderRadius: '8px',

                                 background: 'linear-gradient(135deg, #a855f7 0%, #6366f1 100%)',

                                 color: 'white',

                                 border: 'none',

                                 boxShadow: '0 0 12px rgba(168, 85, 247, 0.4)',

                                 cursor: 'pointer',

                                 fontWeight: '700',

                                 animation: aiLoading ? 'pulse 1s infinite' : 'none'

                               }}

                               onClick={handleAICopilot}

                               disabled={aiLoading}

                             >

                               {aiLoading ? '⚡ AI Vision 正在聯合分析中...' : '✨ 啟動 AI 多模態視覺診斷'}

                             </button>

                           </div>

                           <div style={{display: 'flex', gap: '0.35rem', flexWrap: 'wrap', marginBottom: '0.75rem', marginTop: '0.25rem'}}>

                             <div style={{width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.15rem'}}>

                               <span style={{fontSize: '0.725rem', color: 'var(--text-muted)'}}>💡 常用 SOP 範本快速套用：</span>

                             </div>

                             {[

                               '重啟機台並執行基準點自動校正 (Auto-Calibration) 復歸。',

                               '氣體流量控制器 (MFC) 異常，已更換全新備品並測試通過。',

                               '晶圓傳送手臂定位異常，執行手動示教 (Teaching) 校正復歸。',

                               '調整溫度控制參數回歸規格界限內，持續觀察監控。'

                             ].map((tpl, i) => (

                               <button

                                 key={i}

                                 type="button"

                                 className="btn btn-secondary"

                                 style={{

                                   padding: '0.2rem 0.5rem',

                                   fontSize: '0.7rem',

                                   borderRadius: '6px',

                                   background: 'rgba(255,255,255,0.03)',

                                   border: '1px solid rgba(255,255,255,0.06)'

                                 }}

                                 onClick={() => setResolutionText(tpl)}

                               >

                                 📋 範本 {i+1}

                               </button>

                             ))}

                           </div>

                          <textarea

                            className="form-input"

                            rows="3"

                            style={{resize: 'none'}}

                            placeholder="例如: 更換氣體流量控制器、重啟機台並校正復歸、恢復正常參數..."

                            value={resolutionText}

                            onChange={(e) => setResolutionText(e.target.value)}

                          />

                        </div>



                        <div className="form-group" style={{marginBottom: '1rem'}}>

                          <label style={{fontSize: '0.85rem', color: 'var(--text-secondary)'}}>📎 上傳結案報告 (PPT / PDF, 選填)</label>

                          <input

                            type="file"

                            className="form-input"

                            accept=".pdf,.ppt,.pptx"

                            style={{padding: '0.5rem'}}

                            onChange={handleFileChange}

                          />

                          {attachment && (

                            <div style={{fontSize: '0.8rem', color: 'var(--status-closed)', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.25rem'}}>

                              <span>✓</span> <span>已選取待上傳報告：{attachment.name}</span>

                            </div>

                          )}

                        </div>

                        <div style={{display: 'flex', gap: '0.5rem', justifyContent: 'flex-end'}}>

                          <button className="btn btn-secondary" onClick={() => setModalAction('')}>取消</button>

                          <button

                            className="btn btn-primary"

                            style={{background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)'}}

                            onClick={() => handleUpdateStatus('Closed', {

                              assigned_engineer: engineerName || selectedEvent.assigned_engineer || 'System',

                              resolution: resolutionText,

                              attachment: attachment

                            })}

                            disabled={!resolutionText.trim()}

                          >

                            確認結案

                          </button>

                        </div>

                      </div>

                    )}

                  </div>

                )}

              </>

            )}

          </div>

        </div>

      )}

    </div>

  );

}

export default App;

