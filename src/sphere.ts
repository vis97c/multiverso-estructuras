import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

import { Node } from "./node";
import { calculateDistance } from "./utils/render";

// Variables globales
let scene: THREE.Scene,
  camera: THREE.PerspectiveCamera,
  renderer: THREE.WebGLRenderer,
  controls: OrbitControls,
  points: THREE.Points,
  axesHelper: THREE.AxesHelper;

// Inicialización
export function init() {
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
  // Inicializar el array de vértices con el tipo explícito
  const vertices: number[] = [];

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

  // Crear un array para almacenar los nodos
  const nodes: Node[] = [];

  // Crear nodos para cada punto con sus posiciones
  for (let i = 0; i < vertices.length / 3; i++) {
    const x = vertices[i * 3];
    const y = vertices[i * 3 + 1];
    const z = vertices[i * 3 + 2];
    const node = new Node(i + 1, { x, y, z });
    nodes.push(node);
  }

  // Conectar cada nodo con sus 6 vecinos más cercanos
  nodes.forEach((currentNode, currentIndex) => {
    // Calcular distancias a todos los demás nodos
    const nodesWithDistances = nodes
      .map((node, index) => ({
        node,
        index,
        distance:
          currentIndex === index
            ? Infinity
            : calculateDistance(currentNode, node),
      }))
      // Ordenar por distancia (más cercanos primero)
      .sort((a, b) => a.distance - b.distance)
      // Tomar los 6 más cercanos
      .slice(0, 6);

    // Conectar con los 6 vecinos más cercanos
    nodesWithDistances.forEach(({ node }) => {
      if (!currentNode.neighbors.includes(node)) {
        currentNode.addNeighbor(node);
        // Asegurar que la conexión sea bidireccional
        if (!node.neighbors.includes(currentNode)) {
          node.addNeighbor(currentNode);
        }
      }
    });
  });

  // Crear sistema de partículas (puntos) con los nodos
  points = new THREE.Points(geometry, pointMaterial);
  scene.add(points);

  // Crear etiquetas para los nodos
  const loader = new THREE.TextureLoader();
  const sprite = loader.load(
    "data:image/svg+xml;charset=utf-8," +
      encodeURIComponent(
        '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">' +
          '<rect width="100%" height="100%" fill="rgba(0,0,0,0.7)" rx="10" ry="10"/>' +
          '<text x="50%" y="50%" font-family="Arial" font-size="40" fill="white" text-anchor="middle" dominant-baseline="middle">1</text>' +
          "</svg>"
      )
  );

  const spriteMaterial = new THREE.SpriteMaterial({
    map: sprite,
    transparent: true,
    opacity: 0.8,
  });

  // Crear sprites para mostrar los valores de los nodos
  nodes.forEach((node) => {
    const sprite = new THREE.Sprite(spriteMaterial.clone());
    // Usar la posición almacenada en el nodo
    sprite.position.set(node.position.x, node.position.y, node.position.z);
    sprite.scale.set(0.3, 0.15, 1);
    sprite.material.map = loader.load(
      "data:image/svg+xml;charset=utf-8," +
        encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">
        <rect width="100%" height="100%" fill="rgba(0,0,0,0.7)" rx="10" ry="10"/>
        <text x="50%" y="50%" font-family="Arial" font-size="40" fill="white" text-anchor="middle" dominant-baseline="middle">${node.value}</text>
      </svg>`)
    );
    scene.add(sprite);
  });

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
