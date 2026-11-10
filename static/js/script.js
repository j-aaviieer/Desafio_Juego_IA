// ===================================================================
// 5 clases en programación - lógica del juego
// ===================================================================

// RUTA DE ASSETS DE IMÁGENES (relativas a index.html)
const ASSET_PATHS = {
    oficina: 'static/images/oficina.jpg',
    camara1: 'static/images/camara1.jpg',
    camara2: 'static/images/camara2.jpg',
    camara3: 'static/images/camara3.jpg',
    camara4: 'static/images/camara4.jpg',
    camara5: 'static/images/camara5.jpg',
    camara6: 'static/images/camara6.jpg',
    freddy: 'static/images/freddy.png',
    bonnie: 'static/images/bonnie.png',
    chica: 'static/images/chica.png',
    foxy: 'static/images/foxy.png',
    freddyScreamer: 'static/images/freddyScreamer.png',
    bonnieScreamer: 'static/images/bonnieScreamer.png',
    chicaScreamer: 'static/images/chicaScreamer.png',
    foxyScreamer: 'static/images/foxyScreamer.png'
};

// Para el cargador local de imágenes (clave, etiqueta)
const ASSET_LABELS = [
    ['oficina', 'Oficina (oficina.jpg)'],
    ['camara1', 'Cámara 1 · Salida (camara1.jpg)'],
    ['camara2', 'Cámara 2 · Computadores (camara2.jpg)'],
    ['camara3', 'Cámara 3 · Sillas del fondo (camara3.jpg)'],
    ['camara4', 'Cámara 4 · Pasillo (camara4.jpg)'],
    ['camara5', 'Cámara 5 · PC del profesor (camara5.jpg)'],
    ['camara6', 'Cámara 6 · Pizarrón (camara6.jpg)'],
    ['freddy', 'Ariel (freddy.png)'],
    ['bonnie', 'Vicente (bonnie.png)'],
    ['chica', 'Fernando (chica.png)'],
    ['foxy', 'Alan (foxy.png)'],
    ['freddyScreamer', 'Screamer Ariel (freddyScreamer.png)'],
    ['bonnieScreamer', 'Screamer Vicente (bonnieScreamer.png)'],
    ['chicaScreamer', 'Screamer Fernando (chicaScreamer.png)'],
    ['foxyScreamer', 'Screamer Alan (foxyScreamer.png)'],
    ['fondoFnaf', 'Fondo del menú (fondoFnaf)']
];

const CUSTOM_ASSETS = {};

// Los archivos conservan los nombres originales (freddy, bonnie...), pero en el juego se llaman así:
const DISPLAY_NAMES = { freddy: 'Ariel', bonnie: 'Vicente', chica: 'Fernando', foxy: 'Alan' };

const CAM_NAMES = {
    1: 'Salida',
    2: 'Computadores',
    3: 'Sillas del fondo',
    4: 'Pasillo',
    5: 'PC del profesor',
    6: 'Pizarrón'
};

const AI_TICK_MS = 4970;         // Tick de IA de FNAF 1
const SECONDS_PER_HOUR = 89;     // Cada hora dura 89s en el original (noche ≈ 9 min)
const POWER_PER_USAGE = 1 / 9.6; // % por segundo por cada nivel de uso
const MONITOR_COOLDOWN_MS = 600;
const INTRO_MS = 3500;
const FOXY_RUN_SECONDS = 6;        // Tiempo que tarda Alan en correr por el pasillo
const MAX_NIGHT = 6;
const SAVE_KEY = 'fnafvc_night';

// Niveles de IA base por noche (aproximados a FNAF 1; ajústalos a tu gusto)
const NIGHT_AI = {
    1: { freddy: 0, bonnie: 0, chica: 0, foxy: 0 },
    2: { freddy: 0, bonnie: 3, chica: 1, foxy: 1 },
    3: { freddy: 1, bonnie: 0, chica: 5, foxy: 2 },
    4: { freddy: 2, bonnie: 2, chica: 4, foxy: 6 },
    5: { freddy: 3, bonnie: 5, chica: 7, foxy: 5 },
    6: { freddy: 4, bonnie: 10, chica: 12, foxy: 6 }
};

// Subidas de IA por hora (solo noches normales)
const HOUR_BOOSTS = {
    2: ['bonnie'],
    3: ['bonnie', 'chica', 'foxy'],
    4: ['bonnie', 'chica', 'foxy']
};

// ===================================================================
// MAPA: por dónde puede moverse cada uno (números = cámaras)
//   6 Pizarrón (escenario) · 1 Salida · 2 Computadores · 5 PC del profesor
//   4 Pasillo (junto a tu puerta izquierda) · 3 Sillas del fondo (Alan)
// Cada lista son destinos posibles; se elige uno al azar.
// ===================================================================
const ROUTES = {
    bonnie: { 6: [1, 2], 1: [2, 4], 2: [1, 4], 4: ['left_door'] },        // Vicente → puerta izquierda
    chica:  { 6: [1], 1: [2, 5], 2: [1, 5], 5: ['right_door', 1] },       // Fernando → puerta derecha
    freddy: { 6: [1], 1: [5], 5: ['right_door'] }                         // Ariel → puerta derecha
};
const DOOR_OF = { bonnie: 'left_door', chica: 'right_door', freddy: 'right_door' };

const ORDINALS = ['', '1st', '2nd', '3rd', '4th', '5th', '6th'];
const ANIM_KEYS = ['freddy', 'bonnie', 'chica', 'foxy'];
const STARS_KEY = 'fnafvc_stars';

// Llamadas del profesor al empezar cada noche (subtítulos + voz del navegador)
const CALLS = {
    1: [
        'Hola, hola... ¿me escuchas? Soy el profesor. Bienvenido a tu primer turno nocturno en la clase de programación.',
        'Seguro ya conoces a Ariel, Vicente, Fernando y Alan. Son muy cariñosos... pero se ponen un poco agresivos si nadie los mira.',
        'Así que revisa las cámaras con frecuencia. Si alguno llega a tu puerta, ciérrala. Pero ojo con la energía: todo lo que uses la gasta.',
        'Y si te quedas sin energía, Ariel tocará su melodía... y no será una melodía de aprobación.',
        'Bueno, es solo una noche. ¡Mucha suerte, y no copies código sin entenderlo!'
    ],
    2: [
        'Hola otra vez. Veo que sobreviviste. ¡Eso es una nota excelente!',
        'Esta noche Vicente anda más inquieto. Le gusta pasar por los computadores y por el pasillo. Mantén la puerta izquierda a mano.',
        'Ah, y no olvides revisar a Alan en las sillas del fondo. Si no lo miras... bueno, corre bastante rápido.',
        'Ánimo, que ya casi es el fin del trimestre.'
    ],
    3: [
        'Buenas noches. Hoy hay evaluación sorpresa, y los alumnos están nerviosos.',
        'Fernando se mueve mucho por la salida y por el computador del profesor. Ese es el camino hacia tu puerta derecha.',
        'Si ves que algo se acerca, cierra la puerta. Pero no la dejes cerrada todo el rato, ¿eh? La energía no es infinita.',
        'Hasta luego.'
    ],
    4: [
        'Te llamo rápido porque hoy hay mucho trabajo. Alan está especialmente activo.',
        'Mira la cámara 3 de vez en cuando. Mientras la veas, él no se mueve. Pero si sale por el pasillo, solo tendrás unos segundos.',
        'Cada golpe en la puerta gasta más energía que el anterior, así que no lo subestimes.',
        'Ya casi lo logras. Buena suerte.'
    ],
    5: [
        'Quinta noche. Aquí la cosa se pone seria.',
        'Ariel se vuelve más paciente, y eso no es buena señal. No se mueve mientras lo miras, pero sigue avanzando cuando no.',
        'Si todo sale bien, mañana tendrás tu último reto. Si no... nos vemos en recuperación.'
    ],
    6: [
        'Última noche. Tengo que reconocer que estoy impresionado.',
        'Hoy todos están en su mejor forma. Vicente y Fernando no pararán de intentar entrar por sus puertas.',
        'Cuida la energía, cierra solo lo necesario y mira las cámaras con calma. Tú puedes.',
        'Cuando amanezca, habrás aprobado el curso. ¡Éxito!'
    ]
};

