import React, { useState } from 'react';
import { Search } from 'lucide-react';

const SearchForm = ({ onSearch }) => {
    const [query, setQuery] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        onSearch(query);
    };

    return (
        <form onSubmit={handleSubmit} className="w-full max-w-md mx-auto p-4">
            <div className="relative flex items-center">
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Nome da empresa ou Nº do contrato"
                    className="w-full p-3 pl-10 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm text-gray-800"
                />
                <Search className="absolute left-3 text-gray-400" size={20} />
                <button
                    type="submit"
                    className="ml-2 bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                    Buscar
                </button>
            </div>
        </form>
    );
};

export default SearchForm;
