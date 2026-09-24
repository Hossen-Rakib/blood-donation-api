from fastapi import APIRouter, Depends, HTTPException, status, Query
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import Annotated, Optional
from database import SessionLocal
from models import Users, Donors, DonationHistory, BloodRequests, Notifications
from router.auth import (
    get_current_user,
    user_dependency,
    db_dependency,
    hash_password_func,
    create_access_token,
    ACCESS_TOKEN_EXPIRE_MINUTES,
)
from fastapi.responses import JSONResponse

# Donor operations router
router = APIRouter(prefix="/donor", tags=["Donor Operations"])

# Schema for donor registration
class DonorRegister(BaseModel):
    name: str = Field(..., description="Donor's Full Name")
    email: str = Field(..., description="Donor's Email Address (Acts as User ID)")
    phone: str = Field(..., description="Mobile Phone Number")
    password: str = Field(..., min_length=4, description="Account Password")
    blood_group: str = Field(..., description="Blood Group e.g. A+, A-, B+, B-, AB+, AB-, O+, O-")
    location: str = Field(default="Dhaka", description="Dhaka Area (Mirpur, Dhanmondi, etc.)")
    age: Optional[int] = Field(default=None, description="Age in years")
    gender: Optional[str] = Field(default=None, description="Male, Female, Other")
    last_donation_date: Optional[datetime] = Field(default=None, description="Date of last donation")

# Schema for updating donor profile details
class DonorProfileUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    location: Optional[str] = None
    blood_group: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    availability: Optional[bool] = None

# Schema for activating or becoming a donor for any existing user
class BecomeDonorRequest(BaseModel):
    blood_group: str = Field(..., description="Blood Group e.g. A+, A-, B+, B-, AB+, AB-, O+, O-")
    location: Optional[str] = Field(default=None, description="Dhaka Area")
    phone: Optional[str] = Field(default=None, description="Mobile Phone Number")
    age: Optional[int] = Field(default=None, description="Age in years")
    gender: Optional[str] = Field(default=None, description="Male, Female, Other")
    availability: Optional[bool] = Field(default=True, description="Availability toggle")

# Backward compatibility alias for donor registration
@router.post("/register", status_code=status.HTTP_201_CREATED, include_in_schema=False)
def register_donor(donor_data: DonorRegister, db: db_dependency):
    clean_email = donor_data.email.strip().lower()
    clean_bg = donor_data.blood_group.strip().upper()

    # Check if email is already registered in users table
    existing_user = db.query(Users).filter(
        (Users.email.ilike(clean_email)) | (Users.username.ilike(clean_email))
    ).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="This email is already registered. Please login instead.")

    # 1. Create User account with email as User ID
    new_user = Users(
        name=donor_data.name.strip(),
        username=clean_email,
        email=clean_email,
        phone=donor_data.phone.strip(),
        hash_password=hash_password_func(donor_data.password),
        role="user",
        location=donor_data.location.strip(),
        is_active=True,
    )
    db.add(new_user)
    db.flush()

    # 2. Create Donors record
    new_donor = Donors(
        user_id=new_user.id,
        name=donor_data.name.strip(),
        email=clean_email,
        blood_group=clean_bg,
        phone=donor_data.phone.strip(),
        location=donor_data.location.strip(),
        age=donor_data.age,
        gender=donor_data.gender,
        availability=True,
        verified=True,
        last_donation_date=donor_data.last_donation_date,
    )
    db.add(new_donor)
    db.commit()
    db.refresh(new_user)
    db.refresh(new_donor)

    # 3. Create access token for immediate login
    token = create_access_token(
        new_user.username,
        new_user.id,
        new_user.role,
        timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )

    return {
        "message": "Donor registered successfully! Use your email to log in.",
        "access_token": token,
        "token_type": "bearer",
        "user_id": new_user.id,
        "donor_id": new_donor.id,
        "name": new_donor.name,
        "email": new_donor.email,
        "blood_group": new_donor.blood_group,
        "phone": new_donor.phone,
        "location": new_donor.location,
        "availability": new_donor.availability,
        "status_label": "Available",
    }

