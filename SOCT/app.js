// 1. Inicializar la Base de Datos Local
const db = new Dexie('SimuladorMineroDB');

// 2. Definir la estructura de la "tabla" (Store)
// El '++id' funciona exactamente igual que un PRIMARY KEY AUTO_INCREMENT
db.version(1).stores({
    ciclos: '++id, capacidad, tiempoCiclo, productividad, fecha' 
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
