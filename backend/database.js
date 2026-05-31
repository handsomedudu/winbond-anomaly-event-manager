const fs = require('fs');
const path = require('path');

const dbJsonPath = path.join(__dirname, 'database.json');

// 預設資料（包含新增的工程師表）
const defaultMachines = [
  { id: 'EXP-01', name: '曝光機 01 (ASML NXT)', type: 'Lithography', location: 'Area-A 1F' },
  { id: 'ETCH-02', name: '蝕刻機 02 (Lam Research)', type: 'Etch', location: 'Area-A 2F' },
  { id: 'CVD-03', name: '化學氣相沉積機 03 (Applied Materials)', type: 'Deposition', location: 'Area-B 1F' },
  { id: 'PVD-04', name: '物理氣相沉積機 04 (Novellus)', type: 'Deposition', location: 'Area-B 2F' },
  { id: 'MET-05', name: '關鍵尺寸量測儀 05 (KLA-Tencor)', type: 'Metrology', location: 'Area-C 1F' }
];

const defaultEngineers = [
  { id: 'ENG-001', name: 'Kevin Chang', department: 'EAP 自動化課' },
  { id: 'ENG-002', name: 'Sarah Wang', department: 'EES 系統課' },
  { id: 'ENG-003', name: 'David Wu', department: '製程整合課' },
  { id: 'ENG-004', name: 'Alice Lin', department: '設備工程課' }
];

