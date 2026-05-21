// DATOS
let quizQuestions = [];
let rewards = [];
let selectedQuizFile = 'questions.json';
let selectedQuizLabel = 'JavaScript';

// SELECCIÓN DE PERSONAJE
let selectedCharacter = null;

// UTILIDADES
function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

function shuffleAnswers(question) {
    const indices = shuffle([0, 1, 2, 3]);
    const newAnswers = indices.map(i => question.answers[i]);
    const newCorrect = indices.indexOf(question.correct);
    return { ...question, answers: newAnswers, correct: newCorrect };
}

// ESTADO DEL JUEGO
let sessionQuestions = [];
const QUESTIONS_PER_GAME = 15;

let gameState = {
    currentQuestion: 0,
    score: 0,
    answers: [],
    answered: false
};

let timerInterval = null;
let timeLeft = 15;

// REFERENCIAS DOM
const selectionScreen = document.getElementById('selectionScreen');
const characterSelectScreen = document.getElementById('characterSelectScreen');
const introScreen = document.getElementById('introScreen');
const gameScreen = document.getElementById('gameScreen');
const resultsScreen = document.getElementById('resultsScreen');
const startBtn = document.getElementById('startBtn');
const nextBtn = document.getElementById('nextBtn');
const finishBtn = document.getElementById('finishBtn');
const confirmCharBtn = document.getElementById('confirmCharBtn');
const scoreText = document.getElementById('scoreText');
const questionText = document.getElementById('questionText');
const questionNum = document.getElementById('questionNum');
const answersContainer = document.getElementById('answersContainer');
const character = document.getElementById('character');
const characterMsg = document.getElementById('characterMsg');
const progressBar = document.getElementById('progressBar');
const timerBar = document.getElementById('timerBar');
const timerLabel = document.getElementById('timerLabel');
const explanationBlock = document.getElementById('explanationBlock');
const explanationText = document.getElementById('explanationText');
const finalPercentage = document.getElementById('finalPercentage');
const rewardTitle = document.getElementById('rewardTitle');
const rewardDescription = document.getElementById('rewardDescription');
const rewardContainer = document.getElementById('rewardContainer');
const scoreRing = document.getElementById('scoreRing');

// Modal contraseña
const passwordModal = document.getElementById('passwordModal');
const passwordInput = document.getElementById('passwordInput');
const passwordError = document.getElementById('passwordError');
const cancelPasswordBtn = document.getElementById('cancelPasswordBtn');
const confirmPasswordBtn = document.getElementById('confirmPasswordBtn');

// SISTEMA DE PERSONAJE
let currentExpression = 'idle';
let blinkTimeout = null;
let breatheFrame = null;
let eyeTrackFrame = null;
let isClickReacting = false;
let isReacting = false;

// Control de parpadeo según expresión
let blinkEnabled = true;

function getPrefix() {
    return selectedCharacter === 'char2' ? 'j-' : 'c-';
}

const layers = {
    ojos:         () => document.getElementById(getPrefix() + 'ojos'),
    pupilas:      () => document.getElementById(getPrefix() + 'pupilas'),
    ojosCerr:     () => document.getElementById(getPrefix() + 'ojos-cerr'),
    ojosTrist:    () => document.getElementById(getPrefix() + 'ojos-trist'),
    cejas:        () => document.getElementById(getPrefix() + 'cejas'),
    cejasTrist:   () => document.getElementById(getPrefix() + 'cejas-trist'),
    bocaFel:      () => document.getElementById(getPrefix() + 'boca-fel'),
    bocaTrist:    () => document.getElementById(getPrefix() + 'boca-trist'),
    nariz:        () => document.getElementById(getPrefix() + 'nariz'),
    rostro:       () => document.getElementById(getPrefix() + 'rostro'),
    cuerpo:       () => document.getElementById(getPrefix() + 'cuerpo'),
    cuello:       () => document.getElementById(getPrefix() + 'cuello'),
    hairBack:     () => document.getElementById(getPrefix() + 'hair-back'),
    mechonSup:    () => document.getElementById(getPrefix() + 'mechon-sup'),
    mechInf:      () => document.getElementById(getPrefix() + 'mech-inf'),
    bufandaAtras: () => document.getElementById(getPrefix() + 'bufanda-atras'),
    bufandaDel:   () => document.getElementById(getPrefix() + 'bufanda-del'),
    orejaL:       () => document.getElementById(getPrefix() + 'oreja-l'),
    orejaR:       () => document.getElementById(getPrefix() + 'oreja-r'),
    charWrap:     () => {
        if (selectedCharacter === 'char2') return document.getElementById('charWrapChar2');
        return document.getElementById('charWrapChar1');
    },
};