// ===================================================================
// AUDIO SINTÉTICO (Web Audio API)
// ===================================================================
class SoundEngine {
    constructor() { this.ctx = null; }

    init() {
        if (!this.ctx) {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (this.ctx.state === 'suspended') this.ctx.resume();
    }

    playTone(freq, type, duration, volume = 0.1) {
        if (!this.ctx) return;
        try {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = type;
            osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
            gain.gain.setValueAtTime(volume, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start();
            osc.stop(this.ctx.currentTime + duration);
        } catch (e) {}
    }

    playClick()     { this.playTone(800, 'square', 0.05, 0.05); }
    playDoor()      { this.playTone(120, 'sawtooth', 0.2, 0.25); }
    playDoorKnock() { this.playTone(80, 'square', 0.35, 0.3); }
    playLight()     { this.playTone(650, 'sine', 0.08, 0.08); }
    playMonitor()   { this.playTone(340, 'triangle', 0.15, 0.1); }
    playGlitch()    { this.playTone(1800, 'sawtooth', 0.08, 0.04); }
    playHonk()      { this.playTone(330, 'square', 0.12, 0.15); setTimeout(() => this.playTone(392, 'square', 0.18, 0.15), 120); }
    playBell()      { [880, 1108, 1318].forEach((f, i) => setTimeout(() => this.playTone(f, 'sine', 1.2, 0.15), i * 250)); }
    playFootsteps() { [0, 280, 560].forEach(t => setTimeout(() => this.playTone(70, 'sine', 0.18, 0.28), t)); }
    playRun()       { for (let i = 0; i < 8; i++) setTimeout(() => this.playTone(60 + (i % 2) * 15, 'square', 0.12, 0.2), i * 110); }

    makeNoiseBuffer(seconds = 2) {
        const len = Math.floor(this.ctx.sampleRate * seconds);
        const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
        const d = buf.getChannelData(0);
        for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
        return buf;
    }

    // Ventilador/zumbido de la oficina + estática de cámaras (silenciosa hasta abrir el monitor)
    startAmbience() {
        if (!this.ctx || this.amb) return;
        try {
            const c = this.ctx;
            const noise = this.makeNoiseBuffer(2);

            const fan = c.createBufferSource(); fan.buffer = noise; fan.loop = true;
            const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 220;
            const fanGain = c.createGain(); fanGain.gain.value = 0.06;
            fan.connect(lp); lp.connect(fanGain); fanGain.connect(c.destination);

            const hum = c.createOscillator(); hum.type = 'sine'; hum.frequency.value = 55;
            const humGain = c.createGain(); humGain.gain.value = 0.025;
            hum.connect(humGain); humGain.connect(c.destination);

            const stat = c.createBufferSource(); stat.buffer = noise; stat.loop = true;
            const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 2600; bp.Q.value = 0.6;
            const statGain = c.createGain(); statGain.gain.value = 0;
            stat.connect(bp); bp.connect(statGain); statGain.connect(c.destination);

            fan.start(); hum.start(); stat.start();
            this.amb = { nodes: [fan, hum, stat], statGain };
        } catch (e) {}
    }

    stopAmbience() {
        if (!this.amb) return;
        this.amb.nodes.forEach(n => { try { n.stop(); } catch (e) {} });
        this.amb = null;
    }

    setCamStatic(on) {
        if (this.amb) this.amb.statGain.gain.setTargetAtTime(on ? 0.035 : 0, this.ctx.currentTime, 0.05);
    }

    // Caja de música del apagón (melodía propia, en menor)
    startMusicBox() {
        if (!this.ctx) return;
        this.stopMusicBox();
        const notes = [523, 494, 392, 330, 392, 311, 262, 311, 262, 247];
        let i = 0;
        const play = () => {
            const f = notes[i % notes.length];
            this.playTone(f, 'triangle', 0.7, 0.14);
            this.playTone(f * 2, 'sine', 0.5, 0.04);
            i++;
        };
        play();
        this.musicTimer = setInterval(play, 420);
    }

    stopMusicBox() {
        clearInterval(this.musicTimer);
        this.musicTimer = null;
    }

    playJumpscareSound() {
        if (!this.ctx) return;
        try {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(350, this.ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(1300, this.ctx.currentTime + 0.3);

            const bufferSize = this.ctx.sampleRate * 1.5;
            const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
            const output = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) output[i] = Math.random() * 2 - 1;
            const whiteNoise = this.ctx.createBufferSource();
            whiteNoise.buffer = buffer;

            gain.gain.setValueAtTime(0.7, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 1.5);

            osc.connect(gain);
            whiteNoise.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start();
            osc.stop(this.ctx.currentTime + 1.5);
            whiteNoise.start();
        } catch (e) {}
    }
}

const sound = new SoundEngine();

// ===================================================================
// IMÁGENES Y FALLBACKS
// ===================================================================
function createDynamicFallbackUrl(key, activeAnimatronics = []) {
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 450;
    const ctx = canvas.getContext('2d');

    const bgColors = {
        oficina: '#111116',
        camara1: '#0b1329',
        camara2: '#1a102f',
        camara3: '#052e16',
        camara4: '#2a0808',
        camara5: '#1f2937',
        camara6: '#1c1917'
    };

    ctx.fillStyle = bgColors[key] || '#18181b';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 2;
    for (let x = 0; x < canvas.width; x += 40) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += 40) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
    }

    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    ctx.font = 'bold 36px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(key.toUpperCase(), canvas.width / 2, 80);

