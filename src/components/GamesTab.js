import React from 'react';

// هذا هو مكون GamesTab.js المحدث
// يرجى حفظ هذا الكود في ملف جديد باسم GamesTab.js في مجلد src/components

const GamesTab = ({
    nameKeys,
    // Ideal Name Quiz
    quizStarted,
    currentQuizQuestionIndex,
    quizQuestions,
    handleQuizAnswer,
    quizResult,
    startQuiz,
    resetQuiz,
    // Name-Trait Matching Game
    traitGameStarted,
    currentTraitIndex,
    traitGameScore,
    traitGameFeedback,
    traitQuestions,
    startTraitGame,
    handleTraitAnswer,
    resetTraitGame,
    // Name Story Completion Game
    storyGameStarted,
    currentStoryIndex,
    storyGameScore,
    storyGameFeedback,
    storyQuestions,
    startStoryGame,
    handleStoryAnswer,
    resetStoryGame,
    // Name Memory Challenge
    memoryGameStarted,
    memoryCards,
    flippedCards,
    matchedCards,
    moves,
    memoryGameMessage,
    handleCardClick,
    startMemoryGame,
    resetMemoryGame,
    // Dice Roll
    handleDiceRoll, // <--- تأكدنا من وجودها هنا واستقبالها كـ prop
    // Personality Quiz by Names
    personalityQuizStarted,
    currentPersonalityQuestionIndex,
    personalityQuestions,
    personalityQuizScores,
    personalityQuizResult,
    setPersonalityQuizScores,
    setPersonalityQuizResult,
    setPersonalityQuizStarted,
    setCurrentPersonalityQuestionIndex,
    getPersonalityType,
    handlePersonalityAnswer,
    resetPersonalityQuiz,
    // Who Is It? Game
    whoIsItGameStarted,
    currentWhoIsItQuestionIndex,
    whoIsItGameScore,
    whoIsItGameFeedback,
    whoIsItQuestions,
    setWhoIsItGameStarted,
    setCurrentWhoIsItQuestionIndex,
    setWhoIsItGameScore,
    setWhoIsItGameFeedback,
    startWhoIsItGame,
    handleWhoIsItAnswer,
    resetWhoIsItGame,
    // Sentence Builder Game
    sentenceBuilderGameStarted,
    currentSentenceName,
    userSentence,
    sentenceGameFeedback,
    scoreSentenceGame,
    namesForSentenceGame,
    setSentenceBuilderGameStarted,
    setCurrentSentenceName,
    setUserSentence,
    setSentenceGameFeedback,
    setScoreSentenceGame,
    startSentenceBuilderGame,
    handleSubmitSentence,
    resetSentenceBuilderGame,
    // Missing Name Game
    missingNameGameStarted,
    currentMissingNamePuzzle,
    userMissingNameGuess,
    missingNameFeedback,
    scoreMissingNameGame,
    missingNamePuzzles,
    setMissingNameGameStarted,
    setCurrentMissingNamePuzzle,
    setUserMissingNameGuess,
    setMissingNameFeedback,
    setScoreMissingNameGame,
    startMissingNameGame,
    handleSubmitMissingName,
    resetMissingNameGame,
    // Categorization Game
    categorizationGameStarted,
    currentCategorizationQuestionIndex,
    categorizationGameScore,
    categorizationGameFeedback,
    nameCategorizationQuestions,
    setCategorizationGameStarted,
    setCurrentCategorizationQuestionIndex,
    setCategorizationGameScore,
    setCategorizationGameFeedback,
    startCategorizationGame,
    handleCategorizationAnswer,
    resetCategorizationGame,
    showTemporaryMessage,
}) => {
    return (
        <section className="animate-fadeIn">
            <h2 className="text-3xl font-bold text-center text-indigo-700 mb-8 border-b-2 border-indigo-400 pb-4 font-cairo-display">
                ألعاب مسلية حول الأسماء
            </h2>
            <p className="text-center text-gray-600 italic mb-6">
                (اختبرا معلوماتكما وحدسكما بطريقة ممتعة!)
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {/* Game 1: Ideal Name Quiz */}
                <div className="bg-white rounded-xl shadow-lg p-6 border border-purple-200 text-center flex flex-col justify-between items-center">
                    <h3 className="text-2xl font-bold text-purple-700 mb-4 font-cairo-display">
                        اختبار الاسم المثالي 💡
                    </h3>
                    <p className="text-gray-700 mb-4">
                        أجيبا عن الأسئلة واكتشفا الاسم الذي يناسب مولودكما بشكل مثالي!
                    </p>
                    {!quizStarted ? (
                        <button
                            onClick={startQuiz}
                            className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-bold py-3 px-6 rounded-full shadow-md transform transition-transform duration-300 hover:scale-105 focus:outline-none focus:ring-4 focus:ring-blue-300"
                        >
                            ابدأ الاختبار
                        </button>
                    ) : (
                        <div className="w-full mt-4 animate-fadeInUp">
                            {quizResult ? (
                                <div className="mt-6 bg-green-50 p-4 rounded-lg border border-green-300">
                                    <h5 className="text-xl font-bold text-green-700 mb-2 font-cairo-display">
                                        الاسم المثالي المقترح لكما هو:
                                    </h5>
                                    <p className="text-2xl font-bold text-indigo-700">
                                        {quizResult.join(' أو ')}
                                    </p>
                                    <button
                                        onClick={resetQuiz}
                                        className="mt-4 bg-purple-500 text-white py-2 px-4 rounded-full hover:bg-purple-600 transition-colors"
                                    >
                                        أعد الاختبار
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <h4 className="text-xl font-bold text-gray-800 mb-4">
                                        السؤال {currentQuizQuestionIndex + 1} من {quizQuestions.length}:
                                    </h4>
                                    <p className="text-lg font-medium text-gray-700 mb-6">{quizQuestions[currentQuizQuestionIndex]?.question}</p>
                                    <div className="flex flex-col space-y-3">
                                        {quizQuestions[currentQuizQuestionIndex]?.options.map((option, idx) => (
                                            <button
                                                key={idx}
                                                onClick={() => handleQuizAnswer(option.scores)}
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

                {/* Game 2: Name-Trait Matching Game */}
                <div className="bg-white rounded-xl shadow-lg p-6 border border-teal-200 text-center flex flex-col justify-between items-center">
                    <h3 className="text-2xl font-bold text-teal-700 mb-4 font-cairo-display">
                        لعبة: أي اسم يناسب الصفة؟ 🤔
                    </h3>
                    <p className="text-gray-700 mb-4">
                        هل يمكنكما مطابقة الصفة الصحيحة لكل اسم من أسمائنا المقترحة؟
                    </p>
                    {!traitGameStarted ? (
                        <button
                            onClick={startTraitGame}
                            className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white font-bold py-3 px-6 rounded-full shadow-md transform transition-transform duration-300 hover:scale-105 focus:outline-none focus:ring-4 focus:ring-purple-300"
                        >
                            ابدأ اللعبة!
                        </button>
                    ) : (
                        <div className="w-full mt-4 animate-fadeInUp">
                            <p className="text-lg font-semibold text-gray-800 mb-2">
                                النتيجة: {traitGameScore} / {currentTraitIndex}
                            </p>
                            <h4 className="text-2xl font-bold text-indigo-700 mb-6 font-cairo-display">
                                الصفة: "{traitQuestions[currentTraitIndex]?.trait}"
                            </h4>
                            <div className="flex flex-wrap justify-center gap-3">
                                {nameKeys.map((name, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => handleTraitAnswer(name)}
                                        className="bg-blue-100 text-blue-800 py-2 px-4 rounded-full text-lg font-semibold hover:bg-blue-200 transition-colors shadow-sm"
                                        disabled={traitGameFeedback !== ''} // Disable buttons while feedback is showing
                                    >
                                        {name}
                                    </button>
                                ))}
                            </div>
                            {traitGameFeedback && (
                                <p className={`mt-4 text-lg font-semibold ${traitGameFeedback.includes('صحيحة') ? 'text-green-600' : 'text-red-600'} animate-pulse`}>
                                    {traitGameFeedback}
                                </p>
                            )}
                            {currentTraitIndex === traitQuestions.length && (
                                <div className="mt-6 bg-green-50 p-4 rounded-lg border border-green-300">
                                    <h5 className="text-xl font-bold text-green-700 mb-2">انتهت اللعبة!</h5>
                                    <p className="text-lg text-gray-800">أحرزتما: <span className="font-bold text-2xl">{traitGameScore}</span> من {traitQuestions.length}</p>
                                    <button
                                        onClick={resetTraitGame}
                                        className="mt-4 bg-purple-500 text-white py-2 px-4 rounded-full hover:bg-purple-600 transition-colors"
                                    >
                                        العب مرة أخرى
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Game 3: Name Story Completion Game */}
                <div className="bg-white rounded-xl shadow-lg p-6 border border-orange-200 text-center flex flex-col justify-between items-center">
                    <h3 className="text-2xl font-bold text-orange-700 mb-4 font-cairo-display">
                        لعبة: أكمل القصة بالاسم الصحيح 📚
                    </h3>
                    <p className="text-gray-700 mb-4">
                        اقرأا جزءاً من القصة، وخمّنا الاسم الذي يكملها بشكل أفضل!
                    </p>
                    {!storyGameStarted ? (
                        <button
                            onClick={startStoryGame}
                            className="bg-gradient-to-r from-teal-500 to-blue-600 hover:from-teal-600 hover:to-blue-700 text-white font-bold py-3 px-6 rounded-full shadow-md transform transition-transform duration-300 hover:scale-105 focus:outline-none focus:ring-4 focus:ring-teal-300"
                        >
                            ابدأ اللعبة!
                        </button>
                    ) : (
                        <div className="w-full mt-4 animate-fadeInUp">
                            <p className="text-lg font-semibold text-gray-800 mb-2">
                                النتيجة: {storyGameScore} / {currentStoryIndex}
                            </p>
                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-6 text-right">
                                <p className="text-xl font-medium text-gray-800">
                                    "{storyQuestions[currentStoryIndex]?.storyPart}"
                                </p>
                                <p className="text-lg text-gray-600 mt-2">
                                    ...فمن هو يا ترى؟
                                </p>
                            </div>
                            <div className="flex flex-wrap justify-center gap-3">
                                {nameKeys.map((name, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => handleStoryAnswer(name)}
                                        className="bg-purple-100 text-purple-800 py-2 px-4 rounded-full text-lg font-semibold hover:bg-purple-200 transition-colors shadow-sm"
                                        disabled={storyGameFeedback !== ''} // Disable buttons while feedback is showing
                                    >
                                        {name}
                                    </button>
                                ))}
                            </div>
                            {storyGameFeedback && (
                                <p className={`mt-4 text-lg font-semibold ${storyGameFeedback.includes('صحيحة') ? 'text-green-600' : 'text-red-600'} animate-pulse`}>
                                    {storyGameFeedback}
                                </p>
                            )}
                            {currentStoryIndex === storyQuestions.length && (
                                <div className="mt-6 bg-green-50 p-4 rounded-lg border border-green-300">
                                    <h5 className="text-xl font-bold text-green-700 mb-2">انتهت اللعبة!</h5>
                                    <p className="text-lg text-gray-800">أحرزتما: <span className="font-bold text-2xl">{storyGameScore}</span> من {storyQuestions.length}</p>
                                    <button
                                        onClick={resetStoryGame}
                                        className="mt-4 bg-purple-500 text-white py-2 px-4 rounded-full hover:bg-purple-600 transition-colors"
                                    >
                                        العب مرة أخرى
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Game 4: Name Memory Challenge */}
                <div className="bg-white rounded-xl shadow-lg p-6 border border-pink-200 text-center flex flex-col justify-between items-center">
                    <h3 className="text-2xl font-bold text-pink-700 mb-4 font-cairo-display">
                        تحدي الذاكرة الاسمية 🧠
                    </h3>
                    <p className="text-gray-700 mb-4">
                        اعثرا على أزواج الاسم والمعنى المخفية!
                    </p>
                    {!memoryGameStarted ? (
                        <button
                            onClick={startMemoryGame}
                            className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-bold py-3 px-6 rounded-full shadow-md transform transition-transform duration-300 hover:scale-105 focus:outline-none focus:ring-4 focus:ring-orange-300"
                        >
                            ابدأ التحدي!
                        </button>
                    ) : (
                        <div className="w-full mt-4 animate-fadeInUp">
                            <p className="text-lg font-semibold text-gray-800 mb-4">النقلات: {moves}</p>
                            <div className="grid grid-cols-3 gap-3 justify-center">
                                {memoryCards.map(card => (
                                    <button
                                        key={card.uniqueId}
                                        onClick={() => handleCardClick(card)}
                                        className={`w-full h-24 sm:h-32 rounded-lg flex items-center justify-center text-xl font-bold transition-all duration-300 shadow-md
                                            ${card.isMatched ? 'bg-green-200 text-green-800 opacity-60' :
                                              card.isFlipped ? 'bg-blue-300 text-blue-900' : 'bg-gray-300 hover:bg-gray-400 text-gray-800'}`}
                                        disabled={card.isMatched || (flippedCards.length === 2 && !card.isFlipped)}
                                    >
                                        {card.isFlipped || card.isMatched ? (card.vibe ? card.vibe : card.name) : '؟'}
                                    </button>
                                ))}
                            </div>
                            {memoryGameMessage && (
                                <p className={`mt-4 text-lg font-semibold ${memoryGameMessage.includes('صحيحة') || memoryGameMessage.includes('رائع') ? 'text-green-600' : 'text-red-600'} animate-pulse`}>
                                    {memoryGameMessage}
                                </p>
                            )}
                            {matchedCards.length === memoryCards.length / 2 && (
                                <button
                                    onClick={resetMemoryGame}
                                    className="mt-6 bg-purple-500 text-white py-2 px-5 rounded-full hover:bg-purple-600 transition-colors shadow-md"
                                >
                                    العب مرة أخرى
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {/* Game 5: Personality Quiz by Names */}
                <div className="bg-white rounded-xl shadow-lg p-6 border border-blue-300 text-center flex flex-col justify-between items-center">
                    <h3 className="text-2xl font-bold text-blue-700 mb-4 font-cairo-display">
                        اختبار الشخصية بالأسماء 🧑‍🤝‍🧑
                    </h3>
                    <p className="text-gray-700 mb-4">
                        أجيبي عن الأسئلة واكتشفي أي من هذه الشخصيات أقرب إليكِ!
                    </p>
                    {!personalityQuizStarted ? (
                        <button
                            onClick={() => setPersonalityQuizStarted(true)}
                            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold py-3 px-6 rounded-full shadow-md transform transition-transform duration-300 hover:scale-105 focus:outline-none focus:ring-4 focus:ring-blue-300"
                        >
                            ابدأ اختبار الشخصية
                        </button>
                    ) : (
                        <div className="w-full mt-4 animate-fadeInUp">
                            {personalityQuizResult ? (
                                <div className="mt-6 bg-green-50 p-4 rounded-lg border border-green-300">
                                    <h5 className="text-xl font-bold text-green-700 mb-2 font-cairo-display">
                                        شخصيتك الأقرب هي:
                                    </h5>
                                    <p className="text-2xl font-bold text-indigo-700">
                                        {personalityQuizResult}
                                    </p>
                                    <button
                                        onClick={resetPersonalityQuiz}
                                        className="mt-4 bg-purple-500 text-white py-2 px-4 rounded-full hover:bg-purple-600 transition-colors"
                                    >
                                        أعد الاختبار
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <h4 className="text-xl font-bold text-gray-800 mb-4">
                                        السؤال {currentPersonalityQuestionIndex + 1} من {personalityQuestions.length}:
                                    </h4>
                                    <p className="text-lg font-medium text-gray-700 mb-6">{personalityQuestions[currentPersonalityQuestionIndex]?.question}</p>
                                    <div className="flex flex-col space-y-3">
                                        {personalityQuestions[currentPersonalityQuestionIndex]?.options.map((option, idx) => (
                                            <button
                                                key={idx}
                                                onClick={() => handlePersonalityAnswer(option.scores)}
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

                {/* Game 6: Who Is It? Game (Famous Personalities/Facts) */}
                <div className="bg-white rounded-xl shadow-lg p-6 border border-green-300 text-center flex flex-col justify-between items-center">
                    <h3 className="text-2xl font-bold text-green-700 mb-4 font-cairo-display">
                        تحدي: من صاحب هذا الاسم؟ ❓
                    </h3>
                    <p className="text-gray-700 mb-4">
                        اخمنوا الاسم المناسب للوصف أو الشخصية التاريخية!
                    </p>
                    {!whoIsItGameStarted ? (
                        <button
                            onClick={startWhoIsItGame}
                            className="bg-gradient-to-r from-teal-500 to-green-600 hover:from-teal-600 hover:to-green-700 text-white font-bold py-3 px-6 rounded-full shadow-md transform transition-transform duration-300 hover:scale-105 focus:outline-none focus:ring-4 focus:ring-teal-300"
                        >
                            ابدأ التحدي
                        </button>
                    ) : (
                        <div className="w-full mt-4 animate-fadeInUp">
                            <p className="text-lg font-semibold text-gray-800 mb-2">
                                النتيجة: {whoIsItGameScore} / {currentWhoIsItQuestionIndex}
                            </p>
                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-6 text-right">
                                <p className="text-xl font-medium text-gray-800">
                                    "{whoIsItQuestions[currentWhoIsItQuestionIndex]?.description}"
                                </p>
                            </div>
                            <div className="flex flex-wrap justify-center gap-3">
                                {whoIsItQuestions[currentWhoIsItQuestionIndex]?.options.map((option, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => handleWhoIsItAnswer(option)}
                                        className="bg-blue-100 text-blue-800 py-2 px-4 rounded-full text-lg font-semibold hover:bg-blue-200 transition-colors shadow-sm"
                                        disabled={whoIsItGameFeedback !== ''}
                                    >
                                        {option}
                                    </button>
                                ))}
                            </div>
                            {whoIsItGameFeedback && (
                                <p className={`mt-4 text-lg font-semibold ${whoIsItGameFeedback.includes('صحيحة') ? 'text-green-600' : 'text-red-600'} animate-pulse`}>
                                    {whoIsItGameFeedback}
                                </p>
                            )}
                            {currentWhoIsItQuestionIndex === whoIsItQuestions.length && (
                                <div className="mt-6 bg-green-50 p-4 rounded-lg border border-green-300">
                                    <h5 className="text-xl font-bold text-green-700 mb-2">انتهت اللعبة!</h5>
                                    <p className="text-lg text-gray-800">أحرزتما: <span className="font-bold text-2xl">{whoIsItGameScore}</span> من {whoIsItQuestions.length}</p>
                                    <button
                                        onClick={resetWhoIsItGame}
                                        className="mt-4 bg-purple-500 text-white py-2 px-4 rounded-full hover:bg-purple-600 transition-colors"
                                    >
                                        العب مرة أخرى
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Game 7: Sentence Builder Game */}
                <div className="bg-white rounded-xl shadow-lg p-6 border border-orange-300 text-center flex flex-col justify-between items-center">
                    <h3 className="text-2xl font-bold text-orange-700 mb-4 font-cairo-display">
                        لعبة: باني الجمل الاسمية ✍️
                    </h3>
                    <p className="text-gray-700 mb-4">
                        قم بإنشاء جملة إبداعية تتضمن الاسم المعطى!
                    </p>
                    {!sentenceBuilderGameStarted ? (
                        <button
                            onClick={startSentenceBuilderGame}
                            className="bg-gradient-to-r from-red-500 to-orange-600 hover:from-red-600 hover:to-orange-700 text-white font-bold py-3 px-6 rounded-full shadow-md transform transition-transform duration-300 hover:scale-105 focus:outline-none focus:ring-4 focus:ring-red-300"
                        >
                            ابدأ اللعبة
                        </button>
                    ) : (
                        <div className="w-full mt-4 animate-fadeInUp">
                            <p className="text-lg font-semibold text-gray-800 mb-2">الاسم المطلوب: <span className="text-indigo-700 font-bold">{currentSentenceName}</span></p>
                            <textarea
                                className="w-full p-3 border border-gray-300 rounded-lg mb-3 focus:ring-2 focus:ring-orange-400 outline-none resize-y min-h-[80px] text-right"
                                placeholder={`اكتبي جملة تحتوي على "${currentSentenceName}"...`}
                                value={userSentence}
                                onChange={(e) => setUserSentence(e.target.value)}
                            ></textarea>
                            <button
                                onClick={handleSubmitSentence}
                                className="w-full bg-blue-500 text-white py-2 px-4 rounded-full hover:bg-blue-600 transition-colors shadow-md"
                            >
                                أرسل الجملة
                            </button>
                            {sentenceGameFeedback && (
                                <p className={`mt-4 text-lg font-semibold ${sentenceGameFeedback.includes('رائعة') ? 'text-green-600' : 'text-red-600'} animate-pulse`}>
                                    {sentenceGameFeedback}
                                </p>
                            )}
                            {(!currentSentenceName && !sentenceBuilderGameStarted) && ( // Adjusted condition
                                <div className="mt-6 bg-green-50 p-4 rounded-lg border border-green-300">
                                    <h5 className="text-xl font-bold text-green-700 mb-2">انتهت اللعبة!</h5>
                                    <p className="text-lg text-gray-800">أحرزت: <span className="font-bold text-2xl">{scoreSentenceGame}</span> نقطة</p>
                                    <button
                                        onClick={resetSentenceBuilderGame}
                                        className="mt-4 bg-purple-500 text-white py-2 px-4 rounded-full hover:bg-purple-600 transition-colors"
                                    >
                                        العب مرة أخرى
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Game 8: Missing Name Game (Riddles) */}
                <div className="bg-white rounded-xl shadow-lg p-6 border border-purple-300 text-center flex flex-col justify-between items-center">
                    <h3 className="text-2xl font-bold text-purple-700 mb-4 font-cairo-display">
                        لعبة: ابحث عن الاسم المفقود 🧩
                    </h3>
                    <p className="text-gray-700 mb-4">
                        اقرأ اللغز وخمن الاسم المفقود!
                    </p>
                    {!missingNameGameStarted ? (
                        <button
                            onClick={startMissingNameGame}
                            className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold py-3 px-6 rounded-full shadow-md transform transition-transform duration-300 hover:scale-105 focus:outline-none focus:ring-4 focus:ring-indigo-300"
                        >
                            ابدأ اللعبة
                        </button>
                    ) : (
                        <div className="w-full mt-4 animate-fadeInUp">
                            <p className="text-lg font-semibold text-gray-800 mb-2">
                                النتيجة: {scoreMissingNameGame} / {currentMissingNamePuzzle}
                            </p>
                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-6 text-right">
                                <p className="text-xl font-medium text-gray-800">
                                    {missingNamePuzzles[currentMissingNamePuzzle]?.puzzle}
                                </p>
                            </div>
                            <input
                                type="text"
                                className="w-full p-3 border border-gray-300 rounded-lg mb-3 text-center focus:ring-2 focus:ring-purple-400 outline-none"
                                placeholder="اكتبي الاسم هنا..."
                                value={userMissingNameGuess}
                                onChange={(e) => setUserMissingNameGuess(e.target.value)}
                            />
                            <button
                                onClick={handleSubmitMissingName}
                                className="w-full bg-blue-500 text-white py-2 px-4 rounded-full hover:bg-blue-600 transition-colors shadow-md"
                            >
                                تحقق
                            </button>
                            {missingNameFeedback && (
                                <p className={`mt-4 text-lg font-semibold ${missingNameFeedback.includes('صحيح') ? 'text-green-600' : 'text-red-600'} animate-pulse`}>
                                    {missingNameFeedback}
                                </p>
                            )}
                            {currentMissingNamePuzzle === missingNamePuzzles.length && (
                                <div className="mt-6 bg-green-50 p-4 rounded-lg border border-green-300">
                                    <h5 className="text-xl font-bold text-green-700 mb-2">انتهت اللعبة!</h5>
                                    <p className="text-lg text-gray-800">أحرزت: <span className="font-bold text-2xl">{scoreMissingNameGame}</span> نقطة</p>
                                    <button
                                        onClick={resetMissingNameGame}
                                        className="mt-4 bg-purple-500 text-white py-2 px-4 rounded-full hover:bg-purple-600 transition-colors"
                                    >
                                        العب مرة أخرى
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Game 9: Name Categorization Game */}
                <div className="bg-white rounded-xl shadow-lg p-6 border border-red-300 text-center flex flex-col justify-between items-center">
                    <h3 className="text-2xl font-bold text-red-700 mb-4 font-cairo-display">
                        لعبة: تصنيف الاسم  categorisation 🏷️
                    </h3>
                    <p className="text-gray-700 mb-4">
                        صنف الاسم تحت الفئة الصحيحة التي يبرع فيها!
                    </p>
                    {!categorizationGameStarted ? (
                        <button
                            onClick={startCategorizationGame}
                            className="bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white font-bold py-3 px-6 rounded-full shadow-md transform transition-transform duration-300 hover:scale-105 focus:outline-none focus:ring-4 focus:ring-red-300"
                        >
                            ابدأ اللعبة
                        </button>
                    ) : (
                        <div className="w-full mt-4 animate-fadeInUp">
                            <p className="text-lg font-semibold text-gray-800 mb-2">
                                النتيجة: {categorizationGameScore} / {currentCategorizationQuestionIndex}
                            </p>
                            <h4 className="text-2xl font-bold text-indigo-700 mb-6 font-cairo-display">
                                صنف اسم: "{nameCategorizationQuestions[currentCategorizationQuestionIndex]?.name}"
                            </h4>
                            <div className="flex flex-wrap justify-center gap-3">
                                {nameCategorizationQuestions[currentCategorizationQuestionIndex]?.allCategories.map((cat, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => handleCategorizationAnswer(cat)}
                                        className="bg-blue-100 text-blue-800 py-2 px-4 rounded-full text-lg font-semibold hover:bg-blue-200 transition-colors shadow-sm"
                                        disabled={categorizationGameFeedback !== ''}
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </div>
                            {categorizationGameFeedback && (
                                <p className={`mt-4 text-lg font-semibold ${categorizationGameFeedback.includes('صحيحة') ? 'text-green-600' : 'text-red-600'} animate-pulse`}>
                                    {categorizationGameFeedback}
                                </p>
                            )}
                            {currentCategorizationQuestionIndex === nameCategorizationQuestions.length && (
                                <div className="mt-6 bg-green-50 p-4 rounded-lg border border-green-300">
                                    <h5 className="text-xl font-bold text-green-700 mb-2">انتهت اللعبة!</h5>
                                    <p className="text-lg text-gray-800">أحرزتما: <span className="font-bold text-2xl">{categorizationGameScore}</span> من {nameCategorizationQuestions.length}</p>
                                    <button
                                        onClick={resetCategorizationGame}
                                        className="mt-4 bg-purple-500 text-white py-2 px-4 rounded-full hover:bg-purple-600 transition-colors"
                                    >
                                        العب مرة أخرى
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>


                {/* Activity: Name Dice Roll (kept from previous version) */}
                <div className="bg-white rounded-xl shadow-lg p-6 border border-blue-200 text-center col-span-full">
                    <h3 className="text-2xl font-bold text-blue-700 mb-4 font-cairo-display">
                        🎲 حجر النرد الاسمية 🎲
                    </h3>
                    <p className="text-gray-700 mb-6">
                        دعوا القدر يختار اسماً عشوائياً لمولودكما!
                    </p>
                    <button
                        onClick={handleDiceRoll}
                        className="bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white font-bold py-3 px-6 rounded-full shadow-md transform transition-transform duration-300 hover:scale-105 focus:outline-none focus:ring-4 focus:ring-purple-300"
                    >
                        ألقِ النرد!
                    </button>
                </div>
            </div>
        </section>
    );
};

export default GamesTab;
