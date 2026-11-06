// ===================================================================
// Five Nights at Visual Code - lógica del juego
// ===================================================================

// RUTA DE ASSETS DE IMÁGENES (relativas a index.html)
const ASSET_PATHS = {
    oficina: 'static/images/oficina.jpg',
    camara1: 'static/images/camara1.jpg',
    camara2: 'static/images/camara2.jpg',
    camara3: 'static/images/camara3.jpg',
    camara4: 'static/images/camara4.jpg',
    freddy: 'static/images/freddy.png',
    bonnie: 'static/images/bonnie.png',
    chica: 'static/images/chica.png',
    foxy: 'static/images/foxy.png'
};

const CUSTOM_ASSETS = {};

const CAM_NAMES = {
    1: 'CAM 1 - ENTRADA PRINCIPAL',
    2: 'CAM 2 - ESTACIONES DE TRABAJO',
    3: 'CAM 3 - PASILLO CENTRAL',
    4: 'CAM 4 - SALA DE SERVIDORES'
};

const AI_TICK_MS = 4970;       // Tick de IA de FNAF 1
const SECONDS_PER_HOUR = 15;   // Duración de una "hora" del juego
const MONITOR_COOLDOWN_MS = 600;

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
        camara4: '#2a0808'
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
            ctx.fillText(`[ ${anim.toUpperCase()} ]`, posX, 265);
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

// Asigna una imagen y, si el archivo no existe, usa un fallback dibujado.
// (El handler se reasigna cada vez, así funciona con cualquier cambio de cámara)
function setImg(imgElement, key, anims = []) {
    imgElement.onerror = () => {
        imgElement.onerror = null; // evita bucles si el fallback fallara
        imgElement.src = createDynamicFallbackUrl(key, anims);
    };
    const url = getAssetUrl(key);
    if (imgElement.getAttribute('src') !== url) imgElement.src = url;
}

// ===================================================================
// ESTADO GLOBAL
// ===================================================================
const state = {
    isPlaying: false,
    jumpscared: false,
    power: 100,
    hour: 0,
    currentCam: 1,
    isMonitorOpen: false,
    leftDoor: false,
    rightDoor: false,
    leftLight: false,
    rightLight: false,
    foxyStage: 0, // 0: Cueva, 1: Asomado, 2: Fuera, 3: Corriendo/Atacando
    aiLevels: { bonnie: 4, chica: 3, freddy: 3, foxy: 2 },
    animatronics: {
        freddy: { location: 1, name: 'Freddy' },
        bonnie: { location: 1, name: 'Bonnie' },
        chica:  { location: 1, name: 'Chica' },
        foxy:   { location: 4, name: 'Foxy' }
    }
};

let gameTimer = null;
let aiTimer = null;
let outageTimer = null;
let jumpscareTimer = null;
let gameSeconds = 0;

// Control del hover del monitor
let monitorArmed = true;
let lastMonitorToggle = 0;

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

    btnStartGame: $('btnStartGame'),
    btnOpenAssetManager: $('btnOpenAssetManager'),
    btnControlsModal: $('btnControlsModal'),
    btnCloseModal: $('btnCloseModal'),
    btnCloseAssetModal: $('btnCloseAssetModal'),
    btnSaveAssetModal: $('btnSaveAssetModal'),
    btnLeftDoor: $('btnLeftDoor'),
    btnLeftLight: $('btnLeftLight'),
    btnRightDoor: $('btnRightDoor'),
    btnRightLight: $('btnRightLight'),
    btnRetry: $('btnRetry'),
    btnVictoryMenu: $('btnVictoryMenu'),
    camButtons: document.querySelectorAll('.btn-cam'),

    monitorHoverZone: $('monitorHoverZone'),
    monitorHoverLabel: $('monitorHoverLabel'),

    imgOficina: $('imgOficina'),
    imgCameraBackground: $('imgCameraBackground'),
    currentCamTitle: $('currentCamTitle'),
    leftDoorVisual: $('leftDoorVisual'),
    rightDoorVisual: $('rightDoorVisual'),
    leftLightOverlay: $('leftLightOverlay'),
    rightLightOverlay: $('rightLightOverlay'),
    leftDoorAnimatronic: $('leftDoorAnimatronic'),
    rightDoorAnimatronic: $('rightDoorAnimatronic'),
    leftDoorStatus: $('leftDoorStatus'),
    rightDoorStatus: $('rightDoorStatus'),
    leftLightStatus: $('leftLightStatus'),
    rightLightStatus: $('rightLightStatus'),
    jumpscareImage: $('jumpscareImage'),

    camAnimFreddy: $('camAnimFreddy'),
    camAnimBonnie: $('camAnimBonnie'),
    camAnimChica: $('camAnimChica'),
    camAnimFoxy: $('camAnimFoxy'),

    powerPercent: $('powerPercent'),
    clockDisplay: $('clockDisplay'),
    assetStatusSummary: $('assetStatusSummary'),
    usageBars: [$('usageBar1'), $('usageBar2'), $('usageBar3'), $('usageBar4')]
};