    if (activeAnimatronics.length > 0) {
        activeAnimatronics.forEach((anim, idx) => {
            const posX = (canvas.width / (activeAnimatronics.length + 1)) * (idx + 1);
            const colors = { freddy: '#854d0e', bonnie: '#6b21a8', chica: '#a16207', foxy: '#991b1b' };

            ctx.fillStyle = colors[anim] || '#dc2626';
            ctx.beginPath();
            ctx.arc(posX, 260, 45, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillRect(posX - 35, 290, 70, 100);

            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 16px monospace';
            ctx.fillText(`[ ${(DISPLAY_NAMES[anim] || anim).toUpperCase()} ]`, posX, 265);
        });
    } else if (key.startsWith('camara')) {
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.font = '16px monospace';
        ctx.fillText('• HABITACIÓN VACÍA •', canvas.width / 2, 260);
    }

    return canvas.toDataURL();
}

function getAssetUrl(key) {
    return CUSTOM_ASSETS[key] || ASSET_PATHS[key];
}

// Fondo del menú: prueba static/images/fondoFnaf con varias extensiones
function loadMenuBackdrop() {
    const candidates = CUSTOM_ASSETS.fondoFnaf
        ? [CUSTOM_ASSETS.fondoFnaf]
        : ['png', 'jpg', 'jpeg', 'webp', 'PNG', 'JPG'].map(ext => `static/images/fondoFnaf.${ext}`);

    const tryNext = (i) => {
        if (i >= candidates.length) return; // sin imagen: queda el fondo negro
        const img = new Image();
        img.onload = () => { DOM.menuBackdrop.style.backgroundImage = `url("${candidates[i]}")`; };
        img.onerror = () => tryNext(i + 1);
        img.src = candidates[i];
    };
    tryNext(0);
}

// Asigna una imagen y, si el archivo no existe, usa un fallback dibujado.
function setImg(imgElement, key, anims = []) {
    imgElement.onerror = () => {
        imgElement.onerror = null; // evita bucles si el fallback fallara
        imgElement.src = createDynamicFallbackUrl(key, anims);
    };
    const url = getAssetUrl(key);
    if (imgElement.getAttribute('src') !== url) imgElement.src = url;
}

// ===================================================================
// SPRITES: los PNG de los animatrónicos tienen fondo NEGRO (no transparente).
// Se recorta el negro conectado a los bordes para que no se vean rectángulos
// ni se vean transparentes. Si el navegador bloquea leer píxeles (abrir con
// file://), se usa la imagen tal cual. Con Live Server funciona.
// ===================================================================
const spriteCache = {}; // clave -> url lista para usar

function buildCutout(url) {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
            try {
                const w = img.naturalWidth, h = img.naturalHeight;
                const c = document.createElement('canvas');
                c.width = w; c.height = h;
                const ctx = c.getContext('2d', { willReadFrequently: true });
                ctx.drawImage(img, 0, 0);
                const imgData = ctx.getImageData(0, 0, w, h); // lanza error si el canvas está "tainted"
                const d = imgData.data;

                // Si ya trae transparencia en las esquinas, no hay nada que recortar
                if (d[3] < 10 || d[(w - 1) * 4 + 3] < 10) { resolve(url); return; }

                const THRESH = 45;
                const isBg = (p) => d[p] < THRESH && d[p + 1] < THRESH && d[p + 2] < THRESH;
                const seen = new Uint8Array(w * h);
                const stack = [];
                const push = (x, y) => {
                    const i = y * w + x;
                    if (!seen[i] && isBg(i * 4)) { seen[i] = 1; stack.push(i); }
                };
                for (let x = 0; x < w; x++) { push(x, 0); push(x, h - 1); }
                for (let y = 0; y < h; y++) { push(0, y); push(w - 1, y); }
                while (stack.length) {
                    const i = stack.pop();
                    const x = i % w, y = (i - x) / w;
                    d[i * 4 + 3] = 0;
                    if (x > 0) push(x - 1, y);
                    if (x < w - 1) push(x + 1, y);
                    if (y > 0) push(x, y - 1);
                    if (y < h - 1) push(x, y + 1);
                }
                ctx.putImageData(imgData, 0, 0);
                resolve(c.toDataURL('image/png'));
            } catch (e) { resolve(null); }
        };
        img.onerror = () => resolve(null);
        img.src = url;
    });
}

function refreshSprite(key) {
    const url = getAssetUrl(key);
    buildCutout(url).then(res => {
        if (getAssetUrl(key) !== url) return; // cambió mientras cargaba
        spriteCache[key] = res || url;
        refreshSpritesUI();
    });
}

function preloadSprites() { ANIM_KEYS.forEach(refreshSprite); }

function refreshSpritesUI() {
    if (DOM.gameContainer.classList.contains('hidden')) return;
    updateOfficeUI();
    if (state.isMonitorOpen) updateCameraMonitorUI();
}

function setSprite(img, key) {
    img.onerror = () => { img.onerror = null; img.src = createDynamicFallbackUrl(key, []); };
    const url = spriteCache[key] || getAssetUrl(key);
    if (img.getAttribute('src') !== url) img.src = url;
}

// ===================================================================
// ESTADO GLOBAL
// ===================================================================
const state = {
    isPlaying: false,
    paused: false,
    jumpscared: false,
    power: 100,
    hour: 0,
    currentCam: 6,
    isMonitorOpen: false,
    leftDoor: false,
    rightDoor: false,
    leftLight: false,
    rightLight: false,
    nightNum: 1,
    isCustom: false,
    foxyStage: 0,   // 0: escondido · 1: asoma · 2: sale · 3: corriendo por el pasillo
    foxyHits: 0,    // golpes a la puerta (cada golpe drena más energía)
    foxyRunLeft: 0, // segundos que le quedan a Alan para llegar a tu puerta
    camSwitches: 0, // cámaras revisadas en la noche
    aiLevels: { bonnie: 0, chica: 0, freddy: 0, foxy: 0 },
    animatronics: {
        freddy: { location: 6 },
        bonnie: { location: 6 },
        chica:  { location: 6 },
        foxy:   { location: 3 } // Alan se maneja con foxyStage
    }
};

let gameTimer = null;
let aiTimer = null;
let outageTimer = null;
let jumpscareTimer = null;
let introTimer = null;
let outageFlickerTimer = null;
let callToken = 0;
let callMuted = false;
let gameSeconds = 0;
let lastConfig = { night: 1, custom: false };
const customLevels = { freddy: 0, bonnie: 0, chica: 0, foxy: 0 };

// Control del hover del monitor
let monitorArmed = true;
let lastMonitorToggle = 0;

// Desplazamiento de la oficina con el mouse
const pan = { target: 0.5, current: 0.5 };

// ===================================================================
// REFERENCIAS DOM
// ===================================================================
const $ = (id) => document.getElementById(id);

