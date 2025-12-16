-- Ethiopian Maids Database Schema
-- Exported from Hasura Cloud
-- Source: supabase-postgres

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Table: activity_announcements
CREATE TABLE IF NOT EXISTS public."activity_announcements" (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "activity_type" varchar(50) NOT NULL DEFAULT NULL,
    "title" text NOT NULL DEFAULT NULL,
    "description" text DEFAULT NULL,
    "user_id" uuid DEFAULT NULL,
    "agency_id" uuid DEFAULT NULL,
    "metadata" jsonb DEFAULT '{}'::jsonb,
    "is_public" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT now()
);
ALTER TABLE public."activity_announcements" ADD PRIMARY KEY ("id");

-- Table: activity_log
CREATE TABLE IF NOT EXISTS public."activity_log" (
    "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
    "user_id" uuid NOT NULL DEFAULT NULL,
    "action" text NOT NULL DEFAULT NULL,
    "description" text DEFAULT NULL,
    "metadata" jsonb DEFAULT NULL,
    "ip_address" inet DEFAULT NULL,
    "user_agent" text DEFAULT NULL,
    "created_at" timestamp with time zone DEFAULT now(),
    "action_type" text NOT NULL DEFAULT 'other'::text,
    "entity_type" text DEFAULT NULL,
    "entity_id" uuid DEFAULT NULL,
    "details" jsonb DEFAULT '{}'::jsonb
);
ALTER TABLE public."activity_log" ADD PRIMARY KEY ("id");

-- Table: admin_activity_logs
CREATE TABLE IF NOT EXISTS public."admin_activity_logs" (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "admin_id" uuid NOT NULL DEFAULT NULL,
    "action" text NOT NULL DEFAULT NULL,
    "resource_type" text NOT NULL DEFAULT NULL,
    "resource_id" text DEFAULT NULL,
    "details" jsonb DEFAULT '{}'::jsonb,
    "ip_address" inet DEFAULT NULL,
    "user_agent" text DEFAULT NULL,
    "created_at" timestamp with time zone DEFAULT now()
);
ALTER TABLE public."admin_activity_logs" ADD PRIMARY KEY ("id");

-- Table: admin_users
CREATE TABLE IF NOT EXISTS public."admin_users" (
    "id" uuid NOT NULL DEFAULT NULL,
    "email" text NOT NULL DEFAULT NULL,
    "full_name" text NOT NULL DEFAULT NULL,
    "role" admin_role_enum NOT NULL DEFAULT 'moderator'::admin_role_enum,
    "permissions" jsonb DEFAULT '{}'::jsonb,
    "department" text DEFAULT NULL,
    "is_active" boolean DEFAULT true,
    "last_login_at" timestamp with time zone DEFAULT NULL,
    "created_by" uuid DEFAULT NULL,
    "created_at" timestamp with time zone DEFAULT now(),
    "updated_at" timestamp with time zone DEFAULT now(),
    "phone" varchar(50) DEFAULT NULL,
    "avatar_url" text DEFAULT NULL,
    "preferences" jsonb DEFAULT '{}'::jsonb,
    "notification_settings" jsonb DEFAULT '{}'::jsonb
);
ALTER TABLE public."admin_users" ADD PRIMARY KEY ("id");

-- Table: agency_audit_logs
CREATE TABLE IF NOT EXISTS public."agency_audit_logs" (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "agency_id" uuid NOT NULL DEFAULT NULL,
    "user_id" text NOT NULL DEFAULT NULL,
    "action" text NOT NULL DEFAULT NULL,
    "entity_type" text NOT NULL DEFAULT NULL,
    "entity_id" text DEFAULT NULL,
    "details" jsonb DEFAULT '{}'::jsonb,
    "ip_address" text DEFAULT NULL,
    "user_agent" text DEFAULT NULL,
    "created_at" timestamp with time zone NOT NULL DEFAULT now()
);
ALTER TABLE public."agency_audit_logs" ADD PRIMARY KEY ("id");

-- Table: agency_credits
CREATE TABLE IF NOT EXISTS public."agency_credits" (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "agency_id" uuid NOT NULL DEFAULT NULL,
    "total_credits" numeric NOT NULL DEFAULT 0.00,
    "available_credits" numeric NOT NULL DEFAULT 0.00,
    "reserved_credits" numeric NOT NULL DEFAULT 0.00,
    "credit_transactions" jsonb DEFAULT '[]'::jsonb,
    "auto_apply_credits" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT now(),
    "updated_at" timestamp with time zone DEFAULT now(),
    "last_credit_earned_at" timestamp with time zone DEFAULT NULL,
    "last_credit_used_at" timestamp with time zone DEFAULT NULL
);
ALTER TABLE public."agency_credits" ADD PRIMARY KEY ("id");

-- Table: agency_disputes
CREATE TABLE IF NOT EXISTS public."agency_disputes" (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "agency_id" uuid NOT NULL DEFAULT NULL,
    "related_user_id" uuid DEFAULT NULL,
    "dispute_type" varchar(100) NOT NULL DEFAULT NULL,
    "title" varchar(255) NOT NULL DEFAULT NULL,
    "description" text NOT NULL DEFAULT NULL,
    "status" varchar(50) DEFAULT 'open'::character varying,
    "priority" varchar(50) DEFAULT 'medium'::character varying,
    "resolution_notes" text DEFAULT NULL,
    "resolved_at" timestamp with time zone DEFAULT NULL,
    "created_at" timestamp with time zone DEFAULT now(),
    "updated_at" timestamp with time zone DEFAULT now()
);
ALTER TABLE public."agency_disputes" ADD PRIMARY KEY ("id");

-- Table: agency_document_requirements
CREATE TABLE IF NOT EXISTS public."agency_document_requirements" (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "agency_id" uuid NOT NULL DEFAULT NULL,
    "maid_id" uuid DEFAULT NULL,
    "document_type" varchar(100) NOT NULL DEFAULT NULL,
    "document_name" varchar(255) NOT NULL DEFAULT NULL,
    "description" text DEFAULT NULL,
    "due_date" timestamp with time zone DEFAULT NULL,
    "status" varchar(50) DEFAULT 'pending'::character varying,
    "submitted_at" timestamp with time zone DEFAULT NULL,
    "reviewed_at" timestamp with time zone DEFAULT NULL,
    "created_at" timestamp with time zone DEFAULT now(),
    "updated_at" timestamp with time zone DEFAULT now()
);
ALTER TABLE public."agency_document_requirements" ADD PRIMARY KEY ("id");

-- Table: agency_documents
CREATE TABLE IF NOT EXISTS public."agency_documents" (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "agency_id" uuid NOT NULL DEFAULT NULL,
    "title" varchar(255) NOT NULL DEFAULT NULL,
    "description" text DEFAULT NULL,
    "document_type" varchar(100) NOT NULL DEFAULT NULL,
    "owner_type" varchar(50) NOT NULL DEFAULT NULL,
    "owner_name" varchar(255) NOT NULL DEFAULT NULL,
    "owner_id" uuid DEFAULT NULL,
    "file_path" text DEFAULT NULL,
    "file_url" text DEFAULT NULL,
    "file_name" varchar(255) DEFAULT NULL,
    "file_size" bigint DEFAULT NULL,
    "mime_type" varchar(100) DEFAULT NULL,
    "status" varchar(50) DEFAULT 'pending_review'::character varying,
    "verification_status" varchar(50) DEFAULT 'pending'::character varying,
    "uploaded_at" timestamp with time zone DEFAULT now(),
    "verified_at" timestamp with time zone DEFAULT NULL,
    "expires_at" timestamp with time zone DEFAULT NULL,
    "verified_by_id" uuid DEFAULT NULL,
    "verified_by_name" varchar(255) DEFAULT NULL,
    "notes" text DEFAULT NULL,
    "rejection_reason" text DEFAULT NULL,
    "created_at" timestamp with time zone DEFAULT now(),
    "updated_at" timestamp with time zone DEFAULT now()
);
ALTER TABLE public."agency_documents" ADD PRIMARY KEY ("id");

-- Table: agency_earnings
CREATE TABLE IF NOT EXISTS public."agency_earnings" (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "agency_id" uuid NOT NULL DEFAULT NULL,
    "source_type" varchar(50) NOT NULL DEFAULT NULL,
    "source_id" uuid DEFAULT NULL,
    "source_description" text DEFAULT NULL,
    "amount" numeric NOT NULL DEFAULT NULL,
    "currency" varchar(3) DEFAULT 'AED'::character varying,
    "status" varchar(50) NOT NULL DEFAULT 'pending'::character varying,
    "payout_id" uuid DEFAULT NULL,
    "available_at" timestamp with time zone DEFAULT NULL,
    "paid_out_at" timestamp with time zone DEFAULT NULL,
    "maid_id" uuid DEFAULT NULL,
    "sponsor_id" uuid DEFAULT NULL,
    "notes" text DEFAULT NULL,
    "metadata" jsonb DEFAULT '{}'::jsonb,
    "created_at" timestamp with time zone DEFAULT now(),
    "updated_at" timestamp with time zone DEFAULT now()
);
ALTER TABLE public."agency_earnings" ADD PRIMARY KEY ("id");

-- Table: agency_interviews
CREATE TABLE IF NOT EXISTS public."agency_interviews" (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "agency_id" uuid NOT NULL DEFAULT NULL,
    "maid_id" uuid DEFAULT NULL,
    "sponsor_id" uuid DEFAULT NULL,
    "job_id" uuid DEFAULT NULL,
    "scheduled_date" timestamp with time zone NOT NULL DEFAULT NULL,
    "duration_minutes" integer DEFAULT 60,
    "location" varchar(255) DEFAULT NULL,
    "meeting_link" varchar(500) DEFAULT NULL,
    "status" varchar(50) DEFAULT 'scheduled'::character varying,
    "notes" text DEFAULT NULL,
    "created_at" timestamp with time zone DEFAULT now(),
    "updated_at" timestamp with time zone DEFAULT now()
);
ALTER TABLE public."agency_interviews" ADD PRIMARY KEY ("id");

-- Table: agency_jobs
CREATE TABLE IF NOT EXISTS public."agency_jobs" (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "agency_id" text NOT NULL DEFAULT NULL,
    "title" varchar(255) NOT NULL DEFAULT NULL,
    "description" text DEFAULT NULL,
    "location" varchar(255) DEFAULT NULL,
    "salary_min" numeric DEFAULT NULL,
    "salary_max" numeric DEFAULT NULL,
    "requirements" text DEFAULT NULL,
    "benefits" text DEFAULT NULL,
    "status" varchar(50) DEFAULT 'active'::character varying,
    "created_at" timestamp with time zone DEFAULT now(),
    "updated_at" timestamp with time zone DEFAULT now(),
    "expires_at" timestamp with time zone DEFAULT NULL,
    "priority" varchar(20) DEFAULT 'normal'::character varying,
    "currency" varchar(3) DEFAULT 'USD'::character varying,
    "contract_duration_months" integer DEFAULT NULL,
    "working_hours" varchar(100) DEFAULT NULL,
    "family_size" integer DEFAULT 1,
    "children_count" integer DEFAULT 0,
    "sponsor_id" uuid DEFAULT NULL,
    "applicant_count" integer DEFAULT 0,
    "matched_count" integer DEFAULT 0,
    "filled_date" timestamp with time zone DEFAULT NULL,
    "posted_date" timestamp with time zone DEFAULT now(),
    "is_featured" boolean DEFAULT false,
    "view_count" integer DEFAULT 0,
    "requirements_array" text[] DEFAULT NULL,
    "benefits_array" text[] DEFAULT NULL,
    "required_skills" text[] DEFAULT NULL,
    "required_languages" text[] DEFAULT NULL,
    "job_type" varchar(50) DEFAULT 'full-time'::character varying,
    "live_in_required" boolean DEFAULT true
);
ALTER TABLE public."agency_jobs" ADD PRIMARY KEY ("id");

-- Table: agency_kyb_audit_log
CREATE TABLE IF NOT EXISTS public."agency_kyb_audit_log" (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "agency_id" uuid DEFAULT NULL,
    "kyb_verification_id" uuid DEFAULT NULL,
    "action" text NOT NULL DEFAULT NULL,
    "previous_status" text DEFAULT NULL,
    "new_status" text DEFAULT NULL,
    "notes" text DEFAULT NULL,
    "performed_by" uuid DEFAULT NULL,
    "metadata" jsonb DEFAULT '{}'::jsonb,
    "created_at" timestamp with time zone DEFAULT now()
);
ALTER TABLE public."agency_kyb_audit_log" ADD PRIMARY KEY ("id");

-- Table: agency_kyb_documents
CREATE TABLE IF NOT EXISTS public."agency_kyb_documents" (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "agency_id" uuid DEFAULT NULL,
    "kyb_verification_id" uuid DEFAULT NULL,
    "document_type" text NOT NULL DEFAULT NULL,
    "document_name" text NOT NULL DEFAULT NULL,
    "file_path" text NOT NULL DEFAULT NULL,
    "file_size" integer NOT NULL DEFAULT NULL,
    "mime_type" text NOT NULL DEFAULT NULL,
    "file_hash" text DEFAULT NULL,
    "verification_status" text DEFAULT 'pending'::text,
    "verification_notes" text DEFAULT NULL,
    "verified_at" timestamp with time zone DEFAULT NULL,
    "verified_by" uuid DEFAULT NULL,
    "uploaded_at" timestamp with time zone DEFAULT now(),
    "updated_at" timestamp with time zone DEFAULT now()
);
ALTER TABLE public."agency_kyb_documents" ADD PRIMARY KEY ("id");

-- Table: agency_kyb_verification
CREATE TABLE IF NOT EXISTS public."agency_kyb_verification" (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "agency_id" uuid DEFAULT NULL,
    "business_registration_number" text NOT NULL DEFAULT NULL,
    "trade_license_number" text NOT NULL DEFAULT NULL,
    "trade_license_expiry" date NOT NULL DEFAULT NULL,
    "tax_identification_number" text DEFAULT NULL,
    "business_registration_date" date DEFAULT NULL,
    "legal_business_name" text NOT NULL DEFAULT NULL,
    "trading_name" text DEFAULT NULL,
    "business_address" text NOT NULL DEFAULT NULL,
    "business_phone" text NOT NULL DEFAULT NULL,
    "business_email" text NOT NULL DEFAULT NULL,
    "website_url" text DEFAULT NULL,
    "company_type" text DEFAULT 'private_limited'::text,
    "authorized_capital_etb" integer DEFAULT NULL,
    "paid_up_capital_etb" integer DEFAULT NULL,
    "contact_person_name" text NOT NULL DEFAULT NULL,
    "contact_person_position" text NOT NULL DEFAULT NULL,
    "contact_person_phone" text NOT NULL DEFAULT NULL,
    "contact_person_email" text NOT NULL DEFAULT NULL,
    "contact_person_id_number" text DEFAULT NULL,
    "year_established" integer DEFAULT NULL,
    "number_of_employees" integer DEFAULT 0,
    "annual_turnover_etb" integer DEFAULT NULL,
    "specialization" text[] DEFAULT NULL,
    "operating_regions" text[] DEFAULT NULL,
    "verification_status" text DEFAULT 'pending'::text,
    "verification_notes" text DEFAULT NULL,
    "verified_at" timestamp with time zone DEFAULT NULL,
    "verified_by" uuid DEFAULT NULL,
    "created_at" timestamp with time zone DEFAULT now(),
    "updated_at" timestamp with time zone DEFAULT now()
);
ALTER TABLE public."agency_kyb_verification" ADD PRIMARY KEY ("id");

-- Table: agency_payment_failures
CREATE TABLE IF NOT EXISTS public."agency_payment_failures" (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "agency_id" uuid NOT NULL DEFAULT NULL,
    "subscription_id" uuid DEFAULT NULL,
    "stripe_payment_intent_id" varchar(255) DEFAULT NULL,
    "amount" numeric NOT NULL DEFAULT NULL,
    "currency" varchar(3) DEFAULT 'AED'::character varying,
    "failure_reason" text DEFAULT NULL,
    "resolved" boolean DEFAULT false,
    "resolved_at" timestamp with time zone DEFAULT NULL,
    "created_at" timestamp with time zone DEFAULT now(),
    "updated_at" timestamp with time zone DEFAULT now()
);
ALTER TABLE public."agency_payment_failures" ADD PRIMARY KEY ("id");

