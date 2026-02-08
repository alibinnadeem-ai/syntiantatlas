import Head from 'next/head'
import Link from 'next/link'
import Layout from '@/components/Layout'
import { FaShieldAlt, FaRocket, FaUsers, FaLock, FaCheck, FaChartLine, FaBuilding, FaWallet } from 'react-icons/fa'

// Features
const features = [
    {
        icon: FaShieldAlt,
        title: 'Transparent',
        description: 'Complete visibility into all transactions, pricing, and ownership records on our platform.'
    },
    {
        icon: FaRocket,
        title: 'Futuristic',
        description: 'Leveraging blockchain and cutting-edge technology to revolutionize real estate investment.'
    },
    {
        icon: FaUsers,
        title: 'Inclusive',
        description: 'Making real estate investment accessible to everyone, regardless of financial background.'
    },
    {
        icon: FaLock,
        title: 'Secure',
        description: 'Bank-grade security measures to protect your investments and personal information.'
    },
]

// Platform Benefits
const benefits = [
    'Value-based pricing methodology',
    'Multiple development rounds',
    'Milestone-based payments',
    'Developer accountability',
    'Transparent construction updates',
    'Real-time portfolio tracking',
]

// Platform Stats
const platformStats = [
    { icon: FaUsers, value: '78,000+', label: 'Active Investors' },
    { icon: FaBuilding, value: '15+', label: 'Active Projects' },
    { icon: FaWallet, value: 'PKR 2B+', label: 'Total Raised' },
    { icon: FaChartLine, value: '25%', label: 'Avg. Returns' },
]

export default function Platform() {
    return (
        <Layout>
            <Head>
                <title>Platform - DAO PropTech</title>
                <meta name="description" content="Discover how our platform makes real estate investment easy and accessible." />
            </Head>

            {/* Hero Section */}
            <section className="hero-gradient min-h-[600px] pt-28 pb-16 relative overflow-hidden">
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-10 right-10 w-40 h-40 border border-white rotate-45"></div>
                    <div className="absolute top-32 right-32 w-20 h-20 border border-white rotate-45"></div>
                </div>

                <div className="container-custom px-4 md:px-8 relative z-10">
                    <div className="flex flex-col lg:flex-row items-center gap-12">
                        <div className="lg:w-1/2">
                            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6 leading-tight">
                                Investing in real estate has never been easier
                            </h1>
                            <p className="text-lg md:text-xl text-white/90 mb-8 leading-relaxed">
                                Our platform empowers you to earn financial freedom through real estate
                            </p>
                            <Link href="http://localhost:3001/register" className="btn-primary inline-block text-lg">
                                Register Now
                            </Link>
                        </div>

                        <div className="lg:w-1/2">
                            <div className="flex gap-4 justify-center">
                                <img
                                    src="https://placehold.co/400x500/ffffff/0b7ef1?text=Tablet+View"
                                    alt="Tablet Dashboard"
                                    className="w-1/2 rounded-xl shadow-2xl"
                                />
                                <img
                                    src="https://placehold.co/200x400/ffffff/0b7ef1?text=Mobile"
                                    alt="Mobile App"
                                    className="w-1/3 rounded-xl shadow-2xl self-end"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Grid */}
            <section className="section-padding bg-gray-50">
                <div className="container-custom">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {features.map((feature, index) => (
                            <div
                                key={index}
                                className="bg-white rounded-xl p-6 card-shadow hover:-translate-y-2 transition-all duration-300 text-center"
                            >
                                <div className="w-16 h-16 bg-dao-blue/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <feature.icon className="text-dao-blue text-2xl" />
                                </div>
                                <h3 className="font-semibold text-xl text-dao-dark mb-3">{feature.title}</h3>
                                <p className="text-gray-600 text-sm">{feature.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Unique Methodology Section */}
            <section className="section-padding">
                <div className="container-custom">
                    <div className="flex flex-col lg:flex-row items-center gap-12">
                        <div className="lg:w-1/2">
                            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-dao-dark mb-6 leading-tight">
                                We have a unique cost-based pricing and construction rounds methodology
                            </h2>
                            <p className="text-gray-600 mb-8 leading-relaxed">
                                Our innovative approach divides construction into multiple development rounds,
                                each with specific milestones. This ensures developers are held accountable
                                while providing investors with transparency at every stage.
                            </p>
                            <ul className="space-y-3">
                                {benefits.map((benefit, index) => (
                                    <li key={index} className="flex items-center gap-3">
                                        <span className="w-5 h-5 bg-dao-lime rounded-full flex items-center justify-center flex-shrink-0">
                                            <FaCheck className="text-dao-dark text-xs" />
                                        </span>
                                        <span className="text-gray-700">{benefit}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="lg:w-1/2">
                            <div className="bg-gray-100 rounded-2xl p-6">
                                <img
                                    src="https://placehold.co/500x400/0b7ef1/ffffff?text=Milestone+Tracking"
                                    alt="Milestone Tracking"
                                    className="w-full h-auto rounded-xl shadow-lg"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Institutionally Qualified Section */}
            <section className="section-padding bg-gray-50">
                <div className="container-custom">
                    <div className="flex flex-col lg:flex-row-reverse items-center gap-12">
                        <div className="lg:w-1/2">
                            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-dao-dark mb-6 leading-tight">
                                Our platform gives you access to institutionally qualified real estate investment opportunities
                            </h2>
                            <p className="text-gray-600 mb-8 leading-relaxed">
                                Every project on our platform is handpicked and data-backed to ensure they are
                                safe, viable, and profitable. We conduct thorough due diligence so you can
                                invest with confidence.
                            </p>

                            {/* Stats Grid */}
                            <div className="grid grid-cols-2 gap-4">
                                {platformStats.map((stat, index) => (
                                    <div key={index} className="bg-white rounded-xl p-4 card-shadow text-center">
                                        <stat.icon className="text-dao-blue text-2xl mx-auto mb-2" />
                                        <div className="text-2xl font-bold text-dao-dark">{stat.value}</div>
                                        <div className="text-gray-500 text-sm">{stat.label}</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="lg:w-1/2">
                            <div className="bg-gray-100 rounded-2xl p-6">
                                <img
                                    src="https://placehold.co/500x400/15459b/ffffff?text=Investment+Dashboard"
                                    alt="Investment Dashboard"
                                    className="w-full h-auto rounded-xl shadow-lg"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Final CTA Section */}
            <section className="py-20 hero-gradient">
                <div className="container-custom px-4 md:px-8 text-center">
                    <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-4">
                        Invest Smartly
                    </h2>
                    <p className="text-white/80 text-lg mb-8 max-w-2xl mx-auto">
                        Sign up today and experience the DAO PropTech's platform; your real estate wealth partner
                    </p>
                    <Link href="http://localhost:3001/register" className="btn-primary inline-block text-lg px-12">
                        Create a Free Account
                    </Link>
                </div>
            </section>
        </Layout>
    )
}
