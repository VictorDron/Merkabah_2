const canvas = document.getElementById('scene');
const ctx = canvas.getContext('2d');

// Função para redimensionar o canvas
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener('resize', () => {
    resizeCanvas();
    initialize();
});

// Configurações Globais
let isDragging = false;
let previousMousePosition = { x: 0, y: 0 };
let rotationX = 0;
let rotationY = 0;
let scaleFactor = 1;
const ROTATION_SPEED = 0.002;

// Classe para representar um ponto 3D
class Point3D {
    constructor(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;
    }

    // Rotaciona o ponto ao redor do eixo X
    rotateX(angle) {
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        const y = this.y * cos - this.z * sin;
        const z = this.y * sin + this.z * cos;
        return new Point3D(this.x, y, z);
    }

    // Rotaciona o ponto ao redor do eixo Y
    rotateY(angle) {
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        const x = this.x * cos + this.z * sin;
        const z = -this.x * sin + this.z * cos;
        return new Point3D(x, this.y, z);
    }

    // Projeta o ponto 3D para 2D usando projeção perspectiva
    project(focalLength, centerX, centerY) {
        const scale = focalLength / (focalLength + this.z);
        const x2D = centerX + this.x * scale * scaleFactor;
        const y2D = centerY + this.y * scale * scaleFactor;
        return { x: x2D, y: y2D, scale };
    }
}

// Metatron's Cube Points em 3D
let metatronPoints = [];
const size = 150; // Tamanho ajustável do cubo

function generateMetatronCube() {
    metatronPoints = [];
    // Ponto central
    metatronPoints.push(new Point3D(0, 0, 0));

    // 12 pontos externos (vértices de um icosaedro regular)
    const t = (1 + Math.sqrt(5)) / 2;

    const vertices = [
        new Point3D(-1,  t,  0),
        new Point3D( 1,  t,  0),
        new Point3D(-1, -t,  0),
        new Point3D( 1, -t,  0),

        new Point3D( 0, -1,  t),
        new Point3D( 0,  1,  t),
        new Point3D( 0, -1, -t),
        new Point3D( 0,  1, -t),

        new Point3D( t,  0, -1),
        new Point3D( t,  0,  1),
        new Point3D(-t,  0, -1),
        new Point3D(-t,  0,  1),
    ];

    // Normaliza os vértices para que todos estejam equidistantes do centro
    const normalizedVertices = vertices.map(v => {
        const length = Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
        return new Point3D((v.x / length) * size, (v.y / length) * size, (v.z / length) * size);
    });

    metatronPoints = metatronPoints.concat(normalizedVertices);
}

// Arestas para o Cubo de Metatron (linhas conectando os pontos)
let metatronEdges = [];

function generateMetatronEdges() {
    metatronEdges = [];
    // Conectar o ponto central a todos os pontos externos
    for(let i = 1; i < metatronPoints.length; i++) {
        metatronEdges.push([0, i]);
    }

    // Conectar pontos externos entre si baseado nas arestas de um icosaedro
    const edges = [
        [1,9], [1,11],
        [2,7], [2,10],
        [3,8], [3,10],
        [4,5], [4,8],
        [5,9], [5,11],
        [6,7], [6,9],
        [7,11],
        [8,10],
        [9,10],
        [10,11]
    ];

    metatronEdges = metatronEdges.concat(edges);
}

generateMetatronCube();
generateMetatronEdges();

// Função para desenhar o Cubo de Metatron
function drawMetatronsCube(rotX, rotY) {
    const focalLength = 1000;
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    // Rotaciona todos os pontos
    const rotatedPoints = metatronPoints.map(p => p.rotateX(rotX).rotateY(rotY));

    // Projeta os pontos para 2D
    const projectedPoints = rotatedPoints.map(p => p.project(focalLength, centerX, centerY));

    // Desenha as arestas
    ctx.strokeStyle = 'rgba(0, 255, 255, 0.8)'; // Ciano para as arestas
    ctx.lineWidth = 1;
    metatronEdges.forEach(edge => {
        const p1 = projectedPoints[edge[0]];
        const p2 = projectedPoints[edge[1]];
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
    });

    // Desenha círculos nos pontos
    metatronPoints.forEach((p, index) => {
        const proj = rotatedPoints[index].project(focalLength, centerX, centerY);
        // Calcula a distância radial normalizada (0 no centro, 1 na periferia)
        const radialDistance = Math.sqrt(p.x * p.x + p.y * p.y + p.z * p.z);
        const normalizedDistance = radialDistance / size;

        // Mapeia a distância radial para uma cor no espectro eletromagnético
        const hue = normalizedDistance * 270; // De vermelho (0°) a violeta (270°)
        ctx.fillStyle = `hsl(${hue}, 100%, 50%)`;

        // Desenha o círculo com raio ajustado pela escala
        ctx.beginPath();
        ctx.arc(proj.x, proj.y, 5 * proj.scale, 0, Math.PI * 2);
        ctx.fill();
    });

    // Linhas diagonais internas para formar Metatron's Cube
    const diagonals = [
        [0,2],[0,6],[0,5],
        [1,3],[1,4],[1,7],
        [2,4],[2,5],[2,7],
        [3,4],[3,5],[3,6],
        [4,6],[5,7]
    ];

    ctx.strokeStyle = 'rgba(255, 0, 255, 0.5)'; // Magenta para diagonais
    ctx.lineWidth = 0.8;
    diagonals.forEach(diag => {
        const p1 = rotatedPoints[diag[0]].project(focalLength, centerX, centerY);
        const p2 = rotatedPoints[diag[1]].project(focalLength, centerX, centerY);
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
    });
}

