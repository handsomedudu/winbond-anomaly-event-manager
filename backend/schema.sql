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