-- Table: agency_payouts
CREATE TABLE IF NOT EXISTS public."agency_payouts" (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "agency_id" uuid NOT NULL DEFAULT NULL,
    "payout_number" varchar(100) NOT NULL DEFAULT NULL,
    "amount" numeric NOT NULL DEFAULT NULL,
    "currency" varchar(3) DEFAULT 'AED'::character varying,
    "status" varchar(50) NOT NULL DEFAULT 'pending'::character varying,
    "payout_method" varchar(50) NOT NULL DEFAULT NULL,
    "payout_destination" jsonb DEFAULT NULL,
    "requested_at" timestamp with time zone DEFAULT now(),
    "processing_at" timestamp with time zone DEFAULT NULL,
    "completed_at" timestamp with time zone DEFAULT NULL,
    "failed_at" timestamp with time zone DEFAULT NULL,
    "stripe_payout_id" varchar(255) DEFAULT NULL,
    "stripe_transfer_id" varchar(255) DEFAULT NULL,
    "provider_reference" varchar(255) DEFAULT NULL,
    "processing_fee" numeric DEFAULT 0,
    "platform_fee" numeric DEFAULT 0,
    "net_amount" numeric NOT NULL DEFAULT NULL,
    "failure_code" varchar(100) DEFAULT NULL,
    "failure_message" text DEFAULT NULL,
    "retry_count" integer DEFAULT 0,
    "description" text DEFAULT NULL,
    "notes" text DEFAULT NULL,
    "metadata" jsonb DEFAULT '{}'::jsonb,
    "created_at" timestamp with time zone DEFAULT now(),
    "updated_at" timestamp with time zone DEFAULT now()
);
ALTER TABLE public."agency_payouts" ADD PRIMARY KEY ("id");

-- Table: agency_placements
CREATE TABLE IF NOT EXISTS public."agency_placements" (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "agency_id" uuid NOT NULL DEFAULT NULL,
    "maid_id" uuid DEFAULT NULL,
    "sponsor_id" uuid DEFAULT NULL,
    "job_id" uuid DEFAULT NULL,
    "application_date" timestamp with time zone DEFAULT NULL,
    "placement_date" timestamp with time zone DEFAULT NULL,
    "status" varchar(50) DEFAULT 'pending'::character varying,
    "notes" text DEFAULT NULL,
    "created_at" timestamp with time zone DEFAULT now(),
    "updated_at" timestamp with time zone DEFAULT now()
);
ALTER TABLE public."agency_placements" ADD PRIMARY KEY ("id");

-- Table: agency_profiles
CREATE TABLE IF NOT EXISTS public."agency_profiles" (
    "id" text NOT NULL DEFAULT NULL,
    "full_name" varchar(255) NOT NULL DEFAULT NULL,
    "license_number" varchar(100) DEFAULT NULL,
    "country" varchar(100) DEFAULT NULL,
    "city" varchar(100) DEFAULT NULL,
    "address" text DEFAULT NULL,
    "phone" varchar(20) DEFAULT NULL,
    "email" varchar(255) DEFAULT NULL,
    "website" text DEFAULT NULL,
    "verified" boolean DEFAULT false,
    "total_maids" integer DEFAULT 0,
    "active_maids" integer DEFAULT 0,
    "successful_placements" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT now(),
    "updated_at" timestamp with time zone DEFAULT now(),
    "active_listings" integer DEFAULT 0,
    "business_email" varchar(255) DEFAULT NULL,
    "head_office_address" text DEFAULT NULL,
    "agency_description" text DEFAULT NULL,
    "support_hours_start" varchar(10) DEFAULT '09:00'::character varying,
    "support_hours_end" varchar(10) DEFAULT '17:00'::character varying,
    "emergency_contact_phone" varchar(20) DEFAULT NULL,
    "authorized_person_name" varchar(255) DEFAULT NULL,
    "authorized_person_position" varchar(100) DEFAULT NULL,
    "authorized_person_phone" varchar(20) DEFAULT NULL,
    "authorized_person_email" varchar(255) DEFAULT NULL,
    "authorized_person_id_number" varchar(100) DEFAULT NULL,
    "contact_phone_verified" boolean DEFAULT false,
    "official_email_verified" boolean DEFAULT false,
    "authorized_person_phone_verified" boolean DEFAULT false,
    "authorized_person_email_verified" boolean DEFAULT false,
    "logo_url" text DEFAULT NULL,
    "logo_file_preview" text DEFAULT NULL,
    "license_expiry_date" date DEFAULT NULL,
    "profile_completed_at" timestamp with time zone DEFAULT NULL,
    "average_rating" numeric DEFAULT 0.00,
    "total_maids_managed" integer DEFAULT 0,
    "guarantee_period_months" integer DEFAULT 3,
    "subscription_tier" varchar(20) DEFAULT 'basic'::character varying,
    "business_phone" varchar(20) DEFAULT NULL,
    "website_url" text DEFAULT NULL,
    "service_countries" text[] DEFAULT NULL,
    "specialization" text[] DEFAULT NULL,
    "placement_fee_percentage" numeric DEFAULT NULL,
    "license_verified" boolean DEFAULT false,
    "trade_license_document" text DEFAULT NULL,
    "authorized_person_id_document" text DEFAULT NULL,
    "agency_contract_template" text DEFAULT NULL,
    "trade_license_verification_status" varchar(50) DEFAULT 'pending'::character varying,
    "authorized_person_id_verification_status" varchar(50) DEFAULT 'pending'::character varying,
    "contract_template_verification_status" varchar(50) DEFAULT 'pending'::character varying,
    "trade_license_verified_at" timestamp with time zone DEFAULT NULL,
    "trade_license_verified_by" uuid DEFAULT NULL,
    "authorized_person_id_verified_at" timestamp with time zone DEFAULT NULL,
    "authorized_person_id_verified_by" uuid DEFAULT NULL,
    "trade_license_rejection_reason" text DEFAULT NULL,
    "authorized_person_id_rejection_reason" text DEFAULT NULL,
    "verification_status" varchar(50) DEFAULT 'pending'::character varying,
    "registration_country" text DEFAULT NULL,
    "established_year" integer DEFAULT NULL,
    "business_address" text DEFAULT NULL,
    "contact_person_name" text DEFAULT NULL,
    "contact_person_title" text DEFAULT NULL,
    "accreditation_bodies" text[] DEFAULT NULL,
    "certifications" text[] DEFAULT NULL,
    "subscription_expires_at" timestamp with time zone DEFAULT NULL
);
ALTER TABLE public."agency_profiles" ADD PRIMARY KEY ("id");

-- Table: agency_tasks
CREATE TABLE IF NOT EXISTS public."agency_tasks" (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "agency_id" text NOT NULL DEFAULT NULL,
    "assigned_to_id" uuid DEFAULT NULL,
    "title" varchar(255) NOT NULL DEFAULT NULL,
    "description" text DEFAULT NULL,
    "status" varchar(50) DEFAULT 'pending'::character varying,
    "priority" varchar(50) DEFAULT 'medium'::character varying,
    "due_date" timestamp with time zone DEFAULT NULL,
    "completed_at" timestamp with time zone DEFAULT NULL,
    "created_at" timestamp with time zone DEFAULT now(),
    "updated_at" timestamp with time zone DEFAULT now(),
    "task_type" varchar(50) DEFAULT 'general'::character varying,
    "created_by" text DEFAULT NULL,
    "progress" integer DEFAULT 0,
    "tags" text[] DEFAULT '{}'::text[],
    "metadata" jsonb DEFAULT '{}'::jsonb,
    "related_maid_id" uuid DEFAULT NULL,
    "related_sponsor_id" uuid DEFAULT NULL,
    "estimated_hours" numeric DEFAULT 1
);
ALTER TABLE public."agency_tasks" ADD PRIMARY KEY ("id");

-- Table: agency_team_members
CREATE TABLE IF NOT EXISTS public."agency_team_members" (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "agency_id" uuid NOT NULL DEFAULT NULL,
    "user_id" uuid DEFAULT NULL,
    "full_name" varchar(255) NOT NULL DEFAULT NULL,
    "email" varchar(255) DEFAULT NULL,
    "role" varchar(100) NOT NULL DEFAULT NULL,
    "status" varchar(50) DEFAULT 'active'::character varying,
    "hire_date" date DEFAULT NULL,
    "termination_date" date DEFAULT NULL,
    "profile_photo_url" text DEFAULT NULL,
    "phone" varchar(50) DEFAULT NULL,
    "created_at" timestamp with time zone DEFAULT now(),
    "updated_at" timestamp with time zone DEFAULT now()
);
ALTER TABLE public."agency_team_members" ADD PRIMARY KEY ("id");

-- Table: analytics_cache
CREATE TABLE IF NOT EXISTS public."analytics_cache" (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "cache_key" varchar(255) NOT NULL DEFAULT NULL,
    "agency_id" uuid DEFAULT NULL,
    "time_range" varchar(20) DEFAULT NULL,
    "data" jsonb NOT NULL DEFAULT NULL,
    "created_at" timestamp with time zone DEFAULT now(),
    "expires_at" timestamp with time zone NOT NULL DEFAULT NULL,
    "hit_count" integer DEFAULT 0
);
ALTER TABLE public."analytics_cache" ADD PRIMARY KEY ("id");

-- Table: announcement_views
CREATE TABLE IF NOT EXISTS public."announcement_views" (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "announcement_id" uuid NOT NULL DEFAULT NULL,
    "announcement_type" varchar(50) NOT NULL DEFAULT NULL,
    "user_id" uuid DEFAULT NULL,
    "viewed_at" timestamp with time zone DEFAULT now()
);
ALTER TABLE public."announcement_views" ADD PRIMARY KEY ("id");

-- Table: applications
CREATE TABLE IF NOT EXISTS public."applications" (
    "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
    "job_id" uuid DEFAULT NULL,
    "maid_id" text DEFAULT NULL,
    "status" varchar(20) DEFAULT 'pending'::character varying,
    "message" text DEFAULT NULL,
    "created_at" timestamp with time zone DEFAULT now(),
    "updated_at" timestamp with time zone DEFAULT now(),
    "agency_id" text DEFAULT NULL,
    "application_status" varchar(50) DEFAULT 'new'::character varying,
    "match_score" integer DEFAULT 0,
    "cover_letter" text DEFAULT NULL,
    "notes" text DEFAULT NULL,
    "rejection_reason" text DEFAULT NULL,
    "interview_date" timestamp with time zone DEFAULT NULL,
    "interview_notes" text DEFAULT NULL,
    "offer_date" timestamp with time zone DEFAULT NULL,
    "offer_amount" integer DEFAULT NULL,
    "offer_currency" varchar(3) DEFAULT 'USD'::character varying,
    "hired_date" timestamp with time zone DEFAULT NULL,
    "documents_submitted" boolean DEFAULT false,
    "background_check_status" varchar(20) DEFAULT 'pending'::character varying,
    "viewed_by_agency" boolean DEFAULT false,
    "viewed_at" timestamp with time zone DEFAULT NULL,
    "response_deadline" timestamp with time zone DEFAULT NULL,
    "priority" varchar(20) DEFAULT 'normal'::character varying,
    "metadata" jsonb DEFAULT '{}'::jsonb
);
ALTER TABLE public."applications" ADD PRIMARY KEY ("id");

-- Table: audit_logs
CREATE TABLE IF NOT EXISTS public."audit_logs" (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "actor_id" uuid DEFAULT NULL,
    "actor_type" text DEFAULT NULL,
    "actor_email" text DEFAULT NULL,
    "actor_ip" text DEFAULT NULL,
    "actor_user_agent" text DEFAULT NULL,
    "action" text NOT NULL DEFAULT NULL,
    "action_category" text DEFAULT NULL,
    "target_id" uuid DEFAULT NULL,
    "target_type" text DEFAULT NULL,
    "target_table" text DEFAULT NULL,
    "old_values" jsonb DEFAULT NULL,
    "new_values" jsonb DEFAULT NULL,
    "metadata" jsonb DEFAULT NULL,
    "success" boolean DEFAULT true,
    "error_message" text DEFAULT NULL,
    "created_at" timestamp with time zone DEFAULT now(),
    "category" varchar(100) DEFAULT NULL,
    "details" jsonb DEFAULT NULL,
    "user_email" varchar(255) DEFAULT NULL,
    "ip_address" varchar(45) DEFAULT NULL,
    "severity" varchar(20) DEFAULT NULL,
    "resource_id" uuid DEFAULT NULL,
    "resource_type" varchar(100) DEFAULT NULL,
    "timestamp" timestamp with time zone DEFAULT now(),
    "user_agent" text DEFAULT NULL,
    "user_id" uuid DEFAULT NULL
);
ALTER TABLE public."audit_logs" ADD PRIMARY KEY ("id");

-- Table: booking_requests
CREATE TABLE IF NOT EXISTS public."booking_requests" (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "maid_id" text DEFAULT NULL,
    "sponsor_id" text DEFAULT NULL,
    "agency_id" uuid DEFAULT NULL,
    "status" varchar(20) NOT NULL DEFAULT 'pending'::character varying,
    "requested_start_date" date DEFAULT NULL,
    "requested_duration_months" integer DEFAULT NULL,
    "offered_salary" numeric DEFAULT NULL,
    "currency" varchar(3) DEFAULT 'ETB'::character varying,
    "message" text DEFAULT NULL,
    "rejection_reason" text DEFAULT NULL,
    "created_at" timestamp with time zone DEFAULT now(),
    "updated_at" timestamp with time zone DEFAULT now(),
    "responded_at" timestamp with time zone DEFAULT NULL,
    "amount" numeric DEFAULT 0.00,
    "payment_status" varchar(20) DEFAULT 'pending'::character varying,
    "payment_method" varchar(50) DEFAULT NULL,
    "payment_date" timestamp with time zone DEFAULT NULL,
    "payment_reference" varchar(255) DEFAULT NULL,
    "start_date" date DEFAULT NULL,
    "end_date" date DEFAULT NULL,
    "special_requirements" text DEFAULT NULL
);
ALTER TABLE public."booking_requests" ADD PRIMARY KEY ("id");

-- Table: bookings
CREATE TABLE IF NOT EXISTS public."bookings" (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "maid_id" text DEFAULT NULL,
    "sponsor_id" text DEFAULT NULL,
    "agency_id" text DEFAULT NULL,
    "job_id" uuid DEFAULT NULL,
    "booking_type" text NOT NULL DEFAULT NULL,
    "status" text NOT NULL DEFAULT 'pending'::text,
    "start_date" date NOT NULL DEFAULT NULL,
    "end_date" date DEFAULT NULL,
    "duration_months" integer DEFAULT NULL,
    "interview_date" timestamp with time zone DEFAULT NULL,
    "interview_type" text DEFAULT NULL,
    "contract_type" text DEFAULT NULL,
    "salary_amount" numeric DEFAULT NULL,
    "salary_currency" text DEFAULT 'ETB'::text,
    "payment_frequency" text DEFAULT NULL,
    "duties" text[] DEFAULT NULL,
    "working_hours" jsonb DEFAULT NULL,
    "accommodation_provided" boolean DEFAULT false,
    "food_provided" boolean DEFAULT false,
    "medical_insurance_provided" boolean DEFAULT false,
    "cancelled_by" uuid DEFAULT NULL,
    "cancellation_reason" text DEFAULT NULL,
    "cancelled_at" timestamp with time zone DEFAULT NULL,
    "completion_rating" integer DEFAULT NULL,
    "completion_notes" text DEFAULT NULL,
    "notes" text DEFAULT NULL,
    "created_at" timestamp with time zone DEFAULT now(),
    "updated_at" timestamp with time zone DEFAULT now()
);
ALTER TABLE public."bookings" ADD PRIMARY KEY ("id");