function getLayerGroups() {
    const p = getPrefix();
    if (selectedCharacter === 'char2') {
        return {
            head:  [p+'rostro', p+'ojos', p+'ojos-trist', p+'pupilas', p+'ojos-cerr',
                    p+'cejas', p+'cejas-trist', p+'nariz', p+'boca-fel', p+'boca-trist',
                    p+'oreja-l', p+'oreja-r', 'j-lentes'],
            body:  [p+'cuerpo', p+'cuello', 'j-chompa-del'],
            hair:  [p+'hair-back', p+'mechon-sup', p+'mech-inf'],
            scarf: [p+'bufanda-atras', p+'bufanda-del']
        };
    }
    return {
        head:  [p+'rostro', p+'ojos', p+'ojos-trist', p+'pupilas', p+'ojos-cerr',
                p+'cejas', p+'cejas-trist', p+'nariz', p+'boca-fel', p+'boca-trist',
                p+'oreja-l', p+'oreja-r'],
        body:  [p+'cuerpo', p+'cuello'],
        hair:  [p+'hair-back', p+'mechon-sup', p+'mech-inf'],
        scarf: [p+'bufanda-atras', p+'bufanda-del']
    };
}

const layerGroups = new Proxy({}, {
    get(_, prop) { return getLayerGroups()[prop]; }
});

function setLayerVisible(el, visible) {
    if (!el) return;
    el.style.opacity = visible ? '1' : '0';
}

function applyExpression(expr) {
    setLayerVisible(layers.ojos(), !!expr.ojos);
    setLayerVisible(layers.ojosTrist(), !!expr.ojosTrist);
    setLayerVisible(layers.pupilas(), !!expr.ojos);
    setLayerVisible(layers.ojosCerr(), !!expr.ojosCerr);
    setLayerVisible(layers.cejas(), !!expr.cejas);
    setLayerVisible(layers.cejasTrist(), !!expr.cejasTrist);
    setLayerVisible(layers.bocaFel(), !!expr.bocaFel);
    setLayerVisible(layers.bocaTrist(), !!expr.bocaTrist);
}

const EXPRESSIONS = {
    idle: { ojos: true, cejas: true, bocaFel: true },
    happy: { ojos: true, cejas: true, bocaFel: true },
    sad: { ojosTrist: true, cejasTrist: true, bocaTrist: true },
    blink: { ojosCerr: true, cejas: true, bocaFel: true },
    blinkSad: { ojosCerr: true, cejasTrist: true, bocaTrist: true }
};

let breathPhase = 0;

function startBreathe() {
    cancelAnimationFrame(breatheFrame);

    function tick() {
        if (!isReacting && !isClickReacting) {
            breathPhase += 0.02;

            const s = Math.sin(breathPhase);
            const s2 = Math.sin(breathPhase * 0.7);

            const offsetY = -s * 2;
            const cuerpo = layers.cuerpo();
            const cuello = layers.cuello();
            if (cuerpo) cuerpo.style.transform = `translateY(${offsetY}px)`;
            if (cuello) cuello.style.transform = `translateY(${offsetY * 0.9}px)`;

            if (selectedCharacter === 'char2') {
                const chomp = document.getElementById('j-chompa-del');
                if (chomp) chomp.style.transform = `translateY(${offsetY * 0.95}px)`;
            }

            const p = getPrefix();
            const headOffset = -s * 1.5;
            const headIds = selectedCharacter === 'char2'
                ? [p+'rostro', p+'ojos', p+'ojos-trist', p+'pupilas', p+'ojos-cerr',
                   p+'cejas', p+'cejas-trist', p+'nariz', p+'boca-fel', p+'boca-trist',
                   p+'oreja-l', p+'oreja-r', 'j-lentes']
                : [p+'rostro', p+'ojos', p+'ojos-trist', p+'pupilas', p+'ojos-cerr',
                   p+'cejas', p+'cejas-trist', p+'nariz', p+'boca-fel', p+'boca-trist',
                   p+'oreja-l', p+'oreja-r'];

            headIds.forEach(id => {
                const el = document.getElementById(id);
                if (el && !el.style.animation) {
                    el.style.transform = `translateY(${headOffset}px)`;
                }
            });

            const hairBack = layers.hairBack();
            const mechonSup = layers.mechonSup();
            const mechInf = layers.mechInf();
            if (hairBack) hairBack.style.transform = `translateY(${-s * 1.1}px) rotate(${s2 * 0.4}deg)`;
            if (mechonSup) mechonSup.style.transform = `translateY(${-s * 1.3}px) rotate(${s2 * 0.5}deg)`;
            if (mechInf) mechInf.style.transform = `translateY(${-s * 1.2}px) rotate(${-s2 * 0.3}deg)`;

            const bufDel = layers.bufandaDel();
            const bufAtras = layers.bufandaAtras();
            if (bufDel) bufDel.style.transform = `translateY(${-s * 1.8}px)`;
            if (bufAtras) bufAtras.style.transform = `translateY(${-s * 1.4}px)`;
        }

        breatheFrame = requestAnimationFrame(tick);
    }

    breatheFrame = requestAnimationFrame(tick);
}

