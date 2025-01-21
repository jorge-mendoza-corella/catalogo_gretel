<script setup lang="ts">
import axios from 'axios'
import { ref, onMounted } from 'vue'

// Estado para almacenar las canciones y los filtros
const canciones = ref([])
const filtros = ref({
  nombre: '',
  artista: '',
  genero: '',
  idioma: '',
})

// URL de la hoja de Google Sheets
const SHEET_ID = '165TGNzCT2yXTRQoJnmKdv-VirCJ4OEVrHoqhpWZDVIA'
const SHEET_RANGE = 'Catalogo!A:D' // Rango de las columnas de la pestaña Catalogo
const API_KEY = 'AIzaSyBvXxKtKJ3i8t5AbV0xco2Vy2lq4XciHlY'

// Función para cargar los datos desde Google Sheets
async function cargarCanciones() {
  try {
    const response = await axios.get(
      `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${SHEET_RANGE}?key=${API_KEY}`
    )
    const rows = response.data.values
    // Procesar las filas: Usa la primera fila como encabezados
    const [headers, ...data] = rows
    canciones.value = data.map(row =>
      headers.reduce((acc, header, index) => {
        acc[header] = row[index] || ''
        return acc
      }, {})
    )
  } catch (error) {
    console.error('Error al cargar canciones:', error)
  }
}

// Computed para filtrar las canciones dinámicamente
const cancionesFiltradas = computed(() =>
  canciones.value.filter(cancion =>
    (!filtros.value.nombre || cancion['Nombre de la canción']?.toLowerCase().includes(filtros.value.nombre.toLowerCase())) &&
    (!filtros.value.artista || cancion['Artista']?.toLowerCase().includes(filtros.value.artista.toLowerCase())) &&
    (!filtros.value.genero || cancion['Género']?.toLowerCase().includes(filtros.value.genero.toLowerCase())) &&
    (!filtros.value.idioma || cancion['Idioma']?.toLowerCase().includes(filtros.value.idioma.toLowerCase()))
  )
)

// Cargar las canciones al montar el componente
onMounted(() => {
  cargarCanciones()
})
</script>

<template>
  <div>
    <h1>Filtros</h1>
    <div class="filtros">
      <input v-model="filtros.nombre" placeholder="Nombre de la canción" />
      <input v-model="filtros.artista" placeholder="Artista" />
      <input v-model="filtros.genero" placeholder="Género" />
      <input v-model="filtros.idioma" placeholder="Idioma" />
    </div>
    <h1>Repertorio</h1>
    <table>
      <thead>
        <tr>
          <th>Nombre de la canción</th>
          <th>Artista</th>
          <th>Género</th>
          <th>Idioma</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(cancion, index) in cancionesFiltradas" :key="index">
          <td>{{ cancion['Nombre de la canción'] }}</td>
          <td>{{ cancion['Artista'] }}</td>
          <td>{{ cancion['Género'] }}</td>
          <td>{{ cancion['Idioma'] }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style>
.filtros {
  margin-bottom: 20px;
  display: flex;
  gap: 10px;
}
table {
  width: 100%;
  border-collapse: collapse;
}
th, td {
  border: 1px solid #ddd;
  padding: 8px;
}
th {
  background-color: #f4f4f4;
}
</style>