-- Table: calendar_events
CREATE TABLE IF NOT EXISTS public."calendar_events" (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "agency_id" text NOT NULL DEFAULT NULL,
    "created_by" text DEFAULT NULL,
    "title" varchar(500) NOT NULL DEFAULT NULL,
    "description" text DEFAULT NULL,
    "event_type" varchar(50) DEFAULT 'meeting'::character varying,
    "start_date" date NOT NULL DEFAULT NULL,
    "end_date" date DEFAULT NULL,
    "start_time" time without time zone DEFAULT NULL,
    "end_time" time without time zone DEFAULT NULL,
    "all_day" boolean DEFAULT false,
    "location" varchar(500) DEFAULT NULL,
    "location_type" varchar(20) DEFAULT 'onsite'::character varying,
    "meeting_link" text DEFAULT NULL,
    "maid_id" uuid DEFAULT NULL,
    "sponsor_id" uuid DEFAULT NULL,
    "status" varchar(20) DEFAULT 'scheduled'::character varying,
    "priority" varchar(20) DEFAULT 'medium'::character varying,
    "notes" text DEFAULT NULL,
    "outcome" text DEFAULT NULL,
    "tags" text[] DEFAULT '{}'::text[],
    "metadata" jsonb DEFAULT '{}'::jsonb,
    "created_at" timestamp with time zone DEFAULT now(),
    "updated_at" timestamp with time zone DEFAULT now()
);
ALTER TABLE public."calendar_events" ADD PRIMARY KEY ("id");

-- Table: client_satisfaction_ratings
CREATE TABLE IF NOT EXISTS public."client_satisfaction_ratings" (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "agency_id" uuid NOT NULL DEFAULT NULL,
    "sponsor_id" uuid NOT NULL DEFAULT NULL,
    "maid_id" uuid DEFAULT NULL,
    "placement_id" uuid DEFAULT NULL,
    "communication_rating" numeric DEFAULT NULL,
    "quality_rating" numeric DEFAULT NULL,
    "timeliness_rating" numeric DEFAULT NULL,
    "documentation_rating" numeric DEFAULT NULL,
    "overall_rating" numeric DEFAULT NULL,
    "feedback_text" text DEFAULT NULL,
    "would_recommend" boolean DEFAULT NULL,
    "rating_date" timestamp with time zone DEFAULT now(),
    "created_at" timestamp with time zone DEFAULT now(),
    "updated_at" timestamp with time zone DEFAULT now()
);
ALTER TABLE public."client_satisfaction_ratings" ADD PRIMARY KEY ("id");

-- Table: compliance_categories
CREATE TABLE IF NOT EXISTS public."compliance_categories" (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "agency_id" uuid NOT NULL DEFAULT NULL,
    "title" varchar(255) NOT NULL DEFAULT NULL,
    "category" varchar(100) NOT NULL DEFAULT NULL,
    "description" text DEFAULT NULL,
    "priority" varchar(50) DEFAULT 'medium'::character varying,
    "total_items" integer DEFAULT 0,
    "completed_items" integer DEFAULT 0,
    "compliance_percentage" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT now(),
    "updated_at" timestamp with time zone DEFAULT now()
);
ALTER TABLE public."compliance_categories" ADD PRIMARY KEY ("id");

-- Table: compliance_items
CREATE TABLE IF NOT EXISTS public."compliance_items" (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "category_id" uuid NOT NULL DEFAULT NULL,
    "agency_id" uuid NOT NULL DEFAULT NULL,
    "requirement" varchar(255) NOT NULL DEFAULT NULL,
    "description" text DEFAULT NULL,
    "status" varchar(50) DEFAULT 'pending'::character varying,
    "responsible" varchar(255) DEFAULT NULL,
    "due_date" timestamp with time zone DEFAULT NULL,
    "completed_at" timestamp with time zone DEFAULT NULL,
    "notes" text DEFAULT NULL,
    "document_id" uuid DEFAULT NULL,
    "created_at" timestamp with time zone DEFAULT now(),
    "updated_at" timestamp with time zone DEFAULT now()
);
ALTER TABLE public."compliance_items" ADD PRIMARY KEY ("id");

-- Table: contact_fees
CREATE TABLE IF NOT EXISTS public."contact_fees" (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "sponsor_id" uuid DEFAULT NULL,
    "maid_id" uuid DEFAULT NULL,
    "credits_charged" integer NOT NULL DEFAULT 1,
    "contact_message" text DEFAULT NULL,
    "idempotency_key" text DEFAULT NULL,
    "created_at" timestamp with time zone DEFAULT now()
);
ALTER TABLE public."contact_fees" ADD PRIMARY KEY ("id");

-- Table: content_moderation_flags
CREATE TABLE IF NOT EXISTS public."content_moderation_flags" (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "content_id" uuid NOT NULL DEFAULT NULL,
    "content_type" text NOT NULL DEFAULT NULL,
    "flags" jsonb NOT NULL DEFAULT '[]'::jsonb,
    "flagged_by" text NOT NULL DEFAULT NULL,
    "severity" text NOT NULL DEFAULT 'medium'::text,
    "requires_human_review" boolean DEFAULT false,
    "status" text DEFAULT 'pending'::text,
    "reviewed_by" uuid DEFAULT NULL,
    "reviewed_at" timestamp with time zone DEFAULT NULL,
    "created_at" timestamp with time zone DEFAULT now(),
    "updated_at" timestamp with time zone DEFAULT now()
);
ALTER TABLE public."content_moderation_flags" ADD PRIMARY KEY ("id");

-- Table: conversations
CREATE TABLE IF NOT EXISTS public."conversations" (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "participant1_id" text DEFAULT NULL,
    "participant1_type" text NOT NULL DEFAULT NULL,
    "participant2_id" text DEFAULT NULL,
    "participant2_type" text NOT NULL DEFAULT NULL,
    "status" text DEFAULT 'active'::text,
    "last_message_at" timestamp with time zone DEFAULT NULL,
    "last_message_preview" text DEFAULT NULL,
    "participant1_unread_count" integer DEFAULT 0,
    "participant2_unread_count" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT now(),
    "updated_at" timestamp with time zone DEFAULT now(),
    "agency_id" uuid DEFAULT NULL
);
ALTER TABLE public."conversations" ADD PRIMARY KEY ("id");

-- Table: conversion_events
CREATE TABLE IF NOT EXISTS public."conversion_events" (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "user_id" uuid DEFAULT NULL,
    "session_id" uuid DEFAULT NULL,
    "conversion_type" varchar(50) NOT NULL DEFAULT NULL,
    "conversion_value" numeric DEFAULT NULL,
    "currency" varchar(3) DEFAULT 'USD'::character varying,
    "related_id" uuid DEFAULT NULL,
    "related_type" varchar(50) DEFAULT NULL,
    "properties" jsonb DEFAULT NULL,
    "converted_at" timestamp with time zone DEFAULT now(),
    "created_at" timestamp with time zone DEFAULT now()
);
ALTER TABLE public."conversion_events" ADD PRIMARY KEY ("id");

-- Table: countries
CREATE TABLE IF NOT EXISTS public."countries" (
    "id" integer NOT NULL,
    "name" varchar(100) NOT NULL DEFAULT NULL,
    "code" varchar(3) NOT NULL DEFAULT NULL,
    "is_gcc" boolean DEFAULT false,
    "is_source_country" boolean DEFAULT false,
    "currency_code" varchar(3) DEFAULT NULL,
    "created_at" timestamp with time zone DEFAULT now(),
    "updated_at" timestamp with time zone DEFAULT now()
);
ALTER TABLE public."countries" ADD PRIMARY KEY ("id");

-- Table: country_codes
CREATE TABLE IF NOT EXISTS public."country_codes" (
    "id" integer NOT NULL,
    "country_name" varchar(100) NOT NULL DEFAULT NULL,
    "country_code" varchar(10) NOT NULL DEFAULT NULL,
    "dial_code" varchar(10) NOT NULL DEFAULT NULL,
    "flag_emoji" varchar(10) DEFAULT NULL,
    "created_at" timestamp with time zone DEFAULT now()
);
ALTER TABLE public."country_codes" ADD PRIMARY KEY ("id");

-- Table: credit_transactions
CREATE TABLE IF NOT EXISTS public."credit_transactions" (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "user_id" uuid DEFAULT NULL,
    "transaction_type" text NOT NULL DEFAULT NULL,
    "credits_amount" integer NOT NULL DEFAULT NULL,
    "balance_after" integer NOT NULL DEFAULT NULL,
    "cost_usd_cents" integer DEFAULT NULL,
    "stripe_payment_intent_id" text DEFAULT NULL,
    "description" text DEFAULT NULL,
    "metadata" jsonb DEFAULT '{}'::jsonb,
    "idempotency_key" text DEFAULT NULL,
    "created_at" timestamp with time zone DEFAULT now()
);
ALTER TABLE public."credit_transactions" ADD PRIMARY KEY ("id");

-- Table: dispute_evidence
CREATE TABLE IF NOT EXISTS public."dispute_evidence" (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "dispute_id" uuid NOT NULL DEFAULT NULL,
    "evidence_type" varchar(50) NOT NULL DEFAULT NULL,
    "title" varchar(255) NOT NULL DEFAULT NULL,
    "description" text DEFAULT NULL,
    "file_url" text DEFAULT NULL,
    "file_name" varchar(255) DEFAULT NULL,
    "file_size" integer DEFAULT NULL,
    "file_type" varchar(100) DEFAULT NULL,
    "submitted_by_id" uuid NOT NULL DEFAULT NULL,
    "submitted_by_type" varchar(20) NOT NULL DEFAULT NULL,
    "submitted_by_name" varchar(255) DEFAULT NULL,
    "is_verified" boolean DEFAULT false,
    "verified_by_id" uuid DEFAULT NULL,
    "verified_at" timestamp with time zone DEFAULT NULL,
    "verification_notes" text DEFAULT NULL,
    "metadata" jsonb DEFAULT '{}'::jsonb,
    "created_at" timestamp with time zone DEFAULT now(),
    "updated_at" timestamp with time zone DEFAULT now()
);
ALTER TABLE public."dispute_evidence" ADD PRIMARY KEY ("id");

-- Table: dispute_messages
CREATE TABLE IF NOT EXISTS public."dispute_messages" (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "dispute_id" uuid NOT NULL DEFAULT NULL,
    "message" text NOT NULL DEFAULT NULL,
    "message_type" varchar(50) DEFAULT 'comment'::character varying,
    "sender_id" uuid NOT NULL DEFAULT NULL,
    "sender_type" varchar(20) NOT NULL DEFAULT NULL,
    "sender_name" varchar(255) NOT NULL DEFAULT NULL,
    "is_internal" boolean DEFAULT false,
    "is_read" boolean DEFAULT false,
    "read_at" timestamp with time zone DEFAULT NULL,
    "attachments" jsonb DEFAULT '[]'::jsonb,
    "metadata" jsonb DEFAULT '{}'::jsonb,
    "created_at" timestamp with time zone DEFAULT now(),
    "updated_at" timestamp with time zone DEFAULT now()
);
ALTER TABLE public."dispute_messages" ADD PRIMARY KEY ("id");

-- Table: dispute_parties
CREATE TABLE IF NOT EXISTS public."dispute_parties" (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "dispute_id" uuid NOT NULL DEFAULT NULL,
    "party_id" uuid NOT NULL DEFAULT NULL,
    "party_type" varchar(20) NOT NULL DEFAULT NULL,
    "party_name" varchar(255) NOT NULL DEFAULT NULL,
    "party_email" varchar(255) DEFAULT NULL,
    "party_phone" varchar(50) DEFAULT NULL,
    "role" varchar(50) DEFAULT NULL,
    "notified_at" timestamp with time zone DEFAULT NULL,
    "responded_at" timestamp with time zone DEFAULT NULL,
    "last_viewed_at" timestamp with time zone DEFAULT NULL,
    "notes" text DEFAULT NULL,
    "created_at" timestamp with time zone DEFAULT now(),
    "updated_at" timestamp with time zone DEFAULT now()
);
ALTER TABLE public."dispute_parties" ADD PRIMARY KEY ("id");

-- Table: disputes
CREATE TABLE IF NOT EXISTS public."disputes" (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "title" varchar(255) NOT NULL DEFAULT NULL,
    "description" text NOT NULL DEFAULT NULL,
    "dispute_type" varchar(50) NOT NULL DEFAULT NULL,
    "agency_id" uuid DEFAULT NULL,
    "maid_id" text DEFAULT NULL,
    "sponsor_id" text DEFAULT NULL,
    "placement_id" uuid DEFAULT NULL,
    "raised_by_id" uuid NOT NULL DEFAULT NULL,
    "raised_by_type" varchar(20) NOT NULL DEFAULT NULL,
    "status" varchar(50) NOT NULL DEFAULT 'open'::character varying,
    "priority" varchar(20) DEFAULT 'medium'::character varying,
    "resolution_type" varchar(50) DEFAULT NULL,
    "resolution_notes" text DEFAULT NULL,
    "resolved_by_id" uuid DEFAULT NULL,
    "resolved_at" timestamp with time zone DEFAULT NULL,
    "claimed_amount" numeric DEFAULT NULL,
    "awarded_amount" numeric DEFAULT NULL,
    "currency" varchar(3) DEFAULT 'AED'::character varying,
    "assigned_mediator_id" uuid DEFAULT NULL,
    "assigned_mediator_name" varchar(255) DEFAULT NULL,
    "internal_notes" text DEFAULT NULL,
    "tags" text[] DEFAULT NULL,
    "evidence_summary" jsonb DEFAULT '{}'::jsonb,
    "created_at" timestamp with time zone DEFAULT now(),
    "updated_at" timestamp with time zone DEFAULT now(),
    "first_response_at" timestamp with time zone DEFAULT NULL,
    "last_activity_at" timestamp with time zone DEFAULT NULL
);
ALTER TABLE public."disputes" ADD PRIMARY KEY ("id");

-- Table: favorites
CREATE TABLE IF NOT EXISTS public."favorites" (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "sponsor_id" text DEFAULT NULL,
    "maid_id" text DEFAULT NULL,
    "created_at" timestamp with time zone DEFAULT now()
);
ALTER TABLE public."favorites" ADD PRIMARY KEY ("id");

-- Table: interest_requests
CREATE TABLE IF NOT EXISTS public."interest_requests" (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "sender_id" text NOT NULL DEFAULT NULL,
    "sender_type" varchar(20) NOT NULL DEFAULT NULL,
    "recipient_id" text NOT NULL DEFAULT NULL,
    "recipient_type" varchar(20) NOT NULL DEFAULT NULL,
    "status" varchar(20) DEFAULT 'pending'::character varying,
    "message" text DEFAULT NULL,
    "created_at" timestamp with time zone DEFAULT now(),
    "updated_at" timestamp with time zone DEFAULT now(),
    "responded_at" timestamp with time zone DEFAULT NULL,
    "expires_at" timestamp with time zone DEFAULT (now() + '7 days'::interval)
);
ALTER TABLE public."interest_requests" ADD PRIMARY KEY ("id");

-- Table: interview_notifications
CREATE TABLE IF NOT EXISTS public."interview_notifications" (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "interview_id" uuid DEFAULT NULL,
    "notification_type" text NOT NULL DEFAULT NULL,
    "recipient_type" text NOT NULL DEFAULT NULL,
    "recipient_id" uuid DEFAULT NULL,
    "recipient_phone" text DEFAULT NULL,
    "recipient_email" text DEFAULT NULL,
    "message_text" text NOT NULL DEFAULT NULL,
    "message_data" jsonb DEFAULT '{}'::jsonb,
    "status" text DEFAULT 'pending'::text,
    "sent_at" timestamp with time zone DEFAULT NULL,
    "delivered_at" timestamp with time zone DEFAULT NULL,
    "read_at" timestamp with time zone DEFAULT NULL,
    "failed_reason" text DEFAULT NULL,
    "retry_count" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT now(),
    "updated_at" timestamp with time zone DEFAULT now()
);
ALTER TABLE public."interview_notifications" ADD PRIMARY KEY ("id");

