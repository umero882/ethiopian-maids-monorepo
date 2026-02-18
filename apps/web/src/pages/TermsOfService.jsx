/**
 * Terms of Service Page
 *
 * Comprehensive terms of service for Ethiopian Maids platform.
 */

import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FileText, Shield, Users, CreditCard, AlertCircle, Scale, Mail, Phone, CheckCircle, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePageTitle } from '@/hooks/usePageTitle';

const TermsOfService = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const fromPage = location.state?.from || '/';
  const lastUpdated = 'January 2025';
  const effectiveDate = 'January 1, 2025';

  usePageTitle('Terms of Service');
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-white/10 rounded-xl">
              <FileText className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-4xl font-bold">Terms of Service</h1>
              <p className="mt-2 text-purple-100">Last updated: {lastUpdated}</p>
            </div>
          </div>
          <p className="text-lg text-purple-100 max-w-2xl">
            Please read these terms carefully before using Ethiopian Maids platform.
            By accessing our services, you agree to be bound by these terms.
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">

          {/* Table of Contents */}
          <nav className="mb-12 p-6 bg-slate-50 rounded-xl">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Table of Contents</h2>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
              {[
                '1. Introduction & Acceptance',
                '2. Definitions',
                '3. Account Registration',
                '4. User Responsibilities',
                '5. Platform Services',
                '6. Payment Terms',
                '7. Booking & Placement',
                '8. Cancellation & Refunds',
                '9. Intellectual Property',
                '10. User Content',
                '11. Privacy',
                '12. Dispute Resolution',
                '13. Limitation of Liability',
                '14. Indemnification',
                '15. Termination',
                '16. Governing Law',
                '17. Contact Information',
              ].map((item, index) => (
                <li key={index}>
                  <a href={`#section-${index + 1}`} className="text-purple-600 hover:text-purple-800 hover:underline">
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          {/* Section 1 */}
          <section id="section-1" className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
              <span className="flex items-center justify-center w-8 h-8 bg-purple-100 text-purple-600 rounded-full text-sm font-bold">1</span>
              Introduction & Acceptance
            </h2>
            <div className="prose prose-slate max-w-none">
              <p className="text-gray-600 leading-relaxed mb-4">
                Welcome to Ethiopian Maids ("Platform", "we", "us", or "our"). These Terms of Service ("Terms") govern your access to and use of our website, mobile applications, and services (collectively, the "Services").
              </p>
              <p className="text-gray-600 leading-relaxed mb-4">
                By accessing or using our Services, you acknowledge that you have read, understood, and agree to be bound by these Terms. If you do not agree to these Terms, you may not access or use our Services.
              </p>
              <p className="text-gray-600 leading-relaxed mb-4">
                These Terms constitute a legally binding agreement between you and Ethiopian Maids. We reserve the right to modify these Terms at any time. We will notify users of any material changes by posting the updated Terms on our Platform with a new "Last Updated" date.
              </p>
              <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded-r-lg">
                <p className="text-amber-800 text-sm">
                  <strong>Important:</strong> Your continued use of the Services after any changes to these Terms constitutes your acceptance of the revised Terms.
                </p>
              </div>
            </div>
          </section>

          {/* Section 2 */}
          <section id="section-2" className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
              <span className="flex items-center justify-center w-8 h-8 bg-purple-100 text-purple-600 rounded-full text-sm font-bold">2</span>
              Definitions
            </h2>
            <div className="prose prose-slate max-w-none">
              <p className="text-gray-600 leading-relaxed mb-4">
                For the purposes of these Terms, the following definitions apply:
              </p>
              <div className="grid gap-4">
                <div className="p-4 bg-slate-50 rounded-lg">
                  <h4 className="font-semibold text-gray-900">"Platform"</h4>
                  <p className="text-gray-600 text-sm mt-1">Ethiopian Maids website, mobile applications, and all related services.</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-lg">
                  <h4 className="font-semibold text-gray-900">"User"</h4>
                  <p className="text-gray-600 text-sm mt-1">Any individual or entity that accesses or uses the Platform, including Sponsors, Maids, and Agencies.</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-lg">
                  <h4 className="font-semibold text-gray-900">"Sponsor" (Employer)</h4>
                  <p className="text-gray-600 text-sm mt-1">An individual or household seeking to hire domestic workers through the Platform.</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-lg">
                  <h4 className="font-semibold text-gray-900">"Maid" (Domestic Worker)</h4>
                  <p className="text-gray-600 text-sm mt-1">An individual seeking employment as a domestic worker through the Platform.</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-lg">
                  <h4 className="font-semibold text-gray-900">"Agency"</h4>
                  <p className="text-gray-600 text-sm mt-1">A licensed recruitment agency that manages and represents domestic workers on the Platform.</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-lg">
                  <h4 className="font-semibold text-gray-900">"Services"</h4>
                  <p className="text-gray-600 text-sm mt-1">All features, functions, and content provided through the Platform, including matching, communication, payment processing, and support.</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-lg">
                  <h4 className="font-semibold text-gray-900">"Booking"</h4>
                  <p className="text-gray-600 text-sm mt-1">A confirmed arrangement between a Sponsor and a Maid/Agency for domestic work services.</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-lg">
                  <h4 className="font-semibold text-gray-900">"Placement"</h4>
                  <p className="text-gray-600 text-sm mt-1">The successful matching and employment of a Maid with a Sponsor through the Platform.</p>
                </div>
              </div>
            </div>
          </section>

          {/* Section 3 */}
          <section id="section-3" className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
              <span className="flex items-center justify-center w-8 h-8 bg-purple-100 text-purple-600 rounded-full text-sm font-bold">3</span>
              Account Registration & Eligibility
            </h2>
            <div className="prose prose-slate max-w-none">
              <h3 className="text-lg font-semibold text-gray-800 mt-6 mb-3">3.1 Eligibility Requirements</h3>
              <p className="text-gray-600 leading-relaxed mb-4">
                To use our Services, you must:
              </p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2 mb-4">
                <li>Be at least 18 years of age</li>
                <li>Have the legal capacity to enter into binding contracts</li>
                <li>Not be prohibited from using the Services under applicable laws</li>
                <li>Provide accurate and complete registration information</li>
                <li>Maintain the security of your account credentials</li>
              </ul>

              <h3 className="text-lg font-semibold text-gray-800 mt-6 mb-3">3.2 Account Creation</h3>
              <p className="text-gray-600 leading-relaxed mb-4">
                When creating an account, you agree to:
              </p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2 mb-4">
                <li>Provide truthful, accurate, and current information</li>
                <li>Update your information promptly if it changes</li>
                <li>Keep your password secure and confidential</li>
                <li>Notify us immediately of any unauthorized account access</li>
                <li>Accept responsibility for all activities under your account</li>
              </ul>

              <h3 className="text-lg font-semibold text-gray-800 mt-6 mb-3">3.3 Account Verification</h3>
              <p className="text-gray-600 leading-relaxed mb-4">
                We may require additional verification for certain account types:
              </p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2 mb-4">
                <li><strong>Maids:</strong> Valid identification, passport, medical certificate, police clearance</li>
                <li><strong>Agencies:</strong> Business license, recruitment license, proof of registration</li>
                <li><strong>Sponsors:</strong> Identity verification, address confirmation</li>
              </ul>
            </div>
          </section>

          {/* Section 4 */}
          <section id="section-4" className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
              <span className="flex items-center justify-center w-8 h-8 bg-purple-100 text-purple-600 rounded-full text-sm font-bold">4</span>
              User Responsibilities
            </h2>
            <div className="prose prose-slate max-w-none">
              <h3 className="text-lg font-semibold text-gray-800 mt-6 mb-3">4.1 For Sponsors (Employers)</h3>
              <p className="text-gray-600 leading-relaxed mb-2">Sponsors agree to:</p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2 mb-4">
                <li>Provide accurate job descriptions and requirements</li>
                <li>Treat domestic workers with respect and dignity</li>
                <li>Comply with all applicable labor laws and regulations</li>
                <li>Provide safe and appropriate working conditions</li>
                <li>Make timely payments as agreed</li>
                <li>Not engage in any form of exploitation or abuse</li>
                <li>Obtain necessary visas and work permits where required</li>
              </ul>

              <h3 className="text-lg font-semibold text-gray-800 mt-6 mb-3">4.2 For Maids (Domestic Workers)</h3>
              <p className="text-gray-600 leading-relaxed mb-2">Maids agree to:</p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2 mb-4">
                <li>Provide accurate information about skills, experience, and qualifications</li>
                <li>Submit valid and authentic documents</li>
                <li>Perform duties professionally and diligently</li>
                <li>Respect the privacy and property of employers</li>
                <li>Communicate honestly about availability and limitations</li>
                <li>Comply with employment terms and conditions</li>
              </ul>

              <h3 className="text-lg font-semibold text-gray-800 mt-6 mb-3">4.3 For Agencies</h3>
              <p className="text-gray-600 leading-relaxed mb-2">Agencies agree to:</p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2 mb-4">
                <li>Maintain valid recruitment licenses</li>
                <li>Verify credentials of all represented workers</li>
                <li>Provide accurate worker profiles and documentation</li>
                <li>Handle placements ethically and professionally</li>
                <li>Respond promptly to inquiries and issues</li>
                <li>Comply with all applicable recruitment regulations</li>
                <li>Not charge workers excessive fees</li>
              </ul>
            </div>
          </section>

          {/* Section 5 */}
          <section id="section-5" className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
              <span className="flex items-center justify-center w-8 h-8 bg-purple-100 text-purple-600 rounded-full text-sm font-bold">5</span>
              Platform Services
            </h2>
            <div className="prose prose-slate max-w-none">
              <p className="text-gray-600 leading-relaxed mb-4">
                Ethiopian Maids provides the following services:
              </p>

              <div className="grid gap-4 mb-6">
                <div className="p-4 border border-gray-200 rounded-lg">
                  <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                    <Users className="h-5 w-5 text-purple-600" />
                    Matching Services
                  </h4>
                  <p className="text-gray-600 text-sm mt-2">
                    We connect Sponsors with qualified Maids and Agencies based on preferences, requirements, and availability.
                  </p>
                </div>
                <div className="p-4 border border-gray-200 rounded-lg">
                  <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                    <Shield className="h-5 w-5 text-purple-600" />
                    Verification Services
                  </h4>
                  <p className="text-gray-600 text-sm mt-2">
                    We verify user identities, documents, and credentials to enhance platform safety and trust.
                  </p>
                </div>
                <div className="p-4 border border-gray-200 rounded-lg">
                  <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-purple-600" />
                    Payment Processing
                  </h4>
                  <p className="text-gray-600 text-sm mt-2">
                    We facilitate secure payment transactions between parties through trusted payment processors.
                  </p>
                </div>
              </div>

              <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-lg">
                <p className="text-blue-800 text-sm">
                  <strong>Note:</strong> Ethiopian Maids acts as a platform facilitator and is not the employer of any Maid. We do not guarantee the outcome of any placement or employment relationship.
                </p>
              </div>
            </div>
          </section>

          {/* Section 6 */}
          <section id="section-6" className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
              <span className="flex items-center justify-center w-8 h-8 bg-purple-100 text-purple-600 rounded-full text-sm font-bold">6</span>
              Payment Terms & Fees
            </h2>
            <div className="prose prose-slate max-w-none">
              <h3 className="text-lg font-semibold text-gray-800 mt-6 mb-3">6.1 Subscription Plans</h3>
              <p className="text-gray-600 leading-relaxed mb-4">
                We offer various subscription plans with different features and pricing. Current pricing is available on our Pricing page. Subscription fees are:
              </p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2 mb-4">
                <li>Billed in advance on a monthly or annual basis</li>
                <li>Non-refundable except as specified in our refund policy</li>
                <li>Subject to change with 30 days' notice</li>
                <li>Automatically renewed unless cancelled</li>
              </ul>

              <h3 className="text-lg font-semibold text-gray-800 mt-6 mb-3">6.2 Service Fees</h3>
              <p className="text-gray-600 leading-relaxed mb-4">
                Additional fees may apply for:
              </p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2 mb-4">
                <li>Placement fees for successful matches</li>
                <li>Premium listing features</li>
                <li>Background check services</li>
                <li>Document verification services</li>
                <li>Priority support services</li>
              </ul>

              <h3 className="text-lg font-semibold text-gray-800 mt-6 mb-3">6.3 Payment Processing</h3>
              <p className="text-gray-600 leading-relaxed mb-4">
                All payments are processed through secure third-party payment providers (Stripe). We do not store credit card information on our servers. By making a payment, you agree to the payment processor's terms of service.
              </p>
            </div>
          </section>

          {/* Section 7 */}
          <section id="section-7" className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
              <span className="flex items-center justify-center w-8 h-8 bg-purple-100 text-purple-600 rounded-full text-sm font-bold">7</span>
              Booking & Placement Process
            </h2>
            <div className="prose prose-slate max-w-none">
              <h3 className="text-lg font-semibold text-gray-800 mt-6 mb-3">7.1 Matching Process</h3>
              <p className="text-gray-600 leading-relaxed mb-4">
                Our matching process typically follows these steps:
              </p>
              <ol className="list-decimal pl-6 text-gray-600 space-y-2 mb-4">
                <li>Sponsor posts job requirements or browses available Maids</li>
                <li>Maids/Agencies submit applications or receive inquiries</li>
                <li>Parties communicate through our secure messaging system</li>
                <li>Interview and selection process</li>
                <li>Booking confirmation and payment</li>
                <li>Document processing and verification</li>
                <li>Placement and employment commencement</li>
              </ol>

              <h3 className="text-lg font-semibold text-gray-800 mt-6 mb-3">7.2 Replacement Guarantee</h3>
              <p className="text-gray-600 leading-relaxed mb-4">
                We offer a 30-day replacement guarantee for qualified placements. If you are not satisfied with your placement within the first 30 days, we will work to find a suitable replacement at no additional cost, subject to the following conditions:
              </p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2 mb-4">
                <li>The issue is reported within the guarantee period</li>
                <li>The reason for dissatisfaction is legitimate and documented</li>
                <li>The original terms of employment were followed</li>
                <li>One replacement per original placement</li>
              </ul>
            </div>
          </section>

          {/* Section 8 */}
          <section id="section-8" className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
              <span className="flex items-center justify-center w-8 h-8 bg-purple-100 text-purple-600 rounded-full text-sm font-bold">8</span>
              Cancellation & Refund Policy
            </h2>
            <div className="prose prose-slate max-w-none">
              <h3 className="text-lg font-semibold text-gray-800 mt-6 mb-3">8.1 Subscription Cancellation</h3>
              <p className="text-gray-600 leading-relaxed mb-4">
                You may cancel your subscription at any time:
              </p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2 mb-4">
                <li>Cancellation takes effect at the end of the current billing period</li>
                <li>No refunds for partial months or unused time</li>
                <li>Annual subscriptions may be eligible for pro-rata refunds within 7 days</li>
              </ul>

              <h3 className="text-lg font-semibold text-gray-800 mt-6 mb-3">8.2 Booking Cancellation</h3>
              <p className="text-gray-600 leading-relaxed mb-4">
                Cancellation fees may apply based on timing:
              </p>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="bg-slate-100">
                      <th className="px-4 py-2 text-left text-gray-700">Cancellation Time</th>
                      <th className="px-4 py-2 text-left text-gray-700">Refund Amount</th>
                    </tr>
                  </thead>
                  <tbody className="text-gray-600">
                    <tr className="border-b">
                      <td className="px-4 py-2">More than 14 days before</td>
                      <td className="px-4 py-2">Full refund minus processing fees</td>
                    </tr>
                    <tr className="border-b">
                      <td className="px-4 py-2">7-14 days before</td>
                      <td className="px-4 py-2">75% refund</td>
                    </tr>
                    <tr className="border-b">
                      <td className="px-4 py-2">Less than 7 days</td>
                      <td className="px-4 py-2">50% refund</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2">After placement begins</td>
                      <td className="px-4 py-2">No refund (replacement guarantee may apply)</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <h3 className="text-lg font-semibold text-gray-800 mt-6 mb-3">8.3 Refund Processing</h3>
              <p className="text-gray-600 leading-relaxed mb-4">
                Approved refunds are processed within 5-7 business days to the original payment method.
              </p>
            </div>
          </section>

          {/* Section 9 */}
          <section id="section-9" className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
              <span className="flex items-center justify-center w-8 h-8 bg-purple-100 text-purple-600 rounded-full text-sm font-bold">9</span>
              Intellectual Property
            </h2>
            <div className="prose prose-slate max-w-none">
              <p className="text-gray-600 leading-relaxed mb-4">
                All content, features, and functionality of the Platform, including but not limited to:
              </p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2 mb-4">
                <li>Text, graphics, logos, and images</li>
                <li>Software, code, and algorithms</li>
                <li>User interface design and layout</li>
                <li>Trademarks and service marks</li>
              </ul>
              <p className="text-gray-600 leading-relaxed mb-4">
                are the exclusive property of Ethiopian Maids and are protected by copyright, trademark, and other intellectual property laws.
              </p>
              <p className="text-gray-600 leading-relaxed mb-4">
                You may not reproduce, distribute, modify, create derivative works, publicly display, or otherwise use our intellectual property without prior written consent.
              </p>
            </div>
          </section>

          {/* Section 10 */}
          <section id="section-10" className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
              <span className="flex items-center justify-center w-8 h-8 bg-purple-100 text-purple-600 rounded-full text-sm font-bold">10</span>
              User Content & Conduct
            </h2>
            <div className="prose prose-slate max-w-none">
              <h3 className="text-lg font-semibold text-gray-800 mt-6 mb-3">10.1 User Content</h3>
              <p className="text-gray-600 leading-relaxed mb-4">
                By posting content on the Platform, you grant us a non-exclusive, worldwide, royalty-free license to use, display, and distribute your content in connection with the Services.
              </p>

              <h3 className="text-lg font-semibold text-gray-800 mt-6 mb-3">10.2 Prohibited Conduct</h3>
              <p className="text-gray-600 leading-relaxed mb-2">You agree not to:</p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2 mb-4">
                <li>Post false, misleading, or fraudulent information</li>
                <li>Harass, threaten, or discriminate against other users</li>
                <li>Violate any applicable laws or regulations</li>
                <li>Attempt to bypass security measures or access unauthorized areas</li>
                <li>Use automated systems to scrape or collect data</li>
                <li>Interfere with the proper functioning of the Platform</li>
                <li>Engage in human trafficking or labor exploitation</li>
                <li>Circumvent the Platform to avoid fees</li>
              </ul>
            </div>
          </section>

          {/* Section 11 */}
          <section id="section-11" className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
              <span className="flex items-center justify-center w-8 h-8 bg-purple-100 text-purple-600 rounded-full text-sm font-bold">11</span>
              Privacy
            </h2>
            <div className="prose prose-slate max-w-none">
              <p className="text-gray-600 leading-relaxed mb-4">
                Your privacy is important to us. Our collection and use of personal information is governed by our <Link to="/privacy" className="text-purple-600 hover:text-purple-800 underline">Privacy Policy</Link>, which is incorporated into these Terms by reference.
              </p>
              <p className="text-gray-600 leading-relaxed mb-4">
                By using our Services, you consent to the collection, use, and sharing of your information as described in our Privacy Policy.
              </p>
            </div>
          </section>

          {/* Section 12 */}
          <section id="section-12" className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
              <span className="flex items-center justify-center w-8 h-8 bg-purple-100 text-purple-600 rounded-full text-sm font-bold">12</span>
              Dispute Resolution
            </h2>
            <div className="prose prose-slate max-w-none">
              <h3 className="text-lg font-semibold text-gray-800 mt-6 mb-3">12.1 Between Users</h3>
              <p className="text-gray-600 leading-relaxed mb-4">
                For disputes between Sponsors and Maids/Agencies, we encourage direct communication first. If resolution is not possible, our support team can provide mediation assistance. We are not obligated to resolve disputes but may do so at our discretion.
              </p>

              <h3 className="text-lg font-semibold text-gray-800 mt-6 mb-3">12.2 With Ethiopian Maids</h3>
              <p className="text-gray-600 leading-relaxed mb-4">
                Any disputes with Ethiopian Maids should first be addressed through our customer support. If unresolved, disputes shall be settled through binding arbitration in accordance with the rules of the Ethiopian Arbitration and Conciliation Center.
              </p>
            </div>
          </section>

          {/* Section 13 */}
          <section id="section-13" className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
              <span className="flex items-center justify-center w-8 h-8 bg-purple-100 text-purple-600 rounded-full text-sm font-bold">13</span>
              Limitation of Liability
            </h2>
            <div className="prose prose-slate max-w-none">
              <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-r-lg mb-4">
                <p className="text-red-800 text-sm">
                  <strong>Important Legal Notice:</strong>
                </p>
              </div>
              <p className="text-gray-600 leading-relaxed mb-4">
                TO THE MAXIMUM EXTENT PERMITTED BY LAW:
              </p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2 mb-4">
                <li>Ethiopian Maids is not liable for any indirect, incidental, special, consequential, or punitive damages</li>
                <li>Our total liability shall not exceed the amount paid by you in the 12 months preceding the claim</li>
                <li>We are not responsible for the actions, conduct, or content of any user</li>
                <li>We do not guarantee the quality, safety, or legality of services provided by users</li>
                <li>We are not liable for employment disputes between Sponsors and Maids</li>
              </ul>
            </div>
          </section>

          {/* Section 14 */}
          <section id="section-14" className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
              <span className="flex items-center justify-center w-8 h-8 bg-purple-100 text-purple-600 rounded-full text-sm font-bold">14</span>
              Indemnification
            </h2>
            <div className="prose prose-slate max-w-none">
              <p className="text-gray-600 leading-relaxed mb-4">
                You agree to indemnify, defend, and hold harmless Ethiopian Maids, its officers, directors, employees, and agents from any claims, damages, losses, liabilities, and expenses (including legal fees) arising from:
              </p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2 mb-4">
                <li>Your use of the Services</li>
                <li>Your violation of these Terms</li>
                <li>Your violation of any third-party rights</li>
                <li>Your employment relationships facilitated through the Platform</li>
                <li>Any content you submit to the Platform</li>
              </ul>
            </div>
          </section>

          {/* Section 15 */}
          <section id="section-15" className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
              <span className="flex items-center justify-center w-8 h-8 bg-purple-100 text-purple-600 rounded-full text-sm font-bold">15</span>
              Termination
            </h2>
            <div className="prose prose-slate max-w-none">
              <h3 className="text-lg font-semibold text-gray-800 mt-6 mb-3">15.1 By You</h3>
              <p className="text-gray-600 leading-relaxed mb-4">
                You may terminate your account at any time by contacting our support team or using the account deletion feature. Termination does not relieve you of obligations incurred prior to termination.
              </p>

              <h3 className="text-lg font-semibold text-gray-800 mt-6 mb-3">15.2 By Us</h3>
              <p className="text-gray-600 leading-relaxed mb-4">
                We may suspend or terminate your account immediately, without notice, if:
              </p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2 mb-4">
                <li>You violate these Terms</li>
                <li>You engage in fraudulent or illegal activity</li>
                <li>Your account poses a security risk</li>
                <li>Required by law or regulatory authority</li>
                <li>We discontinue the Services</li>
              </ul>
            </div>
          </section>

          {/* Section 16 */}
          <section id="section-16" className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
              <span className="flex items-center justify-center w-8 h-8 bg-purple-100 text-purple-600 rounded-full text-sm font-bold">16</span>
              Governing Law
            </h2>
            <div className="prose prose-slate max-w-none">
              <p className="text-gray-600 leading-relaxed mb-4">
                These Terms shall be governed by and construed in accordance with the laws of the Federal Democratic Republic of Ethiopia, without regard to conflict of law principles.
              </p>
              <p className="text-gray-600 leading-relaxed mb-4">
                For users in GCC countries (UAE, Saudi Arabia, Qatar, Kuwait, Bahrain, Oman), applicable local laws and regulations shall also apply to the extent they govern employment relationships and recruitment practices.
              </p>
            </div>
          </section>

          {/* Section 17 */}
          <section id="section-17" className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
              <span className="flex items-center justify-center w-8 h-8 bg-purple-100 text-purple-600 rounded-full text-sm font-bold">17</span>
              Contact Information
            </h2>
            <div className="prose prose-slate max-w-none">
              <p className="text-gray-600 leading-relaxed mb-4">
                If you have any questions about these Terms, please contact us:
              </p>
              <div className="bg-slate-50 rounded-xl p-6">
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-purple-600" />
                    <div>
                      <p className="text-sm text-gray-500">Email</p>
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
                </div>
              </div>
            </div>
          </section>

          {/* Related Links */}
          <div className="mt-12 pt-8 border-t border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Related Policies</h3>
            <div className="flex flex-wrap gap-4">
              <Link
                to="/privacy"
                className="px-4 py-2 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors"
              >
                Privacy Policy
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

export default TermsOfService;
