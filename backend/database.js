const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, 'database.db');
const schemaPath = path.join(__dirname, 'schema.sql');

// 初始化資料庫連線
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('無法連線至 SQLite 資料庫：', err.message);
  } else {
    console.log('成功連線至 SQLite 資料庫。');
    initializeSchema();
  }
});

// 初始化資料表與預設資料
function initializeSchema() {
  fs.readFile(schemaPath, 'utf8', (err, schemaSql) => {
    if (err) {
      console.error('無法讀取 schema.sql 檔案：', err);
      return;
    }
    
    // 執行 SQL 語句
    db.exec(schemaSql, (execErr) => {
      if (execErr) {
        console.error('初始化資料庫結構失敗：', execErr.message);
      } else {
        console.log('資料庫結構與預設資料初始化成功。');
      }
    });
  });
}

// 封裝 Promise API 以利於 async/await 使用
const dbQuery = {
  all(sql, params = []) {
    return new Promise((resolve, reject) => {
      db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  },
  
  get(sql, params = []) {
    return new Promise((resolve, reject) => {
      db.get(sql, params, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  },
  
  run(sql, params = []) {
    return new Promise((resolve, reject) => {
      db.run(sql, params, function(err) {
        if (err) reject(err);
        else resolve({ lastID: this.lastID, changes: this.changes });
      });
    });
  }
};

module.exports = {
  db,
  dbQuery
};
