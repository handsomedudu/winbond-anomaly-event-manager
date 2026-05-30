const express = require('express');
const cors = require('cors');
const path = require('path');
const { dbQuery } = require('./database');

const app = express();
const PORT = process.env.PORT || 3001;

// 中介軟體設定
app.use(cors());
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ limit: '20mb', extended: true }));
app.use('/api/uploads', express.static(path.join(__dirname, 'uploads')));

// 1. 取得統計資訊 (Dashboard Stats)
app.get('/api/stats', async (req, res) => {
  try {
    const sql = `
      SELECT 
        COUNT(*) as total,
        SUM(case when status = 'Pending' then 1 else 0 end) as pending,
        SUM(case when status = 'Ack' then 1 else 0 end) as ack,
        SUM(case when status = 'Assign' then 1 else 0 end) as assign,
        SUM(case when status = 'Closed' then 1 else 0 end) as closed
      FROM anomaly_events
    `;
    const stats = await dbQuery.get(sql);
    res.json({
      success: true,
      data: {
        total: stats.total || 0,
        pending: stats.pending || 0,
        ack: stats.ack || 0,
        assign: stats.assign || 0,
        closed: stats.closed || 0
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: '無法取得統計資料：' + err.message });
  }
});

// 2. 取得異常事件清單 (支援時間、機台、狀態篩選)
app.get('/api/events', async (req, res) => {
  try {
    const { status, machine_id, start_date, end_date } = req.query;
    
    let sql = `
      SELECT e.*, m.name as machine_name, m.location as machine_location 
      FROM anomaly_events e
      JOIN machines m ON e.machine_id = m.id
      WHERE 1=1
    `;
    const params = [];
    
    if (status) {
      sql += ' AND e.status = ?';
      params.push(status);
    }
    
    if (machine_id) {
      sql += ' AND e.machine_id = ?';
      params.push(machine_id);
    }
    
    if (start_date) {
      sql += ' AND e.created_at >= ?';
      // 支援前端傳入的日期格式 YYYY-MM-DD
      params.push(`${start_date} 00:00:00`);
    }
    
    if (end_date) {
      sql += ' AND e.created_at <= ?';
      params.push(`${end_date} 23:59:59`);
    }
    
    sql += ' ORDER BY e.created_at DESC';
    
    const events = await dbQuery.all(sql, params);
    res.json({ success: true, data: events });
  } catch (err) {
    res.status(500).json({ success: false, message: '無法取得異常事件清單：' + err.message });
  }
});

// 3. 取得單一異常事件明細
app.get('/api/events/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const sql = `
      SELECT e.*, m.name as machine_name, m.type as machine_type, m.location as machine_location
      FROM anomaly_events e
      JOIN machines m ON e.machine_id = m.id
      WHERE e.id = ?
    `;
    const event = await dbQuery.get(sql, [id]);
    
    if (!event) {
      return res.status(404).json({ success: false, message: '找不到指定的異常事件。' });
    }
    
    res.json({ success: true, data: event });
  } catch (err) {
    res.status(500).json({ success: false, message: '無法取得異常事件明細：' + err.message });
  }
});

// 4. 更新事件狀態 (確認 Ack / 指派 Assign / 關閉 Close)
app.put('/api/events/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, assigned_engineer, resolution } = req.body;
    
    // 驗證狀態
    const validStatuses = ['Ack', 'Assign', 'Closed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: '無效的狀態值。' });
    }
    
    // 檢查事件是否存在
    const checkSql = 'SELECT * FROM anomaly_events WHERE id = ?';
    const event = await dbQuery.get(checkSql, [id]);
    if (!event) {
      return res.status(404).json({ success: false, message: '找不到指定的異常事件。' });
    }
    
    // 防呆驗證
    if (status === 'Assign' && !assigned_engineer) {
      return res.status(400).json({ success: false, message: '指派狀態下必須填寫負責工程師。' });
    }
    if (status === 'Closed' && !resolution) {
      return res.status(400).json({ success: false, message: '關閉狀態下必須填寫處理對策。' });
    }
    
    let updateSql = '';
    const params = [];
    
    if (status === 'Ack') {
      updateSql = 'UPDATE anomaly_events SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
      params.push('Ack', id);
    } else if (status === 'Assign') {
      updateSql = 'UPDATE anomaly_events SET status = ?, assigned_engineer = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
      params.push('Assign', assigned_engineer, id);
    } else if (status === 'Closed') {
      const { attachment } = req.body;
      let reportUrl = event.report_file || null;
      
      if (attachment && attachment.name && attachment.base64) {
        const fs = require('fs');
        const uploadsDir = path.join(__dirname, 'uploads');
        if (!fs.existsSync(uploadsDir)) {
          fs.mkdirSync(uploadsDir);
        }
        
        // 建立唯一檔名，防撞名覆蓋
        const uniqueFilename = `${Date.now()}-${attachment.name}`;
        const destPath = path.join(uploadsDir, uniqueFilename);
        
        // 寫入檔案
        const buffer = Buffer.from(attachment.base64, 'base64');
        fs.writeFileSync(destPath, buffer);
        reportUrl = `/api/uploads/${uniqueFilename}`;
      }
      
      // 關閉時若無負責人，保留原負責人或設定 (如果是從 Pending 直接關閉)
      const engineer = assigned_engineer || event.assigned_engineer || 'System';
      updateSql = 'UPDATE anomaly_events SET status = ?, assigned_engineer = ?, resolution = ?, report_file = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
      params.push('Closed', engineer, resolution, reportUrl, id);
    }
    
    await dbQuery.run(updateSql, params);
    
    // 取得更新後的完整資料
    const getUpdatedSql = `
      SELECT e.*, m.name as machine_name, m.type as machine_type, m.location as machine_location
      FROM anomaly_events e
      JOIN machines m ON e.machine_id = m.id
      WHERE e.id = ?
    `;
    const updatedEvent = await dbQuery.get(getUpdatedSql, [id]);
    
    res.json({ 
      success: true, 
      message: `事件狀態已成功更新至 [${status}]。`,
      data: updatedEvent 
    });
  } catch (err) {
    res.status(500).json({ success: false, message: '狀態更新失敗：' + err.message });
  }
});

// 5. 取得所有機台清單 (供前端篩選器選單使用)
app.get('/api/machines', async (req, res) => {
  try {
    const sql = 'SELECT * FROM machines ORDER BY id';
    const machines = await dbQuery.all(sql);
    res.json({ success: true, data: machines });
  } catch (err) {
    res.status(500).json({ success: false, message: '無法取得機台清單：' + err.message });
  }
});

// 6. 取得所有工程師清單 (供前端指派選單使用)
app.get('/api/engineers', async (req, res) => {
  try {
    const sql = 'SELECT * FROM engineers ORDER BY id';
    const engineers = await dbQuery.all(sql);
    res.json({ success: true, data: engineers });
  } catch (err) {
    res.status(500).json({ success: false, message: '無法取得工程師清單：' + err.message });
  }
});

// 啟動伺服器
app.listen(PORT, () => {
  console.log(`後端 Express 伺服器正在運行於 http://localhost:${PORT}`);
});
