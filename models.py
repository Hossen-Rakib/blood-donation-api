from database import Base
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime

# User model representing all platform accounts: requester, donor, admin
class Users(Base):
    __tablename__ = "users"

    id            = Column(Integer, primary_key=True, index=True)
    name          = Column(String(150), nullable=False)
    username      = Column(String(100), unique=True, index=True, nullable=False)
    email         = Column(String(255), unique=True, index=True, nullable=False)
    phone         = Column(String(30), nullable=False)
    hash_password = Column(String(255), nullable=False)
    role          = Column(String(30), default="requester")  # requester, donor, or admin
    location      = Column(String(150), default="Dhaka")      # Dhaka area name
    profile_image = Column(String(500), nullable=True)
    is_active     = Column(Boolean, default=True)
    created_at    = Column(DateTime, default=datetime.now)

    # Alias property for Module_16 compatibility
    @property
    def hashed_password(self):
        return self.hash_password

    @hashed_password.setter
    def hashed_password(self, value):
        self.hash_password = value

    # User profile relationships
    donor_profile  = relationship("Donors", back_populates="user", uselist=False, cascade="all, delete-orphan")
    blood_requests = relationship("BloodRequests", back_populates="requester", foreign_keys="BloodRequests.requester_id")
    notifications  = relationship("Notifications", back_populates="user", cascade="all, delete-orphan")

# Donor profile model linked to user account or standalone verified record
class Donors(Base):
    __tablename__ = "donors"

    id                 = Column(Integer, primary_key=True, index=True)
    user_id            = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    name               = Column(String(150), nullable=False)
    email              = Column(String(255), index=True, nullable=True)  # Email acts as User ID
    blood_group        = Column(String(10), index=True, nullable=False)  # A+, A-, B+, B-, AB+, AB-, O+, O-
    phone              = Column(String(30), nullable=False)              # Contact mobile number
    location           = Column(String(150), index=True, nullable=False) # Dhaka area (Mirpur, Dhanmondi, etc.)
    age                = Column(Integer, nullable=True)
    gender             = Column(String(10), nullable=True)               # Male, Female, Other
    availability       = Column(Boolean, default=True, index=True)       # Availability toggle
    verified           = Column(Boolean, default=True)                   # Admin verification badge
    last_donation_date = Column(DateTime, nullable=True)
    created_at         = Column(DateTime, default=datetime.now)

    # Donor relationships
    user             = relationship("Users", back_populates="donor_profile")
    donation_history = relationship("DonationHistory", back_populates="donor", cascade="all, delete-orphan", order_by="desc(DonationHistory.donated_date)")

# Blood requests model submitted by patients or seekers
class BloodRequests(Base):
    __tablename__ = "blood_requests"

    id                = Column(Integer, primary_key=True, index=True)
    requester_id      = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title             = Column(String(200), nullable=True, default="Blood Request")
    patient_name      = Column(String(150), nullable=False)
    blood_group       = Column(String(10), index=True, nullable=False)
    required_bags     = Column(Integer, default=1)
    hospital_name     = Column(String(255), nullable=False)
    hospital_location = Column(String(255), nullable=False)             # Hospital Dhaka area
    required_date     = Column(String(50), nullable=False)              # Required date string
    contact_number    = Column(String(30), nullable=False)
    urgency           = Column(String(30), default="normal", index=True) # normal or emergency
    additional_info   = Column(Text, nullable=True)
    status            = Column(String(30), default="pending", index=True) # pending, donor_accepted, donation_completed, cancelled
    accepted_donor_id = Column(Integer, ForeignKey("donors.id", ondelete="SET NULL"), nullable=True)
    created_at        = Column(DateTime, default=datetime.now)

    # Blood request relationships
    requester      = relationship("Users", back_populates="blood_requests", foreign_keys=[requester_id])
    accepted_donor = relationship("Donors", foreign_keys=[accepted_donor_id])

# Detailed donation history entries recording each past donation
class DonationHistory(Base):
    __tablename__ = "donation_history"

    id                = Column(Integer, primary_key=True, index=True)
    donor_id          = Column(Integer, ForeignKey("donors.id", ondelete="CASCADE"), nullable=False)
    request_id        = Column(Integer, ForeignKey("blood_requests.id", ondelete="SET NULL"), nullable=True)
    donated_date      = Column(DateTime, default=datetime.now, nullable=False)
    blood_group       = Column(String(10), nullable=False)
    bags              = Column(Integer, default=1)
    hospital_location = Column(String(255), nullable=False)
    note              = Column(Text, nullable=True)

    # Donation history relationships
    donor = relationship("Donors", back_populates="donation_history")

# In-app notifications sent to users upon request events
class Notifications(Base):
    __tablename__ = "notifications"

    id         = Column(Integer, primary_key=True, index=True)
    user_id    = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    type       = Column(String(50), nullable=False)  # new_request, request_accepted, request_completed, admin_alert
    message    = Column(Text, nullable=False)
    request_id = Column(Integer, nullable=True)
    is_read    = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.now)

    # Notifications relationships
    user = relationship("Users", back_populates="notifications")

# Reports model for spam, fake requests, or abusive accounts
class Reports(Base):
    __tablename__ = "reports"

    id               = Column(Integer, primary_key=True, index=True)
    reporter_id      = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    reported_user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    request_id       = Column(Integer, ForeignKey("blood_requests.id", ondelete="SET NULL"), nullable=True)
    reason           = Column(String(100), nullable=False)  # fake_request, spam, harassment, wrong_information
    description      = Column(Text, nullable=True)
    status           = Column(String(30), default="pending")  # pending, reviewed, dismissed
    created_at       = Column(DateTime, default=datetime.now)
