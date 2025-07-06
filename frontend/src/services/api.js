const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

class ApiService {
  async request(endpoint, options = {}) {
    const url = `${API_BASE}${endpoint}`
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    }

    if (config.body && typeof config.body === 'object') {
      config.body = JSON.stringify(config.body)
    }

    try {
      const response = await fetch(url, config)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Request failed')
      }

      return data
    } catch (error) {
      console.error('API Request failed:', error)
      throw error
    }
  }

  // Poll endpoints
  async getPolls() {
    return this.request('/polls')
  }

  async getPoll(id) {
    return this.request(`/polls/${id}`)
  }

  async createPoll(pollData) {
    return this.request('/polls', {
      method: 'POST',
      body: pollData,
    })
  }

  async endPoll(pollId) {
    return this.request(`/polls/${pollId}/end`, {
      method: 'POST',
    })
  }

  async getPollResults(pollId) {
    return this.request(`/polls/${pollId}/results`)
  }

  // Student endpoints
  async joinAsStudent(name) {
    return this.request('/students/join', {
      method: 'POST',
      body: { name },
    })
  }

  async submitVote(voteData) {
    return this.request('/students/vote', {
      method: 'POST',
      body: voteData,
    })
  }

  // Chat endpoints
  async getChatMessages() {
    return this.request('/chat/messages')
  }

  async sendMessage(messageData) {
    return this.request('/chat/message', {
      method: 'POST',
      body: messageData,
    })
  }
}

export default new ApiService()