from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, UUID4
from uuid import UUID

from app.core.database import get_db
from app.core.security import get_current_user
from app.core.permissions import require_feature
from app.models.user import User
from app.models.mact import MactCase, MactClaimant, MactDocument, MactInsurance, MactWorkflowLog, MactCaseStage

router = APIRouter()

# --- Pydantic Schemas ---

class ClaimantCreate(BaseModel):
    name: str
    age: Optional[int] = None
    occupation: Optional[str] = None
    monthly_income: Optional[float] = 0.0
    dependency_details: Optional[str] = None
    contact_information: Optional[str] = None
    aadhaar_pan: Optional[str] = None

class MactCaseCreate(BaseModel):
    mact_case_number: Optional[str] = None
    tribunal_name: str
    filing_date: Optional[str] = None
    accident_date: Optional[str] = None
    police_station: str
    fir_number: str
    vehicle_details: Optional[str] = None
    driver_details: Optional[str] = None
    owner_details: Optional[str] = None
    claimants: List[ClaimantCreate] = []

class InsuranceCreate(BaseModel):
    company_name: str
    policy_details: Optional[str] = None
    claim_reference_number: Optional[str] = None

class CompensationCalcRequest(BaseModel):
    age: int
    monthly_income: float
    future_prospects_pct: float
    personal_expense_deduction_pct: float
    multiplier: float
    medical_expenses: float
    loss_of_estate: float
    consortium: float
    funeral_expenses: float
    interest_rate_pct: float = 7.5
    years_since_filing: float = 0.0

# --- Routes ---

@router.post("/cases", status_code=status.HTTP_201_CREATED)
async def create_mact_case(
    data: MactCaseCreate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(require_feature("mact_management"))
):
    if not current_user.firm_id:
        raise HTTPException(status_code=400, detail="User must belong to a firm")

    f_date = datetime.strptime(data.filing_date, "%Y-%m-%d").date() if data.filing_date else None
    a_date = datetime.strptime(data.accident_date, "%Y-%m-%d").date() if data.accident_date else None

    new_case = MactCase(
        firm_id=current_user.firm_id,
        advocate_id=current_user.id,
        mact_case_number=data.mact_case_number,
        tribunal_name=data.tribunal_name,
        filing_date=f_date,
        accident_date=a_date,
        police_station=data.police_station,
        fir_number=data.fir_number,
        vehicle_details=data.vehicle_details,
        driver_details=data.driver_details,
        owner_details=data.owner_details,
        current_stage=MactCaseStage.CLIENT_INTAKE
    )
    db.add(new_case)
    db.flush()

    for c in data.claimants:
        claimant = MactClaimant(
            mact_case_id=new_case.id,
            name=c.name,
            age=c.age,
            occupation=c.occupation,
            monthly_income=c.monthly_income,
            dependency_details=c.dependency_details,
            contact_information=c.contact_information,
            aadhaar_pan=c.aadhaar_pan
        )
        db.add(claimant)
    
    # Log the creation workflow
    log = MactWorkflowLog(
        mact_case_id=new_case.id,
        stage=MactCaseStage.CLIENT_INTAKE,
        notes="Case registered successfully",
        entered_by_id=current_user.id
    )
    db.add(log)

    db.commit()
    db.refresh(new_case)
    return {"message": "MACT case created successfully", "id": str(new_case.id)}

@router.get("/cases")
async def list_mact_cases(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_feature("mact_management"))
):
    if not current_user.firm_id:
        return []
    
    cases = db.query(MactCase).filter(MactCase.firm_id == current_user.firm_id).order_by(MactCase.created_at.desc()).all()
    
    result = []
    for c in cases:
        result.append({
            "id": str(c.id),
            "mact_case_number": c.mact_case_number,
            "tribunal_name": c.tribunal_name,
            "accident_date": c.accident_date.isoformat() if c.accident_date else None,
            "police_station": c.police_station,
            "current_stage": c.current_stage.value if c.current_stage else None,
            "claimant_count": len(c.claimants),
            "insurance_company": c.insurance.company_name if c.insurance else "Not Added",
            "compensation_claimed": c.compensation_claimed
        })
    return result

