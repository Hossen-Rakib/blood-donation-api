import React from 'react';

const HeroBanner = () => {
    return (
        <div
            className="hero min-h-[500px]"
            style={{
                backgroundImage:
                    "url(https://images.unsplash.com/photo-1694730750153-8b66cf3dd014?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D)",
            }}
        >
            <div className="hero-overlay"></div>
            <div className="hero-content text-neutral-content text-center">
                <div className="max-w-md">
                    <h1 className="mb-5 text-5xl font-bold">Discover. Borrow. Manage.</h1>
                    <p className="mb-5">
                        Everything you need to manage your library and make book discovery simple and convenient.
                    </p>
                    <button className="btn btn-primary">Get Started</button>
                </div>
            </div>
        </div>
    );
};

export default HeroBanner;