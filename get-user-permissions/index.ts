/// <reference lib="dom" />
/// <reference lib="dom.iterable" />
/// <reference lib="deno.ns" />

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.91.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

addEventListener('fetch', (event: any) => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(req: Request) {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      console.error('[get-user-permissions] Supabase URL or Service Role Key not set.')
      return new Response(JSON.stringify({ error: 'Supabase URL or Service Role Key not set.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

    // Lấy danh sách người dùng
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers()

    if (usersError) {
      console.error('[get-user-permissions] Error listing users:', usersError.message)
      return new Response(JSON.stringify({ error: usersError.message }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      })
    }

    // Tạo danh sách quyền giả định cho mỗi người dùng
    const usersWithPermissions = users.users.map(user => ({
      id: user.id,
      email: user.email,
      permissions: [
        { id: 'read', name: 'Đọc', description: 'Quyền đọc dữ liệu' },
        { id: 'write', name: 'Viết', description: 'Quyền viết dữ liệu' },
        { id: 'delete', name: 'Xóa', description: 'Quyền xóa dữ liệu' }
      ]
    }))

    console.log('[get-user-permissions] Successfully fetched user permissions.')
    return new Response(JSON.stringify(usersWithPermissions), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error: any) {
    console.error('[get-user-permissions] Unexpected error:', error.message)
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
}