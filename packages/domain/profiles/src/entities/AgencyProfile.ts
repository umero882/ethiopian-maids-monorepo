/**
 * AgencyProfile Entity - Aggregate Root
 *
 * Represents an agency's profile that manages maid placements.
 * Enforces business rules around agency verification, licensing, and operations.
 */

import { ProfileStatus } from '../value-objects/ProfileStatus.js';
import type { DomainEvent } from './MaidProfile.js';

export interface AgencyProfileProps {
  id: string;
  userId: string;
  fullName?: string | null;
  licenseNumber?: string | null;
  licenseExpiry?: Date | string | null;
  registrationNumber?: string | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  country?: string;
  city?: string | null;
  address?: string | null;
  yearEstablished?: number | null;
  servicesOffered?: string[];
  operatingCountries?: string[];
  specializations?: string[];
  businessLicense?: string | null;
  taxCertificate?: string | null;
  insuranceCertificate?: string | null;
  totalPlacements?: number;
  activeMaids?: number;
  rating?: number;
  totalReviews?: number;
  status?: string | ProfileStatus;
  completionPercentage?: number;
  isVerified?: boolean;
  verifiedAt?: Date | string | null;
  isLicenseValid?: boolean;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export interface AgencyBasicInfoUpdate {
  fullName?: string;
  phone?: string;
  email?: string;
  website?: string;
  country?: string;
  city?: string;
  address?: string;
}

export interface AgencyLicenseInfoUpdate {
  licenseNumber?: string;
  licenseExpiry?: Date | string;
  registrationNumber?: string;
}

export interface AgencyBusinessInfoUpdate {
  yearEstablished?: number;
  servicesOffered?: string[];
  operatingCountries?: string[];
  specializations?: string[];
}

export class AgencyProfile {
  readonly id: string;
  readonly userId: string;
  fullName: string | null;
  licenseNumber: string | null;
  licenseExpiry: Date | null;
  registrationNumber: string | null;

  // Contact info
  phone: string | null;
  email: string | null;
  website: string | null;
  country: string;
  city: string | null;
  address: string | null;

  // Business info
  yearEstablished: number | null;
  servicesOffered: string[];
  operatingCountries: string[];
  specializations: string[];

  // Documents
  businessLicense: string | null;
  taxCertificate: string | null;
  insuranceCertificate: string | null;

  // Statistics
  totalPlacements: number;
  activeMaids: number;
  rating: number;
  totalReviews: number;

  // Status
  status: ProfileStatus;
  completionPercentage: number;
  isVerified: boolean;
  verifiedAt: Date | null;
  isLicenseValid: boolean;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;

  // Domain events
  private _domainEvents: DomainEvent[];

  constructor(props: AgencyProfileProps) {
    this.id = props.id;
    this.userId = props.userId;
    this.fullName = props.fullName || null;
    this.licenseNumber = props.licenseNumber || null;
    this.licenseExpiry = props.licenseExpiry ? new Date(props.licenseExpiry) : null;
    this.registrationNumber = props.registrationNumber || null;

    // Contact info
    this.phone = props.phone || null;
    this.email = props.email || null;
    this.website = props.website || null;
    this.country = props.country || 'ET'; // Ethiopia default
    this.city = props.city || null;
    this.address = props.address || null;

    // Business info
    this.yearEstablished = props.yearEstablished || null;
    this.servicesOffered = props.servicesOffered || [];
    this.operatingCountries = props.operatingCountries || [];
    this.specializations = props.specializations || [];

    // Documents
    this.businessLicense = props.businessLicense || null;
    this.taxCertificate = props.taxCertificate || null;
    this.insuranceCertificate = props.insuranceCertificate || null;

    // Statistics
    this.totalPlacements = props.totalPlacements || 0;
    this.activeMaids = props.activeMaids || 0;
    this.rating = props.rating || 0;
    this.totalReviews = props.totalReviews || 0;

    // Status
    this.status = props.status instanceof ProfileStatus
      ? props.status
      : ProfileStatus.fromString(props.status || 'draft');
    this.completionPercentage = props.completionPercentage || 0;
    this.isVerified = props.isVerified || false;
    this.verifiedAt = props.verifiedAt ? new Date(props.verifiedAt) : null;
    this.isLicenseValid = props.isLicenseValid || false;

    // Timestamps
    this.createdAt = props.createdAt ? new Date(props.createdAt) : new Date();
    this.updatedAt = props.updatedAt ? new Date(props.updatedAt) : new Date();

    // Domain events
    this._domainEvents = [];
  }

  /**
   * Update basic information
   */
  updateBasicInfo({ fullName, phone, email, website, country, city, address }: AgencyBasicInfoUpdate): void {
    if (this.status.isArchived()) {
      throw new Error('Cannot update archived profile');
    }

    if (fullName) this.fullName = fullName;
    if (phone) this.phone = phone;
    if (email) this.email = email;
    if (website) this.website = website;
    if (country) this.country = country;
    if (city) this.city = city;
    if (address) this.address = address;

    this._touch();
    this._recalculateCompletion();

    this._addEvent('AgencyProfileUpdated', {
      profileId: this.id,
      fields: ['fullName', 'phone', 'email', 'website', 'country', 'city', 'address']
    });
  }

  /**
   * Update license information
   */
  updateLicenseInfo({ licenseNumber, licenseExpiry, registrationNumber }: AgencyLicenseInfoUpdate): void {
    if (licenseNumber) this.licenseNumber = licenseNumber;
    if (licenseExpiry) this.licenseExpiry = new Date(licenseExpiry);
    if (registrationNumber) this.registrationNumber = registrationNumber;

    this._validateLicense();
    this._touch();
    this._recalculateCompletion();

    this._addEvent('AgencyLicenseUpdated', {
      profileId: this.id,
      licenseNumber,
      isLicenseValid: this.isLicenseValid
    });
  }

