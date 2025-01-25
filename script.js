import * as THREE from 'https://cdn.skypack.dev/three@0.136.0';
import { EffectComposer } from 'https://cdn.skypack.dev/three@0.136.0/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'https://cdn.skypack.dev/three@0.136.0/examples/jsm/postprocessing/RenderPass.js';
import { GlitchPass } from 'https://cdn.skypack.dev/three@0.136.0/examples/jsm/postprocessing/GlitchPass.js';
import { BloomPass } from 'https://cdn.skypack.dev/three@0.136.0/examples/jsm/postprocessing/BloomPass.js';
import { FilmPass } from 'https://cdn.skypack.dev/three@0.136.0/examples/jsm/postprocessing/FilmPass.js';
import { RGBShiftShader } from 'https://cdn.skypack.dev/three@0.136.0/examples/jsm/shaders/RGBShiftShader.js';
import { ShaderPass } from 'https://cdn.skypack.dev/three@0.136.0/examples/jsm/postprocessing/ShaderPass.js';

class GeometricUniverse {
  constructor() {
    this.initThreeJS();
    this.createGeometry();
    this.createParticles();
    this.createPostProcessing();
    this.setupEventListeners();
    this.animate();
  }

  initThreeJS() {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    document.body.appendChild(this.renderer.domElement);

    this.camera.position.z = 15;
    this.scene.background = new THREE.Color(0x000000);

    this.clock = new THREE.Clock();
    this.mouse = new THREE.Vector2();
    this.targetRotation = new THREE.Vector2();
    this.currentRotation = new THREE.Vector2();
  }

  createGeometry() {
    // Metatron's Cube
    const metatronGeometry = new THREE.BufferGeometry();
    const vertices = [];
    const colors = [];
    
    const createSphere = (radius, complexity) => {
      const geometry = new THREE.IcosahedronGeometry(radius, complexity);
      return geometry.attributes.position.array;
    };

    const spheres = [
      ...createSphere(3, 3),
      ...createSphere(5, 2),
      ...createSphere(7, 1)
    ];

    for (let i = 0; i < spheres.length; i += 3) {
      vertices.push(spheres[i], spheres[i+1], spheres[i+2]);
      colors.push(
        Math.sin(i * 0.1),
        Math.cos(i * 0.1),
        Math.sin(i * 0.1 + Math.PI/2)
      );
    }

    metatronGeometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    metatronGeometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

    this.metatron = new THREE.Points(
      metatronGeometry,
      new THREE.ShaderMaterial({
        vertexShader: `
          varying vec3 vColor;
          varying vec3 vPosition;
          uniform float time;
          void main() {
            vColor = color;
            vPosition = position;
            vec3 pos = position;
            pos.x += sin(time + position.z * 2.0) * 0.5;
            pos.y += cos(time + position.x * 2.0) * 0.5;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
            gl_PointSize = 3.0;
          }
        `,
        fragmentShader: `
          varying vec3 vColor;
          varying vec3 vPosition;
          uniform float time;
          void main() {
            vec2 coord = gl_PointCoord - vec2(0.5);
            float strength = 1.0 - length(coord) * 2.0;
            strength = pow(strength, 3.0);
            gl_FragColor = vec4(mix(vec3(0.1), vColor, strength), strength);
          }
        `,
        uniforms: {
          time: { value: 0 }
        },
        transparent: true,
        blending: THREE.AdditiveBlending
      })
    );
    this.scene.add(this.metatron);

    // Torus Energy Field
    this.torus = new THREE.Mesh(
      new THREE.TorusGeometry(8, 2, 64, 100),
      new THREE.ShaderMaterial({
        vertexShader: `
          varying vec2 vUv;
          varying vec3 vPosition;
          uniform float time;
          void main() {
            vUv = uv;
            vPosition = position;
            vec3 pos = position;
            pos.x += sin(time * 2.0 + pos.z) * 0.5;
            pos.y += cos(time * 1.5 + pos.x) * 0.5;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
          }
        `,
        fragmentShader: `
          varying vec2 vUv;
          varying vec3 vPosition;
          uniform float time;
          void main() {
            vec3 color1 = vec3(0.5 + sin(time) * 0.5, 0.2, 0.8);
            vec3 color2 = vec3(0.2, 0.8, 0.5 + cos(time * 0.5) * 0.5);
            float gradient = abs(sin(vUv.x * 10.0 + time * 2.0));
            vec3 finalColor = mix(color1, color2, gradient);
            gl_FragColor = vec4(finalColor, 0.15);
          }
        `,
        uniforms: {
          time: { value: 0 }
        },
        transparent: true,
        wireframe: true,
        blending: THREE.AdditiveBlending
      })
    );
    this.scene.add(this.torus);
  }

