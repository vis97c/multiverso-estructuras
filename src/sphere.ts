import * as THREE from "three";
import { Node } from "./node";
import { calculateDistance } from "./utils/render";

export class Sphere {
  private points!: THREE.Points;
  public nodes: Node[] = [];
  public currentHoveredNode: Node | null = null;
  private textureLoader: THREE.TextureLoader;
  private pointMaterial: THREE.PointsMaterial;
  private geometry: THREE.BufferGeometry;

  constructor(
    private scene: THREE.Scene,
    private camera: THREE.PerspectiveCamera,
    private radius: number = 2,
    private totalNodes: number = 36 // Cantidad total de nodos deseada
  ) {
    this.textureLoader = new THREE.TextureLoader();
    this.geometry = new THREE.BufferGeometry();
    this.pointMaterial = new THREE.PointsMaterial({
      color: 0x00a8ff,
      size: 0.05,
      transparent: true,
      opacity: 0.9,
      sizeAttenuation: true,
    });

    this.points = new THREE.Points(this.geometry, this.pointMaterial);
    this.scene.add(this.points);

    this.initializeNodes();
  }

  private initializeNodes() {
    this.clearNodes();
    this.distributeNodesOnSphere();
    this.connectNearestNeighbors();

    console.log(
      this.nodes[this.nodes.length - 1].neighbors.map((node) => node.value)
    );

    this.updatePointsGeometry();
  }

  private distributeNodesOnSphere() {
    // Asegurarse de que hay al menos 2 nodos (polos)
    const nodeCount = Math.max(2, this.totalNodes);
    // Distribuir los nodos restantes en la esfera
    const points = this.fibonacciSphere(nodeCount);

    // Añadir los nodos intermedios
    points.forEach((point) => {
      // Escalar al radio de la esfera
      const scaledPoint = point.multiplyScalar(this.radius);
      this.addNode(scaledPoint);
    });
  }

  /**
   * Distribuye puntos uniformemente en una esfera usando el algoritmo de la espiral de Fibonacci
   * @param samples Número de puntos a distribuir
   * @returns Array de puntos Vector3 normalizados
   */
  private fibonacciSphere(samples: number): THREE.Vector3[] {
    const points: THREE.Vector3[] = [];
    const phi = Math.PI * (3 - Math.sqrt(5)); // Ángulo áureo

    for (let i = 0; i < samples; i++) {
      const y = 1 - (i / (samples - 1)) * 2; // y va de 1 a -1
      const radius = Math.sqrt(1 - y * y); // radio en x-z

      const theta = phi * i; // Ángulo áureo incrementado
      const x = Math.cos(theta) * radius;
      const z = Math.sin(theta) * radius;

      points.push(new THREE.Vector3(x, y, z));
    }

    return points;
  }

  private addNode(position: THREE.Vector3): Node {
    const node = new Node(this.nodes.length + 1, {
      x: position.x,
      y: position.y,
      z: position.z,
    });

    node.createLabel(this.scene, this.textureLoader);
    this.nodes.push(node);
    return node;
  }

  public addNodes(count: number = 1) {
    this.totalNodes += count;
    this.initializeNodes();
  }

  public removeNode(node: Node) {
    // Eliminar el nodo de la lista
    const index = this.nodes.indexOf(node);
    if (index > -1) {
      // Eliminar conexiones con otros nodos
      this.nodes.forEach((n) => {
        const neighborIndex = n.neighbors.indexOf(node);
        if (neighborIndex > -1) {
          n.neighbors.splice(neighborIndex, 1);
        }
      });

      // Eliminar etiqueta de la escena
      if (node["label"] && node["label"].parent) {
        node["label"].parent.remove(node["label"]);
      }

      // Eliminar nodo
      this.nodes.splice(index, 1);
      this.totalNodes--;

      // Renumerar nodos restantes
      this.nodes.forEach((n, idx) => (n.value = idx + 1));

      // Recalcular posiciones y conexiones
      this.initializeNodes();
    }
  }

  private clearNodes() {
    // Eliminar etiquetas de la escena
    this.nodes.forEach((node) => {
      if (node["label"] && node["label"].parent) {
        node["label"].parent.remove(node["label"]);
      }
    });

    // Limpiar lista de nodos
    this.nodes = [];
  }

  private updatePointsGeometry() {
    const positions = new Float32Array(this.nodes.length * 3);

    this.nodes.forEach((node, i) => {
      positions[i * 3] = node.position.x;
      positions[i * 3 + 1] = node.position.y;
      positions[i * 3 + 2] = node.position.z;
    });

    this.geometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(positions, 3)
    );
    this.geometry.attributes.position.needsUpdate = true;
  }

  private connectNearestNeighbors() {
    this.nodes.forEach((currentNode, currentIndex) => {
      // Limpiar vecinos existentes
      currentNode.neighbors = [];

      // Encontrar los 6 vecinos más cercanos
      const nearestNeighbors = this.nodes
        .filter((_, index) => index !== currentIndex) // Excluir el nodo actual
        .map((node) => ({
          node,
          distance: calculateDistance(currentNode, node),
        }))
        .sort((a, b) => a.distance - b.distance) // Ordenar por distancia
        .slice(0, 6); // Tomar los 6 más cercanos

      // Establecer conexiones bidireccionales
      nearestNeighbors.forEach(({ node }) => {
        if (!currentNode.neighbors.includes(node)) {
          currentNode.addNeighbor(node);
        }
        if (!node.neighbors.includes(currentNode)) {
          node.addNeighbor(currentNode);
        }
      });
    });
  }

  public findClosestNodeToCamera(): Node | null {
    let closestNode: Node | null = null;
    let minDistance = Infinity;
    const cameraPosition = this.camera.position;

    this.nodes.forEach((node) => {
      const distance = cameraPosition.distanceTo(
        new THREE.Vector3(node.position.x, node.position.y, node.position.z)
      );

      if (distance < minDistance) {
        minDistance = distance;
        closestNode = node;
      }
    });

    return closestNode;
  }

  public update() {
    this.nodes.forEach((node) => {
      node.updateLabelPosition(this.camera);
    });
  }
}
