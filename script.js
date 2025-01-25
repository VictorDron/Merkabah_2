const canvas = document.getElementById('scene');
const ctx = canvas.getContext('2d');
const overlay = document.getElementById('energyOverlay');

class Particle {
    constructor() {
        this.reset();
    }

    reset() {
        this.pos = new Point3D(
            (Math.random() - 0.5) * 1000,
            (Math.random() - 0.5) * 1000,
            (Math.random() - 0.5) * 1000
        );
        this.velocity = new Point3D(
            (Math.random() - 0.5) * 0.2,
            (Math.random() - 0.5) * 0.2,
            (Math.random() - 0.5) * 0.2
        );
        this.life = 1;
        this.decay = 0.001 + Math.random() * 0.01;
        this.size = Math.random() * 3 + 1;
        this.hue = Math.random() * 360;
    }

    update() {
        this.pos.x += this.velocity.x;
        this.pos.y += this.velocity.y;
        this.pos.z += this.velocity.z;
        this.life -= this.decay;
        if (this.life <= 0) this.reset();
    }
}

// Configurações avançadas
const settings = {
    ROTATION_SPEED: 0.0005,
    AUTO_ROTATE: true,
    PARTICLE_COUNT: 2000,
    ENERGY_PULSE_SPEED: 0.002,
    HUE_SPEED: 0.3
};

let particles = [];
let hueOffset = 0;
let pulsePhase = 0;
let energyParticles = [];

function initParticles() {
    for (let i = 0; i < settings.PARTICLE_COUNT; i++) {
        particles.push(new Particle());
    }
}

function drawEnergyPulse() {
    pulsePhase += settings.ENERGY_PULSE_SPEED;
    const pulseSize = Math.sin(pulsePhase) * 100 + 150;
    overlay.style.background = `
        radial-gradient(circle at 50% 50%, 
        rgba(255,255,255,0) 60%,
        hsla(${hueOffset}, 100%, 50%, ${Math.abs(Math.sin(pulsePhase)) * 0.2}) 100%)
    `;
    overlay.style.backgroundSize = `${pulseSize}% ${pulseSize}%`;
}

function updateParticles() {
    ctx.fillStyle = `hsla(${hueOffset}, 100%, 50%, 0.2)`;
    particles.forEach(p => {
        p.update();
        const proj = p.pos.project(1000, canvas.width/2, canvas.height/2);
        ctx.beginPath();
        ctx.arc(proj.x, proj.y, p.size * proj.scale, 0, Math.PI * 2);
        ctx.fill();
    });
}

// Adicionar efeito de pós-processamento
function applyPostProcessing() {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    for (let i = 0; i < data.length; i += 4) {
        // Aumentar saturação
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        
        const max = Math.max(r, g, b);
        data[i] = Math.min(255, r * 1.2);
        data[i + 1] = Math.min(255, g * 1.1);
        data[i + 2] = Math.min(255, b * 1.3);
        
        // Adicionar bloom
        if (r > 200 || g > 200 || b > 200) {
            data[i] = 255;
            data[i + 1] = Math.min(255, g + 50);
            data[i + 2] = Math.min(255, b + 50);
        }
    }
    
    ctx.putImageData(imageData, 0, 0);
}

function animate() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    hueOffset += settings.HUE_SPEED;
    
    drawEnergyPulse();
    updateParticles();
    
    ctx.save();
    ctx.shadowColor = `hsl(${hueOffset}, 100%, 50%)`;
    ctx.shadowBlur = 30;
    
    if (settings.AUTO_ROTATE) {
        rotationX += settings.ROTATION_SPEED;
        rotationY += settings.ROTATION_SPEED * 0.7;
    }
    
    drawMetatronsCube(rotationX * 0.5, rotationY * 0.5);
    drawTorus(rotationX, rotationY);
    
    ctx.restore();
    
    applyPostProcessing();
    
    requestAnimationFrame(animate);
}

// Adicionar controles
document.addEventListener('keydown', (e) => {
    switch(e.key) {
        case ' ':
            settings.AUTO_ROTATE = !settings.AUTO_ROTATE;
            break;
        case 'ArrowUp':
            settings.HUE_SPEED += 0.1;
            break;
        case 'ArrowDown':
            settings.HUE_SPEED -= 0.1;
            break;
    }
});

// Inicialização avançada
function initialize() {
    resizeCanvas();
    generateMetatronCube();
    generateMetatronEdges();
    generateTorus();
    generateStars();
    initParticles();
    
    // Configurar efeito de distorção
    canvas.style.filter = 'blur(2px)';
    setTimeout(() => {
        canvas.style.transition = 'filter 2s';
        canvas.style.filter = 'blur(0)';
    }, 500);
}

// Restante do código mantido com ajustes de performance...
