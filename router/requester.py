from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from sqlalchemy import asc, desc
from datetime import datetime
from typing import Annotated, Optional, List
from database import SessionLocal
from models import Users, Donors, DonationHistory, BloodRequests, Notifications
from router.auth import get_current_user, user_dependency, db_dependency
from fastapi.responses import JSONResponse

# Requester and public operations router
router = APIRouter(tags=["Requester & Public Operations"])

# Schema for creating a blood request
class BloodRequestCreate(BaseModel):
    title: Optional[str] = Field(default="Blood Request", description="Title or summary of blood request")
    patient_name: str = Field(..., description="Name of the patient")
    blood_group: str = Field(..., description="Required Blood Group (A+, A-, B+, B-, AB+, AB-, O+, O-)")
    required_bags: int = Field(default=1, ge=1, description="Number of blood bags needed")
    hospital_name: str = Field(..., description="Hospital Name")
    hospital_location: str = Field(..., description="Dhaka Area / Hospital Address")
    required_date: str = Field(..., description="Required Date or 'Immediately'")
    contact_number: str = Field(..., description="Contact Mobile Number")
    urgency: str = Field(default="normal", description="'normal' or 'emergency'")
    additional_info: Optional[str] = Field(default=None, description="Special instructions or notes")

# Schema for updating a blood request
class BloodRequestUpdate(BaseModel):
    title: Optional[str] = None
    patient_name: Optional[str] = None
    required_bags: Optional[int] = Field(default=None, ge=1)
    hospital_name: Optional[str] = None
    hospital_location: Optional[str] = None
    required_date: Optional[str] = None
    contact_number: Optional[str] = None
    urgency: Optional[str] = None
    additional_info: Optional[str] = None

