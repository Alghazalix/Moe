import React, { useState, useEffect, useRef, useCallback } from 'react';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, collection, query, onSnapshot } from 'firebase/firestore';
import { initializeApp } from 'firebase/app';

// استيراد المكونات الفرعية (تمت إضافة امتداد .js لضمان الحل)
import AnalysisTab from './components/AnalysisTab.js';
import ComparisonTab from './components/ComparisonTab.js';
import VotingTab from './components/VotingTab.js';
import GamesTab from './components/GamesTab.js';
import MessageTab from './components/MessageTab.js';
import RecommendationTab from './components/RecommendationTab.js';
import FutureVisionTab from './components/FutureVisionTab.js';
import GemsTab from './components/GemsTab.js';
import { staticData } from './data/staticData.js'; // استيراد البيانات الثابتة من ملف منفصل (تمت إضافة امتداد .js)

// تعريف ما إذا كان التطبيق يعمل في بيئة Canvas (للتطوير المحلي مقابل نشر Netlify)
const IS_CANVAS_ENVIRONMENT = typeof window.__app_id !== 'undefined';

// تحديد appId لمسارات Firestore.
const appId = IS_CANVAS_ENVIRONMENT ? window.__app_id : "alghazali-family-app-deploy";

// تحديد إعدادات Firebase.
const firebaseConfig = IS_CANVAS_ENVIRONMENT
    ? JSON.parse(window.__firebase_config)
    : {
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
let firebaseEnabled = false;

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
        firebaseEnabled = false;
    }
} else {
    console.warn("Firebase configuration is incomplete for external deployment. Firebase functionality (votes, comments) will be mocked.");
}

// خدمات Firebase الوهمية إذا لم يتم تهيئة Firebase الحقيقي أو فشل
if (!firebaseEnabled) {
    firestoreDbInstance = {
        collection: () => ({ addDoc: () => Promise.resolve(), doc: () => ({}), onSnapshot: () => () => {}, query: () => ({}) }),
        doc: () => ({}),
        getDoc: () => Promise.resolve({ exists: () => false, data: () => ({}) }),
        setDoc: () => Promise.resolve(),
        onSnapshot: (ref, callback) => {
            console.log("Firestore onSnapshot mocked: No real-time updates for this instance.");
            callback({ forEach: () => {}, docs: [] });
            return () => console.log("Firestore onSnapshot mocked: Unsubscribed.");
        },
        query: (ref) => ref
    };
    firebaseAuthInstance = {
        onAuthStateChanged: (callback) => {
            console.log("Firebase Auth onAuthStateChanged mocked.");
            callback({ uid: 'mock-user-id', isAnonymous: true });
            return () => console.log("Firebase Auth onAuthStateChanged mocked: Unsubscribed.");
        },
        signInAnonymously: () => {
            console.log("Firebase Auth signInAnonymously mocked.");
            return Promise.resolve({ user: { uid: 'mock-user-id', isAnonymous: true } });
        },
        signInWithCustomToken: () => {
            console.log("Firebase Auth signInWithCustomToken mocked.");
            return Promise.resolve({ user: { uid: 'mock-canvas-user', isAnonymous: false } });
        }
    };
}

// القائمة الرئيسية للأسماء المستخدمة في التطبيق لأقسام مختلفة
const nameKeys = ['يامن', 'غوث', 'غياث'];

// تفاصيل الأسماء
const nameDetails = staticData.nameDetails;

// المحاور للتحليل التفصيلي في تبويب التحليل
const axes = staticData.axes;

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


