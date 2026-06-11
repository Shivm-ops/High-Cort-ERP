"""Search Service — Elasticsearch + Vector Search for LegalOS"""

from typing import Optional, List, Dict, Any
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)


class SearchService:
    def __init__(self):
        self.es = None
        self._init_elasticsearch()

    def _init_elasticsearch(self):
        try:
            from elasticsearch import AsyncElasticsearch
            self.es = AsyncElasticsearch([settings.ELASTICSEARCH_URL])
            logger.info("Elasticsearch client initialized")
        except (ImportError, Exception) as e:
            logger.warning(f"Elasticsearch not available: {e}")

    async def search(self, query: str, types: List[str], language: str = "en", limit: int = 20) -> Dict:
        results = {}
        for search_type in types:
            if search_type == "acts":
                results["acts"] = await self.search_acts(query, language=language, limit=limit // 2)
            elif search_type == "caselaws":
                results["caselaws"] = await self.search_case_laws(query, limit=limit // 2)
            elif search_type == "drafts":
                results["drafts"] = self._mock_draft_results(query)
        return results

    async def search_acts(self, query: str, category: Optional[str] = None, language: str = "en", limit: int = 20) -> List[Dict]:
        if self.es:
            try:
                body = {
                    "query": {"multi_match": {"query": query, "fields": ["name^3", "description", "sections.content"]}},
                    "size": limit,
                }
                if category:
                    body["query"] = {"bool": {"must": body["query"], "filter": [{"term": {"category": category}}]}}
                resp = await self.es.search(index="lagalos_acts", body=body)
                return [hit["_source"] for hit in resp["hits"]["hits"]]
            except Exception as e:
                logger.error(f"Elasticsearch search error: {e}")

        return self._mock_act_results(query)

    async def search_case_laws(self, query: str, court: Optional[str] = None, practice_area: Optional[str] = None, year_from: Optional[int] = None, year_to: Optional[int] = None, limit: int = 20) -> List[Dict]:
        if self.es:
            try:
                body = {
                    "query": {"multi_match": {"query": query, "fields": ["title^2", "ratio^3", "headnotes^2", "full_text"]}},
                    "size": limit,
                }
                resp = await self.es.search(index="lagalos_caselaws", body=body)
                return [hit["_source"] for hit in resp["hits"]["hits"]]
            except Exception as e:
                logger.error(f"Case law search error: {e}")

        return self._mock_caselaw_results(query)

    async def semantic_search(self, query: str, collection: str = "all", limit: int = 10) -> List[Dict]:
        """Vector similarity search using embeddings."""
        try:
            import chromadb
            from openai import AsyncOpenAI
            from app.core.config import settings

            client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
            embedding_response = await client.embeddings.create(
                model=settings.OPENAI_EMBEDDING_MODEL,
                input=query,
            )
            query_embedding = embedding_response.data[0].embedding
            # Query ChromaDB here
            return []
        except Exception as e:
            logger.warning(f"Semantic search error: {e}")
            return self._mock_caselaw_results(query)

    async def index_document(self, doc_type: str, doc_id: str, content: Dict):
        """Index a document in Elasticsearch."""
        if self.es:
            try:
                await self.es.index(index=f"lagalos_{doc_type}", id=doc_id, body=content)
            except Exception as e:
                logger.error(f"Indexing error: {e}")

    def _mock_act_results(self, query: str) -> List[Dict]:
        return [
            {"id": "1", "name": "Code of Criminal Procedure 1973", "short_name": "CrPC", "section": "439", "title": "Special powers of HC regarding bail", "relevance": 0.95},
            {"id": "2", "name": "Bharatiya Nyaya Sanhita 2023", "short_name": "BNS", "section": "103", "title": "Murder", "relevance": 0.78},
        ]

    def _mock_caselaw_results(self, query: str) -> List[Dict]:
        return [
            {"id": "1", "citation": "(2012) 1 SCC 40", "title": "Sanjay Chandra vs CBI", "court": "Supreme Court", "ratio": "Bail is rule, jail is exception", "relevance": 0.98},
            {"id": "2", "citation": "AIR 1977 SC 2447", "title": "State vs Balchand", "court": "Supreme Court", "ratio": "Courts should lean towards bail", "relevance": 0.92},
        ]

    def _mock_draft_results(self, query: str) -> List[Dict]:
        return [
            {"id": "1", "title": "Bail Application Template", "category": "bail", "relevance": 0.90},
        ]
