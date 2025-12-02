import React from 'react';
import { FileText } from 'lucide-react';

const Header = () => {
    return (
        <header className="bg-blue-600 text-white p-4 shadow-md">
            <div className="container mx-auto flex items-center justify-center gap-2">
                <FileText size={24} />
                <h1 className="text-xl font-bold">SESAU Busca Contratos</h1>
            </div>
        </header>
    );
};

export default Header;
