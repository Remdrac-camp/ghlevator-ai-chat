
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

    // Validate API key
    if (!ghlApiKey) {
      return new Response(
        JSON.stringify({ 
          error: 'Missing GoHighLevel API Key', 
          found: false,
          details: 'Please provide a valid JWT token or API key' 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 // Using 200 instead of 400 to be handled by the frontend
        }
      );
    }

    // Extract JWT details to determine if it's a company or location token
    const jwtDetails = extractJWTDetails(ghlApiKey);
    console.log('Extracted JWT Details:', jwtDetails);

    let finalLocationId = locationId;
    
    // If no location ID provided but we have company ID in JWT, try to get first location
    if (!finalLocationId && jwtDetails.companyId) {
      console.log(`Attempting to fetch locations for company: ${jwtDetails.companyId}`);
      finalLocationId = await fetchFirstLocationId(ghlApiKey, jwtDetails.companyId);
    }

    // If we found a location ID from JWT directly, use that
    if (!finalLocationId && jwtDetails.locationId) {
      console.log(`Using locationId from JWT: ${jwtDetails.locationId}`);
      finalLocationId = jwtDetails.locationId;
    }

    // As last resort try to use sub value as location ID
    if (!finalLocationId && jwtDetails.sub) {
      console.log(`Trying to use sub value as location ID: ${jwtDetails.sub}`);
      finalLocationId = jwtDetails.sub;
    }

    // If we still don't have a location ID but have a company ID, try company level
    if (!finalLocationId) {
      console.log(`No location ID found, trying company-level customValues endpoint`);

      if (jwtDetails.companyId) {
        return await processCompanyGhlRequest(jwtDetails.companyId, ghlApiKey, fieldKey, corsHeaders);
      }

      return new Response(
        JSON.stringify({ 
          error: 'Could not determine Location ID', 
          found: false,
          details: 'No location ID found in JWT or via company locations API. Please manually specify a location ID in the integration settings.' 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
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
        status: 200
      }
    );
  }
})

async function fetchFirstLocationId(ghlApiKey, companyId) {
  console.log(`Trying to fetch first location for company ${companyId}`);
  
  try {
    // Using the v2 locations API endpoint as per documentation
    const headers = getGhlApiHeaders(ghlApiKey);
    console.log('Using headers for locations request:', headers);
    
    const locationsResponse = await fetch(
      `https://services.leadconnectorhq.com/locations/search`, 
      {
        headers,
        method: 'POST',
        body: JSON.stringify({
          companyId: companyId,
          limit: 1  // Just get the first location
        })
      }
    );

    console.log('Locations API Response:', {
      status: locationsResponse.status,
      statusText: locationsResponse.statusText
    });

    if (locationsResponse.ok) {
      const locationsData = await locationsResponse.json();
      console.log('Locations Data:', locationsData);
      
      if (locationsData.locations && locationsData.locations.length > 0) {
        const firstLocationId = locationsData.locations[0].id;
        console.log(`Found first location ID: ${firstLocationId}`);
        return firstLocationId;
      }
    } else {
      const errorText = await locationsResponse.text();
      console.error('Locations API Error:', errorText);
    }
  } catch (error) {
    console.error('Error fetching location ID:', error);
  }
  
  return null;
}

async function processCompanyGhlRequest(companyId, ghlApiKey, fieldKey, corsHeaders) {
  console.log(`Trying company-level custom values for company ${companyId}`)
  console.log(`Looking for field key: ${fieldKey}`)
  
  const headers = getGhlApiHeaders(ghlApiKey);
  console.log('Using headers for company request:', headers);

  try {
    // Primary endpoint as per updated documentation
    const endpoint = `https://services.leadconnectorhq.com/companies/${companyId}/customValues`;
    console.log(`Trying endpoint: ${endpoint}`);
    
    const response = await fetch(endpoint, {
      headers,
      method: 'GET'
    });

    console.log(`Response from ${endpoint}:`, {
      status: response.status,
      statusText: response.statusText
    });

    if (response.ok) {
      const responseData = await response.json();
      console.log(`Success from ${endpoint}! Got data:`, responseData);
      return processCustomValuesResponse(responseData, fieldKey, corsHeaders);
    } else {
      const errorText = await response.text();
      console.error(`Error from ${endpoint}:`, errorText);
    }
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to retrieve custom values from GHL API',
        found: false,
        details: 'The API endpoint returned an error. Your API key might not have sufficient permissions.'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );
  } catch (error) {
    console.error('Error processing Company GHL request:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        location: 'processCompanyGhlRequest function',
        found: false
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  }
}

