const canvas = document.getElementById('c');
const ctx = canvas.getContext('2d', { alpha: false });

let O = canvas.width = innerWidth;
let Q = canvas.height = innerHeight;
const M = Math;
const R = M.random;
const C = M.cos;
const S = M.sin;
const Y = 6.283185307179586;

let allTrails = [];
let isLowPerformance = false;

function detectPerformance() {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const isSlowDevice = navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4;
    return isMobile || isSlowDevice;
}

isLowPerformance = detectPerformance();

function createParticleTrails(num, targetPath, behavior) {
    const trails = [];
    if (targetPath.length === 0) return trails;

    if (isLowPerformance) num = Math.floor(num * 0.6);

    for (let i = 0; i < num; i++) {
        const x = O / 2;
        const y = Q / 2;
        
        const H = R() * 80 + 280;
        const Sat = R() * 20 + 80;
        const B = R() * 20 + 50;
        const trail = [];
        
        const trailLength = isLowPerformance ? 20 : 32;
        
        for (let k = 0; k < trailLength; k++) {
            trail[k] = {
                x: x, 
                y: y, 
                X: 0, 
                Y: 0,
                R: (1 - k / trailLength) * 2 + 1.5,
                S: R() * 0.5 + 0.5,
                q: ~~(R() * targetPath.length),
                D: i % 2 * 2 - 1, 
                F: R() * 0.2 + 0.7,
                f: `hsla(${H},${Sat}%,${B}%,.25)`
            };
        }
        trail.targetPath = targetPath;
        trail.behavior = behavior;
        trails.push(trail);
    }
    return trails;
}

function getPointsForText(textString, fontSize, yPos) {
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    tempCanvas.width = O;
    tempCanvas.height = fontSize * 1.5;
    tempCtx.font = `bold ${fontSize}px Arial`;
    tempCtx.textBaseline = 'middle';

    const letterPoints = [];
    let currentX = (O - tempCtx.measureText(textString).width) / 2;

    const sampleRate = isLowPerformance ? 2 : 1;

    for (const char of textString) {
        tempCtx.clearRect(0, 0, tempCanvas.width, tempCanvas.height);
        tempCtx.fillText(char, currentX, tempCanvas.height / 2);
        const imageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
        const charPoints = [];
        
        for (let y = 0; y < imageData.height; y += sampleRate) { 
            for (let x = 0; x < imageData.width; x += sampleRate) { 
                const alpha = imageData.data[(y * imageData.width + x) * 4 + 3];
                if (alpha > 128) {
                    charPoints.push([x, y + yPos - (fontSize * 1.5 / 2)]);
                }
            }
        }
        letterPoints.push(charPoints);
        currentX += tempCtx.measureText(char).width;
    }
    return letterPoints;
}

function loop() {
    ctx.fillStyle = "rgba(0,0,0,.2)";
    ctx.fillRect(0, 0, O, Q);

    const trailsLength = allTrails.length;
    
    for (let i = 0; i < trailsLength; i++) {
        const trail = allTrails[i];
        const u = trail[0];
        const q = trail.targetPath[u.q];

        const D = u.x - q[0];
        const E = u.y - q[1];
        const G = M.sqrt(D * D + E * E);

        if (G < 10) {
            if (trail.behavior === 'text') {
                if (R() > 0.998) { 
                    u.q = ~~(R() * trail.targetPath.length);
                }
            } else {
                if (R() > 0.95) {
                    u.q = ~~(R() * trail.targetPath.length);
                } else {
                    if (R() > 0.99) u.D *= -1;
                    u.q += u.D;
                    u.q %= trail.targetPath.length;
                    if (u.q < 0) u.q += trail.targetPath.length;
                }
            }
        }

        const invG = 1 / G;
        u.X += -D * invG * u.S;
        u.Y += -E * invG * u.S;
        u.x += u.X;
        u.y += u.Y;
        u.X *= u.F;
        u.Y *= u.F;

        ctx.beginPath();
        for (let k = 0; k < trail.length; k++) {
            const T = trail[k];
            if (k > 0) {
                const N = trail[k - 1];
                T.x -= (T.x - N.x) * 0.7;
                T.y -= (T.y - N.y) * 0.7;
            }
            ctx.fillStyle = T.f;
            ctx.moveTo(T.x + T.R, T.y);
            ctx.arc(T.x, T.y, T.R, 0, Y);
        }
        ctx.fill();
    }
}

function init() {
    allTrails = [];
    
    // AJUSTE RESPONSIVO: Coração menor e mais centralizado
    const heartPath = [];
    const heartSize = M.min(120, O * 0.18); // Reduzido para mobile
    const centerY = Q * 0.3; // Posição mais alta (30% da altura)
    
    for (let i = 0; i < Y; i += 0.2) {
        heartPath.push([
            O / 2 + heartSize * M.pow(S(i), 3),
            centerY + 13 * (-(15 * C(i) - 5 * C(2 * i) - 2 * C(3 * i) - C(4 * i)))
        ]);
    }
    
    const heartParticles = isLowPerformance ? 20 : 32;
    allTrails.push(...createParticleTrails(heartParticles, heartPath, 'heart'));

    // AJUSTE RESPONSIVO: Texto "Te Amo" menor e posicionado abaixo do coração
    const textString = "Te Amo";
    const fontSize = M.min(80, O * 0.18); // Tamanho reduzido
    const textYPosition = centerY + heartSize * 2.5 + fontSize; // Abaixo do coração

    const letterTargetPoints = getPointsForText(textString, fontSize, textYPosition);

    const textParticles = isLowPerformance ? 50 : 80;
    
    letterTargetPoints.forEach((points, index) => {
        if (textString[index] === ' ') return;

        setTimeout(() => {
            allTrails.push(...createParticleTrails(textParticles, points, 'text')); 
        }, 1000 + index * 1000); 
    });
}

let lastTime = 0;
const targetFPS = isLowPerformance ? 30 : 60;
const frameInterval = 1000 / targetFPS;

function animate(currentTime) {
    requestAnimationFrame(animate);
    
    const deltaTime = currentTime - lastTime;
    
    if (deltaTime >= frameInterval) {
        lastTime = currentTime - (deltaTime % frameInterval);
        loop();
    }
}

let resizeTimeout;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        O = canvas.width = innerWidth;
        Q = canvas.height = innerHeight;
        init();
    }, 250);
});

init();
animate(0);