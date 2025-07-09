import "../css/style.css";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

// Variables globales
let scene: THREE.Scene,
  camera: THREE.PerspectiveCamera,
  renderer: THREE.WebGLRenderer,
  controls: OrbitControls,
  points: THREE.Points,
  axesHelper: THREE.AxesHelper;

// Inicialización
function init() {
  // Crear escena
  scene = new THREE.Scene();

  // Crear cámara
  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.z = 5;

  // Crear renderizador
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  document.body.appendChild(renderer.domElement);

  // Agregar controles de órbita
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;

  // Crear geometría de icosaedro
  const radius = 2;
  const detail = 4; // Ajusta este valor para más o menos puntos (mayor detalle = más puntos)

  // Crear un icosaedro y subdividirlo para obtener más puntos
  const icoGeometry = new THREE.IcosahedronGeometry(1, detail);

  // Normalizar los vértices para que estén en la superficie de la esfera
  const positions = icoGeometry.attributes.position;
  const vertices = [];

  // Procesar los vértices para asegurar que estén en la superficie de la esfera
  for (let i = 0; i < positions.count; i++) {
    const x = positions.getX(i);
    const y = positions.getY(i);
    const z = positions.getZ(i);

    // Normalizar para asegurar que estén en la superficie de la esfera
    const length = Math.sqrt(x * x + y * y + z * z);
    vertices.push(
      (x / length) * radius,
      (y / length) * radius,
      (z / length) * radius
    );
  }

  // Crear una nueva geometría con los puntos procesados
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(vertices, 3)
  );

  // Crear material de puntos
  const pointMaterial = new THREE.PointsMaterial({
    color: 0x00a8ff,
    size: 0.05,
    transparent: true,
    opacity: 0.9,
    sizeAttenuation: true,
  });

  // Crear sistema de partículas (puntos)
  points = new THREE.Points(geometry, pointMaterial);
  scene.add(points);

  // Crear ejes de referencia
  axesHelper = new THREE.AxesHelper(3);
  scene.add(axesHelper);

  // Configurar el botón de mostrar/ocultar ejes
  setupToggleAxesButton();

  // Manejar redimensionamiento de ventana
  window.addEventListener("resize", onWindowResize, false);

  // Iniciar animación
  animate();
}

// Función de animación
function animate() {
  requestAnimationFrame(animate);

  // Renderizar escena
  renderer.render(scene, camera);
}

// Manejar redimensionamiento de ventana
function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

// Función para configurar el botón de mostrar/ocultar ejes
function setupToggleAxesButton() {
  const toggleButton = document.getElementById("toggleAxes");
  let axesVisible = true;

  toggleButton?.addEventListener("click", () => {
    axesVisible = !axesVisible;
    axesHelper.visible = axesVisible;
    toggleButton.textContent = axesVisible ? "Ocultar Ejes" : "Mostrar Ejes";
  });
}

// Iniciar la aplicación cuando el documento esté listo
document.addEventListener("DOMContentLoaded", init);
