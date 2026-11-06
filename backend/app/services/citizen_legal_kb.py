"""
app/services/citizen_legal_kb.py
================================
FastCase Citizen Legal Help & Grievance Knowledge Base & Drafting Engine.
Covers 9 core public law domains with authentic statutory provisions,
multilingual guidance (English, Marathi, Hindi), verified official government portals,
evidence checklists, limitation periods, emergency hotlines, and formal
court/department-ready legal application generators.
"""

from typing import Dict, Any, List, Optional
from datetime import datetime


LEGAL_CATEGORIES: Dict[str, Dict[str, Any]] = {
    "police_fir": {
        "id": "police_fir",
        "icon": "ShieldAlert",
        "is_emergency": True,
        "emergency_hotline": "112 / 100",
        "limitation_period": {
            "en": "Immediate for cognizable offenses; Zero FIR can be lodged at any police station across India irrespective of jurisdiction.",
            "mr": "दखलपात्र गुन्ह्यांसाठी तात्काळ; कोणत्याही पोलीस ठाण्यात 'झिरो एफआयआर' (Zero FIR) नोंदवण्याचा नागरिकाला कायदेशीर अधिकार आहे.",
            "hi": "संज्ञेय अपराध में तत्काल; किसी भी थाने में क्षेत्राधिकार की बाध्यता के बिना 'जीरो एफआईआर' दर्ज कराने का अधिकार है।",
        },
        "names": {
            "en": "Police & FIR",
            "mr": "पोलीस आणि एफआयआर (FIR)",
            "hi": "पुलिस एवं प्राथमिकी (FIR)",
        },
        "taglines": {
            "en": "Filing FIR, police inaction, cognizable offenses, and citizen rights",
            "mr": "गुन्ह्याची तक्रार, एफआयआर नोंदणी, पोलिसांची टाळाटाळ आणि कायदेशीर अधिकार",
            "hi": "अपराध की शिकायत, एफआईआर दर्ज कराना, पुलिस द्वारा कार्रवाई न करना व अधिकार",
        },
        "target_authority": {
            "en": "Senior Police Inspector / Officer In-Charge, Local Police Station & Superintendent of Police (SP)",
            "mr": "वरिष्ठ पोलीस निरीक्षक, संबंधित पोलीस ठाणे / पोलीस अधीक्षक (SP)",
            "hi": "वरिष्ठ पुलिस निरीक्षक / थाना प्रभारी, स्थानीय थाना एवं पुलिस अधीक्षक (SP)",
        },
        "default_laws": [
            {"act": "Bharatiya Nagarik Suraksha Sanhita, 2023 (BNSS)", "section": "Section 173", "desc": "Mandatory registration of FIR for cognizable offenses"},
            {"act": "Bharatiya Nagarik Suraksha Sanhita, 2023 (BNSS)", "section": "Section 173(4)", "desc": "Remedy before SP / Commissioner if Police Station refuses to lodge FIR"},
            {"act": "Bharatiya Nagarik Suraksha Sanhita, 2023 (BNSS)", "section": "Section 175(3)", "desc": "Application before Judicial Magistrate to order investigation (Erstwhile 156(3) CrPC)"},
            {"act": "Bharatiya Nyaya Sanhita, 2023 (BNS)", "section": "Section 199", "desc": "Public servant disobeying law with intent to cause injury"},
        ],
        "official_portals": [
            {"name": "National Cyber Crime & Police Citizen Portal", "url": "https://digitalpolice.gov.in", "helpline": "112 / 100"},
            {"name": "Maharashtra Police Citizen Portal", "url": "https://citizen.mahapolice.gov.in", "helpline": "112"},
        ],
        "evidence_checklist": [
            "Proof of incident (Photos, CCTV footage, Audio/Video recordings if any)",
            "Names, contact details, and descriptions of the accused / opposite party",
            "Eye-witness names, contact details, and statement notes",
            "Medical certificate / MLC report in case of physical assault or injury",
            "Copies of prior communications, complaints, or GD entries made earlier",
            "Valid Government Photo ID proof of the Applicant (Aadhaar / Voter ID / Driving License)",
        ],
        "step_by_step": {
            "en": [
                "1. Approach the Police Station having territorial jurisdiction over the place of incident.",
                "2. Submit two signed copies of this formal complaint to the Station House Officer (SHO).",
                "3. Ensure the receiving clerk signs and stamps your duplicate copy with Date and Daily Diary (GD) number.",
                "4. If the officer refuses to lodge an FIR, send this application via Registered Post AD / Speed Post to the Superintendent of Police (SP) or Commissioner of Police under Sec 173(4) BNSS.",
                "5. If inaction persists for 14 days, file an application before the Hon'ble Judicial Magistrate under Sec 175(3) BNSS.",
            ],
            "mr": [
                "१. ज्या पोलीस ठाण्याच्या हद्दीत घटना घडली त्या स्थानिक पोलीस ठाण्यात जावे.",
                "२. या स्वाक्षरी केलेल्या तक्रार अर्जाच्या दोन प्रती पोलीस ठाणे प्रभारी अधिकाऱ्याकडे सादर कराव्यात.",
                "३. अर्जाच्या दुसऱ्या प्रतीवर (Duplicate Copy) पोलीस ठाण्याचा गोल शिक्का, तारीख व स्टेशन डायरी (GD/NC) क्रमांक आवर्जून नोंदवून पोच घ्यावी.",
                "४. पोलिसांनी दखलपात्र गुन्ह्यात एफआयआर नोंदवण्यास नकार दिल्यास, हा अर्ज स्पीड पोस्टाने पोलीस अधीक्षक (SP) किंवा पोलीस आयुक्तांकडे BNSS कलम १७३(४) अन्वये पाठवावा.",
                "५. तरीही कार्यवाही न झाल्यास, प्रथम वर्ग न्यायदंडाधिकारी (JMFC) यांच्या न्यायालयात BNSS कलम १७५(३) अन्वये खासगी तक्रार दाखल करण्याचा हक्क नागरिकाला आहे.",
            ],
            "hi": [
                "१. जिस थाना क्षेत्र में घटना घटी है, वहां के स्थानीय पुलिस थाने में जाएं।",
                "२. इस विधिवत हस्ताक्षरित शिकायत पत्र की दो प्रतियां थाना प्रभारी को प्रस्तुत करें।",
                "३. अपनी दूसरी प्रति (Duplicate copy) पर पुलिस थाने की मुहर, दिनांक और डायरी (GD) नंबर दर्ज करवाकर पावती अनिवार्य रूप से लें।",
                "४. यदि पुलिस एफआईआर दर्ज करने से मना करे, तो यह शिकायत स्पीड पोस्ट द्वारा पुलिस अधीक्षक (SP) या पुलिस कमिश्नर को BNSS धारा १७३(४) के तहत भेजें।",
                "५. फिर भी कार्रवाई न होने पर न्यायिक मजिस्ट्रेट की अदालत में BNSS धारा १७५(३) के तहत प्रार्थना पत्र प्रस्तुत किया जा सकता है।",
            ],
        },
    },

    "women_child": {
        "id": "women_child",
        "icon": "HeartHandshake",
        "is_emergency": True,
        "emergency_hotline": "112 / 1091 / 181 / 1098",
        "limitation_period": {
            "en": "No limitation period for criminal domestic cruelty; Workplace sexual harassment complaint must be filed within 3 months (90 days) under Section 9 POSH Act.",
            "mr": "कौटुंबिक क्रूरतेसाठी कोणतीही मुदत मर्यादा नाही; कामाच्या ठिकाणच्या छळासाठी POSH कायद्यातील कलम ९ नुसार ३ महिन्यांत (९० दिवस) तक्रार करणे आवश्यक.",
            "hi": "घरेलू हिंसा/क्रूरता हेतु कोई समय सीमा नहीं; कार्यस्थल पर प्रताड़ना हेतु POSH एक्ट की धारा ९ के तहत ३ माह (९० दिन) के भीतर शिकायत अनिवार्य।",
        },
        "names": {
            "en": "Women & Child Protection",
            "mr": "महिला आणि बाल संरक्षण",
            "hi": "महिला एवं बाल सुरक्षा",
        },
        "taglines": {
            "en": "Domestic violence, harassment, POSH at workplace, child safety, and maintenance",
            "mr": "कौटुंबिक हिंसाचार, मानसिक छळ, कामाच्या ठिकाणी अत्याचार, बाल सुरक्षा व पोटगी",
            "hi": "घरेलू हिंसा, प्रताड़ना, कार्यस्थल पर लैंगिक उत्पीड़न, बाल सुरक्षा व भरण-पोषण",
        },
        "target_authority": {
            "en": "Protection Officer (Domestic Violence) / District Women & Child Development Officer / Local Police Station",
            "mr": "संरक्षण अधिकारी (कौटुंबिक हिंसाचार प्रतिबंधक कायदा) / महिला व बाल विकास अधिकारी / महिला सेल",
            "hi": "संरक्षण अधिकारी (घरेलू हिंसा) / जिला महिला एवं बाल विकास अधिकारी / महिला थाना",
        },
        "default_laws": [
            {"act": "Protection of Women from Domestic Violence Act, 2005 (PWDVA)", "section": "Section 12, 18, 19, 20", "desc": "Protection orders, residence orders, and monetary relief against domestic abuse"},
            {"act": "Bharatiya Nyaya Sanhita, 2023 (BNS)", "section": "Section 85 & 86", "desc": "Husband or relative of husband subjecting woman to cruelty (Erstwhile 498A IPC)"},
            {"act": "Sexual Harassment of Women at Workplace (Prevention, Prohibition and Redressal) Act, 2013", "section": "Section 9", "desc": "Complaint to Internal Committee (IC) or Local Complaints Committee (LCC)"},
            {"act": "Bharatiya Nagarik Suraksha Sanhita, 2023 (BNSS)", "section": "Section 144", "desc": "Order for maintenance of wives, children, and parents (Erstwhile 125 CrPC)"},
        ],
        "official_portals": [
            {"name": "National Commission for Women (NCW) Online Grievance", "url": "http://ncwapps.nic.in/onlinecomplaintsv2", "helpline": "7827170170 / 1091"},
            {"name": "Ministry of Women & Child Development (SHe-Box)", "url": "https://shebox.wcd.gov.in", "helpline": "1098 (Childline)"},
        ],
        "evidence_checklist": [
            "Marriage certificate, wedding photographs, or proof of cohabitation",
            "Details and proof of domestic violence incidents (Dates, times, medical prescriptions, photographs)",
            "Copies of text messages, WhatsApp chats, call recordings, emails, or threatening letters",
            "List of Streedhan articles, jewelry, gold, bank accounts, and gifts given",
            "Proof of income of the husband / respondent (Salary slip, ITR, property details if accessible)",
            "Applicant's identity and residential proof",
        ],
        "step_by_step": {
            "en": [
                "1. If in immediate danger, dial 112 (Police) or 1091 (Women Helpline) or 181 immediately.",
                "2. Submit this application directly to the Government Protection Officer appointed in your Tehsil/District or nearest Police Station.",
                "3. The Protection Officer is legally bound under Section 9 PWDVA to prepare a Domestic Incident Report (DIR) and file it before the Magistrate within 3 days.",
                "4. For workplace harassment, submit this complaint directly to your employer's Internal Complaints Committee (ICC) or District Local Committee within 90 days.",
            ],
            "mr": [
                "१. तातडीच्या प्रसंगी १०९१ (महिला हेल्पलाईन), १८१ किंवा ११२ वर संपर्क साधावा.",
                "२. हा तक्रार अर्ज आपल्या तालुक्याच्या / जिल्ह्याच्या शासकीय संरक्षण अधिकाऱ्याकडे (Protection Officer) किंवा स्थानिक पोलीस ठाण्यातील महिला कक्षात सादर करावा.",
                "३. कौटुंबिक हिंसाचार कायद्यातील कलम ९ अन्वये संरक्षण अधिकाऱ्याने ३ दिवसांत 'कौटुंबिक घटना अहवाल' (DIR) तयार करून न्यायालयासमोर सादर करणे बंधनकारक आहे.",
                "४. कामाच्या ठिकाणच्या छळाबाबत, हा अर्ज कंपनीच्या / संस्थेच्या 'अंतर्गत तक्रार समिती'कडे (ICC) किंवा जिल्हाधिकाऱ्यांच्या स्थानिक समितीकडे ३ महिन्यांत द्यावा.",
            ],
            "hi": [
                "१. आपातकालीन स्थिति में तुरंत १०९१ (महिला हेल्पलाइन) या ११२ पर कॉल करें।",
                "२. यह शिकायत पत्र अपने जिले/तहसील के संरक्षण अधिकारी (Protection Officer) या महिला थाने में प्रस्तुत करें।",
                "३. संरक्षण अधिकारी घरेलू हिंसा अधिनियम की धारा ९ के तहत तीन दिन के भीतर घरेलू घटना रिपोर्ट (DIR) बनाकर न्यायालय में प्रस्तुत करने के लिए बाध्य हैं।",
                "४. कार्यस्थल पर प्रताड़ना के मामलों में यह शिकायत संबंधित संस्थान की आंतरिक शिकायत समिति (ICC) को ९० दिनों के भीतर दें।",
            ],
        },
    },

    "labour": {
        "id": "labour",
        "icon": "Briefcase",
        "is_emergency": False,
        "emergency_hotline": "14449",
        "limitation_period": {
            "en": "Application for delayed wages within 12 months under Payment of Wages Act Sec 15(2); Gratuity claim within 30 days of leaving employment under Payment of Gratuity Act Sec 7.",
            "mr": "वेतन थकबाकीसाठी १२ महिन्यांच्या आत अर्ज करणे आवश्यक (कलम १५(२)); ग्रॅच्युइटीसाठी नोकरी सोडल्यापासून ३० दिवसांत मागणी करणे आवश्यक.",
            "hi": "बकाया वेतन हेतु १२ माह के भीतर आवेदन अनिवार्य (धारा १५(२)); ग्रेच्युटी दावा कार्यमुक्ति के ३० दिनों के भीतर प्रस्तुत करें।",
        },
        "names": {
            "en": "Labour & Employment Grievances",
            "mr": "कामगार तक्रारी आणि वेतन विवाद",
            "hi": "श्रम एवं रोजगार शिकायतें (वेतन/नौकरी)",
        },
        "taglines": {
            "en": "Unpaid salary, wrongful termination, PF/gratuity denial, and workplace harassment",
            "mr": "थकबाकी पगार, बेकायदेशीर कामावरून काढणे, ग्रॅच्युइटी व पीएफ अडवणूक",
            "hi": "बकाया वेतन, अनुचित बर्खास्तगी, पीएफ व ग्रेच्युटी में देरी",
        },
        "target_authority": {
            "en": "Assistant Labour Commissioner (ALC) / Labour Officer, District Labour Commissionerate",
            "mr": "सहायक कामगार आयुक्त / कामगार अधिकारी, जिल्हा कामगार कार्यालय",
            "hi": "सहायक श्रम आयुक्त / श्रम अधिकारी, जिला श्रम विभाग",
        },
        "default_laws": [
            {"act": "Payment of Wages Act, 1936", "section": "Section 15", "desc": "Claim application for delayed wages or unauthorized salary deductions"},
            {"act": "Industrial Disputes Act, 1947", "section": "Section 2A & 33C(2)", "desc": "Wrongful dismissal, illegal retrenchment, and recovery of monetary dues"},
            {"act": "Payment of Gratuity Act, 1972", "section": "Section 7", "desc": "Mandatory settlement of gratuity within 30 days of leaving employment"},
            {"act": "Employees' Provident Funds and Miscellaneous Provisions Act, 1952", "section": "Section 7A", "desc": "Action against employer for non-deposit of PF deductions"},
        ],
        "official_portals": [
            {"name": "Ministry of Labour & Employment (SAMADHAN Portal)", "url": "https://samadhan.labour.gov.in", "helpline": "14449 (Shram Suvidha)"},
            {"name": "EPFO Grievance Management (EPFiGMS)", "url": "https://epfigms.gov.in", "helpline": "1800 118 005"},
        ],
        "evidence_checklist": [
            "Appointment letter, offer letter, or employment contract",
            "Salary slips of recent months or bank account statements showing salary credits",
            "Employee ID card, official email communications, or WhatsApp messages with employer",
            "Termination notice, resignation letter, or relieving / experience letter requests",
            "PF Account Number / UAN and Universal Gratuity calculations",
            "Company name, registered address, HR manager name, and Director contact details",
        ],
        "step_by_step": {
            "en": [
                "1. Send a formal written demand notice to the Employer giving 7 days to clear pending dues.",
                "2. If dues remain unpaid, submit this application to the Assistant Labour Commissioner (ALC) having jurisdiction over the company's office.",
                "3. The Labour Commissioner will issue a summons to the employer for conciliation within 15 days.",
                "4. If conciliation fails, the ALC issues a failure certificate and refers the matter to the Labour Court for recovery.",
            ],
            "mr": [
                "१. प्रथमतः मालकाला ७ दिवसांत थकीत वेतन देण्याबाबत लेखी नोटीस द्यावी.",
                "२. वेतन न मिळाल्यास, हा अर्ज संबंधित कंपनीच्या कार्यक्षेत्रातील सहायक कामगार आयुक्त (ALC) कार्यालयात सादर करावा.",
                "३. कामगार आयुक्त कंपनी व्यवस्थापनाला प्रत्यक्ष सुनावणीसाठी नोटीस बजावतात.",
                "४. सुनावणीत तोडगा न निघाल्यास, कामगार न्यायालय किंवा महसूल वसुली प्रमाणपत्र (RRC) द्वारे वसुलीचे आदेश दिले जातात.",
            ],
            "hi": [
                "१. सबसे पहले कंपनी/नियोक्ता को बकाया भुगतान हेतु ७ दिनों का कानूनी नोटिस भेजें।",
                "२. भुगतान न मिलने पर, यह प्रार्थना पत्र स्थानीय सहायक श्रम आयुक्त (ALC) कार्यालय में दाखिल करें।",
                "३. श्रम अधिकारी नियोक्ता को सुलह हेतु नोटिस जारी करेंगे।",
                "४. यदि नियोक्ता भुगतान नहीं करता, तो श्रम न्यायालय द्वारा वसूली वारंट (RRC) जारी किया जाता है।",
            ],
        },
    },

    "consumer": {
        "id": "consumer",
        "icon": "ShoppingCart",
        "is_emergency": False,
        "emergency_hotline": "1915",
        "limitation_period": {
            "en": "Must be filed within 2 years from the date on which the cause of action arose under Section 69 of the Consumer Protection Act, 2019.",
            "mr": "ग्राहक संरक्षण कायदा २०१९ च्या कलम ६९ नुसार फसवणूक/त्रुटी घडल्याच्या दिनांकापासून २ वर्षांच्या आत तक्रार दाखल करणे आवश्यक.",
            "hi": "उपभोक्ता संरक्षण अधिनियम २०१९ की धारा ६९ के अनुसार कारण उत्पन्न होने की तिथि से २ वर्ष के भीतर परिवाद दायर करना अनिवार्य।",
        },
        "names": {
            "en": "Consumer Complaints & Disputes",
            "mr": "ग्राहक तक्रार आणि फसवणूक निवारण",
            "hi": "उपभोक्ता शिकायत एवं मुआवजा",
        },
        "taglines": {
            "en": "Defective goods, deficient service, builder delay, insurance claim rejection, and online shopping fraud",
            "mr": "खराब वस्तू, सेवेतील त्रुटी, बिल्डरने ताबा न देणे, विम्यातील फसवणूक आणि ई-कॉमर्स नुकसान",
            "hi": "खराब सामान, सेवा में कमी, बिल्डर द्वारा देरी, बीमा क्लेम खारिज व ऑनलाइन फ्रॉड",
        },
        "target_authority": {
            "en": "District Consumer Disputes Redressal Commission (DCDRC) / National Consumer Helpline",
            "mr": "जिल्हा ग्राहक तक्रार निवारण आयोग / राष्ट्रीय ग्राहक मंच",
            "hi": "जिला उपभोक्ता विवाद प्रतितोष आयोग / राष्ट्रीय उपभोक्ता हेल्पलाइन",
        },
        "default_laws": [
            {"act": "Consumer Protection Act, 2019", "section": "Section 35", "desc": "Filing of consumer complaint before District Commission for claim up to ₹50 Lakhs"},
            {"act": "Consumer Protection Act, 2019", "section": "Section 2(11) & 2(47)", "desc": "Definition of deficiency in service and unfair trade practices"},
            {"act": "Consumer Protection Act, 2019", "section": "Section 69", "desc": "2-Year Limitation period for admitting consumer complaints"},
            {"act": "Real Estate (Regulation and Development) Act, 2016 (RERA)", "section": "Section 18 & 31", "desc": "Compensation with interest for delay in handing over apartment / property"},
        ],
        "official_portals": [
            {"name": "National Consumer Helpline (NCH / INGRAM)", "url": "https://consumerhelpline.gov.in", "helpline": "1915 / 1800-11-4000"},
            {"name": "e-Daakhil Online Consumer Court Filing", "url": "https://edaakhil.nic.in", "helpline": "1915"},
        ],
        "evidence_checklist": [
            "Tax Invoice, receipt, cash memo, or online order confirmation",
            "Warranty card, guarantee terms, or service agreement copy",
            "Photographs / video proof of defective product or incomplete work",
            "Written correspondence (Emails, customer support tickets, WhatsApp chats, formal notices sent)",
            "Bank transaction statement proving payment of consideration",
            "Estimate of financial loss, mental agony, and compensation claimed",
        ],
        "step_by_step": {
            "en": [
                "1. Lodge an initial online complaint on the National Consumer Helpline portal (consumerhelpline.gov.in) or call 1915.",
                "2. Send this formal Consumer Notice giving 15 days to the seller/company to rectify the defect or refund.",
                "3. If they refuse, file this complaint on the official e-Daakhil portal (edaakhil.nic.in) or submit directly to your District Consumer Forum.",
                "4. Claims up to ₹50 Lakhs are heard by the District Commission; claims from ₹50 Lakhs to ₹2 Crores go to the State Commission.",
            ],
            "mr": [
                "१. प्रथम राष्ट्रीय ग्राहक हेल्पलाईनवर (१९१५) किंवा consumerhelpline.gov.in वर तक्रार नोंदवून Docket क्रमांक मिळवावा.",
                "२. संबंधित कंपनी/व्यापाऱ्यास हा कायदेशीर नोटीस अर्ज पाठवून १५ दिवसांत भरपाई किंवा परतावा देण्याची मागणी करावी.",
                "३. समाधान न झाल्यास, e-Daakhil (edaakhil.nic.in) पोर्टलवरून किंवा जिल्हा ग्राहक आयोगात प्रत्यक्ष तक्रार दाखल करावी.",
                "४. ₹५० लाखांपर्यंतच्या दाव्यांची सुनावणी जिल्हा आयोगात होते.",
            ],
            "hi": [
                "१. सर्वप्रथम राष्ट्रीय उपभोक्ता हेल्पलाइन (१९१५) अथवा consumerhelpline.gov.in पर शिकायत दर्ज करें।",
                "२. विक्रेता/कंपनी को यह विधिक नोटिस देकर १५ दिनों में समाधान अथवा रिफंड की मांग करें।",
                "३. समाधान न होने पर ई-दाखिल पोर्टल (edaakhil.nic.in) के माध्यम से या जिला उपभोक्ता आयोग में सीधे परिवाद दाखिल करें।",
                "४. ₹५० लाख तक के मामलों की सुनवाई जिला उपभोक्ता आयोग करता है।",
            ],
        },
    },

    "municipal": {
        "id": "municipal",
        "icon": "Building2",
        "is_emergency": False,
        "emergency_hotline": "1800 120 8040",
        "limitation_period": {
            "en": "Time-bound redressal within 15 to 30 days under Maharashtra Right to Public Services Act, 2015.",
            "mr": "महाराष्ट्र लोकसेवा हक्क कायदा २०१५ नुसार १५ ते ३० दिवसांच्या विहित मुदतीत नागरी तक्रार निवारण बंधनकारक.",
            "hi": "महाराष्ट्र लोकसेवा गारंटी कानून के तहत १५ से ३० दिनों के भीतर नागरिक समस्या निवारण अनिवार्य।",
        },
        "names": {
            "en": "Municipal Corporation & Civic Grievances",
            "mr": "महानगरपालिका आणि नागरी समस्या",
            "hi": "नगर निगम एवं नागरिक समस्याएं",
        },
        "taglines": {
            "en": "Illegal construction, drainage overflow, water supply, road potholes, and unauthorized encroachment",
            "mr": "अनधिकृत बांधकाम, गटार/कचरा समस्या, दूषित पाणीपुरवठा, खड्डे आणि सार्वजनिक रस्त्यावरील अतिक्रमण",
            "hi": "अवैध निर्माण, सीवर/गंदगी, दूषित पेयजल, सड़कों के गड्ढे व अवैध अतिक्रमण",
        },
        "target_authority": {
            "en": "Ward Officer / Assistant Municipal Commissioner, Municipal Corporation / Nagar Parishad",
            "mr": "प्रभाग अधिकारी / सहायक आयुक्त, महानगरपालिका / नगरपालिका कार्यालय",
            "hi": "वार्ड अधिकारी / सहायक नगर आयुक्त, नगर निगम / नगर पालिका",
        },
        "default_laws": [
            {"act": "Maharashtra Municipal Corporations Act, 1949 / Municipalities Act", "section": "Section 260 & 267", "desc": "Demolition and stop-work notice for unauthorized illegal structures"},
            {"act": "Maharashtra Right to Public Services Act, 2015", "section": "Section 3 & 4", "desc": "Time-bound delivery of notified civic services to citizens"},
            {"act": "Environment (Protection) Act, 1986", "section": "Section 15", "desc": "Action against hazardous pollution, open garbage dumping, and sewage overflow"},
        ],
        "official_portals": [
            {"name": "Maharashtra Aaple Sarkar Civic Grievances", "url": "https://grievances.maharashtra.gov.in", "helpline": "1800 120 8040"},
            {"name": "Swachhata App & Ministry of Housing & Urban Affairs", "url": "https://swachhatah-app.org", "helpline": "1969"},
        ],
        "evidence_checklist": [
            "Clear geo-tagged photographs / video of the civic hazard, illegal construction, or garbage dumping",
            "Exact location, ward number, street name, and nearby prominent landmarks",
            "Copies of earlier letters, complaints, or online token numbers submitted to the ward office",
            "Signatures of affected local residents / society members if community issue",
            "Applicant's address and identity proof",
        ],
        "step_by_step": {
            "en": [
                "1. Submit this application to your local Ward Officer / Assistant Commissioner in duplicate.",
                "2. Obtain an inward stamp and Inward Number on your office copy.",
                "3. Simultaneously upload the grievance on Aaple Sarkar / Swachhata portal.",
                "4. If no inspection or action is initiated within 7 days, submit an escalation letter to the Municipal Commissioner and City Police.",
            ],
            "mr": [
                "१. हा अर्ज आपल्या प्रभाग कार्यालयातील (Ward Office) सहायक आयुक्तांकडे दोन प्रतीत सादर करावा.",
                "२. आवक-जावक (Inward) विभागाकडून तारीख व आवक क्रमांकाचा शिक्का आपल्या प्रतीवर घ्यावा.",
                "३. सोबतच 'आपले सरकार' पोर्टलवर ऑनलाईन तक्रार नोंदवावी.",
                "४. ७ दिवसांत जागेची पाहणी किंवा कारवाई न झाल्यास, थेट महापालिका आयुक्तांकडे प्रथम अपील अर्ज सादर करावा.",
            ],
            "hi": [
                "१. यह शिकायत पत्र अपने स्थानीय वार्ड कार्यालय / सहायक आयुक्त कार्यालय में दो प्रतियों में जमा करें।",
                "२. आवक (Inward) अनुभाग से अपनी प्रति पर मुहर और पावती क्रमांक अवश्य लें।",
                "३. 'आपले सरकार' या स्वच्छता ऐप पर भी यह शिकायत दर्ज करें।",
                "४. यदि ७ दिनों में कार्रवाई नहीं होती, तो सीधे नगर आयुक्त के समक्ष अपील प्रस्तुत करें।",
            ],
        },
    },

    "rti_govt": {
        "id": "rti_govt",
        "icon": "FileText",
        "is_emergency": False,
        "emergency_hotline": "1800 120 8040",
        "limitation_period": {
            "en": "Public Information Officer (PIO) must supply information within 30 days (48 hours for life/liberty). First Appeal within 30 days under Sec 19(1). Second Appeal within 90 days under Sec 19(3).",
            "mr": "माहिती अधिकाऱ्याने ३० दिवसांत (जीवित व व्यक्तीस्वातंत्र्याबाबत ४८ तासांत) माहिती देणे बंधनकारक. प्रथम अपील ३० दिवसांत व द्वितीय अपील ९० दिवसांत करणे आवश्यक.",
            "hi": "जन सूचना अधिकारी द्वारा ३० दिनों (जीवन व स्वतंत्रता से जुड़े मामलों में ४८ घंटों) में सूचना देना अनिवार्य। प्रथम अपील ३० दिनों व द्वितीय अपील ९० दिनों के भीतर।",
        },
        "names": {
            "en": "RTI & Public Department Grievances",
            "mr": "माहितीचा अधिकार (RTI) आणि शासकीय विभाग",
            "hi": "सूचना का अधिकार (RTI) एवं सरकारी विभाग",
        },
        "taglines": {
            "en": "Government file delays, official record access under RTI Act, and administrative inaction",
            "mr": "शासकीय कामातील दिरंगाई, आरटीआय अर्ज, सरकारी नस्ती पाहणी व भ्रष्टाचाराची तक्रार",
            "hi": "सरकारी काम में देरी, आरटीआई से रिकॉर्ड प्राप्त करना व प्रशासनिक लापरवाही",
        },
        "target_authority": {
            "en": "Public Information Officer (PIO), Respective Government Department / Collectorate",
            "mr": "जन माहिती अधिकारी (PIO) / प्रथम अपीलीय अधिकारी, संबंधित शासकीय विभाग किंवा जिल्हाधिकारी कार्यालय",
            "hi": "जन सूचना अधिकारी (PIO) / प्रथम अपीलीय अधिकारी, संबंधित विभाग अथवा कलेक्ट्रेट",
        },
        "default_laws": [
            {"act": "Right to Information Act, 2005", "section": "Section 6(1)", "desc": "Application for obtaining certified information / government records within 30 days"},
            {"act": "Right to Information Act, 2005", "section": "Section 7(1)", "desc": "Provision of information concerning life and liberty within 48 hours, otherwise within 30 days"},
            {"act": "Right to Information Act, 2005", "section": "Section 19(1)", "desc": "First Appeal before Appellate Authority within 30 days if information denied or delayed"},
            {"act": "Right to Information Act, 2005", "section": "Section 20", "desc": "Penalties of ₹250 per day up to ₹25,000 on PIO for willful delay"},
        ],
        "official_portals": [
            {"name": "Central RTI Online Portal", "url": "https://rtionline.gov.in", "helpline": "011-24622691"},
            {"name": "Maharashtra RTI Online Portal", "url": "https://rtionline.maharashtra.gov.in", "helpline": "1800 120 8040"},
            {"name": "CPGRAMS Central Public Grievance Portal", "url": "https://pgportal.gov.in", "helpline": "1800 11 0031"},
        ],
        "evidence_checklist": [
            "Specific list of precise questions or certified file copies sought (Points 1, 2, 3...)",
            "Application fee proof: ₹10 Court Fee Stamp (for offline Maharashtra RTI) / IPO / Online payment receipt",
            "BPL Card copy (if claiming fee exemption as Below Poverty Line)",
            "Copies of earlier letters, application references, or scheme tracking numbers",
            "Applicant's valid postal address and phone number for reply by registered post",
        ],
        "step_by_step": {
            "en": [
                "1. Affix a ₹10 Court Fee Stamp or Indian Postal Order (IPO) on the application (Free for BPL card holders).",
                "2. Submit to the Public Information Officer (PIO) of the concerned department in person or by Speed Post.",
                "3. By law under Section 7(1), the PIO must provide the information or reject it within 30 days.",
                "4. If no reply is received within 30 days, or if false information is given, file a First Appeal under Section 19(1) to the First Appellate Authority (FAA).",
            ],
            "mr": [
                "१. अर्जावर ₹१० चे कोर्ट फी स्टॅम्प (Court Fee Stamp) चिकटवावे (दारिद्र्यरेषेखालील नागरिकांना मोफत).",
                "२. संबंधित विभागाच्या जन माहिती अधिकाऱ्याकडे (PIO) समक्ष पोच घेऊन किंवा स्पीड पोस्टाने अर्ज पाठवावा.",
                "३. कायद्यातील कलम ७(१) नुसार ३० दिवसांच्या आत माहिती देणे किंवा कारणांसह नकार देणे अधिकाऱ्यावर बंधनकारक आहे.",
                "४. ३० दिवसांत माहिती न मिळाल्यास किंवा खोटी माहिती दिल्यास, वरिष्ठ अधिकाऱ्याकडे कलम १९(१) अन्वये प्रथम अपील दाखल करावे.",
            ],
            "hi": [
                "१. आवेदन पर ₹१० का कोर्ट फीस स्टाम्प या पोस्टल आर्डर लगाएं (बीपीएल कार्डधारकों के लिए निशुल्क)।",
                "२. संबंधित विभाग के जन सूचना अधिकारी (PIO) को व्यक्तिगत रूप से पावती लेकर अथवा स्पीड पोस्ट से भेजें।",
                "३. धारा ७(१) के अंतर्गत ३० दिनों के भीतर जानकारी उपलब्ध कराना अनिवार्य है।",
                "४. समय पर जानकारी न मिलने पर वरिष्ठ अधिकारी के समक्ष धारा १९(१) के तहत प्रथम अपील दायर करें।",
            ],
        },
    },

    "property": {
        "id": "property",
        "icon": "Home",
        "is_emergency": False,
        "emergency_hotline": "1800 120 8040",
        "limitation_period": {
            "en": "Suit under Section 6 Specific Relief Act within 6 months of illegal dispossession; Rent control eviction immediately upon expiry of registered Leave & License.",
            "mr": "बेकायदेशीर बेदखल केल्यास ६ महिन्यांच्या आत विशिष्ट साहाय्य कायद्याच्या कलम ६ अन्वये दावा दाखल करावा लागतो.",
            "hi": "अवैध बेदखली के ६ माह के भीतर विशिष्ट अनुतोष अधिनियम की धारा ६ के तहत वाद दायर करना अनिवार्य।",
        },
        "names": {
            "en": "Property & Tenancy Disputes",
            "mr": "मालमत्ता, जमीन आणि भाडेकरार विवाद",
            "hi": "संपत्ति, भूमि एवं किरायेदारी विवाद",
        },
        "taglines": {
            "en": "Illegal eviction, unauthorized possession, land mutation (7/12), deposit return, and boundary disputes",
            "mr": "घर रिकामे करण्यास दमदाटी, अनामत रक्कम (Deposit) अडवणूक, ७/१२ फेरफार व हक्कसोड विवाद",
            "hi": "जबरन मकान खाली कराना, सिक्योरिटी डिपॉजिट न लौटना, जमीन विवाद व नामांतरण",
        },
        "target_authority": {
            "en": "Competent Authority (Rent Control) / Tahsildar & Sub-Divisional Officer (SDO) / Civil Court",
            "mr": "सक्षम प्राधिकारी (भाडे नियंत्रण) / तहसीलदार व उपविभागीय अधिकारी (SDO) / दिवाणी न्यायालय",
            "hi": "सक्षम प्राधिकारी (किराया नियंत्रण) / तहसीलदार व उपजिलाधिकारी (SDO) / सिविल कोर्ट",
        },
        "default_laws": [
            {"act": "Maharashtra Rent Control Act, 1999", "section": "Section 24 & 22", "desc": "Eviction of licensee on expiry of license and recovery of double license fee for illegal stay"},
            {"act": "Transfer of Property Act, 1882", "section": "Section 106", "desc": "Mandatory notice to quit before termination of lease"},
            {"act": "Specific Relief Act, 1963", "section": "Section 6", "desc": "Suit by person dispossessed of immovable property without due process of law"},
            {"act": "Maharashtra Land Revenue Code, 1966", "section": "Section 149 & 150", "desc": "Mutation entries in Record of Rights (7/12) and dispute resolution before Revenue Officers"},
        ],
        "official_portals": [
            {"name": "Maharashtra Bhulekh (7/12 & 8A Online Records)", "url": "https://bhulekh.mahabhumi.gov.in", "helpline": "1800 120 8040"},
            {"name": "IGR Maharashtra e-Registration & Search", "url": "https://igrmaharashtra.gov.in", "helpline": "020-26050011"},
        ],
        "evidence_checklist": [
            "Registered Agreement for Sale, Leave & License Agreement, or Lease Deed",
            "Latest 7/12 Extract, 8A Extract, Property Card (PR Card), or Society Share Certificate",
            "Rent payment receipts, bank transfer UTR records, or security deposit deposit slips",
            "Electricity bills, water bills, or property tax receipts proving lawful physical possession",
            "Police complaint copy in case of illegal threats, lockout, or criminal trespass",
            "Photographs of boundary, site, locks, or disputed structure",
        ],
        "step_by_step": {
            "en": [
                "1. If landlord changes locks or cuts water/electricity illegally, lodge an immediate police complaint under Sec 329/351 BNS (Criminal Trespass/Intimidation).",
                "2. Serve a formal Legal Demand Notice giving 15 days to refund deposit or vacate.",
                "3. For registered Leave & License in Maharashtra, file an application before the Competent Authority (Rent Act).",
                "4. For agricultural land disputes, file a suit before the Tahsildar under Section 5 of the Mamlatdar's Courts Act.",
            ],
            "mr": [
                "१. घरमालकाने बेकायदेशीरपणे कुलूप लावल्यास किंवा वीज/पाणी कापल्यास तत्काळ पोलीस ठाण्यात फौजदारी तक्रार द्यावी.",
                "२. वकिलामार्फत किंवा स्वतः हा कायदेशीर नोटीस अर्ज पाठवून १५ दिवसांत अनामत रक्कम परत मागवी.",
                "३. नोंदणीकृत भाडेकरारातील वादांसाठी 'सक्षम प्राधिकारी (भाडे नियंत्रण)' यांच्याकडे अर्ज करावा.",
                "४. शेती रस्त्याच्या किंवा हद्दीच्या वादासाठी तहसीलदार न्यायालयात 'मामलतदार कोर्ट ॲक्ट' कलम ५ अन्वये दावा दाखल करावा.",
            ],
            "hi": [
                "१. यदि मकान मालिक बिजली/पानी काटे या ताला बदले तो तुरंत पुलिस में आपराधिक अतिचार की शिकायत दर्ज करें।",
                "२. इस विधिक नोटिस को भेजकर १५ दिनों में डिपॉजिट वापसी अथवा शांतिपूर्ण समाधान की मांग करें।",
                "३. पंजीकृत किरायेदारी में सक्षम प्राधिकारी (रेंट कंट्रोल) के समक्ष आवेदन किया जाता है।",
                "४. जमीन व नामांतरण के मामलों में तहसीलदार / एसडीएम अदालत में वाद प्रस्तुत करें।",
            ],
        },
    },

    "cybercrime": {
        "id": "cybercrime",
        "icon": "Laptop",
        "is_emergency": True,
        "emergency_hotline": "1930 (Golden Hour Helpline)",
        "limitation_period": {
            "en": "Call 1930 immediately within the first 2-3 hours ('Golden Hour') to freeze funds; Notify your bank within 3 working days for 100% Zero Liability under RBI guidelines.",
            "mr": "फसवणूक झाल्यानंतर पहिल्या २-३ तासांत (गोल्डन अवर) १९३० वर कॉल करावा; आरबीआय नियमांनुसार ३ दिवसांच्या आत बँकेस कळवल्यास ग्राहकावर शून्य दायित्व (Zero Liability) राहते.",
            "hi": "धोखाधड़ी के तुरंत बाद पहले २-३ घंटों ('गोल्डन ऑवर') में १९३० पर कॉल करें; आरबीआई दिशानिर्देशों के अनुसार ३ दिनों के भीतर बैंक को सूचित करने पर ग्राहक की कोई देनदारी नहीं होती।",
        },
        "names": {
            "en": "Cybercrime & Online Financial Fraud",
            "mr": "सायबर गुन्हे आणि ऑनलाईन आर्थिक फसवणूक",
            "hi": "साइबर अपराध एवं ऑनलाइन वित्तीय धोखाधड़ी",
        },
        "taglines": {
            "en": "UPI fraud, phishing, OTP scams, fake social media accounts, blackmail, and credit card theft",
            "mr": "युपीआय (UPI) फसवणूक, ओटीपी चोरी, बनावट प्रोफाईल, ब्लॅकमेलिंग आणि बँक खाते हॅक",
            "hi": "यूपीआई फ्रॉड, बैंक खाता हैक, ओटीपी धोखा, सोशल मीडिया ब्लैकमेल व फर्जी काल",
        },
        "target_authority": {
            "en": "National Cyber Crime Reporting Portal & Cyber Crime Police Station / Economic Offences Wing",
            "mr": "राष्ट्रीय सायबर तक्रार पोर्टल (१९३०) व स्थानिक सायबर पोलीस ठाणे / आर्थिक गुन्हे शाखा (EOW)",
            "hi": "राष्ट्रीय साइबर क्राइम पोर्टल (१९३०) एवं साइबर पुलिस थाना / आर्थिक अपराध शाखा",
        },
        "default_laws": [
            {"act": "Information Technology Act, 2000", "section": "Section 66C & 66D", "desc": "Identity theft and cheating by personation by using computer resource"},
            {"act": "Information Technology Act, 2000", "section": "Section 43 & 66", "desc": "Penalty for damage to computer systems and unauthorized data extraction"},
            {"act": "Bharatiya Nyaya Sanhita, 2023 (BNS)", "section": "Section 318(4)", "desc": "Cheating and dishonestly inducing delivery of property (Erstwhile 420 IPC)"},
            {"act": "Reserve Bank of India (RBI) Circular", "section": "DBR.No.Leg.BC.78/09.07.005", "desc": "Zero customer liability if unauthorized transaction reported within 3 days"},
        ],
        "official_portals": [
            {"name": "National Cyber Crime Reporting Portal (MHA)", "url": "https://cybercrime.gov.in", "helpline": "1930 (Golden Hour Helpline)"},
            {"name": "Chakshu Portal for Reporting Fraud Calls & SMS", "url": "https://sancharsaathi.gov.in/sfc", "helpline": "1930"},
        ],
        "evidence_checklist": [
            "Complete Bank Account Statement showing debit amount, timestamp, and UTR / Reference ID",
            "SMS alerts received from the bank or payment gateway",
            "Screenshots of UPI app payment confirmation (Google Pay / PhonePe / Paytm)",
            "WhatsApp chats, Telegram messages, emails, or fraudulent call recording",
            "Phone numbers, UPI handles, or fraudulent website links involved",
            "Transaction dispute reference number issued by your home bank",
        ],
        "step_by_step": {
            "en": [
                "1. IMMEDIATELY dial 1930 within the 'Golden Hour' (first 2-3 hours) so nodal officers can freeze the money in the recipient's bank account.",
                "2. Call your home bank customer care immediately to block your debit/credit card, UPI, and net banking credentials.",
                "3. File this official complaint on cybercrime.gov.in and download the official Acknowledgement PDF.",
                "4. Submit this printed application along with bank statement to your nearest Police Station / Cyber Cell to lodge an FIR.",
            ],
            "mr": [
                "१. फसवणूक होताच पहिल्या २-३ तासांत (गोल्डन अवर) १९३० या हेल्पलाईनवर फोन करा, जेणेकरून पैसे भामट्याच्या खात्यात गोठवले (Freeze) जातात.",
                "२. तत्काळ स्वतःच्या बँकेला फोन करून कार्ड, युपीआय व नेटबँकिंग ब्लॉक करा आणि 'Dispute Form' भरा.",
                "३. cybercrime.gov.in वर ऑनलाइन तक्रार नोंदवून पोच पावती (Ack Number) डाऊनलोड करा.",
                "४. हा छापील तक्रार अर्ज बँक स्टेटमेंटसह स्थानिक सायबर पोलीस ठाण्यात सादर करून FIR नोंदवा.",
            ],
            "hi": [
                "१. घटना घटते ही तुरंत १९३० हेल्पलाइन पर कॉल करें ताकि आरोपी के खाते में पैसा होल्ड/फ्रीज कराया जा सके।",
                "२. अपने बैंक कस्टमर केयर को तुरंत सूचना देकर अपना कार्ड व नेटबैंकिंग ब्लॉक करवाएं।",
                "३. cybercrime.gov.in पोर्टल पर तुरंत शिकायत दर्ज कर एक्नॉलेजमेंट नंबर प्राप्त करें।",
                "४. यह शिकायत पत्र बैंक स्टेटमेंट सहित निकटतम साइबर पुलिस स्टेशन में प्रस्तुत कर प्राथमिकी दर्ज करवाएं।",
            ],
        },
    },

    "legal_aid": {
        "id": "legal_aid",
        "icon": "Scale",
        "is_emergency": False,
        "emergency_hotline": "15100",
        "limitation_period": {
            "en": "No limitation. Free legal assistance is available at all stages: pre-litigation, trial, appeal, and execution.",
            "mr": "कोणतीही मुदत मर्यादा नाही. खटल्यापूर्वी, सुनावणीदरम्यान अथवा अपीलाच्या कोणत्याही टप्प्यावर मोफत विधी सेवा उपलब्ध आहे.",
            "hi": "कोई समय सीमा नहीं। वाद-पूर्व, विचारण, अपील अथवा निष्पादन के किसी भी चरण में निशुल्क सहायता उपलब्ध है।",
        },
        "names": {
            "en": "Free Legal Aid & Lok Adalat",
            "mr": "मोफत कायदेशीर मदत (विधी सेवा) व लोक न्यायालय",
            "hi": "मुफ्त कानूनी सहायता एवं लोक अदालत",
        },
        "taglines": {
            "en": "Free government advocate, fee waiver, court assistance for poor, women, and Lok Adalat settlement",
            "mr": "मोफत सरकारी वकील, कोर्ट फी माफी, महिला व दुर्बल घटकांना मोफत विधी सहाय्य",
            "hi": "सरकारी खर्चे पर मुफ्त वकील, कोर्ट फीस माफी एवं लोक अदालत समझौता",
        },
        "target_authority": {
            "en": "District Legal Services Authority (DLSA) / Taluka Legal Services Committee (TLSC)",
            "mr": "जिल्हा विधी सेवा प्राधिकरण (DLSA) / तालुका विधी सेवा समिती, न्यायालय आवार",
            "hi": "जिला विधिक सेवा प्राधिकरण (DLSA) / तालुका विधिक सेवा समिति, न्यायालय परिसर",
        },
        "default_laws": [
            {"act": "Legal Services Authorities Act, 1987", "section": "Section 12", "desc": "Criteria for giving free legal services: Women, children, SC/ST, custody, income below ₹3 Lakhs"},
            {"act": "Legal Services Authorities Act, 1987", "section": "Section 19 & 21", "desc": "Settlement of disputes in Lok Adalat with full refund of court fees"},
            {"act": "Constitution of India", "section": "Article 39A", "desc": "Directive Principle of State Policy for Equal justice and free legal aid"},
        ],
        "official_portals": [
            {"name": "National Legal Services Authority (NALSA) Online Legal Aid Portal", "url": "https://nalsa.gov.in", "helpline": "15100 (Toll-Free National Legal Aid)"},
            {"name": "Maharashtra State Legal Services Authority (MSLSA)", "url": "https://legalservices.maharashtra.gov.in", "helpline": "15100"},
        ],
        "evidence_checklist": [
            "Proof of eligibility under Section 12 (Aadhaar / Caste Certificate / Ration Card / Income Certificate below ₹3 Lakhs)",
            "Women, children, and victims of trafficking are eligible for free legal aid irrespective of income",
            "Copies of court notices, summons, or legal dispute papers received",
            "Applicant's contact details and postal address",
        ],
        "step_by_step": {
            "en": [
                "1. Every woman, child, SC/ST individual, or person having annual income less than ₹3 Lakhs is entitled to a FREE government advocate.",
                "2. Submit this application directly to the DLSA office situated inside your District Court premises or dial 15100.",
                "3. DLSA will assign an experienced panel advocate within 7 working days without charging you a single rupee.",
                "4. All court fees, drafting expenses, and advocate fees are borne directly by the Government of India.",
            ],
            "mr": [
                "१. प्रत्येक महिला, बालक, अनुसूचित जाती/जमाती व ₹३ लाखांपेक्षा कमी वार्षिक उत्पन्न असणाऱ्या नागरिकाला मोफत वकील मिळण्याचा घटनात्मक अधिकार आहे.",
                "२. हा अर्ज जिल्हा न्यायालय परिसरातील 'जिल्हा विधी सेवा प्राधिकरण' (DLSA) कार्यालयात सादर करावा किंवा १५१०० वर फोन करावा.",
                "३. विधी सेवा प्राधिकरण ७ दिवसांत मोफत पॅनेल वकिलाची नियुक्ती करते.",
                "४. वकिलाची फी, कोर्ट फी व टंकलेखनाचा सर्व खर्च शासन करते; नागरिकाकडून एकही रुपया घेतला जात नाही.",
            ],
            "hi": [
                "१. प्रत्येक महिला, बच्चे, अनुसूचित जाति/जनजाति और ₹३ लाख से कम आय वाले नागरिकों को निशुल्क सरकारी वकील पाने का कानूनी अधिकार है।",
                "२. यह प्रार्थना पत्र जिला न्यायालय स्थित जिला विधिक सेवा प्राधिकरण (DLSA) कार्यालय में दें अथवा १५१०० पर कॉल करें।",
                "३. विधिक सेवा प्राधिकरण ७ कार्यदिवसों में आपके लिए नि:शुल्क वरिष्ठ वकील नियुक्त करेगा।",
                "४. केस का समस्त खर्च सरकार वहन करती है, नागरिक से कोई शुल्क नहीं लिया जाता।",
            ],
        },
    },
}


