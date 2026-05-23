# VPS Deployment Guide — Chat App

Full step-by-step instructions to deploy this project (React + Node.js + PostgreSQL) to a VPS using GitHub and auto-deploy via GitHub Actions.

---

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Step 1 — Push Code to GitHub](#step-1--push-code-to-github)
4. [Step 2 — Prepare the VPS](#step-2--prepare-the-vps)
5. [Step 3 — Install Node.js, PM2, PostgreSQL, Nginx](#step-3--install-nodejs-pm2-postgresql-nginx)
6. [Step 4 — Setup PostgreSQL Database](#step-4--setup-postgresql-database)
7. [Step 5 — Clone the Repository on VPS](#step-5--clone-the-repository-on-vps)
8. [Step 6 — Configure Environment Variables](#step-6--configure-environment-variables)
9. [Step 7 — Install Dependencies and Run Migrations](#step-7--install-dependencies-and-run-migrations)
10. [Step 8 — Build the Frontend](#step-8--build-the-frontend)
11. [Step 9 — Start the Backend with PM2](#step-9--start-the-backend-with-pm2)
12. [Step 10 — Configure Nginx](#step-10--configure-nginx)
13. [Step 11 — Enable HTTPS with Let's Encrypt](#step-11--enable-https-with-lets-encrypt)
14. [Step 12 — Auto-Deploy with GitHub Actions](#step-12--auto-deploy-with-github-actions)
15. [Useful Commands](#useful-commands)

---

## Overview

```
GitHub (push) → GitHub Actions → SSH into VPS → pull + build + restart
```

**Stack:**
- **Frontend:** React + Vite → built to static files, served by Nginx
- **Backend:** Node.js + Express + Socket.IO → run with PM2
- **Database:** PostgreSQL
- **Web Server:** Nginx (reverse proxy + static files)
- **SSL:** Let's Encrypt (Certbot)
- **Process Manager:** PM2

---

## Prerequisites

| What | Where to get |
|------|-------------|
| VPS server (Ubuntu 22.04 recommended) | DigitalOcean, Hetzner, AWS, Linode, etc. |
| Domain name pointing to your VPS IP | Your domain registrar (add A record) |
| GitHub account + repository | github.com |
| SSH access to your VPS | Your VPS provider gives you root credentials |

---

## Step 1 — Push Code to GitHub

On your local machine:

```bash
cd e:/fiverr/chat

# Initialize git (if not already done)
git init
git branch -M main

# Create a .gitignore at the root
cat > .gitignore << 'EOF'
node_modules/
dist/
.env
backend/uploads/
*.log
EOF

# Add and push
git add .
git commit -m "initial commit"
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

> **Important:** Never push `.env` files. They contain secrets. The `.gitignore` above prevents this.

---

## Step 2 — Prepare the VPS

SSH into your VPS as root:

```bash
ssh root@YOUR_VPS_IP
```

Create a non-root user (recommended):

```bash
adduser deploy
usermod -aG sudo deploy
# Copy SSH key to new user so you can log in as deploy
rsync --archive --chown=deploy:deploy ~/.ssh /home/deploy
```

Log in as the deploy user from now on:

```bash
ssh deploy@YOUR_VPS_IP
```

Update the system:

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y git curl wget ufw
```

Configure the firewall:

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

---

## Step 3 — Install Node.js, PM2, PostgreSQL, Nginx

### Node.js 20 (LTS)

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
node --version   # should print v20.x.x
npm --version
```

### PM2 (process manager)

```bash
sudo npm install -g pm2
pm2 --version
```

### Nginx

```bash
sudo apt install -y nginx
sudo systemctl enable nginx
sudo systemctl start nginx
```

### PostgreSQL

```bash
sudo apt install -y postgresql postgresql-contrib
sudo systemctl enable postgresql
sudo systemctl start postgresql
```

---

## Step 4 — Setup PostgreSQL Database

```bash
# Switch to postgres user
sudo -i -u postgres

# Open psql
psql

# Run these SQL commands:
CREATE USER chatuser WITH PASSWORD 'your_strong_password_here';
CREATE DATABASE chatapp OWNER chatuser;
GRANT ALL PRIVILEGES ON DATABASE chatapp TO chatuser;
\q

# Exit postgres user
exit
```

Test the connection:

```bash
psql -U chatuser -d chatapp -h localhost
# Enter the password when prompted
\q
```

---

## Step 5 — Clone the Repository on VPS

```bash
cd /home/deploy

# Clone your repo
git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git chat
cd chat
```

> Replace `YOUR_USERNAME/YOUR_REPO` with your actual GitHub repository path.

---

## Step 6 — Configure Environment Variables

### Backend `.env`

```bash
cd /home/deploy/chat/backend
cp .env.example .env
nano .env
```

Fill in the values:

```env
PORT=3001
NODE_ENV=production

DATABASE_URL=postgres://chatuser:your_strong_password_here@localhost:5432/chatapp

JWT_SECRET=generate_a_random_64_char_string_here
JWT_REFRESH_SECRET=generate_a_different_random_64_char_string_here

FRONTEND_URL=https://yourdomain.com

# Stripe (if using payments)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_IDENTITY_WEBHOOK_SECRET=whsec_...
STRIPE_MONTHLY_PRICE_ID=price_...
STRIPE_YEARLY_PRICE_ID=price_...

# Email (nodemailer — example with Gmail)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your@gmail.com
SMTP_PASS=your_app_password
```

Generate strong JWT secrets:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
# Run twice — once for JWT_SECRET, once for JWT_REFRESH_SECRET
```

### Frontend `.env`

```bash
cd /home/deploy/chat/frontend
nano .env
```

```env
VITE_API_URL=https://yourdomain.com
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...
```

---

## Step 7 — Install Dependencies and Run Migrations

```bash
# Backend
cd /home/deploy/chat/backend
npm install
npm run db:migrate

# Frontend
cd /home/deploy/chat/frontend
npm install
```

---

## Step 8 — Build the Frontend

```bash
cd /home/deploy/chat/frontend
npm run build
```

This creates `/home/deploy/chat/frontend/dist/` — the static files Nginx will serve.

---

## Step 9 — Start the Backend with PM2

Create a PM2 ecosystem file:

```bash
cat > /home/deploy/chat/ecosystem.config.cjs << 'EOF'
module.exports = {
  apps: [
    {
      name: 'chat-backend',
      cwd: '/home/deploy/chat/backend',
      script: 'src/index.js',
      node_args: '--experimental-vm-modules',
      env: {
        NODE_ENV: 'production',
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      error_file: '/home/deploy/chat/logs/backend-error.log',
      out_file: '/home/deploy/chat/logs/backend-out.log',
    },
  ],
}
EOF
```

Create the logs folder and start:

```bash
mkdir -p /home/deploy/chat/logs

cd /home/deploy/chat
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup   # follow the printed command to enable auto-start on reboot
```

Check the backend is running:

```bash
pm2 status
pm2 logs chat-backend
curl http://localhost:3001/api/health   # should return 200 if you have a health route
```

---

## Step 10 — Configure Nginx

Create the Nginx site config:

```bash
sudo nano /etc/nginx/sites-available/chat
```

Paste this (replace `yourdomain.com`):

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Increase body size for file uploads
    client_max_body_size 25M;

    # Serve frontend static files
    root /home/deploy/chat/frontend/dist;
    index index.html;

    # Handle React client-side routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Proxy API requests to backend
    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Proxy uploaded files
    location /uploads/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }

    # Proxy Socket.IO (WebSocket support required)
    location /socket.io/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
    }
}
```

Enable the site and test:

```bash
sudo ln -s /etc/nginx/sites-available/chat /etc/nginx/sites-enabled/
sudo nginx -t          # must say "syntax is ok"
sudo systemctl reload nginx
```

Visit `http://yourdomain.com` — the app should load over HTTP.

---

## Step 11 — Enable HTTPS with Let's Encrypt

```bash
sudo apt install -y certbot python3-certbot-nginx

sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

Follow the prompts (enter email, agree to terms, choose redirect option **2** to force HTTPS).

Certbot automatically edits your Nginx config and sets up auto-renewal. Test renewal:

```bash
sudo certbot renew --dry-run
```

Your app is now live at `https://yourdomain.com`.

---

## Step 12 — Auto-Deploy with GitHub Actions

### 12a — Create an SSH Deploy Key

On your VPS, generate a key pair just for GitHub deployments:

```bash
ssh-keygen -t ed25519 -C "github-deploy" -f ~/.ssh/github_deploy -N ""
cat ~/.ssh/github_deploy.pub >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

### 12b — Add Secrets to GitHub

Go to your GitHub repo → **Settings → Secrets and variables → Actions → New repository secret**. Add:

| Secret name | Value |
|-------------|-------|
| `VPS_HOST` | Your VPS IP address |
| `VPS_USER` | `deploy` |
| `VPS_SSH_KEY` | Contents of `~/.ssh/github_deploy` (the **private** key) |
| `VPS_PORT` | `22` (or your SSH port) |

To copy the private key:

```bash
cat ~/.ssh/github_deploy
# Copy the entire output including -----BEGIN and -----END lines
```

### 12c — Create the GitHub Actions Workflow

In your local project, create the file:

```bash
mkdir -p .github/workflows
```

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to VPS

on:
  push:
    branches:
      - main   # auto-deploy whenever you push to main

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - name: Deploy via SSH
        uses: appleboy/ssh-action@v1.0.3
        with:
          host: ${{ secrets.VPS_HOST }}
          username: ${{ secrets.VPS_USER }}
          key: ${{ secrets.VPS_SSH_KEY }}
          port: ${{ secrets.VPS_PORT }}
          script: |
            set -e
            cd /home/deploy/chat

            echo "--- Pulling latest code ---"
            git pull origin main

            echo "--- Installing backend dependencies ---"
            cd backend
            npm install --omit=dev
            npm run db:migrate
            cd ..

            echo "--- Installing and building frontend ---"
            cd frontend
            npm install
            npm run build
            cd ..

            echo "--- Restarting backend ---"
            pm2 reload chat-backend --update-env

            echo "--- Reloading Nginx ---"
            sudo systemctl reload nginx

            echo "--- Deploy complete ---"
```

Push the workflow file:

```bash
git add .github/workflows/deploy.yml
git commit -m "add GitHub Actions deploy workflow"
git push origin main
```

Now every `git push origin main` will automatically deploy to your VPS.

> **Nginx reload needs sudo without password.** Run `sudo visudo` on the VPS and add:
> ```
> deploy ALL=(ALL) NOPASSWD: /bin/systemctl reload nginx
> ```

---

## Useful Commands

### PM2

```bash
pm2 status                    # check running processes
pm2 logs chat-backend         # view live logs
pm2 logs chat-backend --lines 100   # last 100 log lines
pm2 restart chat-backend      # restart backend
pm2 reload chat-backend       # zero-downtime reload
pm2 stop chat-backend         # stop backend
```

### Nginx

```bash
sudo nginx -t                       # test config syntax
sudo systemctl reload nginx         # apply config changes
sudo systemctl restart nginx        # full restart
sudo tail -f /var/log/nginx/error.log   # view Nginx errors
```

### PostgreSQL

```bash
sudo -u postgres psql               # open psql as postgres admin
psql -U chatuser -d chatapp -h localhost   # connect as chatuser
```

### Manual Deploy (without GitHub Actions)

```bash
ssh deploy@YOUR_VPS_IP
cd /home/deploy/chat
git pull origin main
cd backend && npm install && npm run db:migrate && cd ..
cd frontend && npm install && npm run build && cd ..
pm2 reload chat-backend --update-env
sudo systemctl reload nginx
```

### View Disk Usage

```bash
df -h                           # overall disk usage
du -sh /home/deploy/chat/*      # size of each folder
du -sh /home/deploy/chat/backend/uploads   # size of uploads
```

---

## File Structure on VPS

```
/home/deploy/chat/
├── .github/
│   └── workflows/
│       └── deploy.yml
├── backend/
│   ├── src/
│   ├── uploads/          ← user-uploaded files (NOT in git)
│   ├── .env              ← secrets (NOT in git)
│   └── package.json
├── frontend/
│   ├── src/
│   ├── dist/             ← built static files (served by Nginx)
│   ├── .env              ← frontend env vars (NOT in git)
│   └── package.json
├── logs/
│   ├── backend-error.log
│   └── backend-out.log
└── ecosystem.config.cjs
```

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `502 Bad Gateway` | Backend is not running — check `pm2 status` and `pm2 logs` |
| WebSocket not connecting | Check Nginx has the `Upgrade` headers in `/socket.io/` block |
| File uploads not working | Check `uploads/` folder exists and is writable: `chmod 755 backend/uploads` |
| SSL certificate error | Run `sudo certbot renew` or check domain DNS points to VPS |
| DB migration fails | Check `DATABASE_URL` in `.env` and PostgreSQL is running |
| GitHub Actions fails | Check secrets are set correctly and SSH key has no extra whitespace |
| Port 3001 blocked | Run `sudo ufw allow 3001` temporarily to test, then remove when Nginx is set up |
