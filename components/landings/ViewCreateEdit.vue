<script setup lang="ts">
// global imports
// @ts-expect-error: $primevue is not defined
import VueCropper from 'vue-cropperjs'
import 'cropperjs/dist/cropper.css'
import { ref as fireRef, getDownloadURL, getStorage, updateMetadata, uploadString } from 'firebase/storage'
import { addDoc, collection, doc, getDoc, getDocs, updateDoc } from 'firebase/firestore'
import { helpers, maxLength, minLength, numeric, required } from '@vuelidate/validators'
import { useVuelidate } from '@vuelidate/core'
import { GoogleMap, Marker } from 'vue3-google-map'
import { Loader } from '@googlemaps/js-api-loader'
import { httpsCallable } from 'firebase/functions'

// component props
const props = defineProps({
  new: {
    type: Boolean,
    required: false,
    default: true,
  },
})
// global configurations and composables
const config = useRuntimeConfig()
const { $db, $functions } = useNuxtApp()
const router = useRouter()
const route = useRoute()
const countries = useCountries()
const notification = useNotification()
// global form data
const formData = reactive({
  order: false,
  title: '',
  slug: '',
  zone: '',
  country: {
    name_en: 'Mexico',
    name_es: 'México',
    dial_code: '+52',
    code: 'MX',
  },
  phone: '',
  whatsapp: '',
  tour: '',
  description: '',
  long_description: '',
  cover: {
    src: '',
    alt: '',
  },
  op: {
    src: '',
    alt: '',
  },
  badge: {
    text: '',
    color: '',
  },
  owner_id: '',
  address: '',
  lat: '',
  lng: '',
  address_description: '',
  gallery: [] as { src: string; alt: string }[],
  thumbnails: [] as { src: string; alt: string }[],
  amenities: [] as { name: string; icon: string }[],
  amenities_gallery: [] as { src: string; alt: string }[],
  benefits_description: '',
  benefits_card_one: 'Vive',
  benefits_card_two: 'Invierte',
  benefits_for_card_one: [] as { title: string; description: string }[],
  benefits_for_card_two: [] as { title: string; description: string }[],
  models: [] as { title: string; price: number; area: number }[],
})
// global data functions
function saveLanding(isFormValid: boolean, published: boolean) {
  if (!isFormValid && published) {
    notification.value = {
      show: true,
      severity: 'error',
      summary: 'Error',
      detail: 'Falta información por completar',
      life: 3000,
    }
    failedGlobalValidation.value = true
    setTimeout(() => {
      failedGlobalValidation.value = false
    }, 10000)
  }
  else if (!isFormValid && !published) {
    notification.value = {
      show: true,
      severity: 'error',
      summary: 'Error',
      detail: 'El título es requerido',
      life: 3000,
    }
    failedNameValidation.value = true
    setTimeout(() => {
      failedNameValidation.value = false
    }, 10000)
  }
  else {
    if (isFormValid && props.new)
      saveNewProject(published)
    if (isFormValid && !props.new)
      updateLanding(published)
  }
}
const savingProject = ref(false)
async function saveNewProject(published: boolean) {
  savingProject.value = true
  try {
    const newDoc = await addDoc(collection($db(), 'landings'), {
      ...formData,
      published,
    })
    notification.value = {
      show: true,
      severity: 'success',
      summary: 'Éxito',
      detail: 'Proyecto guardado con éxito',
      life: 3000,
    }
    savingProject.value = false
    router.push(`/app/landings/${newDoc.id}`)
  }
  catch (error) {
    notification.value = {
      show: true,
      severity: 'error',
      summary: 'Error',
      detail: 'Error al guardar el proyecto',
      life: 3000,
    }
    savingProject.value = false
  }
}
async function updateLanding(published: boolean) {
  savingProject.value = true
  try {
    const docRef = doc($db(), 'landings', route.params.slug as string)
    await updateDoc(docRef, {
      ...formData,
      published,
    })
    notification.value = {
      show: true,
      severity: 'success',
      summary: 'Éxito',
      detail: 'Proyecto actualizado con éxito',
      life: 3000,
    }
    savingProject.value = false
  }
  catch (error) {
    notification.value = {
      show: true,
      severity: 'error',
      summary: 'Error',
      detail: 'Error al actualizar el proyecto',
      life: 3000,
    }
    savingProject.value = false
  }
}
async function getProject() {
  const docRef = doc($db(), 'landings', route.params.slug as string)
  const docSnap = await getDoc(docRef)
  if (docSnap.exists()) {
    Object.assign(formData, docSnap.data())
  }
  else {
    notification.value = {
      show: true,
      severity: 'error',
      summary: 'Error',
      detail: 'Error al obtener el proyecto',
      life: 3000,
    }
  }
}
onMounted(async () => {
  if (!props.new)
    await getProject()
})
// global form data custom validations
// whatsapp regex validation
const whatsappRegex = /^[A-Z0-9]{14}$/i
// test if name is valid
const whatsappValidation = (value: string) => whatsappRegex.test(value)
// url regex validation
const urlRegex = /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()!@:%_+.~#?&//=]*)+$/
// test if url is valid
function urlValidation(value: string) {
  if (value === '')
    return true

  return urlRegex.test(value)
}
// color regex validation
const colorRegex = /^#[0-9a-fA-F]{6}$/
// test if color is valid
const colorValidation = (value: string) => colorRegex.test(value)
// global form data validators
// this function return true if the benefits_for_card_one have the same length as benefits_for_card_two
function benefitsForCardOneAndTwoLength() {
  return formData.benefits_for_card_one.length === formData.benefits_for_card_two.length
}
const rules = {
  title: { required, maxLength: maxLength(100) },
  slug: { required, maxLength: maxLength(100) },
  zone: { required, maxLength: maxLength(100) },
  country: { required },
  phone: { required, maxLength: maxLength(10), numeric },
  whatsapp: { required, whatsappValidation },
  tour: { urlValidation },
  description: { required, minLength: minLength(110), maxLength: maxLength(130) },
  long_description: { required, minLength: minLength(300), maxLength: maxLength(5000) },
  cover: {
    src: { required },
    alt: { required, maxLength: maxLength(30) },
  },
  op: {
    src: { required },
    alt: { required, maxLength: maxLength(30) },
  },
  badge: {
    text: {
      required,
      maxLength: maxLength(30),
    },
    color: {
      required,
      colorValidation,
    },
  },
  owner_id: { required },
  address: { required, maxLength: maxLength(130) },
  lat: { required, numeric, maxLength: maxLength(100) },
  lng: { required, maxLength: maxLength(100) },
  address_description: { required, minLength: minLength(300), maxLength: maxLength(5000) },
  gallery: {
    required,
    $each: helpers.forEach({
      src: {
        required,
      },
      alt: {
        required,
        maxLength: maxLength(30),
      },
    }),
  },
  thumbnails: {
    required,
    $each: helpers.forEach({
      src: {
        required,
      },
      alt: {
        required,
        maxLength: maxLength(30),
      },
    }),
  },
  amenities: {
    required,
    $each: helpers.forEach({
      name: {
        required,
        maxLength: maxLength(30),
      },
      icon: {
        required,
      },
    }),
  },
  amenities_gallery: {
    required,
    $each: helpers.forEach({
      src: {
        required,
      },
      alt: {
        required,
        maxLength: maxLength(30),
      },
    }),
  },
  benefits_description: { required, minLength: minLength(100), maxLength: maxLength(250) },
  benefits_card_one: { required, maxLength: maxLength(100) },
  benefits_card_two: { required, maxLength: maxLength(100) },
  benefits_for_card_one: {
    required,
    benefitsForCardOneAndTwoLength,
    $each: helpers.forEach({
      title: {
        required,
        maxLength: maxLength(25),
      },
      description: {
        required,
        minLength: minLength(30),
        maxLength: maxLength(70),
      },
    }),
  },
  benefits_for_card_two: {
    required,
    benefitsForCardOneAndTwoLength,
    $each: helpers.forEach({
      title: {
        required,
        maxLength: maxLength(25),
      },
      description: {
        required,
        minLength: minLength(30),
        maxLength: maxLength(70),
      },
    }),
  },
  models: {
    required,
    $each: helpers.forEach({
      title: {
        required,
        maxLength: maxLength(100),
      },
    }),
  },
}
const globalValidation = useVuelidate(rules, formData)
const failedNameValidation = ref(false)
const failedGlobalValidation = ref(false)
// menu items and actions
const menuItems = ref([
  {
    label: 'Guardar borrador',
    icon: 'pi pi-save',
    command: () => {
      saveLanding(!globalValidation.value.title.$invalid, false)
    },
  },
  {
    label: 'Publicar',
    icon: 'pi pi-send',
    command: () => {
      saveLanding(!globalValidation.value.$invalid, true)
    },
  },
  {
    label: 'Atrás',
    icon: 'pi pi-arrow-left',
    command: () => {
      router.push('/app/landings')
    },
  },
])
// google maps loader
const googleMap = ref()
onMounted(() => {
  const loader = new Loader({
    apiKey: config.public.GOOGLE_MAPS_API,
    version: 'weekly',
    libraries: ['places'],
  })

  loader.load().then(() => {
    loadMaps()
  })
})
function loadMaps() {
  const checkMaps = setInterval(() => {
    if (typeof google !== 'undefined' && typeof google.maps !== 'undefined') {
      // @ts-expect-error: google is not defined
      googleMap.value = new window.google.maps.places.AutocompleteService()
      clearInterval(checkMaps)
    }
  }, 1000)
}
// basic information section
// slug computed and watcher
const slug = computed(() => {
  return formData.title
    .toLowerCase()
    .replace(/ñ/g, 'n')
    .replace(/á/g, 'a')
    .replace(/é/g, 'e')
    .replace(/í/g, 'i')
    .replace(/ó/g, 'o')
    .replace(/ú/g, 'u')
    .replace(/ /g, '-')
    .replace(/[^\w-]+/g, '')
})
watch(slug, (newVal) => {
  formData.slug = newVal
})
// zones data and functions
async function getLandingsZones() {
  const querySnapshot = await getDocs(collection($db(), 'landings_zones'))
  // @ts-expect-error
  querySnapshot.forEach((doc: { id: any; data: () => any }) => landingsZones.value.push({ ...doc.data() }))
}
onBeforeMount(() => {
  getLandingsZones()
})
const landingsZones = ref<{ name: string; slug: string }[]>([])
const zonesFormData = reactive({
  name: '',
  slug: '',
})
const zonesRules = {
  name: { required, maxLength: maxLength(100) },
  slug: { required, maxLength: maxLength(100) },
}
const zoneValidation = useVuelidate(zonesRules, zonesFormData)
const failedZoneValidation = ref(false)
const zonesDialog = ref(false)
const savingZone = ref(false)
const zoneSlug = computed(() => {
  return zonesFormData.name
    .toLowerCase()
    .replace(/ñ/g, 'n')
    .replace(/á/g, 'a')
    .replace(/é/g, 'e')
    .replace(/í/g, 'i')
    .replace(/ó/g, 'o')
    .replace(/ú/g, 'u')
    .replace(/ /g, '-')
    .replace(/[^\w-]+/g, '')
})
watch(zoneSlug, (newVal) => {
  zonesFormData.slug = newVal
})
function closeNewZoneDialog() {
  zonesDialog.value = false
  zonesFormData.name = ''
  zonesFormData.slug = ''
}
async function saveNewZone(isFormValid: any) {
  savingZone.value = true
  if (!isFormValid) {
    failedZoneValidation.value = true
    savingZone.value = false
    setTimeout(() => {
      failedZoneValidation.value = false
    }, 500)
  }
  else {
    try {
      await addDoc(collection($db(), 'landings_zones'), {
        ...zonesFormData,
      })
      landingsZones.value.unshift({
        ...zonesFormData,
      })
      formData.zone = zonesFormData.slug
      closeNewZoneDialog()
      savingZone.value = false
      notification.value = {
        show: true,
        severity: 'success',
        summary: 'Éxito',
        detail: 'Zona guardada con éxito',
        life: 3000,
      }
    }
    catch (error) {
      notification.value = {
        show: true,
        severity: 'error',
        summary: 'Error',
        detail: 'Error al guardar la zona',
        life: 3000,
      }
      savingZone.value = false
    }
  }
}
// badge data and functions
const badgeColors = ref([
  { name: 'Rojo', value: '#ce5f5f' },
  { name: 'Negro', value: '#282d2c' },
  { name: 'Verde', value: '#5fcebc' },
  { name: 'Morado', value: '#5f63ce' },
])
// owner data and functions
const pipedriveUsers = ref()
async function getPipeDriveUsers() {
  const pipeDriveData = httpsCallable($functions(), 'readPipedriveUsers')
  try {
    const result = await pipeDriveData() as any
    const data = result.data.data
    if (data)
      pipedriveUsers.value = data
  }
  catch (error) {
    notification.value = {
      show: true,
      severity: 'error',
      summary: 'Error',
      detail: 'No se puedieron leer los usuarios del CRM.',
      life: 5000,
    }
  }
}
onBeforeMount(() => {
  getPipeDriveUsers()
})
// project cover data and functions
const coverDialog = ref(false)
const coverFile = ref()
const coverCropper = ref()
async function coverBase64Uploader(event: { files: any[] }) {
  if (coverCropper.value)
    coverCropper.value.destroy()

  coverFile.value = ''
  const file = event.files[0]
  const reader = new FileReader()
  const blob = await fetch(file.objectURL).then(r => r.blob()) // blob:url

  reader.readAsDataURL(blob)

  reader.onloadend = function () {
    const base64data = reader.result
    coverFile.value = base64data
  }
}
function cancelCoverCrop() {
  coverDialog.value = false
  coverFile.value = ''
  if (coverCropper.value)
    coverCropper.value.destroy()
}
function resetCoverCrop() {
  if (coverCropper.value)
    coverCropper.value.reset()
}
const uploadingCover = ref(false)
async function uploadCover() {
  uploadingCover.value = true
  const storage = getStorage()
  const storageRef = fireRef(storage, `public/${self.crypto.randomUUID()}.webp`)
  const newMetadata = {
    cacheControl: 'public,max-age=2592000',
  }
  if (coverCropper.value) {
    try {
      const webpImg = await coverCropper.value.getCroppedCanvas({ width: '1083', height: '567' }).toDataURL('image/webp', 0.9)
      const uploaded = await uploadString(storageRef, webpImg, 'data_url')
      await updateMetadata(storageRef, newMetadata)
      formData.cover = {
        src: await getDownloadURL(uploaded.ref),
        alt: 'Cover Image',
      }
      uploadingCover.value = false
      cancelCoverCrop()
    }
    catch (err) {
      notification.value = {
        show: true,
        severity: 'error',
        summary: 'Error',
        detail: 'No se pudo subir la imagen',
        life: 5000,
      }
    }
  }
}
// project op data and functions
const opDialog = ref(false)
const opFile = ref()
const opCropper = ref()
async function opBase64Uploader(event: { files: any[] }) {
  if (opCropper.value)
    opCropper.value.destroy()

  opFile.value = ''
  const file = event.files[0]
  const reader = new FileReader()
  const blob = await fetch(file.objectURL).then(r => r.blob()) // blob:url

  reader.readAsDataURL(blob)

  reader.onloadend = function () {
    const base64data = reader.result
    opFile.value = base64data
  }
}
function cancelOpCrop() {
  opDialog.value = false
  opFile.value = ''
  if (opCropper.value)
    opCropper.value.destroy()
}
function resetOpCrop() {
  if (opCropper.value)
    opCropper.value.reset()
}
const uploadingOp = ref(false)
async function uploadOp() {
  uploadingOp.value = true
  const storage = getStorage()
  const storageRef = fireRef(storage, `public/${self.crypto.randomUUID()}.jpeg`)
  const newMetadata = {
    cacheControl: 'public,max-age=2592000',
  }
  if (opCropper.value) {
    try {
      const jpegImg = await opCropper.value.getCroppedCanvas({ width: '1200', height: '630' }).toDataURL('image/jpeg', 0.9)
      const uploaded = await uploadString(storageRef, jpegImg, 'data_url')
      await updateMetadata(storageRef, newMetadata)
      formData.op = {
        src: await getDownloadURL(uploaded.ref),
        alt: 'OP Image',
      }
      uploadingOp.value = false
      cancelOpCrop()
    }
    catch (err) {
      notification.value = {
        show: true,
        severity: 'error',
        summary: 'Error',
        detail: 'No se pudo subir la imagen',
        life: 5000,
      }
    }
  }
}
// project address data and functions
const addressDialog = ref(false)
const googleMapsResult = ref()
const googleMapsPlace = ref()
function displaySuggestions(predictions: any) {
  googleMapsResult.value = predictions.map((prediction: { description: any }) => prediction)
}
function getPlacePredictions(event: any) {
  // @ts-expect-error
  const service = new window.google.maps.places.AutocompleteService()
  if (event.query.length)
    service.getPlacePredictions({ input: event.query }, displaySuggestions)
  else
    googleMapsResult.value = []
}
watch(googleMapsPlace, (newVal) => {
  if (newVal.place_id)
    getLatLong(newVal.place_id)
})
async function getLatLong(location: any) {
  try {
    // @ts-expect-error
    const geocoder = new window.google.maps.Geocoder()
    const results = await new Promise((resolve, reject) => {
      geocoder.geocode({ placeId: location }, (results: any[], status: any) => {
        // @ts-expect-error
        if (status === window.google.maps.GeocoderStatus.OK)
          resolve(results)

        else
          reject(new Error('something bad happened'))
      })
    })
    // @ts-expect-error
    formData.lat = results[0]?.geometry?.location?.lat() as string
    // @ts-expect-error
    formData.lng = results[0]?.geometry?.location?.lng() as string
    // @ts-expect-error
    formData.address = results[0]?.formatted_address as string
    mapCenter.value = { lat: formData.lat, lng: formData.lng }
  }
  catch (error) {
    notification.value = {
      show: true,
      severity: 'error',
      summary: 'Error',
      detail: 'No se pudo obtener la ubicación',
      life: 5000,
    }
  }
}
function cancelAddress() {
  addressDialog.value = false
  googleMapsResult.value = []
  googleMapsPlace.value = ''
  mapCenter.value = null
  formData.lat = ''
  formData.lng = ''
  formData.address = ''
}
const mapCenter = ref()
function dragged(event: { latLng: { lat: () => any; lng: () => any } }) {
  formData.lat = event.latLng.lat()
  formData.lng = event.latLng.lng()
}
// project gallery data and functions
const galleryDialog = ref(false)
const galleryFile = ref()
const galleryCropper = ref()
async function galleryBase64Uploader(event: { files: any[] }) {
  if (galleryCropper.value)
    galleryCropper.value.destroy()

  galleryFile.value = ''
  const file = event.files[0]
  const reader = new FileReader()
  const blob = await fetch(file.objectURL).then(r => r.blob()) // blob:url

  reader.readAsDataURL(blob)

  reader.onloadend = function () {
    const base64data = reader.result
    galleryFile.value = base64data
  }
}
function cancelGalleryCrop() {
  galleryDialog.value = false
  galleryFile.value = ''
  if (galleryCropper.value)
    galleryCropper.value.destroy()
}
function resetGalleryCrop() {
  if (galleryCropper.value)
    galleryCropper.value.reset()
}
const uploadingGallery = ref(false)
async function uploadGallery() {
  uploadingGallery.value = true
  const storage = getStorage()
  const storageRef = fireRef(storage, `public/${self.crypto.randomUUID()}.webp`)
  const newMetadata = {
    cacheControl: 'public,max-age=2592000',
  }
  if (galleryCropper.value) {
    try {
      const webpImg = await galleryCropper.value.getCroppedCanvas({ width: '1232', height: '560' }).toDataURL('image/webp', 0.9)
      const uploaded = await uploadString(storageRef, webpImg, 'data_url')
      await updateMetadata(storageRef, newMetadata)
      // push to formData.gallery with src and alt attributes
      formData.gallery.push({ src: await getDownloadURL(uploaded.ref), alt: 'Gallery Image' })
      uploadingGallery.value = false
      cancelGalleryCrop()
    }
    catch (err) {
      notification.value = {
        show: true,
        severity: 'error',
        summary: 'Error',
        detail: 'No se pudo subir la imagen',
        life: 5000,
      }
    }
  }
}
const imageGalleryDeletId = ref()
const deleteGalleryImageDialog = ref(false)
function deleteImageGalleryConfirm(id: any) {
  imageGalleryDeletId.value = id
  deleteGalleryImageDialog.value = true
}
function deleteGalleryImage() {
  formData.gallery.splice(imageGalleryDeletId.value, 1)
  deleteGalleryImageDialog.value = false
  imageGalleryDeletId.value = null
}
function cancelImageGalleryDelete() {
  deleteGalleryImageDialog.value = false
  imageGalleryDeletId.value = null
}
// project thumbnails data and functions
const thumbnailsDialog = ref(false)
const thumbnailsFile = ref()
const thumbnailsCropper = ref()
async function thumbnailsBase64Uploader(event: { files: any[] }) {
  if (thumbnailsCropper.value)
    thumbnailsCropper.value.destroy()

  thumbnailsFile.value = ''
  const file = event.files[0]
  const reader = new FileReader()
  const blob = await fetch(file.objectURL).then(r => r.blob()) // blob:url

  reader.readAsDataURL(blob)

  reader.onloadend = function () {
    const base64data = reader.result
    thumbnailsFile.value = base64data
  }
}
function cancelThumbnailsCrop() {
  thumbnailsDialog.value = false
  thumbnailsFile.value = ''
  if (thumbnailsCropper.value)
    thumbnailsCropper.value.destroy()
}
function resetThumbnailsCrop() {
  if (thumbnailsCropper.value)
    thumbnailsCropper.value.reset()
}
const uploadingThumbnails = ref(false)
async function uploadThumbnails() {
  uploadingThumbnails.value = true
  const storage = getStorage()
  const storageRef = fireRef(storage, `public/${self.crypto.randomUUID()}.webp`)
  const newMetadata = {
    cacheControl: 'public,max-age=2592000',
  }
  if (thumbnailsCropper.value) {
    try {
      const webpImg = await thumbnailsCropper.value.getCroppedCanvas({ width: '500', height: '500' }).toDataURL('image/webp', 0.9)
      const uploaded = await uploadString(storageRef, webpImg, 'data_url')
      await updateMetadata(storageRef, newMetadata)
      formData.thumbnails.push({ src: await getDownloadURL(uploaded.ref), alt: 'Thumbnails Image' })
      uploadingThumbnails.value = false
      cancelThumbnailsCrop()
    }
    catch (err) {
      notification.value = {
        show: true,
        severity: 'error',
        summary: 'Error',
        detail: 'No se pudo subir la imagen',
        life: 5000,
      }
    }
  }
}
const imageThumbnailsDeletId = ref()
const deleteThumbnailsImageDialog = ref(false)
function deleteImageThumbnailsConfirm(id: any) {
  imageThumbnailsDeletId.value = id
  deleteThumbnailsImageDialog.value = true
}
function deleteThumbnailsImage() {
  formData.thumbnails.splice(imageThumbnailsDeletId.value, 1)
  deleteThumbnailsImageDialog.value = false
  imageThumbnailsDeletId.value = null
}
function cancelImageThumbnailsDelete() {
  deleteThumbnailsImageDialog.value = false
  imageThumbnailsDeletId.value = null
}
// amenities data and functions
async function getLandingsIcons() {
  const querySnapshot = await getDocs(collection($db(), 'landings_icons'))
  // @ts-expect-error
  querySnapshot.forEach((doc: { id: any; data: () => any }) => landingsIcons.value.push({ ...doc.data() }))
}
onBeforeMount(() => {
  getLandingsIcons()
})
const landingsIcons = ref<{ name: string; icon: string }[]>([])
const amenitiesFormData = reactive({
  name: '',
  icon: '',
})
const amenitiesRules = {
  name: { required, maxLength: maxLength(100) },
  icon: { required },
}
const amenitiesValidation = useVuelidate(amenitiesRules, amenitiesFormData)
const failedAmenitiesValidation = ref(false)
const amenitiesDialog = ref(false)
function closeNewAmenityDialog() {
  amenitiesDialog.value = false
  amenitiesFormData.name = ''
  amenitiesFormData.icon = ''
  failedAmenitiesValidation.value = false
}
async function amenityIconBase64Uploader(event: { files: any[] }) {
  const file = event.files[0]
  const reader = new FileReader()
  const blob = await fetch(file.objectURL).then(r => r.blob()) // blob:url

  reader.readAsDataURL(blob)

  reader.onloadend = function () {
    const base64data = reader.result
    uploadAmenityIcon(base64data as string)
  }
}
const uploadingAmenityIcon = ref(false)
async function uploadAmenityIcon(icon: string | null) {
  uploadingAmenityIcon.value = true
  const storage = getStorage()
  const storageRef = fireRef(storage, `public/${self.crypto.randomUUID()}.svg`)
  const newMetadata = {
    cacheControl: 'public,max-age=2592000',
  }
  if (icon) {
    try {
      const uploaded = await uploadString(storageRef, icon, 'data_url')
      await updateMetadata(storageRef, newMetadata)
      const iconURL = await getDownloadURL(uploaded.ref)
      amenitiesFormData.icon = iconURL
      await addDoc(collection($db(), 'landings_icons'), {
        name: amenitiesFormData.name,
        icon: iconURL,
      })
      landingsIcons.value.unshift({
        name: amenitiesFormData.name,
        icon: iconURL,
      })
      uploadingAmenityIcon.value = false
    }
    catch (err) {
      notification.value = {
        show: true,
        severity: 'error',
        summary: 'Error',
        detail: 'No se pudo subir la imagen',
        life: 5000,
      }
    }
  }
}
function saveAmenity(valid: boolean) {
  if (valid) {
    formData.amenities.push({ ...amenitiesFormData })
    closeNewAmenityDialog()
  }
  else {
    failedAmenitiesValidation.value = true
  }
}
const amenityToDelteId = ref()
const deleteAmenityDialog = ref(false)
function deleteAmenityConfirm(id: any) {
  amenityToDelteId.value = id
  deleteAmenityDialog.value = true
}
function deleteAmenity() {
  formData.amenities.splice(amenityToDelteId.value, 1)
  deleteAmenityDialog.value = false
  amenityToDelteId.value = null
}
function cancelAmenityDelete() {
  deleteAmenityDialog.value = false
  amenityToDelteId.value = null
}
const amenitiesGalleryDialog = ref(false)
const amenitiesGalleryFile = ref()
const amenitiesGalleryCropper = ref()
async function amenitiesGalleryBase64Uploader(event: { files: any[] }) {
  if (amenitiesGalleryCropper.value)
    amenitiesGalleryCropper.value.destroy()

  amenitiesGalleryFile.value = ''
  const file = event.files[0]
  const reader = new FileReader()
  const blob = await fetch(file.objectURL).then(r => r.blob()) // blob:url

  reader.readAsDataURL(blob)

  reader.onloadend = function () {
    const base64data = reader.result
    amenitiesGalleryFile.value = base64data
  }
}
function cancelAmenitiesGalleryCrop() {
  amenitiesGalleryDialog.value = false
  amenitiesGalleryFile.value = ''
  if (amenitiesGalleryCropper.value)
    amenitiesGalleryCropper.value.destroy()
}
function resetAmenitiesGalleryCrop() {
  if (amenitiesGalleryCropper.value)
    amenitiesGalleryCropper.value.reset()
}
const uploadingAmenitiesGallery = ref(false)
async function uploadAmenitiesGallery() {
  uploadingAmenitiesGallery.value = true
  const storage = getStorage()
  const storageRef = fireRef(storage, `public/${self.crypto.randomUUID()}.webp`)
  const newMetadata = {
    cacheControl: 'public,max-age=2592000',
  }
  if (amenitiesGalleryCropper.value) {
    try {
      const webpImg = await amenitiesGalleryCropper.value.getCroppedCanvas({ width: '797', height: '304' }).toDataURL('image/webp', 0.9)
      const uploaded = await uploadString(storageRef, webpImg, 'data_url')
      await updateMetadata(storageRef, newMetadata)
      formData.amenities_gallery.push({ src: await getDownloadURL(uploaded.ref), alt: 'Gallery Image' })
      uploadingAmenitiesGallery.value = false
      cancelAmenitiesGalleryCrop()
    }
    catch (err) {
      notification.value = {
        show: true,
        severity: 'error',
        summary: 'Error',
        detail: 'No se pudo subir la imagen',
        life: 5000,
      }
    }
  }
}
const imageAmenitiesGalleryDeletId = ref()
const deleteAmenitiesGalleryImageDialog = ref(false)
function deleteImageAmenitiesGalleryConfirm(id: any) {
  imageAmenitiesGalleryDeletId.value = id
  deleteAmenitiesGalleryImageDialog.value = true
}
function deleteAmenitiesGalleryImage() {
  formData.amenities_gallery.splice(imageAmenitiesGalleryDeletId.value, 1)
  deleteAmenitiesGalleryImageDialog.value = false
  imageAmenitiesGalleryDeletId.value = null
}
function cancelImageAmenitiesGalleryDelete() {
  deleteAmenitiesGalleryImageDialog.value = false
  imageAmenitiesGalleryDeletId.value = null
}
// benefits data and methods
const benefitFormData = reactive({
  title: '',
  description: '',
})
const benefitRules = {
  title: { required, maxLength: maxLength(25) },
  description: { required, minLength: minLength(30), maxLength: maxLength(70) },
}
const benefitValidation = useVuelidate(benefitRules, benefitFormData)
const failedBenefitValidation = ref(false)
const benefitDialog = ref(false)
const activeBenefitsCard = ref('')
function closeNewBenefitDialog() {
  benefitDialog.value = false
  benefitFormData.title = ''
  benefitFormData.description = ''
  failedBenefitValidation.value = false
  activeBenefitsCard.value = ''
  benefitToEditId.value = null
}
function saveBenefitSelection(valid: any) {
  // if benefittoEditID caal saveBenefitToEdit else saveBenefit
  if (valid) {
    if (benefitToEditId.value !== null)
      saveBenefitToEdit(!benefitValidation.value.$invalid)
    else
      saveBenefit(!benefitValidation.value.$invalid)
  }
  else {
    failedBenefitValidation.value = true
  }
}
function saveBenefit(valid: boolean) {
  if (valid) {
    if (activeBenefitsCard.value === 'benefits_for_card_one')
      formData.benefits_for_card_one.push({ ...benefitFormData })
    else
      formData.benefits_for_card_two.push({ ...benefitFormData })

    closeNewBenefitDialog()
  }
  else {
    failedBenefitValidation.value = true
  }
}
const benefitToEditId = ref()
function editBenefitConfirm(index: any, card: string) {
  benefitToEditId.value = index
  benefitDialog.value = true
  if (card === 'benefits_for_card_one') {
    benefitFormData.title = formData.benefits_for_card_one[index].title
    benefitFormData.description = formData.benefits_for_card_one[index].description
  }
  else {
    benefitFormData.title = formData.benefits_for_card_two[index].title
    benefitFormData.description = formData.benefits_for_card_two[index].description
  }
  benefitDialog.value = true
}
function saveBenefitToEdit(valid: boolean) {
  if (valid) {
    if (activeBenefitsCard.value === 'benefits_for_card_one') {
      formData.benefits_for_card_one[benefitToEditId.value].title = benefitFormData.title
      formData.benefits_for_card_one[benefitToEditId.value].description = benefitFormData.description
    }
    else {
      formData.benefits_for_card_two[benefitToEditId.value].title = benefitFormData.title
      formData.benefits_for_card_two[benefitToEditId.value].description = benefitFormData.description
    }
    closeNewBenefitDialog()
  }
  else {
    failedBenefitValidation.value = true
  }
}
const benefitToDelteId = ref()
const deleteBenefitDialog = ref(false)
function deleteBenefitConfirm(id: any) {
  benefitToDelteId.value = id
  deleteBenefitDialog.value = true
}
function deleteBenefit() {
  if (activeBenefitsCard.value === 'benefits_for_card_one')
    formData.benefits_for_card_one.splice(benefitToDelteId.value, 1)
  else
    formData.benefits_for_card_two.splice(benefitToDelteId.value, 1)

  deleteBenefitDialog.value = false
  benefitToDelteId.value = null
  activeBenefitsCard.value = ''
}
function cancelBenefitDelete() {
  deleteBenefitDialog.value = false
  benefitToDelteId.value = null
  activeBenefitsCard.value = ''
}
// models section
const moneyFormatter = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN',
})
const numberFormatter = new Intl.NumberFormat('es-MX', {
  style: 'decimal',
})
const modelFormData = reactive({
  title: '',
  slug: '',
  price: '',
  area: '',
  bed: '',
  bat: '',
  avaliability: '',
  parking: '',
  tour: '',
  description: '',
  long_description: '',
  op: {
    src: '',
    alt: '',
  },
  gallery: [] as { src: string; alt: string }[],
  features: [] as { name: string; icon: string }[],
})
const modelRules = {
  title: { required, maxLength: maxLength(100) },
  slug: { required, maxLength: maxLength(100) },
  price: { required, numeric, maxLength: maxLength(100) },
  area: { required, numeric, maxLength: maxLength(25) },
  bed: { required, numeric, maxLength: maxLength(25) },
  bat: { required, numeric, maxLength: maxLength(25) },
  avaliability: { required, numeric, maxLength: maxLength(25) },
  parking: { required, numeric, maxLength: maxLength(25) },
  tour: { urlValidation },
  description: { required, minLength: minLength(110), maxLength: maxLength(130) },
  long_description: { required, minLength: minLength(300), maxLength: maxLength(5000) },
  op: {
    src: { required },
    alt: { required, maxLength: maxLength(30) },
  },
  gallery: {
    required,
    $each: helpers.forEach({
      src: {
        required,
      },
      alt: {
        required,
        maxLength: maxLength(30),
      },
    }),
  },
  features: {
    required,
    $each: helpers.forEach({
      name: {
        required,
        maxLength: maxLength(30),
      },
      icon: {
        required,
      },
    }),
  },
}
const modelValidation = useVuelidate(modelRules, modelFormData)
const failedModelValidation = ref(false)
const modelDialog = ref(false)
// slug computed and watcher
const modelSlug = computed(() => {
  return modelFormData.title
    .toLowerCase()
    .replace(/ñ/g, 'n')
    .replace(/á/g, 'a')
    .replace(/é/g, 'e')
    .replace(/í/g, 'i')
    .replace(/ó/g, 'o')
    .replace(/ú/g, 'u')
    .replace(/ /g, '-')
    .replace(/[^\w-]+/g, '')
})
watch(modelSlug, (newVal) => {
  modelFormData.slug = newVal
})
const modelOpDialog = ref(false)
const modelOpFile = ref()
const modelOpCropper = ref()
async function modelOpBase64Uploader(event: { files: any[] }) {
  if (modelOpCropper.value)
    modelOpCropper.value.destroy()

  modelOpFile.value = ''
  const file = event.files[0]
  const reader = new FileReader()
  const blob = await fetch(file.objectURL).then(r => r.blob()) // blob:url

  reader.readAsDataURL(blob)

  reader.onloadend = function () {
    const base64data = reader.result
    modelOpFile.value = base64data
  }
}
function cancelModelOpCrop() {
  modelOpDialog.value = false
  modelOpFile.value = ''
  if (modelOpCropper.value)
    modelOpCropper.value.destroy()
}
function resetModelOpCrop() {
  if (modelOpCropper.value)
    modelOpCropper.value.reset()
}
const uploadingModelOp = ref(false)
async function uploadModelOp() {
  uploadingModelOp.value = true
  const storage = getStorage()
  const storageRef = fireRef(storage, `public/${self.crypto.randomUUID()}.jpeg`)
  const newMetadata = {
    cacheControl: 'public,max-age=2592000',
  }
  if (modelOpCropper.value) {
    try {
      const jpegImg = await modelOpCropper.value.getCroppedCanvas({ width: '1200', height: '630' }).toDataURL('image/jpeg', 0.9)
      const uploaded = await uploadString(storageRef, jpegImg, 'data_url')
      await updateMetadata(storageRef, newMetadata)
      modelFormData.op = {
        src: await getDownloadURL(uploaded.ref),
        alt: 'OP Image',
      }
      uploadingModelOp.value = false
      cancelModelOpCrop()
    }
    catch (err) {
      notification.value = {
        show: true,
        severity: 'error',
        summary: 'Error',
        detail: 'No se pudo subir la imagen',
        life: 5000,
      }
      uploadingModelOp.value = false
    }
  }
}
const modelGalleryDialog = ref(false)
const modelGalleryFile = ref()
const modelGalleryCropper = ref()
async function modelGalleryBase64Uploader(event: { files: any[] }) {
  if (modelGalleryCropper.value)
    modelGalleryCropper.value.destroy()

  modelGalleryFile.value = ''
  const file = event.files[0]
  const reader = new FileReader()
  const blob = await fetch(file.objectURL).then(r => r.blob()) // blob:url

  reader.readAsDataURL(blob)

  reader.onloadend = function () {
    const base64data = reader.result
    modelGalleryFile.value = base64data
  }
}
function modelCancelGalleryCrop() {
  modelGalleryDialog.value = false
  modelGalleryFile.value = ''
  if (modelGalleryCropper.value)
    modelGalleryCropper.value.destroy()
}
function modelResetGalleryCrop() {
  if (modelGalleryCropper.value)
    modelGalleryCropper.value.reset()
}
const uploadingModelGallery = ref(false)
async function uploadModelGallery() {
  uploadingModelGallery.value = true
  const storage = getStorage()
  const storageRef = fireRef(storage, `public/${self.crypto.randomUUID()}.webp`)
  const newMetadata = {
    cacheControl: 'public,max-age=2592000',
  }
  if (modelGalleryCropper.value) {
    try {
      const webpImg = await modelGalleryCropper.value.getCroppedCanvas({ width: '1232', height: '560' }).toDataURL('image/webp', 0.9)
      const uploaded = await uploadString(storageRef, webpImg, 'data_url')
      await updateMetadata(storageRef, newMetadata)
      // push to formData.gallery with src and alt attributes
      modelFormData.gallery.push({ src: await getDownloadURL(uploaded.ref), alt: 'Gallery Image' })
      uploadingModelGallery.value = false
      modelCancelGalleryCrop()
    }
    catch (err) {
      notification.value = {
        show: true,
        severity: 'error',
        summary: 'Error',
        detail: 'No se pudo subir la imagen',
        life: 5000,
      }
      uploadingModelGallery.value = false
    }
  }
}
const modelImageGalleryDeletId = ref()
const modelDeleteGalleryImageDialog = ref(false)
function modelDeleteImageGalleryConfirm(id: any) {
  modelImageGalleryDeletId.value = id
  modelDeleteGalleryImageDialog.value = true
}
function modelDeleteGalleryImage() {
  modelFormData.gallery.splice(modelImageGalleryDeletId.value, 1)
  modelDeleteGalleryImageDialog.value = false
  modelImageGalleryDeletId.value = null
}
function cancelModelImageGalleryDelete() {
  modelDeleteGalleryImageDialog.value = false
  modelImageGalleryDeletId.value = null
}
const featuresFormData = reactive({
  name: '',
  icon: '',
})
const featuresRules = {
  name: { required, maxLength: maxLength(100) },
  icon: { required },
}
const featuresValidation = useVuelidate(featuresRules, featuresFormData)
const failedFeaturesValidation = ref(false)
const featuresDialog = ref(false)
function closeNewFeatureDialog() {
  featuresDialog.value = false
  featuresFormData.name = ''
  featuresFormData.icon = ''
  failedFeaturesValidation.value = false
}
async function featureIconBase64Uploader(event: { files: any[] }) {
  const file = event.files[0]
  const reader = new FileReader()
  const blob = await fetch(file.objectURL).then(r => r.blob()) // blob:url

  reader.readAsDataURL(blob)

  reader.onloadend = function () {
    const base64data = reader.result
    uploadFeatureIcon(base64data as string)
  }
}
const uploadingFeatureIcon = ref(false)
async function uploadFeatureIcon(icon: string | null) {
  uploadingFeatureIcon.value = true
  const storage = getStorage()
  const storageRef = fireRef(storage, `public/${self.crypto.randomUUID()}.svg`)
  const newMetadata = {
    cacheControl: 'public,max-age=2592000',
  }
  if (icon) {
    try {
      const uploaded = await uploadString(storageRef, icon, 'data_url')
      await updateMetadata(storageRef, newMetadata)
      const iconURL = await getDownloadURL(uploaded.ref)
      featuresFormData.icon = iconURL
      await addDoc(collection($db(), 'landings_icons'), {
        name: featuresFormData.name,
        icon: iconURL,
      })
      landingsIcons.value.unshift({
        name: featuresFormData.name,
        icon: iconURL,
      })
      uploadingFeatureIcon.value = false
    }
    catch (err) {
      notification.value = {
        show: true,
        severity: 'error',
        summary: 'Error',
        detail: 'No se pudo subir la imagen',
        life: 5000,
      }
      uploadingFeatureIcon.value = false
    }
  }
}
function saveFeature(valid: boolean) {
  if (valid) {
    modelFormData.features.push({ ...featuresFormData })
    closeNewFeatureDialog()
  }
  else {
    failedFeaturesValidation.value = true
  }
}
const featureToDelteId = ref()
const deleteFeatureDialog = ref(false)
function deleteFeatureConfirm(id: any) {
  featureToDelteId.value = id
  deleteFeatureDialog.value = true
}
function deleteFeature() {
  modelFormData.features.splice(featureToDelteId.value, 1)
  deleteFeatureDialog.value = false
  featureToDelteId.value = null
}
function cancelFeatureDelete() {
  deleteFeatureDialog.value = false
  featureToDelteId.value = null
}
const activeModelIndex = ref()
function saveModel(valid: boolean) {
  if (valid) {
    if (activeModelIndex.value !== null)
      formData.models[activeModelIndex.value] = { ...modelFormData as any }

    else
      formData.models.push({ ...modelFormData as any })

    closeNewModelDialog()
  }
  else {
    failedModelValidation.value = true
  }
}
function openEditModelDialog(index: any) {
  activeModelIndex.value = index
  modelDialog.value = true
  setTimeout(() => {
    Object.assign(modelFormData, JSON.parse(JSON.stringify(formData.models[index])))
  }, 500)
}
function closeNewModelDialog() {
  modelDialog.value = false
  activeModelIndex.value = null
  failedModelValidation.value = false
  modelFormData.title = ''
  modelFormData.slug = ''
  modelFormData.price = ''
  modelFormData.area = ''
  modelFormData.bed = ''
  modelFormData.bat = ''
  modelFormData.avaliability = ''
  modelFormData.parking = ''
  modelFormData.tour = ''
  modelFormData.description = ''
  modelFormData.long_description = ''
  modelFormData.op = {
    src: '',
    alt: '',
  }
  modelFormData.gallery = []
  modelFormData.features = []
}
const deleteModelDialog = ref(false)
function confirmDeleteModel(index: any) {
  activeModelIndex.value = index
  deleteModelDialog.value = true
}
function deleteModel() {
  formData.models.splice(activeModelIndex.value, 1)
  deleteModelDialog.value = false
  activeModelIndex.value = null
}
function cancelDeleteModel() {
  deleteModelDialog.value = false
  activeModelIndex.value = null
}
</script>

