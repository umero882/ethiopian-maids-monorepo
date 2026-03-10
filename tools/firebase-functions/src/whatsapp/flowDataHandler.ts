/**
 * WhatsApp Flow Data Handler
 *
 * Routes decrypted Flow actions to the appropriate screen data or completion handler.
 * Supports both v1 (3 screens per role) and v2 (full onboarding) flows.
 *
 * v1 flow_token format: "phone:+971..."
 * v2 flow_token format: "v2:phone:+971..."
 */

import * as admin from 'firebase-admin';
import {
  getAdminClient,
  normalizeMaidData,
  normalizeSponsorData,
  normalizeAgencyData,
  UPSERT_PROFILE,
  UPSERT_MAID_PROFILE,
  UPSERT_SPONSOR_PROFILE,
  UPSERT_AGENCY_PROFILE,
} from '../profile/saveOnboardingProfile';
import {
  nationalityOptions,
  religionOptions,
  maritalStatusOptions,
  countryOptions,
  professionOptions,
  visaStatusOptions,
  experienceLevelOptions,
  salaryRangeOptions,
  skillOptions,
  languageOptions,
  occupationOptions,
  familySizeOptions,
  propertyTypeOptions,
  salaryBudgetOptions,
  livingArrangementOptions,
  agencyTypeOptions,
  repPositionOptions,
  agencyServiceOptions,
  getCitiesForCountry,
  educationLevelOptions,
  contractTypeOptions,
  accommodationPreferenceOptions,
  yearsInBusinessOptions,
  childrenCountOptions,
  elderlyCareOptions,
  preferredNationalityOptions,
  sponsorAccommodationTypeOptions,
  contractDurationOptions,
  countriesWorkedInOptions,
} from './flowDefinitions';
import { generateMaidBio, generateSponsorBio, generateAgencyBio } from './bioGenerator';
import { processFlowMedia } from './mediaHandler';

// ── Types ──

interface FlowRequest {
  action: 'ping' | 'INIT' | 'data_exchange';
  screen?: string;
  data?: Record<string, unknown>;
  flow_token?: string;
  version?: string;
}

interface FlowResponse {
  version?: string;
  screen?: string;
  data?: Record<string, unknown>;
  error_messages?: Record<string, string>;
  [key: string]: unknown;
}

// ── WhatsApp config for sending confirmation messages ──

function getWhatsAppConfig() {
  return {
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || '',
    accessToken: process.env.WHATSAPP_ACCESS_TOKEN || '',
    apiVersion: process.env.WHATSAPP_API_VERSION || 'v18.0',
  };
}

// ══════════════════════════════════════════════════════════════
//  V1 HANDLER (backward compatible, existing 3-screen flow)
// ══════════════════════════════════════════════════════════════

export async function handleFlowAction(
  decryptedBody: Record<string, unknown>
): Promise<FlowResponse> {
  const request = decryptedBody as unknown as FlowRequest;
  const { action, screen, data } = request;

  const flowToken = request.flow_token || '';
  let senderPhone = '';
  if (flowToken.startsWith('phone:')) {
    senderPhone = flowToken.substring(6);
  }
  if (data && senderPhone) {
    data._phone_number = senderPhone;
  }

  console.log(`[FlowHandler-v1] action=${action}, screen=${screen}, phone=${senderPhone}`);

  if (action === 'ping') {
    return { data: { status: 'active' } };
  }

  if (action === 'INIT') {
    return {
      screen: 'ROLESELECT',
      data: {
        role_options: [
          { id: 'maid', title: 'Maid / Domestic Worker' },
          { id: 'sponsor', title: 'Sponsor / Employer' },
          { id: 'agency', title: 'Recruitment Agency' },
        ],
      },
    };
  }

  if (action === 'data_exchange') {
    return handleDataExchangeV1(screen || '', data || {});
  }

  console.warn(`[FlowHandler-v1] Unknown action: ${action}`);
  return { screen: 'ROLESELECT', data: {} };
}

async function handleDataExchangeV1(
  screen: string,
  data: Record<string, unknown>
): Promise<FlowResponse> {
  switch (screen) {
    case 'ROLESELECT':
      return handleRoleSelectV1(data);
    case 'MAIDONE':
      return handleMaid1V1(data);
    case 'MAIDTWO':
      return handleMaid2V1(data);
    case 'MAIDTHREE':
      return handleMaid3CompleteV1(data);
    case 'SPONSORONE':
      return handleSponsor1V1(data);
    case 'SPONSORTWO':
      return handleSponsor2V1(data);
    case 'SPONSORTHREE':
      return handleSponsor3CompleteV1(data);
    case 'AGENCYONE':
      return handleAgency1V1(data);
    case 'AGENCYTWO':
      return handleAgency2V1(data);
    case 'AGENCYTHREE':
      return handleAgency3CompleteV1(data);
    default:
      console.warn(`[FlowHandler-v1] Unknown screen: ${screen}`);
      return { screen: 'ROLESELECT', data: {} };
  }
}

function handleRoleSelectV1(data: Record<string, unknown>): FlowResponse {
  const role = data.role as string;
  if (role === 'maid') {
    return { screen: 'MAIDONE', data: { nationality_options: nationalityOptions, religion_options: religionOptions, marital_status_options: maritalStatusOptions } };
  }
  if (role === 'sponsor') {
    return { screen: 'SPONSORONE', data: { country_options: countryOptions, occupation_options: occupationOptions } };
  }
  if (role === 'agency') {
    return { screen: 'AGENCYONE', data: { country_options: countryOptions, agency_type_options: agencyTypeOptions } };
  }
  return { screen: 'ROLESELECT', data: {}, error_messages: { role: 'Please select a role' } };
}

