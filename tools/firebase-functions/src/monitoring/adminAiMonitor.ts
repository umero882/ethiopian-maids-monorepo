/**
 * Admin AI Monitor - Automated Site Watchdog
 *
 * 5 scheduled monitoring functions that query Hasura and send
 * intelligent alerts to Telegram.
 *
 * Uses graphql-request + Hasura admin secret (same pattern as scheduledErrorDigest).
 */

import * as functions from 'firebase-functions';
import { GraphQLClient, gql } from 'graphql-request';
import { sendMonitorTelegramMessage } from '../notifications/telegramService';
import {
  formatDailyBriefing,
  formatStaleRegistrations,
  formatSiteHealthAlert,
  formatRevenueReport,
  formatSecurityAlert,
  formatCustomerFeedbackReport,
  formatCrashAnalyticsReport,
} from '../notifications/adminMessages';

// ─── Shared Hasura Client ───────────────────────────────────

function getHasuraClient(): GraphQLClient | null {
  // Prefer process.env over deprecated functions.config()
  let legacy: Record<string, any> = {};
  try { legacy = functions.config()?.hasura || {}; } catch { /* deprecated */ }
  const endpoint = process.env.HASURA_GRAPHQL_ENDPOINT || legacy.endpoint;
  const adminSecret = process.env.HASURA_ADMIN_SECRET || legacy.admin_secret;

  if (!endpoint || !adminSecret) {
    console.warn('[AdminAI] Hasura config not set, skipping');
    return null;
  }

  return new GraphQLClient(endpoint, {
    headers: { 'x-hasura-admin-secret': adminSecret },
  });
}

// ─── Monitor 1: Daily Briefing (8 AM UAE) ───────────────────

export async function runDailyBriefing(): Promise<void> {
  const client = getHasuraClient();
  if (!client) return;

  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  try {
    const DAILY_STATS = gql`
      query DailyBriefingStats($since: timestamptz!) {
        # Total users by type
        total_users: profiles_aggregate {
          aggregate { count }
        }
        maid_count: profiles_aggregate(where: { user_type: { _eq: "maid" } }) {
          aggregate { count }
        }
        sponsor_count: profiles_aggregate(where: { user_type: { _eq: "sponsor" } }) {
          aggregate { count }
        }
        agency_count: profiles_aggregate(where: { user_type: { _eq: "agency" } }) {
          aggregate { count }
        }
        # New registrations in last 24h
        new_registrations: profiles_aggregate(where: { created_at: { _gte: $since } }) {
          aggregate { count }
        }
        # Active subscriptions
        active_subs: subscriptions_aggregate(where: { status: { _eq: "active" } }) {
          aggregate { count }
        }
        # New jobs in last 24h
        new_jobs: jobs_aggregate(where: { created_at: { _gte: $since } }) {
          aggregate { count }
        }
        # Revenue in last 24h
        recent_payments: payments_aggregate(where: { created_at: { _gte: $since }, status: { _eq: "succeeded" } }) {
          aggregate {
            count
            sum { amount }
          }
        }
      }
    `;

    const data = await client.request<{
      total_users: { aggregate: { count: number } };
      maid_count: { aggregate: { count: number } };
      sponsor_count: { aggregate: { count: number } };
      agency_count: { aggregate: { count: number } };
      new_registrations: { aggregate: { count: number } };
      active_subs: { aggregate: { count: number } };
      new_jobs: { aggregate: { count: number } };
      recent_payments: { aggregate: { count: number; sum: { amount: number | null } } };
    }>(DAILY_STATS, { since: twentyFourHoursAgo });

    await sendMonitorTelegramMessage(formatDailyBriefing({
      totalUsers: data.total_users.aggregate.count,
      byType: {
        maid: data.maid_count.aggregate.count,
        sponsor: data.sponsor_count.aggregate.count,
        agency: data.agency_count.aggregate.count,
      },
      newRegistrations24h: data.new_registrations.aggregate.count,
      activeSubscriptions: data.active_subs.aggregate.count,
      newJobs24h: data.new_jobs.aggregate.count,
      revenue24h: data.recent_payments.aggregate.sum?.amount || 0,
    }));

    console.log('[AdminAI] Daily briefing sent');
  } catch (error) {
    console.error('[AdminAI] Daily briefing failed:', error);
  }
}

// ─── Monitor 2: Stale Registration Check (every 12h) ────────

