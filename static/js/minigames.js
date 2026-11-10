// ===================================================================
// Mini-juegos de "5 clases en programación"
//   1) Bug Runner    - salta los errores (estilo dinosaurio de Chrome)
//   2) Atrapa el ;   - atrapa punto y coma, esquiva los bugs
//   3) Examen sorpresa - 10 preguntas de programación
// Todo se dibuja con canvas/CSS: no necesita imágenes.
// Los récords se guardan en localStorage.
// ===================================================================
const Minigames = (() => {
    const BEST_KEY = 'fnafvc_best_';
    const W = 640, H = 360;
    let els = null;
    let cleanup = null;
    let onExit = () => {};
    let currentGame = null;

    // ---------- utilidades ----------
    const rand = (a, b) => Math.random() * (b - a) + a;
    const randInt = (a, b) => Math.floor(rand(a, b + 1));
    const shuffle = (arr) => {
        const a = arr.slice();
        for (let i = a.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [a[i], a[j]] = [a[j], a[i]];
        }
        return a;
    };

    function getBest(id) {
        try { return parseInt(localStorage.getItem(BEST_KEY + id), 10) || 0; } catch (e) { return 0; }
    }
    function saveBest(id, score) {
        if (score > getBest(id)) {
            try { localStorage.setItem(BEST_KEY + id, String(score)); } catch (e) {}
            return true;
        }
        return false;
    }

    function drawSprite(ctx, rows, pal, x, y, s) {
        rows.forEach((row, ry) => {
            for (let rx = 0; rx < row.length; rx++) {
                const c = pal[row[rx]];
                if (c) { ctx.fillStyle = c; ctx.fillRect(x + rx * s, y + ry * s, s, s); }
            }
        });
    }

    function makeCanvas(stage) {
        const cv = document.createElement('canvas');
        cv.width = W; cv.height = H;
        cv.className = 'mg-canvas';
        stage.appendChild(cv);
        return cv;
    }

    // Bucle con paso fijo (60 updates/s aunque el monitor sea de 144Hz)
    function fixedLoop(update, draw) {
        let last = performance.now(), acc = 0, raf = 0, alive = true;
        const STEP = 1000 / 60;
        const tick = (now) => {
            if (!alive) return;
            acc += Math.min(100, now - last);
            last = now;
            while (acc >= STEP && alive) { update(); acc -= STEP; }
            if (alive) { draw(); raf = requestAnimationFrame(tick); }
        };
        raf = requestAnimationFrame(tick);
        return () => { alive = false; cancelAnimationFrame(raf); };
    }

    // ---------- sprites pixel-art ----------
    const PLAYER_TOP = [
        '..hhhh..',
        '.hhhhhh.',
        '.ssssss.',
        '.sgsgss.',
        '.ssssss.',
        '..tttt..',
        '.tttttt.',
        's.tttt.s',
        '..tttt..',
        '..pppp..'
    ];
    const LEGS_A = ['..p..p..', '.bb..bb.'];
    const LEGS_B = ['...pp...', '...bb...'];
    const PLAYER_PAL = { h: '#5b3a1e', s: '#f2c9a0', g: '#111827', t: '#16a34a', p: '#1e3a8a', b: '#111111' };

    const BUG = [
        '..b..b..',
        '...bb...',
        '.bbbbbb.',
        'bbrbbrbb',
        '.bbbbbb.',
        'b.b..b.b'
    ];
    const BUG_PAL = { b: '#4ade80', r: '#ef4444' };

    // ===================================================================
    // 1) BUG RUNNER
    // ===================================================================
    function startRunner(stage, api) {
        const cv = makeCanvas(stage);
        const ctx = cv.getContext('2d');
        const GROUND = 300, GRAV = 0.8, JUMP = -14.5;
        const player = { x: 70, y: GROUND, vy: 0, onGround: true };
        let obstacles = [], speed = 5, dist = 200, frame = 0, score = 0, groundOffset = 0;
        const stars = Array.from({ length: 40 }, () => ({ x: rand(0, W), y: rand(0, 200), s: rand(0.2, 0.8) }));
        const TYPES = [
            { label: 'NaN', w: 44, h: 30 },
            { label: 'null', w: 50, h: 32 },
            { label: '404', w: 46, h: 42 },
            { label: '}', w: 24, h: 62 },
            { label: 'bug', w: 48, h: 34 },
            { label: 'undefined', w: 96, h: 30 }
        ];
        let stop = () => {};

        function jump() {
            if (player.onGround) { player.vy = JUMP; player.onGround = false; }
        }
        const onKey = (e) => {
            if (['Space', 'ArrowUp', 'KeyW'].includes(e.code)) { e.preventDefault(); jump(); }
        };
        window.addEventListener('keydown', onKey);
        cv.addEventListener('pointerdown', jump);
        api.hint('Espacio, ↑ o clic para saltar · evita los errores');

        function update() {
            frame++;
            score = Math.floor(frame / 5);
            speed = Math.min(13, 5 + score / 350);

            player.vy += GRAV;
            player.y += player.vy;
            if (player.y >= GROUND) { player.y = GROUND; player.vy = 0; player.onGround = true; }

            groundOffset = (groundOffset + speed) % 40;
            dist -= speed;
            if (dist <= 0) {
                obstacles.push({ x: W + 10, ...TYPES[randInt(0, TYPES.length - 1)] });
                dist = rand(240, 420) + speed * 18;
            }
            obstacles.forEach(o => { o.x -= speed; });
            obstacles = obstacles.filter(o => o.x + o.w > -10);

            api.setScore(score);

            const px = player.x + 6, py = player.y - 34, pw = 20, ph = 34;
            for (const o of obstacles) {
                const oy = GROUND - o.h;
                if (px < o.x + o.w && px + pw > o.x && py < GROUND && py + ph > oy) {
                    stop();
                    api.finish(score);
                    return;
                }
            }
        }

        function draw() {
            ctx.fillStyle = '#0b0f19';
            ctx.fillRect(0, 0, W, H);

            ctx.fillStyle = '#9ca3af';
            stars.forEach(s => {
                ctx.globalAlpha = s.s;
                ctx.fillRect(((s.x - frame * s.s * 0.3) % W + W) % W, s.y, 2, 2);
            });
            ctx.globalAlpha = 1;

            ctx.fillStyle = '#1f2937';
            ctx.fillRect(0, GROUND, W, H - GROUND);
            ctx.fillStyle = '#4b5563';
            ctx.fillRect(0, GROUND, W, 3);
            for (let x = -groundOffset; x < W; x += 40) ctx.fillRect(x, GROUND + 14, 18, 3);

            ctx.font = '20px VT323, monospace';
            ctx.textAlign = 'center';
            obstacles.forEach(o => {
                const oy = GROUND - o.h;
                ctx.fillStyle = '#7f1d1d';
                ctx.fillRect(o.x, oy, o.w, o.h);
                ctx.strokeStyle = '#ef4444';
                ctx.lineWidth = 2;
                ctx.strokeRect(o.x + 1, oy + 1, o.w - 2, o.h - 2);
                ctx.fillStyle = '#fecaca';
                ctx.fillText(o.label, o.x + o.w / 2, oy + o.h / 2 + 6);
            });

            const legs = player.onGround ? (Math.floor(frame / 6) % 2 ? LEGS_B : LEGS_A) : LEGS_A;
            drawSprite(ctx, PLAYER_TOP.concat(legs), PLAYER_PAL, player.x, player.y - 36, 3);

            ctx.fillStyle = '#e5e7eb';
            ctx.textAlign = 'right';
            ctx.font = '26px VT323, monospace';
            ctx.fillText(String(score).padStart(5, '0'), W - 14, 28);
        }

        stop = fixedLoop(update, draw);
        return () => {
            stop();
            window.removeEventListener('keydown', onKey);
        };
    }

    // ===================================================================
    // 2) ATRAPA EL ;
    // ===================================================================
    function startCatcher(stage, api) {
        const cv = makeCanvas(stage);
        const ctx = cv.getContext('2d');
        const basket = { x: W / 2, w: 96, h: 18, y: H - 36 };
        let items = [], lives = 3, score = 0, frame = 0, targetX = W / 2, hurt = 0;
        const keys = { left: false, right: false };
        let stop = () => {};

        const GOOD = [
            { ch: ';', pts: 1, col: '#4ade80' },
            { ch: '}', pts: 2, col: '#38bdf8' },
            { ch: '☕', pts: 5, col: '#fbbf24' }
        ];

        function spawn() {
            const r = Math.random();
            let it;
            if (r < 0.28) it = { bug: true, ch: 'bug', pts: 0 };
            else if (r < 0.36) it = { ...GOOD[2] };
            else if (r < 0.58) it = { ...GOOD[1] };
            else it = { ...GOOD[0] };
            it.x = rand(24, W - 24);
            it.y = -20;
            it.vy = rand(2, 3.2) + Math.min(4, frame / 1200);
            items.push(it);
        }

        const onMove = (e) => {
            const rect = cv.getBoundingClientRect();
            targetX = (e.clientX - rect.left) * (W / rect.width);
        };
        const onKeyDown = (e) => {
            if (e.code === 'ArrowLeft' || e.code === 'KeyA') keys.left = true;
            if (e.code === 'ArrowRight' || e.code === 'KeyD') keys.right = true;
        };
        const onKeyUp = (e) => {
            if (e.code === 'ArrowLeft' || e.code === 'KeyA') keys.left = false;
            if (e.code === 'ArrowRight' || e.code === 'KeyD') keys.right = false;
        };
        cv.addEventListener('pointermove', onMove);
        window.addEventListener('keydown', onKeyDown);
        window.addEventListener('keyup', onKeyUp);
        api.hint('Mueve el mouse o usa ← → · atrapa ; } ☕ y esquiva los bugs');

        function update() {
            frame++;
            if (frame % Math.max(18, 48 - Math.floor(frame / 240)) === 0) spawn();

            if (keys.left) targetX -= 7;
            if (keys.right) targetX += 7;
            targetX = Math.max(basket.w / 2, Math.min(W - basket.w / 2, targetX));
            basket.x += (targetX - basket.x) * 0.35;
            if (hurt > 0) hurt--;

            items.forEach(it => { it.y += it.vy; });
            items = items.filter(it => {
                const caught = it.y >= basket.y - 8 && it.y <= basket.y + basket.h &&
                               Math.abs(it.x - basket.x) < basket.w / 2 + 8;
                if (caught) {
                    if (it.bug) { lives--; hurt = 18; }
                    else score += it.pts;
                    return false;
                }
                return it.y < H + 20;
            });

            api.setScore(score);
            if (lives <= 0) {
                stop();
                api.finish(score);
            }
        }

        function draw() {
            ctx.fillStyle = hurt > 0 && hurt % 6 < 3 ? '#3b0a0a' : '#0b0f19';
            ctx.fillRect(0, 0, W, H);

            ctx.textAlign = 'center';
            items.forEach(it => {
                if (it.bug) {
                    drawSprite(ctx, BUG, BUG_PAL, it.x - 12, it.y - 9, 3);
                } else {
                    ctx.font = '34px VT323, monospace';
                    ctx.fillStyle = it.col;
                    ctx.fillText(it.ch, it.x, it.y + 10);
                }
            });

            // Cesta: "{ }"
            ctx.fillStyle = '#374151';
            ctx.fillRect(basket.x - basket.w / 2, basket.y, basket.w, basket.h);
            ctx.strokeStyle = '#9ca3af';
            ctx.lineWidth = 2;
            ctx.strokeRect(basket.x - basket.w / 2 + 1, basket.y + 1, basket.w - 2, basket.h - 2);
            ctx.fillStyle = '#e5e7eb';
            ctx.font = '22px VT323, monospace';
            ctx.fillText('{   }', basket.x, basket.y + 14);

            ctx.textAlign = 'left';
            ctx.fillStyle = '#ef4444';
            ctx.font = '26px VT323, monospace';
            ctx.fillText('♥'.repeat(Math.max(0, lives)), 12, 28);
        }

        stop = fixedLoop(update, draw);
        return () => {
            stop();
            window.removeEventListener('keydown', onKeyDown);
            window.removeEventListener('keyup', onKeyUp);
        };
    }

    // ===================================================================
    // 3) EXAMEN SORPRESA
    // ===================================================================
    const QUESTIONS = [
        { q: '¿Qué imprime console.log(2 + "2") en JavaScript?', a: ['"22"', '4', 'NaN', 'Error'], c: 0 },
        { q: '¿Qué símbolo comenta una línea en Python?', a: ['//', '#', '--', '/*'], c: 1 },
        { q: '¿Cuál es el resultado de 7 % 3?', a: ['2', '3', '1', '0'], c: 2 },
        { q: '¿Qué estructura repite código mientras se cumple una condición?', a: ['if', 'while', 'switch', 'return'], c: 1 },
        { q: '¿Qué significa HTML?', a: ['HyperText Markup Language', 'High Transfer Machine Language', 'Home Tool Markup Level', 'Hyper Text Mixed Logic'], c: 0 },
        { q: '¿Qué tipo de dato es true?', a: ['Texto', 'Número', 'Booleano', 'Lista'], c: 2 },
        { q: '¿Cuántos elementos tiene ["a", "b", "c"]?', a: ['2', '3', '4', '0'], c: 1 },
        { q: '¿Qué hace break dentro de un bucle?', a: ['Lo reinicia', 'Lo termina', 'Salta una vuelta', 'Lo pausa'], c: 1 },
        { q: '¿Con qué se le da estilo a una página web?', a: ['SQL', 'CSS', 'PHP', 'Bash'], c: 1 },
        { q: '¿Qué índice tiene el primer elemento de un array en JavaScript?', a: ['1', '-1', '0', '2'], c: 2 },
        { q: 'En Git, ¿qué comando guarda cambios en el historial local?', a: ['git push', 'git commit', 'git clone', 'git pull'], c: 1 },
        { q: '¿Qué palabra declara una constante en JavaScript?', a: ['var', 'let', 'const', 'def'], c: 2 },
        { q: '¿Qué operador compara valor y tipo en JavaScript?', a: ['=', '==', '===', '=>'], c: 2 },
        { q: '¿Qué es un bug?', a: ['Un error en el programa', 'Un tipo de variable', 'Un lenguaje', 'Un editor de código'], c: 0 },
        { q: '¿Qué función muestra texto en pantalla en Python?', a: ['echo()', 'print()', 'write()', 'show()'], c: 1 },
        { q: '¿Cuál es el resultado de 2 ** 3 en Python?', a: ['6', '5', '9', '8'], c: 3 },
        { q: '¿Qué estructura elige entre caminos según una condición?', a: ['for', 'if / else', 'import', 'class'], c: 1 },
        { q: '¿Qué es una función?', a: ['Un bloque de código reutilizable', 'Un tipo de error', 'Un archivo de imagen', 'Un comentario'], c: 0 }
    ];

    function startQuiz(stage, api) {
        const TOTAL = 10, TIME = 12;
        const pool = shuffle(QUESTIONS).slice(0, TOTAL);
        let idx = 0, score = 0, correct = 0, timeLeft = TIME, timer = null, locked = false, nextTimeout = null;

        const box = document.createElement('div');
        box.className = 'mg-quiz';
        stage.appendChild(box);
        api.hint('Responde antes de que se acabe el tiempo · más rápido = más puntos');

        function render() {
            const item = pool[idx];
            const order = shuffle(item.a.map((text, i) => ({ text, ok: i === item.c })));
            locked = false;
            timeLeft = TIME;
            box.innerHTML = `
                <div class="q-count">Pregunta ${idx + 1} / ${TOTAL}</div>
                <div class="q-text"></div>
                <div class="q-opts"></div>
                <div class="q-timer"><div class="q-timer-fill"></div></div>`;
            box.querySelector('.q-text').textContent = item.q;
            const opts = box.querySelector('.q-opts');
            order.forEach(o => {
                const b = document.createElement('button');
                b.className = 'q-opt';
                b.textContent = o.text;
                b.addEventListener('click', () => answer(b, o.ok));
                opts.appendChild(b);
            });
            clearInterval(timer);
            timer = setInterval(() => {
                timeLeft -= 0.1;
                const fill = box.querySelector('.q-timer-fill');
                if (fill) fill.style.width = `${Math.max(0, (timeLeft / TIME) * 100)}%`;
                if (timeLeft <= 0) answer(null, false);
            }, 100);
        }

        function answer(btn, ok) {
            if (locked) return;
            locked = true;
            clearInterval(timer);
            box.querySelectorAll('.q-opt').forEach(b => { b.disabled = true; });
            if (btn) btn.classList.add(ok ? 'ok' : 'bad');
            if (!ok) {
                // mostrar la correcta
                const item = pool[idx];
                box.querySelectorAll('.q-opt').forEach(b => {
                    if (b.textContent === item.a[item.c]) b.classList.add('ok');
                });
            } else {
                correct++;
                score += 100 + Math.floor(timeLeft * 10);
                api.setScore(score);
            }
            nextTimeout = setTimeout(() => {
                idx++;
                if (idx >= TOTAL) api.finish(score, `${correct}/${TOTAL} correctas`);
                else render();
            }, 1000);
        }

        render();
        return () => { clearInterval(timer); clearTimeout(nextTimeout); };
    }

    // ===================================================================
    // MENÚ DE MINI-JUEGOS
    // ===================================================================
    const GAMES = [
        { id: 'runner', name: 'Bug Runner', desc: 'Salta los errores del compilador.', start: startRunner, endTitle: '¡COMPILACIÓN FALLIDA!' },
        { id: 'catcher', name: 'Atrapa el ;', desc: 'Atrapa el punto y coma. Esquiva los bugs.', start: startCatcher, endTitle: 'SIN VIDAS' },
        { id: 'quiz', name: 'Examen sorpresa', desc: '10 preguntas de programación.', start: startQuiz, endTitle: 'EXAMEN TERMINADO' }
    ];

    function renderHub() {
        els.list.innerHTML = '';
        GAMES.forEach(g => {
            const b = document.createElement('button');
            b.className = 'mg-game';
            b.innerHTML = `<span class="mg-game-name">${g.name}</span>
                           <span class="mg-game-best">Mejor: ${getBest(g.id)}</span>
                           <span class="mg-game-desc">${g.desc}</span>`;
            b.addEventListener('click', () => launch(g));
            els.list.appendChild(b);
        });
    }

    function stopGame() {
        if (cleanup) { cleanup(); cleanup = null; }
        els.stage.innerHTML = '';
    }

    function setScore(n) { els.score.innerText = `Puntos: ${n}`; }

    function showHub() {
        stopGame();
        currentGame = null;
        els.play.classList.add('hidden');
        els.hub.classList.remove('hidden');
        renderHub();
    }

    function launch(game) {
        stopGame();
        currentGame = game;
        els.hub.classList.add('hidden');
        els.play.classList.remove('hidden');
        els.title.innerText = game.name;
        els.hint.innerText = '';
        setScore(0);

        let finished = false;
        const api = {
            setScore,
            hint: (t) => { els.hint.innerText = t; },
            finish: (score, extra) => {
                if (finished) return;
                finished = true;
                showEnd(game, score, extra);
            }
        };
        cleanup = game.start(els.stage, api) || null;
    }

    function showEnd(game, score, extra) {
        const isNew = saveBest(game.id, score);
        const div = document.createElement('div');
        div.className = 'mg-end';
        div.innerHTML = `
            <div class="mg-end-title">${game.endTitle}</div>
            <div>Puntos: ${score}${extra ? ' · ' + extra : ''}</div>
            <div>Mejor: ${getBest(game.id)}${isNew && score > 0 ? ' ★ ¡Nuevo récord!' : ''}</div>
            <div class="mg-end-btns">
                <button class="mg-btn" data-act="retry">Reintentar</button>
                <button class="mg-btn" data-act="hub">Mini-juegos</button>
            </div>`;
        div.querySelector('[data-act="retry"]').addEventListener('click', () => launch(game));
        div.querySelector('[data-act="hub"]').addEventListener('click', showHub);
        els.stage.appendChild(div);
    }

    function init(opts = {}) {
        onExit = opts.onExit || onExit;
        els = {
            screen: document.getElementById('minigameScreen'),
            hub: document.getElementById('mgHub'),
            list: document.getElementById('mgList'),
            play: document.getElementById('mgPlay'),
            title: document.getElementById('mgTitle'),
            score: document.getElementById('mgScore'),
            stage: document.getElementById('mgStage'),
            hint: document.getElementById('mgHint'),
            exit: document.getElementById('mgExit'),
            back: document.getElementById('mgBack')
        };
        els.exit.addEventListener('click', showHub);
        els.back.addEventListener('click', () => {
            stopGame();
            els.screen.classList.add('hidden');
            onExit();
        });
    }

    function openHub() {
        els.screen.classList.remove('hidden');
        showHub();
    }

    return { init, openHub };
})();
