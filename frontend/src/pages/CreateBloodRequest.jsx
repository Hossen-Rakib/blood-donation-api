import React, { useContext, useState } from 'react';
import { useNavigate } from 'react-router';
import { AuthContext } from '../context/AuthProvider';
import { requesterApi } from '../services/api';
import toast from 'react-hot-toast';
import BANGLADESH_DISTRICTS from '../services/bangladeshLocations';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const CreateBloodRequest = () => {
    const { authUser } = useContext(AuthContext);
    const navigate = useNavigate();

    const [form, setForm] = useState({
        title: '',
        patient_name: '',
        blood_group: '',
        required_bags: 1,
        hospital_name: '',
        hospital_location: 'Dhaka',
        required_date: '',
        contact_number: '',
        urgency: 'normal',
        additional_info: '',
    });
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.patient_name || !form.blood_group || !form.hospital_name || !form.hospital_location || !form.required_date || !form.contact_number) {
            toast.error('Please fill in all required fields!');
            return;
        }

        setLoading(true);
        try {
            const res = await requesterApi.createRequest({
                ...form,
                required_bags: parseInt(form.required_bags),
            });
            toast.success(`Blood request submitted! ${res.notified_donors_count || 0} donors notified.`);
            navigate('/my-requests');
        } catch (err) {
            toast.error(err.message || 'Failed to submit request');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-base-200 py-6 sm:py-10 px-3 sm:px-4">
            <div className="max-w-2xl mx-auto">

                <div className="mb-6 sm:mb-8">
                    <h1 className="text-2xl sm:text-3xl font-bold text-red-600">🩸 Create Blood Request</h1>
                    <p className="text-gray-500 mt-1 text-sm sm:text-base">জরুরি রক্তের প্রয়োজন? এখনই request করুন।</p>
                </div>

                <div className="card bg-base-100 shadow-sm">
                    <div className="card-body p-4 sm:p-8">
                        <form onSubmit={handleSubmit} className="space-y-4">

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                                <div>
                                    <label className="label text-sm font-medium">Title (optional)</label>
                                    <input name="title" type="text" className="input w-full" placeholder="e.g. O+ Blood Needed Urgently"
                                        value={form.title} onChange={handleChange} />
                                </div>

                                <div>
                                    <label className="label text-sm font-medium">Patient Name <span className="text-red-500">*</span></label>
                                    <input name="patient_name" type="text" className="input w-full" placeholder="Patient's name"
                                        value={form.patient_name} onChange={handleChange} required />
                                </div>

                                <div>
                                    <label className="label text-sm font-medium">Blood Group <span className="text-red-500">*</span></label>
                                    <select name="blood_group" className="select select-bordered w-full"
                                        value={form.blood_group} onChange={handleChange} required>
                                        <option value="">Select Blood Group</option>
                                        {BLOOD_GROUPS.map(bg => <option key={bg} value={bg}>{bg}</option>)}
                                    </select>
                                </div>

                                <div>
                                    <label className="label text-sm font-medium">Required Bags <span className="text-red-500">*</span></label>
                                    <input name="required_bags" type="number" className="input w-full" min="1" max="10"
                                        value={form.required_bags} onChange={handleChange} required />
                                </div>

                                <div>
                                    <label className="label text-sm font-medium">Hospital Name <span className="text-red-500">*</span></label>
                                    <input name="hospital_name" type="text" className="input w-full" placeholder="Hospital name"
                                        value={form.hospital_name} onChange={handleChange} required />
                                </div>

                                <div>
                                    <label className="label text-sm font-medium">Hospital Location (District / Area) <span className="text-red-500">*</span></label>
                                    <input
                                        name="hospital_location"
                                        type="text"
                                        list="create-district-list"
                                        className="input input-bordered w-full"
                                        placeholder="হাসপাতালের জেলা বা এলাকা লিখুন (যেমন: Dhaka, Dhanmondi)"
                                        value={form.hospital_location}
                                        onChange={handleChange}
                                        required
                                    />
                                    <datalist id="create-district-list">
                                        {BANGLADESH_DISTRICTS.map(district => (
                                            <option key={district} value={district}>{district}</option>
                                        ))}
                                    </datalist>
                                </div>

                                <div>
                                    <label className="label text-sm font-medium">Required Date <span className="text-red-500">*</span></label>
                                    <input name="required_date" type="text" className="input w-full" placeholder="e.g. 2025-10-01 or Immediately"
                                        value={form.required_date} onChange={handleChange} required />
                                </div>

                                <div>
                                    <label className="label text-sm font-medium">Contact Number <span className="text-red-500">*</span></label>
                                    <input name="contact_number" type="text" className="input w-full" placeholder="01XXXXXXXXX"
                                        value={form.contact_number} onChange={handleChange} required />
                                </div>

                                <div>
                                    <label className="label text-sm font-medium">Urgency Level <span className="text-red-500">*</span></label>
                                    <select name="urgency" className="select select-bordered w-full"
                                        value={form.urgency} onChange={handleChange}>
                                        <option value="normal">Normal</option>
                                        <option value="emergency">🚨 Emergency</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="label text-sm font-medium">Additional Information</label>
                                <textarea name="additional_info" className="textarea textarea-bordered w-full" rows={3}
                                    placeholder="Any additional notes or instructions..."
                                    value={form.additional_info} onChange={handleChange}></textarea>
                            </div>

                            {form.urgency === 'emergency' && (
                                <div className="alert alert-error">
                                    <span>🚨 Emergency request will immediately notify all matching donors and admin!</span>
                                </div>
                            )}

                            <div className="flex justify-end gap-3 pt-4 border-t border-base-200">
                                <button type="button" className="btn btn-ghost" onClick={() => navigate(-1)}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-error text-white" disabled={loading}>
                                    {loading ? <span className="loading loading-spinner loading-sm"></span> : 'Submit Request 🩸'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CreateBloodRequest;
