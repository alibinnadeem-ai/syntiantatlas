'use client';

import Link from 'next/link';
import Image from 'next/image';
import { FiArrowRight, FiShield, FiTrendingUp, FiUsers } from 'react-icons/fi';
import { useAuth } from '@/hooks/use-auth';

export default function HomePage() {
  const { isAuthenticated, isLoading, user, getDashboardPath } = useAuth();

  const dashboardPath = user ? getDashboardPath(user.roleId) : '/login';

  return (
    <main className="min-h-screen">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center">
            <Image
              src="/assets/syntiant-atlas-logo.png"
              alt="Syntiant Atlas"
              width={140}
              height={36}
              className="object-contain"
            />
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600">
            <Link href="/about-us" className="hover:text-dao-blue transition">About</Link>
            <Link href="/faq" className="hover:text-dao-blue transition">FAQ</Link>
            <Link href="/contact-us" className="hover:text-dao-blue transition">Contact</Link>
          </div>
          <div className="flex items-center gap-3">
            {!isLoading && isAuthenticated && user ? (
              <Link href={dashboardPath} className="btn-primary text-sm !px-4 !py-2">
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link href="/login" className="text-sm font-medium text-gray-700 hover:text-dao-blue transition">
                  Sign In
                </Link>
                <Link href="/register" className="btn-primary text-sm !px-4 !py-2">
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section
        className="pt-32 pb-20 px-6"
        style={{
          background: 'linear-gradient(135deg, #0b7ef1 0%, #15459b 100%)',
        }}
      >
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
            Invest in Real Estate
            <br />
            <span className="text-dao-lime">Fractionally</span>
          </h1>
          <p className="text-lg md:text-xl text-blue-100 max-w-2xl mx-auto mb-10">
            Own a piece of premium real estate properties through blockchain-powered
            fractional investment. Start with as little as PKR 50,000.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            {!isLoading && isAuthenticated && user ? (
              <Link href={dashboardPath} className="btn-primary flex items-center gap-2 text-lg">
                Go to Dashboard <FiArrowRight />
              </Link>
            ) : (
              <Link href="/register" className="btn-primary flex items-center gap-2 text-lg">
                Start Investing <FiArrowRight />
              </Link>
            )}
            <Link href="/about-us" className="btn-secondary !bg-white/10 !text-white border border-white/20 text-lg">
              Learn More
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Why Syntiant Atlas?
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: <FiTrendingUp className="text-2xl" />,
                title: 'Fractional Ownership',
                description:
                  'Invest in premium real estate with as little as PKR 50,000. Own tokenized shares of high-value properties.',
              },
              {
                icon: <FiShield className="text-2xl" />,
                title: 'Blockchain Secured',
                description:
                  'Every investment is recorded on the blockchain with smart contracts ensuring transparency and security.',
              },
              {
                icon: <FiUsers className="text-2xl" />,
                title: 'Syntiant Governance',
                description:
                  'Participate in property decisions through token-weighted voting. Your investment, your voice.',
              },
            ].map((feature) => (
              <div key={feature.title} className="card text-center">
                <div className="w-12 h-12 bg-dao-blue/10 rounded-lg flex items-center justify-center mx-auto mb-4 text-dao-blue">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600 text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-dao-dark text-gray-400 py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center">
            <Image
              src="/assets/syntiant-atlas-logo.png"
              alt="Syntiant Atlas"
              width={100}
              height={28}
              className="object-contain"
            />
          </div>
          <div className="flex gap-6 text-sm">
            <Link href="/privacy-policy" className="hover:text-white transition">Privacy</Link>
            <Link href="/terms-and-conditions" className="hover:text-white transition">Terms</Link>
            <Link href="/contact-us" className="hover:text-white transition">Contact</Link>
          </div>
          <p className="text-sm">
            &copy; {new Date().getFullYear()} SYNTIANT Technologies. All rights reserved.
          </p>
        </div>
      </footer>
    </main>
  );
}
