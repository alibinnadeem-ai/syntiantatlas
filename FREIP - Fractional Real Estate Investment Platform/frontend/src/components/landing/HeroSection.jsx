import Link from 'next/link'

export default function HeroSection({
    title,
    subtitle,
    buttonText,
    buttonLink = '/register',
    showImage = false,
    imageSrc = null,
    centered = true
}) {
    return (
        <section className="hero-gradient min-h-[500px] pt-28 pb-16 relative overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10">
                <div className="absolute top-10 right-10 w-40 h-40 border border-white rotate-45"></div>
                <div className="absolute top-32 right-32 w-20 h-20 border border-white rotate-45"></div>
                <div className="absolute bottom-20 right-20 w-32 h-32 border border-white rotate-45"></div>
            </div>

            <div className="container-custom px-4 md:px-8 relative z-10">
                <div className={`flex flex-col ${showImage ? 'lg:flex-row items-center' : ''} gap-10`}>
                    {/* Content */}
                    <div className={`${showImage ? 'lg:w-1/2' : 'max-w-4xl mx-auto'} ${centered && !showImage ? 'text-center' : ''}`}>
                        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6 leading-tight">
                            {title}
                        </h1>
                        {subtitle && (
                            <p className="text-lg md:text-xl text-white/90 mb-8 leading-relaxed">
                                {subtitle}
                            </p>
                        )}
                        {buttonText && (
                            <Link href={buttonLink} className="btn-primary inline-block">
                                {buttonText}
                            </Link>
                        )}
                    </div>

                    {/* Image */}
                    {showImage && imageSrc && (
                        <div className="lg:w-1/2">
                            <img
                                src={imageSrc}
                                alt="Hero Visual"
                                className="w-full h-auto rounded-lg shadow-2xl"
                            />
                        </div>
                    )}
                </div>
            </div>
        </section>
    )
}
