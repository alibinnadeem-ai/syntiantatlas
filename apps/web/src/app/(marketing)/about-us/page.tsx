import { FiTarget, FiEye, FiUsers, FiShield, FiTrendingUp, FiGlobe } from 'react-icons/fi';

export default function AboutPage() {
  return (
    <div className="font-poppins">
      {/* Hero */}
      <section className="py-16 px-6" style={{ background: 'linear-gradient(135deg, #0b7ef1 0%, #15459b 100%)' }}>
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">About Syntiant Atlas</h1>
          <p className="text-lg text-blue-100 max-w-2xl mx-auto">
            Democratizing real estate investment through blockchain-powered fractional ownership.
          </p>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-16 px-6 max-w-7xl mx-auto">
        <div className="grid md:grid-cols-2 gap-12">
          <div className="card">
            <div className="w-12 h-12 bg-dao-blue/10 rounded-lg flex items-center justify-center mb-4">
              <FiTarget className="text-dao-blue text-2xl" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Our Mission</h2>
            <p className="text-gray-600 leading-relaxed">
              To make premium real estate investment accessible to everyone in Pakistan. Through fractional
              ownership powered by blockchain technology, we break down the barriers of high capital
              requirements, enabling anyone to build wealth through property investment starting from
              PKR 50,000.
            </p>
          </div>
          <div className="card">
            <div className="w-12 h-12 bg-dao-blue/10 rounded-lg flex items-center justify-center mb-4">
              <FiEye className="text-dao-blue text-2xl" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Our Vision</h2>
            <p className="text-gray-600 leading-relaxed">
              To become Pakistan&apos;s leading Web3 real estate platform, creating a transparent,
              secure, and efficient marketplace where property investment meets decentralized
              governance. We envision a future where every Pakistani can participate in the
              real estate market.
            </p>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-16 px-6 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">Our Core Values</h2>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { icon: <FiShield className="text-xl" />, title: 'Security First', desc: 'Smart contracts and blockchain ensure your investments are secure and transparent.' },
              { icon: <FiUsers className="text-xl" />, title: 'Community Driven', desc: 'DAO governance gives every investor a voice in property decisions.' },
              { icon: <FiTrendingUp className="text-xl" />, title: 'Growth Focused', desc: 'Curated high-value properties selected for maximum return potential.' },
              { icon: <FiGlobe className="text-xl" />, title: 'Accessible', desc: 'Low minimum investment thresholds making real estate open to all.' },
            ].map((v) => (
              <div key={v.title} className="card text-center">
                <div className="w-10 h-10 bg-dao-blue/10 rounded-lg flex items-center justify-center mx-auto mb-3 text-dao-blue">
                  {v.icon}
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{v.title}</h3>
                <p className="text-sm text-gray-600">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 px-6">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { value: '500+', label: 'Investors' },
            { value: '50+', label: 'Properties' },
            { value: 'PKR 2B+', label: 'Total Invested' },
            { value: '15%', label: 'Avg. Returns' },
          ].map((s) => (
            <div key={s.label}>
              <p className="text-3xl md:text-4xl font-bold text-dao-blue">{s.value}</p>
              <p className="text-sm text-gray-500 mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
