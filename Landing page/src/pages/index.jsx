import Head from 'next/head'
import Link from 'next/link'
import Layout from '@/components/Layout'
import { FaCheck, FaShieldAlt, FaChartLine, FaUsers, FaPlay, FaStar, FaAward } from 'react-icons/fa'
import { motion } from 'framer-motion'

// Trust Card Data
const trustCards = [
    {
        icon: FaShieldAlt,
        title: 'Verified Projects',
        description: 'All projects are thoroughly vetted and verified for authenticity'
    },
    {
        icon: FaChartLine,
        title: 'Backed by Blockchain',
        description: 'Secure transactions powered by blockchain technology'
    },
    {
        icon: FaUsers,
        title: 'Value-based Pricing',
        description: 'Fair and transparent pricing based on real market value'
    },
    {
        icon: FaStar,
        title: 'Personalized Plans',
        description: 'Investment plans tailored to your financial goals'
    },
]

// Product Features
const productFeatures = [
    'Direct ownership of real estate assets',
    'Rental income from day one',
    'Capital appreciation over time',
    'Complete transparency in transactions',
]

// Stats Data
const statsData = [
    { number: '78,206+', label: 'Platform Users' },
    { number: '1,049,253+', label: 'Sq. ft. sold' },
    { number: '4,936+', label: 'Transactions' },
]

// Testimonials
const testimonials = [
    {
        name: 'Ahmed Khan',
        role: 'Software Engineer',
        text: 'DAO PropTech made real estate investment accessible for me. The platform is intuitive and the returns have been excellent.',
    },
    {
        name: 'Sara Ali',
        role: 'Business Owner',
        text: 'I was skeptical at first, but the transparency and security of the platform won me over. Highly recommended!',
    },
    {
        name: 'Usman Malik',
        role: 'Financial Analyst',
        text: 'The best real estate investment platform in Pakistan. Professional team and excellent customer support.',
    },
]

// Media Logos
const mediaLogos = [
    'Tribune', 'Business Recorder', 'Yahoo Finance', 'Tech in Asia', 'Express Tribune'
]