# Public blood donor search with filtering, sorting, date range, and pagination
@router.get("/donors/search")
def search_blood_donors(
    db: db_dependency,
    blood_group: Optional[str] = Query(default=None, description="Blood Group e.g. A+, B+, O+, AB-"),
    location: Optional[str] = Query(default=None, description="Dhaka area e.g. Mirpur, Dhanmondi, Gulshan, Uttara"),
    name: Optional[str] = Query(default=None, description="Search by donor name"),
    donor_id: Optional[int] = Query(default=None, description="Search by specific donor ID"),
    available_only: bool = Query(default=True, description="Filter only available donors"),
    verified_only: bool = Query(default=False, description="Filter only verified donors"),
    start_date: Optional[str] = Query(default=None, description="Donation date range start (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(default=None, description="Donation date range end (YYYY-MM-DD)"),
    sort_by: str = Query(default="availability", description="Sort: availability | name | location | blood_group | recent_donation | newest | id"),
    sort_order: str = Query(default="desc", description="Sort direction: asc | desc"),
    page: int = Query(default=1, ge=1, description="Page number"),
    page_size: int = Query(default=10, ge=1, le=100, description="Results per page"),
):
    query = db.query(Donors)

    if donor_id:
        query = query.filter(Donors.id == donor_id)

    if blood_group and blood_group.strip():
        query = query.filter(Donors.blood_group == blood_group.strip())

    if location and location.strip():
        loc_term = location.strip()
        query = query.filter(Donors.location.ilike(f"%{loc_term}%"))

    if name and name.strip():
        query = query.filter(Donors.name.ilike(f"%{name.strip()}%"))

    if available_only:
        query = query.filter(Donors.availability == True)

    if verified_only:
        query = query.filter(Donors.verified == True)

    if start_date:
        try:
            s_dt = datetime.strptime(start_date.strip(), "%Y-%m-%d")
            query = query.filter(Donors.last_donation_date >= s_dt)
        except ValueError:
            pass
    if end_date:
        try:
            e_dt = datetime.strptime(end_date.strip(), "%Y-%m-%d")
            query = query.filter(Donors.last_donation_date <= e_dt)
        except ValueError:
            pass

    sort_col_map = {
        "name": Donors.name,
        "location": Donors.location,
        "blood_group": Donors.blood_group,
        "availability": Donors.availability,
        "recent_donation": Donors.last_donation_date,
        "newest": Donors.created_at,
        "id": Donors.id,
    }
    col = sort_col_map.get(sort_by, Donors.availability)
    order_fn = desc if sort_order.lower() == "desc" else asc
    query = query.order_by(order_fn(col))

    total_count = query.count()
    total_pages = (total_count + page_size - 1) // page_size
    offset = (page - 1) * page_size
    donors = query.offset(offset).limit(page_size).all()

    results = []
    for d in donors:
        stats = (
            db.query(DonationHistory)
            .filter(DonationHistory.donor_id == d.id)
            .all()
        )
        total_bags = sum(h.bags for h in stats)

        results.append({
            "id": d.id,
            "name": d.name,
            "email": d.email,
            "blood_group": d.blood_group,
            "location": d.location,
            "phone": d.phone,
            "availability": d.availability,
            "status_label": "Available" if d.availability else "Not Available",
            "verified": d.verified,
            "age": d.age,
            "gender": d.gender,
            "last_donation_date": d.last_donation_date.strftime("%Y-%m-%d") if d.last_donation_date else "Never",
            "total_donations": len(stats),
            "total_bags_donated": total_bags,
        })

    return {
        "search_query": {
            "blood_group": blood_group,
            "location": location,
            "name": name,
            "donor_id": donor_id,
            "available_only": available_only,
            "sort_by": sort_by,
            "sort_order": sort_order,
        },
        "pagination": {
            "page": page,
            "page_size": page_size,
            "total_items": total_count,
            "total_pages": total_pages,
            "has_next": page < total_pages,
            "has_prev": page > 1,
        },
        "total_found": total_count,
        "donors": results,
    }

# Public donor full profile with complete donation history
@router.get("/donors/{donor_id}")
def get_donor_full_profile(donor_id: int, db: db_dependency):
    donor = db.query(Donors).filter(Donors.id == donor_id).first()
    if not donor:
        raise HTTPException(status_code=404, detail="Donor not found")

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
        "email": donor.email,
        "blood_group": donor.blood_group,
        "phone": donor.phone,
        "location": donor.location,
        "age": donor.age,
        "gender": donor.gender,
        "availability": donor.availability,
        "status_label": "Available" if donor.availability else "Not Available",
        "verified": donor.verified,
        "last_donation_date": donor.last_donation_date.strftime("%Y-%m-%d") if donor.last_donation_date else "Never",
        "total_donations": len(history),
        "total_bags_donated": total_bags,
        "donation_history": [
            {
                "id": h.id,
                "donated_date": h.donated_date.strftime("%Y-%m-%d"),
                "blood_group": h.blood_group,
                "bags": h.bags,
                "hospital_location": h.hospital_location,
                "note": h.note,
            }
            for h in history
        ]
    }

# Create a blood request and notify matching donors
@router.post("/blood-request", status_code=status.HTTP_201_CREATED)
def create_blood_request(
    user: user_dependency,
    db: db_dependency,
    request: BloodRequestCreate,
):
    req = BloodRequests(
        requester_id=user["id"],
        title=request.title or f"{request.blood_group} Blood Needed",
        patient_name=request.patient_name,
        blood_group=request.blood_group.strip(),
        required_bags=request.required_bags,
        hospital_name=request.hospital_name,
        hospital_location=request.hospital_location,
        required_date=request.required_date,
        contact_number=request.contact_number,
        urgency=request.urgency.lower(),
        additional_info=request.additional_info,
        status="pending",
        created_at=datetime.now(),
    )
    db.add(req)
    db.flush()

    matching_donors = (
        db.query(Donors)
        .filter(
            Donors.blood_group == req.blood_group,
            Donors.availability == True,
            Donors.user_id.isnot(None),
        )
        .all()
    )

    alert_prefix = "EMERGENCY" if req.urgency == "emergency" else "New"
    notif_text = (
        f"{alert_prefix} {req.blood_group} blood request near {req.hospital_location}!\n"
        f"Hospital: {req.hospital_name} | Required: {req.required_bags} Bag(s) | Urgency: {req.urgency.upper()}"
    )

    for donor in matching_donors:
        if donor.user_id and donor.user_id != user["id"]:
            db.add(Notifications(
                user_id=donor.user_id,
                type="new_request",
                message=notif_text,
                request_id=req.id,
                is_read=False,
            ))

    if req.urgency == "emergency":
        admins = db.query(Users).filter(Users.role == "admin").all()
        for adm in admins:
            db.add(Notifications(
                user_id=adm.id,
                type="admin_alert",
                message=f"Emergency blood request created for {req.patient_name} ({req.blood_group}) at {req.hospital_name}.",
                request_id=req.id,
                is_read=False,
            ))

    db.commit()
    db.refresh(req)

    return {
        "message": "Blood request submitted successfully.",
        "request_id": req.id,
        "title": req.title,
        "status": req.status,
        "urgency": req.urgency,
        "notified_donors_count": len(matching_donors),
    }

