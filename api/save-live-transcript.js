export default async function handler(req, res) {

  /* =====================================================
     METHOD
  ===================================================== */

  if (req.method !== 'POST') {
    return res.status(405).json({
      error: 'Method not allowed'
    });
  }


  /* =====================================================
     TEST SESSION
  ===================================================== */

  const SESSION_ID =
    '3a1f0bf3-323e-45ab-bb00-3b7fc345a64c';


  try {

    /* =====================================================
       ENVIRONMENT VARIABLES
    ===================================================== */

    const SUPABASE_URL =
      process.env.SUPABASE_URL;

    const SUPABASE_SECRET_KEY =
      process.env.SUPABASE_SECRET_KEY;


    if (!SUPABASE_URL || !SUPABASE_SECRET_KEY) {

      return res.status(500).json({

        error:
          'Missing Supabase environment variables',

        has_url:
          !!SUPABASE_URL,

        has_secret_key:
          !!SUPABASE_SECRET_KEY

      });

    }


    /* =====================================================
       IDENTIFY PROJECT HOST

       Safe to return.
       The Secret Key is NEVER returned.
    ===================================================== */

    const projectHost =
      new URL(SUPABASE_URL).hostname;


    /* =====================================================
       BUILD SUPABASE REQUEST

       READ ONLY.
       Nothing will be written to the database.
    ===================================================== */

    const url =
      `${SUPABASE_URL}/rest/v1/sessions` +
      `?id=eq.${SESSION_ID}` +
      `&select=id,user_id,scenario_id,interaction,status,started_at`;


    console.log(
      'Supabase project host:',
      projectHost
    );


    console.log(
      'Looking for session:',
      SESSION_ID
    );


    /* =====================================================
       CALL SUPABASE
    ===================================================== */

    const response =
      await fetch(
        url,
        {

          method:
            'GET',

          headers: {

            'apikey':
              SUPABASE_SECRET_KEY,

            'Accept':
              'application/json'

          }

        }
      );


    /* =====================================================
       READ RESPONSE
    ===================================================== */

    const responseText =
      await response.text();


    let data;


    try {

      data =
        JSON.parse(responseText);

    }

    catch {

      data =
        responseText;

    }


    console.log(
      'Supabase HTTP status:',
      response.status
    );


    console.log(
      'Supabase response:',
      data
    );


    /* =====================================================
       RETURN DIAGNOSTIC
    ===================================================== */

    return res.status(200).json({

      diagnostic:
        true,

      supabase_project_host:
        projectHost,

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

      diagnostic:
        false,

      error:
        'Diagnostic failed',

      message:
        error.message

    });

  }

}
