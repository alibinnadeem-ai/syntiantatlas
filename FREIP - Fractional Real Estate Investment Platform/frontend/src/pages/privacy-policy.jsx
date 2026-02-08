import Head from 'next/head';

export default function PrivacyPolicy() {
  return (
    <>
      <Head>
        <title>Privacy Policy | DAO PropTech</title>
      </Head>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
        <div className="container mx-auto py-16 px-4 max-w-3xl">
          <h1 className="text-4xl font-bold mb-6">Privacy Policy</h1>
          <div className="bg-gray-800 rounded-lg p-6">
            <p className="mb-4">DAO PropTech is committed to protecting your privacy. We collect and use your data only for platform operations, investment management, and communication. Your information is never shared with third parties without consent.</p>
            <p className="mb-4">For questions or concerns, contact <a href="mailto:info@daoproptech.com" className="text-blue-400 underline">info@daoproptech.com</a>.</p>
            <p>© 2025 DAO PROPTECH. All rights reserved.</p>
          </div>
        </div>
      </div>
    </>
  );
}
