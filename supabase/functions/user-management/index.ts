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
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Get authenticated user
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
      case 'get-profile': {
        const { data, error } = await userClient.from('profiles').select('*').eq('user_id', user.id).single()
        if (error) throw error
        result = data
        break
      }

      case 'update-profile': {
        const { display_name, username, avatar_url } = body
        const { data, error } = await userClient.from('profiles')
          .update({ display_name, username, avatar_url })
          .eq('user_id', user.id)
          .select()
          .single()
        if (error) throw error
        result = data
        break
      }

      case 'change-password': {
        const { new_password } = body
        if (!new_password || new_password.length < 6) {
          throw new Error('Password must be at least 6 characters')
        }
        const { error } = await supabase.auth.admin.updateUserById(user.id, { password: new_password })
        if (error) throw error
        result = { message: 'Password updated successfully' }
        break
      }

      case 'delete-account': {
        const { error } = await supabase.auth.admin.deleteUser(user.id)
        if (error) throw error
        result = { message: 'Account deleted successfully' }
        break
      }

      case 'get-roles': {
        const { data, error } = await userClient.from('user_roles').select('*').eq('user_id', user.id)
        if (error) throw error
        result = data
        break
      }

      case 'manage-roles': {
        // Admin only
        const { data: roles } = await supabase.from('user_roles').select('role').eq('user_id', user.id)
        const isAdmin = roles?.some(r => r.role === 'admin')
        if (!isAdmin) throw new Error('Admin access required')

        const { target_user_id, role, operation } = body
        if (operation === 'add') {
          const { error } = await supabase.from('user_roles').insert({ user_id: target_user_id, role })
          if (error) throw error
        } else if (operation === 'remove') {
          const { error } = await supabase.from('user_roles').delete()
            .eq('user_id', target_user_id).eq('role', role)
          if (error) throw error
        }
        result = { message: `Role ${operation}ed successfully` }
        break
      }

      case 'view-user': {
        const targetId = url.searchParams.get('target_user_id') || user.id
        const { data, error } = await userClient.from('profiles').select('*').eq('user_id', targetId).single()
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