const DOM = {
    mainMenu: $('mainMenu'),
    gameContainer: $('gameContainer'),
    cameraMonitor: $('cameraMonitor'),
    jumpscareOverlay: $('jumpscareOverlay'),
    gameOverMenu: $('gameOverMenu'),
    victoryMenu: $('victoryMenu'),
    controlsModal: $('controlsModal'),
    assetModal: $('assetModal'),
    blackoutOverlay: $('blackoutOverlay'),
    customNightMenu: $('customNightMenu'),
    nightIntro: $('nightIntro'),
    introTime: $('introTime'),
    introNight: $('introNight'),
    menuBackdrop: $('menuBackdrop'),
    officeScene: $('officeScene'),
    btnMinigames: $('btnMinigames'),
    menuStars: $('menuStars'),
    pauseMenu: $('pauseMenu'),
    btnResume: $('btnResume'),
    btnPauseMenu: $('btnPauseMenu'),
    callSubtitle: $('callSubtitle'),
    btnMuteCall: $('btnMuteCall'),
    camGlitch: $('camGlitch'),
    outageFace: $('outageFace'),
    victoryTime: $('victoryTime'),
    victorySummary: $('victorySummary'),

    btnNewGame: $('btnNewGame'),
    btnContinue: $('btnContinue'),
    btnCustomNight: $('btnCustomNight'),
    continueNight: $('continueNight'),
    btnOpenAssetManager: $('btnOpenAssetManager'),
    btnControlsModal: $('btnControlsModal'),
    btnCloseModal: $('btnCloseModal'),
    btnCloseAssetModal: $('btnCloseAssetModal'),
    btnSaveAssetModal: $('btnSaveAssetModal'),
    btnCnBack: $('btnCnBack'),
    btnCnStart: $('btnCnStart'),
    btnLeftDoor: $('btnLeftDoor'),
    btnLeftLight: $('btnLeftLight'),
    btnRightDoor: $('btnRightDoor'),
    btnRightLight: $('btnRightLight'),
    btnRetry: $('btnRetry'),
    btnGameOverMenu: $('btnGameOverMenu'),
    btnNextNight: $('btnNextNight'),
    btnVictoryMenu: $('btnVictoryMenu'),
    camButtons: document.querySelectorAll('.btn-cam'),

    monitorHoverZone: $('monitorHoverZone'),

    imgOficina: $('imgOficina'),
    imgCameraBackground: $('imgCameraBackground'),
    currentCamTitle: $('currentCamTitle'),
    leftDoorVisual: $('leftDoorVisual'),
    rightDoorVisual: $('rightDoorVisual'),
    leftLightOverlay: $('leftLightOverlay'),
    rightLightOverlay: $('rightLightOverlay'),
    leftDoorAnimatronic: $('leftDoorAnimatronic'),
    rightDoorAnimatronic: $('rightDoorAnimatronic'),
    jumpscareImage: $('jumpscareImage'),

    camSprites: {
        freddy: $('camAnimFreddy'),
        bonnie: $('camAnimBonnie'),
        chica: $('camAnimChica'),
        foxy: $('camAnimFoxy')
    },

    powerPercent: $('powerPercent'),
    clockDisplay: $('clockDisplay'),
    nightLabel: $('nightLabel'),
    assetStatusSummary: $('assetStatusSummary'),
    usageBars: [$('usageBar1'), $('usageBar2'), $('usageBar3'), $('usageBar4'), $('usageBar5')]
};

// ===================================================================
// GESTIÓN DE ARCHIVOS / ASSETS LOCALES
// ===================================================================
function markAssetLoaded(key) {
    const status = $(`status-${key}`);
    if (status) {
        status.innerText = 'Cargado ✅';
        status.className = 'text-[10px] text-green-400 font-bold';
    }
}

function setupAssetManager() {
    const grid = $('assetGrid');
    ASSET_LABELS.forEach(([key, label]) => {
        const box = document.createElement('div');
        box.className = 'p-2.5 bg-gray-950 rounded border border-gray-800 flex flex-col space-y-1';
        box.innerHTML = `
            <span class="font-bold text-gray-200">${label}</span>
            <input type="file" data-asset-key="${key}" accept="image/*" class="asset-file-input text-[10px] text-gray-400">
            <span id="status-${key}" class="text-[10px] text-gray-500">Usando static/images</span>`;
        grid.appendChild(box);
    });

    document.querySelectorAll('.asset-file-input').forEach(input => {
        input.addEventListener('change', (e) => {
            const key = e.target.getAttribute('data-asset-key');
            const file = e.target.files[0];
            if (file && key) {
                CUSTOM_ASSETS[key] = URL.createObjectURL(file);
                markAssetLoaded(key);
                if (key === 'fondoFnaf') loadMenuBackdrop();
                if (ANIM_KEYS.includes(key)) refreshSprite(key);
                updateAssetSummary();
            }
        });
    });

    // Carga masiva: se reconoce por el nombre (primero los nombres más largos,
    // así "freddyScreamer.png" no se confunde con "freddy.png")
    const keysByLength = ASSET_LABELS.map(a => a[0]).sort((a, b) => b.length - a.length);
    $('bulkFileInput').addEventListener('change', (e) => {
        Array.from(e.target.files).forEach(file => {
            const norm = file.name.toLowerCase().replace(/\.[^.]+$/, '').replace(/cam(\d)/g, 'camara$1');
            const key = keysByLength.find(k => norm.includes(k.toLowerCase()))
                || (norm.includes('fondo') ? 'fondoFnaf' : null);
            if (key) {
                CUSTOM_ASSETS[key] = URL.createObjectURL(file);
                markAssetLoaded(key);
            }
        });
        updateAssetSummary();
        loadMenuBackdrop();
        ANIM_KEYS.forEach(refreshSprite);
    });
}

function updateAssetSummary() {
    const count = Object.keys(CUSTOM_ASSETS).length;
    if (count > 0) {
        DOM.assetStatusSummary.innerText = `Assets: ${count}/${ASSET_LABELS.length} cargados manualmente ✅`;
        DOM.assetStatusSummary.className = 'text-xs text-green-400 font-mono font-bold';
    }
}

// ===================================================================
// PUERTAS Y LUCES
// ===================================================================
function canInteract() {
    return state.isPlaying && !state.paused && state.power > 0;
}

function toggleLeftDoor() {
    if (!canInteract()) return;
    state.leftDoor = !state.leftDoor;
    sound.init(); sound.playDoor();
    updateOfficeUI();
}

function toggleRightDoor() {
    if (!canInteract()) return;
    state.rightDoor = !state.rightDoor;
    sound.init(); sound.playDoor();
    updateOfficeUI();
}

function toggleLeftLight() {
    if (!canInteract()) return;
    sound.init(); sound.playLight();
    state.leftLight = !state.leftLight;
    if (state.leftLight) state.rightLight = false;
    updateOfficeUI();
}

function toggleRightLight() {
    if (!canInteract()) return;
    sound.init(); sound.playLight();
    state.rightLight = !state.rightLight;
    if (state.rightLight) state.leftLight = false;
    updateOfficeUI();
}