const defaultEvents = [
  {
    id: 1,
    event_code: 'E-1024',
    machine_id: 'EXP-01',
    severity: 'Critical',
    description: '雷射光源能量衰減異常，超出規格臨界值(OOS)。',
    status: 'Pending',
    created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    operator_id: 'OP-8801',
    assigned_engineer: null,
    resolution: null,
    report_file: null
  },
  {
    id: 2,
    event_code: 'E-0512',
    machine_id: 'CVD-03',
    severity: 'Warning',
    description: '腔體加熱器溫度波動過大，微幅超出控制界線(OOC)。',
    status: 'Pending',
    created_at: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    operator_id: 'OP-8802',
    assigned_engineer: null,
    resolution: null,
    report_file: null
  },
  {
    id: 3,
    event_code: 'E-2048',
    machine_id: 'ETCH-02',
    severity: 'Critical',
    description: '腔體真空度不足，氣體流量控制器(MFC)無響應。',
    status: 'Ack',
    created_at: new Date(Date.now() - 180 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 120 * 60 * 1000).toISOString(),
    operator_id: 'OP-8803',
    assigned_engineer: null,
    resolution: null,
    report_file: null
  },
  {
    id: 4,
    event_code: 'E-0256',
    machine_id: 'PVD-04',
    severity: 'Warning',
    description: '晶圓傳送手臂(Robot Arm)定位訊號微幅抖動。',
    status: 'Assign',
    created_at: new Date(Date.now() - 360 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 240 * 60 * 1000).toISOString(),
    operator_id: 'OP-8801',
    assigned_engineer: 'Kevin Chang',
    resolution: null,
    report_file: null
  },
  {
    id: 5,
    event_code: 'E-3072',
    machine_id: 'MET-05',
    severity: 'Warning',
    description: '量測鏡頭校正偏移(Tilt Error)。',
    status: 'Closed',
    created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 22 * 60 * 60 * 1000).toISOString(),
    operator_id: 'OP-8805',
    assigned_engineer: 'Sarah Wang',
    resolution: '執行鏡頭基準點自動校正(Auto-Calibration)，測試回歸後偏移值歸零，恢復生產。',
    report_file: null
  },
  {
    id: 6,
    event_code: 'E-4096',
    machine_id: 'ETCH-02',
    severity: 'Critical',
    description: 'SECS/GEM 通訊 heartbeat 中斷，EAP 無法取得機台即時狀態。',
    status: 'Pending',
    created_at: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    operator_id: 'OP-8804',
    assigned_engineer: null,
    resolution: null,
    report_file: null
  },
  {
    id: 7,
    event_code: 'E-1536',
    machine_id: 'CVD-03',
    severity: 'Critical',
    description: 'Run-to-Run 厚度補償量連續超出上限，疑似 recipe drift。',
    status: 'Ack',
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
    operator_id: 'OP-8806',
    assigned_engineer: null,
    resolution: null,
    report_file: null
  },
  {
    id: 8,
    event_code: 'E-3584',
    machine_id: 'EXP-01',
    severity: 'Warning',
    description: '曝光 overlay APC 回饋延遲，批次 wafer map 上傳逾時。',
    status: 'Pending',
    created_at: new Date(Date.now() - 75 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 75 * 60 * 1000).toISOString(),
    operator_id: 'OP-8807',
    assigned_engineer: null,
    resolution: null,
    report_file: null
  },
  {
    id: 9,
    event_code: 'E-6144',
    machine_id: 'PVD-04',
    severity: 'Warning',
    description: 'OHT 搬送完成訊號逾時，Load Port FOUP 狀態未同步。',
    status: 'Assign',
    created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    operator_id: 'OP-8808',
    assigned_engineer: 'David Wu',
    resolution: null,
    report_file: null
  },
  {
    id: 10,
    event_code: 'E-8192',
    machine_id: 'MET-05',
    severity: 'Critical',
    description: 'DI Water 流量低於管制下限，量測站冷卻迴路觸發 interlock。',
    status: 'Pending',
    created_at: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
    operator_id: 'OP-8810',
    assigned_engineer: null,
    resolution: null,
    report_file: null
  },
  {
    id: 11,
    event_code: 'E-2304',
    machine_id: 'EXP-01',
    severity: 'Warning',
    description: 'Reticle barcode 讀取失敗，光罩 ID 與批次 recipe 對應資料不一致。',
    status: 'Ack',
    created_at: new Date(Date.now() - 110 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 85 * 60 * 1000).toISOString(),
    operator_id: 'OP-8811',
    assigned_engineer: null,
    resolution: null,
    report_file: null
  },
  {
    id: 12,
    event_code: 'E-7424',
    machine_id: 'ETCH-02',
    severity: 'Critical',
    description: 'Endpoint detection 光譜訊號漂移，蝕刻終點判定失敗。',
    status: 'Pending',
    created_at: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
    operator_id: 'OP-8812',
    assigned_engineer: null,
    resolution: null,
    report_file: null
  },
  {
    id: 13,
    event_code: 'E-4864',
    machine_id: 'CVD-03',
    severity: 'Warning',
    description: 'NH3 gas cabinet 壓力波動，製程氣體供應低於預警門檻。',
    status: 'Assign',
    created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 150 * 60 * 1000).toISOString(),
    operator_id: 'OP-8813',
    assigned_engineer: 'Alice Lin',
    resolution: null,
    report_file: null
  },
  {
    id: 14,
    event_code: 'E-9216',
    machine_id: 'PVD-04',
    severity: 'Critical',
    description: 'Chamber plasma ignition 連續三片 wafer 點火失敗，疑似 RF matching 異常。',
    status: 'Ack',
    created_at: new Date(Date.now() - 160 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 130 * 60 * 1000).toISOString(),
    operator_id: 'OP-8814',
    assigned_engineer: null,
    resolution: null,
    report_file: null
  },
  {
    id: 15,
    event_code: 'E-6656',
    machine_id: 'MET-05',
    severity: 'Warning',
    description: 'CD-SEM recipe download from MES 逾時，量測站等待派工參數。',
    status: 'Pending',
    created_at: new Date(Date.now() - 32 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 32 * 60 * 1000).toISOString(),
    operator_id: 'OP-8815',
    assigned_engineer: null,
    resolution: null,
    report_file: null
  },
  {
    id: 16,
    event_code: 'E-1120',
    machine_id: 'EXP-01',
    severity: 'Critical',
    description: 'EES 偵測曝光 dose trend 觸發 SPC rule，系統自動 hold lot。',
    status: 'Assign',
    created_at: new Date(Date.now() - 7 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    operator_id: 'OP-8816',
    assigned_engineer: 'Sarah Wang',
    resolution: null,
    report_file: null
  },
  {
    id: 17,
    event_code: 'E-5376',
    machine_id: 'ETCH-02',
    severity: 'Warning',
    description: 'APC 參數回寫重複，Run-to-Run control 本批次被略過。',
    status: 'Pending',
    created_at: new Date(Date.now() - 58 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 58 * 60 * 1000).toISOString(),
    operator_id: 'OP-8817',
    assigned_engineer: null,
    resolution: null,
    report_file: null
  },
  {
    id: 18,
    event_code: 'E-7808',
    machine_id: 'CVD-03',
    severity: 'Critical',
    description: 'Furnace zone 3 溫度偏移超限，批次進片前觸發 interlock。',
    status: 'Pending',
    created_at: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
    operator_id: 'OP-8818',
    assigned_engineer: null,
    resolution: null,
    report_file: null
  },
  {
    id: 19,
    event_code: 'E-9472',
    machine_id: 'PVD-04',
    severity: 'Warning',
    description: 'Vacuum pump 電流趨勢異常，預知保養門檻已達警戒值。',
    status: 'Ack',
    created_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 125 * 60 * 1000).toISOString(),
    operator_id: 'OP-8819',
    assigned_engineer: null,
    resolution: null,
    report_file: null
  },
  {
    id: 20,
    event_code: 'E-5888',
    machine_id: 'MET-05',
    severity: 'Critical',
    description: 'Metrology wafer map 與 MES lot 資訊比對失敗，疑似批次混片風險。',
    status: 'Pending',
    created_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    operator_id: 'OP-8820',
    assigned_engineer: null,
    resolution: null,
    report_file: null
  }
];