# ─── Enhanced Problem Classification Keywords Engine ──────────────────────────

def classify_citizen_problem(query_text: str) -> Dict[str, Any]:
    """
    Intelligently match free-text description (in English, Marathi, or Hindi)
    to the correct legal category, applicable laws, forum, and key actions.
    Uses comprehensive synonym weights across official and colloquial terminology.
    """
    q = (query_text or "").lower()

    scores = {cat: 0 for cat in LEGAL_CATEGORIES}

    # 1. Cybercrime keywords
    cyber_keys = [
        "cyber", "online", "upi", "gpay", "google pay", "phonepe", "paytm", "hack", "otp", "phishing",
        "fraud", "पैसे कापले", "ओटीपी", "सायबर", "फसवणूक", "ऑनलाइन", "खाते रिकामे", "धोखाधड़ी",
        "खाता हैक", "साइबर क्राइम", "युपीआय", "ब्लॅकमेल", "अज्ञात व्यक्ती", "अज्ञात व्यक्ति", "अज्ञात",
        "बनावट कॉल", "apk", "लूट", "फोन पे", "फोनपे", "गूगल पे", "गुगल पे", "पेटीएम", "फर्जी लिंक",
        "बनावट लिंक", "लिंक", "link", "पैसे उड़ा", "खाते से पैसे", "खात्यातून पैसे", "रुपये कटले",
        "पैसे ट्रान्सफर", "क्रेडिट कार्ड", "डेबिट कार्ड", "एटीएम", "केवायसी", "kyc", "लॉटरी फ्रॉड"
    ]
    for k in cyber_keys:
        if k in q:
            scores["cybercrime"] += 6

    # 2. Women & Child keywords
    wc_keys = [
        "domestic violence", "husband", "in-laws", "cruelty", "498a", "posh", "sexual harassment",
        "child", "custody", "maintenance", "पोटगी", "छळ", "कौटुंबिक हिंसाचार", "नवरा", "सासरचे",
        "घरेलू हिंसा", "दहेज", "भरण-पोषण", "सासरे", "सासू", "दीर", "पती", "स्त्रीधन", "हुंडा", "मारहाण सासर",
        "प्रताड़ना", "ससुराल"
    ]
    for k in wc_keys:
        if k in q:
            scores["women_child"] += 6

    # 3. Labour keywords
    labour_keys = [
        "salary", "unpaid", "wages", "fired", "terminated", "gratuity", "pf", "provident fund",
        "labour", "boss", "company not paying", "पगार", "वेतन", "कामावरून काढले", "ग्रॅच्युइटी",
        "मालक पगार देत नाही", "नौकरी", "बर्खास्त", "वेतन नहीं", "नौकरी से निकाला", "बकाया वेतन", "कंत्राटी",
        "वेतन रोक", "कर्मचारी", "कामगार"
    ]
    for k in labour_keys:
        if k in q:
            scores["labour"] += 6

    # 4. Consumer keywords
    consumer_keys = [
        "consumer", "defective", "refund", "builder", "flat", "possession", "warranty", "flipkart",
        "amazon", "insurance claim", "ग्राहक", "खराब वस्तू", "परतावा", "फ्लॅट", "बिल्डर", "विमा",
        "उपभोक्ता", "दुकानदार", "पजेशन", "ताबा देत नाही", "नकली सामान", "क्लेम रिजेक्ट", "वॉरंटी",
        "replacement", "ग्राहकमंच", "खराब सामान"
    ]
    for k in consumer_keys:
        if k in q:
            scores["consumer"] += 6

    # 5. Municipal keywords
    municipal_keys = [
        "drainage", "garbage", "pothole", "illegal construction", "gutter", "water supply", "encroachment",
        "municipal", "bmc", "pmc", "कचरा", "गटार", "रस्ता", "खड्डे", "अनधिकृत बांधकाम", "अतिक्रमण",
        "महानगरपालिका", "नगर निगम", "दूषित पाणी", "गंदगी", "सीवर", "नाली", "सड़क", "वार्ड"
    ]
    for k in municipal_keys:
        if k in q:
            scores["municipal"] += 6

    # 6. RTI & Public Department keywords (Strong domain anchors: rti, माहिती अधिकार, सूचना का अधिकार, जन माहिती)
    rti_keys = [
        "rti", "information act", "file delay", "records", "certified copy", "collector", "government office",
        "माहिती अधिकार", "माहिती अर्ज", "शासकीय काम", "दिरंगाई", "सरकारी विभाग", "सूचना का अधिकार",
        "जिल्हाधिकारी", "प्रमाणित प्रत", "नस्ती", "अभिलेख", "दप्तर", "प्रशासकीय", "कलेक्ट्रेट", "सरकारी योजना",
        "तलाठी", "तहसीलदार", "दाखला मिळत नाही", "public information officer", "pio", "tender files",
        "जन सूचना अधिकारी", "प्रथम अपील"
    ]
    for k in rti_keys:
        if k in q:
            scores["rti_govt"] += 6
    # Core RTI explicit anchors get decisive bonus
    if any(k in q for k in ["rti", "माहिती अधिकार", "सूचना का अधिकार", "certified copies", "certified copy", "प्रमाणित प्रत"]):
        scores["rti_govt"] += 12

    # 7. Property keywords
    prop_keys = [
        "property", "tenant", "rent", "landlord", "eviction", "land", "deposit", "7/12", "satbara",
        "trespass", "मालमत्ता", "जमीन", "भाडेकरू", "घरमालक", "डिपॉझिट", "७/१२", "फेरफार", "कब्जा",
        "किराया", "किरायेदार", "खाली करत नाही", "अनामत रक्कम", "सामान बाहेर फेकले", "बंटवारा",
        "मकान खाली", "ताला लगाया"
    ]
    for k in prop_keys:
        if k in q:
            scores["property"] += 6

    # 8. Legal aid keywords
    aid_keys = [
        "legal aid", "free lawyer", "poor", "free advocate", "lok adalat", "cant afford",
        "मोफत वकील", "विधी सेवा", "लोक न्यायालय", "गरीब", "मुफ्त वकील", "विधिक सहायता",
        "फीस देने के पैसे नहीं", "मोफत कायदेशीर मदत", "dlsa", "nalsa", "मुफ्त कानूनी मदद",
        "सरकारी वकील"
    ]
    for k in aid_keys:
        if k in q:
            scores["legal_aid"] += 6
    if any(k in q for k in ["legal aid", "मोफत वकील", "मुफ्त वकील", "मुफ्त कानूनी मदद", "विधी सेवा", "dlsa", "nalsa"]):
        scores["legal_aid"] += 12

    # 9. Police keywords (Lower baseline so specific offenses take precedence)
    police_keys = [
        "police", "fir", "complaint", "threat", "assault", "fight", "nc", "station", "थाना",
        "पोलीस", "एफआयआर", "तक्रार", "मारहाण", "धमकी", "थानेदार", "दखलपात्र", "गुन्हा", "चोरी",
        "शिकायत लेने से मना"
    ]
    for k in police_keys:
        if k in q:
            scores["police_fir"] += 4

    # Pick category with highest score; default to police_fir if zero
    best_cat = max(scores, key=scores.get)
    if scores[best_cat] == 0:
        best_cat = "police_fir"

    cat_data = LEGAL_CATEGORIES[best_cat]
    return {
        "category_id": best_cat,
        "category_data": cat_data,
        "confidence": "high" if scores[best_cat] > 0 else "default",
    }


