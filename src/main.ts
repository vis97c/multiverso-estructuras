import "../css/style.css";
import { Sphere } from "./sphere";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

/**
 * Función para manejar el redimensionamiento de la ventana
 */
function onWindowResize(
  camera: THREE.PerspectiveCamera,
  renderer: THREE.WebGLRenderer
) {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

/**
 * Función principal de animación
 */
function animate(
  sphere: Sphere,
  scene: THREE.Scene,
  camera: THREE.PerspectiveCamera,
  renderer: THREE.WebGLRenderer,
  controls: OrbitControls
) {
  requestAnimationFrame(() =>
    animate(sphere, scene, camera, renderer, controls)
  );

  // Actualizar nodo resaltado
  if (sphere.currentHoveredNode) {
    sphere.currentHoveredNode.setLabelVisibility(false);
    sphere.currentHoveredNode = null;
  }

  const closestNode = sphere.findClosestNodeToCamera();

  if (closestNode) {
    sphere.currentHoveredNode = closestNode;
    sphere.currentHoveredNode.setLabelVisibility(true);
  }

  // Actualizar etiquetas
  sphere.nodes.forEach((node) => node.updateLabelPosition(camera));

  controls.update();
  renderer.render(scene, camera);
}

// Iniciar la aplicación cuando el documento esté listo
document.addEventListener("DOMContentLoaded", () => {
  /**
   * Escena de Three.js
   */
  const scene: THREE.Scene = new THREE.Scene();
  /**
   * Cámara de perspectiva
   * Definida con un ángulo de 75 grados y aspecto de la ventana
   */
  const camera: THREE.PerspectiveCamera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  /**
   * Renderizador de WebGL
   */
  const renderer: THREE.WebGLRenderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
  });
  /**
   * Controles de la cámara
   * Permite controlar la cámara con el mouse
   */
  const controls: OrbitControls = new OrbitControls(
    camera,
    renderer.domElement
  );

  camera.position.z = 5; // Definir la posición z de la cámara
  renderer.setSize(window.innerWidth, window.innerHeight); // Configurar el tamaño del renderer
  renderer.setPixelRatio(window.devicePixelRatio); // Configurar el ratio de píxeles
  document.body.appendChild(renderer.domElement); // Agregar el renderer al DOM
  controls.enableDamping = true; // Habilitar el damping
  controls.dampingFactor = 0.05; // Definir el factor de damping

  const axesHelper = new THREE.AxesHelper(3); // Agregar ejes de referencia
  const toggleButton = document.getElementById("toggleAxes"); // Botón para ocultar/mostrar ejes

  scene.add(axesHelper); // Agregar los ejes a la escena
  window.addEventListener("resize", () => onWindowResize(camera, renderer)); // Escuchar cambios de tamaño de la ventana

  if (toggleButton) {
    let axesVisible = true;
    toggleButton.addEventListener("click", () => {
      axesVisible = !axesVisible;
      axesHelper.visible = axesVisible;
      toggleButton.textContent = axesVisible ? "Ocultar Ejes" : "Mostrar Ejes";
    });
  }

  const sphere = new Sphere(scene, camera); // Crear la esfera
  const primerNodo = sphere.nodes[0];

  console.log(
    primerNodo.value,
    primerNodo.neighbors.map((node) => node.value)
  );

  animate(sphere, scene, camera, renderer, controls); // Iniciar la animación
});
