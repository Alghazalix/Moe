import React, { useState, useEffect, useRef, useCallback } from 'react';
// ESLint ignore for unused imports in a development/mocking context
// eslint-disable-next-line no-unused-vars
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, collection, query, onSnapshot } from 'firebase/firestore';
import { initializeApp } from 'firebase/app';

// Define if the app is running in the Canvas environment (local development vs. Netlify deployment)
const IS_CANVAS_ENVIRONMENT = typeof window.__app_id !== 'undefined';

// Determine the appId for Firestore paths.
// This ID is crucial for Firebase Firestore paths to separate data for different apps.
const appId = IS_CANVAS_ENVIRONMENT ? window.__app_id : "alghazali-family-app-deploy";

// Determine Firebase configuration.
// This block intelligently chooses between Canvas-provided config (for Canvas preview)
// or user's hardcoded credentials (for Netlify deployment where env vars might not be direct).
const firebaseConfig = IS_CANVAS_ENVIRONMENT
    ? JSON.parse(window.__firebase_config)
    : {
        // Firebase configuration provided by the user from Firebase Console
        apiKey: "AIzaSyCTs1rIH60CtdRfBK8O8iyqMgcSJoDGuAk",
        authDomain: "alghazalifamilyapp.firebaseapp.com",
        projectId: "alghazalifamilyapp",
        storageBucket: "alghazalifamilyapp.firebasestorage.app",
        messagingSenderId: "211907541440",
        appId: "1:211907541440:web:82c313f5f17d4e91c07025",
        measurementId: "G-VJLS5W68E7" // This ID is primarily for Google Analytics, not used in this app's logic.
    };

// Initialize Firebase services conditionally
let firestoreDbInstance;
let firebaseAuthInstance;
let firebaseEnabled = false; // Flag to track if Firebase was successfully initialized

// Check if enough configuration is present to actually initialize Firebase
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
        firebaseEnabled = false; // Set flag to false if initialization fails
    }
} else {
    console.warn("Firebase configuration is incomplete for external deployment. Firebase functionality (votes, comments) will be mocked.");
}

