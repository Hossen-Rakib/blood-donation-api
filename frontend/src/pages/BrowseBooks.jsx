import React, { useEffect, useState } from 'react';
import BookCard from '../components/BookCard';
import { baseUrl } from '../services/BaseUrl';

const BrowseBooks = () => {

    const [books, setBooks] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch(`${baseUrl}/books/all`)
            .then(res => res.json())
            .then(data => {
                setBooks(data);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[400px]">
                <span className="loading loading-spinner loading-lg"></span>
            </div>
        );
    }

    if (books.length === 0) {
        return (
            <div className="text-center py-20">
                <p className="text-2xl text-gray-400">No books found.</p>
            </div>
        );
    }

    return (
        <div>
            <h1 className="text-center text-4xl py-10 font-bold">Browse All Books</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 p-12 gap-8">
                {books.map(book => (
                    <BookCard book={book} key={book.id} />
                ))}
            </div>
        </div>
    );
};

export default BrowseBooks;