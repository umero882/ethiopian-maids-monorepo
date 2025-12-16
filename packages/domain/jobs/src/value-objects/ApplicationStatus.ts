/**
 * ApplicationStatus Value Object
 *
 * Immutable value object representing job application lifecycle status.
 */

const VALID_STATUSES = [
  'pending',
  'reviewed',
  'interviewing',
  'accepted',
  'rejected',
  'withdrawn',
] as const;

export type ApplicationStatusType = typeof VALID_STATUSES[number];

export class ApplicationStatus {
  private readonly _status: ApplicationStatusType;

  constructor(status: ApplicationStatusType) {
    if (!VALID_STATUSES.includes(status)) {
      throw new Error(`Invalid application status: ${status}`);
    }
    this._status = status;
  }

  /**
   * Factory methods
   */
  static pending(): ApplicationStatus {
    return new ApplicationStatus('pending');
  }

  static reviewed(): ApplicationStatus {
    return new ApplicationStatus('reviewed');
  }

  static interviewing(): ApplicationStatus {
    return new ApplicationStatus('interviewing');
  }

  static accepted(): ApplicationStatus {
    return new ApplicationStatus('accepted');
  }

  static rejected(): ApplicationStatus {
    return new ApplicationStatus('rejected');
  }

  static withdrawn(): ApplicationStatus {
    return new ApplicationStatus('withdrawn');
  }

  /**
   * Create from string
   */
  static fromString(status: string): ApplicationStatus {
    return new ApplicationStatus(status as ApplicationStatusType);
  }

  /**
   * Status checks
   */
  isPending(): boolean {
    return this._status === 'pending';
  }

  isReviewed(): boolean {
    return this._status === 'reviewed';
  }

  isInterviewing(): boolean {
    return this._status === 'interviewing';
  }

  isAccepted(): boolean {
    return this._status === 'accepted';
  }

  isRejected(): boolean {
    return this._status === 'rejected';
  }

  isWithdrawn(): boolean {
    return this._status === 'withdrawn';
  }

  /**
   * Check if application is final (no more changes)
   */
  isFinal(): boolean {
    return this._status === 'accepted' ||
           this._status === 'rejected' ||
           this._status === 'withdrawn';
  }

  /**
   * Check if application is active
   */
  isActive(): boolean {
    return !this.isFinal();
  }

  /**
   * Get display label
   */
  getLabel(): string {
    const labels: Record<ApplicationStatusType, string> = {
      pending: 'Pending',
      reviewed: 'Reviewed',
      interviewing: 'Interviewing',
      accepted: 'Accepted',
      rejected: 'Rejected',
      withdrawn: 'Withdrawn',
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
  equals(other: ApplicationStatus): boolean {
    if (!(other instanceof ApplicationStatus)) return false;
    return this._status === other._status;
  }
}