function handleMaid1V1(data: Record<string, unknown>): FlowResponse {
  if (!data.full_name) {
    return { screen: 'MAIDONE', data: { nationality_options: nationalityOptions, religion_options: religionOptions, marital_status_options: maritalStatusOptions }, error_messages: { full_name: 'Full name is required' } };
  }
  const cityOpts = getCitiesForCountry((data.country as string) || '');
  return { screen: 'MAIDTWO', data: { country_options: countryOptions, city_options: cityOpts, profession_options: professionOptions, visa_status_options: visaStatusOptions, experience_level_options: experienceLevelOptions, salary_range_options: salaryRangeOptions, ...prefixData('maid1', data) } };
}

function handleMaid2V1(data: Record<string, unknown>): FlowResponse {
  return { screen: 'MAIDTHREE', data: { skill_options: skillOptions, language_options: languageOptions, ...prefixData('maid2', data) } };
}

async function handleMaid3CompleteV1(data: Record<string, unknown>): Promise<FlowResponse> {
  const phoneNumber = (data._phone_number as string) || (data.phone_number as string) || '';
  const allData = mergeAccumulatedData(data);
  try {
    await handleFlowCompletion('maid', allData, phoneNumber);
    return { screen: 'SUCCESS', data: { extension_message_response: { params: { flow_token: data.flow_token || 'completed', status: 'success' } } } };
  } catch (error) {
    console.error('[FlowHandler-v1] Maid registration failed:', error);
    return { screen: 'MAIDTHREE', data: { skill_options: skillOptions, language_options: languageOptions }, error_messages: { _general: 'Registration failed. Please try again.' } };
  }
}

function handleSponsor1V1(data: Record<string, unknown>): FlowResponse {
  if (!data.full_name) {
    return { screen: 'SPONSORONE', data: { country_options: countryOptions, occupation_options: occupationOptions }, error_messages: { full_name: 'Full name is required' } };
  }
  return { screen: 'SPONSORTWO', data: { family_size_options: familySizeOptions, property_type_options: propertyTypeOptions, salary_budget_options: salaryBudgetOptions, living_arrangement_options: livingArrangementOptions, ...prefixData('sponsor1', data) } };
}

function handleSponsor2V1(data: Record<string, unknown>): FlowResponse {
  const allData = mergeAccumulatedData(data);
  return { screen: 'SPONSORTHREE', data: { summary_name: allData.full_name || 'Sponsor', summary_country: allData.country || 'Not set', summary_family_size: allData.family_size || 'Not set', summary_budget: allData.salary_budget || 'Not set', ...prefixData('sponsor2', data) } };
}

async function handleSponsor3CompleteV1(data: Record<string, unknown>): Promise<FlowResponse> {
  const phoneNumber = (data._phone_number as string) || (data.phone_number as string) || '';
  const allData = mergeAccumulatedData(data);
  try {
    await handleFlowCompletion('sponsor', allData, phoneNumber);
    return { screen: 'SUCCESS', data: { extension_message_response: { params: { flow_token: data.flow_token || 'completed', status: 'success' } } } };
  } catch (error) {
    console.error('[FlowHandler-v1] Sponsor registration failed:', error);
    return { screen: 'SPONSORTHREE', data: {}, error_messages: { _general: 'Registration failed. Please try again.' } };
  }
}

function handleAgency1V1(data: Record<string, unknown>): FlowResponse {
  if (!data.agency_name) {
    return { screen: 'AGENCYONE', data: { country_options: countryOptions, agency_type_options: agencyTypeOptions }, error_messages: { agency_name: 'Agency name is required' } };
  }
  return { screen: 'AGENCYTWO', data: { rep_position_options: repPositionOptions, ...prefixData('agency1', data) } };
}

function handleAgency2V1(data: Record<string, unknown>): FlowResponse {
  return { screen: 'AGENCYTHREE', data: { agency_service_options: agencyServiceOptions, ...prefixData('agency2', data) } };
}

async function handleAgency3CompleteV1(data: Record<string, unknown>): Promise<FlowResponse> {
  const phoneNumber = (data._phone_number as string) || (data.phone_number as string) || '';
  const allData = mergeAccumulatedData(data);
  try {
    await handleFlowCompletion('agency', allData, phoneNumber);
    return { screen: 'SUCCESS', data: { extension_message_response: { params: { flow_token: data.flow_token || 'completed', status: 'success' } } } };
  } catch (error) {
    console.error('[FlowHandler-v1] Agency registration failed:', error);
    return { screen: 'AGENCYTHREE', data: { agency_service_options: agencyServiceOptions }, error_messages: { _general: 'Registration failed. Please try again.' } };
  }
}

// ══════════════════════════════════════════════════════════════
//  V2 HANDLER (full onboarding: 35 screens)
// ══════════════════════════════════════════════════════════════

/**
 * V2 accumulated state is stored in a flat object passed through screens.
 * We use short prefixes per screen to namespace data:
 *   mp_ = maid personal, ml_ = maid location, etc.
 * But for v2 we use a simpler approach: accumulate everything in _acc_ JSON string.
 */

