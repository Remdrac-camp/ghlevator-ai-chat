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

    const getGhlApiHeaders = (apiKey: string) => {
      if (apiKey && apiKey.split('.').length === 3) {
        return {
          'Authorization': `Bearer ${apiKey}`,
          'Version': '2021-07-28',
          'Accept': 'application/json',
        };
      } 
      else if (apiKey) {
        return {
          'Authorization': apiKey,
          'Version': '2021-07-28',
          'Accept': 'application/json',
        };
      }
      
      return {
        'Accept': 'application/json',
      };
    };

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
          details: 'Please provide a valid JWT token or API key' 
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
        console.log('Trying API key directly...');
        const directHeaders = {
          'Authorization': ghlApiKey,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        };
        
        const directResponse = await fetch(
          `https://rest.gohighlevel.com/v1/locations/`, 
          {
            headers: directHeaders,
            method: 'GET'
          }
        );

        console.log('Direct API Response:', {
          status: directResponse.status,
          statusText: directResponse.statusText
        });

        if (directResponse.ok) {
          const locationsData = await directResponse.json();
          console.log('Locations Data from direct API:', locationsData);
          
          if (locationsData.locations && locationsData.locations.length > 0) {
            finalLocationId = locationsData.locations[0].id;
            console.log(`Using first location from direct API: ${finalLocationId}`);
          }
        } else {
          const errorText = await directResponse.text();
          console.log('Direct API Error:', errorText);
        }
      } catch (fetchError) {
        console.log('Direct API Fetch Exception:', fetchError);
      }
      
      try {
        console.log('Trying modern location listing API...');
        const headers = getGhlApiHeaders(ghlApiKey);
        console.log('Using headers:', headers);
        
        const locationsResponse = await fetch(
          `https://api.higherlevel.com/companies/${jwtDetails.companyId}/locations`, 
          {
            headers,
            method: 'GET'
          }
        );

        console.log('Modern API Response:', {
          status: locationsResponse.status,
          statusText: locationsResponse.statusText
        });

        if (locationsResponse.ok) {
          const locationsData = await locationsResponse.json();
          console.log('Locations Data from modern API:', locationsData);
          
          if (locationsData.data && locationsData.data.length > 0) {
            finalLocationId = locationsData.data[0].id;
            console.log(`Using first location from modern API: ${finalLocationId}`);
          }
        } else {
          const errorText = await locationsResponse.text();
          console.log('Modern API Error:', errorText);
        }
      } catch (fetchError) {
        console.log('Modern API Fetch Exception:', fetchError);
      }

      try {
        console.log('Trying location/list endpoint...');
        const headers = getGhlApiHeaders(ghlApiKey);
        
        const listResponse = await fetch(
          `https://api.gohighlevel.com/oauth/location/list`, 
          {
            headers,
            method: 'GET'
          }
        );

        console.log('List endpoint Response:', {
          status: listResponse.status,
          statusText: listResponse.statusText
        });

        if (listResponse.ok) {
          const locationsData = await listResponse.json();
          console.log('Locations Data from list endpoint:', locationsData);
          
          if (locationsData.locations && locationsData.locations.length > 0) {
            finalLocationId = locationsData.locations[0].id;
            console.log(`Using first location from list endpoint: ${finalLocationId}`);
          }
        } else {
          const errorText = await listResponse.text();
          console.log('List endpoint Error:', errorText);
        }
      } catch (fetchError) {
        console.log('List endpoint Exception:', fetchError);
      }

      try {
        console.log('Trying legacy location listing API...');
        const headers = getGhlApiHeaders(ghlApiKey);
        
        const legacyLocationsResponse = await fetch(
          `https://services.leadconnectorhq.com/locations/search`, 
          {
            headers,
            method: 'POST',
            body: JSON.stringify({
              companyId: jwtDetails.companyId,
              limit: 10  // Get a few locations
            })
          }
        );

        console.log('Legacy API Response:', {
          status: legacyLocationsResponse.status,
          statusText: legacyLocationsResponse.statusText
        });

        if (legacyLocationsResponse.ok) {
          const locationsData = await legacyLocationsResponse.json();
          console.log('Locations Data from legacy API:', locationsData);
          
          if (locationsData.locations && locationsData.locations.length > 0) {
            finalLocationId = locationsData.locations[0].id;
            console.log(`Using first location from legacy API: ${finalLocationId}`);
          }
        } else {
          const errorText = await legacyLocationsResponse.text();
          console.log('Legacy API Error:', errorText);
        }
      } catch (fetchError) {
        console.log('Legacy API Fetch Exception:', fetchError);
      }
      
      try {
        console.log('Trying alternative location endpoint...');
        const headers = getGhlApiHeaders(ghlApiKey);
        
        const altLocationsResponse = await fetch(
          `https://services.leadconnectorhq.com/company/location/list`, 
          {
            headers,
            method: 'POST',
            body: JSON.stringify({
              companyId: jwtDetails.companyId,
              limit: 10
            })
          }
        );

        console.log('Alternative API Response:', {
          status: altLocationsResponse.status,
          statusText: altLocationsResponse.statusText
        });

        if (altLocationsResponse.ok) {
          const locationsData = await altLocationsResponse.json();
          console.log('Locations Data from alternative API:', locationsData);
          
          if (locationsData.locations && locationsData.locations.length > 0) {
            finalLocationId = locationsData.locations[0].id;
            console.log(`Using first location from alternative API: ${finalLocationId}`);
          }
        } else {
          const errorText = await altLocationsResponse.text();
          console.log('Alternative API Error:', errorText);
        }
      } catch (fetchError) {
        console.log('Alternative API Fetch Exception:', fetchError);
      }
    }

    if (!finalLocationId && jwtDetails.locationId) {
      console.log(`Using locationId from JWT: ${jwtDetails.locationId}`);
      finalLocationId = jwtDetails.locationId;
    }

    if (!finalLocationId && jwtDetails.sub) {
      console.log(`Trying to use sub value as location ID: ${jwtDetails.sub}`);
      finalLocationId = jwtDetails.sub;
    }

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

