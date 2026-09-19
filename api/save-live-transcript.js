export default async function handler(req, res) {

  if (req.method !== 'POST') {
    return res.status(405).json({
      error: 'Method not allowed'
    });
  }

  const SESSION_ID =
    '3a1f0bf3-323e-45ab-bb00-3b7fc345a64c';

  try {

    const SUPABASE_URL =
      process.env.SUPABASE_URL;

    const SUPABASE_SECRET_KEY =
      process.env.SUPABASE_SECRET_KEY;


    if (!SUPABASE_URL || !SUPABASE_SECRET_KEY) {

      return res.status(500).json({
        error: 'Missing Supabase environment variables',
        has_url: !!SUPABASE_URL,
        has_secret_key: !!SUPABASE_SECRET_KEY
      });

    }


    /*
      DIAGNOSTIC TEST

      We are NOT writing anything yet.

      We only ask Supabase:
      "Does this exact session exist?"
    */

    const url =
      `${SUPABASE_URL}/rest/v1/sessions` +
      `?id=eq.${SESSION_ID}` +
      `&select=id,interaction,status`;


    console.log(
      'Looking for session:',
      SESSION_ID
    );


    const response =
      await fetch(
        url,
        {
          method: 'GET',

          headers: {
            'apikey': SUPABASE_SECRET_KEY,
            'Accept': 'application/json'
          }
        }
      );


    const responseText =
      await response.text();


    let data;

    try {
      data = JSON.parse(responseText);
    }
    catch {
      data = responseText;
    }


    console.log(
      'Supabase diagnostic status:',
      response.status
    );

    console.log(
      'Supabase diagnostic result:',
      data
    );


    /*
      IMPORTANT:
      Return the diagnostic result to the browser.
    */

    return res.status(200).json({

      diagnostic: true,

      session_id_requested:
        SESSION_ID,

      supabase_http_status:
        response.status,

      supabase_response:
        data

    });


  }
  catch (error) {

    console.error(
      'Supabase diagnostic error:',
      error
    );

    return res.status(500).json({
      error: 'Diagnostic failed',
      message: error.message
    });

  }

}
