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
     TEMPORARY TEST SESSION

     Hardcoded ONLY for the current development test.

     In production, session_id will come from the
     validated signed token.
  ===================================================== */

  const SESSION_ID =
    '3a1f0bf3-323e-45ab-bb00-3b7fc345a64c';


  try {

    /* =====================================================
       INPUT
    ===================================================== */

    const {
      messages
    } = req.body || {};


    if (!Array.isArray(messages)) {

      return res.status(400).json({
        error: 'messages must be an array'
      });

    }


    if (messages.length === 0) {

      return res.status(400).json({
        error: 'messages cannot be empty'
      });

    }


    /* =====================================================
       BASIC MESSAGE VALIDATION
    ===================================================== */

    for (const message of messages) {

      if (
        !message ||
        !Number.isInteger(message.sequence) ||
        !['user', 'executor'].includes(message.role) ||
        typeof message.content !== 'string'
      ) {

        return res.status(400).json({
          error: 'Invalid conversation message structure'
        });

      }

    }


    /* =====================================================
       SUPABASE CONFIG
    ===================================================== */

    const SUPABASE_URL =
      process.env.SUPABASE_URL;

    const SUPABASE_SECRET_KEY =
      process.env.SUPABASE_SECRET_KEY;


    if (
      !SUPABASE_URL ||
      !SUPABASE_SECRET_KEY
    ) {

      console.error(
        'Missing Supabase environment variables'
      );

      return res.status(500).json({
        error: 'Server configuration error'
      });

    }


    /* =====================================================
       UPDATE SESSION
    ===================================================== */

    const supabaseResponse =
      await fetch(
        `${SUPABASE_URL}/rest/v1/sessions?id=eq.${SESSION_ID}`,
        {

          method:
            'PATCH',

          headers: {

            'apikey':
              SUPABASE_SECRET_KEY,

            'Authorization':
              `Bearer ${SUPABASE_SECRET_KEY}`,

            'Content-Type':
              'application/json',

            'Prefer':
              'return=representation'

          },

          body:
            JSON.stringify({

              messages:
                messages

            })

        }
      );


    /* =====================================================
       READ SUPABASE RESPONSE
    ===================================================== */

    const responseText =
      await supabaseResponse.text();


    let result = null;


    if (responseText) {

      try {

        result =
          JSON.parse(responseText);

      }

      catch {

        result =
          responseText;

      }

    }


    /* =====================================================
       SUPABASE ERROR
    ===================================================== */

    if (!supabaseResponse.ok) {

      console.error(
        'Supabase transcript save error:',
        result
      );


      return res
        .status(supabaseResponse.status)
        .json({

          error:
            'Failed to save conversation',

          details:
            result

        });

    }


    /* =====================================================
       SESSION NOT FOUND
    ===================================================== */

    if (
      !Array.isArray(result) ||
      result.length === 0
    ) {

      return res.status(404).json({
        error: 'Session not found'
      });

    }


    /* =====================================================
       SUCCESS
    ===================================================== */

    console.log(
      'Live conversation saved:',
      {

        session_id:
          SESSION_ID,

        messages:
          messages.length

      }
    );


    return res.status(200).json({

      success:
        true,

      session_id:
        SESSION_ID,

      messages_saved:
        messages.length

    });

  }


  catch (error) {

    console.error(
      'Unexpected transcript save error:',
      error
    );


    return res.status(500).json({

      error:
        'Failed to save live transcript'

    });

  }

}
