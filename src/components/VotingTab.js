import React from 'react';

// هذا هو مكون VotingTab.js
// يرجى حفظ هذا الكود في ملف جديد باسم VotingTab.js في نفس مجلد App.js

const VotingTab = ({
    nameKeys,
    nameDetails,
    userRole,
    userName,
    handleUserRoleChange,
    votes,
    handleVote,
    comments,
    newComment,
    setNewComment,
    handleAddComment,
    currentUser,
    showTemporaryMessage,
    firebaseEnabled
}) => {
    return (
        <section className="animate-fadeIn">
            <h2 className="text-3xl font-bold text-center text-indigo-700 mb-8 border-b-2 border-indigo-400 pb-4 font-cairo-display">
                تصويت الوالدين وآرائهم
            </h2>

            {/* User Role Selection */}
            <div className="bg-white rounded-xl shadow-lg p-6 mb-8 border border-blue-200 text-center">
                <h3 className="text-2xl font-bold text-blue-700 mb-4 font-cairo-display">
                    من يصوت؟
                </h3>
                <div className="flex flex-wrap justify-center gap-4 mb-6">
                    <label className="flex items-center cursor-pointer bg-blue-100 text-blue-800 py-3 px-6 rounded-full shadow-md hover:bg-blue-200 transition-colors transform hover:scale-105">
                        <input
                            type="radio"
                            name="userRole"
                            value="father"
                            checked={userRole === 'father'}
                            onChange={() => handleUserRoleChange('father')}
                            className="form-radio h-5 w-5 text-blue-600 ml-2"
                        />
                        <span className="text-lg font-semibold">👨‍🦰 الأب (محمد)</span>
                    </label>
                    <label className="flex items-center cursor-pointer bg-pink-100 text-pink-800 py-3 px-6 rounded-full shadow-md hover:bg-pink-200 transition-colors transform hover:scale-105">
                        <input
                            type="radio"
                            name="userRole"
                            value="mother"
                            checked={userRole === 'mother'}
                            onChange={() => handleUserRoleChange('mother')}
                            className="form-radio h-5 w-5 text-pink-600 ml-2"
                        />
                        <span className="text-lg font-semibold">👩‍🦰 الأم (خلود)</span>
                    </label>
                    <label className="flex items-center cursor-pointer bg-gray-100 text-gray-800 py-3 px-6 rounded-full shadow-md hover:bg-gray-200 transition-colors transform hover:scale-105">
                        <input
                            type="radio"
                            name="userRole"
                            value="guest"
                            checked={userRole === 'guest'}
                            onChange={() => handleUserRoleChange('guest')}
                            className="form-radio h-5 w-5 text-gray-600 ml-2"
                        />
                        <span className="text-lg font-semibold">👤 زائر (مجهول)</span>
                    </label>
                </div>
                <input
                    type="text"
                    placeholder="أدخل اسمك (اختياري)"
                    className="w-full p-3 border border-gray-300 rounded-lg text-center focus:ring-2 focus:ring-blue-400 outline-none mb-3"
                    value={userName === 'الأب محمد' || userName === 'الأم خلود' || userName === 'مستخدم مجهول' || userName === 'زائر' ? '' : userName}
                    onChange={(e) => handleUserRoleChange('custom', e.target.value)}
                    disabled={userRole !== 'custom'}
                />
                <p className="text-sm text-gray-500 italic">
                    سيتم حفظ اختياركما لتسهيل التصويت والتعليق لاحقاً.
                </p>
            </div>

            {/* Voting Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {nameKeys.map((name) => (
                    <div key={name} className="bg-white rounded-xl shadow-lg p-6 border border-teal-200 text-center flex flex-col items-center justify-between">
                        <h3 className="text-3xl font-bold text-indigo-800 mb-4 font-cairo-display">{name}</h3>
                        <p className="text-gray-600 text-sm mb-4">{nameDetails[name].meaning}</p>
                        <button
                            onClick={() => handleVote(name)}
                            className="w-full bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 text-white font-bold py-3 px-6 rounded-full shadow-md transform transition-transform duration-300 hover:scale-105 focus:outline-none focus:ring-4 focus:ring-green-300"
                        >
                            صوت لهذا الاسم
                        </button>
                        <p className="text-lg font-bold text-gray-800 mt-4">
                            الأصوات: <span className="text-blue-600">{votes[name] || 0}</span>
                        </p>
                    </div>
                ))}
            </div>

            {/* Live Vote Chart */}
            <div className="bg-white rounded-xl shadow-lg p-6 mb-8 border border-purple-200">
                <h3 className="text-2xl font-bold text-purple-700 mb-6 text-center border-b pb-3 font-cairo-display">
                    مخطط الأصوات الحالي
                </h3>
                <div className="space-y-4">
                    {nameKeys.map((name) => (
                        <div key={`chart-${name}`} className="flex items-center mb-2">
                            <span className="text-lg font-semibold text-gray-700 w-24 flex-shrink-0 font-cairo-display">{name}:</span>
                            <div className="w-full bg-gray-200 rounded-full h-8 relative overflow-hidden shadow-inner">
                                <div
                                    className="bg-gradient-to-r from-blue-400 to-indigo-500 h-full rounded-full transition-all duration-700 ease-out"
                                    style={{ width: `${(votes[name] / (Object.values(votes).reduce((sum, val) => sum + val, 0) || 1)) * 100}%` }}
                                ></div>
                                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-white font-bold text-sm drop-shadow-md">
                                    {votes[name] || 0} صوت
                                </span>
                            </div>
                        </div>
                    ))}
                    <div className="text-center text-xl font-bold text-gray-800 mt-6 pt-4 border-t border-gray-200">
                        العدد الكلي للأصوات: <span className="text-indigo-600">{Object.values(votes).reduce((sum, val) => sum + val, 0)}</span>
                    </div>
                </div>
            </div>

            {/* Comments Section */}
            <div className="bg-white rounded-xl shadow-lg p-6 border border-green-200">
                <h3 className="text-2xl font-bold text-green-700 mb-6 text-center border-b pb-3 font-cairo-display">
                    شاركا آراءكما
                </h3>
                <textarea
                    className="w-full p-3 border border-gray-300 rounded-lg mb-3 focus:ring-2 focus:ring-green-400 outline-none resize-y min-h-[100px]"
                    placeholder="اكتبي أو اكتبي رأيكما حول الأسماء أو عملية الاختيار..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    disabled={!currentUser || userRole === 'guest' || !firebaseEnabled}
                ></textarea>
                <button
                    onClick={handleAddComment}
                    className="w-full bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 text-white font-bold py-3 px-6 rounded-full shadow-md transform transition-transform duration-300 hover:scale-105 focus:outline-none focus:ring-4 focus:ring-green-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={!currentUser || userRole === 'guest' || !newComment.trim() || !firebaseEnabled}
                >
                    أضف تعليقاً
                </button>

                <div className="mt-8 space-y-4 max-h-96 overflow-y-auto pr-2">
                    {comments.length === 0 ? (
                        <p className="text-center text-gray-500 italic">لا توجد تعليقات بعد. كونا أول من يعلق!</p>
                    ) : (
                        comments.map((comment) => (
                            <div key={comment.id} className="bg-gray-50 p-4 rounded-lg shadow-sm border border-gray-200 animate-fadeIn">
                                <p className="text-gray-800 leading-relaxed mb-2">{comment.text}</p>
                                <p className="text-right text-sm text-gray-500 font-semibold">
                                    - {comment.userName || 'مستخدم مجهول'} ({comment.role === 'father' ? 'الأب' : comment.role === 'mother' ? 'الأم' : 'زائر'})
                                    <span className="ml-2">
                                        {comment.timestamp ? new Date(comment.timestamp.seconds * 1000).toLocaleString('ar-EG', { dateStyle: 'short', timeStyle: 'short' }) : 'الآن'}
                                    </span>
                                </p>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </section>
    );
};

export default VotingTab;