export async function handleFlowActionV2(
  decryptedBody: Record<string, unknown>
): Promise<FlowResponse> {
  const request = decryptedBody as unknown as FlowRequest;
  const { action, screen, data } = request;

  // Extract phone from v2 token: "v2:phone:+971..."
  const flowToken = request.flow_token || '';
  let senderPhone = '';
  if (flowToken.startsWith('v2:phone:')) {
    senderPhone = flowToken.substring(9);
  } else if (flowToken.startsWith('phone:')) {
    senderPhone = flowToken.substring(6);
  }
  if (data && senderPhone) {
    data._phone_number = senderPhone;
  }

  console.log(`[FlowHandler-v2] action=${action}, screen=${screen}, phone=${senderPhone}`);

  if (action === 'ping') {
    return { data: { status: 'active' } };
  }

  if (action === 'INIT') {
    return {
      screen: 'ROLESELECT',
      data: {
        role_options: [
          { id: 'maid', title: 'Maid / Domestic Worker' },
          { id: 'sponsor', title: 'Sponsor / Employer' },
          { id: 'agency', title: 'Recruitment Agency' },
        ],
      },
    };
  }

  if (action === 'data_exchange') {
    return handleDataExchangeV2(screen || '', data || {});
  }

  console.warn(`[FlowHandler-v2] Unknown action: ${action}`);
  return { screen: 'ROLESELECT', data: {} };
}

// ── V2 Accumulated State ──

/**
 * V2 uses a JSON-encoded _acc field to pass accumulated data between screens.
 * This avoids WhatsApp's data field size limits from growing with many prefixed fields.
 */
function getAccumulated(data: Record<string, unknown>): Record<string, unknown> {
  const accStr = data._acc as string;
  if (accStr) {
    try { return JSON.parse(accStr); } catch { /* empty */ }
  }
  return {};
}

function setAccumulated(
  acc: Record<string, unknown>,
  currentScreenData: Record<string, unknown>,
  excludeKeys: string[] = []
): string {
  const merged = { ...acc };
  for (const [key, value] of Object.entries(currentScreenData)) {
    if (key.startsWith('_') || key === 'flow_token' || key === 'action' || key === 'screen') continue;
    if (excludeKeys.includes(key)) continue;
    if (value !== undefined && value !== null && value !== '') {
      merged[key] = value;
    }
  }
  return JSON.stringify(merged);
}

// ── V2 Data Exchange Router ──

async function handleDataExchangeV2(
  screen: string,
  data: Record<string, unknown>
): Promise<FlowResponse> {
  switch (screen) {
    // Shared
    case 'ROLESELECT': return handleV2RoleSelect(data);
    case 'ACCOUNT': return handleV2Account(data);

    // Maid flow
    case 'M_PERSONAL': return handleV2MaidPersonal(data);
    case 'M_PHOTO': return handleV2MaidPhoto(data);
    case 'M_DOCS': return handleV2MaidDocs(data);
    case 'M_LOCATION': return handleV2MaidLocation(data);
    case 'M_WORK': return handleV2MaidWork(data);
    case 'M_SKILLS': return handleV2MaidSkills(data);
    case 'M_EXPERIENCE': return handleV2MaidExperience(data);
    case 'M_PREFS': return handleV2MaidPrefs(data);
    case 'M_BIO': return handleV2MaidBio(data);
    case 'M_CV': return handleV2MaidCV(data);
    case 'M_VIDEO': return handleV2MaidVideo(data);
    case 'M_GALLERY': return handleV2MaidGallery(data);
    case 'M_TERMS': return handleV2MaidTerms(data);

    // Sponsor flow
    case 'S_PERSONAL': return handleV2SponsorPersonal(data);
    case 'S_PHOTO': return handleV2SponsorPhoto(data);
    case 'S_DOCS': return handleV2SponsorDocs(data);
    case 'S_LOCATION': return handleV2SponsorLocation(data);
    case 'S_FAMILY': return handleV2SponsorFamily(data);
    case 'S_PREFS': return handleV2SponsorPrefs(data);
    case 'S_BUDGET': return handleV2SponsorBudget(data);
    case 'S_ACCOMMODATION': return handleV2SponsorAccommodation(data);
    case 'S_ABOUT': return handleV2SponsorAbout(data);
    case 'S_TERMS': return handleV2SponsorTerms(data);

    // Agency flow
    case 'A_INFO': return handleV2AgencyInfo(data);
    case 'A_PHOTO': return handleV2AgencyPhoto(data);
    case 'A_DOCS': return handleV2AgencyDocs(data);
    case 'A_COVERAGE': return handleV2AgencyCoverage(data);
    case 'A_CONTACT': return handleV2AgencyContact(data);
    case 'A_REP': return handleV2AgencyRep(data);
    case 'A_SERVICES': return handleV2AgencyServices(data);
    case 'A_ABOUT': return handleV2AgencyAbout(data);
    case 'A_TERMS': return handleV2AgencyTerms(data);

    default:
      console.warn(`[FlowHandler-v2] Unknown screen: ${screen}`);
      return { screen: 'ROLESELECT', data: {} };
  }
}

// ── SHARED SCREENS ──

function handleV2RoleSelect(data: Record<string, unknown>): FlowResponse {
  const role = data.role as string;
  if (!role) {
    return { screen: 'ROLESELECT', data: {}, error_messages: { role: 'Please select a role' } };
  }

  const acc = JSON.stringify({ role });

  return {
    screen: 'ACCOUNT',
    data: { _acc: acc },
  };
}

