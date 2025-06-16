import React from 'react';

// هذا هو مكون ComparisonTab.js
// يرجى حفظ هذا الكود في ملف جديد باسم ComparisonTab.js في نفس مجلد App.js

const ComparisonTab = ({ sortedComparisonData }) => {
    return (
        <section className="animate-fadeIn">
            <h2 className="text-3xl font-bold text-center text-indigo-700 mb-8 border-b-2 border-indigo-400 pb-4 font-cairo-display">
                مقارنة وتقييم الأسماء
            </h2>
            <p className="text-center text-gray-600 italic mb-6">
                (اختبرا حدسكما ومعرفتكما بالأسماء من خلال ألعابنا الممتعة!)
            </p>

            {/* Comparison Data Cards (kept as requested) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
                {sortedComparisonData.map((nameComp) => (
                    <div key={nameComp.name} className="bg-white rounded-xl shadow-lg p-6 border border-purple-200 flex flex-col items-center text-center transform transition-transform duration-300 hover:scale-105 hover:shadow-2xl">
                        <h3 className="text-3xl font-bold text-indigo-800 mb-4 font-cairo-display">{nameComp.name}</h3>
                        <div className="w-full text-left space-y-3">
                            <p className="text-lg text-gray-700 flex items-center">
                                <span className="text-purple-600 ml-2">📚</span> <span className="font-semibold">المعنى:</span> {nameComp.meaning}
                            </p>
                            <p className="text-lg text-gray-700 flex items-center">
                                <span className="text-purple-600 ml-2">🗣️</span> <span className="font-semibold">القبول العملي:</span> {nameComp.practical.split('.')[0]}.
                            </p>
                            <p className="text-lg text-gray-700 flex items-center">
                                <span className="text-purple-600 ml-2">✨</span> <span className="font-semibold">القوة الشخصية:</span> {nameComp.personalStrength.split('.')[0]}.
                            </p>
                            <p className="text-lg text-gray-700 flex items-center">
                                <span className="text-purple-600 ml-2">💖</span> <span className="font-semibold">التوافق مع "الغزالي":</span> {nameComp.compatibility.split('.')[0]}.
                            </p>
                            <p className="text-lg text-gray-700 flex items-center">
                                <span className="text-purple-600 ml-2">📊</span> <span className="font-semibold">النقاط:</span> <span className="text-blue-600 font-bold text-2xl ml-2">{nameComp.score.toFixed(1)}</span>
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
};

export default ComparisonTab;