-- Table: interview_platform_templates
CREATE TABLE IF NOT EXISTS public."interview_platform_templates" (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "platform_type" text NOT NULL DEFAULT NULL,
    "display_name" text NOT NULL DEFAULT NULL,
    "requires_download" boolean DEFAULT false,
    "download_link" text DEFAULT NULL,
    "setup_instructions" text DEFAULT NULL,
    "sponsor_instructions" text DEFAULT NULL,
    "maid_instructions" text DEFAULT NULL,
    "created_at" timestamp with time zone DEFAULT now()
);
ALTER TABLE public."interview_platform_templates" ADD PRIMARY KEY ("id");

-- Table: job_applications
CREATE TABLE IF NOT EXISTS public."job_applications" (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "job_id" uuid NOT NULL DEFAULT NULL,
    "maid_id" text DEFAULT NULL,
    "status" varchar(20) DEFAULT 'pending'::character varying,
    "cover_letter" text DEFAULT NULL,
    "expected_salary" integer DEFAULT NULL,
    "available_from" date DEFAULT NULL,
    "notes" text DEFAULT NULL,
    "applied_at" timestamp with time zone DEFAULT now(),
    "updated_at" timestamp with time zone DEFAULT now(),
    "created_at" timestamp with time zone DEFAULT now()
);
ALTER TABLE public."job_applications" ADD PRIMARY KEY ("id");

-- Table: jobs
CREATE TABLE IF NOT EXISTS public."jobs" (
    "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
    "sponsor_id" text DEFAULT NULL,
    "title" varchar(255) NOT NULL DEFAULT NULL,
    "description" text DEFAULT NULL,
    "location" varchar(255) DEFAULT NULL,
    "country" varchar(100) DEFAULT NULL,
    "salary_min" integer DEFAULT NULL,
    "salary_max" integer DEFAULT NULL,
    "currency" varchar(3) DEFAULT 'USD'::character varying,
    "contract_duration" varchar(50) DEFAULT NULL,
    "requirements" text[] DEFAULT NULL,
    "benefits" text[] DEFAULT NULL,
    "status" varchar(20) NOT NULL DEFAULT 'active'::character varying,
    "created_at" timestamp with time zone DEFAULT now(),
    "updated_at" timestamp with time zone DEFAULT now(),
    "employer" text DEFAULT NULL,
    "job_type" text DEFAULT NULL,
    "accommodation" text DEFAULT NULL,
    "visa_status_required" text[] DEFAULT NULL,
    "service_type" text[] DEFAULT NULL,
    "languages_required" text[] DEFAULT NULL,
    "urgent" boolean DEFAULT false,
    "city" varchar(100) DEFAULT NULL,
    "address" text DEFAULT NULL,
    "required_skills" text[] DEFAULT '{}'::text[],
    "preferred_nationality" text[] DEFAULT NULL,
    "minimum_experience_years" integer DEFAULT 0,
    "age_preference_min" integer DEFAULT NULL,
    "age_preference_max" integer DEFAULT NULL,
    "education_requirement" varchar(100) DEFAULT NULL,
    "working_hours_per_day" integer DEFAULT 8,
    "working_days_per_week" integer DEFAULT 6,
    "days_off_per_week" integer DEFAULT 1,
    "overtime_available" boolean DEFAULT false,
    "live_in_required" boolean DEFAULT true,
    "salary_period" varchar(20) DEFAULT 'monthly'::character varying,
    "contract_duration_months" integer DEFAULT NULL,
    "start_date" date DEFAULT NULL,
    "end_date" date DEFAULT NULL,
    "probation_period_months" integer DEFAULT 3,
    "urgency_level" varchar(20) DEFAULT 'normal'::character varying,
    "max_applications" integer DEFAULT 50,
    "auto_expire_days" integer DEFAULT 30,
    "requires_approval" boolean DEFAULT true,
    "views_count" integer DEFAULT 0,
    "applications_count" integer DEFAULT 0,
    "featured" boolean DEFAULT false,
    "featured_until" timestamp with time zone DEFAULT NULL,
    "expires_at" timestamp with time zone DEFAULT NULL
);
ALTER TABLE public."jobs" ADD PRIMARY KEY ("id");

-- Table: maid_bookings
CREATE TABLE IF NOT EXISTS public."maid_bookings" (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "phone_number" text NOT NULL DEFAULT NULL,
    "sponsor_name" text DEFAULT NULL,
    "maid_id" text DEFAULT NULL,
    "maid_name" text DEFAULT NULL,
    "booking_type" text DEFAULT NULL,
    "booking_date" timestamp with time zone DEFAULT NULL,
    "status" text DEFAULT 'pending'::text,
    "notes" text DEFAULT NULL,
    "created_at" timestamp with time zone DEFAULT now(),
    "updated_at" timestamp with time zone DEFAULT now(),
    "sponsor_id" uuid DEFAULT NULL,
    "metadata" jsonb DEFAULT '{}'::jsonb
);
ALTER TABLE public."maid_bookings" ADD PRIMARY KEY ("id");

-- Table: maid_documents
CREATE TABLE IF NOT EXISTS public."maid_documents" (
    "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
    "maid_id" text DEFAULT NULL,
    "document_type" varchar(50) NOT NULL DEFAULT NULL,
    "document_url" text NOT NULL DEFAULT NULL,
    "document_name" varchar(255) DEFAULT NULL,
    "verified" boolean DEFAULT false,
    "expiry_date" date DEFAULT NULL,
    "created_at" timestamp with time zone DEFAULT now(),
    "updated_at" timestamp with time zone DEFAULT now(),
    "type" text DEFAULT NULL,
    "custom_type_name" text DEFAULT NULL,
    "title" text DEFAULT NULL,
    "description" text DEFAULT NULL,
    "file_path" text DEFAULT NULL,
    "file_url" text DEFAULT NULL,
    "file_name" text DEFAULT NULL,
    "file_size" bigint DEFAULT NULL,
    "mime_type" text DEFAULT NULL,
    "uploaded_at" timestamp with time zone DEFAULT now()
);
ALTER TABLE public."maid_documents" ADD PRIMARY KEY ("id");

-- Table: maid_images
CREATE TABLE IF NOT EXISTS public."maid_images" (
    "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
    "maid_id" uuid DEFAULT NULL,
    "file_url" text NOT NULL DEFAULT NULL,
    "file_path" text DEFAULT NULL,
    "file_name" text DEFAULT NULL,
    "file_size" integer DEFAULT NULL,
    "mime_type" varchar(100) DEFAULT NULL,
    "is_primary" boolean DEFAULT false,
    "is_processed" boolean DEFAULT false,
    "display_order" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT now(),
    "updated_at" timestamp with time zone DEFAULT now()
);
ALTER TABLE public."maid_images" ADD PRIMARY KEY ("id");

-- Table: maid_profiles
CREATE TABLE IF NOT EXISTS public."maid_profiles" (
    "id" text NOT NULL DEFAULT NULL,
    "full_name" varchar(255) DEFAULT ''::character varying,
    "date_of_birth" date DEFAULT NULL,
    "nationality" varchar(100) DEFAULT NULL,
    "current_location" varchar(255) DEFAULT NULL,
    "marital_status" varchar(20) DEFAULT NULL,
    "children_count" integer DEFAULT 0,
    "experience_years" integer DEFAULT 0,
    "previous_countries" text[] DEFAULT NULL,
    "skills" text[] DEFAULT NULL,
    "languages" text[] DEFAULT NULL,
    "education_level" varchar(50) DEFAULT NULL,
    "preferred_salary_min" integer DEFAULT NULL,
    "preferred_salary_max" integer DEFAULT NULL,
    "preferred_currency" varchar(3) DEFAULT 'USD'::character varying,
    "available_from" date DEFAULT NULL,
    "contract_duration_preference" varchar(50) DEFAULT NULL,
    "live_in_preference" boolean DEFAULT true,
    "passport_number" varchar(50) DEFAULT NULL,
    "passport_expiry" date DEFAULT NULL,
    "visa_status" varchar(100) DEFAULT NULL,
    "medical_certificate_valid" boolean DEFAULT false,
    "police_clearance_valid" boolean DEFAULT false,
    "availability_status" varchar(20) DEFAULT 'available'::character varying,
    "profile_completion_percentage" integer DEFAULT 0,
    "verification_status" varchar(20) DEFAULT 'pending'::character varying,
    "about_me" text DEFAULT NULL,
    "profile_views" integer DEFAULT 0,
    "total_applications" integer DEFAULT 0,
    "successful_placements" integer DEFAULT 0,
    "average_rating" numeric DEFAULT 0.00,
    "created_at" timestamp with time zone DEFAULT now(),
    "updated_at" timestamp with time zone DEFAULT now(),
    "profile_photo_url" text DEFAULT NULL,
    "first_name" varchar(100) DEFAULT NULL,
    "middle_name" varchar(100) DEFAULT NULL,
    "last_name" varchar(100) DEFAULT NULL,
    "phone_country_code" varchar(10) DEFAULT NULL,
    "phone_number" varchar(20) DEFAULT NULL,
    "street_address" text DEFAULT NULL,
    "state_province" varchar(100) DEFAULT NULL,
    "religion" varchar(50) DEFAULT NULL,
    "religion_other" varchar(100) DEFAULT NULL,
    "primary_profession" varchar(100) DEFAULT NULL,
    "primary_profession_other" varchar(100) DEFAULT NULL,
    "current_visa_status" varchar(100) DEFAULT NULL,
    "current_visa_status_other" varchar(100) DEFAULT NULL,
    "introduction_video_url" text DEFAULT NULL,
    "passport_number_encrypted" text DEFAULT NULL,
    "passport_number_hash" text DEFAULT NULL,
    "national_id_encrypted" text DEFAULT NULL,
    "national_id_hash" text DEFAULT NULL,
    "emergency_contact_phone_encrypted" text DEFAULT NULL,
    "emergency_contact_phone_hash" text DEFAULT NULL,
    "medical_info_encrypted" text DEFAULT NULL,
    "previous_employer_contact_encrypted" text DEFAULT NULL,
    "bank_account_encrypted" text DEFAULT NULL,
    "bank_account_hash" text DEFAULT NULL,
    "is_agency_managed" boolean DEFAULT false,
    "agency_id" text DEFAULT NULL,
    "agency_badge" boolean DEFAULT NULL,
    "is_approved" boolean DEFAULT true,
    "country" varchar(100) DEFAULT NULL,
    "suburb" varchar(150) DEFAULT NULL,
    "iso_country_code" varchar(3) DEFAULT NULL,
    "phone_verified" boolean DEFAULT false,
    "phone_verified_at" timestamp with time zone DEFAULT NULL,
    "two_factor_enabled" boolean DEFAULT false,
    "two_factor_method" varchar(20) DEFAULT 'none'::character varying,
    "alternative_phone" varchar(20) DEFAULT NULL,
    "primary_image_processed" boolean DEFAULT false,
    "primary_image_original_url" text DEFAULT NULL,
    "primary_image_processed_url" text DEFAULT NULL,
    "image_processing_metadata" jsonb DEFAULT '{}'::jsonb,
    "additional_services" text[] DEFAULT NULL,
    "special_skills" text[] DEFAULT NULL,
    "work_preferences" text[] DEFAULT NULL,
    "key_responsibilities" text[] DEFAULT NULL,
    "additional_notes" text DEFAULT NULL,
    "user_id" text DEFAULT NULL,
    "video_duration" integer DEFAULT NULL,
    "work_history" jsonb DEFAULT '[]'::jsonb,
    "hired_status" varchar(20) DEFAULT 'available'::character varying,
    "current_placement_id" uuid DEFAULT NULL,
    "hired_by_sponsor_id" varchar(255) DEFAULT NULL,
    "hired_date" timestamp with time zone DEFAULT NULL,
    "trial_start_date" timestamp with time zone DEFAULT NULL,
    "trial_end_date" timestamp with time zone DEFAULT NULL
);
ALTER TABLE public."maid_profiles" ADD PRIMARY KEY ("id");

-- Table: maid_videos
CREATE TABLE IF NOT EXISTS public."maid_videos" (
    "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
    "maid_id" uuid DEFAULT NULL,
    "video_url" text NOT NULL DEFAULT NULL,
    "video_path" text DEFAULT NULL,
    "thumbnail_url" text DEFAULT NULL,
    "duration" integer DEFAULT NULL,
    "file_size" integer DEFAULT NULL,
    "created_at" timestamp with time zone DEFAULT now()
);
ALTER TABLE public."maid_videos" ADD PRIMARY KEY ("id");

-- Table: message_templates
CREATE TABLE IF NOT EXISTS public."message_templates" (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "agency_id" uuid NOT NULL DEFAULT NULL,
    "name" varchar(255) NOT NULL DEFAULT NULL,
    "category" varchar(50) DEFAULT 'general'::character varying,
    "subject" varchar(500) DEFAULT NULL,
    "content" text NOT NULL DEFAULT NULL,
    "variables" jsonb DEFAULT '[]'::jsonb,
    "is_active" boolean DEFAULT true,
    "usage_count" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT now(),
    "updated_at" timestamp with time zone DEFAULT now(),
    "metadata" jsonb DEFAULT '{}'::jsonb
);
ALTER TABLE public."message_templates" ADD PRIMARY KEY ("id");

-- Table: messages
CREATE TABLE IF NOT EXISTS public."messages" (
    "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
    "sender_id" text DEFAULT NULL,
    "receiver_id" text DEFAULT NULL,
    "content" text NOT NULL DEFAULT NULL,
    "read" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT now(),
    "recipient_id" text DEFAULT NULL,
    "conversation_id" uuid DEFAULT NULL,
    "subject" text DEFAULT NULL,
    "message_type" text DEFAULT 'general'::text,
    "is_read" boolean DEFAULT false,
    "read_at" timestamp with time zone DEFAULT NULL,
    "is_archived" boolean DEFAULT false,
    "attachments" jsonb DEFAULT '[]'::jsonb,
    "updated_at" timestamp with time zone DEFAULT now(),
    "job_id" uuid DEFAULT NULL,
    "application_id" uuid DEFAULT NULL
);
ALTER TABLE public."messages" ADD PRIMARY KEY ("id", "id", "inserted_at");

-- Table: news_items
CREATE TABLE IF NOT EXISTS public."news_items" (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "source_id" uuid DEFAULT NULL,
    "title" text NOT NULL DEFAULT NULL,
    "content" text DEFAULT NULL,
    "summary" text DEFAULT NULL,
    "url" text DEFAULT NULL,
    "category" varchar(100) NOT NULL DEFAULT NULL,
    "country" varchar(3) DEFAULT NULL,
    "published_at" timestamp with time zone NOT NULL DEFAULT NULL,
    "sentiment" varchar(20) DEFAULT NULL,
    "keywords" text[] DEFAULT NULL,
    "image_url" text DEFAULT NULL,
    "is_featured" boolean DEFAULT false,
    "priority" integer DEFAULT 0,
    "view_count" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT now(),
    "updated_at" timestamp with time zone DEFAULT now()
);
ALTER TABLE public."news_items" ADD PRIMARY KEY ("id");

-- Table: news_sources
CREATE TABLE IF NOT EXISTS public."news_sources" (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "name" varchar(255) NOT NULL DEFAULT NULL,
    "source_type" varchar(50) NOT NULL DEFAULT NULL,
    "url" text DEFAULT NULL,
    "category" varchar(100) NOT NULL DEFAULT NULL,
    "country" varchar(3) DEFAULT NULL,
    "is_active" boolean DEFAULT true,
    "fetch_interval_minutes" integer DEFAULT 60,
    "last_fetched_at" timestamp with time zone DEFAULT NULL,
    "config" jsonb DEFAULT '{}'::jsonb,
    "created_at" timestamp with time zone DEFAULT now(),
    "updated_at" timestamp with time zone DEFAULT now()
);
ALTER TABLE public."news_sources" ADD PRIMARY KEY ("id");

