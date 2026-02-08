import Head from 'next/head';

export default function AboutUs() {
  return (
    <>
      <Head>
        <title>About Us | DAO PropTech</title>
      </Head>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
        <div className="container mx-auto py-16 px-4 max-w-3xl">
          <h1 className="text-4xl font-bold mb-6">About DAO PropTech</h1>
          <p className="text-lg mb-8">
            DAO PropTech is Pakistan's 1st digital real estate investment platform, leveraging technology and blockchain to make property investment secure, transparent, and accessible for everyone.
          </p>
          <ul className="mb-8 space-y-4">
            <li>✅ Award-winning Platform</li>
            <li>✅ 100% Secure</li>
            <li>✅ Data-driven Project Selection</li>
            <li>✅ Easier Liquidity</li>
            <li>✅ No Middle-man</li>
            <li>✅ Flexible Payment Options</li>
            <li>✅ Indicative Future Pricing</li>
            <li>✅ Digital Portfolio Management</li>
          </ul>
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-2xl font-semibold mb-4">Our Mission</h2>
            <p className="mb-4">To enable real estate investments for everyone by providing diversified property options, transparent pricing, and personalized investment plans.</p>
            <h2 className="text-2xl font-semibold mb-4">Our Story</h2>
            <p>Founded in Rawalpindi, DAO PropTech is a registered company with the Securities and Exchange Commission of Pakistan and a certified member of P@SHA. We are committed to revolutionizing real estate investment in Pakistan.</p>
          </div>
        </div>
      </div>
    </>
  );
}