// ===================================================================
// GESTIÓN DE ARCHIVOS / ASSETS LOCALES
// ===================================================================
function setupAssetManager() {
    document.querySelectorAll('.asset-file-input').forEach(input => {
        input.addEventListener('change', (e) => {
            const key = e.target.getAttribute('data-asset-key');
            const file = e.target.files[0];
            if (file && key) {
                CUSTOM_ASSETS[key] = URL.createObjectURL(file);
                const status = $(`status-${key}`);
                status.innerText = 'Estado: Cargado ✅';
                status.className = 'text-[10px] text-green-400 font-bold';
            }
        });
    });

    $('bulkFileInput').addEventListener('change', (e) => {
        Array.from(e.target.files).forEach(file => {
            const name = file.name.toLowerCase();
            let key = null;
            if (name.includes('oficina')) key = 'oficina';
            else if (name.includes('camara1') || name.includes('cam1')) key = 'camara1';
            else if (name.includes('camara2') || name.includes('cam2')) key = 'camara2';
            else if (name.includes('camara3') || name.includes('cam3')) key = 'camara3';
            else if (name.includes('camara4') || name.includes('cam4')) key = 'camara4';
            else if (name.includes('freddy')) key = 'freddy';
            else if (name.includes('bonnie')) key = 'bonnie';
            else if (name.includes('chica')) key = 'chica';
            else if (name.includes('foxy')) key = 'foxy';

            if (key) {
                CUSTOM_ASSETS[key] = URL.createObjectURL(file);
                const status = $(`status-${key}`);
                if (status) {
                    status.innerText = 'Estado: Cargado ✅';
                    status.className = 'text-[10px] text-green-400 font-bold';
                }
            }
        });
        updateAssetSummary();
    });
}

function updateAssetSummary() {
    const count = Object.keys(CUSTOM_ASSETS).length;
    if (count > 0) {
        DOM.assetStatusSummary.innerText = `Assets: ${count}/9 fotos personalizadas cargadas con éxito ✅`;
        DOM.assetStatusSummary.className = 'text-green-400 font-mono font-bold';
    }
}

// ===================================================================
// PUERTAS Y LUCES
// ===================================================================
function toggleLeftDoor() {
    if (!state.isPlaying || state.power <= 0) return;
    state.leftDoor = !state.leftDoor;
    sound.init();
    sound.playDoor();
    updateOfficeUI();
}

function toggleRightDoor() {
    if (!state.isPlaying || state.power <= 0) return;
    state.rightDoor = !state.rightDoor;
    sound.init();
    sound.playDoor();
    updateOfficeUI();
}

function toggleLeftLight() {
    if (!state.isPlaying || state.power <= 0) return;
    sound.init();
    sound.playLight();
    state.leftLight = !state.leftLight;
    if (state.leftLight) state.rightLight = false;
    updateOfficeUI();
}

function toggleRightLight() {
    if (!state.isPlaying || state.power <= 0) return;
    sound.init();
    sound.playLight();
    state.rightLight = !state.rightLight;
    if (state.rightLight) state.leftLight = false;
    updateOfficeUI();
}

// ===================================================================
// INICIALIZACIÓN
// ===================================================================
function initApp() {
    setupAssetManager();
    setupStaticCanvas();
    setupMonitorHover();

    DOM.btnStartGame.addEventListener('click', () => {
        sound.init(); sound.playClick();
        startGame();
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
        startGame();
    });

    DOM.btnVictoryMenu.addEventListener('click', () => {
        DOM.victoryMenu.classList.add('hidden');
        DOM.gameContainer.classList.add('hidden');
        DOM.mainMenu.classList.remove('hidden');
    });
}

