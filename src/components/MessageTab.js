import React from 'react';

// هذا هو مكون MessageTab.js المحدث
// يرجى حفظ هذا الكود في ملف جديد باسم MessageTab.js في مجلد src/components

const MessageTab = ({ parentsPledge, setParentsPledge, handlePledgeSave, nameDetails, getStaticContent, showTemporaryMessage }) => {
    const nameKeys = ['يامن', 'غوث', 'غياث']; // قائمة بالأسماء المستخدمة للعرض

    return (
        <section className="animate-fadeIn">
            <h2 className="text-3xl font-bold text-center text-indigo-700 mb-8 border-b-2 border-indigo-400 pb-4 font-cairo-display">
                رسالة إلى الوالدين العزيزين محمد وخلود الغزالي
            </h2>
            <div className="bg-white p-6 rounded-lg shadow-lg border border-teal-200">
                <h3 className="text-2xl font-bold text-teal-700 mb-4 font-cairo-display">أ. تمهيد علمي: قوة الاسم وتأثيره</h3>
                <p className="text-gray-700 leading-relaxed mb-6">
                    يا محمد وخلود، إنّ اختيار اسم مولودكما ليس مجرد قرار عابر، بل هو استثمار في هويته المستقبلية. تشير الدراسات في علم النفس الاجتماعي وعلم الدلالة اللغوية إلى أن الاسم لا يؤثر فقط على نظرة الآخرين للفرد، بل يلعب دوراً محورياً في تشكيل مفهوم الطفل لذاته، وثقته بنفسه، وحتى مساره الاجتماعي والمهني. الاسم هو أول ما يختبره الطفل من اللغة، وهو البوابة التي يُعرّف بها عن نفسه للعالم. لذلك، فإن اختيار اسم يحمل دلالات إيجابية، ويسهل نطقه، ويتوافق مع القيم الثقافية والدينية، يمنح طفلكما العزيز أساساً قوياً للنمو والازدهار. وقد قمنا بتحليل عميق لهذه الأسماء ليمنحكما نظرة شاملة.
                </p>

                <h3 className="text-2xl font-bold text-teal-700 mb-4 font-cairo-display">ب. جدول ترجيح موضوعي: مقارنة شاملة</h3>
                <div className="overflow-x-auto rounded-lg shadow-md mb-6 border border-gray-200">
                    <table className="min-w-full bg-white">
                        <thead className="bg-teal-100 text-teal-800">
                            <tr>
                                <th className="py-3 px-4 border-b border-gray-200 text-right font-cairo-display">الاسم</th>
                                <th className="py-3 px-4 border-b border-gray-200 text-right font-cairo-display">نقاط القوة الرئيسية</th>
                                <th className="py-3 px-4 border-b border-gray-200 text-right font-cairo-display">اعتبارات هامة</th>
                                <th className="py-3 px-4 border-b border-gray-200 text-center font-cairo-display">التقييم الكلي</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr className="bg-gray-50 hover:bg-teal-50">
                                <td className="py-3 px-4 border-b border-gray-200 font-semibold text-teal-700 font-cairo-display">يامن</td>
                                <td className="py-3 px-4 border-b border-gray-200 text-gray-700">دلالة البركة والخير، سهولة النطق، قبول واسع، توافق ممتاز مع اللقب.</td>
                                <td className="py-3 px-4 border-b border-gray-200 text-gray-700">اسم شائع ولكنه لا يفقد جاذبيته.</td>
                                <td className="py-3 px-4 border-b border-gray-200 text-center text-xl font-bold text-blue-600">ممتاز (9.5)</td>
                            </tr>
                            <tr className="bg-white hover:bg-teal-50">
                                <td className="py-3 px-4 border-b border-gray-200 font-semibold text-teal-700 font-cairo-display">غوث</td>
                                <td className="py-3 px-4 border-b border-gray-200 text-gray-700">قوة المعنى (إغاثة، نجدة)، تميز الاسم.</td>
                                <td className="py-3 px-4 border-b border-gray-200 text-gray-700">نادر الاستخدام كاسم شخصي، قد يواجه صعوبة في النطق لغير الناطقين بالعربية.</td>
                                <td className="py-3 px-4 border-b border-gray-200 text-center text-xl font-bold text-orange-600">جيد (8.0)</td>
                            </tr>
                            <tr className="bg-gray-50 hover:bg-teal-50">
                                <td className="py-3 px-4 border-b border-gray-200 font-semibold text-teal-700 font-cairo-display">غياث</td>
                                <td className="py-3 px-4 border-b border-gray-200 text-gray-700">قوة المعنى (إغاثة سخية)، مقبول وشائع، توافق جيد مع اللقب.</td>
                                <td className="py-3 px-4 border-b border-gray-200 text-center text-xl font-bold text-purple-600">جيد جداً (9.0)</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <h3 className="text-2xl font-bold text-teal-700 mb-4 mt-8 font-cairo-display">دليل تربوي تطبيقي متكامل للاسمين المقترحين:</h3>
                <p className="text-gray-700 leading-relaxed mb-4">
                    لتسهيل رحلتكما الأبوية، نقدم لكما دليلاً عملياً لكيفية تعزيز الصفات الإيجابية المرتبطة بكل من اسمي "يامن" و"غياث". تذكروا أن الاسم هو جزء من الهوية، والتربية هي رحلة مستمرة لغرس القيم.
                </p>

                <div className="bg-blue-50 p-5 rounded-lg shadow-inner mb-6 border border-blue-200">
                    <h4 className="text-xl font-bold text-blue-700 mb-3 flex items-center font-cairo-display">
                        <span className="ml-2">🌟</span> إذا وقع اختياركما على اسم <span className="text-indigo-800 mr-1">"يامن"</span>:
                    </h4>
                    <p className="text-gray-700 leading-relaxed mb-4">
                        "يامن" يعني **المبارك، الميمون، وكثير اليمن والبركة**. هذا الاسم يعكس طاقة إيجابية عالية، ويُوحي بالرخاء والتوفيق في الحياة. إنه اسم سهل النطق، لطيف على الأذن، ويتناغم بشكل طبيعي مع لقب "الغزالي". اختيار "يامن" قد يُسهم في بناء شخصية متفائلة، محظوظة، ومحبة للعطاء، تسعى دائماً لنشر الخير واليُمن أينما حلّت.
                    </p>
                    <p className="font-semibold text-indigo-600 mb-2 font-cairo-display">توجيهات تربوية لـ "يامن":</p>
                    <ul className="list-disc list-inside text-gray-700 leading-relaxed space-y-2">
                        <li><span className="font-semibold text-indigo-600">غرس التفاؤل والإيجابية:</span> شجّعا يامن على رؤية الجانب المشرق في الحياة. رويا له قصصاً عن الصبر والأمل، وعلّماه أن البركة والخير يأتيان بالاجتهاد والتوكل على الله.</li>
                        <li><span className="font-semibold text-indigo-600">تعزيز الامتنان:</span> علّماه قيمة الشكر والامتنان للنعم الصغيرة والكبيرة في حياته. هذا يُرسخ فيه شعوراً بالرضا والبركة.</li>
                        <li><span className="font-semibold text-indigo-600">تنمية حب العطاء:</span> اربطا اسمه بفعل الخير والبركة. شجّعاه على مساعدة الآخرين ومشاركتهم ما لديه، ليعيش معنى "اليُمن" في عطائه.</li>
                        <li><span className="font-semibold text-indigo-600">بناء الثقة بالنفس:</span> امدحا جهوده وإنجازاته، وازرعا فيه الثقة بأنه قادر على تحقيق النجاحات وجلب الخير أينما حل.</li>
                    </ul>
                    <h5 className="font-semibold text-blue-700 mt-4 mb-2 font-cairo-display">نشاط تفاعلي لـ "يامن":</h5>
                    <p className="text-gray-700 mb-3">
                        **لعبة "صندوق البركات"**: خصصا صندوقاً جميلاً يجمع فيه يامن (عندما يكبر قليلاً) كل الأشياء الصغيرة التي يشعر بالامتنان لوجودها كل أسبوع (مثلاً: رسمة جميلة، حجر مميز، ورقة شجر ملونة). في نهاية الأسبوع، افتحا الصندوق وتكلما معه عن هذه "البركات" البسيطة في حياته.
                    </p>
                </div>

                <div className="bg-purple-50 p-5 rounded-lg shadow-inner border border-purple-200">
                    <h4 className="text-xl font-bold text-purple-700 mb-3 flex items-center font-cairo-display">
                        <span className="ml-2">💪</span> إذا وقع اختياركما على اسم <span className="text-indigo-800 mr-1">"غياث"</span>:
                    </h4>
                    <p className="text-gray-700 leading-relaxed mb-4">
                        "غياث" يعني **الناصر، المنجد، والمساعد الذي يُغاث به الناس**. إنه صيغة مبالغة من "غوث"، مما يدل على كثرة الإغاثة والعون. هذا الاسم يرمز إلى القوة والعطاء الفعال، ويُشير إلى شخصية مبادرة وقادرة على إحداث فرق إيجابي في حياة الآخرين. يتناسب "غياث" أيضاً بشكل ممتاز مع لقب "الغزالي" وله رنين قوي وجذاب.
                    </p>
                    <p className="font-semibold text-indigo-600 mb-2 font-cairo-display">توجيهات تربوية لـ "غياث":</p>
                    <ul className="list-disc list-inside text-gray-700 leading-relaxed space-y-2">
                        <li><span className="font-semibold text-purple-600">تنمية حس المسؤولية:</span> علّماه مبكراً أهمية تحمل المسؤولية تجاه نفسه وتجاه الآخرين. كلفاه بمهام بسيطة تتناسب مع عمره.</li>
                        <li><span className="font-semibold text-purple-600">تشجيع المبادرة والعون:</span> درّباه على أن يكون سبّاقاً في مساعدة من يحتاج، وأن لا يتردد في مد يد العون. يمكن أن تشاركا في أعمال تطوعية صغيرة كعائلة.</li>
                        <li><span className="font-semibold text-purple-600">غرس الشجاعة والنخوة:</span> رويا له القصص التي تُعزز الشجاعة في مواجهة التحديات والدفاع عن الحق والضعفاء.</li>
                        <li><span className="font-semibold text-purple-600">تعليم القيادة:</span> شجّعاه على أخذ زمام المبادرة في الأنشطة الجماعية، وتنمية مهارات القيادة لديه من خلال الألعاب التي تتطلب التخطيط والتوجيه.</li>
                    </ul>
                    <h5 className="font-semibold text-purple-700 mt-4 mb-2 font-cairo-display">نشاط تفاعلي لـ "غياث":</h5>
                    <p className="text-gray-700 mb-3">
                        **"بطاقات الإغاثة"**: حضرا بطاقات عليها مواقف بسيطة يحتاج فيها شخص للمساعدة (مثلاً: صديق سقط، أو دمية تحتاج إصلاحاً). ودعا غياث لاقتراح حلول أو طرق عملية للمساعدة. هذا يعزز لديه التفكير المبادِر.
                    </p>
                </div>
                <div className="bg-yellow-50 p-5 rounded-lg shadow-inner mb-6 border border-yellow-200 mt-6">
                    <h4 className="text-xl font-bold text-yellow-700 mb-3 flex items-center font-cairo-display">
                        <span className="ml-2">🌟</span> رؤيتنا العائلية لمستقبل مولودنا:
                    </h4>
                    <p className="text-gray-700 leading-relaxed mb-4">
                        نحن، عائلة الغزالي، نرى في مولودنا القادم نوراً جديداً ينير حياتنا وحياة من حوله. نتمنى أن يكون اسماً يحمل البركة واليُمن، وأن يكون داعماً ومساعداً لمن حوله. نتصور طفلنا هذا وهو ينمو ليصبح فرداً قوياً، محباً، قادراً على ترك بصمة إيجابية في العالم، متفائلاً يرى الخير في كل شيء، ومسؤولاً ينهض لتقديم العون عند الحاجة. نأمل أن يعيش حياته بقلب مليء بالعطاء، وأن يكون مصدر فخر لنا ولأمته.
                    </p>
                    <p className="text-sm text-gray-600 italic mt-4">
                        (هذه رؤيتنا التي توجه اختياراتنا وطموحاتنا لمولودنا.)
                    </p>
                </div>

                {/* New Activity 1: Parents' Pledge to Baby */}
                <div className="bg-white rounded-xl shadow-lg p-6 border border-pink-200 mt-8">
                    <h3 className="text-2xl font-bold text-pink-700 mb-4 border-b pb-2 font-cairo-display">
                        📝 تعهد الآباء لمولودهم المستقبلي 📝
                    </h3>
                    <p className="text-gray-700 mb-4">
                        اكتبي تعهداً أو وعداً لطفلكما المستقبلي. ما هي القيم التي ستغرسانها فيه؟
                    </p>
                    <textarea
                        className="w-full p-3 border border-gray-300 rounded-lg mb-3 focus:ring-2 focus:ring-pink-400 outline-none resize-y min-h-[120px] text-right"
                        placeholder="أتعهد لطفلي بأنني سأكون..."
                        value={parentsPledge}
                        onChange={(e) => setParentsPledge(e.target.value)}
                    ></textarea>
                    <button
                        onClick={handlePledgeSave}
                        className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-bold py-3 px-6 rounded-full shadow-md transform transition-transform duration-300 hover:scale-105 focus:outline-none focus:ring-4 focus:ring-pink-300"
                    >
                        حفظ التعهد
                    </button>
                </div>

                {/* New Activity 2: Lullaby for Baby Name */}
                <div className="bg-white rounded-xl shadow-lg p-6 border border-orange-200 mt-8">
                    <h3 className="text-2xl font-bold text-orange-700 mb-4 border-b pb-2 font-cairo-display">
                        🎶 أغنية المهد لاسم مولودكما 🎶
                    </h3>
                    <p className="text-gray-700 mb-4">
                        اختاروا اسماً، واعرضوا أغنية مهد جميلة مخصصة له!
                    </p>
                    <div className="flex flex-wrap justify-center gap-4 mb-4">
                        {nameKeys.map(name => (
                            <button
                                key={`lullaby-${name}`}
                                onClick={() => {
                                    const lullaby = getStaticContent('lullabies', name);
                                    if (lullaby) {
                                        showTemporaryMessage(`أغنية مهد لاسم ${name}:\n\n${lullaby}`, 'info', 7000); // Show for longer
                                    } else {
                                        showTemporaryMessage("لا توجد أغنية مهد لهذا الاسم.", 'info', 3000);
                                    }
                                }}
                                className="bg-yellow-100 text-yellow-800 font-bold py-3 px-6 rounded-full shadow-md hover:bg-yellow-200 transition-colors transform hover:scale-105"
                            >
                                {name}
                            </button>
                        ))}
                    </div>
                    <p className="text-sm text-gray-600 italic mt-2">
                        (سيظهر الأغنية كرسالة مؤقتة على الشاشة.)
                    </p>
                </div>

                <p className="text-gray-700 leading-relaxed mt-6 italic font-semibold">
                    أتمنى لكما ولطفلكما القادم كل الخير والبركة والسعادة في هذه الرحلة الرائعة.
                    <br />
                    مع خالص تحياتي،
                    <br />
                    مساعدكما الشخصي
                </p>
            </div>
        </section>
    );
};

export default MessageTab;
