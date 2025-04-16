
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

    console.log(`Fetching custom values for location ${locationId}`)
    console.log(`Looking for field key: ${fieldKey}`)

    // Appel à l'API GoHighLevel pour récupérer les custom values
    const response = await fetch(`https://services.leadconnectorhq.com/locations/${locationId}/customValues`, {
      headers: {
        'Authorization': `Bearer ${ghlApiKey}`,
        'Version': '2021-07-28',
        'Accept': 'application/json',
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`GHL API error: ${response.status} ${response.statusText}`, errorText)
      throw new Error(`GHL API error: ${response.statusText} (${response.status})`)
    }

    const data = await response.json()
    console.log('GHL API response:', JSON.stringify(data))

    // Recherche de la valeur correspondant à la clé exacte
    let customValue = data.customValues?.find((cv: any) => cv.key === fieldKey)
    
    // Si on ne trouve pas avec la clé exacte, essayons de chercher par nom si fieldKey contient des espaces
    if (!customValue && fieldKey.includes(' ')) {
      customValue = data.customValues?.find((cv: any) => 
        cv.name.toLowerCase() === fieldKey.toLowerCase() || 
        cv.key.toLowerCase().includes(fieldKey.toLowerCase())
      )
    }
    
    // Si on ne trouve toujours pas, essayons avec une recherche partielle
    if (!customValue) {
      customValue = data.customValues?.find((cv: any) => 
        cv.key.toLowerCase().includes(fieldKey.toLowerCase()) || 
        (cv.name && cv.name.toLowerCase().includes(fieldKey.toLowerCase()))
      )
    }

    // Retourner le résultat avec plus d'informations de débogage
    return new Response(
      JSON.stringify({
        value: customValue?.value || null,
        key: customValue?.key || null,
        name: customValue?.name || null,
        found: !!customValue,
        allKeys: data.customValues?.map((cv: any) => ({ key: cv.key, name: cv.name })) || []
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