# Get blood requests created by logged in user with search, status, date range, and pagination
@router.get("/blood-request/my")
def get_my_blood_requests(
    user: user_dependency,
    db: db_dependency,
    search: Optional[str] = Query(default=None, description="Search by title, patient name, hospital, ID"),
    req_status: Optional[str] = Query(default=None, description="Filter by status"),
    start_date: Optional[str] = Query(default=None, description="Date range start (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(default=None, description="Date range end (YYYY-MM-DD)"),
    sort_by: str = Query(default="newest", description="Sort: newest | patient_name | required_bags | id"),
    sort_order: str = Query(default="desc", description="asc | desc"),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=10, ge=1, le=50),
):
    query = (
        db.query(BloodRequests)
        .filter(BloodRequests.requester_id == user["id"])
    )

    if search and search.strip():
        s = search.strip()
        if s.isdigit():
            query = query.filter((BloodRequests.id == int(s)) | (BloodRequests.patient_name.ilike(f"%{s}%")))
        else:
            query = query.filter(
                (BloodRequests.patient_name.ilike(f"%{s}%")) |
                (BloodRequests.title.ilike(f"%{s}%")) |
                (BloodRequests.hospital_name.ilike(f"%{s}%"))
            )

    if req_status:
        query = query.filter(BloodRequests.status == req_status)

    if start_date:
        try:
            s_dt = datetime.strptime(start_date.strip(), "%Y-%m-%d")
            query = query.filter(BloodRequests.created_at >= s_dt)
        except ValueError:
            pass
    if end_date:
        try:
            e_dt = datetime.strptime(end_date.strip(), "%Y-%m-%d")
            query = query.filter(BloodRequests.created_at <= e_dt)
        except ValueError:
            pass

    sort_map = {
        "newest": BloodRequests.created_at,
        "patient_name": BloodRequests.patient_name,
        "required_bags": BloodRequests.required_bags,
        "id": BloodRequests.id,
    }
    col = sort_map.get(sort_by, BloodRequests.created_at)
    order_fn = desc if sort_order.lower() == "desc" else asc
    query = query.order_by(order_fn(col))

    total_count = query.count()
    total_pages = (total_count + page_size - 1) // page_size
    requests = query.offset((page - 1) * page_size).limit(page_size).all()

    results = []
    for r in requests:
        donor_info = None
        if r.accepted_donor_id:
            d = db.query(Donors).filter(Donors.id == r.accepted_donor_id).first()
            if d:
                donor_info = {
                    "id": d.id,
                    "name": d.name,
                    "blood_group": d.blood_group,
                    "phone": d.phone,
                    "location": d.location,
                }

        results.append({
            "id": r.id,
            "title": r.title,
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
            "accepted_donor": donor_info,
        })

    return {
        "pagination": {
            "page": page,
            "page_size": page_size,
            "total_items": total_count,
            "total_pages": total_pages,
        },
        "requests": results,
    }

