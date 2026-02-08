import Head from 'next/head';

export default function Projects() {
  return (
    <>
      <Head>
        <title>Projects | DAO PropTech</title>
      </Head>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
        <div className="container mx-auto py-16 px-4 max-w-4xl">
          <h1 className="text-4xl font-bold mb-6">Verified Projects</h1>
          <p className="text-lg mb-8">Handpicked and institutionally qualified using a 30+ factor scoring matrix. Explore our secure, blockchain-backed projects with value-based pricing and personalized investment plans.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Example project cards, replace with dynamic data */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-2xl font-semibold mb-2">Urban Dwellings</h2>
              <p className="mb-2">Location: Islamabad</p>
              <p className="mb-2">Transparency, periodic updates, and defined rates.</p>
              <a href="#" className="text-blue-400 underline">View Details</a>
            </div>
            <div className="bg-gray-800 rounded-lg p-6">
              <h2 className="text-2xl font-semibold mb-2">Akron Plaza</h2>
              <p className="mb-2">Location: Rawalpindi</p>
              <p className="mb-2">Flexible payment options, blockchain-backed ownership.</p>
              <a href="#" className="text-blue-400 underline">View Details</a>
            </div>
            {/* Add more project cards as needed */}
          </div>
        </div>
      </div>
    </>
  );
}