export default function Home() {
    return (
        <Layout>
            <Head>
                <title>DAO PropTech - Pakistan's 1st Digital Real Estate Investment Platform</title>
                <meta name="description" content="Start investing flexibly in real estate, wherever you are in the world. Pakistan's first digital real estate investment platform." />
            </Head>

            {/* Hero Section */}
            <section className="hero-gradient min-h-[600px] pt-28 pb-16 relative overflow-hidden">
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-10 right-10 w-40 h-40 border border-white rotate-45"></div>
                    <div className="absolute top-32 right-32 w-20 h-20 border border-white rotate-45"></div>
                    <div className="absolute bottom-20 right-20 w-32 h-32 border border-white rotate-45"></div>
                </div>

                <div className="container-custom px-4 md:px-8 relative z-10">
                    <div className="flex flex-col lg:flex-row items-center gap-10">
                        {/* Content */}
                        <div className="lg:w-1/2">
                            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6 leading-tight">
                                We're Pakistan's 1st digital real estate investment platform
                            </h1>
                            <p className="text-lg md:text-xl text-white/90 mb-8 leading-relaxed">
                                Start investing flexibly, wherever you are in the world
                            </p>
                            <Link href="http://localhost:3001/register" className="btn-primary inline-block text-lg">
                                Begin Now
                            </Link>
                        </div>

                        {/* Hero Image */}
                        <div className="lg:w-1/2">
                            <div className="relative">
                                <div className="bg-white/10 rounded-2xl p-4 backdrop-blur-sm">
                                    <img
                                        src="https://placehold.co/600x400/0b7ef1/ffffff?text=Platform+Dashboard"
                                        alt="DAO PropTech Dashboard"
                                        className="w-full h-auto rounded-xl shadow-2xl"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Trust Cards Section */}
            <section className="section-padding bg-gray-50">
                <div className="container-custom">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {trustCards.map((card, index) => (
                            <div
                                key={index}
                                className="bg-white rounded-xl p-6 card-shadow hover:-translate-y-2 transition-all duration-300"
                            >
                                <div className="w-14 h-14 bg-dao-blue/10 rounded-lg flex items-center justify-center mb-4">
                                    <card.icon className="text-dao-blue text-2xl" />
                                </div>
                                <h3 className="font-semibold text-lg text-dao-dark mb-2">{card.title}</h3>
                                <p className="text-gray-600 text-sm">{card.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Product Showcase Section */}
            <section className="section-padding">
                <div className="container-custom">
                    <div className="flex flex-col lg:flex-row items-center gap-12">
                        {/* Content */}
                        <div className="lg:w-1/2">
                            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-dao-dark mb-8 leading-tight">
                                The innovative way for everyone to profit from real estate investments
                            </h2>
                            <ul className="space-y-4">
                                {productFeatures.map((feature, index) => (
                                    <li key={index} className="flex items-start gap-4">
                                        <span className="w-6 h-6 bg-dao-lime rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                            <FaCheck className="text-dao-dark text-sm" />
                                        </span>
                                        <span className="text-gray-700 text-lg">{feature}</span>
                                    </li>
                                ))}
                            </ul>
                            <Link href="/platform" className="btn-blue inline-block mt-8">
                                Learn More
                            </Link>
                        </div>

                        {/* Phone Mockup */}
                        <div className="lg:w-1/2">
                            <div className="relative max-w-sm mx-auto">
                                <img
                                    src="https://placehold.co/300x600/0b7ef1/ffffff?text=Mobile+App"
                                    alt="DAO PropTech Mobile App"
                                    className="w-full h-auto rounded-3xl shadow-2xl"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Impact Stats Section */}
            <section className="py-16 hero-gradient">
                <div className="container-custom px-4 md:px-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
                        {statsData.map((stat, index) => (
                            <div key={index} className="text-white">
                                <div className="text-4xl md:text-5xl font-bold mb-2">{stat.number}</div>
                                <div className="text-white/80 text-lg">{stat.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Featured On Section */}
            <section className="section-padding bg-gray-50">
                <div className="container-custom text-center">
                    <h2 className="text-xl text-gray-500 mb-8">As Featured On</h2>
                    <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16">
                        {mediaLogos.map((logo, index) => (
                            <div
                                key={index}
                                className="text-gray-400 font-semibold text-lg md:text-xl hover:text-dao-blue transition-colors duration-300"
                            >
                                {logo}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Testimonials Section */}
            <section className="section-padding">
                <div className="container-custom">
                    <div className="text-center mb-12">
                        <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-dao-dark mb-4">
                            Testimonials
                        </h2>
                        <p className="text-gray-600 max-w-2xl mx-auto">
                            Hear from our satisfied investors about their experience with DAO PropTech
                        </p>
                        <a
                            href="https://youtube.com"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-dao-blue hover:text-dao-blue-dark mt-4 font-medium"
                        >
                            <FaPlay /> Watch Investor Stories
                        </a>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {testimonials.map((testimonial, index) => (
                            <div
                                key={index}
                                className="bg-white rounded-xl p-6 card-shadow border border-gray-100"
                            >
                                <div className="flex items-center gap-1 text-dao-lime mb-4">
                                    {[...Array(5)].map((_, i) => (
                                        <FaStar key={i} />
                                    ))}
                                </div>
                                <p className="text-gray-600 mb-6 italic">"{testimonial.text}"</p>
                                <div>
                                    <div className="font-semibold text-dao-dark">{testimonial.name}</div>
                                    <div className="text-gray-500 text-sm">{testimonial.role}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Awards Section */}
            <section className="section-padding bg-gray-50">
                <div className="container-custom text-center">
                    <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-dao-dark mb-12">
                        Multiple award-winning platform
                    </h2>
                    <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16">
                        {[1, 2, 3].map((_, index) => (
                            <div
                                key={index}
                                className="w-32 h-32 bg-white rounded-full flex items-center justify-center card-shadow"
                            >
                                <FaAward className="text-5xl text-dao-blue" />
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
                        Contact us to begin your journey towards financial freedom through real estate
                    </p>
                    <Link href="/contact-us" className="btn-primary inline-block text-lg">
                        Contact Us
                    </Link>
                </div>
            </section>
        </Layout>
    )
}
