export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // CORS 헤더
    const corsHeaders = {
      'Access-Control-Allow-Origin': 'https://house-of-jung.github.io',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    // OPTIONS 요청 처리
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 200, headers: corsHeaders });
    }

    // Supabase 설정
    const SUPABASE_URL = env.SUPABASE_URL;
    const SUPABASE_ANON_KEY = env.SUPABASE_ANON_KEY;

    const supabaseHeaders = {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json'
    };

    try {
      // 루트 엔드포인트
      if (url.pathname === '/' && request.method === 'GET') {
        return new Response('Worker is running', {
          status: 200,
          headers: corsHeaders
        });
      }

      // 회원가입 엔드포인트
      if (url.pathname === '/signup' && request.method === 'POST') {
        const { email, password } = await request.json();
        
        const signupResponse = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
          method: 'POST',
          headers: supabaseHeaders,
          body: JSON.stringify({
            email,
            password,
            options: {
              emailRedirectTo: 'https://house-of-jung.github.io/memorial/'
            }
          })
        });

        const signupData = await signupResponse.json();

        if (!signupResponse.ok) {
          return new Response(JSON.stringify({ error: signupData.error?.message || '회원가입 실패' }), { 
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        return new Response(JSON.stringify({ 
          message: '이메일 인증 링크가 발송되었습니다.',
          user: signupData.user
        }), { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // 로그인 엔드포인트
      if (url.pathname === '/signin' && request.method === 'POST') {
        const { email, password } = await request.json();
        
        const signinResponse = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
          method: 'POST',
          headers: supabaseHeaders,
          body: JSON.stringify({
            email,
            password
          })
        });

        const signinData = await signinResponse.json();

        if (!signinResponse.ok) {
          return new Response(JSON.stringify({ error: signinData.error?.message || '로그인 실패' }), { 
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        return new Response(JSON.stringify({
          message: '로그인 성공',
          access_token: signinData.access_token,
          user: signinData.user
        }), { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // 추억 저장 엔드포인트 (인증 필요)
      if (url.pathname === '/submit-memory' && request.method === 'POST') {
        const authHeader = request.headers.get('Authorization');
        
        if (!authHeader) {
          return new Response(JSON.stringify({ error: '인증 토큰이 필요합니다' }), {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        const token = authHeader.replace('Bearer ', '');
        
        // 토큰 검증
        const userResponse = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
          headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!userResponse.ok) {
          return new Response(JSON.stringify({ error: '유효하지 않은 토큰입니다' }), {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        const userData = await userResponse.json();
        const user = userData;

        const { content, author } = await request.json();
        
        // memories 테이블에 데이터 삽입
        const insertResponse = await fetch(`${SUPABASE_URL}/rest/v1/memories`, {
          method: 'POST',
          headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
          },
          body: JSON.stringify({
            user_id: user.id,
            content,
            author: author || user.email,
            email: user.email,
            created_at: new Date().toISOString()
          })
        });

        if (!insertResponse.ok) {
          const errorData = await insertResponse.json();
          return new Response(JSON.stringify({ error: errorData.message || '데이터 저장 실패' }), { 
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        const insertData = await insertResponse.json();

        return new Response(JSON.stringify({ 
          message: '추억이 저장되었습니다.',
          memory: insertData[0]
        }), { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // 추억 목록 조회 엔드포인트 (인증 불필요)
      if (url.pathname === '/memories' && request.method === 'GET') {
        const memoriesResponse = await fetch(`${SUPABASE_URL}/rest/v1/memories?select=*&order=created_at.desc`, {
          headers: supabaseHeaders
        });

        if (!memoriesResponse.ok) {
          const errorData = await memoriesResponse.json();
          return new Response(JSON.stringify({ error: errorData.message || '데이터 조회 실패' }), { 
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        const memoriesData = await memoriesResponse.json();

        return new Response(JSON.stringify({ 
          memories: memoriesData 
        }), { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // 사용자 프로필 조회 엔드포인트
      if (url.pathname === '/profile' && request.method === 'GET') {
        const authHeader = request.headers.get('Authorization');
        
        if (!authHeader) {
          return new Response(JSON.stringify({ error: '인증 토큰이 필요합니다' }), {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        const token = authHeader.replace('Bearer ', '');
        
        const userResponse = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
          headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!userResponse.ok) {
          return new Response(JSON.stringify({ error: '유효하지 않은 토큰입니다' }), {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        const user = await userResponse.json();

        return new Response(JSON.stringify({ user }), { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // 404 처리
      return new Response('Not Found', { 
        status: 404,
        headers: corsHeaders
      });

    } catch (error) {
      console.error('Worker error:', error);

      return new Response(JSON.stringify({ 
        error: '서버 오류가 발생했습니다.' 
      }), { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  },
};