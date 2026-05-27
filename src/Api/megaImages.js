import api from './auth'

// MEGA Images APIs
// Based on your Postman collection:
// - POST   /mega/images?public=false (form-data: image)
// - POST   /mega/images/bulk?public=false (form-data: images[])
// - GET    /mega/images?public=false&includeLinks=true
// - DELETE /mega/images/:nodeId

const toMessage = (error) => {
  const data = error?.response?.data
  if (typeof data === 'string') return data
  if (data?.message) return data.message
  if (data?.error) return data.error
  return error?.message || 'Request failed'
}

export const uploadSingleImage = async (file, { isPublic = false, provider = 'cloudinary' } = {}) => {
  try {
    const formData = new FormData()
    formData.append('image', file)

    const response = await api.post('/api/mega/images', formData, {
      params: { public: isPublic ? 'true' : 'false', provider },
    })
    return response.data
  } catch (error) {
    throw toMessage(error)
  }
}

export const uploadBulkImages = async (files, { isPublic = false, provider = 'cloudinary' } = {}) => {
  try {
    const formData = new FormData()
    Array.from(files || []).forEach((f) => formData.append('images', f))

    const response = await api.post('/api/mega/images/bulk', formData, {
      params: { public: isPublic ? 'true' : 'false', provider },
    })
    return response.data
  } catch (error) {
    throw toMessage(error)
  }
}

export const listImages = async ({ isPublic = false, includeLinks = true } = {}) => {
  try {
    const response = await api.get('/api/mega/images', {
      params: { public: isPublic ? 'true' : 'false', includeLinks: includeLinks ? 'true' : 'false' },
    })
    return response.data
  } catch (error) {
    throw toMessage(error)
  }
}

export const deleteImage = async (nodeId) => {
  try {
    const response = await api.delete(`/api/mega/images/${nodeId}`)
    return response.data
  } catch (error) {
    throw toMessage(error)
  }
}

export default { uploadSingleImage, uploadBulkImages, listImages, deleteImage }


