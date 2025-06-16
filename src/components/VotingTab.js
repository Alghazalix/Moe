import React, { useState, useCallback } from 'react';

export default function VotingTab({
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
    firebaseEnabled,
    isAuthReady // تم تمرير هذه الخاصية الجديدة من App.js
}) {
    const [customNameInput, setCustomNameInput] = useState('');
    const [showRoleSelectionModal, setShowRoleSelectionModal] = useState(false);

    // دالة لفتح نافذة اختيار الدور إذا لم يكن الدور محددًا
    const openRoleSelection = useCallback(() => {
        if (userRole === 'guest') { // افتح النافذة فقط إذا كان الدور 'guest'
            setShowRoleSelectionModal(true);
        } else {
            showTemporaryMessage(`تم تحديد دورك مسبقاً كـ "${userName}".`, 'info');
        }
    }, [userRole, userName, showTemporaryMessage]);

    // دالة لإغلاق نافذة اختيار الدور
    const closeRoleSelection = useCallback(() => {
        setShowRoleSelectionModal(false);
    }, []);

    // دالة لتغيير الدور وتحديث الاسم
    const selectRole = useCallback((role) => {
        handleUserRoleChange(role, customNameInput);
        closeRoleSelection();
    }, [handleUserRoleChange, customNameInput, closeRoleSelection]);

    // التحقق من أن المستخدم مصادق عليه وأن دوره يسمح بالتصويت
    const canVote = isAuthReady && firebaseEnabled && currentUser && currentUser.uid !== 'mock-user-id' && currentUser.uid !== 'fallback-user' && (userRole === 'father' || userRole === 'mother');
    const canComment = isAuthReady && firebaseEnabled && currentUser && currentUser.uid !== 'mock-user-id' && currentUser.uid !== 'fallback-user' && (userRole === 'father' || userRole === 'mother');

    return (
        <div className="text-right p-4 sm:p-6 bg-white rounded-lg shadow-lg flex flex-col space-y-6">
            <h2 className="text-3xl font-bold text-indigo-800 mb-4 text-center font-cairo-display">تصويتكم وآرائكم 🗳️</h2>
            <p className="text-gray-700 text-lg leading-relaxed mb-6 text-center">
                يا عائلة الغزالي الكريمة، صوتوا لاسم طفلكم المستقبلي المفضل. سيساعدنا رأيكم في اتخاذ القرار الأخير!
            </p>

            {/* قسم عرض دور المستخدم الحالي */}
            <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 flex items-center justify-between shadow-sm">
                <span className="text-indigo-800 font-semibold text-lg">دورك الحالي: <span className="font-bold">{userName}</span></span>
                <button
                    onClick={openRoleSelection}
                    className="bg-indigo-600 text-white px-5 py-2 rounded-full font-semibold text-base hover:bg-indigo-700 transition duration-300 transform hover:scale-105 shadow-md"
                >
                    تغيير الدور
                </button>
            </div>

            {/* رسالة توضيحية حول حالة التصويت */}
            {!isAuthReady && firebaseEnabled && (
                <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded-lg relative text-center">
                    <strong className="font-bold">لحظة من فضلك: </strong>
                    <span className="block sm:inline">جاري تهيئة خدمات التصويت. يرجى الانتظار قليلاً.</span>
                </div>
            )}
            {!firebaseEnabled && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative text-center">
                    <strong className="font-bold">تنبيه: </strong>
                    <span className="block sm:inline">وظائف حفظ البيانات (التصويت، التعليقات) **معطلة**. يرجى إعداد مشروع Firebase الخاص بكم لتفعيلها.</span>
                </div>
            )}
            {firebaseEnabled && isAuthReady && (userRole === 'guest') && (
                <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded-lg relative text-center">
                    <strong className="font-bold">تلميح: </strong>
                    <span className="block sm:inline">يرجى تحديد هويتكم (أب أو أم) باستخدام زر "تغيير الدور" للمشاركة في التصويت وكتابة التعليقات.</span>
                </div>
            )}
            {firebaseEnabled && isAuthReady && currentUser && (currentUser.uid === 'mock-user-id' || currentUser.uid === 'fallback-user') && (userRole !== 'guest') && (
                <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded-lg relative text-center">
                    <strong className="font-bold">معلومات: </strong>
                    <span className="block sm:inline">أنت تستخدم وضع الزائر. لكي يتم حفظ تصويتك/تعليقك بشكل دائم، تأكد من إعداد Firebase الصحيح في تطبيقك.</span>
                </div>
            )}


            {/* قسم التصويت */}
            <div className="bg-gradient-to-r from-teal-50 to-green-50 p-6 rounded-xl shadow-inner border border-teal-200">
                <h3 className="text-2xl font-bold text-teal-800 mb-4 text-center font-cairo-display">صوتوا لاسمكم المفضل:</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {nameKeys.map(name => (
                        <div key={name} className="flex flex-col items-center p-4 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 transform hover:scale-102">
                            <h4 className="text-xl font-bold text-gray-800 mb-2 font-cairo-display">{name}</h4>
                            <p className="text-gray-600 text-sm mb-3 text-center">{nameDetails[name]?.meaning}</p>
                            <div className="text-2xl font-extrabold text-green-600 mb-4">
                                {votes[name] !== undefined ? votes[name] : 0} أصوات
                            </div>
                            <button
                                onClick={() => handleVote(name)}
                                disabled={!canVote} // تعطيل الزر بناءً على canVote
                                className={`w-full px-5 py-2 rounded-full font-semibold text-base transition duration-300 transform hover:scale-105 shadow-md
                                    ${canVote ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-gray-300 text-gray-600 cursor-not-allowed'}`}
                            >
                                صوت لـ {name}
                            </button>
                        </div>
                    ))}
                </div>
                {!canVote && isAuthReady && firebaseEnabled && (userRole !== 'father' && userRole !== 'mother') && (
                    <p className="text-center text-red-500 mt-4 text-sm">
                        * يجب أن تكون "أباً" أو "أماً" للتصويت. يرجى تحديد دورك أولاً.
                    </p>
                )}
            </div>

            {/* قسم التعليقات */}
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-xl shadow-inner border border-purple-200">
                <h3 className="text-2xl font-bold text-purple-800 mb-4 text-center font-cairo-display">شاركوا بآرائكم وملاحظاتكم 💬</h3>
                <div className="space-y-4 max-h-64 overflow-y-auto pr-2 pb-2">
                    {comments.length > 0 ? (
                        comments.map((comment, index) => (
                            <div key={comment.id || index} className="bg-white p-3 rounded-lg shadow-sm border border-gray-200">
                                <p className="text-gray-800 text-base">{comment.text}</p>
                                <p className="text-gray-500 text-xs mt-1">
                                    - {comment.userName || 'مستخدم'} ({comment.role || 'زائر'}) بتاريخ: {new Date(comment.timestamp?.seconds * 1000).toLocaleString('ar-EG', { dateStyle: 'short', timeStyle: 'short' })}
                                </p>
                            </div>
                        ))
                    ) : (
                        <p className="text-gray-500 text-center">لا توجد تعليقات حتى الآن. كن أول من يشارك!</p>
                    )}
                </div>
                <div className="mt-6 flex flex-col sm:flex-row gap-3">
                    <textarea
                        className="flex-grow p-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 resize-y min-h-[60px]"
                        placeholder="اكتب تعليقك هنا..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        disabled={!canComment} // تعطيل حقل النص بناءً على canComment
                    ></textarea>
                    <button
                        onClick={handleAddComment}
                        disabled={!canComment || !newComment.trim()} // تعطيل الزر بناءً على canComment ووجود نص
                        className={`px-6 py-3 rounded-full font-semibold text-base transition duration-300 transform hover:scale-105 shadow-md
                            ${canComment && newComment.trim() ? 'bg-purple-600 text-white hover:bg-purple-700' : 'bg-gray-300 text-gray-600 cursor-not-allowed'}`}
                    >
                        إضافة تعليق
                    </button>
                </div>
                {!canComment && isAuthReady && firebaseEnabled && (userRole !== 'father' && userRole !== 'mother') && (
                    <p className="text-center text-red-500 mt-4 text-sm">
                        * يجب أن تكون "أباً" أو "أماً" لإضافة تعليق. يرجى تحديد دورك أولاً.
                    </p>
                )}
            </div>

            {/* نافذة اختيار الدور (Modal) */}
            {showRoleSelectionModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl p-8 shadow-2xl max-w-md w-full text-center relative transform transition-all duration-300 scale-100">
                        <h3 className="text-2xl font-bold text-indigo-800 mb-6 font-cairo-display">تحديد دورك 🧑‍🍼</h3>
                        <p className="text-gray-700 mb-6">يرجى تحديد دورك للمشاركة في التصويت والتعليقات:</p>
                        <div className="space-y-4">
                            <button
                                onClick={() => selectRole('father')}
                                className="w-full bg-blue-600 text-white px-6 py-3 rounded-full font-semibold text-lg hover:bg-blue-700 transition duration-300 transform hover:scale-105 shadow-md"
                            >
                                أنا الأب 👨‍🍼
                            </button>
                            <button
                                onClick={() => selectRole('mother')}
                                className="w-full bg-pink-600 text-white px-6 py-3 rounded-full font-semibold text-lg hover:bg-pink-700 transition duration-300 transform hover:scale-105 shadow-md"
                            >
                                أنا الأم 👩‍🍼
                            </button>
                            <input
                                type="text"
                                placeholder="أو أدخل اسماً مخصصاً (مثال: الجدة)"
                                value={customNameInput}
                                onChange={(e) => setCustomNameInput(e.target.value)}
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 text-right"
                            />
                            <button
                                onClick={() => selectRole('custom')}
                                className="w-full bg-gray-600 text-white px-6 py-3 rounded-full font-semibold text-lg hover:bg-gray-700 transition duration-300 transform hover:scale-105 shadow-md"
                            >
                                استخدام اسم مخصص
                            </button>
                        </div>
                        <button
                            onClick={closeRoleSelection}
                            className="absolute top-4 left-4 text-gray-500 hover:text-gray-800 transition duration-300"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