function scheduleBlink() {
    clearTimeout(blinkTimeout);
    const delay = 2000 + Math.random() * 4000;
    blinkTimeout = setTimeout(() => {
        // Solo parpadear si no estamos en expresión triste y no hay animaciones activas
        if (!isReacting && !isClickReacting && blinkEnabled && currentExpression !== 'sad') {
            doBlink();
        }
        scheduleBlink();
    }, delay);
}

function doBlink() {
    const baseExpr = EXPRESSIONS[currentExpression] || EXPRESSIONS.idle;
    applyExpression({ ...baseExpr, ojos: false, ojosCerr: true });
    setTimeout(() => {
        if (!isReacting && !isClickReacting && currentExpression !== 'sad') {
            applyExpression(EXPRESSIONS[currentExpression] || EXPRESSIONS.idle);
        } else if (currentExpression === 'sad') {
            applyExpression(EXPRESSIONS.sad);
        }
    }, 90);
}

let targetPupilX = 0, targetPupilY = 0;
let currentPupilX = 0, currentPupilY = 0;
const MAX_PUPIL_OFFSET = 4.5;

document.addEventListener('mousemove', (e) => {
    const wrap = layers.charWrap();
    if (!wrap) return;
    const rect = wrap.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 3;
    const angle = Math.atan2(e.clientY - cy, e.clientX - cx);
    const dist = Math.min(Math.hypot(e.clientX - cx, e.clientY - cy) / 100, 1) * MAX_PUPIL_OFFSET;
    targetPupilX = Math.cos(angle) * dist;
    targetPupilY = Math.sin(angle) * dist * 0.5;
});

function startEyeTrack() {
    cancelAnimationFrame(eyeTrackFrame);
    function tick() {
        currentPupilX += (targetPupilX - currentPupilX) * 0.12;
        currentPupilY += (targetPupilY - currentPupilY) * 0.12;

        const p = layers.pupilas();
        const ojos = layers.ojos();
        if (p && ojos && ojos.style.opacity !== '0') {
            const breathY = !isReacting && !isClickReacting
                ? -Math.sin(breathPhase) * 1.5
                : 0;
            p.style.transform = `translate(${currentPupilX}px, ${currentPupilY + breathY}px)`;
        }
        eyeTrackFrame = requestAnimationFrame(tick);
    }
    eyeTrackFrame = requestAnimationFrame(tick);
}

function clearAllAnimations() {
    const wrap = layers.charWrap();
    if (!wrap) return;
    wrap.querySelectorAll('.layer').forEach(layer => {
        layer.style.animation = '';
        layer.style.transform = '';
    });
}

