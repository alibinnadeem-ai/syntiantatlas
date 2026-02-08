import { query } from '../config/database.js';
import { v4 as uuidv4 } from 'uuid';

export const logActivity = async (userId, action, entityType, entityId, oldValues, newValues, ipAddress) => {
  try {
    await query(
      `INSERT INTO audit_logs (id, user_id, action, entity_type, entity_id, old_values, new_values, ip_address)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [uuidv4(), userId, action, entityType, entityId, oldValues ? JSON.stringify(oldValues) : null, JSON.stringify(newValues), ipAddress]
    );
  } catch (error) {
    console.error('Audit log error:', error);
  }
};

export const getAuditLogs = async (filters = {}) => {
  let query_str = 'SELECT * FROM audit_logs WHERE 1=1';
  const params = [];

  if (filters.user_id) {
    params.push(filters.user_id);
    query_str += ` AND user_id = $${params.length}`;
  }

  if (filters.action) {
    params.push(filters.action);
    query_str += ` AND action = $${params.length}`;
  }

  query_str += ' ORDER BY created_at DESC LIMIT 100';

  const result = await query(query_str, params);
  return result.rows;
};
