import React from 'react';

// هذا هو مكون RecommendationTab.js
// يرجى حفظ هذا الكود في ملف جديد باسم RecommendationTab.js في مجلد src/components

const RecommendationTab = ({
    sortedComparisonData,
    showRecommendation,
    setShowRecommendation,
    nameDetails,
    generatedBlessing,
    loadingBlessing,
    handleGenerateBlessing,
}) => {
    const suitableNames = sortedComparisonData;

    let primaryRecommendationNames = [];
    // Prioritize 'يامن' and 'غياث' if they exist in the suitable names
    if (suitableNames.some(n => n.name === 'يامن')) {
        primaryRecommendationNames.push(suitableNames.find(n => n.name === 'يامن'));
    }
    if (suitableNames.some(n => n.name === 'غياث')) {
        primaryRecommendationNames.push(suitableNames.find(n => n.name === 'غياث'));
    }

    // Sort the primary recommendations by score
    primaryRecommendationNames.sort((a,b) => b.score - a.score);

    let finalRecommended = [];
    if (primaryRecommendationNames.length >= 2) {
        finalRecommended = primaryRecommendationNames.slice(0, 2);
    } else if (suitableNames.length >= 2) {
        finalRecommended = suitableNames.slice(0, 2);
    } else if (suitableNames.length === 1) {
        finalRecommended = suitableNames;
    }

    return (
        <section className="animate-fadeIn">
            <h2 className="text-3xl font-bold text-center text-indigo-700 mb-8 border-b-2 border-indigo-400 pb-4 font-cairo-display">
                الترشيح النهائي
            </h2>
            <div className="bg-gradient-to-br from-purple-100 to-indigo-200 p-8 rounded-lg shadow-xl text-center border-4 border-purple-300">
                <h2 className="text-4xl font-extrabold text-purple-800 mb-6 animate-pulse-fade font-cairo-display">ترشيحاتنا الشخصية لكما</h2>
                <p className="text-xl text-gray-700 mb-8">
                    من وجهة نظري الشخصية كمساعد افتراضي، وبعد التحليل الشامل لجميع الأسماء، أرشح لكما اسمين ممتازين لمولودكما. كل منهما يحمل دلالات عميقة وجميلة، ومقبول مجتمعياً ودينياً، ويتوافق بشكل رائع مع لقب "الغزالي" الكريم.
                </p>
                <div className="flex justify-center items-center mb-8">
                    <button
                        onClick={() => setShowRecommendation(!showRecommendation)}
                        className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-bold py-4 px-8 rounded-full shadow-lg transform transition-transform duration-300 hover:scale-105 focus:outline-none focus:ring-4 focus:ring-blue-300 animate-bounce flex items-center space-x-2"
                    >
                        <span>{showRecommendation ? 'إخفاء الترشيح' : 'انقر هنا للكشف عن الترشيحات'}</span>
                        <svg className={`w-5 h-5 transition-transform duration-300 ${showRecommendation ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                    </button>
                </div>
                {showRecommendation && (
                    <div className="mt-8 bg-white p-6 rounded-lg shadow-inner border-t-4 border-indigo-500 animate-fadeInUp">
                        {finalRecommended.map((rec, index) => (
                            <div key={rec.name} className={`mb-8 ${index === 0 && finalRecommended.length > 1 ? 'pb-8 border-b border-indigo-200' : ''}`}>
                                <h3 className="text-3xl font-bold text-indigo-700 mb-4 flex items-center justify-center space-x-3 font-cairo-display">
                                    <span>الاسم المقترح {index + 1}:</span> <span className="text-purple-600 transform animate-bounce-text-once">{rec.name}</span>
                                </h3>
                                <p className="text-lg text-gray-800 leading-relaxed mb-4">
                                    اسم <span className="font-semibold text-purple-700">{rec.name}</span> هو اختيار ممتاز لمولودكما، وذلك للأسباب التالية:
                                </p>
                                <ul className="text-left text-lg text-gray-700 list-disc list-inside space-y-2">
                                    <li>
                                        <span className="font-semibold text-indigo-600">المعنى والدلالة:</span> {nameDetails[rec.name].meaning}
                                    </li>
                                    <li>
                                        <span className="font-semibold text-indigo-600">القبول وسهولة الاستخدام:</span> {nameDetails[rec.name].practical}
                                    </li>
                                    <li>
                                        <span className="font-semibold text-indigo-600">التوافق مع اللقب:</span> {nameDetails[rec.name].compatibility}
                                    </li>
                                    <li>
                                        <span className="font-semibold text-indigo-600">التأثير على الشخصية:</span> {nameDetails[rec.name].personalStrength}
                                    </li>
                                </ul>
                                <div className="mt-8 pt-4 border-t border-indigo-300">
                                    <button
                                        onClick={() => handleGenerateBlessing(rec.name)}
                                        className="w-full bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 text-white font-bold py-3 px-6 rounded-full shadow-md transform transition-transform duration-300 hover:scale-105 focus:outline-none focus:ring-4 focus:ring-green-300 flex items-center justify-center space-x-2"
                                        disabled={loadingBlessing}
                                    >
                                        {loadingBlessing ? (
                                            <>
                                                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                <span>جاري توليد البركة...</span>
                                            </>
                                        ) : (
                                            <>
                                                <span>✨ احصل على بركة لاسم {rec.name}</span>
                                            </>
                                        )}
                                    </button>
                                    {generatedBlessing && (
                                        <div className="mt-4 bg-teal-50 p-4 rounded-lg text-lg text-gray-800 border border-teal-200 animate-fadeIn">
                                            <h4 className="font-semibold text-teal-700 mb-2 border-b border-teal-300 pb-1 font-cairo-display">بركة لمولودكما:</h4>
                                            <p className="whitespace-pre-wrap">{generatedBlessing}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                        <p className="text-md text-gray-600 mt-6 italic">
                            (الترشيحات مبنية على التحليل الشامل لأكثر من 15 محوراً، مع مراعاة كافة المتطلبات والمعطيات.)
                        </p>
                    </div>
                )}
            </div>
        </section>
    );
};

export default RecommendationTab;
