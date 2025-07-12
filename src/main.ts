import "../css/style.css";
import { Sphere } from "./sphere";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { animateSphere, onWindowResize } from "./utils/render";

// Iniciar la aplicación cuando el documento esté listo
document.addEventListener("DOMContentLoaded", () => {
  /** Escena de Three.js */
  const scene: THREE.Scene = new THREE.Scene();

  /** Cámara de perspectiva */
  const camera: THREE.PerspectiveCamera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );

  /** Renderizador de WebGL */
  const renderer: THREE.WebGLRenderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
  });

  /** Controles de la cámara */
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

  const axesHelper = new THREE.AxesHelper(3); // Ejes de referencia

  axesHelper.visible = false;
  scene.add(axesHelper);

  // Crear esfera con 36 nodos inicialmente
  const sphere = new Sphere(scene, camera);
  const firstNode = sphere.nodes[0];
  const lastNode = sphere.nodes[sphere.nodes.length - 1];
  const firstNeighborValues = firstNode.neighbors.map((node) => node.value);
  const lastNeighborValues = lastNode.neighbors.map((node) => node.value);

  console.log(`Vecinos del primer nodo: (${firstNeighborValues.join(", ")})`);
  console.log(`Vecinos del ultimo nodo: (${lastNeighborValues.join(", ")})`);

  // Configurar botones
  const toggleAxesBtn = document.getElementById("toggleAxes");
  const addNodeBtn = document.getElementById("addNode");
  const removeNodeBtn = document.getElementById("removeNode");
  const searchNodeBtn = document.getElementById("searchNode");
  /** Bloquear interacciones mientras se realiza una operación */
  let blockInteractions = false;

  // Función para actualizar el estado del botón de eliminar y el input
  const updateControls = () => {
    const searchNodeInput = document.getElementById(
      "searchNodeValue"
    ) as HTMLInputElement;
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

    if (searchNodeInput) {
      searchNodeInput.max = sphere.nodes.length.toString();
    }
  };

  // Evento para mostrar/ocultar ejes
  if (toggleAxesBtn) {
    toggleAxesBtn.addEventListener("click", () => {
      if (blockInteractions) return;

      axesHelper.visible = !axesHelper.visible;
      toggleAxesBtn.textContent = axesHelper.visible
        ? "Ocultar Ejes"
        : "Mostrar Ejes";
    });
  }

  // Evento para añadir nodos
  if (addNodeBtn) {
    addNodeBtn.addEventListener("click", () => {
      if (blockInteractions) return;

      const addNodeCountInput = document.getElementById(
        "addNodeCount"
      ) as HTMLInputElement;
      const count = Math.max(1, parseInt(addNodeCountInput?.value) || 1);

      // Asegurarse de que el valor no sea negativo
      addNodeCountInput.value = Math.max(1, count).toString();

      sphere.addNodes(count);
      updateControls();
    });
  }

  // Evento para eliminar nodos
  if (removeNodeBtn) {
    removeNodeBtn.addEventListener("click", () => {
      if (blockInteractions) return;

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

      updateControls();
    });

    // Estado inicial de los controles de eliminación
    updateControls();
  }

  // Evento para buscar nodos
  if (searchNodeBtn) {
    searchNodeBtn.addEventListener("click", async () => {
      if (blockInteractions) return;

      blockInteractions = true;

      const searchNodeInput = document.getElementById(
        "searchNodeValue"
      ) as HTMLInputElement;
      const value = parseInt(searchNodeInput?.value) || 1;

      if (value < 1 || value > sphere.nodes.length) {
        alert("El valor debe estar entre 1 y " + sphere.nodes.length);
      } else if (sphere.activeNode.value === value) {
        alert("Ya estas en el nodo, busca otro");
      } else {
        try {
          const node = await sphere.searchNode(value);

          if (!node) alert("No puedes viajar a este nodo");
        } catch (error) {
          console.error(error);
          alert("Error al buscar el nodo");
        }
      }

      blockInteractions = false;
    });
  }

  // Redimensionar ventana
  window.addEventListener("resize", () => onWindowResize(camera, renderer));

  // Iniciar animación
  animateSphere(sphere, scene, camera, renderer, controls);
});
