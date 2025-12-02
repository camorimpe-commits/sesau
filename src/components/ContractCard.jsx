import React from 'react';
import { Calendar, DollarSign, User, FileText, AlertCircle, CheckCircle, Clock } from 'lucide-react';

const ContractCard = ({ contract }) => {
    return (
        <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100 hover:shadow-lg transition-shadow duration-300">
            <div className="bg-gray-50 p-3 border-b border-gray-100 flex justify-between items-start">
                <div>
                    <h3 className="font-bold text-gray-800 text-lg">{contract['ENTIDADE']}</h3>
                    <p className="text-sm text-gray-500 font-mono">{contract['Nº DO CONTRATO']}</p>
                </div>
                <div className={`px-2 py-1 rounded-full text-xs font-bold ${contract['STATUS DA VIGÊNCIA'] === 'VIGENTE' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                    {contract['STATUS DA VIGÊNCIA']}
                </div>
            </div>

            <div className="p-4 space-y-3">
                {/* Secretaria e SEI */}
                <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                        <span className="text-gray-500 block text-xs">Secretaria Executiva</span>
                        <span className="font-medium text-gray-800">{contract['SECRETARIA EXECUTIVA']}</span>
                    </div>
                    <div>
                        <span className="text-gray-500 block text-xs">Nº do SEI</span>
                        <span className="font-medium text-gray-800">{contract['Nº DO SEI']}</span>
                    </div>
                </div>

                {/* Objeto */}
                <div className="bg-blue-50 p-3 rounded-lg">
                    <div className="flex items-start gap-2">
                        <FileText size={16} className="text-blue-500 mt-0.5 shrink-0" />
                        <div>
                            <span className="text-xs text-blue-500 font-bold uppercase block mb-1">Objeto Resumido</span>
                            <p className="text-sm text-gray-700 leading-snug">{contract['OBJETO RESUMIDO']}</p>
                        </div>
                    </div>
                </div>

                {/* Gestor */}
                <div className="flex items-center gap-2 text-sm">
                    <User size={16} className="text-gray-400" />
                    <div>
                        <span className="text-gray-500 text-xs block">Gestor</span>
                        <span className="text-gray-800 font-medium">{contract['GESTOR']}</span>
                    </div>
                </div>

                {/* Vigência */}
                <div className="grid grid-cols-2 gap-3 text-sm border-t border-gray-100 pt-2">
                    <div>
                        <div className="flex items-center gap-1 text-gray-500 mb-1">
                            <Calendar size={14} />
                            <span className="text-xs">Vigência</span>
                        </div>
                        <p className="font-medium text-gray-800">{contract['INÍCIO DA VIGÊNCIA DO INSTRUMENTO']} - {contract['FIM DA VIGÊNCIA DO INSTRUMENTO']}</p>
                    </div>
                    <div>
                        <div className="flex items-center gap-1 text-gray-500 mb-1">
                            <Clock size={14} />
                            <span className="text-xs">Dias p/ Vencimento</span>
                        </div>
                        <p className={`font-bold ${parseInt(contract['DIAS']) < 30 ? 'text-red-600' : 'text-gray-800'}`}>
                            {contract['DIAS']} dias
                        </p>
                    </div>
                </div>

                {/* Valores */}
                <div className="grid grid-cols-2 gap-3 text-sm bg-gray-50 p-2 rounded-lg">
                    <div>
                        <span className="text-gray-500 block text-xs">Valor Mensal</span>
                        <span className="font-bold text-gray-800">{contract['VALOR MENSAL (R$)']}</span>
                    </div>
                    <div>
                        <span className="text-gray-500 block text-xs">Valor Anual</span>
                        <span className="font-bold text-gray-800">{contract['VALOR ANUAL (R$)']}</span>
                    </div>
                </div>

                {/* Status Extras */}
                <div className="flex flex-wrap gap-2 text-xs pt-1">
                    <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded border border-gray-200">
                        Termo Atual: {contract['TERMO ATUAL']}
                    </span>
                    {contract['É MAIS A MAIS RECENTE?'] === 'Sim' && (
                        <span className="bg-green-50 text-green-700 px-2 py-1 rounded border border-green-100 flex items-center gap-1">
                            <CheckCircle size={10} /> Mais Recente
                        </span>
                    )}
                    {contract['TA EM ANDAMENTO?'] === 'Sim' && (
                        <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded border border-blue-100 flex items-center gap-1">
                            <AlertCircle size={10} /> Em Andamento
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ContractCard;
