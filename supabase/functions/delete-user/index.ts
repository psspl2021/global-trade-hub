import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Create client with user's auth to verify they're an admin
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    })

    // Get the current user
    const { data: { user: currentUser }, error: userError } = await userClient.auth.getUser()
    if (userError || !currentUser) {
      console.error('Auth error:', userError)
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Check if the current user is an admin
    const { data: roleData, error: roleError } = await userClient
      .from('user_roles')
      .select('role')
      .eq('user_id', currentUser.id)
      .eq('role', 'admin')
      .single()

    if (roleError || !roleData) {
      console.error('Not an admin:', roleError)
      return new Response(JSON.stringify({ error: 'Only admins can delete users' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Get the user ID to delete from the request body
    const { userId } = await req.json()
    if (!userId) {
      return new Response(JSON.stringify({ error: 'User ID is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Prevent deleting yourself
    if (userId === currentUser.id) {
      return new Response(JSON.stringify({ error: 'Cannot delete your own account' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Check if the user to delete is also an admin (protect admin accounts)
    const { data: targetRoleData } = await userClient
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .eq('role', 'admin')
      .single()

    if (targetRoleData) {
      return new Response(JSON.stringify({ error: 'Cannot delete admin accounts' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Use service role client to delete related data and the user
    const adminClient = createClient(supabaseUrl, supabaseServiceKey)

    console.log('Deleting user data for:', userId)

    // Delete all related data first (order matters due to foreign keys)
    // These tables reference user_id directly or indirectly
    
    // 1. Delete notifications
    const { error: notifError } = await adminClient
      .from('notifications')
      .delete()
      .eq('user_id', userId)
    if (notifError) console.log('Notifications delete:', notifError.message)

    // 2. Delete TOTP secrets
    const { error: totpError } = await adminClient
      .from('user_totp_secrets')
      .delete()
      .eq('user_id', userId)
    if (totpError) console.log('TOTP delete:', totpError.message)

    // 3. Delete user roles
    const { error: rolesError } = await adminClient
      .from('user_roles')
      .delete()
      .eq('user_id', userId)
    if (rolesError) console.log('Roles delete:', rolesError.message)

    // 4. Delete subscriptions
    const { error: subError } = await adminClient
      .from('subscriptions')
      .delete()
      .eq('user_id', userId)
    if (subError) console.log('Subscriptions delete:', subError.message)

    // 5. Delete documents
    const { error: docsError } = await adminClient
      .from('documents')
      .delete()
      .eq('user_id', userId)
    if (docsError) console.log('Documents delete:', docsError.message)

    // 6. Delete platform invoices
    const { error: invoicesError } = await adminClient
      .from('platform_invoices')
      .delete()
      .eq('user_id', userId)
    if (invoicesError) console.log('Platform invoices delete:', invoicesError.message)

    // 7. Delete profile (profile.id = user.id)
    const { error: profileError } = await adminClient
      .from('profiles')
      .delete()
      .eq('id', userId)
    if (profileError) console.log('Profile delete:', profileError.message)

    console.log('Related data deleted, now deleting auth user:', userId)

    // Delete from auth.users
    const { error: deleteError } = await adminClient.auth.admin.deleteUser(userId)

    if (deleteError) {
      console.error('Delete auth user error:', deleteError)
      return new Response(JSON.stringify({ error: 'Failed to delete user: ' + deleteError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    console.log('User deleted successfully:', userId)

    return new Response(JSON.stringify({ success: true, message: 'User deleted successfully' }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('Error in delete-user function:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
