import Navbar from './Navbar'
import Footer from './Footer'
import FloatingButtons from './FloatingButtons'

export default function Layout({ children }) {
    return (
        <div className="min-h-screen flex flex-col">
            <Navbar />
            <main className="flex-grow">
                {children}
            </main>
            <Footer />
            <FloatingButtons />
        </div>
    )
}
