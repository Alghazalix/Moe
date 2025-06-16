import React, { useState, useEffect, useRef, useCallback } from 'react';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, collection, query, onSnapshot } from 'firebase/firestore';
import { initializeApp } from 'firebase/app';

// استيراد المكونات الفرعية التي سيتم تقسيم التطبيق إليها
import AnalysisTab from './AnalysisTab';
import ComparisonTab from './ComparisonTab';
import VotingTab from './VotingTab';
import GamesTab from './GamesTab';
import MessageTab from './MessageTab';
import RecommendationTab from './RecommendationTab';
import FutureVisionTab from './FutureVisionTab';
import GemsTab from './GemsTab'; // التبويب الجديد "دررٌ من الأسماء"

// تعريف ما إذا كان التطبيق يعمل في بيئة Canvas (للتطوير المحلي مقابل نشر Netlify)
const IS_CANVAS_ENVIRONMENT = typeof window.__app_id !== 'undefined';

// تحديد appId لمسارات Firestore.
// هذا المعرف ضروري لمسارات Firebase Firestore لفصل البيانات لتطبيقات مختلفة.
const appId = IS_CANVAS_ENVIRONMENT ? window.__app_id : "alghazali-family-app-deploy";

// تحديد إعدادات Firebase.
// تختار هذه الكتلة بذكاء بين الإعدادات المقدمة من Canvas (لمعاينة Canvas)
// أو بيانات الاعتماد المكتوبة يدوياً من المستخدم (لنشر Netlify حيث قد لا تكون متغيرات البيئة مباشرة).
const firebaseConfig = IS_CANVAS_ENVIRONMENT
    ? JSON.parse(window.__firebase_config)
    : {
        // إعدادات Firebase المقدمة من المستخدم من Firebase Console
        apiKey: "AIzaSyCTs1rIH60CtdRfBK8O8iyqMgcSJoDGuAk",
        authDomain: "alghazalifamilyapp.firebaseapp.com",
        projectId: "alghazalifamilyapp",
        storageBucket: "alghazalifamilyapp.firebasestorage.app",
        messagingSenderId: "211907541440",
        appId: "1:211907541440:web:82c313f5f17d4e91c07025",
        measurementId: "G-VJLS5W68E7"
    };

// تهيئة خدمات Firebase بشكل شرطي
let firestoreDbInstance;
let firebaseAuthInstance;
let firebaseEnabled = false; // علامة لتتبع ما إذا تم تهيئة Firebase بنجاح

// التحقق مما إذا كانت هناك إعدادات كافية لتهيئة Firebase بالفعل
const shouldInitializeFirebase = IS_CANVAS_ENVIRONMENT || (
    firebaseConfig.projectId && firebaseConfig.apiKey && firebaseConfig.authDomain
);

if (shouldInitializeFirebase) {
    try {
        const app = initializeApp(firebaseConfig);
        firestoreDbInstance = getFirestore(app);
        firebaseAuthInstance = getAuth(app);
        firebaseEnabled = true;
        console.log("Firebase successfully initialized with provided credentials.");
    } catch (e) {
        console.error("Firebase initialization failed, mocking services:", e);
        firebaseEnabled = false; // تعيين العلامة إلى false إذا فشلت التهيئة
    }
} else {
    console.warn("Firebase configuration is incomplete for external deployment. Firebase functionality (votes, comments) will be mocked.");
}

// خدمات Firebase الوهمية إذا لم يتم تهيئة Firebase الحقيقي أو فشل
// هذا يضمن أن التطبيق لا يزال يعمل بدون وظائف Firebase الكاملة.
if (!firebaseEnabled) {
    firestoreDbInstance = {
        collection: () => ({ addDoc: () => Promise.resolve(), doc: () => ({}), onSnapshot: () => () => {}, query: () => ({}) }), // Mock addDoc, doc, onSnapshot, query
        doc: () => ({}), // Mock doc
        getDoc: () => Promise.resolve({ exists: () => false, data: () => ({}) }), // Mock getDoc
        setDoc: () => Promise.resolve(), // Mock setDoc
        onSnapshot: (ref, callback) => { // Mock onSnapshot for data fetching
            console.log("Firestore onSnapshot mocked: No real-time updates for this instance.");
            callback({ forEach: () => {}, docs: [] }); // توفير لقطة فارغة
            return () => console.log("Firestore onSnapshot mocked: Unsubscribed."); // Mock unsubscribe
        },
        query: (ref) => ref // Mock query
    };
    firebaseAuthInstance = {
        onAuthStateChanged: (callback) => { // Mock onAuthStateChanged for user auth status
            console.log("Firebase Auth onAuthStateChanged mocked.");
            callback({ uid: 'mock-user-id', isAnonymous: true }); // توفير مستخدم مجهول وهمي
            return () => console.log("Firebase Auth onAuthStateChanged mocked: Unsubscribed.");
        },
        signInAnonymously: () => { // Mock anonymous sign-in
            console.log("Firebase Auth signInAnonymously mocked.");
            return Promise.resolve({ user: { uid: 'mock-user-id', isAnonymous: true } });
        },
        signInWithCustomToken: () => { // Mock custom token sign-in (for Canvas)
            console.log("Firebase Auth signInWithCustomToken mocked.");
            return Promise.resolve({ user: { uid: 'mock-canvas-user', isAnonymous: false } });
        }
    };
}

// القائمة الرئيسية للأسماء المستخدمة في التطبيق لأقسام مختلفة
const nameKeys = ['يامن', 'غوث', 'غياث'];

// تفاصيل الأسماء (لم تتغير حسب التعليمات السابقة، 'الغوث' مدرج عمداً كاسم للتحليل، ولكن ليس في nameKeys للاختيار)
const nameDetails = {
    'يامن': {
        meaning: 'المبارك، الميمون، ذو اليمين، كثير اليمن والبركة.',
        origin: 'عربي أصيل.',
        linguistic: 'اسم فاعل مشتق من الفعل "يمنَ"، يدل على البركة والخير. يمتاز بسهولة في النطق والكتابة، وصوته رخيم ومريح على الأذن، يتدفق بسلاسة.',
        psychological: 'يرتبط بالتفاؤل والإيجابية، ويُتوقع أن يُضفي على حامله شعوراً بالحظ الجيد والنجاح. يمكن أن يعزز الثقة بالنفس والتوجهات الإيجابية نحو المستقبل.',
        cultural: 'اسم ذو انتشار واسع ومحبوب في العالم العربي، يحمل دلالات إيجابية جداً ومقبول اجتماعياً ودينياً بشكل واسع.',
        religious: 'لا يوجد تحريم له، بل يرتبط باليُمن والبركة، وهي قيم محبوبة ومباركة في الإسلام. يُذكر اليمين في القرآن الكريم للدلالة على الصالحين وأهل الجنة (أصحاب اليمين).',
        popularity: 'شائع ومحبوب في العديد من الدول العربية، ويسهل تذكره ونطقه لكل من الناطقين وغير الناطقين بالعربية.',
        practical: 'سهل النطق والكتابة في كل من اللغتين العربية والإنجليزية. قليل الأخطاء الإملائية المحتملة، ويتناسق بشكل ممتاز مع لقب "الغزالي" لسهولة النطق والتناغم الصوتي.',
        futuristic: 'اسم كلاسيكي ولكنه في نفس الوقت عصري، يحافظ على جاذبيته وقيمته بمرور الوقت. لا يحمل أي دلالات سلبية قد تؤثر على مسيرة حامله المهنية أو الاجتماعية مستقبلاً.',
        personalStrength: 'يوحي بالحظ السعيد والبركة، وقد ينعكس ذلك على شخصية قوية ومبتهجة، تجلب الخير لنفسها ولمن حولها بفضل طاقته الإيجابية.',
        compatibility: 'يتناسب بشكل ممتاز مع "الغزالي" لسهولة النطق والتناغم الصوتي الجميل بينهما.',
        rhythm: 'يتميز بإيقاع موسيقي هادئ ومريح، وسهل جداً على اللسان، مما يجعله محبباً للسمع.',
        otherMeaning: 'لا يوجد له معنى سلبي في لغات أخرى معروفة، مما يجعله آمناً للاستخدام عالمياً.',
        uniqueness: 'شائع نسبياً، مما يجعله مألوفاً ومريحاً ولكنه ليس نادراً جداً، مما يحقق توازناً جيداً بين الأصالة والانتشار.',
        acceptance: 'مقبول عالمياً في الثقافة العربية والإسلامية، ولا يثير أي تحفظات.',
        alternativeInterpretation: 'لا يوجد اختلاف جوهري في تفسير هذا الاسم، فدلالاته على البركة والخير ثابتة ومجمع عليها.',
        score: 9.5
    },
    'غوث': {
        meaning: 'المغيث، الناصر، المنجد، الإغاثة، العون.',
        origin: 'عربي أصيل.',
        linguistic: 'مصدر الفعل "غاث"، يدل على العون والنجدة. اسم قوي وواضح المعنى. قد يكون نطقه ثقيلاً بعض الشيء على غير الناطقين بالعربية بسبب حرف الغين الصعب النطق، وله صوت جهوري.',
        psychological: 'يرتبط بالشجاعة، النخوة، والمبادرة لتقديم المساعدة. يمكن أن يُضفي على حامله حس المسؤولية والقدرة على القيادة في الأزمات والمواقف الصعبة.',
        cultural: 'أقل شيوعاً كاسم فردي مقارنة بـ "غياث". يُستخدم أكثر في السياق الديني أو كصفة لمدح شخص، وليس كاسم شائع للمواليد.',
        religious: 'الغوث من أسماء الله الحسنى (المغيث)، ولكن "غوث" بدون أل التعريف لا يحمل نفس الدلالة الإلهية المطلقة، وهو جائز كاسم. يُشير إلى من يطلب الغوث أو من يُغاث من قبل الله أو من شخص آخر.',
        popularity: 'نادر كاسم شخصي، مما يجعله مميزاً جداً لمن يبحث عن التفرد، ولكن قد يكون غير مألوف للبعض ويصعب تذكره.',
        practical: 'قد يواجه البعض صعوبة في نطق حرف الغين بشكل صحيح، خاصة في اللغات الأخرى. كتابته سهلة نسبياً. يتناسق جيداً مع لقب "الغزالي" ولكن بإيقاع قوي ومميز.',
        futuristic: 'اسم غير تقليدي، قد يمنح حامله تميزاً لافتاً في المستقبل. يحمل دلالات إيجابية للقوة والعطاء والنجدة، وهي صفات مرغوبة في أي زمان.',
        personalStrength: 'يوحي بالقدرة على العطاء والإغاثة، مما يدل على شخصية قوية، مسؤولة، ومحبة للمساعدة، وقادرة على الإغاثة في المواقف الصعبة.',
        compatibility: 'يتناسب مع "الغزالي" بشكل جيد، مع إيقاع قوي ومميز يُبرز شخصية الاسم.',
        rhythm: 'إيقاع قوي ومباشر، يوحي بالعزم والقوة والصلابة في الشخصية.',
        otherMeaning: 'لا يوجد معنى سلبي في لغات أخرى معروفة، وهو ما يجعله آمناً للاستخدام.',
        uniqueness: 'فريد جداً وغير شائع، مما يمنح حامله تميزاً كبيبيراً ويجعله ملفتاً للنظر.',
        acceptance: 'مقبول ولكنه غير مألوف بشكل واسع كاسم شخصي، وقد يثير بعض الاستفسارات حول معناه أو سبب اختياره.',
        alternativeInterpretation: 'لا يوجد اختلاف جوهري في تفسير هذا الاسم، فدلالاته على الإغاثة والعون واضحة ومباشرة.',
        score: 8.0
    },
    'غياث': {
        meaning: 'الناصر، المنجد، المساعد، الذي يُغاث به الناس، المطر الذي يأتي بالخير بعد الجدب.',
        origin: 'عربي أصيل.',
        linguistic: 'صيغة مبالغة من "غوث"، تدل على الكثرة في الإغاثة والنجدة. أسهل في النطق من "غوث" لعدم وجود السكون على الواو، وصوته قوي وواضح ومريح على الأذن.',
        psychological: 'يرتبط بالعطاء السخي، الفعالية في مساعدة الآخرين، والقدرة على جلب الخير. يُشعر حامله بالمسؤولية الإيجابية والقوة الدافعة لإحداث فرق إيجابي.',
        cultural: 'مقبول وشائع الاستخدام كاسم شخصي في العديد من الدول العربية، ويُعد من الأسماء الجميلة والمحمودة.',
        religious: 'لا يوجد تحريم له، بل هو اسم مبارك يدل على العون والنجدة. يُطلق على الله في بعض السياقات كـ "غياث المستغيثين"، لكنه يستخدم أيضاً للأشخاص للدلالة على كثرة إغاثتهم ومساعدتهم.',
        popularity: 'متوسط الشهرة، ليس نادراً جداً وليس شائعاً جداً، مما يمنحه توازناً جيداً بين التميز والألفة والقبول.',
        practical: 'سهل النطق والكتابة نسبياً. قد يظل حرف الغين تحدياً لغير الناطقين بالعربية ولكن أقل من "غوث". يتناسق جيداً مع لقب "الغزالي" وله رنين قوي وجذاب.',
        futuristic: 'اسم قوي وذو معنى إيجابي دائم، يحافظ على جاذبيته عبر الأجيال. يوحي بالقيادة والمبادرة والقدرة على الإنجاز والعطاء.',
        personalStrength: 'يوحي بالقيادة، العطاء، والقدرة على إحداث فرق إيجابي في حياة الآخرين، مما يدل على شخصية قوية وملهمة ومحبة للمساعدة.',
        compatibility: 'يتناسب بشكل ممتاز مع "الغزالي" وله رنين قوي وجذاب، مما يضيف لللقب جمالاً.',
        rhythm: 'إيقاع قوي وممتع، يوحي بالنشاط والحيوية والفعالية في الحركة.',
        otherMeaning: 'لا يوجد معنى سلبي في لغات أخرى معروفة، وهو ما يجعله آمناً للاستخدام.',
        uniqueness: 'متوازن بين الفرادة والشيوع، فهو ليس نادراً جداً ولكنه مميز بشكل كافٍ ليبرز حامله.',
        acceptance: 'مقبول عالمياً في الثقافة العربية والإسلامية، ولا يثير أي اعتراضات.',
        alternativeInterpretation: 'لا يوجد اختلاف جوهري في تفسير هذا الاسم، فدلالاته على الإغاثة والعون واضحة، وهو صيغة مبالغة من "غوث" تُستخدم للدلالة على الكثرة.',
        score: 9.0
    },
};

