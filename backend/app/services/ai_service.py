"""AI Service — LangChain + OpenAI + RAG architecture for LegalOS"""

from typing import Optional, List, Dict, Any
import json
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

SYSTEM_PROMPT = """You are LegalOS AI, an expert Indian legal assistant with deep knowledge of:
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

    async def chat(self, messages: List[Dict], context: Dict = {}, language: str = "en") -> str:
        if not self.client:
            return self._mock_response(messages[-1]["content"] if messages else "", language)

        system = SYSTEM_PROMPT.format(language=self._lang_name(language))
        full_messages = [{"role": "system", "content": system}] + messages

        response = await self.client.chat.completions.create(
            model=settings.OPENAI_MODEL,
            messages=full_messages,
            max_tokens=2000,
            temperature=0.3,
        )
        return response.choices[0].message.content

    async def generate_draft(self, draft_type: str, language: str, context: Dict, prompt: str) -> str:
        if not self.client:
            # Map frontend types case-insensitively and support partial match overrides
            dt_key = draft_type.lower().strip()
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
            elif "agreement" in dt_key:
                dt_key = "agreement"
            elif "petition" in dt_key:
                dt_key = "petition"
            elif "notice" in dt_key:
                dt_key = "notice"
            elif "bail" in dt_key:
                dt_key = "bail"
            else:
                dt_key = "other"

            template = DRAFT_TEMPLATES.get(dt_key, DRAFT_TEMPLATES["other"])
            return template.format(**{k: context.get(k, f"[{k.upper()}]") for k in ["court", "year", "petitioner_name", "state", "case_details", "recipient_name", "recipient_address", "subject", "client_name", "notice_body", "action_required", "days", "advocate_name", "bar_no"]}, **context)

        lang_instruction = f"Draft in {self._lang_name(language)}." if language != "en" else ""
        system = f"{SYSTEM_PROMPT.format(language=self._lang_name(language))}\n\nYou are drafting legal documents for Indian courts. {lang_instruction} Follow standard Indian legal format."

        messages = [
            {"role": "system", "content": system},
            {"role": "user", "content": f"Draft a {draft_type} with the following details:\n\n{prompt}\n\nContext: {context}"},
        ]

        response = await self.client.chat.completions.create(
            model=settings.OPENAI_MODEL,
            messages=messages,
            max_tokens=3000,
            temperature=0.2,
        )
        return response.choices[0].message.content

    async def legal_research(self, query: str, language: str = "en", include_acts: bool = True, include_case_laws: bool = True) -> Dict:
        """RAG-based legal research."""
        results = {
            "query": query,
            "ai_analysis": await self._generate_research_analysis(query, language),
            "case_laws": [],
            "sections": [],
            "summary": "",
        }
        return results

    async def summarize(self, text: str, doc_type: str = "general", language: str = "en") -> str:
        if not self.client:
            return f"[AI Summary of {doc_type.upper()}]\n\nThis document has been analyzed and key points extracted. The document relates to {doc_type} proceedings and contains relevant legal information."

        messages = [
            {"role": "system", "content": f"You are a legal document summarizer. Summarize this {doc_type} concisely, highlighting key legal points, parties, and relief sought/granted."},
            {"role": "user", "content": f"Summarize this {doc_type}:\n\n{text[:4000]}"},
        ]
        response = await self.client.chat.completions.create(model=settings.OPENAI_MODEL, messages=messages, max_tokens=800, temperature=0.1)
        return response.choices[0].message.content

    async def analyze_court_order(self, text: str) -> Dict[str, Any]:
        """Analyze a court order and extract structured insights."""
        if not self.client:
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
            response = await self.client.chat.completions.create(
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

    async def translate(self, text: str, source: str, target: str, doc_type: str = "legal") -> str:
        if not self.client:
            return f"[Translated to {self._lang_name(target)}]\n\n{text}"

        messages = [
            {"role": "system", "content": f"You are a professional legal translator. Translate from {self._lang_name(source)} to {self._lang_name(target)}. Maintain legal terminology accuracy and formal register."},
            {"role": "user", "content": f"Translate this {doc_type} document:\n\n{text}"},
        ]
        response = await self.client.chat.completions.create(model=settings.OPENAI_MODEL, messages=messages, max_tokens=2000, temperature=0.1)
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

    async def _generate_research_analysis(self, query: str, language: str) -> str:
        if not self.client:
            return f"Based on your research query '{query}', here is the AI analysis of applicable Indian law..."

        messages = [
            {"role": "system", "content": SYSTEM_PROMPT.format(language=self._lang_name(language))},
            {"role": "user", "content": f"Provide a comprehensive legal analysis for: {query}. Include applicable sections, key precedents, and practical guidance."},
        ]
        response = await self.client.chat.completions.create(model=settings.OPENAI_MODEL, messages=messages, max_tokens=1500, temperature=0.2)
        return response.choices[0].message.content

    async def get_case_suggestions(self, case_info: str) -> Dict[str, List[str]]:
        """Generate legal research suggestions based on case context."""
        if not self.client:
            return {
                "sections": ["Section 439 CrPC", "Section 37 NDPS Act"],
                "judgments": ["Sanjay Chandra v. CBI (2012)", "Arnesh Kumar v. State of Bihar (2014)"],
                "arguments": ["Absence of prima facie case", "Applicant is not a flight risk"],
                "drafts": ["Bail Application", "Application for exemption from personal appearance"]
            }

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
            response = await self.client.chat.completions.create(
                model=settings.OPENAI_MODEL,
                messages=messages,
                max_tokens=1000,
                temperature=0.2,
                response_format={ "type": "json_object" }
            )
            return json.loads(response.choices[0].message.content)
        except Exception as e:
            logger.error(f"Error generating case suggestions: {e}")
            return {
                "sections": ["Relevant Section from Acts"],
                "judgments": ["Leading Apex Court Judgment"],
                "arguments": ["Key legal ground for relief"],
                "drafts": ["Standard Application/Petition"]
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
