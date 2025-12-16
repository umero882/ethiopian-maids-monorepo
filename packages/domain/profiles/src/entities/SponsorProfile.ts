/**
 * SponsorProfile Entity - Aggregate Root
 *
 * Represents a sponsor's profile who is looking to hire a maid.
 * Enforces business rules around verification and requirements.
 */

import { ProfileStatus } from '../value-objects/ProfileStatus.js';
import type { DomainEvent } from './MaidProfile.js';

export interface SponsorProfileProps {
  id: string;
  userId: string;
  fullName?: string | null;
  phone?: string | null;
  country?: string | null;
  city?: string | null;
  address?: string | null;
  householdSize?: number | null;
  hasChildren?: boolean;
  childrenAges?: number[];
  hasPets?: boolean;
  preferredLanguages?: string[];
  preferredSkills?: string[];
  religiousPreference?: string | null;
  idDocument?: string | null;
  proofOfResidence?: string | null;
  status?: string | ProfileStatus;
  completionPercentage?: number;
  isVerified?: boolean;
  verifiedAt?: Date | string | null;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export interface SponsorBasicInfoUpdate {
  fullName?: string;
  phone?: string;
  country?: string;
  city?: string;
  address?: string;
}

export interface SponsorHouseholdInfoUpdate {
  householdSize?: number;
  hasChildren?: boolean;
  childrenAges?: number[];
  hasPets?: boolean;
}

export interface SponsorPreferencesUpdate {
  preferredLanguages?: string[];
  preferredSkills?: string[];
  religiousPreference?: string | null;
}

export class SponsorProfile {
  readonly id: string;
  readonly userId: string;
  fullName: string | null;
  phone: string | null;
  country: string | null;
  city: string | null;
  address: string | null;

  // Household info
  householdSize: number | null;
  hasChildren: boolean;
  childrenAges: number[];
  hasPets: boolean;

  // Preferences
  preferredLanguages: string[];
  preferredSkills: string[];
  religiousPreference: string | null;

  // Verification
  idDocument: string | null;
  proofOfResidence: string | null;

  // Status
  status: ProfileStatus;
  completionPercentage: number;
  isVerified: boolean;
  verifiedAt: Date | null;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;

  // Domain events
  private _domainEvents: DomainEvent[];

  constructor(props: SponsorProfileProps) {
    this.id = props.id;
    this.userId = props.userId;
    this.fullName = props.fullName || null;
    this.phone = props.phone || null;
    this.country = props.country || null;
    this.city = props.city || null;
    this.address = props.address || null;

    // Household info
    this.householdSize = props.householdSize || null;
    this.hasChildren = props.hasChildren || false;
    this.childrenAges = props.childrenAges || [];
    this.hasPets = props.hasPets || false;

    // Preferences
    this.preferredLanguages = props.preferredLanguages || [];
    this.preferredSkills = props.preferredSkills || [];
    this.religiousPreference = props.religiousPreference || null;

    // Verification
    this.idDocument = props.idDocument || null;
    this.proofOfResidence = props.proofOfResidence || null;

    // Status
    this.status = props.status instanceof ProfileStatus
      ? props.status
      : ProfileStatus.fromString(props.status || 'draft');
    this.completionPercentage = props.completionPercentage || 0;
    this.isVerified = props.isVerified || false;
    this.verifiedAt = props.verifiedAt ? new Date(props.verifiedAt) : null;

    // Timestamps
    this.createdAt = props.createdAt ? new Date(props.createdAt) : new Date();
    this.updatedAt = props.updatedAt ? new Date(props.updatedAt) : new Date();

    // Domain events
    this._domainEvents = [];
  }

  /**
   * Update basic information
   */
  updateBasicInfo({ fullName, phone, country, city, address }: SponsorBasicInfoUpdate): void {
    if (this.status.isArchived()) {
      throw new Error('Cannot update archived profile');
    }

    if (fullName) this.fullName = fullName;
    if (phone) this.phone = phone;
    if (country) this.country = country;
    if (city) this.city = city;
    if (address) this.address = address;

    this._touch();
    this._recalculateCompletion();

    this._addEvent('SponsorProfileUpdated', {
      profileId: this.id,
      fields: ['fullName', 'phone', 'country', 'city', 'address']
    });
  }

  /**
   * Update household information
   */
  updateHouseholdInfo({ householdSize, hasChildren, childrenAges, hasPets }: SponsorHouseholdInfoUpdate): void {
    if (householdSize !== undefined) this.householdSize = householdSize;
    if (hasChildren !== undefined) this.hasChildren = hasChildren;
    if (childrenAges !== undefined) this.childrenAges = childrenAges;
    if (hasPets !== undefined) this.hasPets = hasPets;

    this._touch();
    this._recalculateCompletion();

    this._addEvent('SponsorHouseholdInfoUpdated', {
      profileId: this.id,
      householdSize,
      hasChildren,
      hasPets
    });
  }

