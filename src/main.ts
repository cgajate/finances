import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { library } from '@fortawesome/fontawesome-svg-core'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { faGoogle } from '@fortawesome/free-brands-svg-icons'
import {
  faArrowDown,
  faArrowDownAZ,
  faArrowLeft,
  faArrowRight,
  faArrowUp,
  faArrowUpWideShort,
  faBars,
  faBell,
  faBullseye,
  faCalendar,
  faCalendarDay,
  faCalendarDays,
  faChartLine,
  faCheck,
  faChevronDown,
  faChevronLeft,
  faChevronRight,
  faChevronUp,
  faCircleCheck,
  faCircleExclamation,
  faCircleHalfStroke,
  faClipboardCheck,
  faClock,
  faCoins,
  faCreditCard,
  faDesktop,
  faDollarSign,
  faFileCsv,
  faFileImport,
  faFilter,
  faGear,
  faHouse,
  faLandmark,
  faLink,
  faMagnifyingGlass,
  faMoneyBillTransfer,
  faMoneyBillWave,
  faMoon,
  faNoteSticky,
  faPalette,
  faPen,
  faPlus,
  faRightFromBracket,
  faRightToBracket,
  faRotateLeft,
  faScaleBalanced,
  faSpinner,
  faSun,
  faTag,
  faTags,
  faTowerBroadcast,
  faTrash,
  faTriangleExclamation,
  faTrophy,
  faUser,
  faUsers,
  faVolumeXmark,
  faXmark,
  faCircleXmark,
} from '@fortawesome/free-solid-svg-icons'

import App from './App.vue'
import router from './router'
import './assets/main.css'
import './assets/buttons.scss'
import './assets/_layout.scss'
import './assets/_forms.scss'
import './assets/_badges.scss'
import './assets/_cards.scss'
import './assets/_list-items.scss'
import './assets/_utilities.scss'
import './assets/_bubble.scss'

library.add(
  faGoogle,
  faArrowDown,
  faArrowDownAZ,
  faArrowLeft,
  faArrowRight,
  faArrowUp,
  faArrowUpWideShort,
  faBars,
  faBell,
  faBullseye,
  faCalendar,
  faCalendarDay,
  faCalendarDays,
  faChartLine,
  faCheck,
  faChevronDown,
  faChevronLeft,
  faChevronRight,
  faChevronUp,
  faCircleCheck,
  faCircleExclamation,
  faCircleHalfStroke,
  faClipboardCheck,
  faClock,
  faCoins,
  faCreditCard,
  faDesktop,
  faDollarSign,
  faFileCsv,
  faFileImport,
  faFilter,
  faGear,
  faHouse,
  faLandmark,
  faLink,
  faMagnifyingGlass,
  faMoneyBillTransfer,
  faMoneyBillWave,
  faMoon,
  faNoteSticky,
  faPalette,
  faPen,
  faPlus,
  faRightFromBracket,
  faRightToBracket,
  faRotateLeft,
  faScaleBalanced,
  faSpinner,
  faSun,
  faTag,
  faTags,
  faTowerBroadcast,
  faTrash,
  faTriangleExclamation,
  faTrophy,
  faUser,
  faUsers,
  faVolumeXmark,
  faXmark,
  faCircleXmark,
)

const app = createApp(App)
app.component('font-awesome-icon', FontAwesomeIcon)

app.use(createPinia())
app.use(router)

app.mount('#app')
