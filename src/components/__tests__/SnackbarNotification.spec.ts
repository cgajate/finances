import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { ref } from 'vue'
import SnackbarNotification from '@/components/SnackbarNotification.vue'

const mockItems = ref<any[]>([])
const mockUndo = vi.fn()
const mockDismiss = vi.fn()

vi.mock('@/composables/useSnackbar', () => ({
  useSnackbar: () => ({
    items: mockItems,
    undo: mockUndo,
    dismiss: mockDismiss,
  }),
}))

describe('SnackbarNotification', () => {
  beforeEach(() => {
    mockItems.value = []
    vi.clearAllMocks()
  })

  function mountSnackbar() {
    return mount(SnackbarNotification, {
      global: {
        stubs: { Teleport: true },
      },
    })
  }

  it('renders no snackbars when items is empty', () => {
    const wrapper = mountSnackbar()
    expect(wrapper.findAll('.snackbar')).toHaveLength(0)
  })

  it('renders snackbar with message', () => {
    mockItems.value = [{ id: 1, message: 'Hello!', copyText: null, undoFn: null }]
    const wrapper = mountSnackbar()
    expect(wrapper.find('.snackbar-message').text()).toBe('Hello!')
  })

  it('shows copy button when copyText set', () => {
    mockItems.value = [{ id: 1, message: 'Code', copyText: 'ABC', undoFn: null }]
    const wrapper = mountSnackbar()
    expect(wrapper.find('.snackbar-copy').exists()).toBe(true)
  })

  it('does not show copy button when no copyText', () => {
    mockItems.value = [{ id: 1, message: 'No copy', copyText: null, undoFn: null }]
    const wrapper = mountSnackbar()
    expect(wrapper.find('.snackbar-copy').exists()).toBe(false)
  })

  it('shows undo button when undoFn set', () => {
    mockItems.value = [{ id: 1, message: 'Undo me', copyText: null, undoFn: () => {} }]
    const wrapper = mountSnackbar()
    expect(wrapper.find('.snackbar-undo').exists()).toBe(true)
  })

  it('does not show undo when no undoFn', () => {
    mockItems.value = [{ id: 1, message: 'No undo', copyText: null, undoFn: null }]
    const wrapper = mountSnackbar()
    expect(wrapper.find('.snackbar-undo').exists()).toBe(false)
  })

  it('calls undo on undo click', async () => {
    mockItems.value = [{ id: 42, message: 'Undo me', copyText: null, undoFn: () => {} }]
    const wrapper = mountSnackbar()
    await wrapper.find('.snackbar-undo').trigger('click')
    expect(mockUndo).toHaveBeenCalledWith(42)
  })

  it('calls dismiss on close click', async () => {
    mockItems.value = [{ id: 7, message: 'Close me', copyText: null, undoFn: null }]
    const wrapper = mountSnackbar()
    await wrapper.find('.snackbar-close').trigger('click')
    expect(mockDismiss).toHaveBeenCalledWith(7)
  })

  it('copy button calls clipboard API', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.assign(navigator, { clipboard: { writeText } })
    mockItems.value = [{ id: 1, message: 'Copy', copyText: 'XYZ', undoFn: null }]
    const wrapper = mountSnackbar()
    await wrapper.find('.snackbar-copy').trigger('click')
    expect(writeText).toHaveBeenCalledWith('XYZ')
  })

  it('copy button handles clipboard failure gracefully', async () => {
    const writeText = vi.fn().mockRejectedValue(new Error('fail'))
    Object.assign(navigator, { clipboard: { writeText } })
    mockItems.value = [{ id: 1, message: 'Copy', copyText: 'XYZ', undoFn: null }]
    const wrapper = mountSnackbar()
    await wrapper.find('.snackbar-copy').trigger('click')
    // Should not throw
    expect(writeText).toHaveBeenCalled()
  })

  it('renders multiple snackbars', () => {
    mockItems.value = [
      { id: 1, message: 'First', copyText: null, undoFn: null },
      { id: 2, message: 'Second', copyText: null, undoFn: null },
    ]
    const wrapper = mountSnackbar()
    expect(wrapper.findAll('.snackbar')).toHaveLength(2)
  })
})

