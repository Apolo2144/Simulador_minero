// 1. Inicializar la Base de Datos Local
const db = new Dexie('SimuladorMineroDB');

// Versión 2: Agregamos la tabla de camiones
// Usamos 'patente' (o ID interno) como llave primaria única, no puede haber dos iguales
db.version(2).stores({
    ciclos: '++id, capacidad, tiempoCiclo, productividad, fecha',
    camiones: 'patente, marca, modelo, capacidad' 
});

// 1. Escuchar el evento cuando el operador presiona "Calcular Productividad"
document.getElementById('formulario-simulador').addEventListener('submit', function(evento) {
    
    // Esto evita que la página web se recargue por completo al presionar el botón
    evento.preventDefault();

    // 2. Capturar los valores ingresados
    // Usamos parseFloat() para convertir el texto a números con decimales (flotantes)
    let capacidad = parseFloat(document.getElementById('capacidad').value);
    let t_carguio = parseFloat(document.getElementById('t_carguio').value);
    let t_viaje = parseFloat(document.getElementById('t_viaje').value);
    let t_descarga = parseFloat(document.getElementById('t_descarga').value);
    let t_retorno = parseFloat(document.getElementById('t_retorno').value);
    let t_espera = parseFloat(document.getElementById('t_espera').value);

    // 3. Aplicar el Modelo Matemático Empírico
    // Cálculo del Tiempo de Ciclo Total (Tc) en minutos
    let tiempoCiclo = t_carguio + t_viaje + t_descarga + t_retorno + t_espera;

    // Cálculo de la Productividad Horaria Real (Preal)
    // Fórmula: (Capacidad * 60) / Tiempo de Ciclo
    let productividad = (capacidad * 60) / tiempoCiclo;

    // 4. Mostrar los resultados en la interfaz
    // .toFixed(2) asegura que el resultado muestre solo 2 decimales para no saturar la pantalla
    document.getElementById('res-tiempo-ciclo').textContent = tiempoCiclo.toFixed(2);
    document.getElementById('res-productividad').textContent = productividad.toFixed(2);
    // Guardar el registro en la base de datos (Equivalente a INSERT INTO)
    db.ciclos.add({
        capacidad: capacidad,
        tiempoCiclo: parseFloat(tiempoCiclo.toFixed(2)),
        productividad: parseFloat(productividad.toFixed(2)),
        // Guardamos la fecha y hora exacta del sistema
        fecha: new Date().toLocaleString() 
    }).then(() => {
        // Esto se ejecuta si el guardado fue exitoso
        console.log("¡Ciclo registrado correctamente en la base de datos!");
    }).catch((error) => {
        // Esto captura cualquier error
        console.error("Error al guardar el ciclo: ", error);
    });
    
});
    
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js')
      .then(registration => {
        console.log('Service Worker registrado con éxito:', registration.scope);
      })
      .catch(error => {
        console.log('Error al registrar el Service Worker:', error);
      });
  });

  // =====================================================================
// LÓGICA DE EXPORTACIÓN A CSV
// =====================================================================
document.getElementById('btn-exportar').addEventListener('click', function() {
    
    // 1. Extraer los datos: Equivalente a "SELECT * FROM ciclos" en SQL
    db.ciclos.toArray().then(function(ciclos) {
        
        // Si la base de datos está vacía, avisamos y detenemos la ejecución
        if(ciclos.length === 0) {
            alert("No hay datos registrados en este turno para exportar.");
            return; // Corta la ejecución de la función aquí
        }

        // 2. Construir el archivo CSV (Texto separado por comas)
        // Definimos la primera fila que son los encabezados de las columnas
        let contenidoCSV = "ID_Registro,Capacidad_Ton,Tiempo_Ciclo_Min,Productividad_Ton_H,Fecha_Hora\n";

        // Iteramos sobre cada fila de la base de datos
        ciclos.forEach(function(fila) {
            // Concatenamos los datos. Usamos comillas dobles para la fecha por si contiene comas o espacios.
            contenidoCSV += `${fila.id},${fila.capacidad},${fila.tiempoCiclo},${fila.productividad},"${fila.fecha}"\n`;
        });

        // 3. Crear el archivo físico en la memoria RAM del navegador (Blob)
        let blob = new Blob([contenidoCSV], { type: 'text/csv;charset=utf-8;' });
        let url = URL.createObjectURL(blob);
        
        // 4. Forzar la descarga en el dispositivo (Enlace fantasma)
        let link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", "Reporte_Turno_Minero.csv"); // El nombre que tendrá el archivo
        
        // Lo hacemos invisible, lo añadimos, simulamos el clic y lo destruimos
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
    }).catch(function(error) {
        console.error("Error al extraer los datos: ", error);
        alert("Ocurrió un error al intentar exportar los datos.");
    });
});
}
// =====================================================================
// LÓGICA DE GESTIÓN DE FLOTA (CAMIONES)
// =====================================================================

// 1. Función para cargar y mostrar los camiones en la tabla
function cargarCamiones() {
    let listaHTML = document.getElementById('lista-camiones');
    listaHTML.innerHTML = ''; // Limpiamos la tabla antes de rellenarla

    // Leemos todos los camiones de la base de datos
    db.camiones.toArray().then(function(camiones) {
        camiones.forEach(function(camion) {
            // Creamos una fila por cada camión
            let fila = `
                <tr>
                    <td><strong>${camion.patente}</strong></td>
                    <td>${camion.marca}</td>
                    <td>${camion.modelo}</td>
                    <td>${camion.capacidad} t</td>
                    <td><button class="btn-eliminar" onclick="eliminarCamion('${camion.patente}')">Eliminar</button></td>
                </tr>
            `;
            listaHTML.innerHTML += fila;
        });
    });
}

// 2. Evento para guardar un nuevo camión
document.getElementById('form-camion').addEventListener('submit', function(evento) {
    evento.preventDefault();

    // Capturamos los datos
    let patente = document.getElementById('c_patente').value.toUpperCase(); // Forzamos mayúsculas
    let marca = document.getElementById('c_marca').value;
    let modelo = document.getElementById('c_modelo').value;
    let capacidad = parseFloat(document.getElementById('c_capacidad').value);

    // Guardamos en Dexie. Usamos .put() para que si la patente ya existe, la actualice en lugar de dar error.
    db.camiones.put({
        patente: patente,
        marca: marca,
        modelo: modelo,
        capacidad: capacidad
    }).then(() => {
        // Limpiamos el formulario y recargamos la tabla
        document.getElementById('form-camion').reset();
        cargarCamiones();
    }).catch(error => {
        console.error("Error al guardar camión:", error);
    });
});

// 3. Función para eliminar un camión (llamada desde el botón rojo de la tabla)
function eliminarCamion(patente) {
    if(confirm(`¿Estás seguro de eliminar el camión ${patente}?`)) {
        db.camiones.delete(patente).then(() => {
            cargarCamiones(); // Recargamos la tabla tras borrar
        });
    }
}

// 4. Ejecutamos la carga de camiones apenas se abre la aplicación
window.addEventListener('load', () => {
    cargarCamiones();
});