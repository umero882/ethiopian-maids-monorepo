# i18n String Extraction Summary

**Date**: October 21, 2025
**Project**: Ethiopian Maids Platform

## Extraction Results

### Overview
- **Files Scanned**: 499
- **Total Strings Found**: 4,812
- **Unique Strings**: 2,899

### Category Breakdown

| Category | Count | Percentage |
|----------|-------|------------|
| JSX Text Content | 2,145 | 74.0% |
| String Props | 532 | 18.4% |
| Validation Messages | 117 | 4.0% |
| Alert/Toast Messages | 102 | 3.5% |
| Headings | 3 | 0.1% |

### Top Files Needing Translation

1. `components/profile/completion/AgencyCompletionForm_backup.jsx` - 182 strings
2. `components/jobs/JobPostingForm.jsx` - 121 strings
3. `pages/dashboards/maid/MaidProfilePage.jsx` - 101 strings
4. `pages/dashboards/agency/AgencySupportPage.jsx` - 87 strings
5. `pages/dashboards/maid/MaidSettingsPage.jsx` - 83 strings

### Most Frequent Strings

These strings appear multiple times and should be prioritized for translation:

- **Actions** (50 occurrences)
- **Status** (42 occurrences)
- **All Status** (22 occurrences)
- **Verified** (21 occurrences)
- **Pending** (20 occurrences)
- **Active** (17 occurrences)
- **Rejected** (17 occurrences)

## Generated Files

### 1. `locales/extracted.json` (179 KB)
Contains all extracted strings organized by category. Each entry includes the original English text.

**Example structure**:
```json
{
  "jsx_text_content": {
    "jsx_text_content.loading_application": "Loading application...",
    "jsx_text_content.application_not_found": "Application Not Found"
  },
  "string_props": {
    "string_props.enter_your_email": "Enter your email"
  }
}
```

### 2. `locales/extraction-report.json` (900 KB)
Detailed report with file locations and line numbers for each string occurrence.

**Example entry**:
```json
{
  "text": "Save Changes",
  "category": "Button/Link Text",
  "count": 5,
  "occurrences": [
    { "file": "src/components/Profile.jsx", "line": 42 },
    { "file": "src/components/Settings.jsx", "line": 88 }
  ]
}
```

## What Was Extracted

### 1. JSX Text Content (2,145 strings)
Text between JSX tags that's visible to users:
```jsx
<div>Loading application...</div>
<h1>Application Review</h1>
<button>Submit</button>
```

### 2. String Props (532 strings)
Text in component properties:
```jsx
<input placeholder="Enter your email" />
<button title="Save changes" />
<img alt="Profile photo" />
```

### 3. Validation Messages (117 strings)
Form validation error messages:
```javascript
message: "This field is required"
message: "Invalid email format"
```

### 4. Alert/Toast Messages (102 strings)
User notifications:
```javascript
alert("Profile updated successfully")
toast("Error saving changes")
```

## Next Steps

### 1. Review Extracted Strings
```bash
cd packages/i18n
code locales/extracted.json
```

Review the extracted strings and identify which ones need translation vs which are technical/not user-facing.

### 2. Organize Into Categories
Merge relevant strings from `extracted.json` into `en.json` under appropriate categories:

```json
{
  "common": {
    "buttons": { ... },
    "status": {
      "pending": "Pending",
      "active": "Active",
      "rejected": "Rejected"
    }
  }
}
```

### 3. Translate to Arabic
For each key in `en.json`, add the Arabic translation to `ar.json`:

```json
{
  "common": {
    "buttons": {
      "save": "حفظ",
      "cancel": "إلغاء"
    }
  }
}
```

### 4. Check Completeness
```bash
pnpm run check
```

This will verify all English keys have Arabic translations.

### 5. Replace Hard-Coded Strings
Update components to use the translation function:

**Before:**
```jsx
<button>Save Changes</button>
```

**After:**
```jsx
import { t } from '@ethio-maids/i18n';

<button>{t(locale, 'common.buttons.save')}</button>
```

## Priority Areas

