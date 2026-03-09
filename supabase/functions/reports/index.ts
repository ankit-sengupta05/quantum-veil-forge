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

    let result: any

    switch (action) {
      case 'activity-log': {
        const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 200)
        const activityType = url.searchParams.get('type')
        let q = userClient.from('activity_logs').select('*').eq('user_id', user.id)
        if (activityType) q = q.eq('activity_type', activityType)
        const { data, error } = await q.order('created_at', { ascending: false }).limit(limit)
        if (error) throw error
        result = data
        break
      }

      case 'log-activity': {
        const body = await req.json()
        const { activity_type, description, metadata } = body
        if (!activity_type) throw new Error('Activity type required')
        const { data, error } = await userClient.from('activity_logs').insert({
          user_id: user.id, activity_type, description, metadata
        }).select().single()
        if (error) throw error
        result = data
        break
      }

      case 'usage-stats': {
        const days = parseInt(url.searchParams.get('days') || '30')
        const since = new Date()
        since.setDate(since.getDate() - days)
        const { data, error } = await userClient.from('usage_statistics')
          .select('*').eq('user_id', user.id)
          .gte('date', since.toISOString().split('T')[0])
          .order('date', { ascending: true })
        if (error) throw error
        result = data
        break
      }

      case 'operations-summary': {
        const days = parseInt(url.searchParams.get('days') || '30')
        const since = new Date()
        since.setDate(since.getDate() - days)

        const { data: operations, error } = await userClient.from('operations')
          .select('operation_type, status, created_at, processing_time_ms')
          .eq('user_id', user.id)
          .gte('created_at', since.toISOString())

        if (error) throw error

        const summary = {
          total: operations?.length || 0,
          encode_count: operations?.filter(o => o.operation_type === 'encode').length || 0,
          decode_count: operations?.filter(o => o.operation_type === 'decode').length || 0,
          completed: operations?.filter(o => o.status === 'completed').length || 0,
          failed: operations?.filter(o => o.status === 'failed').length || 0,
          avg_processing_time: operations?.filter(o => o.processing_time_ms)
            .reduce((sum, o) => sum + (o.processing_time_ms || 0), 0) / 
            (operations?.filter(o => o.processing_time_ms).length || 1),
        }
        result = summary
        break
      }

      case 'file-stats': {
        const { data: files, error } = await userClient.from('encrypted_files')
          .select('file_type, encryption_method, file_size_bytes, created_at')
          .eq('user_id', user.id)

        if (error) throw error

        const byType: Record<string, number> = {}
        const byMethod: Record<string, number> = {}
        let totalSize = 0

        files?.forEach(f => {
          byType[f.file_type] = (byType[f.file_type] || 0) + 1
          byMethod[f.encryption_method] = (byMethod[f.encryption_method] || 0) + 1
          totalSize += f.file_size_bytes || 0
        })

        result = { total_files: files?.length || 0, total_size_bytes: totalSize, by_type: byType, by_method: byMethod }
        break
      }

      case 'daily-stats': {
        const date = url.searchParams.get('date') || new Date().toISOString().split('T')[0]
        const { data, error } = await userClient.from('usage_statistics')
          .select('*').eq('user_id', user.id).eq('date', date).single()
        if (error && error.code !== 'PGRST116') throw error
        result = data || { encode_count: 0, decode_count: 0, files_uploaded: 0, storage_used_bytes: 0 }
        break
      }

      case 'monthly-stats': {
        const year = parseInt(url.searchParams.get('year') || new Date().getFullYear().toString())
        const month = parseInt(url.searchParams.get('month') || (new Date().getMonth() + 1).toString())
        const startDate = `${year}-${String(month).padStart(2, '0')}-01`
        const endDate = month === 12 ? `${year + 1}-01-01` : `${year}-${String(month + 1).padStart(2, '0')}-01`

        const { data, error } = await userClient.from('usage_statistics')
          .select('*').eq('user_id', user.id)
          .gte('date', startDate).lt('date', endDate)
          .order('date', { ascending: true })
        if (error) throw error

        const totals = data?.reduce((acc, d) => ({
          encode_count: acc.encode_count + d.encode_count,
          decode_count: acc.decode_count + d.decode_count,
          files_uploaded: acc.files_uploaded + d.files_uploaded,
        }), { encode_count: 0, decode_count: 0, files_uploaded: 0 })

        result = { daily: data, totals }
        break
      }

      case 'export': {
        const format = url.searchParams.get('format') || 'json'
        const { data: operations } = await userClient.from('operations')
          .select('*').eq('user_id', user.id).order('created_at', { ascending: false })
        const { data: files } = await userClient.from('encrypted_files')
          .select('*').eq('user_id', user.id)
        const { data: activities } = await userClient.from('activity_logs')
          .select('*').eq('user_id', user.id).order('created_at', { ascending: false })

        const report = { generated_at: new Date().toISOString(), operations, files, activities }

        if (format === 'csv') {
          const csvRows = ['type,id,status,created_at']
          operations?.forEach(o => csvRows.push(`operation,${o.id},${o.status},${o.created_at}`))
          files?.forEach(f => csvRows.push(`file,${f.id},active,${f.created_at}`))
          return new Response(csvRows.join('\n'), {
            headers: { ...corsHeaders, 'Content-Type': 'text/csv', 'Content-Disposition': 'attachment; filename=report.csv' }
          })
        }

        result = report
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
