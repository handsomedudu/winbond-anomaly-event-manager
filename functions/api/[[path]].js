const jsonHeaders = {
  'content-type': 'application/json; charset=utf-8',
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'GET,PUT,OPTIONS',
  'access-control-allow-headers': 'content-type',
};

function json(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: jsonHeaders,
  });
}

function getPathParts(request) {
  const url = new URL(request.url);
  const path = url.pathname.replace(/^\/api\/?/, '').replace(/\/+$/, '');
  return {
    url,
    parts: path ? path.split('/') : [],
  };
}

function getDatabase(env) {
  if (!env.DB) {
    throw new Error('Cloudflare D1 binding DB is not configured.');
  }
  return env.DB;
}

async function getEventById(db, id) {
  return db
    .prepare(
      `
      SELECT e.*, m.name as machine_name, m.type as machine_type, m.location as machine_location
      FROM anomaly_events e
      JOIN machines m ON e.machine_id = m.id
      WHERE e.id = ?
    `
    )
    .bind(id)
    .first();
}

async function handleStats(db) {
  const stats = await db
    .prepare(
      `
      SELECT
        COUNT(*) as total,
        SUM(case when status = 'Pending' then 1 else 0 end) as pending,
        SUM(case when status = 'Ack' then 1 else 0 end) as ack,
        SUM(case when status = 'Assign' then 1 else 0 end) as assign,
        SUM(case when status = 'Closed' then 1 else 0 end) as closed
      FROM anomaly_events
    `
    )
    .first();

  return json({
    success: true,
    data: {
      total: stats?.total || 0,
      pending: stats?.pending || 0,
      ack: stats?.ack || 0,
      assign: stats?.assign || 0,
      closed: stats?.closed || 0,
    },
  });
}

async function handleEvents(db, url) {
  let sql = `
    SELECT e.*, m.name as machine_name, m.location as machine_location
    FROM anomaly_events e
    JOIN machines m ON e.machine_id = m.id
    WHERE 1=1
  `;
  const params = [];

  const status = url.searchParams.get('status');
  const machineId = url.searchParams.get('machine_id');
  const startDate = url.searchParams.get('start_date');
  const endDate = url.searchParams.get('end_date');

  if (status) {
    sql += ' AND e.status = ?';
    params.push(status);
  }

  if (machineId) {
    sql += ' AND e.machine_id = ?';
    params.push(machineId);
  }

  if (startDate) {
    sql += ' AND e.created_at >= ?';
    params.push(`${startDate} 00:00:00`);
  }

  if (endDate) {
    sql += ' AND e.created_at <= ?';
    params.push(`${endDate} 23:59:59`);
  }

  sql += ' ORDER BY e.created_at DESC';

  const { results } = await db
    .prepare(sql)
    .bind(...params)
    .all();

  return json({ success: true, data: results || [] });
}

async function handleMachines(db) {
  const { results } = await db.prepare('SELECT * FROM machines ORDER BY id').all();
  return json({ success: true, data: results || [] });
}

async function handleEngineers(db) {
  const { results } = await db.prepare('SELECT * FROM engineers ORDER BY id').all();
  return json({ success: true, data: results || [] });
}

async function handleEventDetail(db, id) {
  const event = await getEventById(db, id);
  if (!event) {
    return json({ success: false, message: '找不到指定的異常事件。' }, 404);
  }
  return json({ success: true, data: event });
}

async function handleStatusUpdate(db, request, id) {
  const body = await request.json();
  const { status, assigned_engineer, resolution, attachment } = body;

  const validStatuses = ['Ack', 'Assign', 'Closed'];
  if (!validStatuses.includes(status)) {
    return json({ success: false, message: '無效的狀態值。' }, 400);
  }

  const event = await db.prepare('SELECT * FROM anomaly_events WHERE id = ?').bind(id).first();
  if (!event) {
    return json({ success: false, message: '找不到指定的異常事件。' }, 404);
  }

  if (status === 'Assign' && !assigned_engineer) {
    return json({ success: false, message: '指派狀態下必須填寫負責工程師。' }, 400);
  }

  if (status === 'Closed' && !resolution) {
    return json({ success: false, message: '關閉狀態下必須填寫處理對策。' }, 400);
  }

  if (status === 'Ack') {
    await db
      .prepare('UPDATE anomaly_events SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .bind('Ack', id)
      .run();
  }

  if (status === 'Assign') {
    await db
      .prepare(
        'UPDATE anomaly_events SET status = ?, assigned_engineer = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
      )
      .bind('Assign', assigned_engineer, id)
      .run();
  }

  if (status === 'Closed') {
    let reportUrl = event.report_file || null;
    if (attachment?.name && attachment?.base64) {
      reportUrl = `data:application/octet-stream;base64,${attachment.base64}`;
    }

    const engineer = assigned_engineer || event.assigned_engineer || 'System';
    await db
      .prepare(
        `
        UPDATE anomaly_events
        SET status = ?, assigned_engineer = ?, resolution = ?, report_file = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `
      )
      .bind('Closed', engineer, resolution, reportUrl, id)
      .run();
  }

  const updatedEvent = await getEventById(db, id);
  return json({
    success: true,
    message: `事件狀態已成功更新至 [${status}]。`,
    data: updatedEvent,
  });
}

export async function onRequest(context) {
  const { request, env } = context;

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: jsonHeaders });
  }

  try {
    const db = getDatabase(env);
    const { url, parts } = getPathParts(request);
    const [resource, id, action] = parts;

    if (request.method === 'GET' && resource === 'stats') {
      return handleStats(db);
    }

    if (request.method === 'GET' && resource === 'events' && !id) {
      return handleEvents(db, url);
    }

    if (request.method === 'GET' && resource === 'events' && id) {
      return handleEventDetail(db, id);
    }

    if (request.method === 'PUT' && resource === 'events' && id && action === 'status') {
      return handleStatusUpdate(db, request, id);
    }

    if (request.method === 'GET' && resource === 'machines') {
      return handleMachines(db);
    }

    if (request.method === 'GET' && resource === 'engineers') {
      return handleEngineers(db);
    }

    return json({ success: false, message: 'API route not found.' }, 404);
  } catch (error) {
    return json({ success: false, message: `雲端 API 執行失敗：${error.message}` }, 500);
  }
}
