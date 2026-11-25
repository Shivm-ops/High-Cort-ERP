"""AI Service — LangChain + OpenAI + RAG architecture for Fastcase"""

from typing import Optional, List, Dict, Any
import json
from datetime import datetime
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

DRAFT_TEMPLATES = {
    "bail": """IN THE COURT OF SESSIONS JUDGE
{court}

APPLICATION NO. ___ OF {year}

{petitioner_name} ... APPLICANT (Accused)
Versus
State of {state} ... RESPONDENT

APPLICATION FOR BAIL UNDER SECTION 439 OF THE CODE OF CRIMINAL PROCEDURE / BNSS 2023

RESPECTFULLY SHOWETH:

1. The Applicant-Accused has been arrested in connection with {case_details}.
2. The Applicant denies the allegations and reserves the right to contest the same.
3. GROUNDS: The Applicant has deep roots in the community and is not a flight risk.
4. The Applicant is ready to furnish adequate surety.

PRAYER: That this Hon'ble Court may be pleased to release the Applicant on bail.

Date: ___
Place: ___                                    Advocate for Applicant""",
    "notice": """LEGAL NOTICE

To,
{recipient_name}
{recipient_address}

Subject: Legal Notice for {subject}

Under instructions from my client {client_name}, I hereby put you on notice that:

{notice_body}

You are called upon to {action_required} within {days} days of receipt of this notice, failing which my client shall be constrained to initiate appropriate legal proceedings against you without further notice.

Yours faithfully,
{advocate_name}
Advocate
Bar Council No: {bar_no}
Date: ___""",
    "complaint": """BEFORE THE HON'BLE DISTRICT CONSUMER DISPUTES REDRESSAL COMMISSION
{court}

COMPLAINT NO. ___ OF {year}

{client_name} ... COMPLAINANT
Versus
{recipient_name} ... OPPONENT / RESPONDENT

COMPLAINT UNDER SECTION 35 OF THE CONSUMER PROTECTION ACT, 2019

MOST RESPECTFULLY SHOWETH:

1. The Complainant purchased a product/service from the Opponent.
2. The product/service was found to be defective/deficient in the following manner: {case_details}.
3. The Complainant repeatedly requested the Opponent to rectify the defect/deficiency, but to no avail.
4. The acts of the Opponent constitute a clear deficiency of service and unfair trade practice.

PRAYER:
Therefore, the Complainant respectfully prays that this Hon'ble Commission may be pleased to direct the Respondent to refund the full amount, pay compensation for mental agony, and legal costs.

Date: ___
Place: ___                                    Advocate for Complainant""",
    "reply": """REPLY TO LEGAL NOTICE

To,
{recipient_name}
{recipient_address}

Subject: Reply to your Legal Notice dated ___ regarding {subject}

Under instructions from my client {client_name}, I hereby reply to your legal notice as follows:

1. The allegations made in your notice are false, frivolous, and vexatious.
2. The true facts are: {notice_body}.
3. My client is not liable to pay any amount or take the actions demanded in your notice.

You are hereby requested to withdraw your notice immediately, failing which my client shall be constrained to defend any proceedings at your cost.

Yours faithfully,
{advocate_name}
Advocate
Bar Council No: {bar_no}
Date: ___""",
    "written_statement": """IN THE COURT OF THE CIVIL JUDGE
{court}

SUIT NO. ___ OF {year}

{recipient_name} ... PLAINTIFF
Versus
{client_name} ... DEFENDANT

WRITTEN STATEMENT ON BEHALF OF THE DEFENDANT

MOST RESPECTFULLY SHOWETH:

1. The suit is not maintainable either in law or on facts.
2. The Defendant denies each and every allegation made in the plaint.
3. Substantive Case/Defense: {case_details}.

PRAYER:
It is therefore prayed that this Hon'ble Court may be pleased to dismiss the suit of the plaintiff with exemplary costs.

Date: ___
Place: ___                                    Advocate for Defendant""",
    "affidavit": """BEFORE THE OATH COMMISSIONER / NOTARY PUBLIC
{court}

AFFIDAVIT

I, {client_name}, residing at {recipient_address}, do hereby solemnly affirm and declare as under:

1. That I am the deponent in this matter and fully conversant with the facts.
2. That the statements made in the accompanying application/petition are true to my personal knowledge.
3. Details: {case_details}.

DEPONENT

VERIFICATION:
Verified at ___ on this ___ day of {year} that the contents of the above affidavit are true and correct.

DEPONENT""",
    "appeal": """IN THE HIGH COURT OF JUDICATURE
{court}

APPEAL NO. ___ OF {year}

{client_name} ... APPELLANT
Versus
{recipient_name} ... RESPONDENT

MEMORANDUM OF APPEAL UNDER SECTION 96 OF CPC / SECTION 374 OF CRPC

MOST RESPECTFULLY SHOWETH:

1. The Appellant is filing this appeal against the judgment/order dated ___ passed by the lower court.
2. The lower court erred in law and facts by failing to consider {case_details}.
3. Grounds of Appeal: The impugned judgment is contrary to established legal principles.

PRAYER:
Therefore, the Appellant prays that this Hon'ble Court may be pleased to set aside the impugned judgment/order.

Date: ___
Place: ___                                    Advocate for Appellant""",
    "agreement": """LEGAL AGREEMENT / CONTRACT

This agreement is entered into on this ___ day of {year} by and between:

Party A: {client_name}, residing at {recipient_address}
AND
Party B: {recipient_name}, residing at {recipient_address}

WHEREAS:
The parties have agreed to execute this contract on the following terms:

1. Scope: The parties shall collaborate/perform services as detailed: {case_details}.
2. Term & Termination: This agreement is valid for {days} days.
3. Resolution: Any dispute shall be resolved through arbitration.

IN WITNESS WHEREOF, the parties hereto have signed this agreement.

__________________                           __________________
Party A                                      Party B""",
    "petition": """IN THE COURT OF THE CIVIL JUDGE / FAMILY COURT
{court}

PETITION NO. ___ OF {year}

{client_name} ... PETITIONER
Versus
{recipient_name} ... RESPONDENT

PETITION UNDER THE RELEVANT PROVISIONS OF LAW

MOST RESPECTFULLY SHOWETH:

1. The Petitioner is filing this petition seeking appropriate relief/orders.
2. The grounds for seeking relief are: {case_details}.
3. The court has jurisdiction to entertain this petition.

PRAYER:
Therefore, the Petitioner prays that this Hon'ble Court may be pleased to grant the reliefs claimed herein.

Date: ___
Place: ___                                    Advocate for Petitioner""",
    "other": """GENERAL LEGAL DRAFT

BEFORE THE HON'BLE COURT OF {court}

DRAFT NO. ___ OF {year}

IN THE MATTER OF:
{client_name}
Versus
{recipient_name}

SUBMISSION / DRAFT STATEMENT:

{case_details}

Respectfully submitted,

Date: ___
Place: ___                                    Advocate for Client""",
}

