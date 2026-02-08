import Head from 'next/head'
import Link from 'next/link'
import Layout from '@/components/Layout'
import HeroSection from '@/components/HeroSection'
import { FaPlay, FaArrowRight } from 'react-icons/fa'

// Culture Videos
const cultureVideos = [
    { title: 'Seth culture to a DAO', thumbnail: 'https://placehold.co/400x225/0b7ef1/ffffff?text=Seth+Culture' },
    { title: 'A Conversation with Muneeb Khan', thumbnail: 'https://placehold.co/400x225/15459b/ffffff?text=Muneeb+Khan' },
    { title: 'Women at DAO', thumbnail: 'https://placehold.co/400x225/0b7ef1/ffffff?text=Women+at+DAO' },
    { title: 'Our Office Life', thumbnail: 'https://placehold.co/400x225/15459b/ffffff?text=Office+Life' },
]

// Blog Posts
const blogPosts = [
    {
        title: "'Seth' culture to a DAO: how to improve workplace culture?",
        image: 'https://placehold.co/400x250/0b7ef1/ffffff?text=Workplace+Culture',
        excerpt: 'Learn how we transformed traditional corporate culture into a modern, inclusive workplace.'
    },
    {
        title: 'Why it is important to align personal goals with company goals?',
        image: 'https://placehold.co/400x250/15459b/ffffff?text=Goal+Alignment',
        excerpt: 'Discover the power of aligning your personal aspirations with organizational objectives.'
    },
    {
        title: 'How to Nail Your First Interview',
        image: 'https://placehold.co/400x250/0b7ef1/ffffff?text=Interview+Tips',
        excerpt: 'Tips and tricks to help you succeed in your first job interview.'
    },
]

export default function Careers() {
    return (
        <Layout>
            <Head>
                <title>Careers - DAO PropTech</title>
                <meta name="description" content="Join our team and be part of Pakistan's real estate revolution." />
            </Head>

            {/* Hero Section */}
            <section className="hero-gradient min-h-[500px] pt-28 pb-16 relative overflow-hidden">
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-10 right-10 w-40 h-40 border border-white rotate-45"></div>
                    <div className="absolute top-32 right-32 w-20 h-20 border border-white rotate-45"></div>
                </div>

                <div className="container-custom px-4 md:px-8 relative z-10 text-center">
                    <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6">
                        Careers
                    </h1>
                    <p className="text-lg md:text-xl text-white/90 mb-8 max-w-2xl mx-auto">
                        Join our team and help revolutionize real estate investment in Pakistan
                    </p>
                    <a
                        href="https://careers.daoproptech.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-blue inline-block text-lg"
                    >
                        View Open Positions
                    </a>
                </div>
            </section>

            {/* Why DAO PropTech Section */}
            <section className="section-padding">
                <div className="container-custom max-w-4xl text-center">
                    <div className="inline-block mb-6">
                        <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-dao-dark">
                            Why DAO PropTech
                        </h2>
                        <div className="w-20 h-1 bg-dao-lime mx-auto mt-3"></div>
                    </div>
                    <p className="text-gray-600 leading-relaxed">
                        At DAO PropTech, we're on a mission to make real estate accessible to everyone.
                        We're a fast-growing PropTech startup that values innovation, collaboration, and
                        continuous learning. Join us to be part of something transformative.
                    </p>
                </div>
            </section>

            {/* Benefits Section */}
            <section className="section-padding bg-gray-50">
                <div className="container-custom max-w-4xl text-center">
                    <div className="inline-block mb-6">
                        <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-dao-dark">
                            Benefits of working with us?
                        </h2>
                        <div className="w-20 h-1 bg-dao-lime mx-auto mt-3"></div>
                    </div>
                    <p className="text-gray-600 leading-relaxed">
                        We provide our team with the tools and resources they need to grow professionally.
                        From competitive salaries to health insurance, we've got you covered. Plus, enjoy
                        the unique benefit of wealth creation through subsidized real estate investments!
                    </p>
                </div>
            </section>

            {/* Culture & Life Section */}
            <section className="section-padding">
                <div className="container-custom">
                    <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-dao-dark mb-12 text-center">
                        Culture & Life at DAO PropTech
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {cultureVideos.map((video, index) => (
                            <div
                                key={index}
                                className="relative group cursor-pointer rounded-xl overflow-hidden card-shadow"
                            >
                                <img
                                    src={video.thumbnail}
                                    alt={video.title}
                                    className="w-full h-56 object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center group-hover:bg-black/50 transition-all duration-300">
                                    <div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                        <FaPlay className="text-dao-blue text-xl ml-1" />
                                    </div>
                                </div>
                                <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                                    <h3 className="text-white font-semibold">{video.title}</h3>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* People and Support Blog Section */}
            <section className="section-padding bg-gray-50">
                <div className="container-custom">
                    <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-dao-dark mb-12 text-center">
                        People and Support Blog
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {blogPosts.map((post, index) => (
                            <div
                                key={index}
                                className="bg-white rounded-xl overflow-hidden card-shadow hover:-translate-y-2 transition-all duration-300"
                            >
                                <img
                                    src={post.image}
                                    alt={post.title}
                                    className="w-full h-48 object-cover"
                                />
                                <div className="p-6">
                                    <h3 className="font-semibold text-dao-dark mb-3 line-clamp-2">{post.title}</h3>
                                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">{post.excerpt}</p>
                                    <Link
                                        href="/blog"
                                        className="inline-flex items-center gap-2 text-dao-lime font-semibold hover:gap-3 transition-all duration-300"
                                    >
                                        Read More <FaArrowRight />
                                    </Link>
                                </div>
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
                    <p className="text-white/80 text-lg mb-8">
                        Begin your journey today
                    </p>
                    <Link href="/contact-us" className="btn-primary inline-block text-lg">
                        Contact Us
                    </Link>
                </div>
            </section>
        </Layout>
    )
}