export async function runStaleRegistrationCheck(): Promise<void> {
  const client = getHasuraClient();
  if (!client) return;

  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  try {
    const STALE_REGISTRATIONS = gql`
      query StaleRegistrations($cutoff: timestamptz!) {
        stale_users: profiles(
          where: {
            _and: [
              { created_at: { _lt: $cutoff } },
              { registration_complete: { _eq: false } }
            ]
          }
          order_by: { created_at: desc }
          limit: 15
        ) {
          email
          user_type
          created_at
        }
        stale_count: profiles_aggregate(
          where: {
            _and: [
              { created_at: { _lt: $cutoff } },
              { registration_complete: { _eq: false } }
            ]
          }
        ) {
          aggregate { count }
        }
      }
    `;

    const data = await client.request<{
      stale_users: Array<{ email: string | null; user_type: string | null; created_at: string | null }>;
      stale_count: { aggregate: { count: number } };
    }>(STALE_REGISTRATIONS, { cutoff: twentyFourHoursAgo });

    const count = data.stale_count.aggregate.count;

    if (count === 0) {
      console.log('[AdminAI] No stale registrations found');
      return;
    }

    await sendMonitorTelegramMessage(formatStaleRegistrations({
      count,
      users: data.stale_users,
    }));

    console.log(`[AdminAI] Stale registrations alert sent: ${count} users`);
  } catch (error) {
    console.error('[AdminAI] Stale registration check failed:', error);
  }
}

// ─── Monitor 3: Site Health Check (every 1h) ────────────────
// Comprehensive health report matching /admin/system/health page data.
// Always sends so the OpenClaw agent has continuous visibility.

export async function runSiteHealthCheck(): Promise<void> {
  const client = getHasuraClient();
  if (!client) return;

  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  let hasuraReachable = true;
  let dbResponseTime = 0;
  let totalUsers = 0;
  let activeUsers24h = 0;
  let activeUsers7d = 0;
  let maidProfiles = 0;
  let activeJobs = 0;
  let totalTransactions = 0;
  let storageUsedMB = 0;
  let adminActivity24h = 0;
  let details = '';

  try {
    const startTime = Date.now();

    const FULL_HEALTH_CHECK = gql`
      query FullHealthCheck($last24h: timestamptz!, $last7d: timestamptz!) {
        # Total users
        profiles_aggregate {
          aggregate { count }
        }
        # Active users 24h
        active_24h: profiles_aggregate(where: { updated_at: { _gte: $last24h } }) {
          aggregate { count }
        }
        # Active users 7d
        active_7d: profiles_aggregate(where: { updated_at: { _gte: $last7d } }) {
          aggregate { count }
        }
        # Maid profiles
        maid_profiles_aggregate {
          aggregate { count }
        }
        # Active jobs
        jobs_aggregate(where: { status: { _eq: "active" } }) {
          aggregate { count }
        }
        # Transactions
        placement_fee_transactions_aggregate {
          aggregate { count }
        }
        # Admin activity (24h)
        admin_activity_logs_aggregate(where: { created_at: { _gte: $last24h } }) {
          aggregate { count }
        }
        # Storage (agency docs file sizes)
        agency_documents_aggregate {
          aggregate {
            count
            sum { file_size }
          }
        }
      }
    `;

    const data = await client.request<{
      profiles_aggregate: { aggregate: { count: number } };
      active_24h: { aggregate: { count: number } };
      active_7d: { aggregate: { count: number } };
      maid_profiles_aggregate: { aggregate: { count: number } };
      jobs_aggregate: { aggregate: { count: number } };
      placement_fee_transactions_aggregate: { aggregate: { count: number } };
      admin_activity_logs_aggregate: { aggregate: { count: number } };
      agency_documents_aggregate: { aggregate: { count: number; sum: { file_size: number | null } } };
    }>(FULL_HEALTH_CHECK, { last24h: twentyFourHoursAgo, last7d: sevenDaysAgo });

    dbResponseTime = Date.now() - startTime;
    totalUsers = data.profiles_aggregate.aggregate.count;
    activeUsers24h = data.active_24h.aggregate.count;
    activeUsers7d = data.active_7d.aggregate.count;
    maidProfiles = data.maid_profiles_aggregate.aggregate.count;
    activeJobs = data.jobs_aggregate.aggregate.count;
    totalTransactions = data.placement_fee_transactions_aggregate.aggregate.count;
    adminActivity24h = data.admin_activity_logs_aggregate.aggregate.count;
    const totalFileSize = data.agency_documents_aggregate.aggregate.sum?.file_size || 0;
    storageUsedMB = Math.round(totalFileSize / (1024 * 1024));

  } catch (error) {
    hasuraReachable = false;
    details = error instanceof Error ? error.message : String(error);
  }

  // Always send — the OpenClaw agent needs continuous health visibility
  await sendMonitorTelegramMessage(formatSiteHealthAlert({
    hasuraReachable,
    dbResponseTime,
    recentErrors: 0,
    avgErrors: 0,
    spikeDetected: !hasuraReachable,
    totalUsers,
    activeUsers24h,
    activeUsers7d,
    maidProfiles,
    activeJobs,
    totalTransactions,
    storageUsedMB,
    storageTotalMB: 10240, // 10 GB quota
    adminActivity24h,
    details: details || undefined,
  }));

  console.log(`[AdminAI] Health report sent: reachable=${hasuraReachable}, response=${dbResponseTime}ms, users=${totalUsers}`);
}

