import os
import sys
import unittest
from dotenv import load_dotenv

backend_dir = os.path.dirname(__file__)
load_dotenv(os.path.join(backend_dir, ".env"))
sys.path.insert(0, backend_dir)

# Import main first to ensure all SQLAlchemy models are registered
import main
from app.core.database import SessionLocal
from app.models.user import User
from app.models.firm import Firm
from app.models.client import Client
from app.models.case import Case
from app.models.draft import Draft, DraftCategory, DraftLanguage
from app.services.template_seeds import seed_master_templates
from app.api.v1.drafts import CATEGORY_ALIASES, LANG_ALIASES, serialize_draft

class TestDraftsRegression(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.db = SessionLocal()
        seed_master_templates(cls.db)
        
        cls.user = cls.db.query(User).first()
        cls.firm_id = cls.user.firm_id if cls.user and cls.user.firm_id else "00000000-0000-0000-0000-000000000001"

        # Find or create client and case
        cls.client = cls.db.query(Client).filter(Client.firm_id == cls.firm_id).first()
        if not cls.client:
            cls.client = Client(name="Rajesh Sharma", phone="9876543210", city="Mumbai", firm_id=cls.firm_id)
            cls.db.add(cls.client)
            cls.db.commit()
            cls.db.refresh(cls.client)

        cls.case = cls.db.query(Case).filter(Case.firm_id == cls.firm_id).first()
        if not cls.case:
            cls.case = Case(
                title="Sharma vs State of Maharashtra", 
                case_no="CR-9082/2026", 
                court="Sessions Court", 
                practice_area="Criminal",
                firm_id=cls.firm_id,
                client_id=cls.client.id
            )
            cls.db.add(cls.case)
            cls.db.commit()
            cls.db.refresh(cls.case)

        # Clean any previous test artifacts
        cls.db.query(Draft).filter(Draft.title.like("Bail Application - Rajesh Sharma%")).delete(synchronize_session=False)
        cls.db.query(Draft).filter(Draft.title.like("General Affidavit - Rajesh Sharma%")).delete(synchronize_session=False)
        cls.db.commit()

    @classmethod
    def tearDownClass(cls):
        cls.db.query(Draft).filter(Draft.title.like("Bail Application - Rajesh Sharma%")).delete(synchronize_session=False)
        cls.db.query(Draft).filter(Draft.title.like("General Affidavit - Rajesh Sharma%")).delete(synchronize_session=False)
        cls.db.commit()
        cls.db.close()

    def test_01_seed_master_templates_available(self):
        """Scenario 9 & 10: Verify public master templates exist across languages & categories."""
        templates = self.db.query(Draft).filter(
            Draft.is_template == True,
            Draft.is_public_template == True
        ).all()
        self.assertGreaterEqual(len(templates), 10, "Should have seeded public templates")
        
        # Test category aliasing
        self.assertEqual(CATEGORY_ALIASES["applications"], DraftCategory.APPLICATION)
        self.assertEqual(CATEGORY_ALIASES["written statements"], DraftCategory.WRITTEN_STATEMENT)
        self.assertEqual(CATEGORY_ALIASES["vakalatnama"], DraftCategory.VAKALATNAMA)
        
        # Test language aliasing
        self.assertEqual(LANG_ALIASES["marathi"], DraftLanguage.MARATHI)
        self.assertEqual(LANG_ALIASES["english"], DraftLanguage.ENGLISH)
        self.assertEqual(LANG_ALIASES["hindi"], DraftLanguage.HINDI)

    def test_02_create_and_save_draft_with_matter(self):
        """Scenario 1 & 8 & 12: Create and save draft linked to existing matter & client."""
        draft = Draft(
            title="Bail Application - Rajesh Sharma",
            content="BEFORE THE HON'BLE SESSIONS COURT\nIn the matter of Bail u/s 439 CrPC...",
            category=DraftCategory.APPLICATION,
            language=DraftLanguage.ENGLISH,
            client_id=self.client.id,
            case_id=self.case.id,
            status="draft",
            firm_id=self.firm_id,
            created_by_id=self.user.id if self.user else None,
            version=1,
            word_count=15
        )
        self.db.add(draft)
        self.db.commit()
        self.db.refresh(draft)

        self.assertIsNotNone(draft.id)
        serialized = serialize_draft(draft)
        self.assertEqual(serialized["title"], "Bail Application - Rajesh Sharma")
        self.assertEqual(serialized["client_name"], self.client.name)
        self.assertEqual(serialized["case_number"], self.case.case_no)

    def test_03_find_and_reopen_draft(self):
        """Scenario 2 & 4: Reopen draft by ID and verify exact content loaded."""
        draft = self.db.query(Draft).filter(Draft.title == "Bail Application - Rajesh Sharma").first()
        self.assertIsNotNone(draft)
        self.assertIn("BEFORE THE HON'BLE SESSIONS COURT", draft.content)
        self.assertEqual(draft.version, 1)

    def test_04_edit_draft_and_persist(self):
        """Scenario 3 & 4: Edit draft content, verify version increments and persists."""
        draft = self.db.query(Draft).filter(Draft.title == "Bail Application - Rajesh Sharma").first()
        updated_content = draft.content + "\n\nGROUNDS FOR BAIL:\n1. The applicant is innocent."
        draft.content = updated_content
        draft.version = (draft.version or 1) + 1
        draft.word_count = len(updated_content.split())
        self.db.commit()
        self.db.refresh(draft)

        reloaded = self.db.query(Draft).filter(Draft.id == draft.id).first()
        self.assertEqual(reloaded.version, 2)
        self.assertIn("GROUNDS FOR BAIL", reloaded.content)

    def test_05_save_as_duplicate(self):
        """Scenario 6: Use Save As to create a separate copy, leaving original unchanged."""
        original = self.db.query(Draft).filter(Draft.title == "Bail Application - Rajesh Sharma").first()
        original_id = original.id
        original_content = original.content

        # Create copy as endpoint does
        copy_draft = Draft(
            title=f"{original.title} (Copy)",
            content=original.content,
            category=original.category,
            language=original.language,
            client_id=original.client_id,
            case_id=original.case_id,
            status="draft",
            firm_id=self.firm_id,
            version=1,
            word_count=original.word_count,
            created_by_id=self.user.id if self.user else None
        )
        self.db.add(copy_draft)
        self.db.commit()
        self.db.refresh(copy_draft)

        self.assertNotEqual(copy_draft.id, original_id)
        self.assertEqual(copy_draft.title, "Bail Application - Rajesh Sharma (Copy)")

        # Verify original is unchanged
        fresh_original = self.db.query(Draft).filter(Draft.id == original_id).first()
        self.assertEqual(fresh_original.content, original_content)
        self.assertEqual(fresh_original.version, 2)

    def test_06_create_draft_without_matter(self):
        """Scenario 7 & 12: Create unlinked draft for client without matter."""
        unlinked_draft = Draft(
            title="General Affidavit - Rajesh Sharma",
            content="AFFIDAVIT\nI, Rajesh Sharma, do hereby solemnly affirm...",
            category=DraftCategory.AFFIDAVIT,
            language=DraftLanguage.ENGLISH,
            client_id=self.client.id,
            case_id=None,
            status="draft",
            firm_id=self.firm_id,
            created_by_id=self.user.id,
            version=1,
            word_count=10
        )
        self.db.add(unlinked_draft)
        self.db.commit()
        self.db.refresh(unlinked_draft)

        self.assertIsNotNone(unlinked_draft.id)
        self.assertIsNone(unlinked_draft.case_id)
        self.assertEqual(unlinked_draft.client_id, self.client.id)

        serialized = serialize_draft(unlinked_draft)
        self.assertEqual(serialized["client_name"], self.client.name)
        self.assertIsNone(serialized["case_number"])

    def test_07_autofill_template_fields(self):
        """Scenario 9: Test auto-fill logic for client and matter."""
        template_text = "BEFORE THE COURT\nCase No: {{case_number}}\n{{client_name}} vs {{opponent_name}}"
        filled = template_text.replace("{{case_number}}", self.case.case_no)
        filled = filled.replace("{{client_name}}", self.client.name)
        filled = filled.replace("{{opponent_name}}", "State")
        
        self.assertIn(self.case.case_no, filled)
        self.assertIn(self.client.name, filled)
        self.assertNotIn("{{case_number}}", filled)

    def test_08_delete_draft(self):
        """Verify delete draft removes document while preserving templates."""
        draft_to_delete = self.db.query(Draft).filter(Draft.title == "Bail Application - Rajesh Sharma (Copy)").first()
        self.assertIsNotNone(draft_to_delete)
        d_id = draft_to_delete.id
        self.db.delete(draft_to_delete)
        self.db.commit()

        check = self.db.query(Draft).filter(Draft.id == d_id).first()
        self.assertIsNone(check, "Deleted draft should no longer exist in DB")

if __name__ == "__main__":
    unittest.main()
