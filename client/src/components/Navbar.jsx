import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, Upload, Image, User } from 'lucide-react';

const Navbar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <nav className="bg-white shadow-md">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    <div className="flex">
                        <Link to="/" className="flex-shrink-0 flex items-center text-xl font-bold text-indigo-600">
                            <Image className="h-8 w-8 mr-2" />
                            AI Media Manager
                        </Link>
                    </div>
                    <div className="flex items-center">
                        {user ? (
                            <>
                                <Link to="/" className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium">Dashboard</Link>
                                {user.role === 'admin' && (
                                    <Link to="/upload" className="flex items-center text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium">
                                        <Upload className="h-4 w-4 mr-1" />
                                        Upload
                                    </Link>
                                )}
                                <div className="ml-4 flex items-center">
                                    <span className="text-gray-500 text-sm mr-2 flex items-center">
                                        <User className="h-4 w-4 mr-1" />
                                        {user.username}
                                    </span>
                                    <button
                                        onClick={handleLogout}
                                        className="ml-2 flex items-center bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-md text-sm font-medium transition duration-300"
                                    >
                                        <LogOut className="h-4 w-4 mr-1" />
                                        Logout
                                    </button>
                                </div>
                            </>
                        ) : (
                            <>
                                <Link to="/login" className="text-indigo-600 hover:text-indigo-800 px-3 py-2 rounded-md text-sm font-medium">Login</Link>
                                <Link to="/register" className="ml-2 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded-md text-sm font-medium transition duration-300">Register</Link>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