// Mock Firebase services if real Firebase was not initialized or failed
// This ensures the app can still run without full Firebase functionality.
if (!firebaseEnabled) {
    firestoreDbInstance = {
        collection: () => ({ addDoc: () => Promise.resolve() }), // Mock addDoc
        doc: () => ({}), // Mock doc
        getDoc: () => Promise.resolve({ exists: () => false, data: () => ({}) }), // Mock getDoc
        setDoc: () => Promise.resolve(), // Mock setDoc
        onSnapshot: (ref, callback) => { // Mock onSnapshot for data fetching
            console.log("Firestore onSnapshot mocked: No real-time updates for this instance.");
            callback({ forEach: () => {}, docs: [] }); // Provide empty snapshot
            return () => console.log("Firestore onSnapshot mocked: Unsubscribed."); // Mock unsubscribe
        },
        query: (ref) => ref // Mock query
    };
    firebaseAuthInstance = {
        onAuthStateChanged: (callback) => { // Mock onAuthStateChanged for user auth status
            console.log("Firebase Auth onAuthStateChanged mocked.");
            callback({ uid: 'mock-user-id', isAnonymous: true }); // Provide a mock anonymous user
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

// Pre-defined static content for "AI-like" generation (used when real AI is not integrated).
// This ensures the app always has content for these features.
const staticBlessings = {
    'يامن': "تبارك الرحمن يامن، يا قرة العين ونور الدرب، لتكن حياتك مليئة باليُمن والبركات، تسعد بها القلوب وتُبهج الأرواح. اللهم اجعله مباركاً أينما كان، وسعيداً أينما حلّ، وقرة عين لوالديه.",
    'غوث': "يا غوثاً للضعيف ونصيراً للمظلوم، لتكن حياتك منارة للعون والسند، تملؤها الشجاعة والنخوة. نسأل الله أن يجعلك دائماً سبباً في إغاثة المحتاج، ومصدراً للقوة والعطاء، وسنداً لعائلتك.",
    'غياث': "يا غياث القلوب وناصر الأرواح، لتكن حياتك سلسلة من الإغاثات والعطاءات السخية، تنشر الخير والفرح حيثما ذهبت. اللهم اجعله مباركاً في سعيه، وعوناً للملهوف، ونعمة عظيمة لوالديه ووطنه.",
};

const staticFunFacts = {
    'يامن': "يُعتقد أن اسم يامن يأتي من 'اليُمن' ويعني البركة والخير، ويرتبط بالجانب الأيمن الذي غالباً ما يرمز للقوة والخير في الثقافة العربية.",
    'غوث': "اسم غوث من الأسماء ذات الدلالة العميقة على الإغاثة والنجدة، وقد ارتبط تاريخياً بالأشخاص الذين يقدمون العون في الشدائد.",
    'غياث': "غياث هي صيغة مبالغة من غوث، تدل على كثرة الإغاثة، ويُعرف أيضاً بالمطر الغزير الذي يأتي بالخير بعد الجفاف.",
};

const staticSimilarNames = {
    'يامن': "1. أمين: يعني الموثوق والجدير بالثقة.\n2. سليم: يعني الخالي من العيوب والآفات، ويوحي بالصحة والسلامة.\n3. رشاد: يعني الهداية والصلاح، ويوحي بالرشاد والتوجيه الصحيح.",
    'غوث': "1. نجدة: تعني المساعدة والإغاثة في الشدائد.\n2. معين: يعني المساعد والداعم الذي يقدم العون.\n3. منذر: يعني الذي ينذر ويحذر من الخطر، ويوحي بالشجاعة واليقظة.",
    'غياث': "1. نصير: يعني الداعم والمعين بقوة.\n2. فداء: يعني التضحية والعطاء من أجل الآخرين.\n3. أويس: اسم عربي جميل يحمل معنى الذئب الصغير، ويرتبط بالشجاعة والقوة.",
};

// New static content for name poems/rhymes
const staticNamePoems = {
    'يامن': "يامن اسمٌ يجلبُ الخيرَ واليُمنْ،\nفي كلِ خطوةٍ تزهو بك الأوطانْ.\nيا نورَ العينِ، يا بسمةَ الزمنْ،\nتزدادُ فيكَ المحاسنُ والألوانْ.",
    'غوث': "يا غوثَ القلوبِ، يا درعَ السندْ،\nفي الشدائدِ أنتَ العونُ والمدَدْ.\nبالشجاعةِ تزهو، لا تخشى أحدْ،\nيا رمزَ القوةِ، يا ناصرَ الأبدْ.",
    'غياث': "غياثٌ أنتَ، كالمطرِ إذا همى،\nتُحيي النفوسَ، تُزيلُ ما تأزما.\nبالعطاءِ تُعرفُ، وبالخيرِ قد سَمَا،\nيا نجمَ العُلا، يا منْ فيكَ الكَرَمَا."
};

// New static content for numerology/keywords/future vision
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

const staticLullabies = {
    'يامن': "يامن يا عيني، يا نوم الهنا،\nنام يا حبيبي وفي حضني اغفى.\nبكرة تكبر وتصبح أحلى،\nوالبركة في دربك تمشي على مهلِ.",
    'غوث': "يا غوثَ قلبي، يا نبض الوجود،\nنومك سلامة، يا أغلى مولود.\nبكرا تصير بطل، يا أقوى أسود،\nترفع راية العون، وتجلب كل جود.",
    'غياث': "غياث يا روحي، يا وردة الأمل،\nنومك يا روحي، ما أحلى الغزل.\nبكرا بتغيث وتفرح الكل،\nيا قمر الليالي، يا ضي الجبل."
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


// Main list of names used in the app for various sections
const nameKeys = ['يامن', 'غوث', 'غياث'];

function App() {
    // State variables for managing UI, data, and user interactions
    const [activeTab, setActiveTab] = useState('analysis');
    const [showRecommendation, setShowRecommendation] = useState(false);
    const [userName, setUserName] = useState('');
    const [userRole, setUserRole] = useState('guest');
    // eslint-disable-next-line no-unused-vars
    const [votes, setVotes] = useState({ // ESLint ignore: 'votes' is used in JSX, but ESLint might miss it due to dynamic property access or complex render.
        'يامن': 0,
        'غوث': 0,
        'غياث': 0
    });
    // eslint-disable-next-line no-unused-vars
    const [comments, setComments] = useState([]); // ESLint ignore: 'comments' is used in JSX to render.
    const [newComment, setNewComment] = useState('');
    const [currentUser, setCurrentUser] = useState(null);
    const [tempMessage, setTempMessage] = useState('');
    const [tempMessageType, setTempMessageType] = useState('info');

    // States for "AI-like" generation features (using static content)
    const [generatedBlessing, setGeneratedBlessing] = useState('');
    const [loadingBlessing, setLoadingBlessing] = useState(false);
    const [suggestedNamesForCard, setSuggestedNamesForCard] = useState({});
    const [loadingSuggestions, setLoadingSuggestions] = useState({});
    const [generatedPoem, setGeneratedPoem] = useState('');
    const [loadingPoem, setLoadingPoem] = useState(false);

    // States for name analysis and vibe submission
    const [expandedName, setExpandedName] = useState(null);
    const [funFact, setFunFact] = useState('');
    const [selectedImageMeaningName, setSelectedImageMeaningName] = useState(null);
    const [selectedPhoneticAnalysisName, setSelectedPhoneticAnalysisName] = useState(null);


    // Quiz Game States (Ideal Name Quiz)
    const [quizStarted, setQuizStarted] = useState(false);
    const [currentQuizQuestionIndex, setCurrentQuizQuestionIndex] = useState(0);
    const [quizScores, setQuizScores] = useState(() => {
        const initialScores = {};
        if (Array.isArray(nameKeys)) { // Defensive check
            nameKeys.forEach(name => { initialScores[name] = 0; });
        }
        return initialScores;
    });
    const [quizResult, setQuizResult] = useState(null);

    // Name-Trait Matching Game States
    const [traitGameStarted, setTraitGameStarted] = useState(false);
    const [currentTraitIndex, setCurrentTraitIndex] = useState(0);
    const [traitGameScore, setTraitGameScore] = useState(0);
    const [traitGameFeedback, setTraitGameFeedback] = useState('');
    const traitQuestions = React.useMemo(() => [
        { trait: "الشجاعة والمبادرة", correctName: "غوث" },
        { trait: "البركة والخير", correctName: "يامن" },
        { trait: "العطاء والقيادة", correctName: "غياث" },
    ], []); // Memoize traitQuestions

    // Name Story Completion Game States
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
    ], []); // Memoize storyQuestions

    // Name Memory Challenge Game States
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
    ], []); // Memoize memoryGamePairs

    // Parents' Pledge State (saved to local storage)
    const [parentsPledge, setParentsPledge] = useState(() => localStorage.getItem('parentsPledge') || '');

    // Future Vision Design State
    const [futureVisionNameInput, setFutureVisionNameInput] = useState('');
    const [futureVisionTraits, setFutureVisionTraits] = useState([]);
    const [futureVisionMotto, setFutureVisionMotto] = useState('');
    const [generatedFutureVision, setGeneratedFutureVision] = useState('');

    // AI Baby Visualization State
    const [selectedAIVisualizationName, setSelectedAIVisualizationName] = useState(null);


    // Ref to track if initial Firebase sign-in attempt has been made
    const initialSignInAttempted = useRef(false);

    // Countdown state - Using useMemo for targetDate to prevent re-creation on every render,
    // which resolves the ESLint warning related to useEffect dependencies.
    const targetDate = React.useMemo(() => new Date('2025-06-03T00:00:00'), []);
    const [countdown, setCountdown] = useState({});

    // Effect for countdown timer
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
    }, [targetDate]); // targetDate is stable due to useMemo


    // Firebase Authentication & Listeners - Using useCallback to memoize and prevent infinite loops
    const setupFirebaseAuth = useCallback(async () => {
        if (!firebaseEnabled) { // firebaseEnabled is a stable value after initial app load for the purpose of this hook
            setCurrentUser({ uid: 'mock-user-id', isAnonymous: true });
            setUserName('مستخدم مجهول');
            setUserRole('guest');
            return;
        }

        const unsubscribeAuth = onAuthStateChanged(firebaseAuthInstance, (user) => {
            setCurrentUser(user);

            if (user) {
                const storedRole = localStorage.getItem('userRole');
                const storedName = localStorage.getItem('userName');
                if (storedRole && storedName) {
                    setUserRole(storedRole);
                    setUserName(storedName);
                } else {
                    setUserName(user.isAnonymous ? 'مستخدم مجهول' : 'أحد الوالدين');
                    setUserRole(user.isAnonymous ? 'guest' : 'parent');
                }
            } else {
                if (!initialSignInAttempted.current) {
                    initialSignInAttempted.current = true;
                    if (IS_CANVAS_ENVIRONMENT && typeof window.__initial_auth_token !== 'undefined') {
                        signInWithCustomToken(firebaseAuthInstance, window.__initial_auth_token)
                            .then(userCredential => console.log("Signed in with custom token:", userCredential.user.uid))
                            .catch(error => {
                                console.error("Error signing in with custom token, falling back to anonymous:", error);
                                showTemporaryMessage("فشل تسجيل الدخول التلقائي. قد لا تعمل بعض الميزات.", 'error');
                            });
                    } else {
                        signInAnonymously(firebaseAuthInstance)
                            .then(userCredential => console.log("Signed in anonymously:", userCredential.user.uid))
                            .catch(error => {
                                console.error("Error signing in anonymously:", error);
                                showTemporaryMessage("فشل تسجيل الدخول التلقائي. قد لا تعمل بعض الميزات.", 'error');
                            });
                    }
                } else {
                    setUserName('زائر');
                    setUserRole('guest');
                }
            }
        });

        return () => unsubscribeAuth();
    }, []); // Removed 'firebaseEnabled' from dependency array as per ESLint recommendation

    // Effect to run authentication setup on component mount
    useEffect(() => {
        setupFirebaseAuth();
    }, [setupFirebaseAuth]);

    // Firestore Listeners for votes and comments
    useEffect(() => {
        if (!currentUser || !firebaseEnabled) {
            // Reset votes and comments if Firebase is not enabled or user is not authenticated
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
            showTemporaryMessage(errorMessage, 'error');
        });

        const commentsCollectionRef = collection(firestoreDbInstance, `artifacts/${appId}/public/data/nameComments`);
        const q = query(commentsCollectionRef);
        const unsubscribeComments = onSnapshot(q, (snapshot) => {
            const fetchedComments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            fetchedComments.sort((a, b) => (a.timestamp?.toMillis() || 0) - (b.timestamp?.toMillis() || 0));
            setComments(fetchedComments);
        }, (error) => {
            console.error("Error fetching comments:", error);
            let errorMessage = "تعذر جلب التعليقات من Firebase. قد تكون هناك مشكلة في الإعدادات.";
            if (error.code === 'unavailable') {
                errorMessage = "تعذر الاتصال بخدمة Firebase (Firestore). يرجى التحقق من اتصال الإنترنت لديكم أو إعدادات Firebase الخاصة بالمشروع (مثل جدار الحماية أو قواعد الأمان في Firebase Console).";
            }
            showTemporaryMessage(errorMessage, 'error');
        });

        return () => {
            unsubscribeVotes();
            unsubscribeComments();
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentUser, firebaseEnabled]); // Keep these dependencies as they genuinely affect the Firestore listeners

    // Function to show temporary messages to the user (e.g., success/error notifications)
    const showTemporaryMessage = (message, type = 'info', duration = 3000) => {
        setTempMessage(message);
        setTempMessageType(type);
        const messageBox = document.getElementById('temp-message-box');
        if (messageBox) {
            messageBox.className = `fixed top-4 right-4 text-white p-3 rounded-lg shadow-lg z-50 animate-fadeInOut 
                    ${type === 'error' ? 'bg-red-600' : (type === 'success' ? 'bg-green-600' : 'bg-blue-600')}`;
        }
        setTimeout(() => setTempMessage(''), duration); // Message disappears after 'duration' milliseconds
    };

    // Handler for name voting
    // eslint-disable-next-line no-unused-vars
    const handleVote = async (name) => { // ESLint ignore: 'handleVote' is used in JSX
        if (!firebaseEnabled) {
            showTemporaryMessage("وظائف Firebase غير نشطة. لا يمكن حفظ التصويت.", 'error');
            return;
        }
        if (!currentUser || currentUser.uid === 'mock-user-id') {
            showTemporaryMessage("يرجى تسجيل الدخول أو تحديث الصفحة للمشاركة في التصويت.", 'error');
            return;
        }
        if (userRole === 'guest') {
            showTemporaryMessage("يرجى تحديد هويتكم (أب أو أم) قبل التصويت في قسم التصويت والآراء.", 'info');
            return;
        }

        const currentUserId = currentUser.uid;

        try {
            // Check if the user has already voted for this name to prevent multiple votes
            const userVoteControlDocRef = doc(firestoreDbInstance, `artifacts/${appId}/users/${currentUserId}/myVoteControl`, name);
            const userVoteControlSnap = await getDoc(userVoteControlDocRef);

            if (userVoteControlSnap.exists()) {
                showTemporaryMessage(`لقد صوتّ ${userRole === 'father' ? 'الأب' : 'الأم'} بالفعل لاسم ${name}. لا يمكن التصويت مرة أخرى.`, 'info');
                return;
            }

            // Record the public vote
            const publicVoteDocRef = doc(firestoreDbInstance, `artifacts/${appId}/public/data/nameVotes`, `${name}_${currentUserId}_${Date.now()}`);
            await setDoc(publicVoteDocRef, {
                name: name,
                userId: currentUserId,
                role: userRole,
                timestamp: new Date()
            });

            // Record that this user has voted for this name in their private control document
            await setDoc(userVoteControlDocRef, { voted: true, timestamp: new Date() });

            showTemporaryMessage(`تم التصويت لاسم ${name} بنجاح!`, 'success');
        } catch (error) {
            console.error("Error casting vote:", error);
            showTemporaryMessage("حدث خطأ أثناء التصويت. الرجاء المحاولة مرة أخرى.", 'error');
        }
    };

    // Handler for adding comments
    // eslint-disable-next-line no-unused-vars
    const handleAddComment = async () => { // ESLint ignore: 'handleAddComment' is used in JSX
        if (!firebaseEnabled) {
            showTemporaryMessage("وظائف Firebase غير نشطة. لا يمكن حفظ التعليقات.", 'error');
            return;
        }
        if (!newComment.trim()) {
            showTemporaryMessage("التعليق لا يمكن أن يكون فارغاً.", 'error');
            return;
        }
        if (!currentUser || currentUser.uid === 'mock-user-id') {
            showTemporaryMessage("يرجى تسجيل الدخول أو تحديث الصفحة لإضافة تعليق.", 'error');
            return;
        }
        if (userRole === 'guest') {
            showTemporaryMessage("يرجى تحديد هويتكم (أب أو أم) قبل إضافة تعليق في قسم التصويت والآراء.", 'info');
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
            showTemporaryMessage("تم إضافة تعليقك بنجاح!", 'success');
        } catch (error) {
            console.error("Error adding comment:", error);
            showTemporaryMessage("حدث خطأ أثناء إضافة التعليق. الرجاء المحاولة مرة أخرى.", 'error');
        }
    };

    // Handler for changing user role (Father, Mother, Guest)
    // eslint-disable-next-line no-unused-vars
    const handleUserRoleChange = (role, customName = '') => { // ESLint ignore: 'handleUserRoleChange' is used in JSX
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
        // Persist user role and name in local storage
        localStorage.setItem('userRole', role);
        localStorage.setItem('userName', newUserName);
        showTemporaryMessage(`تم تحديد هويتك كـ ${newUserName}.`, 'info');
    };

    // Function to retrieve static content (blessings, fun facts, similar names, poems)
    const getStaticContent = (type, name) => {
        if (type === 'blessing') {
            return staticBlessings[name] || "لا توجد بركة محددة لهذا الاسم حالياً.";
        } else if (type === 'funFact') {
            return staticFunFacts[name] || "لا توجد معلومة شيقة محددة لهذا الاسم حالياً.";
        } else if (type === 'similarNames') {
            return staticSimilarNames[name] || "لا توجد أسماء مشابهة مقترحة لهذا الاسم حالياً.";
        } else if (type === 'poem') {
            return staticNamePoems[name] || "لا توجد قصيدة محددة لهذا الاسم حالياً.";
        } else if (type === 'lullaby') {
            return staticLullabies[name] || "لا توجد أغنية مهد لهذا الاسم حالياً.";
        }
        return "المحتوى غير متوفر.";
    };

    // Handlers for generating static content
    const handleGenerateBlessing = async (name) => {
        setLoadingBlessing(true);
        setGeneratedBlessing('');
        const text = getStaticContent('blessing', name);
        setGeneratedBlessing(text);
        setLoadingBlessing(false);
    };

    const handleGenerateSimilarNames = async (name) => {
        setLoadingSuggestions(prev => ({ ...prev, [name]: true }));
        setSuggestedNamesForCard(prev => ({ ...prev, [name]: '' }));
        const text = getStaticContent('similarNames', name);
        setSuggestedNamesForCard(prev => ({ ...prev, [name]: text }));
        setLoadingSuggestions(prev => ({ ...prev, [name]: false }));
    };

    const handleGenerateFunFact = async (name) => {
        showTemporaryMessage(`جاري توليد معلومة شيقة عن اسم "${name}"...`, 'info');
        const text = getStaticContent('funFact', name);
        setFunFact(text);
    };

    const handleGeneratePoem = async (name) => {
        setLoadingPoem(true);
        setGeneratedPoem('');
        const text = getStaticContent('poem', name);
        setGeneratedPoem(text);
        setLoadingPoem(false);
    };

    // Name Details (unchanged as per previous instructions, 'الغوث' is intentionally included as a name for analysis, but not in nameKeys for selection)
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
            alternativeInterpretation: 'لا يوجد اختلاف جوهري في تفسير هذا الاسم، فdلالاته على الإغاثة والعون واضحة، وهو صيغة مبالغة من "غوث" تُستخدم للدلالة على الكثرة.',
            score: 9.0
        },
    };

    // Axes for detailed analysis in the Analysis tab
    const axes = [
        "المعنى اللغوي", "التأثير النفسي", "الأهمية الثقافية", "الدلالة الدينية", "الشهرة والاستخدام",
        "العملية وسهولة النطق", "التوقعات المستقبلية", "القوة الشخصية المتوقعة", "التوافق مع اللقب",
        "الإيقاع الصوتي", "معاني أخرى في لغات مختلفة", "التفرد مقابل الشيوع", "القبول العام",
        "التحليل الصوتي (تقريبي)", "بدائل تفسيرية"
    ];

    // React component for displaying a single name analysis card
    const AnalysisCard = ({ name, details, isExpanded, onExpand }) => (
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

    // Prepare data for name comparison, sorting by score
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

    // React component for displaying final recommendations
    const Recommendation = () => {
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
        );
    };

    // Quiz Questions and Logic for the "Ideal Name Quiz" game
    const quizQuestions = React.useMemo(() => [
        {
            question: "ما هي الصفة الأهم التي تتمنونها في شخصية طفلكما المستقبلية؟",
            options: [
                { text: "التفاؤل والبركة", scores: { 'يامن': 3, 'غوث': 1, 'غياث': 2 } },
                { text: "الشجاعة والنجدة", scores: { 'يامن': 1, 'غوث': 3, 'غياث': 2 } },
                { text: "العطاء والمساعدة", scores: { 'يامن': 2, 'غوث': 2, 'غياث': 3 } },
            ]
        },
        {
            question: "أي إيقاع صوتي للأسماء تفضلون؟",
            options: [
                { text: "إيقاع هادئ ومريح", scores: { 'يامن': 3, 'غوث': 1, 'غياث': 2 } },
                { text: "إيقاع قوي ومباشر", scores: { 'يامن': 1, 'غوث': 3, 'غياث': 2 } },
                { text: "إيقاع قوي وممتع", scores: { 'يامن': 2, 'غوث': 2, 'غياث': 3 } },
            ]
        },
        {
            question: "هل تفضلون اسماً شائعاً ومألوفاً أم مميزاً وغير تقليدي؟",
            options: [
                { text: "شائع ومألوف", scores: { 'يامن': 3, 'غوث': 1, 'غياث': 2 } },
                { text: "مميز وغير تقليدي", scores: { 'يامن': 1, 'غوث': 3, 'غياث': 2 } },
                { text: "متوازن بين الشهرة والتميز", scores: { 'يامن': 2, 'غوث': 2, 'غياث': 3 } },
            ]
        },
        {
            question: "ما هو الانطباع الذي ترغبون أن يتركه اسم طفلكما؟",
            options: [
                { text: "يوحي باليُمن والخير", scores: { 'يامن': 3, 'غوث': 1, 'غياث': 2 } },
                { text: "يوحي بالإنقاذ والصلابة", scores: { 'يامن': 1, 'غوث': 3, 'غياث': 2 } },
                { text: "يوحي بالعطاء والقيادة", scores: { 'يامن': 2, 'غوث': 2, 'غياث': 3 } },
            ]
        },
    ], []); // Memoize quizQuestions

    // Function to start the quiz
    const startQuiz = () => {
        setQuizStarted(true);
        setCurrentQuizQuestionIndex(0);
        setQuizScores(() => { // Re-initialize scores based on names
            const initialScores = {};
            nameKeys.forEach(name => { initialScores[name] = 0; });
            return initialScores;
        });
        setQuizResult(null);
    };

    // Handler for quiz answer submission
    const handleQuizAnswer = (scores) => {
        setQuizScores(prevScores => {
            const newScores = { ...prevScores };
            for (const name in scores) {
                newScores[name] = (newScores[name] || 0) + scores[name]; // Defensive update
            }
            return newScores;
        });

        if (currentQuizQuestionIndex < quizQuestions.length - 1) {
            setCurrentQuizQuestionIndex(prevIndex => prevIndex + 1);
        } else {
            // Quiz finished, determine the recommended name(s) based on highest score
            let maxScore = -1;
            let recommendedNames = [];
            const currentQuizScores = quizScores; // Use the current state value directly
            for (const name in currentQuizScores) {
                if (currentQuizScores[name] > maxScore) {
                    maxScore = currentQuizScores[name];
                    recommendedNames = [name];
                } else if (currentQuizScores[name] === maxScore) {
                    recommendedNames.push(name);
                }
            }
            setQuizResult(recommendedNames);
        }
    };

    // Function to reset the quiz game
    const resetQuiz = () => {
        setQuizStarted(false);
        setCurrentQuizQuestionIndex(0);
        setQuizScores(() => { // Reset scores based on names
            const initialScores = {};
            nameKeys.forEach(name => { initialScores[name] = 0; });
            return initialScores;
        });
        setQuizResult(null);
    };

    // --- New Game 1: Name-Trait Matching Game ---
    const startTraitGame = () => {
        setTraitGameStarted(true);
        setCurrentTraitIndex(0);
        setTraitGameScore(0);
        setTraitGameFeedback('');
    };

    const handleTraitAnswer = (selectedName) => {
        const currentTrait = traitQuestions[currentTraitIndex];
        if (selectedName === currentTrait.correctName) {
            setTraitGameScore(prev => prev + 1);
            setTraitGameFeedback('إجابة صحيحة! 🎉');
        } else {
            setTraitGameFeedback(`إجابة خاطئة. الصحيح هو: ${currentTrait.correctName} 😔`);
        }

        setTimeout(() => {
            setTraitGameFeedback('');
            if (currentTraitIndex < traitQuestions.length - 1) {
                setCurrentTraitIndex(prev => prev + 1);
            } else {
                // Game over
                setTraitGameStarted(false); // End the game
            }
        }, 1500);
    };

    const resetTraitGame = () => {
        setTraitGameStarted(false);
        setCurrentTraitIndex(0);
        setTraitGameScore(0);
        setTraitGameFeedback('');
    };

    // --- New Game 2: Name Story Completion Game ---
    const startStoryGame = () => {
        setStoryGameStarted(true);
        setCurrentStoryIndex(0);
        setStoryGameScore(0);
        setStoryGameFeedback('');
    };

    const handleStoryAnswer = (selectedName) => {
        const currentStory = storyQuestions[currentStoryIndex];
        if (selectedName === currentStory.correctName) {
            setStoryGameScore(prev => prev + 1);
            setStoryGameFeedback('إجابة صحيحة! 🎉');
        } else {
            setStoryGameFeedback(`إجابة خاطئة. الصحيح هو: ${currentStory.correctName} 😔`);
        }

        setTimeout(() => {
            setStoryGameFeedback('');
            if (currentStoryIndex < storyQuestions.length - 1) {
                setCurrentStoryIndex(prev => prev + 1);
            } else {
                // Game over
                setStoryGameStarted(false); // End the game
            }
        }, 1500);
    };

    const resetStoryGame = () => {
        setStoryGameStarted(false);
        setCurrentStoryIndex(0);
        setStoryGameScore(0);
        setStoryGameFeedback('');
    };

    // --- New Game 3: Name Memory Challenge ---
    const initializeMemoryGame = useCallback(() => {
        const cards = [...memoryGamePairs, ...memoryGamePairs].map((item, index) => ({
            ...item,
            uniqueId: `${item.id}-${item.vibe}-${index}`, // Ensure unique ID for each card
            isFlipped: false,
            isMatched: false
        }));
        // Shuffle cards
        cards.sort(() => Math.random() - 0.5);
        setMemoryCards(cards);
        setFlippedCards([]);
        setMatchedCards([]);
        setMoves(0);
        setMemoryGameMessage('');
    }, [memoryGamePairs]); // Depend on memoized memoryGamePairs

    const startMemoryGame = () => {
        initializeMemoryGame();
        setMemoryGameStarted(true);
    };

    const handleCardClick = (clickedCard) => {
        if (flippedCards.length === 2 || clickedCard.isFlipped || clickedCard.isMatched) {
            return; // Don't allow clicking more than two cards or already matched/flipped cards
        }

        const newFlippedCards = [...flippedCards, clickedCard];
        setFlippedCards(newFlippedCards);
        setMoves(prev => prev + 1);

        const updatedCards = memoryCards.map(card =>
            card.uniqueId === clickedCard.uniqueId ? { ...card, isFlipped: true } : card
        );
        setMemoryCards(updatedCards);

        if (newFlippedCards.length === 2) {
            const [firstCard, secondCard] = newFlippedCards;
            if (firstCard.name === secondCard.name && firstCard.vibe === secondCard.vibe) {
                // It's a match!
                setMatchedCards(prev => [...prev, firstCard.uniqueId, secondCard.uniqueId]);
                setMemoryGameMessage('مطابقة صحيحة! 🎉');
                setTimeout(() => {
                    setFlippedCards([]); // Clear flipped cards
                    setMemoryGameMessage('');
                    if (matchedCards.length + 2 === memoryCards.length) {
                        setMemoryGameMessage(`رائع! أكملت اللعبة في ${moves + 1} نقلة!`);
                        setMemoryGameStarted(false); // End game
                    }
                }, 700);
            } else {
                // Not a match
                setMemoryGameMessage('ليست مطابقة. حاول مرة أخرى. 😔');
                setTimeout(() => {
                    setMemoryCards(prevCards =>
                        prevCards.map(card =>
                            (card.uniqueId === firstCard.uniqueId || card.uniqueId === secondCard.uniqueId)
                                ? { ...card, isFlipped: false }
                                : card
                        )
                    );
                    setFlippedCards([]); // Clear flipped cards
                    setMemoryGameMessage('');
                }, 1000);
            }
        }
    };

    const resetMemoryGame = () => {
        setMemoryGameStarted(false);
        initializeMemoryGame();
    };

    // Helper for random name selection for "Name Dice Roll"
    const handleDiceRoll = () => {
        const randomIndex = Math.floor(Math.random() * nameKeys.length);
        const randomName = nameKeys[randomIndex];
        showTemporaryMessage(`حجر النرد اختار: "${randomName}"! أتمنى له مستقبلاً باهراً!`, 'success', 4000);
    };

    // Helper for Name Meaning Through Images activity
    const handleShowImageMeaning = (name) => {
        setSelectedImageMeaningName(name);
        // Message will be shown when the component is rendered.
    };

    // Helper for Phonetic Analysis activity
    const handleShowPhoneticAnalysis = (name) => {
        setSelectedPhoneticAnalysisName(name);
        // Message will be shown when the component is rendered.
    };

    // Handler for Parents' Pledge - save to local storage
    const handlePledgeSave = () => {
        localStorage.setItem('parentsPledge', parentsPledge);
        showTemporaryMessage("تم حفظ تعهدكما بنجاح!", 'success');
    };

    // Handler for Future Vision Design
    const handleGenerateFutureVision = () => {
        if (!futureVisionNameInput.trim()) {
            showTemporaryMessage("الرجاء إدخال الاسم المقترح أولاً.", 'error');
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
        showTemporaryMessage("تم توليد رؤيتكما المستقبلية!", 'success');
    };

    // Handler for AI Baby Visualization
    const handleAIVisualization = (name) => {
        setSelectedAIVisualizationName(name);
        showTemporaryMessage(`جاري تصور مولود بذكاء اصطناعي لاسم "${name}"...`, 'info', 2000);
    };


    // Function to determine background classes based on active tab for visual variety
    const getBackgroundClasses = (tab) => {
        switch (tab) {
            case 'analysis': return 'bg-gradient-to-br from-blue-50 to-indigo-100';
            case 'comparison': return 'bg-gradient-to-br from-purple-50 to-pink-100';
            case 'voting': return 'bg-gradient-to-br from-green-50 to-teal-100';
            case 'games': return 'bg-gradient-to-br from-red-50 to-orange-100';
            case 'message': return 'bg-gradient-to-br from-yellow-50 to-orange-100';
            case 'recommendation': return 'bg-gradient-to-br from-red-50 to-purple-100';
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

            {/* Temporary message box for notifications (success, error, info) */}
            {tempMessage && (
                <div id="temp-message-box" className={`fixed top-4 right-4 text-white p-3 rounded-lg shadow-lg z-50 animate-fadeInOut 
                    ${tempMessageType === 'error' ? 'bg-red-600' : (tempMessageType === 'success' ? 'bg-green-600' : 'bg-blue-600')}`}
                >
                    {tempMessage}
                </div>
            )}
            {/* Warning if Firebase is not enabled (e.g., incomplete configuration) */}
            {!firebaseEnabled && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative mb-4 w-full max-w-xl text-center shadow-md animate-fadeIn">
                    <strong className="font-bold">تنبيه: </strong>
                    <span className="block sm:inline">وظائف حفظ البيانات (التصويت، التعليقات) **معطلة حالياً**. يرجى إعداد مشروع Firebase الخاص بكم لتفعيلها لاحقاً.</span>
                </div>
            )}
            {/* Removed the AI warning as requested */}

            {/* Main application container with shared styling */}
            <div className="w-full max-w-6xl bg-white rounded-xl shadow-2xl overflow-hidden mb-8 transform transition-all duration-300">
                {/* Header section with title, description, and countdown */}
                <header className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-6 rounded-t-xl text-center relative overflow-hidden">
                    <div className="absolute inset-0 opacity-10 bg-pattern"></div> {/* Decorative background */}
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

                {/* Navigation tabs - Adjusted for better responsiveness and centering */}
                <nav className="bg-gradient-to-r from-blue-500 to-indigo-600 p-3 shadow-md">
                    <ul className="flex flex-wrap justify-center text-white font-semibold text-base sm:text-lg">
                        <li className={`flex-shrink-0 cursor-pointer px-3 py-2 rounded-full m-1 transition-all duration-300 ${activeTab === 'analysis' ? 'bg-white text-indigo-600 shadow-lg' : 'hover:bg-indigo-500'}`} onClick={() => { setActiveTab('analysis'); setExpandedName(null); }}>
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
                    </ul>
                </nav>

                {/* Main content area based on active tab */}
                <main className="p-6 sm:p-8">
                    {activeTab === 'analysis' && (
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
                                                        showTemporaryMessage(`اسم ${name} قيمته الرقمية ${data.value} ويرتبط بصفة: ${data.trait}`, 'info');
                                                    } else {
                                                        showTemporaryMessage("لا توجد بيانات رقمية لهذا الاسم.", 'info');
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
                                                        showTemporaryMessage(`الكلمات المفتاحية لاسم ${name}: ${keywords.join(', ')}`, 'info');
                                                    } else {
                                                        showTemporaryMessage("لا توجد كلمات مفتاحية لهذا الاسم.", 'info');
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
                    )}

                    {activeTab === 'comparison' && (
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


                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-10">
                                {/* Game 1: Name-Trait Matching Game */}
                                <div className="bg-white rounded-xl shadow-lg p-6 border border-purple-200 text-center flex flex-col justify-between items-center">
                                    <h3 className="text-2xl font-bold text-purple-700 mb-4 font-cairo-display">
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

                                {/* Game 2: Name Story Completion Game */}
                                <div className="bg-white rounded-xl shadow-lg p-6 border border-teal-200 text-center flex flex-col justify-between items-center">
                                    <h3 className="text-2xl font-bold text-teal-700 mb-4 font-cairo-display">
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

                                {/* Game 3: Name Memory Challenge */}
                                <div className="bg-white rounded-xl shadow-lg p-6 border border-orange-200 text-center flex flex-col justify-between items-center">
                                    <h3 className="text-2xl font-bold text-orange-700 mb-4 font-cairo-display">
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
                            </div>
                        </section>
                    )}

                    {activeTab === 'games' && (
                        <section className="animate-fadeIn">
                            <h2 className="text-3xl font-bold text-center text-orange-700 mb-8 border-b-2 border-orange-400 pb-4 font-cairo-display">
                                ألعاب مسلية لمساعدتكما في الاختيار!
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {/* Ideal Name Quiz Card */}
                                <div className="bg-white rounded-xl shadow-lg p-6 border border-red-200 text-center flex flex-col justify-between items-center">
                                    <h3 className="text-2xl font-bold text-red-700 mb-4 font-cairo-display">
                                        اختبار الاسم المثالي
                                    </h3>
                                    <p className="text-gray-700 mb-4">
                                        أجيبي على أسئلة سريعة لنساعدكما في تحديد الاسم الأنسب لطفلكما بناءً على تفضيلاتكما!
                                    </p>
                                    {!quizStarted && (
                                        <button
                                            onClick={startQuiz}
                                            className="bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white font-bold py-3 px-6 rounded-full shadow-md transform transition-transform duration-300 hover:scale-105 focus:outline-none focus:ring-4 focus:ring-red-300"
                                        >
                                            ابدأ الاختبار!
                                        </button>
                                    )}

                                    {quizStarted && quizResult === null && (
                                        <div className="w-full mt-4 animate-fadeInUp">
                                            <p className="text-lg font-semibold text-gray-800 mb-4">
                                                السؤال {currentQuizQuestionIndex + 1} من {quizQuestions.length}:
                                            </p>
                                            <h4 className="text-xl font-bold text-indigo-700 mb-6 font-cairo-display">
                                                {quizQuestions[currentQuizQuestionIndex].question}
                                            </h4>
                                            <div className="flex flex-col space-y-3">
                                                {quizQuestions[currentQuizQuestionIndex].options.map((option, idx) => (
                                                    <button
                                                        key={idx}
                                                        onClick={() => handleQuizAnswer(option.scores)}
                                                        className="w-full bg-blue-100 text-blue-800 py-3 px-4 rounded-lg hover:bg-blue-200 transition-colors shadow-sm font-semibold"
                                                    >
                                                        {option.text}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {quizResult && (
                                        <div className="w-full mt-4 bg-green-50 p-6 rounded-lg border border-green-300 animate-fadeIn">
                                            <h4 className="text-2xl font-bold text-green-700 mb-4 font-cairo-display">
                                                نتائج الاختبار!
                                            </h4>
                                            <p className="text-lg text-gray-800 mb-4">
                                                بناءً على إجاباتكما، الاسم/الأسماء الأكثر توافقاً هو/هي:
                                            </p>
                                            <ul className="text-xl font-bold text-indigo-700 space-y-2">
                                                {quizResult.map((name, index) => (
                                                    <li key={index}>✨ {name} ✨</li>
                                                ))}
                                            </ul>
                                            <button
                                                onClick={resetQuiz}
                                                className="mt-6 bg-purple-500 text-white py-2 px-5 rounded-full hover:bg-purple-600 transition-colors shadow-md"
                                            >
                                                إعادة الاختبار
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* New Game: Name Dice Roll */}
                                <div className="bg-white rounded-xl shadow-lg p-6 border border-blue-200 text-center flex flex-col justify-between items-center">
                                    <h3 className="text-2xl font-bold text-blue-700 mb-4 font-cairo-display">
                                        🎲 حجر النرد الاسمية 🎲
                                    </h3>
                                    <p className="text-gray-700 mb-4">
                                        دحرجا النرد ليختار اسماً عشوائياً لمولودكما! (للمتعة فقط!)
                                    </p>
                                    <button
                                        onClick={handleDiceRoll}
                                        className="bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white font-bold py-3 px-6 rounded-full shadow-md transform transition-transform duration-300 hover:scale-105 focus:outline-none focus:ring-4 focus:ring-blue-300"
                                    >
                                        دحرج النرد!
                                    </button>
                                    <p className="text-sm text-gray-600 mt-4 italic">
                                        (سيظهر الاسم المختار في رسالة مؤقتة أعلى الشاشة.)
                                    </p>
                                </div>
                            </div>
                        </section>
                    )}

                    {activeTab === 'message' && (
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
                                        className="w-full p-3 border border-gray-300 rounded-lg mb-3 focus:ring-2 focus:ring-pink-400 outline-none resize-y min-h-[120px]"
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
                                                    const lullaby = getStaticContent('lullaby', name);
                                                    if (lullaby) {
                                                        showTemporaryMessage(`أغنية مهد لاسم ${name}:\n\n${lullaby}`, 'info', 7000); // Show for longer
                                                    } else {
                                                        showTemporaryMessage("لا توجد أغنية مهد لهذا الاسم.", 'info');
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
                    )}

                    {activeTab === 'recommendation' && (
                        <section className="animate-fadeIn">
                            <Recommendation /> {/* Display the main recommendation component */}

                            {/* New Activity 1: Design Your Baby's Future Vision */}
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
                                                showTemporaryMessage("تم نسخ الرؤية بنجاح!", 'success');
                                            }}
                                            className="bg-green-500 text-white py-2 px-4 rounded-full text-sm font-semibold hover:bg-green-600 transition-colors shadow-md mt-4"
                                        >
                                            نسخ الرؤية
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* New Activity 2: AI Baby Visualization */}
                            <div className="bg-white rounded-xl shadow-lg p-6 border border-teal-200 mt-8 text-center">
                                <h3 className="text-2xl font-bold text-teal-700 mb-4 border-b pb-2 font-cairo-display">
                                    👶 تصور مولودكما بالذكاء الاصطناعي 👶
                                </h3>
                                <p className="text-gray-700 mb-6">
                                    اختاروا اسماً وشاهدوا "تصوراً فنياً" لجوهر طفل يحمل هذا الاسم، مستوحى من الذكاء الاصطناعي!
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
                    )}
                </main>
                {/* Footer section with app credits and share button */}
                <footer className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-4 text-center rounded-b-xl shadow-inner mt-8">
                    <p className="text-sm opacity-90 mb-2">صُنع بحب لعائلة الغزالي 💖</p>
                    <button
                        onClick={() => {
                            // Using document.execCommand('copy') for better iframe compatibility and broader browser support.
                            const el = document.createElement('textarea');
                            el.value = window.location.href;
                            document.body.appendChild(el);
                            el.select();
                            document.execCommand('copy');
                            document.body.removeChild(el);
                            showTemporaryMessage("تم نسخ رابط التطبيق بنجاح!", 'success');
                        }}
                        className="bg-white text-indigo-700 px-4 py-2 rounded-full text-sm font-semibold hover:bg-gray-100 transition-colors shadow-md flex items-center justify-center mx-auto"
                    >
                        <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7v4a1 1 0 001 1h4m-4 0h4m-4 0v4m0 0H9m-4 0v4m0 0H5m4 0V9m0 0H9"></path></svg>
                        <span>مشاركة الرابط</span>
                    </button>
                </footer>
            </div>
            {/* Tone.js CDN script is commented out as the related feature was removed.
                If needed in the future, it should be reconsidered based on environment compatibility.
            <script src="https://cdnjs.cloudflare.com/ajax/libs/tone/14.8.49/Tone.min.js"></script>
            */}
            {/* Tailwind CSS CDN is assumed to be available or managed by the embedding environment.
                For standalone HTML, this would be in the <head>. */}
            <script src="https://cdn.tailwindcss.com"></script>
        </div>
    );
}

export default App;
