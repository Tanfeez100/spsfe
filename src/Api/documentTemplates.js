import api, { normalizeApiError } from './auth'

/**
 * Fetch all active templates and customizations for all 4 document categories
 */
export const getDocumentTemplates = async () => {
  try {
    const response = await api.get('/api/document-templates')
    return response.data?.data || response.data
  } catch (error) {
    // If backend is unreachable or offline, return fallback configuration
    console.warn('Could not fetch remote document templates, using offline cache/defaults:', error?.message)
    try {
      const cached = localStorage.getItem('sps_document_templates_config')
      if (cached) return JSON.parse(cached)
    } catch {
      // ignore
    }
    throw normalizeApiError(error, 'Failed to fetch document templates')
  }
}

/**
 * Select active template for a category
 * @param {string} category - 'id_card' | 'admit_card' | 'transfer_certificate' | 'marksheet'
 * @param {string} templateId - e.g. 'id_card_modern_blue'
 */
export const selectActiveTemplate = async (category, templateId) => {
  try {
    const response = await api.post('/api/document-templates/select', {
      category,
      templateId,
    })
    return response.data
  } catch (error) {
    throw normalizeApiError(error, `Failed to activate template for ${category}`)
  }
}

/**
 * Customize template styling and settings
 * @param {string} category - 'id_card' | 'admit_card' | 'transfer_certificate' | 'marksheet'
 * @param {object} customization - { primaryColor, secondaryColor, schoolName, ... }
 */
export const customizeTemplate = async (category, customization) => {
  try {
    const response = await api.post('/api/document-templates/customize', {
      category,
      customization,
    })
    return response.data
  } catch (error) {
    throw normalizeApiError(error, `Failed to customize template for ${category}`)
  }
}

/**
 * Reset template to factory defaults
 * @param {string} category - 'id_card' | 'admit_card' | 'transfer_certificate' | 'marksheet'
 */
export const resetTemplateDefaults = async (category) => {
  try {
    const response = await api.post('/api/document-templates/reset', {
      category,
    })
    return response.data
  } catch (error) {
    throw normalizeApiError(error, `Failed to reset template for ${category}`)
  }
}

export default {
  getDocumentTemplates,
  selectActiveTemplate,
  customizeTemplate,
  resetTemplateDefaults,
}
