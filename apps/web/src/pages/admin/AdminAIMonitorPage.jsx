import React, { useState, useEffect, useCallback } from 'react';
import { gql } from '@apollo/client';
import { apolloClient } from '@ethio/api-client';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { useToast } from '@/hooks/use-toast';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  BrainCircuit,
  Activity,
  Clock,
  Send,
  CreditCard,
  ShieldAlert,
  HeartPulse,
  UserX,
  Loader2,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Bot,
  FileText,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  XCircle,
  MessageSquare,
  Bug,
  Star,
  Check,
  Trash2,
  Archive,
  Eye,
  EyeOff,
} from 'lucide-react';

// --- GraphQL Queries ---

const GET_MONITOR_REPORTS = gql`
  query GetMonitorReports($limit: Int!, $offset: Int!, $where: monitor_reports_bool_exp) {
    monitor_reports(
      order_by: { created_at: desc }
      limit: $limit
      offset: $offset
      where: $where
    ) {
      id
      report_type
      report_content
      agent_response
      priority
      status
      archived
      created_at
    }
    monitor_reports_aggregate(where: $where) {
      aggregate {
        count
      }
    }
  }
`;

const GET_CUSTOMER_FEEDBACK = gql`
  query GetCustomerFeedback($limit: Int!, $offset: Int!, $where: customer_feedback_bool_exp) {
    customer_feedback(
      order_by: { created_at: desc }
      limit: $limit
      offset: $offset
      where: $where
    ) {
      id
      user_id
      user_type
      feedback_type
      category
      rating
      message
      page_url
      status
      admin_notes
      archived
      resolved_at
      created_at
    }
    customer_feedback_aggregate(where: $where) {
      aggregate {
        count
      }
    }
  }
`;

const GET_FEEDBACK_STATS = gql`
  query GetFeedbackStats {
    total: customer_feedback_aggregate {
      aggregate { count }
    }
    new_fb: customer_feedback_aggregate(where: { status: { _eq: "new" } }) {
      aggregate { count }
    }
    in_review: customer_feedback_aggregate(where: { status: { _eq: "in_review" } }) {
      aggregate { count }
    }
    resolved: customer_feedback_aggregate(where: { status: { _eq: "resolved" } }) {
      aggregate { count }
    }
    bugs: customer_feedback_aggregate(where: { feedback_type: { _eq: "bug" } }) {
      aggregate { count }
    }
    avg_rating: customer_feedback_aggregate(where: { rating: { _is_null: false } }) {
      aggregate { avg { rating } count }
    }
  }
`;

const GET_CRASH_REPORTS = gql`
  query GetCrashReports($limit: Int!, $offset: Int!, $where: crash_reports_bool_exp) {
    crash_reports(
      order_by: { created_at: desc }
      limit: $limit
      offset: $offset
      where: $where
    ) {
      id
      user_id
      error_type
      error_message
      error_stack
      component_name
      page_url
      app_version
      severity
      resolved
      archived
      created_at
    }
    crash_reports_aggregate(where: $where) {
      aggregate {
        count
      }
    }
  }
`;

const GET_CRASH_STATS = gql`
  query GetCrashStats($since: timestamptz!) {
    total: crash_reports_aggregate {
      aggregate { count }
    }
    fatal: crash_reports_aggregate(where: { severity: { _eq: "fatal" } }) {
      aggregate { count }
    }
    errors: crash_reports_aggregate(where: { severity: { _eq: "error" } }) {
      aggregate { count }
    }
    warnings: crash_reports_aggregate(where: { severity: { _eq: "warning" } }) {
      aggregate { count }
    }
    unresolved: crash_reports_aggregate(where: { resolved: { _eq: false } }) {
      aggregate { count }
    }
    last_24h: crash_reports_aggregate(where: { created_at: { _gte: $since } }) {
      aggregate { count }
    }
  }
`;

const GET_MONITOR_STATS = gql`
  query GetMonitorStats {
    total: monitor_reports_aggregate {
      aggregate { count }
    }
    p1: monitor_reports_aggregate(where: { priority: { _eq: "P1" } }) {
      aggregate { count }
    }
    p2: monitor_reports_aggregate(where: { priority: { _eq: "P2" } }) {
      aggregate { count }
    }
    delivered: monitor_reports_aggregate(where: { status: { _eq: "delivered" } }) {
      aggregate { count }
    }
    failed: monitor_reports_aggregate(where: { status: { _eq: "failed" } }) {
      aggregate { count }
    }
    latest: monitor_reports(order_by: { created_at: desc }, limit: 1) {
      created_at
    }
    recent_critical: monitor_reports(
      where: { priority: { _in: ["P1", "P2"] } }
      order_by: { created_at: desc }
      limit: 3
    ) {
      id
      report_type
      agent_response
      priority
      created_at
    }
  }
`;

// --- Delete & Archive Mutations ---

const DELETE_MONITOR_REPORT = gql`
  mutation DeleteMonitorReport($id: uuid!) {
    delete_monitor_reports_by_pk(id: $id) { id }
  }
`;

const DELETE_CUSTOMER_FEEDBACK = gql`
  mutation DeleteCustomerFeedback($id: uuid!) {
    delete_customer_feedback_by_pk(id: $id) { id }
  }
`;

const DELETE_CRASH_REPORT = gql`
  mutation DeleteCrashReport($id: uuid!) {
    delete_crash_reports_by_pk(id: $id) { id }
  }
`;

const ARCHIVE_MONITOR_REPORT = gql`
  mutation ArchiveMonitorReport($id: uuid!, $archived: Boolean!) {
    update_monitor_reports_by_pk(pk_columns: { id: $id }, _set: { archived: $archived }) { id archived }
  }
`;

const ARCHIVE_CUSTOMER_FEEDBACK = gql`
  mutation ArchiveCustomerFeedback($id: uuid!, $archived: Boolean!) {
    update_customer_feedback_by_pk(pk_columns: { id: $id }, _set: { archived: $archived }) { id archived }
  }
`;

const ARCHIVE_CRASH_REPORT = gql`
  mutation ArchiveCrashReport($id: uuid!, $archived: Boolean!) {
    update_crash_reports_by_pk(pk_columns: { id: $id }, _set: { archived: $archived }) { id archived }
  }
`;

// --- Constants ---