function handleV2Account(data: Record<string, unknown>): FlowResponse {
  const acc = getAccumulated(data);
  const email = (data.email as string || '').trim().toLowerCase();
  const password = data.password as string || '';
  const confirmPassword = data.confirm_password as string || '';

  // Validation
  const errors: Record<string, string> = {};
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = 'Please enter a valid email address';
  }
  if (password.length < 8) {
    errors.password = 'Password must be at least 8 characters';
  }
  if (password !== confirmPassword) {
    errors.confirm_password = 'Passwords do not match';
  }

  if (Object.keys(errors).length > 0) {
    return { screen: 'ACCOUNT', data: { _acc: data._acc as string }, error_messages: errors };
  }

  // Store email/password in accumulated state
  acc.email = email;
  acc.password = password;
  const newAcc = JSON.stringify(acc);
  const role = acc.role as string;

  // Branch to role-specific first screen
  if (role === 'maid') {
    return {
      screen: 'M_PERSONAL',
      data: {
        _acc: newAcc,
        nationality_options: nationalityOptions,
        religion_options: religionOptions,
        marital_status_options: maritalStatusOptions,
      },
    };
  }
  if (role === 'sponsor') {
    return {
      screen: 'S_PERSONAL',
      data: {
        _acc: newAcc,
        occupation_options: occupationOptions,
      },
    };
  }
  if (role === 'agency') {
    return {
      screen: 'A_INFO',
      data: {
        _acc: newAcc,
        agency_type_options: agencyTypeOptions,
        years_in_business_options: yearsInBusinessOptions,
      },
    };
  }

  return { screen: 'ROLESELECT', data: {} };
}

// ══════════════════════════════════════════════════════════════
//  MAID V2 SCREENS
// ══════════════════════════════════════════════════════════════

function handleV2MaidPersonal(data: Record<string, unknown>): FlowResponse {
  if (!data.full_name) {
    return {
      screen: 'M_PERSONAL',
      data: { _acc: data._acc as string, nationality_options: nationalityOptions, religion_options: religionOptions, marital_status_options: maritalStatusOptions },
      error_messages: { full_name: 'Full name is required' },
    };
  }
  const acc = getAccumulated(data);
  const newAcc = setAccumulated(acc, data, ['_acc']);
  return { screen: 'M_PHOTO', data: { _acc: newAcc } };
}

async function handleV2MaidPhoto(data: Record<string, unknown>): Promise<FlowResponse> {
  const acc = getAccumulated(data);
  // Process photo upload if present
  if (data.face_photo) {
    try {
      const phone = acc._phone_number as string || data._phone_number as string || 'temp';
      const results = await processFlowMedia(data.face_photo, phone, 'profile');
      if (results.length > 0) {
        acc.profile_photo_url = results[0].download_url;
      }
    } catch (err) {
      console.error('[FlowHandler-v2] Face photo upload failed:', err);
    }
  }
  const newAcc = JSON.stringify(acc);
  return { screen: 'M_DOCS', data: { _acc: newAcc } };
}

async function handleV2MaidDocs(data: Record<string, unknown>): Promise<FlowResponse> {
  const acc = getAccumulated(data);
  if (data.id_docs) {
    try {
      const phone = acc._phone_number as string || data._phone_number as string || 'temp';
      const results = await processFlowMedia(data.id_docs, phone, 'documents');
      if (results.length > 0) {
        acc.document_urls = results.map((r) => r.download_url);
      }
    } catch (err) {
      console.error('[FlowHandler-v2] Doc upload failed:', err);
    }
  }
  const newAcc = JSON.stringify(acc);
  return {
    screen: 'M_LOCATION',
    data: {
      _acc: newAcc,
      country_options: countryOptions,
      city_options: getCitiesForCountry(''),
    },
  };
}

function handleV2MaidLocation(data: Record<string, unknown>): FlowResponse {
  const acc = getAccumulated(data);
  const newAcc = setAccumulated(acc, data, ['_acc', 'country_options', 'city_options']);
  return {
    screen: 'M_WORK',
    data: {
      _acc: newAcc,
      profession_options: professionOptions,
      visa_status_options: visaStatusOptions,
      education_level_options: educationLevelOptions,
    },
  };
}

function handleV2MaidWork(data: Record<string, unknown>): FlowResponse {
  const acc = getAccumulated(data);
  const newAcc = setAccumulated(acc, data, ['_acc', 'profession_options', 'visa_status_options', 'education_level_options']);
  return {
    screen: 'M_SKILLS',
    data: {
      _acc: newAcc,
      skill_options: skillOptions,
      language_options: languageOptions,
    },
  };
}

function handleV2MaidSkills(data: Record<string, unknown>): FlowResponse {
  const acc = getAccumulated(data);
  const newAcc = setAccumulated(acc, data, ['_acc', 'skill_options', 'language_options']);
  return {
    screen: 'M_EXPERIENCE',
    data: {
      _acc: newAcc,
      experience_level_options: experienceLevelOptions,
      countries_worked_in_options: countriesWorkedInOptions,
    },
  };
}

function handleV2MaidExperience(data: Record<string, unknown>): FlowResponse {
  const acc = getAccumulated(data);
  const newAcc = setAccumulated(acc, data, ['_acc', 'experience_level_options', 'countries_worked_in_options']);
  return {
    screen: 'M_PREFS',
    data: {
      _acc: newAcc,
      salary_range_options: salaryRangeOptions,
      contract_type_options: contractTypeOptions,
      accommodation_preference_options: accommodationPreferenceOptions,
    },
  };
}

function handleV2MaidPrefs(data: Record<string, unknown>): FlowResponse {
  const acc = getAccumulated(data);
  const merged = { ...acc };
  for (const [key, value] of Object.entries(data)) {
    if (key.startsWith('_') || key.endsWith('_options')) continue;
    if (value !== undefined && value !== null && value !== '') merged[key] = value;
  }

  // Generate bio from accumulated data
  const bioText = generateMaidBio(merged);

  return {
    screen: 'M_BIO',
    data: {
      _acc: JSON.stringify(merged),
      about_me_init: bioText,
    },
  };
}

