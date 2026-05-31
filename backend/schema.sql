-- 機器資料表
CREATE TABLE IF NOT EXISTS machines (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    location TEXT NOT NULL
);

-- 異常事件資料表
CREATE TABLE IF NOT EXISTS anomaly_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_code TEXT NOT NULL,
    machine_id TEXT NOT NULL,
    severity TEXT NOT NULL CHECK(severity IN ('Warning', 'Critical')),
    description TEXT NOT NULL,
    status TEXT NOT NULL CHECK(status IN ('Pending', 'Ack', 'Assign', 'Closed')) DEFAULT 'Pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    operator_id TEXT,
    assigned_engineer TEXT,
    resolution TEXT,
    report_file TEXT,
    FOREIGN KEY(machine_id) REFERENCES machines(id)
);

-- 工程師資料表
CREATE TABLE IF NOT EXISTS engineers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    department TEXT NOT NULL
);

-- 初始機台資料
INSERT OR IGNORE INTO machines (id, name, type, location) VALUES 
('EXP-01', '曝光機 01 (ASML NXT)', 'Lithography', 'Area-A 1F'),
('ETCH-02', '蝕刻機 02 (Lam Research)', 'Etch', 'Area-A 2F'),
('CVD-03', '化學氣相沉積機 03 (Applied Materials)', 'Deposition', 'Area-B 1F'),
('PVD-04', '物理氣相沉積機 04 (Novellus)', 'Deposition', 'Area-B 2F'),
('MET-05', '關鍵尺寸量測儀 05 (KLA-Tencor)', 'Metrology', 'Area-C 1F');

-- 初始工程師資料
INSERT OR IGNORE INTO engineers (id, name, department) VALUES
('ENG-001', 'Kevin Chang', 'EAP 自動化課'),
('ENG-002', 'Sarah Wang', 'EES 系統課'),
('ENG-003', 'David Wu', '製程整合課'),
('ENG-004', 'Alice Lin', '設備工程課');

-- 初始模擬異常事件資料
-- 1. 待處理 (Pending) 異常
INSERT INTO anomaly_events (event_code, machine_id, severity, description, status, operator_id, created_at) VALUES
('E-1024', 'EXP-01', 'Critical', '雷射光源能量衰減異常，超出規格臨界值(OOS)。', 'Pending', 'OP-8801', DATETIME('now', '-30 minutes')),
('E-0512', 'CVD-03', 'Warning', '腔體加熱器溫度波動過大，微幅超出控制界線(OOC)。', 'Pending', 'OP-8802', DATETIME('now', '-1 hours'));

-- 2. 已確認 (Ack) 異常
INSERT INTO anomaly_events (event_code, machine_id, severity, description, status, operator_id, created_at, updated_at) VALUES
('E-2048', 'ETCH-02', 'Critical', '腔體真空度不足，氣體流量控制器(MFC)無響應。', 'Ack', 'OP-8803', DATETIME('now', '-3 hours'), DATETIME('now', '-2 hours'));

-- 3. 已指派 (Assign) 異常
INSERT INTO anomaly_events (event_code, machine_id, severity, description, status, operator_id, assigned_engineer, created_at, updated_at) VALUES
('E-0256', 'PVD-04', 'Warning', '晶圓傳送手臂(Robot Arm)定位訊號微幅抖動。', 'Assign', 'OP-8801', 'Kevin Chang', DATETIME('now', '-6 hours'), DATETIME('now', '-4 hours'));

-- 4. 已關閉 (Closed) 異常
INSERT INTO anomaly_events (event_code, machine_id, severity, description, status, operator_id, assigned_engineer, resolution, created_at, updated_at) VALUES
('E-3072', 'MET-05', 'Warning', '量測鏡頭校正偏移(Tilt Error)。', 'Closed', 'OP-8805', 'Sarah Wang', '執行鏡頭基準點自動校正(Auto-Calibration)，測試回歸後偏移值歸零，恢復生產。', DATETIME('now', '-24 hours'), DATETIME('now', '-22 hours'));

