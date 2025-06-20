import React from 'react';

// هذا هو مكون FutureVisionTab.js المحدث
// يرجى حفظ هذا الكود في ملف جديد باسم FutureVisionTab.js في مجلد src/components

const FutureVisionTab = ({
    futureVisionNameInput,
    setFutureVisionNameInput,
    futureVisionTraits,
    setFutureVisionTraits,
    futureVisionMotto,
    setFutureVisionMotto,
    generatedFutureVision,
    handleGenerateFutureVision,
    selectedAIVisualizationName,
    handleAIVisualization,
    staticAIVisualizations,
    showTemporaryMessage, // يجب أن يتم تمريرها الآن
}) => {
    const nameKeys = ['يامن', 'غوث', 'غياث']; // قائمة بالأسماء للعرض في قسم التصور

    return (
        <section className="animate-fadeIn">
            <h2 className="text-3xl font-bold text-center text-indigo-700 mb-8 border-b-2 border-indigo-400 pb-4 font-cairo-display">
                رؤيتنا لمستقبل مولودنا
            </h2>

            {/* Activity 1: Design Your Baby's Future Vision */}
            <div className="bg-white rounded-xl shadow-lg p-6 border border-indigo-200 mt-8 text-center">
                <h3 className="text-2xl font-bold text-indigo-700 mb-4 border-b pb-2 font-cairo-display">
                    🌟 صمم رؤية لمستقبل مولودك 🌟
                </h3>
                <p className="text-gray-700 mb-6">
                    صمموا رؤية شخصية لمستقبل طفلكما بناءً على الاسم المختار والصفات التي تحلمان بها!
                </p>
                <div className="space-y-4 text-right">
                    <div>
                        <label htmlFor="futureVisionNameInput" className="block text-gray-700 font-semibold mb-1">الاسم المقترح:</label>
                        <input
                            type="text"
                            id="futureVisionNameInput"
                            className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 text-right"
                            value={futureVisionNameInput}
                            onChange={(e) => setFutureVisionNameInput(e.target.value)}
                            placeholder="اكتبي اسم المولود..."
                        />
                    </div>
                    <div>
                        <label className="block text-gray-700 font-semibold mb-2">أهم 3 صفات نتمنى وجودها:</label>
                        <div className="flex flex-wrap justify-end gap-2">
                            {['شجاع', 'حنون', 'ذكي', 'مبتكر', 'متفائل', 'عطاء', 'قيادي', 'صبور'].map(trait => (
                                <button
                                    key={trait}
                                    onClick={() => {
                                        setFutureVisionTraits(prev =>
                                            prev.includes(trait)
                                                ? prev.filter(t => t !== trait)
                                                : (prev.length < 3 ? [...prev, trait] : prev) // Limit to 3 traits
                                        );
                                    }}
                                    className={`px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${futureVisionTraits.includes(trait) ? 'bg-indigo-600 text-white shadow-lg' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                                >
                                    {trait}
                                </button>
                            ))}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">اختر 3 صفات كحد أقصى.</p>
                    </div>
                    <div>
                        <label htmlFor="futureVisionMotto" className="block text-gray-700 font-semibold mb-1">شعار حياة له (اختياري):</label>
                        <input
                            type="text"
                            id="futureVisionMotto"
                            className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 text-right"
                            value={futureVisionMotto}
                            onChange={(e) => setFutureVisionMotto(e.target.value)}
                            placeholder="مثال: 'بالعطاء نحيا، وبالفرح ننمو'"
                        />
                    </div>
                    <button
                        onClick={handleGenerateFutureVision}
                        className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-bold py-3 px-6 rounded-full shadow-md transform transition-transform duration-300 hover:scale-105 focus:outline-none focus:ring-4 focus:ring-blue-300 mt-4"
                    >
                        توليد وثيقة الرؤية
                    </button>
                </div>

                {generatedFutureVision && (
                    <div className="mt-8 bg-blue-50 p-6 rounded-lg text-gray-800 border border-blue-200 text-right animate-fadeIn">
                        <h4 className="font-semibold text-blue-700 mb-4 border-b border-blue-300 pb-2 font-cairo-display">وثيقة رؤية مستقبلية لطفلكما:</h4>
                        <p className="whitespace-pre-wrap leading-loose">{generatedFutureVision}</p>
                        <button
                            onClick={() => {
                                const el = document.createElement('textarea');
                                el.value = generatedFutureVision;
                                document.body.appendChild(el);
                                el.select();
                                document.execCommand('copy');
                                document.body.removeChild(el);
                                showTemporaryMessage("تم نسخ الرؤية بنجاح!", 'success', 3000);
                            }}
                            className="bg-green-500 text-white py-2 px-4 rounded-full text-sm font-semibold hover:bg-green-600 transition-colors shadow-md mt-4"
                        >
                            نسخ الرؤية
                        </button>
                    </div>
                )}
            </div>

            {/* Activity 2: AI Baby Visualization */}
            <div className="bg-white rounded-xl shadow-lg p-6 border border-teal-200 mt-8 text-center">
                <h3 className="text-2xl font-bold text-teal-700 mb-4 border-b pb-2 font-cairo-display">
                    👶 تصور مولودكما بذكاء اصطناعي (تصورات ثابتة) 👶
                </h3>
                <p className="text-gray-700 mb-6">
                    اختاروا اسماً وشاهدوا "تصوراً فنياً" لجوهر طفل يحمل هذا الاسم، مستوحى من الذكاء الاصطناعي! (لا يتطلب توليد صور حية، يعتمد على صور ثابتة لوصف الفكرة).
                </p>
                <div className="flex flex-wrap justify-center gap-4 mb-6">
                    {nameKeys.map(name => (
                        <button
                            key={`ai-viz-${name}`}
                            onClick={() => handleAIVisualization(name)}
                            className="bg-teal-100 text-teal-800 font-bold py-3 px-6 rounded-full shadow-md hover:bg-teal-200 transition-colors transform hover:scale-105"
                        >
                            {name}
                        </button>
                    ))}
                </div>
                {selectedAIVisualizationName && staticAIVisualizations[selectedAIVisualizationName] && (
                    <div className="mt-4 bg-teal-50 p-4 rounded-lg text-base text-gray-800 border border-teal-200 animate-fadeIn">
                        <h4 className="font-semibold text-teal-700 mb-2 border-b border-teal-300 pb-1 font-cairo-display">
                            تصور لاسم {selectedAIVisualizationName}:
                        </h4>
                        <img
                            src={staticAIVisualizations[selectedAIVisualizationName].image}
                            alt={`AI visualization for ${selectedAIVisualizationName}`}
                            className="w-full h-auto rounded-lg shadow-md mb-4"
                        />
                        <p className="whitespace-pre-wrap">{staticAIVisualizations[selectedAIVisualizationName].description}</p>
                    </div>
                )}
            </div>
        </section>
    );
};

export default FutureVisionTab;
