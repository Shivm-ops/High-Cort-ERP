"""
app/services/help_seeds.py
==========================
Initial seed data for Knowledge Base categories, step-by-step guides,
articles, and comprehensive FAQs.
"""

from sqlalchemy.orm import Session
from app.models.support import HelpCategory, HelpArticle, FAQ
import logging

logger = logging.getLogger("help_seeds")


def seed_help_center(db: Session) -> None:
    """Populate Knowledge Base categories, articles, and FAQs if not already seeded."""
    try:
        existing_cat = db.query(HelpCategory).first()
        if existing_cat:
            return  # Already seeded

        logger.info("🌱 Seeding Help Center categories, guides, and FAQs...")

        # ── 1. Help Categories ────────────────────────────────────────────────
        cat_setup = HelpCategory(
            name="Account Setup & Chambers",
            slug="account-setup",
            description="Manage your chambers profile, staff accounts, permissions, and letterheads.",
            icon="Settings",
            order=1,
        )
        cat_clients = HelpCategory(
            name="Clients & CRM",
            slug="clients-crm",
            description="Client onboarding, KYC documentation, communications, and client portal.",
            icon="Users",
            order=2,
        )
        cat_cases = HelpCategory(
            name="Case Management & Hearings",
            slug="cases-hearings",
            description="Track case stages, cause lists, daily court board, and hearing alerts.",
            icon="Briefcase",
            order=3,
        )
        cat_drafts = HelpCategory(
            name="Legal Drafting & AI Studio",
            slug="drafting-ai",
            description="Generate bail applications, writs, notices, contracts, and version history.",
            icon="FileText",
            order=4,
        )
        cat_billing = HelpCategory(
            name="Billing, Ledgers & Plans",
            slug="billing-plans",
            description="Create GST invoices, track client fee ledgers, and manage your subscription.",
            icon="CreditCard",
            order=5,
        )
        cat_security = HelpCategory(
            name="Security & Section 126",
            slug="security-compliance",
            description="Privileged legal communications protection, audit trails, and data safety.",
            icon="ShieldCheck",
            order=6,
        )

        db.add_all([cat_setup, cat_clients, cat_cases, cat_drafts, cat_billing, cat_security])
        db.flush()

        # ── 2. Help Articles & Step-by-Step Guides ────────────────────────────
        articles = [
            # Account Setup
            HelpArticle(
                category_id=cat_setup.id,
                title="How to Set Up Your Digital Chambers & Custom Subdomain",
                slug="setup-digital-chambers",
                summary="A complete step-by-step tutorial to configure your law firm profile, logo, and dedicated practice portal.",
                tags="account, chambers, firm, subdomain, profile",
                order=1,
                content="""### Welcome to Fastcase Digital Chambers Setup

Setting up your chambers ensures all legal documents, client invoices, and letterheads carry your firm's professional identity.

#### Step 1: Complete Practice Details
1. Navigate to **Settings** from the left navigation sidebar.
2. Under the **Firm Profile** tab, enter your registered Chambers / Firm Name, office address, and primary contact phone.
3. Upload your chambers logo (PNG or JPEG, transparent background recommended).

#### Step 2: Bar Council & Advocate Verification
1. Add your State Bar Council Registration Number (e.g. `MAH/1234/2018`).
2. This number will automatically populate on formatted Vakalatnamas, notices, and pleadings generated in the AI Draft Studio.

#### Step 3: Configure Letterheads
1. Open the **Letterhead Management** tab in Settings.
2. Select your preferred margin spacing and header layout.
3. You can choose whether firm partners' names appear in the sidebar or top banner.
""",
            ),
            HelpArticle(
                category_id=cat_setup.id,
                title="Adding Associates, Juniors, and Staff to Your Practice",
                slug="manage-team-members",
                summary="Learn how to invite team members and assign role-based permissions across case files.",
                tags="team, users, roles, permissions, associates",
                order=2,
                content="""### Managing Team Access in Fastcase

Fastcase provides strict role-based tenant isolation to ensure confidentiality between chambers members.

#### Roles Overview:
* **Admin Advocate:** Complete access to all firm cases, billing ledgers, subscriptions, and team accounts.
* **Associate Advocate:** Can manage assigned cases, draft pleadings, record hearing outcomes, and communicate with clients.
* **Junior / Paralegal:** Can draft documents, upload evidence, and view court dates without access to financial ledgers.
* **Clerk:** Limited to case filing tracking, cause list updates, and summons delivery status.

#### Inviting a Team Member:
1. Navigate to the **Team** menu in your dashboard.
2. Click **Add Team Member**.
3. Enter their full name, email address, and designated role.
4. The user receives an activation link to set their secure password.
""",
            ),

            # Cases & Hearings
            HelpArticle(
                category_id=cat_cases.id,
                title="Tracking Court Proceedings, Next Dates, and Automated Cause Lists",
                slug="tracking-court-proceedings",
                summary="Master case lifecycle tracking, board numbers, interim orders, and WhatsApp/Email hearing alerts.",
                tags="cases, hearings, court date, cause list, orders",
                order=1,
                content="""### Case Management Lifecycle Guide

Never miss an appearance or filing deadline with Fastcase's court calendar and hearing tracker.

#### Adding a New Matter:
1. Click **Cases** → **New Case**.
2. Enter the CNR number (if allocated), case number, court forum, and judicial bench.
3. Link the Primary Advocate from your team and select the client.

#### Recording Hearing Outcomes:
1. On the hearing date, open the case and click **Record Hearing**.
2. Select the next stage (e.g. *Arguments, Cross-examination, Evidence, Framing of Issues*).
3. Set the **Next Date of Hearing (NDOH)**. Fastcase automatically updates your chambers calendar and triggers hearing reminder alerts.
""",
            ),

            # Drafting & AI
            HelpArticle(
                category_id=cat_drafts.id,
                title="Using the AI Draft Studio for Indian Court Pleadings",
                slug="ai-draft-studio-guide",
                summary="How to generate high-court writs, bail applications, legal notices, and replies with citing relevant Indian statutes.",
                tags="drafting, ai, pleadings, bail, notice, vakalatnama",
                order=1,
                content="""### AI Legal Drafting Studio Overview

Fastcase includes a specialized legal LLM engine trained on Indian statutory law (CrPC/BNSS, CPC, IPC/BNS, Evidence Act/BSA, and Arbitration Act).

#### How to Generate a Draft:
1. Click **AI Draft Studio** in the sidebar.
2. Select your category: *Bail Application, Writ Petition, Legal Notice, Written Statement, or Agreement*.
3. Choose your desired output language: **English, Hindi, Marathi, or Gujarati**.
4. Provide the key material facts and parties' details.
5. Click **Generate Draft**. The studio will draft structured pleadings with appropriate jurisdiction clauses, grounds, and prayers.

#### Exporting & Letterhead Printing:
Once finalized, click **Export to PDF** to print the draft directly onto your chambers' configured letterhead with Section 126 privileged marking.
""",
            ),

            # Billing & Ledgers
            HelpArticle(
                category_id=cat_billing.id,
                title="Generating GST Tax Invoices and Maintaining Client Ledgers",
                slug="billing-invoices-guide",
                summary="Create professional GST-compliant fee invoices, log court expenses, and track client advance retainers.",
                tags="billing, invoice, gst, fees, expenses, ledger",
                order=1,
                content="""### Client Billing & Accounting Guide

Maintain immaculate financial accounting for your practice with full GST compliance and detailed itemized disbursements.

#### Creating a Client Fee Invoice:
1. Open the **Billing** tab and click **New Invoice**.
2. Select the client and related matter.
3. Add billing line items (e.g. *Professional Appearance Fee, Conference, Drafting Charges*).
4. Add reimbursable out-of-pocket expenses (court fees, process fees, certified copy expenses).
5. Fastcase automatically calculates applicable CGST/SGST or IGST based on your state of practice.
6. Click **Generate Invoice** to send a downloadable PDF link to your client.
""",
            ),
        ]
        db.add_all(articles)

        # ── 3. Comprehensive FAQs ─────────────────────────────────────────────
        faqs = [
            # Account Setup
            FAQ(
                category="account_setup",
                question="How do I change my registered email or mobile number?",
                answer="Go to Settings > Profile. Update your mobile number or email. You will receive a 6-digit verification code to confirm the change securely.",
                order=1,
            ),
            FAQ(
                category="account_setup",
                question="Can I use custom letterheads with my own chambers logo?",
                answer="Yes! Under Settings > Letterhead Management, you can upload your high-resolution chambers logo, choose custom font typographies, and set margin layouts for court pleadings.",
                order=2,
            ),
            FAQ(
                category="account_setup",
                question="How do I invite junior advocates and clerks to my chambers?",
                answer="Navigate to the Team tab and click 'Add Team Member'. Enter their email and role (Associate, Junior, Clerk, or Admin). They will receive an email invitation to create their password.",
                order=3,
            ),

            # Clients
            FAQ(
                category="clients",
                question="Can my clients see confidential internal notes I write on a case?",
                answer="No. Internal advocate notes, draft versions, and team assignments are strictly confidential. Clients can only see matters, hearing dates, and documents that you explicitly share with them.",
                order=1,
            ),
            FAQ(
                category="clients",
                question="How do I upload and verify client KYC documents?",
                answer="Open any Client profile and navigate to the 'KYC & Documents' tab. You can upload Aadhaar, PAN, or Certificate of Incorporation copies. All files are stored with AES-256 bank-grade encryption.",
                order=2,
            ),

            # Cases
            FAQ(
                category="cases",
                question="How do automated court hearing reminders work?",
                answer="When you set the Next Date of Hearing (NDOH) on a case, Fastcase automatically adds it to your chambers calendar. Automated email and dashboard reminders are dispatched 48 hours and 24 hours prior to the appearance.",
                order=1,
            ),
            FAQ(
                category="cases",
                question="Can I track cases across High Courts, District Courts, and Tribunals (NCLT/DRT)?",
                answer="Yes. Fastcase supports High Courts, District & Sessions Courts, Consumer Forums, NCLT, NCLAT, DRT, and MACT tribunals with dedicated procedural stages for each forum.",
                order=2,
            ),

            # Documents
            FAQ(
                category="documents",
                question="Is there a file size limit for uploaded evidence and certified copies?",
                answer="You can upload PDFs, documents, audio, and images up to 50 MB per file. Storage limit depends on your active plan (up to 50 GB on Pro/Enterprise plans).",
                order=1,
            ),
            FAQ(
                category="documents",
                question="Are drafts and pleadings backed by version history?",
                answer="Yes! Every time you edit a legal draft in the studio, a timestamped version snapshot is preserved. You can compare changes and revert to any previous draft with 1-click.",
                order=2,
            ),

            # Billing & Payments
            FAQ(
                category="billing",
                question="Can I generate GST-compliant tax invoices for corporate clients?",
                answer="Yes. Fastcase generates complete GST tax invoices with your GSTIN, client GSTIN, reverse-charge indicators, SAC service codes (9982), and automated CGST/SGST/IGST breakdown.",
                order=1,
            ),
            FAQ(
                category="billing",
                question="How do Fastcase subscription plans and the 14-day free trial work?",
                answer="Every newly registered advocate enjoys an unrestricted 14-day Pro Chambers Trial. You can upgrade to Basic, Pro, or Enterprise plans anytime using UPI, Netbanking, or Debit/Credit cards.",
                order=2,
            ),
            FAQ(
                category="billing",
                question="What payment methods are supported for client fee collection?",
                answer="Advocates can record cash, cheque, bank transfer (NEFT/RTGS), or UPI transaction IDs directly against client invoices to maintain clean client ledgers.",
                order=3,
            ),

            # General & Security
            FAQ(
                category="general",
                question="How does Fastcase protect lawyer-client privilege under Section 126 of the Evidence Act?",
                answer="All communications, files, and legal notes are protected with end-to-end tenant isolation, cryptographic encryption at rest and in transit, and role-based access control.",
                order=1,
            ),
            FAQ(
                category="general",
                question="What should I do if I need technical assistance or have a billing query?",
                answer="You can click 'Raise a Support Ticket' directly in the Help Center. Our legal tech engineering team responds within 2-4 hours, with priority handling for critical court appearance issues.",
                order=2,
            ),
        ]
        db.add_all(faqs)

        db.commit()
        logger.info("✅ Help Center seeded with 6 categories, 5 detailed guides, and 12 FAQs!")

    except Exception as e:
        db.rollback()
        logger.warning(f"Help Center seeding notice: {e}")
