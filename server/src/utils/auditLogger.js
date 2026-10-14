import { AuditLog } from '../models/AuditLog.js';

/**
 * Safely writes an entry to the Audit Log.
 * Fails gracefully without throwing to prevent breaking main business transactions.
 */
export const recordAuditLog = async ({
  actor = null,
  action,
  resourceType,
  resourceId = '',
  status = 'SUCCESS',
  details = {},
  req = null,
}) => {
  try {
    const actorRole = actor?.role || (req?.user?.role) || 'system';
    const actorName = actor?.name || (req?.user?.name) || 'System';
    const actorEmail = actor?.email || (req?.user?.email) || '';
    const actorId = actor?._id || req?.user?._id || null;

    const ipAddress =
      req?.headers?.['x-forwarded-for']?.split(',')[0]?.trim() ||
      req?.socket?.remoteAddress ||
      req?.ip ||
      '';

    const userAgent = req?.headers?.['user-agent'] || '';

    // Sanitize details to ensure sensitive fields (passwords, tokens, cookies) are never recorded
    const sanitizedDetails = { ...details };
    delete sanitizedDetails.password;
    delete sanitizedDetails.currentPassword;
    delete sanitizedDetails.newPassword;
    delete sanitizedDetails.token;
    delete sanitizedDetails.jwt;
    delete sanitizedDetails.cookie;

    await AuditLog.create({
      actor: actorId,
      actorRole,
      actorName,
      actorEmail,
      action,
      resourceType,
      resourceId: resourceId ? String(resourceId) : '',
      status,
      details: sanitizedDetails,
      ipAddress,
      userAgent,
    });
  } catch (error) {
    console.error('[Audit Logger Error]: Failed to write audit record:', error.message);
  }
};