-- Table: notification_settings
CREATE TABLE IF NOT EXISTS public."notification_settings" (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "user_id" text NOT NULL DEFAULT NULL,
    "email_enabled" boolean DEFAULT true,
    "push_enabled" boolean DEFAULT true,
    "sms_enabled" boolean DEFAULT false,
    "in_app_enabled" boolean DEFAULT true,
    "email_frequency" text DEFAULT 'instant'::text,
    "quiet_hours_enabled" boolean DEFAULT false,
    "quiet_hours_start" text DEFAULT '22:00'::text,
    "quiet_hours_end" text DEFAULT '07:00'::text,
    "notification_types" jsonb DEFAULT '{"job_posted": {"push": false, "email": true, "inApp": true}, "booking_created": {"push": true, "email": true, "inApp": true}, "booking_accepted": {"push": true, "email": true, "inApp": true}, "booking_rejected": {"push": true, "email": true, "inApp": true}, "message_received": {"push": true, "email": false, "inApp": true}, "payment_received": {"push": true, "email": true, "inApp": true}, "profile_approved": {"push": true, "email": true, "inApp": true}, "profile_rejected": {"push": true, "email": true, "inApp": true}, "system_announcement": {"push": false, "email": true, "inApp": true}, "application_accepted": {"push": true, "email": true, "inApp": true}, "application_received": {"push": true, "email": true, "inApp": true}, "application_rejected": {"push": false, "email": true, "inApp": true}}'::jsonb,
    "created_at" timestamp with time zone DEFAULT now(),
    "updated_at" timestamp with time zone DEFAULT now()
);
ALTER TABLE public."notification_settings" ADD PRIMARY KEY ("id");

-- Table: notifications
CREATE TABLE IF NOT EXISTS public."notifications" (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "user_id" text DEFAULT NULL,
    "type" varchar(50) NOT NULL DEFAULT NULL,
    "title" varchar(255) NOT NULL DEFAULT NULL,
    "message" text NOT NULL DEFAULT NULL,
    "link" varchar(500) DEFAULT NULL,
    "action_url" varchar(500) DEFAULT NULL,
    "related_id" uuid DEFAULT NULL,
    "related_type" varchar(50) DEFAULT NULL,
    "read" boolean DEFAULT false,
    "read_at" timestamp with time zone DEFAULT NULL,
    "priority" varchar(20) DEFAULT 'normal'::character varying,
    "created_at" timestamp with time zone DEFAULT now(),
    "expires_at" timestamp with time zone DEFAULT NULL
);
ALTER TABLE public."notifications" ADD PRIMARY KEY ("id");

-- Table: page_views
CREATE TABLE IF NOT EXISTS public."page_views" (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "user_id" uuid DEFAULT NULL,
    "session_id" uuid NOT NULL DEFAULT NULL,
    "path" varchar(500) NOT NULL DEFAULT NULL,
    "page_title" varchar(255) DEFAULT NULL,
    "referrer" varchar(500) DEFAULT NULL,
    "user_agent" text DEFAULT NULL,
    "device_type" varchar(50) DEFAULT NULL,
    "browser" varchar(100) DEFAULT NULL,
    "os" varchar(100) DEFAULT NULL,
    "ip_address" inet DEFAULT NULL,
    "country" varchar(100) DEFAULT NULL,
    "city" varchar(100) DEFAULT NULL,
    "load_time" integer DEFAULT NULL,
    "duration" integer DEFAULT NULL,
    "viewed_at" timestamp with time zone DEFAULT now(),
    "created_at" timestamp with time zone DEFAULT now()
);
ALTER TABLE public."page_views" ADD PRIMARY KEY ("id");

-- Table: password_resets
CREATE TABLE IF NOT EXISTS public."password_resets" (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "user_id" uuid NOT NULL DEFAULT NULL,
    "email" text NOT NULL DEFAULT NULL,
    "token" text NOT NULL DEFAULT NULL,
    "expires_at" timestamp with time zone NOT NULL DEFAULT NULL,
    "created_at" timestamp with time zone NOT NULL DEFAULT now(),
    "updated_at" timestamp with time zone NOT NULL DEFAULT now(),
    "used_at" timestamp with time zone DEFAULT NULL,
    "status" text NOT NULL DEFAULT 'pending'::text,
    "ip_address" text DEFAULT NULL
);
ALTER TABLE public."password_resets" ADD PRIMARY KEY ("id");

-- Table: payment_idempotency
CREATE TABLE IF NOT EXISTS public."payment_idempotency" (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "key" text NOT NULL DEFAULT NULL,
    "user_id" uuid DEFAULT NULL,
    "operation_type" text NOT NULL DEFAULT NULL,
    "amount" integer NOT NULL DEFAULT NULL,
    "currency" text NOT NULL DEFAULT 'USD'::text,
    "stripe_payment_intent_id" text DEFAULT NULL,
    "stripe_charge_id" text DEFAULT NULL,
    "status" text DEFAULT 'pending'::text,
    "metadata" jsonb DEFAULT '{}'::jsonb,
    "created_at" timestamp with time zone DEFAULT now(),
    "processed_at" timestamp with time zone DEFAULT NULL,
    "expires_at" timestamp with time zone DEFAULT (now() + '01:00:00'::interval)
);
ALTER TABLE public."payment_idempotency" ADD PRIMARY KEY ("id");

-- Table: payment_methods
CREATE TABLE IF NOT EXISTS public."payment_methods" (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "user_id" text NOT NULL DEFAULT NULL,
    "stripe_payment_method_id" text DEFAULT NULL,
    "stripe_customer_id" text DEFAULT NULL,
    "method_type" text NOT NULL DEFAULT NULL,
    "card_brand" text DEFAULT NULL,
    "card_last4" text DEFAULT NULL,
    "card_exp_month" integer DEFAULT NULL,
    "card_exp_year" integer DEFAULT NULL,
    "is_default" boolean DEFAULT false,
    "is_verified" boolean DEFAULT false,
    "status" text NOT NULL DEFAULT 'active'::text,
    "billing_name" text NOT NULL DEFAULT NULL,
    "billing_email" text DEFAULT NULL,
    "billing_phone" text DEFAULT NULL,
    "billing_address" jsonb DEFAULT NULL,
    "nickname" text DEFAULT NULL,
    "metadata" jsonb DEFAULT '{}'::jsonb,
    "created_at" timestamp with time zone DEFAULT now(),
    "updated_at" timestamp with time zone DEFAULT now(),
    "last_used_at" timestamp with time zone DEFAULT NULL
);
ALTER TABLE public."payment_methods" ADD PRIMARY KEY ("id");

-- Table: payments
CREATE TABLE IF NOT EXISTS public."payments" (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "user_id" uuid DEFAULT NULL,
    "booking_id" uuid DEFAULT NULL,
    "subscription_id" uuid DEFAULT NULL,
    "amount" numeric NOT NULL DEFAULT NULL,
    "currency" text DEFAULT 'ETB'::text,
    "payment_method" text DEFAULT NULL,
    "payment_type" text NOT NULL DEFAULT NULL,
    "transaction_id" text DEFAULT NULL,
    "stripe_payment_intent_id" text DEFAULT NULL,
    "stripe_charge_id" text DEFAULT NULL,
    "reference_number" text DEFAULT NULL,
    "status" text NOT NULL DEFAULT 'pending'::text,
    "description" text DEFAULT NULL,
    "metadata" jsonb DEFAULT NULL,
    "receipt_url" text DEFAULT NULL,
    "failure_reason" text DEFAULT NULL,
    "error_code" text DEFAULT NULL,
    "created_at" timestamp with time zone DEFAULT now(),
    "processed_at" timestamp with time zone DEFAULT NULL,
    "completed_at" timestamp with time zone DEFAULT NULL
);
ALTER TABLE public."payments" ADD PRIMARY KEY ("id");

-- Table: payout_accounts
CREATE TABLE IF NOT EXISTS public."payout_accounts" (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "agency_id" uuid NOT NULL DEFAULT NULL,
    "account_type" varchar(50) NOT NULL DEFAULT NULL,
    "account_holder_name" varchar(255) NOT NULL DEFAULT NULL,
    "account_number_last4" varchar(4) DEFAULT NULL,
    "bank_name" varchar(255) DEFAULT NULL,
    "bank_code" varchar(50) DEFAULT NULL,
    "email" varchar(255) DEFAULT NULL,
    "phone_number" varchar(50) DEFAULT NULL,
    "stripe_account_id" varchar(255) DEFAULT NULL,
    "provider_account_id" varchar(255) DEFAULT NULL,
    "is_verified" boolean DEFAULT false,
    "is_default" boolean DEFAULT false,
    "verification_status" varchar(50) DEFAULT 'unverified'::character varying,
    "verified_at" timestamp with time zone DEFAULT NULL,
    "currency" varchar(3) DEFAULT 'AED'::character varying,
    "min_payout_amount" numeric DEFAULT 100.00,
    "max_payout_amount" numeric DEFAULT NULL,
    "status" varchar(50) DEFAULT 'active'::character varying,
    "country" varchar(2) DEFAULT NULL,
    "metadata" jsonb DEFAULT '{}'::jsonb,
    "created_at" timestamp with time zone DEFAULT now(),
    "updated_at" timestamp with time zone DEFAULT now(),
    "last_used_at" timestamp with time zone DEFAULT NULL
);
ALTER TABLE public."payout_accounts" ADD PRIMARY KEY ("id");

-- Table: payout_schedules
CREATE TABLE IF NOT EXISTS public."payout_schedules" (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "agency_id" uuid NOT NULL DEFAULT NULL,
    "frequency" varchar(50) NOT NULL DEFAULT NULL,
    "day_of_week" integer DEFAULT NULL,
    "day_of_month" integer DEFAULT NULL,
    "minimum_amount" numeric DEFAULT 100.00,
    "payout_account_id" uuid DEFAULT NULL,
    "is_active" boolean DEFAULT true,
    "paused_at" timestamp with time zone DEFAULT NULL,
    "paused_reason" text DEFAULT NULL,
    "next_payout_date" date DEFAULT NULL,
    "last_payout_date" date DEFAULT NULL,
    "created_at" timestamp with time zone DEFAULT now(),
    "updated_at" timestamp with time zone DEFAULT now()
);
ALTER TABLE public."payout_schedules" ADD PRIMARY KEY ("id");

-- Table: payouts
CREATE TABLE IF NOT EXISTS public."payouts" (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "payout_number" varchar(50) NOT NULL DEFAULT NULL,
    "user_id" varchar(128) NOT NULL DEFAULT NULL,
    "user_type" varchar(20) NOT NULL DEFAULT NULL,
    "amount" numeric NOT NULL DEFAULT NULL,
    "net_amount" numeric NOT NULL DEFAULT NULL,
    "currency" varchar(3) NOT NULL DEFAULT 'USD'::character varying,
    "processing_fee" numeric DEFAULT 0,
    "platform_fee" numeric DEFAULT 0,
    "status" varchar(20) NOT NULL DEFAULT 'pending'::character varying,
    "payout_method" varchar(30) NOT NULL DEFAULT NULL,
    "payout_destination" jsonb DEFAULT NULL,
    "description" text DEFAULT NULL,
    "notes" text DEFAULT NULL,
    "requested_at" timestamp with time zone DEFAULT now(),
    "processing_at" timestamp with time zone DEFAULT NULL,
    "completed_at" timestamp with time zone DEFAULT NULL,
    "failed_at" timestamp with time zone DEFAULT NULL,
    "failure_code" varchar(50) DEFAULT NULL,
    "failure_message" text DEFAULT NULL,
    "provider_reference" varchar(100) DEFAULT NULL,
    "stripe_payout_id" varchar(100) DEFAULT NULL,
    "stripe_transfer_id" varchar(100) DEFAULT NULL,
    "retry_count" integer DEFAULT 0,
    "metadata" jsonb DEFAULT '{}'::jsonb,
    "created_at" timestamp with time zone DEFAULT now(),
    "updated_at" timestamp with time zone DEFAULT now(),
    "created_by" varchar(128) DEFAULT NULL,
    "updated_by" varchar(128) DEFAULT NULL
);
ALTER TABLE public."payouts" ADD PRIMARY KEY ("id");

-- Table: phone_verification_log
CREATE TABLE IF NOT EXISTS public."phone_verification_log" (
    "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
    "phone_number" varchar(20) NOT NULL DEFAULT NULL,
    "verification_code_hash" varchar(255) DEFAULT NULL,
    "attempt_type" varchar(20) NOT NULL DEFAULT NULL,
    "success" boolean DEFAULT false,
    "error_message" text DEFAULT NULL,
    "ip_address" inet DEFAULT NULL,
    "user_agent" text DEFAULT NULL,
    "user_id" uuid DEFAULT NULL,
    "created_at" timestamp with time zone DEFAULT now()
);
ALTER TABLE public."phone_verification_log" ADD PRIMARY KEY ("id");

-- Table: phone_verifications
CREATE TABLE IF NOT EXISTS public."phone_verifications" (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "phone" text NOT NULL DEFAULT NULL,
    "code" text NOT NULL DEFAULT NULL,
    "expires_at" timestamp with time zone NOT NULL DEFAULT NULL,
    "attempts" integer NOT NULL DEFAULT 0,
    "verified" boolean NOT NULL DEFAULT false,
    "verified_at" timestamp with time zone DEFAULT NULL,
    "created_at" timestamp with time zone NOT NULL DEFAULT now(),
    "updated_at" timestamp with time zone NOT NULL DEFAULT now()
);
ALTER TABLE public."phone_verifications" ADD PRIMARY KEY ("id");

-- Table: pii_access_log
CREATE TABLE IF NOT EXISTS public."pii_access_log" (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "user_id" uuid DEFAULT NULL,
    "table_name" text NOT NULL DEFAULT NULL,
    "record_id" uuid NOT NULL DEFAULT NULL,
    "field_name" text NOT NULL DEFAULT NULL,
    "operation" text NOT NULL DEFAULT NULL,
    "ip_address" inet DEFAULT NULL,
    "user_agent" text DEFAULT NULL,
    "accessed_at" timestamp with time zone DEFAULT now(),
    "session_id" text DEFAULT NULL
);
ALTER TABLE public."pii_access_log" ADD PRIMARY KEY ("id");

-- Table: placement_contracts
CREATE TABLE IF NOT EXISTS public."placement_contracts" (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "placement_id" uuid NOT NULL DEFAULT NULL,
    "agency_id" uuid NOT NULL DEFAULT NULL,
    "maid_id" uuid DEFAULT NULL,
    "sponsor_id" uuid DEFAULT NULL,
    "fee_transaction_id" uuid DEFAULT NULL,
    "contract_start_date" date DEFAULT NULL,
    "contract_end_date" date DEFAULT NULL,
    "contract_duration_months" integer DEFAULT NULL,
    "visa_application_date" date DEFAULT NULL,
    "visa_approval_date" date DEFAULT NULL,
    "visa_rejection_date" date DEFAULT NULL,
    "visa_expiry_date" date DEFAULT NULL,
    "maid_arrival_date" date DEFAULT NULL,
    "maid_return_date" date DEFAULT NULL,
    "maid_return_reason" text DEFAULT NULL,
    "contract_status" varchar(50) DEFAULT 'pending_visa'::character varying,
    "notes" text DEFAULT NULL,
    "metadata" jsonb DEFAULT '{}'::jsonb,
    "created_at" timestamp with time zone DEFAULT now(),
    "updated_at" timestamp with time zone DEFAULT now(),
    "destination_country" varchar(100) DEFAULT NULL,
    "destination_city" varchar(100) DEFAULT NULL,
    "destination_region" varchar(100) DEFAULT NULL
);
ALTER TABLE public."placement_contracts" ADD PRIMARY KEY ("id");

