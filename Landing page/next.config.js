/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    images: {
        domains: ['daoproptech.com', 'placehold.co'],
        unoptimized: true,
    },
}

module.exports = nextConfig
