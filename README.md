# Multiverso Esférico

Los universos (nodos) se agrupan en una esfera. Cada universo se conecta con sus 6 vecinos mas proximos.

La estructura de datos del multiverso esta definida por una lista enlazada de tipo pila. En esta cada nuevo universo se añade y elimina al final de la pila.

Cada universo (nodo) esta enumerado y distribuido en proximidad a los otros nodos de valor similar, lo que permite recorrer el multiverso a partir de sus valores.

## Busqueda

Para viajar de un universo de mayor valor a uno de menor valor buscaremos en los vecinos del universo actual, el universo con el valor que queremos encontrar o caso contrario aquel que tenga el menor valor disponible y asi sucesivamente hasta llegar al universo que queremos.

Este recorrido se almacena en una lista para que en nuestro proxima busqueda tengamos la restriccion de los nodos que ya hemos visitado.
