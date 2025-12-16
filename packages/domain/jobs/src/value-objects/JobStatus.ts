/**
 * JobStatus Value Object
 *
 * Immutable value object representing job posting lifecycle status.
 */

const VALID_STATUSES = ['draft', 'open', 'closed', 'filled', 'cancelled'] as const;

export type JobStatusType = typeof VALID_STATUSES[number];

export class JobStatus {
  private readonly _status: JobStatusType;

  constructor(status: JobStatusType) {
    if (!VALID_STATUSES.includes(status)) {
      throw new Error(`Invalid job status: ${status}`);
    }
    this._status = status;
  }

  /**
   * Factory methods
   */
  static draft(): JobStatus {
    return new JobStatus('draft');
  }

  static open(): JobStatus {
    return new JobStatus('open');
  }

  static closed(): JobStatus {
    return new JobStatus('closed');
  }

  static filled(): JobStatus {
    return new JobStatus('filled');
  }

  static cancelled(): JobStatus {
    return new JobStatus('cancelled');
  }

  /**
   * Create from string
   */
  static fromString(status: string): JobStatus {
    return new JobStatus(status as JobStatusType);
  }

  /**
   * Status checks
   */
  isDraft(): boolean {
    return this._status === 'draft';
  }

  isOpen(): boolean {
    return this._status === 'open';
  }

  isClosed(): boolean {
    return this._status === 'closed';
  }

  isFilled(): boolean {
    return this._status === 'filled';
  }

  isCancelled(): boolean {
    return this._status === 'cancelled';
  }

  /**
   * Check if job can be edited
   */
  canEdit(): boolean {
    return this._status === 'draft';
  }

  /**
   * Check if job is accepting applications
   */
  isAcceptingApplications(): boolean {
    return this._status === 'open';
  }

  /**
   * Check if job is active (visible to applicants)
   */
  isActive(): boolean {
    return this._status === 'open';
  }

  /**
   * Get display label
   */
  getLabel(): string {
    const labels: Record<JobStatusType, string> = {
      draft: 'Draft',
      open: 'Open',
      closed: 'Closed',
      filled: 'Filled',
      cancelled: 'Cancelled',
    };
    return labels[this._status];
  }

  /**
   * Convert to string
   */
  toString(): string {
    return this._status;
  }

  /**
   * Value equality
   */
  equals(other: JobStatus): boolean {
    if (!(other instanceof JobStatus)) return false;
    return this._status === other._status;
  }
}
