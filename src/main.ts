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

  axesHelper.visible = false;
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

  // Función para actualizar el estado del botón de eliminar y el input
  const updateRemoveControls = () => {
    const removeNodeCountInput = document.getElementById(
      "removeNodeCount"
    ) as HTMLInputElement;
    const maxRemovable = Math.max(0, sphere.nodes.length - 2);
    const canRemove = maxRemovable > 0;

    // Actualizar el estado del botón y el input
    if (removeNodeBtn) {
      removeNodeBtn.toggleAttribute("disabled", !canRemove);
    }

    if (removeNodeCountInput) {
      // Deshabilitar el input si no se pueden eliminar nodos
      removeNodeCountInput.disabled = !canRemove;

      if (canRemove) {
        // Si se pueden eliminar nodos, actualizar el valor máximo
        removeNodeCountInput.max = maxRemovable.toString();

        // Ajustar el valor actual si es necesario
        const currentValue = parseInt(removeNodeCountInput.value) || 1;
        if (currentValue > maxRemovable) {
          removeNodeCountInput.value = maxRemovable.toString();
        } else if (currentValue < 1) {
          removeNodeCountInput.value = "1";
        }
      } else {
        // Si no se pueden eliminar nodos, establecer valor a 0
        removeNodeCountInput.value = "0";
      }
    }
  };

  // Evento para mostrar/ocultar ejes
  if (toggleAxesBtn) {
    toggleAxesBtn.addEventListener("click", () => {
      axesHelper.visible = !axesHelper.visible;
      toggleAxesBtn.textContent = axesHelper.visible
        ? "Ocultar Ejes"
        : "Mostrar Ejes";
    });
  }

  // Evento para añadir nodos
  if (addNodeBtn) {
    addNodeBtn.addEventListener("click", () => {
      const addNodeCountInput = document.getElementById(
        "addNodeCount"
      ) as HTMLInputElement;
      const count = Math.max(1, parseInt(addNodeCountInput?.value) || 1);

      // Asegurarse de que el valor no sea negativo
      addNodeCountInput.value = Math.max(1, count).toString();

      sphere.addNodes(count);
      updateRemoveControls();
    });
  }

  // Evento para eliminar nodos
  if (removeNodeBtn) {
    removeNodeBtn.addEventListener("click", () => {
      const removeNodeCountInput = document.getElementById(
        "removeNodeCount"
      ) as HTMLInputElement;
      const maxRemovable = Math.max(0, sphere.nodes.length - 2);

      if (maxRemovable <= 0) return;

      // Obtener la cantidad a eliminar, asegurando que esté dentro de los límites
      let count = Math.min(
        maxRemovable,
        parseInt(removeNodeCountInput?.value) || 1
      );
      count = Math.max(1, count); // Asegurar que sea al menos 1

      // Eliminar los nodos
      for (let i = 0; i < count && sphere.nodes.length > 2; i++) {
        sphere.removeNode(sphere.nodes[sphere.nodes.length - 1]);
      }

      updateRemoveControls();
    });

    // Estado inicial de los controles de eliminación
    updateRemoveControls();
  }

  // Redimensionar ventana
  window.addEventListener("resize", () => onWindowResize(camera, renderer));

  // Iniciar animación
  animate(sphere, scene, camera, renderer, controls);
});
