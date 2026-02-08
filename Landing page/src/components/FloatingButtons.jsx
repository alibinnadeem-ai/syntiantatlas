import { FaComments, FaCalendarAlt } from 'react-icons/fa'

export default function FloatingButtons() {
    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3">
            {/* Book a Meeting Button */}
            <a
                href="https://meetings.daoproptech.com"
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-3 bg-teal-500 hover:bg-teal-600 text-white px-4 py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
            >
                <FaCalendarAlt size={18} />
                <span className="hidden group-hover:inline-block text-sm font-medium whitespace-nowrap">
                    Book a Meeting
                </span>
            </a>

            {/* DAO Chat Button */}
            <a
                href="https://chat.daoproptech.com"
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-3 bg-dao-lime hover:bg-lime-400 text-dao-dark px-4 py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
            >
                <FaComments size={18} />
                <span className="hidden group-hover:inline-block text-sm font-medium whitespace-nowrap">
                    DAO Chat
                </span>
            </a>
        </div>
    )
}
