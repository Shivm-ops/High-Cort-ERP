from sqlalchemy import Column, String, Boolean, Enum, DateTime, Float, ForeignKey, Integer
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
import uuid
from datetime import datetime
import enum

from app.core.database import Base

class PlanTier(str, enum.Enum):
    FREE_TRIAL = "free_trial"
    BASIC = "basic"
    PROFESSIONAL = "professional"
    ENTERPRISE = "enterprise"

class SubscriptionStatus(str, enum.Enum):
    ACTIVE = "active"
    PAST_DUE = "past_due"
    CANCELED = "canceled"
    EXPIRED = "expired"

class PaymentStatus(str, enum.Enum):
    SUCCESS = "success"
    FAILED = "failed"
    REFUNDED = "refunded"
    PENDING = "pending"

class GatewayProvider(str, enum.Enum):
    RAZORPAY = "razorpay"
    PAYU = "payu"
    STRIPE = "stripe"
    MANUAL = "manual"

class SubscriptionPlan(Base):
    __tablename__ = "subscription_plans"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), nullable=False)
    tier = Column(String(50), unique=True, nullable=False)
    price_monthly = Column(Float, nullable=False)
    price_quarterly = Column(Float, nullable=True, default=0.0)
    price_half_yearly = Column(Float, nullable=True, default=0.0)
    price_yearly = Column(Float, nullable=False)
    max_users = Column(Integer, nullable=False)
    storage_limit_gb = Column(Float, nullable=False)
    features = Column(String(1000)) # JSON string
    is_active = Column(Boolean, default=True)

class TenantSubscription(Base):
    __tablename__ = "tenant_subscriptions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    firm_id = Column(UUID(as_uuid=True), ForeignKey("firms.id"), nullable=False, unique=True)
    plan_id = Column(UUID(as_uuid=True), ForeignKey("subscription_plans.id"), nullable=False)
    status = Column(Enum(SubscriptionStatus), default=SubscriptionStatus.ACTIVE)
    billing_cycle = Column(String(20), default="monthly") # monthly, quarterly, half_yearly, yearly
    start_date = Column(DateTime, default=datetime.utcnow)
    end_date = Column(DateTime, nullable=False)
    auto_renew = Column(Boolean, default=True)
    last_reminder_type = Column(String(50), nullable=True) # "7_days", "3_days", "0_days", "grace_period", "expired"

    firm = relationship("Firm")
    plan = relationship("SubscriptionPlan")

class PaymentTransaction(Base):
    __tablename__ = "payment_transactions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    firm_id = Column(UUID(as_uuid=True), ForeignKey("firms.id"), nullable=False)
    amount = Column(Float, nullable=False)
    currency = Column(String(10), default="INR")
    status = Column(Enum(PaymentStatus), default=PaymentStatus.PENDING)
    gateway = Column(Enum(GatewayProvider), nullable=False)
    gateway_reference = Column(String(255))
    razorpay_order_id = Column(String(100), nullable=True, index=True)
    razorpay_payment_id = Column(String(100), nullable=True, index=True)
    invoice_number = Column(String(50), nullable=True, index=True)
    invoice_url = Column(String(500), nullable=True)
    # Server-side snapshot of what was ordered (never trust the browser)
    plan_id = Column(UUID(as_uuid=True), ForeignKey("subscription_plans.id"), nullable=True)
    billing_cycle = Column(String(20), nullable=True)
    base_amount = Column(Float, nullable=True)
    gst_amount = Column(Float, nullable=True)
    payment_method = Column(String(50), nullable=True)
    failure_reason = Column(String(500), nullable=True)
    paid_at = Column(DateTime, nullable=True)
    period_start = Column(DateTime, nullable=True)
    period_end = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    firm = relationship("Firm")
    plan = relationship("SubscriptionPlan")

class RequestStatus(str, enum.Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"

class SubscriptionUpgradeRequest(Base):
    __tablename__ = "subscription_upgrade_requests"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    firm_id = Column(UUID(as_uuid=True), ForeignKey("firms.id"), nullable=False)
    requested_plan_id = Column(UUID(as_uuid=True), ForeignKey("subscription_plans.id"), nullable=False)
    billing_cycle = Column(String(20), default="monthly")
    status = Column(Enum(RequestStatus), default=RequestStatus.PENDING)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    firm = relationship("Firm")
    requested_plan = relationship("SubscriptionPlan")