// Função para desenhar o Toruóide
let torusPoints = [];
const NUM_TORUS_POINTS = 1000;

function generateTorus() {
    torusPoints = [];
    const R = 200; // Raio do círculo central do torus
    const r = 60;  // Raio do tubo do torus

    for (let i = 0; i < NUM_TORUS_POINTS; i++) {
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.random() * Math.PI * 2;

        const x = (R + r * Math.cos(theta)) * Math.cos(phi);
        const y = (R + r * Math.cos(theta)) * Math.sin(phi);
        const z = r * Math.sin(theta);

        torusPoints.push(new Point3D(x, y, z));
    }
}

function drawTorus(rotX, rotY) {
    const focalLength = 1000;
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    torusPoints.forEach(point => {
        let rotated = point.rotateX(rotX).rotateY(rotY);
        let proj = rotated.project(focalLength, centerX, centerY);

        // Mapeia a profundidade para a cor
        const normalizedZ = (rotated.z + 100) / 200; // Ajuste para mapeamento
        const hue = normalizedZ * 270; // De vermelho a violeta
        ctx.fillStyle = `hsl(${hue}, 100%, 50%)`;
        ctx.beginPath();
        ctx.arc(proj.x, proj.y, 3 * proj.scale, 0, Math.PI * 2);
        ctx.fill();
    });
}

// Função para gerar estrelas de fundo
let stars = [];
const NUM_STARS = 300;

function generateStars() {
    stars = [];
    for(let i = 0; i < NUM_STARS; i++) {
        stars.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            radius: Math.random() * 1.5,
            opacity: Math.random() * 0.5 + 0.5
        });
    }
}

function drawStarsBackground() {
    stars.forEach(star => {
        ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity})`;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        ctx.fill();
    });
}

// Função de Inicialização
function initialize() {
    GLOBE_RADIUS = Math.min(canvas.width, canvas.height) * 0.35;
    GLOBE_CENTER_X = canvas.width / 2;
    GLOBE_CENTER_Y = canvas.height / 2;
    generateMetatronCube();
    generateMetatronEdges();
    generateTorus();
    generateStars();
}
initialize();

// Função de Animação
function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawStarsBackground();

    // Atualiza as rotações
    rotationX += ROTATION_SPEED;
    rotationY += ROTATION_SPEED;

    // Desenha os elementos
    drawMetatronsCube(rotationX * 0.5, rotationY * 0.5);
    drawTorus(rotationX, rotationY);

    requestAnimationFrame(animate);
}
animate();

// Interatividade com Mouse ou Touch
canvas.addEventListener('mousedown', function(e) {
    isDragging = true;
    previousMousePosition = { x: e.clientX, y: e.clientY };
});

canvas.addEventListener('mousemove', function(e) {
    if (isDragging) {
        let deltaX = e.clientX - previousMousePosition.x;
        let deltaY = e.clientY - previousMousePosition.y;

        rotationY += deltaX * 0.005;
        rotationX += deltaY * 0.005;

        previousMousePosition = { x: e.clientX, y: e.clientY };
    }
});

canvas.addEventListener('mouseup', function(e) {
    isDragging = false;
});

canvas.addEventListener('mouseleave', function(e) {
    isDragging = false;
});

// Suporte para dispositivos móveis
canvas.addEventListener('touchstart', function(e) {
    isDragging = true;
    previousMousePosition = { x: e.touches[0].clientX, y: e.touches[0].clientY };
});

canvas.addEventListener('touchmove', function(e) {
    if (isDragging) {
        let deltaX = e.touches[0].clientX - previousMousePosition.x;
        let deltaY = e.touches[0].clientY - previousMousePosition.y;

        rotationY += deltaX * 0.005;
        rotationX += deltaY * 0.005;

        previousMousePosition = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
});

canvas.addEventListener('touchend', function(e) {
    isDragging = false;
});

// Zoom com a roda do mouse
canvas.addEventListener('wheel', function(e) {
    e.preventDefault();
    scaleFactor += e.deltaY * -0.001;
    scaleFactor = Math.min(Math.max(0.5, scaleFactor), 2);
});
