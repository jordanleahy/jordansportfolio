import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface VitalSign {
  timestamp: string;
  parameter: 'temperature' | 'heart_rate' | 'respiratory_rate' | 'wbc_count';
  value: number;
  unit: string;
}

interface SIRSRequest {
  patient_id: string;
  admission_time: string;
  vital_signs: VitalSign[];
  lab_results: VitalSign[];
}

interface SIRSCriteria {
  parameter: string;
  threshold: string;
  met: boolean;
  abnormal_values: Array<{
    timestamp: string;
    value: number;
    unit: string;
    reason: string;
  }>;
}

interface SIRSResponse {
  sirs: boolean;
  criteria_met: number;
  total_criteria: 4;
  criteria_details: SIRSCriteria[];
  explanation: string;
  evaluation_window: string;
  timestamp: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestData: SIRSRequest = await req.json();
    console.log('Processing SIRS evaluation for patient:', requestData.patient_id);

    // Prepare the system prompt for OpenAI
    const systemPrompt = `You are a clinical decision support assistant evaluating structured vital signs and lab data to determine if the patient meets the criteria for SIRS (Systemic Inflammatory Response Syndrome).

Definition:
SIRS is present if at least two of the following criteria are met within the first 48 hours of hospital admission:
- Temperature < 36°C or > 38°C
- Heart rate > 90 bpm
- Respiratory rate > 20 breaths per minute
- WBC count < 4,000 or > 12,000 cells/mm³

Instructions:
1. Review only data from the first 48 hours after admission.
2. For each parameter, check if any values are abnormal.
3. Count how many criteria are met.
4. Return a JSON response with the exact structure specified.

You must return a valid JSON object with this exact structure:
{
  "sirs": boolean,
  "criteria_met": number,
  "total_criteria": 4,
  "criteria_details": [
    {
      "parameter": "Temperature",
      "threshold": "< 36°C or > 38°C",
      "met": boolean,
      "abnormal_values": [
        {
          "timestamp": "ISO string",
          "value": number,
          "unit": "string",
          "reason": "string explaining why abnormal"
        }
      ]
    }
  ],
  "explanation": "Brief clinical explanation of the decision",
  "evaluation_window": "First 48 hours after admission",
  "timestamp": "ISO string of evaluation time"
}`;

    const userPrompt = `Patient Data:
- Patient ID: ${requestData.patient_id}
- Admission Time: ${requestData.admission_time}
- Vital Signs: ${JSON.stringify(requestData.vital_signs, null, 2)}
- Lab Results: ${JSON.stringify(requestData.lab_results, null, 2)}

Evaluate this patient for SIRS criteria and return the structured JSON response.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.0,
        max_tokens: 2048,
        top_p: 1.0,
        frequency_penalty: 0.0,
        presence_penalty: 0.0,
        response_format: { type: "json_object" }
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const aiResponse = await response.json();
    console.log('OpenAI response received for SIRS evaluation');
    
    let sirsResult: SIRSResponse;
    try {
      sirsResult = JSON.parse(aiResponse.choices[0].message.content);
    } catch (parseError) {
      console.error('Failed to parse OpenAI JSON response:', parseError);
      throw new Error('Invalid JSON response from AI model');
    }

    // Validate the response structure
    if (!sirsResult.hasOwnProperty('sirs') || !sirsResult.hasOwnProperty('criteria_met')) {
      throw new Error('Invalid SIRS response structure');
    }

    console.log(`SIRS evaluation complete: ${sirsResult.sirs ? 'POSITIVE' : 'NEGATIVE'} (${sirsResult.criteria_met}/4 criteria met)`);

    return new Response(JSON.stringify(sirsResult), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in SIRS diagnostic agent:', error);
    
    return new Response(JSON.stringify({ 
      error: error.message,
      sirs: false,
      criteria_met: 0,
      explanation: 'Error occurred during SIRS evaluation'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});