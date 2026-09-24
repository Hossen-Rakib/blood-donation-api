import React, { useContext, useEffect, useState } from 'react';
import { useParams } from 'react-router';
import { baseUrl } from '../services/BaseUrl';
import { AuthContext } from '../context/AuthProvider';
import toast from 'react-hot-toast';

const BookDetails = () => {

    const { id } = useParams();
    const [bookDetails, setBookDetails] = useState(null);
    const [reserving, setReserving] = useState(false);
    const { accessToken } = useContext(AuthContext);

    const fetchBookDetails = () => {
        if (!id) return;
        fetch(`${baseUrl}/books/${id}`, {
            headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {}
        })
            .then(res => {
                if (!res.ok) throw new Error("Failed to load book");
                return res.json();
            })
            .then(data => setBookDetails(data))
            .catch(err => console.log(err));
    };

    const handleReserve = async () => {
        if (!accessToken) {
            toast.error("Please login to reserve this book!");
            return;
        }

        setReserving(true);
        try {
            const res = await fetch(`${baseUrl}/reserve/${id}`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${accessToken}`
                }
            });

            const data = await res.json();
            if (res.ok) {
                toast.success(data.message || "Book reserved successfully!");
                fetchBookDetails();
            } else {
                toast.error(data.detail || "Could not reserve book");
            }
        } catch (err) {
            toast.error("Network error. Failed to reserve book.");
        } finally {
            setReserving(false);
        }
    };

    useEffect(() => {
        fetchBookDetails();
    }, [id, accessToken]);


    return (
        <div className="min-h-screen bg-gray-50 px-4 py-10">
            <div className="mx-auto max-w-6xl">

                {/* Details Card */}
                <div className="overflow-hidden rounded-2xl bg-white shadow-sm">

                    <div className="grid grid-cols-1 gap-8 p-6 md:grid-cols-2 md:p-10">

                        {/* Book Cover */}
                        <div className="flex min-h-[450px] items-center justify-center rounded-xl bg-gray-100 p-8">
                            {bookDetails?.cover_image ? (
                                <img
                                    src={bookDetails?.cover_image}
                                    alt={bookDetails?.title}
                                    className="max-h-[420px] w-auto rounded-lg object-cover shadow-md"
                                />
                            ) : (
                                <div className="flex h-[380px] w-[260px] items-center justify-center rounded-lg bg-gray-200 p-6 text-center shadow-md">
                                    <span className="text-xl font-semibold text-gray-500">
                                        {bookDetails?.title}
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Book Information */}
                        <div className="flex flex-col justify-center">

                            {/* Category */}
                            <span className="mb-4 w-fit rounded-full bg-blue-100 px-4 py-1 text-sm font-medium text-blue-700">
                                {bookDetails?.category}
                            </span>

                            {/* Title */}
                            <h1 className="text-3xl font-bold tracking-tight text-gray-900 md:text-4xl">
                                {bookDetails?.title}
                            </h1>

                            {/* Author */}
                            <p className="mt-3 text-lg text-gray-600">
                                By{" "}
                                <span className="font-semibold text-gray-900">
                                    {bookDetails?.author}
                                </span>
                            </p>

                            {/* Description */}
                            <p className="mt-6 leading-7 text-gray-600">
                                {bookDetails?.description}
                            </p>

                            {/* Book Info */}
                            <div className="mt-8 grid grid-cols-2 gap-4">

                                <div className="rounded-xl border border-gray-200 p-4">
                                    <p className="text-sm text-gray-500">Price</p>
                                    <p className="mt-1 text-2xl font-bold text-gray-900">
                                        ৳{bookDetails?.price}
                                    </p>
                                </div>

                                <div className="rounded-xl border border-gray-200 p-4">
                                    <p className="text-sm text-gray-500">
                                        Available Copies
                                    </p>
                                    <p className="mt-1 text-2xl font-bold text-green-600">
                                        {bookDetails?.available_copies}
                                    </p>
                                </div>

                            </div>

                            {/* Total Copies */}
                            <div className="mt-4 flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3">
                                <span className="text-gray-600">
                                    Total Copies
                                </span>
                                <span className="font-semibold text-gray-900">
                                    {bookDetails?.total_copies}
                                </span>
                            </div>

                            {/* Reserve Button */}
                            <button
                                onClick={handleReserve}
                                disabled={reserving || (bookDetails?.available_copies ?? 0) <= 0}
                                className="mt-6 w-full rounded-xl bg-blue-600 px-6 py-4 text-lg font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-400"
                            >
                                {reserving ? (
                                    <span className="loading loading-spinner loading-md"></span>
                                ) : (bookDetails?.available_copies ?? 0) <= 0 ? (
                                    "Out of Stock (No Copies Available)"
                                ) : (
                                    "Reserve Book"
                                )}
                            </button>

                        </div>
                    </div>

                    {/* Bottom Info */}
                    <div className="border-t border-gray-100 bg-gray-50 px-6 py-5 md:px-10">
                        <div className="flex flex-wrap gap-8 text-sm text-gray-600">
                            <div>
                                <span className="font-medium text-gray-900">Book ID:</span>{" "}
                                #{bookDetails?.id}
                            </div>

                            <div>
                                <span className="font-medium text-gray-900">Category:</span>{" "}
                                {bookDetails?.category}
                            </div>

                            <div>
                                <span className="font-medium text-gray-900">Status:</span>{" "}
                                <span className="text-green-600">Available</span>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default BookDetails;