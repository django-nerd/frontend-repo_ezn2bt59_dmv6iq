/* Lightweight Three.js header background with graceful fallback
   - Uses Three via CDN if available
   - Creates floating low-poly shapes reacting to mouse
   - Exposes enable()/disable() on window.ThreeBG
*/

const container = document.getElementById('three-header');
let renderer, scene, camera, animId;
let objects = [];
let enabled = false;

function createRenderer() {
  // Will be available via CDN script tag we inject below
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.8));
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.outputEncoding = THREE.sRGBEncoding;
  container.appendChild(renderer.domElement);
}

function createScene() {
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(50, container.clientWidth/container.clientHeight, 0.1, 50);
  camera.position.set(0, 0.6, 6);

  const light = new THREE.HemisphereLight(0xffffff, 0x222233, 1.0);
  scene.add(light);

  const geo1 = new THREE.IcosahedronGeometry(0.6, 0);
  const geo2 = new THREE.DodecahedronGeometry(0.5, 0);
  const geo3 = new THREE.TetrahedronGeometry(0.7, 0);
  const mats = [
    new THREE.MeshStandardMaterial({ color: 0x6ee7ff, metalness: 0.2, roughness: 0.8, transparent: true, opacity: 0.9 }),
    new THREE.MeshStandardMaterial({ color: 0x7c5cff, metalness: 0.2, roughness: 0.85, transparent: true, opacity: 0.85 }),
    new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.1, roughness: 0.9, transparent: true, opacity: 0.25 })
  ];

  const geos = [geo1, geo2, geo3];
  for (let i=0; i<10; i++) {
    const mesh = new THREE.Mesh(geos[i%geos.length], mats[i%3]);
    mesh.position.set((Math.random()-0.5)*8, Math.random()*1.5-0.5, - (Math.random()*4));
    mesh.rotation.set(Math.random()*Math.PI, Math.random()*Math.PI, 0);
    scene.add(mesh);
    objects.push(mesh);
  }

  window.addEventListener('resize', onResize);
  container.addEventListener('mousemove', onMouse);
}

function onResize() {
  if (!renderer || !camera) return;
  const w = container.clientWidth;
  const h = container.clientHeight;
  renderer.setSize(w, h);
  camera.aspect = w/h; camera.updateProjectionMatrix();
}

let targetRotX = 0, targetRotY = 0;
function onMouse(e) {
  const rect = container.getBoundingClientRect();
  const x = (e.clientX - rect.left) / rect.width; // 0..1
  const y = (e.clientY - rect.top) / rect.height; // 0..1
  targetRotY = (x-0.5) * 0.6;
  targetRotX = (y-0.5) * -0.4;
}

function animate() {
  animId = requestAnimationFrame(animate);
  objects.forEach((m, i) => {
    m.rotation.x += 0.003 + i*0.0002;
    m.rotation.y += 0.004 + i*0.0003;
    m.position.y += Math.sin(Date.now()*0.001 + i) * 0.0006;
  });
  camera.rotation.x += (targetRotX - camera.rotation.x) * 0.05;
  camera.rotation.y += (targetRotY - camera.rotation.y) * 0.05;
  renderer.render(scene, camera);
}

function start() {
  if (enabled) return;
  enabled = true;
  if (!window.THREE) { return; }
  try {
    createRenderer();
    createScene();
    animate();
  } catch (e) {
    console.warn('Three BG failed to start, fallback to CSS', e);
    enabled = false;
    container.classList.add('fallback');
  }
}

function stop() {
  enabled = false;
  if (animId) cancelAnimationFrame(animId);
  window.removeEventListener('resize', onResize);
  container.removeEventListener('mousemove', onMouse);
  if (renderer) {
    container.removeChild(renderer.domElement);
  }
  renderer = scene = camera = null;
  objects = [];
}

// Inject Three.js CDN and only then start
(function init() {
  if (!container) return;
  const script = document.createElement('script');
  script.src = 'https://unpkg.com/three@0.160.0/build/three.min.js';
  script.async = true;
  script.onload = () => {
    if (document.getElementById('toggle3d')?.checked) start();
  };
  script.onerror = () => {
    console.warn('Three.js failed to load. Using CSS fallback.');
    container.classList.add('fallback');
  };
  document.head.appendChild(script);
})();

window.ThreeBG = {
  enable: () => { container.classList.remove('fallback'); start(); },
  disable: () => { stop(); container.classList.add('fallback'); }
};
