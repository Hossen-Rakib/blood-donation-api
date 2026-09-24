import React, { useContext, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { AuthContext } from '../../context/AuthProvider';
import { baseUrl } from '../../services/BaseUrl';
import toast from 'react-hot-toast';

const EditBook = () => {

    const { id } = useParams();
    const navigate = useNavigate();
    const { accessToken } = useContext(AuthContext);

    const [bookDetails, setBookDetails] = useState(null);

    // Form states
    const [title, setTitle] = useState('');
    const [author, setAuthor] = useState('');
    const [category, setCategory] = useState('');
    const [description, setDescription] = useState('');
    const [price, setPrice] = useState(0);
    const [totalCopies, setTotalCopies] = useState(0);
    const [availableCopies, setAvailableCopies] = useState(0);
    const [coverImage, setCoverImage] = useState('');

    // Get book details
    useEffect(() => {
        if (!id || !accessToken) return;

        fetch(`${baseUrl}/books/${id}`, {
            headers: {
                Authorization: `Bearer ${accessToken}`
            }
        })
            .then(res => {
                if (!res.ok) throw new Error("Failed to load book");
                return res.json();
            })
            .then(data => setBookDetails(data))
            .catch(err => {
                console.error(err);
                toast.error("Could not load book details");
            });

    }, [id, accessToken]);

    // Set API data into states
    useEffect(() => {
        if (bookDetails) {
            setTitle(bookDetails.title || '');
            setAuthor(bookDetails.author || '');
            setCategory(bookDetails.category || '');
            setDescription(bookDetails.description || '');
            setPrice(bookDetails.price ?? 0);
            setTotalCopies(bookDetails.total_copies ?? 0);
            setAvailableCopies(bookDetails.available_copies ?? 0);
            setCoverImage(bookDetails.cover_image || '');
        }
    }, [bookDetails]);

    const handleUpdate = async (e) => {
        if (e) e.preventDefault();

        const formData = {
            title,
            author,
            category,
            description,
            price: parseFloat(price) || 0,
            total_copies: parseInt(totalCopies, 10) || 0,
            available_copies: parseInt(availableCopies, 10) || 0,
            cover_image: coverImage?.trim() || null,
        };

        try {
            const res = await fetch(`${baseUrl}/admin/update_book/${id}`, {
                method: "PUT",
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            const data = await res.json();
            if (res.ok) {
                toast.success(data.message || 'Book updated successfully!');
                navigate('/admin/manage-book');
            } else {
                toast.error(data.detail || 'Failed to update book');
            }
        } catch (err) {
            toast.error('Network error. Failed to update book.');
        }
    };


    return (
        <div className="max-w-3xl mx-auto p-6">

            <h1 className="text-2xl font-bold text-gray-900 mb-6">
                Edit Book
            </h1>

            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                    {/* Title */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Title
                        </label>

                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:border-blue-500"
                        />
                    </div>


                    {/* Author */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Author
                        </label>

                        <input
                            type="text"
                            value={author}
                            onChange={(e) => setAuthor(e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:border-blue-500"
                        />
                    </div>


                    {/* Category */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Category
                        </label>

                        <input
                            type="text"
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:border-blue-500"
                        />
                    </div>


                    {/* Price */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Price
                        </label>

                        <input
                            type="number"
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:border-blue-500"
                        />
                    </div>


                    {/* Total Copies */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Total Copies
                        </label>

                        <input
                            type="number"
                            value={totalCopies}
                            onChange={(e) => setTotalCopies(e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:border-blue-500"
                        />
                    </div>


                    {/* Available Copies */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Available Copies
                        </label>

                        <input
                            type="number"
                            value={availableCopies}
                            onChange={(e) => setAvailableCopies(e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:border-blue-500"
                        />
                    </div>

                </div>


                {/* Description */}
                <div className="mt-5">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Description
                    </label>
                    <textarea
                        rows="4"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:border-blue-500 resize-none"
                    />
                </div>

                {/* Cover Image URL */}
                <div className="mt-5">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Cover Image URL
                    </label>
                    <input
                        type="url"
                        value={coverImage}
                        onChange={(e) => setCoverImage(e.target.value)}
                        placeholder="https://example.com/cover.jpg"
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:border-blue-500"
                    />
                </div>


                {/* Button */}
                <div className="flex justify-end mt-6">

                    <button onClick={handleUpdate}
                        className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
                    >
                        Update Book
                    </button>

                </div>

            </div>

        </div>
    );
};

export default EditBook;