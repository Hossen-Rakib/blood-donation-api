from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from sqlalchemy import func, asc, desc
from datetime import datetime
from typing import Annotated, Optional
from database import SessionLocal
from models import Users, Donors, DonationHistory, BloodRequests, Notifications
from router.auth import get_current_user, user_dependency, db_dependency
from fastapi.responses import JSONResponse

# Admin operations router
router = APIRouter(prefix="/admin", tags=["Admin Operations"])

# Schema for updating blood request status
class StatusUpdate(BaseModel):
    status: str = Field(..., description="pending | donor_found | donor_accepted | donation_completed | request_closed | cancelled")

# Verify that current user has admin role
def require_admin(user: dict):
    if not user or user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required"
        )

# Admin dashboard statistics and metrics
@router.get(
    "/dashboard",
    summary="Admin Dashboard Statistics",
    response_description="Platform overview stats and chart data",
)
def get_admin_dashboard_stats(user: user_dependency, db: db_dependency):
    """
    **Admin only** — Get platform-wide statistics for the dashboard.

    Returns:
    - **Overview:** total users, donors, active donors, requests, emergency counts
    - **Charts:** blood group distribution (donors vs requests), emergency vs normal, top locations
    """
    require_admin(user)

    total_users = db.query(Users).count()
    total_donors = db.query(Donors).count()
    active_donors = db.query(Donors).filter(Donors.availability == True).count()
    total_requests = db.query(BloodRequests).count()
    emergency_requests = db.query(BloodRequests).filter(BloodRequests.urgency == "emergency").count()
    completed_requests = db.query(BloodRequests).filter(BloodRequests.status == "donation_completed").count()
    pending_requests = db.query(BloodRequests).filter(BloodRequests.status == "pending").count()

    # Blood group distribution among donors
    donor_bg_rows = (
        db.query(Donors.blood_group, func.count(Donors.id))
        .group_by(Donors.blood_group)
        .all()
    )
    donor_blood_distribution = {bg: count for bg, count in donor_bg_rows}

    # Blood group requests distribution
    req_bg_rows = (
        db.query(BloodRequests.blood_group, func.count(BloodRequests.id))
        .group_by(BloodRequests.blood_group)
        .all()
    )
    request_blood_distribution = {bg: count for bg, count in req_bg_rows}

    # Requests by Dhaka Location
    loc_rows = (
        db.query(BloodRequests.hospital_location, func.count(BloodRequests.id))
        .group_by(BloodRequests.hospital_location)
        .order_by(func.count(BloodRequests.id).desc())
        .limit(10)
        .all()
    )
    requests_by_location = {loc: count for loc, count in loc_rows}

    normal_requests = total_requests - emergency_requests

    return {
        "overview": {
            "total_users": total_users,
            "total_donors": total_donors,
            "active_donors": active_donors,
            "blood_requests": total_requests,
            "emergency_requests": emergency_requests,
            "completed_requests": completed_requests,
            "pending_requests": pending_requests,
        },
        "charts": {
            "blood_group_distribution": {
                "donors": donor_blood_distribution,
                "requests": request_blood_distribution,
            },
            "emergency_vs_normal": {
                "emergency": emergency_requests,
                "normal": normal_requests,
            },
            "requests_by_location": requests_by_location,
        }
    }