const MONITORS = [
  {
    id: 'daily-briefing',
    name: 'Daily Briefing',
    description: 'Comprehensive daily summary of platform stats.',
    schedule: 'Every day at 8:00 AM (UAE)',
    icon: Activity,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
  },
  {
    id: 'stale-registrations',
    name: 'Stale Registrations',
    description: 'Detects users who registered 24h+ ago but never completed onboarding.',
    schedule: 'Every 12 hours',
    icon: UserX,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
  },
  {
    id: 'site-health',
    name: 'Site Health',
    description: 'Pings Hasura, checks error rate spikes.',
    schedule: 'Every 1 hour',
    icon: HeartPulse,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
  },
  {
    id: 'revenue',
    name: 'Revenue Report',
    description: 'Active subscriptions, expiring soon, cancellations, and daily revenue.',
    schedule: 'Every 24 hours',
    icon: CreditCard,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
  },
  {
    id: 'security',
    name: 'Security Monitor',
    description: 'Scans admin activity logs for suspicious actions.',
    schedule: 'Every 6 hours',
    icon: ShieldAlert,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
  },
  {
    id: 'customer-feedback',
    name: 'Customer Feedback',
    description: 'Tracks user feedback, bug reports, complaints, and satisfaction ratings.',
    schedule: 'Every 12 hours',
    icon: MessageSquare,
    color: 'text-teal-600',
    bgColor: 'bg-teal-50',
  },
  {
    id: 'crash-analytics',
    name: 'Crash Analytics',
    description: 'Monitors client-side errors, fatal crashes, and error patterns.',
    schedule: 'Every 4 hours',
    icon: Bug,
    color: 'text-pink-600',
    bgColor: 'bg-pink-50',
  },
];

const PRIORITY_CONFIG = {
  P1: { label: 'P1 Critical', className: 'bg-red-100 text-red-800 border-red-200', icon: XCircle },
  P2: { label: 'P2 Warning', className: 'bg-orange-100 text-orange-800 border-orange-200', icon: AlertTriangle },
  P3: { label: 'P3 Normal', className: 'bg-green-100 text-green-800 border-green-200', icon: CheckCircle },
  P4: { label: 'P4 Info', className: 'bg-blue-100 text-blue-800 border-blue-200', icon: AlertCircle },
};

const REPORT_TYPE_LABELS = {
  'daily-briefing': 'Daily Briefing',
  'site-health': 'Site Health',
  'stale-registrations': 'Stale Registrations',
  'revenue': 'Revenue',
  'security': 'Security',
  'customer-feedback': 'Customer Feedback',
  'crash-analytics': 'Crash Analytics',
};

// --- Helper Components ---

function PriorityBadge({ priority }) {
  const config = PRIORITY_CONFIG[priority] || PRIORITY_CONFIG.P3;
  const Icon = config.icon;
  return (
    <Badge className={`${config.className} gap-1 font-medium`}>
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  );
}

function TimeAgo({ date }) {
  const now = new Date();
  const d = new Date(date);
  const diffMs = now - d;
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  let text;
  if (diffMin < 1) text = 'Just now';
  else if (diffMin < 60) text = `${diffMin}m ago`;
  else if (diffHr < 24) text = `${diffHr}h ago`;
  else if (diffDay < 7) text = `${diffDay}d ago`;
  else text = d.toLocaleDateString();

  return (
    <span className="text-xs text-muted-foreground" title={d.toLocaleString()}>
      {text}
    </span>
  );
}

