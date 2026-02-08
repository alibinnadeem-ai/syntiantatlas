# SYNTIANT ATLAS Project

This repository contains the integrated DAO PropTech system with the following components:

## Components

1.  **Landing Page** (Port 3000)
    *   Clone of daoproptech.com
    *   Technologies: Next.js 14, Tailwind CSS
    *   Location: `Landing page/`

2.  **FREIP System** (Port 3001 & 5000)
    *   Fractional Real Estate Investment Platform
    *   Frontend: Next.js (Port 3001) at `FREIP - Fractional Real Estate Investment Platform/frontend`
    *   Backend: Express.js (Port 5000) at `FREIP - Fractional Real Estate Investment Platform/backend`

3.  **Webinar's System**
    *   (Under Development)
    *   Location: `Webinar's System/`

## How to Run Everything

We have provided a startup script to launch all services at once.

### Prerequisites

- Node.js (v16+)
- npm

### Quick Start

1.  Open a terminal in the root `SYNTIANT ATLAS` folder.
2.  Run the startup script:
    ```bash
    ./start_all.sh
    ```

This will start:
- Landing Page at **http://localhost:3000**
- FREIP Frontend at **http://localhost:3001**
- FREIP Backend at **http://localhost:5000** (Background service)

## Integration

The **Sign Up** buttons on the Landing Page are now linked to `http://localhost:3001/register`, allowing seamless transition from the marketing site to the application.