# Public feed of open blood requests with search, filter, date range, sorting, pagination (Defined before {request_id})
@router.get("/blood-request/open")
def get_all_open_requests(
    db: db_dependency,
    search: Optional[str] = Query(default=None, description="Search by title, patient name, hospital, ID"),
    blood_group: Optional[str] = Query(default=None),
    location: Optional[str] = Query(default=None),
    urgency: Optional[str] = Query(default=None, description="normal | emergency"),
    start_date: Optional[str] = Query(default=None, description="Created date range start (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(default=None, description="Created date range end (YYYY-MM-DD)"),
    sort_by: str = Query(default="urgency", description="Sort: urgency | newest | id | blood_group | patient_name"),
    sort_order: str = Query(default="desc", description="asc | desc"),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=10, ge=1, le=50),
):
    query = db.query(BloodRequests).filter(BloodRequests.status.in_(["pending", "donor_found"]))

    if search and search.strip():
        s = search.strip()
        if s.isdigit():
            query = query.filter((BloodRequests.id == int(s)) | (BloodRequests.patient_name.ilike(f"%{s}%")))
        else:
            query = query.filter(
                (BloodRequests.patient_name.ilike(f"%{s}%")) |
                (BloodRequests.title.ilike(f"%{s}%")) |
                (BloodRequests.hospital_name.ilike(f"%{s}%"))
            )

    if blood_group:
        query = query.filter(BloodRequests.blood_group == blood_group.strip())
    if location:
        query = query.filter(BloodRequests.hospital_location.ilike(f"%{location.strip()}%"))
    if urgency:
        query = query.filter(BloodRequests.urgency == urgency.lower())

    if start_date:
        try:
            s_dt = datetime.strptime(start_date.strip(), "%Y-%m-%d")
            query = query.filter(BloodRequests.created_at >= s_dt)
        except ValueError:
            pass
    if end_date:
        try:
            e_dt = datetime.strptime(end_date.strip(), "%Y-%m-%d")
            query = query.filter(BloodRequests.created_at <= e_dt)
        except ValueError:
            pass

    sort_col_map = {
        "urgency": BloodRequests.urgency,
        "newest": BloodRequests.created_at,
        "id": BloodRequests.id,
        "blood_group": BloodRequests.blood_group,
        "patient_name": BloodRequests.patient_name,
    }
    col = sort_col_map.get(sort_by, BloodRequests.urgency)
    order_fn = desc if sort_order.lower() == "desc" else asc
    query = query.order_by(order_fn(col))

    total_count = query.count()
    total_pages = (total_count + page_size - 1) // page_size
    results = query.offset((page - 1) * page_size).limit(page_size).all()

    return {
        "pagination": {
            "page": page,
            "page_size": page_size,
            "total_items": total_count,
            "total_pages": total_pages,
        },
        "requests": results,
    }