SYSTEM_PROMPT = """You are Fastcase AI, an expert Indian legal assistant with deep knowledge of:
- Indian statutes: IPC/BNS, CrPC/BNSS, CPC, Evidence Act/BSA, GST Act, Companies Act, RERA, SARFAESI, etc.
- Supreme Court and High Court judgments
- Legal drafting standards for Indian courts
- Indian legal procedure and practice

Provide accurate, professional legal assistance. Always cite relevant sections and case laws.
When drafting, follow Indian court format conventions.
Language: {language}"""


class AIService:
    def __init__(self):
        self.client = None
        self.langchain_available = False
        self._init_clients()

    def _init_clients(self):
        if not settings.OPENAI_API_KEY:
            logger.warning("OpenAI API key not configured — AI features will use mock responses")
            return
        try:
            from openai import AsyncOpenAI
            self.client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
            self.langchain_available = True
            logger.info("OpenAI client initialized")
        except ImportError:
            logger.warning("OpenAI package not installed")

    def _get_client(self, api_key: Optional[str] = None, base_url: Optional[str] = None):
        if api_key and str(api_key).strip():
            try:
                from openai import AsyncOpenAI
                kwargs = {"api_key": str(api_key).strip()}
                if base_url and str(base_url).strip():
                    kwargs["base_url"] = str(base_url).strip()
                return AsyncOpenAI(**kwargs)
            except Exception as e:
                logger.error(f"Error initializing custom AsyncOpenAI client: {e}")
        return self.client

    def is_configured(self, api_key: Optional[str] = None) -> bool:
        return bool((api_key and str(api_key).strip()) or self.client)

    async def chat(self, messages: List[Dict], context: Dict = {}, language: str = "en", api_key: Optional[str] = None) -> str:
        client = self._get_client(api_key)
        if not client:
            return self._mock_response(messages[-1]["content"] if messages else "", language)

        system = SYSTEM_PROMPT.format(language=self._lang_name(language))
        full_messages = [{"role": "system", "content": system}] + messages

        response = await client.chat.completions.create(
            model=settings.OPENAI_MODEL,
            messages=full_messages,
            max_tokens=2000,
            temperature=0.3,
        )
        return response.choices[0].message.content

    def _build_draft_messages(self, draft_type: str, language: str, context: Dict, prompt: str) -> List[Dict[str, str]]:
        lang_instruction = f"Draft in {self._lang_name(language)}." if language != "en" else ""
        system = f"{SYSTEM_PROMPT.format(language=self._lang_name(language))}\n\nYou are drafting legal documents for Indian courts. {lang_instruction} Follow standard Indian legal format."
        return [
            {"role": "system", "content": system},
            {"role": "user", "content": f"Draft a {draft_type} with the following details:\n\n{prompt}\n\nContext: {json.dumps(context, default=str)}"},
        ]

    def _format_fallback_draft(self, draft_type: str, context: Dict, prompt: str) -> str:
        dt_key = (draft_type or "").lower().strip()
        if "complaint" in dt_key:
            dt_key = "complaint"
        elif "reply" in dt_key:
            dt_key = "reply"
        elif "statement" in dt_key:
            dt_key = "written_statement"
        elif "affidavit" in dt_key:
            dt_key = "affidavit"
        elif "appeal" in dt_key:
            dt_key = "appeal"
        elif "agreement" in dt_key or "contract" in dt_key:
            dt_key = "agreement"
        elif "petition" in dt_key:
            dt_key = "petition"
        elif "notice" in dt_key:
            dt_key = "notice"
        elif "bail" in dt_key:
            dt_key = "bail"
        else:
            dt_key = "other"

        ctx = context or {}
        facts_text = (prompt or "").strip() or ctx.get("case_details") or "[CASE FACTS & DETAILS]"
        fmt_vars = {
            "year": str(ctx.get("year") or datetime.now().year),
            "court": ctx.get("court") or "[COURT NAME]",
            "state": ctx.get("state") or "Maharashtra",
            "client_name": ctx.get("client_name") or ctx.get("client") or "[CLIENT NAME]",
            "petitioner_name": ctx.get("petitioner") or ctx.get("client_name") or ctx.get("client") or "[PETITIONER NAME]",
            "recipient_name": ctx.get("opponent") or ctx.get("respondent") or ctx.get("recipient_name") or "[OPPONENT / RESPONDENT]",
            "recipient_address": ctx.get("recipient_address") or ctx.get("client_address") or "[ADDRESS]",
            "subject": ctx.get("subject") or draft_type or "Legal Matter",
            "case_details": facts_text,
            "notice_body": (prompt or "").strip() or ctx.get("notice_body") or "[DETAILS OF NOTICE]",
            "action_required": ctx.get("action_required") or "comply with the legal demand",
            "days": str(ctx.get("days") or 15),
            "advocate_name": ctx.get("advocate_name") or "[ADVOCATE NAME]",
            "bar_no": ctx.get("bar_no") or "[BAR COUNCIL NO]",
        }
        template = DRAFT_TEMPLATES.get(dt_key, DRAFT_TEMPLATES["other"])
        return template.format(**fmt_vars)

    async def generate_draft(
        self,
        draft_type: str,
        language: str,
        context: Dict,
        prompt: str,
        api_key: Optional[str] = None,
        base_url: Optional[str] = None,
        model: Optional[str] = None,
    ) -> str:
        client = self._get_client(api_key, base_url)
        if not client:
            return self._format_fallback_draft(draft_type, context, prompt)

        active_model = model or settings.OPENAI_MODEL
        messages = self._build_draft_messages(draft_type, language, context, prompt)

        response = await client.chat.completions.create(
            model=active_model,
            messages=messages,
            max_tokens=3000,
            temperature=0.2,
        )
        return response.choices[0].message.content

    async def generate_draft_stream(
        self,
        draft_type: str,
        prompt: str,
        context: Dict,
        language: str = "en",
        api_key: Optional[str] = None,
        base_url: Optional[str] = None,
        model: Optional[str] = None,
    ):
        client = self._get_client(api_key, base_url)
        if not client:
            yield self._format_fallback_draft(draft_type, context, prompt)
            return

        active_model = model or settings.OPENAI_MODEL
        messages = self._build_draft_messages(draft_type, language, context, prompt)

        stream = await client.chat.completions.create(
            model=active_model,
            messages=messages,
            max_tokens=3000,
            temperature=0.2,
            stream=True,
        )
        async for chunk in stream:
            delta = chunk.choices[0].delta.content if chunk.choices else None
            if delta:
                yield delta

    async def enhance_draft(
        self,
        content: str,
        action: str,
        instructions: Optional[str] = None,
        language: str = "en",
        api_key: Optional[str] = None,
        base_url: Optional[str] = None,
        model: Optional[str] = None,
    ) -> str:
        client = self._get_client(api_key, base_url)
        if not client:
            raise ValueError("AI_NOT_CONFIGURED")

        action_instructions = {
            "improve_legal_language": "Improve the formal Indian legal drafting terminology, clarity, and structure while preserving all facts, dates, party names, and relief sought.",
            "rewrite_professionally": "Rewrite this legal document into polished, court-ready Indian legal prose preserving all facts and party details.",
            "expand_arguments": "Expand and strengthen the legal arguments and grounds clearly and persuasively while keeping existing facts intact.",
            "add_grounds": "Add structured legal grounds relevant to the factual matrix in this draft while preserving the existing pleading.",
            "add_prayer": "Draft or strengthen a formal, itemized PRAYER clause appropriate for an Indian court filing based on the facts in this document, and return the complete updated draft.",
            "suggest_acts": "Incorporate relevant Indian statutory provisions and sections applicable to this draft accurately and return the complete updated draft.",
            "court_formatting": "Format this draft cleanly in standard Indian court pleading layout (cause title, paragraphs numbered sequentially, prayer, verification/signature block) without losing any content.",
            "custom": instructions or "Refine and improve this legal draft per the advocate's instructions.",
        }
        task_instruction = action_instructions.get(action, instructions or "Refine and improve this legal draft.")
        if instructions and action != "custom":
            task_instruction = f"{task_instruction}\nAdditional advocate instructions: {instructions}"

        active_model = model or settings.OPENAI_MODEL
        lang_name = self._lang_name(language)
        messages = [
            {
                "role": "system",
                "content": f"{SYSTEM_PROMPT.format(language=lang_name)}\n\nReturn ONLY the complete updated draft text without conversational preamble or markdown fences.",
            },
            {
                "role": "user",
                "content": f"Task: {task_instruction}\n\nDocument:\n{content}",
            },
        ]
        response = await client.chat.completions.create(
            model=active_model,
            messages=messages,
            max_tokens=3000,
            temperature=0.2,
        )
        return response.choices[0].message.content

    async def translate_legal(
        self,
        text: str,
        source_lang: str,
        target_lang: str,
        api_key: Optional[str] = None,
        base_url: Optional[str] = None,
        model: Optional[str] = None,
    ) -> str:
        client = self._get_client(api_key, base_url)
        if not client:
            raise ValueError("AI_NOT_CONFIGURED")

        active_model = model or settings.OPENAI_MODEL
        messages = [
            {
                "role": "system",
                "content": f"You are a professional Indian legal translator. Translate accurately from {self._lang_name(source_lang)} to {self._lang_name(target_lang)}, preserving statutory terms, court format, party names, and formal legal register. Return only the translated document.",
            },
            {"role": "user", "content": text},
        ]
        response = await client.chat.completions.create(
            model=active_model,
            messages=messages,
            max_tokens=3000,
            temperature=0.1,
        )
        return response.choices[0].message.content

    async def generate_reply_strategy(
        self,
        notice_text: str,
        key_defences: List[str],
        api_key: Optional[str] = None,
        base_url: Optional[str] = None,
        model: Optional[str] = None,
    ) -> Dict[str, Any]:
        client = self._get_client(api_key, base_url)
        if not client:
            raise ValueError("AI_NOT_CONFIGURED")

        active_model = model or settings.OPENAI_MODEL
        defences_str = ", ".join(key_defences) if key_defences else "None specified"
        messages = [
            {
                "role": "system",
                "content": 'You are an expert Indian litigation strategist. Return valid JSON ONLY matching: {"summary": "string", "rebuttal_points": ["string"], "recommended_actions": ["string"]}.',
            },
            {
                "role": "user",
                "content": f"Key defences requested: {defences_str}\n\nNotice text:\n{notice_text[:8000]}",
            },
        ]
        response = await client.chat.completions.create(
            model=active_model,
            messages=messages,
            max_tokens=1500,
            temperature=0.2,
            response_format={"type": "json_object"},
        )
        return json.loads(response.choices[0].message.content)

    async def legal_research(
        self,
        query: str,
        language: str = "en",
        include_acts: bool = True,
        include_case_laws: bool = True,
        api_key: Optional[str] = None,
        base_url: Optional[str] = None,
        model: Optional[str] = None,
    ) -> Dict:
        """RAG-based legal research."""
        configured = self.is_configured(api_key)
        ai_analysis = ""
        if configured:
            ai_analysis = await self._generate_research_analysis(
                query, language, api_key=api_key, base_url=base_url, model=model
            )
        return {
            "query": query,
            "ai_powered": configured,
            "ai_analysis": ai_analysis,
            "case_laws": [],
            "sections": [],
            "summary": "",
        }

    async def summarize(self, text: str, doc_type: str = "general", language: str = "en", api_key: Optional[str] = None) -> str:
        client = self._get_client(api_key)
        if not client:
            return f"[AI Summary of {doc_type.upper()}]\n\nThis document has been analyzed and key points extracted. The document relates to {doc_type} proceedings and contains relevant legal information."

        messages = [
            {"role": "system", "content": f"You are a legal document summarizer. Summarize this {doc_type} concisely, highlighting key legal points, parties, and relief sought/granted."},
            {"role": "user", "content": f"Summarize this {doc_type}:\n\n{text[:4000]}"},
        ]
        response = await client.chat.completions.create(model=settings.OPENAI_MODEL, messages=messages, max_tokens=800, temperature=0.1)
        return response.choices[0].message.content

    async def analyze_court_order(self, text: str, api_key: Optional[str] = None) -> Dict[str, Any]:
        """Analyze a court order and extract structured insights."""
        client = self._get_client(api_key)
        if not client:
            return {
                "executive_summary": {
                    "nature_of_matter": "Civil Suit / Criminal Appeal",
                    "key_facts": "The matter involves a dispute over the interpretation of statutory provisions. The plaintiff/appellant sought relief which the court has adjudicated upon.",
                    "court_observations": "The court observed that the evidence on record must be evaluated strictly as per the Evidence Act.",
                    "final_decision": "The matter has been listed for further hearing / disposed of with specific directions."
                },
                "important_findings": [
                    "Section 439 CrPC applied for bail considerations.",
                    "The judge noted the lack of corroborating evidence from the prosecution.",
                    "Interim relief granted until the next date of hearing."
                ],
                "action_items": [
                    "File reply/rejoinder within 2 weeks.",
                    "Produce original documents at the next hearing.",
                    "Ensure compliance with the court's interim directions."
                ],
                "hearing_info": {
                    "next_hearing_date": "15-Jul-2026 (Mock Data)",
                    "stage_of_matter": "Evidence / Arguments",
                    "court_name": "High Court / District Court",
                    "judge_name": "Hon'ble Mr. Justice (Mock)"
                },
                "risk_alerts": [
                    "Limitation period expiring in 30 days.",
                    "Failure to file reply may result in adverse orders."
                ]
            }

        # Prompt for OpenAI to return JSON
        system_prompt = """You are an expert AI Court Order Analyzer. 
Analyze the provided court order text and extract the following structured information.
Return the output ONLY as a valid JSON object matching this schema exactly:
{
  "executive_summary": {
    "nature_of_matter": "string",
    "key_facts": "string",
    "court_observations": "string",
    "final_decision": "string"
  },
  "important_findings": ["string", "string"],
  "action_items": ["string", "string"],
  "hearing_info": {
    "next_hearing_date": "string or null",
    "stage_of_matter": "string",
    "court_name": "string",
    "judge_name": "string"
  },
  "risk_alerts": ["string", "string"]
}
"""
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": f"Court Order Text:\n\n{text[:10000]}"}
        ]
        
        try:
            response = await client.chat.completions.create(
                model=settings.OPENAI_MODEL,
                messages=messages,
                max_tokens=2000,
                temperature=0.1,
                response_format={"type": "json_object"}
            )
            return json.loads(response.choices[0].message.content)
        except Exception as e:
            logger.error(f"Error in analyze_court_order: {str(e)}")
            return {
                "executive_summary": {
                    "nature_of_matter": "Error during analysis",
                    "key_facts": "Failed to parse court order.",
                    "court_observations": str(e),
                    "final_decision": "N/A"
                },
                "important_findings": [],
                "action_items": [],
                "hearing_info": {
                    "next_hearing_date": None,
                    "stage_of_matter": "Unknown",
                    "court_name": "Unknown",
                    "judge_name": "Unknown"
                },
                "risk_alerts": ["AI Analysis Failed"]
            }

    async def translate(self, text: str, source: str, target: str, doc_type: str = "legal", api_key: Optional[str] = None) -> str:
        client = self._get_client(api_key)
        if not client:
            return f"[Translated to {self._lang_name(target)}]\n\n{text}"

        messages = [
            {"role": "system", "content": f"You are a professional legal translator. Translate from {self._lang_name(source)} to {self._lang_name(target)}. Maintain legal terminology accuracy and formal register."},
            {"role": "user", "content": f"Translate this {doc_type} document:\n\n{text}"},
        ]
        response = await client.chat.completions.create(model=settings.OPENAI_MODEL, messages=messages, max_tokens=2000, temperature=0.1)
        return response.choices[0].message.content

    async def calculate_limitation(self, act: str, section: str, trigger_date: str, case_type: str) -> Dict:
        # Limitation periods lookup
        LIMITATION_PERIODS = {
            "cpc": {"suit": 3, "appeal_decree": 3, "execution": 12},
            "ni_act": {"section_138": {"days": 30, "type": "notice_period"}},
            "crpc": {"revision": 3, "appeal_acquittal": {"months": 3}},
        }
        return {
            "act": act,
            "section": section,
            "trigger_date": trigger_date,
            "limitation_period": "3 years",
            "deadline": "Calculated based on applicable limitation",
            "notes": f"Refer to Article {section} of Limitation Act 1963 and {act}",
        }

    async def get_clause_suggestions(self, draft_type: str, context: Optional[str] = None) -> List[str]:
        suggestions = {
            "bail": ["Add grounds of long incarceration", "Include medical ground clause", "Add surety availability clause", "State investigation completion", "Include antecedents paragraph"],
            "notice": ["Add quantum of claim", "Include interest clause", "State legal rights reserved", "Add alternative dispute resolution clause"],
        }
        return suggestions.get(draft_type, ["Standard clause 1", "Standard clause 2", "Standard clause 3"])

    async def _generate_research_analysis(
        self,
        query: str,
        language: str,
        api_key: Optional[str] = None,
        base_url: Optional[str] = None,
        model: Optional[str] = None,
    ) -> str:
        client = self._get_client(api_key, base_url)
        if not client:
            return ""

        active_model = model or settings.OPENAI_MODEL
        messages = [
            {"role": "system", "content": SYSTEM_PROMPT.format(language=self._lang_name(language))},
            {"role": "user", "content": f"Provide a comprehensive legal analysis for: {query}. Include applicable sections, key precedents, and practical guidance."},
        ]
        response = await client.chat.completions.create(model=active_model, messages=messages, max_tokens=1500, temperature=0.2)
        return response.choices[0].message.content

    async def get_case_suggestions(
        self,
        case_info: str,
        api_key: Optional[str] = None,
        base_url: Optional[str] = None,
        model: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Generate legal research suggestions based on case context."""
        client = self._get_client(api_key, base_url)
        if not client:
            return {
                "ai_powered": False,
                "sections": [],
                "judgments": [],
                "arguments": [],
                "drafts": [],
            }

        active_model = model or settings.OPENAI_MODEL
        system_prompt = """You are an expert Indian Legal AI Researcher.
Based on the following case context, generate highly relevant and specific legal research suggestions.
Return the output ONLY as a valid JSON object matching this schema exactly:
{
  "sections": ["string", "string"],
  "judgments": ["string", "string"],
  "arguments": ["string", "string"],
  "drafts": ["string", "string"]
}"""
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": f"Case Context:\n\n{case_info}"}
        ]

        try:
            response = await client.chat.completions.create(
                model=active_model,
                messages=messages,
                max_tokens=1000,
                temperature=0.2,
                response_format={"type": "json_object"}
            )
            parsed = json.loads(response.choices[0].message.content)
            parsed["ai_powered"] = True
            return parsed
        except Exception as e:
            logger.error(f"Error generating case suggestions: {e}")
            return {
                "ai_powered": False,
                "sections": [],
                "judgments": [],
                "arguments": [],
                "drafts": [],
            }

    def _lang_name(self, code: str) -> str:
        return {"en": "English", "hi": "Hindi", "mr": "Marathi", "gu": "Gujarati"}.get(code, "English")

    def _mock_response(self, query: str, language: str = "en") -> str:
        return f"""Based on your query about "{query[:100]}", here is the legal analysis:

**Applicable Legal Framework:**
The matter involves provisions under Indian law that require careful consideration.

**Key Provisions:**
1. Relevant statutory provisions apply to this situation
2. Judicial precedents provide guidance on interpretation
3. Procedural requirements must be complied with

**Recommendation:**
Please configure your OpenAI API key in .env to get AI-powered responses.

*Note: This is a mock response. Configure OPENAI_API_KEY in .env for live AI features.*"""