// ===================================================================
// DESPLAZAMIENTO DE LA OFICINA CON EL MOUSE (como FNAF 1)
// ===================================================================
function setupPanning() {
    window.addEventListener('mousemove', (e) => {
        // Zona muerta en los bordes: al 15% de cada lado ya llegas al tope
        pan.target = Math.min(1, Math.max(0, (e.clientX / window.innerWidth - 0.15) / 0.7));
    });

    function loop() {
        const scene = DOM.officeScene;
        const maxShift = Math.max(0, scene.offsetWidth - window.innerWidth);
        pan.current += (pan.target - pan.current) * 0.08;
        scene.style.transform = `translate3d(${(-pan.current * maxShift).toFixed(1)}px, 0, 0)`;
        requestAnimationFrame(loop);
    }
    loop();
}

// ===================================================================
// INICIALIZACIÓN
// ===================================================================
function initApp() {
    setupAssetManager();
    setupStaticCanvas();
    setupMonitorHover();
    setupPanning();
    setupCustomNight();
    loadMenuBackdrop();
    renderContinue();
    renderStars();
    preloadSprites();
    setupPause();
    setupKeys();

    Minigames.init({
        onExit: () => DOM.mainMenu.classList.remove('hidden')
    });
    DOM.btnMinigames.addEventListener('click', () => {
        sound.init(); sound.playClick();
        DOM.mainMenu.classList.add('hidden');
        Minigames.openHub();
    });

    DOM.btnMuteCall.addEventListener('click', () => {
        callMuted = !callMuted;
        DOM.btnMuteCall.innerText = callMuted ? 'Activar voz' : 'Silenciar llamada';
        if (callMuted) { try { window.speechSynthesis.cancel(); } catch (e) {} }
    });

    DOM.btnNewGame.addEventListener('click', () => {
        sound.init(); sound.playClick();
        saveNight(1);
        startNight({ night: 1, custom: false });
    });

    DOM.btnContinue.addEventListener('click', () => {
        sound.init(); sound.playClick();
        startNight({ night: loadNight(), custom: false });
    });

    DOM.btnCustomNight.addEventListener('click', () => {
        sound.init(); sound.playClick();
        openCustomNight();
    });

    DOM.btnOpenAssetManager.addEventListener('click', () => DOM.assetModal.classList.remove('hidden'));
    DOM.btnCloseAssetModal.addEventListener('click', () => DOM.assetModal.classList.add('hidden'));
    DOM.btnSaveAssetModal.addEventListener('click', () => {
        DOM.assetModal.classList.add('hidden');
        updateAssetSummary();
    });

    DOM.btnControlsModal.addEventListener('click', () => DOM.controlsModal.classList.remove('hidden'));
    DOM.btnCloseModal.addEventListener('click', () => DOM.controlsModal.classList.add('hidden'));

    DOM.btnLeftDoor.addEventListener('click', toggleLeftDoor);
    DOM.btnRightDoor.addEventListener('click', toggleRightDoor);
    DOM.btnLeftLight.addEventListener('click', toggleLeftLight);
    DOM.btnRightLight.addEventListener('click', toggleRightLight);

    DOM.camButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            sound.init(); sound.playClick();
            switchCamera(parseInt(e.currentTarget.getAttribute('data-cam')));
        });
    });

    DOM.btnRetry.addEventListener('click', () => {
        DOM.gameOverMenu.classList.add('hidden');
        startNight(lastConfig);
    });

    DOM.btnGameOverMenu.addEventListener('click', () => {
        DOM.gameOverMenu.classList.add('hidden');
        goToMainMenu();
    });

    DOM.btnNextNight.addEventListener('click', () => {
        DOM.victoryMenu.classList.add('hidden');
        startNight({ night: Math.min(lastConfig.night + 1, MAX_NIGHT), custom: false });
    });

    DOM.btnVictoryMenu.addEventListener('click', () => {
        DOM.victoryMenu.classList.add('hidden');
        goToMainMenu();
    });
}

// ===================================================================
// PROGRESO, MENÚ Y CUSTOM NIGHT
// ===================================================================
function saveNight(n) {
    try { localStorage.setItem(SAVE_KEY, String(n)); } catch (e) {}
}

function loadNight() {
    try {
        const n = parseInt(localStorage.getItem(SAVE_KEY), 10);
        if (n >= 1 && n <= MAX_NIGHT) return n;
    } catch (e) {}
    return 1;
}

function renderContinue() {
    DOM.continueNight.innerText = `Night ${loadNight()}`;
}

function clearAllTimers() {
    clearInterval(gameTimer);
    clearInterval(aiTimer);
    clearTimeout(outageTimer);
    clearTimeout(jumpscareTimer);
    clearTimeout(introTimer);
    clearInterval(outageFlickerTimer);
    sound.stopMusicBox();
    sound.stopAmbience();
    stopCall();
}

function goToMainMenu() {
    clearAllTimers();
    state.isPlaying = false;
    state.paused = false;
    DOM.pauseMenu.classList.add('hidden');
    DOM.outageFace.classList.add('hidden');
    DOM.nightIntro.classList.add('hidden');
    DOM.gameContainer.classList.add('hidden');
    DOM.customNightMenu.classList.add('hidden');
    DOM.mainMenu.classList.remove('hidden');
    renderContinue();
    renderStars();
}

function setupCustomNight() {
    document.querySelectorAll('.cn-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            sound.init(); sound.playClick();
            const anim = btn.getAttribute('data-anim');
            const delta = parseInt(btn.getAttribute('data-delta'), 10);
            setCustomLevel(anim, customLevels[anim] + delta);
        });
    });

    DOM.btnCnBack.addEventListener('click', () => {
        DOM.customNightMenu.classList.add('hidden');
        DOM.mainMenu.classList.remove('hidden');
    });

    DOM.btnCnStart.addEventListener('click', () => {
        sound.init(); sound.playClick();
        DOM.customNightMenu.classList.add('hidden');
        startNight({ night: 0, custom: true, levels: { ...customLevels } });
    });
}

function setCustomLevel(anim, value) {
    customLevels[anim] = Math.max(0, Math.min(20, value)); // límite 0-20
    $(`cnLevel-${anim}`).innerText = customLevels[anim];
}

function openCustomNight() {
    DOM.mainMenu.classList.add('hidden');
    DOM.customNightMenu.classList.remove('hidden');

    // Retrato = imagen de screamer; si no existe, usa la imagen normal
    document.querySelectorAll('.cn-portrait').forEach(img => {
        const key = img.getAttribute('data-portrait');
        const base = key.replace('Screamer', '');
        img.onerror = () => { img.onerror = null; setImg(img, base); };
        img.src = getAssetUrl(key);
    });

    ANIM_KEYS.forEach(a => setCustomLevel(a, customLevels[a]));
}

