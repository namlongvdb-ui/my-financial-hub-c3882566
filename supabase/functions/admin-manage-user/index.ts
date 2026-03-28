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
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user: caller }, error: authError } = await supabaseAdmin.auth.getUser(token)
    if (authError || !caller) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const { data: roleData } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', caller.id)
      .eq('role', 'admin')
      .single()

    if (!roleData) {
      return new Response(JSON.stringify({ error: 'Only admin can manage users' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const { user_id, action } = await req.json()

    if (!user_id || !action) {
      return new Response(JSON.stringify({ error: 'Missing user_id or action' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Prevent managing the default admin account
    const { data: targetProfile } = await supabaseAdmin
      .from('profiles')
      .select('username')
      .eq('user_id', user_id)
      .single()

    if (targetProfile?.username === 'admin') {
      return new Response(JSON.stringify({ error: 'Không thể thao tác trên tài khoản admin mặc định' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    if (action === 'disable') {
      const { error } = await supabaseAdmin.auth.admin.updateUserById(user_id, {
        ban_duration: '876000h', // ~100 years
      })
      if (error) throw error
      return new Response(JSON.stringify({ success: true, message: 'User disabled' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    if (action === 'enable') {
      const { error } = await supabaseAdmin.auth.admin.updateUserById(user_id, {
        ban_duration: 'none',
      })
      if (error) throw error
      return new Response(JSON.stringify({ success: true, message: 'User enabled' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    if (action === 'delete') {
      // Delete related data first
      await supabaseAdmin.from('digital_signatures').delete().eq('user_id', user_id)
      await supabaseAdmin.from('user_roles').delete().eq('user_id', user_id)
      await supabaseAdmin.from('profiles').delete().eq('user_id', user_id)

      const { error } = await supabaseAdmin.auth.admin.deleteUser(user_id)
      if (error) throw error
      return new Response(JSON.stringify({ success: true, message: 'User deleted' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