# ─── Category-Specific Statutory Relief Synthesizer ────────────────────────────

def get_specific_statutory_relief(category_id: str, lang: str, user_relief: Optional[str] = None) -> str:
    """Produce precise, statutory prayers customized to the specific grievance domain."""
    if user_relief and user_relief.strip():
        return user_relief.strip()

    if lang == "mr":
        prayers = {
            "police_fir": "संबंधित गैरअर्जदाराविरुद्ध BNSS २०२३ चे कलम १७३ अन्वये तात्काळ प्रथम माहिती अहवाल (FIR) दाखल करण्यात यावा, सखोल तपास सुरू करून दोषींवर अटकेची कायदेशीर कारवाई करावी व अर्जदारास रीतसर विनामूल्य एफआयआरची प्रत देण्यात यावी.",
            "women_child": "कौटुंबिक हिंसाचार प्रतिबंधक कायदा २००५ चे कलम १८ अन्वये तात्काळ संरक्षण आदेश (Protection Order), कलम १९ अन्वये निवास आदेश आणि कलम २० अन्वये अंतरिम आर्थिक मदत/पोटगी अर्जदारास व बालकास मंजूर करण्यात यावी.",
            "labour": "वेतन प्रदान कायदा १९३६ चे कलम १५ व औद्योगिक विवाद कायदा कलम ३३C(२) अन्वये कंपनी व्यवस्थापनाकडून थकीत वेतनाची संपूर्ण रक्कम १० पट दंडासह व कायदेशीर व्याजासह तात्काळ वसूल करून अर्जदारास देण्यात यावी व कार्यमुक्ती प्रमाणपत्र (Relieving Letter) देण्यात यावे.",
            "consumer": "ग्राहक संरक्षण कायदा २०१९ च्या कलम ३९ अन्वये गैरअर्जदारास सदोष वस्तू/सेवा बदलून देण्याचा किंवा सव्याज संपूर्ण परतावा देण्याचा आदेश व्हावा, तसेच मानसिक त्रासाबद्दल योग्य ती नुकसानभरपाई व दावा खर्च मंजूर करण्यात यावा.",
            "municipal": "महानगरपालिका कायद्यातील कलम २६० व २६७ अन्वये तातडीने जागेची पाहणी करून अनधिकृत बांधकाम थांबवून पाडण्याचे आदेश व्हावेत / सार्वजनिक गटार व कचरा समस्या तत्काळ दूर करून अहवाल देण्यात यावा.",
            "rti_govt": "माहिती अधिकार कायदा २००५ च्या कलम ७(१) अन्वये नमूद माहितीच्या सर्व पृष्ठांच्या प्रमाणित सत्यप्रती विहित ३० दिवसांच्या मुदतीत उपलब्ध करून द्याव्यात; मुदतीत माहिती न दिल्यास माहिती अधिकाऱ्यावर कलम २० अन्वये दंडात्मक कारवाई करावी.",
            "property": "विशिष्ट साहाय्य कायदा १९६३ चे कलम ६ व भाडे नियंत्रण कायद्यान्वये अर्जदाराचा शांततापूर्ण व कायदेशीर ताबा बेकायदेशीरपणे हिरावून न घेण्याबाबत गैरअर्जदारास मनाई आदेश (Injunction) द्यावा, अनामत रक्कम परत द्यावी व पोलीस संरक्षण देण्यात यावे.",
            "cybercrime": "BNSS २०२३ चे कलम ९४ व माहिती तंत्रज्ञान कायदा कलम ६६D अन्वये संबंधित बँक नोडल अधिकाऱ्यास त्वरित पत्र देऊन फसवणूक झालेली रक्कम जमा असलेले गैरअर्जदाराचे बँक खाते/युपीआय वॉलेट तात्काळ गोठवण्यात (Freeze) यावे व रक्कम अर्जदाराच्या खात्यात परत जमा करावी.",
            "legal_aid": "विधी सेवा प्राधिकरण कायदा १९८७ चे कलम १२ व संविधानाचे अनुच्छेद ३९A अन्वये अर्जदारास मोफत सक्षम पॅनेल वकिलाची नियुक्ती करून देण्यात यावी व कोर्ट फी आणि सर्व दावा खर्चास माफी देण्यात यावी.",
        }
        return prayers.get(category_id, "सदर प्रकरणी तात्काळ कायदेशीर चौकशी करून दोषींवर कठोर कायदेशीर कार्यवाही करण्यात यावी व अर्जदारास योग्य ती दाद मिळवून देण्यात यावी.")

    elif lang == "hi":
        prayers = {
            "police_fir": "विपक्षी के विरुद्ध बीएनएसएस २०२३ की धारा १७३ के अंतर्गत तत्काल प्राथमिकी (FIR) दर्ज कर विधिसम्मत विवेचना प्रारंभ की जाए तथा प्रार्थी को निःशुल्क एफआईआर प्रति उपलब्ध कराई जाए।",
            "women_child": "घरेलू हिंसा से महिलाओं का संरक्षण अधिनियम २००५ की धारा १८ के तहत संरक्षण आदेश, धारा १९ के तहत निवास आदेश एवं धारा २० के तहत अंतरिम भरण-पोषण/आर्थिक सहायता तत्काल प्रदान की जाए।",
            "labour": "वेतन संदाय अधिनियम १९३६ की धारा १५ एवं औद्योगिक विवाद अधिनियम के तहत नियोक्ता से संपूर्ण बकाया वेतन १० गुना अर्थदंड व ब्याज सहित वसूल कर प्रार्थी को दिलाया जाए तथा कार्यमुक्ति प्रमाणपत्र जारी किया जाए।",
            "consumer": "उपभोक्ता संरक्षण अधिनियम २०१९ की धारा ३९ के तहत विपक्षी को दोषपूर्ण उत्पाद/सेवा बदलने अथवा ब्याज सहित पूर्ण धनवापसी का आदेश दिया जाए, एवं मानसिक क्षतिपूर्ति व वाद व्यय प्रदान किया जाए।",
            "municipal": "नगर निगम अधिनियम के तहत तत्काल स्थल निरीक्षण कर अवैध निर्माण को ध्वस्त करने/सीवर व गंदगी की समस्या का स्थायी समाधान करने हेतु आदेश पारित किए जाएं।",
            "rti_govt": "सूचना का अधिकार अधिनियम २००५ की धारा ७(१) के अंतर्गत वांछित सूचनाओं की प्रमाणित प्रतियां ३० दिनों की समयसीमा में उपलब्ध कराई जाएं, एवं जानबूझकर विलंब करने पर धारा २० के तहत दंडात्मक कार्रवाई की जाए।",
            "property": "विशिष्ट अनुतोष अधिनियम १९६३ की धारा ६ एवं किराया नियंत्रण विधि के तहत प्रार्थी के शांतिपूर्ण आधिपत्य में हस्तक्षेप न करने का आदेश दिया जाए, सिक्योरिटी डिपॉजिट वापस कराई जाए एवं पुलिस सुरक्षा प्रदान की जाए।",
            "cybercrime": "बीएनएसएस २०२३ की धारा ९४ एवं आईटी एक्ट की धारा ६६डी के तहत संबंधित बैंक के नोडल अधिकारी को तत्काल आदेशित कर फर्जीवाड़ा किए गए खाते/वॉलेट को फ्रीज कराया जाए तथा राशि प्रार्थी के मूल खाते में वापस कराई जाए।",
            "legal_aid": "विधिक सेवा प्राधिकरण अधिनियम १९८७ की धारा १२ एवं संविधान के अनुच्छेद ३९ए के तहत प्रार्थी को निःशुल्क सक्षम पैनल अधिवक्ता नियुक्त किया जाए तथा समस्त अदालती व्यय से छूट प्रदान की जाए।",
        }
        return prayers.get(category_id, "उक्त मामले की निष्पक्ष जांच कर दोषी के विरुद्ध नियमानुसार कठोर कानूनी कार्रवाई की जाए तथा प्रार्थी को न्याय दिलाया जाए।")

    else:
        prayers = {
            "police_fir": "To forthwith register a formal First Information Report (FIR) under Section 173 of Bharatiya Nagarik Suraksha Sanhita, 2023, initiate prompt investigation, secure evidence, and provide a free authenticated copy of the FIR to the Applicant.",
            "women_child": "To pass an immediate ex-parte Protection Order under Section 18, Residence Order under Section 19, and Monetary Interim Maintenance under Section 20 of the Protection of Women from Domestic Violence Act, 2005 for the Applicant and dependent children.",
            "labour": "To direct the Employer under Section 15 of the Payment of Wages Act, 1936 and Section 33C(2) of the Industrial Disputes Act to release the entire unpaid salary dues with statutory compensation, interest, and immediate issuance of the Relieving/Experience Letter.",
            "consumer": "To direct the Respondent under Section 39 of the Consumer Protection Act, 2019 to replace the defective product/service or refund the full consideration with 18% statutory interest, together with punitive compensation for mental harassment and litigation costs.",
            "municipal": "To conduct an immediate spot inspection, issue stop-work and demolition notices against the unauthorized construction under Section 260 of the Municipal Corporation Act, and restore civic health and sanitation forthwith.",
            "rti_govt": "To provide certified true copies of the requested official records within the mandatory statutory period of 30 days under Section 7(1) of the RTI Act, 2005, failing which penal proceedings under Section 20 be initiated against the PIO.",
            "property": "To restrain the Respondent from dispossessing the Applicant without due process of law under Section 6 of the Specific Relief Act, 1963, direct immediate refund of the security deposit, and provide necessary police protection.",
            "cybercrime": "To issue an immediate requisition under Section 94 of BNSS, 2023 to the concerned Bank Nodal Officer to freeze the fraudulent beneficiary account/UPI wallet, trace the money trail, and facilitate prompt refund to the Applicant's bank account.",
            "legal_aid": "To assign a competent Panel Advocate under Section 12 of the Legal Services Authorities Act, 1987 and Article 39A of the Constitution of India, and grant complete waiver of court fees and procedural expenses.",
        }
        return prayers.get(category_id, "To take immediate cognizance of this matter, initiate prompt investigation in accordance with law, and secure adequate redressal and protection for the Applicant.")


