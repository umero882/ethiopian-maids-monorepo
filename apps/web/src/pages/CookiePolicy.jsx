/**
 * Cookie Policy Page
 *
 * Comprehensive cookie policy for Ethiopian Maids platform.
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { Cookie, Shield, Settings, BarChart3, Target, Clock, Globe, Mail, Phone, AlertCircle } from 'lucide-react';

const CookiePolicy = () => {
  const lastUpdated = 'January 2025';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-white/10 rounded-xl">
              <Cookie className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-4xl font-bold">Cookie Policy</h1>
              <p className="mt-2 text-purple-100">Last updated: {lastUpdated}</p>
            </div>
          </div>
          <p className="text-lg text-purple-100 max-w-2xl">
            This policy explains how Ethiopian Maids uses cookies and similar technologies
            to recognize you when you visit our platform.
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">

          {/* Cookie Consent Notice */}
          <div className="mb-10 p-6 bg-amber-50 border border-amber-200 rounded-xl">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-amber-100 rounded-lg">
                <AlertCircle className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <h3 className="font-semibold text-amber-800">Your Cookie Preferences</h3>
                <p className="text-amber-700 text-sm mt-1">
                  When you first visit our website, you will be asked to consent to our use of cookies.
                  You can change your cookie preferences at any time through your browser settings or
                  by clicking the cookie settings link in our footer.
                </p>
              </div>
            </div>
          </div>

          {/* Table of Contents */}
          <nav className="mb-12 p-6 bg-slate-50 rounded-xl">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Table of Contents</h2>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
              {[
                '1. What Are Cookies',
                '2. Types of Cookies We Use',
                '3. Essential Cookies',
                '4. Functional Cookies',
                '5. Analytics Cookies',
                '6. Marketing Cookies',
                '7. Third-Party Cookies',
                '8. Cookie Duration',
                '9. Managing Cookies',
                '10. Browser-Specific Instructions',
                '11. Do Not Track',
                '12. Updates to This Policy',
                '13. Contact Us',
              ].map((item, index) => (
                <li key={index}>
                  <a href={`#cookie-section-${index + 1}`} className="text-purple-600 hover:text-purple-800 hover:underline">
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          {/* Section 1 */}
          <section id="cookie-section-1" className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
              <span className="flex items-center justify-center w-8 h-8 bg-purple-100 text-purple-600 rounded-full text-sm font-bold">1</span>
              What Are Cookies
            </h2>
            <div className="prose prose-slate max-w-none">
              <p className="text-gray-600 leading-relaxed mb-4">
                Cookies are small text files that are placed on your computer or mobile device when you
                visit a website. They are widely used to make websites work more efficiently, as well as
                to provide information to the owners of the site.
              </p>
              <p className="text-gray-600 leading-relaxed mb-4">
                Cookies serve various functions, including:
              </p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2 mb-4">
                <li>Enabling core website functionality</li>
                <li>Remembering your preferences and settings</li>
                <li>Improving website performance and user experience</li>
                <li>Analyzing how visitors use the website</li>
                <li>Delivering relevant advertisements (with consent)</li>
                <li>Providing secure authentication and fraud prevention</li>
              </ul>
              <p className="text-gray-600 leading-relaxed mb-4">
                We also use similar technologies such as web beacons, pixels, and local storage, which
                function similarly to cookies. References to "cookies" in this policy include these
                similar technologies.
              </p>
            </div>
          </section>

          {/* Section 2 */}
          <section id="cookie-section-2" className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
              <span className="flex items-center justify-center w-8 h-8 bg-purple-100 text-purple-600 rounded-full text-sm font-bold">2</span>
              Types of Cookies We Use
            </h2>
            <div className="prose prose-slate max-w-none">
              <p className="text-gray-600 leading-relaxed mb-4">
                We categorize cookies into four main types based on their purpose:
              </p>
              <div className="grid gap-4 mb-6">
                <div className="p-4 border border-green-200 bg-green-50 rounded-lg">
                  <h4 className="font-semibold text-green-800 flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Essential Cookies
                  </h4>
                  <p className="text-green-700 text-sm mt-2">
                    Required for the website to function. Cannot be disabled.
                  </p>
                </div>
                <div className="p-4 border border-blue-200 bg-blue-50 rounded-lg">
                  <h4 className="font-semibold text-blue-800 flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Functional Cookies
                  </h4>
                  <p className="text-blue-700 text-sm mt-2">
                    Enhance functionality and personalization. Optional but improve user experience.
                  </p>
                </div>
                <div className="p-4 border border-purple-200 bg-purple-50 rounded-lg">
                  <h4 className="font-semibold text-purple-800 flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Analytics Cookies
                  </h4>
                  <p className="text-purple-700 text-sm mt-2">
                    Help us understand how visitors use our website. Optional.
                  </p>
                </div>
                <div className="p-4 border border-orange-200 bg-orange-50 rounded-lg">
                  <h4 className="font-semibold text-orange-800 flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Marketing Cookies
                  </h4>
                  <p className="text-orange-700 text-sm mt-2">
                    Used to deliver relevant advertisements. Require explicit consent.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Section 3 */}
          <section id="cookie-section-3" className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
              <span className="flex items-center justify-center w-8 h-8 bg-purple-100 text-purple-600 rounded-full text-sm font-bold">3</span>
              Essential Cookies
            </h2>
            <div className="prose prose-slate max-w-none">
              <p className="text-gray-600 leading-relaxed mb-4">
                These cookies are strictly necessary for the website to function and cannot be switched off.
                They are usually set in response to actions you take, such as logging in or filling out forms.
              </p>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm mb-6">
                  <thead>
                    <tr className="bg-slate-100">
                      <th className="px-4 py-2 text-left text-gray-700">Cookie Name</th>
                      <th className="px-4 py-2 text-left text-gray-700">Purpose</th>
                      <th className="px-4 py-2 text-left text-gray-700">Duration</th>
                    </tr>
                  </thead>
                  <tbody className="text-gray-600">
                    <tr className="border-b">
                      <td className="px-4 py-2 font-mono text-xs">session_id</td>
                      <td className="px-4 py-2">Maintains your session state</td>
                      <td className="px-4 py-2">Session</td>
                    </tr>
                    <tr className="border-b">
                      <td className="px-4 py-2 font-mono text-xs">auth_token</td>
                      <td className="px-4 py-2">Authentication and security</td>
                      <td className="px-4 py-2">7 days</td>
                    </tr>
                    <tr className="border-b">
                      <td className="px-4 py-2 font-mono text-xs">csrf_token</td>
                      <td className="px-4 py-2">Cross-site request forgery protection</td>
                      <td className="px-4 py-2">Session</td>
                    </tr>
                    <tr className="border-b">
                      <td className="px-4 py-2 font-mono text-xs">cookie_consent</td>
                      <td className="px-4 py-2">Stores your cookie preferences</td>
                      <td className="px-4 py-2">1 year</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2 font-mono text-xs">security_check</td>
                      <td className="px-4 py-2">Fraud prevention and security</td>
                      <td className="px-4 py-2">Session</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          {/* Section 4 */}
          <section id="cookie-section-4" className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
              <span className="flex items-center justify-center w-8 h-8 bg-purple-100 text-purple-600 rounded-full text-sm font-bold">4</span>
              Functional Cookies
            </h2>
            <div className="prose prose-slate max-w-none">
              <p className="text-gray-600 leading-relaxed mb-4">
                These cookies enable enhanced functionality and personalization. They may be set by us or
                by third-party providers whose services we have added to our pages.
              </p>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm mb-6">
                  <thead>
                    <tr className="bg-slate-100">
                      <th className="px-4 py-2 text-left text-gray-700">Cookie Name</th>
                      <th className="px-4 py-2 text-left text-gray-700">Purpose</th>
                      <th className="px-4 py-2 text-left text-gray-700">Duration</th>
                    </tr>
                  </thead>
                  <tbody className="text-gray-600">
                    <tr className="border-b">
                      <td className="px-4 py-2 font-mono text-xs">language_pref</td>
                      <td className="px-4 py-2">Remembers your language preference</td>
                      <td className="px-4 py-2">1 year</td>
                    </tr>
                    <tr className="border-b">
                      <td className="px-4 py-2 font-mono text-xs">theme_mode</td>
                      <td className="px-4 py-2">Remembers light/dark mode preference</td>
                      <td className="px-4 py-2">1 year</td>
                    </tr>
                    <tr className="border-b">
                      <td className="px-4 py-2 font-mono text-xs">recent_searches</td>
                      <td className="px-4 py-2">Stores your recent search queries</td>
                      <td className="px-4 py-2">30 days</td>
                    </tr>
                    <tr className="border-b">
                      <td className="px-4 py-2 font-mono text-xs">notification_pref</td>
                      <td className="px-4 py-2">Notification display preferences</td>
                      <td className="px-4 py-2">1 year</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2 font-mono text-xs">chat_history</td>
                      <td className="px-4 py-2">Preserves chat widget state</td>
                      <td className="px-4 py-2">Session</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="text-gray-600 leading-relaxed mb-4">
                If you disable these cookies, some features may not work properly, but core functionality
                will remain available.
              </p>
            </div>
          </section>

          {/* Section 5 */}
          <section id="cookie-section-5" className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
              <span className="flex items-center justify-center w-8 h-8 bg-purple-100 text-purple-600 rounded-full text-sm font-bold">5</span>
              Analytics Cookies
            </h2>
            <div className="prose prose-slate max-w-none">
              <p className="text-gray-600 leading-relaxed mb-4">
                These cookies help us understand how visitors interact with our website by collecting
                and reporting information anonymously. This helps us improve our services.
              </p>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm mb-6">
                  <thead>
                    <tr className="bg-slate-100">
                      <th className="px-4 py-2 text-left text-gray-700">Cookie Name</th>
                      <th className="px-4 py-2 text-left text-gray-700">Provider</th>
                      <th className="px-4 py-2 text-left text-gray-700">Purpose</th>
                      <th className="px-4 py-2 text-left text-gray-700">Duration</th>
                    </tr>
                  </thead>
                  <tbody className="text-gray-600">
                    <tr className="border-b">
                      <td className="px-4 py-2 font-mono text-xs">_ga</td>
                      <td className="px-4 py-2">Google Analytics</td>
                      <td className="px-4 py-2">Distinguishes unique users</td>
                      <td className="px-4 py-2">2 years</td>
                    </tr>
                    <tr className="border-b">
                      <td className="px-4 py-2 font-mono text-xs">_ga_*</td>
                      <td className="px-4 py-2">Google Analytics 4</td>
                      <td className="px-4 py-2">Persists session state</td>
                      <td className="px-4 py-2">2 years</td>
                    </tr>
                    <tr className="border-b">
                      <td className="px-4 py-2 font-mono text-xs">_gid</td>
                      <td className="px-4 py-2">Google Analytics</td>
                      <td className="px-4 py-2">Distinguishes users</td>
                      <td className="px-4 py-2">24 hours</td>
                    </tr>
                    <tr className="border-b">
                      <td className="px-4 py-2 font-mono text-xs">_gat</td>
                      <td className="px-4 py-2">Google Analytics</td>
                      <td className="px-4 py-2">Throttles request rate</td>
                      <td className="px-4 py-2">1 minute</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2 font-mono text-xs">performance_data</td>
                      <td className="px-4 py-2">Ethiopian Maids</td>
                      <td className="px-4 py-2">Page load performance</td>
                      <td className="px-4 py-2">Session</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-lg">
                <p className="text-blue-800 text-sm">
                  <strong>Google Analytics:</strong> We use Google Analytics to analyze website traffic.
                  Google may use this data according to their{' '}
                  <a
                    href="https://policies.google.com/privacy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline"
                  >
                    Privacy Policy
                  </a>. You can opt out using the{' '}
                  <a
                    href="https://tools.google.com/dlpage/gaoptout"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline"
                  >
                    Google Analytics Opt-out Browser Add-on
                  </a>.
                </p>
              </div>
            </div>
          </section>

          {/* Section 6 */}
          <section id="cookie-section-6" className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
              <span className="flex items-center justify-center w-8 h-8 bg-purple-100 text-purple-600 rounded-full text-sm font-bold">6</span>
              Marketing Cookies
            </h2>
            <div className="prose prose-slate max-w-none">
              <p className="text-gray-600 leading-relaxed mb-4">
                Marketing cookies are used to track visitors across websites. The intention is to display
                ads that are relevant and engaging for the individual user. These cookies require your
                explicit consent.
              </p>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm mb-6">
                  <thead>
                    <tr className="bg-slate-100">
                      <th className="px-4 py-2 text-left text-gray-700">Cookie Name</th>
                      <th className="px-4 py-2 text-left text-gray-700">Provider</th>
                      <th className="px-4 py-2 text-left text-gray-700">Purpose</th>
                      <th className="px-4 py-2 text-left text-gray-700">Duration</th>
                    </tr>
                  </thead>
                  <tbody className="text-gray-600">
                    <tr className="border-b">
                      <td className="px-4 py-2 font-mono text-xs">_fbp</td>
                      <td className="px-4 py-2">Facebook</td>
                      <td className="px-4 py-2">Delivers advertisements</td>
                      <td className="px-4 py-2">3 months</td>
                    </tr>
                    <tr className="border-b">
                      <td className="px-4 py-2 font-mono text-xs">fr</td>
                      <td className="px-4 py-2">Facebook</td>
                      <td className="px-4 py-2">Ad delivery and measurement</td>
                      <td className="px-4 py-2">3 months</td>
                    </tr>
                    <tr className="border-b">
                      <td className="px-4 py-2 font-mono text-xs">NID</td>
                      <td className="px-4 py-2">Google</td>
                      <td className="px-4 py-2">Preferences and ad personalization</td>
                      <td className="px-4 py-2">6 months</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2 font-mono text-xs">li_sugr</td>
                      <td className="px-4 py-2">LinkedIn</td>
                      <td className="px-4 py-2">Browser identification</td>
                      <td className="px-4 py-2">3 months</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="bg-orange-50 border-l-4 border-orange-400 p-4 rounded-r-lg">
                <p className="text-orange-800 text-sm">
                  <strong>Note:</strong> Marketing cookies are only activated if you give explicit consent.
                  You can withdraw your consent at any time through our cookie settings.
                </p>
              </div>
            </div>
          </section>

          {/* Section 7 */}
          <section id="cookie-section-7" className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
              <span className="flex items-center justify-center w-8 h-8 bg-purple-100 text-purple-600 rounded-full text-sm font-bold">7</span>
              Third-Party Cookies
            </h2>
            <div className="prose prose-slate max-w-none">
              <p className="text-gray-600 leading-relaxed mb-4">
                Some cookies are placed by third-party services that appear on our pages. We use the
                following third-party services:
              </p>
              <div className="grid gap-4 mb-6">
                <div className="p-4 bg-slate-50 rounded-lg">
                  <h4 className="font-semibold text-gray-900">Stripe (Payment Processing)</h4>
                  <p className="text-gray-600 text-sm mt-1">
                    Processes payments securely. Uses cookies for fraud prevention and to remember payment preferences.
                    <a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer" className="text-purple-600 ml-2 hover:underline">
                      Privacy Policy
                    </a>
                  </p>
                </div>
                <div className="p-4 bg-slate-50 rounded-lg">
                  <h4 className="font-semibold text-gray-900">Firebase (Authentication)</h4>
                  <p className="text-gray-600 text-sm mt-1">
                    Provides authentication services. Uses cookies to maintain secure sessions.
                    <a href="https://firebase.google.com/support/privacy" target="_blank" rel="noopener noreferrer" className="text-purple-600 ml-2 hover:underline">
                      Privacy Policy
                    </a>
                  </p>
                </div>
                <div className="p-4 bg-slate-50 rounded-lg">
                  <h4 className="font-semibold text-gray-900">Google (Analytics & Services)</h4>
                  <p className="text-gray-600 text-sm mt-1">
                    Provides analytics, fonts, and maps services.
                    <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-purple-600 ml-2 hover:underline">
                      Privacy Policy
                    </a>
                  </p>
                </div>
                <div className="p-4 bg-slate-50 rounded-lg">
                  <h4 className="font-semibold text-gray-900">Intercom (Customer Support)</h4>
                  <p className="text-gray-600 text-sm mt-1">
                    Powers our live chat and support features. Uses cookies to identify returning visitors.
                    <a href="https://www.intercom.com/legal/privacy" target="_blank" rel="noopener noreferrer" className="text-purple-600 ml-2 hover:underline">
                      Privacy Policy
                    </a>
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Section 8 */}
          <section id="cookie-section-8" className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
              <span className="flex items-center justify-center w-8 h-8 bg-purple-100 text-purple-600 rounded-full text-sm font-bold">8</span>
              Cookie Duration
            </h2>
            <div className="prose prose-slate max-w-none">
              <p className="text-gray-600 leading-relaxed mb-4">
                Cookies can be classified by how long they remain on your device:
              </p>
              <div className="grid gap-4 mb-6">
                <div className="p-4 border border-gray-200 rounded-lg">
                  <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                    <Clock className="h-5 w-5 text-purple-600" />
                    Session Cookies
                  </h4>
                  <p className="text-gray-600 text-sm mt-2">
                    These are temporary cookies that expire when you close your browser. They are used
                    to maintain your session while you navigate our website.
                  </p>
                </div>
                <div className="p-4 border border-gray-200 rounded-lg">
                  <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                    <Clock className="h-5 w-5 text-purple-600" />
                    Persistent Cookies
                  </h4>
                  <p className="text-gray-600 text-sm mt-2">
                    These cookies remain on your device for a set period or until you delete them.
                    They are used to remember your preferences and provide a more personalized experience.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Section 9 */}
          <section id="cookie-section-9" className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
              <span className="flex items-center justify-center w-8 h-8 bg-purple-100 text-purple-600 rounded-full text-sm font-bold">9</span>
              Managing Cookies
            </h2>
            <div className="prose prose-slate max-w-none">
              <p className="text-gray-600 leading-relaxed mb-4">
                You have several options for managing cookies:
              </p>

              <h3 className="text-lg font-semibold text-gray-800 mt-6 mb-3">Our Cookie Settings</h3>
              <p className="text-gray-600 leading-relaxed mb-4">
                When you first visit our website, you can choose which cookies to accept through our
                cookie consent banner. You can change these preferences at any time by clicking the
                "Cookie Settings" link in our website footer.
              </p>

              <h3 className="text-lg font-semibold text-gray-800 mt-6 mb-3">Browser Settings</h3>
              <p className="text-gray-600 leading-relaxed mb-4">
                Most web browsers allow you to control cookies through their settings. You can:
              </p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2 mb-4">
                <li>Block all cookies</li>
                <li>Block third-party cookies only</li>
                <li>Delete existing cookies</li>
                <li>Set preferences for specific websites</li>
                <li>Enable "Do Not Track" signals</li>
              </ul>

              <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded-r-lg">
                <p className="text-amber-800 text-sm">
                  <strong>Warning:</strong> If you block essential cookies, some parts of our website
                  may not function correctly. You may not be able to log in or complete certain actions.
                </p>
              </div>
            </div>
          </section>

          {/* Section 10 */}
          <section id="cookie-section-10" className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
              <span className="flex items-center justify-center w-8 h-8 bg-purple-100 text-purple-600 rounded-full text-sm font-bold">10</span>
              Browser-Specific Instructions
            </h2>
            <div className="prose prose-slate max-w-none">
              <p className="text-gray-600 leading-relaxed mb-4">
                Here are links to manage cookies in popular browsers:
              </p>
              <div className="grid gap-3 mb-6">
                <a
                  href="https://support.google.com/chrome/answer/95647"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors flex items-center gap-3"
                >
                  <Globe className="h-5 w-5 text-purple-600" />
                  <span className="text-gray-700">Google Chrome - Manage Cookies</span>
                </a>
                <a
                  href="https://support.mozilla.org/en-US/kb/cookies-information-websites-store-on-your-computer"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors flex items-center gap-3"
                >
                  <Globe className="h-5 w-5 text-purple-600" />
                  <span className="text-gray-700">Mozilla Firefox - Manage Cookies</span>
                </a>
                <a
                  href="https://support.apple.com/guide/safari/manage-cookies-and-website-data-sfri11471/mac"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors flex items-center gap-3"
                >
                  <Globe className="h-5 w-5 text-purple-600" />
                  <span className="text-gray-700">Safari - Manage Cookies</span>
                </a>
                <a
                  href="https://support.microsoft.com/en-us/microsoft-edge/delete-cookies-in-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors flex items-center gap-3"
                >
                  <Globe className="h-5 w-5 text-purple-600" />
                  <span className="text-gray-700">Microsoft Edge - Manage Cookies</span>
                </a>
              </div>
            </div>
          </section>

          {/* Section 11 */}
          <section id="cookie-section-11" className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
              <span className="flex items-center justify-center w-8 h-8 bg-purple-100 text-purple-600 rounded-full text-sm font-bold">11</span>
              Do Not Track Signals
            </h2>
            <div className="prose prose-slate max-w-none">
              <p className="text-gray-600 leading-relaxed mb-4">
                Some browsers include a "Do Not Track" (DNT) feature that signals to websites that you
                do not want to have your online activity tracked.
              </p>
              <p className="text-gray-600 leading-relaxed mb-4">
                Currently, there is no uniform standard for how websites should respond to DNT signals.
                As such, our website does not currently respond to DNT signals. However, you can use
                our cookie settings and browser controls to manage tracking.
              </p>
            </div>
          </section>

          {/* Section 12 */}
          <section id="cookie-section-12" className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
              <span className="flex items-center justify-center w-8 h-8 bg-purple-100 text-purple-600 rounded-full text-sm font-bold">12</span>
              Updates to This Policy
            </h2>
            <div className="prose prose-slate max-w-none">
              <p className="text-gray-600 leading-relaxed mb-4">
                We may update this Cookie Policy from time to time to reflect changes in our practices
                or for other operational, legal, or regulatory reasons. When we make changes:
              </p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2 mb-4">
                <li>We will update the "Last Updated" date at the top of this policy</li>
                <li>Material changes will be notified through our website</li>
                <li>We may ask you to re-consent to our cookie practices</li>
              </ul>
              <p className="text-gray-600 leading-relaxed mb-4">
                We encourage you to review this policy periodically.
              </p>
            </div>
          </section>

          {/* Section 13 */}
          <section id="cookie-section-13" className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
              <span className="flex items-center justify-center w-8 h-8 bg-purple-100 text-purple-600 rounded-full text-sm font-bold">13</span>
              Contact Us
            </h2>
            <div className="prose prose-slate max-w-none">
              <p className="text-gray-600 leading-relaxed mb-4">
                If you have any questions about our use of cookies or this Cookie Policy, please contact us:
              </p>
              <div className="bg-slate-50 rounded-xl p-6">
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-purple-600" />
                    <div>
                      <p className="text-sm text-gray-500">Email</p>
                      <a href="mailto:privacy@ethiopianmaids.com" className="text-purple-600 hover:text-purple-800">
                        privacy@ethiopianmaids.com
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
                to="/terms"
                className="px-4 py-2 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors"
              >
                Terms of Service
              </Link>
              <Link
                to="/privacy"
                className="px-4 py-2 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors"
              >
                Privacy Policy
              </Link>
              <Link
                to="/about"
                className="px-4 py-2 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors"
              >
                About Us
              </Link>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default CookiePolicy;
