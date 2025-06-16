import React from 'react';

// هذا هو مكون AnalysisTab.js المحدث
// يرجى حفظ هذا الكود في ملف جديد باسم AnalysisTab.js في مجلد src/components

// المحتوى الثابت (للتذكير، يتم استيراد هذه البيانات الآن من staticData.js)
// ولكن تم الاحتفاظ بها هنا لضمان عدم وجود أخطاء في العرض إذا لم يتم ربط staticData بشكل صحيح
const staticImageMeaningData = {
    'يامن': {
        images: [
            "https://placehold.co/300x200/ADD8E6/FFFFFF?text=شروق+الشمس", // Light blue, sunrise
            "https://placehold.co/300x200/90EE90/FFFFFF?text=حقل+زهور",   // Light green, flowers
            "https://placehold.co/300x200/FFD700/FFFFFF?text=عملة+ذهبية"  // Gold, coin
        ],
        interpretation: "اسم 'يامن' يوحي بالخير والبركة. شروق الشمس يرمز لبداية جديدة وتفاؤل، حقل الزهور يمثل النماء والجمال، والعملة الذهبية ترمز للرخاء واليُمن. كل هذه الصور تعكس معاني البركة والازدهار المرتبطة بالاسم."
    },
    'غوث': {
        images: [
            "https://placehold.co/300x200/B22222/FFFFFF?text=قلعة+قوية",   // Firebrick, strong castle
            "https://placehold.co/300x200/4682B4/FFFFFF?text=يدان+متعاونتان", // Steel blue, helping hands
            "https://placehold.co/300x200/556B2F/FFFFFF?text=شجرة+عملاقة" // Dark olive green, giant tree
        ],
        interpretation: "اسم 'غوث' يرمز للقوة والنجدة والإغاثة. القلعة القوية تعكس الحماية والصلابة، الأيدي المتعاونة تدل على العون والمساعدة، والشجرة العملاقة توحي بالثبات والسند. هذه الصور تجسد معاني الغوث والمساندة."
    },
    'غياث': {
        images: [
            "https://placehold.co/300x200/008080/FFFFFF?text=مطر+غزير",  // Teal, heavy rain
            "https://placehold.co/300x200/8A2BE2/FFFFFF?text=نهر+جاري", // Blue-violet, flowing river
            "https://placehold.co/300x200/FF6347/FFFFFF?text=بذرة+تنمو" // Tomato, growing seed
        ],
        interpretation: "اسم 'غياث' يوحي بالعطاء الوفير والإنقاذ، مثل المطر الذي يحيي الأرض. المطر الغزير والنهر الجاري يرمزان للفيض والكرم، والبذرة التي تنمو تدل على الأثر الإيجابي والخير المستمر. تعكس هذه الصور معاني العطاء والإغاثة الكثيرة."
    }
};

const staticNumerology = {
    'يامن': { value: 7, trait: 'الاستقرار والحكمة، يميل إلى التفكير العميق والسعي نحو التوازن.' },
    'غوث': { value: 5, trait: 'المغامرة والحرية، يحب التغيير ويكتشف آفاقاً جديدة.' },
    'غياث': { value: 9, trait: 'العطاء والقيادة، يمتلك روحاً إنسانية ورغبة في إحداث فرق إيجابي.' },
};

const staticNameKeywords = {
    'يامن': ['البركة', 'اليمن', 'التفاؤل', 'الهدوء', 'النجاح'],
    'غوث': ['الشجاعة', 'النجدة', 'القوة', 'المبادرة', 'الإغاثة'],
    'غياث': ['العطاء', 'المساعدة', 'القيادة', 'الإيجابية', 'الكرم'],
};

const staticPhoneticAnalysis = {
    'يامن': {
        vibration: 'إيقاع هادئ ومريح، يوحي بالسكينة والتناغم. سلس على الأذن واللسان.',
        flow: 'تدفقه لغوي مريح، يجعله سهلاً في النطق والتذكر في مختلف السياقات.',
        impact: 'يترك انطباعاً بالبركة والإيجابية، ويعزز شعوراً بالراحة والطمأنينة.'
    },
    'غوث': {
        vibration: 'إيقاع قوي ومباشر، يوحي بالقوة والعزم. صوته جهوري ومميز.',
        flow: 'تدفقه اللغوي حاد ومحدد، وقد يكون ثقيلاً بعض الشيء على غير الناطقين بحرف الغين.',
        impact: 'يترك انطباعاً بالشجاعة والنجدة والمبادرة، ويُوحي بشخصية قادرة على العون.'
    },
    'غياث': {
        vibration: 'إيقاع قوي وممتع، يوحي بالنشاط والحيوية. رنينه جذاب وواضح.',
        flow: 'تدفقه اللغوي رشيق وسهل، مما يجعله مألوفاً ومحبباً للنطق.',
        impact: 'يترك انطباعاً بالعطاء السخي والقيادة، ويعزز صورة شخصية إيجابية وفعالة.'
    }
};

