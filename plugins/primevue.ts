// import define nuxt plugin function
// import primevue plugin function
import PrimeVue from 'primevue/config'

// import prime vue directives
import StyleClass from 'primevue/styleclass'
import Ripple from 'primevue/ripple'
import Badge from 'primevue/badge'
import Tooltip from 'primevue/tooltip'

// import prime vue components
import Toast from 'primevue/toast'
import Button from 'primevue/button'
import ProgressSpinner from 'primevue/progressspinner'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import RadioButton from 'primevue/radiobutton'
import InputText from 'primevue/inputtext'
import Dialog from 'primevue/dialog'
import InputSwitch from 'primevue/inputswitch'
import ProgressBar from 'primevue/progressbar'
import TabView from 'primevue/tabview'
import TabPanel from 'primevue/tabpanel'
import Dropdown from 'primevue/dropdown'
import Menu from 'primevue/menu'
import Toolbar from 'primevue/toolbar'
import Textarea from 'primevue/textarea'
import FileUpload from 'primevue/fileupload'
import AutoComplete from 'primevue/autocomplete'
import SpeedDial from 'primevue/speeddial'
import Avatar from 'primevue/avatar'
import Divider from 'primevue/divider'
import ToggleButton from 'primevue/togglebutton'

// import prime vue services
import ToastService from 'primevue/toastservice'
import { defineNuxtPlugin } from '#app'

// import language translation
import { lang } from '~/utils/lang'

// export prime vue plugin
export default defineNuxtPlugin((nuxtApp) => {
  // initialice prime vue
  nuxtApp.vueApp.use(PrimeVue, {
    ripple: true,
    StyleClass,
    locale: lang,
  })
  // initialice prime vue services
  nuxtApp.vueApp.use(ToastService)
  // load prime vue directives
  nuxtApp.vueApp.directive('styleclass', StyleClass)
  nuxtApp.vueApp.directive('ripple', Ripple)
  nuxtApp.vueApp.directive('tooltip', Tooltip)
  // @ts-expect-error: Badge is not a valid directive
  nuxtApp.vueApp.directive('badge', Badge)
  // load prime vue components
  nuxtApp.vueApp.component('Toast', Toast)
  nuxtApp.vueApp.component('Button', Button)
  nuxtApp.vueApp.component('ProgressSpinner', ProgressSpinner)
  nuxtApp.vueApp.component('DataTable', DataTable)
  nuxtApp.vueApp.component('Column', Column)
  nuxtApp.vueApp.component('RadioButton', RadioButton)
  nuxtApp.vueApp.component('InputText', InputText)
  nuxtApp.vueApp.component('Dialog', Dialog)
  nuxtApp.vueApp.component('InputSwitch', InputSwitch)
  nuxtApp.vueApp.component('ProgressBar', ProgressBar)
  nuxtApp.vueApp.component('TabView', TabView)
  nuxtApp.vueApp.component('TabPanel', TabPanel)
  nuxtApp.vueApp.component('Dropdown', Dropdown)
  nuxtApp.vueApp.component('Menu', Menu)
  nuxtApp.vueApp.component('Toolbar', Toolbar)
  nuxtApp.vueApp.component('Textarea', Textarea)
  nuxtApp.vueApp.component('FileUpload', FileUpload)
  nuxtApp.vueApp.component('AutoComplete', AutoComplete)
  nuxtApp.vueApp.component('SpeedDial', SpeedDial)
  nuxtApp.vueApp.component('Avatar', Avatar)
  nuxtApp.vueApp.component('Divider', Divider)
  nuxtApp.vueApp.component('ToggleButton', ToggleButton)
  // other components that you need
})
