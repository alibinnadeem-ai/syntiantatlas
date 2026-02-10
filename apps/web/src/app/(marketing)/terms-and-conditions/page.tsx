export default function TermsPage() {
  return (
    <div className="font-poppins">
      <section className="py-16 px-6" style={{ background: 'linear-gradient(135deg, #0b7ef1 0%, #15459b 100%)' }}>
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Terms &amp; Conditions</h1>
          <p className="text-lg text-blue-100">Last updated: January 2025</p>
        </div>
      </section>

      <section className="py-16 px-6">
        <div className="max-w-3xl mx-auto prose prose-gray">
          <div className="space-y-8">
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-3">1. Acceptance of Terms</h2>
              <p className="text-gray-600 text-sm leading-relaxed">
                By accessing or using the Syntiant Atlas platform, you agree to be bound by these
                Terms and Conditions. If you do not agree to these terms, please do not use our
                services. These terms apply to all users including investors, sellers, and visitors.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-3">2. Eligibility</h2>
              <p className="text-gray-600 text-sm leading-relaxed">
                You must be at least 18 years old and a resident of Pakistan to use our investment
                services. You must complete KYC verification before making any investments. We reserve
                the right to refuse service to anyone who does not meet eligibility requirements.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-3">3. Investment Risks</h2>
              <p className="text-gray-600 text-sm leading-relaxed">
                All investments carry risk, including the potential loss of principal. Past performance
                does not guarantee future results. Expected returns displayed on property listings are
                estimates and not guaranteed. You should invest only what you can afford to lose and
                consider seeking independent financial advice.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-3">4. Fractional Ownership</h2>
              <p className="text-gray-600 text-sm leading-relaxed">
                Purchasing property tokens through our platform grants you fractional ownership rights
                as defined by the smart contract. These rights include proportional rental yield
                distributions and DAO governance voting. Token ownership does not constitute direct
                ownership of the underlying property.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-3">5. Platform Fees</h2>
              <p className="text-gray-600 text-sm leading-relaxed">
                Syntiant Atlas charges platform fees on investments, secondary market transactions,
                and certain withdrawal methods. All applicable fees are clearly disclosed before you
                confirm any transaction. Fee schedules may be updated with prior notice.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-3">6. Account Termination</h2>
              <p className="text-gray-600 text-sm leading-relaxed">
                We may suspend or terminate your account for violations of these terms, fraudulent
                activity, or regulatory requirements. Upon termination, your existing investments
                will be handled according to the applicable smart contract terms.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-3">7. Governing Law</h2>
              <p className="text-gray-600 text-sm leading-relaxed">
                These terms are governed by the laws of the Islamic Republic of Pakistan. Any disputes
                shall be resolved through arbitration in Islamabad, Pakistan.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
