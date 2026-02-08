import Head from 'next/head';

export default function Careers() {
  return (
    <>
      <Head>
        <title>Careers | DAO PropTech</title>
      </Head>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
        <div className="container mx-auto py-16 px-4 max-w-3xl">
          <h1 className="text-4xl font-bold mb-6">Careers at DAO PropTech</h1>
          <p className="text-lg mb-8">Join our award-winning team and help revolutionize real estate investment in Pakistan. We’re always looking for talented individuals passionate about technology and property.</p>
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-2xl font-semibold mb-4">Open Positions</h2>
            <ul className="list-disc pl-6">
              <li>Frontend Developer</li>
              <li>Backend Developer</li>
              <li>Product Manager</li>
              <li>Marketing Specialist</li>
              {/* Add more positions as needed */}
            </ul>
            <p className="mt-4">Send your CV to <a href="mailto:careers@daoproptech.com" className="text-blue-400 underline">careers@daoproptech.com</a></p>
          </div>
        </div>
      </div>
    </>
  );
}