  /**
   * Update business information
   */
  updateBusinessInfo({ yearEstablished, servicesOffered, operatingCountries, specializations }: AgencyBusinessInfoUpdate): void {
    if (yearEstablished) this.yearEstablished = yearEstablished;
    if (servicesOffered) this.servicesOffered = servicesOffered;
    if (operatingCountries) this.operatingCountries = operatingCountries;
    if (specializations) this.specializations = specializations;

    this._touch();

    this._addEvent('AgencyBusinessInfoUpdated', {
      profileId: this.id,
      businessInfo: { yearEstablished, servicesOffered, operatingCountries, specializations }
    });
  }

  /**
   * Upload document
   */
  uploadDocument(type: 'businessLicense' | 'taxCertificate' | 'insuranceCertificate', documentUrl: string): void {
    const validTypes = ['businessLicense', 'taxCertificate', 'insuranceCertificate'];
    if (!validTypes.includes(type)) {
      throw new Error(`Invalid document type: ${type}`);
    }

    this[type] = documentUrl;
    this._touch();
    this._recalculateCompletion();

    this._addEvent('AgencyDocumentUploaded', {
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

    if (!this.isLicenseValid) {
      throw new Error('License must be valid before submission');
    }

    this.status = ProfileStatus.underReview();
    this._touch();

    this._addEvent('AgencyProfileSubmitted', {
      profileId: this.id,
      userId: this.userId
    });
  }

  /**
   * Verify profile (by admin)
   */
  verify(verifiedBy: string): void {
    if (!this.status.isUnderReview()) {
      throw new Error('Only profiles under review can be verified');
    }

    this.status = ProfileStatus.active();
    this.isVerified = true;
    this.verifiedAt = new Date();
    this._touch();

    this._addEvent('AgencyProfileVerified', {
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

    this._addEvent('AgencyProfileRejected', {
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

    this._addEvent('AgencyProfileArchived', {
      profileId: this.id,
      reason
    });
  }

  /**
   * Add a maid to the agency
   */
  addMaid(maidId: string): void {
    this.activeMaids += 1;
    this._touch();

    this._addEvent('MaidAddedToAgency', {
      agencyId: this.id,
      maidId,
      activeMaids: this.activeMaids
    });
  }

  /**
   * Remove a maid from the agency
   */
  removeMaid(maidId: string): void {
    if (this.activeMaids > 0) {
      this.activeMaids -= 1;
    }
    this._touch();

    this._addEvent('MaidRemovedFromAgency', {
      agencyId: this.id,
      maidId,
      activeMaids: this.activeMaids
    });
  }

  /**
   * Record a successful placement
   */
  recordPlacement(): void {
    this.totalPlacements += 1;
    this._touch();

    this._addEvent('AgencyPlacementRecorded', {
      agencyId: this.id,
      totalPlacements: this.totalPlacements
    });
  }

  /**
   * Update rating
   */
  updateRating(newRating: number): void {
    if (newRating < 0 || newRating > 5) {
      throw new Error('Rating must be between 0 and 5');
    }

    // Calculate new average rating
    const totalRatingPoints = this.rating * this.totalReviews;
    this.totalReviews += 1;
    this.rating = (totalRatingPoints + newRating) / this.totalReviews;
    this._touch();

    this._addEvent('AgencyRatingUpdated', {
      agencyId: this.id,
      rating: this.rating,
      totalReviews: this.totalReviews
    });
  }

  /**
   * Check if profile is complete
   */
  isComplete(): boolean {
    return this.completionPercentage >= 100;
  }

  /**
   * Validate license
   */
  private _validateLicense(): void {
    if (!this.licenseNumber || !this.licenseExpiry) {
      this.isLicenseValid = false;
      return;
    }

    const now = new Date();
    const expiryDate = new Date(this.licenseExpiry);
    this.isLicenseValid = expiryDate > now;
  }

  /**
   * Calculate completion percentage
   */
  private _recalculateCompletion(): void {
    const requiredFields = {
      fullName: this.fullName,
      licenseNumber: this.licenseNumber,
      licenseExpiry: this.licenseExpiry,
      registrationNumber: this.registrationNumber,
      phone: this.phone,
      email: this.email,
      country: this.country,
      city: this.city,
      address: this.address,
      businessLicense: this.businessLicense,
      taxCertificate: this.taxCertificate,
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
      licenseNumber: this.licenseNumber,
      licenseExpiry: this.licenseExpiry,
      registrationNumber: this.registrationNumber,
      phone: this.phone,
      email: this.email,
      website: this.website,
      country: this.country,
      city: this.city,
      address: this.address,
      yearEstablished: this.yearEstablished,
      servicesOffered: this.servicesOffered,
      operatingCountries: this.operatingCountries,
      specializations: this.specializations,
      businessLicense: this.businessLicense,
      taxCertificate: this.taxCertificate,
      insuranceCertificate: this.insuranceCertificate,
      totalPlacements: this.totalPlacements,
      activeMaids: this.activeMaids,
      rating: this.rating,
      totalReviews: this.totalReviews,
      status: this.status.toString(),
      completionPercentage: this.completionPercentage,
      isVerified: this.isVerified,
      verifiedAt: this.verifiedAt,
      isLicenseValid: this.isLicenseValid,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
