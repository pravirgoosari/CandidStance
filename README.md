# CandidStance

CandidStance explores U.S. politicians’ positions using retrieved evidence and GPT-4o-selected source passages. Claims include citations and supporting excerpts; AI review is not independent fact-checking.

## Features

### Core Features
- **Evidence first**: Up to four GPT-4o web-search discovery requests, followed by bounded article retrieval. Only search-tool citation URLs are used; model-written search prose is not evidence.
- **Cited passages**: GPT-4o selects relevant retrieved passages; the app displays the original text with publisher attribution. A separate relevance check rejects off-topic selections. The model cannot write the displayed passage or invent its URL.
- **Three sources maximum**: Each issue card shows at most three sources with full clickable URLs and expandable supporting excerpts.
- **Transparent gaps**: Insufficient evidence is shown explicitly. Pages that cannot be retrieved are not used to support claims. Provider outages are shown separately from insufficient evidence.
- **Caching**: Supported issues are cached for 30 days; evidence gaps for 24 hours; temporary provider failures for 15 minutes. Expired gaps are retried on the next search without regenerating still-fresh supported issues.
- **Name cache**: Previously resolved names use PostgreSQL aliases before any OpenAI call.
- **Bounded usage**: One research job at a time per app process, no automatic API retries, and no paid research when the database is unavailable.

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

## Tech Stack

- **Frontend**: Next.js 15 with App Router
- **Styling**: Tailwind CSS
- **Database**: PostgreSQL 17 running on K3s with persistent storage
- **AI Integration**: OpenAI GPT-4o
- **Search**: GPT-4o web search through the OpenAI Responses API
- **Hosting**: AWS Lightsail with single-node K3s (Kubernetes)
- **CI/CD**: GitHub → AWS CodeBuild → Amazon ECR → K3s
- **Container**: Docker (linux/amd64)
- **Package Manager**: pnpm

## Research limitations

Searches cover grouped topics to limit API costs and may miss relevant evidence. Article retrieval is restricted to configured news/government domains, with a clearly labeled Wikipedia political-positions reference fallback; inaccessible pages are excluded from the evidence used to write summaries. The system does not establish that a politician has no position when evidence is missing. Historical statements must retain their time context. AI relevance checks are not a guarantee of accuracy. Quoted government statements and Wikipedia references are attributed to their publishers, not independently verified.

Legacy summaries are excluded from the new evidence cache. The database schema in `lib/database/schema.sql` is applied by deployment before the application update. New local databases must also load this schema. Use `pnpm test` for mocked citation, cache, and retrieval tests without API calls.

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

- `OPENAI_API_KEY`: OpenAI API key for GPT-4o access
- `DATABASE_URL`: PostgreSQL connection string

## Deployment

CandidStance targets a single-node K3s cluster on a 2 GB AWS Lightsail server, with PostgreSQL hosted on the same server.

**Status:** Deployed on September 13, 2026. Pushes to `main` trigger CodeBuild and deploy to Lightsail K3s. DNS and HTTPS are configured for `candidstance.ai` and `www.candidstance.ai`. Application health checks and a database backup restore passed; paid search APIs were not exercised during deployment.

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
- **HTTPS**: Let's Encrypt certificates through Traefik with persistent certificate storage
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
- OpenAI for GPT-4o API
- OpenAI for web search
- AWS for cloud services
- Kubernetes for container orchestration

## Search costs

Source discovery uses GPT-4o with `web_search_preview` and requires only the OpenAI API key. At the published $25 per 1,000 preview tool calls, four search calls cost $0.10 plus model input/output charges. Cached repeats use neither paid API. This is a usage estimate, not a hard monthly cap. See [OpenAI pricing](https://developers.openai.com/api/docs/pricing).
