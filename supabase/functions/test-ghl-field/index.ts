
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

    // Log all input parameters for debugging
    console.log('Input parameters:')
    console.log('locationId:', locationId)
    console.log('ghlApiKey provided:', ghlApiKey ? `${ghlApiKey.substring(0, 15)}...` : 'null')
    console.log('fieldKey:', fieldKey)

    if (!ghlApiKey) {
      throw new Error('Missing GHL API key')
    }

    if (!fieldKey) {
      throw new Error('Missing field key to search')
    }

    // Handle the case where locationId is not provided
    if (!locationId) {
      console.log('Warning: locationId not provided - attempting to extract from JWT')
      
      try {
        // Try to extract location ID from JWT
        const parts = ghlApiKey.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(atob(parts[1]));
          console.log('JWT payload:', payload);
          
          const extractedLocationId = payload.location_id;
          
          if (extractedLocationId) {
            console.log(`Successfully extracted locationId from JWT: ${extractedLocationId}`);
            // Use the extracted locationId
            return await processGhlRequest(extractedLocationId, ghlApiKey, fieldKey);
          } else {
            console.log('No location_id found in JWT payload');
            
            // If we have a company_id instead, we need to find a location
            if (payload.company_id) {
              console.log(`Company ID found in JWT: ${payload.company_id}`);
              console.log('Attempting to fetch locations for this company...');
              
              // Try to fetch locations for this company
              const locationsResponse = await fetch('https://services.leadconnectorhq.com/locations/', {
                headers: {
                  'Authorization': `Bearer ${ghlApiKey}`,
                  'Version': '2021-07-28',
                  'Accept': 'application/json',
                },
              });
              
              if (!locationsResponse.ok) {
                const errorText = await locationsResponse.text();
                console.error(`GHL API error fetching locations: ${locationsResponse.status}`, errorText);
                throw new Error(`Could not fetch locations for company: ${locationsResponse.statusText}`);
              }
              
              const locations = await locationsResponse.json();
              console.log(`Found ${locations.locations?.length || 0} locations`);
              
              if (locations.locations && locations.locations.length > 0) {
                const firstLocationId = locations.locations[0].id;
                console.log(`Using first location found: ${firstLocationId}`);
                return await processGhlRequest(firstLocationId, ghlApiKey, fieldKey);
              }
            }
          }
        }
      } catch (jwtError) {
        console.error('Error extracting location ID from JWT:', jwtError);
      }
      
      throw new Error('Could not determine location ID - please provide it explicitly or use a valid JWT with location_id')
    }

    return await processGhlRequest(locationId, ghlApiKey, fieldKey);

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

