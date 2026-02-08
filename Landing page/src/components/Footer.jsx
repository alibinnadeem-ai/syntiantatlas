import Link from 'next/link'
import { FaFacebookF, FaTwitter, FaInstagram, FaLinkedinIn, FaYoutube, FaMapMarkerAlt, FaPhone, FaEnvelope } from 'react-icons/fa'

const companyLinks = [
    { name: 'About Us', path: '/about-us' },
    { name: 'Careers', path: '/careers' },
    { name: 'Contact Us', path: '/contact-us' },
]

const supportLinks = [
    { name: 'Terms & Conditions', path: '/terms' },
    { name: 'Privacy Policy', path: '/privacy' },
    { name: 'Cookie Policy', path: '/cookies' },
]

const platformLinks = [
    { name: 'Projects', path: '/projects' },
    { name: 'FAQ', path: '/faq' },
]

const socialLinks = [
    { icon: FaFacebookF, url: 'https://facebook.com', label: 'Facebook' },
    { icon: FaTwitter, url: 'https://twitter.com', label: 'Twitter' },
    { icon: FaInstagram, url: 'https://instagram.com', label: 'Instagram' },
    { icon: FaLinkedinIn, url: 'https://linkedin.com', label: 'LinkedIn' },
    { icon: FaYoutube, url: 'https://youtube.com', label: 'YouTube' },
]

export default function Footer() {
    return (
        <footer className="bg-dao-dark text-white">
            {/* Main Footer */}
            <div className="container-custom px-4 md:px-8 py-16">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
                    {/* Company Info */}
                    <div>
                        <div className="flex items-center gap-2 mb-6">
                            <div className="w-10 h-10 bg-dao-blue rounded-lg flex items-center justify-center">
                                <span className="text-white font-bold text-xl">D</span>
                            </div>
                            <span className="font-bold text-xl">DAO PropTech</span>
                        </div>
                        <p className="text-gray-400 text-sm leading-relaxed mb-6">
                            Pakistan's 1st digital real estate investment platform. Start investing flexibly, wherever you are in the world.
                        </p>
                        <p className="text-gray-500 text-xs">
                            Registered with SECP | P@SHA Certified
                        </p>
                    </div>

                    {/* Company Links */}
                    <div>
                        <h3 className="font-semibold text-lg mb-6">Company</h3>
                        <ul className="space-y-3">
                            {companyLinks.map((link) => (
                                <li key={link.path}>
                                    <Link
                                        href={link.path}
                                        className="text-gray-400 hover:text-dao-lime transition-colors duration-200"
                                    >
                                        {link.name}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Support Links */}
                    <div>
                        <h3 className="font-semibold text-lg mb-6">Support</h3>
                        <ul className="space-y-3">
                            {supportLinks.map((link) => (
                                <li key={link.path}>
                                    <Link
                                        href={link.path}
                                        className="text-gray-400 hover:text-dao-lime transition-colors duration-200"
                                    >
                                        {link.name}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Platform & Contact */}
                    <div>
                        <h3 className="font-semibold text-lg mb-6">Platform</h3>
                        <ul className="space-y-3 mb-8">
                            {platformLinks.map((link) => (
                                <li key={link.path}>
                                    <Link
                                        href={link.path}
                                        className="text-gray-400 hover:text-dao-lime transition-colors duration-200"
                                    >
                                        {link.name}
                                    </Link>
                                </li>
                            ))}
                        </ul>

                        <h3 className="font-semibold text-lg mb-4">Contact</h3>
                        <ul className="space-y-3 text-gray-400 text-sm">
                            <li className="flex items-start gap-3">
                                <FaMapMarkerAlt className="mt-1 text-dao-lime flex-shrink-0" />
                                <span>Akron Plaza, Bahria Town, Rawalpindi, Pakistan</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <FaPhone className="text-dao-lime" />
                                <span>+92 314 326 7767</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <FaEnvelope className="text-dao-lime" />
                                <span>info@daoproptech.com</span>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* Bottom Bar */}
            <div className="border-t border-gray-800">
                <div className="container-custom px-4 md:px-8 py-6">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                        <p className="text-gray-500 text-sm">
                            © {new Date().getFullYear()} DAO PropTech. All rights reserved.
                        </p>

                        {/* Social Links */}
                        <div className="flex items-center gap-4">
                            {socialLinks.map((social) => (
                                <a
                                    key={social.label}
                                    href={social.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center text-gray-400 hover:bg-dao-lime hover:text-dao-dark transition-all duration-300"
                                    aria-label={social.label}
                                >
                                    <social.icon size={16} />
                                </a>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    )
}
