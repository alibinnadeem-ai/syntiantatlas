import Head from 'next/head';

export default function Blog() {
  return (
    <>
      <Head>
        <title>Blog | DAO PropTech</title>
      </Head>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
        <div className="container mx-auto py-16 px-4 max-w-4xl">
          <h1 className="text-4xl font-bold mb-6">Latest Blogs</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Example blog cards, replace with dynamic data */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-2xl font-semibold mb-2">Why Pakistan Needs PropTech to Fix Its Broken Real Estate Model</h2>
              <p className="mb-2">Sep 15, 2025</p>
              <a href="https://daoproptech.com/blog/why-pakistan-needs-proptech-to-fix-its-broken-real-estate-model/" target="_blank" rel="noopener" className="text-blue-400 underline">Read More</a>
            </div>
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-2xl font-semibold mb-2">Real Estate Without a Middleman? Blockchain Makes It Possible</h2>
              <p className="mb-2">Apr 24, 2025</p>
              <a href="https://daoproptech.com/blog/real-estate-without-a-middleman-blockchain-makes-it-possible/" target="_blank" rel="noopener" className="text-blue-400 underline">Read More</a>
            </div>
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-2xl font-semibold mb-2">6 Secrets to Real Estate Success: Invest with Confidence</h2>
              <p className="mb-2">Apr 29, 2025</p>
              <a href="https://daoproptech.com/blog/6-secrets-to-real-estate-success-invest-with-confidence-2/" target="_blank" rel="noopener" className="text-blue-400 underline">Read More</a>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