function applyLayeredAnimation(type, duration) {
    isReacting = true;
    clearAllAnimations();

    const wrap = layers.charWrap();
    if (wrap) void wrap.offsetWidth;

    switch(type) {
        case 'bounce':
            layerGroups.body.forEach(id => setAnim(id, `celebrate-body ${duration}ms cubic-bezier(0.34,1.4,0.64,1)`));
            layerGroups.head.forEach(id => setAnim(id, `celebrate-head ${duration}ms cubic-bezier(0.34,1.4,0.64,1)`));
            layerGroups.hair.forEach(id => setAnim(id, `celebrate-hair ${duration}ms cubic-bezier(0.34,1.4,0.64,1)`));
            layerGroups.scarf.forEach(id => setAnim(id, `celebrate-scarf ${duration}ms cubic-bezier(0.34,1.4,0.64,1)`));
            break;

        case 'crouch':
            layerGroups.body.forEach(id => setAnim(id, `sad-body ${duration}ms ease-in-out`));
            layerGroups.head.forEach(id => setAnim(id, `sad-head ${duration}ms ease-in-out`));
            layerGroups.hair.forEach(id => setAnim(id, `sad-hair ${duration}ms ease-in-out`));
            layerGroups.scarf.forEach(id => setAnim(id, `sad-scarf ${duration}ms ease-in-out`));
            break;

        case 'shake':
            layerGroups.body.forEach(id => setAnim(id, `click-body-wiggle ${duration}ms ease-out`));
            layerGroups.head.forEach(id => setAnim(id, `click-head-tilt ${duration}ms ease-out`));
            layerGroups.hair.forEach(id => setAnim(id, `click-hair-sway ${duration}ms ease-out`));
            layerGroups.scarf.forEach(id => setAnim(id, `click-scarf-lag ${duration}ms ease-out`));
            break;
    }

    setTimeout(() => {
        isReacting = false;
        clearAllAnimations();
    }, duration + 50);
}

function setAnim(id, value) {
    const el = document.getElementById(id);
    if (el) el.style.animation = value;
}

function setCharacterExpression(name) {
    currentExpression = name;
    // Habilitar/deshabilitar parpadeo según expresión
    blinkEnabled = (name !== 'sad');
    applyExpression(EXPRESSIONS[name] || EXPRESSIONS.idle);
}

function characterReaction(type) {
    if (type === 'happy') {
        setCharacterExpression('happy');
        const baseExpr = EXPRESSIONS.happy;
        applyExpression({ ...baseExpr, ojos: false, ojosCerr: true });
        applyLayeredAnimation('bounce', 800);
        setTimeout(() => {
            if (currentExpression === 'happy') {
                applyExpression(EXPRESSIONS.happy);
            }
        }, 800);
    } else if (type === 'sad') {
        setCharacterExpression('sad');
        applyLayeredAnimation('crouch', 800);
    }
}

function setCharacterMsg(text) { 
    characterMsg.textContent = text; 
}

function handleImageErrors() {
    document.querySelectorAll('.char-wrap img, .char-select-wrap img').forEach(img => {
        img.addEventListener('error', function() {
            this.classList.add('img-error');
            this.style.visibility = 'hidden';
        });
        img.addEventListener('load', function() {
            this.classList.remove('img-error');
        });
    });
}

// SELECCIÓN DE PERSONAJE - Animaciones
let previewBlink1 = null;
let previewBlink2 = null;

function schedulePreviewBlink(cardId, ojosClass, ojosCerrClass) {
    function doBlink() {
        const wrap = document.querySelector(`#${cardId} .char-select-wrap`);
        if (!wrap) return;
        const ojos = wrap.querySelector(ojosClass);
        const ojosCerr = wrap.querySelector(ojosCerrClass);
        if (ojos) ojos.style.opacity = '0';
        if (ojosCerr) ojosCerr.style.opacity = '1';
        setTimeout(() => {
            if (ojos) ojos.style.opacity = '1';
            if (ojosCerr) ojosCerr.style.opacity = '0';
        }, 90);
    }

    function schedule() {
        const delay = 2500 + Math.random() * 3500;
        return setTimeout(() => {
            doBlink();
            const timeout = schedule();
            if (cardId === 'selectChar1') previewBlink1 = timeout;
            else previewBlink2 = timeout;
        }, delay);
    }

    return schedule();
}

function startPreviewBreathe() {
    document.querySelectorAll('.char-select-wrap').forEach(w => {
        w.classList.add('breathing');
    });
}

function playPreviewHappy(cardId) {
    const wrap = document.querySelector(`#${cardId} .char-select-wrap`);
    if (!wrap) return;
    const ojosClass = cardId === 'selectChar1' ? '.cs1-ojos' : '.cs2-ojos';
    const ojosCerrClass = cardId === 'selectChar1' ? '.cs1-ojos-cerr' : '.cs2-ojos-cerr';

    const ojos = wrap.querySelector(ojosClass);
    const ojosCerr = wrap.querySelector(ojosCerrClass);

    if (ojos) ojos.style.opacity = '0';
    if (ojosCerr) ojosCerr.style.opacity = '1';

    wrap.classList.remove('breathing');
    void wrap.offsetWidth;
    wrap.style.animation = 'charSelectBounce 0.7s cubic-bezier(0.34,1.4,0.64,1)';

    setTimeout(() => {
        if (ojos) ojos.style.opacity = '1';
        if (ojosCerr) ojosCerr.style.opacity = '0';
        wrap.style.animation = '';
        wrap.classList.add('breathing');
    }, 700);
}

