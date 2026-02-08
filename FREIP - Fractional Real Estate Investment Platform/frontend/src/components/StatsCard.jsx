
import { FaArrowUp, FaArrowDown } from 'react-icons/fa';

export default function StatsCard({ title, value, subValues, icon: Icon }) {
    return (
        <div className="bg-white p-6 rounded-xl shadow-[0_2px_10px_0_rgba(0,0,0,0.05)] border border-gray-100 flex flex-col justify-between h-full">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h3 className="text-gray-500 text-sm font-medium mb-1">{title}</h3>
                    <div className="flex items-baseline">
                        <span className="text-2xl font-bold text-gray-800">{value}</span>
                    </div>
                </div>
                {Icon && (
                    <div className="p-3 bg-blue-50 rounded-lg text-daoblue">
                        <Icon className="text-xl" />
                    </div>
                )}
            </div>

            {subValues && (
                <div className="border-l-2 border-gray-100 pl-4 mt-2 space-y-1">
                    {subValues.map((item, index) => (
                        <div key={index} className="flex justify-between items-center text-sm">
                            <span className="text-gray-500 flex items-center gap-2">
                                {item.icon && <item.icon className="text-daoblue" />}
                                {item.label}
                            </span>
                            <span className="font-semibold text-gray-700">{item.value}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
