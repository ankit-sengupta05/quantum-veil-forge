import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const userClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_PUBLISHABLE_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )
    const { data: { user }, error: authError } = await userClient.auth.getUser()
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const url = new URL(req.url)
    const action = url.searchParams.get('action')
    const body = req.method === 'POST' || req.method === 'PUT' || req.method === 'DELETE' ? await req.json().catch(() => ({})) : {}

    let result: any

    switch (action) {
      case 'add': {
        const { title, description, file_type, encryption_method, original_file_url, encrypted_file_url, file_size_bytes, category, tags, is_public, metadata } = body
        if (!title) throw new Error('Title is required')
        const { data, error } = await userClient.from('encrypted_files').insert({
          user_id: user.id, title, description, file_type, encryption_method,
          original_file_url, encrypted_file_url, file_size_bytes, category, tags, is_public, metadata
        }).select().single()
        if (error) throw error
        result = data
        break
      }

      case 'edit': {
        const { id, ...updates } = body
        if (!id) throw new Error('File ID is required')
        delete updates.user_id
        const { data, error } = await userClient.from('encrypted_files')
          .update(updates).eq('id', id).eq('user_id', user.id).select().single()
        if (error) throw error
        result = data
        break
      }

      case 'delete': {
        const { id } = body
        if (!id) throw new Error('File ID is required')
        const { error } = await userClient.from('encrypted_files')
          .delete().eq('id', id).eq('user_id', user.id)
        if (error) throw error
        result = { message: 'File deleted successfully' }
        break
      }

      case 'list': {
        const page = parseInt(url.searchParams.get('page') || '1')
        const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 100)
        const offset = (page - 1) * limit
        const { data, error, count } = await userClient.from('encrypted_files')
          .select('*', { count: 'exact' })
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .range(offset, offset + limit - 1)
        if (error) throw error
        result = { files: data, total: count, page, limit }
        break
      }

      case 'search': {
        const query = url.searchParams.get('q') || ''
        const category = url.searchParams.get('category')
        let q = userClient.from('encrypted_files').select('*').eq('user_id', user.id)
        if (query) q = q.or(`title.ilike.%${query}%,description.ilike.%${query}%`)
        if (category) q = q.eq('category', category)
        const { data, error } = await q.order('created_at', { ascending: false })
        if (error) throw error
        result = data
        break
      }

      case 'categories': {
        const { data, error } = await userClient.from('encrypted_files')
          .select('category').eq('user_id', user.id)
        if (error) throw error
        const categories = [...new Set(data?.map(f => f.category).filter(Boolean))]
        result = categories
        break
      }

      case 'review': {
        const { file_id, rating, comment } = body
        if (!file_id || !rating) throw new Error('File ID and rating required')
        const { data, error } = await userClient.from('file_reviews')
          .upsert({ file_id, user_id: user.id, rating, comment }, { onConflict: 'file_id,user_id' })
          .select().single()
        if (error) throw error
        result = data
        break
      }

      case 'get-reviews': {
        const fileId = url.searchParams.get('file_id')
        if (!fileId) throw new Error('File ID required')
        const { data, error } = await userClient.from('file_reviews')
          .select('*, profiles!inner(display_name, avatar_url)')
          .eq('file_id', fileId)
        if (error) throw error
        result = data
        break
      }

      default:
        throw new Error(`Unknown action: ${action}`)
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
