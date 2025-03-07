# CandidStance

CandidStance helps you discover candidates' positions on key issues with AI-driven analysis and credible sources. Built with Next.js and powered by AI, it provides verified, sourced information about politicians' positions on important topics.

## Features

### Core Features
- **AI-Driven Analysis**: Utilizes GPT-4 to analyze and summarize political positions
- **Source Verification**: Cross-references positions with credible news sources
- **Auto Data Refresh**: Updates candidate information every 30 days to maintain accuracy
- **Smart Caching**: PostgreSQL caching system for quick, efficient responses
- **API Protection**: Implements rate limiting and security measures
- **Name Recognition**: Smart politician name detection and correction
- **Modern Interface**: Clean, responsive UI optimized for all devices

### Issue Coverage
Comprehensive coverage of major political issues including:
- Economy & Taxes
- Healthcare & Insurance
- Abortion & Reproductive Rights
- Climate & Environment
- Elections & Voting Rights
- Gun Control & Public Safety
- Israel-Palestine Conflict
- Russia-Ukraine War
- Technology & Privacy
- Immigration & Border Security
- LGBTQ+ Rights
- Education

### Quality Assurance
- **Verified Sources**: All positions are backed by credible news sources
- **User Experience**: Clean, intuitive design for easy navigation
- **Performance**: Optimized loading speeds with Next.js

## Tech Stack

- **Frontend**: Next.js 15 with App Router
- **Styling**: Tailwind CSS
- **Database**: PostgreSQL 17 running on K3s with persistent storage
- **AI Integration**: OpenAI GPT-4o
- **Search**: Google API via RapidAPI
- **Hosting**: AWS Lightsail with single-node K3s (Kubernetes)
- **CI/CD**: GitHub → AWS CodeBuild → Amazon ECR → K3s
- **Container**: Docker (linux/amd64)
- **Package Manager**: pnpm

## Getting Started

1. Clone the repository:
   ```bash
   git clone https://github.com/pravirgoosari/CandidStance.git
   cd CandidStance
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Set up environment variables:
   ```bash
   OPENAI_API_KEY=your_openai_api_key
   GOOGLE_API_KEY=your_google_api_key
   DATABASE_URL=your_postgresql_connection_string
   ```

4. Run the development server:
   ```bash
   pnpm dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Live Application

The application is live at: [https://candidstance.ai](https://candidstance.ai)

## Environment Variables

- `OPENAI_API_KEY`: OpenAI API key for GPT-4 access
- `GOOGLE_API_KEY`: Google Custom Search API key
- `DATABASE_URL`: PostgreSQL connection string

## Deployment

CandidStance targets a single-node K3s cluster on a 2 GB AWS Lightsail server, with PostgreSQL hosted on the same server.

**Status:** Infrastructure is provisioned and the GitHub connection is authorized. The push webhook, first application deployment, DNS confirmation, and HTTPS activation are still pending.

### CI/CD Pipeline

- **Source**: GitHub `main` branch
- **Trigger**: Direct GitHub push webhook to AWS CodeBuild
- **Build**: CodeBuild builds a Docker image for `linux/amd64`
- **Registry**: Amazon ECR stores images tagged with the Git commit SHA
- **Deployment**: A Python helper deploys the image to K3s and checks readiness

### Infrastructure

- **Server**: AWS Lightsail with 2 GB RAM
- **Container Orchestration**: Single-node K3s (Kubernetes)
- **Container Registry**: Amazon ECR
- **Ingress**: Traefik routes traffic to the application
- **HTTPS**: Let's Encrypt certificates through Traefik, pending activation
- **Database**: PostgreSQL 17 with persistent local storage
- **Networking**: Public HTTP/HTTPS; database and Kubernetes API ports remain private
- **Domain**: `candidstance.ai`, with DNS managed through Spaceship

### Deployment Process

1. **Build**: Create a Docker image for `linux/amd64`
2. **Push**: Upload the commit-tagged image to Amazon ECR
3. **Deploy**: Replace the application pod using Kubernetes `Recreate`
4. **Verify**: Check readiness and the application health endpoint

### Configuration Files

- `Dockerfile` — Production container image
- `buildspec.yml` — CodeBuild build and deployment steps
- `infra/lightsail/k8s.yaml` — Application, database, storage, and ingress manifests
- `infra/lightsail/https.yaml` — Traefik HTTPS configuration
- `infra/lightsail/deploy.py` — Deployment helper
- `infra/lightsail/README.md` — Deployment and operations runbook

### Monitoring and Backups

- **Health Checks**: Kubernetes startup, liveness, and readiness probes
- **Health Endpoint**: `/api/health`, which does not call external APIs or the database
- **Application Logs**: Available through `kubectl logs`
- **Build Logs**: CloudWatch Logs with seven-day retention
- **Database Backups**: Daily PostgreSQL dumps with seven local backups retained
- **Server Backups**: Scheduled Lightsail automatic snapshots; storage billed separately

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Author

Created by Pravir Goosari

## Acknowledgments

- Next.js team
- OpenAI for GPT-4 API
- Google for Custom Search API
- AWS for cloud services
- Kubernetes for container orchestration
