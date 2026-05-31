CREATE TABLE IF NOT EXISTS machines (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    location TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS engineers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    department TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS anomaly_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_code TEXT NOT NULL,
    machine_id TEXT NOT NULL,
    severity TEXT NOT NULL CHECK(severity IN ('Warning', 'Critical')),
    description TEXT NOT NULL,
    status TEXT NOT NULL CHECK(status IN ('Pending', 'Ack', 'Assign', 'Closed')) DEFAULT 'Pending',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    operator_id TEXT,
    assigned_engineer TEXT,
    resolution TEXT,
    report_file TEXT,
    FOREIGN KEY(machine_id) REFERENCES machines(id)
);

INSERT OR IGNORE INTO machines (id, name, type, location) VALUES
('EXP-01', '曝光機 01 (ASML NXT)', 'Lithography', 'Area-A 1F'),
('ETCH-02', '蝕刻機 02 (Lam Research)', 'Etch', 'Area-A 2F'),
('CVD-03', '化學氣相沉積機 03 (Applied Materials)', 'Deposition', 'Area-B 1F'),
('PVD-04', '物理氣相沉積機 04 (Novellus)', 'Deposition', 'Area-B 2F'),
('MET-05', '關鍵尺寸量測儀 05 (KLA-Tencor)', 'Metrology', 'Area-C 1F');

INSERT OR IGNORE INTO engineers (id, name, department) VALUES
('ENG-001', 'Kevin Chang', 'EAP 自動化課'),
('ENG-002', 'Sarah Wang', 'EES 系統課'),
('ENG-003', 'David Wu', '製程整合課'),
('ENG-004', 'Alice Lin', '設備工程課');

INSERT OR IGNORE INTO anomaly_events
(id, event_code, machine_id, severity, description, status, operator_id, assigned_engineer, resolution, report_file, created_at, updated_at)
VALUES
(1, 'E-1024', 'EXP-01', 'Critical', '雷射光源能量衰減異常，超出規格臨界值(OOS)。', 'Pending', 'OP-8801', NULL, NULL, NULL, datetime('now', '-30 minutes'), datetime('now', '-30 minutes')),
(2, 'E-0512', 'CVD-03', 'Warning', '腔體加熱器溫度波動過大，微幅超出控制界線(OOC)。', 'Pending', 'OP-8802', NULL, NULL, NULL, datetime('now', '-1 hours'), datetime('now', '-1 hours')),
(3, 'E-2048', 'ETCH-02', 'Critical', '腔體真空度不足，氣體流量控制器(MFC)無響應。', 'Ack', 'OP-8803', NULL, NULL, NULL, datetime('now', '-3 hours'), datetime('now', '-2 hours')),
(4, 'E-0256', 'PVD-04', 'Warning', '晶圓傳送手臂(Robot Arm)定位訊號微幅抖動。', 'Assign', 'OP-8801', 'Kevin Chang', NULL, NULL, datetime('now', '-6 hours'), datetime('now', '-4 hours')),
(5, 'E-3072', 'MET-05', 'Warning', '量測鏡頭校正偏移(Tilt Error)。', 'Closed', 'OP-8805', 'Sarah Wang', '執行鏡頭基準點自動校正(Auto-Calibration)，測試回歸後偏移值歸零，恢復生產。', NULL, datetime('now', '-24 hours'), datetime('now', '-22 hours'));

CREATE TABLE IF NOT EXISTS shift_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sender TEXT NOT NULL,
    message TEXT NOT NULL,
    kind TEXT NOT NULL DEFAULT 'chat',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS handover_notes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    author TEXT NOT NULL,
    note TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

INSERT OR IGNORE INTO shift_messages (id, sender, message, kind, created_at) VALUES
(1, 'EAP Bot', '今日值班身份已切換為 DUDU，待辦清單依 Critical / Pending / Ack 自動排序。', 'system', datetime('now', '-18 minutes')),
(2, '製造課 OP-8802', 'CVD-03 現場塔燈仍為黃燈，等待工程師確認。', 'chat', datetime('now', '-14 minutes')),
(3, 'DUDU', '收到，我先處理 Critical，再回頭追 CVD-03 加熱器波動。', 'chat', datetime('now', '-11 minutes'));

INSERT OR IGNORE INTO handover_notes (id, author, note, created_at) VALUES
(1, 'Night Shift - Kevin', 'ETCH-02 昨晚 MFC 真空度異常已 Ack，建議早班優先指派設備工程師確認備品與 leak rate。', datetime('now', '-24 minutes')),
(2, 'EES Monitor', 'CVD-03 加熱器波動仍在 OOC 邊緣，請 DUDU 於早會後追蹤是否升級為設備派工。', datetime('now', '-20 minutes'));
