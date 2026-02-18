import { usePageTitle } from '@/hooks/usePageTitle';
import React from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Shield,
  Globe,
  Star,
  Heart,
  CheckCircle,
  Award,
  Phone,
  Mail,
  MapPin,
  Target,
  Eye,
  Briefcase,
  Clock,
  ThumbsUp,
  Building,
  FileCheck,
  ArrowRight,
} from 'lucide-react';

const AboutPage = () => {
  const stats = [
    { icon: Users, value: '4,200+', label: 'Registered Users', color: 'text-purple-600' },
    { icon: ThumbsUp, value: '97%', label: 'Success Rate', color: 'text-green-600' },
    { icon: Globe, value: '6', label: 'GCC Countries', color: 'text-blue-600' },
    { icon: Star, value: '4.8/5', label: 'User Rating', color: 'text-yellow-600' },
  ];

  const values = [
    {
      icon: Shield,
      title: 'Trust & Safety',
      description: 'Every maid undergoes thorough background checks, document verification, and skill assessments to ensure your family\'s safety.',
    },
    {
      icon: Award,
      title: 'Quality Service',
      description: 'We maintain high standards through continuous training, performance monitoring, and regular feedback from sponsors.',
    },
    {
      icon: Heart,
      title: 'Care & Support',
      description: '24/7 customer support with dedicated case managers to assist both sponsors and maids throughout the placement process.',
    },
    {
      icon: CheckCircle,
      title: 'Reliability',
      description: 'Our 30-day replacement guarantee and transparent processes ensure peace of mind for all parties involved.',
    },
  ];

  const services = [
    {
      icon: Briefcase,
      title: 'Maid Placement',
      description: 'Connect with verified, skilled domestic workers from Ethiopia for full-time, part-time, or temporary positions.',
    },
    {
      icon: FileCheck,
      title: 'Document Processing',
      description: 'Complete assistance with visa applications, work permits, medical certificates, and travel arrangements.',
    },
    {
      icon: Building,
      title: 'Agency Network',
      description: 'Partner with licensed agencies across Ethiopia and GCC countries for seamless recruitment.',
    },
    {
      icon: Clock,
      title: 'Ongoing Support',
      description: 'Continuous support throughout the employment period including mediation, training, and emergency assistance.',
    },
  ];

  const countries = [
    { name: 'United Arab Emirates', flag: '🇦🇪' },
    { name: 'Saudi Arabia', flag: '🇸🇦' },
    { name: 'Qatar', flag: '🇶🇦' },
    { name: 'Kuwait', flag: '🇰🇼' },
    { name: 'Bahrain', flag: '🇧🇭' },
    { name: 'Oman', flag: '🇴🇲' },
  ];

  const certifications = [
    'Ethiopian Ministry of Labor Licensed',
    'GCC Regulatory Authority Approved',
    'MOLSA Certified Agency Partner',
    'ISO 9001:2015 Quality Management',
    'Member - Ethiopian Manpower Export Association',
    'Verified by Ethiopian Embassy Network',
  ];

  usePageTitle('About Us');
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            About Ethiopian Maids
          </h1>
          <p className="text-xl md:text-2xl text-purple-100 max-w-3xl mx-auto">
            Connecting Ethiopian domestic workers with families across the Gulf region since 2019
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              to="/get-started"
              className="inline-flex items-center px-6 py-3 bg-white text-purple-600 font-semibold rounded-lg hover:bg-purple-50 transition-colors"
            >
              Get Started
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
            <Link
              to="/contact"
              className="inline-flex items-center px-6 py-3 border-2 border-white text-white font-semibold rounded-lg hover:bg-white/10 transition-colors"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-12">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <stat.icon className={`h-10 w-10 mx-auto mb-3 ${stat.color}`} />
                <div className="text-3xl font-bold text-gray-900">{stat.value}</div>
                <div className="text-sm text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Mission & Vision */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="flex items-center mb-4">
              <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center">
                <Target className="h-6 w-6 text-purple-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 ml-4">Our Mission</h2>
            </div>
            <p className="text-gray-600 leading-relaxed">
              To provide dignified employment opportunities for Ethiopian domestic workers while
              delivering exceptional household support to families in the Gulf region. We strive
              to create meaningful connections built on trust, respect, and mutual benefit.
            </p>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="flex items-center mb-4">
              <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Eye className="h-6 w-6 text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 ml-4">Our Vision</h2>
            </div>
            <p className="text-gray-600 leading-relaxed">
              To become the most trusted platform for domestic worker placement in the Middle East,
              setting industry standards for transparency, worker welfare, and employer satisfaction
              while empowering Ethiopian workers to build better futures.
            </p>
          </div>
        </div>
      </div>

      {/* Our Story */}
      <div className="bg-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Story</h2>
            <div className="w-24 h-1 bg-gradient-to-r from-purple-600 to-blue-600 mx-auto"></div>
          </div>
          <div className="prose prose-lg max-w-none text-gray-600">
            <p>
              Ethiopian Maids was founded in 2019 with a simple yet powerful vision: to bridge the
              gap between Ethiopian domestic workers seeking better opportunities and Gulf families
              in need of reliable household support.
            </p>
            <p className="mt-4">
              Our founders, with decades of combined experience in international labor recruitment,
              recognized the challenges faced by both workers and employers in the traditional
              recruitment process. Long waiting times, lack of transparency, and inadequate
              support systems were common pain points that needed addressing.
            </p>
            <p className="mt-4">
              Today, Ethiopian Maids operates across all six GCC countries, partnering with licensed
              agencies in Ethiopia and maintaining strong relationships with labor authorities in
              both origin and destination countries. Our technology-driven platform has transformed
              how domestic worker placement works, making it faster, safer, and more transparent
              for everyone involved.
            </p>
          </div>
        </div>
      </div>

      {/* Services */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">What We Do</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Comprehensive services to ensure successful placements and ongoing support
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {services.map((service, index) => (
            <div
              key={index}
              className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow"
            >
              <div className="h-12 w-12 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg flex items-center justify-center mb-4">
                <service.icon className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{service.title}</h3>
              <p className="text-gray-600 text-sm">{service.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Values */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">Our Values</h2>
            <p className="text-purple-100 max-w-2xl mx-auto">
              The principles that guide everything we do
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value, index) => (
              <div
                key={index}
                className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-white"
              >
                <value.icon className="h-10 w-10 mb-4" />
                <h3 className="text-lg font-semibold mb-2">{value.title}</h3>
                <p className="text-purple-100 text-sm">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Coverage Area */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Where We Operate</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Serving families across all Gulf Cooperation Council countries
          </p>
        </div>
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {countries.map((country, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl mb-2">{country.flag}</div>
                <div className="text-sm font-medium text-gray-900">{country.name}</div>
              </div>
            ))}
          </div>
          <div className="mt-8 pt-8 border-t border-gray-200">
            <div className="flex items-center justify-center">
              <MapPin className="h-5 w-5 text-purple-600 mr-2" />
              <span className="text-gray-600">
                Headquarters: Addis Ababa, Ethiopia | Regional Office: Dubai, UAE
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Certifications */}
      <div className="bg-gray-50 py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Certifications & Licenses</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Fully licensed and authorized to operate in all service regions
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {certifications.map((cert, index) => (
              <div
                key={index}
                className="bg-white rounded-lg p-4 flex items-center shadow-sm"
              >
                <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                <span className="text-gray-700">{cert}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Contact Section */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="grid md:grid-cols-2">
            <div className="bg-gradient-to-br from-purple-600 to-blue-600 p-8 md:p-12 text-white">
              <h2 className="text-2xl font-bold mb-4">Get in Touch</h2>
              <p className="text-purple-100 mb-8">
                Have questions? Our team is here to help you 24/7.
              </p>
              <div className="space-y-6">
                <div className="flex items-center">
                  <div className="h-10 w-10 bg-white/20 rounded-full flex items-center justify-center mr-4">
                    <Phone className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-sm text-purple-200">Call Us</div>
                    <div className="font-semibold">+1 717 699 8295</div>
                  </div>
                </div>
                <div className="flex items-center">
                  <div className="h-10 w-10 bg-white/20 rounded-full flex items-center justify-center mr-4">
                    <Mail className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-sm text-purple-200">Email Us</div>
                    <div className="font-semibold">support@ethiopianmaids.com</div>
                  </div>
                </div>
                <div className="flex items-center">
                  <div className="h-10 w-10 bg-white/20 rounded-full flex items-center justify-center mr-4">
                    <Globe className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-sm text-purple-200">Website</div>
                    <div className="font-semibold">ethiopianmaids.com</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-8 md:p-12">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Office Hours</h3>
              <div className="space-y-3 text-gray-600">
                <div className="flex justify-between">
                  <span>Monday - Friday</span>
                  <span className="font-medium">8:00 AM - 10:00 PM GST</span>
                </div>
                <div className="flex justify-between">
                  <span>Saturday</span>
                  <span className="font-medium">8:00 AM - 10:00 PM GST</span>
                </div>
                <div className="flex justify-between">
                  <span>Sunday</span>
                  <span className="font-medium">Emergency Only</span>
                </div>
              </div>
              <div className="mt-8 pt-6 border-t border-gray-200">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Response Times</h3>
                <div className="space-y-2 text-gray-600 text-sm">
                  <p><strong>Email:</strong> Within 24 hours</p>
                  <p><strong>Phone:</strong> Immediate during business hours</p>
                  <p><strong>WhatsApp:</strong> Within 2-4 hours</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Find Your Perfect Match?
          </h2>
          <p className="text-purple-100 mb-8 max-w-2xl mx-auto">
            Join thousands of satisfied families who have found reliable domestic support
            through Ethiopian Maids. Start your journey today.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              to="/get-started"
              className="inline-flex items-center px-8 py-4 bg-white text-purple-600 font-semibold rounded-lg hover:bg-purple-50 transition-colors text-lg"
            >
              Get Started Now
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
            <Link
              to="/maids"
              className="inline-flex items-center px-8 py-4 border-2 border-white text-white font-semibold rounded-lg hover:bg-white/10 transition-colors text-lg"
            >
              Browse Maids
            </Link>
          </div>
        </div>
      </div>

      {/* Footer Links */}
      <div className="bg-white py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-600">
            <Link to="/terms" className="hover:text-purple-600 transition-colors">
              Terms of Service
            </Link>
            <Link to="/privacy" className="hover:text-purple-600 transition-colors">
              Privacy Policy
            </Link>
            <Link to="/cookies" className="hover:text-purple-600 transition-colors">
              Cookie Policy
            </Link>
            <Link to="/contact" className="hover:text-purple-600 transition-colors">
              Contact Us
            </Link>
            <Link to="/faq" className="hover:text-purple-600 transition-colors">
              FAQ
            </Link>
          </div>
          <div className="mt-6 text-center text-gray-500 text-sm">
            &copy; {new Date().getFullYear()} Ethiopian Maids. All rights reserved.
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;