export default function App() {
    // متغيرات الحالة لإدارة واجهة المستخدم والبيانات وتفاعلات المستخدم
    const [activeTab, setActiveTab] = useState('analysis');
    // eslint-disable-next-line no-unused-vars
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
    const [loadingSuggestions, setLoadingSuggestions] = useState(false);
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
        nameKeys.forEach(name => { initialScores[name] = 0; });
        return initialScores;
    });
    const [quizResult, setQuizResult] = useState(null);
    const quizQuestions = staticData.quizQuestions;

    // حالات لعبة مطابقة الصفة للاسم
    const [traitGameStarted, setTraitGameStarted] = useState(false);
    const [currentTraitIndex, setCurrentTraitIndex] = useState(0);
    const [traitGameScore, setTraitGameScore] = useState(0);
    const [traitGameFeedback, setTraitGameFeedback] = useState('');
    const traitQuestions = staticData.traitQuestions;

    // حالات لعبة إكمال قصة الاسم
    const [storyGameStarted, setStoryGameStarted] = useState(false);
    const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
    const [storyGameScore, setStoryGameScore] = useState(0);
    const [storyGameFeedback, setStoryGameFeedback] = useState('');
    const storyQuestions = staticData.storyQuestions;

    // حالات لعبة تحدي الذاكرة الاسمية
    const [memoryGameStarted, setMemoryGameStarted] = useState(false);
    const [memoryCards, setMemoryCards] = useState([]);
    const [flippedCards, setFlippedCards] = useState([]);
    const [matchedCards, setMatchedCards] = useState([]);
    const [moves, setMoves] = useState(0);
    const [memoryGameMessage, setMemoryGameMessage] = useState('');
    // eslint-disable-next-line no-unused-vars
    const memoryGamePairs = staticData.memoryGamePairs; // Use directly

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
    const authCheckComplete = useRef(false);

    // حالة العد التنازلي
    const targetDate = React.useMemo(() => new Date('2025-06-03T00:00:00'), []);
    // eslint-disable-next-line no-unused-vars
    const [countdown, setCountdown] = useState({});

    // ----- ألعاب جديدة للقسم "ألعاب مسلية" -----
    // 1. اختبار الشخصية بالأسماء
    const [personalityQuizStarted, setPersonalityQuizStarted] = useState(false);
    const [currentPersonalityQuestionIndex, setCurrentPersonalityQuestionIndex] = useState(0);
    const [personalityQuizScores, setPersonalityQuizScores] = useState({
        'يامن': 0, 'غوث': 0, 'غياث': 0, 'مستكشف': 0, 'مبدع': 0, 'قيادي': 0, 'متعاون': 0
    });
    const [personalityQuizResult, setPersonalityQuizResult] = useState(null);
    const personalityQuestions = staticData.personalityQuestions;

    // 2. تحدي "من صاحب هذا الاسم؟"
    const [whoIsItGameStarted, setWhoIsItGameStarted] = useState(false);
    const [currentWhoIsItQuestionIndex, setCurrentWhoIsItQuestionIndex] = useState(0);
    const [whoIsItGameScore, setWhoIsItGameScore] = useState(0);
    const [whoIsItGameFeedback, setWhoIsItGameFeedback] = useState('');
    const whoIsItQuestions = staticData.whoIsItQuestions;

    // 3. لعبة باني الجمل الاسمية
    const [sentenceBuilderGameStarted, setSentenceBuilderGameStarted] = useState(false);
    const [currentSentenceName, setCurrentSentenceName] = useState('');
    const [userSentence, setUserSentence] = useState('');
    const [sentenceGameFeedback, setSentenceGameFeedback] = useState('');
    const [scoreSentenceGame, setScoreSentenceGame] = useState(0);
    const namesForSentenceGame = staticData.namesForSentenceGame;

    // 4. لعبة "ابحث عن الاسم المفقود" (لغز)
    const [missingNameGameStarted, setMissingNameGameStarted] = useState(false);
    const [currentMissingNamePuzzle, setCurrentMissingNamePuzzle] = useState(0);
    const [userMissingNameGuess, setUserMissingNameGuess] = useState('');
    const [missingNameFeedback, setMissingNameFeedback] = useState('');
    const [scoreMissingNameGame, setScoreMissingNameGame] = useState(0);
    const missingNamePuzzles = staticData.missingNamePuzzles;

    // 5. لعبة "تصنيف الاسم" (تعليمي)
    const [categorizationGameStarted, setCategorizationGameStarted] = useState(false);
    const [currentCategorizationQuestionIndex, setCurrentCategorizationQuestionIndex] = useState(0);
    const [categorizationGameScore, setCategorizationGameScore] = useState(0);
    const [categorizationGameFeedback, setCategorizationGameFeedback] = useState('');
    const nameCategorizationQuestions = staticData.nameCategorizationQuestions;


    // ----- حالات تبويب "دررٌ من الأسماء" -----
    const [selectedHistoricalName, setSelectedHistoricalName] = useState(null);
    const [historicalNameInput, setHistoricalNameInput] = useState('');
    const [historicalNameFact, setHistoricalNameFact] = useState('');
    // eslint-disable-next-line no-unused-vars
    const historicalNamesData = staticData.historicalNamesData; // Use directly

    const [personalityImpactTestStarted, setPersonalityImpactTestStarted] = useState(false);
    const [currentImpactQuestionIndex, setCurrentImpactQuestionIndex] = useState(0);
    const [impactScores, setImpactScores] = useState({});
    const [impactTestResult, setImpactTestResult] = useState(null);
    const personalityImpactQuestions = staticData.personalityImpactQuestions;

    // دالة لعرض الرسائل المؤقتة للمستخدم (مثل إشعارات النجاح/الخطأ)
    // IMPORTANT: This must be defined BEFORE any other useCallback/useEffect that uses it.
    const showTemporaryMessage = useCallback((message, type = 'info', duration = 3000) => {
        setTempMessage(message);
        setTempMessageType(type);
        const messageBox = document.getElementById('temp-message-box');
        if (messageBox) {
            messageBox.className = `fixed top-4 right-4 text-white p-3 rounded-lg shadow-lg z-50 animate-fadeInOut 
                    ${type === 'error' ? 'bg-red-600' : (type === 'success' ? 'bg-green-600' : 'bg-blue-600')}`;
        }
        setTimeout(() => setTempMessage(''), duration); // تختفي الرسالة بعد 'duration' مللي ثانية
    }, []);


    // ----------- دوال منطق الألعاب والمساعدات (تم نقلها من GamesTab لتجنب أخطاء Hooks و No-undef) -----------

    // دالة مساعدة لتحديد فئة الشخصية بناءً على الدرجات
    const getPersonalityType = useCallback((scores) => {
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
    }, []);

    const handleQuizAnswer = useCallback((scores) => {
        setQuizScores(prevScores => {
            const newScores = { ...prevScores };
            for (const name in scores) {
                newScores[name] = (newScores[name] || 0) + scores[name];
            }
            return newScores;
        });

        if (currentQuizQuestionIndex < quizQuestions.length - 1) {
            setCurrentQuizQuestionIndex(prev => prev + 1);
        } else {
            let maxScore = -1;
            let resultNames = [];
            const finalScores = { ...quizScores };
            for (const name in scores) { // Add scores from the last question
                finalScores[name] = (finalScores[name] || 0) + scores[name];
            }

            for (const name in finalScores) {
                if (finalScores[name] > maxScore) {
                    maxScore = finalScores[name];
                    resultNames = [name];
                } else if (finalScores[name] === maxScore) {
                    resultNames.push(name);
                }
            }
            setQuizResult(resultNames);
        }
    }, [currentQuizQuestionIndex, quizQuestions.length, quizScores]);

    const startQuiz = useCallback(() => {
        setQuizStarted(true);
        setCurrentQuizQuestionIndex(0);
        setQuizScores(() => {
            const initialScores = {};
            nameKeys.forEach(name => { initialScores[name] = 0; });
            return initialScores;
        });
        setQuizResult(null);
    }, [nameKeys]);

    const resetQuiz = useCallback(() => {
        setQuizStarted(false);
        setCurrentQuizQuestionIndex(0);
        setQuizScores(() => {
            const initialScores = {};
            nameKeys.forEach(name => { initialScores[name] = 0; });
            return initialScores;
        });
        setQuizResult(null);
    }, [nameKeys]);

    const startTraitGame = useCallback(() => {
        setTraitGameStarted(true);
        setCurrentTraitIndex(0);
        setTraitGameScore(0);
        setTraitGameFeedback('');
    }, []);

    const handleTraitAnswer = useCallback((selectedOption) => {
        const currentQ = traitQuestions[currentTraitIndex];
        if (selectedOption === currentQ.correctName) {
            setTraitGameScore(prev => prev + 1);
            setTraitGameFeedback('إجابة صحيحة! 🎉');
        } else {
            setTraitGameFeedback(`إجابة خاطئة. الصحيح هو: ${currentQ.correctName} 😔`);
        }

        setTimeout(() => {
            setTraitGameFeedback('');
            if (currentTraitIndex < traitQuestions.length - 1) {
                setCurrentTraitIndex(prev => prev + 1);
            } else {
                setTraitGameStarted(false);
                showTemporaryMessage(`انتهت لعبة "من صاحب هذا الاسم؟" نتيجتك: ${traitGameScore + (selectedOption === currentQ.correctName ? 1 : 0)} من ${traitQuestions.length}`, 'info', 5000);
            }
        }, 1500);
    }, [currentTraitIndex, traitQuestions, traitGameScore, showTemporaryMessage]);


    const resetTraitGame = useCallback(() => {
        setTraitGameStarted(false);
        setCurrentTraitIndex(0);
        setTraitGameScore(0);
        setTraitGameFeedback('');
    }, []);

    const startStoryGame = useCallback(() => {
        setStoryGameStarted(true);
        setCurrentStoryIndex(0);
        setStoryGameScore(0);
        setStoryGameFeedback('');
    }, []);

    const handleStoryAnswer = useCallback((selectedName) => {
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
                setStoryGameStarted(false);
            }
        }, 1500);
    }, [currentStoryIndex, storyQuestions, storyGameScore]);

    const resetStoryGame = useCallback(() => {
        setStoryGameStarted(false);
        setCurrentStoryIndex(0);
        setStoryGameScore(0);
        setStoryGameFeedback('');
    }, []);

    const handleCardClick = useCallback((clickedCard) => {
        if (flippedCards.length === 2 || clickedCard.isFlipped || clickedCard.isMatched) {
            return;
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
                setMatchedCards(prev => [...prev, firstCard.uniqueId, secondCard.uniqueId]);
                setMemoryGameMessage('مطابقة صحيحة! 🎉');
                setTimeout(() => {
                    setFlippedCards([]);
                    setMemoryGameMessage('');
                    if (matchedCards.length + 2 === memoryCards.length) {
                        setMemoryGameMessage(`رائع! أكملت اللعبة في ${moves + 1} نقلة!`);
                        setMemoryGameStarted(false);
                    }
                }, 700);
            } else {
                setMemoryGameMessage('ليست مطابقة. حاول مرة أخرى. 😔');
                setTimeout(() => {
                    setMemoryCards(prevCards =>
                        prevCards.map(card =>
                            (card.uniqueId === firstCard.uniqueId || card.uniqueId === secondCard.uniqueId)
                                ? { ...card, isFlipped: false }
                                : card
                        )
                    );
                    setFlippedCards([]);
                    setMemoryGameMessage('');
                }, 1000);
            }
        }
    }, [flippedCards, memoryCards, matchedCards, moves]);

    const startMemoryGame = useCallback(() => {
        const cards = [...memoryGamePairs, ...memoryGamePairs].map((item, index) => ({ // Use memoryGamePairs directly
            ...item,
            uniqueId: `${item.id}-${item.vibe}-${index}`,
            isFlipped: false,
            isMatched: false
        }));
        cards.sort(() => Math.random() - 0.5);
        setMemoryCards(cards);
        setFlippedCards([]);
        setMatchedCards([]);
        setMoves(0);
        setMemoryGameMessage('');
        setMemoryGameStarted(true);
    }, [memoryGamePairs]); // Correct dependency

    const resetMemoryGame = useCallback(() => {
        setMemoryGameStarted(false);
        const cards = [...memoryGamePairs, ...memoryGamePairs].map((item, index) => ({ // Use memoryGamePairs directly
            ...item,
            uniqueId: `${item.id}-${item.vibe}-${index}`,
            isFlipped: false,
            isMatched: false
        }));
        cards.sort(() => Math.random() - 0.5);
        setMemoryCards(cards);
        setFlippedCards([]);
        setMatchedCards([]);
        setMoves(0);
        setMemoryGameMessage('');
    }, [memoryGamePairs]); // Correct dependency

    // دالة معالج لحجر النرد الاسمي
    const handleDiceRoll = useCallback(() => {
        const randomIndex = Math.floor(Math.random() * nameKeys.length);
        const randomName = nameKeys[randomIndex];
        showTemporaryMessage(`حجر النرد اختار: "${randomName}"! أتمنى له مستقبلاً باهراً!`, 'success', 4000);
    }, [nameKeys, showTemporaryMessage]); // showTemporaryMessage is a dependency now

    const handlePersonalityAnswer = useCallback((scores) => {
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
            let maxScore = -1;
            let resultTypes = [];
            const finalScores = { ...personalityQuizScores };
            for (const type in scores) {
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
            setPersonalityQuizResult(getPersonalityType(finalScores));
        }
    }, [currentPersonalityQuestionIndex, personalityQuestions.length, personalityQuizScores, getPersonalityType]);

    const resetPersonalityQuiz = useCallback(() => {
        setPersonalityQuizStarted(false);
        setCurrentPersonalityQuestionIndex(0);
        setPersonalityQuizScores({
            'يامن': 0, 'غوث': 0, 'غياث': 0, 'مستكشف': 0, 'مبدع': 0, 'قيادي': 0, 'متعاون': 0
        });
        setPersonalityQuizResult(null);
    }, []);

    const startWhoIsItGame = useCallback(() => {
        setWhoIsItGameStarted(true);
        setCurrentWhoIsItQuestionIndex(0);
        setWhoIsItGameScore(0);
        setWhoIsItGameFeedback('');
    }, []);

    const handleWhoIsItAnswer = useCallback((selectedOption) => {
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
                setWhoIsItGameStarted(false);
                showTemporaryMessage(`انتهت لعبة "من صاحب هذا الاسم؟" نتيجتك: ${whoIsItGameScore + (selectedOption === currentQ.correctAnswer ? 1 : 0)} من ${whoIsItQuestions.length}`, 'info', 5000);
            }
        }, 1500);
    }, [currentWhoIsItQuestionIndex, whoIsItQuestions, whoIsItGameScore, showTemporaryMessage]);

    const resetWhoIsItGame = useCallback(() => {
        setWhoIsItGameStarted(false);
        setCurrentWhoIsItQuestionIndex(0);
        setWhoIsItGameScore(0);
        setWhoIsItGameFeedback('');
    }, []);

    const startSentenceBuilderGame = useCallback(() => {
        setSentenceBuilderGameStarted(true);
        const randomName = namesForSentenceGame[Math.floor(Math.random() * namesForSentenceGame.length)];
        setCurrentSentenceName(randomName);
        setUserSentence('');
        setSentenceGameFeedback('');
        setScoreSentenceGame(0);
    }, [namesForSentenceGame]);

    const handleSubmitSentence = useCallback(() => {
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
                setSentenceBuilderGameStarted(false);
                showTemporaryMessage(`انتهت اللعبة! أحرزت ${scoreSentenceGame + (sentenceLength >= 5 ? 1 : 0)} نقطة.`, 'info', 5000);
            }
        }, 2000);
    }, [userSentence, currentSentenceName, namesForSentenceGame, scoreSentenceGame, showTemporaryMessage]);

    const resetSentenceBuilderGame = useCallback(() => {
        setSentenceBuilderGameStarted(false);
        setCurrentSentenceName('');
        setUserSentence('');
        setSentenceGameFeedback('');
        setScoreSentenceGame(0);
    }, []);

    const startMissingNameGame = useCallback(() => {
        setMissingNameGameStarted(true);
        setCurrentMissingNamePuzzle(0);
        setUserMissingNameGuess('');
        setMissingNameFeedback('');
        setScoreMissingNameGame(0);
    }, []);

    const handleSubmitMissingName = useCallback(() => {
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
                setMissingNameGameStarted(false);
                showTemporaryMessage(`انتهت اللعبة! أحرزت ${scoreMissingNameGame + (userMissingNameGuess.trim() === currentPuzzle.answer ? 1 : 0)} نقطة.`, 'info', 5000);
            }
        }, 1500);
    }, [currentMissingNamePuzzle, missingNamePuzzles, userMissingNameGuess, scoreMissingNameGame, showTemporaryMessage]);

    const resetMissingNameGame = useCallback(() => {
        setMissingNameGameStarted(false);
        setCurrentMissingNamePuzzle(0);
        setUserMissingNameGuess('');
        setMissingNameFeedback('');
        setScoreMissingNameGame(0);
    }, []);

    const startCategorizationGame = useCallback(() => {
        setCategorizationGameStarted(true);
        setCurrentCategorizationQuestionIndex(0);
        setCategorizationGameScore(0);
        setCategorizationGameFeedback('');
    }, []);

    const handleCategorizationAnswer = useCallback((selectedCategory) => {
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
                setCategorizationGameStarted(false);
                showTemporaryMessage(`انتهت اللعبة! أحرزت ${categorizationGameScore + (selectedCategory === currentQ.correctCategory ? 1 : 0)} نقطة.`, 'info', 5000);
            }
        }, 1500);
    }, [currentCategorizationQuestionIndex, nameCategorizationQuestions, categorizationGameScore, showTemporaryMessage]);

    const resetCategorizationGame = useCallback(() => {
        setCategorizationGameStarted(false);
        setCurrentCategorizationQuestionIndex(0);
        setCategorizationGameScore(0);
        setCategorizationGameFeedback('');
    }, []);

    // دالة مساعدة لجلب المحتوى الثابت (البركات، الحقائق الممتعة، الأسماء المشابهة، القصائد، أغاني المهد)
    const getStaticContent = useCallback((type, name = null) => {
        const data = staticData[type];
        if (name && data && typeof data === 'object' && !Array.isArray(data)) {
            return data[name] || `لا توجد بيانات لهذا الاسم في ${type}.`;
        }
        return data || `لا توجد بيانات للنوع ${type}.`;
    }, []);


    // معالج لبركة الاسم
    const handleGenerateBlessing = useCallback(async (name) => {
        setLoadingBlessing(true);
        setGeneratedBlessing('');
        const text = getStaticContent('blessings', name); // لاحظ استخدام 'blessings'
        setGeneratedBlessing(text);
        setLoadingBlessing(false);
    }, [getStaticContent]);

    // معالج لاقتراح أسماء مشابهة
    const handleGenerateSimilarNames = useCallback(async (name) => {
        setLoadingSuggestions(true);
        setSuggestedNamesForCard(prev => ({ ...prev, [name]: '' }));
        const text = getStaticContent('similarNames', name);
        setSuggestedNamesForCard(prev => ({ ...prev, [name]: text }));
        setLoadingSuggestions(false);
    }, [getStaticContent]);

    // معالج للحقيقة الممتعة
    const handleGenerateFunFact = useCallback(async (name) => {
        showTemporaryMessage(`جاري توليد معلومة شيقة عن اسم "${name}"...`, 'info', 2000);
        const text = getStaticContent('funFacts', name); // لاحظ استخدام 'funFacts'
        setFunFact(text);
    }, [getStaticContent, showTemporaryMessage]);

    // معالج لتوليد قصيدة
    const handleGeneratePoem = useCallback(async (name) => {
        setLoadingPoem(true);
        setGeneratedPoem('');
        const text = getStaticContent('namePoems', name); // لاحظ استخدام 'namePoems'
        setGeneratedPoem(text);
        setLoadingPoem(false);
    }, [getStaticContent]);

    // معالج لعرض معنى الاسم من خلال الصور
    const handleShowImageMeaning = useCallback((name) => {
        setSelectedImageMeaningName(name);
        showTemporaryMessage(`صور توضيحية لاسم "${name}".`, 'info', 4000);
    }, [showTemporaryMessage]);

    // معالج للتحليل الصوتي
    const handleShowPhoneticAnalysis = useCallback((name) => {
        setSelectedPhoneticAnalysisName(name);
        showTemporaryMessage(`تحليل صوتي لاسم "${name}".`, 'info', 4000);
    }, [showTemporaryMessage]);

    // معالج لتعهد الوالدين - حفظ في التخزين المحلي
    const handlePledgeSave = useCallback(() => {
        localStorage.setItem('parentsPledge', parentsPledge);
        showTemporaryMessage("تم حفظ تعهدكما بنجاح!", 'success', 3000);
    }, [parentsPledge, showTemporaryMessage]);

    // معالج لتوليد الرؤية المستقبلية
    const handleGenerateFutureVision = useCallback(() => {
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
    }, [futureVisionNameInput, futureVisionTraits, futureVisionMotto, showTemporaryMessage]);

    // معالج لتصور المولود بالذكاء الاصطناعي (باستخدام صور ثابتة)
    const handleAIVisualization = useCallback((name) => {
        setSelectedAIVisualizationName(name);
        showTemporaryMessage(`تصور فني لجوهر اسم "${name}".`, 'info', 4000);
    }, [showTemporaryMessage]);

    // دالة مساعدة لتحديد مدى تأثير الاسم على الشخصية بناءً على الدرجات
    const getImpactResult = useCallback((scores) => {
        let maxScore = -1;
        let dominantTrait = 'متوازن';
        for (const trait in scores) {
            if (scores[trait] > maxScore) {
                maxScore = scores[trait];
                dominantTrait = trait;
            }
        }
        if (maxScore <= 0) return "اسمك له تأثير متوازن أو ليس له تأثير واضح على هذه الجوانب من شخصيتك في هذا الاختبار.";

        switch (dominantTrait) {
            case 'confidence': return "يبدو أن اسمك يعزز لديك شعوراً كبيراً بالثقة والفخر.";
            case 'leadership': return "يشير اختبارك إلى أن اسمك قد يبرز لديك سمات قيادية قوية.";
            case 'empathy': return "اسمك قد يعكس ويقوي لديك سمات التعاطف والتفهم مع الآخرين.";
            case 'positiveOutlook': return "يبدو أن اسمك مرتبط بنظرة إيجابية وتفاؤلية للحياة.";
            default: return "اسمك له تأثير متوازن أو ليس له تأثير واضح على هذه الجوانب من شخصيتك في هذا الاختبار.";
        }
    }, []);

    // معالج لأسئلة اختبار تأثير الاسم
    const handleImpactAnswer = useCallback((scores) => {
        setImpactScores(prevScores => {
            const newScores = { ...prevScores };
            for (const trait in scores) {
                newScores[trait] = (newScores[trait] || 0) + scores[trait];
            }
            return newScores;
        });

        if (currentImpactQuestionIndex < personalityImpactQuestions.length - 1) {
            setCurrentImpactQuestionIndex(prev => prev + 1);
        } else {
            const finalScores = { ...impactScores };
            for (const trait in scores) {
                finalScores[trait] = (finalScores[trait] || 0) + scores[trait];
            }
            setImpactTestResult(getImpactResult(finalScores));
        }
    }, [currentImpactQuestionIndex, personalityImpactQuestions.length, impactScores, getImpactResult]);

    const resetImpactTest = useCallback(() => {
        setPersonalityImpactTestStarted(false);
        setCurrentImpactQuestionIndex(0);
        setImpactScores({});
        setImpactTestResult(null);
    }, []);

    // مصادقة Firebase والمستمعين
    const setupFirebaseAuth = useCallback(async () => {
        if (!firebaseEnabled) {
            setCurrentUser({ uid: 'mock-user-id', isAnonymous: true });
            setUserName('مستخدم مجهول');
            setUserRole('guest');
            authCheckComplete.current = true;
            return;
        }

        const authInstance = firebaseAuthInstance;

        const unsubscribeAuth = onAuthStateChanged(authInstance, async (user) => {
            setCurrentUser(user);
            let userInitialized = false;

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
                userInitialized = true;
            } else {
                if (!initialSignInAttempted.current) {
                    initialSignInAttempted.current = true;
                    try {
                        if (IS_CANVAS_ENVIRONMENT && typeof window.__initial_auth_token !== 'undefined') {
                            await signInWithCustomToken(authInstance, window.__initial_auth_token);
                            console.log("Signed in with custom token.");
                        } else {
                            await signInAnonymously(authInstance);
                            console.log("Signed in anonymously.");
                        }
                    } catch (error) {
                        console.error("Error during initial Firebase sign-in:", error);
                        if (firebaseEnabled) {
                            showTemporaryMessage("فشل تسجيل الدخول التلقائي. قد لا تعمل بعض الميزات.", 'error', 5000);
                        }
                        setCurrentUser({ uid: 'fallback-user', isAnonymous: true });
                        setUserName('زائر');
                        setUserRole('guest');
                        userInitialized = true;
                    }
                } else {
                    setUserName('زائر');
                    setUserRole('guest');
                    userInitialized = true;
                }
            }
            if (userInitialized) {
                authCheckComplete.current = true;
            }
        });

        return () => unsubscribeAuth();
    }, [showTemporaryMessage]); // Dependency for showTemporaryMessage

    useEffect(() => {
        setupFirebaseAuth();
    }, [setupFirebaseAuth]);

    // مستمعي Firestore للأصوات والتعليقات
    useEffect(() => {
        if (!authCheckComplete.current || !firebaseEnabled || !currentUser) {
            setVotes({ 'يامن': 0, 'غوث': 0, 'غياث': 0 });
            setComments([]);
            return;
        }

        const firestoreDb = firestoreDbInstance;

        const votesCollectionRef = collection(firestoreDb, `artifacts/${appId}/public/data/nameVotes`);
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

        const commentsCollectionRef = collection(firestoreDb, `artifacts/${appId}/public/data/nameComments`);
        const q = query(commentsCollectionRef);
        const unsubscribeComments = onSnapshot(q, (snapshot) => {
            const fetchedComments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            fetchedComments.sort((a, b) => (a.timestamp?.toMillis() || 0) - (b.timestamp?.toMillis() || 0));
            setComments(fetchedComments);
        }, (error) => {
            console.error("Error fetching comments:", error);
            let errorMessage = "تعذر جلب التعليقات من Firebase. قد تكون هناك مشكلة في الإعدادات.";
            if (error.code === 'unavailable') {
                errorMessage = "تعذر الاتصال بخدمة Firebase (Firestore). يرجre` التحقق من اتصال الإنترنت لديكم أو إعدادات Firebase الخاصة بالمشروع (مثل جدار الحماية أو قواعد الأمان في Firebase Console).";
            }
            showTemporaryMessage(errorMessage, 'error', 5000);
        });

        return () => {
            unsubscribeVotes();
            unsubscribeComments();
        };
    }, [currentUser, showTemporaryMessage]); // firebaseEnabled and appId are correctly removed as dependencies here since they are effectively constants after initial setup

    // معالج للتصويت على الاسم
    const handleVote = useCallback(async (name) => {
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
            const firestoreDb = firestoreDbInstance;
            const userVoteControlDocRef = doc(firestoreDb, `artifacts/${appId}/users/${currentUserId}/myVoteControl`, name);
            const userVoteControlSnap = await getDoc(userVoteControlDocRef);

            if (userVoteControlSnap.exists()) {
                showTemporaryMessage(`لقد صوتّ ${userRole === 'father' ? 'الأب' : 'الأم'} بالفعل لاسم ${name}. لا يمكن التصويت مرة أخرى.`, 'info', 5000);
                return;
            }

            const publicVoteDocRef = doc(firestoreDb, `artifacts/${appId}/public/data/nameVotes`, `${name}_${currentUserId}_${Date.now()}`);
            await setDoc(publicVoteDocRef, {
                name: name,
                userId: currentUserId,
                role: userRole,
                timestamp: new Date()
            });

            await setDoc(userVoteControlDocRef, { voted: true, timestamp: new Date() });

            showTemporaryMessage(`تم التصويت لاسم ${name} بنجاح!`, 'success', 3000);
        } catch (error) {
            console.error("Error casting vote:", error);
            showTemporaryMessage("حدث خطأ أثناء التصويت. الرجاء المحاولة مرة أخرى.", 'error', 5000);
        }
    }, [currentUser, userRole, showTemporaryMessage]); // firebaseEnabled and appId are correctly removed as dependencies here since they are effectively constants after initial setup


    // معالج لإضافة التعليقات
    const handleAddComment = useCallback(async () => {
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
            const firestoreDb = firestoreDbInstance;
            const commentsCollectionRef = collection(firestoreDb, `artifacts/${appId}/public/data/nameComments`);
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
    }, [newComment, currentUser, userRole, userName, showTemporaryMessage]); // firebaseEnabled and appId are correctly removed as dependencies here since they are effectively constants after initial setup

    // معالج لتغيير دور المستخدم (أب، أم، زائر)
    const handleUserRoleChange = useCallback((role, customName = '') => {
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
    }, [showTemporaryMessage]);


    // دالة لتحديد فئة الخلفية بناءً على التبويب النشط لتنوع بصري
    const getBackgroundClasses = useCallback((tab) => {
        switch (tab) {
            case 'analysis': return 'bg-gradient-to-br from-blue-50 to-indigo-100';
            case 'comparison': return 'bg-gradient-to-br from-purple-50 to-pink-100';
            case 'voting': return 'bg-gradient-to-br from-green-50 to-teal-100';
            case 'games': return 'bg-gradient-to-br from-red-50 to-orange-100';
            case 'message': return 'bg-gradient-to-br from-yellow-50 to-orange-100';
            case 'recommendation': return 'bg-gradient-to-br from-red-50 to-purple-100';
            case 'futureVision': return 'bg-gradient-to-br from-indigo-50 to-blue-100';
            case 'gems': return 'bg-gradient-to-br from-gray-50 to-gray-200';
            default: return 'bg-gradient-to-br from-blue-50 to-indigo-100';
        }
    }, []);

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
                            staticNumerology={getStaticContent('numerology')}
                            staticNameKeywords={getStaticContent('nameKeywords')}
                            staticImageMeaningData={getStaticContent('imageMeaning')}
                            selectedImageMeaningName={selectedImageMeaningName}
                            handleShowImageMeaning={handleShowImageMeaning}
                            staticPhoneticAnalysis={getStaticContent('phoneticAnalysis')}
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
                            // Quiz Game
                            quizStarted={quizStarted}
                            currentQuizQuestionIndex={currentQuizQuestionIndex}
                            quizQuestions={quizQuestions}
                            handleQuizAnswer={handleQuizAnswer}
                            quizResult={quizResult}
                            startQuiz={startQuiz}
                            resetQuiz={resetQuiz}

                            // Trait Game
                            traitGameStarted={traitGameStarted}
                            currentTraitIndex={currentTraitIndex}
                            traitGameScore={traitGameScore}
                            traitGameFeedback={traitGameFeedback}
                            traitQuestions={traitQuestions}
                            startTraitGame={startTraitGame}
                            handleTraitAnswer={handleTraitAnswer}
                            resetTraitGame={resetTraitGame}

                            // Story Game
                            storyGameStarted={storyGameStarted}
                            currentStoryIndex={currentStoryIndex}
                            storyGameScore={storyGameScore}
                            storyGameFeedback={storyGameFeedback}
                            storyQuestions={storyQuestions}
                            startStoryGame={startStoryGame}
                            handleStoryAnswer={handleStoryAnswer}
                            resetStoryGame={resetStoryGame}

                            // Memory Game
                            memoryGameStarted={memoryGameStarted}
                            memoryCards={memoryCards}
                            flippedCards={flippedCards}
                            matchedCards={matchedCards}
                            moves={moves}
                            memoryGameMessage={memoryGameMessage}
                            handleCardClick={handleCardClick}
                            startMemoryGame={startMemoryGame}
                            resetMemoryGame={resetMemoryGame}

                            // Dice Roll
                            handleDiceRoll={handleDiceRoll} {/* Passing the function down */}

                            // Personality Quiz (new)
                            personalityQuizStarted={personalityQuizStarted}
                            currentPersonalityQuestionIndex={currentPersonalityQuestionIndex}
                            personalityQuestions={personalityQuestions}
                            personalityQuizScores={personalityQuizScores}
                            personalityQuizResult={personalityQuizResult}
                            setPersonalityQuizStarted={setPersonalityQuizStarted}
                            setCurrentPersonalityQuestionIndex={setCurrentPersonalityQuestionIndex}
                            setPersonalityQuizScores={setPersonalityQuizScores}
                            setPersonalityQuizResult={setPersonalityQuizResult}
                            getPersonalityType={getPersonalityType}
                            handlePersonalityAnswer={handlePersonalityAnswer}
                            resetPersonalityQuiz={resetPersonalityQuiz}

                            // Who Is It? Game (new)
                            whoIsItGameStarted={whoIsItGameStarted}
                            currentWhoIsItQuestionIndex={currentWhoIsItQuestionIndex}
                            whoIsItGameScore={whoIsItGameScore}
                            whoIsItGameFeedback={whoIsItGameFeedback}
                            whoIsItQuestions={whoIsItQuestions}
                            setWhoIsItGameStarted={setWhoIsItGameStarted}
                            setCurrentWhoIsItQuestionIndex={setCurrentWhoIsItQuestionIndex}
                            setWhoIsItGameScore={setWhoIsItGameScore}
                            setWhoIsItGameFeedback={setWhoIsItGameFeedback}
                            startWhoIsItGame={startWhoIsItGame}
                            handleWhoIsItAnswer={handleWhoIsItAnswer}
                            resetWhoIsItGame={resetWhoIsItGame}

                            // Sentence Builder Game (new)
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
                            startSentenceBuilderGame={startSentenceBuilderGame}
                            handleSubmitSentence={handleSubmitSentence}
                            resetSentenceBuilderGame={resetSentenceBuilderGame}

                            // Missing Name Game (new)
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
                            startMissingNameGame={startMissingNameGame}
                            handleSubmitMissingName={handleSubmitMissingName}
                            resetMissingNameGame={resetMissingNameGame}

                            // Categorization Game (new)
                            categorizationGameStarted={categorizationGameStarted}
                            currentCategorizationQuestionIndex={currentCategorizationQuestionIndex}
                            categorizationGameScore={categorizationGameScore}
                            categorizationGameFeedback={categorizationGameFeedback}
                            nameCategorizationQuestions={nameCategorizationQuestions}
                            setCategorizationGameStarted={setCategorizationGameStarted}
                            setCurrentCategorizationQuestionIndex={setCurrentCategorizationQuestionIndex}
                            setCategorizationGameScore={setCategorizationGameScore}
                            setCategorizationGameFeedback={setCategorizationGameFeedback}
                            startCategorizationGame={startCategorizationGame}
                            handleCategorizationAnswer={handleCategorizationAnswer}
                            resetCategorizationGame={resetCategorizationGame}

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
                            showTemporaryMessage={showTemporaryMessage}
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
                            staticAIVisualizations={getStaticContent('aiVisualizations')}
                            showTemporaryMessage={showTemporaryMessage}
                        />
                    )}

                    {activeTab === 'gems' && (
                        <GemsTab
                            historicalNamesData={getStaticContent('historicalNames')}
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
                            handleImpactAnswer={handleImpactAnswer}
                            resetImpactTest={resetImpactTest}
                            getImpactResult={getImpactResult}
                        />
                    )}
                </main>

                <footer className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-4 text-center rounded-b-xl shadow-inner mt-8">
                    <p className="text-sm opacity-90 mb-2">صُنع بحب لعائلة الغزالي 💖</p>
                    <button
                        onClick={() => {
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
                لـ HTML المستقل، سيكون هذا في <head>. */ }
            <script src="https://cdn.tailwindcss.com"></script>
        </div>
    );
}