-- 5. 朋友測試後新增的 Fab/EAP-EES 多情境異常，用於查詢、排序與手機 DEMO
INSERT INTO anomaly_events (event_code, machine_id, severity, description, status, operator_id, assigned_engineer, created_at, updated_at) VALUES
('E-4096', 'ETCH-02', 'Critical', 'SECS/GEM 通訊 heartbeat 中斷，EAP 無法取得機台即時狀態。', 'Pending', 'OP-8804', NULL, DATETIME('now', '-45 minutes'), DATETIME('now', '-45 minutes')),
('E-1536', 'CVD-03', 'Critical', 'Run-to-Run 厚度補償量連續超出上限，疑似 recipe drift。', 'Ack', 'OP-8806', NULL, DATETIME('now', '-2 hours'), DATETIME('now', '-90 minutes')),
('E-3584', 'EXP-01', 'Warning', '曝光 overlay APC 回饋延遲，批次 wafer map 上傳逾時。', 'Pending', 'OP-8807', NULL, DATETIME('now', '-75 minutes'), DATETIME('now', '-75 minutes')),
('E-6144', 'PVD-04', 'Warning', 'OHT 搬送完成訊號逾時，Load Port FOUP 狀態未同步。', 'Assign', 'OP-8808', 'David Wu', DATETIME('now', '-5 hours'), DATETIME('now', '-3 hours')),
('E-8192', 'MET-05', 'Critical', 'DI Water 流量低於管制下限，量測站冷卻迴路觸發 interlock。', 'Pending', 'OP-8810', NULL, DATETIME('now', '-20 minutes'), DATETIME('now', '-20 minutes')),
('E-2304', 'EXP-01', 'Warning', 'Reticle barcode 讀取失敗，光罩 ID 與批次 recipe 對應資料不一致。', 'Ack', 'OP-8811', NULL, DATETIME('now', '-110 minutes'), DATETIME('now', '-85 minutes')),
('E-7424', 'ETCH-02', 'Critical', 'Endpoint detection 光譜訊號漂移，蝕刻終點判定失敗。', 'Pending', 'OP-8812', NULL, DATETIME('now', '-12 minutes'), DATETIME('now', '-12 minutes')),
('E-4864', 'CVD-03', 'Warning', 'NH3 gas cabinet 壓力波動，製程氣體供應低於預警門檻。', 'Assign', 'OP-8813', 'Alice Lin', DATETIME('now', '-4 hours'), DATETIME('now', '-150 minutes')),
('E-9216', 'PVD-04', 'Critical', 'Chamber plasma ignition 連續三片 wafer 點火失敗，疑似 RF matching 異常。', 'Ack', 'OP-8814', NULL, DATETIME('now', '-160 minutes'), DATETIME('now', '-130 minutes')),
('E-6656', 'MET-05', 'Warning', 'CD-SEM recipe download from MES 逾時，量測站等待派工參數。', 'Pending', 'OP-8815', NULL, DATETIME('now', '-32 minutes'), DATETIME('now', '-32 minutes')),
('E-1120', 'EXP-01', 'Critical', 'EES 偵測曝光 dose trend 觸發 SPC rule，系統自動 hold lot。', 'Assign', 'OP-8816', 'Sarah Wang', DATETIME('now', '-7 hours'), DATETIME('now', '-5 hours')),
('E-5376', 'ETCH-02', 'Warning', 'APC 參數回寫重複，Run-to-Run control 本批次被略過。', 'Pending', 'OP-8817', NULL, DATETIME('now', '-58 minutes'), DATETIME('now', '-58 minutes')),
('E-7808', 'CVD-03', 'Critical', 'Furnace zone 3 溫度偏移超限，批次進片前觸發 interlock。', 'Pending', 'OP-8818', NULL, DATETIME('now', '-8 minutes'), DATETIME('now', '-8 minutes')),
('E-9472', 'PVD-04', 'Warning', 'Vacuum pump 電流趨勢異常，預知保養門檻已達警戒值。', 'Ack', 'OP-8819', NULL, DATETIME('now', '-3 hours'), DATETIME('now', '-125 minutes')),
('E-5888', 'MET-05', 'Critical', 'Metrology wafer map 與 MES lot 資訊比對失敗，疑似批次混片風險。', 'Pending', 'OP-8820', NULL, DATETIME('now', '-5 minutes'), DATETIME('now', '-5 minutes'));