// ─── Monitor 4: Revenue Report (every 24h) ──────────────────

export async function runRevenueReport(): Promise<void> {
  const client = getHasuraClient();
  if (!client) return;

  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const nowDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD for date columns
  const expiryDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  try {
    const REVENUE_STATS = gql`
      query RevenueReport($since: timestamptz!, $nowDate: date!, $expiryDate: date!) {
        # Active subscriptions
        active_subs: subscriptions_aggregate(where: { status: { _eq: "active" } }) {
          aggregate { count }
        }
        # For counting by plan, use individual aggregates
        basic_subs: subscriptions_aggregate(where: { status: { _eq: "active" }, plan_type: { _eq: "basic" } }) {
          aggregate { count }
        }
        premium_subs: subscriptions_aggregate(where: { status: { _eq: "active" }, plan_type: { _eq: "premium" } }) {
          aggregate { count }
        }
        pro_subs: subscriptions_aggregate(where: { status: { _eq: "active" }, plan_type: { _eq: "pro" } }) {
          aggregate { count }
        }
        # Expiring within 7 days
        expiring_soon: subscriptions_aggregate(
          where: {
            status: { _eq: "active" },
            end_date: { _lte: $expiryDate, _gte: $nowDate }
          }
        ) {
          aggregate { count }
        }
        # Canceled in last 24h
        recently_canceled: subscriptions_aggregate(
          where: {
            status: { _eq: "canceled" },
            updated_at: { _gte: $since }
          }
        ) {
          aggregate { count }
        }
        # Revenue in last 24h
        recent_revenue: payments_aggregate(
          where: {
            created_at: { _gte: $since },
            status: { _eq: "succeeded" }
          }
        ) {
          aggregate {
            sum { amount }
          }
        }
      }
    `;

    const data = await client.request<{
      active_subs: { aggregate: { count: number } };
      basic_subs: { aggregate: { count: number } };
      premium_subs: { aggregate: { count: number } };
      pro_subs: { aggregate: { count: number } };
      expiring_soon: { aggregate: { count: number } };
      recently_canceled: { aggregate: { count: number } };
      recent_revenue: { aggregate: { sum: { amount: number | null } } };
    }>(REVENUE_STATS, { since: twentyFourHoursAgo, nowDate, expiryDate });

    const byPlan: Array<{ plan: string; count: number }> = [];
    if (data.basic_subs.aggregate.count > 0) byPlan.push({ plan: 'Basic', count: data.basic_subs.aggregate.count });
    if (data.premium_subs.aggregate.count > 0) byPlan.push({ plan: 'Premium', count: data.premium_subs.aggregate.count });
    if (data.pro_subs.aggregate.count > 0) byPlan.push({ plan: 'Pro', count: data.pro_subs.aggregate.count });

    await sendMonitorTelegramMessage(formatRevenueReport({
      activeSubs: data.active_subs.aggregate.count,
      byPlan,
      expiringSoon: data.expiring_soon.aggregate.count,
      canceledRecently: data.recently_canceled.aggregate.count,
      totalRevenue: data.recent_revenue.aggregate.sum?.amount || 0,
    }));

    console.log('[AdminAI] Revenue report sent');
  } catch (error) {
    console.error('[AdminAI] Revenue report failed:', error);
  }
}

// ─── Monitor 5: Security Monitor (every 6h) ─────────────────

