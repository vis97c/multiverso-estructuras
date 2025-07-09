import * as THREE from "three";
import { Node } from "./node";
import { calculateDistance } from "./utils/render";

export class Sphere {
  private points!: THREE.Points;
  public nodes: Node[] = [];
  public currentHoveredNode: Node | null = null;

  constructor(
    private scene: THREE.Scene,
    private camera: THREE.PerspectiveCamera
  ) {
    const radius = 2;
    const detail = 4;
    const icoGeometry = new THREE.IcosahedronGeometry(1, detail);
    const positions = icoGeometry.attributes.position;
    const vertices: number[] = [];

    // Normalizar vértices a la superficie de la esfera
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i);
      const y = positions.getY(i);
      const z = positions.getZ(i);
      const length = Math.sqrt(x * x + y * y + z * z);

      vertices.push(
        (x / length) * radius,
        (y / length) * radius,
        (z / length) * radius
      );
    }

    // Crear geometría de puntos
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(vertices, 3)
    );

    const pointMaterial = new THREE.PointsMaterial({
      color: 0x00a8ff,
      size: 0.05,
      transparent: true,
      opacity: 0.9,
      sizeAttenuation: true,
    });

    // Crear nodos
    const textureLoader = new THREE.TextureLoader();

    for (let i = 0; i < vertices.length / 3; i++) {
      const x = vertices[i * 3];
      const y = vertices[i * 3 + 1];
      const z = vertices[i * 3 + 2];
      const node = new Node(i + 1, { x, y, z });

      node.createLabel(this.scene, textureLoader);
      this.nodes.push(node);
    }

    // Conectar nodos vecinos
    this.connectNearestNeighbors();

    // Crear puntos visibles
    this.points = new THREE.Points(geometry, pointMaterial);
    this.scene.add(this.points);
  }

  private connectNearestNeighbors() {
    this.nodes.forEach((currentNode, currentIndex) => {
      const nodesWithDistances = this.nodes
        .map((node, index) => ({
          node,
          index,
          distance:
            currentIndex === index
              ? Infinity
              : calculateDistance(currentNode, node),
        }))
        .sort((a, b) => a.distance - b.distance)
        .slice(0, 6);

      nodesWithDistances.forEach(({ node }) => {
        if (!currentNode.neighbors.includes(node)) {
          currentNode.addNeighbor(node);
          if (!node.neighbors.includes(currentNode)) {
            node.addNeighbor(currentNode);
          }
        }
      });
    });
  }

  public findClosestNodeToCamera(): Node | null {
    let closestNode: Node | null = null;
    let minDistance = Infinity;
    const cameraPosition = this.camera.position;

    this.nodes.forEach((node) => {
      const dx = node.position.x - cameraPosition.x;
      const dy = node.position.y - cameraPosition.y;
      const dz = node.position.z - cameraPosition.z;
      const distance = dx * dx + dy * dy + dz * dz;

      if (distance < minDistance) {
        minDistance = distance;
        closestNode = node;
      }
    });

    return closestNode;
  }
}