# ─── Multi-lingual Document Generator Engine ──────────────────────────────────

def generate_citizen_application(
    category_id: str,
    language: str,
    applicant_name: str,
    applicant_phone: str,
    applicant_address: str,
    opposite_party: str,
    opposite_party_address: str,
    incident_date: str,
    incident_place: str,
    facts_summary: str,
    relief_sought: Optional[str] = None,
) -> str:
    """
    Synthesize an authoritative, professionally formatted, court/department-ready
    complaint application according to official Indian legal standards.
    """
    lang = language if language in ("en", "mr", "hi") else "en"
    cat = LEGAL_CATEGORIES.get(category_id, LEGAL_CATEGORIES["police_fir"])
    today_str = datetime.now().strftime("%d/%m/%Y")

    auth_name = cat["target_authority"].get(lang, cat["target_authority"]["en"])
    laws = cat["default_laws"]
    laws_citations = ", ".join([f"{l['section']} of {l['act']}" for l in laws])
    specific_relief = get_specific_statutory_relief(category_id, lang, relief_sought)

    # Clean facts into numbered paragraphs
    raw_facts = [f.strip() for f in facts_summary.replace("\r", "").split("\n") if f.strip()]
    if not raw_facts:
        raw_facts = [facts_summary.strip() or "Particulars of the grievance as submitted."]

    # ─────────────────────────────────────────────────────────────────────────
    # 1. MARATHI (मराठी) - Maharashtra Police / Revenue / Court Official Format
    # ─────────────────────────────────────────────────────────────────────────
    if lang == "mr":
        facts_numbered = "\n".join([f"    ({i+1}) {fact}" for i, fact in enumerate(raw_facts)])

        doc = f"""तक्रार अर्ज (Complaint Application)

प्रति,
मा. {auth_name},
{incident_place or 'संबंधित कार्यक्षेत्र / पोलीस ठाणे'}.

विषय: {opposite_party} यांच्याविरुद्ध {cat['names']['mr']} संदर्भात कायदेशीर तक्रार अर्ज.
संदर्भ: {laws_citations} आणि संबंधित वैधानिक तरतुदी.

अर्जदार:
श्री/श्रीमती: {applicant_name}
पत्ता: {applicant_address or 'स्थानिक रहिवासी'}
मोबाईल क्र.: {applicant_phone or 'नोंदणीकृत'}

विरुद्ध

गैरअर्जदार (Opposite Party):
नाव/संस्था: {opposite_party or 'संबंधित प्रतिवादी'}
पत्ता: {opposite_party_address or 'वर नमूद पत्ता / कार्यालय'}

महोदय / महोदया,

मी, वर नमूद केलेला/केलेली अर्जदार, या अर्जाद्वारे खालीलप्रमाणे सविस्तर तक्रार नोंदवत आहे:

१. तक्रारीची प्राथमिक पार्श्वभूमी व ओळख:
    मी अर्जदार, {applicant_name}, उपरोक्त पत्त्यावर वास्तव्यास असून सन्माननीय व कायद्याचे पालन करणारा/करणारी नागरिक आहे.

२. घटनेची तारीख, वेळ व ठिकाण:
    सदर अन्यायकारक / बेकायदेशीर घटना दिनांक {incident_date or 'नुकतीच'} रोजी, {incident_place or 'नमूद ठिकाणी'} येथे घडली आहे.

३. सविस्तर वस्तुस्थिती व तपशील (Statement of Facts):
{facts_numbered}

४. लागू कायद्यातील तरतुदी (Applicable Legal Provisions):
    सदर कृत्य हे कायद्याच्या पूर्णपणे विरोधात असून, याद्वारे खालील वैधानिक तरतुदींचे थेट उल्लंघन झालेले आहे:
    • {chr(10).join([f"    - {l['section']}, {l['act']}: {l['desc']}" for l in laws])}

५. दाद व विनंती (Prayer / Relief Sought):
    म्हणून अर्जदाराची आपल्याकडे नम्र विनंती आहे की:
    (अ) या तक्रार अर्जाची तात्काळ गंभीर दखल घेऊन संबंधित गैरअर्जदाराविरुद्ध रीतसर गुन्हा / कायदेशीर कार्यवाही नोंदवण्यात यावी.
    (ब) {specific_relief}
    (क) अर्जदाराच्या जीवितास, मालमत्तेस अथवा अधिकारास कोणत्याही प्रकारची हानी पोहोचणार नाही याकरिता आवश्यक ते कायदेशीर संरक्षण देण्यात यावे.

सत्यप्रतिज्ञा (Declaration / Verification):
मी वर नमूद अर्जदार सत्यप्रतिज्ञेवर जाहीर करतो/करते की, वरील सर्व परिच्छेदांमधील मजकूर माझ्या स्वतःच्या माहितीनुसार, समजुतीनुसार व उपलब्ध कागदपत्रांनुसार पूर्णतः सत्य व खरा आहे.

सोबत जोडलेली कागदपत्रे (Enclosures / सहपत्रे):
१. अर्जदाराच्या ओळखपत्राची व पत्त्याच्या पुराव्याची छायांकित प्रत.
२. घटनेशी संबंधित उपलब्ध पुरावे / संदेश / बँक व्यवहार / कागदपत्रांची प्रत.
३. पोच पावतीसाठी अर्जाची दुसरी प्रत (Duplicate Copy).

ठिकाण: {incident_place or 'महाराष्ट्र'}
दिनांक: {today_str}

आपला/आपली नम्र,

स्वाक्षरी: __________________________
नाव: {applicant_name}
मोबाईल क्र.: {applicant_phone}
"""
        return doc.strip()

    # ─────────────────────────────────────────────────────────────────────────
    # 2. HINDI (हिंदी) - Official Grievance & Police Complaint Standard
    # ─────────────────────────────────────────────────────────────────────────
    elif lang == "hi":
        facts_numbered = "\n".join([f"    ({i+1}) {fact}" for i, fact in enumerate(raw_facts)])

        doc = f"""शिकायत प्रार्थना-पत्र (Formal Complaint Application)

सेवा में,
श्रीमान {auth_name},
{incident_place or 'संबंधित थाना / विभाग'}.

विषय: {opposite_party} के विरुद्ध {cat['names']['hi']} के संबंध में विधिक शिकायत पत्र।
संदर्भ: {laws_citations} एवं अन्य संबंधित विधिक प्रावधान।

प्रार्थी / शिकायतकर्ता (Applicant):
नाम: {applicant_name}
पता: {applicant_address or 'स्थानीय निवासी'}
मोबाइल नंबर: {applicant_phone or 'पंजीकृत'}

बनाम

विपक्षी / अनावेदक (Opposite Party):
नाम/प्रतिष्ठान: {opposite_party or 'संबंधित विपक्षी'}
पता: {opposite_party_address or 'उपरोक्त पता'}

महोदय / महोदया,

प्रार्थी सविनय निवेदन करता/करती है कि:

१. प्रार्थी का संक्षिप्त परिचय:
    प्रार्थी, {applicant_name}, उपरोक्त पते का स्थायी निवासी है और एक विधि-सम्मत एवं सम्मानित नागरिक है।

२. घटना का दिनांक एवं स्थान:
    उक्त गैर-कानूनी घटना दिनांक {incident_date or 'हाल ही में'} को स्थान {incident_place or 'संबंधित स्थल'} पर घटित हुई।

३. मामले के मुख्य तथ्य (Statement of Facts):
{facts_numbered}

४. प्रासंगिक कानूनी प्रावधान (Applicable Laws):
    विपक्षी द्वारा किया गया यह कृत्य पूर्णतः विधि-विरुद्ध है तथा इसके अंतर्गत निम्नलिखित वैधानिक धाराओं का उल्लंघन हुआ है:
    • {chr(10).join([f"    - {l['section']}, {l['act']}: {l['desc']}" for l in laws])}

५. प्रार्थना / अनुतोष (Prayer / Relief Sought):
    अतः श्रीमान से विनम्र प्रार्थना है कि:
    (क) इस शिकायत पत्र पर संज्ञान लेते हुए विपक्षी के विरुद्ध तत्काल प्राथमिकी (FIR) / कानूनी कार्रवाई दर्ज की जाए।
    (ख) {specific_relief}
    (ग) प्रार्थी एवं उसके परिजनों को आवश्यक कानूनी सुरक्षा प्रदान की जाए।

सत्यापन / घोषणा (Verification):
मैं शपथपूर्वक प्रमाणित करता/करती हूँ कि इस प्रार्थना-पत्र के समस्त विवरण मेरी व्यक्तिगत जानकारी व विश्वास के अनुसार पूर्णतः सत्य एवं सही हैं।

संलग्नक (List of Enclosures):
१. प्रार्थी के पहचान पत्र एवं निवास प्रमाण की प्रति।
२. घटना से संबंधित साक्ष्य / बैंक स्टेटमेंट / संदेशों की प्रतियां।
३. कार्यालय पावती हेतु आवेदन की प्रतिलिपि।

स्थान: {incident_place or 'भारत'}
दिनांक: {today_str}

प्रार्थी,

हस्ताक्षर: __________________________
नाम: {applicant_name}
मोबाइल: {applicant_phone}
"""
        return doc.strip()

    # ─────────────────────────────────────────────────────────────────────────
    # 3. ENGLISH - Standard High Court / Police / Authority Representation
    # ─────────────────────────────────────────────────────────────────────────
    else:
        facts_numbered = "\n".join([f"    ({i+1}) {fact}" for i, fact in enumerate(raw_facts)])

        doc = f"""FORMAL LEGAL COMPLAINT APPLICATION

TO,
THE HON'BLE {auth_name.upper()},
{incident_place or 'JURISDICTIONAL OFFICE / POLICE STATION'}.

SUBJECT: Formal complaint regarding {cat['names']['en']} against {opposite_party}.
STATUTORY REFERENCE: Under {laws_citations} and all enabling legal provisions.

APPLICANT:
Name: {applicant_name}
Address: {applicant_address or 'Resident as noted'}
Contact No.: {applicant_phone or 'Registered Phone'}

VERSUS

RESPONDENT / OPPOSITE PARTY:
Name / Organization: {opposite_party or 'Opposite Party as identified'}
Address: {opposite_party_address or 'Office / Residential address as recorded'}

RESPECTED SIR / MADAM,

The Applicant above-named respectfully submits this formal legal representation as under:

1. PARTICULARS OF THE APPLICANT:
    The Applicant is a law-abiding citizen residing at the address set out hereinabove, entitled to the full protection of law and constitutional guarantees.

2. DATE, TIME, AND PLACE OF CAUSE OF ACTION:
    The incident and cause of action arose on or about {incident_date or 'the relevant period'} at {incident_place or 'the jurisdictional area mentioned above'}.

3. CHRONOLOGICAL STATEMENT OF MATERIAL FACTS:
{facts_numbered}

4. APPLICABLE STATUTORY PROVISIONS & GROUNDS:
    The aforesaid conduct of the Respondent constitutes an actionable civil and/or criminal wrong under the following statutory provisions:
    • {chr(10).join([f"    - {l['section']}, {l['act']}: {l['desc']}" for l in laws])}

5. PRAYER / RELIEF SOUGHT:
    In the premises aforesaid, the Applicant humbly prays that this Hon'ble Authority may be pleased to:
    (a) Take immediate official cognizance of this complaint and register an FIR / statutory inquiry forthwith;
    (b) {specific_relief}
    (c) Grant necessary protection to the Applicant and witnesses against any harassment or reprisal from the Respondent;
    (d) Pass such further or other relief as this Hon'ble Authority may deem fit and proper in the interest of justice.

SOLEMN VERIFICATION:
I, the Applicant above-named, do hereby verify and declare on solemn affirmation that the contents of paragraphs 1 to 5 above are true and correct to the best of my personal knowledge, belief, and records maintained, and nothing material has been concealed therefrom.

LIST OF ENCLOSURES / ANNEXURES:
1. Self-attested copy of the Applicant's Government Photo ID & Address Proof.
2. Documentary evidence, communications, screenshots, and bank records in support of the facts.
3. Duplicate copy of this Application for official acknowledgment and Diary Entry (GD) endorsement.

Place: {incident_place or 'India'}
Date: {today_str}

Yours faithfully,

Signature: __________________________
Name: {applicant_name}
Contact: {applicant_phone}
"""
        return doc.strip()
