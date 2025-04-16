
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

    // Call to the GHL API to retrieve custom values
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

    // Prepare search terms - normalize the search input
    const searchTerms = [
      fieldKey.toLowerCase(),
      fieldKey.toLowerCase().replace('api ', 'api_').replace(' api', '_api'),
      fieldKey.toLowerCase().replace(' ', '_'),
      `custom_values.${fieldKey.toLowerCase().replace(' ', '_')}`,
      `{{ custom_values.${fieldKey.toLowerCase().replace(' ', '_')} }}`
    ]

    console.log('Searching for terms:', searchTerms)

    // Search strategies in order of exactness
    const strategies = [
      // 1. Exact key match (case insensitive)
      (cv: any) => searchTerms.some(term => cv.key.toLowerCase() === term),
      
      // 2. Exact name match (case insensitive)
      (cv: any) => cv.name && searchTerms.some(term => cv.name.toLowerCase() === term),
      
      // 3. Key contains search term
      (cv: any) => searchTerms.some(term => cv.key.toLowerCase().includes(term)),
      
      // 4. Name contains search term
      (cv: any) => cv.name && searchTerms.some(term => cv.name.toLowerCase().includes(term))
    ]

    // Find the custom value using the strategies in order
    let customValue = null
    for (const strategy of strategies) {
      customValue = data.customValues?.find(strategy)
      if (customValue) break
    }

    // Special case for "openai_key" - look explicitly for "OpenAI Key"
    if (!customValue && fieldKey.toLowerCase().includes('openai')) {
      customValue = data.customValues?.find((cv: any) => 
        cv.name?.toLowerCase().includes('openai') || 
        cv.key.toLowerCase().includes('openai')
      )
    }

    // Return result with enhanced debugging information
    return new Response(
      JSON.stringify({
        value: customValue?.value || null,
        key: customValue?.key || null,
        name: customValue?.name || null,
        found: !!customValue,
        searchTerms: searchTerms,
        allKeys: data.customValues?.map((cv: any) => ({ 
          key: cv.key, 
          name: cv.name,
          valuePreview: cv.value ? (cv.value.length > 20 ? cv.value.substring(0, 20) + '...' : cv.value) : null
        })) || []
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
