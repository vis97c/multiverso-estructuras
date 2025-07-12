import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

import type { Node } from "../node";
import type { Sphere } from "../sphere";

// Función para calcular la distancia euclidiana entre dos nodos
export function calculateDistance(nodeA: Node, nodeB: Node): number {
  const dx = nodeA.position.x - nodeB.position.x;
  const dy = nodeA.position.y - nodeB.position.y;
  const dz = nodeA.position.z - nodeB.position.z;

  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

/**
 * Función para manejar el redimensionamiento de la ventana
 */
export function onWindowResize(
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
export function animateSphere(
  sphere: Sphere,
  scene: THREE.Scene,
  camera: THREE.PerspectiveCamera,
  renderer: THREE.WebGLRenderer,
  controls: OrbitControls
) {
  requestAnimationFrame(() =>
    animateSphere(sphere, scene, camera, renderer, controls)
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

export function disposeLine(scene: THREE.Scene, line: THREE.Line) {
  scene.remove(line);
  line.geometry.dispose();

  if (Array.isArray(line.material)) {
    line.material.forEach((material) => material.dispose());
  } else {
    line.material.dispose();
  }
}
