
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

    console.log('Debugging GHL Field Retrieval:')
    console.log('Input Parameters:')
    console.log('LocationID:', locationId)
    console.log('Field Key:', fieldKey)
    console.log('JWT Token Length:', ghlApiKey ? ghlApiKey.length : 'No token')

    const extractJWTDetails = (jwt: string) => {
      try {
        const parts = jwt.split('.');
        if (parts.length !== 3) {
          console.error('Invalid JWT format');
          return { error: 'Invalid JWT format' };
        }

        const payload = JSON.parse(atob(parts[1]));
        console.log('JWT Payload Details:', {
          company_id: payload.company_id,
          location_id: payload.location_id,
          sub: payload.sub
        });

        return {
          companyId: payload.company_id,
          locationId: payload.location_id,
          sub: payload.sub
        };
      } catch (error) {
        console.error('JWT Decoding Error:', error);
        return { error: 'Could not decode JWT' };
      }
    };

    const jwtDetails = extractJWTDetails(ghlApiKey);
    console.log('Extracted JWT Details:', jwtDetails);

    if (!ghlApiKey) {
      return new Response(
        JSON.stringify({ 
          error: 'Missing GoHighLevel API Key', 
          found: false,
          details: 'Please provide a valid JWT token' 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 // Using 200 instead of 400 to be handled by the frontend
        }
      );
    }

    let finalLocationId = locationId;
    if (!finalLocationId && jwtDetails.companyId) {
      console.log(`Attempting to fetch locations for company: ${jwtDetails.companyId}`);
      
      try {
        // Fixed URL format
        const locationsResponse = await fetch(
          `https://services.leadconnectorhq.com/company/location/list`, 
          {
            headers: {
              'Authorization': `Bearer ${ghlApiKey}`,
              'Version': '2021-07-28',
              'Accept': 'application/json',
            },
            method: 'POST',
            body: JSON.stringify({
              companyId: jwtDetails.companyId,
              limit: 1,  // Just get the first location if available
            })
          }
        );

        console.log('Locations Fetch Response:', {
          status: locationsResponse.status,
          statusText: locationsResponse.statusText
        });

        if (locationsResponse.ok) {
          const locationsData = await locationsResponse.json();
          console.log('Locations Data:', locationsData);
          
          if (locationsData.locations && locationsData.locations.length > 0) {
            finalLocationId = locationsData.locations[0].id;
            console.log(`Using first location: ${finalLocationId}`);
          }
        } else {
          const errorText = await locationsResponse.text();
          console.error('Location Fetch Error:', errorText);
        }
      } catch (fetchError) {
        console.error('Location Fetch Exception:', fetchError);
      }
    }

    if (!finalLocationId && jwtDetails.locationId) {
      console.log(`Using locationId from JWT: ${jwtDetails.locationId}`);
      finalLocationId = jwtDetails.locationId;
    }

    if (!finalLocationId) {
      return new Response(
        JSON.stringify({ 
          error: 'Could not determine Location ID', 
          found: false,
          details: 'No location ID found in JWT or via company locations API' 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 // Using 200 instead of 400 to be handled by the frontend
        }
      );
    }

    return await processGhlRequest(finalLocationId, ghlApiKey, fieldKey, corsHeaders);

  } catch (error) {
    console.error('Unexpected Error in GHL Field Retrieval:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message, 
        found: false,
        details: 'An unexpected error occurred' 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 // Using 200 instead of 500 to be handled by the frontend
      }
    );
  }
})

