/**
 * Bio Generator - Auto-generates About Me text for WhatsApp Flow v2 onboarding.
 *
 * Generates role-specific bios from accumulated form data.
 * Users see the generated text as an init-value in a TextArea and can edit before submitting.
 */

// ID-to-label lookup helper
const idToLabel = (id: string): string =>
  id.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

// ── Maid Bio ──

export function generateMaidBio(data: Record<string, unknown>): string {
  const name = (data.full_name as string) || 'I';
  const nationality = data.nationality ? idToLabel(data.nationality as string) : '';
  const profession = data.profession ? idToLabel(data.profession as string) : 'domestic worker';
  const experience = data.experience_level ? idToLabel(data.experience_level as string) : '';
  const city = data.city ? idToLabel(data.city as string) : '';
  const country = data.country ? idToLabel(data.country as string) : '';

  const languages = Array.isArray(data.languages)
    ? (data.languages as string[]).map(idToLabel).join(', ')
    : '';
  const skills = Array.isArray(data.skills)
    ? (data.skills as string[]).map(idToLabel).join(', ')
    : '';

  const parts: string[] = [];

  // Opening
  if (nationality) {
    parts.push(`I am ${name}, a ${nationality} ${profession}.`);
  } else {
    parts.push(`I am ${name}, a ${profession}.`);
  }

  // Experience
  if (experience) {
    parts.push(`I have ${experience.toLowerCase()} of experience.`);
  }

  // Languages
  if (languages) {
    parts.push(`I speak ${languages}.`);
  }

  // Skills
  if (skills) {
    parts.push(`I specialize in ${skills.toLowerCase()}.`);
  }

  // Location
  if (city && country) {
    parts.push(`Currently based in ${city}, ${country}.`);
  } else if (country) {
    parts.push(`Currently based in ${country}.`);
  }

  return parts.join(' ');
}

// ── Sponsor Bio ──

export function generateSponsorBio(data: Record<string, unknown>): string {
  const familySize = data.family_size ? idToLabel(data.family_size as string) : '';
  const city = data.city ? idToLabel(data.city as string) : '';
  const country = data.country ? idToLabel(data.country as string) : '';
  const salaryBudget = data.salary_budget ? idToLabel(data.salary_budget as string) : '';
  const livingArrangement = data.living_arrangement ? idToLabel(data.living_arrangement as string) : '';

  const requiredSkills = Array.isArray(data.required_skills)
    ? (data.required_skills as string[]).map(idToLabel).join(', ')
    : '';

  const parts: string[] = [];

  // Family
  if (familySize) {
    const location = city && country ? `${city}, ${country}` : country || city || '';
    parts.push(`We are a family of ${familySize.toLowerCase()}${location ? ` in ${location}` : ''}.`);
  }

  // Requirements
  if (requiredSkills) {
    parts.push(`Looking for a worker skilled in ${requiredSkills.toLowerCase()}.`);
  }

  // Budget
  if (salaryBudget) {
    parts.push(`Budget: ${salaryBudget}.`);
  }

  // Living arrangement
  if (livingArrangement) {
    parts.push(`Arrangement: ${livingArrangement.toLowerCase()}.`);
  }

  return parts.join(' ') || 'We are looking for a reliable domestic worker to join our family.';
}

// ── Agency Bio ──

export function generateAgencyBio(data: Record<string, unknown>): string {
  const agencyName = (data.agency_name as string) || 'Our agency';
  const agencyType = data.agency_type ? idToLabel(data.agency_type as string) : '';
  const country = data.country ? idToLabel(data.country as string) : '';
  const city = data.city ? idToLabel(data.city as string) : '';
  const yearsInBusiness = data.years_in_business ? idToLabel(data.years_in_business as string) : '';

  const services = Array.isArray(data.services)
    ? (data.services as string[]).map(idToLabel).join(', ')
    : '';
  const countriesOfOperation = Array.isArray(data.countries_of_operation)
    ? (data.countries_of_operation as string[]).map(idToLabel).join(', ')
    : '';

  const parts: string[] = [];

  // Opening
  if (agencyType) {
    const location = city && country ? `${city}, ${country}` : country || '';
    parts.push(`${agencyName} is a ${agencyType.toLowerCase()}${location ? ` based in ${location}` : ''}.`);
  } else {
    parts.push(`${agencyName} is a recruitment agency.`);
  }

  // Experience
  if (yearsInBusiness) {
    parts.push(`With ${yearsInBusiness.toLowerCase()} of experience in the industry.`);
  }

  // Services
  if (services) {
    parts.push(`Services: ${services.toLowerCase()}.`);
  }

  // Coverage
  if (countriesOfOperation) {
    parts.push(`Operating in ${countriesOfOperation}.`);
  }

  return parts.join(' ');
}
