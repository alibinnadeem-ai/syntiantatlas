import Head from 'next/head'
import Link from 'next/link'
import Layout from '@/components/Layout'
import HeroSection from '@/components/HeroSection'
import { FaMapMarkerAlt, FaRuler, FaCalendarAlt, FaArrowRight } from 'react-icons/fa'

// Projects Data
const projects = [
    {
        id: 1,
        name: 'Property Share',
        type: 'Real Estate Ownership',
        location: 'Multiple Locations',
        image: 'https://placehold.co/600x400/0b7ef1/ffffff?text=Property+Share',
        area: '500,000 sq.ft',
        round: '3 of 5',
        completion: '2025',
        description: 'Invest in premium real estate across Pakistan with fractional ownership.',
        status: 'active'
    },
    {
        id: 2,
        name: 'Serene Heights Hotel & Resort',
        type: 'Hospitality',
        location: 'Murree',
        image: 'https://placehold.co/600x400/15459b/ffffff?text=Serene+Heights',
        area: '150,000 sq.ft',
        round: '2 of 4',
        completion: '2026',
        description: 'Luxury hotel and resort in the beautiful hills of Murree.',
        status: 'active'
    },
    {
        id: 3,
        name: 'Amna Homes Bahawalpur',
        type: 'Constructed Houses',
        location: 'Bahawalpur',
        image: 'https://placehold.co/600x400/0b7ef1/ffffff?text=Amna+Homes',
        area: '200,000 sq.ft',
        round: '4 of 4',
        completion: '2024',
        description: 'Modern housing society with all amenities in Bahawalpur.',
        status: 'active'
    },
    {
        id: 4,
        name: 'Urban Dwellings',
        type: 'Apartment Complex',
        location: 'Islamabad',
        image: 'https://placehold.co/600x400/15459b/ffffff?text=Urban+Dwellings',
        area: '300,000 sq.ft',
        round: '2 of 5',
        completion: '2026',
        description: 'Premium apartments in the heart of Islamabad.',
        status: 'active'
    },
    {
        id: 5,
        name: 'Elements Residencia',
        type: 'Mixed-use building',
        location: 'Karachi',
        image: 'https://placehold.co/600x400/0b7ef1/ffffff?text=Elements+Residencia',
        area: '450,000 sq.ft',
        round: '3 of 6',
        completion: '2027',
        description: 'Mixed-use development combining residential and commercial spaces.',
        status: 'active'
    },
    {
        id: 6,
        name: 'Broad Peak Realty',
        type: 'Co-working space',
        location: 'Lahore',
        image: 'https://placehold.co/600x400/15459b/ffffff?text=Broad+Peak+Realty',
        area: '75,000 sq.ft',
        round: '1 of 3',
        completion: '2025',
        description: 'Modern co-working spaces for the next generation of entrepreneurs.',
        status: 'active'
    },
    {
        id: 7,
        name: 'QUBE | Lahore',
        type: 'Smart Studios',
        location: 'Lahore',
        image: 'https://placehold.co/600x400/0b7ef1/ffffff?text=QUBE+Lahore',
        area: '120,000 sq.ft',
        round: '2 of 3',
        completion: '2025',
        description: 'Smart studio apartments with cutting-edge technology.',
        status: 'active'
    },
    {
        id: 8,
        name: 'Akron',
        type: 'Office space',
        location: 'Rawalpindi',
        image: 'https://placehold.co/600x400/15459b/ffffff?text=Akron',
        area: '250,000 sq.ft',
        round: '4 of 5',
        completion: '2024',
        description: 'Premium office spaces for businesses of all sizes.',
        status: 'active'
    },
    {
        id: 9,
        name: 'Qubed, Nathiagali',
        type: 'Flagship Project',
        location: 'Nathiagali',
        image: 'https://placehold.co/600x400/0b7ef1/ffffff?text=Qubed+Nathiagali',
        area: '80,000 sq.ft',
        round: '5 of 5',
        completion: '2023',
        description: 'Our flagship project in the scenic Nathiagali mountains.',
        status: 'sold'
    },
]

export default function Projects() {
    return (
        <Layout>
            <Head>
                <title>Projects - DAO PropTech</title>
                <meta name="description" content="Explore our verified real estate projects across Pakistan." />
            </Head>

            {/* Hero Section */}
            <HeroSection
                title="Projects on our Platform"
                subtitle="Giving you the trust you need to own your share of premium real estate."
            />

            {/* Projects Grid */}
            <section className="section-padding">
                <div className="container-custom">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {projects.map((project) => (
                            <div
                                key={project.id}
                                className="bg-white rounded-xl overflow-hidden card-shadow hover:-translate-y-2 transition-all duration-300"
                            >
                                {/* Project Image */}
                                <div className="relative">
                                    <img
                                        src={project.image}
                                        alt={project.name}
                                        className="w-full h-64 object-cover"
                                    />
                                    {project.status === 'sold' && (
                                        <div className="absolute top-4 left-4 bg-red-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                                            Sold Out
                                        </div>
                                    )}
                                </div>

                                {/* Project Content */}
                                <div className="p-6">
                                    <div className="mb-4">
                                        <h3 className="text-xl font-bold text-dao-dark mb-1">{project.name}</h3>
                                        <p className="text-gray-500 text-sm">{project.type}</p>
                                    </div>

                                    <div className="flex items-center gap-2 text-gray-600 text-sm mb-4">
                                        <FaMapMarkerAlt className="text-dao-blue" />
                                        <span>{project.location}</span>
                                    </div>

                                    <p className="text-gray-600 mb-6 line-clamp-2">{project.description}</p>

                                    {/* Metrics */}
                                    <div className="grid grid-cols-3 gap-4 py-4 border-t border-b border-gray-100 mb-6">
                                        <div className="text-center">
                                            <FaRuler className="text-dao-blue mx-auto mb-1" />
                                            <div className="text-xs text-gray-500">Total Area</div>
                                            <div className="text-sm font-semibold text-dao-dark">{project.area}</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="w-4 h-4 border-2 border-dao-blue rounded mx-auto mb-1"></div>
                                            <div className="text-xs text-gray-500">Dev. Round</div>
                                            <div className="text-sm font-semibold text-dao-dark">{project.round}</div>
                                        </div>
                                        <div className="text-center">
                                            <FaCalendarAlt className="text-dao-blue mx-auto mb-1" />
                                            <div className="text-xs text-gray-500">Completion</div>
                                            <div className="text-sm font-semibold text-dao-dark">{project.completion}</div>
                                        </div>
                                    </div>

                                    {/* CTA */}
                                    <Link
                                        href={`/projects/${project.id}`}
                                        className={`w-full flex items-center justify-center gap-2 py-3 rounded-full font-semibold transition-all duration-300 ${project.status === 'sold'
                                            ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                            : 'bg-dao-lime text-dao-dark hover:shadow-lg'
                                            }`}
                                    >
                                        View Project <FaArrowRight />
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
                        Ready to invest?
                    </h2>
                    <p className="text-white/80 text-lg mb-8 max-w-2xl mx-auto">
                        Create a free account and start your real estate investment journey today
                    </p>
                    <Link href="http://localhost:3001/register" className="btn-primary inline-block text-lg">
                        Sign Up Now
                    </Link>
                </div>
            </section>
        </Layout>
    )
}
