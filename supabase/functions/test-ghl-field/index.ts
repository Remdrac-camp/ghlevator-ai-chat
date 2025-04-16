
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { locationId, ghlApiKey, fieldKey } = await req.json()

    if (!locationId || !ghlApiKey || !fieldKey) {
      throw new Error('Missing required parameters')
    }

    // Appel à l'API GoHighLevel pour récupérer les custom values
    const response = await fetch(`https://services.leadconnectorhq.com/locations/${locationId}/customValues`, {
      headers: {
        'Authorization': `Bearer ${ghlApiKey}`,
        'Version': '2021-07-28',
        'Accept': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`GHL API error: ${response.statusText}`)
    }

    const data = await response.json()
    console.log('GHL API response:', data)

    // Recherche de la valeur correspondant à la clé
    const customValue = data.customValues?.find((cv: any) => cv.key === fieldKey)
    
    return new Response(
      JSON.stringify({
        value: customValue?.value || null,
        found: !!customValue
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  } catch (error) {
    console.error('Error in test-ghl-field function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  }
})
