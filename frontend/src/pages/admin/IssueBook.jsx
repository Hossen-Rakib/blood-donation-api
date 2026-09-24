
import React, { useContext, useState } from 'react';
import { baseUrl } from '../../services/BaseUrl';
import { AuthContext } from '../../context/AuthProvider';
import toast from 'react-hot-toast';

const IssueBook = () => {

    const [userId, setUserId] = useState('');
    const [bookId, setBookId] = useState('');
    const {accessToken} = useContext(AuthContext);

    const handleSubmit = async (e) => {
        e.preventDefault();

        const formData = {
            user_id: Number(userId),
            book_id: Number(bookId)
        };

        try {
            const res = await fetch(`${baseUrl}/admin/create_issue`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            const data = await res.json();
            if (res.ok) {
                toast.success(data.message || "Book issued successfully");
                setUserId('');
                setBookId('');
            } else {
                toast.error(data.detail || "Failed to issue book");
            }
        } catch (err) {
            toast.error("Network error. Failed to issue book.");
        }
    };

    return (
        <div className="max-w-xl mx-auto p-6">

            <h1 className="text-2xl font-bold text-gray-900 mb-6">
                Issue Book
            </h1>

            <form
                onSubmit={handleSubmit}
                className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm"
            >

                {/* User ID */}
                <div className="mb-5">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        User ID
                    </label>

                    <input
                        type="number"
                        value={userId}
                        onChange={(e) => setUserId(e.target.value)}
                        placeholder="Enter User ID"
                        required
                        min="1"
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:border-blue-500"
                    />
                </div>


                {/* Book ID */}
                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Book ID
                    </label>

                    <input
                        type="number"
                        value={bookId}
                        onChange={(e) => setBookId(e.target.value)}
                        placeholder="Enter Book ID"
                        required
                        min="1"
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:border-blue-500"
                    />
                </div>


                {/* Submit */}
                <button 
                    type="submit"
                    className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition"
                >
                    Issue Book
                </button>

            </form>

        </div>
    );
};

export default IssueBook;
