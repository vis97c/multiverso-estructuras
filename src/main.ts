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
   */
  const controls: OrbitControls = new OrbitControls(
    camera,
    renderer.domElement
  );

  // Configuración inicial
  camera.position.z = 5;
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  document.body.appendChild(renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;

  // Ejes de referencia
  const axesHelper = new THREE.AxesHelper(3);
  scene.add(axesHelper);

  // Crear esfera con nodos
  const sphere = new Sphere(scene, camera); // Empezar con 36 nodos

  console.log(
    sphere.nodes[0].value,
    sphere.nodes[0].neighbors.map((node) => node.value)
  );

  // Configurar botones
  const toggleAxesBtn = document.getElementById("toggleAxes");
  const addNodeBtn = document.getElementById("addNode");
  const removeNodeBtn = document.getElementById("removeNode");

  // Función para actualizar el estado del botón de eliminar
  const updateRemoveButtonState = () => {
    if (removeNodeBtn) {
      removeNodeBtn.toggleAttribute("disabled", sphere.nodes.length <= 2);
    }
  };

  // Evento para mostrar/ocultar ejes
  if (toggleAxesBtn) {
    let axesVisible = true;
    toggleAxesBtn.addEventListener("click", () => {
      axesVisible = !axesVisible;
      axesHelper.visible = axesVisible;
      toggleAxesBtn.textContent = axesVisible ? "Ocultar Ejes" : "Mostrar Ejes";
    });
  }

  // Evento para añadir nodo
  if (addNodeBtn) {
    addNodeBtn.addEventListener("click", () => {
      sphere.addNodes(1);
      updateRemoveButtonState();
    });
  }

  // Evento para eliminar nodo
  if (removeNodeBtn) {
    removeNodeBtn.addEventListener("click", () => {
      if (sphere.nodes.length > 2) {
        sphere.removeNode(sphere.nodes[sphere.nodes.length - 1]);
        updateRemoveButtonState();
      }
    });
    // Estado inicial del botón de eliminar
    updateRemoveButtonState();
  }

  // Redimensionar ventana
  window.addEventListener("resize", () => onWindowResize(camera, renderer));

  // Iniciar animación
  animate(sphere, scene, camera, renderer, controls);
});
