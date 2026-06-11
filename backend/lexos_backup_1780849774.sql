PRAGMA foreign_keys=OFF;
BEGIN TRANSACTION;
CREATE TABLE acts (
	id UUID NOT NULL, 
	name VARCHAR(500) NOT NULL, 
	short_name VARCHAR(100), 
	year INTEGER, 
	category VARCHAR(100), 
	description TEXT, 
	total_sections INTEGER, 
	is_active BOOLEAN, 
	superseded_by VARCHAR(255), 
	created_at DATETIME, 
	PRIMARY KEY (id)
);
CREATE TABLE sections (
	id UUID NOT NULL, 
	act_id UUID NOT NULL, 
	number VARCHAR(20) NOT NULL, 
	title VARCHAR(500), 
	content TEXT NOT NULL, 
	sub_sections JSON, 
	annotations TEXT, 
	interpretation TEXT, 
	importance VARCHAR(10), 
	linked_case_laws JSON, 
	tags JSON, 
	embedding_id VARCHAR(255), 
	created_at DATETIME, 
	updated_at DATETIME, 
	PRIMARY KEY (id), 
	FOREIGN KEY(act_id) REFERENCES acts (id)
);
CREATE TABLE courts (
	id UUID NOT NULL, 
	name VARCHAR(500) NOT NULL, 
	type VARCHAR(100) NOT NULL, 
	jurisdiction VARCHAR(255), 
	address TEXT, 
	presiding_officer VARCHAR(255), 
	room_number VARCHAR(50), 
	contact_info VARCHAR(255), 
	is_active BOOLEAN, 
	created_at DATETIME, 
	updated_at DATETIME, 
	PRIMARY KEY (id)
);
CREATE TABLE firms (
	id UUID NOT NULL, 
	name VARCHAR(255) NOT NULL, 
	type VARCHAR(11) NOT NULL, 
	gst_no VARCHAR(50), 
	pan_no VARCHAR(50), 
	cin_no VARCHAR(50), 
	address TEXT, 
	is_active BOOLEAN, 
	created_at DATETIME, 
	updated_at DATETIME, 
	PRIMARY KEY (id)
);
INSERT INTO firms VALUES('c40cafae174b4944a902212742065f5b','Sharma & Associates','PARTNERSHIP','27AAACS1234F1Z1','AAACS1234F',NULL,'123 Legal Hub, Mumbai',1,'2026-06-07 16:01:36.582687','2026-06-07 16:01:36.582688');
CREATE TABLE subscription_plans (
	id UUID NOT NULL, 
	name VARCHAR(100) NOT NULL, 
	tier VARCHAR(12) NOT NULL, 
	price_monthly FLOAT NOT NULL, 
	price_yearly FLOAT NOT NULL, 
	max_users INTEGER NOT NULL, 
	storage_limit_gb FLOAT NOT NULL, 
	features VARCHAR(1000), 
	is_active BOOLEAN, 
	PRIMARY KEY (id), 
	UNIQUE (tier)
);
INSERT INTO subscription_plans VALUES('42fb930a2e314b3aa2ae09647ca095c4','Free Trial','FREE_TRIAL',0.0,0.0,1,1.0,NULL,1);
INSERT INTO subscription_plans VALUES('4090fd5520da47d69e2251968866f193','Basic','BASIC',1999.0,19990.0,3,10.0,NULL,1);
INSERT INTO subscription_plans VALUES('a0498b69c8f14b60b07a712f61eb2155','Professional','PROFESSIONAL',4999.0,49990.0,10,50.0,NULL,1);
INSERT INTO subscription_plans VALUES('6b0c5ae274e242bea68018c050ac74c2','Enterprise','ENTERPRISE',9999.0,99990.0,100,500.0,NULL,1);
CREATE TABLE system_settings (
	id UUID NOT NULL, 
	"key" VARCHAR(100) NOT NULL, 
	value VARCHAR(1000) NOT NULL, 
	description VARCHAR(500), 
	is_public BOOLEAN, 
	updated_at DATETIME, 
	PRIMARY KEY (id)
);
INSERT INTO system_settings VALUES('3e1ea6f0f00a43e18ebed4b211347912','platform_name','LexOS Admin','Global Platform Name',1,'2026-06-07 16:01:36.592238');
INSERT INTO system_settings VALUES('e56d8e22a1a642dd9544d2f9dc002723','support_email','support@lexos.in','Support Contact Email',1,'2026-06-07 16:01:36.592242');
INSERT INTO system_settings VALUES('a1c6b91e4a174cdaaad427360bc37802','support_phone','+91-800-LEXOS-AI','Support Contact Phone',1,'2026-06-07 16:01:36.592244');
INSERT INTO system_settings VALUES('58af58929752468a919f6266b293aee6','maintenance_mode','false','Toggle Global Maintenance Mode',1,'2026-06-07 16:01:36.592246');
INSERT INTO system_settings VALUES('5f90bf77208d417ba0b63399140fe9dd','max_upload_size_mb','50','Max file upload size in MB',0,'2026-06-07 16:01:36.592247');
CREATE TABLE roles (
	id UUID NOT NULL, 
	name VARCHAR(100) NOT NULL, 
	description VARCHAR(500), 
	is_system BOOLEAN, 
	permissions JSON, 
	created_at DATETIME, 
	PRIMARY KEY (id), 
	UNIQUE (name)
);
CREATE TABLE users (
	id UUID NOT NULL, 
	email VARCHAR(255) NOT NULL, 
	hashed_password VARCHAR(255) NOT NULL, 
	full_name VARCHAR(255) NOT NULL, 
	user_type VARCHAR(18) NOT NULL, 
	phone VARCHAR(20), 
	bar_council_no VARCHAR(50), 
	firm_id UUID, 
	role_id UUID, 
	avatar_url VARCHAR(500), 
	is_active BOOLEAN, 
	is_verified BOOLEAN, 
	is_superadmin BOOLEAN, 
	admin_permissions JSON, 
	preferred_language VARCHAR(10), 
	specializations TEXT, 
	created_at DATETIME, 
	updated_at DATETIME, 
	last_login DATETIME, failed_login_attempts INTEGER DEFAULT 0 NOT NULL, locked_until TIMESTAMP, login_count INTEGER DEFAULT 0 NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(firm_id) REFERENCES firms (id), 
	FOREIGN KEY(role_id) REFERENCES roles (id)
);
INSERT INTO users VALUES('d08ceb8e901b42e09aabac65b45c2c32','admin@lexos.in','$2b$12$Bxvnj1NjTL3G1010YMCyGeOUc2yBxjNFdFBVk30H.VW/OjNXS3Y/a','SOSM SERVICES PVT LTD','ADMIN',NULL,NULL,NULL,NULL,NULL,1,1,1,'[]','en',NULL,'2026-06-07 16:01:35.852735','2026-06-07 16:01:35.852742',NULL,0,NULL,0);
INSERT INTO users VALUES('aba2a6ea78d540af876116b3f2f69203','priyanka@lexos.in','$2b$12$YEiVysr4B8jWaituI6SFaORG3vcwvH9v/nYnWnMxR2ofxCdZlXB1G','Adv. Priyanka Joshi','ASSOCIATE_ADVOCATE','+91 98765 11111','MH/5678/2015','c40cafae174b4944a902212742065f5b',NULL,NULL,1,1,0,'[]','en',NULL,'2026-06-07 16:01:36.566720','2026-06-07 16:01:36.583904',NULL,0,NULL,0);
INSERT INTO users VALUES('84eb3717a1ab4427a19cbd2b6eaad6e8','suresh@lexos.in','$2b$12$bEdPiyeDm66up4VGO.DBOe5L4cKH6IbCcJodKTgRtbXgIFdnM28Fi','Adv. Suresh Kulkarni','JUNIOR_ADVOCATE','+91 98765 22222','MH/9012/2018',NULL,NULL,NULL,1,1,0,'[]','en',NULL,'2026-06-07 16:01:36.566726','2026-06-07 16:01:36.566727',NULL,0,NULL,0);
INSERT INTO users VALUES('bba1f54920ac46b98898bd3bd061adfb','deepa@lexos.in','$2b$12$5nbXE7XqRTz927LTut/jruSx5CfKY1.arDnlUIkX5uriJAe1I.gMS','Ms. Deepa Nair','PARALEGAL','+91 98765 33333',NULL,NULL,NULL,NULL,1,1,0,'[]','en',NULL,'2026-06-07 16:01:36.566729','2026-06-07 16:01:36.566729',NULL,0,NULL,0);
INSERT INTO users VALUES('834bd14857f243c2b09cf9566bed5329','vikram@lexos.in','$2b$12$vBkehqXjLHYIc5Uxx9HHI.5DuMdycNBimQ7kEYQeRLUZAci0rYTyu','Mr. Vikram Patil','CLERK','+91 98765 44444',NULL,NULL,NULL,NULL,1,1,0,'[]','en',NULL,'2026-06-07 16:01:36.566732','2026-06-07 16:01:36.566732',NULL,0,NULL,0);
CREATE TABLE tenant_subscriptions (
	id UUID NOT NULL, 
	firm_id UUID NOT NULL, 
	plan_id UUID NOT NULL, 
	status VARCHAR(8), 
	billing_cycle VARCHAR(20), 
	start_date DATETIME, 
	end_date DATETIME NOT NULL, 
	auto_renew BOOLEAN, 
	PRIMARY KEY (id), 
	UNIQUE (firm_id), 
	FOREIGN KEY(firm_id) REFERENCES firms (id), 
	FOREIGN KEY(plan_id) REFERENCES subscription_plans (id)
);
INSERT INTO tenant_subscriptions VALUES('1726695ee97e47f29debb9e649e60099','c40cafae174b4944a902212742065f5b','a0498b69c8f14b60b07a712f61eb2155','ACTIVE','yearly','2026-06-07 16:01:36.587103','2027-06-07 16:01:36.587110',1);
CREATE TABLE payment_transactions (
	id UUID NOT NULL, 
	firm_id UUID NOT NULL, 
	amount FLOAT NOT NULL, 
	currency VARCHAR(10), 
	status VARCHAR(8), 
	gateway VARCHAR(8) NOT NULL, 
	gateway_reference VARCHAR(255), 
	invoice_url VARCHAR(500), 
	created_at DATETIME, 
	PRIMARY KEY (id), 
	FOREIGN KEY(firm_id) REFERENCES firms (id)
);
INSERT INTO payment_transactions VALUES('8e217e666b7e45fea17395a1110f9443','c40cafae174b4944a902212742065f5b',49990.0,'INR','SUCCESS','RAZORPAY','pay_JbY2Kz8d8jLqYm',NULL,'2026-06-06 16:01:36.587826');
INSERT INTO payment_transactions VALUES('d637d74d31ef4155bdf3dfdb5922c220','c40cafae174b4944a902212742065f5b',49990.0,'INR','FAILED','RAZORPAY','pay_JaX1Lw7c7kKpXl',NULL,'2026-06-05 16:01:36.587847');
CREATE TABLE clients (
	id UUID NOT NULL, 
	name VARCHAR(255) NOT NULL, 
	type VARCHAR(10), 
	email VARCHAR(255), 
	phone VARCHAR(20) NOT NULL, 
	alternate_phone VARCHAR(20), 
	address TEXT, 
	city VARCHAR(100), 
	state VARCHAR(100), 
	pincode VARCHAR(10), 
	pan VARCHAR(20), 
	gstin VARCHAR(20), 
	aadhaar_last4 VARCHAR(4), 
	aadhaar_number VARCHAR(12), 
	occupation VARCHAR(255), 
	date_of_birth DATE, 
	photograph_url VARCHAR(1000), 
	company_name VARCHAR(255), 
	contact_person VARCHAR(255), 
	notes TEXT, 
	tags JSON, 
	assigned_advocate_id UUID, 
	firm_id UUID, 
	created_by_id UUID, 
	updated_by_id UUID, 
	is_active BOOLEAN, 
	kyc_verified BOOLEAN, 
	fees_outstanding FLOAT, 
	created_at DATETIME, 
	updated_at DATETIME, 
	PRIMARY KEY (id), 
	FOREIGN KEY(assigned_advocate_id) REFERENCES users (id), 
	FOREIGN KEY(firm_id) REFERENCES firms (id), 
	FOREIGN KEY(created_by_id) REFERENCES users (id), 
	FOREIGN KEY(updated_by_id) REFERENCES users (id)
);
INSERT INTO clients VALUES('5029237114324155b3d66c1391ed441b','Rajiv Kumar','INDIVIDUAL','rajiv@example.com','+91 98765 12345',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'[]','d08ceb8e901b42e09aabac65b45c2c32',NULL,NULL,NULL,1,0,0.0,'2026-06-07 16:01:36.573983','2026-06-07 16:01:36.573984');
CREATE TABLE letterheads (
	id UUID NOT NULL, 
	user_id UUID NOT NULL, 
	advocate_name VARCHAR(255), 
	firm_name VARCHAR(255), 
	enrollment_number VARCHAR(100), 
	office_address TEXT, 
	mobile_number VARCHAR(50), 
	email_id VARCHAR(100), 
	website VARCHAR(100), 
	gst_number VARCHAR(50), 
	logo_base64 TEXT, 
	signature_base64 TEXT, 
	stamp_base64 TEXT, 
	template_type VARCHAR(50), 
	custom_header_html TEXT, 
	custom_footer_html TEXT, 
	PRIMARY KEY (id), 
	UNIQUE (user_id), 
	FOREIGN KEY(user_id) REFERENCES users (id) ON DELETE CASCADE
);
CREATE TABLE login_history (
	id UUID NOT NULL, 
	user_id UUID NOT NULL, 
	ip_address VARCHAR(50), 
	user_agent VARCHAR(500), 
	success BOOLEAN, 
	failure_reason VARCHAR(255), 
	attempted_at DATETIME, 
	PRIMARY KEY (id), 
	FOREIGN KEY(user_id) REFERENCES users (id) ON DELETE CASCADE
);
CREATE TABLE user_sessions (
	id UUID NOT NULL, 
	user_id UUID NOT NULL, 
	token_jti VARCHAR(255) NOT NULL, 
	device_info VARCHAR(255), 
	ip_address VARCHAR(50), 
	created_at DATETIME, 
	expires_at DATETIME NOT NULL, 
	is_active BOOLEAN, 
	PRIMARY KEY (id), 
	FOREIGN KEY(user_id) REFERENCES users (id) ON DELETE CASCADE
);
CREATE TABLE system_audit_logs (
	id UUID NOT NULL, 
	admin_id UUID, 
	action VARCHAR(100) NOT NULL, 
	resource_type VARCHAR(50), 
	resource_id VARCHAR(255), 
	details VARCHAR(1000), 
	ip_address VARCHAR(50), 
	created_at DATETIME, 
	PRIMARY KEY (id), 
	FOREIGN KEY(admin_id) REFERENCES users (id) ON DELETE SET NULL
);
CREATE TABLE kyc_records (
	id UUID NOT NULL, 
	entity_type VARCHAR(4) NOT NULL, 
	user_id UUID, 
	firm_id UUID, 
	document_type VARCHAR(13) NOT NULL, 
	document_number VARCHAR(100), 
	document_url VARCHAR(500) NOT NULL, 
	status VARCHAR(11) NOT NULL, 
	rejection_reason TEXT, 
	submitted_at DATETIME, 
	reviewed_at DATETIME, 
	reviewed_by_id UUID, 
	PRIMARY KEY (id), 
	FOREIGN KEY(user_id) REFERENCES users (id), 
	FOREIGN KEY(firm_id) REFERENCES firms (id), 
	FOREIGN KEY(reviewed_by_id) REFERENCES users (id)
);
INSERT INTO kyc_records VALUES('790e79367ea548518a166e1a9b4e8b9d','FIRM',NULL,'c40cafae174b4944a902212742065f5b','GST','27AAACS1234F1Z1','https://example.com/gst-cert.pdf','PENDING',NULL,'2026-06-07 16:01:36.585106',NULL,NULL);
INSERT INTO kyc_records VALUES('e76bd1d277234b328413bf18e28e4220','USER','84eb3717a1ab4427a19cbd2b6eaad6e8',NULL,'BAR_COUNCIL','MH/9012/2018','https://example.com/bar-id.pdf','PENDING',NULL,'2026-06-07 16:01:36.585109',NULL,NULL);
INSERT INTO kyc_records VALUES('55768c2e5a4d4440bd39b4bddcabace4','USER','84eb3717a1ab4427a19cbd2b6eaad6e8',NULL,'PAN','ABCDE1234F','https://example.com/pan.pdf','APPROVED',NULL,'2026-06-07 16:01:36.585111','2026-06-07 16:01:36.584783','d08ceb8e901b42e09aabac65b45c2c32');
CREATE TABLE support_tickets (
	id UUID NOT NULL, 
	user_id UUID NOT NULL, 
	firm_id UUID, 
	subject VARCHAR(255) NOT NULL, 
	category VARCHAR(100), 
	priority VARCHAR(8), 
	status VARCHAR(11), 
	created_at DATETIME, 
	updated_at DATETIME, 
	PRIMARY KEY (id), 
	FOREIGN KEY(user_id) REFERENCES users (id), 
	FOREIGN KEY(firm_id) REFERENCES firms (id)
);
CREATE TABLE cases (
	id UUID NOT NULL, 
	case_no VARCHAR(100) NOT NULL, 
	title VARCHAR(500) NOT NULL, 
	description TEXT, 
	court VARCHAR(255) NOT NULL, 
	bench VARCHAR(255), 
	judge VARCHAR(255), 
	court_complex VARCHAR(255), 
	court_state VARCHAR(100), 
	client_id UUID NOT NULL, 
	petitioner VARCHAR(500), 
	respondent VARCHAR(500), 
	opposing_counsel VARCHAR(255), 
	opposing_counsel_phone VARCHAR(20), 
	practice_area VARCHAR(100) NOT NULL, 
	case_type VARCHAR(100), 
	acts_involved JSON, 
	sections_involved JSON, 
	arguments JSON, 
	tags JSON, 
	status VARCHAR(8), 
	stage VARCHAR(9), 
	priority VARCHAR(6), 
	filing_date DATE, 
	disposal_date DATE, 
	incident_date DATE, 
	limitation_date DATE, 
	limitation_act VARCHAR(255), 
	limitation_section VARCHAR(255), 
	next_hearing_date DATE, 
	fees_agreed FLOAT, 
	fees_received FLOAT, 
	primary_advocate_id UUID, 
	team_members JSON, 
	firm_id UUID, 
	created_by_id UUID, 
	updated_by_id UUID, 
	parent_case_id UUID, 
	appeal_type VARCHAR(50), 
	appeal_level INTEGER, 
	forum VARCHAR(100), 
	ai_risk_score FLOAT, 
	ai_summary TEXT, 
	created_at DATETIME, 
	updated_at DATETIME, 
	PRIMARY KEY (id), 
	FOREIGN KEY(client_id) REFERENCES clients (id), 
	FOREIGN KEY(primary_advocate_id) REFERENCES users (id), 
	FOREIGN KEY(firm_id) REFERENCES firms (id), 
	FOREIGN KEY(created_by_id) REFERENCES users (id), 
	FOREIGN KEY(updated_by_id) REFERENCES users (id), 
	FOREIGN KEY(parent_case_id) REFERENCES cases (id)
);
INSERT INTO cases VALUES('bd5825784d88454484fea31014007c70','CS(OS) 100/2025','Rajiv Kumar vs State',NULL,'Delhi High Court',NULL,NULL,NULL,NULL,'5029237114324155b3d66c1391ed441b','Rajiv Kumar','State of Delhi',NULL,NULL,'Criminal Law',NULL,'[]','[]','[]','[]','ACTIVE','EVIDENCE','MEDIUM',NULL,NULL,'2025-01-15','2026-06-19','Limitation Act','Article 115',NULL,0.0,0.0,'d08ceb8e901b42e09aabac65b45c2c32','[]',NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,NULL,'2026-06-07 16:01:36.575944','2026-06-07 16:01:36.575945');
INSERT INTO cases VALUES('4e1469bb1e5c4c43819d6baef29b1614','CC/2024/150','Sharma Consumer Dispute',NULL,'District Consumer Forum',NULL,NULL,NULL,NULL,'5029237114324155b3d66c1391ed441b','Anita Sharma','TechGadget Inc',NULL,NULL,'Consumer',NULL,'[]','[]','[]','[]','ACTIVE','FILING','MEDIUM',NULL,NULL,'2025-05-10','2026-06-11','Consumer Protection Act','Section 69',NULL,0.0,0.0,'d08ceb8e901b42e09aabac65b45c2c32','[]',NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,NULL,'2026-06-07 16:01:36.575948','2026-06-07 16:01:36.575949');
INSERT INTO cases VALUES('ec11dac23b98453b96c6322a68dfc8ce','MACT/2024/89','Verma Accident Claim',NULL,'MACT Tribunal',NULL,NULL,NULL,NULL,'5029237114324155b3d66c1391ed441b','Ramesh Verma','Oriental Insurance',NULL,NULL,'MACT',NULL,'[]','[]','[]','[]','ACTIVE','FILING','MEDIUM',NULL,NULL,'2025-04-01','2026-06-02','Motor Vehicles Act','Section 166(3)',NULL,0.0,0.0,'d08ceb8e901b42e09aabac65b45c2c32','[]',NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,NULL,'2026-06-07 16:01:36.575951','2026-06-07 16:01:36.575952');
CREATE TABLE ticket_messages (
	id UUID NOT NULL, 
	ticket_id UUID NOT NULL, 
	sender_id UUID NOT NULL, 
	message TEXT NOT NULL, 
	created_at DATETIME, 
	PRIMARY KEY (id), 
	FOREIGN KEY(ticket_id) REFERENCES support_tickets (id) ON DELETE CASCADE, 
	FOREIGN KEY(sender_id) REFERENCES users (id)
);
CREATE TABLE hearings (
	id UUID NOT NULL, 
	case_id UUID NOT NULL, 
	hearing_date DATE NOT NULL, 
	hearing_time TIME, 
	court VARCHAR(255), 
	courtroom VARCHAR(100), 
	judge VARCHAR(255), 
	purpose VARCHAR(255), 
	status VARCHAR(9), 
	notes TEXT, 
	next_date DATE, 
	next_purpose VARCHAR(255), 
	order_passed TEXT, 
	reminder_sent BOOLEAN, 
	attended_by VARCHAR(255), 
	readiness_status VARCHAR(50), 
	preparation_checklist JSON, 
	created_at DATETIME, 
	updated_at DATETIME, 
	PRIMARY KEY (id), 
	FOREIGN KEY(case_id) REFERENCES cases (id)
);
CREATE TABLE invoices (
	id UUID NOT NULL, 
	invoice_no VARCHAR(50) NOT NULL, 
	client_id UUID NOT NULL, 
	case_id UUID, 
	created_by_id UUID NOT NULL, 
	items JSON, 
	subtotal FLOAT NOT NULL, 
	gst_rate FLOAT, 
	gst_amount FLOAT, 
	total FLOAT NOT NULL, 
	amount_paid FLOAT, 
	balance_due FLOAT, 
	status VARCHAR(9), 
	due_date DATE, 
	paid_date DATE, 
	payment_method VARCHAR(50), 
	payment_reference VARCHAR(100), 
	notes TEXT, 
	terms TEXT, 
	hsn_sac_code VARCHAR(20), 
	place_of_supply VARCHAR(100), 
	created_at DATETIME, 
	updated_at DATETIME, 
	PRIMARY KEY (id), 
	FOREIGN KEY(client_id) REFERENCES clients (id), 
	FOREIGN KEY(case_id) REFERENCES cases (id), 
	FOREIGN KEY(created_by_id) REFERENCES users (id)
);
CREATE TABLE documents (
	id UUID NOT NULL, 
	name VARCHAR(500) NOT NULL, 
	original_filename VARCHAR(500), 
	file_path VARCHAR(1000), 
	file_size INTEGER, 
	mime_type VARCHAR(100), 
	doc_type VARCHAR(17), 
	case_id UUID, 
	client_id UUID, 
	uploaded_by_id UUID, 
	modified_by_id UUID, 
	downloaded_by_id UUID, 
	filed_by_id UUID, 
	last_action_date DATETIME, 
	tags JSON, 
	description TEXT, 
	ocr_text TEXT, 
	ocr_processed BOOLEAN, 
	ocr_language VARCHAR(10), 
	extracted_metadata JSON, 
	is_evidence BOOLEAN, 
	evidence_date DATETIME, 
	exhibit_number VARCHAR(50), 
	evidence_status VARCHAR(14), 
	linked_arguments JSON, 
	linked_case_laws JSON, 
	linked_drafts JSON, 
	hash_sha256 VARCHAR(64), 
	version INTEGER, 
	created_at DATETIME, 
	updated_at DATETIME, 
	PRIMARY KEY (id), 
	FOREIGN KEY(case_id) REFERENCES cases (id), 
	FOREIGN KEY(client_id) REFERENCES clients (id), 
	FOREIGN KEY(uploaded_by_id) REFERENCES users (id), 
	FOREIGN KEY(modified_by_id) REFERENCES users (id), 
	FOREIGN KEY(downloaded_by_id) REFERENCES users (id), 
	FOREIGN KEY(filed_by_id) REFERENCES users (id)
);
INSERT INTO documents VALUES('17134885c8454e40b23f6d5dc0e5a19d','Bank Statement (Jan-Mar 2025)',NULL,NULL,1542000,'application/pdf','BANK_RECORD','bd5825784d88454484fea31014007c70','5029237114324155b3d66c1391ed441b','d08ceb8e901b42e09aabac65b45c2c32',NULL,NULL,NULL,NULL,'[]',NULL,NULL,1,NULL,'{"Date": "2025-04-01", "Parties": ["State Bank of India", "Rajiv Kumar"], "Reference Number": "SBI/12345/2025"}',1,'2025-04-01 00:00:00.000000','Exhibit P-1','MARKED_EXHIBIT','[]','[]','[]',NULL,1,'2026-06-07 16:01:36.580618','2026-06-07 16:01:36.580619');
INSERT INTO documents VALUES('5473345644cc4940a97c708eeb90b339','Medical Certificate (Dr. R.K. Mehta)',NULL,NULL,820000,'application/pdf','MEDICAL_RECORD','bd5825784d88454484fea31014007c70','5029237114324155b3d66c1391ed441b','d08ceb8e901b42e09aabac65b45c2c32',NULL,NULL,NULL,NULL,'[]',NULL,NULL,1,NULL,'{"Date": "2025-04-15", "Parties": ["City Hospital", "Rajiv Kumar"], "Reference Number": "MED/2025/8891"}',1,'2025-04-15 00:00:00.000000','Exhibit P-2','VERIFIED','[]','[]','[]',NULL,1,'2026-06-07 16:01:36.580622','2026-06-07 16:01:36.580622');
CREATE TABLE drafts (
	id UUID NOT NULL, 
	title VARCHAR(500) NOT NULL, 
	content TEXT, 
	category VARCHAR(17) NOT NULL, 
	practice_area VARCHAR(255), 
	subcategory VARCHAR(255), 
	court_type VARCHAR(255), 
	storage_url VARCHAR(1000), 
	status VARCHAR(50), 
	language VARCHAR(8), 
	case_id UUID, 
	client_id UUID, 
	created_by_id UUID NOT NULL, 
	tags JSON, 
	is_template BOOLEAN, 
	ai_generated BOOLEAN, 
	ai_prompt TEXT, 
	version INTEGER, 
	parent_id UUID, 
	word_count INTEGER, 
	sections_used JSON, 
	cases_cited JSON, 
	is_public_template BOOLEAN, 
	firm_id UUID, 
	created_at DATETIME, 
	updated_at DATETIME, 
	PRIMARY KEY (id), 
	FOREIGN KEY(case_id) REFERENCES cases (id), 
	FOREIGN KEY(client_id) REFERENCES clients (id), 
	FOREIGN KEY(created_by_id) REFERENCES users (id), 
	FOREIGN KEY(parent_id) REFERENCES drafts (id), 
	FOREIGN KEY(firm_id) REFERENCES firms (id)
);
INSERT INTO drafts VALUES('3cc4110328ef4b7bb51e21a3b1d6869a','Vakalatnama',unistr('BEFORE THE HON''BLE COURT OF [COURT_NAME] AT [COURT_CITY]\u000a\u000aCase No: [CASE_NO]\u000a\u000a[PETITIONER_NAME] ............................................ Petitioner\u000a                          VERSUS\u000a[RESPONDENT_NAME] ............................................ Respondent\u000a\u000aVAKALATNAMA\u000a\u000aI/We, [CLIENT_NAME], do hereby appoint and retain [ADVOCATE_NAME] to act and appear for me/us in the above suit/appeal/petition and on my/our behalf to conduct and prosecute (or defend) the same and all proceedings that may be taken in respect of any application connected with the same...'),'OTHER',NULL,NULL,NULL,NULL,'active','ENGLISH',NULL,NULL,'d08ceb8e901b42e09aabac65b45c2c32','[]',1,0,NULL,1,NULL,NULL,'[]','[]',0,NULL,'2026-06-07 16:01:36.569509','2026-06-07 16:01:36.569511');
CREATE TABLE case_notes (
	id UUID NOT NULL, 
	case_id UUID NOT NULL, 
	created_by_id UUID NOT NULL, 
	content TEXT NOT NULL, 
	note_type VARCHAR(50), 
	is_pinned BOOLEAN, 
	created_at DATETIME, 
	updated_at DATETIME, 
	PRIMARY KEY (id), 
	FOREIGN KEY(case_id) REFERENCES cases (id), 
	FOREIGN KEY(created_by_id) REFERENCES users (id)
);
CREATE TABLE case_advocates (
	id UUID NOT NULL, 
	case_id UUID NOT NULL, 
	advocate_id UUID NOT NULL, 
	assigned_by_id UUID, 
	role VARCHAR(9), 
	start_date DATE, 
	end_date DATE, 
	is_active BOOLEAN, 
	transfer_reason VARCHAR(255), 
	notes TEXT, 
	created_at DATETIME, 
	updated_at DATETIME, 
	PRIMARY KEY (id), 
	FOREIGN KEY(case_id) REFERENCES cases (id), 
	FOREIGN KEY(advocate_id) REFERENCES users (id), 
	FOREIGN KEY(assigned_by_id) REFERENCES users (id)
);
CREATE TABLE case_tasks (
	id UUID NOT NULL, 
	case_id UUID NOT NULL, 
	assignee_id UUID, 
	assigned_by_id UUID, 
	title VARCHAR(500) NOT NULL, 
	description TEXT, 
	task_type VARCHAR(19), 
	status VARCHAR(11), 
	priority VARCHAR(20), 
	deadline DATE, 
	completed_at DATETIME, 
	reviewed_at DATETIME, 
	notes TEXT, 
	created_at DATETIME, 
	updated_at DATETIME, 
	PRIMARY KEY (id), 
	FOREIGN KEY(case_id) REFERENCES cases (id), 
	FOREIGN KEY(assignee_id) REFERENCES users (id), 
	FOREIGN KEY(assigned_by_id) REFERENCES users (id)
);
CREATE TABLE intakes (
	id UUID NOT NULL, 
	client_id UUID, 
	case_id UUID, 
	narrative TEXT, 
	facts TEXT, 
	opponent_details TEXT, 
	witness_details TEXT, 
	previous_litigation TEXT, 
	urgency_level VARCHAR(50), 
	chronology JSON, 
	document_checklist JSON, 
	applicable_sections JSON, 
	facts_list JSON, 
	assessment JSON, 
	relief_sought TEXT, 
	strengths TEXT, 
	weaknesses TEXT, 
	risks TEXT, 
	limitation_issues TEXT, 
	jurisdiction_issues TEXT, 
	additional_docs_required TEXT, 
	status VARCHAR(13), 
	date_of_acceptance DATETIME, 
	fee_agreement TEXT, 
	consent_received BOOLEAN, 
	consent_details TEXT, 
	created_at DATETIME, 
	updated_at DATETIME, 
	PRIMARY KEY (id), 
	FOREIGN KEY(client_id) REFERENCES clients (id), 
	FOREIGN KEY(case_id) REFERENCES cases (id)
);
CREATE TABLE case_laws (
	id UUID NOT NULL, 
	title VARCHAR(255) NOT NULL, 
	citation VARCHAR(255), 
	court_name VARCHAR(255), 
	judge_name VARCHAR(255), 
	judgment_date DATE, 
	practice_area VARCHAR(100), 
	keywords JSON, 
	mapped_sections JSON, 
	important_paragraphs JSON, 
	arguments JSON, 
	summary TEXT, 
	ratio_decidendi TEXT, 
	key_findings TEXT, 
	personal_notes TEXT, 
	document_url VARCHAR(1024), 
	is_favorite BOOLEAN, 
	case_id UUID, 
	firm_id UUID, 
	created_by_id UUID, 
	PRIMARY KEY (id), 
	FOREIGN KEY(case_id) REFERENCES cases (id) ON DELETE SET NULL, 
	FOREIGN KEY(firm_id) REFERENCES firms (id), 
	FOREIGN KEY(created_by_id) REFERENCES users (id)
);
INSERT INTO case_laws VALUES('aae790b59380431690e6fa7f28af9a55','ABC vs XYZ','AIR 2025 SC 100','Supreme Court of India','Hon''ble Justice D.Y. Chandrachud','2025-02-10','Criminal Law','["Cheque Bounce", "NI Act", "Summons"]','["NI Act S.138", "BNSS S.316"]','[{"para_number": 14, "text": "We are of the considered view that a composite demand..."}, {"para_number": 18, "text": "The legislative intent is clear..."}]','[]','The court held that a statutory notice under Section 138 must be strictly construed and any ambiguity in the demand amount invalidates the complaint.','A demand for an unquantified or vague amount in the statutory notice does not constitute a valid legal demand under Section 138 of the Negotiable Instruments Act.',unistr('1. Notice must be clear regarding the cheque amount.\u000a2. Interest claims must be separable from the principal cheque amount in the demand.'),'Useful for the Sharma matter where the opponent claimed interest in the demand notice.',NULL,1,NULL,NULL,NULL);
CREATE TABLE advance_payments (
	id UUID NOT NULL, 
	client_id UUID NOT NULL, 
	case_id UUID, 
	amount_received FLOAT NOT NULL, 
	amount_utilized FLOAT NOT NULL, 
	balance FLOAT NOT NULL, 
	date DATE NOT NULL, 
	payment_method VARCHAR(50) NOT NULL, 
	reference VARCHAR(100), 
	notes TEXT, 
	created_at DATETIME, 
	PRIMARY KEY (id), 
	FOREIGN KEY(client_id) REFERENCES clients (id), 
	FOREIGN KEY(case_id) REFERENCES cases (id)
);
INSERT INTO advance_payments VALUES('88004a1f415040f4b981e02a04c544ff','5029237114324155b3d66c1391ed441b','bd5825784d88454484fea31014007c70',25000.0,0.0,25000.0,'2025-05-10','bank_transfer','NEFT-UBIN0012','Initial retainer','2026-06-07 16:01:36.578184');
CREATE TABLE witnesses (
	id UUID NOT NULL, 
	case_id UUID NOT NULL, 
	name VARCHAR(255) NOT NULL, 
	address TEXT, 
	mobile VARCHAR(20), 
	statement TEXT, 
	status VARCHAR(50), 
	supporting_documents JSON, 
	created_at DATETIME, 
	updated_at DATETIME, 
	PRIMARY KEY (id), 
	FOREIGN KEY(case_id) REFERENCES cases (id)
);
INSERT INTO witnesses VALUES('3cad156a3a44411684740aad45963dff','bd5825784d88454484fea31014007c70','Ramesh Kumar (Bank Manager)','SBI Branch, MG Road','+91 98765 00000','I confirm the bank statement provided belongs to the account holder and was generated on 1st April 2025.','Statement Recorded','[]','2026-06-07 16:01:36.581647','2026-06-07 16:01:36.581648');
INSERT INTO witnesses VALUES('d66be795e1304efdac8cee3c4397a98c','bd5825784d88454484fea31014007c70','Dr. R.K. Mehta','City Hospital','+91 98765 99999','I examined the petitioner on 15th April. The injuries were consistent with the incident reported.','Pending Examination','[]','2026-06-07 16:01:36.581650','2026-06-07 16:01:36.581650');
CREATE TABLE filings (
	id UUID NOT NULL, 
	case_id UUID NOT NULL, 
	draft_id UUID, 
	created_by_id UUID NOT NULL, 
	title VARCHAR(500) NOT NULL, 
	filing_type VARCHAR(100), 
	status VARCHAR(15), 
	filing_date DATE, 
	acceptance_date DATE, 
	defect_raised_date DATE, 
	court_fee FLOAT, 
	stamp_duty FLOAT, 
	estamp_reference VARCHAR(100), 
	other_costs FLOAT, 
	checklist JSON, 
	document_ids JSON, 
	notes TEXT, 
	defect_description TEXT, 
	created_at DATETIME, 
	updated_at DATETIME, 
	PRIMARY KEY (id), 
	FOREIGN KEY(case_id) REFERENCES cases (id), 
	FOREIGN KEY(draft_id) REFERENCES drafts (id), 
	FOREIGN KEY(created_by_id) REFERENCES users (id)
);
CREATE TABLE fees (
	id UUID NOT NULL, 
	client_id UUID NOT NULL, 
	case_id UUID, 
	hearing_id UUID, 
	invoice_id UUID, 
	category VARCHAR(100) NOT NULL, 
	description TEXT, 
	amount FLOAT NOT NULL, 
	date DATE NOT NULL, 
	is_billed BOOLEAN, 
	created_at DATETIME, 
	PRIMARY KEY (id), 
	FOREIGN KEY(client_id) REFERENCES clients (id), 
	FOREIGN KEY(case_id) REFERENCES cases (id), 
	FOREIGN KEY(hearing_id) REFERENCES hearings (id), 
	FOREIGN KEY(invoice_id) REFERENCES invoices (id)
);
INSERT INTO fees VALUES('2d8fafea0c254ddbb39f50ac11bf50eb','5029237114324155b3d66c1391ed441b','bd5825784d88454484fea31014007c70',NULL,NULL,'Consultation Fee','Initial 2hr legal strategy consultation',5000.0,'2025-05-12',0,'2026-06-07 16:01:36.578712');
CREATE TABLE expenses (
	id UUID NOT NULL, 
	client_id UUID NOT NULL, 
	case_id UUID, 
	invoice_id UUID, 
	category VARCHAR(100) NOT NULL, 
	description TEXT, 
	amount FLOAT NOT NULL, 
	date DATE NOT NULL, 
	is_billed BOOLEAN, 
	created_at DATETIME, 
	PRIMARY KEY (id), 
	FOREIGN KEY(client_id) REFERENCES clients (id), 
	FOREIGN KEY(case_id) REFERENCES cases (id), 
	FOREIGN KEY(invoice_id) REFERENCES invoices (id)
);
INSERT INTO expenses VALUES('a5f38aaaaec148a2ba85b707a594cc92','5029237114324155b3d66c1391ed441b','bd5825784d88454484fea31014007c70',NULL,'Court Fees','Filing court stamps',1500.0,'2025-05-15',0,'2026-06-07 16:01:36.578510');
CREATE TABLE audit_logs (
        id TEXT PRIMARY KEY,
        user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
        firm_id TEXT REFERENCES firms(id) ON DELETE SET NULL,
        action TEXT NOT NULL,
        resource_type TEXT,
        resource_id TEXT,
        ip_address TEXT,
        user_agent TEXT,
        details TEXT,
        status TEXT DEFAULT 'success',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
CREATE INDEX ix_acts_name ON acts (name);
CREATE INDEX ix_courts_name ON courts (name);
CREATE UNIQUE INDEX ix_system_settings_key ON system_settings ("key");
CREATE UNIQUE INDEX ix_users_email ON users (email);
CREATE INDEX ix_clients_firm_id ON clients (firm_id);
CREATE INDEX ix_clients_name ON clients (name);
CREATE UNIQUE INDEX ix_user_sessions_token_jti ON user_sessions (token_jti);
CREATE INDEX ix_cases_case_no ON cases (case_no);
CREATE INDEX ix_cases_firm_id ON cases (firm_id);
CREATE INDEX ix_hearings_hearing_date ON hearings (hearing_date);
CREATE UNIQUE INDEX ix_invoices_invoice_no ON invoices (invoice_no);
CREATE INDEX ix_drafts_firm_id ON drafts (firm_id);
CREATE INDEX ix_case_laws_practice_area ON case_laws (practice_area);
CREATE INDEX ix_case_laws_court_name ON case_laws (court_name);
CREATE INDEX ix_case_laws_firm_id ON case_laws (firm_id);
CREATE INDEX ix_case_laws_citation ON case_laws (citation);
CREATE INDEX ix_case_laws_title ON case_laws (title);
CREATE INDEX ix_audit_logs_firm_id ON audit_logs(firm_id);
CREATE INDEX ix_audit_logs_action ON audit_logs(action);
CREATE INDEX ix_audit_logs_created_at ON audit_logs(created_at);
COMMIT;
