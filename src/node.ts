import * as THREE from "three";

interface NodePosition {
  x: number;
  y: number;
  z: number;
}

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
  /** Posición 3D del nodo */
  position: NodePosition;
  /** Sprite de la etiqueta del nodo */
  private label: THREE.Sprite | null = null;
  /** Indica si el nodo está activo */
  private _active: boolean = false;
  /** Material del punto 3D */
  private point: THREE.Points | null = null;

  constructor(value: number, position: NodePosition) {
    this.neighbors = [];
    this.value = value;
    this.position = position;
  }

  /**
   * Crea la etiqueta del nodo
   * @param scene Escena de Three.js donde se agregará la etiqueta
   * @param loader Cargador de texturas para crear el sprite
   */
  createLabel(scene: THREE.Scene, loader: THREE.TextureLoader) {
    const spriteMaterial = new THREE.SpriteMaterial({
      map: loader.load(
        `data:image/svg+xml;charset=utf-8,${this.createLabelSVG()}`
      ),
      transparent: true,
      opacity: 0,
      depthTest: false,
    });
    // Crear la geometria del punto 3D para el nodo
    const geometry = new THREE.BufferGeometry();
    const vertices = new Float32Array([0, 0, 0]);

    geometry.setAttribute("position", new THREE.BufferAttribute(vertices, 3));

    const material = new THREE.PointsMaterial({
      color: this.active ? 0xff0000 : 0x00a8ff,
      size: 0.1,
      transparent: true,
      opacity: 0.9,
      sizeAttenuation: true,
    });

    // Crear el punto 3D para el nodo
    this.point = new THREE.Points(geometry, material);
    this.point.position.set(this.position.x, this.position.y, this.position.z);
    scene.add(this.point);

    // Crear el sprite para la etiqueta
    this.label = new THREE.Sprite(spriteMaterial);
    this.label.position.set(this.position.x, this.position.y, this.position.z);
    this.label.scale.set(0.3, 0.15, 1);
    this.label.renderOrder = 1; // Asegurar que se renderice por encima de otros objetos
    scene.add(this.label);
  }

  /**
   * Muestra u oculta la etiqueta del nodo
   * @param visible Indica si la etiqueta debe mostrarse
   */
  setLabelVisibility(visible: boolean) {
    if (this.label) {
      (this.label.material as THREE.SpriteMaterial).opacity = visible ? 0.8 : 0;
    }
  }

  /**
   * Obtiene o establece si el nodo está activo
   */
  get active(): boolean {
    return this._active;
  }

  set active(value: boolean) {
    if (this._active !== value) {
      this._active = value;

      if (this.point) {
        const material = this.point.material as THREE.PointsMaterial;

        material.color.set(value ? 0xff0000 : 0x00a8ff);
      }
    }
  }

  /**
   * Crea el SVG para la etiqueta del nodo
   * @returns SVG codificado en URI
   */
  private createLabelSVG(): string {
    return encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">
        <rect width="100%" height="100%" fill="rgba(0,0,0,0.7)" rx="10" ry="10"/>
        <text x="50%" y="50%" 
              font-family="Arial" 
              font-size="40" 
              fill="white" 
              text-anchor="middle" 
              dominant-baseline="middle">
          ${this.value}
        </text>
      </svg>
    `);
  }

  /**
   * Actualiza la posición de la etiqueta según la cámara
   * @param camera Cámara actual
   */
  updateLabelPosition(camera: THREE.Camera) {
    if (this.label) {
      // Hacer que la etiqueta siempre mire a la cámara
      this.label.position.copy(this.position as THREE.Vector3);
      this.label.quaternion.copy(camera.quaternion);
    }

    // Actualizar posición del punto 3D
    if (this.point) this.point.position.copy(this.position as THREE.Vector3);
  }

  addNeighbor(node: Node) {
    if (!this.neighbors.includes(node)) this.neighbors.push(node);
  }

  removeNeighbor(node: Node) {
    this.neighbors = this.neighbors.filter((neighbor) => neighbor !== node);
  }
}
