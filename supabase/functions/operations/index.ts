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

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

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
    const body = req.method === 'POST' || req.method === 'PUT' ? await req.json() : {}

    let result: any

    switch (action) {
      case 'create': {
        const { operation_type, encryption_method, input_file_url, message_embedded, file_id, metadata } = body
        if (!operation_type) throw new Error('Operation type is required')
        const { data, error } = await userClient.from('operations').insert({
          user_id: user.id, operation_type, encryption_method: encryption_method || 'lsb',
          input_file_url, message_embedded, file_id, metadata, status: 'pending'
        }).select().single()
        if (error) throw error

        // Create notification
        await userClient.from('notifications').insert({
          user_id: user.id, operation_id: data.id,
          title: `${operation_type === 'encode' ? 'Encoding' : 'Decoding'} Started`,
          message: `Your ${operation_type} operation has been initiated.`
        })

        result = data
        break
      }

      case 'cancel': {
        const { id } = body
        if (!id) throw new Error('Operation ID required')
        const { data, error } = await userClient.from('operations')
          .update({ status: 'cancelled' })
          .eq('id', id).eq('user_id', user.id)
          .in('status', ['pending', 'processing'])
          .select().single()
        if (error) throw error
        result = data
        break
      }

      case 'track': {
        const opId = url.searchParams.get('id')
        if (!opId) throw new Error('Operation ID required')
        const { data, error } = await userClient.from('operations')
          .select('*').eq('id', opId).eq('user_id', user.id).single()
        if (error) throw error
        result = data
        break
      }

      case 'history': {
        const page = parseInt(url.searchParams.get('page') || '1')
        const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 100)
        const offset = (page - 1) * limit
        const opType = url.searchParams.get('type')
        let q = userClient.from('operations').select('*', { count: 'exact' }).eq('user_id', user.id)
        if (opType) q = q.eq('operation_type', opType)
        const { data, error, count } = await q
          .order('created_at', { ascending: false })
          .range(offset, offset + limit - 1)
        if (error) throw error
        result = { operations: data, total: count, page, limit }
        break
      }

      case 'complete': {
        // Called by system to mark operation as complete
        const { id, output_file_url, processing_time_ms, error_message } = body
        const status = error_message ? 'failed' : 'completed'
        const { data, error } = await supabase.from('operations')
          .update({ status, output_file_url, processing_time_ms, error_message, completed_at: new Date().toISOString() })
          .eq('id', id)
          .select().single()
        if (error) throw error

        // Notify user
        await supabase.from('notifications').insert({
          user_id: data.user_id, operation_id: data.id,
          title: status === 'completed' ? 'Operation Complete' : 'Operation Failed',
          message: status === 'completed'
            ? `Your ${data.operation_type} operation completed successfully.`
            : `Your ${data.operation_type} operation failed: ${error_message}`
        })

        result = data
        break
      }

      case 'notifications': {
        const { data, error } = await userClient.from('notifications')
          .select('*').eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(50)
        if (error) throw error
        result = data
        break
      }

      case 'mark-read': {
        const { id } = body
        const { error } = await userClient.from('notifications')
          .update({ is_read: true })
          .eq('id', id).eq('user_id', user.id)
        if (error) throw error
        result = { message: 'Notification marked as read' }
        break
      }

      case 'mark-all-read': {
        const { error } = await userClient.from('notifications')
          .update({ is_read: true })
          .eq('user_id', user.id).eq('is_read', false)
        if (error) throw error
        result = { message: 'All notifications marked as read' }
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
