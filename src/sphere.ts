import * as THREE from "three";
import { Node } from "./node";
import { calculateDistance, disposeLine } from "./utils/render";
import { makePathSearch } from "./utils/search";

export class Sphere {
  private points!: THREE.Points;
  public nodes: Node[] = [];
  public currentHoveredNode: Node | null = null;
  private _activeNode!: Node;
  private textureLoader: THREE.TextureLoader;
  private pointMaterial: THREE.PointsMaterial;
  private geometry: THREE.BufferGeometry;
  private lastTrip: Node[] = [];
  private tripLines: THREE.Line[] = [];
  private lines: THREE.Line[] = [];

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

    // Establecer el primer nodo como activo por defecto
    if (this.nodes.length === 1) this.activeNode = node;

    return node;
  }

  /**
   * Obtiene o establece el nodo activo actual
   */
  get activeNode(): Node {
    return this._activeNode;
  }

  set activeNode(node: Node) {
    if (this._activeNode === node) return;

    // Desactivar el nodo activo actual
    if (this._activeNode) this._activeNode.active = false;

    // Establecer el nuevo nodo activo
    this._activeNode = node;
    this._activeNode.active = true;
  }

  /**
   * Dibuja y anima una linea entre dos nodos
   * @param initialNode Nodo inicial
   * @param finalNode Nodo final
   * @param type Tipo de linea
   */
  private async drawLine(
    initialNode: Node,
    finalNode: Node,
    type: "line" | "trip"
  ) {
    const firstPoint = new THREE.Vector3(
      initialNode.position.x,
      initialNode.position.y,
      initialNode.position.z
    );
    const secondPoint = new THREE.Vector3(
      finalNode.position.x,
      finalNode.position.y,
      finalNode.position.z
    );

    // Create a line with more segments for smoother animation
    const points = [];
    const segments = 50;

    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      points.push(new THREE.Vector3().lerpVectors(firstPoint, secondPoint, t));
    }

    const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);

    // Create custom shader material for the line animation
    const lineMaterial = new THREE.ShaderMaterial({
      uniforms: {
        progress: { value: 0 },
        color: {
          value:
            type === "trip"
              ? new THREE.Color(0x00ff00)
              : new THREE.Color(0x808080),
        },
        opacity: { value: 1.0 },
      },
      vertexShader: `
        uniform float progress;
        attribute float alpha;
        varying float vAlpha;
        
        void main() {
          vAlpha = alpha <= progress ? 1.0 : 0.0;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 color;
        uniform float opacity;
        varying float vAlpha;
        
        void main() {
          gl_FragColor = vec4(color, opacity * vAlpha);
        }
      `,
      transparent: true,
      depthTest: false,
      linewidth: 2,
    });

    // Add alpha attribute to control visibility of each segment
    const alphas = new Float32Array(points.length);

    for (let i = 0; i < alphas.length; i++) {
      alphas[i] = i / (alphas.length - 1);
    }

    lineGeometry.setAttribute("alpha", new THREE.BufferAttribute(alphas, 1));

    const line = new THREE.Line(lineGeometry, lineMaterial);

    // Add the line to the appropriate array
    if (type === "trip") this.tripLines.push(line);
    else this.lines.push(line);

    // Animate the line growth and return a promise that resolves when done
    return new Promise<void>((resolve) => {
      const duration = 1000; // 1 second
      const startTime = Date.now();

      const animateLine = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);

        lineMaterial.uniforms.progress.value = progress;

        if (progress < 1) requestAnimationFrame(animateLine);
        else resolve();
      };

      // Add the line to the scene
      this.scene.add(line);

      // Start animation
      animateLine();
    });
  }

  /**
   * Busca y viaja a un nodo vecino
   *
   * La búsqueda se realiza de la siguiente manera:
   *
   * 1. Si el valor es el mismo que el nodo activo, no hacer nada
   * 2. Si el valor pertenece a un vecino, viajar al vecino
   * 3. Si no pertenece a un vecino buscar el vecino mas viable y viajar
   *
   * @param search Valor del nodo vecino a buscar
   * @returns El nodo vecino encontrado, null si no se encuentra
   */
  public async searchNode(search: number): Promise<Node | null> {
    const trip: Node[] = [this.activeNode];

    // No buscar si el valor esta fuera del rango
    if (search > this.nodes.length || search < 1) return null;
    // Si el valor es el mismo que el nodo activo, no hacer nada
    if (this.activeNode.value === search) return this.activeNode;

    // Si el valor ya se ha visitado, no hacer nada
    if (this.lastTrip.some(({ value }) => value === search)) return null;

    const searchPath = makePathSearch(search, this.lastTrip);
    // Buscar entre los vecinos el camino mas corto
    const path = searchPath({ trip: [this.activeNode], found: false });
    const node: Node = path.trip[path.trip.length - 1];

    // Si se encuentra el nodo, guardar el viaje
    if (node?.value === search && trip !== this.lastTrip) {
      console.log(`Desviación del viaje: ${path.score ?? 0}`);

      // Viajar por el camino encontrado
      for (let index = 1; index < path.trip.length; index++) {
        const step = path.trip[index];

        trip.push(step);
        await this.drawLine(this.activeNode, step, "trip");
        this.activeNode = step;

        const neighbors = step.neighbors.map(({ value }) => value);

        console.log(
          `Vecinos del nodo ${step.value}: (${neighbors.join(", ")})`
        );
      }

      this.lastTrip = trip;

      const tripValues = trip.map(({ value }) => value);

      console.log("Viaje:", tripValues);
      // Limpiar todas las lineas anteriores
      this.lines.forEach((line) => disposeLine(this.scene, line));
      this.lines = [];

      // Convertir tripLines en lines
      this.tripLines.forEach((line) => {
        this.lines.push(line);

        // Actualizar material de la linea a gris
        const lineMaterial = line.material as THREE.ShaderMaterial;

        lineMaterial.uniforms.color.value.set(0x808080);
      });
      this.tripLines = [];

      return node;
    }

    return null;
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
      if (node["point"] && node["point"].parent) {
        node["point"].parent.remove(node["point"]);
      }
    });

    // Limpiar geometría de puntos
    this.geometry.dispose();
    this.geometry = new THREE.BufferGeometry();
    this.points.geometry = this.geometry;

    // Limpiar lista de nodos
    this.nodes = [];
    this.lastTrip = [];

    // Limpiar líneas de viaje
    this.tripLines.forEach((line) => disposeLine(this.scene, line));
    this.tripLines = [];

    // Limpiar otras líneas
    this.lines.forEach((line) => disposeLine(this.scene, line));
    this.lines = [];
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

      // Establecer conexion unidireccional
      nearestNeighbors.forEach(({ node }) => currentNode.addNeighbor(node));
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
    this.nodes.forEach((node) => node.updateLabelPosition(this.camera));
  }
}
