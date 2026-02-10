'use client';

import { useState } from 'react';
import { FiChevronDown } from 'react-icons/fi';

const faqs = [
  {
    q: 'What is fractional real estate investment?',
    a: 'Fractional real estate investment allows you to own a portion of a property rather than the whole thing. Through tokenization on the blockchain, properties are divided into shares that can be purchased starting from PKR 50,000, making real estate accessible to a broader range of investors.',
  },
  {
    q: 'How does Syntiant Atlas work?',
    a: 'Syntiant Atlas lists verified properties on its platform. Each property is tokenized into fractional shares. You can browse properties, invest in shares, earn rental yields, and participate in property governance through our DAO system. All transactions are secured on the blockchain.',
  },
  {
    q: 'What is the minimum investment amount?',
    a: 'The minimum investment varies by property but typically starts at PKR 50,000. Each property listing clearly displays its minimum and maximum investment amounts.',
  },
  {
    q: 'How do I earn returns on my investment?',
    a: 'Returns come from two sources: regular rental yield distributions (paid monthly or quarterly depending on the property) and capital appreciation when the property value increases. Expected annual returns are displayed on each property listing.',
  },
  {
    q: 'Is my investment secure?',
    a: 'Yes. All investments are recorded on the blockchain through smart contracts, ensuring transparency and immutability. Properties are thoroughly vetted before listing, and our escrow system protects funds during investment periods.',
  },
  {
    q: 'What is DAO governance?',
    a: 'DAO (Decentralized Autonomous Organization) governance allows token holders to vote on property-related decisions such as maintenance, renovations, or sale proposals. Your voting power is proportional to your investment in the property.',
  },
  {
    q: 'How do I deposit or withdraw funds?',
    a: 'You can deposit funds via bank transfer, JazzCash, or EasyPaisa through your wallet page. Withdrawals are processed to your registered bank account and typically arrive within 1-3 business days.',
  },
  {
    q: 'What KYC verification is required?',
    a: 'To comply with regulations, we require identity verification (CNIC), proof of address, and source of funds declaration. The verification process is quick and handled through our platform.',
  },
  {
    q: 'Can I sell my shares?',
    a: 'Yes. Our secondary marketplace allows you to list your property shares for sale to other investors. The platform handles the transfer of ownership on the blockchain automatically.',
  },
  {
    q: 'What fees does Syntiant Atlas charge?',
    a: 'We charge a small platform fee on investments (typically 1-2%) and a transaction fee on secondary market trades. All fees are transparently displayed before you confirm any transaction.',
  },
];

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-gray-50 transition-colors"
      >
        <span className="font-medium text-gray-900 pr-4">{q}</span>
        <FiChevronDown
          className={`text-gray-400 shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && (
        <div className="px-6 pb-4 text-gray-600 text-sm leading-relaxed">{a}</div>
      )}
    </div>
  );
}

export default function FAQPage() {
  return (
    <div className="font-poppins">
      {/* Hero */}
      <section className="py-16 px-6" style={{ background: 'linear-gradient(135deg, #0b7ef1 0%, #15459b 100%)' }}>
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Frequently Asked Questions</h1>
          <p className="text-lg text-blue-100">Everything you need to know about investing with Syntiant Atlas.</p>
        </div>
      </section>

      {/* FAQ List */}
      <section className="py-16 px-6">
        <div className="max-w-3xl mx-auto space-y-3">
          {faqs.map((faq) => (
            <FAQItem key={faq.q} q={faq.q} a={faq.a} />
          ))}
        </div>
      </section>
    </div>
  );
}