// 初始化資料庫
function initDatabase() {
  if (!fs.existsSync(dbJsonPath)) {
    const data = {
      machines: defaultMachines,
      engineers: defaultEngineers,
      anomaly_events: defaultEvents,
      nextEventId: 6
    };
    fs.writeFileSync(dbJsonPath, JSON.stringify(data, null, 2), 'utf8');
    console.log('資料庫已初始化並寫入 database.json。');
  } else {
    // 確保現有 database.json 中也包含 engineers 資料表（防呆升級）
    try {
      const content = fs.readFileSync(dbJsonPath, 'utf8');
      const data = JSON.parse(content);
      let updated = false;
      if (!data.engineers) {
        data.engineers = defaultEngineers;
        updated = true;
      }
      // 確保事件記錄中有 report_file 欄位
      if (data.anomaly_events) {
        data.anomaly_events.forEach(e => {
          if (e.report_file === undefined) {
            e.report_file = null;
            updated = true;
          }
        });
      }
      if (updated) {
        fs.writeFileSync(dbJsonPath, JSON.stringify(data, null, 2), 'utf8');
        console.log('資料庫已順利升級加入 engineers 與 report_file 欄位。');
      } else {
        console.log('已讀取現有的 database.json 資料庫。');
      }
    } catch (e) {
      console.error('讀取升級 database.json 失敗:', e);
    }
  }
}

initDatabase();

// 讀取資料庫內容
function readData() {
  const content = fs.readFileSync(dbJsonPath, 'utf8');
  return JSON.parse(content);
}

// 寫入資料庫內容
function writeData(data) {
  fs.writeFileSync(dbJsonPath, JSON.stringify(data, null, 2), 'utf8');
}

