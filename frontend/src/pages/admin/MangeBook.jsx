
import React, { useContext, useEffect, useState } from 'react';
import { baseUrl } from '../../services/BaseUrl';
import { AuthContext } from '../../context/AuthProvider';
import toast from 'react-hot-toast';
import { Link } from 'react-router';

const MangeBook = () => {

    const [isModalOpen, setIsModalOpen] = useState(false);
    const { accessToken } = useContext(AuthContext)
    const [books, setBooks] = useState([]);

    const initialBookData = {
        title: '',
        author: '',
        category: '',
        description: '',
        price: '',
        total_copies: 1,
        cover_image: ''
    };

    const [bookData, setBookData] = useState(initialBookData);

    const fetchBooks = () => {
        fetch(`${baseUrl}/books/all`)
            .then(res => res.json())
            .then(data => setBooks(data))
            .catch(err => console.error("Error fetching books:", err));
    };

    useEffect(() => {
       fetchBooks();
    }, []);

    const deleteBooks = async (id) => {
        if (!window.confirm("Are you sure you want to delete this book?")) return;
        try {
            const res = await fetch(`${baseUrl}/admin/delete_book/${id}`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${accessToken}`
                }
            });
            const data = await res.json();
            if (res.ok) {
                toast.success(data.message || "Book deleted successfully");
                fetchBooks();
            } else {
                toast.error(data.detail || "Failed to delete book");
            }
        } catch (err) {
            toast.error("Network error while deleting book");
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setBookData({
            ...bookData,
            [name]: value
        });
    };

    const handleAddBook = async (e) => {
        e.preventDefault();

        try {
            const payload = {
                ...bookData,
                price: parseFloat(bookData.price) || 0,
                total_copies: parseInt(bookData.total_copies, 10) || 1,
                cover_image: bookData.cover_image?.trim() || null,
            };

            const res = await fetch(`${baseUrl}/admin/create_book`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            const data = await res.json();
            if (res.ok) {
                toast.success(data.message || "Book added successfully");
                setBookData(initialBookData);
                setIsModalOpen(false);
                fetchBooks();
            } else {
                toast.error(data.detail || "Failed to add book");
            }
        } catch (err) {
            toast.error("Network error. Failed to add book.");
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-10 px-4">

            <div className="max-w-6xl mx-auto">

                {/* Header */}
                <div className="flex items-center justify-between mb-8">

                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">
                            Manage Books
                        </h1>

                        <p className="text-gray-500 mt-1">
                            Add and manage books in your library.
                        </p>
                    </div>

                    {/* Add Book Button */}
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="px-5 py-3 bg-blue-600 text-white 
                        rounded-xl font-medium hover:bg-blue-700 
                        transition shadow-sm"
                    >
                        + Add Book
                    </button>
                </div>

                {/* Books Table */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">

                            {/* Table Header */}
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-4 text-sm font-semibold text-gray-700">
                                        #
                                    </th>

                                    <th className="px-6 py-4 text-sm font-semibold text-gray-700">
                                        Book
                                    </th>

                                    <th className="px-6 py-4 text-sm font-semibold text-gray-700">
                                        Author
                                    </th>

                                    <th className="px-6 py-4 text-sm font-semibold text-gray-700">
                                        Category
                                    </th>

                                    <th className="px-6 py-4 text-sm font-semibold text-gray-700">
                                        Price
                                    </th>

                                    <th className="px-6 py-4 text-sm font-semibold text-gray-700">
                                        Available
                                    </th>

                                    <th className="px-6 py-4 text-sm font-semibold text-gray-700">
                                        Total Copies
                                    </th>

                                    <th className="px-6 py-4 text-sm font-semibold text-gray-700 text-right">
                                        Actions
                                    </th>
                                </tr>
                            </thead>

                            {/* Table Body */}
                            <tbody className="divide-y divide-gray-100">

                                {books.map((book, index) => (
                                    <tr
                                        key={book.id}
                                        className="hover:bg-gray-50 transition"
                                    >

                                        {/* ID */}
                                        <td className="px-6 py-4 text-sm text-gray-500">
                                            {index + 1}
                                        </td>

                                        {/* Book */}
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">

                                                {/* Cover */}
                                                <div className="w-11 h-14 rounded-lg bg-gray-100 
                                    flex items-center justify-center overflow-hidden">

                                                    {book.cover_image ? (
                                                        <img
                                                            src={book.cover_image}
                                                            alt={book.title}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        <span className="text-lg">
                                                            📚
                                                        </span>
                                                    )}

                                                </div>

                                                <div>
                                                    <p className="font-semibold text-gray-900">
                                                        {book.title}
                                                    </p>

                                                    <p className="text-xs text-gray-400 mt-1">
                                                        ID: #{book.id}
                                                    </p>
                                                </div>

                                            </div>
                                        </td>

                                        {/* Author */}
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            {book.author}
                                        </td>

                                        {/* Category */}
                                        <td className="px-6 py-4">
                                            <span className="px-3 py-1 rounded-full 
                                bg-blue-50 text-blue-600 text-xs font-medium">
                                                {book.category}
                                            </span>
                                        </td>

                                        {/* Price */}
                                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                                            ৳{book.price}
                                        </td>

                                        {/* Available */}
                                        <td className="px-6 py-4">
                                            <span
                                                className={`text-sm font-medium ${book.available_copies > 0
                                                    ? 'text-green-600'
                                                    : 'text-red-600'
                                                    }`}
                                            >
                                                {book.available_copies}
                                            </span>
                                        </td>

                                        {/* Total Copies */}
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            {book.total_copies}
                                        </td>

                                        {/* Actions */}
                                        <td className="px-6 py-4">
                                            <div className="flex justify-end gap-2">

                                                <Link to={`/admin/edit/book/${book.id}`}
                                                    className="px-3 py-2 rounded-lg 
                                    bg-blue-50 text-blue-600 text-sm 
                                    font-medium hover:bg-blue-100 transition"
                                                >
                                                    Edit
                                                </Link>

                                                <button onClick={()=> deleteBooks(book.id)}
                                                    className="px-3 py-2 rounded-lg 
                                    bg-red-50 text-red-600 text-sm 
                                    font-medium hover:bg-red-100 transition"
                                                >
                                                    Delete
                                                </button>

                                            </div>
                                        </td>

                                    </tr>
                                ))}

                            </tbody>

                        </table>
                    </div>
                </div>

                {/* Modal */}
                {isModalOpen && (
                    <div
                        className="fixed inset-0 z-50 flex items-center 
                        justify-center bg-black/50 px-4"
                    >

                        <div
                            className="bg-white w-full max-w-2xl rounded-2xl 
                            shadow-xl max-h-[90vh] overflow-y-auto"
                        >

                            {/* Modal Header */}
                            <div className="flex items-center justify-between 
                                px-6 py-5 border-b border-gray-200">

                                <div>
                                    <h2 className="text-xl font-bold text-gray-900">
                                        Add New Book
                                    </h2>

                                    <p className="text-sm text-gray-500 mt-1">
                                        Enter the book information below.
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="text-gray-400 hover:text-gray-700 
                                    text-2xl leading-none"
                                >
                                    &times;
                                </button>

                            </div>

                            {/* Form */}
                            <form
                                onSubmit={handleAddBook}
                                className="p-6"
                            >

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                                    {/* Title */}
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium 
                                            text-gray-700 mb-2">
                                            Title
                                        </label>

                                        <input
                                            type="text"
                                            name="title"
                                            value={bookData.title}
                                            onChange={handleChange}
                                            placeholder="Enter book title"
                                            required
                                            className="w-full px-4 py-3 rounded-xl 
                                            border border-gray-300 outline-none
                                            focus:ring-2 focus:ring-blue-500
                                            focus:border-blue-500 transition"
                                        />
                                    </div>

                                    {/* Author */}
                                    <div>
                                        <label className="block text-sm font-medium 
                                            text-gray-700 mb-2">
                                            Author
                                        </label>

                                        <input
                                            type="text"
                                            name="author"
                                            value={bookData.author}
                                            onChange={handleChange}
                                            placeholder="Enter author name"
                                            required
                                            className="w-full px-4 py-3 rounded-xl 
                                            border border-gray-300 outline-none
                                            focus:ring-2 focus:ring-blue-500
                                            focus:border-blue-500 transition"
                                        />
                                    </div>

                                    {/* Category */}
                                    <div>
                                        <label className="block text-sm font-medium 
                                            text-gray-700 mb-2">
                                            Category
                                        </label>

                                        <input
                                            type="text"
                                            name="category"
                                            value={bookData.category}
                                            onChange={handleChange}
                                            placeholder="e.g. Fiction"
                                            required
                                            className="w-full px-4 py-3 rounded-xl 
                                            border border-gray-300 outline-none
                                            focus:ring-2 focus:ring-blue-500
                                            focus:border-blue-500 transition"
                                        />
                                    </div>

                                    {/* Price */}
                                    <div>
                                        <label className="block text-sm font-medium 
                                            text-gray-700 mb-2">
                                            Price
                                        </label>

                                        <input
                                            type="number"
                                            name="price"
                                            value={bookData.price}
                                            onChange={handleChange}
                                            min="0"
                                            step="0.01"
                                            placeholder="0"
                                            required
                                            className="w-full px-4 py-3 rounded-xl 
                                            border border-gray-300 outline-none
                                            focus:ring-2 focus:ring-blue-500
                                            focus:border-blue-500 transition"
                                        />
                                    </div>

                                    {/* Total Copies */}
                                    <div>
                                        <label className="block text-sm font-medium 
                                            text-gray-700 mb-2">
                                            Total Copies
                                        </label>

                                        <input
                                            type="number"
                                            name="total_copies"
                                            value={bookData.total_copies}
                                            onChange={handleChange}
                                            min="1"
                                            required
                                            className="w-full px-4 py-3 rounded-xl 
                                            border border-gray-300 outline-none
                                            focus:ring-2 focus:ring-blue-500
                                            focus:border-blue-500 transition"
                                        />
                                    </div>

                                    {/* Description */}
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium 
                                            text-gray-700 mb-2">
                                            Description
                                        </label>

                                        <textarea
                                            name="description"
                                            value={bookData.description}
                                            onChange={handleChange}
                                            rows="4"
                                            placeholder="Enter book description"
                                            className="w-full px-4 py-3 rounded-xl 
                                            border border-gray-300 outline-none
                                            focus:ring-2 focus:ring-blue-500
                                            focus:border-blue-500 transition resize-none"
                                        />
                                    </div>

                                    {/* Cover Image URL */}
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium 
                                            text-gray-700 mb-2">
                                            Cover Image URL (Optional)
                                        </label>

                                        <input
                                            type="url"
                                            name="cover_image"
                                            value={bookData.cover_image || ''}
                                            onChange={handleChange}
                                            placeholder="https://example.com/cover.jpg"
                                            className="w-full px-4 py-3 rounded-xl 
                                            border border-gray-300 outline-none
                                            focus:ring-2 focus:ring-blue-500
                                            focus:border-blue-500 transition"
                                        />
                                    </div>

                                </div>

                                {/* Buttons */}
                                <div className="flex justify-end gap-3 mt-7 pt-5 
                                    border-t border-gray-200">

                                    <button
                                        type="button"
                                        onClick={() => setIsModalOpen(false)}
                                        className="px-5 py-3 rounded-xl border 
                                        border-gray-300 text-gray-700 
                                        font-medium hover:bg-gray-50 transition"
                                    >
                                        Cancel
                                    </button>

                                    <button
                                        type="submit"
                                        className="px-6 py-3 rounded-xl bg-blue-600 
                                        text-white font-medium hover:bg-blue-700 
                                        transition"
                                    >
                                        Add Book
                                    </button>

                                </div>

                            </form>

                        </div>
                    </div>
                )}

            </div>

        </div>
    );
};

export default MangeBook;
