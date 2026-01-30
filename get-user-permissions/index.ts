// @ts-ignore
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.91.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

declare const Deno: any;

Deno.serve(async (req: any) => {
  // Xử lý CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // 1. Lấy biến môi trường
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      console.error('[get-user-permissions] Missing environment variables')
      return new Response(
        JSON.stringify({ error: 'Server configuration error: Missing environment variables' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500 
        }
      )
    }

    // 2. Khởi tạo Supabase client với Service Role Key (để có quyền admin)
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

    // 3. Gọi Auth Admin API để lấy danh sách users
    console.log('[get-user-permissions] Fetching users list...')
    const { data: userData, error: usersError } = await supabase.auth.admin.listUsers()

    if (usersError) {
      console.error('[get-user-permissions] Error listing users:', usersError.message)
      return new Response(
        JSON.stringify({ error: `Auth error: ${usersError.message}` }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500 
        }
      )
    }

    let users = userData?.users || []
    console.log(`[get-user-permissions] Found ${users.length} users.`)

    // FALLBACK: Dữ liệu giả lập nếu không có user nào
    if (users.length === 0) {
      console.log('[get-user-permissions] No users found, using mock data.')
      users = [
        {
          id: 'mock-user-1',
          email: 'demo@example.com',
          created_at: new Date().toISOString(),
          // Các thuộc tính bắt buộc tối thiểu
        } as any
      ]
    }

    // 4. Map dữ liệu để trả về
    const usersWithPermissions = users.map((user: any) => ({
      id: user.id,
      email: user.email || 'No email',
      permissions: [
        { id: 'read', name: 'Đọc', description: 'Xem dữ liệu hệ thống' },
        { id: 'write', name: 'Ghi', description: 'Thêm/Sửa dữ liệu' },
        { id: 'delete', name: 'Xóa', description: 'Xóa dữ liệu' }
      ]
    }))

    // 5. Trả về kết quả thành công
    return new Response(JSON.stringify(usersWithPermissions), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error: any) {
    // 6. Bắt lỗi không mong muốn
    console.error('[get-user-permissions] Unexpected error:', error.message)
    return new Response(
      JSON.stringify({ error: error.message || 'Internal Server Error' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})