async function processGhlRequest(locationId: string, ghlApiKey: string, fieldKey: string, corsHeaders: Record<string, string>) {
  console.log(`Fetching custom values for location ${locationId}`)
  console.log(`Looking for field key: ${fieldKey}`)

  try {
    const response = await fetch(`https://services.leadconnectorhq.com/locations/${locationId}/customValues`, {
      headers: {
        'Authorization': `Bearer ${ghlApiKey}`,
        'Version': '2021-07-28',
        'Accept': 'application/json',
      },
    })

    console.log(`GHL API Status: ${response.status} ${response.statusText}`);
    console.log('GHL API Response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`GHL API error: ${response.status} ${response.statusText}`, errorText)
      
      const errorMessage = response.status === 401 ? 'GHL API Authentication error: Invalid API key or token expired'
        : response.status === 403 ? 'GHL API Permission error: Token does not have access to this location'
        : response.status === 404 ? `GHL API error: Location ID ${locationId} not found`
        : `GHL API error: ${response.statusText} (${response.status})`;
      
      return new Response(
        JSON.stringify({ 
          error: errorMessage,
          status: response.status,
          responseText: errorText,
          found: false 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 // Using 200 instead of response.status to be handled by frontend
        }
      )
    }

    const data = await response.json()
    console.log('GHL API response received, parsing data...')
    
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
          status: 200,
        },
      )
    }
    
    console.log(`Found ${data.customValues.length} custom values`);

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
      'accueil',
      'intro_message',
      'intro',
      'message'
    ]
    
    const searchTerms = [
      fieldKey.toLowerCase(),
      fieldKey.toLowerCase().replace('api ', 'api_').replace(' api', '_api'),
      fieldKey.toLowerCase().replace(/ /g, '_'),
      `custom_values.${fieldKey.toLowerCase().replace(/ /g, '_')}`,
      `{{ custom_values.${fieldKey.toLowerCase().replace(/ /g, '_')} }}`
    ]

    searchTerms.push(fieldKey.toLowerCase().replace(/[{}]/g, '').trim());
    
    if (fieldKey.toLowerCase().includes('welcome') || 
        fieldKey.toLowerCase().includes('message') || 
        fieldKey.toLowerCase().includes('intro')) {
      welcomeTerms.forEach(term => {
        if (!searchTerms.includes(term)) {
          searchTerms.push(term)
          searchTerms.push(`custom_values.${term}`)
          searchTerms.push(`{{ custom_values.${term} }}`)
        }
      })
    }

    console.log('Searching for terms:', searchTerms)

    const strategies = [
      (cv: any) => searchTerms.some(term => cv.key.toLowerCase() === term),
      (cv: any) => cv.name && searchTerms.some(term => cv.name.toLowerCase() === term),
      (cv: any) => searchTerms.some(term => cv.key.toLowerCase().includes(term)),
      (cv: any) => cv.name && searchTerms.some(term => cv.name.toLowerCase().includes(term))
    ]

    let customValue = null
    for (const strategy of strategies) {
      customValue = data.customValues?.find(strategy)
      if (customValue) {
        console.log('Found match using strategy:', strategy.toString());
        console.log('Match:', customValue);
        break;
      }
    }

    if (!customValue && fieldKey.toLowerCase().includes('openai')) {
      customValue = data.customValues?.find((cv: any) => 
        cv.name?.toLowerCase().includes('openai') || 
        cv.key.toLowerCase().includes('openai')
      )
      if (customValue) {
        console.log('Found OpenAI key match:', customValue);
      }
    }

    if (!customValue && (fieldKey.toLowerCase().includes('welcome') || 
                         fieldKey.toLowerCase().includes('message') || 
                         fieldKey.toLowerCase().includes('intro'))) {
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
    
    const potentialWelcomeMatches = data.customValues?.filter((cv: any) => 
      welcomeTerms.some(term => 
        cv.key.toLowerCase().includes(term) || 
        (cv.name && cv.name.toLowerCase().includes(term))
      )
    ) || []

    console.log(`Found ${potentialWelcomeMatches.length} potential welcome message matches`);

    const textContentFields = data.customValues?.filter((cv: any) => 
      cv.value && 
      typeof cv.value === 'string' && 
      cv.value.length > 15 && 
      cv.value.length < 500
    ) || []

    console.log(`Found ${textContentFields.length} fields with text content`);

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
        location: 'processGhlRequest function',
        found: false
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  }
}