// ===================================================================
// MONITOR: SE ABRE/CIERRA AL PASAR EL MOUSE POR LA BARRA INFERIOR
// ===================================================================
function setupMonitorHover() {
    const zone = DOM.monitorHoverZone;

    zone.addEventListener('pointerenter', (e) => {
        if (e.pointerType !== 'mouse') return;
        tryToggleMonitor(false);
    });

    // Hay que salir de la barra para poder activarla otra vez (evita parpadeo)
    zone.addEventListener('pointerleave', () => { monitorArmed = true; });

    // Pantallas táctiles: no hay hover, se usa toque
    zone.addEventListener('pointerdown', (e) => {
        if (e.pointerType === 'mouse') return;
        tryToggleMonitor(true);
    });
}

function tryToggleMonitor(ignoreArmed) {
    if (!state.isPlaying || state.paused || state.power <= 0) return;
    if (!ignoreArmed && !monitorArmed) return;

    const now = performance.now();
    if (now - lastMonitorToggle < MONITOR_COOLDOWN_MS) return;

    lastMonitorToggle = now;
    monitorArmed = false;
    toggleMonitor();
}

function toggleMonitor() {
    sound.init();
    sound.playMonitor();
    state.isMonitorOpen = !state.isMonitorOpen;
    DOM.cameraMonitor.classList.toggle('hidden', !state.isMonitorOpen);
    DOM.monitorHoverZone.classList.toggle('open', state.isMonitorOpen);
    sound.setCamStatic(state.isMonitorOpen);
    if (state.isMonitorOpen) { triggerGlitch(); updateCameraMonitorUI(); }
}

function triggerGlitch() {
    DOM.camGlitch.classList.remove('run');
    void DOM.camGlitch.offsetWidth; // reinicia la animación
    DOM.camGlitch.classList.add('run');
    sound.playGlitch();
}

function closeMonitorSilently() {
    state.isMonitorOpen = false;
    DOM.cameraMonitor.classList.add('hidden');
    DOM.monitorHoverZone.classList.remove('open');
    sound.setCamStatic(false);
}

// ===================================================================
// INICIO DE LA NOCHE
// ===================================================================
// config: { night: 1-6, custom: false } o { custom: true, levels: {...} }
function startNight(config) {
    lastConfig = config;
    clearAllTimers();

    state.isPlaying = false; // no corre nada durante la intro
    state.jumpscared = false;
    state.isCustom = !!config.custom;
    state.nightNum = config.night;
    state.aiLevels = config.custom ? { ...config.levels } : { ...NIGHT_AI[config.night] };

    state.power = 100;
    state.hour = 0;
    state.currentCam = 6;
    state.leftDoor = false;
    state.rightDoor = false;
    state.leftLight = false;
    state.rightLight = false;
    state.foxyStage = 0;
    state.foxyHits = 0;
    state.foxyRunLeft = 0;
    state.camSwitches = 0;
    state.paused = false;

    // Todos empiezan en el pizarrón (CAM 6); Alan, escondido en las sillas del fondo
    state.animatronics.freddy.location = 6;
    state.animatronics.bonnie.location = 6;
    state.animatronics.chica.location = 6;

    monitorArmed = true;
    lastMonitorToggle = 0;
    closeMonitorSilently();
    pan.target = 0.5;
    pan.current = 0.5;

    DOM.mainMenu.classList.add('hidden');
    DOM.customNightMenu.classList.add('hidden');
    DOM.gameContainer.classList.remove('hidden');
    DOM.jumpscareOverlay.classList.add('hidden');
    DOM.gameOverMenu.classList.add('hidden');
    DOM.victoryMenu.classList.add('hidden');
    DOM.blackoutOverlay.classList.remove('blackout-on');
    DOM.monitorHoverZone.classList.remove('hidden');
    DOM.outageFace.classList.add('hidden');
    DOM.pauseMenu.classList.add('hidden');
    DOM.gameContainer.classList.remove('low-power');

    DOM.clockDisplay.innerText = '12 AM';
    DOM.powerPercent.innerText = '100%';
    DOM.nightLabel.innerText = config.custom ? 'Custom Night' : `Night ${config.night}`;

    setImg(DOM.imgOficina, 'oficina');
    updateOfficeUI();
    updateCameraMonitorUI();
    updateUsageBars(1);

    DOM.introTime.innerText = '12:00 AM';
    DOM.introNight.innerText = config.custom ? 'Custom Night' : `${ORDINALS[config.night]} Night`;
    DOM.nightIntro.classList.remove('hidden');
    sound.playTone(220, 'sine', 0.8, 0.1);

    introTimer = setTimeout(beginNight, INTRO_MS);
}

function beginNight() {
    DOM.nightIntro.classList.add('hidden');
    state.isPlaying = true;
    gameSeconds = 0;
    gameTimer = setInterval(gameLoopTick, 1000);
    aiTimer = setInterval(animatronicAITick, AI_TICK_MS);
    sound.startAmbience();
    if (!state.isCustom) playCall(state.nightNum);
}

function applyHourBoosts(hour) {
    if (state.isCustom) return;
    (HOUR_BOOSTS[hour] || []).forEach(a => {
        state.aiLevels[a] = Math.min(20, state.aiLevels[a] + 1);
    });
}

function getUsage() {
    let usage = 1;
    if (state.leftDoor) usage++;
    if (state.rightDoor) usage++;
    if (state.leftLight || state.rightLight) usage++;
    if (state.isMonitorOpen) usage++;
    return Math.min(usage, 5);
}

function updateUsageBars(usage) {
    DOM.usageBars.forEach((bar, idx) => {
        bar.className = `usage-bar b${idx + 1}` + (idx < usage ? ' on' : '');
    });
}

function gameLoopTick() {
    if (!state.isPlaying || state.paused) return;

    const usage = getUsage();
    state.power -= usage * POWER_PER_USAGE;
    if (state.power <= 0) {
        state.power = 0;
        DOM.powerPercent.innerText = '0%';
        handlePowerOutage();
        return;
    }

    DOM.powerPercent.innerText = `${Math.ceil(state.power)}%`;
    updateUsageBars(usage);
    DOM.gameContainer.classList.toggle('low-power', state.power <= 20);

    // Alan corriendo por el pasillo: cuenta atrás hasta tu puerta
    if (state.foxyStage === 3) {
        state.foxyRunLeft--;
        if (state.foxyRunLeft <= 0) foxyAttack();
        if (!state.isPlaying) return;
    }

    // Avance del reloj
    gameSeconds++;
    if (gameSeconds >= SECONDS_PER_HOUR) {
        gameSeconds = 0;
        state.hour++;
        if (state.hour >= 6) {
            triggerVictory();
            return;
        }
        applyHourBoosts(state.hour);
        DOM.clockDisplay.innerText = `${state.hour} AM`;
    }
}

// ===================================================================
// IA CON DADO 1-20 (MOVEMENT OPPORTUNITIES)
// ===================================================================
function rollsUnder(level) {
    return Math.floor(Math.random() * 20) + 1 <= level;
}

