
import React, { useContext, useEffect, useState } from 'react';
import { baseUrl } from '../services/BaseUrl';
import { AuthContext } from '../context/AuthProvider';

const MyIssues = () => {

    const [myIssues, setMyIssues] = useState([]);
    const { accessToken } = useContext(AuthContext);

    useEffect(() => {

        if (!accessToken) return;

        fetch(`${baseUrl}/issues/my`, {
            headers: {
                Authorization: `Bearer ${accessToken}`
            }
        })
            .then(res => res.json())
            .then(data => setMyIssues(data))
            .catch(err => console.log(err));

    }, [accessToken]);


    const formatDate = (date) => {
        if (!date) return '-';

        return new Date(date).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };


    return (
        <div className="max-w-6xl mx-auto p-6">

            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">
                    My Issues
                </h1>

                <p className="text-gray-500 mt-1">
                    View your issued books and return information
                </p>
            </div>


            {/* Table */}
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">

                <div className="overflow-x-auto">

                    <table className="w-full text-left">

                        {/* Header */}
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>

                                <th className="px-6 py-4 text-sm font-semibold text-gray-700">
                                    #
                                </th>

                                <th className="px-6 py-4 text-sm font-semibold text-gray-700">
                                    Book ID
                                </th>
                                <th className="px-6 py-4 text-sm font-semibold text-gray-700">
                                    Issue ID
                                </th>

                                <th className="px-6 py-4 text-sm font-semibold text-gray-700">
                                    Issue Date
                                </th>

                                <th className="px-6 py-4 text-sm font-semibold text-gray-700">
                                    Due Date
                                </th>

                                <th className="px-6 py-4 text-sm font-semibold text-gray-700">
                                    Return Date
                                </th>

                                <th className="px-6 py-4 text-sm font-semibold text-gray-700">
                                    Fine
                                </th>

                                <th className="px-6 py-4 text-sm font-semibold text-gray-700">
                                    Status
                                </th>

                            </tr>
                        </thead>


                        {/* Body */}
                        <tbody className="divide-y divide-gray-100">

                            {myIssues.length > 0 ? (

                                myIssues.map((issue, index) => (

                                    <tr
                                        key={issue.id}
                                        className="hover:bg-gray-50 transition"
                                    >

                                        {/* # */}
                                        <td className="px-6 py-4 text-sm text-gray-500">
                                            {index + 1}
                                        </td>

                                      


                                        {/* Book ID */}
                                        <td className="px-6 py-4">

                                            <span className="font-medium text-gray-900">
                                                #{issue.book_id}
                                            </span>

                                        </td>

                                          <td className="px-6 py-4 text-sm text-gray-500">
                                            {issue.id}
                                        </td>


                                        {/* Issue Date */}
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            {formatDate(issue.issue_date)}
                                        </td>


                                        {/* Due Date */}
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            {formatDate(issue.due_date)}
                                        </td>


                                        {/* Return Date */}
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            {formatDate(issue.return_date)}
                                        </td>


                                        {/* Fine */}
                                        <td className="px-6 py-4">

                                            <span
                                                className={`font-medium ${
                                                    issue.fine_amount > 0
                                                        ? 'text-red-600'
                                                        : 'text-green-600'
                                                }`}
                                            >
                                                ৳{issue.fine_amount}
                                            </span>

                                            {issue.fine_amount > 0 && (
                                                <p className="text-xs text-gray-400 mt-1">
                                                    {issue.fine_paid
                                                        ? 'Paid'
                                                        : 'Unpaid'}
                                                </p>
                                            )}

                                        </td>


                                        {/* Status */}
                                        <td className="px-6 py-4">

                                            <span
                                                className={`px-3 py-1 rounded-full text-xs font-medium ${
                                                    issue.status === 'issued'
                                                        ? 'bg-blue-50 text-blue-600'
                                                        : issue.status === 'returned'
                                                        ? 'bg-green-50 text-green-600'
                                                        : 'bg-gray-100 text-gray-600'
                                                }`}
                                            >
                                                {issue.status}
                                            </span>

                                        </td>

                                    </tr>

                                ))

                            ) : (

                                <tr>
                                    <td
                                        colSpan="7"
                                        className="px-6 py-12 text-center text-gray-500"
                                    >
                                        No issued books found.
                                    </td>
                                </tr>

                            )}

                        </tbody>

                    </table>

                </div>

            </div>

        </div>
    );
};

export default MyIssues;

