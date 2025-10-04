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

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const storeId = formData.get('storeId') as string | null;

    if (!file || !storeId) {
      return new Response(
        JSON.stringify({ error: 'file atau storeId tidak ditemukan' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // Ensure bucket exists
    const bucketId = 'store-assets';
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

    const fileExt = file.name.includes('.') ? file.name.split('.').pop() : 'png';
    const path = `qris/${storeId}-qris-${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from(bucketId)
      .upload(path, file, { contentType: file.type || 'image/png', upsert: true });

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