function animatronicAITick() {
    if (!state.isPlaying || state.paused) return;

    ['bonnie', 'chica', 'freddy'].forEach(name => {
        if (state.isPlaying && rollsUnder(state.aiLevels[name])) moveAnimatronic(name);
    });
    if (!state.isPlaying) return;

    // Alan se congela si estás mirando la CAM 3 (sillas del fondo)
    const watchingCove = state.isMonitorOpen && state.currentCam === 3;
    if (!watchingCove && rollsUnder(state.aiLevels.foxy)) moveFoxy();
    if (!state.isPlaying) return;

    updateOfficeUI();
    if (state.isMonitorOpen) updateCameraMonitorUI();
}

function moveAnimatronic(name) {
    const a = state.animatronics[name];
    const doorKey = DOOR_OF[name];

    // Ya está en tu puerta
    if (a.location === doorKey) {
        const closed = (doorKey === 'left_door') ? state.leftDoor : state.rightDoor;
        if (closed) {
            a.location = 1; // la puerta cerrada lo hace retroceder a la Salida
            sound.playDoorKnock();
        } else {
            triggerJumpscare(name);
        }
        return;
    }

    // Ariel no se mueve mientras lo estás mirando en cámara
    if (name === 'freddy' && state.isMonitorOpen && state.currentCam === a.location) return;

    const options = ROUTES[name][a.location];
    if (!options) return;
    a.location = options[Math.floor(Math.random() * options.length)];
    if (a.location === doorKey) sound.playFootsteps(); // se oyen pasos al llegar a tu puerta
}

function moveFoxy() {
    if (state.foxyStage >= 3) return; // ya está corriendo
    state.foxyStage++;
    if (state.foxyStage === 3) {
        // Alan sale corriendo por el pasillo (se ve en CAM 4)
        state.foxyRunLeft = FOXY_RUN_SECONDS;
        sound.playRun();
    }
}

function foxyAttack() {
    if (!state.isPlaying) return;

    if (state.leftDoor) {
        // Golpea la puerta: drena energía (1%, luego 6%, 11%...) y vuelve a esconderse
        state.power = Math.max(0, state.power - (1 + 5 * state.foxyHits));
        state.foxyHits++;
        state.foxyStage = 0;
        sound.playDoorKnock();
        DOM.powerPercent.innerText = `${Math.ceil(state.power)}%`;
        updateOfficeUI();
        if (state.isMonitorOpen) updateCameraMonitorUI();
    } else {
        triggerJumpscare('foxy');
    }
}

// En qué cámara se ve a cada uno (null = no aparece en ninguna)
function getAnimCam(name) {
    if (name === 'foxy') {
        if (state.foxyStage === 0) return null;
        return state.foxyStage === 3 ? 4 : 3;
    }
    const loc = state.animatronics[name].location;
    return typeof loc === 'number' ? loc : null;
}

// ===================================================================
// INTERFAZ DE OFICINA
// ===================================================================
function updateOfficeUI() {
    // Puertas (bajan/suben con animación) y botones de la pared
    DOM.leftDoorVisual.classList.toggle('door-closed', state.leftDoor);
    DOM.rightDoorVisual.classList.toggle('door-closed', state.rightDoor);
    DOM.btnLeftDoor.classList.toggle('active', state.leftDoor);
    DOM.btnRightDoor.classList.toggle('active', state.rightDoor);
    DOM.btnLeftLight.classList.toggle('active', state.leftLight);
    DOM.btnRightLight.classList.toggle('active', state.rightLight);

    // Luz pasillo izquierdo (solo se ve a Vicente en la puerta)
    DOM.leftLightOverlay.classList.toggle('hidden', !state.leftLight);
    if (state.leftLight && state.animatronics.bonnie.location === 'left_door') {
        setSprite(DOM.leftDoorAnimatronic, 'bonnie');
        DOM.leftDoorAnimatronic.classList.remove('hidden');
    } else {
        DOM.leftDoorAnimatronic.classList.add('hidden');
    }

    // Luz pasillo derecho (Fernando o Ariel)
    DOM.rightLightOverlay.classList.toggle('hidden', !state.rightLight);
    if (state.rightLight && state.animatronics.chica.location === 'right_door') {
        setSprite(DOM.rightDoorAnimatronic, 'chica');
        DOM.rightDoorAnimatronic.classList.remove('hidden');
    } else if (state.rightLight && state.animatronics.freddy.location === 'right_door') {
        setSprite(DOM.rightDoorAnimatronic, 'freddy');
        DOM.rightDoorAnimatronic.classList.remove('hidden');
    } else {
        DOM.rightDoorAnimatronic.classList.add('hidden');
    }
}

// ===================================================================
// INTERFAZ DE CÁMARAS
// ===================================================================
function switchCamera(camId) {
    if (camId !== state.currentCam) state.camSwitches++;
    state.currentCam = camId;
    triggerGlitch();
    updateCameraMonitorUI();
}

function updateCameraMonitorUI() {
    const camId = state.currentCam;
    DOM.currentCamTitle.innerText = CAM_NAMES[camId] || `CAM ${camId}`;

    const animsInCam = ANIM_KEYS.filter(a => getAnimCam(a) === camId);
    setImg(DOM.imgCameraBackground, `camara${camId}`, animsInCam);

    DOM.camButtons.forEach(btn => {
        btn.classList.toggle('active', parseInt(btn.getAttribute('data-cam')) === camId);
    });

    ANIM_KEYS.forEach(name => renderAnimatronicInCamera(name, camId));
}

function renderAnimatronicInCamera(name, camId) {
    const img = DOM.camSprites[name];
    if (getAnimCam(name) === camId) {
        setSprite(img, name);
        let cls = `cam-sprite pos-${name} pos-cam${camId}-${name}`;
        if (name === 'foxy' && camId === 3) cls += ` pos-cam3-foxy-s${state.foxyStage}`;
        img.className = cls;
    } else {
        img.classList.add('hidden');
    }
}

// ===================================================================
// APAGÓN, JUMPSCARE Y VICTORIA
// ===================================================================
function handlePowerOutage() {
    state.isPlaying = false;
    clearInterval(aiTimer);
    state.leftDoor = false;
    state.rightDoor = false;
    state.leftLight = false;
    state.rightLight = false;

    stopCall();
    closeMonitorSilently();
    DOM.monitorHoverZone.classList.add('hidden');
    DOM.gameContainer.classList.remove('low-power');
    DOM.blackoutOverlay.classList.add('blackout-on');
    updateOfficeUI();
    updateUsageBars(0);

    // Se apaga todo: suena la caja de música y Ariel aparece parpadeando en la oscuridad
    sound.stopAmbience();
    sound.startMusicBox();
    setSprite(DOM.outageFace, 'freddy');
    let ticks = 0;
    outageFlickerTimer = setInterval(() => {
        ticks++;
        DOM.outageFace.classList.toggle('hidden', !(ticks > 5 && Math.random() > 0.4));
    }, 320);

    outageTimer = setTimeout(() => triggerJumpscare('freddy'), 6000);
}