function handleV2MaidBio(data: Record<string, unknown>): FlowResponse {
  const acc = getAccumulated(data);
  if (data.about_me) acc.about_me = data.about_me;
  return { screen: 'M_CV', data: { _acc: JSON.stringify(acc) } };
}

async function handleV2MaidCV(data: Record<string, unknown>): Promise<FlowResponse> {
  const acc = getAccumulated(data);
  if (data.cv_doc) {
    try {
      const phone = acc._phone_number as string || data._phone_number as string || 'temp';
      const results = await processFlowMedia(data.cv_doc, phone, 'cv');
      if (results.length > 0) {
        acc.cv_document_url = results[0].download_url;
      }
    } catch (err) {
      console.error('[FlowHandler-v2] CV upload failed:', err);
    }
  }
  return { screen: 'M_VIDEO', data: { _acc: JSON.stringify(acc) } };
}

function handleV2MaidVideo(data: Record<string, unknown>): FlowResponse {
  // Video screen is informational only — no upload (WhatsApp Flows doesn't support video).
  // User is instructed to send video via chat after registration.
  const acc = getAccumulated(data);
  return { screen: 'M_GALLERY', data: { _acc: JSON.stringify(acc) } };
}

async function handleV2MaidGallery(data: Record<string, unknown>): Promise<FlowResponse> {
  const acc = getAccumulated(data);
  if (data.profile_photos) {
    try {
      const phone = acc._phone_number as string || data._phone_number as string || 'temp';
      const results = await processFlowMedia(data.profile_photos, phone, 'gallery');
      if (results.length > 0) {
        acc.gallery_urls = results.map((r) => r.download_url);
      }
    } catch (err) {
      console.error('[FlowHandler-v2] Gallery upload failed:', err);
    }
  }
  return { screen: 'M_TERMS', data: { _acc: JSON.stringify(acc) } };
}

async function handleV2MaidTerms(data: Record<string, unknown>): Promise<FlowResponse> {
  // Validate consent
  if (!data.terms || !data.privacy) {
    return {
      screen: 'M_TERMS',
      data: { _acc: data._acc as string },
      error_messages: { terms: 'You must accept the terms and privacy policy' },
    };
  }

  const acc = getAccumulated(data);
  const phoneNumber = acc._phone_number as string || data._phone_number as string || '';

  try {
    await handleFlowCompletionV2('maid', acc, phoneNumber);
    return {
      screen: 'SUCCESS',
      data: {
        extension_message_response: {
          params: { flow_token: data.flow_token || 'completed', status: 'success' },
        },
      },
    };
  } catch (error) {
    console.error('[FlowHandler-v2] Maid registration failed:', error);
    return {
      screen: 'M_TERMS',
      data: { _acc: data._acc as string },
      error_messages: { _general: 'Registration failed. Please try again.' },
    };
  }
}

// ══════════════════════════════════════════════════════════════
//  SPONSOR V2 SCREENS
// ══════════════════════════════════════════════════════════════

function handleV2SponsorPersonal(data: Record<string, unknown>): FlowResponse {
  if (!data.full_name) {
    return {
      screen: 'S_PERSONAL',
      data: { _acc: data._acc as string, occupation_options: occupationOptions },
      error_messages: { full_name: 'Full name is required' },
    };
  }
  const acc = getAccumulated(data);
  const newAcc = setAccumulated(acc, data, ['_acc', 'occupation_options']);
  return { screen: 'S_PHOTO', data: { _acc: newAcc } };
}

async function handleV2SponsorPhoto(data: Record<string, unknown>): Promise<FlowResponse> {
  const acc = getAccumulated(data);
  if (data.face_photo) {
    try {
      const phone = acc._phone_number as string || data._phone_number as string || 'temp';
      const results = await processFlowMedia(data.face_photo, phone, 'profile');
      if (results.length > 0) acc.avatar_url = results[0].download_url;
    } catch (err) {
      console.error('[FlowHandler-v2] Sponsor photo upload failed:', err);
    }
  }
  return { screen: 'S_DOCS', data: { _acc: JSON.stringify(acc) } };
}

async function handleV2SponsorDocs(data: Record<string, unknown>): Promise<FlowResponse> {
  const acc = getAccumulated(data);
  if (data.id_docs) {
    try {
      const phone = acc._phone_number as string || data._phone_number as string || 'temp';
      const results = await processFlowMedia(data.id_docs, phone, 'documents');
      if (results.length > 0) acc.document_urls = results.map((r) => r.download_url);
    } catch (err) {
      console.error('[FlowHandler-v2] Sponsor doc upload failed:', err);
    }
  }
  return {
    screen: 'S_LOCATION',
    data: {
      _acc: JSON.stringify(acc),
      country_options: countryOptions,
      city_options: getCitiesForCountry(''),
    },
  };
}

function handleV2SponsorLocation(data: Record<string, unknown>): FlowResponse {
  const acc = getAccumulated(data);
  const newAcc = setAccumulated(acc, data, ['_acc', 'country_options', 'city_options']);
  return {
    screen: 'S_FAMILY',
    data: {
      _acc: newAcc,
      family_size_options: familySizeOptions,
      children_count_options: childrenCountOptions,
      elderly_care_options: elderlyCareOptions,
    },
  };
}

function handleV2SponsorFamily(data: Record<string, unknown>): FlowResponse {
  const acc = getAccumulated(data);
  const newAcc = setAccumulated(acc, data, ['_acc', 'family_size_options', 'children_count_options', 'elderly_care_options']);
  return {
    screen: 'S_PREFS',
    data: {
      _acc: newAcc,
      skill_options: skillOptions,
      preferred_nationality_options: preferredNationalityOptions,
      language_options: languageOptions,
    },
  };
}