### High Priority (User-Facing)
1. **Common UI Elements** - buttons, labels, status messages
2. **Registration/Login** - forms, validation messages
3. **Profile Pages** - field labels, section headings
4. **Job Postings** - form fields, status labels
5. **Dashboard** - stats, actions, quick links

### Medium Priority
1. **Settings Pages** - configuration options
2. **Support Pages** - help text, FAQs
3. **Admin Pages** - management interfaces

### Low Priority
1. **Development Tools** - debug messages
2. **Test Files** - mock data
3. **Backup Files** - deprecated code

## Translation Guidelines

### 1. Consistency
Use consistent terminology throughout:
- "Maid" vs "Domestic Worker" vs "Worker"
- "Sponsor" vs "Employer" vs "Client"
- "Job" vs "Position" vs "Vacancy"

### 2. Cultural Adaptation
Consider cultural context for Arabic translations:
- Formal vs informal language
- Gender-specific terms
- Regional dialects (Gulf Arabic)

### 3. Technical Terms
Keep some terms in English if commonly understood:
- "Email"
- "Profile"
- "Status"

Or provide both:
- "البريد الإلكتروني (Email)"

### 4. Right-to-Left (RTL)
Test all translations with RTL layout:
- Numbers and dates
- Mixed English/Arabic text
- Icons and buttons

### 5. String Length
Arabic text is typically 20-30% longer than English. Ensure:
- Buttons have adequate width
- Labels don't overflow
- Responsive design accommodates longer text

## Scripts

### Extract Strings
```bash
# Full extraction (overwrites extracted.json)
pnpm run extract

# Preview without writing
pnpm run extract:dry

# Merge into existing en.json
pnpm run extract:merge
```

### Show Statistics
```bash
pnpm run stats
```

### Check Completeness
```bash
pnpm run check
```

## Automation Workflow

### Daily/Weekly
```bash
# Extract new strings from codebase
cd packages/i18n
pnpm run extract

# Review changes
git diff locales/extracted.json

# Update en.json with new strings
# (manual review and organization)

# Check for missing translations
pnpm run check
```

### Before Release
1. Run extraction to catch any new strings
2. Verify all strings are translated
3. Test RTL layout thoroughly
4. Review cultural appropriateness
5. Get native speaker review

## Common Issues

### 1. Dynamic Strings
**Problem**: Variables in strings
```jsx
const msg = `Welcome ${userName}!`;
```

**Solution**: Use interpolation
```jsx
const msg = t(locale, 'welcome.greeting', { name: userName });
// en.json: "welcome.greeting": "Welcome {{name}}!"
// ar.json: "welcome.greeting": "مرحبا {{name}}!"
```

### 2. Plurals
**Problem**: Different forms for singular/plural
```jsx
`${count} message${count === 1 ? '' : 's'}`
```

**Solution**: Use separate keys
```jsx
count === 1
  ? t(locale, 'messages.one')
  : t(locale, 'messages.other', { count })
```

### 3. HTML in Translations
**Problem**: Formatted text
```jsx
<p>By signing up, you agree to our <a href="/terms">Terms</a></p>
```

**Solution**: Split into parts
```jsx
{t(locale, 'signup.agreeTo')}
<a href="/terms">{t(locale, 'common.terms')}</a>
```

## Statistics at a Glance

```
📊 Extraction Results
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Files Scanned:      499
Total Strings:      4,812
Unique Strings:     2,899

Top Categories:
  JSX Text:         2,145 (74%)
  Props:              532 (18%)
  Validation:         117 (4%)
  Messages:           102 (4%)

Top Files:
  1. AgencyCompletionForm_backup.jsx    182 strings
  2. JobPostingForm.jsx                 121 strings
  3. MaidProfilePage.jsx                101 strings

Most Common:
  "Actions" (50x), "Status" (42x), "All Status" (22x)
```

## Resources

- **Documentation**: See `README.md` for full usage guide
- **Examples**: Check existing translations in `locales/en.json`
- **Tools**: Use VS Code with i18n Ally extension for easier translation
- **Testing**: Test all translations in both LTR and RTL modes

## Contact

For questions about translations or the extraction process:
- Check extraction-report.json for string locations
- Run `pnpm run stats` for updated statistics
- Review README.md for best practices