// ===================================================================
// MONITOR: SE ABRE/CIERRA AL PASAR EL MOUSE POR LA BARRA INFERIOR
// ===================================================================
function setupMonitorHover() {
    const zone = DOM.monitorHoverZone;

    // Mouse: basta con pasar por encima (como en el FNAF original)
    zone.addEventListener('pointerenter', (e) => {
        if (e.pointerType !== 'mouse') return;
        tryToggleMonitor(false);
    });

    // Hay que salir de la zona para poder volver a activarla (evita parpadeo)
    zone.addEventListener('pointerleave', () => { monitorArmed = true; });

    // Pantallas táctiles: no hay hover, se usa toque
    zone.addEventListener('pointerdown', (e) => {
        if (e.pointerType === 'mouse') return;
        tryToggleMonitor(true);
    });
}

function tryToggleMonitor(ignoreArmed) {
    if (!state.isPlaying || state.power <= 0) return;
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
    if (state.isMonitorOpen) {
        DOM.cameraMonitor.classList.remove('hidden');
        DOM.monitorHoverLabel.innerText = '▼ CERRAR ▼';
        updateCameraMonitorUI();
    } else {
        DOM.cameraMonitor.classList.add('hidden');
        DOM.monitorHoverLabel.innerText = '▲ CÁMARAS ▲';
    }
}

function closeMonitorSilently() {
    state.isMonitorOpen = false;
    DOM.cameraMonitor.classList.add('hidden');
    DOM.monitorHoverLabel.innerText = '▲ CÁMARAS ▲';
}

// ===================================================================
// INICIO DE LA NOCHE
// ===================================================================
function startGame() {
    clearInterval(gameTimer);
    clearInterval(aiTimer);
    clearTimeout(outageTimer);
    clearTimeout(jumpscareTimer);

    state.isPlaying = true;
    state.jumpscared = false;
    state.power = 100;
    state.hour = 0;
    state.currentCam = 1;
    state.leftDoor = false;
    state.rightDoor = false;
    state.leftLight = false;
    state.rightLight = false;
    state.foxyStage = 0;

    state.animatronics.freddy.location = 1;
    state.animatronics.bonnie.location = 1;
    state.animatronics.chica.location = 1;
    state.animatronics.foxy.location = 4;

    monitorArmed = true;
    lastMonitorToggle = 0;
    closeMonitorSilently();

    DOM.mainMenu.classList.add('hidden');
    DOM.gameContainer.classList.remove('hidden');
    DOM.jumpscareOverlay.classList.add('hidden');
    DOM.gameOverMenu.classList.add('hidden');
    DOM.victoryMenu.classList.add('hidden');
    DOM.blackoutOverlay.classList.remove('blackout-on');
    DOM.monitorHoverZone.classList.remove('hidden');

    DOM.clockDisplay.innerText = '12 AM';
    DOM.powerPercent.innerText = '100%';
    DOM.powerPercent.className = 'text-2xl font-bold text-green-400 font-vt323';

    setImg(DOM.imgOficina, 'oficina');
    updateOfficeUI();
    updateCameraMonitorUI();
    updateUsageBars(1);

    gameSeconds = 0;
    gameTimer = setInterval(gameLoopTick, 1000);
    aiTimer = setInterval(animatronicAITick, AI_TICK_MS);
}

function getUsage() {
    let usage = 1;
    if (state.leftDoor) usage++;
    if (state.rightDoor) usage++;
    if (state.leftLight || state.rightLight) usage++;
    if (state.isMonitorOpen) usage++;
    return Math.min(usage, 4);
}

function updateUsageBars(usage) {
    DOM.usageBars.forEach((bar, idx) => {
        if (idx < usage) {
            bar.className = 'w-3 h-3 rounded-sm ' + (usage > 2 ? 'bg-red-500' : 'bg-green-500');
        } else {
            bar.className = 'w-3 h-3 rounded-sm bg-gray-700';
        }
    });
}

function gameLoopTick() {
    if (!state.isPlaying) return;

    const usage = getUsage();
    state.power -= usage * 0.14;
    if (state.power <= 0) {
        state.power = 0;
        DOM.powerPercent.innerText = '0%';
        handlePowerOutage();
        return;
    }

    DOM.powerPercent.innerText = `${Math.ceil(state.power)}%`;
    DOM.powerPercent.className = 'text-2xl font-bold font-vt323 ' + (state.power <= 20 ? 'text-red-500' : 'text-green-400');
    updateUsageBars(usage);

    // Avance del reloj
    gameSeconds++;
    if (gameSeconds >= SECONDS_PER_HOUR) {
        gameSeconds = 0;
        state.hour++;
        if (state.hour >= 6) {
            triggerVictory();
            return;
        }
        DOM.clockDisplay.innerText = `${state.hour} AM`;
    }
}