function triggerJumpscare(characterKey) {
    if (state.jumpscared) return;
    state.jumpscared = true;
    state.isPlaying = false;

    clearAllTimers();
    closeMonitorSilently();
    DOM.outageFace.classList.add('hidden');
    DOM.gameContainer.classList.remove('low-power');
    sound.playJumpscareSound();

    // Usa la imagen de screamer; si no existe, la imagen normal
    DOM.jumpscareImage.onerror = () => {
        DOM.jumpscareImage.onerror = null;
        setImg(DOM.jumpscareImage, characterKey);
    };
    DOM.jumpscareImage.src = getAssetUrl(`${characterKey}Screamer`);
    DOM.jumpscareOverlay.classList.remove('hidden');

    jumpscareTimer = setTimeout(() => {
        DOM.jumpscareOverlay.classList.add('hidden');
        DOM.gameOverMenu.classList.remove('hidden');
    }, 2200);
}

function triggerVictory() {
    state.isPlaying = false;
    clearAllTimers();
    closeMonitorSilently();
    DOM.gameContainer.classList.remove('low-power');

    // Progreso y estrellas
    let newStar = false;
    if (!state.isCustom) {
        saveNight(Math.min(state.nightNum + 1, MAX_NIGHT));
        if (state.nightNum === 5) newStar = addStar('n5');
        if (state.nightNum === 6) newStar = addStar('n6');
    } else if (ANIM_KEYS.every(a => state.aiLevels[a] === 20)) {
        newStar = addStar('c20');
    }
    renderStars();

    const canContinue = !state.isCustom && state.nightNum < MAX_NIGHT;
    DOM.btnNextNight.classList.toggle('hidden', !canContinue);
    DOM.victorySummary.innerText =
        `Energía restante: ${Math.ceil(state.power)}% · Cámaras revisadas: ${state.camSwitches}` +
        (newStar ? ' · ★ ¡Nueva estrella!' : '');

    // 5 AM → 6 AM con campanas, como en el original
    DOM.victoryTime.innerText = '5:00 AM';
    DOM.victoryMenu.classList.remove('hidden');
    sound.playTone(523, 'sine', 0.6, 0.2);
    setTimeout(() => {
        DOM.victoryTime.innerText = '6:00 AM';
        sound.playBell();
    }, 1400);
}

// ===================================================================
// ESTRELLAS
// ===================================================================
function loadStars() {
    try { return JSON.parse(localStorage.getItem(STARS_KEY)) || {}; } catch (e) { return {}; }
}

// Devuelve true si es una estrella nueva
function addStar(id) {
    const stars = loadStars();
    if (stars[id]) return false;
    stars[id] = true;
    try { localStorage.setItem(STARS_KEY, JSON.stringify(stars)); } catch (e) {}
    return true;
}

function renderStars() {
    const stars = loadStars();
    const n = ['n5', 'n6', 'c20'].filter(k => stars[k]).length;
    DOM.menuStars.innerText = '★'.repeat(n) + '☆'.repeat(3 - n);
}

// ===================================================================
// LLAMADA DEL PROFESOR (subtítulos + voz del navegador)
// ===================================================================
function stopCall() {
    callToken++;
    try { if (window.speechSynthesis) window.speechSynthesis.cancel(); } catch (e) {}
    if (DOM.callSubtitle) DOM.callSubtitle.classList.add('hidden');
    if (DOM.btnMuteCall) DOM.btnMuteCall.classList.add('hidden');
}

function playCall(night) {
    const lines = CALLS[night];
    if (!lines) return;
    const token = ++callToken;
    DOM.btnMuteCall.classList.remove('hidden');
    let i = 0;

    const next = () => {
        if (token !== callToken) return;
        if (i >= lines.length) {
            DOM.callSubtitle.classList.add('hidden');
            DOM.btnMuteCall.classList.add('hidden');
            return;
        }
        const line = lines[i++];
        DOM.callSubtitle.innerText = line;
        DOM.callSubtitle.classList.remove('hidden');

        let advanced = false;
        const advance = () => {
            if (advanced || token !== callToken) return;
            advanced = true;
            setTimeout(next, 350);
        };
        const wait = Math.max(2200, line.length * 62);

        if (!callMuted && 'speechSynthesis' in window) {
            try {
                const u = new SpeechSynthesisUtterance(line);
                u.lang = 'es-ES';
                const voice = speechSynthesis.getVoices().find(v => v.lang.toLowerCase().startsWith('es'));
                if (voice) u.voice = voice;
                u.rate = 0.95;
                u.onend = advance;
                u.onerror = advance;
                speechSynthesis.speak(u);
                setTimeout(advance, wait + 5000); // respaldo por si la voz no avisa
                return;
            } catch (e) {}
        }
        setTimeout(advance, wait);
    };
    next();
}

// ===================================================================
// PAUSA Y TECLAS
// ===================================================================
function setPaused(p) {
    if (p && (!state.isPlaying || state.paused)) return;
    state.paused = p;
    DOM.pauseMenu.classList.toggle('hidden', !p);
    try {
        if (window.speechSynthesis) p ? speechSynthesis.pause() : speechSynthesis.resume();
        if (sound.ctx) p ? sound.ctx.suspend() : sound.ctx.resume();
    } catch (e) {}
}

function setupPause() {
    DOM.btnResume.addEventListener('click', () => setPaused(false));
    DOM.btnPauseMenu.addEventListener('click', () => {
        setPaused(false);
        goToMainMenu();
    });
    // Si cambias de pestaña, se pausa solo
    document.addEventListener('visibilitychange', () => {
        if (document.hidden && state.isPlaying) setPaused(true);
    });
}

function setupKeys() {
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (state.paused) setPaused(false);
            else if (state.isPlaying) setPaused(true);
            return;
        }
        if (!state.isPlaying || state.paused) return;
        if (e.code === 'Space') {
            e.preventDefault();
            if (document.activeElement) document.activeElement.blur();
            tryToggleMonitor(true);
        } else if (e.key.toLowerCase() === 'h') {
            sound.init();
            sound.playHonk();
        }
    });
}

// ===================================================================
// ESTÁTICA CRT
// ===================================================================
function setupStaticCanvas() {
    const canvas = $('staticCanvas');
    const ctx = canvas.getContext('2d');

    function resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    function renderStatic() {
        const w = canvas.width;
        const h = canvas.height;
        if (w > 0 && h > 0) {
            const imgData = ctx.createImageData(w, h);
            const buffer = new Uint32Array(imgData.data.buffer);
            for (let i = 0; i < buffer.length; i++) {
                if (Math.random() < 0.12) buffer[i] = 0xffffffff;
            }
            ctx.putImageData(imgData, 0, 0);
        }
        requestAnimationFrame(renderStatic);
    }
    renderStatic();
}

// ===================================================================
// ARRANQUE
// ===================================================================
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}