  createParticles() {
    const particleCount = 10000;
    const particles = new THREE.BufferGeometry();
    const posArray = new Float32Array(particleCount * 3);
    const colorArray = new Float32Array(particleCount * 3);

    for(let i = 0; i < particleCount * 3; i += 3) {
      posArray[i] = (Math.random() - 0.5) * 50;
      posArray[i+1] = (Math.random() - 0.5) * 50;
      posArray[i+2] = (Math.random() - 0.5) * 50;
      
      colorArray[i] = Math.random();
      colorArray[i+1] = Math.random();
      colorArray[i+2] = Math.random();
    }

    particles.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    particles.setAttribute('color', new THREE.BufferAttribute(colorArray, 3));

    this.particleSystem = new THREE.Points(
      particles,
      new THREE.ShaderMaterial({
        vertexShader: `
          attribute vec3 color;
          varying vec3 vColor;
          uniform float time;
          void main() {
            vColor = color;
            vec3 pos = position;
            pos.x += sin(time * 0.5 + position.z) * 0.5;
            pos.y += cos(time * 0.5 + position.x) * 0.5;
            pos.z += sin(time * 0.5 + position.y) * 0.5;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
            gl_PointSize = 2.0;
          }
        `,
        fragmentShader: `
          varying vec3 vColor;
          void main() {
            vec2 coord = gl_PointCoord - vec2(0.5);
            float strength = 1.0 - length(coord) * 2.0;
            gl_FragColor = vec4(vColor, strength);
          }
        `,
        uniforms: {
          time: { value: 0 }
        },
        transparent: true,
        blending: THREE.AdditiveBlending
      })
    );
    this.scene.add(this.particleSystem);
  }

  createPostProcessing() {
    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(new RenderPass(this.scene, this.camera));

    const bloomPass = new BloomPass(1.5, 25, 0.4);
    this.composer.addPass(bloomPass);

    const filmPass = new FilmPass(0.35, 0.025, 648, false);
    this.composer.addPass(filmPass);

    const rgbShiftPass = new ShaderPass(RGBShiftShader);
    rgbShiftPass.uniforms['amount'].value = 0.0015;
    this.composer.addPass(rgbShiftPass);

    const glitchPass = new GlitchPass();
    glitchPass.goWild = false;
    this.composer.addPass(glitchPass);
  }

  setupEventListeners() {
    window.addEventListener('resize', () => this.onWindowResize());
    window.addEventListener('mousemove', (e) => this.onMouseMove(e));
    window.addEventListener('touchmove', (e) => this.onTouchMove(e), { passive: false });
    window.addEventListener('wheel', (e) => this.onMouseWheel(e), { passive: false });
  }

  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.composer.setSize(window.innerWidth, window.innerHeight);
  }

  onMouseMove(e) {
    this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
    this.targetRotation.set(
      this.mouse.y * 0.2,
      this.mouse.x * 0.2
    );
  }

  onTouchMove(e) {
    e.preventDefault();
    this.mouse.x = (e.touches[0].clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = -(e.touches[0].clientY / window.innerHeight) * 2 + 1;
    this.targetRotation.set(
      this.mouse.y * 0.2,
      this.mouse.x * 0.2
    );
  }

  onMouseWheel(e) {
    this.camera.position.z += e.deltaY * 0.01;
    this.camera.position.z = THREE.MathUtils.clamp(this.camera.position.z, 5, 30);
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    const time = this.clock.getElapsedTime();
    const delta = this.clock.getDelta();

    // Smooth rotation interpolation
    this.currentRotation.lerp(this.targetRotation, delta * 5);
    this.metatron.rotation.x = this.currentRotation.x + time * 0.1;
    this.metatron.rotation.y = this.currentRotation.y + time * 0.1;
    this.torus.rotation.x = time * 0.2;
    this.torus.rotation.y = time * 0.3;

    // Update materials
    this.metatron.material.uniforms.time.value = time;
    this.torus.material.uniforms.time.value = time;
    this.particleSystem.material.uniforms.time.value = time;

    // Dynamic post-processing effects
    this.composer.passes[3].uniforms['amount'].value = Math.sin(time) * 0.002;
    this.composer.passes[4].goWild = Math.random() > 0.95;

    this.composer.render();
  }
}

// Inicialização
new GeometricUniverse();