// 模擬 SQL 查詢的封裝物件
const dbQuery = {
  async get(sql, params = []) {
    const dbData = readData();
    const sqlNormalized = sql.replace(/\s+/g, ' ').trim();

    // 1. 取得統計數據 (Stats)
    if (sqlNormalized.includes("SUM(case when status = 'Pending'")) {
      const events = dbData.anomaly_events;
      const stats = {
        total: events.length,
        pending: events.filter(e => e.status === 'Pending').length,
        ack: events.filter(e => e.status === 'Ack').length,
        assign: events.filter(e => e.status === 'Assign').length,
        closed: events.filter(e => e.status === 'Closed').length
      };
      return stats;
    }

    // 2. 取得單一事件明細
    if (sqlNormalized.includes('anomaly_events e JOIN machines m') && sqlNormalized.includes('e.id = ?')) {
      const eventId = Number(params[0]);
      const event = dbData.anomaly_events.find(e => e.id === eventId);
      if (!event) return null;
      
      const machine = dbData.machines.find(m => m.id === event.machine_id);
      return {
        ...event,
        machine_name: machine ? machine.name : 'Unknown',
        machine_type: machine ? machine.type : 'Unknown',
        machine_location: machine ? machine.location : 'Unknown'
      };
    }

    // 3. 檢查事件是否存在 (checkSql)
    if (sqlNormalized.includes('SELECT * FROM anomaly_events WHERE id = ?')) {
      const eventId = Number(params[0]);
      return dbData.anomaly_events.find(e => e.id === eventId) || null;
    }

    return null;
  },

  async all(sql, params = []) {
    const dbData = readData();
    const sqlNormalized = sql.replace(/\s+/g, ' ').trim();

    // 1. 取得機台清單
    if (sqlNormalized.includes('SELECT * FROM machines')) {
      return dbData.machines;
    }

    // 2. 取得工程師清單
    if (sqlNormalized.includes('SELECT * FROM engineers')) {
      return dbData.engineers;
    }

    // 3. 取得異常事件清單 (帶篩選)
    if (sqlNormalized.includes('anomaly_events e JOIN machines m')) {
      let filtered = [...dbData.anomaly_events];

      // 解析並套用參數篩選
      let paramIndex = 0;

      if (sqlNormalized.includes('AND e.status = ?')) {
        const statusVal = params[paramIndex++];
        filtered = filtered.filter(e => e.status === statusVal);
      }

      if (sqlNormalized.includes('AND e.machine_id = ?')) {
        const machineIdVal = params[paramIndex++];
        filtered = filtered.filter(e => e.machine_id === machineIdVal);
      }

      if (sqlNormalized.includes('AND e.created_at >= ?')) {
        const startDateVal = params[paramIndex++];
        const startTime = new Date(startDateVal).getTime();
        filtered = filtered.filter(e => new Date(e.created_at).getTime() >= startTime);
      }

      if (sqlNormalized.includes('AND e.created_at <= ?')) {
        const endDateVal = params[paramIndex++];
        const endTime = new Date(endDateVal).getTime();
        filtered = filtered.filter(e => new Date(e.created_at).getTime() <= endTime);
      }

      // 關聯機台名稱與位置
      const result = filtered.map(e => {
        const machine = dbData.machines.find(m => m.id === e.machine_id);
        return {
          ...e,
          machine_name: machine ? machine.name : 'Unknown',
          machine_location: machine ? machine.location : 'Unknown'
        };
      });

      // 排序（遞減排序）
      result.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      return result;
    }

    return [];
  },

  async run(sql, params = []) {
    const dbData = readData();
    const sqlNormalized = sql.replace(/\s+/g, ' ').trim();

    // 1. 更新事件狀態 (Ack)
    if (sqlNormalized.includes('UPDATE anomaly_events SET status = ?') && params.length === 2 && params[0] === 'Ack') {
      const [status, id] = params;
      const event = dbData.anomaly_events.find(e => e.id === Number(id));
      if (event) {
        event.status = status;
        event.updated_at = new Date().toISOString();
        writeData(dbData);
        return { changes: 1 };
      }
    }

    // 2. 更新事件狀態與指派人員 (Assign)
    if (sqlNormalized.includes('assigned_engineer = ?') && !sqlNormalized.includes('resolution = ?')) {
      const [status, assigned_engineer, id] = params;
      const event = dbData.anomaly_events.find(e => e.id === Number(id));
      if (event) {
        event.status = status;
        event.assigned_engineer = assigned_engineer;
        event.updated_at = new Date().toISOString();
        writeData(dbData);
        return { changes: 1 };
      }
    }

    // 3. 更新事件狀態與結案說明 (Closed)
    if (sqlNormalized.includes('resolution = ?')) {
      const eventId = Number(params[params.length - 1]);
      const event = dbData.anomaly_events.find(e => e.id === eventId);
      if (event) {
        event.status = params[0];
        event.assigned_engineer = params[1];
        event.resolution = params[2];
        if (sqlNormalized.includes('report_file = ?')) {
          event.report_file = params[3];
        }
        event.updated_at = new Date().toISOString();
        writeData(dbData);
        return { changes: 1 };
      }
    }

    return { changes: 0 };
  }
};

module.exports = {
  db: null,
  dbQuery
};