async function processCompanyGhlRequest(companyId: string, ghlApiKey: string, fieldKey: string, corsHeaders: Record<string, string>) {
  console.log(`Trying company-level custom values for company ${companyId}`)
  console.log(`Looking for field key: ${fieldKey}`)
  
  const headers = getGhlApiHeaders(ghlApiKey);
  console.log('Using headers for company request:', headers);

  try {
    const endpoints = [
      `https://api.higherlevel.com/companies/${companyId}/custom-values`,
      `https://api.gohighlevel.com/oauth/company/${companyId}/customValues`,
      `https://services.leadconnectorhq.com/companies/${companyId}/customValues`,
      `https://rest.gohighlevel.com/v1/custom-values/`
    ];
    
    let responseData = null;
    
    for (const endpoint of endpoints) {
      console.log(`Trying endpoint: ${endpoint}`);
      
      try {
        const response = await fetch(endpoint, {
          headers,
          method: 'GET'
        });
  
        console.log(`Response from ${endpoint}:`, {
          status: response.status,
          statusText: response.statusText
        });
  
        if (response.ok) {
          responseData = await response.json();
          console.log(`Success from ${endpoint}! Got data:`, responseData);
          break;
        } else {
          const errorText = await response.text();
          console.error(`Error from ${endpoint}:`, errorText);
        }
      } catch (fetchError) {
        console.error(`Exception from ${endpoint}:`, fetchError);
      }
    }
    
    if (!responseData) {
      return new Response(
        JSON.stringify({ 
          error: 'Failed to retrieve custom values from any GHL API endpoint',
          found: false,
          details: 'Tried multiple API endpoints but none returned valid data. Your API key might not have sufficient permissions.'
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      );
    }

    return processCustomValuesResponse(responseData, fieldKey, corsHeaders);
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

async function processGhlRequest(locationId: string, ghlApiKey: string, fieldKey: string, corsHeaders: Record<string, string>) {
  console.log(`Fetching custom values for location ${locationId}`)
  console.log(`Looking for field key: ${fieldKey}`)
  
  const headers = getGhlApiHeaders(ghlApiKey);
  console.log('Using headers for location request:', headers);

  try {
    const endpoints = [
      `https://services.leadconnectorhq.com/locations/${locationId}/customValues`,
      `https://api.higherlevel.com/locations/${locationId}/custom-values`,
      `https://api.gohighlevel.com/oauth/location/${locationId}/customValues`,
      `https://rest.gohighlevel.com/v1/custom-values/`
    ];
    
    let responseData = null;
    
    for (const endpoint of endpoints) {
      console.log(`Trying endpoint: ${endpoint}`);
      
      try {
        const response = await fetch(endpoint, {
          headers,
          method: 'GET'
        });
  
        console.log(`Response from ${endpoint}:`, {
          status: response.status,
          statusText: response.statusText
        });
  
        if (response.ok) {
          responseData = await response.json();
          console.log(`Success from ${endpoint}! Got data:`, responseData);
          break;
        } else {
          const errorText = await response.text();
          console.error(`Error from ${endpoint}:`, errorText);
        }
      } catch (fetchError) {
        console.error(`Exception from ${endpoint}:`, fetchError);
      }
    }
    
    if (!responseData) {
      try {
        console.log('Trying direct API approach (without Bearer prefix)...');
        const directHeaders = {
          'Authorization': ghlApiKey,
          'Content-Type': 'application/json',
        };
        
        const directResponse = await fetch(
          `https://rest.gohighlevel.com/v1/custom-values/`, 
          {
            headers: directHeaders,
            method: 'GET'
          }
        );

        console.log('Direct Custom Values API Response:', {
          status: directResponse.status,
          statusText: directResponse.statusText
        });

        if (directResponse.ok) {
          responseData = await directResponse.json();
          console.log('Custom Values from direct API:', responseData);
        } else {
          const errorText = await directResponse.text();
          console.log('Direct Custom Values API Error:', errorText);
        }
      } catch (fetchError) {
        console.log('Direct Custom Values API Exception:', fetchError);
      }
    }
    
    if (!responseData) {
      return new Response(
        JSON.stringify({ 
          error: 'Failed to retrieve custom values from any GHL API endpoint',
          found: false,
          details: 'Tried multiple API endpoints but none returned valid data. This could be due to an expired token or insufficient permissions.'
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      );
    }

    return processCustomValuesResponse(responseData, fieldKey, corsHeaders);
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

function getGhlApiHeaders(apiKey: string) {
  if (apiKey && apiKey.split('.').length === 3) {
    return {
      'Authorization': `Bearer ${apiKey}`,
      'Version': '2021-07-28',
      'Accept': 'application/json',
    };
  } 
  else if (apiKey) {
    return {
      'Authorization': apiKey,
      'Version': '2021-07-28',
      'Accept': 'application/json',
    };
  }
  
  return {
    'Accept': 'application/json',
  };
}

function processCustomValuesResponse(data: any, fieldKey: string, corsHeaders: Record<string, string>) {
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
    (cv: any) => searchTerms.some(term => cv.key?.toLowerCase() === term),
    (cv: any) => cv.name && searchTerms.some(term => cv.name.toLowerCase() === term),
    (cv: any) => searchTerms.some(term => cv.key?.toLowerCase().includes(term)),
    (cv: any) => cv.name && searchTerms.some(term => cv.name.toLowerCase().includes(term))
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
    customValue = customValues.find((cv: any) => 
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
    customValue = customValues.find((cv: any) => 
      welcomeTerms.some(term => 
        cv.key?.toLowerCase().includes(term) || 
        (cv.name && cv.name.toLowerCase().includes(term))
      )
    );
    if (customValue) {
      console.log('Found welcome message match:', customValue);
    }
  }
  
  const potentialWelcomeMatches = customValues.filter((cv: any) => 
    welcomeTerms.some(term => 
      cv.key?.toLowerCase().includes(term) || 
      (cv.name && cv.name.toLowerCase().includes(term))
    )
  ) || [];

  console.log(`Found ${potentialWelcomeMatches.length} potential welcome message matches`);

  const textContentFields = customValues.filter((cv: any) => 
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
      allKeys: customValues.map((cv: any) => ({ 
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
