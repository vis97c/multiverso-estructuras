/**
 * Clase que representa un nodo en una red
 *
 * Cada nodo tiene un valor numerico unico que se usara para identificarlo y moverse a traves de los nodos la red
 */
export class Node {
  /** Vecinos del nodo */
  neighbors: Node[];
  /** Valor del nodo */
  value: number;

  constructor(value: number) {
    this.neighbors = [];
    this.value = value;
  }

  addNeighbor(node: Node) {
    this.neighbors.push(node);
  }

  removeNeighbor(node: Node) {
    this.neighbors = this.neighbors.filter((neighbor) => neighbor !== node);
  }
}