-- Table: placement_fee_transactions
CREATE TABLE IF NOT EXISTS public."placement_fee_transactions" (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "agency_id" uuid NOT NULL DEFAULT NULL,
    "maid_id" uuid DEFAULT NULL,
    "sponsor_id" uuid DEFAULT NULL,
    "job_id" uuid DEFAULT NULL,
    "placement_id" uuid DEFAULT NULL,
    "fee_amount" numeric NOT NULL DEFAULT 500.00,
    "currency" varchar(3) DEFAULT 'AED'::character varying,
    "credits_applied" numeric DEFAULT 0.00,
    "amount_charged" numeric NOT NULL DEFAULT NULL,
    "fee_status" varchar(50) NOT NULL DEFAULT 'escrow'::character varying,
    "visa_status" varchar(50) DEFAULT 'pending_visa'::character varying,
    "payment_reference" varchar(255) DEFAULT NULL,
    "payment_method" varchar(50) DEFAULT NULL,
    "deducted_at" timestamp with time zone DEFAULT now(),
    "escrow_until" timestamp with time zone DEFAULT NULL,
    "released_at" timestamp with time zone DEFAULT NULL,
    "credited_at" timestamp with time zone DEFAULT NULL,
    "refunded_at" timestamp with time zone DEFAULT NULL,
    "notes" text DEFAULT NULL,
    "metadata" jsonb DEFAULT '{}'::jsonb,
    "created_at" timestamp with time zone DEFAULT now(),
    "updated_at" timestamp with time zone DEFAULT now()
);
ALTER TABLE public."placement_fee_transactions" ADD PRIMARY KEY ("id");

-- Table: placement_workflows
CREATE TABLE IF NOT EXISTS public."placement_workflows" (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "sponsor_id" varchar(255) NOT NULL DEFAULT NULL,
    "agency_id" varchar(255) DEFAULT NULL,
    "maid_id" varchar(255) NOT NULL DEFAULT NULL,
    "status" varchar(50) NOT NULL DEFAULT 'contact_initiated'::character varying,
    "platform_fee_amount" numeric DEFAULT NULL,
    "platform_fee_currency" varchar(3) DEFAULT NULL,
    "fee_status" varchar(20) DEFAULT 'pending'::character varying,
    "contact_date" timestamp with time zone DEFAULT now(),
    "interview_scheduled_date" timestamp with time zone DEFAULT NULL,
    "interview_completed_date" timestamp with time zone DEFAULT NULL,
    "trial_start_date" timestamp with time zone DEFAULT NULL,
    "trial_end_date" timestamp with time zone DEFAULT NULL,
    "placement_confirmed_date" timestamp with time zone DEFAULT NULL,
    "sponsor_confirmed" boolean DEFAULT false,
    "agency_confirmed" boolean DEFAULT false,
    "interview_outcome" varchar(30) DEFAULT NULL,
    "trial_outcome" varchar(30) DEFAULT NULL,
    "failure_reason" text DEFAULT NULL,
    "failure_stage" varchar(50) DEFAULT NULL,
    "guarantee_end_date" timestamp with time zone DEFAULT NULL,
    "guarantee_claimed" boolean DEFAULT false,
    "last_activity_date" timestamp with time zone DEFAULT now(),
    "reminder_sent_count" integer DEFAULT 0,
    "notes" jsonb DEFAULT '[]'::jsonb,
    "metadata" jsonb DEFAULT '{}'::jsonb,
    "created_at" timestamp with time zone DEFAULT now(),
    "updated_at" timestamp with time zone DEFAULT now(),
    "created_by" varchar(255) DEFAULT NULL,
    "updated_by" varchar(255) DEFAULT NULL
);
ALTER TABLE public."placement_workflows" ADD PRIMARY KEY ("id");

-- Table: platform_announcements
CREATE TABLE IF NOT EXISTS public."platform_announcements" (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "type" varchar(50) NOT NULL DEFAULT NULL,
    "title" text NOT NULL DEFAULT NULL,
    "message" text NOT NULL DEFAULT NULL,
    "icon" varchar(50) DEFAULT NULL,
    "color" varchar(50) DEFAULT 'blue'::character varying,
    "priority" integer DEFAULT 0,
    "is_active" boolean DEFAULT true,
    "start_date" timestamp with time zone DEFAULT now(),
    "end_date" timestamp with time zone DEFAULT NULL,
    "target_audience" varchar(50) DEFAULT NULL,
    "url" text DEFAULT NULL,
    "created_by" uuid DEFAULT NULL,
    "created_at" timestamp with time zone DEFAULT now(),
    "updated_at" timestamp with time zone DEFAULT now()
);
ALTER TABLE public."platform_announcements" ADD PRIMARY KEY ("id");

-- Table: platform_fee_requirements
CREATE TABLE IF NOT EXISTS public."platform_fee_requirements" (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "country_code" varchar(3) NOT NULL DEFAULT NULL,
    "country_name" varchar(100) NOT NULL DEFAULT NULL,
    "currency" varchar(3) NOT NULL DEFAULT NULL,
    "amount" numeric NOT NULL DEFAULT NULL,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT now(),
    "updated_at" timestamp with time zone DEFAULT now()
);
ALTER TABLE public."platform_fee_requirements" ADD PRIMARY KEY ("id");

-- Table: platform_settings
CREATE TABLE IF NOT EXISTS public."platform_settings" (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "platform_name" text DEFAULT 'Ethiopian Maids'::text,
    "support_email" text DEFAULT NULL,
    "support_phone" text DEFAULT NULL,
    "working_hours" text DEFAULT NULL,
    "available_services" text[] DEFAULT NULL,
    "about_platform" text DEFAULT NULL,
    "whatsapp_webhook_url" text DEFAULT NULL,
    "ai_model" text DEFAULT 'claude-3-5-sonnet-20241022'::text,
    "ai_temperature" numeric DEFAULT 0.7,
    "created_at" timestamp with time zone DEFAULT now(),
    "updated_at" timestamp with time zone DEFAULT now(),
    "max_context_messages" integer DEFAULT 20,
    "auto_response_enabled" boolean DEFAULT true,
    "business_hours_only" boolean DEFAULT false,
    "system_prompt" text DEFAULT NULL,
    "greeting_message" text DEFAULT NULL,
    "offline_message" text DEFAULT NULL,
    "error_message" text DEFAULT NULL,
    "validate_signature" boolean DEFAULT false,
    "rate_limiting_enabled" boolean DEFAULT false,
    "rate_limit" integer DEFAULT 5,
    "notify_new_messages" boolean DEFAULT false,
    "notify_bookings" boolean DEFAULT true,
    "notify_errors" boolean DEFAULT true,
    "notification_email" text DEFAULT NULL,
    "auto_confirm_bookings" boolean DEFAULT false,
    "send_reminders" boolean DEFAULT false,
    "send_followups" boolean DEFAULT false,
    "max_tokens" integer DEFAULT 1024,
    "timeout" integer DEFAULT 30,
    "debug_mode" boolean DEFAULT false,
    "store_ai_responses" boolean DEFAULT true,
    "allowed_numbers" text DEFAULT NULL,
    "blocked_numbers" text DEFAULT NULL,
    "cache_timeout" integer DEFAULT 5
);
ALTER TABLE public."platform_settings" ADD PRIMARY KEY ("id");

-- Table: profile_edit_requests
CREATE TABLE IF NOT EXISTS public."profile_edit_requests" (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "agency_id" text NOT NULL DEFAULT NULL,
    "requested_changes" jsonb NOT NULL DEFAULT NULL,
    "original_data" jsonb DEFAULT NULL,
    "reason" text DEFAULT NULL,
    "status" text NOT NULL DEFAULT 'pending'::text,
    "reviewed_by" text DEFAULT NULL,
    "reviewed_at" timestamp with time zone DEFAULT NULL,
    "rejection_reason" text DEFAULT NULL,
    "created_at" timestamp with time zone DEFAULT now(),
    "updated_at" timestamp with time zone DEFAULT now()
);
ALTER TABLE public."profile_edit_requests" ADD PRIMARY KEY ("id");

-- Table: profiles
CREATE TABLE IF NOT EXISTS public."profiles" (
    "id" text NOT NULL DEFAULT NULL,
    "email" varchar(NULL) NOT NULL DEFAULT NULL,
    "full_name" varchar(255) DEFAULT NULL,
    "user_type" varchar(20) NOT NULL DEFAULT NULL,
    "phone" varchar(20) DEFAULT NULL,
    "country" varchar(100) DEFAULT NULL,
    "avatar_url" text DEFAULT NULL,
    "registration_complete" boolean DEFAULT false,
    "is_active" boolean DEFAULT true,
    "last_seen" timestamp with time zone DEFAULT now(),
    "created_at" timestamp with time zone DEFAULT now(),
    "updated_at" timestamp with time zone DEFAULT now(),
    "phone_verified" boolean DEFAULT false,
    "phone_verified_at" timestamp with time zone DEFAULT NULL,
    "phone_verification_attempts" integer DEFAULT 0,
    "phone_verification_last_attempt" timestamp with time zone DEFAULT NULL,
    "verification_status" varchar(20) DEFAULT 'pending'::character varying,
    "profile_completion" integer DEFAULT 0,
    "rating" numeric DEFAULT 0,
    "total_reviews" integer DEFAULT 0,
    "preferred_language" text[] DEFAULT NULL,
    "subscription_status" varchar(20) DEFAULT 'basic'::character varying,
    "trust_score" integer DEFAULT 0,
    "employment_history_length" integer DEFAULT 0,
    "active_requests" integer DEFAULT 0,
    "hired_maids" integer DEFAULT 0,
    "total_spent" numeric DEFAULT 0,
    "location" varchar(255) DEFAULT NULL,
    "available" boolean DEFAULT true,
    "years_experience" integer DEFAULT 0,
    "is_online" boolean DEFAULT false,
    "last_activity_at" timestamp with time zone DEFAULT now(),
    "is_typing" boolean DEFAULT false,
    "typing_in_conversation_id" uuid DEFAULT NULL
);
ALTER TABLE public."profiles" ADD PRIMARY KEY ("id");

-- Table: reviews
CREATE TABLE IF NOT EXISTS public."reviews" (
    "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
    "maid_id" uuid DEFAULT NULL,
    "sponsor_id" uuid DEFAULT NULL,
    "rating" integer DEFAULT NULL,
    "comment" text DEFAULT NULL,
    "created_at" timestamp with time zone DEFAULT now()
);
ALTER TABLE public."reviews" ADD PRIMARY KEY ("id");

-- Table: security_events
CREATE TABLE IF NOT EXISTS public."security_events" (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "event_type" text NOT NULL DEFAULT NULL,
    "severity" text NOT NULL DEFAULT NULL,
    "details" jsonb NOT NULL DEFAULT '{}'::jsonb,
    "requires_action" boolean DEFAULT false,
    "handled" boolean DEFAULT false,
    "handled_by" uuid DEFAULT NULL,
    "handled_at" timestamp with time zone DEFAULT NULL,
    "created_at" timestamp with time zone DEFAULT now()
);
ALTER TABLE public."security_events" ADD PRIMARY KEY ("id");

-- Table: shortlist_candidates
CREATE TABLE IF NOT EXISTS public."shortlist_candidates" (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "shortlist_id" uuid NOT NULL DEFAULT NULL,
    "maid_id" uuid NOT NULL DEFAULT NULL,
    "match_score" integer DEFAULT 0,
    "notes" text DEFAULT NULL,
    "added_by" uuid DEFAULT NULL,
    "added_at" timestamp with time zone DEFAULT now()
);
ALTER TABLE public."shortlist_candidates" ADD PRIMARY KEY ("id");

-- Table: shortlists
CREATE TABLE IF NOT EXISTS public."shortlists" (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "agency_id" text NOT NULL DEFAULT NULL,
    "job_id" uuid DEFAULT NULL,
    "name" varchar(255) NOT NULL DEFAULT NULL,
    "description" text DEFAULT NULL,
    "status" varchar(20) DEFAULT 'active'::character varying,
    "priority" varchar(20) DEFAULT 'normal'::character varying,
    "tags" text[] DEFAULT '{}'::text[],
    "created_by" text DEFAULT NULL,
    "metadata" jsonb DEFAULT '{}'::jsonb,
    "created_at" timestamp with time zone DEFAULT now(),
    "updated_at" timestamp with time zone DEFAULT now()
);
ALTER TABLE public."shortlists" ADD PRIMARY KEY ("id");

-- Table: skills
CREATE TABLE IF NOT EXISTS public."skills" (
    "id" integer NOT NULL,
    "name" varchar(100) NOT NULL DEFAULT NULL,
    "category" varchar(50) NOT NULL DEFAULT NULL,
    "description" text DEFAULT NULL,
    "created_at" timestamp with time zone DEFAULT now(),
    "updated_at" timestamp with time zone DEFAULT now()
);
ALTER TABLE public."skills" ADD PRIMARY KEY ("id");

-- Table: sponsor_document_verification
CREATE TABLE IF NOT EXISTS public."sponsor_document_verification" (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "sponsor_id" uuid NOT NULL DEFAULT NULL,
    "id_type" varchar(50) NOT NULL DEFAULT NULL,
    "id_number" varchar(100) NOT NULL DEFAULT NULL,
    "residence_country" varchar(100) NOT NULL DEFAULT NULL,
    "contact_phone" varchar(20) NOT NULL DEFAULT NULL,
    "id_file_front_url" text DEFAULT NULL,
    "id_file_front_name" varchar(255) DEFAULT NULL,
    "id_file_front_size" integer DEFAULT NULL,
    "id_file_front_mime_type" varchar(100) DEFAULT NULL,
    "id_file_back_url" text DEFAULT NULL,
    "id_file_back_name" varchar(255) DEFAULT NULL,
    "id_file_back_size" integer DEFAULT NULL,
    "id_file_back_mime_type" varchar(100) DEFAULT NULL,
    "employment_proof_type" varchar(50) NOT NULL DEFAULT NULL,
    "employment_proof_url" text DEFAULT NULL,
    "employment_proof_name" varchar(255) DEFAULT NULL,
    "employment_proof_size" integer DEFAULT NULL,
    "employment_proof_mime_type" varchar(100) DEFAULT NULL,
    "verification_status" varchar(20) DEFAULT 'pending'::character varying,
    "verification_notes" text DEFAULT NULL,
    "verified_by" uuid DEFAULT NULL,
    "verified_at" timestamp with time zone DEFAULT NULL,
    "submission_count" integer DEFAULT 1,
    "last_submission_at" timestamp with time zone DEFAULT now(),
    "created_at" timestamp with time zone DEFAULT now(),
    "updated_at" timestamp with time zone DEFAULT now()
);
ALTER TABLE public."sponsor_document_verification" ADD PRIMARY KEY ("id");

-- Table: sponsor_jobs
CREATE TABLE IF NOT EXISTS public."sponsor_jobs" (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "sponsor_id" uuid NOT NULL DEFAULT NULL,
    "job_id" uuid DEFAULT NULL,
    "status" varchar(20) DEFAULT 'active'::character varying,
    "created_at" timestamp with time zone DEFAULT now(),
    "completed_at" timestamp with time zone DEFAULT NULL
);
ALTER TABLE public."sponsor_jobs" ADD PRIMARY KEY ("id");