@router.get("/cases/{case_id}")
async def get_mact_case(
    case_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_feature("mact_management"))
):
    case = db.query(MactCase).filter(MactCase.id == case_id, MactCase.firm_id == current_user.firm_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="MACT case not found")
    
    return {
        "id": str(case.id),
        "mact_case_number": case.mact_case_number,
        "tribunal_name": case.tribunal_name,
        "filing_date": case.filing_date.isoformat() if case.filing_date else None,
        "accident_date": case.accident_date.isoformat() if case.accident_date else None,
        "police_station": case.police_station,
        "fir_number": case.fir_number,
        "vehicle_details": case.vehicle_details,
        "driver_details": case.driver_details,
        "owner_details": case.owner_details,
        "current_stage": case.current_stage.value if case.current_stage else None,
        "compensation_claimed": case.compensation_claimed,
        "compensation_awarded": case.compensation_awarded,
        "claimants": [{
            "id": str(cl.id),
            "name": cl.name,
            "age": cl.age,
            "occupation": cl.occupation,
            "monthly_income": cl.monthly_income,
            "dependency_details": cl.dependency_details,
            "contact_information": cl.contact_information,
            "aadhaar_pan": cl.aadhaar_pan
        } for cl in case.claimants],
        "insurance": {
            "id": str(case.insurance.id),
            "company_name": case.insurance.company_name,
            "policy_details": case.insurance.policy_details,
            "claim_reference_number": case.insurance.claim_reference_number,
            "award_compliance_status": case.insurance.award_compliance_status,
            "settlement_offers": case.insurance.settlement_offers,
            "correspondence_log": case.insurance.correspondence_log
        } if case.insurance else None,
        "documents": [{
            "id": str(d.id),
            "document_type": d.document_type,
            "file_name": d.file_name,
            "file_url": d.file_url,
            "uploaded_at": d.uploaded_at.isoformat()
        } for d in case.documents],
        "workflow": [{
            "id": str(w.id),
            "stage": w.stage.value,
            "notes": w.notes,
            "created_at": w.created_at.isoformat(),
            "entered_by": w.entered_by.full_name if w.entered_by else "System"
        } for w in sorted(case.workflow_logs, key=lambda x: x.created_at, reverse=True)]
    }

@router.post("/cases/{case_id}/insurance")
async def add_mact_insurance(
    case_id: UUID,
    data: InsuranceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    case = db.query(MactCase).filter(MactCase.id == case_id, MactCase.firm_id == current_user.firm_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
        
    if case.insurance:
        # Update existing
        case.insurance.company_name = data.company_name
        case.insurance.policy_details = data.policy_details
        case.insurance.claim_reference_number = data.claim_reference_number
    else:
        # Create new
        ins = MactInsurance(
            mact_case_id=case_id,
            company_name=data.company_name,
            policy_details=data.policy_details,
            claim_reference_number=data.claim_reference_number
        )
        db.add(ins)
    
    db.commit()
    return {"message": "Insurance details updated"}

@router.post("/calculator")
async def calculate_mact_compensation(
    data: CompensationCalcRequest,
    current_user: User = Depends(require_feature("mact_management"))
):
    """
    Standard formula for Loss of Dependency:
    (Monthly Income + Future Prospects) - Personal Expenses = Monthly Dependency
    Annual Dependency = Monthly Dependency * 12
    Total Loss of Dependency = Annual Dependency * Multiplier
    
    Total Compensation = Total Loss of Dependency + Medical + Estate + Consortium + Funeral
    """
    future_prospects_amt = data.monthly_income * (data.future_prospects_pct / 100.0)
    income_with_prospects = data.monthly_income + future_prospects_amt
    
    deduction_amt = income_with_prospects * (data.personal_expense_deduction_pct / 100.0)
    monthly_dependency = income_with_prospects - deduction_amt
    annual_dependency = monthly_dependency * 12
    
    loss_of_dependency = annual_dependency * data.multiplier
    
    total_compensation = loss_of_dependency + data.medical_expenses + data.loss_of_estate + data.consortium + data.funeral_expenses
    
    # Interest calculation
    interest_amount = total_compensation * (data.interest_rate_pct / 100.0) * data.years_since_filing
    final_award = total_compensation + interest_amount
    
    return {
        "monthly_dependency": round(monthly_dependency, 2),
        "annual_dependency": round(annual_dependency, 2),
        "loss_of_dependency": round(loss_of_dependency, 2),
        "total_compensation": round(total_compensation, 2),
        "interest_amount": round(interest_amount, 2),
        "final_award": round(final_award, 2),
        "breakdown": {
            "future_prospects_added": round(future_prospects_amt, 2),
            "personal_expenses_deducted": round(deduction_amt, 2),
            "medical_expenses": data.medical_expenses,
            "loss_of_estate": data.loss_of_estate,
            "consortium": data.consortium,
            "funeral_expenses": data.funeral_expenses
        }
    }

@router.get("/dashboard")
async def get_mact_dashboard_metrics(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_feature("mact_management"))
):
    if not current_user.firm_id:
        return {}
        
    cases = db.query(MactCase).filter(MactCase.firm_id == current_user.firm_id).all()
    
    total_cases = len(cases)
    active_cases = len([c for c in cases if c.current_stage != MactCaseStage.EXECUTION])
    award_pending = len([c for c in cases if c.current_stage in [MactCaseStage.EVIDENCE, MactCaseStage.ARGUMENTS]])
    
    total_claimed = sum([c.compensation_claimed or 0 for c in cases])
    total_awarded = sum([c.compensation_awarded or 0 for c in cases])
    
    return {
        "total_cases": total_cases,
        "active_cases": active_cases,
        "award_pending": award_pending,
        "total_claimed": total_claimed,
        "total_awarded": total_awarded
    }
