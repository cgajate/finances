import { config } from '@vue/test-utils'

// Globally stub font-awesome-icon so tests don't warn about unresolved components
config.global.stubs['font-awesome-icon'] = { template: '<i />' }

