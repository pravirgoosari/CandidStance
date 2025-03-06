# CandidStance

CandidStance helps you discover candidates' positions on key issues with AI-driven analysis and credible sources. Built with Next.js and powered by AI, it provides verified, sourced information about politicians' positions on important topics.

## Features

### Core Features
- 🤖 **AI-Driven Analysis**: Utilizes GPT-4 to analyze and summarize political positions
- 📰 **Source Verification**: Cross-references positions with credible news sources
- 🔄 **Auto Data Refresh**: Updates candidate information every 30 days to maintain accuracy
- 💾 **Smart Caching**: PostgreSQL caching system for quick, efficient responses
- ⚡ **API Protection**: Implements rate limiting and security measures
- 🔍 **Name Recognition**: Smart politician name detection and correction
- 📱 **Modern Interface**: Clean, responsive UI optimized for all devices

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
- 📚 **Verified Sources**: All positions are backed by credible news sources
- 🎨 **User Experience**: Clean, intuitive design for easy navigation
- ⚡ **Performance**: Optimized loading speeds with Next.js

## Tech Stack

- **Frontend**: Next.js 15 with App Router
- **Styling**: Tailwind CSS
- **Database**: PostgreSQL (AWS RDS)
- **AI Integration**: OpenAI GPT-4
- **Search**: Google Custom Search API
- **Hosting**: AWS EKS (Elastic Kubernetes Service)
- **Container**: Docker with multi-architecture support
- **Package Manager**: pnpm
- **Font**: Space Grotesk via Google Fonts

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

## Quick Deployment

For production deployment on AWS EKS:

```bash
# Build and push Docker image
docker buildx build --platform linux/amd64 -t candidstance:latest --load .
docker tag candidstance:latest <your-ecr-repo>:latest
docker push <your-ecr-repo>:latest

# Deploy to Kubernetes
kubectl set image deployment/candidstance-app candidstance-app=<your-ecr-repo>:latest -n candidstance
kubectl rollout status deployment/candidstance-app -n candidstance
```

## Environment Variables

- `OPENAI_API_KEY`: OpenAI API key for GPT-4 access
- `GOOGLE_API_KEY`: Google Custom Search API key
- `DATABASE_URL`: PostgreSQL connection string

## Deployment

The application is deployed on AWS EKS (Elastic Kubernetes Service) with the following features:

### **CI/CD Pipeline**
- **Automated Deployment**: AWS CodePipeline with GitHub integration
- **Build Process**: CodeBuild with Docker containerization
- **Deployment**: Automatic EKS deployment on every push to main branch
- **Webhook Integration**: GitHub push events trigger pipeline automatically
- **Environment**: Production deployment to AWS EKS cluster

### **Infrastructure**
- **Container Orchestration**: Kubernetes with AWS EKS
- **Container Registry**: Amazon ECR for Docker images
- **Load Balancing**: AWS Application Load Balancer (ALB)
- **Database**: PostgreSQL on AWS RDS
- **Networking**: VPC with private subnets for security

### **Deployment Process**
1. **Build**: Multi-architecture Docker image (linux/amd64)
2. **Push**: Image pushed to Amazon ECR
3. **Deploy**: Kubernetes deployment with rolling updates
4. **Scale**: Configurable pod replicas for load handling

### **Configuration Files**
- `Dockerfile` - Container configuration
- `k8s/` - Kubernetes manifests
- `scripts/` - Build and deployment scripts

### **Environment Variables**
Managed via Kubernetes secrets:
- `DATABASE_URL` - PostgreSQL connection
- `OPENAI_API_KEY` - OpenAI API access
- `GOOGLE_API_KEY` - Google Search API access

### **Scaling & Monitoring**
- **Horizontal Pod Autoscaler**: Automatic scaling based on CPU usage
- **Load Balancer**: Distributes traffic across multiple pods
- **Logs**: Centralized logging via kubectl
- **Health Checks**: Kubernetes liveness and readiness probes

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Author

Created by Pravir Goosari

## Acknowledgments

- Next.js team
- OpenAI for GPT-4 API
- Google for Custom Search API
- AWS for EKS, ECR, and RDS services
- Kubernetes for container orchestration