// ===================================================================
// IA CON DADO 1-20 (MOVEMENT OPPORTUNITIES)
// ===================================================================
function animatronicAITick() {
    if (!state.isPlaying) return;

    if (Math.floor(Math.random() * 20) + 1 <= state.aiLevels.bonnie) moveBonnie();
    if (!state.isPlaying) return;

    if (Math.floor(Math.random() * 20) + 1 <= state.aiLevels.chica) moveChica();
    if (!state.isPlaying) return;

    if (Math.floor(Math.random() * 20) + 1 <= state.aiLevels.freddy) moveFreddy();
    if (!state.isPlaying) return;

    // Foxy se congela si el jugador mira la CAM 4
    const isCam4Active = state.isMonitorOpen && state.currentCam === 4;
    if (!isCam4Active) {
        if (Math.floor(Math.random() * 20) + 1 <= state.aiLevels.foxy) moveFoxy();
    }
    if (!state.isPlaying) return;

    updateOfficeUI();
    if (state.isMonitorOpen) updateCameraMonitorUI();
}

function moveBonnie() {
    const bonnie = state.animatronics.bonnie;
    if (bonnie.location === 1) {
        bonnie.location = 3;
    } else if (bonnie.location === 3) {
        bonnie.location = 'left_door';
    } else if (bonnie.location === 'left_door') {
        if (state.leftDoor) {
            bonnie.location = 1; // puerta cerrada: rebota a CAM 1
            sound.playDoorKnock();
        } else {
            triggerJumpscare('bonnie');
        }
    }
}

function moveChica() {
    const chica = state.animatronics.chica;
    if (chica.location === 1) {
        chica.location = 2;
    } else if (chica.location === 2) {
        chica.location = 'right_door';
    } else if (chica.location === 'right_door') {
        if (state.rightDoor) {
            chica.location = 1;
            sound.playDoorKnock();
        } else {
            triggerJumpscare('chica');
        }
    }
}

function moveFreddy() {
    const freddy = state.animatronics.freddy;
    if (freddy.location === 1) {
        freddy.location = 2;
    } else if (freddy.location === 2) {
        freddy.location = 4;
    } else if (freddy.location === 4) {
        freddy.location = 'right_door';
    } else if (freddy.location === 'right_door') {
        if (state.rightDoor) {
            freddy.location = 1;
            sound.playDoorKnock();
        } else {
            triggerJumpscare('freddy');
        }
    }
}

function moveFoxy() {
    if (state.foxyStage < 3) {
        state.foxyStage++;
        // En fase 3 Foxy ya salió corriendo: deja de verse en CAM 4
        state.animatronics.foxy.location = state.foxyStage === 3 ? 'left_door' : 4;
    } else {
        if (state.leftDoor) {
            // Puerta cerrada: golpea, drena 5% de energía y vuelve a la cueva
            state.power = Math.max(0, state.power - 5);
            state.foxyStage = 0;
            state.animatronics.foxy.location = 4;
            sound.playDoorKnock();
        } else {
            triggerJumpscare('foxy');
        }
    }
}