function initCharacterSelection() {
    const cards = document.querySelectorAll('.char-select-card');
    
    startPreviewBreathe();

    previewBlink1 = schedulePreviewBlink('selectChar1', '.cs1-ojos', '.cs1-ojos-cerr');
    previewBlink2 = schedulePreviewBlink('selectChar2', '.cs2-ojos', '.cs2-ojos-cerr');

    cards.forEach(card => {
        card.addEventListener('click', () => {
            const charId = card.dataset.char;

            if (card.classList.contains('selected')) {
                card.classList.remove('selected');
                selectedCharacter = null;
                cards.forEach(c => {
                    c.classList.remove('dimmed');
                    c.style.pointerEvents = '';
                });
                confirmCharBtn.disabled = true;
                return;
            }

            selectedCharacter = charId;

            cards.forEach(c => {
                c.classList.remove('selected', 'dimmed');
                c.style.pointerEvents = '';
                c.querySelector('.char-select-wrap').classList.add('breathing');
            });

            card.classList.add('selected');
            card.style.pointerEvents = '';

            cards.forEach(c => {
                if (c !== card) {
                    c.classList.add('dimmed');
                    c.style.pointerEvents = 'none';
                }
            });

            playPreviewHappy(card.id);
            confirmCharBtn.disabled = false;
        });

        // Efecto de wiggle al pasar el mouse SOLO si no está seleccionado ni dimmed
        card.addEventListener('mouseenter', () => {
            if (card.classList.contains('dimmed') || card.classList.contains('selected')) return;
            const wrap = card.querySelector('.char-select-wrap');
            wrap.style.animation = 'charSelectWiggle 0.5s ease';
            setTimeout(() => {
                wrap.style.animation = '';
                if (!card.classList.contains('selected')) {
                    wrap.classList.add('breathing');
                }
            }, 500);
        });
    });
}

function applySelectedCharacter() {
    const wrap1 = document.getElementById('charWrapChar1');
    const wrap2 = document.getElementById('charWrapChar2');
    if (selectedCharacter === 'char2') {
        wrap1.style.display = 'none';
        wrap2.style.display = 'block';
    } else {
        wrap1.style.display = 'block';
        wrap2.style.display = 'none';
    }
}

function initCharacter() {
    handleImageErrors();
    setCharacterExpression('idle');
    scheduleBlink();
    startBreathe();
    startEyeTrack();
}

// SELECCIÓN DE QUIZ
document.querySelectorAll('.quiz-option-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
        const file = btn.dataset.file;
        const label = btn.dataset.label;

        document.querySelectorAll('.quiz-option-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');

        selectedQuizFile = file;
        selectedQuizLabel = label;

        try {
            const res = await fetch(file);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            quizQuestions = data.questions;
            rewards = data.rewards;
        } catch (err) {
            console.warn('Error cargando quiz:', err.message);
            alert('No se pudo cargar el quiz de ' + label + '. Verifica que el archivo existe.');
            return;
        }

        const introTitle = document.querySelector('.intro-title');
        if (introTitle) {
            introTitle.innerHTML = `Quiz de<br><span>${label}</span>`;
        }

        selectionScreen.classList.remove('active');
        characterSelectScreen.classList.add('active');

        selectedCharacter = null;
        confirmCharBtn.disabled = true;
        document.querySelectorAll('.char-select-card').forEach(c => {
            c.classList.remove('selected', 'dimmed');
            c.style.pointerEvents = '';
        });
    });
});

confirmCharBtn.addEventListener('click', () => {
    if (!selectedCharacter) return;
    characterSelectScreen.classList.remove('active');
    introScreen.classList.add('active');
    startBtn.disabled = false;
});

// EVENTOS
startBtn.addEventListener('click', startGame);
nextBtn.addEventListener('click', nextQuestion);
finishBtn.addEventListener('click', finishGame);