# Get a single blood request by ID
@router.get("/blood-request/{request_id}")
def get_blood_request_by_id(request_id: int, db: db_dependency):
    req = db.query(BloodRequests).filter(BloodRequests.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Blood request not found")

    donor_info = None
    if req.accepted_donor_id:
        d = db.query(Donors).filter(Donors.id == req.accepted_donor_id).first()
        if d:
            donor_info = {"id": d.id, "name": d.name, "phone": d.phone, "blood_group": d.blood_group}

    return {
        "id": req.id,
        "title": req.title,
        "patient_name": req.patient_name,
        "blood_group": req.blood_group,
        "required_bags": req.required_bags,
        "hospital_name": req.hospital_name,
        "hospital_location": req.hospital_location,
        "required_date": req.required_date,
        "contact_number": req.contact_number,
        "urgency": req.urgency,
        "additional_info": req.additional_info,
        "status": req.status,
        "created_at": req.created_at,
        "accepted_donor": donor_info,
    }

# Update a blood request by its creator or admin
@router.put("/blood-request/{request_id}")
def update_blood_request(
    request_id: int,
    updates: BloodRequestUpdate,
    user: user_dependency,
    db: db_dependency,
):
    req = db.query(BloodRequests).filter(BloodRequests.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Blood request not found")

    if req.requester_id != user["id"] and user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to update this request")

    if req.status not in ["pending"]:
        raise HTTPException(status_code=400, detail=f"Cannot edit request in '{req.status}' state.")

    data = updates.model_dump(exclude_unset=True)
    for field, value in data.items():
        setattr(req, field, value)

    db.commit()
    return JSONResponse(status_code=200, content={"message": "Blood request updated successfully"})

# Mark a blood request as donation completed and record donation history
@router.put("/blood-request/{request_id}/complete")
def mark_blood_request_completed(request_id: int, user: user_dependency, db: db_dependency):
    req = db.query(BloodRequests).filter(BloodRequests.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")

    if req.requester_id != user["id"] and user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to complete this request")

    req.status = "donation_completed"

    if req.accepted_donor_id:
        donor = db.query(Donors).filter(Donors.id == req.accepted_donor_id).first()
        if donor:
            donor.last_donation_date = datetime.now()
            history_record = DonationHistory(
                donor_id=donor.id,
                request_id=req.id,
                donated_date=datetime.now(),
                blood_group=req.blood_group,
                bags=req.required_bags,
                hospital_location=f"{req.hospital_name}, {req.hospital_location}",
                note=f"Donation for patient: {req.patient_name}",
            )
            db.add(history_record)

            if donor.user_id:
                db.add(Notifications(
                    user_id=donor.user_id,
                    type="request_completed",
                    message=f"Thank you for donating blood to {req.patient_name}! Your profile donation history has been updated.",
                    request_id=req.id,
                    is_read=False,
                ))

    db.add(Notifications(
        user_id=req.requester_id,
        type="request_completed",
        message="Your blood request has been marked as completed. Thank you!",
        request_id=req.id,
        is_read=False,
    ))

    db.commit()
    return JSONResponse(status_code=200, content={"message": "Blood request marked as donation completed"})

# Cancel a blood request
@router.delete("/blood-request/{request_id}")
def cancel_blood_request(request_id: int, user: user_dependency, db: db_dependency):
    req = db.query(BloodRequests).filter(BloodRequests.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Blood request not found")

    if req.requester_id != user["id"] and user["role"] != "admin":
        raise HTTPException(status_code=403, detail="You can only cancel your own requests")

    req.status = "cancelled"
    db.commit()
    return JSONResponse(status_code=200, content={"message": "Blood request cancelled successfully"})

# Get in-app notifications for logged-in user
@router.get("/notifications")
def get_user_notifications(user: user_dependency, db: db_dependency):
    notifs = (
        db.query(Notifications)
        .filter(Notifications.user_id == user["id"])
        .order_by(Notifications.id.desc())
        .limit(50)
        .all()
    )
    unread_count = db.query(Notifications).filter(Notifications.user_id == user["id"], Notifications.is_read == False).count()
    return {
        "unread_count": unread_count,
        "notifications": [
            {
                "id": n.id,
                "type": n.type,
                "message": n.message,
                "request_id": n.request_id,
                "is_read": n.is_read,
                "created_at": n.created_at,
            }
            for n in notifs
        ]
    }

# Mark single notification as read
@router.put("/notifications/{notif_id}/read")
def mark_notification_read(notif_id: int, user: user_dependency, db: db_dependency):
    n = db.query(Notifications).filter(Notifications.id == notif_id, Notifications.user_id == user["id"]).first()
    if not n:
        raise HTTPException(status_code=404, detail="Notification not found")
    n.is_read = True
    db.commit()
    return JSONResponse(status_code=200, content={"message": "Marked as read"})

# Mark all user notifications as read
@router.put("/notifications/read-all")
def mark_all_notifications_read(user: user_dependency, db: db_dependency):
    db.query(Notifications).filter(Notifications.user_id == user["id"]).update({"is_read": True})
    db.commit()
    return JSONResponse(status_code=200, content={"message": "All notifications marked as read"})
