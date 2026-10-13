"""
backend/app/services/template_seeds.py
=======================================
Seeds high-quality, authentic Indian legal master templates into the database.
Ensures templates are public (is_public_template=True, firm_id=None) across
all standard categories (Application, Affidavit, Petition, Complaint, Reply,
Written Statement, Notice, Agreement, Appeal, Vakalatnama, Motion) in
English, Marathi, and Hindi.
"""

import logging
from sqlalchemy.orm import Session
from app.models.draft import Draft, DraftCategory, DraftLanguage
from app.models.user import User

logger = logging.getLogger(__name__)

MASTER_TEMPLATES = [
    # ── 1. APPLICATIONS ──────────────────────────────────────────────────────────
    {
        "title": "Bail Application u/s 437/439 Cr.P.C.",
        "category": DraftCategory.APPLICATION,
        "language": DraftLanguage.ENGLISH,
        "practice_area": "Criminal Law",
        "subcategory": "Bail",
        "tags": ["Bail", "CrPC", "Criminal", "District Court", "High Court"],
        "content": """IN THE COURT OF THE HON'BLE {{court_name}}

CRIMINAL BAIL APPLICATION NO. ______ OF {{case_number}}
IN CRIME / FIR NO. ______ DATED ______
POLICE STATION: ___________________________

IN THE MATTER OF:
{{client_name}},
Age: {{client_age}} years, Occupation: {{client_occupation}},
Residing at: {{client_address}},
Aadhaar No.: {{aadhaar}}, PAN: {{pan}}
                                                    ... APPLICANT / ACCUSED

                    VERSUS

STATE OF MAHARASHTRA / {{opponent_name}}
(Through Investigating Officer, Police Station)
                                                    ... RESPONDENT

APPLICATION FOR REGULAR BAIL UNDER SECTION 439 OF THE CODE OF CRIMINAL PROCEDURE, 1973

MOST RESPECTFULLY SHOWETH:

1. That the Applicant {{client_name}} is a law-abiding citizen of India residing at {{client_address}} and has deep roots in society with no prior criminal antecedents.

2. That the Applicant has been falsely implicated in Crime No. ______ registered at Police Station ______ for the alleged offenses punishable under Sections ______ of the Indian Penal Code / Bharatiya Nyaya Sanhita.

3. That the Applicant was arrested on ______ and is presently in judicial custody. The investigation in the present case is substantially complete, and all material evidence has already been seized by the Investigating Agency.

4. That the allegations in the FIR, even if taken at face value, do not disclose the prima facie ingredients of the alleged offenses against the present Applicant. No recovery remains to be made from or at the instance of the Applicant.

5. That the Applicant undertakes to abide by all terms and conditions that this Hon'ble Court may deem fit to impose and shall not tamper with evidence or influence any witness. The Applicant undertakes to attend the concerned Police Station and the Hon'ble Court on all scheduled dates.

6. That the Applicant is ready and willing to furnish solvent surety to the complete satisfaction of this Hon'ble Court.

PRAYER:
In the premises aforesaid, it is most respectfully prayed that this Hon'ble Court may graciously be pleased to:

(a) Order the release of the Applicant {{client_name}} on regular bail in connection with Crime / FIR No. ______, registered at Police Station ______, pending before {{court_name}} in Case No. {{case_number}}, on such terms and conditions as this Hon'ble Court deems fit;

(b) Grant any other and further relief as the nature and circumstances of the case may require in the interest of justice.

PLACE: _____________________
DATED: _____________________

FILED BY:
{{advocate_name}}
ADVOCATE FOR THE APPLICANT
Bar Council No.: _____________________""",
    },
    {
        "title": "जमीन अर्ज (Bail Application) — कलम ४३७/४३९ फौजदारी प्रक्रिया संहिता",
        "category": DraftCategory.APPLICATION,
        "language": DraftLanguage.MARATHI,
        "practice_area": "Criminal Law",
        "subcategory": "Bail",
        "tags": ["जमीन अर्ज", "Bail", "CrPC", "Marathi"],
        "content": """मा. {{court_name}} यांचे न्यायालयात

फौजदारी जामीन अर्ज क्र. ______ / {{case_number}}
गुन्हा रजि. क्र. ______ दिनांक ______
पोलीस ठाणे: ___________________________

{{client_name}},
वय: {{client_age}} वर्षे, धंदा: {{client_occupation}},
राहणार: {{client_address}},
आधार क्र.: {{aadhaar}}, पॅन क्र.: {{pan}}
                                                    ... अर्जदार / आरोपी

                    विरुद्ध

महाराष्ट्र शासन / {{opponent_name}}
(तपास अधिकारी, संबंधित पोलीस ठाणे)
                                                    ... सामावाले / सरकार

फौजदारी प्रक्रिया संहिता, १९७३ चे कलम ४३९ अन्वये नियमित जामिनासाठी अर्ज

अर्जदार खालीलप्रमाणे सविनय अर्ज सादर करतो:

१. अर्जदार {{client_name}} हा/ही {{client_address}} येथील कायमचा/ची रहिवासी असून समाजात सन्मानाने जीवन जगत आहे. अर्जदाराचा कोणताही पूर्वगुन्हेगारी इतिहास नाही.

२. अर्जदाराला वरील गुन्ह्यात खोट्या व निराधार आरोपांखाली गोवण्यात आले आहे. अर्जदाराचा सदर घटनेशी कोणताही प्रत्यक्ष वा अप्रत्यक्ष संबंध नाही.

३. सदर गुन्ह्याचा तपास बहुतांश पूर्ण झाला असून अर्जदाराकडून कोणतीही जप्ती अथवा वसुली बाकी राहिलेली नाही. अर्जदाराला न्यायालयीन कोठडीत ठेवण्याची आता कोणतीही कायदेशीर आवश्यकता नाही.

४. अर्जदार न्यायालयाच्या सर्व अटी व शर्तींचे काटेकोरपणे पालन करण्यास तयार असून पुराव्याशी छेडछाड करणार नाही अथवा साक्षीदारांवर कोणताही दबाव आणणार नाही.

५. अर्जदार या मा. न्यायालयाच्या समाधानानुसार सक्षम जामीनदार देण्यास तयार आहे.

प्रार्थना:
म्हणून अर्जदाराची विनंती आहे की:

(अ) अर्जदार {{client_name}} यास मा. न्यायालयाने योग्य वाटतील अशा अटींवर नियमित जामिनावर मुक्त करण्याचा आदेश व्हावा;
(ब) न्यायाच्या हितासाठी इतर योग्य तो दिलासा मिळावा.

ठिकाण: _____________________
दिनांक: _____________________

अर्जदारातर्फे:
{{advocate_name}}
वकील""",
    },
    {
        "title": "Exemption Application u/s 205 / 317 Cr.P.C.",
        "category": DraftCategory.APPLICATION,
        "language": DraftLanguage.ENGLISH,
        "practice_area": "Criminal Law",
        "subcategory": "Exemption",
        "tags": ["Exemption", "CrPC", "Hearing"],
        "content": """IN THE COURT OF THE HON'BLE {{court_name}}

CASE NO.: {{case_number}}

IN THE MATTER OF:
{{petitioner}}                                      ... COMPLAINANT
                    VERSUS
{{client_name}}                                     ... ACCUSED

APPLICATION UNDER SECTION 205 / 317 OF CR.P.C. FOR EXEMPTION OF PERSONAL ATTENDANCE OF ACCUSED FOR TODAY ONLY

MOST RESPECTFULLY SHOWETH:

1. That the above-captioned matter is listed today before this Hon'ble Court for {{hearing_purpose}}.

2. That the Applicant / Accused {{client_name}}, R/o {{client_address}}, is unable to present himself before this Hon'ble Court today due to sudden medical indisposition / unavoidable official exigencies.

3. That the absence of the Applicant is bona fide and not intentional or deliberate. The Applicant is duly represented through his undersigned Advocate, who is fully briefed to proceed with the matter.

4. That no prejudice will be caused to the Complainant if the personal appearance of the Applicant is dispensed with for today only.

PRAYER:
It is therefore respectfully prayed that this Hon'ble Court may be pleased to exempt the personal attendance of the Applicant {{client_name}} for today only.

PLACE: _____________________
DATE: _____________________

ADVOCATE FOR THE APPLICANT
{{advocate_name}}""",
    },

    # ── 2. AFFIDAVITS ────────────────────────────────────────────────────────────
    {
        "title": "Affidavit in Support of Application / Petition",
        "category": DraftCategory.AFFIDAVIT,
        "language": DraftLanguage.ENGLISH,
        "practice_area": "General Litigation",
        "subcategory": "Affidavit",
        "tags": ["Affidavit", "Evidence", "Oath"],
        "content": """BEFORE THE HON'BLE COURT OF {{court_name}}

IN CASE NO.: {{case_number}}

IN THE MATTER OF:
{{client_name}}                                     ... PETITIONER / APPLICANT
                    VERSUS
{{opponent_name}}                                   ... RESPONDENT

AFFIDAVIT

I, {{client_name}}, Age: {{client_age}} years, Occupation: {{client_occupation}}, Residing at: {{client_address}}, Aadhaar No.: {{aadhaar}}, PAN: {{pan}}, do hereby solemnly affirm and state on oath as under:

1. That I am the Petitioner / Applicant in the above-captioned matter and am fully conversant with the facts and circumstances of the case, and as such, am competent to swear this affidavit.

2. That the contents of the accompanying Application / Petition have been drafted under my instructions and have been read over and explained to me in vernacular, which I have understood to be true and correct.

3. That the statements made in Paragraphs 1 to ______ of the accompanying Application are true and correct to the best of my personal knowledge and belief, while the remaining paragraphs are based on legal advice received from my advocate, which I believe to be true.

4. That no part of this affidavit is false and nothing material has been concealed therefrom.

DEPONENT
{{client_name}}

VERIFICATION:
Verified at {{court_name}} on this _____ day of ____________, 2026, that the contents of paragraphs 1 to 4 of the above affidavit are true and correct to my knowledge and belief.

DEPONENT
{{client_name}}

Identified by me:
{{advocate_name}}
Advocate""",
    },
    {
        "title": "प्रतिज्ञापत्र (Affidavit) — सामान्य स्वरूप",
        "category": DraftCategory.AFFIDAVIT,
        "language": DraftLanguage.MARATHI,
        "practice_area": "General Litigation",
        "subcategory": "Affidavit",
        "tags": ["प्रतिज्ञापत्र", "Affidavit", "Marathi"],
        "content": """मा. {{court_name}} यांचे न्यायालयात

प्रकरण क्र.: {{case_number}}

{{client_name}}                                     ... अर्जदार
                    विरुद्ध
{{opponent_name}}                                   ... सामावाले

सत्यप्रतिज्ञापत्र (AFFIDAVIT)

मी, {{client_name}}, वय: {{client_age}} वर्षे, धंदा: {{client_occupation}}, राहणार: {{client_address}}, आधार क्र.: {{aadhaar}}, पॅन क्र.: {{pan}}, ईश्वरसाक्ष सांगतो/सांगते की:

१. मी वरील प्रकरणातील अर्जदार असून या प्रकरणातील सर्व सत्य परिस्थिती मला वैयक्तिकरीत्या ज्ञात आहे.

२. सोबत जोडलेल्या अर्जातील परिच्छेद क्र. १ ते ______ मधील मजकूर माझ्या स्वतःच्या माहितीनुसार खरा व बरोबर आहे.

३. सदर प्रतिज्ञापत्रात मी कोणतेही असत्य कथन केलेले नाही अथवा कोणतीही महत्त्वाची माहिती दडपून ठेवलेली नाही.

प्रतिज्ञापत्रकती
{{client_name}}

सत्यापन:
आज दिनांक ______ रोजी {{client_name}} यांनी माझ्यासमक्ष हजर राहून प्रतिज्ञापत्र वाचून दाखवले असता मजकूर खरा असल्याचे मान्य केले.

ओळख पटविणारे:
{{advocate_name}}
वकील""",
    },

    # ── 3. PETITIONS ─────────────────────────────────────────────────────────────
    {
        "title": "Civil Original Petition / Plaint under CPC",
        "category": DraftCategory.PETITION,
        "language": DraftLanguage.ENGLISH,
        "practice_area": "Civil Law",
        "subcategory": "Plaint",
        "tags": ["Plaint", "Civil", "CPC", "Suit"],
        "content": """IN THE COURT OF THE HON'BLE {{court_name}}

REGULAR CIVIL SUIT / PETITION NO. ______ OF {{case_number}}

{{client_name}},
Age: {{client_age}} years, Occupation: {{client_occupation}},
Residing at: {{client_address}},
Aadhaar No.: {{aadhaar}}, PAN: {{pan}}
                                                    ... PLAINTIFF / PETITIONER

                    VERSUS

{{opponent_name}},
Residing at: ___________________________________________
                                                    ... DEFENDANT / RESPONDENT

SUIT FOR DECLARATION, PERMANENT INJUNCTION AND ANCILLARY RELIEFS

THE PLAINTIFF MOST RESPECTFULLY STATES:

1. Description of Parties:
The Plaintiff {{client_name}} is a citizen of India residing at the aforesaid address. The Defendant {{opponent_name}} is an individual residing within the local territorial jurisdiction of this Hon'ble Court.

2. Cause of Action:
The cause of action for the present suit first arose on ______ when the Defendant illegally threatened the Plaintiff's peaceful possession and ownership rights over the suit property, and subsequently on continuous occasions within the jurisdiction of this Court.

3. Jurisdiction & Court Fees:
The suit property is situated at {{court_name}}, and both parties reside within the jurisdiction of this Court. The requisite ad valorem court fee stamp has been affixed to the plaint in accordance with the Court Fees Act.

4. Prayers:
It is respectfully prayed that this Hon'ble Court be pleased to:
(a) Pass a decree of declaration declaring the Plaintiff to be the rightful and lawful owner of the suit property;
(b) Pass a decree of permanent injunction restraining the Defendant, his agents and servants from interfering with the peaceful possession of the Plaintiff;
(c) Grant costs of the suit to the Plaintiff.

PLAINTIFF
{{client_name}}

ADVOCATE FOR PLAINTIFF
{{advocate_name}}""",
    },

    # ── 4. COMPLAINTS ────────────────────────────────────────────────────────────
    {
        "title": "Criminal Complaint u/s 138 Negotiable Instruments Act",
        "category": DraftCategory.COMPLAINT,
        "language": DraftLanguage.ENGLISH,
        "practice_area": "Banking & Commercial",
        "subcategory": "Cheque Dishonour",
        "tags": ["NI Act", "Section 138", "Cheque Bounce", "Magistrate"],
        "content": """IN THE COURT OF THE HON'BLE JUDICIAL MAGISTRATE FIRST CLASS AT {{court_name}}

CRIMINAL COMPLAINT NO. ______ OF {{case_number}}

{{client_name}},
Age: {{client_age}} years, Occupation: {{client_occupation}},
Residing at: {{client_address}},
Aadhaar No.: {{aadhaar}}, PAN: {{pan}}
                                                    ... COMPLAINANT

                    VERSUS

{{opponent_name}},
Residing at: ___________________________________________
                                                    ... ACCUSED

COMPLAINT UNDER SECTION 138 READ WITH SECTION 142 OF THE NEGOTIABLE INSTRUMENTS ACT, 1881

THE COMPLAINANT HUMBLY STATES AS UNDER:

1. That the Complainant {{client_name}} and the Accused {{opponent_name}} had business/friendly dealings wherein the Accused incurred a legally enforceable debt/liability amounting to Rs. ______/- (Rupees __________________ only).

2. In discharge of the aforesaid legal debt, the Accused issued Cheque No. ______ dated ______ drawn on ______ Bank, in favour of the Complainant.

3. The Complainant presented the said cheque for clearance through their banker, but the same was dishonoured and returned unpaid vide Bank Return Memo dated ______ with remarks "FUNDS INSUFFICIENT".

4. The Complainant caused a Statutory Legal Demand Notice dated ______ to be issued to the Accused by Registered Post A.D. demanding payment within 15 days of receipt. Despite receipt of the notice on ______, the Accused failed and neglected to make payment within the statutory period of 15 days.

5. The Accused has thus committed an offense punishable under Section 138 of the Negotiable Instruments Act, 1881.

PRAYER:
The Complainant prays that process be issued against the Accused {{opponent_name}}, the Accused be tried and convicted in accordance with law, and adequate compensation be awarded to the Complainant.

COMPLAINANT
{{client_name}}

ADVOCATE FOR COMPLAINANT
{{advocate_name}}""",
    },

    # ── 5. REPLIES ───────────────────────────────────────────────────────────────
    {
        "title": "Reply to Interim Application / Notice",
        "category": DraftCategory.REPLY,
        "language": DraftLanguage.ENGLISH,
        "practice_area": "Civil Litigation",
        "subcategory": "Reply",
        "tags": ["Reply", "Injunction Reply", "Civil"],
        "content": """IN THE COURT OF THE HON'BLE {{court_name}}

CASE NO.: {{case_number}}

{{petitioner}}                                      ... PLAINTIFF / APPLICANT
                    VERSUS
{{client_name}}                                     ... DEFENDANT / RESPONDENT

REPLY ON BEHALF OF RESPONDENT / DEFENDANT TO THE APPLICATION FILED BY THE APPLICANT

THE RESPONDENT MOST RESPECTFULLY SHOWETH:

1. That the Application filed by the Applicant is thoroughly misconceived, false, frivolous, and not maintainable either in law or on facts, and is liable to be dismissed with compensatory costs.

2. That the Applicant has suppressed material facts from this Hon'ble Court and has approached with unclean hands.

3. Parawise Reply:
(a) With respect to Para 1, the statements are matter of record.
(b) With respect to Para 2 to 5, the allegations made therein are vehemently denied. The true facts are as follows: [state factual defense].

4. That no prima facie case exists in favour of the Applicant, the balance of convenience lies firmly in favour of the Respondent, and no irreparable loss will be caused if the application is rejected.

PRAYER:
The Respondent prays that the Application filed by the Applicant be dismissed with costs.

RESPONDENT
{{client_name}}

ADVOCATE FOR RESPONDENT
{{advocate_name}}""",
    },

    # ── 6. WRITTEN STATEMENTS ────────────────────────────────────────────────────
    {
        "title": "Written Statement under Order VIII Rule 1 CPC",
        "category": DraftCategory.WRITTEN_STATEMENT,
        "language": DraftLanguage.ENGLISH,
        "practice_area": "Civil Law",
        "subcategory": "Written Statement",
        "tags": ["Written Statement", "WS", "CPC", "Defense"],
        "content": """IN THE COURT OF THE HON'BLE {{court_name}}

SPECIAL / REGULAR CIVIL SUIT NO. ______ OF {{case_number}}

{{opponent_name}}                                   ... PLAINTIFF
                    VERSUS
{{client_name}}                                     ... DEFENDANT

WRITTEN STATEMENT ON BEHALF OF DEFENDANT UNDER ORDER VIII RULE 1 OF THE CODE OF CIVIL PROCEDURE, 1908

THE DEFENDANT RESPECTFULLY SUBMITS AS UNDER:

I. PRELIMINARY OBJECTIONS:
1. The suit is barred by limitation and does not disclose any legitimate cause of action against the Defendant.
2. The Plaintiff has not valued the suit properly for the purpose of court fees and jurisdiction.
3. The suit is bad for non-joinder of necessary parties.

II. PARA-WISE REPLY ON MERITS:
1. That the contents of Para 1 of the plaint are denied save and except what is expressly admitted.
2. That the contents of Para 2 to 10 are false, frivolous and concocted. The Defendant has never entered into the alleged transaction as claimed by the Plaintiff.

III. PRAYER:
It is therefore prayed that this Hon'ble Court may be pleased to:
(a) Dismiss the suit of the Plaintiff with exemplary costs under Section 35A CPC;
(b) Grant any other relief deemed fit in the interest of justice.

DEFENDANT
{{client_name}}

ADVOCATE FOR DEFENDANT
{{advocate_name}}""",
    },

    # ── 7. NOTICES ───────────────────────────────────────────────────────────────
    {
        "title": "Legal Notice for Cheque Dishonour u/s 138 NI Act",
        "category": DraftCategory.NOTICE,
        "language": DraftLanguage.ENGLISH,
        "practice_area": "Banking & Commercial",
        "subcategory": "Legal Notice",
        "tags": ["Legal Notice", "NI Act", "Section 138", "Notice"],
        "content": """REGISTERED POST WITH A.D. / SPEED POST

LEGAL DEMAND NOTICE UNDER SECTION 138 OF THE NEGOTIABLE INSTRUMENTS ACT, 1881

DATE: _____________________

TO,
{{opponent_name}}
Residing/Operating at: _________________________________________

SIR / MADAM,

Under instructions from and on behalf of my client {{client_name}}, residing at {{client_address}}, PAN: {{pan}}, I hereby serve upon you this Statutory Legal Notice:

1. That you issued Cheque No. ______ dated ______ for an amount of Rs. ______/- (Rupees __________________ only) drawn on ______ Bank, in partial/full discharge of your legally enforceable debt and liability towards my client.

2. That my client presented the said cheque for encashment through their banker {{court_name}}, but the same was dishonoured and returned unpaid vide Bank Return Memo dated ______ with remarks "FUNDS INSUFFICIENT" / "EXCEEDS ARRANGEMENT".

3. You are hereby called upon to pay the entire cheque amount of Rs. ______/- to my client within FIFTEEN (15) DAYS from the date of receipt of this notice.

4. Take notice that if you fail to make payment within the stipulated 15 days, my client shall be constrained to initiate criminal proceedings against you under Section 138 of the Negotiable Instruments Act, 1881, before the competent Magistrate, holding you liable for all costs, imprisonment up to two years, and fine up to twice the cheque amount.

Yours faithfully,

{{advocate_name}}
Advocate
Office Address: ___________________________
Contact: ___________________________""",
    },

    # ── 8. AGREEMENTS ────────────────────────────────────────────────────────────
    {
        "title": "Agreement to Sell Immovable Property",
        "category": DraftCategory.AGREEMENT,
        "language": DraftLanguage.ENGLISH,
        "practice_area": "Property Law",
        "subcategory": "Sale Agreement",
        "tags": ["Agreement", "Property", "Sale Deed", "Contract"],
        "content": """AGREEMENT TO SELL

THIS AGREEMENT TO SELL is made and executed on this _____ day of ____________, 2026, at {{court_name}},

BETWEEN:

{{client_name}}, Age: {{client_age}} years, Residing at: {{client_address}}, Aadhaar: {{aadhaar}}, PAN: {{pan}},
(hereinafter called the "FIRST PARTY / VENDOR", which expression shall include their heirs, legal representatives, and assigns) OF THE FIRST PART;

AND

{{opponent_name}}, Age: ______ years, Residing at: ___________________________________,
(hereinafter called the "SECOND PARTY / PURCHASER", which expression shall include their heirs, legal representatives, and assigns) OF THE SECOND PART.

WHEREAS the Vendor is the sole and absolute owner of the immovable property situated at ___________________________ (hereinafter referred to as the "SCHEDULE PROPERTY").

NOW THIS AGREEMENT WITNESSETH AS UNDER:
1. Sale Consideration: The total sale consideration agreed upon between the parties is fixed at Rs. ______/- (Rupees ____________________ only).
2. Earnest Money: The Purchaser has paid earnest money / advance of Rs. ______/- vide Cheque/NEFT No. ______ dated ______, the receipt whereof the Vendor hereby acknowledges.
3. Balance Payment & Execution: The balance amount of Rs. ______/- shall be paid at the time of execution and registration of the final Sale Deed within ______ months from the date hereof.
4. Clear Title: The Vendor covenants that the Schedule Property is free from all encumbrances, liens, mortgages, charges, and litigations.

IN WITNESS WHEREOF, both parties have signed this Agreement in the presence of witnesses.

FIRST PARTY (VENDOR): {{client_name}}
SECOND PARTY (PURCHASER): {{opponent_name}}

WITNESSES:
1. _______________________________
2. _______________________________""",
    },

    # ── 9. VAKALATNAMA ───────────────────────────────────────────────────────────
    {
        "title": "Vakalatnama (Power of Attorney for Court Representation)",
        "category": DraftCategory.VAKALATNAMA,
        "language": DraftLanguage.ENGLISH,
        "practice_area": "General Practice",
        "subcategory": "Vakalatnama",
        "tags": ["Vakalatnama", "Court Authorization", "Bar Council"],
        "content": """VAKALATNAMA
BEFORE THE HON'BLE COURT OF {{court_name}}

CASE / SUIT / APPLICATION NO.: {{case_number}}

{{client_name}}                                     ... PLAINTIFF / PETITIONER / APPLICANT
                    VERSUS
{{opponent_name}}                                   ... DEFENDANT / RESPONDENT

I / We, {{client_name}}, Age: {{client_age}} years, Residing at: {{client_address}}, Aadhaar: {{aadhaar}}, PAN: {{pan}}, the undersigned, do hereby nominate, appoint, retain and authorise:

ADVOCATE: {{advocate_name}}
(Advocate, High Court / District Court)

to be my/our lawful Advocate to act, appear, plead, and conduct the above-entitled case and all proceedings, appeals, reviews, executions, and revisions connected therewith.

I/We authorise the said Advocate to file plaints, petitions, applications, compromises, withdraw proceedings, receive documents and moneys, and sign verification on my/our behalf.

IN WITNESS WHEREOF, I/We have set my/our hands hereto this _____ day of ____________, 2026.

CLIENT / EXECUTANT:
{{client_name}}

ACCEPTED AND FILED BY:
{{advocate_name}}
Advocate
Enrolment No.: _____________________""",
    },

    # ── 10. APPEALS ──────────────────────────────────────────────────────────────
    {
        "title": "Criminal Appeal under Section 374 Cr.P.C.",
        "category": DraftCategory.APPEAL,
        "language": DraftLanguage.ENGLISH,
        "practice_area": "Criminal Law",
        "subcategory": "Appeal",
        "tags": ["Appeal", "CrPC", "Sessions Court", "High Court"],
        "content": """IN THE COURT OF THE HON'BLE SESSIONS JUDGE / HIGH COURT AT {{court_name}}

CRIMINAL APPEAL NO. ______ OF {{case_number}}

IN THE MATTER OF:
{{client_name}},
Age: {{client_age}} years, Residing at: {{client_address}},
Aadhaar: {{aadhaar}}, PAN: {{pan}}
                                                    ... APPELLANT / CONVICT

                    VERSUS

STATE OF MAHARASHTRA / {{opponent_name}}
                                                    ... RESPONDENT

CRIMINAL APPEAL UNDER SECTION 374(2) OF THE CODE OF CRIMINAL PROCEDURE, 1973
AGAINST THE JUDGMENT AND ORDER OF CONVICTION DATED ______ PASSED BY {{judge_name}} IN CASE NO. ______

MOST RESPECTFULLY SHOWETH:

1. That the Appellant is challenging the impugned Judgment and Order of conviction dated ______ whereby the Appellant was convicted under Section ______ and sentenced to undergo rigorous imprisonment for ______ years with fine.

2. Grounds of Appeal:
(a) The Trial Court failed to appreciate the serious contradictions and omissions in the testimonies of the prosecution witnesses.
(b) The prosecution failed to establish the chain of circumstances beyond all reasonable doubt.
(c) The learned Trial Judge erred in holding the Appellant guilty on mere suspicion and surmises.

PRAYER:
The Appellant prays that the appeal be admitted, records called for, the impugned judgment of conviction set aside, and the Appellant acquitted.

APPELLANT:
{{client_name}}

ADVOCATE FOR APPELLANT:
{{advocate_name}}""",
    },

    # ── 11. MOTIONS ──────────────────────────────────────────────────────────────
    {
        "title": "Urgent Motion for Ad-Interim Injunction / Stay",
        "category": DraftCategory.MOTION,
        "language": DraftLanguage.ENGLISH,
        "practice_area": "Civil Law",
        "subcategory": "Injunction Motion",
        "tags": ["Motion", "Order 39", "Injunction", "Stay"],
        "content": """IN THE COURT OF THE HON'BLE {{court_name}}

IN CASE NO.: {{case_number}}

{{client_name}}                                     ... PLAINTIFF / APPLICANT
                    VERSUS
{{opponent_name}}                                   ... DEFENDANT / RESPONDENT

URGENT MOTION UNDER ORDER XXXIX RULES 1 & 2 READ WITH SECTION 151 OF CPC FOR AD-INTERIM EX-PARTE INJUNCTION

THE APPLICANT HUMBLY PRAYS:

1. That the Plaintiff {{client_name}} has filed the accompanying suit for declaration and permanent injunction.

2. That the Defendant {{opponent_name}} is threatening to demolish the boundary wall / alienate the suit property, which will cause irreparable damage and render the suit infructuous.

3. That the prima facie case, balance of convenience, and danger of irreparable injury are all squarely in favour of the Applicant.

PRAYER:
The Applicant prays that this Hon'ble Court be pleased to grant an ad-interim ex-parte order of injunction restraining the Defendant from altering the nature or creating third-party rights in the suit property until the hearing and final disposal of this suit.

APPLICANT:
{{client_name}}

ADVOCATE:
{{advocate_name}}""",
    },
]