# Get current logged-in donor profile and summary stats
@router.get("/me")
def get_donor_dashboard(user: user_dependency, db: db_dependency):
    donor = db.query(Donors).filter(Donors.user_id == user["id"]).first()
    if not donor:
        raise HTTPException(
            status_code=404,
            detail="Donor profile not found for this account. You may register as a donor first."
        )

    history = (
        db.query(DonationHistory)
        .filter(DonationHistory.donor_id == donor.id)
        .order_by(DonationHistory.donated_date.desc())
        .all()
    )

    total_bags = sum(h.bags for h in history)

    return {
        "id": donor.id,
        "name": donor.name,
        "blood_group": donor.blood_group,
        "phone": donor.phone,
        "location": donor.location,
        "age": donor.age,
        "gender": donor.gender,
        "availability": donor.availability,
        "verified": donor.verified,
        "last_donation_date": donor.last_donation_date,
        "total_donations": len(history),
        "total_bags_donated": total_bags,
        "recent_history": [
            {
                "id": h.id,
                "donated_date": h.donated_date.strftime("%Y-%m-%d") if h.donated_date else None,
                "blood_group": h.blood_group,
                "bags": h.bags,
                "hospital_location": h.hospital_location,
                "note": h.note,
            }
            for h in history
        ]
    }

# Create or activate donor profile for current logged-in user
@router.post("/become-donor", include_in_schema=False)
def become_or_activate_donor(user: user_dependency, db: db_dependency, donor_data: BecomeDonorRequest):
    db_user = db.query(Users).filter(Users.id == user["id"]).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User account not found")

    clean_bg = donor_data.blood_group.strip().upper()
    existing_donor = db.query(Donors).filter(Donors.user_id == user["id"]).first()

    if existing_donor:
        existing_donor.blood_group = clean_bg
        if donor_data.location:
            existing_donor.location = donor_data.location.strip()
            db_user.location = donor_data.location.strip()
        if donor_data.phone:
            existing_donor.phone = donor_data.phone.strip()
            db_user.phone = donor_data.phone.strip()
        if donor_data.age is not None:
            existing_donor.age = donor_data.age
        if donor_data.gender:
            existing_donor.gender = donor_data.gender
        if donor_data.availability is not None:
            existing_donor.availability = donor_data.availability
        db.commit()
        db.refresh(existing_donor)
        return {
            "message": "Donor profile updated successfully! You can donate blood anytime.",
            "donor_id": existing_donor.id,
            "blood_group": existing_donor.blood_group,
            "availability": existing_donor.availability,
        }

    new_donor = Donors(
        user_id=db_user.id,
        name=db_user.name,
        email=db_user.email,
        blood_group=clean_bg,
        phone=donor_data.phone.strip() if donor_data.phone else db_user.phone,
        location=donor_data.location.strip() if donor_data.location else db_user.location,
        age=donor_data.age,
        gender=donor_data.gender,
        availability=donor_data.availability if donor_data.availability is not None else True,
        verified=True,
    )
    db.add(new_donor)
    db.commit()
    db.refresh(new_donor)

    return {
        "message": "Donor profile activated successfully! You can now accept blood requests and donate.",
        "donor_id": new_donor.id,
        "blood_group": new_donor.blood_group,
        "availability": new_donor.availability,
    }

# Update donor profile details
@router.put("/me")
def update_donor_profile(user: user_dependency, db: db_dependency, updates: DonorProfileUpdate):
    donor = db.query(Donors).filter(Donors.user_id == user["id"]).first()
    db_user = db.query(Users).filter(Users.id == user["id"]).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User account not found")

    data = updates.model_dump(exclude_unset=True)

    if not donor:
        bg = data.get("blood_group")
        if not bg:
            raise HTTPException(status_code=400, detail="Blood group is required to activate donor profile")
        donor = Donors(
            user_id=db_user.id,
            name=data.get("name", db_user.name),
            email=db_user.email,
            blood_group=bg.strip().upper(),
            phone=data.get("phone", db_user.phone),
            location=data.get("location", db_user.location),
            age=data.get("age"),
            gender=data.get("gender"),
            availability=data.get("availability", True),
            verified=True,
        )
        db.add(donor)
        db.commit()
        db.refresh(donor)
        return JSONResponse(status_code=200, content={"message": "Donor profile created and activated successfully"})

    for field, value in data.items():
        if field == "blood_group" and value:
            setattr(donor, field, value.strip().upper())
        else:
            setattr(donor, field, value)

    # Synchronize user phone, location, and name
    if "phone" in data:
        db_user.phone = data["phone"]
    if "location" in data:
        db_user.location = data["location"]
    if "name" in data:
        db_user.name = data["name"]

    db.commit()
    return JSONResponse(status_code=200, content={"message": "Donor profile updated successfully"})