// المحاور للتحليل التفصيلي في تبويب التحليل
const axes = [
    "المعنى اللغوي", "التأثير النفسي", "الأهمية الثقافية", "الدلالة الدينية", "الشهرة والاستخدام",
    "العملية وسهولة النطق", "التوقعات المستقبلية", "القوة الشخصية المتوقعة", "التوافق مع اللقب",
    "الإيقاع الصوتي", "معاني أخرى في لغات مختلفة", "التفرد مقابل الشيوع", "القبول العام",
    "التحليل الصوتي (تقريبي)", "بدائل تفسيرية"
];

// بيانات مقارنة الأسماء، مع الفرز حسب النقاط
const comparisonData = nameKeys.map(name => ({
    name,
    score: nameDetails[name].score,
    meaning: nameDetails[name].meaning,
    linguistic: nameDetails[name].linguistic,
    psychological: nameDetails[name].psychological,
    cultural: nameDetails[name].cultural,
    religious: nameDetails[name].religious,
    popularity: nameDetails[name].popularity,
    practical: nameDetails[name].practical,
    futuristic: nameDetails[name].futuristic,
    personalStrength: nameDetails[name].personalStrength,
    compatibility: nameDetails[name].compatibility,
    rhythm: nameDetails[name].rhythm,
    uniqueness: nameDetails[name].uniqueness,
    acceptance: nameDetails[name].acceptance,
    alternativeInterpretation: nameDetails[name].alternativeInterpretation,
}));

const sortedComparisonData = [...comparisonData].sort((a, b) => b.score - a.score);