def seed_master_templates(db: Session):
    """Ensure all core legal master templates are populated and public."""
    seeded_count = 0
    updated_count = 0

    for item in MASTER_TEMPLATES:
        existing = db.query(Draft).filter(
            Draft.title == item["title"],
            Draft.is_template == True,
        ).first()

        if existing:
            # Ensure it is marked public and active
            if not getattr(existing, "is_public_template", False):
                setattr(existing, "is_public_template", True)
                updated_count += 1
            if getattr(existing, "is_deleted", False):
                setattr(existing, "is_deleted", False)
                updated_count += 1
        else:
            draft = Draft(
                title=item["title"],
                content=item["content"],
                category=item["category"],
                language=item["language"],
                practice_area=item.get("practice_area"),
                subcategory=item.get("subcategory"),
                tags=item.get("tags", []),
                is_template=True,
                is_public_template=True,
                firm_id=None,
                created_by_id=db.query(User.id).first()[0],
                word_count=len(item["content"].split()),
                status="active",
                is_deleted=False,
            )
            db.add(draft)
            seeded_count += 1

    # Also ensure any other template with firm_id=None has is_public_template=True
    unmarked = db.query(Draft).filter(
        Draft.is_template == True,
        Draft.firm_id == None,
        Draft.is_public_template == False,
    ).all()
    for d in unmarked:
        setattr(d, "is_public_template", True)
        updated_count += 1

    db.commit()
    logger.info(f"✅ Master Templates: {seeded_count} new templates seeded, {updated_count} updated.")
    return seeded_count, updated_count