export async function runSecurityMonitor(): Promise<void> {
  const client = getHasuraClient();
  if (!client) return;

  const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString();

  try {
    const SECURITY_EVENTS = gql`
      query SecurityEvents($since: timestamptz!) {
        suspicious_actions: admin_activity_logs(
          where: {
            created_at: { _gte: $since },
            action: { _in: ["role_change", "user_delete", "admin_create", "permission_change", "bulk_delete", "export_data", "settings_change"] }
          }
          order_by: { created_at: desc }
          limit: 15
        ) {
          action
          admin_id
          resource_id
          resource_type
          details
          created_at
        }
        suspicious_count: admin_activity_logs_aggregate(
          where: {
            created_at: { _gte: $since },
            action: { _in: ["role_change", "user_delete", "admin_create", "permission_change", "bulk_delete", "export_data", "settings_change"] }
          }
        ) {
          aggregate { count }
        }
      }
    `;

    const data = await client.request<{
      suspicious_actions: Array<{
        action: string;
        admin_id: string | null;
        resource_id: string | null;
        resource_type: string | null;
        details: unknown;
        created_at: string | null;
      }>;
      suspicious_count: { aggregate: { count: number } };
    }>(SECURITY_EVENTS, { since: sixHoursAgo });

    const count = data.suspicious_count.aggregate.count;

    if (count === 0) {
      console.log('[AdminAI] No suspicious security events');
      return;
    }

    await sendMonitorTelegramMessage(formatSecurityAlert({
      count,
      actions: data.suspicious_actions.map((a) => ({
        action: a.action,
        admin_email: a.admin_id,
        target: a.resource_id,
        created_at: a.created_at,
      })),
    }));

    console.log(`[AdminAI] Security alert sent: ${count} events`);
  } catch (error) {
    console.error('[AdminAI] Security monitor failed:', error);
  }
}

// ─── Maintenance: Auto-Archive & Auto-Delete ────────────────

export async function runMonitorMaintenance(): Promise<void> {
  const client = getHasuraClient();
  if (!client) return;

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  try {
    // Auto-archive: resolved/fixed items older than 7 days
    const ARCHIVE_MUTATIONS = gql`
      mutation AutoArchive($sevenDaysAgo: timestamptz!) {
        archive_reports: update_monitor_reports(
          where: {
            archived: { _eq: false }
            created_at: { _lte: $sevenDaysAgo }
            priority: { _in: ["P3", "P4"] }
          }
          _set: { archived: true }
        ) { affected_rows }

        archive_feedback: update_customer_feedback(
          where: {
            archived: { _eq: false }
            status: { _in: ["resolved", "dismissed"] }
            updated_at: { _lte: $sevenDaysAgo }
          }
          _set: { archived: true }
        ) { affected_rows }

        archive_crashes: update_crash_reports(
          where: {
            archived: { _eq: false }
            resolved: { _eq: true }
            created_at: { _lte: $sevenDaysAgo }
          }
          _set: { archived: true }
        ) { affected_rows }
      }
    `;

    const archiveResult = await client.request<{
      archive_reports: { affected_rows: number };
      archive_feedback: { affected_rows: number };
      archive_crashes: { affected_rows: number };
    }>(ARCHIVE_MUTATIONS, { sevenDaysAgo });

    // Auto-delete: archived items older than 30 days
    const DELETE_MUTATIONS = gql`
      mutation AutoDelete($thirtyDaysAgo: timestamptz!) {
        delete_reports: delete_monitor_reports(
          where: {
            archived: { _eq: true }
            created_at: { _lte: $thirtyDaysAgo }
          }
        ) { affected_rows }

        delete_feedback: delete_customer_feedback(
          where: {
            archived: { _eq: true }
            created_at: { _lte: $thirtyDaysAgo }
          }
        ) { affected_rows }

        delete_crashes: delete_crash_reports(
          where: {
            archived: { _eq: true }
            created_at: { _lte: $thirtyDaysAgo }
          }
        ) { affected_rows }
      }
    `;

    const deleteResult = await client.request<{
      delete_reports: { affected_rows: number };
      delete_feedback: { affected_rows: number };
      delete_crashes: { affected_rows: number };
    }>(DELETE_MUTATIONS, { thirtyDaysAgo });

    const totalArchived =
      archiveResult.archive_reports.affected_rows +
      archiveResult.archive_feedback.affected_rows +
      archiveResult.archive_crashes.affected_rows;

    const totalDeleted =
      deleteResult.delete_reports.affected_rows +
      deleteResult.delete_feedback.affected_rows +
      deleteResult.delete_crashes.affected_rows;

    if (totalArchived > 0 || totalDeleted > 0) {
      console.log(
        `[AdminAI] Maintenance: archived ${totalArchived} items, deleted ${totalDeleted} items`
      );
    }
  } catch (error) {
    console.error('[AdminAI] Maintenance task failed:', error);
  }
}

// ─── Monitor 6: Customer Feedback (every 12h) ───────────────

