import Head from 'next/head'
import Link from 'next/link'
import Layout from '@/components/Layout'
import { FaEnvelope, FaHeadset, FaPhone, FaMapMarkerAlt } from 'react-icons/fa'

// Contact Info
const contactInfo = [
    {
        icon: FaEnvelope,
        title: 'Email',
        value: 'info@daoproptech.com',
        link: 'mailto:info@daoproptech.com'
    },
    {
        icon: FaHeadset,
        title: 'Support',
        value: 'support@daoproptech.com',
        link: 'mailto:support@daoproptech.com'
    },
    {
        icon: FaPhone,
        title: 'Phone',
        value: '+92 314 326 7767',
        link: 'tel:+923143267767'
    },
    {
        icon: FaMapMarkerAlt,
        title: 'Address',
        value: 'Akron Plaza, Daftarkhawan Vantage, Plot No 13, Street No. 1, Phase 7, Bahria Town, Rawalpindi',
        link: 'https://maps.google.com'
    },
]

export default function ContactUs() {
    return (
        <Layout>
            <Head>
                <title>Contact Us - DAO PropTech</title>
                <meta name="description" content="Get in touch with DAO PropTech. We're here to help you with your real estate investment journey." />
            </Head>

            {/* Hero Section */}
            <section className="hero-gradient min-h-[400px] pt-28 pb-16 relative overflow-hidden">
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-10 right-10 w-40 h-40 border border-white rotate-45"></div>
                    <div className="absolute top-32 right-32 w-20 h-20 border border-white rotate-45"></div>
                </div>

                <div className="container-custom px-4 md:px-8 relative z-10 text-center">
                    <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6">
                        Contact Us
                    </h1>
                    <h2 className="text-xl md:text-2xl text-white/90 mb-4">
                        How can we help you today?
                    </h2>
                    <p className="text-white/80 max-w-2xl mx-auto">
                        Feel free to contact us any time and our customer service representative will get in touch with you.
                    </p>
                </div>
            </section>

            {/* Contact Info Cards */}
            <section className="section-padding">
                <div className="container-custom max-w-4xl">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {contactInfo.map((item, index) => (
                            <a
                                key={index}
                                href={item.link}
                                target={item.title === 'Address' ? '_blank' : '_self'}
                                rel="noopener noreferrer"
                                className="bg-white rounded-xl p-6 card-shadow hover:-translate-y-2 transition-all duration-300 flex items-start gap-4"
                            >
                                <div className="w-14 h-14 bg-dao-blue/10 rounded-full flex items-center justify-center flex-shrink-0">
                                    <item.icon className="text-dao-blue text-xl" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-lg text-dao-dark mb-1">{item.title}</h3>
                                    <p className="text-gray-600 text-sm">{item.value}</p>
                                </div>
                            </a>
                        ))}
                    </div>
                </div>
            </section>

            {/* Contact Form Section */}
            <section className="section-padding bg-gray-50">
                <div className="container-custom max-w-2xl">
                    <h2 className="text-2xl md:text-3xl font-bold text-dao-dark mb-8 text-center">
                        Send us a message
                    </h2>
                    <form className="bg-white rounded-xl p-8 card-shadow">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            <div>
                                <label className="block text-dao-dark font-medium mb-2">First Name</label>
                                <input
                                    type="text"
                                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:border-dao-blue transition-colors"
                                    placeholder="John"
                                />
                            </div>
                            <div>
                                <label className="block text-dao-dark font-medium mb-2">Last Name</label>
                                <input
                                    type="text"
                                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:border-dao-blue transition-colors"
                                    placeholder="Doe"
                                />
                            </div>
                        </div>

                        <div className="mb-6">
                            <label className="block text-dao-dark font-medium mb-2">Email</label>
                            <input
                                type="email"
                                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:border-dao-blue transition-colors"
                                placeholder="john@example.com"
                            />
                        </div>

                        <div className="mb-6">
                            <label className="block text-dao-dark font-medium mb-2">Phone Number</label>
                            <input
                                type="tel"
                                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:border-dao-blue transition-colors"
                                placeholder="+92 300 1234567"
                            />
                        </div>

                        <div className="mb-6">
                            <label className="block text-dao-dark font-medium mb-2">Subject</label>
                            <input
                                type="text"
                                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:border-dao-blue transition-colors"
                                placeholder="How can we help?"
                            />
                        </div>

                        <div className="mb-6">
                            <label className="block text-dao-dark font-medium mb-2">Message</label>
                            <textarea
                                rows={5}
                                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:border-dao-blue transition-colors resize-none"
                                placeholder="Write your message here..."
                            ></textarea>
                        </div>

                        <button
                            type="submit"
                            className="w-full btn-primary text-lg"
                        >
                            Send Message
                        </button>
                    </form>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 hero-gradient">
                <div className="container-custom px-4 md:px-8 text-center">
                    <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-4">
                        Ready to start investing?
                    </h2>
                    <p className="text-white/80 text-lg mb-8 max-w-2xl mx-auto">
                        Create your free account and begin your real estate investment journey
                    </p>
                    <Link href="http://localhost:3001/register" className="btn-primary inline-block text-lg">
                        Sign Up Now
                    </Link>
                </div>
            </section>
        </Layout>
    )
}
