
import React, { useContext, useState } from 'react';
import { baseUrl } from '../../services/BaseUrl';
import { AuthContext } from '../../context/AuthProvider';
import toast from 'react-hot-toast';

const ManageIssue = () => {

    const {accessToken} = useContext(AuthContext)

    const [issueId, setIssueId] = useState(null)
    const [payReturnIssueId, setPayReturnIssueId] = useState(null);

    const [issues, setIssues] = useState([]);
    const [loadingIssues, setLoadingIssues] = useState(false);

    const fetchIssues = async () => {
        if (!accessToken) return;
        setLoadingIssues(true);
        try {
            const res = await fetch(`${baseUrl}/admin/issues/all`, {
                headers: { Authorization: `Bearer ${accessToken}` }
            });
            if (res.ok) {
                const data = await res.json();
                setIssues(data);
            }
        } catch (err) {
            console.error('Failed to fetch issues:', err);
        } finally {
            setLoadingIssues(false);
        }
    };

    React.useEffect(() => {
        fetchIssues();
    }, [accessToken]);

    const handleRetrunBook = async (e) => {
        e.preventDefault();
        if (!issueId) return;

        try {
            const res = await fetch(`${baseUrl}/admin/return_book/${issueId}`, {
                method: "PUT",
                headers: {
                    Authorization: `Bearer ${accessToken}`
                }
            });

            const data = await res.json();
            if (res.ok) {
                const msg = data.fine_amount > 0 
                    ? `${data.message} (Fine: ৳${data.fine_amount})` 
                    : (data.message || 'Book returned successfully');
                toast.success(msg);
                setIssueId('');
                fetchIssues();
            } else {
                toast.error(data.detail || 'Failed to return book');
            }
        } catch (err) {
            toast.error('Network error. Failed to reach backend.');
        }
    };

    const handlePayFine = async (e) => {
        e.preventDefault();
        if (!payReturnIssueId) return;

        try {
            const res = await fetch(`${baseUrl}/admin/fine_paid/${payReturnIssueId}`, {
                method: "PUT",
                headers: {
                    Authorization: `Bearer ${accessToken}`
                }
            });

            const data = await res.json();
            if (res.ok) {
                toast.success(data.message || 'Fine marked as paid!');
                setPayReturnIssueId('');
                fetchIssues();
            } else {
                toast.error(data.detail || 'Failed to mark fine as paid');
            }
        } catch (err) {
            toast.error('Network error. Failed to reach backend.');
        }
    };

    return (
        <div className="max-w-5xl mx-auto p-6">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900">
                    Manage Issues & Returns
                </h1>
                <p className="text-gray-500 mt-1">
                    Process book returns, manage overdue fines, and track issues
                </p>
            </div>

            {/* Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                {/* Return Book Card */}
                <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                    <h2 className="text-lg font-semibold text-gray-900">
                        Return Book
                    </h2>
                    <p className="text-sm text-gray-500 mt-1 mb-5">
                        Enter the Issue ID to mark the book as returned and calculate fine.
                    </p>

                    <form onSubmit={handleRetrunBook}>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Issue ID
                        </label>
                        <input
                            value={issueId || ''}
                            onChange={(e) => setIssueId(e.target.value)}
                            type="number"
                            placeholder="Enter Issue ID (e.g. 1)"
                            required
                            min="1"
                            className="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:border-blue-500"
                        />
                        <button
                            type="submit"
                            className="w-full mt-5 bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition"
                        >
                            Return Book
                        </button>
                    </form>
                </div>

                {/* Return / Pay Fine Card */}
                <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                    <h2 className="text-lg font-semibold text-gray-900">
                        Mark Fine as Paid
                    </h2>
                    <p className="text-sm text-gray-500 mt-1 mb-5">
                        Enter the Issue ID after receiving fine payment from the student.
                    </p>

                    <form onSubmit={handlePayFine}>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Issue ID
                        </label>
                        <input
                            type="number"
                            value={payReturnIssueId || ''}
                            onChange={(e) => setPayReturnIssueId(e.target.value)}
                            placeholder="Enter Issue ID (e.g. 1)"
                            required
                            min="1"
                            className="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:border-blue-500"
                        />
                        <button
                            type="submit"
                            className="w-full mt-5 bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 transition"
                        >
                            Confirm Fine Paid
                        </button>
                    </form>
                </div>
            </div>

            {/* All Issues Table */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-900">All Issued Books</h2>
                    <button
                        onClick={fetchIssues}
                        className="text-sm text-blue-600 hover:underline"
                    >
                        🔄 Refresh
                    </button>
                </div>

                {loadingIssues ? (
                    <div className="text-center py-8">
                        <span className="loading loading-spinner loading-md"></span>
                    </div>
                ) : issues.length === 0 ? (
                    <p className="text-gray-400 text-center py-6">No issue records found.</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 text-gray-700">
                                <tr>
                                    <th className="px-4 py-3">Issue ID</th>
                                    <th className="px-4 py-3">Book ID</th>
                                    <th className="px-4 py-3">User ID</th>
                                    <th className="px-4 py-3">Issue Date</th>
                                    <th className="px-4 py-3">Due Date</th>
                                    <th className="px-4 py-3">Fine</th>
                                    <th className="px-4 py-3">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {issues.map((item) => (
                                    <tr key={item.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-3 font-semibold">#{item.id}</td>
                                        <td className="px-4 py-3">Book #{item.book_id}</td>
                                        <td className="px-4 py-3">User #{item.user_id}</td>
                                        <td className="px-4 py-3 text-gray-600">
                                            {item.issue_date ? new Date(item.issue_date).toLocaleDateString() : '-'}
                                        </td>
                                        <td className="px-4 py-3 text-gray-600">
                                            {item.due_date ? new Date(item.due_date).toLocaleDateString() : '-'}
                                        </td>
                                        <td className="px-4 py-3">
                                            {item.fine_amount > 0 ? (
                                                <span className={item.fine_paid ? "text-green-600" : "text-red-600 font-semibold"}>
                                                    ৳{item.fine_amount} {item.fine_paid ? "(Paid)" : "(Unpaid)"}
                                                </span>
                                            ) : (
                                                <span className="text-gray-400">৳0</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                                item.status === 'issued' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                                            }`}>
                                                {item.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ManageIssue;

