import React from 'react';
import { Link } from 'react-router';

const BookCard = ({book}) => {
    return (
        <div className="card bg-base-100 shadow-md hover:shadow-xl transition-all duration-300 border border-base-200">
            {/* Book Cover */}
            <figure className="h-64 bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                {book.cover_image ? (
                    <img
                        src={book.cover_image}
                        alt={book.title}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="flex flex-col items-center justify-center text-primary-content">
                        <span className="text-7xl font-bold">
                            {book.title.charAt(0)}
                        </span>
                        <span className="text-sm opacity-80 mt-2">
                            {book.category}
                        </span>
                    </div>
                )}
            </figure>

            {/* Card Body */}
            <div className="card-body p-5">
                {/* Category */}
                <div className="flex items-center justify-between">
                    <span className="badge badge-primary badge-outline">
                        {book.category}
                    </span>

                    <span className="font-bold text-lg">
                        ৳{book.price}
                    </span>
                </div>

                {/* Title */}
                <h2 className="card-title text-xl mt-2">
                    {book.title}
                </h2>

                {/* Author */}
                <p className="text-sm text-base-content/60">
                    by {book.author}
                </p>



                {/* Action */}
                <div className="card-actions mt-4">
                    <Link to={`/books/${book.id}`}><button className="btn btn-primary w-full" >
                       View Details
                    </button></Link>
                </div>
            </div>
        </div>
    );
};

export default BookCard;