export async function runCustomerFeedbackReport(): Promise<void> {
  const client = getHasuraClient();
  if (!client) return;

  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  try {
    const FEEDBACK_STATS = gql`
      query FeedbackStats($since: timestamptz!) {
        new_feedback: customer_feedback_aggregate(where: { created_at: { _gte: $since } }) {
          aggregate { count }
        }
        recent: customer_feedback(
          where: { created_at: { _gte: $since } }
          order_by: { created_at: desc }
          limit: 10
        ) { feedback_type message rating user_type }
        unresolved: customer_feedback_aggregate(
          where: { status: { _in: ["new", "in_review"] } }
        ) { aggregate { count } }
        avg_rating: customer_feedback_aggregate(
          where: { rating: { _is_null: false } }
        ) { aggregate { avg { rating } } }
        bugs: customer_feedback_aggregate(
          where: { feedback_type: { _eq: "bug" }, status: { _in: ["new", "in_review"] } }
        ) { aggregate { count } }
        complaints: customer_feedback_aggregate(
          where: { feedback_type: { _eq: "complaint" }, status: { _in: ["new", "in_review"] } }
        ) { aggregate { count } }
      }
    `;

    const data = await client.request<{
      new_feedback: { aggregate: { count: number } };
      recent: Array<{ feedback_type: string; message: string; rating: number | null; user_type: string | null }>;
      unresolved: { aggregate: { count: number } };
      avg_rating: { aggregate: { avg: { rating: number | null } } };
      bugs: { aggregate: { count: number } };
      complaints: { aggregate: { count: number } };
    }>(FEEDBACK_STATS, { since: twentyFourHoursAgo });

    await sendMonitorTelegramMessage(formatCustomerFeedbackReport({
      newCount: data.new_feedback.aggregate.count,
      unresolvedCount: data.unresolved.aggregate.count,
      avgRating: data.avg_rating.aggregate.avg?.rating ?? null,
      openBugs: data.bugs.aggregate.count,
      openComplaints: data.complaints.aggregate.count,
      recentFeedback: data.recent,
    }));

    console.log('[AdminAI] Customer feedback report sent');
  } catch (error) {
    console.error('[AdminAI] Customer feedback report failed:', error);
  }
}

// ─── Monitor 7: Crash Analytics (every 4h) ──────────────────

export async function runCrashAnalytics(): Promise<void> {
  const client = getHasuraClient();
  if (!client) return;

  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

  try {
    const CRASH_STATS = gql`
      query CrashStats($since: timestamptz!, $since1h: timestamptz!) {
        total_24h: crash_reports_aggregate(where: { created_at: { _gte: $since } }) {
          aggregate { count }
        }
        fatal_24h: crash_reports_aggregate(
          where: { created_at: { _gte: $since }, severity: { _eq: "fatal" } }
        ) { aggregate { count } }
        errors_1h: crash_reports_aggregate(where: { created_at: { _gte: $since1h } }) {
          aggregate { count }
        }
        unresolved: crash_reports_aggregate(where: { resolved: { _eq: false } }) {
          aggregate { count }
        }
        recent: crash_reports(
          where: { created_at: { _gte: $since } }
          order_by: { created_at: desc }
          limit: 10
        ) { severity error_type error_message page_url component_name }
        top_errors: crash_reports(
          where: { created_at: { _gte: $since } }
          distinct_on: [error_message]
          order_by: [{ error_message: asc }, { created_at: desc }]
          limit: 5
        ) { error_type error_message severity }
      }
    `;

    const data = await client.request<{
      total_24h: { aggregate: { count: number } };
      fatal_24h: { aggregate: { count: number } };
      errors_1h: { aggregate: { count: number } };
      unresolved: { aggregate: { count: number } };
      recent: Array<{ severity: string; error_type: string; error_message: string; page_url: string | null; component_name: string | null }>;
      top_errors: Array<{ error_type: string; error_message: string; severity: string }>;
    }>(CRASH_STATS, { since: twentyFourHoursAgo, since1h: oneHourAgo });

    await sendMonitorTelegramMessage(formatCrashAnalyticsReport({
      total24h: data.total_24h.aggregate.count,
      fatal24h: data.fatal_24h.aggregate.count,
      lastHour: data.errors_1h.aggregate.count,
      unresolvedCount: data.unresolved.aggregate.count,
      topErrors: data.top_errors,
      recentCrashes: data.recent,
    }));

    console.log('[AdminAI] Crash analytics report sent');
  } catch (error) {
    console.error('[AdminAI] Crash analytics report failed:', error);
  }
}
