export default function PrivacyPolicyPage() {
  return (
    <div className="font-poppins">
      <section className="py-16 px-6" style={{ background: 'linear-gradient(135deg, #0b7ef1 0%, #15459b 100%)' }}>
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Privacy Policy</h1>
          <p className="text-lg text-blue-100">Last updated: January 2025</p>
        </div>
      </section>

      <section className="py-16 px-6">
        <div className="max-w-3xl mx-auto prose prose-gray">
          <div className="space-y-8">
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-3">1. Information We Collect</h2>
              <p className="text-gray-600 text-sm leading-relaxed">
                We collect information you provide directly to us, including your name, email address,
                phone number, CNIC details, and financial information necessary for KYC compliance and
                investment processing. We also collect usage data, device information, and cookies to
                improve our services.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-3">2. How We Use Your Information</h2>
              <p className="text-gray-600 text-sm leading-relaxed">
                We use collected information to: process your investments and transactions, verify your
                identity (KYC/AML compliance), communicate with you about your account, improve our
                platform, and comply with legal obligations. We do not sell your personal data to third
                parties.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-3">3. Data Security</h2>
              <p className="text-gray-600 text-sm leading-relaxed">
                We implement industry-standard security measures including encryption, secure servers,
                and blockchain technology to protect your personal and financial information. Access to
                your data is restricted to authorized personnel only.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-3">4. Blockchain Data</h2>
              <p className="text-gray-600 text-sm leading-relaxed">
                Investment transactions recorded on the blockchain are immutable and publicly visible
                by design. While wallet addresses are pseudonymous, your identity linked to these
                addresses is kept private and secure on our platform.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-3">5. Your Rights</h2>
              <p className="text-gray-600 text-sm leading-relaxed">
                You have the right to access, correct, or delete your personal information. You may
                also request data portability or restrict processing. Note that some data retention
                is required for regulatory compliance. Contact us at support@syntiantatlas.com to
                exercise your rights.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-3">6. Contact</h2>
              <p className="text-gray-600 text-sm leading-relaxed">
                For privacy-related inquiries, contact our Data Protection Officer at
                privacy@syntiantatlas.com or write to SYNTIANT Technologies, Islamabad, Pakistan.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
