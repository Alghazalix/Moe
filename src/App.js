import React, { useState, useEffect } from 'react';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, collection, query, onSnapshot } from 'firebase/firestore';
import { initializeApp } from 'firebase/app';

// Define if the app is running in the Canvas environment (where __app_id, etc., are injected)
const IS_CANVAS_ENVIRONMENT = typeof window.__app_id !== 'undefined';

// Determine the appId for Firestore paths.
// In Canvas, it uses the injected __app_id. For external deployment, it's a fixed string.
// هذا المعرف سيستخدم في مسارات Firestore. يمكنكم تغييره لاسم مشروعكم الفعلي.
const appId = IS_CANVAS_ENVIRONMENT ? window.__app_id : "alghazali-family-app-deploy";

// Determine Firebase configuration.
// In Canvas, it uses the injected __firebase_config. For external deployment, it expects process.env variables.
const firebaseConfig = IS_CANVAS_ENVIRONMENT
    ? JSON.parse(window.__firebase_config) // Use Canvas injected config
    : {
        // These keys should ideally be set as Environment Variables in Netlify
        // e.g., REACT_APP_FIREBASE_API_KEY, REACT_APP_FIREBASE_AUTH_DOMAIN, etc.
        // If not set, they will default to undefined, and Firebase will be mocked.
        apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
        authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
        projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
        storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
        appId: process.env.REACT_APP_FIREBASE_APP_ID
    };

// Initialize Firebase services conditionally
let firestoreDbInstance;
let firebaseAuthInstance;
let firebaseEnabled = false; // Flag to track if real Firebase was successfully initialized

// Check if enough config is present to actually initialize Firebase
const shouldInitializeFirebase = IS_CANVAS_ENVIRONMENT || (
    firebaseConfig.projectId &&
    firebaseConfig.apiKey &&
    firebaseConfig.authDomain // Basic checks for a valid external config
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
        firebaseEnabled = false; // Ensure it's false on error
    }
} else {
    console.warn("Firebase configuration is incomplete for external deployment. Firebase functionality (votes, comments) will be mocked.");
}

// Mock Firebase services if real Firebase was not initialized
if (!firebaseEnabled) {
    // Mock Firestore methods to prevent errors and allow UI to render
    firestoreDbInstance = {
        collection: () => ({ // Mock collection to return a mock object
            addDoc: () => Promise.resolve(), // Mock addDoc
        }),
        doc: () => ({}), // Mock doc to return a mock object
        getDoc: () => Promise.resolve({ exists: () => false, data: () => ({}) }), // Mock getDoc
        setDoc: () => Promise.resolve(), // Mock setDoc
        onSnapshot: (ref, callback) => { // Mock onSnapshot for real-time updates
            console.log("Firestore onSnapshot mocked: No real-time updates for this instance.");
            // Immediately call callback with an empty snapshot to avoid infinite loading states in UI
            callback({ forEach: () => {}, docs: [] });
            return () => console.log("Firestore onSnapshot mocked: Unsubscribed."); // Mock unsubscribe
        },
        query: (ref) => ref // Mock query to just return the ref itself
    };
    // Mock Firebase Auth methods
    firebaseAuthInstance = {
        onAuthStateChanged: (callback) => {
            console.log("Firebase Auth onAuthStateChanged mocked.");
            // Immediately call callback with a mock anonymous user
            callback({ uid: 'mock-user-id', isAnonymous: true });
            return () => console.log("Firebase Auth onAuthStateChanged mocked: Unsubscribed.");
        },
        signInAnonymously: () => {
            console.log("Firebase Auth signInAnonymously mocked.");
            return Promise.resolve({ user: { uid: 'mock-user-id', isAnonymous: true } });
        },
        signInWithCustomToken: () => {
            console.log("Firebase Auth signInWithCustomToken mocked.");
            // For Canvas, it will still use its actual token logic
            return Promise.resolve({ user: { uid: 'mock-canvas-user', isAnonymous: false } });
        }
    };
}


const nameKeys = ['يامن', 'غوث', 'الغوث', 'غياث'];

