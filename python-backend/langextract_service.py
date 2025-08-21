"""
LangExtract Service for Summarization
Uses Google's LangExtract with Gemini API for extracting and summarizing search results
"""

import os
import json
from flask import Flask, request, jsonify
from flask_cors import CORS
from typing import List, Dict, Any
import google.generativeai as genai
from langextract import Document, Entity, SchemaBuilder, ExtractionConfig
from langextract.llms import GeminiModel
from pydantic import BaseModel, Field
from datetime import datetime
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
# Configure CORS: allow localhost by default and optionally additional origins via env
allowed_origins_env = os.environ.get("ALLOWED_ORIGINS", "").strip()
default_origins = ["http://localhost:3000", "http://localhost:3001"]
if allowed_origins_env:
    # Support comma-separated list
    extra_origins = [o.strip() for o in allowed_origins_env.split(",") if o.strip()]
    cors_origins = default_origins + extra_origins
else:
    # In absence of explicit config, allow all for easy dev. Recommend tightening in prod.
    cors_origins = default_origins

CORS(app, origins=cors_origins)

# Configure Gemini API
GEMINI_API_KEY = os.environ.get('GEMINI_API_KEY')
if not GEMINI_API_KEY:
    logger.warning("GEMINI_API_KEY not found in environment variables")
else:
    genai.configure(api_key=GEMINI_API_KEY)

# Define extraction schema for search result summarization
class SearchSummary(BaseModel):
    """Schema for extracting key information from search results"""
    main_topic: str = Field(description="The main topic or subject of the search query")
    key_points: List[str] = Field(description="3-5 key points from the search results")
    comprehensive_summary: str = Field(description="A comprehensive 2-3 paragraph summary of all search results")
    key_entities: List[str] = Field(description="Important entities mentioned (people, companies, technologies)")
    main_conclusion: str = Field(description="The main conclusion or takeaway from the search results")

class SearchResultInput(BaseModel):
    """Input model for search results"""
    query: str
    results: List[Dict[str, str]]  # Each result should have title, url, snippet

def extract_summary_with_langextract(query: str, search_results: List[Dict[str, str]]) -> Dict[str, Any]:
    """
    Use LangExtract to extract structured summary from search results
    """
    try:
        # Combine all search results into a single text document
        combined_text = f"Search Query: {query}\n\n"
        combined_text += "Search Results:\n"
        
        for i, result in enumerate(search_results, 1):
            title = result.get('title', '')
            snippet = result.get('snippet', '')
            url = result.get('url', '')
            combined_text += f"\nResult {i}:\n"
            combined_text += f"Title: {title}\n"
            combined_text += f"URL: {url}\n"
            combined_text += f"Content: {snippet}\n"
            combined_text += "-" * 50 + "\n"
        
        # Create document for LangExtract
        doc = Document(
            id=f"search_{datetime.now().isoformat()}",
            content=combined_text
        )
        
        # Build schema
        schema_builder = SchemaBuilder()
        schema_builder.add_entity_type("SearchSummary", SearchSummary)
        schema = schema_builder.build()
        
        # Configure extraction
        config = ExtractionConfig(
            model=GeminiModel(model_name="gemini-1.5-flash"),
            schema=schema,
            max_tokens=2000,
            temperature=0.3
        )
        
        # Extract information
        extraction_result = config.extract(doc)
        
        # Process results
        summary_data = {
            "main_topic": "",
            "key_points": [],
            "comprehensive_summary": "",
            "key_entities": [],
            "main_conclusion": ""
        }
        
        if extraction_result and extraction_result.entities:
            for entity in extraction_result.entities:
                if entity.type == "SearchSummary" and entity.attributes:
                    summary_data.update(entity.attributes)
                    break
        
        return summary_data
        
    except Exception as e:
        logger.error(f"LangExtract extraction failed: {str(e)}")
        # Fallback to direct Gemini API if LangExtract fails
        return fallback_gemini_summary(query, search_results)

