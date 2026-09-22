import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://rshigflhanzjrqeoynpa.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJzaGlnZmxoYW56anJxZW95bnBhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzNDIxOTcsImV4cCI6MjA4MzkxODE5N30.49JJ_nlcby45UlkpcRFJQETTM4ocbmGX2OYGN6z7z5g'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// Analytics API
export const analytics = {
  // Track a plugin download
  async trackDownload(pluginId, pluginName) {
    try {
      const { data, error } = await supabase
        . from('plugin_downloads')
        .insert([
          {
            plugin_id: pluginId,
            plugin_name:  pluginName,
            downloaded_at: new Date().toISOString(),
            user_agent: navigator.userAgent,
            referrer: document.referrer || 'direct'
          }
        ])
      
      if (error) throw error
      return { success: true, data }
    } catch (err) {
      console.error('Error tracking download:', err)
      return { success:  false, error: err }
    }
  },

  // Get download count for a specific plugin
  async getDownloadCount(pluginId) {
    try {
      const { count, error } = await supabase
        .from('plugin_downloads')
        .select('*', { count: 'exact', head: true })
        .eq('plugin_id', pluginId)
      
      if (error) throw error
      return count || 0
    } catch (err) {
      console.error('Error getting download count:', err)
      return 0
    }
  },

  // Get all plugin statistics
  async getAllStats() {
    try {
      const { data, error } = await supabase
        .from('plugin_stats')
        .select('*')
      
      if (error) throw error
      return data || []
    } catch (err) {
      console.error('Error getting all stats:', err)
      return []
    }
  }
}

// Reviews API
export const reviews = {
  // Submit a new review
  async submitReview(pluginId, pluginName, userName, rating, comment) {
    try {
      const { data, error } = await supabase
        . from('plugin_reviews')
        .insert([
          {
            plugin_id: pluginId,
            plugin_name: pluginName,
            user_name:  userName,
            rating: rating,
            comment: comment,
            created_at: new Date().toISOString()
          }
        ])
      
      if (error) throw error
      return { success: true, data }
    } catch (err) {
      console.error('Error submitting review:', err)
      return { success:  false, error: err }
    }
  },

  // Get reviews for a specific plugin
  async getReviews(pluginId, limit = 10, offset = 0) {
    try {
      const { data, error } = await supabase
        .from('plugin_reviews')
        .select('*')
        .eq('plugin_id', pluginId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)
      
      if (error) throw error
      return data || []
    } catch (err) {
      console.error('Error getting reviews:', err)
      return []
    }
  },

  // Get review statistics for a plugin
  async getReviewStats(pluginId) {
    try {
      const { data, error } = await supabase
        .from('plugin_reviews')
        .select('rating')
        .eq('plugin_id', pluginId)
      
      if (error) throw error
      
      if (! data || data.length === 0) {
        return {
          count: 0,
          average:  0,
          distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
        }
      }
      
      // Calculate statistics
      const ratings = data.map(r => r.rating)
      const sum = ratings.reduce((a, b) => a + b, 0)
      const average = (sum / ratings.length).toFixed(1)
      
      // Calculate distribution
      const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
      ratings.forEach(rating => {
        distribution[rating]++
      })
      
      return {
        count: ratings.length,
        average: parseFloat(average),
        distribution
      }
    } catch (err) {
      console.error('Error getting review stats:', err)
      return {
        count: 0,
        average: 0,
        distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
      }
    }
  },

  // Mark a review as helpful
  async markHelpful(reviewId) {
    try {
      const { data, error } = await supabase
        .rpc('increment_helpful_count', { review_id: reviewId })
      
      if (error) throw error
      return { success: true, data }
    } catch (err) {
      console.error('Error marking review as helpful:', err)
      return { success: false, error: err }
    }
  }
}