character.addEventListener('click', () => {
    if (isClickReacting) return;
    isClickReacting = true;
    
    // Al hacer click: cerrar ojos solo si no está triste
    if (currentExpression !== 'sad') {
        const baseExpr = EXPRESSIONS[currentExpression] || EXPRESSIONS.idle;
        applyExpression({ ...baseExpr, ojos: false, ojosCerr: true });
    } else {
        // Si está triste, mantener expresión triste pero con ojos cerrados temporalmente
        applyExpression({ ...EXPRESSIONS.sad, ojosCerr: true, ojosTrist: false });
    }
    
    applyLayeredAnimation('shake', 500);
    
    const messages = [
        '¡Me haces cosquillas! 😄',
        '¡Oye! 🎵',
        '¡Concéntrate! 📚',
        '¡Vamos, tú puedes! 💪',
        '¡Qué divertido! ✨',
        '¡Otra vez! 🎉'
    ];
    setCharacterMsg(messages[Math.floor(Math.random() * messages.length)]);
    
    setTimeout(() => {
        if (currentExpression === 'sad') {
            applyExpression(EXPRESSIONS.sad);
        } else {
            applyExpression(EXPRESSIONS[currentExpression] || EXPRESSIONS.idle);
        }
    }, 150);
    
    setTimeout(() => {
        isClickReacting = false;
        if (!gameState.answered && gameScreen.classList.contains('active')) {
            setCharacterMsg('¡Piensalo bien! 🤔');
        }
    }, 700);
});

// JUEGO
function startGame() {
    sessionQuestions = shuffle(quizQuestions)
        .slice(0, QUESTIONS_PER_GAME)
        .map(shuffleAnswers);

    gameState = { currentQuestion: 0, score: 0, answers: [], answered: false };
    introScreen.classList.remove('active');
    gameScreen.classList.add('active');

    applySelectedCharacter();
    initCharacter();

    loadQuestion();
    updateScore();
}

function loadQuestion() {
    const question = sessionQuestions[gameState.currentQuestion];

    questionNum.textContent = gameState.currentQuestion + 1;
    const pct = (gameState.currentQuestion / sessionQuestions.length) * 100;
    progressBar.style.width = pct + '%';

    questionText.textContent = question.question;
    answersContainer.innerHTML = '';
    explanationBlock.classList.add('hidden');

    question.answers.forEach((answer, index) => {
        const btn = document.createElement('button');
        btn.className = 'answer-btn';
        btn.textContent = answer;
        btn.addEventListener('click', () => selectAnswer(index));
        answersContainer.appendChild(btn);
    });

    gameState.answered = false;
    nextBtn.disabled = true;

    setCharacterMsg('¡Piensalo bien! 🤔');
    setCharacterExpression('idle');
    startTimer();
}

function selectAnswer(index) {
    if (gameState.answered) return;
    clearTimer();
    gameState.answered = true;

    const question = sessionQuestions[gameState.currentQuestion];
    const isCorrect = index === question.correct;

    gameState.answers.push({ questionId: question.id, selected: index, correct: question.correct, isCorrect });

    if (isCorrect) {
        gameState.score++;
        characterReaction('happy');
        setCharacterMsg('¡Sí! ¡Correcto! 🎉');
    } else {
        characterReaction('sad');
        setCharacterMsg('¡Casi! Sigue intentando 💪');
        explanationText.textContent = question.explanation;
        explanationBlock.classList.remove('hidden');
    }

    const buttons = document.querySelectorAll('.answer-btn');
    buttons.forEach((btn, i) => {
        btn.disabled = true;
        if (i === question.correct) btn.classList.add('correct');
        else if (i === index && !isCorrect) btn.classList.add('incorrect');
    });

    updateScore();
    nextBtn.disabled = false;
}

function nextQuestion() {
    gameState.currentQuestion++;
    if (gameState.currentQuestion < sessionQuestions.length) {
        loadQuestion();
    } else {
        showResults();
    }
}

