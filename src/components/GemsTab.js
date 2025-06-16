import React from 'react'; // إزالة useState إذا لم يكن مستخدماً داخلياً

// هذا هو مكون GemsTab.js المحدث
// يرجى حفظ هذا الكود في ملف جديد باسم GemsTab.js في مجلد src/components

const GemsTab = ({
    historicalNamesData,
    selectedHistoricalName,
    setSelectedHistoricalName,
    historicalNameInput,
    setHistoricalNameInput,
    historicalNameFact,
    setHistoricalNameFact,
    personalityImpactTestStarted,
    currentImpactQuestionIndex,
    personalityImpactQuestions,
    impactScores,
    impactTestResult,
    setPersonalityImpactTestStarted,
    setCurrentImpactQuestionIndex,
    setImpactScores,
    setImpactTestResult,
    showTemporaryMessage,
    handleImpactAnswer,
    resetImpactTest,
    getImpactResult
}) => {
    // دالة مساعدة لجلب معلومات الاسم التاريخية
    const getHistoricalNameFact = (name) => {
        const data = historicalNamesData[name];
        if (data) {
            return `
            **العصر:** ${data.era}
            **الدلالة:** ${data.significance}
            **القصة:** ${data.story}
            `;
        }
        return "لا توجد معلومات تاريخية مفصلة لهذا الاسم في قاعدتنا الحالية.";
    };

    return (
        <section className="animate-fadeIn">
            <h2 className="text-3xl font-bold text-center text-indigo-700 mb-8 border-b-2 border-indigo-400 pb-4 font-cairo-display">
                💎 دررٌ من الأسماء: رحلة في عالم الأسماء ومعانيها 💎
            </h2>
            <p className="text-center text-gray-700 leading-relaxed mb-6">
                الأسماء ليست مجرد كلمات نُطلقها على أبنائنا، بل هي جزء من هويتهم، تحمل قصصاً، وتخفي دلالات عميقة، وتؤثر في مسار حياتهم. في هذا القسم، سنستكشف درراً من المعلومات الشيقة حول الأسماء.
            </p>

            {/* قسم معلومات نصية وفيرة */}
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200 mb-8">
                <h3 className="text-2xl font-bold text-blue-700 mb-4 border-b pb-2 font-cairo-display">
                    أ. الأسماء عبر العصور: مرآة الثقافات والحضارات
                </h3>
                <p className="text-gray-700 leading-relaxed mb-4">
                    منذ فجر التاريخ، ارتبطت الأسماء بالمعتقدات، العادات، والأحداث الكبرى في حياة البشر. كانت الأسماء تُعطى لتعكس آمال الوالدين لمولودهم، أو لتكريم الأجداد، أو لتمثل حدثاً مهماً وقت الولادة. في الحضارات القديمة، مثل المصرية والرافدينية، كانت الأسماء تُعتبر ذات قوة سحرية أو دينية، وكانت تحمل في طياتها أدواراً محددة للمولود في المجتمع.
                </p>
                <p className="text-gray-700 leading-relaxed mb-4">
                    في الثقافة العربية والإسلامية، للأسماء أهمية خاصة جداً. فالاختيار الحسن للاسم يعتبر جزءاً من بر الوالدين، وقد حث النبي صلى الله عليه وسلم على تسمية الأبناء بأسماء حسنة ذات معنى طيب. الأسماء مثل "عبد الله" و"عبد الرحمن" تعكس التوحيد والعبودية لله، بينما أسماء الأنبياء والصحابة تذكرنا بالقيم النبيلة والقدوة الحسنة. الأسماء ليست ثابتة بل تتطور، فبعضها يبقى خالداً عبر الأجيال وبعضها يندثر مع تغير العصور، لكنها تظل دوماً نافذة على تاريخ الإنسانية وتطلعاتها.
                </p>

                <h3 className="text-2xl font-bold text-blue-700 mb-4 mt-8 border-b pb-2 font-cairo-display">
                    ب. الأسماء والعلوم: علم الأونسوماتيك وتأثير الاسم
                </h3>
                <p className="text-gray-700 leading-relaxed mb-4">
                    "الأونسوماتيك" (Onomastics) هو علم دراسة الأسماء، بما في ذلك أصولها، معانيها، وتاريخها، وتوزيعها الجغرافي والثقافي. يرى هذا العلم أن الاسم ليس مجرد تسمية عشوائية، بل يمكن أن يحمل تأثيرات نفسية واجتماعية على حامله.
                </p>
                <ul className="list-disc list-inside text-gray-700 leading-relaxed space-y-2 mb-4">
                    <li><span className="font-semibold text-indigo-600">التأثير النفسي:</span> يمكن أن يؤثر الاسم على مفهوم الذات والثقة بالنفس. الأسماء ذات المعاني الإيجابية قد تزرع شعوراً بالفخر، بينما الأسماء التي تثير السخرية أو اللبس قد تؤثر سلباً.</li>
                    <li><span className="font-semibold text-indigo-600">التأثير الاجتماعي:</span> قد تؤثر الأسماء على الانطباعات الأولية للآخرين. في بعض الثقافات، ترتبط أسماء معينة بخصائص اجتماعية أو مهنية معينة.</li>
                    <li><span className="font-semibold text-indigo-600">علم الأرقام (Numerology):</span> على الرغم من كونه علماً زائفاً (Pseudo-science)، إلا أن البعض يعتقد أن لكل حرف قيمة رقمية، وأن مجموع قيم أحرف الاسم يمكن أن يكشف عن سمات شخصية أو مصير معين. نذكره هنا من باب الفضول والترفيه، وليس كحقيقة علمية.</li>
                </ul>

                <h3 className="text-2xl font-bold text-blue-700 mb-4 mt-8 border-b pb-2 font-cairo-display">
                    ج. قصص ملهمة وراء الأسماء: عظماء صنعوا تاريخاً
                </h3>
                <p className="text-gray-700 leading-relaxed mb-4">
                    وراء كل اسم عظيم قصة. تعرفوا على بعض الشخصيات التي حملت أسماء ذات دلالة عميقة وتركت بصمة في التاريخ:
                </p>
                <ul className="list-disc list-inside text-gray-700 leading-relaxed space-y-2">
                    <li><span className="font-semibold text-indigo-600">يوسف:</span> نبي كريم، قصته في القرآن الكريم تُعلمنا الصبر، الحكمة، والإيمان بالفرج بعد الشدة. اسم يرتبط بالجمال الداخلي وقوة الشخصية.</li>
                    <li><span className="font-semibold text-indigo-600">مريم:</span> السيدة العذراء، رمز للطهر والعفة والإيمان المطلق. اسمها يُلهم الملايين حول العالم بقوة الروح والتقوى.</li>
                    <li><span className="font-semibold text-indigo-600">خالد:</span> مثل خالد بن الوليد، القائد العسكري العبقري الذي لقب بـ"سيف الله المسلول". اسم يرتبط بالشجاعة، القيادة، والنصر الذي لا يتزعزع.</li>
                    <li><span className="font-semibold text-indigo-600">فاطمة:</span> ابنة النبي محمد صلى الله عليه وسلم، نموذج للمرأة الصالحة، البارة، والمعطاءة. اسمها يرمز إلى النقاء والزهد والعطاء.</li>
                </ul>
            </div>

            {/* نشاطات تفاعلية ضمن "دررٌ من الأسماء" */}
            <div className="mt-12 space-y-8">
                {/* Activity 1: Discover Your Name's History */}
                <div className="bg-white rounded-xl shadow-lg p-6 border border-pink-200 text-center">
                    <h3 className="text-2xl font-bold text-pink-700 mb-4 border-b pb-2 font-cairo-display">
                        📜 اكتشف تاريخ اسمك 📜
                    </h3>
                    <p className="text-gray-700 mb-6">
                        ادخلوا اسماً (من أسمائنا أو غيرها) لتروا نبذة تاريخية ومعلومات شيقة عنه!
                    </p>
                    <input
                        type="text"
                        className="w-full p-3 border border-gray-300 rounded-lg mb-3 text-center focus:ring-2 focus:ring-pink-400 outline-none"
                        placeholder="اكتبي اسماً هنا (مثال: محمد، يوسف، فاطمة)..."
                        value={historicalNameInput}
                        onChange={(e) => setHistoricalNameInput(e.target.value)}
                    />
                    <button
                        onClick={() => {
                            const fact = getHistoricalNameFact(historicalNameInput.trim());
                            setHistoricalNameFact(fact);
                            showTemporaryMessage(`تم جلب معلومات تاريخية لاسم "${historicalNameInput}".`, 'info', 3000);
                        }}
                        className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-bold py-3 px-6 rounded-full shadow-md transform transition-transform duration-300 hover:scale-105 focus:outline-none focus:ring-4 focus:ring-pink-300"
                    >
                        ابحث عن التاريخ
                    </button>
                    {historicalNameFact && (
                        <div className="mt-4 bg-pink-50 p-4 rounded-lg text-base text-gray-800 border border-pink-200 animate-fadeIn text-right">
                            <h4 className="font-semibold text-purple-700 mb-2 border-b border-purple-300 pb-1 font-cairo-display">معلومات عن اسم {historicalNameInput}:</h4>
                            <p className="whitespace-pre-wrap leading-relaxed">{historicalNameFact}</p>
                        </div>
                    )}
                </div>

                {/* Activity 2: Does Your Name Affect You? (Personality Impact Test) */}
                <div className="bg-white rounded-xl shadow-lg p-6 border border-blue-200 text-center">
                    <h3 className="text-2xl font-bold text-blue-700 mb-4 border-b pb-2 font-cairo-display">
                        ✨ هل اسمك يؤثر عليك؟ (اختبار تأثير الاسم) ✨
                    </h3>
                    <p className="text-gray-700 mb-6">
                        اختبروا كيف يمكن لاسمكم أن يرتبط ببعض سمات شخصيتكم!
                    </p>
                    {!personalityImpactTestStarted ? (
                        <button
                            onClick={() => {
                                setPersonalityImpactTestStarted(true);
                                setCurrentImpactQuestionIndex(0);
                                setImpactScores({});
                                setImpactTestResult(null);
                            }}
                            className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-bold py-3 px-6 rounded-full shadow-md transform transition-transform duration-300 hover:scale-105 focus:outline-none focus:ring-4 focus:ring-blue-300"
                        >
                            ابدأ الاختبار
                        </button>
                    ) : (
                        <div className="w-full mt-4 animate-fadeInUp">
                            {impactTestResult ? (
                                <div className="mt-6 bg-green-50 p-4 rounded-lg border border-green-300">
                                    <h5 className="text-xl font-bold text-green-700 mb-2 font-cairo-display">
                                        نتيجة اختبار تأثير اسمك:
                                    </h5>
                                    <p className="text-lg text-gray-800 leading-relaxed">
                                        {impactTestResult}
                                    </p>
                                    <button
                                        onClick={resetImpactTest}
                                        className="mt-4 bg-purple-500 text-white py-2 px-4 rounded-full hover:bg-purple-600 transition-colors"
                                    >
                                        أعد الاختبار
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <h4 className="text-xl font-bold text-gray-800 mb-4">
                                        السؤال {currentImpactQuestionIndex + 1} من {personalityImpactQuestions.length}:
                                    </h4>
                                    <p className="text-lg font-medium text-gray-700 mb-6">{personalityImpactQuestions[currentImpactQuestionIndex]?.question}</p>
                                    <div className="flex flex-col space-y-3">
                                        {personalityImpactQuestions[currentImpactQuestionIndex]?.options.map((option, idx) => (
                                            <button
                                                key={idx}
                                                onClick={() => handleImpactAnswer(option.scores)}
                                                className="bg-blue-100 text-blue-800 py-3 px-4 rounded-full text-lg font-semibold hover:bg-blue-200 transition-colors shadow-sm"
                                            >
                                                {option.text}
                                            </button>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
};

export default GemsTab;