# Delete donor profile for current logged in user
@router.delete("/delete-profile")
def delete_donor_profile(user: user_dependency, db: db_dependency):
    donor = db.query(Donors).filter(Donors.user_id == user["id"]).first()
    if not donor:
        raise HTTPException(status_code=404, detail="Donor profile not found")

    db.delete(donor)
    db.commit()
    return JSONResponse(status_code=200, content={"message": "Donor profile deleted successfully"})

# View open blood requests matching the logged-in donor blood group
@router.get("/matching-requests")
def get_matching_blood_requests(
    user: user_dependency,
    db: db_dependency,
    filter_by_location: bool = Query(default=False, description="Filter matching requests only in donor area")
):
    donor = db.query(Donors).filter(Donors.user_id == user["id"]).first()
    if not donor:
        raise HTTPException(status_code=404, detail="Donor profile not found")

    query = db.query(BloodRequests).filter(
        BloodRequests.blood_group == donor.blood_group,
        BloodRequests.status.in_(["pending", "donor_found"]),
        BloodRequests.requester_id != user["id"]
    )

    if filter_by_location:
        query = query.filter(BloodRequests.hospital_location.ilike(f"%{donor.location}%"))

    requests = query.order_by(
        BloodRequests.urgency.desc(),
        BloodRequests.id.desc()
    ).all()

    return [
        {
            "id": r.id,
            "patient_name": r.patient_name,
            "blood_group": r.blood_group,
            "required_bags": r.required_bags,
            "hospital_name": r.hospital_name,
            "hospital_location": r.hospital_location,
            "required_date": r.required_date,
            "contact_number": r.contact_number,
            "urgency": r.urgency,
            "additional_info": r.additional_info,
            "status": r.status,
            "created_at": r.created_at,
        }
        for r in requests
    ]

# Donor accepts a blood request and notifies the requester
@router.put("/requests/{request_id}/accept")
def accept_blood_request(user: user_dependency, db: db_dependency, request_id: int):
    donor = db.query(Donors).filter(Donors.user_id == user["id"]).first()
    if not donor:
        raise HTTPException(status_code=404, detail="Donor profile not found")

    req = db.query(BloodRequests).filter(BloodRequests.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Blood request not found")

    if req.requester_id == user["id"]:
        raise HTTPException(status_code=400, detail="You cannot accept your own blood request")

    if req.status in ["donor_accepted", "donation_completed", "request_closed"]:
        raise HTTPException(status_code=400, detail=f"Request is already in '{req.status}' state")

    req.status = "donor_accepted"
    req.accepted_donor_id = donor.id

    # Create in-app notification for the requester
    notif_msg = (
        f"A donor has accepted your blood request!\n"
        f"Donor: {donor.name} | Blood Group: {donor.blood_group} | Contact: {donor.phone} | Location: {donor.location}"
    )
    notification = Notifications(
        user_id=req.requester_id,
        type="request_accepted",
        message=notif_msg,
        request_id=req.id,
        is_read=False,
    )
    db.add(notification)
    db.commit()

    return {
        "message": "Blood request accepted successfully. The requester has been notified!",
        "request_id": req.id,
        "status": req.status,
        "donor_info": {
            "name": donor.name,
            "phone": donor.phone,
            "blood_group": donor.blood_group,
        }
    }

# Donor declines a blood request and reopens it
@router.put("/requests/{request_id}/reject")
def reject_blood_request(user: user_dependency, db: db_dependency, request_id: int):
    donor = db.query(Donors).filter(Donors.user_id == user["id"]).first()
    if not donor:
        raise HTTPException(status_code=404, detail="Donor profile not found")

    req = db.query(BloodRequests).filter(BloodRequests.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Blood request not found")

    if req.accepted_donor_id == donor.id:
        req.accepted_donor_id = None
        req.status = "pending"
        db.commit()
        return JSONResponse(status_code=200, content={"message": "You have declined this request. It is now open again."})

    return JSONResponse(status_code=200, content={"message": "Request declined."})