def fallback_gemini_summary(query: str, search_results: List[Dict[str, str]]) -> Dict[str, Any]:
    """
    Fallback to direct Gemini API for summarization if LangExtract fails
    """
    try:
        model = genai.GenerativeModel('gemini-1.5-flash')
        
        # Prepare prompt
        prompt = f"""
        Based on the following search query and results, provide a comprehensive summary.
        
        Search Query: {query}
        
        Search Results:
        """
        
        for i, result in enumerate(search_results, 1):
            prompt += f"\n{i}. {result.get('title', '')}: {result.get('snippet', '')}"
        
        prompt += """
        
        Please provide:
        1. Main topic (one sentence)
        2. 3-5 key points (bullet points)
        3. A comprehensive 2-3 paragraph summary
        4. Key entities mentioned (people, companies, technologies)
        5. Main conclusion or takeaway
        
        Format your response as JSON with keys: main_topic, key_points (array), comprehensive_summary, key_entities (array), main_conclusion
        """
        
        response = model.generate_content(prompt)
        
        # Try to parse JSON from response
        try:
            # Clean the response text to extract JSON
            response_text = response.text
            if "```json" in response_text:
                response_text = response_text.split("```json")[1].split("```")[0]
            elif "```" in response_text:
                response_text = response_text.split("```")[1].split("```")[0]
            
            summary_data = json.loads(response_text)
        except:
            # If JSON parsing fails, create structured response from text
            summary_data = {
                "main_topic": query,
                "key_points": [result.get('snippet', '')[:100] for result in search_results[:3]],
                "comprehensive_summary": response.text[:500] if response.text else "Summary generation failed",
                "key_entities": [],
                "main_conclusion": "Please refer to the search results for more details."
            }
        
        return summary_data
        
    except Exception as e:
        logger.error(f"Gemini fallback also failed: {str(e)}")
        return {
            "main_topic": query,
            "key_points": ["Summary generation failed"],
            "comprehensive_summary": "Unable to generate summary at this time.",
            "key_entities": [],
            "main_conclusion": "Please review the search results directly."
        }

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        "status": "healthy",
        "service": "langextract-summarizer",
        "gemini_configured": bool(GEMINI_API_KEY)
    })

@app.route('/summarize', methods=['POST'])
def summarize():
    """
    Endpoint to summarize search results using LangExtract
    """
    try:
        data = request.json
        if not data:
            return jsonify({"error": "No data provided"}), 400
        
        query = data.get('query', '')
        results = data.get('results', [])
        
        if not query:
            return jsonify({"error": "Query is required"}), 400
        
        if not results:
            return jsonify({"error": "No search results provided"}), 400
        
        # Extract summary using LangExtract
        summary_data = extract_summary_with_langextract(query, results)
        
        # Format the response
        formatted_summary = {
            "success": True,
            "query": query,
            "summary": summary_data,
            "formatted_text": f"""
📌 **{summary_data['main_topic']}**

**Key Points:**
{chr(10).join(['• ' + point for point in summary_data['key_points']])}

**Summary:**
{summary_data['comprehensive_summary']}

**Key Entities:** {', '.join(summary_data['key_entities']) if summary_data['key_entities'] else 'None identified'}

**Conclusion:** {summary_data['main_conclusion']}
            """.strip()
        }
        
        return jsonify(formatted_summary)
        
    except Exception as e:
        logger.error(f"Summarization error: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e),
            "message": "Failed to generate summary"
        }), 500

@app.route('/extract', methods=['POST'])
def extract():
    """
    Advanced extraction endpoint for custom schemas
    """
    try:
        data = request.json
        text = data.get('text', '')
        schema_type = data.get('schema_type', 'summary')
        
        if not text:
            return jsonify({"error": "Text is required"}), 400
        
        # For now, just use the summary extraction
        # This can be extended with different schema types
        doc = Document(id="extract_" + datetime.now().isoformat(), content=text)
        
        schema_builder = SchemaBuilder()
        schema_builder.add_entity_type("SearchSummary", SearchSummary)
        schema = schema_builder.build()
        
        config = ExtractionConfig(
            model=GeminiModel(model_name="gemini-1.5-flash"),
            schema=schema,
            max_tokens=1500,
            temperature=0.3
        )
        
        extraction_result = config.extract(doc)
        
        entities = []
        if extraction_result and extraction_result.entities:
            for entity in extraction_result.entities:
                entities.append({
                    "type": entity.type,
                    "attributes": entity.attributes
                })
        
        return jsonify({
            "success": True,
            "entities": entities
        })
        
    except Exception as e:
        logger.error(f"Extraction error: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)