function handleV2SponsorPrefs(data: Record<string, unknown>): FlowResponse {
  const acc = getAccumulated(data);
  const newAcc = setAccumulated(acc, data, ['_acc', 'skill_options', 'preferred_nationality_options', 'language_options']);
  return {
    screen: 'S_BUDGET',
    data: {
      _acc: newAcc,
      salary_budget_options: salaryBudgetOptions,
      contract_duration_options: contractDurationOptions,
      living_arrangement_options: livingArrangementOptions,
    },
  };
}

function handleV2SponsorBudget(data: Record<string, unknown>): FlowResponse {
  const acc = getAccumulated(data);
  const newAcc = setAccumulated(acc, data, ['_acc', 'salary_budget_options', 'contract_duration_options', 'living_arrangement_options']);
  return {
    screen: 'S_ACCOMMODATION',
    data: {
      _acc: newAcc,
      property_type_options: propertyTypeOptions,
      accommodation_type_options: sponsorAccommodationTypeOptions,
    },
  };
}

function handleV2SponsorAccommodation(data: Record<string, unknown>): FlowResponse {
  const acc = getAccumulated(data);
  const merged = { ...acc };
  for (const [key, value] of Object.entries(data)) {
    if (key.startsWith('_') || key.endsWith('_options')) continue;
    if (value !== undefined && value !== null && value !== '') merged[key] = value;
  }

  const bioText = generateSponsorBio(merged);
  return {
    screen: 'S_ABOUT',
    data: {
      _acc: JSON.stringify(merged),
      description_init: bioText,
    },
  };
}

function handleV2SponsorAbout(data: Record<string, unknown>): FlowResponse {
  const acc = getAccumulated(data);
  if (data.description) acc.description = data.description;
  return { screen: 'S_TERMS', data: { _acc: JSON.stringify(acc) } };
}

async function handleV2SponsorTerms(data: Record<string, unknown>): Promise<FlowResponse> {
  if (!data.terms || !data.privacy) {
    return {
      screen: 'S_TERMS',
      data: { _acc: data._acc as string },
      error_messages: { terms: 'You must accept the terms and privacy policy' },
    };
  }

  const acc = getAccumulated(data);
  const phoneNumber = acc._phone_number as string || data._phone_number as string || '';

  try {
    await handleFlowCompletionV2('sponsor', acc, phoneNumber);
    return {
      screen: 'SUCCESS',
      data: {
        extension_message_response: {
          params: { flow_token: data.flow_token || 'completed', status: 'success' },
        },
      },
    };
  } catch (error) {
    console.error('[FlowHandler-v2] Sponsor registration failed:', error);
    return {
      screen: 'S_TERMS',
      data: { _acc: data._acc as string },
      error_messages: { _general: 'Registration failed. Please try again.' },
    };
  }
}

// ══════════════════════════════════════════════════════════════
//  AGENCY V2 SCREENS
// ══════════════════════════════════════════════════════════════

function handleV2AgencyInfo(data: Record<string, unknown>): FlowResponse {
  if (!data.agency_name) {
    return {
      screen: 'A_INFO',
      data: { _acc: data._acc as string, agency_type_options: agencyTypeOptions, years_in_business_options: yearsInBusinessOptions },
      error_messages: { agency_name: 'Agency name is required' },
    };
  }
  const acc = getAccumulated(data);
  const newAcc = setAccumulated(acc, data, ['_acc', 'agency_type_options', 'years_in_business_options']);
  return { screen: 'A_PHOTO', data: { _acc: newAcc } };
}

async function handleV2AgencyPhoto(data: Record<string, unknown>): Promise<FlowResponse> {
  const acc = getAccumulated(data);
  if (data.face_photo) {
    try {
      const phone = acc._phone_number as string || data._phone_number as string || 'temp';
      const results = await processFlowMedia(data.face_photo, phone, 'profile');
      if (results.length > 0) acc.logo_url = results[0].download_url;
    } catch (err) {
      console.error('[FlowHandler-v2] Agency photo upload failed:', err);
    }
  }
  return { screen: 'A_DOCS', data: { _acc: JSON.stringify(acc) } };
}

async function handleV2AgencyDocs(data: Record<string, unknown>): Promise<FlowResponse> {
  const acc = getAccumulated(data);
  if (data.id_docs) {
    try {
      const phone = acc._phone_number as string || data._phone_number as string || 'temp';
      const results = await processFlowMedia(data.id_docs, phone, 'documents');
      if (results.length > 0) {
        acc.trade_license_document = results[0]?.download_url || null;
        if (results[1]) acc.authorized_person_id_document = results[1].download_url;
      }
    } catch (err) {
      console.error('[FlowHandler-v2] Agency doc upload failed:', err);
    }
  }
  return {
    screen: 'A_COVERAGE',
    data: {
      _acc: JSON.stringify(acc),
      countries_of_operation_options: countryOptions,
    },
  };
}

function handleV2AgencyCoverage(data: Record<string, unknown>): FlowResponse {
  const acc = getAccumulated(data);
  const newAcc = setAccumulated(acc, data, ['_acc', 'countries_of_operation_options']);
  return { screen: 'A_CONTACT', data: { _acc: newAcc } };
}

function handleV2AgencyContact(data: Record<string, unknown>): FlowResponse {
  const acc = getAccumulated(data);
  const newAcc = setAccumulated(acc, data, ['_acc']);
  return {
    screen: 'A_REP',
    data: {
      _acc: newAcc,
      rep_position_options: repPositionOptions,
    },
  };
}

