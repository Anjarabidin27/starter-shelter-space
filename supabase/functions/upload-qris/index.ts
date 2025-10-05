import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
    const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    const bucketId = 'store-assets';

    // Helper: ensure bucket exists and is public
    const { data: bucket } = await supabase.storage.getBucket(bucketId);
    if (!bucket) {
      const { error: bucketErr } = await supabase.storage.createBucket(bucketId, { public: true });
      if (bucketErr) {
        console.error('Create bucket error:', bucketErr);
        return new Response(
          JSON.stringify({ error: 'Gagal menyiapkan bucket penyimpanan' }),
          { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        );
      }
    }

    const contentType = req.headers.get('content-type') || '';

    let storeId: string | null = null;
    let uploadFile: File | null = null;

    if (contentType.includes('application/json')) {
      // JSON fallback path: expect base64 data
      const body = await req.json();
      storeId = body?.storeId ?? null;
      const base64 = body?.file_base64 as string | undefined;
      const filename = (body?.filename as string | undefined) || 'qris.png';
      const mime = (body?.mime as string | undefined) || 'image/png';

      if (!base64 || !storeId) {
        return new Response(
          JSON.stringify({ error: 'file_base64 atau storeId tidak ditemukan' }),
          { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        );
      }

      // Decode base64 to Uint8Array
      const binaryString = atob(base64);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) bytes[i] = binaryString.charCodeAt(i);
      const blob = new Blob([bytes], { type: mime });
      uploadFile = new File([blob], filename, { type: mime });
    } else {
      // Default path: multipart/form-data
      const formData = await req.formData();
      uploadFile = formData.get('file') as File | null;
      storeId = formData.get('storeId') as string | null;
    }

    if (!uploadFile || !storeId) {
      return new Response(
        JSON.stringify({ error: 'file atau storeId tidak ditemukan' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    const fileExt = uploadFile.name.includes('.') ? uploadFile.name.split('.').pop() : 'png';
    const path = `qris/${storeId}-qris-${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from(bucketId)
      .upload(path, uploadFile, { contentType: uploadFile.type || 'image/png', upsert: true });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return new Response(
        JSON.stringify({ error: 'Gagal mengupload ke penyimpanan' }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    const { data: { publicUrl } } = supabase.storage.from(bucketId).getPublicUrl(path);

    return new Response(
      JSON.stringify({ publicUrl }),
      { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  } catch (e) {
    console.error('upload-qris error:', e);
    return new Response(
      JSON.stringify({ error: 'Terjadi kesalahan server' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
});