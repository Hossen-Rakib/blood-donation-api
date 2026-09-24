from database import Base
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime

class Users(Base):
    __tablename__ = "users"

    id            = Column(Integer, primary_key=True, index=True)
    name          = Column(String(150), nullable=False)
    username      = Column(String(100), unique=True, index=True, nullable=False)
    email         = Column(String(255), unique=True, index=True, nullable=False)
    phone         = Column(String(30), nullable=False)
    hash_password = Column(String(255), nullable=False)
    role          = Column(String(30), default="user")       
    location      = Column(String(150), default="Dhaka")      
    profile_image = Column(String(500), nullable=True)
    is_active     = Column(Boolean, default=True)
    created_at    = Column(DateTime, default=datetime.utcnow)

    @property
    def hashed_password(self):
        return self.hash_password

    @hashed_password.setter
    def hashed_password(self, value):
        self.hash_password = value

    donor_profile  = relationship("Donors", back_populates="user", uselist=False, cascade="all, delete-orphan")
    blood_requests = relationship("BloodRequests", back_populates="requester", foreign_keys="BloodRequests.requester_id")
    notifications  = relationship("Notifications", back_populates="user", cascade="all, delete-orphan")


class Donors(Base):
    __tablename__ = "donors"

    id                 = Column(Integer, primary_key=True, index=True)
    user_id            = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    name               = Column(String(150), nullable=False)
    email              = Column(String(255), index=True, nullable=True)
    blood_group        = Column(String(10), index=True, nullable=False)
    phone              = Column(String(30), nullable=False)
    location           = Column(String(150), index=True, nullable=False)
    age                = Column(Integer, nullable=True)
    gender             = Column(String(10), nullable=True)
    availability       = Column(Boolean, default=True, index=True)
    verified           = Column(Boolean, default=True)
    last_donation_date = Column(DateTime, nullable=True)
    created_at         = Column(DateTime, default=datetime.utcnow)

    user             = relationship("Users", back_populates="donor_profile")
    donation_history = relationship("DonationHistory", back_populates="donor", cascade="all, delete-orphan", order_by="desc(DonationHistory.donated_date)")


class BloodRequests(Base):
    __tablename__ = "blood_requests"

    id                = Column(Integer, primary_key=True, index=True)
    requester_id      = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title             = Column(String(200), nullable=True, default="Blood Request")
    patient_name      = Column(String(150), nullable=False)
    blood_group       = Column(String(10), index=True, nullable=False)
    required_bags     = Column(Integer, default=1)
    hospital_name     = Column(String(255), nullable=False)
    hospital_location = Column(String(255), nullable=False)
    required_date     = Column(String(50), nullable=False)
    contact_number    = Column(String(30), nullable=False)
    urgency           = Column(String(30), default="normal", index=True)
    additional_info   = Column(Text, nullable=True)
    status            = Column(String(30), default="pending", index=True)
    accepted_donor_id = Column(Integer, ForeignKey("donors.id", ondelete="SET NULL"), nullable=True)
    created_at        = Column(DateTime, default=datetime.utcnow)

    requester      = relationship("Users", back_populates="blood_requests", foreign_keys=[requester_id])
    accepted_donor = relationship("Donors", foreign_keys=[accepted_donor_id])


class DonationHistory(Base):
    __tablename__ = "donation_history"

    id                = Column(Integer, primary_key=True, index=True)
    donor_id          = Column(Integer, ForeignKey("donors.id", ondelete="CASCADE"), nullable=False)
    request_id        = Column(Integer, ForeignKey("blood_requests.id", ondelete="SET NULL"), nullable=True)
    donated_date      = Column(DateTime, default=datetime.utcnow, nullable=False)
    blood_group       = Column(String(10), nullable=False)
    bags              = Column(Integer, default=1)
    hospital_location = Column(String(255), nullable=False)
    note              = Column(Text, nullable=True)

    donor = relationship("Donors", back_populates="donation_history")


class Notifications(Base):
    __tablename__ = "notifications"

    id         = Column(Integer, primary_key=True, index=True)
    user_id    = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    type       = Column(String(50), nullable=False)
    message    = Column(Text, nullable=False)
    request_id = Column(Integer, nullable=True)
    is_read    = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("Users", back_populates="notifications")


class Reports(Base):
    __tablename__ = "reports"

    id               = Column(Integer, primary_key=True, index=True)
    reporter_id      = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    reported_user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    request_id       = Column(Integer, ForeignKey("blood_requests.id", ondelete="SET NULL"), nullable=True)
    reason           = Column(String(100), nullable=False)
    description      = Column(Text, nullable=True)
    status           = Column(String(30), default="pending")
    created_at       = Column(DateTime, default=datetime.utcnow)