# Deployment Guide

## Prerequisites
- Node.js 16+
- PostgreSQL 12+
- Nginx (for reverse proxy)
- SSL certificate (Let's Encrypt recommended)
- PM2 or similar process manager

## Environment Setup

### 1. Server Configuration

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash -
sudo apt install -y nodejs

# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Install Nginx
sudo apt install -y nginx

# Install PM2
sudo npm install -g pm2
```

### 2. Database Setup

```bash
# Connect to PostgreSQL
sudo -u postgres psql

# Create database and user
CREATE DATABASE freip_db;
CREATE USER freip WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE freip_db TO freip;
\q

# Run schema
sudo -u postgres psql freip_db < /path/to/database/schema.sql
```

### 3. Backend Deployment

```bash
# Clone repository
git clone <repo-url> /var/www/freip
cd /var/www/freip/backend

# Install dependencies
npm install

# Create .env file
cp .env.example .env
# Edit .env with production values

# Start with PM2
pm2 start src/server.js --name "freip-api"
pm2 save
```

### 4. Frontend Deployment

```bash
cd /var/www/freip/frontend

# Install dependencies
npm install

# Build
npm run build

# Start with PM2
pm2 start npm --name "freip-frontend" -- start
pm2 save
```

### 5. Nginx Configuration

Create `/etc/nginx/sites-available/freip`:

```nginx
upstream backend {
    server localhost:3001;
}

upstream frontend {
    server localhost:3000;
}

server {
    listen 443 ssl http2;
    server_name freip.com;

    ssl_certificate /etc/letsencrypt/live/freip.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/freip.com/privkey.pem;

    # Backend API
    location /api/ {
        proxy_pass http://backend/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Frontend
    location / {
        proxy_pass http://frontend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

server {
    listen 80;
    server_name freip.com;
    return 301 https://$server_name$request_uri;
}
```

Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/freip /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 6. SSL Certificate (Let's Encrypt)

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot certonly --nginx -d freip.com
```

## Production Environment Variables

### Backend (.env)
```
NODE_ENV=production
PORT=3001
DB_HOST=localhost
DB_PORT=5432
DB_NAME=freip_db
DB_USER=freip
DB_PASSWORD=secure_password
JWT_SECRET=strongly_random_secret_key
CORS_ORIGIN=https://freip.com

# Payment & External Services
STRIPE_SECRET_KEY=sk_live_...
SENDGRID_API_KEY=...
TWILIO_ACCOUNT_SID=...
# ... etc
```

### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=https://freip.com/api
```

## Monitoring

### PM2 Monitoring
```bash
pm2 install pm2-logrotate
pm2 start ecosystem.config.js
pm2 monit
```

### Logs
```bash
pm2 logs freip-api
pm2 logs freip-frontend
```

## Backup Strategy

### Database Backup
```bash
#!/bin/bash
# Daily backup script
pg_dump freip_db | gzip > /backups/freip_db_$(date +%Y%m%d).sql.gz

# Keep 30 days of backups
find /backups -name "freip_db_*" -mtime +30 -delete
```

### Automated Backup (Cron)
```bash
0 2 * * * /path/to/backup.sh
```

## Security Checklist

- [x] Enable firewall
```bash
sudo ufw enable
sudo ufw allow 22
sudo ufw allow 80
sudo ufw allow 443
```

- [x] Configure fail2ban for brute-force protection
```bash
sudo apt install fail2ban
```

- [x] Update system packages regularly
- [x] Use strong database passwords
- [x] Enable HTTPS/SSL
- [x] Set up proper environment variables
- [x] Configure CORS properly
- [x] Enable database encryption
- [x] Regular security audits

## Performance Optimization

### Database
```sql
-- Enable query caching
CREATE INDEX idx_properties_status ON properties(status);
CREATE INDEX idx_investments_investor_id ON investments(investor_id);
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
```

### Application
```bash
# Enable gzip compression
# Already configured in Nginx
```

### Frontend
```bash
# Build optimization
npm run build
# Use production builds
NODE_ENV=production npm start
```

## Scaling Considerations

1. **Database**: Use PostgreSQL replication for high availability
2. **Load Balancer**: Use HAProxy or AWS ALB
3. **Caching**: Implement Redis for session management
4. **CDN**: Use CloudFlare for static assets
5. **Microservices**: Consider separating concerns as app grows

## Monitoring & Alerts

### Tools
- **Monitoring**: Prometheus + Grafana
- **Logging**: ELK Stack (Elasticsearch, Logstash, Kibana)
- **Alerts**: Alertmanager
- **Uptime**: Uptime Robot

## Disaster Recovery

1. Regular database backups to remote storage
2. Application code in Git with CI/CD pipeline
3. Infrastructure as Code (Terraform/Ansible)
4. Run disaster recovery drills monthly

## Support & Maintenance

- Monitor application logs daily
- Review security logs weekly
- Run database maintenance monthly
- Update dependencies quarterly
- Conduct security audit annually