// ===================================================================
// INTERFAZ DE OFICINA
// ===================================================================
function updateOfficeUI() {
    // Puertas
    DOM.leftDoorVisual.classList.toggle('hidden', !state.leftDoor);
    DOM.leftDoorStatus.innerText = state.leftDoor ? 'CERRADA' : 'ABIERTA';
    DOM.leftDoorStatus.className = state.leftDoor ? 'text-[9px] text-red-500 font-bold' : 'text-[9px] text-gray-400';

    DOM.rightDoorVisual.classList.toggle('hidden', !state.rightDoor);
    DOM.rightDoorStatus.innerText = state.rightDoor ? 'CERRADA' : 'ABIERTA';
    DOM.rightDoorStatus.className = state.rightDoor ? 'text-[9px] text-red-500 font-bold' : 'text-[9px] text-gray-400';

    // Luz pasillo izquierdo
    if (state.leftLight) {
        DOM.leftLightOverlay.classList.remove('hidden');
        DOM.leftLightStatus.innerText = 'ON';
        DOM.leftLightStatus.className = 'text-[9px] text-yellow-400 font-bold';

        if (state.animatronics.bonnie.location === 'left_door') {
            setImg(DOM.leftDoorAnimatronic, 'bonnie');
            DOM.leftDoorAnimatronic.classList.remove('hidden');
        } else if (state.foxyStage === 3) {
            setImg(DOM.leftDoorAnimatronic, 'foxy');
            DOM.leftDoorAnimatronic.classList.remove('hidden');
        } else {
            DOM.leftDoorAnimatronic.classList.add('hidden');
        }
    } else {
        DOM.leftLightOverlay.classList.add('hidden');
        DOM.leftDoorAnimatronic.classList.add('hidden');
        DOM.leftLightStatus.innerText = 'OFF';
        DOM.leftLightStatus.className = 'text-[9px] text-gray-400';
    }

    // Luz pasillo derecho
    if (state.rightLight) {
        DOM.rightLightOverlay.classList.remove('hidden');
        DOM.rightLightStatus.innerText = 'ON';
        DOM.rightLightStatus.className = 'text-[9px] text-yellow-400 font-bold';

        if (state.animatronics.chica.location === 'right_door') {
            setImg(DOM.rightDoorAnimatronic, 'chica');
            DOM.rightDoorAnimatronic.classList.remove('hidden');
        } else if (state.animatronics.freddy.location === 'right_door') {
            setImg(DOM.rightDoorAnimatronic, 'freddy');
            DOM.rightDoorAnimatronic.classList.remove('hidden');
        } else {
            DOM.rightDoorAnimatronic.classList.add('hidden');
        }
    } else {
        DOM.rightLightOverlay.classList.add('hidden');
        DOM.rightDoorAnimatronic.classList.add('hidden');
        DOM.rightLightStatus.innerText = 'OFF';
        DOM.rightLightStatus.className = 'text-[9px] text-gray-400';
    }
}

// ===================================================================
// INTERFAZ DE CÁMARAS
// ===================================================================
function switchCamera(camId) {
    state.currentCam = camId;
    updateCameraMonitorUI();
}

function updateCameraMonitorUI() {
    const camId = state.currentCam;
    DOM.currentCamTitle.innerText = CAM_NAMES[camId] || `CAM ${camId}`;

    const animsInCam = Object.keys(state.animatronics)
        .filter(a => state.animatronics[a].location === camId);
    setImg(DOM.imgCameraBackground, `camara${camId}`, animsInCam);

    DOM.camButtons.forEach(btn => {
        const bId = parseInt(btn.getAttribute('data-cam'));
        btn.className = (bId === camId)
            ? 'btn-cam px-4 py-2 bg-green-950 border-2 border-green-400 text-green-300 font-bold rounded text-xs transition cursor-pointer'
            : 'btn-cam px-4 py-2 bg-gray-800 border border-gray-600 text-gray-300 font-bold rounded text-xs hover:bg-gray-700 transition cursor-pointer';
    });

    renderAnimatronicInCamera('freddy', DOM.camAnimFreddy, camId);
    renderAnimatronicInCamera('bonnie', DOM.camAnimBonnie, camId);
    renderAnimatronicInCamera('chica', DOM.camAnimChica, camId);
    renderAnimatronicInCamera('foxy', DOM.camAnimFoxy, camId);
}

function renderAnimatronicInCamera(name, imgElem, currentCam) {
    if (state.animatronics[name].location === currentCam) {
        setImg(imgElem, name);
        imgElem.className = `absolute object-contain filter drop-shadow-[0_0_15px_rgba(0,0,0,0.9)] pos-cam${currentCam}-${name}`;
    } else {
        imgElem.classList.add('hidden');
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

    closeMonitorSilently();
    DOM.monitorHoverZone.classList.add('hidden');
    DOM.blackoutOverlay.classList.add('blackout-on');
    updateOfficeUI();
    updateUsageBars(0);

    outageTimer = setTimeout(() => triggerJumpscare('freddy'), 3000);
}

function triggerJumpscare(characterKey) {
    if (state.jumpscared) return;
    state.jumpscared = true;
    state.isPlaying = false;

    clearInterval(gameTimer);
    clearInterval(aiTimer);
    clearTimeout(outageTimer);

    closeMonitorSilently();
    sound.playJumpscareSound();
    setImg(DOM.jumpscareImage, characterKey);
    DOM.jumpscareOverlay.classList.remove('hidden');

    jumpscareTimer = setTimeout(() => {
        DOM.jumpscareOverlay.classList.add('hidden');
        DOM.gameOverMenu.classList.remove('hidden');
    }, 2200);
}

function triggerVictory() {
    state.isPlaying = false;
    clearInterval(gameTimer);
    clearInterval(aiTimer);
    closeMonitorSilently();
    sound.playTone(523, 'sine', 0.6, 0.2);
    DOM.victoryMenu.classList.remove('hidden');
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