function showResults() {
    clearTimer();
    gameScreen.classList.remove('active');
    resultsScreen.classList.add('active');

    const percentage = Math.round((gameState.score / sessionQuestions.length) * 100);
    finalPercentage.textContent = percentage + '%';

    const circumference = 2 * Math.PI * 52;
    const offset = circumference - (percentage / 100) * circumference;
    setTimeout(() => { scoreRing.style.strokeDashoffset = offset; }, 100);

    const reward = rewards.find(r => percentage >= r.minScore && percentage <= r.maxScore);
    if (reward) {
        rewardTitle.textContent = reward.title;
        rewardDescription.textContent = reward.description;
        rewardContainer.innerHTML = '';

        if (percentage >= 90) {
            rewardContainer.innerHTML = `
                <img src="gif_exito.gif" alt="¡Felicidades!" class="reward-gif" onerror="this.style.display='none'">
                <p style="font-size:18px;font-weight:800;color:#6D4B8E">🏅 ¡Resultado Perfecto!</p>
                <p style="font-size:13px;font-weight:600;color:#8B7AAA;margin-top:4px">
                    Has alcanzado el nivel más alto. ¡Descarga tu reconocimiento!
                </p>`;
            const dlBtn = document.createElement('button');
            dlBtn.className = 'btn btn-primary';
            dlBtn.style.marginTop = '10px';
            dlBtn.textContent = '⬇ Descargar Mensaje Secreto';
            dlBtn.addEventListener('click', openPasswordModal);
            rewardContainer.appendChild(dlBtn);
        } else {
            rewardContainer.innerHTML = `<p style="font-size:15px;font-weight:600;color:#6B5E8A">${reward.message}</p>`;
        }
    }
}

function finishGame() {
    resultsScreen.classList.remove('active');
    selectionScreen.classList.add('active');
    gameState = { currentQuestion: 0, score: 0, answers: [], answered: false };
}

function updateScore() {
    const pct = Math.round((gameState.score / sessionQuestions.length) * 100);
    scoreText.textContent = pct + '%';
}

// TEMPORIZADOR
function startTimer() {
    clearTimer();
    timeLeft = 15;
    timerBar.style.transition = 'none';
    timerBar.style.width = '100%';
    timerBar.classList.remove('warning');
    timerLabel.textContent = timeLeft;
    timerBar.getBoundingClientRect();
    timerBar.style.transition = 'width 1s linear, background 0.5s';

    timerInterval = setInterval(() => {
        timeLeft--;
        timerLabel.textContent = timeLeft;
        timerBar.style.width = ((timeLeft / 15) * 100) + '%';
        if (timeLeft <= 5) timerBar.classList.add('warning');
        if (timeLeft <= 0) {
            clearTimer();
            if (!gameState.answered) timeExpired();
        }
    }, 1000);
}

function clearTimer() {
    if (timerInterval) { clearInterval(timerInterval); timerInterval = null; }
}

function timeExpired() {
    gameState.answered = true;
    const question = sessionQuestions[gameState.currentQuestion];
    gameState.answers.push({ questionId: question.id, selected: -1, correct: question.correct, isCorrect: false });

    characterReaction('sad');
    setCharacterMsg('¡Se acabo el tiempo! ⏰');

    const buttons = document.querySelectorAll('.answer-btn');
    buttons.forEach((btn, i) => {
        btn.disabled = true;
        if (i === question.correct) btn.classList.add('correct');
    });

    explanationText.textContent = question.explanation;
    explanationBlock.classList.remove('hidden');
    updateScore();
    nextBtn.disabled = false;
}

// MODAL CONTRASEÑA
const CORRECT_PASSWORD = '2105';

function openPasswordModal() {
    passwordInput.value = '';
    passwordError.classList.add('hidden');
    passwordModal.classList.remove('hidden');
    setTimeout(() => passwordInput.focus(), 100);
}

function closePasswordModal() {
    passwordModal.classList.add('hidden');
}

function attemptDownload() {
    if (passwordInput.value === CORRECT_PASSWORD) {
        closePasswordModal();
        const link = document.createElement('a');
        link.href = 'bWVuc2FqZQ==.pdf';
        link.download = 'certificado_' + selectedQuizLabel.toLowerCase() + '.pdf';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } else {
        passwordError.classList.remove('hidden');
        passwordInput.value = '';
        passwordInput.focus();
        passwordInput.classList.add('shake-error');
        setTimeout(() => passwordInput.classList.remove('shake-error'), 500);
    }
}

cancelPasswordBtn.addEventListener('click', closePasswordModal);
confirmPasswordBtn.addEventListener('click', attemptDownload);
passwordInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') attemptDownload();
    if (e.key === 'Escape') closePasswordModal();
});
passwordModal.addEventListener('click', (e) => {
    if (e.target === passwordModal) closePasswordModal();
});

// INIT
async function init() {
    initCharacterSelection();
    handleImageErrors();
    startBtn.disabled = true;
}

window.addEventListener('DOMContentLoaded', init);