# List all users with role filter, name search, and pagination
@router.get(
    "/users",
    summary="List All Users (Admin)",
    response_description="Paginated list of all users",
)
def get_all_users(
    user: user_dependency,
    db: db_dependency,
    role: Optional[str] = Query(default=None, description="Filter by role: requester | donor | admin"),
    name: Optional[str] = Query(default=None, description="Search by user name"),
    is_active: Optional[bool] = Query(default=None, description="Filter by active status"),
    sort_by: str = Query(default="id", description="Sort by: id | name | role | created_at"),
    sort_order: str = Query(default="asc", description="asc | desc"),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
):
    require_admin(user)
    query = db.query(Users)
    if role:
        query = query.filter(Users.role == role)
    if name:
        query = query.filter(Users.name.ilike(f"%{name.strip()}%"))
    if is_active is not None:
        query = query.filter(Users.is_active == is_active)

    sort_col_map = {"id": Users.id, "name": Users.name, "role": Users.role, "created_at": Users.created_at}
    col = sort_col_map.get(sort_by, Users.id)
    order_fn = desc if sort_order.lower() == "desc" else asc
    query = query.order_by(order_fn(col))

    total_count = query.count()
    total_pages = (total_count + page_size - 1) // page_size
    users = query.offset((page - 1) * page_size).limit(page_size).all()

    return {
        "pagination": {
            "page": page,
            "page_size": page_size,
            "total_items": total_count,
            "total_pages": total_pages,
        },
        "users": [
            {
                "id": u.id,
                "name": u.name,
                "username": u.username,
                "email": u.email,
                "phone": u.phone,
                "role": u.role,
                "location": u.location,
                "is_active": u.is_active,
                "created_at": u.created_at,
            }
            for u in users
        ],
    }

# Deactivate or reactivate user account
@router.put(
    "/users/{user_id}/toggle-active",
    summary="Toggle User Active Status (Admin)",
    response_description="Confirmation with new status",
)
def toggle_user_active(user_id: int, user: user_dependency, db: db_dependency):
    """
    **Admin only** — Activate or deactivate a user account.

    - Toggles `is_active` between `true` and `false`.
    - Admin accounts cannot be deactivated.
    - Deactivated users cannot log in.
    """
    require_admin(user)
    target = db.query(Users).filter(Users.id == user_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="User not found")
    if target.role == "admin":
        raise HTTPException(status_code=400, detail="Cannot deactivate admin accounts")

    target.is_active = not target.is_active
    db.commit()

    action = "activated" if target.is_active else "deactivated"
    return JSONResponse(status_code=200, content={"message": f"User '{target.username}' {action}."})

# Permanently delete user account
@router.delete(
    "/users/{user_id}",
    summary="Delete User (Admin)",
    response_description="Confirmation of deletion",
)
def delete_user(user_id: int, user: user_dependency, db: db_dependency):
    """
    **Admin only** — Permanently delete a user account.

    - Admin accounts cannot be deleted.
    - All associated donor profiles, blood requests, and notifications are cascade-deleted.
    - ⚠️ This action is **irreversible**.
    """
    require_admin(user)
    target = db.query(Users).filter(Users.id == user_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="User not found")
    if target.role == "admin":
        raise HTTPException(status_code=400, detail="Cannot delete admin account")

    db.delete(target)
    db.commit()
    return JSONResponse(status_code=200, content={"message": "User deleted successfully"})

# Toggle donor verified badge
@router.put(
    "/donors/{donor_id}/verify",
    summary="Toggle Donor Verification Badge (Admin)",
    response_description="New verification status",
)
def toggle_donor_verification(donor_id: int, user: user_dependency, db: db_dependency):
    """
    **Admin only** — Toggle the **verified** badge on a donor profile.

    - `verified: true` → shows a verified badge on the donor's public profile.
    - Toggles between verified and unverified on each call.
    """
    require_admin(user)
    donor = db.query(Donors).filter(Donors.id == donor_id).first()
    if not donor:
        raise HTTPException(status_code=404, detail="Donor not found")

    donor.verified = not donor.verified
    db.commit()

    status_str = "Verified" if donor.verified else "Unverified"
    return JSONResponse(status_code=200, content={"message": f"Donor status updated to {status_str}", "verified": donor.verified})

