# CandidStance

CandidStance helps you discover candidates' positions on key issues with AI-driven analysis and credible sources. Built with Next.js and powered by AI, it provides verified, sourced information about politicians' positions on important topics.

## Features

### Core Features
- 🤖 **AI-Driven Analysis**: Utilizes GPT-4 to analyze and summarize political positions
- 📰 **Source Verification**: Cross-references positions with credible news sources
- 🔄 **Auto Data Refresh**: Updates candidate information every 30 days to maintain accuracy
- 💾 **Smart Caching**: MongoDB caching system for quick, efficient responses
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

- **Frontend**: Next.js 14 with App Router
- **Styling**: Tailwind CSS
- **Database**: MongoDB
- **AI Integration**: OpenAI GPT-4
- **Search**: Google Custom Search API
- **Hosting**: DigitalOcean App Platform
- **Font**: Space Grotesk via Google Fonts

## Getting Started

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/candiddeploy.git
   cd candiddeploy
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Set up environment variables:
   ```bash
   OPENAI_API_KEY=your_openai_api_key
   GOOGLE_API_KEY=your_google_api_key
   MONGODB_URI=your_mongodb_uri
   ```

4. Run the development server:
   ```bash
   pnpm dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Environment Variables

- `OPENAI_API_KEY`: Your OpenAI API key for GPT-4 access
- `GOOGLE_API_KEY`: Your Google Custom Search API key
- `MONGODB_URI`: Your MongoDB connection string

## Deployment

The application is configured for deployment on DigitalOcean App Platform with the following features:

1. **Automatic Deployment**
   - Continuous deployment from the main branch
   - Automatic builds triggered by git push
   - Zero-downtime deployments

2. **Database Integration**
   - MongoDB integration via DigitalOcean Managed Database
   - Automatic backups and updates
   - High-availability configuration

3. **Security & Configuration**
   - Secure environment variable management
   - SSL/TLS certificate auto-renewal
   - HTTPS enforcement
   - Rate limiting and DDoS protection

4. **Monitoring**
   - Application health monitoring
   - Resource usage tracking
   - Error logging and alerting

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Author

Created by Pravir Goosari

## Acknowledgments

- Next.js team for the excellent framework
- OpenAI for GPT-4 API
- Google for Custom Search API
- DigitalOcean for hosting and database services