async function processGhlRequest(locationId, ghlApiKey, fieldKey, corsHeaders) {
  console.log(`Fetching custom values for location ${locationId}`)
  console.log(`Looking for field key: ${fieldKey}`)
  
  const headers = getGhlApiHeaders(ghlApiKey);
  console.log('Using headers for location request:', headers);

  try {
    // Primary endpoint as per updated documentation
    const endpoint = `https://services.leadconnectorhq.com/locations/${locationId}/customValues`;
    console.log(`Trying endpoint: ${endpoint}`);
    
    const response = await fetch(endpoint, {
      headers,
      method: 'GET'
    });

    console.log(`Response from ${endpoint}:`, {
      status: response.status,
      statusText: response.statusText
    });

    if (response.ok) {
      const responseData = await response.json();
      console.log(`Success from ${endpoint}! Got data:`, responseData);
      return processCustomValuesResponse(responseData, fieldKey, corsHeaders);
    } else {
      const errorText = await response.text();
      console.error(`Error from ${endpoint}:`, errorText);
    }
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to retrieve custom values from GHL API',
        found: false,
        details: 'The API endpoint returned an error. This could be due to an expired token or insufficient permissions.'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );
  } catch (error) {
    console.error('Error processing GHL request:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        location: 'processGhlRequest function',
        found: false
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
}

function getGhlApiHeaders(apiKey) {
  if (apiKey && apiKey.split('.').length === 3) {
    // It's a JWT token
    return {
      'Authorization': `Bearer ${apiKey}`,
      'Version': '2021-07-28',
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    };
  } 
  else if (apiKey) {
    // It's a regular API key
    return {
      'Authorization': apiKey,
      'Version': '2021-07-28',
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    };
  }
  
  return {
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  };
}

function extractJWTDetails(jwt) {
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
}

function processCustomValuesResponse(data, fieldKey, corsHeaders) {
  const customValues = data.customValues || data.custom_values || [];
  
  if (!customValues || customValues.length === 0) {
    console.warn('GHL API response does not contain customValues array or it is empty:', JSON.stringify(data));
    
    if (data.data && Array.isArray(data.data)) {
      console.log('Found data array, trying to use it as custom values');
      return processCustomValuesResponse({customValues: data.data}, fieldKey, corsHeaders);
    }
    
    if (data.results && Array.isArray(data.results)) {
      console.log('Found results array, trying to use it as custom values');
      return processCustomValuesResponse({customValues: data.results}, fieldKey, corsHeaders);
    }
    
    return new Response(
      JSON.stringify({ 
        error: 'No custom values found in response',
        responseData: data,
        found: false 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  }
  
  console.log(`Found ${customValues.length} custom values`);

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
  ];
  
  const searchTerms = [
    fieldKey.toLowerCase(),
    fieldKey.toLowerCase().replace('api ', 'api_').replace(' api', '_api'),
    fieldKey.toLowerCase().replace(/ /g, '_'),
    `custom_values.${fieldKey.toLowerCase().replace(/ /g, '_')}`,
    `{{ custom_values.${fieldKey.toLowerCase().replace(/ /g, '_')} }}`
  ];

  searchTerms.push(fieldKey.toLowerCase().replace(/[{}]/g, '').trim());
  
  if (fieldKey.toLowerCase().includes('welcome') || 
      fieldKey.toLowerCase().includes('message') || 
      fieldKey.toLowerCase().includes('intro')) {
    welcomeTerms.forEach(term => {
      if (!searchTerms.includes(term)) {
        searchTerms.push(term);
        searchTerms.push(`custom_values.${term}`);
        searchTerms.push(`{{ custom_values.${term} }}`);
      }
    });
  }

  console.log('Searching for terms:', searchTerms);

  const strategies = [
    (cv) => searchTerms.some(term => cv.key?.toLowerCase() === term),
    (cv) => cv.name && searchTerms.some(term => cv.name.toLowerCase() === term),
    (cv) => searchTerms.some(term => cv.key?.toLowerCase().includes(term)),
    (cv) => cv.name && searchTerms.some(term => cv.name.toLowerCase().includes(term))
  ];

  let customValue = null;
  for (const strategy of strategies) {
    customValue = customValues.find(strategy);
    if (customValue) {
      console.log('Found match using strategy:', strategy.toString());
      console.log('Match:', customValue);
      break;
    }
  }

  if (!customValue && fieldKey.toLowerCase().includes('openai')) {
    customValue = customValues.find((cv) => 
      cv.name?.toLowerCase().includes('openai') || 
      cv.key?.toLowerCase().includes('openai')
    );
    if (customValue) {
      console.log('Found OpenAI key match:', customValue);
    }
  }

  if (!customValue && (fieldKey.toLowerCase().includes('welcome') || 
                       fieldKey.toLowerCase().includes('message') || 
                       fieldKey.toLowerCase().includes('intro'))) {
    customValue = customValues.find((cv) => 
      welcomeTerms.some(term => 
        cv.key?.toLowerCase().includes(term) || 
        (cv.name && cv.name.toLowerCase().includes(term))
      )
    );
    if (customValue) {
      console.log('Found welcome message match:', customValue);
    }
  }
  
  const potentialWelcomeMatches = customValues.filter((cv) => 
    welcomeTerms.some(term => 
      cv.key?.toLowerCase().includes(term) || 
      (cv.name && cv.name.toLowerCase().includes(term))
    )
  ) || [];

  console.log(`Found ${potentialWelcomeMatches.length} potential welcome message matches`);

  const textContentFields = customValues.filter((cv) => 
    cv.value && 
    typeof cv.value === 'string' && 
    cv.value.length > 15 && 
    cv.value.length < 500
  ) || [];

  console.log(`Found ${textContentFields.length} fields with text content`);

  return new Response(
    JSON.stringify({
      value: customValue?.value || null,
      key: customValue?.key || null,
      name: customValue?.name || null,
      found: !!customValue,
      searchTerms: searchTerms,
      potentialWelcomeMatches: potentialWelcomeMatches.map((cv) => ({
        key: cv.key,
        name: cv.name,
        valuePreview: cv.value ? (cv.value.length > 50 ? cv.value.substring(0, 50) + '...' : cv.value) : null
      })),
      textContentFields: textContentFields.map((cv) => ({
        key: cv.key,
        name: cv.name,
        valuePreview: cv.value ? (cv.value.length > 50 ? cv.value.substring(0, 50) + '...' : cv.value) : null
      })),
      allKeys: customValues.map((cv) => ({ 
        key: cv.key, 
        name: cv.name,
        valuePreview: cv.value ? (cv.value.length > 20 ? cv.value.substring(0, 20) + '...' : cv.value) : null
      })) || []
    }),
    {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  );
}