-- Table: sponsor_profiles
CREATE TABLE IF NOT EXISTS public."sponsor_profiles" (
    "id" text NOT NULL DEFAULT NULL,
    "full_name" varchar(255) NOT NULL DEFAULT NULL,
    "household_size" integer DEFAULT 1,
    "number_of_children" integer DEFAULT 0,
    "children_ages" int4[] DEFAULT NULL,
    "elderly_care_needed" boolean DEFAULT false,
    "pets" boolean DEFAULT false,
    "pet_types" text[] DEFAULT NULL,
    "city" varchar(100) DEFAULT NULL,
    "country" varchar(100) DEFAULT NULL,
    "address" text DEFAULT NULL,
    "accommodation_type" varchar(50) DEFAULT NULL,
    "preferred_nationality" text[] DEFAULT NULL,
    "preferred_experience_years" integer DEFAULT 0,
    "required_skills" text[] DEFAULT NULL,
    "preferred_languages" text[] DEFAULT NULL,
    "salary_budget_min" integer DEFAULT NULL,
    "salary_budget_max" integer DEFAULT NULL,
    "currency" varchar(3) DEFAULT 'USD'::character varying,
    "live_in_required" boolean DEFAULT true,
    "working_hours_per_day" integer DEFAULT 8,
    "days_off_per_week" integer DEFAULT 1,
    "overtime_available" boolean DEFAULT false,
    "additional_benefits" text[] DEFAULT NULL,
    "identity_verified" boolean DEFAULT false,
    "background_check_completed" boolean DEFAULT false,
    "active_job_postings" integer DEFAULT 0,
    "total_hires" integer DEFAULT 0,
    "average_rating" numeric DEFAULT 0.00,
    "created_at" timestamp with time zone DEFAULT now(),
    "updated_at" timestamp with time zone DEFAULT now(),
    "religion" varchar(50) DEFAULT NULL,
    "avatar_url" text DEFAULT NULL,
    "profile_completed" boolean DEFAULT false,
    "phone_number" varchar(20) DEFAULT NULL,
    "phone_verified" boolean DEFAULT false,
    "phone_verified_at" timestamp with time zone DEFAULT NULL,
    "two_factor_enabled" boolean DEFAULT false,
    "two_factor_method" varchar(20) DEFAULT 'none'::character varying,
    "onboarding_completed" boolean DEFAULT false,
    "onboarding_completed_at" timestamp with time zone DEFAULT NULL,
    "profile_completed_at" timestamp with time zone DEFAULT NULL
);
ALTER TABLE public."sponsor_profiles" ADD PRIMARY KEY ("id");

-- Table: sponsors
CREATE TABLE IF NOT EXISTS public."sponsors" (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "agency_id" text NOT NULL DEFAULT NULL,
    "profile_id" uuid DEFAULT NULL,
    "full_name" varchar(255) DEFAULT NULL,
    "email" varchar(255) DEFAULT NULL,
    "phone" varchar(50) DEFAULT NULL,
    "location" varchar(255) DEFAULT NULL,
    "sponsor_type" varchar(20) DEFAULT 'individual'::character varying,
    "status" varchar(20) DEFAULT 'pending'::character varying,
    "verification_status" varchar(50) DEFAULT 'pending_documents'::character varying,
    "profile_image" text DEFAULT NULL,
    "company_name" varchar(255) DEFAULT NULL,
    "company_registration" varchar(100) DEFAULT NULL,
    "preferred_maid_type" varchar(100) DEFAULT NULL,
    "budget_range" varchar(50) DEFAULT NULL,
    "household_size" integer DEFAULT NULL,
    "special_requirements" text DEFAULT NULL,
    "rating" numeric DEFAULT 0,
    "total_reviews" integer DEFAULT 0,
    "total_jobs" integer DEFAULT 0,
    "active_jobs" integer DEFAULT 0,
    "completed_jobs" integer DEFAULT 0,
    "hired_maids" integer DEFAULT 0,
    "total_spent" numeric DEFAULT 0,
    "preferred_contact_method" varchar(20) DEFAULT 'email'::character varying,
    "preferred_language" varchar(10) DEFAULT 'en'::character varying,
    "notes" text DEFAULT NULL,
    "created_at" timestamp with time zone DEFAULT now(),
    "updated_at" timestamp with time zone DEFAULT now(),
    "last_contact_date" timestamp with time zone DEFAULT NULL,
    "metadata" jsonb DEFAULT '{}'::jsonb
);
ALTER TABLE public."sponsors" ADD PRIMARY KEY ("id");

-- Table: subscription_limits
CREATE TABLE IF NOT EXISTS public."subscription_limits" (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "plan_type" text NOT NULL DEFAULT NULL,
    "user_type" text NOT NULL DEFAULT NULL,
    "message_threads_limit" integer DEFAULT NULL,
    "messages_per_day_limit" integer DEFAULT NULL,
    "profile_views_limit" integer DEFAULT NULL,
    "job_applications_limit" integer DEFAULT NULL,
    "job_postings_limit" integer DEFAULT NULL,
    "candidate_searches_limit" integer DEFAULT NULL,
    "candidates_saved_limit" integer DEFAULT NULL,
    "maid_listings_limit" integer DEFAULT NULL,
    "sponsor_connections_limit" integer DEFAULT NULL,
    "bulk_uploads_limit" integer DEFAULT NULL,
    "has_analytics" boolean DEFAULT false,
    "has_verification_badge" boolean DEFAULT false,
    "has_priority_support" boolean DEFAULT false,
    "has_api_access" boolean DEFAULT false,
    "has_white_label" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT now(),
    "updated_at" timestamp with time zone DEFAULT now()
);
ALTER TABLE public."subscription_limits" ADD PRIMARY KEY ("id");

-- Table: subscription_status_log
CREATE TABLE IF NOT EXISTS public."subscription_status_log" (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "subscription_id" uuid NOT NULL DEFAULT NULL,
    "old_status" text DEFAULT NULL,
    "new_status" text NOT NULL DEFAULT NULL,
    "reason" text DEFAULT NULL,
    "metadata" jsonb DEFAULT '{}'::jsonb,
    "created_at" timestamp with time zone DEFAULT now(),
    "created_by" uuid DEFAULT NULL
);
ALTER TABLE public."subscription_status_log" ADD PRIMARY KEY ("id");

-- Table: subscription_usage
CREATE TABLE IF NOT EXISTS public."subscription_usage" (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "user_id" uuid NOT NULL DEFAULT NULL,
    "subscription_id" uuid DEFAULT NULL,
    "period_start" date NOT NULL DEFAULT NULL,
    "period_end" date NOT NULL DEFAULT NULL,
    "message_threads_used" integer DEFAULT 0,
    "messages_sent" integer DEFAULT 0,
    "profile_views" integer DEFAULT 0,
    "job_applications_submitted" integer DEFAULT 0,
    "job_postings_active" integer DEFAULT 0,
    "candidate_searches_performed" integer DEFAULT 0,
    "candidates_saved" integer DEFAULT 0,
    "maid_listings_active" integer DEFAULT 0,
    "sponsor_connections" integer DEFAULT 0,
    "bulk_uploads_performed" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT now(),
    "updated_at" timestamp with time zone DEFAULT now()
);
ALTER TABLE public."subscription_usage" ADD PRIMARY KEY ("id");

-- Table: subscriptions
CREATE TABLE IF NOT EXISTS public."subscriptions" (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "user_id" text DEFAULT NULL,
    "plan_id" text NOT NULL DEFAULT NULL,
    "plan_name" text NOT NULL DEFAULT NULL,
    "plan_type" text DEFAULT NULL,
    "amount" numeric NOT NULL DEFAULT NULL,
    "currency" text DEFAULT 'ETB'::text,
    "billing_period" text DEFAULT NULL,
    "status" text NOT NULL DEFAULT 'active'::text,
    "start_date" date NOT NULL DEFAULT NULL,
    "end_date" date DEFAULT NULL,
    "trial_end_date" date DEFAULT NULL,
    "cancelled_at" timestamp with time zone DEFAULT NULL,
    "stripe_subscription_id" text DEFAULT NULL,
    "stripe_customer_id" text DEFAULT NULL,
    "features" jsonb DEFAULT NULL,
    "metadata" jsonb DEFAULT NULL,
    "created_at" timestamp with time zone DEFAULT now(),
    "updated_at" timestamp with time zone DEFAULT now(),
    "expires_at" timestamp with time zone DEFAULT NULL,
    "payment_status" varchar(50) DEFAULT 'pending'::character varying,
    "grace_period_ends" timestamp with time zone DEFAULT NULL,
    "last_payment_attempt" timestamp with time zone DEFAULT NULL,
    "payment_retry_count" integer DEFAULT 0,
    "user_type" text DEFAULT NULL
);
ALTER TABLE public."subscriptions" ADD PRIMARY KEY ("id");

-- Table: support_agents
CREATE TABLE IF NOT EXISTS public."support_agents" (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "user_id" uuid NOT NULL DEFAULT NULL,
    "agent_name" text NOT NULL DEFAULT NULL,
    "agent_email" text NOT NULL DEFAULT NULL,
    "department" text DEFAULT 'general'::text,
    "status" text NOT NULL DEFAULT 'offline'::text,
    "is_available" boolean DEFAULT true,
    "specialties" text[] DEFAULT '{}'::text[],
    "languages" text[] DEFAULT '{English}'::text[],
    "total_tickets" integer DEFAULT 0,
    "resolved_tickets" integer DEFAULT 0,
    "average_response_time" interval DEFAULT NULL,
    "satisfaction_rating" numeric DEFAULT NULL,
    "working_hours" jsonb DEFAULT '{"friday": {"end": "22:00", "start": "08:00"}, "monday": {"end": "22:00", "start": "08:00"}, "sunday": {"end": "20:00", "start": "10:00"}, "tuesday": {"end": "22:00", "start": "08:00"}, "saturday": {"end": "22:00", "start": "08:00"}, "thursday": {"end": "22:00", "start": "08:00"}, "wednesday": {"end": "22:00", "start": "08:00"}}'::jsonb,
    "created_at" timestamp with time zone DEFAULT now(),
    "updated_at" timestamp with time zone DEFAULT now(),
    "last_active_at" timestamp with time zone DEFAULT now(),
    "metadata" jsonb DEFAULT '{}'::jsonb
);
ALTER TABLE public."support_agents" ADD PRIMARY KEY ("id");

-- Table: support_interactions
CREATE TABLE IF NOT EXISTS public."support_interactions" (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "user_id" uuid DEFAULT NULL,
    "interaction_type" text NOT NULL DEFAULT NULL,
    "page_url" text DEFAULT NULL,
    "user_agent" text DEFAULT NULL,
    "session_id" text DEFAULT NULL,
    "interaction_data" jsonb DEFAULT '{}'::jsonb,
    "created_at" timestamp with time zone DEFAULT now(),
    "metadata" jsonb DEFAULT '{}'::jsonb
);
ALTER TABLE public."support_interactions" ADD PRIMARY KEY ("id");

-- Table: support_messages
CREATE TABLE IF NOT EXISTS public."support_messages" (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "ticket_id" uuid NOT NULL DEFAULT NULL,
    "sender_id" uuid DEFAULT NULL,
    "sender_name" text NOT NULL DEFAULT NULL,
    "sender_type" text NOT NULL DEFAULT NULL,
    "message" text NOT NULL DEFAULT NULL,
    "message_type" text DEFAULT 'text'::text,
    "attachments" jsonb DEFAULT '[]'::jsonb,
    "is_internal" boolean DEFAULT false,
    "is_read" boolean DEFAULT false,
    "read_at" timestamp with time zone DEFAULT NULL,
    "created_at" timestamp with time zone DEFAULT now(),
    "updated_at" timestamp with time zone DEFAULT now(),
    "metadata" jsonb DEFAULT '{}'::jsonb
);
ALTER TABLE public."support_messages" ADD PRIMARY KEY ("id");

-- Table: support_tickets
CREATE TABLE IF NOT EXISTS public."support_tickets" (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "user_id" uuid DEFAULT NULL,
    "user_name" text NOT NULL DEFAULT NULL,
    "user_type" text NOT NULL DEFAULT NULL,
    "user_email" text NOT NULL DEFAULT NULL,
    "subject" text DEFAULT NULL,
    "message" text NOT NULL DEFAULT NULL,
    "category" text NOT NULL DEFAULT 'general'::text,
    "priority" text NOT NULL DEFAULT 'normal'::text,
    "status" text NOT NULL DEFAULT 'open'::text,
    "assigned_agent_id" uuid DEFAULT NULL,
    "assigned_agent_name" text DEFAULT NULL,
    "current_page" text DEFAULT NULL,
    "user_agent" text DEFAULT NULL,
    "browser_info" jsonb DEFAULT NULL,
    "created_at" timestamp with time zone DEFAULT now(),
    "updated_at" timestamp with time zone DEFAULT now(),
    "resolved_at" timestamp with time zone DEFAULT NULL,
    "closed_at" timestamp with time zone DEFAULT NULL,
    "first_response_at" timestamp with time zone DEFAULT NULL,
    "last_response_at" timestamp with time zone DEFAULT NULL,
    "response_count" integer DEFAULT 0,
    "satisfaction_rating" integer DEFAULT NULL,
    "feedback_comment" text DEFAULT NULL,
    "internal_notes" text DEFAULT NULL,
    "tags" text[] DEFAULT NULL,
    "metadata" jsonb DEFAULT '{}'::jsonb
);
ALTER TABLE public."support_tickets" ADD PRIMARY KEY ("id");

-- Table: system_settings
CREATE TABLE IF NOT EXISTS public."system_settings" (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "setting_key" text NOT NULL DEFAULT NULL,
    "setting_value" jsonb NOT NULL DEFAULT NULL,
    "description" text DEFAULT NULL,
    "updated_by" uuid DEFAULT NULL,
    "updated_at" timestamp with time zone DEFAULT now()
);
ALTER TABLE public."system_settings" ADD PRIMARY KEY ("id");

-- Table: team_member_performance
CREATE TABLE IF NOT EXISTS public."team_member_performance" (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "team_member_id" uuid NOT NULL DEFAULT NULL,
    "agency_id" uuid NOT NULL DEFAULT NULL,
    "month" date NOT NULL DEFAULT NULL,
    "placements_count" integer DEFAULT 0,
    "interviews_conducted" integer DEFAULT 0,
    "applications_processed" integer DEFAULT 0,
    "revenue_generated" numeric DEFAULT 0.00,
    "average_time_to_hire" numeric DEFAULT NULL,
    "conversion_rate" numeric DEFAULT NULL,
    "client_satisfaction_avg" numeric DEFAULT NULL,
    "performance_score" numeric DEFAULT NULL,
    "created_at" timestamp with time zone DEFAULT now(),
    "updated_at" timestamp with time zone DEFAULT now()
);
ALTER TABLE public."team_member_performance" ADD PRIMARY KEY ("id");

-- Table: two_factor_backup_codes
CREATE TABLE IF NOT EXISTS public."two_factor_backup_codes" (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "user_id" uuid NOT NULL DEFAULT NULL,
    "code" varchar(10) NOT NULL DEFAULT NULL,
    "used" boolean DEFAULT false,
    "used_at" timestamp with time zone DEFAULT NULL,
    "created_at" timestamp with time zone DEFAULT now()
);
ALTER TABLE public."two_factor_backup_codes" ADD PRIMARY KEY ("id");

-- Table: user_credits
CREATE TABLE IF NOT EXISTS public."user_credits" (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "user_id" uuid DEFAULT NULL,
    "credits_available" integer NOT NULL DEFAULT 0,
    "credits_total_purchased" integer NOT NULL DEFAULT 0,
    "last_purchase_at" timestamp with time zone DEFAULT NULL,
    "created_at" timestamp with time zone DEFAULT now(),
    "updated_at" timestamp with time zone DEFAULT now()
);
ALTER TABLE public."user_credits" ADD PRIMARY KEY ("id");

-- Table: user_events
CREATE TABLE IF NOT EXISTS public."user_events" (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "user_id" uuid DEFAULT NULL,
    "session_id" uuid NOT NULL DEFAULT NULL,
    "event_name" varchar(100) NOT NULL DEFAULT NULL,
    "event_category" varchar(50) DEFAULT NULL,
    "event_action" varchar(100) DEFAULT NULL,
    "event_label" varchar(255) DEFAULT NULL,
    "event_value" numeric DEFAULT NULL,
    "page_path" varchar(500) DEFAULT NULL,
    "element_id" varchar(100) DEFAULT NULL,
    "element_text" varchar(255) DEFAULT NULL,
    "properties" jsonb DEFAULT NULL,
    "occurred_at" timestamp with time zone DEFAULT now(),
    "created_at" timestamp with time zone DEFAULT now()
);
ALTER TABLE public."user_events" ADD PRIMARY KEY ("id");