# Monitor all blood requests across platform
@router.get(
    "/requests/all",
    summary="Get All Blood Requests (Admin)",
    response_description="All blood requests filtered by status/urgency",
)
def get_all_requests_admin(
    user: user_dependency,
    db: db_dependency,
    status: Optional[str] = Query(default=None),
    urgency: Optional[str] = Query(default=None),
):
    """
    **Admin only** — View all blood requests on the platform.

    - Filter by `status`: `pending`, `donor_found`, `donor_accepted`, `donation_completed`, `request_closed`, `cancelled`
    - Filter by `urgency`: `normal` or `emergency`
    - Results sorted by newest first.
    """
    require_admin(user)
    query = db.query(BloodRequests)
    if status:
        query = query.filter(BloodRequests.status == status)
    if urgency:
        query = query.filter(BloodRequests.urgency == urgency)

    return query.order_by(BloodRequests.id.desc()).all()

# Manually update status of any blood request
@router.put(
    "/requests/{request_id}/status",
    summary="Update Blood Request Status (Admin)",
    response_description="Confirmation with new status",
)
def update_request_status_admin(
    request_id: int,
    payload: StatusUpdate,
    user: user_dependency,
    db: db_dependency,
):
    """
    **Admin only** — Manually update the status of any blood request.

    **Valid status values:**
    `pending` · `donor_found` · `donor_accepted` · `donation_completed` · `request_closed` · `cancelled`
    """
    require_admin(user)
    req = db.query(BloodRequests).filter(BloodRequests.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Blood request not found")

    valid_statuses = ["pending", "donor_found", "donor_accepted", "donation_completed", "request_closed", "cancelled"]
    if payload.status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {valid_statuses}")

    req.status = payload.status
    db.commit()
    return JSONResponse(status_code=200, content={"message": f"Request status updated to '{payload.status}'"})

# Delete fake or spam blood request
@router.delete(
    "/requests/{request_id}",
    summary="Delete Blood Request (Admin)",
    response_description="Confirmation of deletion",
)
def delete_blood_request_admin(request_id: int, user: user_dependency, db: db_dependency):
    """
    **Admin only** — Permanently delete a fake or spam blood request.

    - ⚠️ This is a **hard delete** — the record is removed from the database.
    - Use this for clearly fraudulent or spam requests.
    - For legitimate closed requests, prefer updating status to `"request_closed"`.
    """
    require_admin(user)
    req = db.query(BloodRequests).filter(BloodRequests.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Blood request not found")

    db.delete(req)
    db.commit()
    return JSONResponse(status_code=200, content={"message": "Blood request deleted (fake/spam removed)"})

# Promote an existing user to admin role (only current admin can do this)
@router.put(
    "/users/{user_id}/promote-admin",
    summary="Promote User to Admin",
    response_description="Confirmation of role change",
)
def promote_user_to_admin(user_id: int, user: user_dependency, db: db_dependency):
    """
    **Admin only** — Promote an existing `user` to `admin` role.

    - Only a current admin can promote others.
    - If the target user is already an admin, returns `400`.
    """
    require_admin(user)
    target = db.query(Users).filter(Users.id == user_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="User not found")
    if target.role == "admin":
        raise HTTPException(status_code=400, detail="User is already an admin")

    target.role = "admin"
    db.commit()
    return JSONResponse(
        status_code=200,
        content={"message": f"User '{target.username}' has been promoted to admin role."}
    )

# Demote admin back to regular user
@router.put(
    "/users/{user_id}/demote-admin",
    summary="Demote Admin to Regular User",
    response_description="Confirmation of role change",
)
def demote_admin_to_user(user_id: int, user: user_dependency, db: db_dependency):
    """
    **Admin only** — Demote an `admin` back to a regular `user`.

    - An admin **cannot demote themselves**.
    - Target user must currently be an admin.
    """
    require_admin(user)
    if user.get("id") == user_id:
        raise HTTPException(status_code=400, detail="You cannot demote yourself")
    target = db.query(Users).filter(Users.id == user_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="User not found")
    if target.role != "admin":
        raise HTTPException(status_code=400, detail="User is not an admin")

    target.role = "user"
    db.commit()
    return JSONResponse(
        status_code=200,
        content={"message": f"User '{target.username}' has been demoted to regular user."}
    )