function App() {
    const [activeTab, setActiveTab] = useState('analysis');
    const [showRecommendation, setShowRecommendation] = useState(false);
    const [userName, setUserName] = useState('');
    const [userRole, setUserRole] = useState('guest');
    const [votes, setVotes] = useState({
        'يامن': 0,
        'غوث': 0,
        'الغوث': 0,
        'غياث': 0
    });
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [currentUser, setCurrentUser] = useState(null);
    const [tempMessage, setTempMessage] = useState('');

    const [generatedBlessing, setGeneratedBlessing] = useState('');
    const [loadingBlessing, setLoadingBlessing] = useState(false);
    const [suggestedNamesForCard, setSuggestedNamesForCard] = useState({});
    const [loadingSuggestions, setLoadingSuggestions] = useState({});

    const [expandedName, setExpandedName] = useState(null);
    const [funFact, setFunFact] = useState('');
    const [nameVibeInput, setNameVibeInput] = useState('');
    const [vibeChosen, setVibeChosen] = useState({});

    // Firebase Authentication & Listeners
    useEffect(() => {
        const signIn = async () => {
            if (IS_CANVAS_ENVIRONMENT) {
                // In Canvas, use the initial auth token if available
                if (typeof window.__initial_auth_token !== 'undefined') {
                    await signInWithCustomToken(firebaseAuthInstance, window.__initial_auth_token);
                } else {
                    // Fallback to anonymous sign-in if no token (shouldn't happen in Canvas)
                    await signInAnonymously(firebaseAuthInstance);
                }
            } else if (firebaseEnabled) {
                // For external deploy, if Firebase is enabled, sign in anonymously
                await signInAnonymously(firebaseAuthInstance);
            } else {
                // If Firebase is disabled, mock a user for UI purposes
                setCurrentUser({ uid: 'mock-user-id', isAnonymous: true });
                setUserName('مستخدم مجهول');
                setUserRole('guest');
                return; // Exit if Firebase is not enabled
            }
        };

        signIn();

        // Listen for auth state changes if Firebase is enabled
        const unsubscribe = firebaseAuthInstance.onAuthStateChanged((user) => {
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
                setUserName('زائر');
                setUserRole('guest');
            }
        });
        return () => unsubscribe();
    }, [firebaseEnabled]); // Dependency on firebaseEnabled flag

    useEffect(() => {
        if (!currentUser || !firebaseEnabled) {
            // If Firebase is not enabled, ensure votes and comments are empty
            setVotes({ 'يامن': 0, 'غوث': 0, 'الغوث': 0, 'غياث': 0 });
            setComments([]);
            return;
        }

        const votesCollectionRef = collection(firestoreDbInstance, `artifacts/${appId}/public/data/nameVotes`);
        const unsubscribeVotes = onSnapshot(votesCollectionRef, (snapshot) => {
            const currentVotes = { 'يامن': 0, 'غوث': 0, 'الغوث': 0, 'غياث': 0 };
            snapshot.forEach((doc) => {
                const data = doc.data();
                if (data.name in currentVotes) {
                    currentVotes[data.name] = (currentVotes[data.name] || 0) + 1;
                }
            });
            setVotes(currentVotes);
        }, (error) => {
            console.error("Error fetching votes:", error);
            showTemporaryMessage("تعذر جلب الأصوات من Firebase. قد تكون هناك مشكلة في الإعدادات.", 'error');
        });

        const commentsCollectionRef = collection(firestoreDbInstance, `artifacts/${appId}/public/data/nameComments`);
        const q = query(commentsCollectionRef);
        const unsubscribeComments = onSnapshot(q, (snapshot) => {
            const fetchedComments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            fetchedComments.sort((a, b) => (a.timestamp?.toMillis() || 0) - (b.timestamp?.toMillis() || 0));
            setComments(fetchedComments);
        }, (error) => {
            console.error("Error fetching comments:", error);
            showTemporaryMessage("تعذر جلب التعليقات من Firebase. قد تكون هناك مشكلة في الإعدادات.", 'error');
        });

        return () => {
            unsubscribeVotes();
            unsubscribeComments();
        };
    }, [currentUser, firebaseEnabled]); // Depend on currentUser and firebaseEnabled

    const showTemporaryMessage = (message, type = 'info') => {
        setTempMessage(message);
        const color = type === 'error' ? 'bg-red-600' : (type === 'success' ? 'bg-green-600' : 'bg-blue-600');
        const messageBox = document.getElementById('temp-message-box');
        if (messageBox) {
            messageBox.className = `fixed top-4 right-4 text-white p-3 rounded-lg shadow-lg z-50 animate-fadeInOut ${color}`;
        }
        setTimeout(() => setTempMessage(''), 3000);
    };

    const handleVote = async (name) => {
        if (!firebaseEnabled) {
            showTemporaryMessage("وظائف Firebase غير نشطة. لا يمكن حفظ التصويت.", 'error');
            return;
        }
        if (!currentUser || currentUser.uid === 'mock-user-id') { // Check for mock user
            showTemporaryMessage("يرجى تسجيل الدخول أو تحديث الصفحة للمشاركة في التصويت.", 'error');
            return;
        }
        if (userRole === 'guest') {
            showTemporaryMessage("يرجى تحديد هويتكم (أب أو أم) قبل التصويت في قسم التصويت والآراء.", 'info');
            return;
        }

        const currentUserId = currentUser.uid;

        try {
            const userVoteControlDocRef = doc(firestoreDbInstance, `artifacts/${appId}/users/${currentUserId}/myVoteControl`, name);
            const userVoteControlSnap = await getDoc(userVoteControlDocRef);

            if (userVoteControlSnap.exists()) {
                showTemporaryMessage(`لقد صوتّ ${userRole === 'father' ? 'الأب' : 'الأم'} بالفعل لاسم ${name}. لا يمكن التصويت مرة أخرى.`, 'info');
                return;
            }

            const publicVoteDocRef = doc(firestoreDbInstance, `artifacts/${appId}/public/data/nameVotes`, `${name}_${currentUserId}_${Date.now()}`);
            await setDoc(publicVoteDocRef, {
                name: name,
                userId: currentUserId,
                role: userRole,
                timestamp: new Date()
            });

            await setDoc(userVoteControlDocRef, { voted: true, timestamp: new Date() });

            showTemporaryMessage(`تم التصويت لاسم ${name} بنجاح!`, 'success');
        } catch (error) {
            console.error("Error casting vote:", error);
            showTemporaryMessage("حدث خطأ أثناء التصويت. الرجاء المحاولة مرة أخرى.", 'error');
        }
    };

    const handleAddComment = async () => {
        if (!firebaseEnabled) {
            showTemporaryMessage("وظائف Firebase غير نشطة. لا يمكن حفظ التعليقات.", 'error');
            return;
        }
        if (!newComment.trim()) {
            showTemporaryMessage("التعليق لا يمكن أن يكون فارغاً.", 'error');
            return;
        }
        if (!currentUser || currentUser.uid === 'mock-user-id') { // Check for mock user
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
        localStorage.setItem('userRole', role);
        localStorage.setItem('userName', newUserName);
        showTemporaryMessage(`تم تحديد هويتك كـ ${newUserName}.`, 'info');
    };

    const generateTextWithGemini = async (prompt) => {
        const chatHistory = [];
        chatHistory.push({ role: "user", parts: [{ text: prompt }] });
        const payload = { contents: chatHistory };
        const apiKey = "";
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const result = await response.json();
            if (result.candidates && result.candidates.length > 0 &&
                result.candidates[0].content && result.candidates[0].content.parts &&
                result.candidates[0].content.parts.length > 0) {
                return result.candidates[0].content.parts[0].text;
            } else {
                console.error("Unexpected Gemini API response structure:", result);
                return "حدث خطأ في التوليد. الرجاء المحاولة مرة أخرى.";
            }
        } catch (error) {
            console.error("Error calling Gemini API:", error);
            return "تعذر التواصل مع خدمة التوليد. الرجاء التحقق من اتصال الإنترنت.";
        }
    };

    const handleGenerateBlessing = async (name, meaning) => {
        setLoadingBlessing(true);
        setGeneratedBlessing('');
        const prompt = `اكتب لي بركة قصيرة أو بضعة أبيات شعرية جميلة لمولود اسمه ${name}، مع الأخذ في الاعتبار أن معنى اسمه هو: "${meaning}". اجعلها في حدود 3-4 جمل أو بيتين شعرية، بأسلوب عربي فصيح وجميل.`;
        const text = await generateTextWithGemini(prompt);
        setGeneratedBlessing(text);
        setLoadingBlessing(false);
    };

    const handleGenerateSimilarNames = async (name, meaning) => {
        setLoadingSuggestions(prev => ({ ...prev, [name]: true }));
        setSuggestedNamesForCard(prev => ({ ...prev, [name]: '' }));
        const prompt = `اقترح 3 أسماء عربية (أولاد) أخرى ذات دلالات إيجابية مشابهة لاسم "${name}" الذي يعني "${meaning}"، مع ذكر معنى كل اسم بشكل موجز، بصيغة قائمة مرقمة (مثال: 1. اسم: معناه). لا تكتب أي مقدمة أو خاتمة، فقط القائمة.`;
        const text = await generateTextWithGemini(prompt);
        setSuggestedNamesForCard(prev => ({ ...prev, [name]: text }));
        setLoadingSuggestions(prev => ({ ...prev, [name]: false }));
    };

    const handleGenerateFunFact = async (name) => {
        showTemporaryMessage(`جاري توليد معلومة شيقة عن اسم "${name}"...`, 'info');
        const prompt = `اكتب معلومة شيقة ومختصرة (جملة واحدة) عن اسم "${name}" أو دلالاته الثقافية أو التاريخية أو اللغوية، بطريقة تجذب الانتباه.`;
        const text = await generateTextWithGemini(prompt);
        setFunFact(text);
    };

    const handleNameVibeSubmission = (name, vibe) => {
        setVibeChosen(prev => ({ ...prev, [name]: vibe }));
        showTemporaryMessage(`تم اختيار "${vibe}" لاسم ${name}!`, 'success');
    };

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
        'الغوث': {
            meaning: 'المغيث الوحيد، الملاذ، الاسم الديني الذي يطلق على صاحب المقام الروحي العالي في بعض التصوف.',
            origin: 'عربي أصيل.',
            linguistic: 'نفس معنى "غوث" ولكن بإضافة "أل" التعريف التي تجعل المعنى أكثر تحديداً وشمولاً وإطلاقاً. صوت جهوري وذو هيبة.',
            psychological: 'قد يُشعر حامله بعبء كبير لتلبية توقعات الاسم، ويُضفي هيبة قد تكون زائدة لطفل صغير. يرتبط بالسلطة المطلقة والمساعدة الشاملة التي لا تكون إلا لله.',
            cultural: 'لا يُستخدم كاسم للمواليد إطلاقاً في الثقافة العربية والإسلامية. يُستخدم كلقب أو رتبة دينية/صوفية عالية جداً، ويُعتقد أنه يُشير إلى قطب الزمان أو المرجع الروحي الأعلى في بعض الفرق الصوفية.',
            religious: 'هنا تكمن الحساسية الدينية الشديدة. "الغوث" بأل التعريف يُطلق على الله سبحانه وتعالى (المغيث). تسمية الإنسان به مباشرةً قد تُعد غير لائقة أو حتى محرمة عند بعض العلماء، لأنها تُضفي عليه صفة من صفات الألوهية أو تُشير إلى مرتبة دينية لا يجوز ادعاؤها. الأفضل والأجوز شرعاً هو "عبد الغوث" (عبد المغيث).',
            popularity: 'غير مستخدم كاسم شخصي للمواليد، بل هو لقب ديني خاص جداً.',
            practical: 'غير عملي كاسم شخصي أبداً، وقد يسبب لبساً أو إحراجاً دينياً واجتماعياً لحامله. صعوبة النطق نفسها كـ "غوث" مع إضافة "أل" التعريف.',
            futuristic: 'لن يكون مقبولاً كاسم في أي سياق مستقبلي، وقد يُساء فهمه بشكل كبير في المجتمع، مما قد يؤثر سلباً على حامله.',
            personalStrength: 'يوحي بقوة خارقة ودعم إلهي، لكنه غير مناسب للاستخدام البشري كاسم. هذا الاسم لا يمكن أن يكون معياراً للقوة الشخصية لطفل، بل قد يكون عبئاً عليه.',
            compatibility: 'لا يمكن تقييم التناسب مع اللقب لأنه ليس اسماً شخصياً مناسباً للاستخدام البشري.',
            rhythm: 'قوي ومسيطر جداً، ولكنه غير مناسب لطفل أو شخص عادي.',
            otherMeaning: 'لا يوجد.',
            uniqueness: 'فريد بمعنى أنه غير مستخدم كاسم شخصي على الإطلاق.',
            acceptance: 'غير مقبول كاسم شخصي في الثقافة الإسلامية والعربية بشكل عام، ويُعد من الأسماء التي يُنهى عن التسمية بها.',
            alternativeInterpretation: 'لا يوجد اختلاف جوهري في تفسير هذا الاسم، فدلالاته على الإغاثة والعون واضحة ومباشرة.',
            score: 2.0
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
            compatibility: 'يتناسب بشكل ممتاز مع "الغزالي" وله رنين قوي وجذاب، مما يضيف للقب جمالاً.',
            rhythm: 'إيقاع قوي وممتع، يوحي بالنشاط والحيوية والفعالية في الحركة.',
            otherMeaning: 'لا يوجد معنى سلبي في لغات أخرى معروفة، وهو ما يجعله آمناً للاستخدام.',
            uniqueness: 'متوازن بين الفرادة والشيوع، فهو ليس نادراً جداً ولكنه مميز بشكل كافٍ ليبرز حامله.',
            acceptance: 'مقبول عالمياً في الثقافة العربية والإسلامية، ولا يثير أي اعتراضات.',
            alternativeInterpretation: 'لا يوجد اختلاف جوهري في تفسير هذا الاسم، فدلالاته على الإغاثة والعون واضحة، وهو صيغة مبالغة من "غوث" تُستخدم للدلالة على الكثرة.',
            score: 9.0
        },
    };

    const axes = [
        "المعنى اللغوي", "التأثير النفسي", "الأهمية الثقافية", "الدلالة الدينية", "الشهرة والاستخدام",
        "العملية وسهولة النطق", "التوقعات المستقبلية", "القوة الشخصية المتوقعة", "التوافق مع اللقب",
        "الإيقاع الصوتي", "معاني أخرى في لغات مختلفة", "التفرد مقابل الشيوع", "القبول العام",
        "التحليل الصوتي (تقريبي)", "بدائل تفسيرية"
    ];

    const AnalysisCard = ({ name, details, isExpanded, onExpand }) => (
        <div
            className={`bg-white rounded-xl shadow-xl p-6 transform transition-all duration-500 ease-in-out
            ${isExpanded ? 'col-span-full ring-4 ring-indigo-500 z-20 md:p-8 lg:p-10' : 'hover:scale-105 hover:shadow-2xl relative cursor-pointer flex flex-col justify-between items-center text-center p-4'}
            `}
            onClick={() => onExpand(isExpanded ? null : name)}
        >
            <h3 className={`font-extrabold text-indigo-800 mb-4 ${isExpanded ? 'text-4xl sm:text-5xl border-b-4 border-indigo-400 pb-3' : 'text-2xl sm:text-3xl'}`}>
                {name}
            </h3>
            {!isExpanded ? (
                <>
                    <p className="text-gray-600 text-sm sm:text-base mb-4 flex-grow">{details.meaning}</p>
                    <button className="bg-blue-500 text-white px-4 py-2 rounded-full text-sm sm:text-base hover:bg-blue-600 transition-colors shadow-md">
                        اعرف المزيد
                    </button>
                </>
            ) : (
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
                        <h4 className="text-2xl font-bold text-purple-700 mb-4">نشاطات إضافية حول الاسم:</h4>
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
                            onClick={(e) => { e.stopPropagation(); handleGenerateSimilarNames(name, details.meaning); }}
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
                                <h4 className="font-semibold text-purple-700 mb-2 border-b border-purple-300 pb-1">أسماء مقترحة:</h4>
                                <p className="whitespace-pre-wrap">{suggestedNamesForCard[name]}</p>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );


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

    const comparisonData = Object.keys(nameDetails).map(name => ({
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

    const Recommendation = () => {
        const suitableNames = sortedComparisonData.filter(name => name.name !== 'الغوث');

        let primaryRecommendationNames = [];
        if (suitableNames.some(n => n.name === 'يامن')) {
            primaryRecommendationNames.push(suitableNames.find(n => n.name === 'يامن'));
        }
        if (suitableNames.some(n => n.name === 'غياث')) {
            primaryRecommendationNames.push(suitableNames.find(n => n.name === 'غياث'));
        }

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
                <h2 className="text-4xl font-extrabold text-purple-800 mb-6 animate-pulse-fade">ترشيحاتنا الشخصية لكما</h2>
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
                                <h3 className="text-3xl font-bold text-indigo-700 mb-4 flex items-center justify-center space-x-3">
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
                                        onClick={() => handleGenerateBlessing(rec.name, rec.meaning)}
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
                                            <h4 className="font-semibold text-teal-700 mb-2 border-b border-teal-300 pb-1">بركة لمولودكما:</h4>
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


    return (
        <div className="font-inter bg-gradient-to-b from-blue-50 to-indigo-100 min-h-screen p-4 sm:p-8 flex flex-col items-center">
            {tempMessage && (
                <div id="temp-message-box" className="fixed top-4 right-4 bg-blue-600 text-white p-3 rounded-lg shadow-lg z-50 animate-fadeInOut">
                    {tempMessage}
                </div>
            )}
            {!firebaseEnabled && ( // رسالة تنبيه إذا كانت Firebase غير مفعلة
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative mb-4 w-full max-w-xl text-center shadow-md animate-fadeIn">
                    <strong className="font-bold">تنبيه: </strong>
                    <span className="block sm:inline">وظائف حفظ البيانات (التصويت، التعليقات) غير نشطة حالياً. يرجى إعداد مشروع Firebase الخاص بكم لتفعيلها لاحقاً.</span>
                </div>
            )}
            <div className="w-full max-w-6xl bg-white rounded-xl shadow-2xl overflow-hidden mb-8 transform transition-all duration-300">
                <header className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-6 rounded-t-xl text-center relative overflow-hidden">
                    <div className="absolute inset-0 opacity-10 bg-pattern"></div>
                    <h1 className="text-4xl sm:text-5xl font-extrabold mb-2 leading-tight drop-shadow-lg font-['Cairo']">
                        ✨ نجم العائلة: بوابة اختيار اسم مولودكما ✨
                    </h1>
                    <p className="text-lg sm:text-xl font-light opacity-90">
                        رحلة ممتعة ومدروسة لاختيار الاسم المثالي لطفلكما يا عائلة الغزالي الكريمة.
                    </p>
                    <div className="mt-4 text-sm font-light opacity-80">
                        تاريخ الميلاد المتوقع: 3 يونيو 2025
                    </div>
                </header>

                <nav className="bg-gradient-to-r from-blue-500 to-indigo-600 p-3 shadow-md">
                    <ul className="flex justify-around text-white font-semibold text-base sm:text-lg">
                        <li className={`cursor-pointer px-4 py-2 rounded-full transition-all duration-300 ${activeTab === 'analysis' ? 'bg-white text-indigo-600 shadow-lg' : 'hover:bg-indigo-500'}`} onClick={() => { setActiveTab('analysis'); setExpandedName(null); }}>
                            تحليل الأسماء
                        </li>
                        <li className={`cursor-pointer px-4 py-2 rounded-full transition-all duration-300 ${activeTab === 'comparison' ? 'bg-white text-indigo-600 shadow-lg' : 'hover:bg-indigo-500'}`} onClick={() => setActiveTab('comparison')}>
                            مقارنة وتقييم
                        </li>
                        <li className={`cursor-pointer px-4 py-2 rounded-full transition-all duration-300 ${activeTab === 'voting' ? 'bg-white text-indigo-600 shadow-lg' : 'hover:bg-indigo-500'}`} onClick={() => setActiveTab('voting')}>
                            تصويت وآراء
                        </li>
                        <li className={`cursor-pointer px-4 py-2 rounded-full transition-all duration-300 ${activeTab === 'message' ? 'bg-white text-indigo-600 shadow-lg' : 'hover:bg-indigo-500'}`} onClick={() => setActiveTab('message')}>
                            رسالة للوالدين
                        </li>
                        <li className={`cursor-pointer px-4 py-2 rounded-full transition-all duration-300 ${activeTab === 'recommendation' ? 'bg-white text-indigo-600 shadow-lg' : 'hover:bg-indigo-500'}`} onClick={() => setActiveTab('recommendation')}>
                            الترشيح النهائي
                        </li>
                    </ul>
                </nav>

                <main className="p-6 sm:p-8">
                    {activeTab === 'analysis' && (
                        <section className="animate-fadeIn">
                            <h2 className="text-3xl font-bold text-center text-indigo-700 mb-8 border-b-2 border-indigo-400 pb-4">
                                تحليل شامل لأسماء: <span className="text-purple-600">يامن، غوث، الغوث، غياث</span>
                            </h2>
                            <p className="text-center text-gray-600 italic mb-6">
                                (انقر على أي اسم أدناه لعرض تحليله المفصل.)
                            </p>

                            <div className={`grid ${expandedName ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'} gap-6`}>
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
                        </section>
                    )}

                    {activeTab === 'comparison' && (
                        <section className="animate-fadeIn">
                            <h2 className="text-3xl font-bold text-center text-indigo-700 mb-8 border-b-2 border-indigo-400 pb-4">
                                مقارنة وتقييم الأسماء
                            </h2>
                            <p className="text-center text-gray-600 italic mb-6">
                                (مقارنة سريعة لأبرز الجوانب بين الأسماء.)
                            </p>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {sortedComparisonData.map((nameComp, index) => (
                                    <div key={nameComp.name} className="bg-white rounded-xl shadow-lg p-6 border border-purple-200 flex flex-col items-center text-center transform transition-transform duration-300 hover:scale-105 hover:shadow-2xl">
                                        <h3 className="text-3xl font-bold text-indigo-800 mb-4">{nameComp.name}</h3>
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

                            <div className="bg-white rounded-xl shadow-lg p-6 border border-teal-200 mt-8">
                                <h3 className="text-2xl font-bold text-teal-700 mb-4 border-b pb-2">
                                    نشاط: أي اسم يوحي بأي مشاعر؟
                                </h3>
                                <p className="text-gray-700 mb-4">
                                    اختارا الاسم الذي تشعران أنه ينسجم مع كل من هذه المشاعر أو الصفات:
                                </p>
                                <div className="space-y-4">
                                    {['القوة والشجاعة', 'الهدوء والسكينة', 'البركة والخير', 'العطاء والمساعدة'].map(vibe => (
                                        <div key={vibe} className="flex flex-col sm:flex-row items-center sm:items-baseline">
                                            <span className="font-semibold text-indigo-600 w-full sm:w-1/3 mb-2 sm:mb-0">{vibe}:</span>
                                            <div className="flex-grow flex flex-wrap gap-2 justify-center sm:justify-start">
                                                {nameKeys.map(name => (
                                                    <button
                                                        key={`${vibe}-${name}`}
                                                        onClick={() => handleNameVibeSubmission(name, vibe)}
                                                        className={`px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${vibeChosen[name] === vibe ? 'bg-indigo-600 text-white shadow-lg' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                                                    >
                                                        {name}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <p className="text-sm text-gray-600 italic mt-4">
                                    (هذا النشاط لمجرد المتعة والتفكير في دلالات الأسماء.)
                                </p>
                            </div>
                        </section>
                    )}

                    {activeTab === 'voting' && (
                        <section className="animate-fadeIn">
                            <h2 className="text-3xl font-bold text-center text-indigo-700 mb-8 border-b-2 border-indigo-400 pb-4">
                                تصويت الوالدين وآراؤهم
                            </h2>
                            {currentUser && firebaseEnabled && (
                                <p className="text-center text-gray-600 mb-4">
                                    معرف المستخدم الخاص بك: <span className="font-mono text-sm bg-gray-200 p-1 rounded">{currentUser.uid.substring(0, 8)}...</span>
                                </p>
                            )}
                             {!firebaseEnabled && (
                                <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded-lg relative mb-4 w-full text-center shadow-md">
                                    <span className="block sm:inline">وظائف التصويت والتعليق غير نشطة. يرجى إعداد Firebase لتفعيلها.</span>
                                </div>
                            )}

                            <div className="bg-white rounded-xl shadow-lg p-6 border border-teal-300 mb-8 text-center">
                                <h3 className="text-2xl font-bold text-teal-700 mb-4">من يصوّت؟</h3>
                                <div className="flex flex-wrap justify-center gap-4 mb-4">
                                    <label className="flex items-center space-x-2 cursor-pointer bg-blue-100 p-3 rounded-lg hover:bg-blue-200 transition-colors shadow">
                                        <input
                                            type="radio"
                                            name="userRole"
                                            value="father"
                                            checked={userRole === 'father'}
                                            onChange={() => handleUserRoleChange('father')}
                                            className="form-radio h-5 w-5 text-blue-600"
                                            disabled={!firebaseEnabled}
                                        />
                                        <span className="text-lg font-semibold text-blue-800">👨‍🦰 الأب (محمد)</span>
                                    </label>
                                    <label className="flex items-center space-x-2 cursor-pointer bg-pink-100 p-3 rounded-lg hover:bg-pink-200 transition-colors shadow">
                                        <input
                                            type="radio"
                                            name="userRole"
                                            value="mother"
                                            checked={userRole === 'mother'}
                                            onChange={() => handleUserRoleChange('mother')}
                                            className="form-radio h-5 w-5 text-pink-600"
                                            disabled={!firebaseEnabled}
                                        />
                                        <span className="text-lg font-semibold text-pink-800">👩‍🦰 الأم (خلود)</span>
                                    </label>
                                    <label className="flex items-center space-x-2 cursor-pointer bg-gray-100 p-3 rounded-lg hover:bg-gray-200 transition-colors shadow">
                                        <input
                                            type="radio"
                                            name="userRole"
                                            value="guest"
                                            checked={userRole === 'guest'}
                                            onChange={() => handleUserRoleChange('guest')}
                                            className="form-radio h-5 w-5 text-gray-600"
                                            disabled={!firebaseEnabled}
                                        />
                                        <span className="text-lg font-semibold text-gray-800">👤 زائر (مجهول)</span>
                                    </label>
                                    {userRole === 'guest' && (
                                        <div className="w-full md:w-auto mt-4">
                                            <input
                                                type="text"
                                                className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-purple-500 focus:border-purple-500"
                                                placeholder="أدخل اسمك (اختياري)"
                                                value={userName === 'مستخدم مجهول' ? '' : userName}
                                                onChange={(e) => handleUserRoleChange('custom', e.target.value)}
                                                disabled={!firebaseEnabled}
                                            />
                                        </div>
                                    )}
                                </div>
                                <p className="text-sm text-gray-600 mt-2">
                                    (سيتم حفظ اختياركما لتسهيل التصويت والتعليق لاحقاً.)
                                </p>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                                {Object.keys(nameDetails).map(name => (
                                    <div key={name} className="bg-white rounded-xl shadow-lg p-5 text-center transform transition-transform duration-300 hover:scale-105 hover:shadow-xl border border-indigo-200 flex flex-col justify-between">
                                        <div>
                                            <h3 className="text-2xl font-bold text-indigo-800 mb-3">{name}</h3>
                                            <p className="text-gray-600 mb-4 text-sm">{nameDetails[name].meaning}</p>
                                        </div>
                                        <div>
                                            <button
                                                onClick={() => handleVote(name)}
                                                className="w-full bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 text-white font-bold py-3 px-6 rounded-full shadow-md transform transition-transform duration-300 hover:scale-105 focus:outline-none focus:ring-4 focus:ring-green-300 mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
                                                disabled={!firebaseEnabled}
                                            >
                                                صوّت لهذا الاسم
                                            </button>
                                            <p className="mt-4 text-xl font-bold text-blue-700">
                                                الأصوات: <span className="text-3xl text-indigo-700">{votes[name]}</span>
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="bg-white rounded-xl shadow-lg p-6 border border-teal-200 mt-8">
                                <h3 className="text-2xl font-bold text-teal-700 mb-4 border-b pb-2">
                                    مخطط الأصوات الحالي
                                </h3>
                                <div className="flex flex-col space-y-4">
                                    {Object.keys(votes).map(name => {
                                        const totalVotes = Object.values(votes).reduce((sum, current) => sum + current, 0);
                                        const percentage = totalVotes > 0 ? (votes[name] / totalVotes) * 100 : 0;
                                        return (
                                            <div key={name} className="flex items-center">
                                                <span className="w-24 text-right font-semibold text-gray-700">{name}:</span>
                                                <div className="flex-grow bg-gray-200 rounded-full h-8 ml-4 relative overflow-hidden">
                                                    <div
                                                        className="bg-gradient-to-r from-blue-400 to-indigo-600 h-full rounded-full transition-all duration-500 ease-out flex items-center justify-end pr-2"
                                                        style={{ width: `${percentage}%` }}
                                                    >
                                                        <span className="text-white font-bold text-sm">
                                                            {percentage.toFixed(0)}%
                                                        </span>
                                                    </div>
                                                    {percentage < 50 && (
                                                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-700 font-bold text-sm">
                                                            {votes[name]} صوت
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                                <p className="text-sm text-gray-600 mt-4 text-center">
                                    العدد الكلي للأصوات: <span className="font-bold">{Object.values(votes).reduce((sum, current) => sum + current, 0)}</span>
                                </p>
                            </div>

                            <div className="bg-white rounded-xl shadow-lg p-6 border border-purple-200 mt-8">
                                <h3 className="text-2xl font-bold text-purple-700 mb-4 border-b pb-2">
                                    شاركا آراءكما
                                </h3>
                                <textarea
                                    className="w-full p-3 border border-gray-300 rounded-lg mb-3 focus:ring-2 focus:ring-purple-400 outline-none resize-y min-h-[100px] disabled:opacity-50 disabled:bg-gray-100"
                                    placeholder="اكتبي أو اكتبي رأيكما حول الأسماء أو عملية الاختيار..."
                                    value={newComment}
                                    onChange={(e) => setNewComment(e.target.value)}
                                    disabled={!firebaseEnabled}
                                ></textarea>
                                <button
                                    onClick={handleAddComment}
                                    className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white font-bold py-3 px-6 rounded-full shadow-md transform transition-transform duration-300 hover:scale-105 focus:outline-none focus:ring-4 focus:ring-purple-300 disabled:opacity-50 disabled:cursor-not-allowed"
                                    disabled={!firebaseEnabled}
                                >
                                    إضافة رأي
                                </button>
                                <div className="mt-6 space-y-4">
                                    {comments.length > 0 ? (
                                        comments.map((comment) => (
                                            <div key={comment.id} className="bg-gray-100 p-4 rounded-lg shadow-sm border-l-4 border-purple-300 animate-fadeIn">
                                                <p className="font-semibold text-indigo-600">
                                                    {comment.userName} ({comment.role === 'father' ? 'الأب' : (comment.role === 'mother' ? 'الأم' : 'زائر')}):
                                                </p>
                                                <p className="text-gray-800 mt-1">{comment.text}</p>
                                                {comment.timestamp && (
                                                    <p className="text-xs text-gray-500 mt-2 text-left">
                                                        {new Date(comment.timestamp.toDate()).toLocaleString('ar-EG', { dateStyle: 'medium', timeStyle: 'short' })}
                                                    </p>
                                                )}
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-center text-gray-500 italic">لا توجد آراء حتى الآن. كونا أول من يشارك!</p>
                                    )}
                                </div>
                            </div>

                            <div className="bg-white rounded-xl shadow-lg p-6 border border-blue-200 mt-8">
                                <h3 className="text-2xl font-bold text-blue-700 mb-4 border-b pb-2">
                                    💭 رؤيتكما لاسم المستقبل:
                                </h3>
                                <p className="text-gray-700 mb-4">
                                    تخيلوا معنا: لو اخترتما اسماً لطفلكما، كيف تتصوران حياته المستقبلية بهذا الاسم؟ شاركا رؤيتكما:
                                </p>
                                <textarea
                                    className="w-full p-3 border border-gray-300 rounded-lg mb-3 focus:ring-2 focus:ring-blue-400 outline-none resize-y min-h-[80px] disabled:opacity-50 disabled:bg-gray-100"
                                    placeholder="أتخيل أن [الاسم] سيكون..."
                                    value={nameVibeInput}
                                    onChange={(e) => setNameVibeInput(e.target.value)}
                                    disabled={!firebaseEnabled}
                                ></textarea>
                                <button
                                    onClick={() => showTemporaryMessage("شكراً لمشاركتكما رؤيتكما المستقبلية الملهمة!", 'success')}
                                    className="w-full bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white font-bold py-3 px-6 rounded-full shadow-md transform transition-transform duration-300 hover:scale-105 focus:outline-none focus:ring-4 focus:ring-blue-300 disabled:opacity-50 disabled:cursor-not-allowed"
                                    disabled={!firebaseEnabled}
                                >
                                    شارك الرؤية
                                </button>
                            </div>
                        </section>
                    )}

                    {activeTab === 'message' && (
                        <section className="animate-fadeIn">
                            <h2 className="text-3xl font-bold text-center text-indigo-700 mb-8 border-b-2 border-indigo-400 pb-4">
                                رسالة إلى الوالدين العزيزين محمد وخلود الغزالي
                            </h2>
                            <div className="bg-white p-6 rounded-lg shadow-lg border border-teal-200">
                                <h3 className="text-2xl font-bold text-teal-700 mb-4">أ. تمهيد علمي: قوة الاسم وتأثيره</h3>
                                <p className="text-gray-700 leading-relaxed mb-6">
                                    يا محمد وخلود، إنّ اختيار اسم مولودكما ليس مجرد قرار عابر، بل هو استثمار في هويته المستقبلية. تشير الدراسات في علم النفس الاجتماعي وعلم الدلالة اللغوية إلى أن الاسم لا يؤثر فقط على نظرة الآخرين للفرد، بل يلعب دوراً محورياً في تشكيل مفهوم الطفل لذاته، وثقته بنفسه، وحتى مساره الاجتماعي والمهني. الاسم هو أول ما يختبره الطفل من اللغة، وهو البوابة التي يُعرّف بها عن نفسه للعالم. لذلك، فإن اختيار اسم يحمل دلالات إيجابية، ويسهل نطقه، ويتوافق مع القيم الثقافية والدينية، يمنح طفلكما العزيز أساساً قوياً للنمو والازدهار. وقد قمنا بتحليل عميق لهذه الأسماء ليمنحكما نظرة شاملة.
                                </p>

                                <h3 className="text-2xl font-bold text-teal-700 mb-4">ب. جدول ترجيح موضوعي: مقارنة شاملة</h3>
                                <div className="overflow-x-auto rounded-lg shadow-md mb-6 border border-gray-200">
                                    <table className="min-w-full bg-white">
                                        <thead className="bg-teal-100 text-teal-800">
                                            <tr>
                                                <th className="py-3 px-4 border-b border-gray-200 text-right">الاسم</th>
                                                <th className="py-3 px-4 border-b border-gray-200 text-right">نقاط القوة الرئيسية</th>
                                                <th className="py-3 px-4 border-b border-gray-200 text-right">اعتبارات هامة</th>
                                                <th className="py-3 px-4 border-b border-gray-200 text-center">التقييم الكلي</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr className="bg-gray-50 hover:bg-teal-50">
                                                <td className="py-3 px-4 border-b border-gray-200 font-semibold text-teal-700">يامن</td>
                                                <td className="py-3 px-4 border-b border-gray-200 text-gray-700">دلالة البركة والخير، سهولة النطق، قبول واسع، توافق ممتاز مع اللقب.</td>
                                                <td className="py-3 px-4 border-b border-gray-200 text-gray-700">اسم شائع ولكنه لا يفقد جاذبيته.</td>
                                                <td className="py-3 px-4 border-b border-gray-200 text-center text-xl font-bold text-blue-600">ممتاز (9.5)</td>
                                            </tr>
                                            <tr className="bg-white hover:bg-teal-50">
                                                <td className="py-3 px-4 border-b border-gray-200 font-semibold text-teal-700">غوث</td>
                                                <td className="py-3 px-4 border-b border-gray-200 text-gray-700">قوة المعنى (إغاثة، نجدة)، تميز الاسم.</td>
                                                <td className="py-3 px-4 border-b border-gray-200 text-gray-700">نادر الاستخدام كاسم شخصي، قد يواجه صعوبة في النطق لغير الناطقين بالعربية.</td>
                                                <td className="py-3 px-4 border-b border-gray-200 text-center text-xl font-bold text-orange-600">جيد (8.0)</td>
                                            </tr>
                                            <tr className="bg-gray-50 hover:bg-teal-50">
                                                <td className="py-3 px-4 border-b border-gray-200 font-semibold text-teal-700">الغوث</td>
                                                <td className="py-3 px-4 border-b border-gray-200 text-gray-700">لا يوجد نقاط قوة كاسم شخصي.</td>
                                                <td className="py-3 px-4 border-b border-gray-200 text-gray-700">غير مناسب كاسم شخصي على الإطلاق لاعتبارات دينية وكونه لقباً حصرياً.</td>
                                                <td className="py-3 px-4 border-b border-gray-200 text-center text-xl font-bold text-red-600">غير مناسب (2.0)</td>
                                            </tr>
                                            <tr className="bg-white hover:bg-teal-50">
                                                <td className="py-3 px-4 border-b border-gray-200 font-semibold text-teal-700">غياث</td>
                                                <td className="py-3 px-4 border-b border-gray-200 text-gray-700">قوة المعنى (إغاثة سخية)، مقبول وشائع، توافق جيد مع اللقب.</td>
                                                <td className="py-3 px-4 border-b border-gray-200 text-gray-700">أقل شهرة من "يامن".</td>
                                                <td className="py-3 px-4 border-b border-gray-200 text-center text-xl font-bold text-purple-600">جيد جداً (9.0)</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>

                                <h3 className="text-2xl font-bold text-teal-700 mb-4 mt-8">دليل تربوي تطبيقي متكامل للاسمين المقترحين:</h3>
                                <p className="text-gray-700 leading-relaxed mb-4">
                                    لتسهيل رحلتكما الأبوية، نقدم لكما دليلاً عملياً لكيفية تعزيز الصفات الإيجابية المرتبطة بكل من اسمي "يامن" و"غياث". تذكروا أن الاسم هو جزء من الهوية، والتربية هي رحلة مستمرة لغرس القيم.
                                </p>

                                <div className="bg-blue-50 p-5 rounded-lg shadow-inner mb-6 border border-blue-200">
                                    <h4 className="text-xl font-bold text-blue-700 mb-3 flex items-center">
                                        <span className="ml-2">🌟</span> إذا وقع اختياركما على اسم <span className="text-indigo-800 mr-1">"يامن"</span>:
                                    </h4>
                                    <p className="text-gray-700 leading-relaxed mb-4">
                                        "يامن" يعني **المبارك، الميمون، وكثير اليمن والبركة**. هذا الاسم يعكس طاقة إيجابية عالية، ويُوحي بالرخاء والتوفيق في الحياة. إنه اسم سهل النطق، لطيف على الأذن، ويتناغم بشكل طبيعي مع لقب "الغزالي". اختيار "يامن" قد يُسهم في بناء شخصية متفائلة، محظوظة، ومحبة للعطاء، تسعى دائماً لنشر الخير واليُمن أينما حلّت.
                                    </p>
                                    <p className="font-semibold text-indigo-600 mb-2">توجيهات تربوية لـ "يامن":</p>
                                    <ul className="list-disc list-inside text-gray-700 leading-relaxed space-y-2">
                                        <li><span className="font-semibold text-indigo-600">غرس التفاؤل والإيجابية:</span> شجّعا يامن على رؤية الجانب المشرق في الحياة. رويا له قصصاً عن الصبر والأمل، وعلّماه أن البركة والخير يأتيان بالاجتهاد والتوكل على الله.</li>
                                        <li><span className="font-semibold text-indigo-600">تعزيز الامتنان:</span> علّماه قيمة الشكر والامتنان للنعم الصغيرة والكبيرة في حياته. هذا يُرسخ فيه شعوراً بالرضا والبركة.</li>
                                        <li><span className="font-semibold text-indigo-600">تنمية حب العطاء:</span> اربطا اسمه بفعل الخير والبركة. شجّعاه على مساعدة الآخرين ومشاركتهم ما لديه، ليعيش معنى "اليُمن" في عطائه.</li>
                                        <li><span className="font-semibold text-indigo-600">بناء الثقة بالنفس:</span> امدحا جهوده وإنجازاته، وازرعا فيه الثقة بأنه قادر على تحقيق النجاحات وجلب الخير أينما حل.</li>
                                    </ul>
                                    <h5 className="font-semibold text-blue-700 mt-4 mb-2">نشاط تفاعلي لـ "يامن":</h5>
                                    <p className="text-gray-700 mb-3">
                                        **لعبة "صندوق البركات"**: خصصا صندوقاً جميلاً يجمع فيه يامن (عندما يكبر قليلاً) كل الأشياء الصغيرة التي يشعر بالامتنان لوجودها كل أسبوع (مثلاً: رسمة جميلة، حجر مميز، ورقة شجر ملونة). في نهاية الأسبوع، افتحا الصندوق وتكلما معه عن هذه "البركات" البسيطة في حياته.
                                    </p>
                                </div>

                                <div className="bg-purple-50 p-5 rounded-lg shadow-inner border border-purple-200">
                                    <h4 className="text-xl font-bold text-purple-700 mb-3 flex items-center">
                                        <span className="ml-2">💪</span> إذا وقع اختياركما على اسم <span className="text-indigo-800 mr-1">"غياث"</span>:
                                    </h4>
                                    <p className="text-gray-700 leading-relaxed mb-4">
                                        "غياث" يعني **الناصر، المنجد، والمساعد الذي يُغاث به الناس**. إنه صيغة مبالغة من "غوث"، مما يدل على كثرة الإغاثة والعون. هذا الاسم يرمز إلى القوة والعطاء الفعال، ويُشير إلى شخصية مبادرة وقادرة على إحداث فرق إيجابي في حياة الآخرين. يتناسب "غياث" أيضاً بشكل ممتاز مع لقب "الغزالي" وله رنين قوي وجذاب.
                                    </p>
                                    <p className="font-semibold text-indigo-600 mb-2">توجيهات تربوية لـ "غياث":</p>
                                    <ul className="list-disc list-inside text-gray-700 leading-relaxed space-y-2">
                                        <li><span className="font-semibold text-purple-600">تنمية حس المسؤولية:</span> علّماه مبكراً أهمية تحمل المسؤولية تجاه نفسه وتجاه الآخرين. كلفاه بمهام بسيطة تتناسب مع عمره.</li>
                                        <li><span className="font-semibold text-purple-600">تشجيع المبادرة والعون:</span> درّباه على أن يكون سبّاقاً في مساعدة من يحتاج، وأن لا يتردد في مد يد العون. يمكن أن تشاركا في أعمال تطوعية صغيرة كعائلة.</li>
                                        <li><span className="font-semibold text-purple-600">غرس الشجاعة والنخوة:</span> رويا له القصص التي تُعزز الشجاعة في مواجهة التحديات والدفاع عن الحق والضعفاء.</li>
                                        <li><span className="font-semibold text-purple-600">تعليم القيادة:</span> شجّعاه على أخذ زمام المبادرة في الأنشطة الجماعية، وتنمية مهارات القيادة لديه من خلال الألعاب التي تتطلب التخطيط والتوجيه.</li>
                                    </ul>
                                    <h5 className="font-semibold text-purple-700 mt-4 mb-2">نشاط تفاعلي لـ "غياث":</h5>
                                    <p className="text-gray-700 mb-3">
                                        **"بطاقات الإغاثة"**: حضرا بطاقات عليها مواقف بسيطة يحتاج فيها شخص للمساعدة (مثلاً: صديق سقط، أو دمية تحتاج إصلاحاً). ودعا غياث لاقتراح حلول أو طرق عملية للمساعدة. هذا يعزز لديه التفكير المبادِر.
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
                            <Recommendation />
                        </section>
                    )}
                </main>
            </div>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;700;800&family=Inter:wght@300;400;600;700;800&display=swap');

                .font-inter {
                    font-family: 'Inter', sans-serif;
                }
                .font-['Cairo'] {
                    font-family: 'Cairo', sans-serif;
                }

                .bg-pattern {
                    background-image: url('data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.1"%3E%3Cpath d="M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0 20v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zM6 34v-4h-2v4H0v2h4v4h2v-4h4v-2H6zm0 20v-4h-2v4H0v2h4v4h2v-4h4v-2H6zM36 4v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zM6 4v-4h-2v4H0v2h4v4h2v-4h4v-2H6zM48 16v-2h-4v2h-2v4h2v2h4v-2h2v-4h-2zM48 36v-2h-4v2h-2v4h2v2h4v-2h2v-4h-2zM48 56v-2h-4v2h-2v4h2v2h4v-2h2v-4h-2zM12 16v-2h-4v2h-2v4h2v2h4v-2h2v-4h-2zM12 36v-2h-4v2h-2v4h2v2h4v-2h2v-4h-2zM12 56v-2h-4v2h-2v4h2v2h4v-2h2v-4h-2zM0 16v-2h-4v2h-2v4h2v2h4v-2h2v-4H0zM0 36v-2h-4v2h-2v4h2v2h4v-2h2v-4H0zM0 56v-2h-4v2h-2v4h2v2h4v-2h2v-4H0zM24 0v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0 20v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0 40v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zM30 16v-2h-4v2h-2v4h2v2h4v-2h2v-4h-2zM30 36v-2h-4v2h-2v4h2v2h4v-2h2v-4h-2zM30 56v-2h-4v2h-2v4h2v2h4v-2h2v-4h-2zM42 0v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0 20v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0 40v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zM18 0v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0 20v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0 40v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E');
                    background-size: 30px 30px;
                    animation: pan 60s linear infinite;
                }
                @keyframes pan {
                    0% { background-position: 0% 0%; }
                    100% { background-position: 100% 100%; }
                }

                .animate-fadeIn {
                    animation: fadeIn 0.5s ease-out;
                }
                .animate-fadeInUp {
                    animation: fadeInUp 0.5s ease-out;
                }
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes fadeInUp {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                .animate-pulse-fade {
                    animation: pulseFade 2s infinite alternate;
                }
                @keyframes pulseFade {
                    0% { opacity: 0.7; }
                    100% { opacity: 1; }
                }

                .animate-bounce-text-once {
                    animation: bounceText 0.8s ease-out 1;
                }
                @keyframes bounceText {
                    0%, 100% { transform: translateY(0); }
                    25% { transform: translateY(-8px); }
                    50% { transform: translateY(0); }
                    75% { transform: translateY(-4px); }
                }
                .animate-fadeInOut {
                    animation: fadeInOut 3s forwards;
                }

                @keyframes fadeInOut {
                    0% { opacity: 0; transform: translateX(20px); }
                    10% { opacity: 1; transform: translateX(0); }
                    90% { opacity: 1; transform: translateX(0); }
                    100% { opacity: 0; transform: translateX(20px); }
                }
            `}</style>
            <script src="https://cdn.tailwindcss.com"></script>
        </div>
    );
}

export default App;
