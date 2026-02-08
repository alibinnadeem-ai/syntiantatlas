# DAO PropTech Website Clone

An exact clone of [daoproptech.com](https://daoproptech.com) built with Next.js 14 and Tailwind CSS.

## Pages Included

- **Home** (`/`) - Hero, trust cards, product showcase, stats, testimonials, awards
- **About Us** (`/about-us`) - Story, vision, mission, core values, team section
- **Projects** (`/projects`) - Project cards grid with 9 projects
- **Platform** (`/platform`) - Features, methodology, investment opportunities
- **Careers** (`/careers`) - Culture videos, benefits, blog posts
- **Contact Us** (`/contact-us`) - Contact form and contact info cards

## Tech Stack

- Next.js 14
- Tailwind CSS 3.3
- Framer Motion
- React Icons

## Quick Start

### Prerequisites
Make sure you have Node.js (v16+) and npm installed:
```bash
# Check if node is installed
node --version
npm --version

# If not installed, install via nvm:
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install 18
nvm use 18
```

### Installation
```bash
cd daoproptech-clone
npm install
```

### Development
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build
```bash
npm run build
npm start
```

## Features

- ✅ Responsive design (mobile, tablet, desktop)
- ✅ Sticky navigation with mobile menu
- ✅ Blue gradient hero sections
- ✅ Lime green CTA buttons
- ✅ Floating action buttons (Chat, Meeting)
- ✅ Smooth hover animations
- ✅ Poppins font family
- ✅ SEO-friendly meta tags

## Color Palette

| Color | Hex | Usage |
|-------|-----|-------|
| Primary Blue | `#0b7ef1` | Hero backgrounds, links |
| Dark Blue | `#04338C` | Text, button hover |
| Lime Green | `#AEFE3A` | CTA buttons, accents |
| Dark Text | `#1b1b1b` | Body text |

## Project Structure

```
daoproptech-clone/
├── src/
│   ├── components/
│   │   ├── FloatingButtons.jsx
│   │   ├── Footer.jsx
│   │   ├── HeroSection.jsx
│   │   ├── Layout.jsx
│   │   └── Navbar.jsx
│   ├── pages/
│   │   ├── _app.jsx
│   │   ├── _document.jsx
│   │   ├── about-us.jsx
│   │   ├── careers.jsx
│   │   ├── contact-us.jsx
│   │   ├── index.jsx
│   │   ├── platform.jsx
│   │   └── projects.jsx
│   └── styles/
│       └── globals.css
├── package.json
├── tailwind.config.js
└── next.config.js
```

## Note

The navigation purposely **excludes** the "Webinars" and "Developers" buttons as per requirements.