const staticAIVisualizations = { // Keep this local for now as it's not directly used from App.js in this tab
    'يامن': {
        image: "https://placehold.co/400x300/28A745/FFFFFF?text=نور+وتفاؤل",
        description: "تصور فني لاسم 'يامن' يجسد هالة من النور الدافئ المحاطة برموز التفاؤل والبركة، مع خطوط انسيابية تعكس الحياة المليئة باليُمن والرخاء. الألوان السائدة هي الذهبي والأخضر الفاتح والأزرق السماوي، مما يوحي بالصفاء والنمو."
    },
    'غوث': {
        image: "https://placehold.co/400x300/DC3545/FFFFFF?text=قوة+ونجدة",
        description: "لوحة تجريدية لاسم 'غوث' تصور تشابكاً قوياً للخطوط والكتل التي توحي بالدعم والنجدة، مع ألوان داكنة تعكس الشجاعة والصلابة. تظهر أشكالاً رمزية للأيدي الممتدة أو الدروع، تعبيراً عن الحماية والعون."
    },
    'غياث': {
        image: "https://placehold.co/400x300/007BFF/FFFFFF?text=عطاء+وفيض",
        description: "تصور بصري لاسم 'غياث' يمثل تدفقاً متجدداً من الألوان الزرقاء والخضراء، يشبه فيض الماء الذي يروي الأرض. تتخلله نقاط براقة ترمز للعطاء السخي والتأثير الإيجابي على المحيط، مع لمسة من الأشكال الهندسية التي توحي بالقيادة والتنظيم."
    }
};