-- Table: user_sessions
CREATE TABLE IF NOT EXISTS public."user_sessions" (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "user_id" uuid DEFAULT NULL,
    "session_start" timestamp with time zone DEFAULT now(),
    "session_end" timestamp with time zone DEFAULT NULL,
    "duration" integer DEFAULT NULL,
    "entry_page" varchar(500) DEFAULT NULL,
    "exit_page" varchar(500) DEFAULT NULL,
    "page_views_count" integer DEFAULT 0,
    "events_count" integer DEFAULT 0,
    "device_type" varchar(50) DEFAULT NULL,
    "browser" varchar(100) DEFAULT NULL,
    "os" varchar(100) DEFAULT NULL,
    "country" varchar(100) DEFAULT NULL,
    "city" varchar(100) DEFAULT NULL,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT now(),
    "updated_at" timestamp with time zone DEFAULT now()
);
ALTER TABLE public."user_sessions" ADD PRIMARY KEY ("id");

-- Table: video_interviews
CREATE TABLE IF NOT EXISTS public."video_interviews" (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "maid_id" uuid DEFAULT NULL,
    "sponsor_id" uuid DEFAULT NULL,
    "sponsor_phone" text NOT NULL DEFAULT NULL,
    "sponsor_name" text DEFAULT NULL,
    "maid_phone" text DEFAULT NULL,
    "scheduled_date" timestamp with time zone NOT NULL DEFAULT NULL,
    "duration_minutes" integer DEFAULT 30,
    "timezone" text DEFAULT 'Asia/Dubai'::text,
    "interview_type" text DEFAULT 'whatsapp_video'::text,
    "meeting_link" text DEFAULT NULL,
    "meeting_id" text DEFAULT NULL,
    "meeting_password" text DEFAULT NULL,
    "status" text DEFAULT 'scheduled'::text,
    "notes" text DEFAULT NULL,
    "sponsor_notes" text DEFAULT NULL,
    "maid_notes" text DEFAULT NULL,
    "sponsor_rating" integer DEFAULT NULL,
    "maid_rating" integer DEFAULT NULL,
    "sponsor_feedback" text DEFAULT NULL,
    "maid_feedback" text DEFAULT NULL,
    "reminder_sent_24h" boolean DEFAULT false,
    "reminder_sent_1h" boolean DEFAULT false,
    "reminder_sent_15min" boolean DEFAULT false,
    "booking_id" uuid DEFAULT NULL,
    "created_via" text DEFAULT 'whatsapp'::text,
    "metadata" jsonb DEFAULT '{}'::jsonb,
    "created_at" timestamp with time zone DEFAULT now(),
    "updated_at" timestamp with time zone DEFAULT now(),
    "confirmed_at" timestamp with time zone DEFAULT NULL,
    "started_at" timestamp with time zone DEFAULT NULL,
    "completed_at" timestamp with time zone DEFAULT NULL,
    "cancelled_at" timestamp with time zone DEFAULT NULL,
    "admin_confirmed_at" timestamp with time zone DEFAULT NULL,
    "admin_confirmed_by" uuid DEFAULT NULL,
    "maid_confirmed_at" timestamp with time zone DEFAULT NULL,
    "maid_confirmation_sent_at" timestamp with time zone DEFAULT NULL,
    "sponsor_confirmation_sent_at" timestamp with time zone DEFAULT NULL,
    "agency_id" uuid DEFAULT NULL,
    "agency_notified_at" timestamp with time zone DEFAULT NULL,
    "platform_link_type" text DEFAULT NULL,
    "platform_instructions" jsonb DEFAULT '{}'::jsonb,
    "rejection_reason" text DEFAULT NULL,
    "admin_notes" text DEFAULT NULL
);
ALTER TABLE public."video_interviews" ADD PRIMARY KEY ("id");

-- Table: webhook_event_logs
CREATE TABLE IF NOT EXISTS public."webhook_event_logs" (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "event_id" text NOT NULL DEFAULT NULL,
    "event_type" text NOT NULL DEFAULT NULL,
    "created_at" timestamp with time zone NOT NULL DEFAULT now(),
    "received_at" timestamp with time zone NOT NULL DEFAULT now(),
    "stripe_signature" text DEFAULT NULL,
    "client_ip" text DEFAULT NULL,
    "request_body" jsonb DEFAULT NULL,
    "status" text NOT NULL DEFAULT 'pending'::text,
    "processing_started_at" timestamp with time zone DEFAULT NULL,
    "processing_completed_at" timestamp with time zone DEFAULT NULL,
    "processing_duration_ms" integer DEFAULT NULL,
    "response_status" integer DEFAULT NULL,
    "response_body" jsonb DEFAULT NULL,
    "error_message" text DEFAULT NULL,
    "error_code" text DEFAULT NULL,
    "user_id" uuid DEFAULT NULL,
    "subscription_id" uuid DEFAULT NULL,
    "metadata" jsonb DEFAULT NULL,
    "retry_count" integer DEFAULT 0,
    "last_retry_at" timestamp with time zone DEFAULT NULL
);
ALTER TABLE public."webhook_event_logs" ADD PRIMARY KEY ("id");

-- Table: whatsapp_messages
CREATE TABLE IF NOT EXISTS public."whatsapp_messages" (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "phone_number" text NOT NULL DEFAULT NULL,
    "message_content" text NOT NULL DEFAULT NULL,
    "sender" text NOT NULL DEFAULT NULL,
    "message_type" text NOT NULL DEFAULT 'text'::text,
    "ai_response" text DEFAULT NULL,
    "processed" boolean DEFAULT false,
    "received_at" timestamp with time zone DEFAULT now(),
    "created_at" timestamp with time zone DEFAULT now()
);
ALTER TABLE public."whatsapp_messages" ADD PRIMARY KEY ("id");

-- Table: work_experience
CREATE TABLE IF NOT EXISTS public."work_experience" (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "maid_id" uuid NOT NULL DEFAULT NULL,
    "position" varchar(100) NOT NULL DEFAULT NULL,
    "position_other" varchar(100) DEFAULT NULL,
    "country_of_employment" varchar(100) NOT NULL DEFAULT NULL,
    "duration" varchar(50) NOT NULL DEFAULT NULL,
    "reason_for_leaving" varchar(100) NOT NULL DEFAULT NULL,
    "reason_for_leaving_other" varchar(100) DEFAULT NULL,
    "employer_name" varchar(255) DEFAULT NULL,
    "job_description" text DEFAULT NULL,
    "start_date" date DEFAULT NULL,
    "end_date" date DEFAULT NULL,
    "created_at" timestamp with time zone DEFAULT now(),
    "updated_at" timestamp with time zone DEFAULT now()
);
ALTER TABLE public."work_experience" ADD PRIMARY KEY ("id");

-- Foreign Key Constraints
ALTER TABLE public."admin_activity_logs" ADD CONSTRAINT "admin_activity_logs_admin_id_fkey" 
    FOREIGN KEY ("admin_id") REFERENCES public."admin_users"("id");
ALTER TABLE public."admin_users" ADD CONSTRAINT "admin_users_created_by_fkey" 
    FOREIGN KEY ("created_by") REFERENCES public."admin_users"("id");
ALTER TABLE public."agency_earnings" ADD CONSTRAINT "agency_earnings_payout_id_fkey" 
    FOREIGN KEY ("payout_id") REFERENCES public."agency_payouts"("id");
ALTER TABLE public."agency_interviews" ADD CONSTRAINT "agency_interviews_job_id_fkey" 
    FOREIGN KEY ("job_id") REFERENCES public."agency_jobs"("id");
ALTER TABLE public."agency_kyb_audit_log" ADD CONSTRAINT "agency_kyb_audit_log_kyb_verification_id_fkey" 
    FOREIGN KEY ("kyb_verification_id") REFERENCES public."agency_kyb_verification"("id");
ALTER TABLE public."agency_kyb_documents" ADD CONSTRAINT "agency_kyb_documents_kyb_verification_id_fkey" 
    FOREIGN KEY ("kyb_verification_id") REFERENCES public."agency_kyb_verification"("id");
ALTER TABLE public."agency_placements" ADD CONSTRAINT "agency_placements_job_id_fkey" 
    FOREIGN KEY ("job_id") REFERENCES public."agency_jobs"("id");
ALTER TABLE public."agency_profiles" ADD CONSTRAINT "agency_profiles_id_fkey" 
    FOREIGN KEY ("id") REFERENCES public."profiles"("id");
ALTER TABLE public."agency_tasks" ADD CONSTRAINT "agency_tasks_agency_id_fkey" 
    FOREIGN KEY ("agency_id") REFERENCES public."agency_profiles"("id");
ALTER TABLE public."applications" ADD CONSTRAINT "applications_job_id_fkey" 
    FOREIGN KEY ("job_id") REFERENCES public."jobs"("id");
ALTER TABLE public."bookings" ADD CONSTRAINT "bookings_job_id_fkey" 
    FOREIGN KEY ("job_id") REFERENCES public."jobs"("id");
ALTER TABLE public."client_satisfaction_ratings" ADD CONSTRAINT "client_satisfaction_ratings_placement_id_fkey" 
    FOREIGN KEY ("placement_id") REFERENCES public."placement_contracts"("id");
ALTER TABLE public."compliance_items" ADD CONSTRAINT "compliance_items_document_id_fkey" 
    FOREIGN KEY ("document_id") REFERENCES public."agency_documents"("id");
ALTER TABLE public."compliance_items" ADD CONSTRAINT "compliance_items_category_id_fkey" 
    FOREIGN KEY ("category_id") REFERENCES public."compliance_categories"("id");
ALTER TABLE public."contact_fees" ADD CONSTRAINT "contact_fees_idempotency_key_fkey" 
    FOREIGN KEY ("idempotency_key") REFERENCES public."payment_idempotency"("key");
ALTER TABLE public."content_moderation_flags" ADD CONSTRAINT "content_moderation_flags_reviewed_by_fkey" 
    FOREIGN KEY ("reviewed_by") REFERENCES public."admin_users"("id");
ALTER TABLE public."conversion_events" ADD CONSTRAINT "conversion_events_session_id_fkey" 
    FOREIGN KEY ("session_id") REFERENCES public."user_sessions"("id");
ALTER TABLE public."credit_transactions" ADD CONSTRAINT "credit_transactions_idempotency_key_fkey" 
    FOREIGN KEY ("idempotency_key") REFERENCES public."payment_idempotency"("key");
ALTER TABLE public."dispute_evidence" ADD CONSTRAINT "dispute_evidence_dispute_id_fkey" 
    FOREIGN KEY ("dispute_id") REFERENCES public."disputes"("id");
ALTER TABLE public."dispute_messages" ADD CONSTRAINT "dispute_messages_dispute_id_fkey" 
    FOREIGN KEY ("dispute_id") REFERENCES public."disputes"("id");
ALTER TABLE public."dispute_parties" ADD CONSTRAINT "dispute_parties_dispute_id_fkey" 
    FOREIGN KEY ("dispute_id") REFERENCES public."disputes"("id");
ALTER TABLE public."disputes" ADD CONSTRAINT "disputes_placement_id_fkey" 
    FOREIGN KEY ("placement_id") REFERENCES public."agency_placements"("id");
ALTER TABLE public."interview_notifications" ADD CONSTRAINT "interview_notifications_interview_id_fkey" 
    FOREIGN KEY ("interview_id") REFERENCES public."video_interviews"("id");
ALTER TABLE public."messages" ADD CONSTRAINT "messages_conversation_id_fkey" 
    FOREIGN KEY ("conversation_id") REFERENCES public."conversations"("id");
ALTER TABLE public."news_items" ADD CONSTRAINT "news_items_source_id_fkey" 
    FOREIGN KEY ("source_id") REFERENCES public."news_sources"("id");
ALTER TABLE public."payments" ADD CONSTRAINT "payments_booking_id_fkey" 
    FOREIGN KEY ("booking_id") REFERENCES public."bookings"("id");
ALTER TABLE public."payout_schedules" ADD CONSTRAINT "payout_schedules_payout_account_id_fkey" 
    FOREIGN KEY ("payout_account_id") REFERENCES public."payout_accounts"("id");
ALTER TABLE public."placement_contracts" ADD CONSTRAINT "placement_contracts_fee_transaction_id_fkey" 
    FOREIGN KEY ("fee_transaction_id") REFERENCES public."placement_fee_transactions"("id");
ALTER TABLE public."placement_contracts" ADD CONSTRAINT "placement_contracts_placement_id_fkey" 
    FOREIGN KEY ("placement_id") REFERENCES public."agency_placements"("id");
ALTER TABLE public."placement_fee_transactions" ADD CONSTRAINT "placement_fee_transactions_placement_id_fkey" 
    FOREIGN KEY ("placement_id") REFERENCES public."agency_placements"("id");
ALTER TABLE public."placement_fee_transactions" ADD CONSTRAINT "placement_fee_transactions_job_id_fkey" 
    FOREIGN KEY ("job_id") REFERENCES public."jobs"("id");
ALTER TABLE public."profiles" ADD CONSTRAINT "profiles_typing_in_conversation_id_fkey" 
    FOREIGN KEY ("typing_in_conversation_id") REFERENCES public."conversations"("id");
ALTER TABLE public."security_events" ADD CONSTRAINT "security_events_handled_by_fkey" 
    FOREIGN KEY ("handled_by") REFERENCES public."admin_users"("id");
ALTER TABLE public."shortlist_candidates" ADD CONSTRAINT "shortlist_candidates_shortlist_id_fkey" 
    FOREIGN KEY ("shortlist_id") REFERENCES public."shortlists"("id");
ALTER TABLE public."shortlists" ADD CONSTRAINT "shortlists_job_id_fkey" 
    FOREIGN KEY ("job_id") REFERENCES public."jobs"("id");
ALTER TABLE public."sponsor_jobs" ADD CONSTRAINT "sponsor_jobs_sponsor_id_fkey" 
    FOREIGN KEY ("sponsor_id") REFERENCES public."sponsors"("id");
ALTER TABLE public."sponsor_jobs" ADD CONSTRAINT "sponsor_jobs_job_id_fkey" 
    FOREIGN KEY ("job_id") REFERENCES public."jobs"("id");
ALTER TABLE public."sponsor_profiles" ADD CONSTRAINT "sponsor_profiles_id_fkey" 
    FOREIGN KEY ("id") REFERENCES public."profiles"("id");
ALTER TABLE public."subscription_status_log" ADD CONSTRAINT "subscription_status_log_subscription_id_fkey" 
    FOREIGN KEY ("subscription_id") REFERENCES public."subscriptions"("id");
ALTER TABLE public."subscription_usage" ADD CONSTRAINT "subscription_usage_subscription_id_fkey" 
    FOREIGN KEY ("subscription_id") REFERENCES public."subscriptions"("id");
ALTER TABLE public."support_messages" ADD CONSTRAINT "support_messages_ticket_id_fkey" 
    FOREIGN KEY ("ticket_id") REFERENCES public."support_tickets"("id");
ALTER TABLE public."system_settings" ADD CONSTRAINT "system_settings_updated_by_fkey" 
    FOREIGN KEY ("updated_by") REFERENCES public."admin_users"("id");
ALTER TABLE public."team_member_performance" ADD CONSTRAINT "team_member_performance_team_member_id_fkey" 
    FOREIGN KEY ("team_member_id") REFERENCES public."agency_team_members"("id");
ALTER TABLE public."video_interviews" ADD CONSTRAINT "video_interviews_admin_confirmed_by_fkey" 
    FOREIGN KEY ("admin_confirmed_by") REFERENCES public."admin_users"("id");
ALTER TABLE public."video_interviews" ADD CONSTRAINT "video_interviews_booking_id_fkey" 
    FOREIGN KEY ("booking_id") REFERENCES public."maid_bookings"("id");
ALTER TABLE public."webhook_event_logs" ADD CONSTRAINT "webhook_event_logs_subscription_id_fkey" 
    FOREIGN KEY ("subscription_id") REFERENCES public."subscriptions"("id");
