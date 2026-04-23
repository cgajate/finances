import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { library } from '@fortawesome/fontawesome-svg-core'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
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
  faClock,
  faCoins,
  faDesktop,
  faDollarSign,
  faFilter,
  faGear,
  faHouse,
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

library.add(
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
  faClock,
  faCoins,
  faDesktop,
  faDollarSign,
  faFilter,
  faGear,
  faHouse,
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
)

const app = createApp(App)
app.component('font-awesome-icon', FontAwesomeIcon)

app.use(createPinia())
app.use(router)

app.mount('#app')
