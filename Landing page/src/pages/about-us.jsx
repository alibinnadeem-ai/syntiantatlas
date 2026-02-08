import Head from 'next/head'
import Link from 'next/link'
import Layout from '@/components/Layout'
import HeroSection from '@/components/HeroSection'
import { FaEye, FaBullseye, FaLinkedinIn, FaShieldAlt, FaLightbulb, FaHandshake, FaUsers, FaCubes, FaHeart } from 'react-icons/fa'

// Core Values
const coreValues = [
    { icon: FaShieldAlt, title: 'Transparency', description: 'Open and honest communication in all our dealings' },
    { icon: FaCubes, title: 'Security', description: 'Protecting your investments with cutting-edge technology' },
    { icon: FaLightbulb, title: 'Innovation', description: 'Continuously evolving to serve you better' },
    { icon: FaUsers, title: 'Inclusivity', description: 'Making real estate accessible to everyone' },
    { icon: FaHandshake, title: 'Integrity', description: 'Upholding the highest ethical standards' },
    { icon: FaHeart, title: 'Customer First', description: 'Your success is our priority' },
]

// Team Members
const teamMembers = [
    { name: 'Muneeb Khan', role: 'Founder & CEO', image: 'https://placehold.co/200x200/0b7ef1/ffffff?text=MK' },
    { name: 'Ali Hassan', role: 'Co-Founder & CTO', image: 'https://placehold.co/200x200/15459b/ffffff?text=AH' },
    { name: 'Sarah Ahmed', role: 'Head of Growth', image: 'https://placehold.co/200x200/0b7ef1/ffffff?text=SA' },
    { name: 'Omar Farooq', role: 'Head of Operations', image: 'https://placehold.co/200x200/15459b/ffffff?text=OF' },
    { name: 'Ayesha Khan', role: 'Head of Marketing', image: 'https://placehold.co/200x200/0b7ef1/ffffff?text=AK' },
    { name: 'Hassan Ali', role: 'Lead Developer', image: 'https://placehold.co/200x200/15459b/ffffff?text=HA' },
    { name: 'Fatima Malik', role: 'UX Designer', image: 'https://placehold.co/200x200/0b7ef1/ffffff?text=FM' },
    { name: 'Zain Abbas', role: 'Finance Manager', image: 'https://placehold.co/200x200/15459b/ffffff?text=ZA' },
]

export default function AboutUs() {
    return (
        <Layout>
            <Head>
                <title>About Us - DAO PropTech</title>
                <meta name="description" content="Learn about DAO PropTech's mission to make real estate investment accessible to everyone." />
            </Head>

            {/* Hero Section */}
            <HeroSection
                title="About DAO PropTech"
                subtitle="In 2020, DAO PropTech was founded with the simple mission of making everyone a part of a fair and inclusive real estate ecosystem."
            />

            {/* Our Story Section */}
            <section className="section-padding">
                <div className="container-custom max-w-4xl">
                    <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-dao-dark mb-8">
                        Our Story
                    </h2>
                    <div className="space-y-6 text-gray-600 leading-relaxed">
                        <p>
                            The real estate market in Pakistan has long been plagued by issues of transparency,
                            accessibility, and trust. Traditional real estate investment requires significant
                            capital, extensive documentation, and often involves opaque pricing mechanisms that
                            favor insiders.
                        </p>
                        <p>
                            DAO PropTech was born out of a vision to democratize real estate investment. By
                            leveraging blockchain technology and innovative financial models, we've created a
                            platform where anyone can own a piece of premium real estate, regardless of their
                            financial background. Our technology ensures complete transparency in pricing,
                            ownership, and transactions.
                        </p>
                    </div>
                </div>
            </section>

            {/* Vision & Mission Section */}
            <section className="section-padding bg-gray-50">
                <div className="container-custom">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Vision */}
                        <div className="bg-white rounded-xl p-8 card-shadow">
                            <div className="w-16 h-16 bg-dao-blue/10 rounded-lg flex items-center justify-center mb-6">
                                <FaEye className="text-dao-blue text-3xl" />
                            </div>
                            <h3 className="text-2xl font-bold text-dao-dark mb-4">Our Vision</h3>
                            <p className="text-gray-600 leading-relaxed">
                                To create a transparent and inclusive real estate ecosystem where everyone has
                                the opportunity to build wealth through property ownership, powered by technology
                                and driven by trust.
                            </p>
                        </div>

                        {/* Mission */}
                        <div className="bg-white rounded-xl p-8 card-shadow">
                            <div className="w-16 h-16 bg-dao-lime/20 rounded-lg flex items-center justify-center mb-6">
                                <FaBullseye className="text-dao-blue text-3xl" />
                            </div>
                            <h3 className="text-2xl font-bold text-dao-dark mb-4">Our Mission</h3>
                            <p className="text-gray-600 leading-relaxed">
                                To provide data-driven, secure, and accessible real estate investment opportunities
                                that empower individuals to achieve financial freedom through fractional property
                                ownership.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Core Values Section */}
            <section className="section-padding">
                <div className="container-custom">
                    <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-dao-dark mb-12 text-center">
                        Our Core Values
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {coreValues.map((value, index) => (
                            <div
                                key={index}
                                className="bg-white rounded-xl p-6 card-shadow border border-gray-100 hover:-translate-y-2 transition-all duration-300"
                            >
                                <div className="w-12 h-12 bg-dao-blue/10 rounded-lg flex items-center justify-center mb-4">
                                    <value.icon className="text-dao-blue text-xl" />
                                </div>
                                <h3 className="font-semibold text-lg text-dao-dark mb-2">{value.title}</h3>
                                <p className="text-gray-600 text-sm">{value.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Team Section */}
            <section className="section-padding bg-gray-50">
                <div className="container-custom">
                    <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-dao-dark mb-12 text-center">
                        Meet the Team
                    </h2>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {teamMembers.map((member, index) => (
                            <div
                                key={index}
                                className="bg-white rounded-xl p-6 text-center card-shadow hover:-translate-y-2 transition-all duration-300"
                            >
                                <img
                                    src={member.image}
                                    alt={member.name}
                                    className="w-24 h-24 rounded-full mx-auto mb-4 object-cover"
                                />
                                <h3 className="font-semibold text-dao-dark">{member.name}</h3>
                                <p className="text-gray-500 text-sm mb-3">{member.role}</p>
                                <a
                                    href="https://linkedin.com"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center justify-center w-8 h-8 bg-dao-blue/10 rounded-full text-dao-blue hover:bg-dao-blue hover:text-white transition-all duration-300"
                                >
                                    <FaLinkedinIn size={14} />
                                </a>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 hero-gradient">
                <div className="container-custom px-4 md:px-8 text-center">
                    <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-4">
                        Get on the property ladder today
                    </h2>
                    <p className="text-white/80 text-lg mb-8 max-w-2xl mx-auto">
                        Contact us to begin your journey
                    </p>
                    <Link href="/contact-us" className="btn-primary inline-block text-lg">
                        Contact Us
                    </Link>
                </div>
            </section>
        </Layout>
    )
}