export default function App() { // بدء المكون الرئيسي App
    // متغيرات الحالة لإدارة واجهة المستخدم والبيانات وتفاعلات المستخدم
    const [activeTab, setActiveTab] = useState('analysis');
    const [showRecommendation, setShowRecommendation] = useState(false);
    const [userName, setUserName] = useState('');
    const [userRole, setUserRole] = useState('guest');
    const [votes, setVotes] = useState({
        'يامن': 0,
        'غوث': 0,
        'غياث': 0
    });
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [currentUser, setCurrentUser] = useState(null);
    const [tempMessage, setTempMessage] = useState('');
    const [tempMessageType, setTempMessageType] = useState('info');

    // حالات لـ "الذكاء الاصطناعي" (باستخدام محتوى ثابت)
    const [generatedBlessing, setGeneratedBlessing] = useState('');
    const [loadingBlessing, setLoadingBlessing] = useState(false);
    const [suggestedNamesForCard, setSuggestedNamesForCard] = useState({});
    const [loadingSuggestions, setLoadingSuggestions] = useState({});
    const [generatedPoem, setGeneratedPoem] = useState('');
    const [loadingPoem, setLoadingPoem] = useState(false);

    // حالات لتحليل الاسم وتقديم الانطباع
    const [expandedName, setExpandedName] = useState(null);
    const [funFact, setFunFact] = useState('');
    const [selectedImageMeaningName, setSelectedImageMeaningName] = useState(null);
    const [selectedPhoneticAnalysisName, setSelectedPhoneticAnalysisName] = useState(null);

    // حالات لعبة اختبار الاسم المثالي
    const [quizStarted, setQuizStarted] = useState(false);
    const [currentQuizQuestionIndex, setCurrentQuizQuestionIndex] = useState(0);
    const [quizScores, setQuizScores] = useState(() => {
        const initialScores = {};
        if (Array.isArray(nameKeys)) { // فحص دفاعي
            nameKeys.forEach(name => { initialScores[name] = 0; });
        }
        return initialScores;
    });
    const [quizResult, setQuizResult] = useState(null);

    // حالات لعبة مطابقة الصفة للاسم
    const [traitGameStarted, setTraitGameStarted] = useState(false);
    const [currentTraitIndex, setCurrentTraitIndex] = useState(0);
    const [traitGameScore, setTraitGameScore] = useState(0);
    const [traitGameFeedback, setTraitGameFeedback] = useState('');
    const traitQuestions = React.useMemo(() => [
        { trait: "الشجاعة والمبادرة", correctName: "غوث" },
        { trait: "البركة والخير", correctName: "يامن" },
        { trait: "العطاء والقيادة", correctName: "غياث" },
    ], []);

    // حالات لعبة إكمال قصة الاسم
    const [storyGameStarted, setStoryGameStarted] = useState(false);
    const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
    const [storyGameScore, setStoryGameScore] = useState(0);
    const [storyGameFeedback, setStoryGameFeedback] = useState('');
    const storyQuestions = React.useMemo(() => [
        {
            storyPart: "في يومٍ مشمسٍ، انطلق في رحلة استكشافية جريئة، متحدياً الصعاب بشجاعة نادرة. كان دائماً أول من يقفز لتقديم العون...",
            correctName: "غوث"
        },
        {
            storyPart: "كانت ابتسامته تضيء المكان، وكلما دخل مكاناً حلّت البركة فيه. كان يجلب السعادة والتفاؤل لمن حوله...",
            correctName: "يامن"
        },
        {
            storyPart: "بقلبه الكبير ويده المعطاءة، كان سباقاً لفعل الخير ومساعدة المحتاجين. قاد مبادرات عديدة جلبت الفرح للكثيرين...",
            correctName: "غياث"
        },
    ], []);

    // حالات لعبة تحدي الذاكرة الاسمية
    const [memoryGameStarted, setMemoryGameStarted] = useState(false);
    const [memoryCards, setMemoryCards] = useState([]);
    const [flippedCards, setFlippedCards] = useState([]);
    const [matchedCards, setMatchedCards] = useState([]);
    const [moves, setMoves] = useState(0);
    const [memoryGameMessage, setMemoryGameMessage] = useState('');
    const memoryGamePairs = React.useMemo(() => [
        { id: 1, name: 'يامن', vibe: 'بركة' },
        { id: 2, name: 'غوث', vibe: 'شجاعة' },
        { id: 3, name: 'غياث', vibe: 'عطاء' },
    ], []);

    // حالة تعهد الوالدين (محفوظة في التخزين المحلي)
    const [parentsPledge, setParentsPledge] = useState(() => localStorage.getItem('parentsPledge') || '');

    // حالة تصميم الرؤية المستقبلية
    const [futureVisionNameInput, setFutureVisionNameInput] = useState('');
    const [futureVisionTraits, setFutureVisionTraits] = useState([]);
    const [futureVisionMotto, setFutureVisionMotto] = useState('');
    const [generatedFutureVision, setGeneratedFutureVision] = useState('');

    // حالة تصور المولود بالذكاء الاصطناعي
    const [selectedAIVisualizationName, setSelectedAIVisualizationName] = useState(null);

    // مرجع لتتبع ما إذا تم محاولة تسجيل الدخول الأولية في Firebase
    const initialSignInAttempted = useRef(false);
    const authCheckComplete = useRef(false); // مرجع جديد للإشارة إلى ما إذا كان فحص المصادقة الأولي قد اكتمل

    // حالة العد التنازلي
    const targetDate = React.useMemo(() => new Date('2025-06-03T00:00:00'), []);
    const [countdown, setCountdown] = useState({});

    // ----- ألعاب جديدة للقسم "ألعاب مسلية" -----
    // 1. اختبار الشخصية بالأسماء
    const [personalityQuizStarted, setPersonalityQuizStarted] = useState(false);
    const [currentPersonalityQuestionIndex, setCurrentPersonalityQuestionIndex] = useState(0);
    const [personalityQuizScores, setPersonalityQuizScores] = useState({
        'يامن': 0, 'غوث': 0, 'غياث': 0, 'مستكشف': 0, 'مبدع': 0, 'قيادي': 0, 'متعاون': 0
    });
    const [personalityQuizResult, setPersonalityQuizResult] = useState(null);

    const personalityQuestions = React.useMemo(() => [
        {
            id: 1,
            question: "عندما تواجه تحدياً، هل تميل إلى:",
            options: [
                { text: "التعامل معه بهدوء وثقة، مع الإيمان بالحلول الإيجابية.", scores: { 'يامن': 2, 'متعاون': 1 } },
                { text: "المبادرة فوراً والبحث عن حلول جريئة ومباشرة.", scores: { 'غوث': 2, 'قيادي': 1 } },
                { text: "جمع الآخرين والتفكير معاً لإيجاد حل شامل ومفيد للجميع.", scores: { 'غياث': 2, 'متعاون': 2 } },
                { text: "تحليل المشكلة بعمق والبحث عن طرق جديدة ومبتكرة لحلها.", scores: { 'مستكشف': 2, 'مبدع': 1 } }
            ]
        },
        {
            id: 2,
            question: "في مجموعة عمل، أي دور تفضل؟",
            options: [
                { text: "منظم يضمن سير الأمور بسلاسة ويحافظ على التناغم.", scores: { 'يامن': 1, 'متعاون': 2 } },
                { text: "قائد يتخذ القرارات الصعبة ويحفز الفريق على التقدم.", scores: { 'غوث': 2, 'قيادي': 2 } },
                { text: "مساعد يدعم الجميع ويقدم العون لإنجاح المشروع.", scores: { 'غياث': 1, 'متعاون': 2 } },
                { text: "صاحب الأفكار الجديدة الذي يلهم الابتكار في الفريق.", scores: { 'مبدع': 2, 'مستكشف': 1 } }
            ]
        },
        {
            id: 3,
            question: "كيف تقضي وقت فراغك المفضل؟",
            options: [
                { text: "في مكان هادئ ومريح، أمارس هواية تجلب لي السلام النفسي.", scores: { 'يامن': 2 } },
                { text: "في مغامرة جديدة أو نشاط يتطلب شجاعة وقوة بدنية.", scores: { 'غوث': 2, 'مستكشف': 1 } },
                { text: "بمساعدة الآخرين أو المشاركة في فعاليات مجتمعية.", scores: { 'غياث': 2, 'متعاون': 1 } },
                { text: "تعلم شيء جديد أو استكشاف أفكار معقدة.", scores: { 'مبدع': 2, 'مستكشف': 2 } }
            ]
        },
        {
            id: 4,
            question: "ما هو شعارك في الحياة؟",
            options: [
                { text: "البركة في القليل والكثير، والسعي للخير دائماً.", scores: { 'يامن': 2 } },
                { text: "كن قوياً، كن منقذاً، لا تخف من الصعاب.", scores: { 'غوث': 2 } },
                { text: "العطاء يثمر، والمساعدة تنشر الفرح.", scores: { 'غياث': 2 } },
                { text: "الابتكار هو مفتاح التقدم، والاستكشاف لا يتوقف.", scores: { 'مبدع': 2, 'مستكشف': 1 } }
            ]
        }
    ], []);

    // 2. تحدي "من صاحب هذا الاسم؟"
    const [whoIsItGameStarted, setWhoIsItGameStarted] = useState(false);
    const [currentWhoIsItQuestionIndex, setCurrentWhoIsItQuestionIndex] = useState(0);
    const [whoIsItGameScore, setWhoIsItGameScore] = useState(0);
    const [whoIsItGameFeedback, setWhoIsItGameFeedback] = useState('');

    const whoIsItQuestions = React.useMemo(() => [
        {
            id: 1,
            description: "شخصية عربية معروفة بـ 'أبي الوفاء' ولديه إسهامات عظيمة في الرياضيات والفلك. اسمه يشبه أحد الأسماء المقترحة.",
            options: ["غوث", "يامن", "غياث"],
            correctAnswer: "يامن", // يامن هو اختصار لـ أبو الوفاء البوزجاني (محمد بن محمد بن يحيى بن إسماعيل بن العباس البوزجاني)
            hint: "يشير إلى البركة والتوفيق."
        },
        {
            id: 2,
            description: "لقب يطلق على بعض الشخصيات في التاريخ الإسلامي الذين كانوا يقدمون العون والإغاثة للمحتاجين في أوقات الشدة.",
            options: ["غياث", "يامن", "غوث"],
            correctAnswer: "غوث",
            hint: "معناه النجدة."
        },
        {
            id: 3,
            description: "شخصية تاريخية مشهورة بالعطاء السخي والمساعدة الدائمة للفقراء والمساكين، وكان يُوصف بأنه 'يغيث' الناس.",
            options: ["يامن", "غياث", "غوث"],
            correctAnswer: "غياث",
            hint: "صيغة مبالغة من العون."
        },
    ], []);

    // 3. لعبة باني الجمل الاسمية
    const [sentenceBuilderGameStarted, setSentenceBuilderGameStarted] = useState(false);
    const [currentSentenceName, setCurrentSentenceName] = useState('');
    const [userSentence, setUserSentence] = useState('');
    const [sentenceGameFeedback, setSentenceGameFeedback] = useState('');
    const [scoreSentenceGame, setScoreSentenceGame] = useState(0);

    const namesForSentenceGame = React.useMemo(() => ['يامن', 'غوث', 'غياث'], []);

    // 4. لعبة "ابحث عن الاسم المفقود" (لغز)
    const [missingNameGameStarted, setMissingNameGameStarted] = useState(false);
    const [currentMissingNamePuzzle, setCurrentMissingNamePuzzle] = useState(0);
    const [userMissingNameGuess, setUserMissingNameGuess] = useState('');
    const [missingNameFeedback, setMissingNameFeedback] = useState('');
    const [scoreMissingNameGame, setScoreMissingNameGame] = useState(0);

    const missingNamePuzzles = React.useMemo(() => [
        {
            puzzle: "البركة والخير يتبعه أينما ذهب، إنه اسم المولود '____'.",
            answer: "يامن",
            hint: "يبدأ بحرف الياء."
        },
        {
            puzzle: "في الشدة يكون السند والعون، إنه اسم '____'.",
            answer: "غوث",
            hint: "يشبه كلمة 'إغاثة'."
        },
        {
            puzzle: "بالعطاء والفيض يُعرف، إنه '____' الذي يجلب الفرح.",
            answer: "غياث",
            hint: "صيغة مبالغة من العون."
        },
    ], []);

    // 5. لعبة "تصنيف الاسم" (تعليمي)
    const [categorizationGameStarted, setCategorizationGameStarted] = useState(false);
    const [currentCategorizationQuestionIndex, setCurrentCategorizationQuestionIndex] = useState(0);
    const [categorizationGameScore, setCategorizationGameScore] = useState(0);
    const [categorizationGameFeedback, setCategorizationGameFeedback] = useState('');

    const nameCategorizationQuestions = React.useMemo(() => [
        {
            name: "يامن",
            categories: ["معاني إيجابية", "سهولة النطق", "انتشار واسع"],
            correctCategory: "معاني إيجابية",
            allCategories: ["معاني إيجابية", "صعوبة في النطق", "اسم نادر", "انتشار واسع", "قوة وعون"]
        },
        {
            name: "غوث",
            categories: ["اسم نادر", "قوة وعون", "صعوبة في النطق"],
            correctCategory: "قوة وعون",
            allCategories: ["معاني إيجابية", "صعوبة في النطق", "اسم نادر", "انتشار واسع", "قوة وعون"]
        },
        {
            name: "غياث",
            categories: ["عطاء وفيض", "قبول واسع", "توازن بين الشيوع والتميز"],
            correctCategory: "عطاء وفيض",
            allCategories: ["معاني إيجابية", "صعوبة في النطق", "اسم نادر", "انتشار واسع", "قوة وعون", "عطاء وفيض", "قبول واسع", "توازن بين الشيوع والتميز"]
        },
    ], []);


    // ----- حالات تبويب "دررٌ من الأسماء" -----
    const [selectedHistoricalName, setSelectedHistoricalName] = useState(null);
    const [historicalNameInput, setHistoricalNameInput] = useState('');
    const [historicalNameFact, setHistoricalNameFact] = useState('');

    const historicalNamesData = React.useMemo(() => ({
        'محمد': {
            era: 'العصر النبوي والإسلامي',
            significance: 'اسم نبي الإسلام محمد صلى الله عليه وسلم، يعني "المحمود" أو "كثير الحمد". من أكثر الأسماء انتشاراً في العالم الإسلامي، ويرمز إلى الرحمة والقيادة الصالحة.',
            story: 'ولد في مكة المكرمة وتلقى الوحي ليقود الأمة الإسلامية. حياته كانت مثالاً للأخلاق الحميدة والعطاء.'
        },
        'فاطمة': {
            era: 'العصر النبوي والإسلامي',
            significance: 'اسم ابنة النبي محمد صلى الله عليه وسلم، السيدة فاطمة الزهراء. يعني "التي فُطمت عن الشر" أو "التي فُطمت من النار". رمز للنقاء والطهر والصبر.',
            story: 'تعد سيدة نساء العالمين، وكانت مثالاً للابنة الصالحة والزوجة المخلصة والأم الفاضلة.'
        },
        'يوسف': {
            era: 'العصر القديم والقرآني',
            significance: 'اسم نبي الله يوسف عليه السلام، ويعني "الله يزيد" أو "الزيادة من الله". يرمز إلى الجمال والصبر والحكمة والحلم.',
            story: 'قصته مليئة بالابتلاءات والمكائد، لكنه صبر وثبت حتى أصبح عزيز مصر، وهي قصة قرآنية عظيمة في الصبر والتوكل.'
        },
        'عائشة': {
            era: 'العصر النبوي والإسلامي',
            significance: 'اسم زوجة النبي محمد صلى الله عليه وسلم، عائشة بنت أبي بكر. يعني "الحية" أو "النامية" أو "صاحبة الحياة الطيبة". ترمز إلى الذكاء والفقه والعلم.',
            story: 'كانت من أفقه الصحابيات وأكثر رواة الحديث النبوي، وكانت مرجعاً للصحابة في الفقه والعلم.'
        },
        'خالد': {
            era: 'العصر الإسلامي المبكر',
            significance: 'اسم القائد العسكري الإسلامي خالد بن الوليد، سيف الله المسلول. يعني "الخالد" أو "الدائم". يرمز إلى القوة والشجاعة والنصر.',
            story: 'قاد جيوش المسلمين في معارك حاسمة ضد الروم والفرس ولم يهزم في معركة قط.'
        },
        'مريم': {
            era: 'العصر القديم والقرآني',
            significance: 'اسم السيدة مريم العذراء، والدة النبي عيسى عليه السلام. يعني "المُحبة" أو "المُرّة" (بمعنى الرفعة). ترمز إلى الطهر والعفة والإيمان.',
            story: 'ذكرت في القرآن الكريم كأفضل نساء العالمين، وضرب بها المثل في العفة والإيمان.'
        },
        // يمكن إضافة المزيد من الأسماء هنا
    }), []);

    const [personalityImpactTestStarted, setPersonalityImpactTestStarted] = useState(false);
    const [currentImpactQuestionIndex, setCurrentImpactQuestionIndex] = useState(0);
    const [impactScores, setImpactScores] = useState({}); // Example: { confidence: 0, leadership: 0, empathy: 0 }
    const [impactTestResult, setImpactTestResult] = useState(null);

    const personalityImpactQuestions = React.useMemo(() => [
        {
            id: 1,
            question: "عندما تُقدم نفسك، هل تشعر أن اسمك يمنحك شعوراً بالثقة والفخر؟",
            options: [
                { text: "دائماً، أشعر بقوة في اسمي.", scores: { confidence: 2, leadership: 1 } },
                { text: "أحياناً، يعتمد على السياق.", scores: { confidence: 1 } },
                { text: "نادراً، لا أربط اسمي بذلك الشعور.", scores: {} }
            ]
        },
        {
            id: 2,
            question: "عند سماع اسمك، ما هي أول صفة تخطر ببالك؟",
            options: [
                { text: "الإيجابية والبركة.", scores: { positiveOutlook: 2, empathy: 1 } },
                { text: "القوة والشجاعة.", scores: { leadership: 2, confidence: 1 } },
                { text: "العطاء والمساعدة.", scores: { empathy: 2, positiveOutlook: 1 } },
                { text: "التميز والتفرد.", scores: { confidence: 1 } }
            ]
        },
        {
            id: 3,
            question: "هل تعتقد أن اسمك يؤثر على طريقة تعامل الآخرين معك؟",
            options: [
                { text: "نعم، بشكل إيجابي.", scores: { positiveOutlook: 1 } },
                { text: "لا، ليس كثيراً.", scores: {} },
                { text: "ربما، لكنني لا ألاحظ ذلك بوضوح.", scores: {} }
            ]
        },
    ], []);

    // دالة مساعدة لتحديد فئة الشخصية بناءً على الدرجات
    const getPersonalityType = (scores) => {
        let maxScore = -1;
        let personalityTypes = [];
        const typeMapping = {
            'يامن': 'المتفائل والمبارك',
            'غوث': 'الشجاع والقائد',
            'غياث': 'المعطاء والمتعاون',
            'مستكشف': 'المفكر والمستكشف',
            'مبدع': 'المبدع والمبتكر',
            'قيادي': 'القيادي الفعال',
            'متعاون': 'المتعاون والمحبوب'
        };

        for (const type in scores) {
            if (scores[type] > maxScore) {
                maxScore = scores[type];
                personalityTypes = [typeMapping[type] || type];
            } else if (scores[type] === maxScore) {
                personalityTypes.push(typeMapping[type] || type);
            }
        }
        return personalityTypes.join(' أو ');
    };

    // تأثير لـ Countdown
    useEffect(() => {
        const calculateCountdown = () => {
            const now = new Date();
            const difference = targetDate.getTime() - now.getTime();

            if (difference <= 0) {
                setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0, message: "لقد وصل المولود المنتظر! تهانينا!" });
                return;
            }

            const days = Math.floor(difference / (1000 * 60 * 60 * 24));
            const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((difference % (1000 * 60)) / 1000);

            setCountdown({ days, hours, minutes, seconds, message: '' });
        };

        calculateCountdown();
        const timer = setInterval(calculateCountdown, 1000);

        return () => clearInterval(timer);
    }, [targetDate]);

    // دالة لعرض الرسائل المؤقتة للمستخدم (مثل إشعارات النجاح/الخطأ)
    const showTemporaryMessage = (message, type = 'info', duration = 3000) => {
        setTempMessage(message);
        setTempMessageType(type);
        const messageBox = document.getElementById('temp-message-box');
        if (messageBox) {
            messageBox.className = `fixed top-4 right-4 text-white p-3 rounded-lg shadow-lg z-50 animate-fadeInOut 
                    ${type === 'error' ? 'bg-red-600' : (type === 'success' ? 'bg-green-600' : 'bg-blue-600')}`;
        }
        setTimeout(() => setTempMessage(''), duration); // تختفي الرسالة بعد 'duration' مللي ثانية
    };

    // مصادقة Firebase والمستمعين
    const setupFirebaseAuth = useCallback(async () => {
        if (!firebaseEnabled) {
            setCurrentUser({ uid: 'mock-user-id', isAnonymous: true });
            setUserName('مستخدم مجهول');
            setUserRole('guest');
            authCheckComplete.current = true; // وضع علامة اكتمال فحص المصادقة حتى لـ Firebase الوهمي
            return;
        }

        // مستمع onAuthStateChanged للتعامل مع تغييرات حالة المستخدم
        const unsubscribeAuth = onAuthStateChanged(firebaseAuthInstance, async (user) => {
            setCurrentUser(user);
            let userInitialized = false;

            if (user) {
                // إذا كان المستخدم موجوداً (سجل الدخول)، حاول تحميل دوره/اسمه المحفوظ
                const storedRole = localStorage.getItem('userRole');
                const storedName = localStorage.getItem('userName');

                if (storedRole && storedName) {
                    setUserRole(storedRole);
                    setUserName(storedName);
                } else {
                    // الاسم/الدور الافتراضي إذا لم يتم العثور عليه في التخزين المحلي
                    setUserName(user.isAnonymous ? 'مستخدم مجهول' : 'أحد الوالدين');
                    setUserRole(user.isAnonymous ? 'guest' : 'parent');
                }
                userInitialized = true;
            } else {
                // إذا لم يكن هناك مستخدم، حاول تسجيل الدخول
                if (!initialSignInAttempted.current) {
                    initialSignInAttempted.current = true; // وضع علامة على المحاولة لمنع المحاولات المتعددة
                    try {
                        if (IS_CANVAS_ENVIRONMENT && typeof window.__initial_auth_token !== 'undefined') {
                            await signInWithCustomToken(firebaseAuthInstance, window.__initial_auth_token);
                            console.log("Signed in with custom token.");
                            // مستمع onAuthStateChanged سيُطلق مرة أخرى مع المستخدم الجديد
                        } else {
                            await signInAnonymously(firebaseAuthInstance);
                            console.log("Signed in anonymously.");
                            // مستمع onAuthStateChanged سيُطلق مرة أخرى مع المستخدم الجديد
                        }
                    } catch (error) {
                        console.error("Error during initial Firebase sign-in:", error);
                        // أظهر الرسالة فقط إذا كان خطأ Firebase حقيقي، وليس وهمياً.
                        if (firebaseEnabled) {
                            showTemporaryMessage("فشل تسجيل الدخول التلقائي. قد لا تعمل بعض الميزات.", 'error', 5000);
                        }
                        // تعيين مستخدم/دور احتياطي حتى إذا فشل تسجيل الدخول
                        setCurrentUser({ uid: 'fallback-user', isAnonymous: true });
                        setUserName('زائر');
                        setUserRole('guest');
                        userInitialized = true;
                    }
                } else {
                    // إذا تمت محاولة تسجيل الدخول الأولية ولم يكن هناك مستخدم، عيّن كزائر
                    setUserName('زائر');
                    setUserRole('guest');
                    userInitialized = true;
                }
            }
            if (userInitialized) {
                authCheckComplete.current = true; // وضع علامة اكتمال فحص المصادقة فقط بعد تحديد حالة المستخدم
            }
        });

        return () => unsubscribeAuth();
    }, []);

    // تأثير لتشغيل إعداد المصادقة عند تحميل المكون
    useEffect(() => {
        setupFirebaseAuth();
    }, [setupFirebaseAuth]);

    // مستمعي Firestore للأصوات والتعليقات
    useEffect(() => {
        // تأكد من اكتمال فحص المصادقة قبل محاولة عمليات Firestore
        if (!authCheckComplete.current || !firebaseEnabled || !currentUser) {
            // إعادة تعيين الأصوات والتعليقات إذا لم يتم تمكين Firebase أو لم يتم مصادقة المستخدم
            setVotes({ 'يامن': 0, 'غوث': 0, 'غياث': 0 });
            setComments([]);
            return;
        }

        const votesCollectionRef = collection(firestoreDbInstance, `artifacts/${appId}/public/data/nameVotes`);
        const unsubscribeVotes = onSnapshot(votesCollectionRef, (snapshot) => {
            const currentVotes = { 'يامن': 0, 'غوث': 0, 'غياث': 0 };
            snapshot.forEach((doc) => {
                const data = doc.data();
                if (data.name in currentVotes) {
                    currentVotes[data.name] = (currentVotes[data.name] || 0) + 1;
                }
            });
            setVotes(currentVotes);
        }, (error) => {
            console.error("Error fetching votes:", error);
            let errorMessage = "تعذر جلب الأصوات من Firebase. قد تكون هناك مشكلة في الإعدادات.";
            if (error.code === 'unavailable') {
                errorMessage = "تعذر الاتصال بخدمة Firebase (Firestore). يرجى التحقق من اتصال الإنترنت لديكم أو إعدادات Firebase الخاصة بالمشروع (مثل جدار الحماية أو قواعد الأمان في Firebase Console).";
            }
            showTemporaryMessage(errorMessage, 'error', 5000);
        });

        const commentsCollectionRef = collection(firestoreDbInstance, `artifacts/${appId}/public/data/nameComments`);
        const q = query(commentsCollectionRef);
        const unsubscribeComments = onSnapshot(q, (snapshot) => {
            const fetchedComments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            // فرز التعليقات حسب الطابع الزمني
            fetchedComments.sort((a, b) => (a.timestamp?.toMillis() || 0) - (b.timestamp?.toMillis() || 0));
            setComments(fetchedComments);
        }, (error) => {
            console.error("Error fetching comments:", error);
            let errorMessage = "تعذر جلب التعليقات من Firebase. قد تكون هناك مشكلة في الإعدادات.";
            if (error.code === 'unavailable') {
                errorMessage = "تعذر الاتصال بخدمة Firebase (Firestore). يرجى التحقق من اتصال الإنترنت لديكم أو إعدادات Firebase الخاصة بالمشروع (مثل جدار الحماية أو قواعد الأمان في Firebase Console).";
            }
            showTemporaryMessage(errorMessage, 'error', 5000);
        });

        return () => {
            unsubscribeVotes();
            unsubscribeComments();
        };
    }, [currentUser, firebaseEnabled, appId]); // إضافة appId كاعتمادية

    // معالج للتصويت على الاسم
    const handleVote = async (name) => {
        if (!firebaseEnabled) {
            showTemporaryMessage("وظائف Firebase غير نشطة. لا يمكن حفظ التصويت.", 'error', 5000);
            return;
        }
        if (!currentUser || currentUser.uid === 'mock-user-id' || currentUser.uid === 'fallback-user') {
            showTemporaryMessage("يرجى تسجيل الدخول أو تحديث الصفحة للمشاركة في التصويت.", 'error', 5000);
            return;
        }
        if (userRole === 'guest') {
            showTemporaryMessage("يرجى تحديد هويتكم (أب أو أم) قبل التصويت في قسم التصويت والآراء.", 'info', 5000);
            return;
        }

        const currentUserId = currentUser.uid;

        try {
            // التحقق مما إذا كان المستخدم قد صوت بالفعل لهذا الاسم لمنع الأصوات المتعددة
            const userVoteControlDocRef = doc(firestoreDbInstance, `artifacts/${appId}/users/${currentUserId}/myVoteControl`, name);
            const userVoteControlSnap = await getDoc(userVoteControlDocRef);

            if (userVoteControlSnap.exists()) {
                showTemporaryMessage(`لقد صوتّ ${userRole === 'father' ? 'الأب' : 'الأم'} بالفعل لاسم ${name}. لا يمكن التصويت مرة أخرى.`, 'info', 5000);
                return;
            }

            // سجل التصويت العام
            const publicVoteDocRef = doc(firestoreDbInstance, `artifacts/${appId}/public/data/nameVotes`, `${name}_${currentUserId}_${Date.now()}`);
            await setDoc(publicVoteDocRef, {
                name: name,
                userId: currentUserId,
                role: userRole,
                timestamp: new Date()
            });

            // سجل أن هذا المستخدم قد صوت لهذا الاسم في وثيقة التحكم الخاصة به
            await setDoc(userVoteControlDocRef, { voted: true, timestamp: new Date() });

            showTemporaryMessage(`تم التصويت لاسم ${name} بنجاح!`, 'success', 3000);
        } catch (error) {
            console.error("Error casting vote:", error);
            showTemporaryMessage("حدث خطأ أثناء التصويت. الرجاء المحاولة مرة أخرى.", 'error', 5000);
        }
    };

    // معالج لإضافة التعليقات
    const handleAddComment = async () => {
        if (!firebaseEnabled) {
            showTemporaryMessage("وظائف Firebase غير نشطة. لا يمكن حفظ التعليقات.", 'error', 5000);
            return;
        }
        if (!newComment.trim()) {
            showTemporaryMessage("التعليق لا يمكن أن يكون فارغاً.", 'error', 3000);
            return;
        }
        if (!currentUser || currentUser.uid === 'mock-user-id' || currentUser.uid === 'fallback-user') {
            showTemporaryMessage("يرجى تسجيل الدخول أو تحديث الصفحة لإضافة تعليق.", 'error', 5000);
            return;
        }
        if (userRole === 'guest') {
            showTemporaryMessage("يرجى تحديد هويتكم (أب أو أم) قبل إضافة تعليق في قسم التصويت والآراء.", 'info', 5000);
            return;
        }

        const currentUserId = currentUser.uid;

        try {
            const commentsCollectionRef = collection(firestoreDbInstance, `artifacts/${appId}/public/data/nameComments`);
            await setDoc(doc(commentsCollectionRef, `${currentUserId}_${Date.now()}`), {
                userId: currentUserId,
                userName: userName,
                role: userRole,
                text: newComment,
                timestamp: new Date()
            });
            setNewComment('');
            showTemporaryMessage("تم إضافة تعليقك بنجاح!", 'success', 3000);
        } catch (error) {
            console.error("Error adding comment:", error);
            showTemporaryMessage("حدث خطأ أثناء إضافة التعليق. الرجاء المحاولة مرة أخرى.", 'error', 5000);
        }
    };

    // معالج لتغيير دور المستخدم (أب، أم، زائر)
    const handleUserRoleChange = (role, customName = '') => {
        setUserRole(role);
        let newUserName;
        if (role === 'father') {
            newUserName = 'الأب محمد';
        } else if (role === 'mother') {
            newUserName = 'الأم خلود';
        } else if (role === 'custom') {
            newUserName = customName.trim() === '' ? 'مستخدم مجهول' : customName;
        } else {
            newUserName = 'مستخدم مجهول';
        }
        setUserName(newUserName);
        // استمرارية دور المستخدم واسمه في التخزين المحلي
        localStorage.setItem('userRole', role);
        localStorage.setItem('userName', newUserName);
        showTemporaryMessage(`تم تحديد هويتك كـ ${newUserName}.`, 'info', 3000);
    };

    // دالة لاسترداد المحتوى الثابت (البركات، الحقائق الممتعة، الأسماء المشابهة، القصائد، أغاني المهد)
    const getStaticContent = (type, name) => {
        const staticData = {
            'blessing': {
                'يامن': "تبارك الرحمن يامن، يا قرة العين ونور الدرب، لتكن حياتك مليئة باليُمن والبركات، تسعد بها القلوب وتُبهج الأرواح. اللهم اجعله مباركاً أينما كان، وسعيداً أينما حلّ، وقرة عين لوالديه.",
                'غوث': "يا غوثاً للضعيف ونصيراً للمظلوم، لتكن حياتك منارة للعون والسند، تملؤها الشجاعة والنخوة. نسأل الله أن يجعلك دائماً سبباً في إغاثة المحتاج، ومصدراً للقوة والعطاء، وسنداً لعائلتك.",
                'غياث': "يا غياث القلوب وناصر الأرواح، لتكن حياتك سلسلة من الإغاثات والعطاءات السخية، تنشر الخير والفرح حيثما ذهبت. اللهم اجعله مباركاً في سعيه، وعوناً للملهوف، ونعمة عظيمة لوالديه ووطنه.",
            },
            'funFact': {
                'يامن': "يُعتقد أن اسم يامن يأتي من 'اليُمن' ويعني البركة والخير، ويرتبط بالجانب الأيمن الذي غالباً ما يرمز للقوة والخير في الثقافة العربية.",
                'غوث': "اسم غوث من الأسماء ذات الدلالة العميقة على الإغاثة والنجدة، وقد ارتبط تاريخياً بالأشخاص الذين يقدمون العون في الشدائد.",
                'غياث': "غياث هي صيغة مبالغة من غوث، تدل على كثرة الإغاثة، ويُعرف أيضاً بالمطر الغزير الذي يأتي بالخير بعد الجفاف.",
            },
            'similarNames': {
                'يامن': "1. أمين: يعني الموثوق والجدير بالثقة.\n2. سليم: يعني الخالي من العيوب والآفات، ويوحي بالصحة والسلامة.\n3. رشاد: يعني الهداية والصلاح، ويوحي بالرشاد والتوجيه الصحيح.",
                'غوث': "1. نجدة: تعني المساعدة والإغاثة في الشدائد.\n2. معين: يعني المساعد والداعم الذي يقدم العون.\n3. منذر: يعني الذي ينذر ويحذر من الخطر، ويوحي بالشجاعة واليقظة.",
                'غياث': "1. نصير: يعني الداعم والمعين بقوة.\n2. فداء: يعني التضحية والعطاء من أجل الآخرين.\n3. أويس: اسم عربي جميل يحمل معنى الذئب الصغير، ويرتبط بالشجاعة والقوة.",
            },
            'poem': {
                'يامن': "يامن اسمٌ يجلبُ الخيرَ واليُمنْ،\nفي كلِ خطوةٍ تزهو بك الأوطانْ.\nيا نورَ العينِ، يا بسمةَ الزمنْ،\nتزدادُ فيكَ المحاسنُ والألوانْ.",
                'غوث': "يا غوثَ القلوبِ، يا درعَ السندْ،\nفي الشدائدِ أنتَ العونُ والمدَدْ.\nبالشجاعةِ تزهو، لا تخشى أحدْ،\nيا رمزَ القوةِ، يا ناصرَ الأبدْ.",
                'غياث': "غياثٌ أنتَ، كالمطرِ إذا همى،\nتُحيي النفوسَ، تُزيلُ ما تأزما.\nبالعطاءِ تُعرفُ، وبالخيرِ قد سَمَا،\nيا نجمَ العُلا، يا منْ فيكَ الكَرَمَا."
            },
            'lullaby': {
                'يامن': "يامن يا عيني، يا نوم الهنا،\nنام يا حبيبي وفي حضني اغفى.\nبكرة تكبر وتصبح أحلى،\nوالبركة في دربك تمشي على مهلِ.",
                'غوث': "يا غوثَ قلبي، يا نبض الوجود،\nنومك سلامة، يا أغلى مولود.\nبكرا تصير بطل، يا أقوى أسود،\nترفع راية العون، وتجلب كل جود.",
                'غياث': "غياث يا روحي، يا وردة الأمل،\nنومك يا روحي، ما أحلى الغزل.\nبكرا بتغيث وتفرح الكل،\nيا قمر الليالي، يا ضي الجبل."
            },
            'numerology': {
                'يامن': { value: 7, trait: 'الاستقرار والحكمة، يميل إلى التفكير العميق والسعي نحو التوازن.' },
                'غوث': { value: 5, trait: 'المغامرة والحرية، يحب التغيير ويكتشف آفاقاً جديدة.' },
                'غياث': { value: 9, trait: 'العطاء والقيادة، يمتلك روحاً إنسانية ورغبة في إحداث فرق إيجابي.' },
            },
            'nameKeywords': {
                'يامن': ['البركة', 'اليمن', 'التفاؤل', 'الهدوء', 'النجاح'],
                'غوث': ['الشجاعة', 'النجدة', 'القوة', 'المبادرة', 'الإغاثة'],
                'غياث': ['العطاء', 'المساعدة', 'القيادة', 'الإيجابية', 'الكرم'],
            },
            'phoneticAnalysis': {
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
            },
            'imageMeaning': {
                'يامن': {
                    images: [
                        "https://placehold.co/300x200/ADD8E6/FFFFFF?text=شروق+الشمس",
                        "https://placehold.co/300x200/90EE90/FFFFFF?text=حقل+زهور",
                        "https://placehold.co/300x200/FFD700/FFFFFF?text=عملة+ذهبية"
                    ],
                    interpretation: "اسم 'يامن' يوحي بالخير والبركة. شروق الشمس يرمز لبداية جديدة وتفاؤل، حقل الزهور يمثل النماء والجمال، والعملة الذهبية ترمز للرخاء واليُمن. كل هذه الصور تعكس معاني البركة والازدهار المرتبطة بالاسم."
                },
                'غوث': {
                    images: [
                        "https://placehold.co/300x200/B22222/FFFFFF?text=قلعة+قوية",
                        "https://placehold.co/300x200/4682B4/FFFFFF?text=يدان+متعاونتان",
                        "https://placehold.co/300x200/556B2F/FFFFFF?text=شجرة+عملاقة"
                    ],
                    interpretation: "اسم 'غوث' يرمز للقوة والنجدة والإغاثة. القلعة القوية تعكس الحماية والصلابة، الأيدي المتعاونة تدل على العون والمساعدة، والشجرة العملاقة توحي بالثبات والسند. هذه الصور تجسد معاني الغوث والمساندة."
                },
                'غياث': {
                    images: [
                        "https://placehold.co/300x200/008080/FFFFFF?text=مطر+غزير",
                        "https://placehold.co/300x200/8A2BE2/FFFFFF?text=نهر+جاري",
                        "https://placehold.co/300x200/FF6347/FFFFFF?text=بذرة+تنمو"
                    ],
                    interpretation: "اسم 'غياث' يوحي بالعطاء الوفير والإنقاذ، مثل المطر الذي يحيي الأرض. المطر الغزير والنهر الجاري يرمزان للفيض والكرم، والبذرة التي تنمو تدل على الأثر الإيجابي والخير المستمر. تعكس هذه الصور معاني العطاء والإغاثة الكثيرة."
                }
            },
            'aiVisualizations': {
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
            },
            'historicalNames': { // محتوى ثابت جديد لـ "دررٌ من الأسماء"
                'محمد': {
                    era: 'العصر النبوي والإسلامي',
                    significance: 'اسم نبي الإسلام محمد صلى الله عليه وسلم، يعني "المحمود" أو "كثير الحمد". من أكثر الأسماء انتشاراً في العالم الإسلامي، ويرمز إلى الرحمة والقيادة الصالحة.',
                    story: 'ولد في مكة المكرمة وتلقى الوحي ليقود الأمة الإسلامية. حياته كانت مثالاً للأخلاق الحميدة والعطاء.'
                },
                'فاطمة': {
                    era: 'العصر النبوي والإسلامي',
                    significance: 'اسم ابنة النبي محمد صلى الله عليه وسلم، السيدة فاطمة الزهراء. يعني "التي فُطمت عن الشر" أو "التي فُطمت من النار". رمز للنقاء والطهر والصبر.',
                    story: 'تعد سيدة نساء العالمين، وكانت مثالاً للابنة الصالحة والزوجة المخلصة والأم الفاضلة.'
                },
                'يوسف': {
                    era: 'العصر القديم والقرآني',
                    significance: 'اسم نبي الله يوسف عليه السلام، ويعني "الله يزيد" أو "الزيادة من الله". يرمز إلى الجمال والصبر والحكمة والحلم.',
                    story: 'قصته مليئة بالابتلاءات والمكائد، لكنه صبر وثبت حتى أصبح عزيز مصر، وهي قصة قرآنية عظيمة في الصبر والتوكل.'
                },
                'عائشة': {
                    era: 'العصر النبوي والإسلامي',
                    significance: 'اسم زوجة النبي محمد صلى الله عليه وسلم، عائشة بنت أبي بكر. يعني "الحية" أو "النامية" أو "صاحبة الحياة الطيبة". ترمز إلى الذكاء والفقه والعلم.',
                    story: 'كانت من أفقه الصحابيات وأكثر رواة الحديث النبوي، وكانت مرجعاً للصحابة في الفقه والعلم.'
                },
                'خالد': {
                    era: 'العصر الإسلامي المبكر',
                    significance: 'اسم القائد العسكري الإسلامي خالد بن الوليد، سيف الله المسلول. يعني "الخالد" أو "الدائم". يرمز إلى القوة والشجاعة والنصر.',
                    story: 'قاد جيوش المسلمين في معارك حاسمة ضد الروم والفرس ولم يهزم في معركة قط.'
                },
                'مريم': {
                    era: 'العصر القديم والقرآني',
                    significance: 'اسم السيدة مريم العذراء، والدة النبي عيسى عليه السلام. يعني "المُحبة" أو "المُرّة" (بمعنى الرفعة). ترمز إلى الطهر والعفة والإيمان.',
                    story: 'ذكرت في القرآن الكريم كأفضل نساء العالمين، وضرب بها المثل في العفة والإيمان.'
                },
            }
        };
        return staticData[type]?.[name] || `لا توجد ${type === 'blessing' ? 'بركة' : type === 'funFact' ? 'معلومة شيقة' : type === 'similarNames' ? 'أسماء مشابهة' : type === 'poem' ? 'قصيدة' : type === 'lullaby' ? 'أغنية مهد' : type === 'numerology' ? 'بيانات رقمية' : type === 'nameKeywords' ? 'كلمات مفتاحية' : type === 'phoneticAnalysis' ? 'تحليل صوتي' : type === 'imageMeaning' ? 'صور تعبيرية' : type === 'aiVisualizations' ? 'تصور بالذكاء الاصطناعي' : type === 'historicalNames' ? 'بيانات تاريخية' : ''} محددة لهذا الاسم حالياً.`;
    };

    // دالة مساعدة لربط محاور التحليل بمفاتيح البيانات
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

    // معالج لبركة الاسم
    const handleGenerateBlessing = async (name) => {
        setLoadingBlessing(true);
        setGeneratedBlessing('');
        const text = getStaticContent('blessing', name);
        setGeneratedBlessing(text);
        setLoadingBlessing(false);
    };

    // معالج لاقتراح أسماء مشابهة
    const handleGenerateSimilarNames = async (name) => {
        setLoadingSuggestions(prev => ({ ...prev, [name]: true }));
        setSuggestedNamesForCard(prev => ({ ...prev, [name]: '' }));
        const text = getStaticContent('similarNames', name);
        setSuggestedNamesForCard(prev => ({ ...prev, [name]: text }));
        setLoadingSuggestions(prev => ({ ...prev, [name]: false }));
    };

    // معالج للحقيقة الممتعة
    const handleGenerateFunFact = async (name) => {
        showTemporaryMessage(`جاري توليد معلومة شيقة عن اسم "${name}"...`, 'info', 2000);
        const text = getStaticContent('funFact', name);
        setFunFact(text);
    };

    // معالج لتوليد قصيدة
    const handleGeneratePoem = async (name) => {
        setLoadingPoem(true);
        setGeneratedPoem('');
        const text = getStaticContent('poem', name);
        setGeneratedPoem(text);
        setLoadingPoem(false);
    };

    // معالج لعرض معنى الاسم من خلال الصور
    const handleShowImageMeaning = (name) => {
        setSelectedImageMeaningName(name);
        showTemporaryMessage(`صور توضيحية لاسم "${name}" مع تفسيرها.`, 'info', 4000);
    };

    // معالج للتحليل الصوتي
    const handleShowPhoneticAnalysis = (name) => {
        setSelectedPhoneticAnalysisName(name);
        showTemporaryMessage(`تحليل صوتي لاسم "${name}".`, 'info', 4000);
    };

    // معالج لتعهد الوالدين - حفظ في التخزين المحلي
    const handlePledgeSave = () => {
        localStorage.setItem('parentsPledge', parentsPledge);
        showTemporaryMessage("تم حفظ تعهدكما بنجاح!", 'success', 3000);
    };

    // معالج لتوليد الرؤية المستقبلية
    const handleGenerateFutureVision = () => {
        if (!futureVisionNameInput.trim()) {
            showTemporaryMessage("الرجاء إدخال الاسم المقترح أولاً.", 'error', 3000);
            return;
        }

        const traitsText = futureVisionTraits.length > 0 ? `وسيحمل صفات رائعة مثل: ${futureVisionTraits.join(', ')}.` : '';
        const mottoText = futureVisionMotto.trim() ? `شعار حياته سيكون: "${futureVisionMotto}".` : '';

        const visionStatement = `
        نتخيل مستقبل طفلنا العزيز ${futureVisionNameInput}، وهو ينمو ليصبح شخصية فريدة ومؤثرة.
        نسعى لغرس قيم العطاء والشجاعة والحكمة في قلبه.
        ${traitsText}
        ${mottoText}
        نرى فيه قائداً ملهماً، وبصمة إيجابية في هذا العالم.
        ليكن نوره ساطعاً، وحياته مليئة بالإنجازات والسعادة.
        `;
        setGeneratedFutureVision(visionStatement);
        showTemporaryMessage("تم توليد رؤيتكما المستقبلية!", 'success', 3000);
    };

    // معالج لتصور المولود بالذكاء الاصطناعي (باستخدام صور ثابتة)
    const handleAIVisualization = (name) => {
        setSelectedAIVisualizationName(name);
        showTemporaryMessage(`تصور فني لجوهر اسم "${name}".`, 'info', 4000);
    };

    // دالة لتحديد فئة الخلفية بناءً على التبويب النشط لتنوع بصري
    const getBackgroundClasses = (tab) => {
        switch (tab) {
            case 'analysis': return 'bg-gradient-to-br from-blue-50 to-indigo-100';
            case 'comparison': return 'bg-gradient-to-br from-purple-50 to-pink-100';
            case 'voting': return 'bg-gradient-to-br from-green-50 to-teal-100';
            case 'games': return 'bg-gradient-to-br from-red-50 to-orange-100';
            case 'message': return 'bg-gradient-to-br from-yellow-50 to-orange-100';
            case 'recommendation': return 'bg-gradient-to-br from-red-50 to-purple-100';
            case 'futureVision': return 'bg-gradient-to-br from-indigo-50 to-blue-100';
            case 'gems': return 'bg-gradient-to-br from-gray-50 to-gray-200'; // خلفية التبويب الجديد
            default: return 'bg-gradient-to-br from-blue-50 to-indigo-100';
        }
    };

    return (
        <div className={`font-inter min-h-screen p-4 sm:p-8 flex flex-col items-center transition-colors duration-500 ${getBackgroundClasses(activeTab)}`}>
            {/* Inline style for Cairo font to ensure it compiles correctly with Tailwind.
                This is important for custom font usage in environments without direct CSS file control. */}
            <style>
              {`
                @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;700;800&display=swap');
                .font-cairo-display {
                  font-family: 'Cairo', sans-serif;
                }
                /* Custom animation for text bounce, to be reused */
                @keyframes bounce-text-once {
                    0%, 100% {
                        transform: translateY(0);
                    }
                    25% {
                        transform: translateY(-5px);
                    }
                    50% {
                        transform: translateY(0);
                    }
                    75% {
                        transform: translateY(-2px);
                    }
                }
                .animate-bounce-text-once {
                    animation: bounce-text-once 1.5s ease-in-out;
                }
                .animate-bounce-text-once-slow {
                    animation: bounce-text-once 3s ease-in-out infinite;
                }
              `}
            </style>

            {/* صندوق الرسائل المؤقتة للإشعارات (نجاح، خطأ، معلومات) */}
            {tempMessage && (
                <div id="temp-message-box" className={`fixed top-4 right-4 text-white p-3 rounded-lg shadow-lg z-50 animate-fadeInOut 
                    ${tempMessageType === 'error' ? 'bg-red-600' : (tempMessageType === 'success' ? 'bg-green-600' : 'bg-blue-600')}`}
                >
                    {tempMessage}
                </div>
            )}
            {/* تحذير إذا لم يتم تمكين Firebase (على سبيل المثال، تهيئة غير مكتملة) */}
            {!firebaseEnabled && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative mb-4 w-full max-w-xl text-center shadow-md animate-fadeIn">
                    <strong className="font-bold">تنبيه: </strong>
                    <span className="block sm:inline">وظائف حفظ البيانات (التصويت، التعليقات) **معطلة حالياً**. يرجى إعداد مشروع Firebase الخاص بكم لتفعيلها لاحقاً.</span>
                </div>
            )}

            {/* حاوية التطبيق الرئيسية مع التنسيق المشترك */}
            <div className="w-full max-w-6xl bg-white rounded-xl shadow-2xl overflow-hidden mb-8 transform transition-all duration-300">
                {/* قسم الرأس مع العنوان والوصف والعد التنازلي */}
                <header className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-6 rounded-t-xl text-center relative overflow-hidden">
                    <div className="absolute inset-0 opacity-10 bg-pattern"></div> {/* خلفية زخرفية */}
                    <h1 className="text-4xl sm:text-5xl font-extrabold mb-2 leading-tight drop-shadow-lg font-cairo-display">
                        ✨ نجم العائلة: بوابة اختيار اسم مولودكما ✨
                    </h1>
                    <p className="text-lg sm:text-xl font-light opacity-90">
                        رحلة ممتعة ومدروسة لاختيار الاسم المثالي لطفلكما يا عائلة الغزالي الكريمة.
                    </p>
                    {countdown.message ? (
                        <div className="mt-4 text-xl font-bold text-yellow-300 animate-pulse font-cairo-display">{countdown.message}</div>
                    ) : (
                        <div className="mt-4 text-sm font-light opacity-80">
                            تاريخ الميلاد المتوقع: 3 يونيو 2025
                            <div className="text-yellow-300 text-lg sm:text-xl font-bold mt-2 animate-bounce-text-once-slow font-cairo-display">
                                {`${countdown.days} يوماً, ${countdown.hours} ساعة, ${countdown.minutes} دقيقة, ${countdown.seconds} ثانية`}
                            </div>
                        </div>
                    )}
                </header>

                {/* ألسنة التنقل - تم تعديلها لاستجابة أفضل وتوسيط */}
                <nav className="bg-gradient-to-r from-blue-500 to-indigo-600 p-3 shadow-md">
                    <ul className="flex flex-wrap justify-center text-white font-semibold text-base sm:text-lg">
                        <li className={`flex-shrink-0 cursor-pointer px-3 py-2 rounded-full m-1 transition-all duration-300 ${activeTab === 'analysis' ? 'bg-white text-indigo-600 shadow-lg' : 'hover:bg-indigo-500'}`} onClick={() => setActiveTab('analysis')}>
                            تحليل الأسماء
                        </li>
                        <li className={`flex-shrink-0 cursor-pointer px-3 py-2 rounded-full m-1 transition-all duration-300 ${activeTab === 'comparison' ? 'bg-white text-indigo-600 shadow-lg' : 'hover:bg-indigo-500'}`} onClick={() => setActiveTab('comparison')}>
                            مقارنة وتقييم
                        </li>
                        <li className={`flex-shrink-0 cursor-pointer px-3 py-2 rounded-full m-1 transition-all duration-300 ${activeTab === 'voting' ? 'bg-white text-indigo-600 shadow-lg' : 'hover:bg-indigo-500'}`} onClick={() => setActiveTab('voting')}>
                            تصويت وآراء
                        </li>
                        <li className={`flex-shrink-0 cursor-pointer px-3 py-2 rounded-full m-1 transition-all duration-300 ${activeTab === 'games' ? 'bg-white text-indigo-600 shadow-lg' : 'hover:bg-indigo-500'}`} onClick={() => setActiveTab('games')}>
                            ألعاب مسلية
                        </li>
                        <li className={`flex-shrink-0 cursor-pointer px-3 py-2 rounded-full m-1 transition-all duration-300 ${activeTab === 'message' ? 'bg-white text-indigo-600 shadow-lg' : 'hover:bg-indigo-500'}`} onClick={() => setActiveTab('message')}>
                            رسالة للوالدين
                        </li>
                        <li className={`flex-shrink-0 cursor-pointer px-3 py-2 rounded-full m-1 transition-all duration-300 ${activeTab === 'recommendation' ? 'bg-white text-indigo-600 shadow-lg' : 'hover:bg-indigo-500'}`} onClick={() => setActiveTab('recommendation')}>
                            الترشيح النهائي
                        </li>
                        <li className={`flex-shrink-0 cursor-pointer px-3 py-2 rounded-full m-1 transition-all duration-300 ${activeTab === 'futureVision' ? 'bg-white text-indigo-600 shadow-lg' : 'hover:bg-indigo-500'}`} onClick={() => setActiveTab('futureVision')}>
                             رؤيتنا
                        </li>
                        <li className={`flex-shrink-0 cursor-pointer px-3 py-2 rounded-full m-1 transition-all duration-300 ${activeTab === 'gems' ? 'bg-white text-indigo-600 shadow-lg' : 'hover:bg-indigo-500'}`} onClick={() => setActiveTab('gems')}>
                            دررٌ من الأسماء
                        </li>
                    </ul>
                </nav>

                {/* منطقة المحتوى الرئيسية بناءً على التبويب النشط */}
                <main className="p-6 sm:p-8">
                    {activeTab === 'analysis' && (
                        <AnalysisTab
                            nameKeys={nameKeys}
                            nameDetails={nameDetails}
                            axes={axes}
                            expandedName={expandedName}
                            setExpandedName={setExpandedName}
                            funFact={funFact}
                            setFunFact={setFunFact}
                            handleGenerateFunFact={handleGenerateFunFact}
                            suggestedNamesForCard={suggestedNamesForCard}
                            loadingSuggestions={loadingSuggestions}
                            handleGenerateSimilarNames={handleGenerateSimilarNames}
                            generatedPoem={generatedPoem}
                            loadingPoem={loadingPoem}
                            handleGeneratePoem={handleGeneratePoem}
                            staticNumerology={getStaticContent('numerology', '')} // Pass relevant static data
                            staticNameKeywords={getStaticContent('nameKeywords', '')}
                            staticImageMeaningData={getStaticContent('imageMeaning', '')}
                            selectedImageMeaningName={selectedImageMeaningName}
                            handleShowImageMeaning={handleShowImageMeaning}
                            staticPhoneticAnalysis={getStaticContent('phoneticAnalysis', '')}
                            selectedPhoneticAnalysisName={selectedPhoneticAnalysisName}
                            handleShowPhoneticAnalysis={handleShowPhoneticAnalysis}
                            showTemporaryMessage={showTemporaryMessage}
                        />
                    )}

                    {activeTab === 'comparison' && (
                        <ComparisonTab
                            sortedComparisonData={sortedComparisonData}
                        />
                    )}

                    {activeTab === 'voting' && (
                        <VotingTab
                            nameKeys={nameKeys}
                            nameDetails={nameDetails}
                            userRole={userRole}
                            userName={userName}
                            handleUserRoleChange={handleUserRoleChange}
                            votes={votes}
                            handleVote={handleVote}
                            comments={comments}
                            newComment={newComment}
                            setNewComment={setNewComment}
                            handleAddComment={handleAddComment}
                            currentUser={currentUser}
                            showTemporaryMessage={showTemporaryMessage}
                            firebaseEnabled={firebaseEnabled}
                        />
                    )}

                    {activeTab === 'games' && (
                        <GamesTab
                            nameKeys={nameKeys}
                            quizStarted={quizStarted}
                            currentQuizQuestionIndex={currentQuizQuestionIndex}
                            quizQuestions={quizQuestions}
                            handleQuizAnswer={handleQuizAnswer}
                            quizResult={quizResult}
                            startQuiz={startQuiz}
                            resetQuiz={resetQuiz}
                            traitGameStarted={traitGameStarted}
                            currentTraitIndex={currentTraitIndex}
                            traitGameScore={traitGameScore}
                            traitGameFeedback={traitGameFeedback}
                            traitQuestions={traitQuestions}
                            startTraitGame={startTraitGame}
                            handleTraitAnswer={handleTraitAnswer}
                            resetTraitGame={resetTraitGame}
                            storyGameStarted={storyGameStarted}
                            currentStoryIndex={currentStoryIndex}
                            storyGameScore={storyGameScore}
                            storyGameFeedback={storyGameFeedback}
                            storyQuestions={storyQuestions}
                            startStoryGame={startStoryGame}
                            handleStoryAnswer={handleStoryAnswer}
                            resetStoryGame={resetStoryGame}
                            memoryGameStarted={memoryGameStarted}
                            memoryCards={memoryCards}
                            flippedCards={flippedCards}
                            matchedCards={matchedCards}
                            moves={moves}
                            memoryGameMessage={memoryGameMessage}
                            handleCardClick={handleCardClick}
                            startMemoryGame={startMemoryGame}
                            resetMemoryGame={resetMemoryGame}
                            handleDiceRoll={handleDiceRoll}
                            personalityQuizStarted={personalityQuizStarted}
                            currentPersonalityQuestionIndex={currentPersonalityQuestionIndex}
                            personalityQuestions={personalityQuestions}
                            personalityQuizScores={personalityQuizScores}
                            personalityQuizResult={personalityQuizResult}
                            setPersonalityQuizScores={setPersonalityQuizScores}
                            setPersonalityQuizResult={setPersonalityQuizResult}
                            setPersonalityQuizStarted={setPersonalityQuizStarted}
                            setCurrentPersonalityQuestionIndex={setCurrentPersonalityQuestionIndex}
                            getPersonalityType={getPersonalityType} // Pass the helper function
                            whoIsItGameStarted={whoIsItGameStarted}
                            currentWhoIsItQuestionIndex={currentWhoIsItQuestionIndex}
                            whoIsItGameScore={whoIsItGameScore}
                            whoIsItGameFeedback={whoIsItGameFeedback}
                            whoIsItQuestions={whoIsItQuestions}
                            setWhoIsItGameStarted={setWhoIsItGameStarted}
                            setCurrentWhoIsItQuestionIndex={setCurrentWhoIsItQuestionIndex}
                            setWhoIsItGameScore={setWhoIsItGameScore}
                            setWhoIsItGameFeedback={setWhoIsItGameFeedback}
                            sentenceBuilderGameStarted={sentenceBuilderGameStarted}
                            currentSentenceName={currentSentenceName}
                            userSentence={userSentence}
                            sentenceGameFeedback={sentenceGameFeedback}
                            scoreSentenceGame={scoreSentenceGame}
                            namesForSentenceGame={namesForSentenceGame}
                            setSentenceBuilderGameStarted={setSentenceBuilderGameStarted}
                            setCurrentSentenceName={setCurrentSentenceName}
                            setUserSentence={setUserSentence}
                            setSentenceGameFeedback={setSentenceGameFeedback}
                            setScoreSentenceGame={setScoreSentenceGame}
                            missingNameGameStarted={missingNameGameStarted}
                            currentMissingNamePuzzle={currentMissingNamePuzzle}
                            userMissingNameGuess={userMissingNameGuess}
                            missingNameFeedback={missingNameFeedback}
                            scoreMissingNameGame={scoreMissingNameGame}
                            missingNamePuzzles={missingNamePuzzles}
                            setMissingNameGameStarted={setMissingNameGameStarted}
                            setCurrentMissingNamePuzzle={setCurrentMissingNamePuzzle}
                            setUserMissingNameGuess={setUserMissingNameGuess}
                            setMissingNameFeedback={setMissingNameFeedback}
                            setScoreMissingNameGame={setScoreMissingNameGame}
                            categorizationGameStarted={categorizationGameStarted}
                            currentCategorizationQuestionIndex={currentCategorizationQuestionIndex}
                            categorizationGameScore={categorizationGameScore}
                            categorizationGameFeedback={categorizationGameFeedback}
                            nameCategorizationQuestions={nameCategorizationQuestions}
                            setCategorizationGameStarted={setCategorizationGameStarted}
                            setCurrentCategorizationQuestionIndex={setCurrentCategorizationQuestionIndex}
                            setCategorizationGameScore={setCategorizationGameScore}
                            setCategorizationGameFeedback={setCategorizationGameFeedback}
                            showTemporaryMessage={showTemporaryMessage}
                        />
                    )}

                    {activeTab === 'message' && (
                        <MessageTab
                            parentsPledge={parentsPledge}
                            setParentsPledge={setParentsPledge}
                            handlePledgeSave={handlePledgeSave}
                            nameDetails={nameDetails}
                            getStaticContent={getStaticContent}
                            showTemporaryMessage={showTemporaryMessage}
                        />
                    )}

                    {activeTab === 'recommendation' && (
                        <RecommendationTab
                            sortedComparisonData={sortedComparisonData}
                            showRecommendation={showRecommendation}
                            setShowRecommendation={setShowRecommendation}
                            nameDetails={nameDetails}
                            generatedBlessing={generatedBlessing}
                            loadingBlessing={loadingBlessing}
                            handleGenerateBlessing={handleGenerateBlessing}
                        />
                    )}

                    {activeTab === 'futureVision' && (
                        <FutureVisionTab
                            futureVisionNameInput={futureVisionNameInput}
                            setFutureVisionNameInput={setFutureVisionNameInput}
                            futureVisionTraits={futureVisionTraits}
                            setFutureVisionTraits={setFutureVisionTraits}
                            futureVisionMotto={futureVisionMotto}
                            setFutureVisionMotto={setFutureVisionMotto}
                            generatedFutureVision={generatedFutureVision}
                            handleGenerateFutureVision={handleGenerateFutureVision}
                            selectedAIVisualizationName={selectedAIVisualizationName}
                            handleAIVisualization={handleAIVisualization}
                            staticAIVisualizations={getStaticContent('aiVisualizations', '')}
                            showTemporaryMessage={showTemporaryMessage}
                        />
                    )}

                    {activeTab === 'gems' && (
                        <GemsTab
                            historicalNamesData={getStaticContent('historicalNames', '')}
                            selectedHistoricalName={selectedHistoricalName}
                            setSelectedHistoricalName={setSelectedHistoricalName}
                            historicalNameInput={historicalNameInput}
                            setHistoricalNameInput={setHistoricalNameInput}
                            historicalNameFact={historicalNameFact}
                            setHistoricalNameFact={setHistoricalNameFact}
                            personalityImpactTestStarted={personalityImpactTestStarted}
                            currentImpactQuestionIndex={currentImpactQuestionIndex}
                            personalityImpactQuestions={personalityImpactQuestions}
                            impactScores={impactScores}
                            impactTestResult={impactTestResult}
                            setPersonalityImpactTestStarted={setPersonalityImpactTestStarted}
                            setCurrentImpactQuestionIndex={setCurrentImpactQuestionIndex}
                            setImpactScores={setImpactScores}
                            setImpactTestResult={setImpactTestResult}
                            showTemporaryMessage={showTemporaryMessage}
                        />
                    )}
                </main>

                {/* قسم التذييل مع حقوق التطبيق وزر المشاركة */}
                <footer className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-4 text-center rounded-b-xl shadow-inner mt-8">
                    <p className="text-sm opacity-90 mb-2">صُنع بحب لعائلة الغزالي 💖</p>
                    <button
                        onClick={() => {
                            // استخدام document.execCommand('copy') لتوافق أفضل مع iframe ودعم أوسع للمتصفحات.
                            const el = document.createElement('textarea');
                            el.value = window.location.href;
                            document.body.appendChild(el);
                            el.select();
                            document.execCommand('copy');
                            document.body.removeChild(el);
                            showTemporaryMessage("تم نسخ رابط التطبيق بنجاح!", 'success', 3000);
                        }}
                        className="bg-white text-indigo-700 px-4 py-2 rounded-full text-sm font-semibold hover:bg-gray-100 transition-colors shadow-md flex items-center justify-center mx-auto"
                    >
                        <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7v4a1 1 0 001 1h4m-4 0h4m-4 0v4m0 0H9m-4 0v4m0 0H5m4 0V9m0 0H9"></path></svg>
                        <span>مشاركة الرابط</span>
                    </button>
                </footer>
            </div>
            {/* يُفترض أن Tailwind CSS CDN متاح أو يتم إدارته بواسطة بيئة التضمين.
                لـ HTML المستقل، سيكون هذا في <head>. */}
            <script src="https://cdn.tailwindcss.com"></script>
        </div>
    );
}
import React from 'react';

