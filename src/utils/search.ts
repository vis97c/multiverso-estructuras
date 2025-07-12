import type { Node } from "../node";

interface Path {
  trip: Node[];
  found: boolean;
  /**
   * Puntaje de la ruta
   *
   * @default 0
   */
  score?: number;
}

export function makePathSearch(search: number, lastTrip: Node[]) {
  /** Valores de los nodos a evitar */
  const avoidValues = lastTrip.map(({ value }) => value);
  const MAX_ITERATIONS = 1000; // Prevenir bucles infinitos

  /**
   * Función heurística que estima la distancia entre dos nodos basada en sus valores
   */
  function heuristic(nodeValue: number, targetValue: number): number {
    return Math.abs(nodeValue - targetValue);
  }

  /**
   * Busca el camino mas corto entre dos nodos usando un enfoque tipo A* iterativo
   *
   * @complexity
   * - Tiempo: O(V + E) donde V es el número de nodos y E el número de aristas
   * - Espacio: O(V) en el peor caso. Guarda todos los nodos en la ruta.
   *
   * @param initialPath Ruta inicial
   * @returns El camino mas corto encontrado
   */
  return function searchPath(initialPath: Path): Path {
    const paths: Path[] = [{ ...initialPath, score: 0 }];
    let iterations = 0;

    while (paths.length > 0 && iterations < MAX_ITERATIONS) {
      iterations++;

      // Tomar el mejor camino actual (menor score)
      const path = paths.shift()!;
      const candidate = path.trip[path.trip.length - 1];
      // Obtener vecinos válidos
      const neighbors = candidate.neighbors.filter(
        ({ value }) => !avoidValues.includes(value)
      );
      // Verificar si encontramos el nodo objetivo
      const node = neighbors.find(({ value }) => value === search);

      if (node) {
        return {
          trip: [...path.trip, node],
          found: true,
          score: path.trip.length,
        };
      }

      // Explorar vecinos
      for (const neighbor of neighbors) {
        // Evitar ciclos
        if (path.trip.some(({ value }) => value === neighbor.value)) continue;

        // Crear nueva ruta
        const newPath = {
          trip: [...path.trip, neighbor],
          found: false,
          score: path.trip.length + heuristic(neighbor.value, search),
        };

        // Insertar manteniendo el orden por score
        const insertIndex = paths.findIndex((p) => p.score! > newPath.score!);

        // Con esto evitamos usar sort
        if (insertIndex === -1) paths.push(newPath);
        else paths.splice(insertIndex, 0, newPath);
      }

      // Limitar el número de rutas en memoria para evitar uso excesivo
      if (paths.length > MAX_ITERATIONS) paths.length = MAX_ITERATIONS;
    }

    console.warn("No se encontró el nodo o se itero demasiado");

    // Si llegamos aquí, no se encontró el nodo o se alcanzó el límite de iteraciones
    return { trip: initialPath.trip, found: false };
  };
}
