import React, { useEffect, useState } from 'react';
import { baseUrl } from '../services/BaseUrl';
import BookCard from './BookCard';

const FeatureBooks = () => {

    const [featureBooks, setFeatureBooks] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch(`${baseUrl}/books/all`)
            .then(res => res.json())
            .then(data => {
                setFeatureBooks(data);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <div className="flex justify-center items-center py-20">
                <span className="loading loading-spinner loading-lg"></span>
            </div>
        );
    }

    return (
        <div className="py-10">
            <h1 className="text-center text-4xl py-8 font-bold">Our Featured Books</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 px-12">
                {featureBooks.slice(0, 3).map(book => (
                    <BookCard book={book} key={book.id} />
                ))}
            </div>
        </div>
    );
};

export default FeatureBooks;