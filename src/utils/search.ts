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

  /**
   * Función heurística que estima la distancia entre dos nodos basada en sus valores
   */
  function heuristic(nodeValue: number, targetValue: number): number {
    return Math.abs(nodeValue - targetValue);
  }

  /**
   * Busca el camino mas corto entre dos nodos usando un enfoque tipo A*
   *
   * @complexity
   * - Tiempo: O(V + E) donde V es el número de nodos y E el número de aristas
   * - Espacio: O(V) en el peor caso. Guarda todos los nodos en la ruta.
   *
   * @param path Ruta inicial
   * @param paths Array de rutas a explorar
   * @returns El camino mas corto encontrado
   */
  return function searchPath(
    path: Path,
    paths: Path[] = [{ ...path, score: 0 }]
  ): Path {
    const candidate = path.trip[path.trip.length - 1];
    const neighbors = candidate.neighbors.filter(
      ({ value }) => !avoidValues.includes(value)
    );
    // Comprobar si hemos llegado al nodo objetivo
    const node = neighbors.find(({ value }) => value === search);

    if (node) {
      path.found = true;
      path.trip.push(node);
      return path;
    }

    // Para cada vecino, crear un nuevo camino y continuar la búsqueda
    for (const neighbor of neighbors) {
      // Si el vecino ya está en el camino actual, lo saltamos para evitar ciclos
      if (path.trip.some((node) => node.value === neighbor.value)) continue;

      // Creamos una nueva ruta que incluye al vecino
      const newPath = {
        trip: [...path.trip, neighbor],
        found: false,
        // El puntaje es la longitud del camino más la heurística
        score: path.trip.length + heuristic(neighbor.value, search),
      };

      // Insertamos la nueva ruta manteniendo el array ordenado por score
      const insertIndex = paths.findIndex(
        (p) => (p.score ?? 0) > newPath.score
      );

      // Esto reemplaza la necesidad de ordenar el array
      if (insertIndex === -1) paths.push(newPath);
      else paths.splice(insertIndex, 0, newPath);
    }

    // Si no hay más rutas por explorar, retornamos la ruta actual
    if (paths.length === 0) return path;

    // Tomamos la ruta con mejor puntaje (menor score)
    const nextPath = paths.shift();

    return nextPath ? searchPath(nextPath, paths) : path;
  };
}
