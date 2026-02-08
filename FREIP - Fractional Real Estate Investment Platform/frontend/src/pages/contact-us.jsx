import Head from 'next/head';

export default function ContactUs() {
  return (
    <>
      <Head>
        <title>Contact Us | DAO PropTech</title>
      </Head>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
        <div className="container mx-auto py-16 px-4 max-w-3xl">
          <h1 className="text-4xl font-bold mb-6">Contact Us</h1>
          <p className="text-lg mb-8">Location: Akron Plaza, Daftarkhawan Vantage, Plot No 13, Street No. 1, Phase 7, Bahria Town, Rawalpindi</p>
          <p className="mb-4">Email: <a href="mailto:info@daoproptech.com" className="text-blue-400 underline">info@daoproptech.com</a></p>
          <p className="mb-8">Phone: <a href="tel:+923143267767" className="text-blue-400 underline">+(92) 314 326 7767</a></p>
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-2xl font-semibold mb-4">Send us a message</h2>
            <form className="space-y-4">
              <input type="text" placeholder="Your Name" className="w-full p-2 rounded bg-gray-700 text-white" />
              <input type="email" placeholder="Your Email" className="w-full p-2 rounded bg-gray-700 text-white" />
              <textarea placeholder="Your Message" className="w-full p-2 rounded bg-gray-700 text-white" rows={4}></textarea>
              <button type="submit" className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-6 rounded">Send</button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
