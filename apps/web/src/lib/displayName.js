// Utility helpers to compute display names across entities

export const getDisplayName = (entity) => {
  if (!entity) return 'Someone';
  // full_name is the standard field name in the database
  const full = (entity.full_name || entity.fullName || '').toString().trim();
  if (full) return full;
  const parts = [entity.firstName, entity.middleName, entity.lastName]
    .filter((p) => typeof p === 'string' && p.trim())
    .join(' ')
    .trim();
  if (parts) return parts;
  // Fallback to email username if available
  if (entity.email) {
    const emailName = entity.email.split('@')[0];
    return emailName.charAt(0).toUpperCase() + emailName.slice(1);
  }
  return 'Someone';
};

export const getMaidDisplayName = (maid) => getDisplayName(maid);

export const getSponsorDisplayName = (sponsor) => getDisplayName(sponsor);

export const getAgencyDisplayName = (agency) => {
  if (!agency) return 'Agency';
  // full_name is the standard field name in agency_profiles table
  const v = (agency.full_name || agency.fullName || '').toString().trim();
  if (v) return v;
  // Fallback to email username if available
  if (agency.email) {
    const emailName = agency.email.split('@')[0];
    return emailName.charAt(0).toUpperCase() + emailName.slice(1);
  }
  return 'Agency';
};

export default getDisplayName;

