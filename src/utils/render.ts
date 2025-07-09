import type { Node } from "../node";

// Función para calcular la distancia euclidiana entre dos nodos
export function calculateDistance(nodeA: Node, nodeB: Node): number {
  const dx = nodeA.position.x - nodeB.position.x;
  const dy = nodeA.position.y - nodeB.position.y;
  const dz = nodeA.position.z - nodeB.position.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}