  /**
   * Update preferences
   */
  updatePreferences({ preferredLanguages, preferredSkills, religiousPreference }: SponsorPreferencesUpdate): void {
    if (preferredLanguages) this.preferredLanguages = preferredLanguages;
    if (preferredSkills) this.preferredSkills = preferredSkills;
    if (religiousPreference !== undefined) this.religiousPreference = religiousPreference;

    this._touch();

    this._addEvent('SponsorPreferencesUpdated', {
      profileId: this.id,
      preferences: { preferredLanguages, preferredSkills, religiousPreference }
    });
  }

  /**
   * Upload verification document
   */
  uploadDocument(type: 'idDocument' | 'proofOfResidence', documentUrl: string): void {
    const validTypes = ['idDocument', 'proofOfResidence'];
    if (!validTypes.includes(type)) {
      throw new Error(`Invalid document type: ${type}`);
    }

    this[type] = documentUrl;
    this._touch();
    this._recalculateCompletion();

    this._addEvent('SponsorDocumentUploaded', {
      profileId: this.id,
      documentType: type,
      documentUrl
    });
  }

  /**
   * Submit profile for verification
   */
  submitForVerification(): void {
    if (!this.isComplete()) {
      throw new Error('Profile must be complete before submission');
    }

    if (!this.status.isDraft()) {
      throw new Error('Only draft profiles can be submitted for verification');
    }

    this.status = ProfileStatus.underReview();
    this._touch();

    this._addEvent('SponsorProfileSubmitted', {
      profileId: this.id,
      userId: this.userId
    });
  }

  /**
   * Verify profile
   */
  verify(verifiedBy: string): void {
    if (!this.status.isUnderReview()) {
      throw new Error('Only profiles under review can be verified');
    }

    this.status = ProfileStatus.active();
    this.isVerified = true;
    this.verifiedAt = new Date();
    this._touch();

    this._addEvent('SponsorProfileVerified', {
      profileId: this.id,
      userId: this.userId,
      verifiedBy
    });
  }

  /**
   * Reject verification
   */
  reject(reason: string, rejectedBy: string): void {
    if (!this.status.isUnderReview()) {
      throw new Error('Only profiles under review can be rejected');
    }

    this.status = ProfileStatus.rejected();
    this._touch();

    this._addEvent('SponsorProfileRejected', {
      profileId: this.id,
      userId: this.userId,
      reason,
      rejectedBy
    });
  }

  /**
   * Archive profile
   */
  archive(reason: string): void {
    if (this.status.isArchived()) {
      throw new Error('Profile already archived');
    }

    this.status = ProfileStatus.archived();
    this._touch();

    this._addEvent('SponsorProfileArchived', {
      profileId: this.id,
      reason
    });
  }

  /**
   * Check if profile is complete
   */
  isComplete(): boolean {
    return this.completionPercentage >= 100;
  }

  /**
   * Calculate completion percentage
   */
  private _recalculateCompletion(): void {
    const requiredFields = {
      fullName: this.fullName,
      phone: this.phone,
      country: this.country,
      city: this.city,
      address: this.address,
      householdSize: this.householdSize,
      idDocument: this.idDocument,
      proofOfResidence: this.proofOfResidence,
    };

    const completed = Object.values(requiredFields).filter(Boolean).length;
    const total = Object.keys(requiredFields).length;

    this.completionPercentage = Math.round((completed / total) * 100);
  }

  /**
   * Update timestamp
   */
  private _touch(): void {
    this.updatedAt = new Date();
  }

  /**
   * Add domain event
   */
  private _addEvent(type: string, payload: Record<string, any>): void {
    this._domainEvents.push({
      type,
      payload,
      occurredAt: new Date(),
      aggregateId: this.id,
    });
  }

  /**
   * Pull domain events
   */
  pullDomainEvents(): DomainEvent[] {
    const events = [...this._domainEvents];
    this._domainEvents = [];
    return events;
  }

  /**
   * Serialize to plain object
   */
  toJSON(): Record<string, any> {
    return {
      id: this.id,
      userId: this.userId,
      fullName: this.fullName,
      phone: this.phone,
      country: this.country,
      city: this.city,
      address: this.address,
      householdSize: this.householdSize,
      hasChildren: this.hasChildren,
      childrenAges: this.childrenAges,
      hasPets: this.hasPets,
      preferredLanguages: this.preferredLanguages,
      preferredSkills: this.preferredSkills,
      religiousPreference: this.religiousPreference,
      idDocument: this.idDocument,
      proofOfResidence: this.proofOfResidence,
      status: this.status.toString(),
      completionPercentage: this.completionPercentage,
      isVerified: this.isVerified,
      verifiedAt: this.verifiedAt,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