// هذا هو مكون AnalysisTab.js
// يرجى حفظ هذا الكود في ملف جديد باسم AnalysisTab.js في نفس مجلد App.js

// المحتوى الثابت (للتذكير، تم نقل هذه البيانات إلى App.js الرئيسي لسهولة الوصول إليها
// ولكن يمكن الاحتفاظ بها هنا إذا كان المكون سيعمل بشكل مستقل تمامًا)
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

const staticAIVisualizations = {
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


const AnalysisCard = ({ name, details, isExpanded, onExpand, funFact, handleGenerateFunFact, suggestedNamesForCard, loadingSuggestions, handleGenerateSimilarNames, generatedPoem, loadingPoem, handleGeneratePoem }) => {
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
    const axes = [
        "المعنى اللغوي", "التأثير النفسي", "الأهمية الثقافية", "الدلالة الدينية", "الشهرة والاستخدام",
        "العملية وسهولة النطق", "التوقعات المستقبلية", "القوة الشخصية المتوقعة", "التوافق مع اللقب",
        "الإيقاع الصوتي", "معاني أخرى في لغات مختلفة", "التفرد مقابل الشيوع", "القبول العام",
        "التحليل الصوتي (تقريبي)", "بدائل تفسيرية"
    ];

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
                            disabled={loadingSuggestions[name]}
                        >
                            {loadingSuggestions[name] ? (
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
    axes,
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
    showTemporaryMessage,
}) => {
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
import React, { useState, useCallback, useMemo } from 'react';

// هذا هو مكون GamesTab.js
// يرجى حفظ هذا الكود في ملف جديد باسم GamesTab.js في نفس مجلد App.js

const GamesTab = ({
    nameKeys,
    quizStarted,
    currentQuizQuestionIndex,
    quizQuestions,
    handleQuizAnswer,
    quizResult,
    startQuiz,
    resetQuiz,
    traitGameStarted,
    currentTraitIndex,
    traitGameScore,
    traitGameFeedback,
    traitQuestions,
    startTraitGame,
    handleTraitAnswer,
    resetTraitGame,
    storyGameStarted,
    currentStoryIndex,
    storyGameScore,
    storyGameFeedback,
    storyQuestions,
    startStoryGame,
    handleStoryAnswer,
    resetStoryGame,
    memoryGameStarted,
    memoryCards,
    flippedCards,
    matchedCards,
    moves,
    memoryGameMessage,
    handleCardClick,
    startMemoryGame,
    resetMemoryGame,
    handleDiceRoll,
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
    whoIsItGameStarted,
    currentWhoIsItQuestionIndex,
    whoIsItGameScore,
    whoIsItGameFeedback,
    whoIsItQuestions,
    setWhoIsItGameStarted,
    setCurrentWhoIsItQuestionIndex,
    setWhoIsItGameScore,
    setWhoIsItGameFeedback,
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
    categorizationGameStarted,
    currentCategorizationQuestionIndex,
    categorizationGameScore,
    categorizationGameFeedback,
    nameCategorizationQuestions,
    setCategorizationGameStarted,
    setCurrentCategorizationQuestionIndex,
    setCategorizationGameScore,
    setCategorizationGameFeedback,
    showTemporaryMessage,
}) => {

    // --- Helper for Personality Quiz ---
    const handlePersonalityAnswer = (scores) => {
        setPersonalityQuizScores(prevScores => {
            const newScores = { ...prevScores };
            for (const type in scores) {
                newScores[type] = (newScores[type] || 0) + scores[type];
            }
            return newScores;
        });

        if (currentPersonalityQuestionIndex < personalityQuestions.length - 1) {
            setCurrentPersonalityQuestionIndex(prev => prev + 1);
        } else {
            // Quiz finished, determine the personality type
            let maxScore = -1;
            let resultTypes = [];
            const finalScores = { ...personalityQuizScores };
            for (const type in scores) { // Add scores from the last question
                finalScores[type] = (finalScores[type] || 0) + scores[type];
            }

            for (const type in finalScores) {
                if (finalScores[type] > maxScore) {
                    maxScore = finalScores[type];
                    resultTypes = [type];
                } else if (finalScores[type] === maxScore) {
                    resultTypes.push(type);
                }
            }
            setPersonalityQuizResult(getPersonalityType(finalScores)); // Use finalScores here
        }
    };

    const resetPersonalityQuiz = () => {
        setPersonalityQuizStarted(false);
        setCurrentPersonalityQuestionIndex(0);
        setPersonalityQuizScores({
            'يامن': 0, 'غوث': 0, 'غياث': 0, 'مستكشف': 0, 'مبدع': 0, 'قيادي': 0, 'متعاون': 0
        });
        setPersonalityQuizResult(null);
    };

    // --- Helper for "Who Is It?" Game ---
    const startWhoIsItGame = () => {
        setWhoIsItGameStarted(true);
        setCurrentWhoIsItQuestionIndex(0);
        setWhoIsItGameScore(0);
        setWhoIsItGameFeedback('');
    };

    const handleWhoIsItAnswer = (selectedOption) => {
        const currentQ = whoIsItQuestions[currentWhoIsItQuestionIndex];
        if (selectedOption === currentQ.correctAnswer) {
            setWhoIsItGameScore(prev => prev + 1);
            setWhoIsItGameFeedback('إجابة صحيحة! 🎉');
        } else {
            setWhoIsItGameFeedback(`إجابة خاطئة. الصحيح هو: ${currentQ.correctAnswer} 😔`);
        }

        setTimeout(() => {
            setWhoIsItGameFeedback('');
            if (currentWhoIsItQuestionIndex < whoIsItQuestions.length - 1) {
                setCurrentWhoIsItQuestionIndex(prev => prev + 1);
            } else {
                setWhoIsItGameStarted(false); // Game over
                showTemporaryMessage(`انتهت لعبة "من صاحب هذا الاسم؟" نتيجتك: ${whoIsItGameScore + (selectedOption === currentQ.correctAnswer ? 1 : 0)} من ${whoIsItQuestions.length}`, 'info', 5000);
            }
        }, 1500);
    };

    const resetWhoIsItGame = () => {
        setWhoIsItGameStarted(false);
        setCurrentWhoIsItQuestionIndex(0);
        setWhoIsItGameScore(0);
        setWhoIsItGameFeedback('');
    };

    // --- Helper for Sentence Builder Game ---
    const startSentenceBuilderGame = () => {
        setSentenceBuilderGameStarted(true);
        const randomName = namesForSentenceGame[Math.floor(Math.random() * namesForSentenceGame.length)];
        setCurrentSentenceName(randomName);
        setUserSentence('');
        setSentenceGameFeedback('');
        setScoreSentenceGame(0); // Reset score for new game
    };

    const handleSubmitSentence = () => {
        if (!userSentence.trim().includes(currentSentenceName)) {
            setSentenceGameFeedback(`يجب أن تتضمن الجملة اسم "${currentSentenceName}". 😔`);
            showTemporaryMessage(`الجملة يجب أن تتضمن اسم "${currentSentenceName}".`, 'error', 3000);
            return;
        }

        const sentenceLength = userSentence.trim().split(' ').length;
        if (sentenceLength >= 5) {
            setScoreSentenceGame(prev => prev + 1);
            setSentenceGameFeedback('جملة رائعة! 🎉');
            showTemporaryMessage('جملة رائعة! أحسنت.', 'success', 3000);
        } else {
            setSentenceGameFeedback('جملة قصيرة. حاول أن تكون أكثر إبداعاً (على الأقل 5 كلمات). 💡');
            showTemporaryMessage('جملة قصيرة. حاول أن تكون أكثر إبداعاً (على الأقل 5 كلمات).', 'info', 4000);
        }

        setTimeout(() => {
            setSentenceGameFeedback('');
            setUserSentence('');
            const remainingNames = namesForSentenceGame.filter(name => name !== currentSentenceName);
            if (remainingNames.length > 0) {
                const nextName = remainingNames[Math.floor(Math.random() * remainingNames.length)];
                setCurrentSentenceName(nextName);
            } else {
                setSentenceBuilderGameStarted(false); // All names used
                showTemporaryMessage(`انتهت اللعبة! أحرزت ${scoreSentenceGame + (sentenceLength >= 5 ? 1 : 0)} نقطة.`, 'info', 5000);
            }
        }, 2000);
    };

    const resetSentenceBuilderGame = () => {
        setSentenceBuilderGameStarted(false);
        setCurrentSentenceName('');
        setUserSentence('');
        setSentenceGameFeedback('');
        setScoreSentenceGame(0);
    };

    // --- Helper for Missing Name Game ---
    const startMissingNameGame = () => {
        setMissingNameGameStarted(true);
        setCurrentMissingNamePuzzle(0);
        setUserMissingNameGuess('');
        setMissingNameFeedback('');
        setScoreMissingNameGame(0);
    };

    const handleSubmitMissingName = () => {
        const currentPuzzle = missingNamePuzzles[currentMissingNamePuzzle];
        if (userMissingNameGuess.trim() === currentPuzzle.answer) {
            setScoreMissingNameGame(prev => prev + 1);
            setMissingNameFeedback('صحيح! 🎉');
            showTemporaryMessage('إجابة صحيحة!', 'success', 2000);
        } else {
            setMissingNameFeedback(`خطأ. تلميح: ${currentPuzzle.hint} 😔`);
            showTemporaryMessage(`إجابة خاطئة. تلميح: ${currentPuzzle.hint}`, 'error', 3000);
        }

        setTimeout(() => {
            setMissingNameFeedback('');
            setUserMissingNameGuess('');
            if (currentMissingNamePuzzle < missingNamePuzzles.length - 1) {
                setCurrentMissingNamePuzzle(prev => prev + 1);
            } else {
                setMissingNameGameStarted(false); // Game over
                showTemporaryMessage(`انتهت اللعبة! أحرزت ${scoreMissingNameGame + (userMissingNameGuess.trim() === currentPuzzle.answer ? 1 : 0)} نقطة.`, 'info', 5000);
            }
        }, 1500);
    };

    const resetMissingNameGame = () => {
        setMissingNameGameStarted(false);
        setCurrentMissingNamePuzzle(0);
        setUserMissingNameGuess('');
        setMissingNameFeedback('');
        setScoreMissingNameGame(0);
    };

    // --- Helper for Categorization Game ---
    const startCategorizationGame = () => {
        setCategorizationGameStarted(true);
        setCurrentCategorizationQuestionIndex(0);
        setCategorizationGameScore(0);
        setCategorizationGameFeedback('');
    };

    const handleCategorizationAnswer = (selectedCategory) => {
        const currentQ = nameCategorizationQuestions[currentCategorizationQuestionIndex];
        if (selectedCategory === currentQ.correctCategory) {
            setCategorizationGameScore(prev => prev + 1);
            setCategorizationGameFeedback('إجابة صحيحة! 🎉');
            showTemporaryMessage('صحيح! أحسنت.', 'success', 2000);
        } else {
            setCategorizationGameFeedback(`إجابة خاطئة. الصحيح هو: "${currentQ.correctCategory}" 😔`);
            showTemporaryMessage(`إجابة خاطئة. الصحيح هو: "${currentQ.correctCategory}"`, 'error', 3000);
        }

        setTimeout(() => {
            setCategorizationGameFeedback('');
            if (currentCategorizationQuestionIndex < nameCategorizationQuestions.length - 1) {
                setCurrentCategorizationQuestionIndex(prev => prev + 1);
            } else {
                setCategorizationGameStarted(false); // Game over
                showTemporaryMessage(`انتهت اللعبة! أحرزت ${categorizationGameScore + (selectedCategory === currentQ.correctCategory ? 1 : 0)} نقطة.`, 'info', 5000);
            }
        }, 1500);
    };

    const resetCategorizationGame = () => {
        setCategorizationGameStarted(false);
        setCurrentCategorizationQuestionIndex(0);
        setCategorizationGameScore(0);
        setCategorizationGameFeedback('');
    };


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
                            {matchedCards.length === memoryCards.length && (
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
                            {(!currentSentenceName && sentenceBuilderGameStarted) && (
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
