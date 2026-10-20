# 4V4 — Hoja de ruta: del MVP a mainnet

[Read this roadmap in English](devroad.md).

## Objetivo

Llevar 4V4 desde el prototipo actual —un marketplace de modelos 3D en Stacks, con archivos y metadatos en IPFS— hasta una dapp pequeña, segura y operable en mainnet. Cada etapa termina con criterios verificables; completar una etapa no autoriza automáticamente el despliegue en mainnet.

## Estado de partida

- El frontend Next.js incluye páginas para explorar, cuentas y carga, además de rutas API para archivos y servicios auxiliares.
- `clarity/contracts/model-market.clar` implementa publicación, cambio de precio, retiro, compra en STX y consulta de publicaciones.
- Los tests de Clarinet todavía hacen referencia a contratos y funciones anteriores; deben alinearse antes de validar el contrato actual.
- `clarity/Clarinet.toml` contiene una frase de recuperación de una cuenta de desarrollo. Debe tratarse como expuesta: invalidar esa cuenta y retirar el secreto del archivo y del historial antes de usar cuentas o credenciales con valor real.

## Etapas

### 0. Asegurar la base de desarrollo

- Invalidar la frase expuesta; usar cuentas nuevas por entorno y guardar secretos fuera del repositorio.
- Definir como fuente de verdad el contrato `model-market` y el formato de CID/metadatos utilizado por el frontend y el indexador.
- Alinear tests y scripts de Clarinet con el contrato actual. Hacer reproducibles la instalación, las comprobaciones del contrato, el lint y la compilación del frontend.
- Separar la configuración local, testnet y mainnet para impedir que una build de prueba apunte por accidente a mainnet.

**Criterios de salida:** no quedan secretos activos en el repositorio, contrato y tests coinciden, y la configuración local se reproduce de forma consistente.

### 1. MVP funcional en local/Devnet

- Conectar y desconectar una wallet Stacks; mostrar la red y dirección activas.
- Subir modelo, vista previa y JSON de metadatos a IPFS con validación de tipo y tamaño. Mantener las credenciales de Pinata solo en el servidor.
- Enviar publicaciones desde la wallet y mostrar transacciones pendientes, confirmadas o fallidas.
- Explorar publicaciones activas, ver el modelo 3D y sus detalles, comprar en STX, cambiar el precio y retirar la publicación.
- Permitir reintentos cuando falle una transacción o gateway, sin crear publicaciones duplicadas en silencio.

**Criterios de salida:** una persona publica un modelo y otra lo compra en Devnet; la interfaz coincide con el estado confirmado en Stacks.

### 2. MVP de producto y datos

- Documentar y fijar el esquema de metadatos, límites de CID, formatos 3D admitidos, licencia del contenido y reglas de moderación.
- Añadir persistencia o indexación para buscar y recorrer el catálogo. El contrato sigue siendo la autoridad para propiedad, precio y estado; el índice se puede reconstruir desde los eventos o el estado de la cadena.
- Diseñar estados vacíos y manejar errores de wallet, transacciones reemplazadas, demoras de indexación y contenido no disponible.
- Añadir paginación y límites de consulta. No confiar en datos del navegador para determinar precio, vendedor o autorización.
- Definir políticas para fijar y recuperar archivos; un CID por sí solo no garantiza disponibilidad.

**Criterios de salida:** catálogo usable, datos recuperables y manejo claro de contenido roto, demoras y errores.

### 3. Refuerzo del contrato y seguridad

- Revisar el modelo de propiedad y económico: actualmente una compra cambia el vendedor registrado y cierra la publicación; no crea un NFT transferible ni aplica comisiones o royalties. Confirmar que esto satisface los requisitos antes de congelar la interfaz.
- Especificar invariantes y errores: autorización del vendedor, precios positivos, compras propias y duplicadas, retiro, nueva publicación y transferencias exactas de STX.
- Añadir pruebas unitarias y de casos límite para cada función pública y de lectura; verificar los reverts y que los fallos no dejen estado parcial.
- Revisar límites y validación de CID. No presentar como verificados por la interfaz parámetros que el contrato no puede validar.
- Solicitar una revisión independiente del contrato y resolver sus hallazgos. Congelar el código fuente y los artefactos de despliegue después de la revisión.

**Criterios de salida:** especificación aprobada, suite completa de pruebas del contrato y ningún hallazgo crítico o alto pendiente.

### 4. Testnet y ensayo operativo

- Desplegar la versión candidata en Stacks testnet con una cuenta dedicada y fondos de prueba.
- Probar de extremo a extremo con wallets reales de testnet: publicación, compra, retiro, cambio de precio y recuperación ante errores.
- Validar enlaces al explorador, lectura de eventos/estado, estimación de comisiones, configuración RPC/API y persistencia en IPFS.
- Hacer un ensayo de despliegue documentado y comprobar que el frontend identifica la red y dirección del contrato.
- Preparar monitoreo de fallos de API, disponibilidad de gateway/IPFS y transacciones; asignar responsables y procedimientos de respuesta.

**Criterios de salida:** ensayo repetible, operaciones documentadas y ningún defecto bloqueante en flujos críticos.

### 5. Requisitos para mainnet

- Aprobación explícita del alcance, modelo de propiedad, comisiones y términos del contenido.
- Revisión/auditoría independiente completada, con código fuente idéntico al artefacto revisado.
- Claves de despliegue protegidas y separadas de las claves operativas, con procedimiento de recuperación. Ningún secreto en Git o en el cliente.
- Dos personas verifican direcciones de contrato, red, enlaces al explorador, límites y parámetros.
- Plan de despliegue, verificación y comunicación; mecanismo de pausa o contención si el contrato lo permite. Si es inmutable, documentar que no hay pausa ni migración automática.
- Política de soporte, contacto de seguridad, monitoreo, retención y copias de datos, y respuesta a incidentes listas.

**Criterios de salida:** lista de control aprobada por responsables técnicos y de producto. El despliegue en mainnet sigue siendo una decisión deliberada e independiente.

### 6. Lanzamiento controlado y mantenimiento

- Lanzar con alcance limitado y límites operativos acordes con el soporte disponible.
- Verificar la dirección del contrato y hacer una transacción de prueba de bajo riesgo antes de anunciar el lanzamiento.
- Vigilar errores de transacción, indexación y disponibilidad del contenido; comunicar incidentes y cambios de estado con claridad.
- Mantener procesos para atender reportes, retirar contenido según la política y actualizar frontend/API sin cambiar en silencio las reglas on-chain.

## Fuera del MVP

Subastas, royalties, tokens NFT estándar, pagos en otros activos, mensajería social y gobernanza. Cada función amplía el alcance del contrato y de la revisión de seguridad; añadirla solo tras una decisión de producto y una nueva evaluación.

## Definición de “listo para mainnet”

No basta con que el contrato compile o que la página cargue. Los flujos críticos deben probarse en testnet; activos y secretos deben gestionarse con controles operativos; el contrato debe recibir una revisión independiente; los límites del producto deben ser visibles, y debe existir un plan real de soporte e incidentes.
