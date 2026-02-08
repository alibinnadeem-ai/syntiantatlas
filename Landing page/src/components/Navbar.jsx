import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { FaBars, FaTimes } from 'react-icons/fa'

const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'About Us', path: '/about-us' },
    { name: 'Projects', path: '/projects' },
    { name: 'Platform', path: '/platform' },
    { name: 'Careers', path: '/careers' },
    { name: 'Contact Us', path: '/contact-us' },
]

export default function Navbar() {
    const [isScrolled, setIsScrolled] = useState(false)
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
    const router = useRouter()

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20)
        }
        window.addEventListener('scroll', handleScroll)
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    return (
        <header
            className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-white shadow-lg py-2' : 'bg-white py-4'
                }`}
        >
            <div className="container-custom flex items-center justify-between px-4 md:px-8">
                {/* Logo */}
                <Link href="/" className="flex items-center">
                    <div className="flex items-center gap-2">
                        <div className="w-10 h-10 bg-dao-blue rounded-lg flex items-center justify-center">
                            <span className="text-white font-bold text-xl">D</span>
                        </div>
                        <span className="text-dao-blue-dark font-bold text-xl hidden sm:block">
                            DAO PropTech
                        </span>
                    </div>
                </Link>

                {/* Desktop Navigation */}
                <nav className="hidden lg:flex items-center gap-8">
                    {navLinks.map((link) => (
                        <Link
                            key={link.path}
                            href={link.path}
                            className={`font-medium transition-colors duration-200 hover:text-dao-blue ${router.pathname === link.path
                                ? 'text-dao-blue'
                                : 'text-dao-dark'
                                }`}
                        >
                            {link.name}
                        </Link>
                    ))}
                </nav>

                {/* Sign Up Button */}
                <div className="hidden lg:block">
                    <Link href="http://localhost:3001/register" className="btn-primary">
                        Sign Up
                    </Link>
                </div>

                {/* Mobile Menu Button */}
                <button
                    className="lg:hidden text-dao-dark text-2xl"
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                >
                    {isMobileMenuOpen ? <FaTimes /> : <FaBars />}
                </button>
            </div>

            {/* Mobile Menu */}
            {isMobileMenuOpen && (
                <div className="lg:hidden bg-white border-t shadow-lg">
                    <nav className="flex flex-col py-4">
                        {navLinks.map((link) => (
                            <Link
                                key={link.path}
                                href={link.path}
                                className={`px-8 py-3 font-medium transition-colors duration-200 hover:bg-gray-50 ${router.pathname === link.path
                                    ? 'text-dao-blue bg-blue-50'
                                    : 'text-dao-dark'
                                    }`}
                                onClick={() => setIsMobileMenuOpen(false)}
                            >
                                {link.name}
                            </Link>
                        ))}
                        <div className="px-8 py-4">
                            <Link href="http://localhost:3001/register" className="btn-primary block text-center">
                                Sign Up
                            </Link>
                        </div>
                    </nav>
                </div>
            )}
        </header>
    )
}
