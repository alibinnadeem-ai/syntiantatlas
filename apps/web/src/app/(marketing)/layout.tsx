import Link from 'next/link';
import Image from 'next/image';

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center">
            <Image
              src="/assets/syntiant-atlas-logo.png"
              alt="Syntiant Atlas"
              width={140}
              height={36}
              className="object-contain"
            />
          </Link>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600">
            <Link href="/about-us" className="hover:text-dao-blue transition">About</Link>
            <Link href="/faq" className="hover:text-dao-blue transition">FAQ</Link>
            <Link href="/contact-us" className="hover:text-dao-blue transition">Contact</Link>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm font-medium text-gray-700 hover:text-dao-blue transition">
              Sign In
            </Link>
            <Link href="/register" className="btn-primary text-sm !px-4 !py-2">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Content */}
      <div className="flex-1 pt-20">{children}</div>

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
    </div>
  );
}