const AnalysisCard = ({ name, details, isExpanded, onExpand, funFact, handleGenerateFunFact, suggestedNamesForCard, loadingSuggestions, handleGenerateSimilarNames, generatedPoem, loadingPoem, handleGeneratePoem, showTemporaryMessage, axes }) => {
    // Helper function to map axis names to their corresponding keys in nameDetails
    const getAxisKey = (axis) => {
        switch (axis) {
            case "المعنى اللغوي": return "linguistic";
            case "التأثير النفسي": return "psychological";
            case "الأهمية الثقافية": return "cultural";
            case "الدلالة الدينية": return "religious";
            case "الشهرة والاستخدام": return "popularity";
            case "العملية وسهولة النطق": return "practical";
            case "التوقعات المستقبلية": return "futuristic";
            case "القوة الشخصية المتوقعة": return "personalStrength";
            case "التوافق مع اللقب": return "compatibility";
            case "الإيقاع الصوتي": return "rhythm";
            case "معاني أخرى في لغات مختلفة": return "otherMeaning";
            case "التفرد مقابل الشيوع": return "uniqueness";
            case "القبول العام": return "acceptance";
            case "التحليل الصوتي (تقريبي)": return "linguistic";
            case "بدائل تفسيرية": return "alternativeInterpretation";
            default: return "";
        }
    };
    // Axes are now passed as a prop, no need to redefine them here
    // const axes = [
    //     "المعنى اللغوي", "التأثير النفسي", "الأهمية الثقافية", "الدلالة الدينية", "الشهرة والاستخدام",
    //     "العملية وسهولة النطق", "التوقعات المستقبلية", "القوة الشخصية المتوقعة", "التوافق مع اللقب",
    //     "الإيقاع الصوتي", "معاني أخرى في لغات مختلفة", "التفرد مقابل الشيوع", "القبول العام",
    //     "التحليل الصوتي (تقريبي)", "بدائل تفسيرية"
    // ];

    return (
        <div
            className={`bg-white rounded-xl shadow-xl p-6 transform transition-all duration-500 ease-in-out
            ${isExpanded ? 'col-span-full ring-4 ring-indigo-500 z-20 md:p-8 lg:p-10' : 'hover:scale-105 hover:shadow-2xl relative cursor-pointer flex flex-col justify-between items-center text-center p-4'}
            `}
            onClick={() => onExpand(isExpanded ? null : name)} // Toggle expansion on click
        >
            <h3 className={`font-extrabold text-indigo-800 mb-4 ${isExpanded ? 'text-4xl sm:text-5xl border-b-4 border-indigo-400 pb-3 font-cairo-display' : 'text-2xl sm:text-3xl font-cairo-display'}`}>
                {name}
            </h3>
            {!isExpanded ? ( // Collapsed view
                <>
                    <p className="text-gray-600 text-sm sm:text-base mb-4 flex-grow">{details.meaning}</p>
                    <button className="bg-blue-500 text-white px-4 py-2 rounded-full text-sm sm:text-base hover:bg-blue-600 transition-colors shadow-md">
                        اعرف المزيد
                    </button>
                </>
            ) : ( // Expanded view
                <>
                    <div className="space-y-4 mb-8">
                        {axes.map((axis, index) => (
                            <div key={index} className="flex flex-col sm:flex-row items-start sm:items-center bg-gray-50 rounded-lg p-3 shadow-sm">
                                <span className="text-indigo-600 font-semibold text-lg w-full sm:w-1/3 flex-shrink-0 mb-1 sm:mb-0">
                                    {axis}:
                                </span>
                                <div className="flex-grow text-gray-700 text-base sm:text-lg pr-4">
                                    {details[getAxisKey(axis)]}
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="mt-8 pt-6 border-t-2 border-indigo-200">
                        <h4 className="text-2xl font-bold text-purple-700 mb-4 font-cairo-display">نشاطات إضافية حول الاسم:</h4>
                        <button
                            onClick={(e) => { e.stopPropagation(); handleGenerateFunFact(name); }}
                            className="w-full bg-gradient-to-r from-teal-500 to-green-600 hover:from-teal-600 hover:to-green-700 text-white font-bold py-3 px-6 rounded-full shadow-md transform transition-transform duration-300 hover:scale-105 focus:outline-none focus:ring-4 focus:ring-teal-300 flex items-center justify-center space-x-2 mb-4"
                        >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5L6 11H5a1 1 0 000 2h1a1 1 0 00.867.5L10 9l3.133 4.5A1 1 0 0014 13h1a1 1 0 000-2h-1l-3.133-4.5A1 1 0 0010 7z" clipRule="evenodd"></path></svg>
                            <span>احصل على معلومة شيقة</span>
                        </button>
                        {funFact && (
                            <div className="mt-4 bg-teal-50 p-4 rounded-lg text-base text-gray-800 border border-teal-200 animate-fadeIn">
                                <p className="whitespace-pre-wrap">💡 {funFact}</p>
                            </div>
                        )}

                        <button
                            onClick={(e) => { e.stopPropagation(); handleGenerateSimilarNames(name); }}
                            className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-bold py-3 px-6 rounded-full shadow-md transform transition-transform duration-300 hover:scale-105 focus:outline-none focus:ring-4 focus:ring-pink-300 flex items-center justify-center space-x-2 mt-4"
                            disabled={loadingSuggestions} // Changed to single boolean
                        >
                            {loadingSuggestions ? ( // Changed to single boolean
                                <>
                                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    <span>جاري التوليد...</span>
                                </>
                            ) : (
                                <>
                                    <span>✨ اقتراح أسماء مشابهة</span>
                                </>
                            )}
                        </button>
                        {suggestedNamesForCard[name] && (
                            <div className="mt-4 bg-purple-50 p-4 rounded-lg text-base text-gray-800 border border-purple-200 animate-fadeIn">
                                <h4 className="font-semibold text-purple-700 mb-2 border-b border-purple-300 pb-1 font-cairo-display">أسماء مقترحة:</h4>
                                <p className="whitespace-pre-wrap">{suggestedNamesForCard[name]}</p>
                            </div>
                        )}
                        {/* New feature: Generate a short poem/rhyme for the name */}
                        <button
                            onClick={(e) => { e.stopPropagation(); handleGeneratePoem(name); }}
                            className="w-full bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700 text-white font-bold py-3 px-6 rounded-full shadow-md transform transition-transform duration-300 hover:scale-105 focus:outline-none focus:ring-4 focus:ring-yellow-300 flex items-center justify-center space-x-2 mt-4"
                            disabled={loadingPoem}
                        >
                            {loadingPoem ? (
                                <>
                                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    <span>جاري توليد القصيدة...</span>
                                </>
                            ) : (
                                <>
                                    <span>✍️ توليد قصيدة/قافية عن الاسم</span>
                                </>
                            )}
                        </button>
                        {generatedPoem && (
                            <div className="mt-4 bg-yellow-50 p-4 rounded-lg text-base text-gray-800 border border-yellow-200 animate-fadeIn">
                                <h4 className="font-semibold text-orange-700 mb-2 border-b border-orange-300 pb-1 font-cairo-display">قصيدة/قافية لاسم {name}:</h4>
                                <p className="whitespace-pre-wrap">{generatedPoem}</p>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};


const AnalysisTab = ({
    nameKeys,
    nameDetails,
    axes, // يجب أن يتم تمريرها الآن
    expandedName,
    setExpandedName,
    funFact,
    handleGenerateFunFact,
    suggestedNamesForCard,
    loadingSuggestions,
    handleGenerateSimilarNames,
    generatedPoem,
    loadingPoem,
    handleGeneratePoem,
    staticNumerology,
    staticNameKeywords,
    staticImageMeaningData,
    selectedImageMeaningName,
    handleShowImageMeaning,
    staticPhoneticAnalysis,
    selectedPhoneticAnalysisName,
    handleShowPhoneticAnalysis,
    showTemporaryMessage, // يجب أن يتم تمريرها الآن
}) => {
    // Helper function to map axis names to their corresponding keys in nameDetails
    // هذا موجود بالفعل في AnalysisCard
    // const getAxisKey = (axis) => {
    //     switch (axis) {
    //         case "المعنى اللغوي": return "linguistic";
    //         // ... rest of the cases
    //         default: return "";
    //     }
    // };
    return (
        <section className="animate-fadeIn">
            <h2 className="text-3xl font-bold text-center text-indigo-700 mb-8 border-b-2 border-indigo-400 pb-4 font-cairo-display">
                تحليل شامل لأسماء: <span className="text-purple-600">يامن، غوث، غياث</span>
            </h2>
            <p className="text-center text-gray-600 italic mb-6">
                (انقر على أي اسم أدناه لعرض تحليله المفصل.)
            </p>

            <div className={`grid ${expandedName ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'} gap-6`}>
                {nameKeys.map((nameKey) => (
                    <AnalysisCard
                        key={nameKey}
                        name={nameKey}
                        details={nameDetails[nameKey]}
                        isExpanded={expandedName === nameKey}
                        onExpand={setExpandedName}
                        funFact={funFact}
                        handleGenerateFunFact={handleGenerateFunFact}
                        suggestedNamesForCard={suggestedNamesForCard}
                        loadingSuggestions={loadingSuggestions}
                        handleGenerateSimilarNames={handleGenerateSimilarNames}
                        generatedPoem={generatedPoem}
                        loadingPoem={loadingPoem}
                        handleGeneratePoem={handleGeneratePoem}
                        showTemporaryMessage={showTemporaryMessage} // تمرير showTemporaryMessage
                        axes={axes} // تمرير axes
                    />
                ))}
            </div>

            {/* New activities in Analysis tab, outside the cards */}
            <div className="mt-12 space-y-8">
                {/* Activity 1: Name Numerology */}
                <div className="bg-white rounded-xl shadow-lg p-6 border border-blue-200 text-center">
                    <h3 className="text-2xl font-bold text-blue-700 mb-4 border-b pb-2 font-cairo-display">
                        ✨ اسمك وقيمته الرقمية ✨
                    </h3>
                    <p className="text-gray-700 mb-6">
                        اكتشفوا القيمة الرقمية لاسم مولودكما والصفة المرتبطة بها (للترفيه فقط!):
                    </p>
                    <div className="flex flex-wrap justify-center gap-4">
                        {nameKeys.map(name => (
                            <button
                                key={`num-${name}`}
                                onClick={() => {
                                    const data = staticNumerology[name];
                                    if (data) {
                                        showTemporaryMessage(`اسم ${name} قيمته الرقمية ${data.value} ويرتبط بصفة: ${data.trait}`, 'info', 5000);
                                    } else {
                                        showTemporaryMessage("لا توجد بيانات رقمية لهذا الاسم.", 'info', 3000);
                                    }
                                }}
                                className="bg-indigo-100 text-indigo-800 font-bold py-3 px-6 rounded-full shadow-md hover:bg-indigo-200 transition-colors transform hover:scale-105"
                            >
                                {name}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Activity 2: Keywords for Your Name */}
                <div className="bg-white rounded-xl shadow-lg p-6 border border-green-200 text-center">
                    <h3 className="text-2xl font-bold text-green-700 mb-4 border-b pb-2 font-cairo-display">
                        🔑 الكلمات المفتاحية لاسمك 🔑
                    </h3>
                    <p className="text-gray-700 mb-6">
                        اختارا اسماً وشاهدا الكلمات المفتاحية التي تصف جوهره:
                    </p>
                    <div className="flex flex-wrap justify-center gap-4">
                        {nameKeys.map(name => (
                            <button
                                key={`keywords-${name}`}
                                onClick={() => {
                                    const keywords = staticNameKeywords[name];
                                    if (keywords) {
                                        showTemporaryMessage(`الكلمات المفتاحية لاسم ${name}: ${keywords.join(', ')}`, 'info', 5000);
                                    } else {
                                        showTemporaryMessage("لا توجد كلمات مفتاحية لهذا الاسم.", 'info', 3000);
                                    }
                                }}
                                className="bg-teal-100 text-teal-800 font-bold py-3 px-6 rounded-full shadow-md hover:bg-teal-200 transition-colors transform hover:scale-105"
                            >
                                {name}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Activity 3: Name Meaning Through Images */}
                <div className="bg-white rounded-xl shadow-lg p-6 border border-purple-200 text-center">
                    <h3 className="text-2xl font-bold text-purple-700 mb-4 border-b pb-2 font-cairo-display">
                        🖼️ اكتشف معنى اسمك بالصور 🖼️
                    </h3>
                    <p className="text-gray-700 mb-6">
                        اختاروا اسماً وشاهدوا الصور التي تجسد معانيه بشكل فني:
                    </p>
                    <div className="flex flex-wrap justify-center gap-4 mb-6">
                        {nameKeys.map(name => (
                            <button
                                key={`img-meaning-${name}`}
                                onClick={() => handleShowImageMeaning(name)}
                                className="bg-pink-100 text-pink-800 font-bold py-3 px-6 rounded-full shadow-md hover:bg-pink-200 transition-colors transform hover:scale-105"
                            >
                                {name}
                            </button>
                        ))}
                    </div>
                    {selectedImageMeaningName && staticImageMeaningData[selectedImageMeaningName] && (
                        <div className="mt-4 bg-purple-50 p-4 rounded-lg text-base text-gray-800 border border-purple-200 animate-fadeIn">
                            <h4 className="font-semibold text-purple-700 mb-2 border-b border-purple-300 pb-1 font-cairo-display">
                                صور لاسم {selectedImageMeaningName}:
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                                {staticImageMeaningData[selectedImageMeaningName].images.map((imgSrc, index) => (
                                    <img key={index} src={imgSrc} alt={`Visual for ${selectedImageMeaningName}`} className="w-full h-auto rounded-lg shadow-md" />
                                ))}
                            </div>
                            <p className="whitespace-pre-wrap">{staticImageMeaningData[selectedImageMeaningName].interpretation}</p>
                        </div>
                    )}
                </div>

                {/* Activity 4: Phonetic Analysis of Name */}
                <div className="bg-white rounded-xl shadow-lg p-6 border border-orange-200 text-center">
                    <h3 className="text-2xl font-bold text-orange-700 mb-4 border-b pb-2 font-cairo-display">
                        🎵 التحليل الصوتي للاسم 🎵
                    </h3>
                    <p className="text-gray-700 mb-6">
                        اختاروا اسماً واكتشفوا إيقاعه وتدفقه وتأثيره الصوتي:
                    </p>
                    <div className="flex flex-wrap justify-center gap-4 mb-6">
                        {nameKeys.map(name => (
                            <button
                                key={`phonetic-${name}`}
                                onClick={() => handleShowPhoneticAnalysis(name)}
                                className="bg-yellow-100 text-yellow-800 font-bold py-3 px-6 rounded-full shadow-md hover:bg-yellow-200 transition-colors transform hover:scale-105"
                            >
                                {name}
                            </button>
                        ))}
                    </div>
                    {selectedPhoneticAnalysisName && staticPhoneticAnalysis[selectedPhoneticAnalysisName] && (
                        <div className="mt-4 bg-orange-50 p-4 rounded-lg text-base text-gray-800 border border-orange-200 animate-fadeIn text-right">
                            <h4 className="font-semibold text-orange-700 mb-2 border-b border-orange-300 pb-1 font-cairo-display">
                                تحليل صوتي لاسم {selectedPhoneticAnalysisName}:
                            </h4>
                            <p><span className="font-semibold">الإيقاع:</span> {staticPhoneticAnalysis[selectedPhoneticAnalysisName].vibration}</p>
                            <p><span className="font-semibold">التدفق:</span> {staticPhoneticAnalysis[selectedPhoneticAnalysisName].flow}</p>
                            <p><span className="font-semibold">التأثير:</span> {staticPhoneticAnalysis[selectedPhoneticAnalysisName].impact}</p>
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
};

export default AnalysisTab;