function handleV2AgencyRep(data: Record<string, unknown>): FlowResponse {
  const acc = getAccumulated(data);
  const newAcc = setAccumulated(acc, data, ['_acc', 'rep_position_options']);
  return {
    screen: 'A_SERVICES',
    data: {
      _acc: newAcc,
      agency_service_options: agencyServiceOptions,
    },
  };
}

function handleV2AgencyServices(data: Record<string, unknown>): FlowResponse {
  const acc = getAccumulated(data);
  const merged = { ...acc };
  for (const [key, value] of Object.entries(data)) {
    if (key.startsWith('_') || key.endsWith('_options')) continue;
    if (value !== undefined && value !== null && value !== '') merged[key] = value;
  }

  const bioText = generateAgencyBio(merged);
  return {
    screen: 'A_ABOUT',
    data: {
      _acc: JSON.stringify(merged),
      agency_description_init: bioText,
    },
  };
}

function handleV2AgencyAbout(data: Record<string, unknown>): FlowResponse {
  const acc = getAccumulated(data);
  if (data.agency_description) acc.agency_description = data.agency_description;
  return { screen: 'A_TERMS', data: { _acc: JSON.stringify(acc) } };
}

async function handleV2AgencyTerms(data: Record<string, unknown>): Promise<FlowResponse> {
  if (!data.terms || !data.privacy) {
    return {
      screen: 'A_TERMS',
      data: { _acc: data._acc as string },
      error_messages: { terms: 'You must accept the terms and privacy policy' },
    };
  }

  const acc = getAccumulated(data);
  const phoneNumber = acc._phone_number as string || data._phone_number as string || '';

  try {
    await handleFlowCompletionV2('agency', acc, phoneNumber);
    return {
      screen: 'SUCCESS',
      data: {
        extension_message_response: {
          params: { flow_token: data.flow_token || 'completed', status: 'success' },
        },
      },
    };
  } catch (error) {
    console.error('[FlowHandler-v2] Agency registration failed:', error);
    return {
      screen: 'A_TERMS',
      data: { _acc: data._acc as string },
      error_messages: { _general: 'Registration failed. Please try again.' },
    };
  }
}

// ══════════════════════════════════════════════════════════════
//  V2 REGISTRATION COMPLETION
// ══════════════════════════════════════════════════════════════

async function handleFlowCompletionV2(
  userType: 'maid' | 'sponsor' | 'agency',
  profileData: Record<string, unknown>,
  phoneNumber: string
): Promise<void> {
  console.log(`[FlowHandler-v2] Completing ${userType} registration for phone: ${phoneNumber}`);

  if (!phoneNumber) {
    throw new Error('Phone number is required for registration');
  }

  let cleanPhone = phoneNumber.replace(/[^\d+]/g, '');
  if (!cleanPhone.startsWith('+')) {
    cleanPhone = '+' + cleanPhone;
  }

  const email = (profileData.email as string) || '';
  const password = (profileData.password as string) || '';

  // Step 1: Get or create Firebase Auth user with email+password+phone
  let userId: string;
  try {
    const existingUser = await admin.auth().getUserByPhoneNumber(cleanPhone);
    userId = existingUser.uid;
    console.log(`[FlowHandler-v2] Found existing user: ${userId}`);

    // Update with email/password if provided
    if (email && password) {
      await admin.auth().updateUser(userId, {
        email,
        password,
        displayName: (profileData.full_name as string) || (profileData.agency_name as string) || undefined,
      });
      console.log(`[FlowHandler-v2] Updated user ${userId} with email/password`);
    }
  } catch {
    // User doesn't exist, create new one
    const createParams: admin.auth.CreateRequest = {
      phoneNumber: cleanPhone,
      displayName: (profileData.full_name as string) || (profileData.agency_name as string) || undefined,
    };
    if (email) createParams.email = email;
    if (password) createParams.password = password;

    const newUser = await admin.auth().createUser(createParams);
    userId = newUser.uid;
    console.log(`[FlowHandler-v2] Created new user: ${userId}`);
  }

  // Step 2: Set Hasura custom claims
  const hasuraRole = userType === 'agency' ? 'agency' : userType;
  await admin.auth().setCustomUserClaims(userId, {
    user_type: userType,
    'https://hasura.io/jwt/claims': {
      'x-hasura-allowed-roles': ['user', hasuraRole],
      'x-hasura-default-role': hasuraRole,
      'x-hasura-user-id': userId,
    },
  });

  // Step 3: Upsert profiles + type-specific table
  const client = getAdminClient();

  const profileRow = {
    id: userId,
    email: email,
    full_name: (profileData.full_name as string) || (profileData.agency_name as string) || '',
    phone: cleanPhone,
    country: (profileData.country as string) || '',
    avatar_url: (profileData.profile_photo_url as string) || (profileData.avatar_url as string) || (profileData.logo_url as string) || null,
    user_type: userType,
    registration_complete: true,
    is_active: true,
    updated_at: new Date().toISOString(),
  };

  await client.request(UPSERT_PROFILE, { data: profileRow });
  console.log(`[FlowHandler-v2] Upserted profiles row for ${userId}`);

  if (userType === 'maid') {
    const maidData = normalizeMaidData(userId, {
      ...profileData,
      phone_number: cleanPhone,
    });
    await client.request(UPSERT_MAID_PROFILE, { data: maidData });
  } else if (userType === 'sponsor') {
    const sponsorData = normalizeSponsorData(userId, profileData);
    await client.request(UPSERT_SPONSOR_PROFILE, { data: sponsorData });
  } else if (userType === 'agency') {
    const agencyData = normalizeAgencyData(userId, {
      ...profileData,
      agencyName: profileData.agency_name,
    });
    await client.request(UPSERT_AGENCY_PROFILE, { data: agencyData });
  }

  console.log(`[FlowHandler-v2] Upserted ${userType} profile for ${userId}`);

  // Step 4: Send WhatsApp confirmation
  await sendWhatsAppConfirmation(cleanPhone, userType, profileData);
}

