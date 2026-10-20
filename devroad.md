# 4V4 — hoja de ruta: de MVP a mainnet

## Objetivo

Llevar 4V4 desde el prototipo actual —un marketplace de modelos 3D en Stacks, con archivos y metadatos en IPFS— hasta una dapp pequeña, segura y operable en mainnet. Cada etapa termina con criterios verificables; avanzar de etapa no implica desplegar en mainnet automáticamente.

## Estado de partida

- El frontend usa Next.js y ya contiene páginas de exploración, cuenta y carga, además de rutas API para archivos y servicios auxiliares.
- `clarity/contracts/model-market.clar` implementa publicación, cambio de precio, retiro, compra en STX y consulta de una publicación.
- Hay cambios de desarrollo en curso. Los tests de Clarinet todavía hacen referencia a contratos y funciones anteriores, así que no son una señal confiable del estado del contrato actual hasta alinearlos.
- El archivo `clarity/Clarinet.toml` contiene una frase de recuperación de cuenta de desarrollo. Tratarla como expuesta: invalidar esa cuenta y retirar el secreto del archivo y del historial antes de usar cualquier cuenta o credencial con valor real.

## Etapas

### 0. Asegurar la base de desarrollo

**Trabajo**

- Invalidar la frase de recuperación expuesta; usar cuentas nuevas por entorno y secretos fuera del repositorio.
- Definir la fuente de verdad del producto: el contrato `model-market` y el formato de CID/metadata que consumen frontend e indexación.
- Alinear los tests y scripts de Clarinet con el contrato actual. Hacer que instalación, pruebas de contrato, lint y build frontend sean reproducibles desde una guía única.
- Separar configuración local, testnet y mainnet; impedir que una build de prueba apunte por accidente a mainnet.

**Salida**: repositorio sin secretos activos, contrato y tests coherentes, y pasos reproducibles para levantar el entorno local.

### 1. MVP funcional en local/Devnet

**Alcance mínimo**

- Conectar y desconectar una wallet Stacks; mostrar la red y dirección activas.
- Subir modelo, preview y JSON de metadata a IPFS con validación de tipo y tamaño. Guardar las credenciales de Pinata solo en servidor.
- Publicar una ficha desde la wallet y mostrar estados de transacción: pendiente, confirmada o fallida.
- Explorar fichas activas, ver el modelo 3D y su información, comprar en STX, cambiar precio y retirar la publicación.
- Permitir reintentar carga/consulta si la transacción o el gateway falla, sin duplicar publicaciones silenciosamente.

**Salida**: una persona puede completar el flujo de publicación y otra puede comprarlo en Devnet; el estado que ve la UI coincide con el estado confirmado en Stacks.

### 2. MVP de producto y datos

- Documentar y fijar el esquema de metadata, límites de CID, formatos 3D admitidos, licencia del contenido y reglas de moderación.
- Añadir persistencia o indexación para búsqueda y navegación del catálogo. El contrato sigue siendo la autoridad para propiedad, precio y actividad; el índice se puede reconstruir desde eventos/estado de cadena.
- Diseñar estados vacíos, errores de wallet, transacciones reemplazadas, latencia de indexación y fichas con contenido no disponible.
- Añadir paginación y límites de consulta. No confiar en datos del navegador para precio, vendedor o autorización.
- Definir política de pinning y recuperación de archivos; un CID por sí solo no garantiza disponibilidad.

**Salida**: catálogo usable con datos recuperables y tratamiento claro de contenido roto, latencia y errores.

### 3. Endurecimiento de contratos y seguridad

- Revisar el modelo económico y de propiedad: hoy una compra cambia el vendedor registrado y cierra la publicación; no crea un NFT transferible ni aplica comisión/royalty. Confirmar si ese comportamiento satisface el producto antes de congelar la interfaz.
- Especificar invariantes y errores: autorización del vendedor, precio positivo, compra propia, doble compra, retiro, re-listado y transferencias exactas de STX.
- Añadir pruebas de unidad y de propiedades/casos límite para todas las funciones públicas y lecturas; comprobar reversiones y que un fallo no deje estado parcial.
- Revisar límites de longitud/validación de CID y evitar parámetros que el contrato no pueda verificar pero que la UI presente como validados.
- Solicitar revisión independiente del contrato y corregir hallazgos. Congelar el código y artefactos de despliegue después de la revisión.

**Salida**: especificación aprobada, suite de contrato completa y revisión externa sin hallazgos críticos o altos pendientes.

### 4. Testnet y ensayo operativo

- Desplegar el candidato en Stacks testnet con una cuenta de despliegue dedicada y fondos de prueba.
- Probar de extremo a extremo con wallets reales de testnet: publicación, compra, retiro, cambio de precio y recuperación tras errores.
- Validar enlaces del explorador, lectura de eventos/estado, estimación de comisiones, configuración RPC/API y persistencia de IPFS.
- Ejecutar un ensayo de despliegue documentado y comprobar que una versión del frontend identifica claramente red y dirección del contrato.
- Preparar monitoreo de fallos de API, disponibilidad de gateway/IPFS y transacciones; definir responsable y procedimiento de respuesta.

**Salida**: ensayo repetible, operaciones documentadas y cero defectos bloqueantes en flujos críticos.

### 5. Puerta de entrada a mainnet

Antes de desplegar, exigir todos estos puntos:

- Aprobación explícita de alcance, modelo de propiedad, comisiones y términos de contenido.
- Revisión/auditoría independiente cerrada y código fuente exactamente igual al artefacto verificado.
- Claves de despliegue protegidas, separadas de las claves de operación y con procedimiento de recuperación; ningún secreto en Git o en el cliente.
- Direcciones de contrato, red, enlaces de explorador, límites y parámetros comprobados por dos personas.
- Plan de despliegue, verificación y comunicación; mecanismo de pausa/contención si el contrato lo permite. Si el contrato es inmutable, documentar que no hay pausa ni migración automática.
- Política de soporte, contacto de seguridad, monitoreo, copias/retención de datos y respuesta a incidentes lista.

**Salida**: checklist firmada por responsables técnicos y de producto. El despliegue a mainnet es una decisión separada y consciente.

### 6. Lanzamiento controlado y mantenimiento

- Publicar primero con alcance limitado y límites operativos acordes al soporte disponible.
- Verificar la dirección del contrato y hacer una transacción de prueba de bajo riesgo antes de anunciar el lanzamiento.
- Vigilar errores de transacción, indexación y disponibilidad de contenido; publicar incidencias y cambios de estado con transparencia.
- Mantener un proceso para responder a reportes, retirar contenido según política y actualizar frontend/API sin cambiar silenciosamente las reglas on-chain.

## No incluido en el MVP

Subastas, royalties, tokens NFT estándar, pagos en otros activos, mensajería social y gobernanza. Cada uno amplía el alcance de contratos y revisión de seguridad; incorporarlos solo con una decisión de producto y una nueva evaluación.

## Definición de “mainnet-ready”

No significa únicamente que el contrato compile o que la página cargue. Significa que los flujos críticos están probados en testnet, los activos y secretos se gestionan con controles operativos, el contrato tiene revisión independiente, los límites del producto son visibles y existe un plan real para incidentes y soporte.