async function processGhlRequest(locationId: string, ghlApiKey: string, fieldKey: string) {
  console.log(`Fetching custom values for location ${locationId}`)
  console.log(`Looking for field key: ${fieldKey}`)

  try {
    // Call to the GHL API to retrieve custom values
    const response = await fetch(`https://services.leadconnectorhq.com/locations/${locationId}/customValues`, {
      headers: {
        'Authorization': `Bearer ${ghlApiKey}`,
        'Version': '2021-07-28',
        'Accept': 'application/json',
      },
    })

    // Log the status and headers for debugging
    console.log(`GHL API Status: ${response.status} ${response.statusText}`);
    console.log('GHL API Response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`GHL API error: ${response.status} ${response.statusText}`, errorText)
      
      // More descriptive error messages based on status codes
      if (response.status === 401) {
        throw new Error('GHL API Authentication error: Invalid API key or token expired')
      } else if (response.status === 403) {
        throw new Error('GHL API Permission error: Token does not have access to this location')
      } else if (response.status === 404) {
        throw new Error(`GHL API error: Location ID ${locationId} not found`)
      } else {
        throw new Error(`GHL API error: ${response.statusText} (${response.status})`)
      }
    }

    const data = await response.json()
    console.log('GHL API response received, parsing data...')
    
    // Check if the response contains the expected structure
    if (!data.customValues) {
      console.warn('GHL API response does not contain customValues array:', JSON.stringify(data));
      return new Response(
        JSON.stringify({ 
          error: 'Unexpected API response format',
          responseData: data,
          found: false 
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      )
    }
    
    console.log(`Found ${data.customValues.length} custom values`);

    // Additional search terms for welcome message
    const welcomeTerms = [
      'welcome_message',
      'welcome message',
      'intro_message',
      'intro message',
      'introduction_message',
      'introduction message',
      'greeting',
      'bienvenue',
      'message_accueil',
      'message accueil',
      'welcome',
      'accueil'
    ]
    
    // Original normalized search terms
    const searchTerms = [
      fieldKey.toLowerCase(),
      fieldKey.toLowerCase().replace('api ', 'api_').replace(' api', '_api'),
      fieldKey.toLowerCase().replace(/ /g, '_'),
      `custom_values.${fieldKey.toLowerCase().replace(/ /g, '_')}`,
      `{{ custom_values.${fieldKey.toLowerCase().replace(/ /g, '_')} }}`
    ]

    // Remove {{ and }} from search terms
    searchTerms.push(fieldKey.toLowerCase().replace(/[{}]/g, '').trim());
    
    // Add welcome-specific terms if we're looking for welcome message
    if (fieldKey.toLowerCase().includes('welcome') || fieldKey.toLowerCase().includes('message')) {
      welcomeTerms.forEach(term => {
        if (!searchTerms.includes(term)) {
          searchTerms.push(term)
          searchTerms.push(`custom_values.${term}`)
          searchTerms.push(`{{ custom_values.${term} }}`)
        }
      })
    }

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
      if (customValue) {
        console.log('Found match using strategy:', strategy.toString());
        console.log('Match:', customValue);
        break;
      }
    }

    // Special case for "openai_key" - look explicitly for "OpenAI Key"
    if (!customValue && fieldKey.toLowerCase().includes('openai')) {
      customValue = data.customValues?.find((cv: any) => 
        cv.name?.toLowerCase().includes('openai') || 
        cv.key.toLowerCase().includes('openai')
      )
      if (customValue) {
        console.log('Found OpenAI key match:', customValue);
      }
    }

    // Special case for welcome message - broader search
    if (!customValue && (fieldKey.toLowerCase().includes('welcome') || fieldKey.toLowerCase().includes('message'))) {
      customValue = data.customValues?.find((cv: any) => 
        welcomeTerms.some(term => 
          cv.key.toLowerCase().includes(term) || 
          (cv.name && cv.name.toLowerCase().includes(term))
        )
      )
      if (customValue) {
        console.log('Found welcome message match:', customValue);
      }
    }
    
    // Find all potential matches for welcome messages for diagnostics
    const potentialWelcomeMatches = data.customValues?.filter((cv: any) => 
      welcomeTerms.some(term => 
        cv.key.toLowerCase().includes(term) || 
        (cv.name && cv.name.toLowerCase().includes(term))
      )
    ) || []

    console.log(`Found ${potentialWelcomeMatches.length} potential welcome message matches`);

    // Collect values with potential text content (for welcome message search)
    const textContentFields = data.customValues?.filter((cv: any) => 
      cv.value && 
      typeof cv.value === 'string' && 
      cv.value.length > 15 && 
      cv.value.length < 500
    ) || []

    console.log(`Found ${textContentFields.length} fields with text content`);

    // Return result with enhanced debugging information
    return new Response(
      JSON.stringify({
        value: customValue?.value || null,
        key: customValue?.key || null,
        name: customValue?.name || null,
        found: !!customValue,
        searchTerms: searchTerms,
        potentialWelcomeMatches: potentialWelcomeMatches.map((cv: any) => ({
          key: cv.key,
          name: cv.name,
          valuePreview: cv.value ? (cv.value.length > 50 ? cv.value.substring(0, 50) + '...' : cv.value) : null
        })),
        textContentFields: textContentFields.map((cv: any) => ({
          key: cv.key,
          name: cv.name,
          valuePreview: cv.value ? (cv.value.length > 50 ? cv.value.substring(0, 50) + '...' : cv.value) : null
        })),
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
    console.error('Error processing GHL request:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message,
        location: 'processGhlRequest function'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  }
}
