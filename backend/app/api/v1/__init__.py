from fastapi import APIRouter

from app.api.v1 import auth, users, clients, cases, hearings, drafts, billing, documents, ai, search, filings, case_team, reports, intakes, tasks, case_laws, letterhead, team, audit, subscriptions, mact, analyzer

router = APIRouter()

router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
router.include_router(users.router, prefix="/users", tags=["Users"])
router.include_router(clients.router, prefix="/clients", tags=["Clients"])
router.include_router(cases.router, prefix="/cases", tags=["Cases"])
router.include_router(hearings.router, prefix="/hearings", tags=["Hearings"])
router.include_router(drafts.router, prefix="/drafts", tags=["Drafts"])
router.include_router(billing.router, prefix="/billing", tags=["Billing"])
router.include_router(documents.router, prefix="/documents", tags=["Documents"])
router.include_router(ai.router, prefix="/ai", tags=["AI Services"])
router.include_router(search.router, prefix="/search", tags=["Search"])
router.include_router(filings.router, prefix="/filings", tags=["Filings"])
router.include_router(case_team.router, prefix="/cases", tags=["Case Team & Appeals"])
router.include_router(case_laws.router, prefix="/case-laws", tags=["Case Laws"])
router.include_router(reports.router, prefix="/reports", tags=["Reports"])
router.include_router(audit.router, prefix="/audit", tags=["Audit"])
router.include_router(subscriptions.router, prefix="/subscriptions", tags=["Subscriptions"])
from . import evidence
from . import witnesses
from . import parties
from . import orders

router.include_router(intakes.router, prefix="/intakes", tags=["Client Intake"])
router.include_router(parties.router, prefix="/cases", tags=["Parties"])
router.include_router(orders.router, prefix="/cases", tags=["Court Orders"])
router.include_router(tasks.router, prefix="/tasks", tags=["Tasks"])
router.include_router(letterhead.router, prefix="/letterhead", tags=["Letterhead"])
router.include_router(team.router, prefix="/team", tags=["Team"])
router.include_router(evidence.router, prefix="/evidence", tags=["Evidence"])
router.include_router(witnesses.router, prefix="/witnesses", tags=["Witnesses"])

from . import dashboard
router.include_router(dashboard.router, prefix="/dashboard", tags=["Dashboard"])

from . import limitations
router.include_router(limitations.router, prefix="/limitations", tags=["Limitations"])

from . import acts
router.include_router(acts.router, prefix="/acts", tags=["Legal Research Acts"])

from . import courts
router.include_router(courts.router, prefix="/courts", tags=["Courts"])

from . import admin
router.include_router(admin.router, prefix="/admin", tags=["Super Admin APIs"])

router.include_router(mact.router, prefix="/mact", tags=["MACT Management"])
router.include_router(analyzer.router, prefix="/analyzer", tags=["Court Order Analyzer"])
