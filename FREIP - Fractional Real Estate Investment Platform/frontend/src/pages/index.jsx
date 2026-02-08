import Head from 'next/head';

export default function Home() {
  return (
    <>
      <Head>
        <title>Home | DAO PropTech</title>
      </Head>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
        {/* Hero Section */}
        <section className="py-16 text-center">
          <h1 className="text-5xl font-bold mb-4">We're Pakistan's 1st digital real estate investment platform</h1>
          <p className="text-2xl text-gray-300 mb-8">Award-winning, secure, data-driven, easier liquidity, no middle-man, flexible payment options, indicative future pricing, digital portfolio management</p>
          <div className="flex gap-4 justify-center mb-8">
            <a href="/login" className="btn-primary">Login</a>
            <a href="/register" className="btn-secondary">Register</a>
          </div>
          <img src="/images/mobile-mockup.png" alt="Mobile Mockup" className="mx-auto mb-8" style={{maxWidth:'300px'}} />
        </section>

        {/* Value Propositions */}
        <section className="container mx-auto py-8 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="bg-gray-800 rounded-lg p-6 text-center">
            <h2 className="text-xl font-bold mb-2">Verified Projects</h2>
            <p>Handpicked and institutionally qualified using a 30+ factor scoring matrix</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-6 text-center">
            <h2 className="text-xl font-bold mb-2">Backed by Blockchain</h2>
            <p>Secure and transparent; easier to track and verify your transactions</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-6 text-center">
            <h2 className="text-xl font-bold mb-2">Value-based Pricing</h2>
            <p>Invest at transparently declared price; no hidden charges or hefty premiums</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-6 text-center">
            <h2 className="text-xl font-bold mb-2">Personalized Plans</h2>
            <p>Profit, Possession, Income or Saving – we’ve it covered</p>
          </div>
        </section>

        {/* How It Works */}
        <section className="container mx-auto py-8">
          <h2 className="text-3xl font-bold mb-6 text-center">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-gray-800 rounded-lg p-6 text-center">
              <h3 className="text-xl font-semibold mb-2">1. Sign Up</h3>
              <p>Explore real estate projects that meet your investment criteria</p>
            </div>
            <div className="bg-gray-800 rounded-lg p-6 text-center">
              <h3 className="text-xl font-semibold mb-2">2. Invest</h3>
              <p>Build your real estate portfolio from a low initial investment and keep accumulating</p>
            </div>
            <div className="bg-gray-800 rounded-lg p-6 text-center">
              <h3 className="text-xl font-semibold mb-2">3. Check Progress</h3>
              <p>Keep a track of your investments through your personal dashboard</p>
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="container mx-auto py-8">
          <h2 className="text-3xl font-bold mb-6 text-center">Testimonials</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-gray-800 rounded-lg p-6">
              <p className="mb-4">"I liked the location of Urban Dwellings. The past, present, and future rates are defined, so it’s a good model. What prompted me to invest in this was the level of transparency. Their online presence, portals, dashboard, and periodic update almost every two weeks are outstanding."</p>
              <div className="flex items-center gap-4">
                <img src="/images/testimonial1.png" alt="Naveed ur rahman" className="w-12 h-12 rounded-full" />
                <div>
                  <div className="font-bold">Naveed Ur Rehman</div>
                  <div className="text-sm text-gray-400">Software Engineer</div>
                </div>
              </div>
            </div>
            {/* Add more testimonials as needed */}
          </div>
        </section>

        {/* Platform Stats */}
        <section className="container mx-auto py-8 grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-3xl font-bold text-blue-400 mb-2">78,206</h3>
            <p className="text-gray-400">Platform Users</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-3xl font-bold text-green-400 mb-2">1,049,253</h3>
            <p className="text-gray-400">Sq. ft. sold to date</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-3xl font-bold text-purple-400 mb-2">4,936</h3>
            <p className="text-gray-400">Transactions</p>
          </div>
        </section>

        {/* Featured On */}
        <section className="container mx-auto py-8 text-center">
          <h2 className="text-3xl font-bold mb-6">Featured On</h2>
          <div className="flex flex-wrap justify-center gap-8">
            <img src="/images/featured1.png" alt="Featured Logo 1" className="h-12" />
            <img src="/images/featured2.png" alt="Featured Logo 2" className="h-12" />
            {/* Add more logos as needed */}
          </div>
        </section>

        {/* Latest Blogs */}
        <section className="container mx-auto py-8">
          <h2 className="text-3xl font-bold mb-6 text-center">Latest Blogs</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-2">Why Pakistan Needs PropTech to Fix Its Broken Real Estate Model</h3>
              <p className="mb-2">Sep 15, 2025</p>
              <a href="https://daoproptech.com/blog/why-pakistan-needs-proptech-to-fix-its-broken-real-estate-model/" target="_blank" rel="noopener" className="text-blue-400 underline">Read More</a>
            </div>
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-2">Real Estate Without a Middleman? Blockchain Makes It Possible</h3>
              <p className="mb-2">Apr 24, 2025</p>
              <a href="https://daoproptech.com/blog/real-estate-without-a-middleman-blockchain-makes-it-possible/" target="_blank" rel="noopener" className="text-blue-400 underline">Read More</a>
            </div>
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-2">6 Secrets to Real Estate Success: Invest with Confidence</h3>
              <p className="mb-2">Apr 29, 2025</p>
              <a href="https://daoproptech.com/blog/6-secrets-to-real-estate-success-invest-with-confidence-2/" target="_blank" rel="noopener" className="text-blue-400 underline">Read More</a>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-gray-900 py-8 mt-16 text-gray-400">
          <div className="container mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h4 className="text-white font-bold mb-2">Company</h4>
              <ul>
                <li><a href="/about-us" className="hover:underline">About Us</a></li>
                <li><a href="/projects" className="hover:underline">Projects</a></li>
                <li><a href="/careers" className="hover:underline">Careers</a></li>
                <li><a href="/blog" className="hover:underline">Blog</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold mb-2">Support</h4>
              <ul>
                <li><a href="/contact-us" className="hover:underline">Contact Us</a></li>
                <li><a href="/faq" className="hover:underline">FAQ</a></li>
                <li><a href="/privacy-policy" className="hover:underline">Privacy Policy</a></li>
                <li><a href="/terms-and-conditions" className="hover:underline">Terms and Conditions</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold mb-2">Address</h4>
              <p>Akron Plaza, Daftarkhawan Vantage,<br/>Plot No 13, Street No. 1, Phase 7, Bahria Town, Rawalpindi</p>
              <p>Email: <a href="mailto:info@daoproptech.com" className="text-blue-400 underline">info@daoproptech.com</a></p>
              <p>Phone: <a href="tel:+923143267767" className="text-blue-400 underline">+(92) 314 326 7767</a></p>
              <div className="flex gap-4 mt-4">
                <a href="https://www.facebook.com/DAOPropTech/" target="_blank" rel="noopener"><img src="/images/facebook.png" alt="Facebook" className="h-6" /></a>
                <a href="https://twitter.com/daoproptech" target="_blank" rel="noopener"><img src="/images/twitter.png" alt="Twitter" className="h-6" /></a>
                <a href="https://www.instagram.com/daoproptech/" target="_blank" rel="noopener"><img src="/images/instagram.png" alt="Instagram" className="h-6" /></a>
                <a href="https://www.linkedin.com/company/daoproptech" target="_blank" rel="noopener"><img src="/images/linkedin.png" alt="LinkedIn" className="h-6" /></a>
                <a href="https://www.youtube.com/c/DAOPropTech" target="_blank" rel="noopener"><img src="/images/youtube.png" alt="YouTube" className="h-6" /></a>
              </div>
            </div>
          </div>
          <div className="text-center mt-8 text-sm">© 2025 DAO PROPTECH. All rights reserved.</div>
        </footer>
      </div>
    </>
  );
}
