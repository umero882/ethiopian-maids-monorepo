/**
 * Privacy Policy Page
 *
 * Comprehensive GDPR-compliant privacy policy for Ethiopian Maids platform.
 */

import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Shield, Eye, Database, Lock, Globe, UserCheck, Bell, Mail, Phone, FileText, CheckCircle, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePageTitle } from '@/hooks/usePageTitle';

const PrivacyPolicy = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const fromPage = location.state?.from || '/';
  const lastUpdated = 'January 2025';
  const effectiveDate = 'January 1, 2025';

  usePageTitle('Privacy Policy');
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-white/10 rounded-xl">
              <Shield className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-4xl font-bold">Privacy Policy</h1>
              <p className="mt-2 text-purple-100">Last updated: {lastUpdated}</p>
            </div>
          </div>
          <p className="text-lg text-purple-100 max-w-2xl">
            Your privacy is important to us. This policy explains how we collect, use,
            protect, and share your personal information.
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">

          {/* GDPR Notice */}
          <div className="mb-10 p-6 bg-green-50 border border-green-200 rounded-xl">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-green-100 rounded-lg">
                <Shield className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-green-800">GDPR Compliant</h3>
                <p className="text-green-700 text-sm mt-1">
                  This privacy policy is designed to comply with the General Data Protection Regulation (GDPR)
                  and other applicable data protection laws. We are committed to protecting your personal data
                  and respecting your privacy rights.
                </p>
              </div>
            </div>
          </div>

          {/* Table of Contents */}
          <nav className="mb-12 p-6 bg-slate-50 rounded-xl">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Table of Contents</h2>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
              {[
                '1. Introduction',
                '2. Information We Collect',
                '3. How We Collect Information',
                '4. How We Use Your Information',
                '5. Information Sharing',
                '6. Data Retention',
                '7. Data Security',
                '8. International Transfers',
                '9. Your Rights',
                '10. Children\'s Privacy',
                '11. Third-Party Links',
                '12. Cookies',
                '13. Policy Changes',
                '14. Contact Us',
              ].map((item, index) => (
                <li key={index}>
                  <a href={`#privacy-section-${index + 1}`} className="text-purple-600 hover:text-purple-800 hover:underline">
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          {/* Section 1 */}
          <section id="privacy-section-1" className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
              <span className="flex items-center justify-center w-8 h-8 bg-purple-100 text-purple-600 rounded-full text-sm font-bold">1</span>
              Introduction
            </h2>
            <div className="prose prose-slate max-w-none">
              <p className="text-gray-600 leading-relaxed mb-4">
                Ethiopian Maids ("we", "us", or "our") operates the ethiopianmaids.com website and mobile application
                (collectively, the "Platform"). This Privacy Policy describes how we collect, use, maintain, and
                disclose information from users of our Platform.
              </p>
              <p className="text-gray-600 leading-relaxed mb-4">
                We are committed to protecting your privacy and ensuring you have a positive experience on our Platform.
                This policy applies to all users, including:
              </p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2 mb-4">
                <li><strong>Sponsors (Employers):</strong> Individuals seeking domestic workers</li>
                <li><strong>Maids (Domestic Workers):</strong> Individuals seeking employment</li>
                <li><strong>Agencies:</strong> Recruitment agencies managing worker placements</li>
                <li><strong>Visitors:</strong> Anyone browsing our Platform</li>
              </ul>
              <p className="text-gray-600 leading-relaxed mb-4">
                By using our Platform, you consent to the data practices described in this Privacy Policy.
                If you do not agree with these practices, please do not use our Services.
              </p>
            </div>
          </section>

          {/* Section 2 */}
          <section id="privacy-section-2" className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
              <span className="flex items-center justify-center w-8 h-8 bg-purple-100 text-purple-600 rounded-full text-sm font-bold">2</span>
              Information We Collect
            </h2>
            <div className="prose prose-slate max-w-none">
              <h3 className="text-lg font-semibold text-gray-800 mt-6 mb-3 flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-purple-600" />
                2.1 Personal Information
              </h3>
              <p className="text-gray-600 leading-relaxed mb-4">
                We collect information you provide directly to us, including:
              </p>
              <div className="grid gap-4 mb-6">
                <div className="p-4 bg-slate-50 rounded-lg">
                  <h4 className="font-semibold text-gray-900">Identity Information</h4>
                  <p className="text-gray-600 text-sm mt-1">
                    Full name, date of birth, gender, nationality, passport/ID numbers, photographs
                  </p>
                </div>
                <div className="p-4 bg-slate-50 rounded-lg">
                  <h4 className="font-semibold text-gray-900">Contact Information</h4>
                  <p className="text-gray-600 text-sm mt-1">
                    Email address, phone number, physical address, emergency contacts
                  </p>
                </div>
                <div className="p-4 bg-slate-50 rounded-lg">
                  <h4 className="font-semibold text-gray-900">Account Information</h4>
                  <p className="text-gray-600 text-sm mt-1">
                    Username, password (encrypted), account preferences, profile settings
                  </p>
                </div>
                <div className="p-4 bg-slate-50 rounded-lg">
                  <h4 className="font-semibold text-gray-900">Employment Information (Maids)</h4>
                  <p className="text-gray-600 text-sm mt-1">
                    Work experience, skills, certifications, education, references, availability, salary expectations
                  </p>
                </div>
                <div className="p-4 bg-slate-50 rounded-lg">
                  <h4 className="font-semibold text-gray-900">Employment Requirements (Sponsors)</h4>
                  <p className="text-gray-600 text-sm mt-1">
                    Job requirements, household size, preferred qualifications, budget, location
                  </p>
                </div>
                <div className="p-4 bg-slate-50 rounded-lg">
                  <h4 className="font-semibold text-gray-900">Payment Information</h4>
                  <p className="text-gray-600 text-sm mt-1">
                    Payment method details, billing address, transaction history (processed via Stripe)
                  </p>
                </div>
                <div className="p-4 bg-slate-50 rounded-lg">
                  <h4 className="font-semibold text-gray-900">Verification Documents</h4>
                  <p className="text-gray-600 text-sm mt-1">
                    Passport copies, medical certificates, police clearance, educational certificates, agency licenses
                  </p>
                </div>
              </div>

              <h3 className="text-lg font-semibold text-gray-800 mt-6 mb-3 flex items-center gap-2">
                <Database className="h-5 w-5 text-purple-600" />
                2.2 Automatically Collected Information
              </h3>
              <p className="text-gray-600 leading-relaxed mb-4">
                When you use our Platform, we automatically collect:
              </p>
              <div className="grid gap-4 mb-6">
                <div className="p-4 bg-slate-50 rounded-lg">
                  <h4 className="font-semibold text-gray-900">Device Information</h4>
                  <p className="text-gray-600 text-sm mt-1">
                    Device type, operating system, unique device identifiers, browser type and version
                  </p>
                </div>
                <div className="p-4 bg-slate-50 rounded-lg">
                  <h4 className="font-semibold text-gray-900">Usage Information</h4>
                  <p className="text-gray-600 text-sm mt-1">
                    Pages visited, features used, search queries, time spent, click patterns
                  </p>
                </div>
                <div className="p-4 bg-slate-50 rounded-lg">
                  <h4 className="font-semibold text-gray-900">Location Information</h4>
                  <p className="text-gray-600 text-sm mt-1">
                    IP address, approximate location (city/country), timezone
                  </p>
                </div>
                <div className="p-4 bg-slate-50 rounded-lg">
                  <h4 className="font-semibold text-gray-900">Communication Data</h4>
                  <p className="text-gray-600 text-sm mt-1">
                    Messages sent through our platform, support tickets, feedback submitted
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Section 3 */}
          <section id="privacy-section-3" className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
              <span className="flex items-center justify-center w-8 h-8 bg-purple-100 text-purple-600 rounded-full text-sm font-bold">3</span>
              How We Collect Information
            </h2>
            <div className="prose prose-slate max-w-none">
              <p className="text-gray-600 leading-relaxed mb-4">
                We collect information through the following methods:
              </p>

              <h3 className="text-lg font-semibold text-gray-800 mt-6 mb-3">3.1 Direct Collection</h3>
              <ul className="list-disc pl-6 text-gray-600 space-y-2 mb-4">
                <li>Account registration and profile creation</li>
                <li>Job postings and applications</li>
                <li>Document uploads and verifications</li>
                <li>Customer support interactions</li>
                <li>Surveys and feedback forms</li>
                <li>Payment transactions</li>
              </ul>

              <h3 className="text-lg font-semibold text-gray-800 mt-6 mb-3">3.2 Automatic Collection</h3>
              <ul className="list-disc pl-6 text-gray-600 space-y-2 mb-4">
                <li>Cookies and similar tracking technologies</li>
                <li>Server logs and analytics tools</li>
                <li>Mobile device sensors (with permission)</li>
              </ul>

              <h3 className="text-lg font-semibold text-gray-800 mt-6 mb-3">3.3 Third-Party Sources</h3>
              <ul className="list-disc pl-6 text-gray-600 space-y-2 mb-4">
                <li>Social media platforms (if you sign in via social login)</li>
                <li>Background check providers (with your consent)</li>
                <li>Verification services</li>
                <li>Payment processors</li>
              </ul>
            </div>
          </section>

          {/* Section 4 */}
          <section id="privacy-section-4" className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
              <span className="flex items-center justify-center w-8 h-8 bg-purple-100 text-purple-600 rounded-full text-sm font-bold">4</span>
              How We Use Your Information
            </h2>
            <div className="prose prose-slate max-w-none">
              <p className="text-gray-600 leading-relaxed mb-4">
                We use collected information for the following purposes:
              </p>

              <div className="grid gap-4">
                <div className="p-4 border border-gray-200 rounded-lg">
                  <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                    <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
                    Service Delivery
                  </h4>
                  <p className="text-gray-600 text-sm mt-2">
                    To provide, maintain, and improve our Platform services; to process transactions;
                    to match Sponsors with Maids; to facilitate communications between users.
                  </p>
                </div>
                <div className="p-4 border border-gray-200 rounded-lg">
                  <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                    <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
                    Account Management
                  </h4>
                  <p className="text-gray-600 text-sm mt-2">
                    To create and manage your account; to verify your identity; to respond to your
                    requests and provide customer support.
                  </p>
                </div>
                <div className="p-4 border border-gray-200 rounded-lg">
                  <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                    <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
                    Communication
                  </h4>
                  <p className="text-gray-600 text-sm mt-2">
                    To send service-related notices, updates, and promotional materials (with consent);
                    to respond to inquiries and feedback.
                  </p>
                </div>
                <div className="p-4 border border-gray-200 rounded-lg">
                  <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                    <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
                    Safety & Security
                  </h4>
                  <p className="text-gray-600 text-sm mt-2">
                    To verify user identities; to detect and prevent fraud; to ensure platform security;
                    to enforce our Terms of Service.
                  </p>
                </div>
                <div className="p-4 border border-gray-200 rounded-lg">
                  <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                    <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
                    Legal Compliance
                  </h4>
                  <p className="text-gray-600 text-sm mt-2">
                    To comply with legal obligations; to respond to legal requests; to protect our rights
                    and the rights of others.
                  </p>
                </div>
                <div className="p-4 border border-gray-200 rounded-lg">
                  <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                    <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
                    Analytics & Improvement
                  </h4>
                  <p className="text-gray-600 text-sm mt-2">
                    To analyze usage patterns; to improve our services; to develop new features;
                    to conduct research.
                  </p>
                </div>
              </div>

              <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-lg mt-6">
                <p className="text-blue-800 text-sm">
                  <strong>Legal Basis (GDPR):</strong> We process your personal data based on: (1) your consent,
                  (2) performance of a contract, (3) our legitimate interests, or (4) legal obligations.
                </p>
              </div>
            </div>
          </section>

          {/* Section 5 */}
          <section id="privacy-section-5" className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
              <span className="flex items-center justify-center w-8 h-8 bg-purple-100 text-purple-600 rounded-full text-sm font-bold">5</span>
              Information Sharing & Disclosure
            </h2>
            <div className="prose prose-slate max-w-none">
              <p className="text-gray-600 leading-relaxed mb-4">
                We do not sell your personal information. We may share your information in the following circumstances:
              </p>

              <h3 className="text-lg font-semibold text-gray-800 mt-6 mb-3">5.1 With Other Users</h3>
              <p className="text-gray-600 leading-relaxed mb-4">
                Your profile information is shared with other users to facilitate matching:
              </p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2 mb-4">
                <li>Maid profiles are visible to Sponsors searching for domestic workers</li>
                <li>Sponsor job postings are visible to Maids and Agencies</li>
                <li>Contact information is shared only after mutual agreement</li>
              </ul>

              <h3 className="text-lg font-semibold text-gray-800 mt-6 mb-3">5.2 With Service Providers</h3>
              <p className="text-gray-600 leading-relaxed mb-4">
                We share information with trusted third-party service providers who assist us in:
              </p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2 mb-4">
                <li>Payment processing (Stripe)</li>
                <li>Cloud hosting and storage (Firebase, Hasura)</li>
                <li>Analytics and monitoring (Google Analytics)</li>
                <li>Communication services (email, SMS providers)</li>
                <li>Background verification services</li>
              </ul>

              <h3 className="text-lg font-semibold text-gray-800 mt-6 mb-3">5.3 For Legal Reasons</h3>
              <p className="text-gray-600 leading-relaxed mb-4">
                We may disclose information when required by law or to:
              </p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2 mb-4">
                <li>Comply with legal processes or government requests</li>
                <li>Enforce our Terms of Service</li>
                <li>Protect our rights, privacy, safety, or property</li>
                <li>Investigate potential violations</li>
              </ul>

              <h3 className="text-lg font-semibold text-gray-800 mt-6 mb-3">5.4 Business Transfers</h3>
              <p className="text-gray-600 leading-relaxed mb-4">
                In the event of a merger, acquisition, or sale of assets, your information may be transferred
                to the acquiring entity. We will notify you of any such change.
              </p>
            </div>
          </section>

          {/* Section 6 */}
          <section id="privacy-section-6" className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
              <span className="flex items-center justify-center w-8 h-8 bg-purple-100 text-purple-600 rounded-full text-sm font-bold">6</span>
              Data Retention
            </h2>
            <div className="prose prose-slate max-w-none">
              <p className="text-gray-600 leading-relaxed mb-4">
                We retain your personal information for as long as necessary to provide our services and
                fulfill the purposes described in this policy. Specific retention periods include:
              </p>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm mb-6">
                  <thead>
                    <tr className="bg-slate-100">
                      <th className="px-4 py-2 text-left text-gray-700">Data Type</th>
                      <th className="px-4 py-2 text-left text-gray-700">Retention Period</th>
                    </tr>
                  </thead>
                  <tbody className="text-gray-600">
                    <tr className="border-b">
                      <td className="px-4 py-2">Active account data</td>
                      <td className="px-4 py-2">Duration of account + 3 years</td>
                    </tr>
                    <tr className="border-b">
                      <td className="px-4 py-2">Transaction records</td>
                      <td className="px-4 py-2">7 years (legal requirement)</td>
                    </tr>
                    <tr className="border-b">
                      <td className="px-4 py-2">Communication logs</td>
                      <td className="px-4 py-2">2 years after account closure</td>
                    </tr>
                    <tr className="border-b">
                      <td className="px-4 py-2">Verification documents</td>
                      <td className="px-4 py-2">5 years after last verification</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2">Analytics data</td>
                      <td className="px-4 py-2">26 months (anonymized)</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="text-gray-600 leading-relaxed mb-4">
                When data is no longer needed, we will securely delete or anonymize it.
              </p>
            </div>
          </section>

          {/* Section 7 */}
          <section id="privacy-section-7" className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
              <span className="flex items-center justify-center w-8 h-8 bg-purple-100 text-purple-600 rounded-full text-sm font-bold">7</span>
              Data Security
            </h2>
            <div className="prose prose-slate max-w-none">
              <p className="text-gray-600 leading-relaxed mb-4">
                We implement robust security measures to protect your personal information:
              </p>

              <div className="grid gap-4 mb-6">
                <div className="p-4 border border-green-200 bg-green-50 rounded-lg">
                  <h4 className="font-semibold text-green-800 flex items-center gap-2">
                    <Lock className="h-5 w-5" />
                    Encryption
                  </h4>
                  <p className="text-green-700 text-sm mt-2">
                    256-bit SSL/TLS encryption for data in transit; AES-256 encryption for data at rest
                  </p>
                </div>
                <div className="p-4 border border-green-200 bg-green-50 rounded-lg">
                  <h4 className="font-semibold text-green-800 flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Access Controls
                  </h4>
                  <p className="text-green-700 text-sm mt-2">
                    Role-based access controls; multi-factor authentication; regular access audits
                  </p>
                </div>
                <div className="p-4 border border-green-200 bg-green-50 rounded-lg">
                  <h4 className="font-semibold text-green-800 flex items-center gap-2">
                    <Eye className="h-5 w-5" />
                    Monitoring
                  </h4>
                  <p className="text-green-700 text-sm mt-2">
                    24/7 security monitoring; intrusion detection systems; regular vulnerability assessments
                  </p>
                </div>
                <div className="p-4 border border-green-200 bg-green-50 rounded-lg">
                  <h4 className="font-semibold text-green-800 flex items-center gap-2">
                    <Database className="h-5 w-5" />
                    Infrastructure
                  </h4>
                  <p className="text-green-700 text-sm mt-2">
                    Secure cloud infrastructure; regular backups; disaster recovery procedures
                  </p>
                </div>
              </div>

              <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded-r-lg">
                <p className="text-amber-800 text-sm">
                  <strong>Note:</strong> While we implement strong security measures, no method of transmission
                  over the Internet is 100% secure. We cannot guarantee absolute security but will notify
                  you promptly in case of a data breach.
                </p>
              </div>
            </div>
          </section>

          {/* Section 8 */}
          <section id="privacy-section-8" className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
              <span className="flex items-center justify-center w-8 h-8 bg-purple-100 text-purple-600 rounded-full text-sm font-bold">8</span>
              International Data Transfers
            </h2>
            <div className="prose prose-slate max-w-none">
              <p className="text-gray-600 leading-relaxed mb-4">
                Ethiopian Maids operates in multiple countries, including Ethiopia and the GCC region
                (UAE, Saudi Arabia, Qatar, Kuwait, Bahrain, Oman). Your information may be transferred
                to and processed in countries other than your own.
              </p>
              <p className="text-gray-600 leading-relaxed mb-4">
                When we transfer data internationally, we ensure appropriate safeguards are in place:
              </p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2 mb-4">
                <li>Standard Contractual Clauses approved by relevant authorities</li>
                <li>Binding Corporate Rules where applicable</li>
                <li>Compliance with local data protection requirements</li>
                <li>Adequate level of protection in receiving countries</li>
              </ul>
            </div>
          </section>

          {/* Section 9 */}
          <section id="privacy-section-9" className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
              <span className="flex items-center justify-center w-8 h-8 bg-purple-100 text-purple-600 rounded-full text-sm font-bold">9</span>
              Your Rights
            </h2>
            <div className="prose prose-slate max-w-none">
              <p className="text-gray-600 leading-relaxed mb-4">
                Depending on your location, you may have the following rights regarding your personal data:
              </p>

              <div className="grid gap-4 mb-6">
                <div className="p-4 bg-slate-50 rounded-lg">
                  <h4 className="font-semibold text-gray-900">Right to Access</h4>
                  <p className="text-gray-600 text-sm mt-1">
                    Request a copy of the personal data we hold about you
                  </p>
                </div>
                <div className="p-4 bg-slate-50 rounded-lg">
                  <h4 className="font-semibold text-gray-900">Right to Rectification</h4>
                  <p className="text-gray-600 text-sm mt-1">
                    Request correction of inaccurate or incomplete personal data
                  </p>
                </div>
                <div className="p-4 bg-slate-50 rounded-lg">
                  <h4 className="font-semibold text-gray-900">Right to Erasure ("Right to be Forgotten")</h4>
                  <p className="text-gray-600 text-sm mt-1">
                    Request deletion of your personal data under certain circumstances
                  </p>
                </div>
                <div className="p-4 bg-slate-50 rounded-lg">
                  <h4 className="font-semibold text-gray-900">Right to Restrict Processing</h4>
                  <p className="text-gray-600 text-sm mt-1">
                    Request limitation of how we process your data
                  </p>
                </div>
                <div className="p-4 bg-slate-50 rounded-lg">
                  <h4 className="font-semibold text-gray-900">Right to Data Portability</h4>
                  <p className="text-gray-600 text-sm mt-1">
                    Receive your data in a structured, commonly used format
                  </p>
                </div>
                <div className="p-4 bg-slate-50 rounded-lg">
                  <h4 className="font-semibold text-gray-900">Right to Object</h4>
                  <p className="text-gray-600 text-sm mt-1">
                    Object to processing based on legitimate interests or for direct marketing
                  </p>
                </div>
                <div className="p-4 bg-slate-50 rounded-lg">
                  <h4 className="font-semibold text-gray-900">Right to Withdraw Consent</h4>
                  <p className="text-gray-600 text-sm mt-1">
                    Withdraw consent at any time where processing is based on consent
                  </p>
                </div>
              </div>

              <p className="text-gray-600 leading-relaxed mb-4">
                To exercise any of these rights, please contact us at{' '}
                <a href="mailto:privacy@ethiopianmaids.com" className="text-purple-600 hover:text-purple-800">
                  privacy@ethiopianmaids.com
                </a>. We will respond to your request within 30 days.
              </p>
            </div>
          </section>

          {/* Section 10 */}
          <section id="privacy-section-10" className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
              <span className="flex items-center justify-center w-8 h-8 bg-purple-100 text-purple-600 rounded-full text-sm font-bold">10</span>
              Children's Privacy
            </h2>
            <div className="prose prose-slate max-w-none">
              <p className="text-gray-600 leading-relaxed mb-4">
                Our Platform is not intended for individuals under 18 years of age. We do not knowingly
                collect personal information from children under 18. If we become aware that we have
                collected personal data from a child under 18, we will take steps to delete that
                information promptly.
              </p>
              <p className="text-gray-600 leading-relaxed mb-4">
                If you believe we have inadvertently collected information from a minor, please contact
                us immediately at{' '}
                <a href="mailto:privacy@ethiopianmaids.com" className="text-purple-600 hover:text-purple-800">
                  privacy@ethiopianmaids.com
                </a>.
              </p>
            </div>
          </section>

          {/* Section 11 */}
          <section id="privacy-section-11" className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
              <span className="flex items-center justify-center w-8 h-8 bg-purple-100 text-purple-600 rounded-full text-sm font-bold">11</span>
              Third-Party Links
            </h2>
            <div className="prose prose-slate max-w-none">
              <p className="text-gray-600 leading-relaxed mb-4">
                Our Platform may contain links to third-party websites, services, or applications.
                This Privacy Policy does not apply to those third-party services. We are not responsible
                for the privacy practices or content of third-party sites.
              </p>
              <p className="text-gray-600 leading-relaxed mb-4">
                We encourage you to read the privacy policies of any third-party services you access
                through our Platform.
              </p>
            </div>
          </section>

          {/* Section 12 */}
          <section id="privacy-section-12" className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
              <span className="flex items-center justify-center w-8 h-8 bg-purple-100 text-purple-600 rounded-full text-sm font-bold">12</span>
              Cookies
            </h2>
            <div className="prose prose-slate max-w-none">
              <p className="text-gray-600 leading-relaxed mb-4">
                We use cookies and similar tracking technologies to enhance your experience on our Platform.
                For detailed information about the cookies we use and how to manage them, please see our{' '}
                <Link to="/cookies" className="text-purple-600 hover:text-purple-800 underline">
                  Cookie Policy
                </Link>.
              </p>
            </div>
          </section>

          {/* Section 13 */}
          <section id="privacy-section-13" className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
              <span className="flex items-center justify-center w-8 h-8 bg-purple-100 text-purple-600 rounded-full text-sm font-bold">13</span>
              Policy Changes
            </h2>
            <div className="prose prose-slate max-w-none">
              <p className="text-gray-600 leading-relaxed mb-4">
                We may update this Privacy Policy from time to time to reflect changes in our practices,
                technologies, legal requirements, or other factors. When we make material changes:
              </p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2 mb-4">
                <li>We will update the "Last Updated" date at the top of this policy</li>
                <li>We will notify you via email or through a notice on our Platform</li>
                <li>We may request your consent for significant changes</li>
              </ul>
              <p className="text-gray-600 leading-relaxed mb-4">
                We encourage you to review this Privacy Policy periodically to stay informed about how
                we protect your information.
              </p>
            </div>
          </section>

          {/* Section 14 */}
          <section id="privacy-section-14" className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
              <span className="flex items-center justify-center w-8 h-8 bg-purple-100 text-purple-600 rounded-full text-sm font-bold">14</span>
              Contact Us
            </h2>
            <div className="prose prose-slate max-w-none">
              <p className="text-gray-600 leading-relaxed mb-4">
                If you have any questions, concerns, or requests regarding this Privacy Policy or our
                data practices, please contact us:
              </p>
              <div className="bg-slate-50 rounded-xl p-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-purple-600" />
                    <div>
                      <p className="text-sm text-gray-500">Privacy Email</p>
                      <a href="mailto:privacy@ethiopianmaids.com" className="text-purple-600 hover:text-purple-800">
                        privacy@ethiopianmaids.com
                      </a>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-purple-600" />
                    <div>
                      <p className="text-sm text-gray-500">General Support</p>
                      <a href="mailto:support@ethiopianmaids.com" className="text-purple-600 hover:text-purple-800">
                        support@ethiopianmaids.com
                      </a>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="h-5 w-5 text-purple-600" />
                    <div>
                      <p className="text-sm text-gray-500">Phone</p>
                      <a href="tel:+17176998295" className="text-purple-600 hover:text-purple-800">
                        +1 717 699 8295
                      </a>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Globe className="h-5 w-5 text-purple-600" />
                    <div>
                      <p className="text-sm text-gray-500">Website</p>
                      <span className="text-purple-600">ethiopianmaids.com</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <h4 className="font-semibold text-blue-800">Data Protection Officer</h4>
                <p className="text-blue-700 text-sm mt-1">
                  For GDPR-related inquiries, you may contact our Data Protection Officer at{' '}
                  <a href="mailto:dpo@ethiopianmaids.com" className="underline">dpo@ethiopianmaids.com</a>
                </p>
              </div>
            </div>
          </section>

          {/* Related Links */}
          <div className="mt-12 pt-8 border-t border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Related Policies</h3>
            <div className="flex flex-wrap gap-4">
              <Link
                to="/terms"
                className="px-4 py-2 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors"
              >
                Terms of Service
              </Link>
              <Link
                to="/cookies"
                className="px-4 py-2 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors"
              >
                Cookie Policy
              </Link>
              <Link
                to="/about"
                className="px-4 py-2 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors"
              >
                About Us
              </Link>
            </div>
          </div>

          {/* Accept Button - for users coming from registration */}
          <div className="mt-12 pt-8 border-t border-gray-200">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(fromPage)}
                className="w-full sm:w-auto cursor-pointer"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Go Back
              </Button>
              <Button
                type="button"
                onClick={() => navigate(fromPage)}
                className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white cursor-pointer"
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                I Accept - Return to Registration
              </Button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
