/**
 * Admin Telegram Message Formatters
 *
 * Each function formats a specific event type into an HTML-formatted
 * Telegram message for admin notifications.
 */

const SITE_NAME = 'Ethiopian Maids';

/** Escape HTML special characters for Telegram HTML parse mode */
function esc(str: string | null | undefined): string {
  if (!str) return 'N/A';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/** Format a date to a readable string */
function fmtDate(dateStr?: string | number | null): string {
  if (!dateStr) return 'N/A';
  try {
    const d = typeof dateStr === 'number' ? new Date(dateStr * 1000) : new Date(dateStr);
    return d.toLocaleString('en-US', { timeZone: 'Asia/Dubai', dateStyle: 'medium', timeStyle: 'short' });
  } catch {
    return String(dateStr);
  }
}

/** Format currency amount (cents to dollars) */
function fmtAmount(amount?: number | null, currency?: string): string {
  if (amount == null) return 'N/A';
  const value = amount >= 100 ? (amount / 100).toFixed(2) : amount.toFixed(2);
  return `${value} ${(currency || 'AED').toUpperCase()}`;
}

// ─── Registration ────────────────────────────────────────────

export function formatNewRegistration(user: {
  email?: string | null;
  uid?: string;
  displayName?: string | null;
  phoneNumber?: string | null;
}): string {
  return [
    `<b>👤 New Registration</b>`,
    ``,
    `<b>Email:</b> ${esc(user.email)}`,
    `<b>Name:</b> ${esc(user.displayName)}`,
    `<b>Phone:</b> ${esc(user.phoneNumber)}`,
    `<b>UID:</b> <code>${esc(user.uid)}</code>`,
    `<b>Time:</b> ${fmtDate(new Date().toISOString())}`,
    ``,
    `🌐 ${SITE_NAME}`,
  ].join('\n');
}

// ─── Subscriptions ───────────────────────────────────────────

export function formatSubscriptionCreated(sub: {
  userId?: string;
  planName?: string | null;
  planType?: string | null;
  amount?: number | null;
  currency?: string;
  status?: string;
  subscriptionId?: string;
}): string {
  return [
    `<b>💳 New Subscription</b>`,
    ``,
    `<b>User:</b> <code>${esc(sub.userId)}</code>`,
    `<b>Plan:</b> ${esc(sub.planName)} (${esc(sub.planType)})`,
    `<b>Amount:</b> ${fmtAmount(sub.amount, sub.currency)}`,
    `<b>Status:</b> ${esc(sub.status)}`,
    `<b>Stripe ID:</b> <code>${esc(sub.subscriptionId)}</code>`,
    `<b>Time:</b> ${fmtDate(new Date().toISOString())}`,
    ``,
    `🌐 ${SITE_NAME}`,
  ].join('\n');
}

export function formatSubscriptionCanceled(sub: {
  userId?: string;
  planName?: string | null;
  subscriptionId?: string;
}): string {
  return [
    `<b>❌ Subscription Canceled</b>`,
    ``,
    `<b>User:</b> <code>${esc(sub.userId)}</code>`,
    `<b>Plan:</b> ${esc(sub.planName)}`,
    `<b>Stripe ID:</b> <code>${esc(sub.subscriptionId)}</code>`,
    `<b>Time:</b> ${fmtDate(new Date().toISOString())}`,
    ``,
    `🌐 ${SITE_NAME}`,
  ].join('\n');
}

// ─── Payments ────────────────────────────────────────────────

export function formatPaymentReceived(payment: {
  userId?: string;
  amount?: number | null;
  currency?: string;
  paymentIntentId?: string;
  paymentMethod?: string;
}): string {
  return [
    `<b>💰 Payment Received</b>`,
    ``,
    `<b>User:</b> <code>${esc(payment.userId)}</code>`,
    `<b>Amount:</b> ${fmtAmount(payment.amount, payment.currency)}`,
    `<b>Method:</b> ${esc(payment.paymentMethod)}`,
    `<b>Stripe PI:</b> <code>${esc(payment.paymentIntentId)}</code>`,
    `<b>Time:</b> ${fmtDate(new Date().toISOString())}`,
    ``,
    `🌐 ${SITE_NAME}`,
  ].join('\n');
}

export function formatPaymentFailed(invoice: {
  userId?: string;
  amount?: number | null;
  currency?: string;
  invoiceId?: string;
  reason?: string;
}): string {
  return [
    `<b>⚠️ Payment Failed</b>`,
    ``,
    `<b>User:</b> <code>${esc(invoice.userId)}</code>`,
    `<b>Amount:</b> ${fmtAmount(invoice.amount, invoice.currency)}`,
    `<b>Invoice:</b> <code>${esc(invoice.invoiceId)}</code>`,
    `<b>Reason:</b> ${esc(invoice.reason)}`,
    `<b>Time:</b> ${fmtDate(new Date().toISOString())}`,
    ``,
    `🌐 ${SITE_NAME}`,
  ].join('\n');
}

// ─── Bookings ────────────────────────────────────────────────

export function formatBookingCreated(booking: {
  sponsorId?: string;
  sponsorName?: string;
  maidId?: string;
  maidName?: string;
  bookingId?: string;
}): string {
  return [
    `<b>📋 New Booking</b>`,
    ``,
    `<b>Sponsor:</b> ${esc(booking.sponsorName)} (<code>${esc(booking.sponsorId)}</code>)`,
    `<b>Maid:</b> ${esc(booking.maidName)} (<code>${esc(booking.maidId)}</code>)`,
    `<b>Booking ID:</b> <code>${esc(booking.bookingId)}</code>`,
    `<b>Time:</b> ${fmtDate(new Date().toISOString())}`,
    ``,
    `🌐 ${SITE_NAME}`,
  ].join('\n');
}

// ─── Interviews ──────────────────────────────────────────────

export function formatInterviewScheduled(interview: {
  sponsorId?: string;
  sponsorName?: string;
  maidId?: string;
  maidName?: string;
  scheduledDate?: string;
  interviewId?: string;
}): string {
  return [
    `<b>🎥 Interview Scheduled</b>`,
    ``,
    `<b>Sponsor:</b> ${esc(interview.sponsorName)} (<code>${esc(interview.sponsorId)}</code>)`,
    `<b>Maid:</b> ${esc(interview.maidName)} (<code>${esc(interview.maidId)}</code>)`,
    `<b>Date:</b> ${fmtDate(interview.scheduledDate)}`,
    `<b>Interview ID:</b> <code>${esc(interview.interviewId)}</code>`,
    `<b>Time:</b> ${fmtDate(new Date().toISOString())}`,
    ``,
    `🌐 ${SITE_NAME}`,
  ].join('\n');
}

// ─── Site Errors ─────────────────────────────────────────────

export function formatSiteError(error: {
  type?: string;
  message?: string;
  url?: string;
  userId?: string;
  stack?: string;
}): string {
  const stackPreview = error.stack ? error.stack.substring(0, 200) : '';
  return [
    `<b>🚨 Site Error</b>`,
    ``,
    `<b>Type:</b> ${esc(error.type)}`,
    `<b>Message:</b> ${esc(error.message)}`,
    `<b>URL:</b> ${esc(error.url)}`,
    `<b>User:</b> <code>${esc(error.userId)}</code>`,
    stackPreview ? `<b>Stack:</b> <pre>${esc(stackPreview)}</pre>` : '',
    `<b>Time:</b> ${fmtDate(new Date().toISOString())}`,
    ``,
    `🌐 ${SITE_NAME}`,
  ].filter(Boolean).join('\n');
}

// ─── Profile Updates ─────────────────────────────────────────

export function formatProfileUpdate(profile: {
  userId?: string;
  userType?: string;
  action?: string;
}): string {
  return [
    `<b>👤 Profile Update</b>`,
    ``,
    `<b>User:</b> <code>${esc(profile.userId)}</code>`,
    `<b>Type:</b> ${esc(profile.userType)}`,
    `<b>Action:</b> ${esc(profile.action)}`,
    `<b>Time:</b> ${fmtDate(new Date().toISOString())}`,
    ``,
    `🌐 ${SITE_NAME}`,
  ].join('\n');
}

// ─── Custom / Generic ────────────────────────────────────────

export function formatCustomMessage(data: {
  title?: string;
  message?: string;
  details?: Record<string, string>;
}): string {
  const detailLines = data.details
    ? Object.entries(data.details).map(([k, v]) => `<b>${esc(k)}:</b> ${esc(v)}`)
    : [];

  return [
    `<b>📢 ${esc(data.title || 'Notification')}</b>`,
    ``,
    data.message ? esc(data.message) : '',
    ...detailLines,
    ``,
    `<b>Time:</b> ${fmtDate(new Date().toISOString())}`,
    `🌐 ${SITE_NAME}`,
  ].filter(Boolean).join('\n');
}

// ─── Daily Briefing ─────────────────────────────────────────

export function formatDailyBriefing(stats: {
  totalUsers: number;
  byType: { maid: number; sponsor: number; agency: number };
  newRegistrations24h: number;
  activeSubscriptions: number;
  newJobs24h: number;
  revenue24h: number;
  currency?: string;
}): string {
  return [
    `<b>📊 Daily Briefing - ${SITE_NAME}</b>`,
    ``,
    `<b>👥 Total Users:</b> ${stats.totalUsers}`,
    `  • Maids: ${stats.byType.maid}`,
    `  • Sponsors: ${stats.byType.sponsor}`,
    `  • Agencies: ${stats.byType.agency}`,
    ``,
    `<b>🆕 New Registrations (24h):</b> ${stats.newRegistrations24h}`,
    `<b>💳 Active Subscriptions:</b> ${stats.activeSubscriptions}`,
    `<b>📋 New Jobs (24h):</b> ${stats.newJobs24h}`,
    `<b>💰 Revenue (24h):</b> ${fmtAmount(stats.revenue24h, stats.currency)}`,
    ``,
    `<b>Time:</b> ${fmtDate(new Date().toISOString())}`,
    `🌐 ${SITE_NAME}`,
  ].join('\n');
}

// ─── Stale Registrations ────────────────────────────────────

export function formatStaleRegistrations(data: {
  count: number;
  users: Array<{ email?: string | null; user_type?: string | null; created_at?: string | null }>;
}): string {
  const userLines = data.users.slice(0, 10).map(
    (u, i) => `  ${i + 1}. ${esc(u.email)} (${esc(u.user_type)}) - registered ${fmtDate(u.created_at)}`
  );

  return [
    `<b>👻 Stale Registrations Alert</b>`,
    ``,
    `<b>Count:</b> ${data.count} users registered 24h+ ago but haven't completed onboarding`,
    ``,
    ...(userLines.length > 0 ? [`<b>Top ${userLines.length}:</b>`, ...userLines] : []),
    data.count > 10 ? `  ... and ${data.count - 10} more` : '',
    ``,
    `<b>Time:</b> ${fmtDate(new Date().toISOString())}`,
    `🌐 ${SITE_NAME}`,
  ].filter(Boolean).join('\n');
}

// ─── Site Health Report ─────────────────────────────────────

export function formatSiteHealthAlert(health: {
  hasuraReachable: boolean;
  dbResponseTime: number;
  recentErrors: number;
  avgErrors: number;
  spikeDetected: boolean;
  totalUsers: number;
  activeUsers24h: number;
  activeUsers7d: number;
  maidProfiles: number;
  activeJobs: number;
  totalTransactions: number;
  storageUsedMB: number;
  storageTotalMB: number;
  adminActivity24h: number;
  details?: string;
}): string {
  const overallStatus = health.hasuraReachable && !health.spikeDetected && health.dbResponseTime < 300;
  const statusEmoji = overallStatus ? '✅' : '🔴';
  const statusText = overallStatus ? 'All Systems Operational' : 'Issues Detected';

  const dbStatus = !health.hasuraReachable ? '🔴 Unreachable' :
    health.dbResponseTime < 100 ? '✅ Healthy' :
    health.dbResponseTime < 300 ? '⚠️ Slow' : '🔴 Critical';

  const storagePercent = health.storageTotalMB > 0
    ? ((health.storageUsedMB / health.storageTotalMB) * 100).toFixed(1)
    : '0';
  const storageStatus = Number(storagePercent) > 90 ? '🔴' : Number(storagePercent) > 75 ? '⚠️' : '✅';

  const perfStatus = health.dbResponseTime < 200 && health.recentErrors === 0 ? '✅ Excellent' :
    health.dbResponseTime < 300 ? '⚠️ Moderate' : '🔴 Degraded';

  return [
    `<b>🏥 Site Health Report</b>`,
    ``,
    `<b>Overall:</b> ${statusEmoji} ${statusText}`,
    ``,
    `<b>── Database ──</b>`,
    `Status: ${dbStatus}`,
    `Response: ${health.dbResponseTime}ms`,
    `Errors (1h): ${health.recentErrors}`,
    health.spikeDetected ? `⚠️ ERROR SPIKE: ${health.recentErrors} vs avg ${health.avgErrors.toFixed(1)}/h` : '',
    ``,
    `<b>── Users ──</b>`,
    `Total: ${health.totalUsers}`,
    `Active (24h): ${health.activeUsers24h}`,
    `Active (7d): ${health.activeUsers7d}`,
    `Maid Profiles: ${health.maidProfiles}`,
    ``,
    `<b>── Platform ──</b>`,
    `Active Jobs: ${health.activeJobs}`,
    `Transactions: ${health.totalTransactions}`,
    `Admin Actions (24h): ${health.adminActivity24h}`,
    ``,
    `<b>── Storage ──</b>`,
    `${storageStatus} ${health.storageUsedMB}MB / ${health.storageTotalMB}MB (${storagePercent}%)`,
    ``,
    `<b>── Performance ──</b>`,
    `${perfStatus}`,
    health.details ? `<b>Details:</b> ${esc(health.details)}` : '',
    ``,
    `<b>Time:</b> ${fmtDate(new Date().toISOString())}`,
    `🌐 ${SITE_NAME}`,
  ].filter(Boolean).join('\n');
}

// ─── Revenue Report ─────────────────────────────────────────

export function formatRevenueReport(revenue: {
  activeSubs: number;
  byPlan: Array<{ plan: string; count: number }>;
  expiringSoon: number;
  canceledRecently: number;
  totalRevenue: number;
  currency?: string;
}): string {
  const planLines = revenue.byPlan.map(
    (p) => `  • ${esc(p.plan)}: ${p.count} active`
  );

  return [
    `<b>💳 Revenue Report</b>`,
    ``,
    `<b>Active Subscriptions:</b> ${revenue.activeSubs}`,
    ...(planLines.length > 0 ? [`<b>By Plan:</b>`, ...planLines] : []),
    ``,
    `<b>⏰ Expiring (next 7 days):</b> ${revenue.expiringSoon}`,
    `<b>❌ Canceled (24h):</b> ${revenue.canceledRecently}`,
    `<b>💰 Total Revenue (24h):</b> ${fmtAmount(revenue.totalRevenue, revenue.currency)}`,
    ``,
    `<b>Time:</b> ${fmtDate(new Date().toISOString())}`,
    `🌐 ${SITE_NAME}`,
  ].join('\n');
}

// ─── Security Alert ─────────────────────────────────────────

export function formatSecurityAlert(events: {
  count: number;
  actions: Array<{ action?: string; admin_email?: string | null; target?: string | null; created_at?: string | null }>;
}): string {
  const actionLines = events.actions.slice(0, 10).map(
    (a, i) => `  ${i + 1}. <b>${esc(a.action)}</b> by ${esc(a.admin_email)} → ${esc(a.target)} (${fmtDate(a.created_at)})`
  );

  return [
    `<b>🔒 Security Monitor Alert</b>`,
    ``,
    `<b>Suspicious actions (last 6h):</b> ${events.count}`,
    ``,
    ...(actionLines.length > 0 ? actionLines : ['  No suspicious actions detected']),
    events.count > 10 ? `  ... and ${events.count - 10} more` : '',
    ``,
    `<b>Time:</b> ${fmtDate(new Date().toISOString())}`,
    `🌐 ${SITE_NAME}`,
  ].filter(Boolean).join('\n');
}

// ─── Error Digest ────────────────────────────────────────────

export function formatErrorDigest(stats: {
  totalErrors: number;
  period: string;
  topErrors?: Array<{ title: string; count: number }>;
}): string {
  const topLines = stats.topErrors?.map(
    (e, i) => `  ${i + 1}. ${esc(e.title)} (${e.count}x)`
  ) || [];

  return [
    `<b>📊 Error Digest (${esc(stats.period)})</b>`,
    ``,
    `<b>Total Errors:</b> ${stats.totalErrors}`,
    topLines.length > 0 ? `\n<b>Top Errors:</b>` : '',
    ...topLines,
    ``,
    `<b>Time:</b> ${fmtDate(new Date().toISOString())}`,
    `🌐 ${SITE_NAME}`,
  ].filter(Boolean).join('\n');
}

// ─── Customer Feedback Report ──────────────────────────────

export function formatCustomerFeedbackReport(data: {
  newCount: number;
  unresolvedCount: number;
  avgRating: number | null;
  openBugs: number;
  openComplaints: number;
  recentFeedback: Array<{
    feedback_type: string;
    message: string;
    rating: number | null;
    user_type: string | null;
  }>;
}): string {
  const ratingStr = data.avgRating != null ? `${data.avgRating.toFixed(1)}/5` : 'N/A';
  const feedbackLines = data.recentFeedback.slice(0, 5).map(
    (f, i) => `  ${i + 1}. [${esc(f.feedback_type)}] ${esc(f.message?.substring(0, 80))} (${f.rating ?? 'no rating'}, ${esc(f.user_type)})`
  );

  return [
    `<b>💬 Customer Feedback Report</b>`,
    ``,
    `<b>New (24h):</b> ${data.newCount}`,
    `<b>Unresolved:</b> ${data.unresolvedCount}`,
    `<b>Avg Rating:</b> ${ratingStr}`,
    `<b>🐛 Open Bugs:</b> ${data.openBugs}`,
    `<b>😤 Open Complaints:</b> ${data.openComplaints}`,
    ``,
    ...(feedbackLines.length > 0 ? [`<b>Recent:</b>`, ...feedbackLines] : ['No feedback in last 24h']),
    ``,
    `<b>Time:</b> ${fmtDate(new Date().toISOString())}`,
    `🌐 ${SITE_NAME}`,
  ].join('\n');
}

// ─── Crash Analytics Report ────────────────────────────────

export function formatCrashAnalyticsReport(data: {
  total24h: number;
  fatal24h: number;
  lastHour: number;
  unresolvedCount: number;
  topErrors: Array<{ error_type: string; error_message: string; severity: string }>;
  recentCrashes: Array<{
    severity: string;
    error_type: string;
    error_message: string;
    page_url: string | null;
    component_name: string | null;
  }>;
}): string {
  const topLines = data.topErrors.slice(0, 5).map(
    (e, i) => `  ${i + 1}. [${esc(e.severity)}] ${esc(e.error_message?.substring(0, 100))}`
  );
  const crashLines = data.recentCrashes.slice(0, 5).map(
    (c, i) => `  ${i + 1}. [${esc(c.severity)}] ${esc(c.error_type)}: ${esc(c.error_message?.substring(0, 80))}`
  );

  return [
    `<b>💥 Crash Analytics Report</b>`,
    ``,
    `<b>Crashes (24h):</b> ${data.total24h}`,
    `<b>🔴 Fatal (24h):</b> ${data.fatal24h}`,
    `<b>Crashes (1h):</b> ${data.lastHour}`,
    `<b>Unresolved:</b> ${data.unresolvedCount}`,
    ``,
    ...(topLines.length > 0 ? [`<b>Top Errors:</b>`, ...topLines] : ['No crashes in last 24h']),
    ``,
    ...(crashLines.length > 0 ? [`<b>Recent:</b>`, ...crashLines] : []),
    ``,
    `<b>Time:</b> ${fmtDate(new Date().toISOString())}`,
    `🌐 ${SITE_NAME}`,
  ].join('\n');
}
