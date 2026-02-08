import Head from 'next/head';

export default function FAQ() {
  return (
    <>
      <Head>
        <title>FAQ | DAO PropTech</title>
      </Head>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
        <div className="container mx-auto py-16 px-4 max-w-3xl">
          <h1 className="text-4xl font-bold mb-6">Frequently Asked Questions</h1>
          <div className="space-y-6">
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-2xl font-semibold mb-2">What is DAO PropTech?</h2>
              <p>Pakistan's 1st digital real estate investment platform, offering secure, transparent, and accessible property investment.</p>
            </div>
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-2xl font-semibold mb-2">How do I invest?</h2>
              <p>Sign up, browse verified projects, and invest with flexible payment options. Track your portfolio online.</p>
            </div>
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-2xl font-semibold mb-2">Is my investment secure?</h2>
              <p>Yes, all projects are institutionally qualified and backed by blockchain for transparency and security.</p>
            </div>
            {/* Add more FAQs as needed */}
          </div>
        </div>
      </div>
    </>
  );
}
