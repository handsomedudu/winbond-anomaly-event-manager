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

  // 動態更新系統時間
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
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

  // 處理查詢提交
  const handleSearch = (e) => {
    e.preventDefault();
    setLoading(true);
    Promise.all([fetchEvents(), fetchStats()]).then(() => setLoading(false));
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
                      <span style={{lineHeight: '1.5', fontWeight: 500}}>{selectedEvent.resolution}</span>
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
                        <div className="form-group" style={{marginBottom: '1rem'}}>
                          <label>請輸入異常處理對策與原因分析 (Required)</label>
                          <textarea 
                            className="form-input" 
                            rows="3"
                            style={{resize: 'none'}}
                            placeholder="例如: 更換氣體流量控制器、重啟機台並校正復歸、恢復正常參數..."
                            value={resolutionText}
                            onChange={(e) => setResolutionText(e.target.value)}
                          />
                        </div>
                        <div style={{display: 'flex', gap: '0.5rem', justifyContent: 'flex-end'}}>
                          <button className="btn btn-secondary" onClick={() => setModalAction('')}>取消</button>
                          <button 
                            className="btn btn-primary"
                            style={{background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)'}}
                            onClick={() => handleUpdateStatus('Closed', { 
                              assigned_engineer: engineerName || selectedEvent.assigned_engineer || 'System',
                              resolution: resolutionText 
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
