# LangExtract Integration Setup Guide

## Overview
This project now includes Google's LangExtract for AI-powered summarization of search results. The integration provides intelligent summaries with key points, entities, and conclusions extracted from search results.

## Architecture
- **Frontend**: Next.js application with enhanced UI for displaying LangExtract summaries
- **Backend API**: Next.js API routes (`/api/search`, `/api/langextract`)
- **Python Service**: Flask server running LangExtract with Google Gemini API

## Prerequisites
1. **Python 3.8+** installed
2. **Node.js 16+** installed
3. **Google Gemini API Key** (get it from [Google AI Studio](https://makersuite.google.com/app/apikey))
4. **LangSearch API Key** (for web search functionality)

## Setup Instructions

### 1. Install Dependencies

#### Python Dependencies
```bash
cd python-backend
pip install -r requirements.txt
```

Or install individually:
```bash
pip install flask flask-cors google-generativeai langextract pydantic python-dotenv gunicorn
```

#### Node.js Dependencies
```bash
npm install
# or
pnpm install
```

### 2. Configure Environment Variables

Create a `.env.local` file in the root directory:
```env
# LangSearch API
LANGSEARCH_API_KEY=your_langsearch_api_key_here
LANGSEARCH_BASE_URL=https://api.langsearch.com

# Google Gemini API for LangExtract
GEMINI_API_KEY=your_gemini_api_key_here

# Python service URL
PYTHON_SERVICE_URL=http://localhost:5000
```

For the Python service, create a `.env` file in the `python-backend` directory:
```env
GEMINI_API_KEY=your_gemini_api_key_here
PORT=5000
```

### 3. Running the Application

#### Option 1: Using Batch Scripts (Windows)
```bash
# First time setup
./setup.bat

# Start all services
./start-services.bat
```

#### Option 2: Manual Start

**Terminal 1 - Python Service:**
```bash
cd python-backend
set GEMINI_API_KEY=your_gemini_api_key_here
python langextract_service.py
```

**Terminal 2 - Next.js App:**
```bash
npm run dev
```

### 4. Access the Application
- **Next.js App**: http://localhost:3000
- **Python Service**: http://localhost:5000
- **Health Check**: http://localhost:5000/health

## Features

### LangExtract Summary Components
1. **Main Topic**: Identifies the primary subject of the search
2. **Key Points**: Extracts 3-5 bullet points from results
3. **Comprehensive Summary**: 2-3 paragraph detailed summary
4. **Key Entities**: Identifies important people, companies, technologies
5. **Main Conclusion**: Provides the key takeaway

### User Flow
1. User enters search query (e.g., "What is LangSearch?")
2. LangSearch API fetches web search results
3. LangExtract processes results and generates AI summary
4. Summary appears above search results with structured information
5. Original search results display below

## API Endpoints

### `/api/search` (POST)
Handles web search via LangSearch API
```json
{
  "query": "search term",
  "count": 5,
  "freshness": "noLimit",
  "summary": true
}
```

### `/api/langextract` (POST)
Processes search results with LangExtract
```json
{
  "query": "search term",
  "results": [
    {
      "title": "Result Title",
      "url": "https://example.com",
      "snippet": "Result snippet text..."
    }
  ]
}
```

### Python Service Endpoints

#### `/summarize` (POST)
Main summarization endpoint
```json
{
  "query": "search term",
  "results": [...]
}
```

#### `/extract` (POST)
Advanced extraction with custom schemas
```json
{
  "text": "text to extract from",
  "schema_type": "summary"
}
```

## Troubleshooting

### Python Service Not Starting
- Check if port 5000 is available: `netstat -an | findstr :5000`
- Verify GEMINI_API_KEY is set correctly
- Check Python dependencies: `pip list`

### No LangExtract Summary Appearing
- Verify Python service is running: http://localhost:5000/health
- Check browser console for errors
- Ensure GEMINI_API_KEY is valid
- Check Python service logs for errors

### API Key Issues
- **GEMINI_API_KEY**: Get from [Google AI Studio](https://makersuite.google.com/app/apikey)
- **LANGSEARCH_API_KEY**: Required for web search functionality

## Development Tips

### Testing the Python Service
```bash
# Test health endpoint
curl http://localhost:5000/health

# Test summarization
curl -X POST http://localhost:5000/summarize \
  -H "Content-Type: application/json" \
  -d '{
    "query": "test query",
    "results": [
      {
        "title": "Test Result",
        "url": "https://example.com",
        "snippet": "Test snippet content"
      }
    ]
  }'
```

### Customizing Extraction
Edit `python-backend/langextract_service.py` to modify:
- Extraction schema (`SearchSummary` class)
- Temperature settings for creativity
- Model selection (gemini-1.5-flash, gemini-1.5-pro)
- Token limits

## Production Deployment

### Python Service
Consider using:
- **Gunicorn**: `gunicorn -w 4 -b 0.0.0.0:5000 langextract_service:app`
- **Docker**: Create Dockerfile for containerization
- **Cloud Run**: Deploy to Google Cloud Run for serverless

### Environment Variables
- Use proper secret management (e.g., Vercel env vars, Docker secrets)
- Never commit API keys to version control
- Use different keys for development and production

## License
This integration uses Google's LangExtract library. Please review their licensing terms.