<template>
  <div>
    <div>
      <form>
        <div class="card surface-card p-4 border-round-md">
          <h3 class="mt-0">
            Datos básicos
          </h3>
          <div class="grid row">
            <div class="field flex flex-column col col-12">
              <label for="title">¿Es destacada?</label>
              <ToggleButton v-model="formData.order" on-label="Sí" off-label="No" />
              <small id="title-help">Las páginas destacadas aparecen primero en la página de inicio y en el listado de propiedades.</small>
            </div>
          </div>
          <div class="grid row">
            <div class="field block col col-12 md:col-6 xl:col-4">
              <label for="title">Título</label>
              <InputText
                id="title"
                v-model="globalValidation.title.$model"
                class="block w-full"
                type="label"
                aria-describedby="title-help"
                :class="{ 'p-invalid': globalValidation.title.$invalid && formData.title != '' || failedGlobalValidation && globalValidation.title.$invalid || failedNameValidation }"
              />
              <small id="title-help">Título del proyecto. Máximo 100 caracteres.</small>
            </div>
            <div class="field block col col-12 md:col-6 xl:col-4">
              <label for="url">URL</label>
              <InputText
                id="url"
                v-model="globalValidation.slug.$model"
                class="block w-full"
                type="label"
                aria-describedby="url-help"
                readonly
                :class="{ 'p-invalid': globalValidation.slug.$invalid && formData.slug != '' || failedGlobalValidation && globalValidation.slug.$invalid }"
              />
              <small id="url-help">URL del proyecto, se crea a partir del título.</small>
            </div>
            <div class="field block col col-12 md:col-6 xl:col-4">
              <label for="url">Zona</label>
              <div class="p-inputgroup flex-1">
                <Dropdown
                  v-model="globalValidation.zone.$model"
                  :options="landingsZones"
                  option-label="name"
                  option-value="slug"
                  placeholder="Selecciona una zona"
                  filter
                  class="w-full"
                  :class="{ 'p-invalid': globalValidation.zone.$invalid && formData.zone != '' || failedGlobalValidation && globalValidation.zone.$invalid }"
                />
                <Button icon="pi pi-plus" severity="secondary" @click="zonesDialog = true" />
              </div>
              <small id="url-help">Selecciona una zona o crea una nueva.</small>
            </div>
            <div class="field block col col-12 md:col-6 xl:col-4">
              <label for="url">Teléfono</label>
              <div class="p-inputgroup c-c-countries">
                <Dropdown
                  v-model="formData.country"
                  :options="countries.countries"
                  option-label="name_es"
                  :filter="true"
                  placeholder="País"
                  :show-clear="false"
                  panel-class="c-c-countries-panel"
                >
                  <template #value="slotProps">
                    <div v-if="slotProps.value" class="country-item country-item-value flex align-items-center">
                      <img :src="`/images/flags/${slotProps.value.code.toLowerCase()}.svg`" class="mr-1" height="16">
                      <div>{{ slotProps.value.dial_code }}</div>
                    </div>
                    <span v-else>
                      {{ slotProps.placeholder }}
                    </span>
                  </template>
                  <template #option="slotProps">
                    <div class="country-item flex align-items-center">
                      <img :src="`/images/flags/${slotProps.option.code.toLowerCase()}.svg`" class="mr-1" height="16">
                      <div>{{ slotProps.option.name_es }}</div>
                    </div>
                  </template>
                </Dropdown>
                <InputText
                  id="phone"
                  v-model="globalValidation.phone.$model"
                  class="c-text-imput"
                  placeholder="Ingresta el número"
                  maxlength="10"
                  :class="{ 'p-invalid': globalValidation.phone.$invalid && formData.phone != '' || failedGlobalValidation && globalValidation.phone.$invalid }"
                />
              </div>
              <small id="url-help">10 digitos sin espacios.</small>
            </div>
            <div class="field block col col-12 md:col-6 xl:col-4">
              <label for="whatsapp">ID de WhatsApp</label>
              <InputText
                id="whatsapp"
                v-model="globalValidation.whatsapp.$model"
                class="block w-full"
                type="label"
                aria-describedby="whatsapp-help"
                :class="{ 'p-invalid': globalValidation.whatsapp.$invalid && formData.whatsapp != '' || failedGlobalValidation && globalValidation.whatsapp.$invalid }"
              />
              <small id="whatsapp-help">El ID de la cuenta de empresa. Más info <a href="https://faq.whatsapp.com/851977322477624/" target="_blank" rel="noopener noreferrer">aquí.</a></small>
            </div>
            <div class="field block col col-12 md:col-6 xl:col-4">
              <label for="title">Tour virtual</label>
              <InputText
                id="tour"
                v-model="globalValidation.tour.$model"
                class="block w-full"
                type="label"
                aria-describedby="tour-help"
                :class="{ 'p-invalid': globalValidation.tour.$invalid && formData.tour != '' || failedGlobalValidation && globalValidation.tour.$invalid }"
              />
              <small id="tour-help">Una URL válida para el tour virtual.</small>
            </div>
            <div class="field block col col-12 md:col-4">
              <label for="badge">Badge</label>
              <InputText
                id="badge"
                v-model="globalValidation.badge.text.$model"
                class="block w-full"
                type="label"
                aria-describedby="badge-help"
                :class="{ 'p-invalid': globalValidation.badge.text.$invalid && formData.badge.text != '' || failedGlobalValidation && globalValidation.badge.text.$invalid }"
              />
              <small id="badge-help">Por ejemplo: Últimas unidades. Máximo 30 caracteres.</small>
            </div>
            <div class="field block col col-12 md:col-4">
              <label for="badge-color">Color del Badge</label>
              <Dropdown
                v-model="globalValidation.badge.color.$model"
                :options="badgeColors"
                option-label="name"
                option-value="value"
                placeholder="Selecciona un color"
                filter
                class="w-full"
                :class="{ 'p-invalid': globalValidation.badge.color.$invalid && formData.badge.color != '' || failedGlobalValidation && globalValidation.badge.color.$invalid }"
              />
              <small id="badge-color-help">Selecciona un color para el badge.</small>
            </div>
            <div class="field block col col-12 md:col-4">
              <label for="pipedrive-user">Responsable en CRM</label>
              <Dropdown
                id="pipedrive-user"
                v-model="globalValidation.owner_id.$model"
                :options="pipedriveUsers"
                option-label="name"
                option-value="id"
                placeholder="Selecciona un usuario"
                filter
                class="w-full"
                :class="{ 'p-invalid': globalValidation.owner_id.$invalid && formData.owner_id != '' || failedGlobalValidation && globalValidation.owner_id.$invalid }"
              />
              <small id="pipedrive-user-help">Selecciona un usuario responsable.</small>
            </div>
            <div class="field block col col-12">
              <label for="short-description">Descripción corta</label>
              <Textarea
                id="short-description"
                v-model="globalValidation.description.$model"
                class="block w-full"
                type="label"
                aria-describedby="short-description"
                :class="{ 'p-invalid': globalValidation.description.$invalid && formData.description != '' || failedGlobalValidation && globalValidation.description.$invalid }"
              />
              <small id="short-description-help">Debe tener un mínimo de 110 caracteres y un máximo de 130, incluyendo espacios.</small>
            </div>
            <div class="field block col col-12 p-invalid">
              <label for="eb6c24e2-0ac1-4b57-aff1-dde3bea09c8b">Descripción larga</label>
              <TiptapEditor id="eb6c24e2-0ac1-4b57-aff1-dde3bea09c8b" v-model="formData.long_description" :validation="failedGlobalValidation && globalValidation.long_description.$invalid" />
              <small id="eb6c24e2-0ac1-4b57-aff1-dde3bea09c8b-help">Texto dividido en párrafos, el primer párrafo se recomienda que sea de un aproximado de 450 caracteres con espacios. Mínimo 300 caracteres aproximados.</small>
            </div>
            <div class="field block col col-12 md:col-6">
              <label for="cover">Portada</label>
              <div id="cover" class="c-cover-preview flex justify-content-center content-align-center border-round-md surface-ground h-15rem cursor-pointer border-1 border-solid" :class="{ 'border-red-500': failedGlobalValidation && globalValidation.cover.$invalid, 'surface-border': !failedGlobalValidation || !globalValidation.cover.$invalid }" @click="coverDialog = true">
                <div v-if="!formData.cover.src" class="c-no-image-notice flex align-items-center justify-content-center font-italic font-light p-3 text-center">
                  No se ha seleccionado ninguna portada, da clic para seleccionar una.
                </div>
                <img v-else class="w-full h-full c-img" :src="formData.cover.src" alt="Cover">
              </div>
              <small id="cover-help">El tamaño y formato de la previsualización de la portada no representan el resultado final.</small>
            </div>
            <div class="field block col col-12 md:col-6">
              <label for="op">Imagen Open Graph</label>
              <div id="op" class="c-cover-preview flex justify-content-center content-align-center border-round-md surface-ground h-15rem cursor-pointer border-1 border-solid" :class="{ 'border-red-500': failedGlobalValidation && globalValidation.op.$invalid, 'surface-border': !failedGlobalValidation || !globalValidation.op.$invalid }" @click="opDialog = true">
                <div v-if="!formData.op.src" class="c-no-image-notice flex align-items-center justify-content-center font-italic font-light p-3 text-center">
                  No se ha seleccionado ninguna imagen, da clic para seleccionar una.
                </div>
                <img v-else class="w-full h-full c-img" :src="formData.op.src" alt="OP">
              </div>
              <small id="op-help">El tamaño y formato de la previsualización de la imagen no representan el resultado final.</small>
            </div>
          </div>
        </div>
        <div class="card surface-card mt-4 p-4 border-round-md">
          <h3 class="mt-0">
            Ubicación
          </h3>
          <div class="grid row">
            <div class="field block col col-12 md:col-6 xl:col-4">
              <label for="lat">Latitud</label>
              <div class="p-inputgroup flex-1">
                <InputText
                  id="lat"
                  v-model="globalValidation.lat.$model"
                  class="block w-full"
                  type="label"
                  aria-describedby="lat-help"
                  :class="{ 'p-invalid': globalValidation.lat.$invalid && formData.lat != '' || failedGlobalValidation && globalValidation.lat.$invalid }"
                />
                <Button icon="pi pi-search" severity="secondary" @click="addressDialog = true, googleMapsPlace = formData.address, mapCenter = { lat: formData.lat, lng: formData.lng }" />
              </div>
              <small id="lat-help">Ingresa la latitud en grados o da clic en buscar.</small>
            </div>
            <div class="field block col col-12 md:col-6 xl:col-4">
              <label for="lng">Longitud</label>
              <div class="p-inputgroup flex-1">
                <InputText
                  id="lng"
                  v-model="globalValidation.lng.$model"
                  class="block w-full"
                  type="label"
                  aria-describedby="lng-help"
                  :class="{ 'p-invalid': globalValidation.lng.$invalid && formData.lng != '' || failedGlobalValidation && globalValidation.lng.$invalid }"
                />
                <Button icon="pi pi-search" severity="secondary" @click="addressDialog = true, googleMapsPlace = formData.address, mapCenter = { lat: formData.lat, lng: formData.lng }" />
              </div>
              <small id="lng-help">Ingresa la longitud en grados o da clic en buscar.</small>
            </div>
            <div class="field block col col-12 md:col-6 xl:col-4">
              <label for="address">Dirección</label>
              <div class="p-inputgroup flex-1">
                <InputText
                  id="address"
                  v-model="globalValidation.address.$model"
                  class="block w-full"
                  type="label"
                  aria-describedby="address-help"
                  :class="{ 'p-invalid': globalValidation.address.$invalid && formData.address != '' || failedGlobalValidation && globalValidation.address.$invalid }"
                />
                <Button icon="pi pi-search" severity="secondary" @click="addressDialog = true, googleMapsPlace = formData.address, mapCenter = { lat: formData.lat !== '' ? formData.lat : null, lng: formData.lng !== '' ? formData.lng : null }" />
              </div>
              <small id="address-help">Ingresa la dirección o da clic en buscar.</small>
            </div>
            <div v-if="formData.lat !== '' && formData.lng !== ''" class="field block col col-12">
              <label for="url">Mapa de ubicación</label>
              <GoogleMap
                :api-key="config.public.GOOGLE_MAPS_API"
                class="project-map"
                :center="{ lat: formData.lat, lng: formData.lng }"
                :scalecontrol="false"
                :scrollwheel="false"
                :zoom="15"
              >
                <Marker :options="{ position: { lat: formData.lat, lng: formData.lng }, draggable: false, clickable: false }" />
              </GoogleMap>
              <small id="url-help">Solo lectura, edita la dirección si está mal.</small>
            </div>
            <div class="field block col col-12">
              <label for="url">Descripción de ubicación</label>
              <TiptapEditor id="8976acc8-74e0-460d-bf27-70a5c5a819ba" v-model="formData.address_description" :validation="failedGlobalValidation && globalValidation.address_description.$invalid" />
              <small id="url-help">Texto dividido en párrafos, el primer párrafo se recomienda que sea de un aproximado de 450 caracteres con espacios. Mínimo 300 caracteres aproximados.</small>
            </div>
          </div>
        </div>
        <div class="card surface-card mt-4 p-4 border-round-md">
          <h3 class="mt-0">
            Galería
          </h3>
          <div class="grid row">
            <div v-for="(image, index) in formData.gallery" :key="index" class="field block col col-12 md:col-3 relative">
              <div class="c-cover-preview flex justify-content-center content-align-center border-round-md surface-ground h-15rem cursor-pointer">
                <img class="w-full h-full c-img" :src="image.src" alt="Image Gallery">
              </div>
              <Button
                icon="pi pi-trash"
                class="mr-2 absolute right-0 c-delete-btn"
                text
                severity="warning"
                @click="deleteImageGalleryConfirm(index)"
              />
            </div>
            <div v-if="formData.gallery.length <= 11" class="field block col col-12 md:col-3">
              <div class="c-cover-preview flex justify-content-center content-align-center border-round-md surface-ground h-15rem cursor-pointer border-1 border-solid" :class="{ 'border-red-500': failedGlobalValidation && globalValidation.gallery.$invalid, 'surface-border': !failedGlobalValidation || !globalValidation.gallery.$invalid }" @click="galleryDialog = true">
                <div class="c-no-image-notice flex align-items-center justify-content-center font-italic font-light p-3 text-center">
                  Da clic para agregar una imagen.
                </div>
              </div>
            </div>
            <div class="field block col col-12">
              <small id="url-help">El tamaño y formato de la previsualización de la imagen no representan el resultado final.</small>
            </div>
          </div>
        </div>
        <div class="card surface-card mt-4 p-4 border-round-md">
          <h3 class="mt-0">
            Miniaturas
          </h3>
          <div class="grid row">
            <div v-for="(image, index) in formData.thumbnails" :key="index" class="field block col col-12 md:col-3 relative">
              <div class="c-cover-preview flex justify-content-center content-align-center border-round-md surface-ground h-15rem cursor-pointer">
                <img class="w-full h-full c-img" :src="image.src" alt="Image Gallery">
              </div>
              <Button
                icon="pi pi-trash"
                class="mr-2 absolute right-0 c-delete-btn"
                text
                severity="warning"
                @click="deleteImageThumbnailsConfirm(index)"
              />
            </div>
            <div v-if="formData.thumbnails.length <= 3" class="field block col col-12 md:col-3">
              <div class="c-cover-preview flex justify-content-center content-align-center border-round-md surface-ground h-15rem cursor-pointer border-1 border-solid" :class="{ 'border-red-500': failedGlobalValidation && globalValidation.thumbnails.$invalid, 'surface-border': !failedGlobalValidation || !globalValidation.thumbnails.$invalid }" @click="thumbnailsDialog = true">
                <div class="c-no-image-notice flex align-items-center justify-content-center font-italic font-light p-3 text-center">
                  Da clic para agregar una imagen.
                </div>
              </div>
            </div>
            <div class="field block col col-12">
              <small id="url-help">El tamaño y formato de la previsualización de la imagen no representan el resultado final.</small>
            </div>
          </div>
        </div>
        <div class="card surface-card mt-4 p-4 border-round-md">
          <h3 class="mt-0">
            Amenidades
          </h3>
          <div class="flex flex-wrap gap-2 pb-4">
            <div v-for="(amenitie, index) in formData.amenities" :key="index" class="flex align-items-center w-full sm:w-auto border-round-md surface-ground pl-4">
              <div class="c-icon flex justify-content-center align-items-center">
                <img :src="amenitie.icon" :alt="amenitie.name" height="16" width="16">
              </div>
              <div class="c-name mx-2">
                {{ amenitie.name }}
              </div>
              <Button
                icon="pi pi-trash"
                class="mr-2"
                text
                severity="warning"
                @click="deleteAmenityConfirm(index)"
              />
            </div>
            <Button label="Nueva" icon="pi pi-plus" class="w-full md:w-auto my-2 md:my-0" :class="{ 'p-button-danger': failedGlobalValidation && globalValidation.amenities.$invalid, 'p-button-secondary': !failedGlobalValidation || !globalValidation.amenities.$invalid }" @click="amenitiesDialog = true" />
          </div>
          <label for="amenities-gallery">Galería de amenidades</label>
          <div id="amenities-gallery" class="grid row mt-1">
            <div v-for="(image, index) in formData.amenities_gallery" :key="index" class="field block col col-12 md:col-3 relative">
              <div class="c-cover-preview flex justify-content-center content-align-center border-round-md surface-ground h-15rem cursor-pointer">
                <img class="w-full h-full c-img" :src="image.src" alt="Image Gallery">
              </div>
              <Button
                icon="pi pi-trash"
                class="mr-2 absolute right-0 c-delete-btn"
                text
                severity="warning"
                @click="deleteImageAmenitiesGalleryConfirm(index)"
              />
            </div>
            <div v-if="formData.amenities_gallery.length <= 11" class="field block col col-12 md:col-3">
              <div class="c-cover-preview flex justify-content-center content-align-center border-round-md surface-ground h-15rem cursor-pointer border-1 border-solid" :class="{ 'border-red-500': failedGlobalValidation && globalValidation.amenities_gallery.$invalid, 'surface-border': !failedGlobalValidation || !globalValidation.amenities_gallery.$invalid }" @click="amenitiesGalleryDialog = true">
                <div class="c-no-image-notice flex align-items-center justify-content-center font-italic font-light p-3 text-center">
                  Da clic para agregar una imagen.
                </div>
              </div>
            </div>
            <div class="field block col col-12">
              <small id="url-help">El tamaño y formato de la previsualización de la imagen no representan el resultado final.</small>
            </div>
          </div>
        </div>
        <div class="card surface-card mt-4 p-4 border-round-md">
          <h3 class="mt-0">
            Beneficios
          </h3>
          <div class="grid row">
            <div class="field block col col-12">
              <label for="short-benefits_description">Descripción de beneficios</label>
              <Textarea
                id="short-benefits_description"
                v-model="globalValidation.benefits_description.$model"
                class="block w-full"
                type="label"
                aria-describedby="short-benefits_description"
                :class="{ 'p-invalid': globalValidation.benefits_description.$invalid && formData.benefits_description != '' || failedGlobalValidation && globalValidation.benefits_description.$invalid }"
              />
              <small id="short-benefits_description-help">Debe tener un mínimo de 100 caracteres y un máximo de 250, incluyendo espacios.</small>
            </div>
            <div class="field block col col-12 md:col-6">
              <label for="title-card-one">Título de tarjeta #1</label>
              <InputText
                id="title-card-one"
                v-model="globalValidation.benefits_card_one.$model"
                class="block w-full"
                type="label"
                aria-describedby="title-card-one-help"
                :class="{ 'p-invalid': globalValidation.benefits_card_one.$invalid && formData.benefits_card_one != '' || failedGlobalValidation && globalValidation.benefits_card_one.$invalid }"
              />
              <small id="title-card-one-help">Título del de la tarjeta #1 de beneficios.</small>
              <div class="pt-4">
                <div v-for="(benefit, index) in formData.benefits_for_card_one" :key="index" class="border-round-md surface-ground p-3 flex align-items-center justify-content-between mb-3">
                  <div>
                    <div class="font-bold pb-2">
                      {{ benefit.title }}
                    </div>
                    <div>
                      {{ benefit.description }}
                    </div>
                  </div>
                  <div class="w-5rem flex">
                    <Button
                      icon="pi pi-pencil"
                      text
                      severity="info"
                      @click="editBenefitConfirm(index, 'benefits_for_card_one'), activeBenefitsCard = 'benefits_for_card_one'"
                    />
                    <Button
                      icon="pi pi-trash"
                      text
                      severity="warning"
                      @click="deleteBenefitConfirm(index), activeBenefitsCard = 'benefits_for_card_one'"
                    />
                  </div>
                </div>
              </div>
              <Button label="Nuevo" icon="pi pi-plus" class="w-full my-2 md:my-0" :class="{ 'p-button-danger': failedGlobalValidation && globalValidation.benefits_for_card_one.$invalid, 'p-button-secondary': !failedGlobalValidation || !globalValidation.benefits_for_card_one.$invalid }" @click="benefitDialog = true, activeBenefitsCard = 'benefits_for_card_one'" />
            </div>
            <div class="field block col col-12 md:col-6">
              <label for="title-card-two">Título de tarjeta #2</label>
              <InputText
                id="title-card-two"
                v-model="globalValidation.benefits_card_two.$model"
                class="block w-full"
                type="label"
                aria-describedby="title-card-two-help"
                :class="{ 'p-invalid': globalValidation.benefits_card_two.$invalid && formData.benefits_card_two != '' || failedGlobalValidation && globalValidation.benefits_card_two.$invalid }"
              />
              <small id="title-card-two-help">Título del de la tarjeta #2 de beneficios.</small>
              <div class="pt-4">
                <div v-for="(benefit, index) in formData.benefits_for_card_two" :key="index" class="border-round-md surface-ground p-3 flex align-items-center justify-content-between mb-3">
                  <div>
                    <div class="font-bold pb-2">
                      {{ benefit.title }}
                    </div>
                    <div>
                      {{ benefit.description }}
                    </div>
                  </div>
                  <div class="w-5rem flex">
                    <Button
                      icon="pi pi-pencil"
                      text
                      severity="info"
                      @click="editBenefitConfirm(index, 'benefits_for_card_two'), activeBenefitsCard = 'benefits_for_card_two'"
                    />
                    <Button
                      icon="pi pi-trash"
                      text
                      severity="warning"
                      @click="deleteBenefitConfirm(index), activeBenefitsCard = 'benefits_for_card_two'"
                    />
                  </div>
                </div>
              </div>
              <Button label="Nuevo" icon="pi pi-plus" class="w-full my-2 md:my-0" :class="{ 'p-button-danger': failedGlobalValidation && globalValidation.benefits_for_card_two.$invalid, 'p-button-secondary': !failedGlobalValidation || !globalValidation.benefits_for_card_two.$invalid }" @click="benefitDialog = true, activeBenefitsCard = 'benefits_for_card_two'" />
            </div>
            <small class="ml-2">Ambas tarjetas deben tener la misma cantidad de beneficios.</small>
          </div>
        </div>
        <div class="card surface-card mt-4 p-4 border-round-md">
          <h3 class="mt-0">
            Modelos
          </h3>
          <div id="amenities-gallery" class="grid row mt-1">
            <div v-for="(model, index) in formData.models" :key="index" class="field block col col-12 md:col-3 relative">
              <div class="c-cover-preview flex flex-column border-round-md surface-ground h-6rem p-3">
                <div>
                  <b>{{ model.title }}</b>
                </div>
                <div class="mt-1">
                  {{ moneyFormatter.format(model.price) }}
                </div>
                <div class="mt-1">
                  {{ numberFormatter.format(model.area) }} m<sup>2</sup>
                </div>
              </div>
              <Button
                icon="pi pi-pencil"
                class="mr-2 absolute c-edit-btn"
                text
                severity="secondary"
                @click="openEditModelDialog(index)"
              />
              <Button
                icon="pi pi-trash"
                class="mr-2 absolute right-0 c-delete-btn"
                text
                severity="warning"
                @click="confirmDeleteModel(index)"
              />
            </div>
            <div class="field block col col-12 md:col-3">
              <div class="c-cover-preview flex justify-content-center content-align-center border-round-md surface-ground h-6rem cursor-pointer border-1 border-solid" :class="{ 'border-red-500': failedGlobalValidation && globalValidation.amenities_gallery.$invalid, 'surface-border': !failedGlobalValidation || !globalValidation.models.$invalid }" @click="activeModelIndex = null, modelDialog = true">
                <div class="c-no-image-notice flex align-items-center justify-content-center font-italic font-light p-3 text-center">
                  Da clic para agregar un modelo.
                </div>
              </div>
            </div>
            <div class="field block col col-12">
              <small id="url-help">Por lo menos un modelo es obligatorio.</small>
            </div>
          </div>
        </div>
      </form>
    </div>
    <Dialog v-model:visible="zonesDialog" :closable="false" :style="{ width: '450px' }" header="Nueva zona" :modal="true">
      <div class="new-zone-content">
        <form ref="newZoneForm">
          <div class="field block">
            <label for="name">Nombre</label>
            <InputText
              id="name"
              v-model="zoneValidation.name.$model"
              class="block w-full"
              type="text"
              aria-describedby="zone-help"
              :class="{ 'p-invalid': zoneValidation.name.$invalid && zonesFormData.name != '' || failedZoneValidation && zoneValidation.name.$invalid }"
            />
            <small id="label-help">El nombre para identificar la zona. Máximo 100 caracteres.</small>
          </div>
          <div class="field block">
            <label for="slug">URL</label>
            <InputText
              id="slug"
              v-model="zoneValidation.slug.$model"
              class="block w-full"
              type="text"
              aria-describedby="tag-help"
              readonly
              :class="{ 'p-invalid': zoneValidation.slug.$invalid && zonesFormData.slug != '' || failedZoneValidation && zoneValidation.slug.$invalid }"
            />
            <small id="tag-help">Se crea a partir del nombre.</small>
          </div>
        </form>
      </div>
      <template #footer>
        <div class="flex w-full justify-content-between">
          <Button label="Cancelar" icon="pi pi-times" class="p-button-text" :loading="savingZone" @click="closeNewZoneDialog" />
          <Button
            label="Guardar"
            icon="pi pi-check"
            class="p-button-text p-button-success"
            :loading="savingZone"
            :disabled="zoneValidation.$invalid"
            @click="saveNewZone(!zoneValidation.$invalid)"
          />
        </div>
      </template>
    </Dialog>
    <Dialog v-model:visible="coverDialog" class="c-upload-dialog" modal :show-header="false">
      <div class="card flex flex-column align-items-center justify-content-center">
        <div class="mt-5 w-full flex gap-2 justify-content-between flex-wrap c-file-tools">
          <Button icon="pi pi-arrow-left" severity="warning" class="mr-2" @click="cancelCoverCrop" />
          <FileUpload
            mode="advanced"
            accept="image/*"
            custom-upload
            :multiple="false"
            auto
            text
            class="w-full"
            @uploader="coverBase64Uploader"
          >
            <template #header="{ chooseCallback }">
              <div class="flex flex-wrap justify-content-between align-items-center flex-1 gap-2">
                <div class="flex gap-2">
                  <Button icon="pi pi-images" @click="chooseCallback()" />
                </div>
              </div>
            </template>
          </FileUpload>
          <Button
            icon="pi pi-eraser"
            class="mr-2"
            severity="info"
            :disabled="!coverCropper"
            @click="resetCoverCrop"
          />
          <Button
            icon="pi pi-save"
            class="mr-2"
            severity="success"
            :disabled="!coverCropper"
            :loading="uploadingCover"
            @click="uploadCover"
          />
        </div>
        <div v-if="coverFile" class="pt-4">
          <VueCropper
            ref="coverCropper"
            :aspect-ratio="1083 / 567"
            :src="coverFile"
            alt="Source Image"
          />
        </div>
      </div>
    </Dialog>
    <Dialog v-model:visible="opDialog" class="c-upload-dialog" modal :show-header="false">
      <div class="card flex flex-column align-items-center justify-content-center">
        <div class="mt-5 w-full flex gap-2 justify-content-between flex-wrap c-file-tools">
          <Button icon="pi pi-arrow-left" severity="warning" class="mr-2" @click="cancelOpCrop" />
          <FileUpload
            mode="advanced"
            accept="image/*"
            custom-upload
            :multiple="false"
            auto
            text
            class="w-full"
            @uploader="opBase64Uploader"
          >
            <template #header="{ chooseCallback }">
              <div class="flex flex-wrap justify-content-between align-items-center flex-1 gap-2">
                <div class="flex gap-2">
                  <Button icon="pi pi-images" @click="chooseCallback()" />
                </div>
              </div>
            </template>
          </FileUpload>
          <Button
            icon="pi pi-eraser"
            class="mr-2"
            severity="info"
            :disabled="!opCropper"
            @click="resetOpCrop"
          />
          <Button
            icon="pi pi-save"
            class="mr-2"
            severity="success"
            :disabled="!opCropper"
            :loading="uploadingOp"
            @click="uploadOp"
          />
        </div>
        <div v-if="opFile" class="pt-4">
          <VueCropper
            ref="opCropper"
            :aspect-ratio="1200 / 630"
            :src="opFile"
            alt="Source Image"
          />
        </div>
      </div>
    </Dialog>
    <Dialog v-model:visible="addressDialog" :closable="false" :style="{ width: '450px' }" header="Buscar dirección" :modal="true">
      <div class="new-address-content">
        <form ref="newZoneForm">
          <div class="field block">
            <label for="address">Dirección</label>
            <AutoComplete
              id="address"
              v-model="googleMapsPlace"
              class="block w-full"
              aria-describedby="address-help"
              :suggestions="googleMapsResult"
              option-label="description"
              @complete="getPlacePredictions"
            />
            <small id="label-help">Escribe una dirección para buscarla.</small>
          </div>
          <div class="field block">
            <label for="lat">Latitud</label>
            <InputText
              id="lat"
              v-model="formData.lat"
              class="block w-full"
              type="text"
              aria-describedby="lat-help"
              readonly
            />
            <small id="tag-help">Busca la dirección arriba.</small>
          </div>
          <div class="field block">
            <label for="lat">Longitud</label>
            <InputText
              id="lng"
              v-model="formData.lng"
              class="block w-full"
              type="text"
              aria-describedby="lng-help"
              readonly
            />
            <small id="tag-help">Busca la dirección arriba.</small>
          </div>
          <div v-if="mapCenter && formData.lat !== '' && formData.lng !== ''" class="field block">
            <label for="lat">Mapa</label>
            <GoogleMap
              :api-key="config.public.GOOGLE_MAPS_API"
              class="project-map"
              :center="mapCenter"
              :zoom="15"
            >
              <Marker :options="{ position: mapCenter, draggable: true, clickable: true }" @dragend="dragged" />
            </GoogleMap>
            <small id="tag-help">Ajusta el marcador de ser necesario.</small>
          </div>
        </form>
      </div>
      <template #footer>
        <div class="flex w-full justify-content-between">
          <Button label="Cancelar" icon="pi pi-times" class="p-button-text" :loading="savingZone" @click="cancelAddress" />
          <Button
            label="Guardar"
            icon="pi pi-check"
            class="p-button-text p-button-success"
            :disabled="!googleMapsPlace || !mapCenter"
            @click="addressDialog = false"
          />
        </div>
      </template>
    </Dialog>
    <Dialog v-model:visible="galleryDialog" class="c-upload-dialog" modal :show-header="false">
      <div class="card flex flex-column align-items-center justify-content-center">
        <div class="mt-5 w-full flex gap-2 justify-content-between flex-wrap c-file-tools">
          <Button icon="pi pi-arrow-left" severity="warning" class="mr-2" @click="cancelGalleryCrop" />
          <FileUpload
            mode="advanced"
            accept="image/*"
            custom-upload
            :multiple="false"
            auto
            text
            class="w-full"
            @uploader="galleryBase64Uploader"
          >
            <template #header="{ chooseCallback }">
              <div class="flex flex-wrap justify-content-between align-items-center flex-1 gap-2">
                <div class="flex gap-2">
                  <Button icon="pi pi-images" @click="chooseCallback()" />
                </div>
              </div>
            </template>
          </FileUpload>
          <Button
            icon="pi pi-eraser"
            class="mr-2"
            severity="info"
            :disabled="!galleryCropper"
            @click="resetGalleryCrop"
          />
          <Button
            icon="pi pi-save"
            class="mr-2"
            severity="success"
            :disabled="!galleryCropper"
            :loading="uploadingGallery"
            @click="uploadGallery"
          />
        </div>
        <div v-if="galleryFile" class="pt-4">
          <VueCropper
            ref="galleryCropper"
            :aspect-ratio="1232 / 560"
            :src="galleryFile"
            alt="Source Image"
          />
        </div>
      </div>
    </Dialog>
    <Dialog v-model:visible="deleteGalleryImageDialog" :closable="false" :style="{ width: '450px' }" header="¿Eliminar?" :modal="true">
      <template #footer>
        <div class="flex w-full justify-content-between">
          <Button label="Cancelar" icon="pi pi-times" class="p-button-text" @click="cancelImageGalleryDelete" />
          <Button label="Confirmar" icon="pi pi-check" class="p-button-text p-button-danger" @click="deleteGalleryImage" />
        </div>
      </template>
    </Dialog>
    <Dialog v-model:visible="thumbnailsDialog" class="c-upload-dialog" modal :show-header="false">
      <div class="card flex flex-column align-items-center justify-content-center">
        <div class="mt-5 w-full flex gap-2 justify-content-between flex-wrap c-file-tools">
          <Button icon="pi pi-arrow-left" severity="warning" class="mr-2" @click="cancelThumbnailsCrop" />
          <FileUpload
            mode="advanced"
            accept="image/*"
            custom-upload
            :multiple="false"
            auto
            text
            class="w-full"
            @uploader="thumbnailsBase64Uploader"
          >
            <template #header="{ chooseCallback }">
              <div class="flex flex-wrap justify-content-between align-items-center flex-1 gap-2">
                <div class="flex gap-2">
                  <Button icon="pi pi-images" @click="chooseCallback()" />
                </div>
              </div>
            </template>
          </FileUpload>
          <Button
            icon="pi pi-eraser"
            class="mr-2"
            severity="info"
            :disabled="!thumbnailsCropper"
            @click="resetThumbnailsCrop"
          />
          <Button
            icon="pi pi-save"
            class="mr-2"
            severity="success"
            :disabled="!thumbnailsCropper"
            :loading="uploadingThumbnails"
            @click="uploadThumbnails"
          />
        </div>
        <div v-if="thumbnailsFile" class="pt-4">
          <VueCropper
            ref="thumbnailsCropper"
            :aspect-ratio="500 / 500"
            :src="thumbnailsFile"
            alt="Source Image"
          />
        </div>
      </div>
    </Dialog>
    <Dialog v-model:visible="deleteThumbnailsImageDialog" :closable="false" :style="{ width: '450px' }" header="¿Eliminar?" :modal="true">
      <template #footer>
        <div class="flex w-full justify-content-between">
          <Button label="Cancelar" icon="pi pi-times" class="p-button-text" @click="cancelImageThumbnailsDelete" />
          <Button label="Confirmar" icon="pi pi-check" class="p-button-text p-button-danger" @click="deleteThumbnailsImage" />
        </div>
      </template>
    </Dialog>
    <Dialog v-model:visible="amenitiesGalleryDialog" class="c-upload-dialog" modal :show-header="false">
      <div class="card flex flex-column align-items-center justify-content-center">
        <div class="mt-5 w-full flex gap-2 justify-content-between flex-wrap c-file-tools">
          <Button icon="pi pi-arrow-left" severity="warning" class="mr-2" @click="cancelAmenitiesGalleryCrop" />
          <FileUpload
            mode="advanced"
            accept="image/*"
            custom-upload
            :multiple="false"
            auto
            text
            class="w-full"
            @uploader="amenitiesGalleryBase64Uploader"
          >
            <template #header="{ chooseCallback }">
              <div class="flex flex-wrap justify-content-between align-items-center flex-1 gap-2">
                <div class="flex gap-2">
                  <Button icon="pi pi-images" @click="chooseCallback()" />
                </div>
              </div>
            </template>
          </FileUpload>
          <Button
            icon="pi pi-eraser"
            class="mr-2"
            severity="info"
            :disabled="!amenitiesGalleryCropper"
            @click="resetAmenitiesGalleryCrop"
          />
          <Button
            icon="pi pi-save"
            class="mr-2"
            severity="success"
            :disabled="!amenitiesGalleryCropper"
            :loading="uploadingAmenitiesGallery"
            @click="uploadAmenitiesGallery"
          />
        </div>
        <div v-if="amenitiesGalleryFile" class="pt-4">
          <VueCropper
            ref="amenitiesGalleryCropper"
            :aspect-ratio="797 / 304"
            :src="amenitiesGalleryFile"
            alt="Source Image"
          />
        </div>
      </div>
    </Dialog>
    <Dialog v-model:visible="deleteAmenitiesGalleryImageDialog" :closable="false" :style="{ width: '450px' }" header="¿Eliminar?" :modal="true">
      <template #footer>
        <div class="flex w-full justify-content-between">
          <Button label="Cancelar" icon="pi pi-times" class="p-button-text" @click="cancelImageAmenitiesGalleryDelete" />
          <Button label="Confirmar" icon="pi pi-check" class="p-button-text p-button-danger" @click="deleteAmenitiesGalleryImage" />
        </div>
      </template>
    </Dialog>
    <Dialog v-model:visible="amenitiesDialog" :closable="false" :style="{ width: '450px' }" header="Nueva amenidad" :modal="true">
      <div class="new-amenity-content">
        <form ref="newAmenityForm">
          <div class="field block">
            <label for="name">Nombre</label>
            <InputText
              id="name"
              v-model="amenitiesValidation.name.$model"
              class="block w-full"
              type="text"
              aria-describedby="zone-help"
              :class="{ 'p-invalid': amenitiesValidation.name.$invalid && amenitiesFormData.name != '' || failedAmenitiesValidation && amenitiesValidation.name.$invalid }"
            />
            <small id="label-help">El nombre de la amenidad. Máximo 100 caracteres.</small>
          </div>
          <div class="field block">
            <label for="name">Icono</label>
            <div class="p-inputgroup flex-1">
              <Dropdown
                v-model="amenitiesFormData.icon"
                :options="landingsIcons"
                option-label="name"
                option-value="icon"
                :filter="true"
                placeholder="Selecciona un icono"
                :show-clear="false"
                panel-class="c-c-countries-panel"
                class="w-full"
              >
                <template #value="slotProps">
                  <span>
                    {{ slotProps.placeholder }}
                  </span>
                </template>
                <template #option="slotProps">
                  <div class="country-item flex align-items-center">
                    <img :src="slotProps.option.icon" class="mr-1" height="16">
                    <div>{{ slotProps.option.name }}</div>
                  </div>
                </template>
              </Dropdown>
              <FileUpload
                mode="basic"
                accept="image/svg+xml"
                custom-upload
                :multiple="false"
                auto
                choose-label="Subir"
                class="w-full"
                style="border-radius: 0 6px 6px 0;"
                :disabled="uploadingAmenityIcon || amenitiesValidation.name.$invalid"
                @uploader="amenityIconBase64Uploader"
              />
            </div>
            <small id="label-help">El icono de la amenidad en svg.</small>
            <div class="flex justify-content-center mt-3">
              <img v-if="amenitiesFormData.icon" :src="amenitiesFormData.icon" class="w-3rem h-3rem surface-ground border-round-md p-3">
            </div>
          </div>
        </form>
      </div>
      <template #footer>
        <div class="flex w-full justify-content-between">
          <Button label="Cancelar" icon="pi pi-times" class="p-button-text" @click="closeNewAmenityDialog" />
          <Button
            label="Guardar"
            icon="pi pi-check"
            class="p-button-text p-button-success"
            :disabled="amenitiesValidation.$invalid"
            @click="saveAmenity(!amenitiesValidation.$invalid)"
          />
        </div>
      </template>
    </Dialog>
    <Dialog v-model:visible="deleteAmenityDialog" :closable="false" :style="{ width: '450px' }" header="¿Eliminar?" :modal="true">
      <template #footer>
        <div class="flex w-full justify-content-between">
          <Button label="Cancelar" icon="pi pi-times" class="p-button-text" @click="cancelAmenityDelete" />
          <Button label="Confirmar" icon="pi pi-check" class="p-button-text p-button-danger" @click="deleteAmenity" />
        </div>
      </template>
    </Dialog>
    <Dialog v-model:visible="benefitDialog" :closable="false" :style="{ width: '450px' }" header="Nuevo beneficio" :modal="true">
      <div class="new-benefit-content">
        <form ref="newBenefitForm">
          <div class="field block">
            <label for="title">Título</label>
            <InputText
              id="title"
              v-model="benefitValidation.title.$model"
              class="block w-full"
              type="text"
              aria-describedby="title-help"
              :class="{ 'p-invalid': benefitValidation.title.$invalid && benefitFormData.title != '' || failedBenefitValidation && benefitValidation.title.$invalid }"
            />
            <small id="label-help">Máximo 25 caracteres.</small>
          </div>
          <div class="field block">
            <label for="description">Descripción</label>
            <Textarea
              id="description"
              v-model="benefitValidation.description.$model"
              class="block w-full"
              type="text"
              aria-describedby="description-help"
              :class="{ 'p-invalid': benefitValidation.description.$invalid && benefitFormData.description != '' || failedBenefitValidation && benefitValidation.description.$invalid }"
            />
            <small id="description-help">Mínimo 30 y máximo 70 caracteres.</small>
          </div>
        </form>
      </div>
      <template #footer>
        <div class="flex w-full justify-content-between">
          <Button label="Cancelar" icon="pi pi-times" class="p-button-text" @click="closeNewBenefitDialog" />
          <Button
            label="Guardar"
            icon="pi pi-check"
            class="p-button-text p-button-success"
            :disabled="benefitValidation.$invalid"
            @click="saveBenefitSelection(!benefitValidation.$invalid)"
          />
        </div>
      </template>
    </Dialog>
    <Dialog v-model:visible="deleteBenefitDialog" :closable="false" :style="{ width: '450px' }" header="¿Eliminar?" :modal="true">
      <template #footer>
        <div class="flex w-full justify-content-between">
          <Button label="Cancelar" icon="pi pi-times" class="p-button-text" @click="cancelBenefitDelete" />
          <Button label="Confirmar" icon="pi pi-check" class="p-button-text p-button-danger" @click="deleteBenefit" />
        </div>
      </template>
    </Dialog>
    <Dialog
      v-model:visible="modelDialog"
      :closable="false"
      class="model-dialog"
      :maximizable="true"
      header="Modelo"
      :modal="true"
    >
      <div class="model-content-data">
        <form ref="modelForm">
          <div class="card surface-50 p-4 border-round-md">
            <h3 class="mt-0">
              Datos básicos
            </h3>
            <div class="grid row">
              <div class="field block col col-12 md:col-6">
                <label for="title">Título</label>
                <InputText
                  id="title"
                  v-model="modelValidation.title.$model"
                  class="block w-full"
                  type="label"
                  aria-describedby="title-help"
                  :class="{ 'p-invalid': modelValidation.title.$invalid && modelFormData.title != '' || failedModelValidation && modelValidation.title.$invalid }"
                />
                <small id="title-help">Título del modelo. Máximo 100 caracteres.</small>
              </div>
              <div class="field block col col-12 md:col-6">
                <label for="url">URL</label>
                <InputText
                  id="url"
                  v-model="modelValidation.slug.$model"
                  class="block w-full"
                  type="label"
                  aria-describedby="url-help"
                  readonly
                  :class="{ 'p-invalid': modelValidation.slug.$invalid && modelFormData.slug != '' || failedModelValidation && modelValidation.slug.$invalid }"
                />
                <small id="url-help">URL del modelo, se crea a partir del título.</small>
              </div>
              <div class="field block col col-12 md:col-6">
                <label for="price">Precio</label>
                <InputText
                  id="price"
                  v-model="modelValidation.price.$model"
                  class="block w-full"
                  type="label"
                  aria-describedby="price-help"
                  :class="{ 'p-invalid': modelValidation.price.$invalid && modelFormData.price != '' || failedModelValidation && modelValidation.price.$invalid }"
                />
                <small id="price-help">Precio del modelo.</small>
              </div>
              <div class="field block col col-12 md:col-6">
                <label for="area">Área</label>
                <InputText
                  id="area"
                  v-model="modelValidation.area.$model"
                  class="block w-full"
                  type="label"
                  aria-describedby="area-help"
                  :class="{ 'p-invalid': modelValidation.area.$invalid && modelFormData.area != '' || failedModelValidation && modelValidation.area.$invalid }"
                />
                <small id="area-help">Área del modelo en metros cuadrados.</small>
              </div>
              <div class="field block col col-12 md:col-6">
                <label for="bedrooms">Recamaras</label>
                <InputText
                  id="bedrooms"
                  v-model="modelValidation.bed.$model"
                  class="block w-full"
                  type="label"
                  aria-describedby="bedrooms-help"
                  :class="{ 'p-invalid': modelValidation.bed.$invalid && modelFormData.bed != '' || failedModelValidation && modelValidation.bed.$invalid }"
                />
                <small id="bedrooms-help">Cantidad de habitaciones del modelo.</small>
              </div>
              <div class="field block col col-12 md:col-6">
                <label for="bathrooms">Baños</label>
                <InputText
                  id="bathrooms"
                  v-model="modelValidation.bat.$model"
                  class="block w-full"
                  type="label"
                  aria-describedby="bathrooms-help"
                  :class="{ 'p-invalid': modelValidation.bat.$invalid && modelFormData.bat != '' || failedModelValidation && modelValidation.bat.$invalid }"
                />
                <small id="bathrooms-help">Cantidad de habitaciones del modelo.</small>
              </div>
              <div class="field block col col-12 md:col-6">
                <label for="bathrooms">Disponibilidad</label>
                <InputText
                  id="avaliability"
                  v-model="modelValidation.avaliability.$model"
                  class="block w-full"
                  type="label"
                  aria-describedby="avaliability-help"
                  :class="{ 'p-invalid': modelValidation.avaliability.$invalid && modelFormData.avaliability != '' || failedModelValidation && modelValidation.avaliability.$invalid }"
                />
                <small id="avaliability-help">Cantidad de unidades disponibles.</small>
              </div>
              <div class="field block col col-12 md:col-6">
                <label for="parking">Estacionamientos</label>
                <InputText
                  id="parking"
                  v-model="modelValidation.parking.$model"
                  class="block w-full"
                  type="label"
                  aria-describedby="parking-help"
                  :class="{ 'p-invalid': modelValidation.parking.$invalid && modelFormData.parking != '' || failedModelValidation && modelValidation.parking.$invalid }"
                />
                <small id="parking-help">Cantidad de estacionamientos incluidos.</small>
              </div>
              <div class="field block col col-12">
                <label for="parking">Tour virtual</label>
                <InputText
                  id="tour"
                  v-model="modelValidation.tour.$model"
                  class="block w-full"
                  type="label"
                  aria-describedby="tour-help"
                  :class="{ 'p-invalid': modelValidation.tour.$invalid && modelFormData.tour != '' || failedModelValidation && modelValidation.tour.$invalid }"
                />
                <small id="tour-help">Una URL válida para el tour virtual.</small>
              </div>
              <div class="field block col col-12">
                <label for="short-description">Descripción corta</label>
                <Textarea
                  id="short-model-description"
                  v-model="modelValidation.description.$model"
                  class="block w-full"
                  type="label"
                  aria-describedby="short-model-description"
                  :class="{ 'p-invalid': modelValidation.description.$invalid && modelFormData.description != '' || failedModelValidation && modelValidation.description.$invalid }"
                />
                <small id="short-model-description-help">Debe tener un mínimo de 110 caracteres y un máximo de 130, incluyendo espacios.</small>
              </div>
              <div class="field block col col-12 p-invalid">
                <label for="6d0fbac5-eb1f-46aa-8cbc-821ff82447bb">Descripción larga</label>
                <TiptapEditor id="6d0fbac5-eb1f-46aa-8cbc-821ff82447bb" v-model="modelFormData.long_description" :validation="failedModelValidation && modelValidation.long_description.$invalid" />
                <small id="6d0fbac5-eb1f-46aa-8cbc-821ff82447bb-help">Texto dividido en párrafos, el primer párrafo se recomienda que sea de un aproximado de 450 caracteres con espacios. Mínimo 300 caracteres aproximados.</small>
              </div>
              <div class="field block col col-12">
                <label for="model-op">Imagen Open Graph</label>
                <div id="model-op" class="c-cover-preview flex justify-content-center content-align-center border-round-md surface-ground h-15rem cursor-pointer border-1 border-solid" :class="{ 'border-red-500': failedModelValidation && modelValidation.op.$invalid, 'surface-border': !failedModelValidation || !modelValidation.op.$invalid }" @click="modelOpDialog = true">
                  <div v-if="!modelFormData.op.src" class="c-no-image-notice flex align-items-center justify-content-center font-italic font-light p-3 text-center">
                    No se ha seleccionado ninguna imagen, da clic para seleccionar una.
                  </div>
                  <img v-else class="w-full h-full c-img" :src="modelFormData.op.src" alt="OP">
                </div>
                <small id="model-op-help">El tamaño y formato de la previsualización de la imagen no representan el resultado final.</small>
              </div>
            </div>
          </div>
          <div class="card surface-50 mt-4 p-4 border-round-md">
            <h3 class="mt-0">
              Galería
            </h3>
            <div class="grid row">
              <div v-for="(image, index) in modelFormData.gallery" :key="index" class="field block col col-12 md:col-6 relative">
                <div class="c-cover-preview flex justify-content-center content-align-center border-round-md surface-ground h-15rem cursor-pointer">
                  <img class="w-full h-full c-img" :src="image.src" alt="Image Gallery">
                </div>
                <Button
                  icon="pi pi-trash"
                  class="mr-2 absolute right-0 c-delete-btn"
                  text
                  severity="warning"
                  @click="modelDeleteImageGalleryConfirm(index)"
                />
              </div>
              <div v-if="modelFormData.gallery.length <= 11" class="field block col col-12 md:col-6">
                <div class="c-cover-preview flex justify-content-center content-align-center border-round-md surface-ground h-15rem cursor-pointer border-1 border-solid" :class="{ 'border-red-500': failedModelValidation && modelValidation.gallery.$invalid, 'surface-border': !failedModelValidation || !modelValidation.gallery.$invalid }" @click="modelGalleryDialog = true">
                  <div class="c-no-image-notice flex align-items-center justify-content-center font-italic font-light p-3 text-center">
                    Da clic para agregar una imagen.
                  </div>
                </div>
              </div>
              <div class="field block col col-12">
                <small id="url-help">El tamaño y formato de la previsualización de la imagen no representan el resultado final.</small>
              </div>
            </div>
          </div>
          <div class="card surface-50 mt-4 p-4 border-round-md">
            <h3 class="mt-0">
              Características
            </h3>
            <div class="flex flex-wrap gap-2 pb-4">
              <div v-for="(feature, index) in modelFormData.features" :key="index" class="flex align-items-center w-full sm:w-auto border-round-md surface-ground pl-4">
                <div class="c-icon flex justify-content-center align-items-center">
                  <img :src="feature.icon" :alt="feature.name" height="16" width="16">
                </div>
                <div class="c-name mx-2">
                  {{ feature.name }}
                </div>
                <Button
                  icon="pi pi-trash"
                  class="mr-2"
                  text
                  severity="warning"
                  @click="deleteFeatureConfirm(index)"
                />
              </div>
              <Button label="Nueva" icon="pi pi-plus" class="w-full md:w-auto my-2 md:my-0" :class="{ 'p-button-danger': failedModelValidation && modelValidation.features.$invalid, 'p-button-secondary': !failedModelValidation || !modelValidation.features.$invalid }" @click="featuresDialog = true" />
            </div>
          </div>
        </form>
      </div>
      <template #footer>
        <div class="flex w-full justify-content-between">
          <Button label="Cancelar" icon="pi pi-times" class="p-button-text" @click="closeNewModelDialog" />
          <Button label="Guardar" icon="pi pi-check" class="p-button-text p-button-success" :disabled="modelValidation.$invalid" @click="saveModel(!modelValidation.$invalid)" />
        </div>
      </template>
    </Dialog>
    <Dialog v-model:visible="modelOpDialog" class="c-upload-dialog" modal :show-header="false">
      <div class="card flex flex-column align-items-center justify-content-center">
        <div class="mt-5 w-full flex gap-2 justify-content-between flex-wrap c-file-tools">
          <Button icon="pi pi-arrow-left" severity="warning" class="mr-2" @click="cancelModelOpCrop" />
          <FileUpload
            mode="advanced"
            accept="image/*"
            custom-upload
            :multiple="false"
            auto
            text
            class="w-full"
            @uploader="modelOpBase64Uploader"
          >
            <template #header="{ chooseCallback }">
              <div class="flex flex-wrap justify-content-between align-items-center flex-1 gap-2">
                <div class="flex gap-2">
                  <Button icon="pi pi-images" @click="chooseCallback()" />
                </div>
              </div>
            </template>
          </FileUpload>
          <Button
            icon="pi pi-eraser"
            class="mr-2"
            severity="info"
            :disabled="!modelOpCropper"
            @click="resetModelOpCrop"
          />
          <Button
            icon="pi pi-save"
            class="mr-2"
            severity="success"
            :disabled="!modelOpCropper"
            :loading="uploadingModelOp"
            @click="uploadModelOp"
          />
        </div>
        <div v-if="modelOpFile" class="pt-4">
          <VueCropper
            ref="modelOpCropper"
            :aspect-ratio="1200 / 630"
            :src="modelOpFile"
            alt="Source Image"
          />
        </div>
      </div>
    </Dialog>
    <Dialog v-model:visible="modelGalleryDialog" class="c-upload-dialog" modal :show-header="false">
      <div class="card flex flex-column align-items-center justify-content-center">
        <div class="mt-5 w-full flex gap-2 justify-content-between flex-wrap c-file-tools">
          <Button icon="pi pi-arrow-left" severity="warning" class="mr-2" @click="modelCancelGalleryCrop" />
          <FileUpload
            mode="advanced"
            accept="image/*"
            custom-upload
            :multiple="false"
            auto
            text
            class="w-full"
            @uploader="modelGalleryBase64Uploader"
          >
            <template #header="{ chooseCallback }">
              <div class="flex flex-wrap justify-content-between align-items-center flex-1 gap-2">
                <div class="flex gap-2">
                  <Button icon="pi pi-images" @click="chooseCallback()" />
                </div>
              </div>
            </template>
          </FileUpload>
          <Button
            icon="pi pi-eraser"
            class="mr-2"
            severity="info"
            :disabled="!modelGalleryCropper"
            @click="modelResetGalleryCrop"
          />
          <Button
            icon="pi pi-save"
            class="mr-2"
            severity="success"
            :disabled="!modelGalleryCropper"
            :loading="uploadingModelGallery"
            @click="uploadModelGallery"
          />
        </div>
        <div v-if="modelGalleryFile" class="pt-4">
          <VueCropper
            ref="modelGalleryCropper"
            :aspect-ratio="1232 / 560"
            :src="modelGalleryFile"
            alt="Source Image"
          />
        </div>
      </div>
    </Dialog>
    <Dialog v-model:visible="modelDeleteGalleryImageDialog" :closable="false" :style="{ width: '450px' }" header="¿Eliminar?" :modal="true">
      <template #footer>
        <div class="flex w-full justify-content-between">
          <Button label="Cancelar" icon="pi pi-times" class="p-button-text" @click="cancelModelImageGalleryDelete" />
          <Button label="Confirmar" icon="pi pi-check" class="p-button-text p-button-danger" @click="modelDeleteGalleryImage" />
        </div>
      </template>
    </Dialog>
    <Dialog v-model:visible="featuresDialog" :closable="false" :style="{ width: '450px' }" header="Nueva característica" :modal="true">
      <div class="new-amenity-content">
        <form ref="newAmenityForm">
          <div class="field block">
            <label for="name">Nombre</label>
            <InputText
              id="name"
              v-model="featuresValidation.name.$model"
              class="block w-full"
              type="text"
              aria-describedby="zone-help"
              :class="{ 'p-invalid': featuresValidation.name.$invalid && featuresFormData.name != '' || failedFeaturesValidation && featuresValidation.name.$invalid }"
            />
            <small id="label-help">El nombre de la característica. Máximo 100 caracteres.</small>
          </div>
          <div class="field block">
            <label for="name">Icono</label>
            <div class="p-inputgroup flex-1">
              <Dropdown
                v-model="featuresFormData.icon"
                :options="landingsIcons"
                option-label="name"
                option-value="icon"
                :filter="true"
                placeholder="Selecciona un icono"
                :show-clear="false"
                panel-class="c-c-countries-panel"
                class="w-full"
              >
                <template #value="slotProps">
                  <span>
                    {{ slotProps.placeholder }}
                  </span>
                </template>
                <template #option="slotProps">
                  <div class="country-item flex align-items-center">
                    <img :src="slotProps.option.icon" class="mr-1" height="16">
                    <div>{{ slotProps.option.name }}</div>
                  </div>
                </template>
              </Dropdown>
              <FileUpload
                mode="basic"
                accept="image/svg+xml"
                custom-upload
                :multiple="false"
                auto
                choose-label="Subir"
                class="w-full"
                style="border-radius: 0 6px 6px 0;"
                :disabled="uploadingFeatureIcon || featuresValidation.name.$invalid"
                @uploader="featureIconBase64Uploader"
              />
            </div>
            <small id="label-help">El icono de la característica en svg.</small>
            <div class="flex justify-content-center mt-3">
              <img v-if="featuresFormData.icon" :src="featuresFormData.icon" class="w-3rem h-3rem surface-ground border-round-md p-3">
            </div>
          </div>
        </form>
      </div>
      <template #footer>
        <div class="flex w-full justify-content-between">
          <Button label="Cancelar" icon="pi pi-times" class="p-button-text" @click="closeNewFeatureDialog" />
          <Button
            label="Guardar"
            icon="pi pi-check"
            class="p-button-text p-button-success"
            :disabled="featuresValidation.$invalid"
            @click="saveFeature(!featuresValidation.$invalid)"
          />
        </div>
      </template>
    </Dialog>
    <Dialog v-model:visible="deleteFeatureDialog" :closable="false" :style="{ width: '450px' }" header="¿Eliminar?" :modal="true">
      <template #footer>
        <div class="flex w-full justify-content-between">
          <Button label="Cancelar" icon="pi pi-times" class="p-button-text" @click="cancelFeatureDelete" />
          <Button label="Confirmar" icon="pi pi-check" class="p-button-text p-button-danger" @click="deleteFeature" />
        </div>
      </template>
    </Dialog>
    <Dialog v-model:visible="deleteModelDialog" :closable="false" :style="{ width: '450px' }" header="¿Eliminar?" :modal="true">
      <template #footer>
        <div class="flex w-full justify-content-between">
          <Button label="Cancelar" icon="pi pi-times" class="p-button-text" @click="cancelDeleteModel" />
          <Button label="Confirmar" icon="pi pi-check" class="p-button-text p-button-danger" @click="deleteModel" />
        </div>
      </template>
    </Dialog>
    <SpeedDial
      :model="menuItems"
      :radius="120"
      type="quarter-circle"
      direction="up-left"
      :tooltip-options="{ position: 'left', event: 'hover' }"
      :style="{ right: '20px', bottom: '20px' }"
    />
  </div>
</template>

<style scoped>
  .c-img {
    object-fit: cover;
    border-radius: 6px;
  }
  .project-map {
    width: 100%;
    height: 200px;
  }
  .c-delete-btn {
    bottom: 7px;
  }
  .c-edit-btn {
    bottom: 7px;
    right: 50px;
  }
</style>

<style>
  .c-file-tools .p-fileupload-content {
    display: none;
  }
  .c-file-tools .p-fileupload-buttonbar {
    padding: 0;
    border: none;
  }
  .c-upload-dialog {
    width: 50vw;
  }
  .new-address-content .p-autocomplete-input {
    width: 100%;
  }
  .model-dialog {
    width: 50vw;
  }
  @media screen and (max-width: 992px) {
    .c-upload-dialog {
      width: 90vw;
    }
    .model-dialog {
      width: 100vw;
    }
  }
</style>
