import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const TermsOfServicePage = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link 
            to="/" 
            className="inline-flex items-center text-blue-600 hover:text-blue-800 transition-colors mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Terms of Service</h1>
          <p className="text-gray-600">Last updated: {new Date().toLocaleDateString()}</p>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg shadow-sm p-8 space-y-8">
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Acceptance of Terms</h2>
            <p className="text-gray-700 leading-relaxed">
              By accessing and using CUHK Course Planner ("the Service"), you accept and agree to be bound by the terms 
              and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Description of Service</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              CUHK Course Planner is an unofficial course planning application designed to help students at The Chinese 
              University of Hong Kong (CUHK) discover courses, build schedules, and track their academic progress. 
              The service provides:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>Course search and filtering capabilities</li>
              <li>Schedule building and management tools</li>
              <li>Course favorites and bookmarking</li>
              <li>Academic planning assistance</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. User Responsibilities</h2>
            <div className="space-y-4">
              <p className="text-gray-700 leading-relaxed">
                As a user of this service, you agree to:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li>Use the service only for lawful purposes</li>
                <li>Provide accurate and complete information</li>
                <li>Maintain the security of your account and data</li>
                <li>Not attempt to gain unauthorized access to the service</li>
                <li>Not interfere with or disrupt the service</li>
                <li>Respect the intellectual property rights of others</li>
                <li>Not use the service for commercial purposes without permission</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Data Accuracy and Disclaimer</h2>
            <div className="space-y-4">
              <p className="text-gray-700 leading-relaxed">
                <strong>Important:</strong> This application is not affiliated with The Chinese University of Hong Kong. 
                All course information is provided for planning purposes only and may not reflect the most current data.
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li>Course availability and scheduling may change</li>
                <li>Prerequisites and requirements should be verified with official sources</li>
                <li>Academic policies and regulations are subject to change</li>
                <li>Always consult official CUHK resources for final decisions</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Intellectual Property</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              The service and its original content, features, and functionality are owned by the developers and are 
              protected by international copyright, trademark, patent, trade secret, and other intellectual property laws.
            </p>
            <p className="text-gray-700 leading-relaxed">
              Course data and academic information belong to The Chinese University of Hong Kong and are used in 
              accordance with fair use principles for educational purposes.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Privacy and Data Protection</h2>
            <p className="text-gray-700 leading-relaxed">
              Your privacy is important to us. Please review our Privacy Policy, which also governs your use of the 
              service, to understand our practices regarding the collection and use of your information.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Service Availability</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              We strive to maintain the service's availability, but we do not guarantee:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>Uninterrupted or error-free operation</li>
              <li>Immediate availability of all features</li>
              <li>Compatibility with all devices or browsers</li>
              <li>Real-time data synchronization</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Limitation of Liability</h2>
            <p className="text-gray-700 leading-relaxed">
              In no event shall the developers be liable for any indirect, incidental, special, consequential, or 
              punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible 
              losses, resulting from your use of the service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Indemnification</h2>
            <p className="text-gray-700 leading-relaxed">
              You agree to defend, indemnify, and hold harmless the developers from and against any claims, damages, 
              obligations, losses, liabilities, costs, or debt arising from your use of the service or violation of 
              these terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Termination</h2>
            <p className="text-gray-700 leading-relaxed">
              We may terminate or suspend your access to the service immediately, without prior notice or liability, 
              for any reason whatsoever, including without limitation if you breach the terms. Upon termination, your 
              right to use the service will cease immediately.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Governing Law</h2>
            <p className="text-gray-700 leading-relaxed">
              These terms shall be interpreted and governed by the laws of Hong Kong, without regard to its conflict 
              of law provisions. Our failure to enforce any right or provision of these terms will not be considered 
              a waiver of those rights.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">12. Changes to Terms</h2>
            <p className="text-gray-700 leading-relaxed">
              We reserve the right to modify or replace these terms at any time. If a revision is material, we will 
              provide at least 30 days notice prior to any new terms taking effect. What constitutes a material change 
              will be determined at our sole discretion.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">13. Contact Information</h2>
            <p className="text-gray-700 leading-relaxed">
              If you have any questions about these terms of service, please contact us:
            </p>
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <p className="text-gray-700">
                <strong>Email:</strong> terms@cuhk-course-planner.com<br />
                <strong>GitHub:</strong> <a href="https://github.com/Nokijai/CU_Course_Planner" className="text-blue-600 hover:text-blue-800">https://github.com/Nokijai/CU_Course_Planner</a>
              </p>
            </div>
          </section>

          <section className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-blue-900 mb-2">Important Notice</h2>
            <p className="text-blue-800 leading-relaxed">
              This application is developed independently and is not officially affiliated with The Chinese University 
              of Hong Kong. Always verify course information, requirements, and academic policies with official CUHK 
              resources before making any academic decisions.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default TermsOfServicePage; 