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
    billing_cycle = Column(String(20), default="monthly") # monthly, yearly
    start_date = Column(DateTime, default=datetime.utcnow)
    end_date = Column(DateTime, nullable=False)
    auto_renew = Column(Boolean, default=True)

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
    invoice_url = Column(String(500))
    created_at = Column(DateTime, default=datetime.utcnow)

    firm = relationship("Firm")

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
