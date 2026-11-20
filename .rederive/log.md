## D1. Persistencia y propiedad de tareas
struggled with: Inicialmente propuso una relación de invitación como vínculo principal y después un campo de invitado, sin separar claramente al propietario.
found on their own: Las tareas deben persistir después del cierre de sesión; el usuario principal puede editar y completar, mientras otros usuarios pueden tener acceso de lectura.
did well: Identificó la necesidad de mantener las tareas privadas por usuario y distinguir permisos de edición y lectura.
did ok: Necesitó una comparación de alternativas para llegar a una representación con propietario directo y colaboradores separados.
better idea: Propietario directo más una relación adicional de participantes para futuras tareas compartidas.

## D2. Identidad y sesiones
struggled with: La primera respuesta describió la cuenta de Google y las invitaciones, pero no explicó cómo se demostraría la identidad en peticiones posteriores.
found on their own: El navegador debe conservar una cookie y el backend debe firmarla con JWS para que el servidor pueda verificarla.
did well: Entendió que Google sirve para autenticar inicialmente y que la sesión posterior no debe depender de repetir el login.
did ok: Necesitó la restricción de no confiar en texto enviado por el navegador para concretar la prueba verificable.
better idea: Separar autenticación inicial con Google de una sesión firmada reutilizable.

## D3. Autorización por propietario
struggled with: Primero propuso revisar el propietario y después centrarse solo en enviar el token, sin ligar todavía la identidad a la operación concreta.
found on their own: La sesión activa identifica a la persona y una tarea ajena no debe poder modificarse aunque esté asignada.
did well: Mantuvo clara la regla de que solo el propietario puede editar o eliminar.
did ok: Necesitó ayuda para convertir la comprobación en una condición conjunta entre tarea y usuario dentro de la operación de almacenamiento.
better idea: Rechazar la operación cuando no existe una coincidencia simultánea entre el identificador de la tarea y el usuario autenticado, mostrando un error sin cambiar datos.

## D4. Separación entre reglas y persistencia
struggled with: Interpretó inicialmente la separación como una base espejo, caché o dos bases de datos, y después como llamadas directas al ORM.
found on their own: Las reglas pueden probarse con datos mock o tests sin depender de la base real.
did well: Reconoció el valor del ORM para persistencia y finalmente identificó la ventaja de aislarlo para las pruebas.
did ok: Necesitó ver opciones y un esquema conceptual para distinguir una interfaz de datos de una segunda base.
better idea: Reglas de tareas contra una interfaz pequeña y un adaptador Prisma separado.

## D5. Dashboard acotado y derivado
struggled with: Propuso inicialmente resolver la consulta con Prisma y encolar tareas, y trató una página inválida como si fuera ausencia de registros.
found on their own: El filtro debe ejecutarse en el backend y la respuesta debe usar paginación o un límite.
did well: Identificó correctamente la necesidad de filtrar y limitar datos antes de enviarlos al cliente.
did ok: Necesitó precisar el orden estable y el tratamiento de días vacíos y páginas fuera de rango.
better idea: Consultas filtradas y ordenadas en servidor, páginas acotadas, actividad completa con ceros y corrección de páginas inválidas.

## D6. Estado navegable y datos actualizados
struggled with: Propuso inicialmente memoria o localStorage como fuente del estado de filtros y páginas, y depender de ellos para refrescar.
found on their own: Los filtros y la página pueden representarse con query strings en la URL.
did well: Entendió que la vista debe conservar sus parámetros de navegación.
did ok: Necesitó distinguir el estado navegable de la fuente de verdad del servidor después de una mutación.
better idea: Estado de búsqueda, filtro y página en la URL, con recarga de datos del servidor tras crear, editar o eliminar.
