/**
 * ProfileStatus Value Object
 *
 * Immutable value object representing profile lifecycle status.
 */

export type ProfileStatusType = 'draft' | 'under_review' | 'active' | 'rejected' | 'archived';

const VALID_STATUSES: readonly ProfileStatusType[] = ['draft', 'under_review', 'active', 'rejected', 'archived'] as const;

export class ProfileStatus {
  private readonly _status: ProfileStatusType;

  constructor(status: ProfileStatusType) {
    if (!VALID_STATUSES.includes(status)) {
      throw new Error(`Invalid profile status: ${status}`);
    }
    this._status = status;
  }

  /**
   * Factory methods
   */
  static draft(): ProfileStatus {
    return new ProfileStatus('draft');
  }

  static underReview(): ProfileStatus {
    return new ProfileStatus('under_review');
  }

  static active(): ProfileStatus {
    return new ProfileStatus('active');
  }

  static rejected(): ProfileStatus {
    return new ProfileStatus('rejected');
  }

  static archived(): ProfileStatus {
    return new ProfileStatus('archived');
  }

  /**
   * Create from string
   */
  static fromString(status: string): ProfileStatus {
    return new ProfileStatus(status as ProfileStatusType);
  }

  /**
   * Status checks
   */
  isDraft(): boolean {
    return this._status === 'draft';
  }

  isUnderReview(): boolean {
    return this._status === 'under_review';
  }

  isActive(): boolean {
    return this._status === 'active';
  }

  isRejected(): boolean {
    return this._status === 'rejected';
  }

  isArchived(): boolean {
    return this._status === 'archived';
  }

  /**
   * Check if profile can be edited
   */
  canEdit(): boolean {
    return this._status === 'draft' || this._status === 'rejected';
  }

  /**
   * Check if profile is visible to public
   */
  isPublic(): boolean {
    return this._status === 'active';
  }

  /**
   * Get display label
   */
  getLabel(): string {
    const labels: Record<ProfileStatusType, string> = {
      draft: 'Draft',
      under_review: 'Under Review',
      active: 'Active',
      rejected: 'Rejected',
      archived: 'Archived',
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
  equals(other: ProfileStatus): boolean {
    if (!(other instanceof ProfileStatus)) return false;
    return this._status === other._status;
  }
}