/** Extract fix summary / action items from agent response text */
function extractFixSummary(text) {
  if (!text) return null;
  const lines = text.split('\n');
  const actions = [];
  let inActionBlock = false;

  for (const line of lines) {
    const trimmed = line.trim();
    // Strip markdown heading prefix for matching
    const stripped = trimmed.replace(/^#{1,3}\s+/, '').replace(/\*\*/g, '');

    // Detect action/fix/recommendation headers (must be action-oriented, not "check" or "analysis")
    if (/^(actions?\s*(\(|:|-|$)|immediate\s+actions?|recommended\s+actions?|action\s+items?|next\s+steps?|resolution|remediation|what\s+to\s+do|steps?\s+to\s+take|what\s+i\s+recommend)/i.test(stripped)) {
      inActionBlock = true;
      continue;
    }
    // Detect end of action block (new heading that's NOT action-related, or signoff lines)
    if (inActionBlock && /^#{1,3}\s+/.test(trimmed) && !/action|fix|step|resolution|do\b|recommend/i.test(trimmed)) {
      inActionBlock = false;
    }
    if (inActionBlock && /^(Logged to|Status:|---)/i.test(trimmed)) {
      inActionBlock = false;
    }
    // Collect numbered items in action block (use \d+. format, not \d+) to match "1. Do X")
    if (inActionBlock && /^\s*\d+\.\s+/.test(trimmed)) {
      const cleaned = trimmed.replace(/^\s*\d+\.\s+/, '').replace(/\*\*/g, '');
      if (cleaned.length > 5) actions.push(cleaned);
    }
    // Also collect bulleted items in action block
    if (inActionBlock && /^\s*[-*]\s+/.test(trimmed)) {
      const cleaned = trimmed.replace(/^\s*[-*]\s+/, '').replace(/\*\*/g, '');
      if (cleaned.length > 5) actions.push(cleaned);
    }
  }

  // Extract one-liner summary (first bold line that looks like a headline)
  let summary = null;
  for (const line of lines) {
    const t = line.trim();
    // Match headline-style bold lines like "🚨 **P1 - High: DB latency spike detected**"
    const headlineMatch = t.match(/^[🚨🔴⚠️🟡🟢ℹ️]*\s*\*\*(.+?)\*\*/);
    if (headlineMatch && headlineMatch[1].length > 10) {
      summary = headlineMatch[1];
      break;
    }
  }
  // Fallback: first **Label:** line
  if (!summary) {
    for (const line of lines) {
      const t = line.trim();
      if (/^\*\*(Problem|Issue|Alert|Warning|Critical|Summary).*?\*\*/.test(t)) {
        summary = t.replace(/\*\*/g, '');
        break;
      }
    }
  }

  if (actions.length === 0 && !summary) return null;
  return { actions: actions.slice(0, 5), summary };
}

/** Agent fix notification banner for critical reports */
function CriticalAlertBanner({ criticalReports }) {
  const [dismissed, setDismissed] = useState({});

  if (!criticalReports || criticalReports.length === 0) return null;

  const visible = criticalReports.filter((r) => !dismissed[r.id]);
  if (visible.length === 0) return null;

  return (
    <div className="space-y-2">
      {visible.map((report) => {
        const fix = extractFixSummary(report.agent_response);
        const isP1 = report.priority === 'P1';
        const typeLabel = REPORT_TYPE_LABELS[report.report_type] || report.report_type;

        return (
          <div
            key={report.id}
            className={`rounded-lg border p-3 ${
              isP1
                ? 'bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-800'
                : 'bg-orange-50 border-orange-200 dark:bg-orange-950/30 dark:border-orange-800'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-2.5 min-w-0">
                {isP1 ? (
                  <XCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-orange-600 shrink-0 mt-0.5" />
                )}
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-sm font-semibold ${isP1 ? 'text-red-800' : 'text-orange-800'}`}>
                      {report.priority} - {typeLabel}
                    </span>
                    <TimeAgo date={report.created_at} />
                  </div>

                  {/* Agent summary */}
                  {fix?.summary && (
                    <p className={`text-sm mt-1 ${isP1 ? 'text-red-700' : 'text-orange-700'}`}>
                      {fix.summary}
                    </p>
                  )}

                  {/* Agent fix actions */}
                  {fix?.actions.length > 0 && (
                    <div className="mt-2 space-y-1">
                      <span className={`text-xs font-semibold uppercase tracking-wider ${isP1 ? 'text-red-600' : 'text-orange-600'}`}>
                        Agent Fix Actions:
                      </span>
                      {fix.actions.map((action, i) => (
                        <div key={i} className="flex items-start gap-1.5 text-sm">
                          <span className={`shrink-0 font-medium ${isP1 ? 'text-red-500' : 'text-orange-500'}`}>{i + 1}.</span>
                          <span className={isP1 ? 'text-red-700' : 'text-orange-700'}>{action}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {!fix && report.agent_response && (
                    <p className={`text-sm mt-1 ${isP1 ? 'text-red-700' : 'text-orange-700'}`}>
                      {report.agent_response.split('\n').find((l) => l.trim().length > 15)?.trim().replace(/\*\*/g, '').slice(0, 150) || 'Agent analysis available - expand report for details.'}
                    </p>
                  )}
                </div>
              </div>

              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 shrink-0 opacity-60 hover:opacity-100"
                onClick={() => setDismissed((prev) => ({ ...prev, [report.id]: true }))}
              >
                <XCircle className="h-4 w-4" />
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/** Simple markdown renderer for agent responses (bold, code, lists, headings) */
function SimpleMarkdown({ text }) {
  if (!text) return null;

  const lines = text.split('\n');

  return (
    <div className="space-y-1">
      {lines.map((line, i) => {
        // Heading ###
        if (/^###\s+/.test(line)) {
          return <p key={i} className="font-semibold text-sm mt-2 mb-0.5">{renderInline(line.replace(/^###\s+/, ''))}</p>;
        }
        // List item - or *
        if (/^\s*[-*]\s+/.test(line)) {
          return (
            <div key={i} className="flex gap-1.5 ml-1">
              <span className="text-muted-foreground mt-0.5 shrink-0">&#8226;</span>
              <span>{renderInline(line.replace(/^\s*[-*]\s+/, ''))}</span>
            </div>
          );
        }
        // Numbered list
        if (/^\s*\d+\.\s+/.test(line)) {
          const num = line.match(/^\s*(\d+)\./)[1];
          return (
            <div key={i} className="flex gap-1.5 ml-1">
              <span className="text-muted-foreground shrink-0">{num}.</span>
              <span>{renderInline(line.replace(/^\s*\d+\.\s+/, ''))}</span>
            </div>
          );
        }
        // Empty line
        if (line.trim() === '') return <div key={i} className="h-1" />;
        // Regular line
        return <p key={i}>{renderInline(line)}</p>;
      })}
    </div>
  );
}

/** Render inline markdown: **bold**, `code`, [P1]-[P4] badges */
function renderInline(text) {
  const parts = [];
  let remaining = text;
  let key = 0;

  while (remaining.length > 0) {
    // Bold **text**
    const boldMatch = remaining.match(/\*\*(.+?)\*\*/);
    // Inline code `text`
    const codeMatch = remaining.match(/`([^`]+)`/);

    // Find earliest match
    const matches = [
      boldMatch && { type: 'bold', index: boldMatch.index, match: boldMatch },
      codeMatch && { type: 'code', index: codeMatch.index, match: codeMatch },
    ].filter(Boolean).sort((a, b) => a.index - b.index);

    if (matches.length === 0) {
      parts.push(remaining);
      break;
    }

    const first = matches[0];
    // Text before match
    if (first.index > 0) {
      parts.push(remaining.slice(0, first.index));
    }

    if (first.type === 'bold') {
      parts.push(<strong key={key++} className="font-semibold">{first.match[1]}</strong>);
      remaining = remaining.slice(first.index + first.match[0].length);
    } else if (first.type === 'code') {
      parts.push(<code key={key++} className="px-1 py-0.5 rounded bg-muted text-xs font-mono">{first.match[1]}</code>);
      remaining = remaining.slice(first.index + first.match[0].length);
    }
  }

  return parts;
}

function ReportCard({ report, defaultExpanded = false, onDelete, onArchive }) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const monitorConfig = MONITORS.find((m) => m.id === report.report_type);
  const Icon = monitorConfig?.icon || FileText;
  const iconColor = monitorConfig?.color || 'text-gray-600';
  const iconBg = monitorConfig?.bgColor || 'bg-gray-50';

  return (
    <Card className={`transition-all ${report.archived ? 'opacity-60' : ''} ${report.priority === 'P1' ? 'border-red-300 shadow-red-100 shadow-sm' : report.priority === 'P2' ? 'border-orange-200' : ''}`}>
      <CardHeader className="pb-2 cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`p-2 rounded-lg ${iconBg} shrink-0`}>
              <Icon className={`h-4 w-4 ${iconColor}`} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <CardTitle className="text-sm font-semibold">
                  {REPORT_TYPE_LABELS[report.report_type] || report.report_type}
                </CardTitle>
                <PriorityBadge priority={report.priority} />
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <TimeAgo date={report.created_at} />
                <Badge variant="outline" className="text-xs h-5">
                  {report.status === 'delivered' ? 'Delivered' : 'Failed'}
                </Badge>
              </div>
            </div>
          </div>
          <Button variant="ghost" size="sm" className="shrink-0 h-8 w-8 p-0">
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
      </CardHeader>

      {expanded && (
        <CardContent className="pt-0 space-y-3">
          {/* Agent Fix Summary (extracted action items) */}
          {(() => {
            const fix = extractFixSummary(report.agent_response);
            if (!fix) return null;
            const isP1 = report.priority === 'P1';
            const isP2 = report.priority === 'P2';
            return (
              <div className={`rounded-lg border p-3 ${
                isP1 ? 'bg-red-50 border-red-200' : isP2 ? 'bg-orange-50 border-orange-200' : 'bg-blue-50 border-blue-200'
              }`}>
                <div className="flex items-center gap-1.5 mb-2">
                  <ShieldAlert className={`h-3.5 w-3.5 ${isP1 ? 'text-red-600' : isP2 ? 'text-orange-600' : 'text-blue-600'}`} />
                  <span className={`text-xs font-semibold uppercase tracking-wider ${isP1 ? 'text-red-600' : isP2 ? 'text-orange-600' : 'text-blue-600'}`}>
                    Agent Fix Summary
                  </span>
                </div>
                {fix.summary && (
                  <p className={`text-sm mb-2 ${isP1 ? 'text-red-700' : isP2 ? 'text-orange-700' : 'text-blue-700'}`}>
                    {fix.summary}
                  </p>
                )}
                <div className="space-y-1">
                  {fix.actions.map((action, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm">
                      <span className={`shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                        isP1 ? 'bg-red-500' : isP2 ? 'bg-orange-500' : 'bg-blue-500'
                      }`}>
                        {i + 1}
                      </span>
                      <span className={isP1 ? 'text-red-800' : isP2 ? 'text-orange-800' : 'text-blue-800'}>
                        {action}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* Monitor Report */}
          <div>
            <div className="flex items-center gap-1.5 mb-1.5">
              <FileText className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Report Data</span>
            </div>
            <pre className="text-xs bg-muted/50 rounded-lg p-3 whitespace-pre-wrap font-mono leading-relaxed overflow-auto max-h-48">
              {report.report_content}
            </pre>
          </div>

          {/* Agent Response */}
          {report.agent_response && (
            <div>
              <div className="flex items-center gap-1.5 mb-1.5">
                <Bot className="h-3.5 w-3.5 text-primary" />
                <span className="text-xs font-medium text-primary uppercase tracking-wider">Sheger&apos;s Full Analysis</span>
              </div>
              <div className="text-sm bg-primary/5 border border-primary/10 rounded-lg p-3 leading-relaxed overflow-auto max-h-64">
                <SimpleMarkdown text={report.agent_response} />
              </div>
            </div>
          )}

          {/* Admin Actions */}
          <div className="flex items-center gap-2 pt-2 border-t">
            {onArchive && (
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs"
                onClick={(e) => { e.stopPropagation(); onArchive(report.id, !report.archived); }}
              >
                {report.archived ? <Eye className="h-3.5 w-3.5" /> : <Archive className="h-3.5 w-3.5" />}
                {report.archived ? 'Unarchive' : 'Archive'}
              </Button>
            )}
            {onDelete && (
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs text-red-600 hover:bg-red-50 hover:text-red-700"
                onClick={(e) => { e.stopPropagation(); if (window.confirm('Delete this report permanently?')) onDelete(report.id); }}
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete
              </Button>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
}

// --- Customer Feedback Tab ---

const FEEDBACK_TYPE_COLORS = {
  bug: 'bg-red-100 text-red-700',
  complaint: 'bg-orange-100 text-orange-700',
  suggestion: 'bg-blue-100 text-blue-700',
  praise: 'bg-green-100 text-green-700',
  general: 'bg-gray-100 text-gray-700',
};

const FEEDBACK_STATUS_COLORS = {
  new: 'bg-blue-100 text-blue-700',
  in_review: 'bg-yellow-100 text-yellow-700',
  resolved: 'bg-green-100 text-green-700',
  dismissed: 'bg-gray-100 text-gray-500',
};

function StarRating({ rating }) {
  if (!rating) return <span className="text-xs text-muted-foreground">No rating</span>;
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`h-3.5 w-3.5 ${i <= rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}`}
        />
      ))}
    </div>
  );
}

function FeedbackCard({ feedback, onDelete, onArchive }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card className={feedback.archived ? 'opacity-60' : ''}>
      <CardHeader className="pb-2 cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 rounded-lg bg-teal-50 shrink-0">
              <MessageSquare className="h-4 w-4 text-teal-600" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge className={FEEDBACK_TYPE_COLORS[feedback.feedback_type] || FEEDBACK_TYPE_COLORS.general}>
                  {feedback.feedback_type}
                </Badge>
                <Badge className={FEEDBACK_STATUS_COLORS[feedback.status] || FEEDBACK_STATUS_COLORS.new}>
                  {feedback.status.replace('_', ' ')}
                </Badge>
                <StarRating rating={feedback.rating} />
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-muted-foreground truncate">
                  {feedback.user_type && <span className="capitalize">{feedback.user_type}</span>}
                  {feedback.category && <> &middot; {feedback.category}</>}
                </span>
                <TimeAgo date={feedback.created_at} />
              </div>
            </div>
          </div>
          <Button variant="ghost" size="sm" className="shrink-0 h-8 w-8 p-0">
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
      </CardHeader>

      {expanded && (
        <CardContent className="pt-0 space-y-3">
          <div className="bg-muted/50 rounded-lg p-3">
            <p className="text-sm whitespace-pre-wrap">{feedback.message}</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div>
              <span className="text-muted-foreground">User ID</span>
              <p className="font-mono truncate">{feedback.user_id}</p>
            </div>
            {feedback.page_url && (
              <div>
                <span className="text-muted-foreground">Page</span>
                <p className="truncate">{feedback.page_url}</p>
              </div>
            )}
            {feedback.resolved_at && (
              <div>
                <span className="text-muted-foreground">Resolved</span>
                <p>{new Date(feedback.resolved_at).toLocaleDateString()}</p>
              </div>
            )}
          </div>
          {feedback.admin_notes && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider">Admin Notes</span>
              <p className="text-sm mt-1 text-blue-800">{feedback.admin_notes}</p>
            </div>
          )}

          {/* Admin Actions */}
          <div className="flex items-center gap-2 pt-2 border-t">
            {onArchive && (
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs"
                onClick={(e) => { e.stopPropagation(); onArchive(feedback.id, !feedback.archived); }}
              >
                {feedback.archived ? <Eye className="h-3.5 w-3.5" /> : <Archive className="h-3.5 w-3.5" />}
                {feedback.archived ? 'Unarchive' : 'Archive'}
              </Button>
            )}
            {onDelete && (
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs text-red-600 hover:bg-red-50 hover:text-red-700"
                onClick={(e) => { e.stopPropagation(); if (window.confirm('Delete this feedback permanently?')) onDelete(feedback.id); }}
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete
              </Button>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
}

function CustomerFeedbackTab() {
  const { toast } = useToast();
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [fbStats, setFbStats] = useState(null);
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showArchived, setShowArchived] = useState(false);
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 10;

  const buildWhere = useCallback(() => {
    const conditions = {};
    if (filterType !== 'all') conditions.feedback_type = { _eq: filterType };
    if (filterStatus !== 'all') conditions.status = { _eq: filterStatus };
    if (!showArchived) conditions.archived = { _eq: false };
    return Object.keys(conditions).length > 0 ? conditions : {};
  }, [filterType, filterStatus, showArchived]);

  const handleDelete = useCallback(async (id) => {
    try {
      await apolloClient.mutate({ mutation: DELETE_CUSTOMER_FEEDBACK, variables: { id } });
      setItems((prev) => prev.filter((r) => r.id !== id));
      setTotal((c) => c - 1);
      toast({ title: 'Feedback deleted' });
    } catch (err) {
      toast({ title: 'Delete failed', description: err.message, variant: 'destructive' });
    }
  }, [toast]);

  const handleArchive = useCallback(async (id, archived) => {
    try {
      await apolloClient.mutate({ mutation: ARCHIVE_CUSTOMER_FEEDBACK, variables: { id, archived } });
      if (!showArchived && archived) {
        setItems((prev) => prev.filter((r) => r.id !== id));
        setTotal((c) => c - 1);
      } else {
        setItems((prev) => prev.map((r) => r.id === id ? { ...r, archived } : r));
      }
      toast({ title: archived ? 'Feedback archived' : 'Feedback unarchived' });
    } catch (err) {
      toast({ title: 'Archive failed', description: err.message, variant: 'destructive' });
    }
  }, [toast, showArchived]);

  const fetchItems = useCallback(async (offset = 0, append = false) => {
    if (!append) setLoading(true);
    else setLoadingMore(true);
    try {
      const { data } = await apolloClient.query({
        query: GET_CUSTOMER_FEEDBACK,
        variables: { limit: PAGE_SIZE, offset, where: buildWhere() },
        fetchPolicy: 'network-only',
      });
      const fetched = data.customer_feedback || [];
      const count = data.customer_feedback_aggregate?.aggregate?.count || 0;
      if (append) setItems((prev) => [...prev, ...fetched]);
      else setItems(fetched);
      setTotal(count);
    } catch (err) {
      toast({ title: 'Failed to load feedback', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [buildWhere, toast]);

  const fetchStats = useCallback(async () => {
    try {
      const { data } = await apolloClient.query({
        query: GET_FEEDBACK_STATS,
        fetchPolicy: 'network-only',
      });
      setFbStats({
        total: data.total?.aggregate?.count || 0,
        newCount: data.new_fb?.aggregate?.count || 0,
        inReview: data.in_review?.aggregate?.count || 0,
        resolved: data.resolved?.aggregate?.count || 0,
        bugs: data.bugs?.aggregate?.count || 0,
        avgRating: data.avg_rating?.aggregate?.avg?.rating
          ? Number(data.avg_rating.aggregate.avg.rating).toFixed(1)
          : '-',
        ratingCount: data.avg_rating?.aggregate?.count || 0,
      });
    } catch (err) {
      console.error('Feedback stats error:', err);
    }
  }, []);

  useEffect(() => {
    setPage(0);
    fetchItems(0);
    fetchStats();
  }, [fetchItems, fetchStats]);

  const hasMore = items.length < total;

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        <Card>
          <CardContent className="pt-4 pb-3 px-4">
            <div className="text-2xl font-bold">{fbStats?.total ?? '-'}</div>
            <p className="text-xs text-muted-foreground">Total Feedback</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 px-4">
            <div className="text-2xl font-bold text-blue-600">{fbStats?.newCount ?? '-'}</div>
            <p className="text-xs text-muted-foreground">New</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 px-4">
            <div className="text-2xl font-bold text-yellow-600">{fbStats?.inReview ?? '-'}</div>
            <p className="text-xs text-muted-foreground">In Review</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 px-4">
            <div className="text-2xl font-bold text-green-600">{fbStats?.resolved ?? '-'}</div>
            <p className="text-xs text-muted-foreground">Resolved</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 px-4">
            <div className="text-2xl font-bold text-red-600">{fbStats?.bugs ?? '-'}</div>
            <p className="text-xs text-muted-foreground">Bug Reports</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
              <span className="text-2xl font-bold">{fbStats?.avgRating ?? '-'}</span>
            </div>
            <p className="text-xs text-muted-foreground">Avg Rating ({fbStats?.ratingCount ?? 0})</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <Select value={filterType} onValueChange={(val) => { setFilterType(val); setPage(0); }}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="bug">Bug</SelectItem>
            <SelectItem value="complaint">Complaint</SelectItem>
            <SelectItem value="suggestion">Suggestion</SelectItem>
            <SelectItem value="praise">Praise</SelectItem>
            <SelectItem value="general">General</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filterStatus} onValueChange={(val) => { setFilterStatus(val); setPage(0); }}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="new">New</SelectItem>
            <SelectItem value="in_review">In Review</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
            <SelectItem value="dismissed">Dismissed</SelectItem>
          </SelectContent>
        </Select>

        <Button
          variant={showArchived ? 'default' : 'outline'}
          size="sm"
          className="gap-1.5"
          onClick={() => { setShowArchived(!showArchived); setPage(0); }}
        >
          {showArchived ? <EyeOff className="h-3.5 w-3.5" /> : <Archive className="h-3.5 w-3.5" />}
          {showArchived ? 'Hide Archived' : 'Show Archived'}
        </Button>

        <span className="text-sm text-muted-foreground">
          {total} item{total !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Feedback List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">Loading feedback...</span>
        </div>
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground font-medium">No feedback yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Customer feedback will appear here as users submit it.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {items.map((fb) => (
            <FeedbackCard key={fb.id} feedback={fb} onDelete={handleDelete} onArchive={handleArchive} />
          ))}
          {hasMore && (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                const next = page + 1;
                setPage(next);
                fetchItems(next * PAGE_SIZE, true);
              }}
              disabled={loadingMore}
            >
              {loadingMore ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Loading...</>
              ) : (
                `Load More (${items.length} of ${total})`
              )}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

// --- Crash Analytics Tab ---

const SEVERITY_COLORS = {
  fatal: 'bg-red-100 text-red-800 border-red-200',
  error: 'bg-orange-100 text-orange-800 border-orange-200',
  warning: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  info: 'bg-blue-100 text-blue-800 border-blue-200',
};

function CrashCard({ crash, onDelete, onArchive }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card className={`${crash.archived ? 'opacity-60' : ''} ${crash.severity === 'fatal' ? 'border-red-300' : ''}`}>
      <CardHeader className="pb-2 cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`p-2 rounded-lg ${crash.severity === 'fatal' ? 'bg-red-50' : 'bg-pink-50'} shrink-0`}>
              <Bug className={`h-4 w-4 ${crash.severity === 'fatal' ? 'text-red-600' : 'text-pink-600'}`} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-semibold truncate max-w-[300px]">
                  {crash.error_message?.slice(0, 80) || 'Unknown error'}
                </span>
                <Badge className={SEVERITY_COLORS[crash.severity] || SEVERITY_COLORS.error}>
                  {crash.severity}
                </Badge>
                {crash.resolved && (
                  <Badge className="bg-green-100 text-green-700 gap-1">
                    <Check className="h-3 w-3" />
                    Resolved
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                <span className="font-mono">{crash.error_type}</span>
                {crash.component_name && <>&middot; {crash.component_name}</>}
                <TimeAgo date={crash.created_at} />
              </div>
            </div>
          </div>
          <Button variant="ghost" size="sm" className="shrink-0 h-8 w-8 p-0">
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
      </CardHeader>

      {expanded && (
        <CardContent className="pt-0 space-y-3">
          <div>
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Error Message</span>
            <p className="text-sm mt-1 font-mono bg-muted/50 rounded-lg p-3">{crash.error_message}</p>
          </div>
          {crash.error_stack && (
            <div>
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Stack Trace</span>
              <pre className="text-xs bg-muted/50 rounded-lg p-3 whitespace-pre-wrap font-mono overflow-auto max-h-48 mt-1">
                {crash.error_stack}
              </pre>
            </div>
          )}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            {crash.component_name && (
              <div>
                <span className="text-muted-foreground">Component</span>
                <p className="font-mono">{crash.component_name}</p>
              </div>
            )}
            {crash.page_url && (
              <div>
                <span className="text-muted-foreground">Page</span>
                <p className="truncate">{crash.page_url}</p>
              </div>
            )}
            {crash.app_version && (
              <div>
                <span className="text-muted-foreground">App Version</span>
                <p>{crash.app_version}</p>
              </div>
            )}
            {crash.user_id && (
              <div>
                <span className="text-muted-foreground">User ID</span>
                <p className="font-mono truncate">{crash.user_id}</p>
              </div>
            )}
          </div>

          {/* Admin Actions */}
          <div className="flex items-center gap-2 pt-2 border-t">
            {onArchive && (
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs"
                onClick={(e) => { e.stopPropagation(); onArchive(crash.id, !crash.archived); }}
              >
                {crash.archived ? <Eye className="h-3.5 w-3.5" /> : <Archive className="h-3.5 w-3.5" />}
                {crash.archived ? 'Unarchive' : 'Archive'}
              </Button>
            )}
            {onDelete && (
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs text-red-600 hover:bg-red-50 hover:text-red-700"
                onClick={(e) => { e.stopPropagation(); if (window.confirm('Delete this crash report permanently?')) onDelete(crash.id); }}
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete
              </Button>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
}

function CrashAnalyticsTab() {
  const { toast } = useToast();
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [crashStats, setCrashStats] = useState(null);
  const [filterSeverity, setFilterSeverity] = useState('all');
  const [filterResolved, setFilterResolved] = useState('all');
  const [showArchived, setShowArchived] = useState(false);
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 10;

  const buildWhere = useCallback(() => {
    const conditions = {};
    if (filterSeverity !== 'all') conditions.severity = { _eq: filterSeverity };
    if (filterResolved === 'unresolved') conditions.resolved = { _eq: false };
    else if (filterResolved === 'resolved') conditions.resolved = { _eq: true };
    if (!showArchived) conditions.archived = { _eq: false };
    return Object.keys(conditions).length > 0 ? conditions : {};
  }, [filterSeverity, filterResolved, showArchived]);

  const handleDelete = useCallback(async (id) => {
    try {
      await apolloClient.mutate({ mutation: DELETE_CRASH_REPORT, variables: { id } });
      setItems((prev) => prev.filter((r) => r.id !== id));
      setTotal((c) => c - 1);
      toast({ title: 'Crash report deleted' });
    } catch (err) {
      toast({ title: 'Delete failed', description: err.message, variant: 'destructive' });
    }
  }, [toast]);

  const handleArchive = useCallback(async (id, archived) => {
    try {
      await apolloClient.mutate({ mutation: ARCHIVE_CRASH_REPORT, variables: { id, archived } });
      if (!showArchived && archived) {
        setItems((prev) => prev.filter((r) => r.id !== id));
        setTotal((c) => c - 1);
      } else {
        setItems((prev) => prev.map((r) => r.id === id ? { ...r, archived } : r));
      }
      toast({ title: archived ? 'Crash report archived' : 'Crash report unarchived' });
    } catch (err) {
      toast({ title: 'Archive failed', description: err.message, variant: 'destructive' });
    }
  }, [toast, showArchived]);

  const fetchItems = useCallback(async (offset = 0, append = false) => {
    if (!append) setLoading(true);
    else setLoadingMore(true);
    try {
      const { data } = await apolloClient.query({
        query: GET_CRASH_REPORTS,
        variables: { limit: PAGE_SIZE, offset, where: buildWhere() },
        fetchPolicy: 'network-only',
      });
      const fetched = data.crash_reports || [];
      const count = data.crash_reports_aggregate?.aggregate?.count || 0;
      if (append) setItems((prev) => [...prev, ...fetched]);
      else setItems(fetched);
      setTotal(count);
    } catch (err) {
      toast({ title: 'Failed to load crash reports', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [buildWhere, toast]);

  const fetchStats = useCallback(async () => {
    try {
      const { data } = await apolloClient.query({
        query: GET_CRASH_STATS,
        variables: { since: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() },
        fetchPolicy: 'network-only',
      });
      setCrashStats({
        total: data.total?.aggregate?.count || 0,
        fatal: data.fatal?.aggregate?.count || 0,
        errors: data.errors?.aggregate?.count || 0,
        warnings: data.warnings?.aggregate?.count || 0,
        unresolved: data.unresolved?.aggregate?.count || 0,
        last24h: data.last_24h?.aggregate?.count || 0,
      });
    } catch (err) {
      console.error('Crash stats error:', err);
    }
  }, []);

  useEffect(() => {
    setPage(0);
    fetchItems(0);
    fetchStats();
  }, [fetchItems, fetchStats]);

  const hasMore = items.length < total;

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        <Card>
          <CardContent className="pt-4 pb-3 px-4">
            <div className="text-2xl font-bold">{crashStats?.total ?? '-'}</div>
            <p className="text-xs text-muted-foreground">Total Crashes</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 px-4">
            <div className="text-2xl font-bold text-red-600">{crashStats?.fatal ?? '-'}</div>
            <p className="text-xs text-muted-foreground">Fatal</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 px-4">
            <div className="text-2xl font-bold text-orange-600">{crashStats?.errors ?? '-'}</div>
            <p className="text-xs text-muted-foreground">Errors</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 px-4">
            <div className="text-2xl font-bold text-yellow-600">{crashStats?.warnings ?? '-'}</div>
            <p className="text-xs text-muted-foreground">Warnings</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 px-4">
            <div className="text-2xl font-bold text-purple-600">{crashStats?.unresolved ?? '-'}</div>
            <p className="text-xs text-muted-foreground">Unresolved</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 px-4">
            <div className="text-2xl font-bold text-pink-600">{crashStats?.last24h ?? '-'}</div>
            <p className="text-xs text-muted-foreground">Last 24h</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <Select value={filterSeverity} onValueChange={(val) => { setFilterSeverity(val); setPage(0); }}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="All Severities" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Severities</SelectItem>
            <SelectItem value="fatal">Fatal</SelectItem>
            <SelectItem value="error">Error</SelectItem>
            <SelectItem value="warning">Warning</SelectItem>
            <SelectItem value="info">Info</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filterResolved} onValueChange={(val) => { setFilterResolved(val); setPage(0); }}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="All" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="unresolved">Unresolved</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
          </SelectContent>
        </Select>

        <Button
          variant={showArchived ? 'default' : 'outline'}
          size="sm"
          className="gap-1.5"
          onClick={() => { setShowArchived(!showArchived); setPage(0); }}
        >
          {showArchived ? <EyeOff className="h-3.5 w-3.5" /> : <Archive className="h-3.5 w-3.5" />}
          {showArchived ? 'Hide Archived' : 'Show Archived'}
        </Button>

        <span className="text-sm text-muted-foreground">
          {total} report{total !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Crash List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">Loading crash reports...</span>
        </div>
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Bug className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground font-medium">No crash reports</p>
            <p className="text-sm text-muted-foreground mt-1">
              Crash reports will appear here when client-side errors are captured.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {items.map((crash) => (
            <CrashCard key={crash.id} crash={crash} onDelete={handleDelete} onArchive={handleArchive} />
          ))}
          {hasMore && (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                const next = page + 1;
                setPage(next);
                fetchItems(next * PAGE_SIZE, true);
              }}
              disabled={loadingMore}
            >
              {loadingMore ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Loading...</>
              ) : (
                `Load More (${items.length} of ${total})`
              )}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

// --- Main Page ---

const AdminAIMonitorPage = () => {
  usePageTitle('AI Monitor');
  const { logAdminActivity } = useAdminAuth();
  const { toast } = useToast();

  // Report feed state
  const [reports, setReports] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [stats, setStats] = useState(null);
  const [filterType, setFilterType] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [showArchived, setShowArchived] = useState(false);
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 10;

  // Test trigger state
  const [triggeringId, setTriggeringId] = useState(null);
  const [triggerResults, setTriggerResults] = useState({});

  // Build where clause for filters
  const buildWhere = useCallback(() => {
    const conditions = {};
    if (filterType !== 'all') conditions.report_type = { _eq: filterType };
    if (filterPriority !== 'all') conditions.priority = { _eq: filterPriority };
    if (!showArchived) conditions.archived = { _eq: false };
    return Object.keys(conditions).length > 0 ? conditions : {};
  }, [filterType, filterPriority, showArchived]);

  // Fetch reports
  const fetchReports = useCallback(async (offset = 0, append = false) => {
    if (!append) setLoading(true);
    else setLoadingMore(true);

    try {
      const { data } = await apolloClient.query({
        query: GET_MONITOR_REPORTS,
        variables: {
          limit: PAGE_SIZE,
          offset,
          where: buildWhere(),
        },
        fetchPolicy: 'network-only',
      });

      const fetched = data.monitor_reports || [];
      const total = data.monitor_reports_aggregate?.aggregate?.count || 0;

      if (append) {
        setReports((prev) => [...prev, ...fetched]);
      } else {
        setReports(fetched);
      }
      setTotalCount(total);
    } catch (err) {
      toast({ title: 'Failed to load reports', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [buildWhere, toast]);

  // Fetch stats
  const fetchStats = useCallback(async () => {
    try {
      const { data } = await apolloClient.query({
        query: GET_MONITOR_STATS,
        fetchPolicy: 'network-only',
      });
      setStats({
        total: data.total?.aggregate?.count || 0,
        p1: data.p1?.aggregate?.count || 0,
        p2: data.p2?.aggregate?.count || 0,
        delivered: data.delivered?.aggregate?.count || 0,
        failed: data.failed?.aggregate?.count || 0,
        lastReport: data.latest?.[0]?.created_at,
        recentCritical: data.recent_critical || [],
      });
    } catch (err) {
      console.error('Stats fetch error:', err);
    }
  }, []);

  // Initial load + refresh on filter change
  useEffect(() => {
    setPage(0);
    fetchReports(0);
    fetchStats();
  }, [fetchReports, fetchStats]);

  // Load more
  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchReports(nextPage * PAGE_SIZE, true);
  };

  // Refresh
  const handleRefresh = () => {
    setPage(0);
    fetchReports(0);
    fetchStats();
  };

  // Delete report
  const handleDeleteReport = useCallback(async (id) => {
    try {
      await apolloClient.mutate({ mutation: DELETE_MONITOR_REPORT, variables: { id } });
      setReports((prev) => prev.filter((r) => r.id !== id));
      setTotalCount((c) => c - 1);
      toast({ title: 'Report deleted' });
      logAdminActivity?.('ai_monitor_delete', 'monitor_report', id);
    } catch (err) {
      toast({ title: 'Delete failed', description: err.message, variant: 'destructive' });
    }
  }, [toast, logAdminActivity]);

  // Archive/unarchive report
  const handleArchiveReport = useCallback(async (id, archived) => {
    try {
      await apolloClient.mutate({ mutation: ARCHIVE_MONITOR_REPORT, variables: { id, archived } });
      if (!showArchived && archived) {
        setReports((prev) => prev.filter((r) => r.id !== id));
        setTotalCount((c) => c - 1);
      } else {
        setReports((prev) => prev.map((r) => r.id === id ? { ...r, archived } : r));
      }
      toast({ title: archived ? 'Report archived' : 'Report unarchived' });
    } catch (err) {
      toast({ title: 'Archive failed', description: err.message, variant: 'destructive' });
    }
  }, [toast, showArchived]);

  // Test trigger handler
  const handleTrigger = useCallback(async (monitorId, monitorName) => {
    setTriggeringId(monitorId);
    setTriggerResults((prev) => ({ ...prev, [monitorId]: { status: 'running' } }));

    try {
      const functions = getFunctions();
      const triggerFn = httpsCallable(functions, 'adminNotify');
      await triggerFn({
        type: 'custom',
        payload: {
          title: `Manual Test: ${monitorName}`,
          message: `The ${monitorName} monitor was manually triggered from the Admin AI Monitor page.`,
        },
      });

      setTriggerResults((prev) => ({
        ...prev,
        [monitorId]: { status: 'success', timestamp: new Date().toISOString() },
      }));
      toast({ title: 'Test notification sent', description: `${monitorName} test alert sent to Telegram.` });
      logAdminActivity?.('ai_monitor_test', 'monitor', monitorId);
    } catch (error) {
      setTriggerResults((prev) => ({
        ...prev,
        [monitorId]: { status: 'error', error: error.message },
      }));
      toast({ title: 'Test failed', description: error.message, variant: 'destructive' });
    } finally {
      setTriggeringId(null);
    }
  }, [toast, logAdminActivity]);

  const hasMore = reports.length < totalCount;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <BrainCircuit className="h-7 w-7 text-primary" />
            AI Monitor
          </h1>
          <p className="text-muted-foreground mt-1">
            Automated watchdog monitors with AI-powered analysis by Sheger agent.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Badge variant="outline" className="gap-1 px-3 py-1.5">
            <CheckCircle className="h-3.5 w-3.5 text-green-500" />
            7 Monitors Active
          </Badge>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card>
          <CardContent className="pt-4 pb-3 px-4">
            <div className="text-2xl font-bold">{stats?.total ?? '-'}</div>
            <p className="text-xs text-muted-foreground">Total Reports</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 px-4">
            <div className="text-2xl font-bold text-red-600">{stats?.p1 ?? '-'}</div>
            <p className="text-xs text-muted-foreground">P1 Critical</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 px-4">
            <div className="text-2xl font-bold text-orange-600">{stats?.p2 ?? '-'}</div>
            <p className="text-xs text-muted-foreground">P2 Warnings</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 px-4">
            <div className="text-2xl font-bold text-green-600">{stats?.delivered ?? '-'}</div>
            <p className="text-xs text-muted-foreground">Delivered</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 px-4">
            <div className="text-2xl font-bold text-gray-500">{stats?.failed ?? '-'}</div>
            <p className="text-xs text-muted-foreground">Failed</p>
          </CardContent>
        </Card>
      </div>

      {/* Critical Alert Notifications */}
      <CriticalAlertBanner criticalReports={stats?.recentCritical} />

      {/* Tabs: Report Feed, Monitors, Customer Feedback, Crash Analytics */}
      <Tabs defaultValue="feed" className="space-y-4">
        <TabsList className="flex flex-wrap h-auto gap-1 w-full md:w-auto">
          <TabsTrigger value="feed" className="gap-1.5">
            <FileText className="h-4 w-4" />
            Report Feed
          </TabsTrigger>
          <TabsTrigger value="monitors" className="gap-1.5">
            <BrainCircuit className="h-4 w-4" />
            Monitors
          </TabsTrigger>
          <TabsTrigger value="feedback" className="gap-1.5">
            <MessageSquare className="h-4 w-4" />
            Customer Feedback
          </TabsTrigger>
          <TabsTrigger value="crashes" className="gap-1.5">
            <Bug className="h-4 w-4" />
            Crash Analytics
          </TabsTrigger>
        </TabsList>

        {/* Report Feed Tab */}
        <TabsContent value="feed" className="space-y-4">
          {/* Filters */}
          <div className="flex items-center gap-3 flex-wrap">
            <Select value={filterType} onValueChange={(val) => { setFilterType(val); setPage(0); }}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="daily-briefing">Daily Briefing</SelectItem>
                <SelectItem value="site-health">Site Health</SelectItem>
                <SelectItem value="stale-registrations">Stale Registrations</SelectItem>
                <SelectItem value="revenue">Revenue</SelectItem>
                <SelectItem value="security">Security</SelectItem>
                <SelectItem value="customer-feedback">Customer Feedback</SelectItem>
                <SelectItem value="crash-analytics">Crash Analytics</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterPriority} onValueChange={(val) => { setFilterPriority(val); setPage(0); }}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="All Priorities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="P1">P1 Critical</SelectItem>
                <SelectItem value="P2">P2 Warning</SelectItem>
                <SelectItem value="P3">P3 Normal</SelectItem>
                <SelectItem value="P4">P4 Info</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant={showArchived ? 'default' : 'outline'}
              size="sm"
              className="gap-1.5"
              onClick={() => { setShowArchived(!showArchived); setPage(0); }}
            >
              {showArchived ? <EyeOff className="h-3.5 w-3.5" /> : <Archive className="h-3.5 w-3.5" />}
              {showArchived ? 'Hide Archived' : 'Show Archived'}
            </Button>

            <span className="text-sm text-muted-foreground">
              {totalCount} report{totalCount !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Report List */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              <span className="ml-2 text-muted-foreground">Loading reports...</span>
            </div>
          ) : reports.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <BrainCircuit className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
                <p className="text-muted-foreground font-medium">No reports yet</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Reports will appear here as the automated monitors run on schedule.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {reports.map((report, idx) => (
                <ReportCard key={report.id} report={report} defaultExpanded={idx === 0} onDelete={handleDeleteReport} onArchive={handleArchiveReport} />
              ))}

              {hasMore && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                >
                  {loadingMore ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    `Load More (${reports.length} of ${totalCount})`
                  )}
                </Button>
              )}
            </div>
          )}
        </TabsContent>

        {/* Monitors Tab */}
        <TabsContent value="monitors" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {MONITORS.map((monitor) => {
              const Icon = monitor.icon;
              const result = triggerResults[monitor.id];

              return (
                <Card key={monitor.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${monitor.bgColor}`}>
                          <Icon className={`h-5 w-5 ${monitor.color}`} />
                        </div>
                        <div>
                          <CardTitle className="text-base">{monitor.name}</CardTitle>
                          <CardDescription className="flex items-center gap-1 mt-0.5">
                            <Clock className="h-3 w-3" />
                            {monitor.schedule}
                          </CardDescription>
                        </div>
                      </div>
                      {result?.status === 'success' ? (
                        <Badge className="bg-green-100 text-green-700">Sent</Badge>
                      ) : result?.status === 'error' ? (
                        <Badge variant="destructive">Failed</Badge>
                      ) : result?.status === 'running' ? (
                        <Badge className="bg-blue-100 text-blue-700">Running...</Badge>
                      ) : (
                        <Badge variant="outline">Idle</Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-sm text-muted-foreground mb-4">{monitor.description}</p>

                    {result?.status === 'error' && (
                      <div className="flex items-center gap-2 text-sm text-red-600 mb-3 p-2 bg-red-50 rounded">
                        <AlertTriangle className="h-4 w-4 shrink-0" />
                        <span className="truncate">{result.error}</span>
                      </div>
                    )}

                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      disabled={triggeringId !== null}
                      onClick={() => handleTrigger(monitor.id, monitor.name)}
                    >
                      {triggeringId === monitor.id ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Sending test...
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4 mr-2" />
                          Send Test Alert
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* How it works */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">How It Works</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                <div className="flex items-start gap-3">
                  <div className="p-1.5 rounded bg-blue-50">
                    <Clock className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium">Cron Schedule</p>
                    <p className="text-muted-foreground">VPS cron triggers each monitor on its configured interval.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="p-1.5 rounded bg-purple-50">
                    <Activity className="h-4 w-4 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-medium">Hasura Query</p>
                    <p className="text-muted-foreground">Each monitor queries the GraphQL API for live platform data.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="p-1.5 rounded bg-green-50">
                    <Bot className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium">Agent Analysis</p>
                    <p className="text-muted-foreground">Sheger AI agent analyzes the report and assigns a priority.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="p-1.5 rounded bg-orange-50">
                    <Send className="h-4 w-4 text-orange-600" />
                  </div>
                  <div>
                    <p className="font-medium">Dashboard + Telegram</p>
                    <p className="text-muted-foreground">Reports are saved here and sent to Telegram for notifications.</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Customer Feedback Tab */}
        <TabsContent value="feedback">
          <CustomerFeedbackTab />
        </TabsContent>

        {/* Crash Analytics Tab */}
        <TabsContent value="crashes">
          <CrashAnalyticsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminAIMonitorPage;
