import React from 'react';
import ContractCard from './ContractCard';

const ContractList = ({ contracts }) => {
    if (!contracts || contracts.length === 0) {
        return (
            <div className="text-center p-8 text-gray-500">
                <p>Nenhum contrato encontrado.</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
            {contracts.map((contract, index) => (
                <ContractCard key={index} contract={contract} />
            ))}
        </div>
    );
};

export default ContractList;