// ══════════════════════════════════════════════════════════════
//  SHARED: Registration Handler (v1)
// ══════════════════════════════════════════════════════════════

async function handleFlowCompletion(
  userType: 'maid' | 'sponsor' | 'agency',
  profileData: Record<string, unknown>,
  phoneNumber: string
): Promise<void> {
  console.log(`[FlowHandler] Completing ${userType} registration for phone: ${phoneNumber}`);

  if (!phoneNumber) {
    throw new Error('Phone number is required for registration');
  }

  let cleanPhone = phoneNumber.replace(/[^\d+]/g, '');
  if (!cleanPhone.startsWith('+')) {
    cleanPhone = '+' + cleanPhone;
  }

  let userId: string;
  try {
    const existingUser = await admin.auth().getUserByPhoneNumber(cleanPhone);
    userId = existingUser.uid;
    console.log(`[FlowHandler] Found existing user: ${userId}`);
  } catch {
    const newUser = await admin.auth().createUser({
      phoneNumber: cleanPhone,
      displayName: (profileData.full_name as string) || (profileData.agency_name as string) || undefined,
    });
    userId = newUser.uid;
    console.log(`[FlowHandler] Created new user: ${userId}`);
  }

  const hasuraRole = userType === 'agency' ? 'agency' : userType;
  await admin.auth().setCustomUserClaims(userId, {
    user_type: userType,
    'https://hasura.io/jwt/claims': {
      'x-hasura-allowed-roles': ['user', hasuraRole],
      'x-hasura-default-role': hasuraRole,
      'x-hasura-user-id': userId,
    },
  });

  const client = getAdminClient();

  let userEmail = '';
  try {
    const userRecord = await admin.auth().getUser(userId);
    userEmail = userRecord.email || '';
  } catch {
    // No email available
  }

  const profileRow = {
    id: userId,
    email: userEmail,
    full_name: (profileData.full_name as string) || (profileData.agency_name as string) || '',
    phone: cleanPhone,
    country: (profileData.country as string) || '',
    user_type: userType,
    registration_complete: true,
    is_active: true,
    updated_at: new Date().toISOString(),
  };

  await client.request(UPSERT_PROFILE, { data: profileRow });

  if (userType === 'maid') {
    const maidData = normalizeMaidData(userId, { ...profileData, phone_number: cleanPhone });
    await client.request(UPSERT_MAID_PROFILE, { data: maidData });
  } else if (userType === 'sponsor') {
    const sponsorData = normalizeSponsorData(userId, profileData);
    await client.request(UPSERT_SPONSOR_PROFILE, { data: sponsorData });
  } else if (userType === 'agency') {
    const agencyData = normalizeAgencyData(userId, { ...profileData, agencyName: profileData.agency_name });
    await client.request(UPSERT_AGENCY_PROFILE, { data: agencyData });
  }

  await sendWhatsAppConfirmation(cleanPhone, userType, profileData);
}

// ── WhatsApp Confirmation ──

async function sendWhatsAppConfirmation(
  phone: string,
  userType: string,
  data: Record<string, unknown>
): Promise<void> {
  const config = getWhatsAppConfig();
  if (!config.phoneNumberId || !config.accessToken) {
    console.warn('[FlowHandler] WhatsApp not configured, skipping confirmation');
    return;
  }

  const name = (data.full_name as string) || (data.agency_name as string) || 'there';
  const dashboardPath = userType === 'maid' ? 'maid' : userType === 'sponsor' ? 'sponsor' : 'agency';
  const hasEmail = data.email ? `\nYou can also log in with your email: ${data.email}` : '';

  const message = [
    `Welcome to Ethiopian Maids, ${name}! Your ${userType} profile has been created successfully.`,
    '',
    `To view and manage your profile, visit:`,
    `https://ethiopianmaids.com/dashboard/${dashboardPath}/profile`,
    '',
    `You can log in using your phone number ${phone}.${hasEmail}`,
  ].join('\n');

  const apiPhone = phone.startsWith('+') ? phone.substring(1) : phone;

  try {
    const url = `https://graph.facebook.com/${config.apiVersion}/${config.phoneNumberId}/messages`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: apiPhone,
        type: 'text',
        text: { body: message },
      }),
    });

    if (!response.ok) {
      const err = await response.json();
      console.error('[FlowHandler] WhatsApp confirmation failed:', err);
    } else {
      console.log(`[FlowHandler] Confirmation sent to ${apiPhone}`);
    }
  } catch (error) {
    console.error('[FlowHandler] Failed to send WhatsApp confirmation:', error);
  }
}

// ── V1 Helpers for accumulating data across screens ──

function prefixData(prefix: string, data: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    if (key === 'flow_token' || key === 'action' || key === 'screen') continue;
    if (key === '_phone_number') {
      result[key] = value;
      continue;
    }
    result[`${prefix}_${key}`] = value;
  }
  return result;
}

function mergeAccumulatedData(data: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  const prefixPattern = /^(maid[123]|sponsor[123]|agency[123])_/;

  for (const [key, value] of Object.entries(data)) {
    if (key === 'flow_token' || key === 'action' || key === 'screen') continue;
    const stripped = key.replace(prefixPattern, '');
    if (value !== undefined && value !== null) {
      result[stripped] = value;
    }
  }

  return result;
}
