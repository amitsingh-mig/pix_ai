import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Search, Image, Video, Trash2 } from 'lucide-react';

const Dashboard = () => {
    const [media, setMedia] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const { user } = useAuth();

    const fetchMedia = async (searchQuery = '') => {
        setLoading(true);
        try {
            const res = await api.get(`/media?search=${searchQuery}`);
            setMedia(res.data.data);
        } catch (err) {
            console.error("Failed to fetch media", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMedia();
    }, []);

    const handleSearch = (e) => {
        e.preventDefault();
        fetchMedia(search);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this item?')) return;
        try {
            await api.delete(`/media/${id}`);
            setMedia(media.filter(item => item._id !== id));
        } catch (err) {
            console.error("Failed to delete media", err);
            alert('Failed to delete media');
        }
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="mb-8">
                <form onSubmit={handleSearch} className="flex gap-2">
                    <div className="relative flex-grow">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 p-2.5"
                            placeholder="Search by title, tags, or AI detected content..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <button
                        type="submit"
                        className="text-white bg-indigo-600 hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-300 font-medium rounded-lg text-sm px-5 py-2.5"
                    >
                        Search
                    </button>
                </form>
            </div>

            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {media.map((item) => (
                        <div key={item._id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300 relative group">
                            <div className="h-48 overflow-hidden bg-gray-200 relative">
                                {item.type === 'image' ? (
                                    <img
                                        src={item.url}
                                        alt={item.title}
                                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                    />
                                ) : (
                                    <video
                                        src={item.url}
                                        className="w-full h-full object-cover"
                                        controls
                                    />
                                )}
                                <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                                    {item.type === 'image' ? <Image className="h-4 w-4" /> : <Video className="h-4 w-4" />}
                                </div>
                                {user && (user.role === 'admin' || user.id === item.uploadedBy?._id) && (
                                    <button
                                        onClick={() => handleDelete(item._id)}
                                        className="absolute top-2 left-2 bg-red-600 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-red-700"
                                        title="Delete"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                )}
                            </div>
                            <div className="p-4">
                                <h3 className="text-lg font-semibold text-gray-900 mb-1 truncate">{item.title}</h3>
                                <p className="text-sm text-gray-500 mb-2">By {item.uploadedBy?.username}</p>
                                <div className="flex flex-wrap gap-1">
                                    {item.tags.map((tag, index) => (
                                        <span key={index} className="bg-indigo-100 text-indigo-800 text-xs font-medium px-2.5 py-0.5 rounded">
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))}
                    {media.length === 0 && (
                        <div className="col-span-full text-center text-gray-500 py-12">
                            No media found. Try a different search or upload some content.
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default Dashboard;
