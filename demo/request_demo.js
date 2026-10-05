// ============================================================
// BUSINESS TALKS
// REQUEST DEMO
// ============================================================


// ------------------------------------------------------------
// 1. CONFIGURATION
// ------------------------------------------------------------

const DEMO_REQUEST_WEBHOOK =
  'https://powerfulkiwi-n8n.cloudfy.live/webhook/946f31a5-9e5b-4aa8-a6d9-7672efaeaddd';

const DEMO_TOKEN_STORAGE_KEY =
  'businessTalksDemoToken';


// ------------------------------------------------------------
// 2. DOM ELEMENTS
// ------------------------------------------------------------

const requestState =
  document.getElementById(
    'requestState'
  );

const successState =
  document.getElementById(
    'successState'
  );

const demoRequestForm =
  document.getElementById(
    'demoRequestForm'
  );

const nameInput =
  document.getElementById(
    'nameInput'
  );

const emailInput =
  document.getElementById(
    'emailInput'
  );

const companyInput =
  document.getElementById(
    'companyInput'
  );

const professionInput =
  document.getElementById(
    'professionInput'
  );

const industryInput =
  document.getElementById(
    'industryInput'
  );

const languageInput =
  document.getElementById(
    'languageInput'
  );

const formError =
  document.getElementById(
    'formError'
  );

const requestButton =
  document.getElementById(
    'requestButton'
  );


// ------------------------------------------------------------
// 3. GET PREVIOUS DEMO TOKEN
// ------------------------------------------------------------

function getPreviousDemoToken() {

  try {

    const token =
      sessionStorage.getItem(
        DEMO_TOKEN_STORAGE_KEY
      );


    if (
      typeof token !== 'string' ||
      !token.trim()
    ) {

      return null;

    }


    return token.trim();

  }

  catch (error) {

    console.warn(
      'Unable to read previous demo token:',
      error
    );


    return null;

  }

}


// ------------------------------------------------------------
// 4. NORMALIZE INPUT VALUE
// ------------------------------------------------------------

function getInputValue(
  element
) {

  if (!element) {

    return '';

  }


  return element.value.trim();

}


// ------------------------------------------------------------
// 5. BUILD REQUEST PAYLOAD
// ------------------------------------------------------------

function buildRequestPayload() {

  return {

    name:
      getInputValue(
        nameInput
      ),

    email:
      getInputValue(
        emailInput
      ).toLowerCase(),

    company:
      getInputValue(
        companyInput
      ),

    profession:
      getInputValue(
        professionInput
      ),

    industry:
      getInputValue(
        industryInput
      ),

    target_language:
      getInputValue(
        languageInput
      ),

    previous_demo_token:
      getPreviousDemoToken()

  };

}


// ------------------------------------------------------------
// 6. VALIDATE PAYLOAD
// ------------------------------------------------------------

function validatePayload(
  payload
) {

  if (!payload.name) {

    return 'Informe seu nome.';

  }


  if (!payload.email) {

    return 'Informe seu e-mail.';

  }


  if (!payload.company) {

    return 'Informe sua empresa.';

  }


  if (!payload.profession) {

    return 'Informe seu cargo ou profissão.';

  }


  if (!payload.industry) {

    return 'Informe seu setor de atuação.';

  }


  if (!payload.target_language) {

    return 'Selecione o idioma de interesse.';

  }


  return '';

}


// ------------------------------------------------------------
// 7. SET SUBMIT STATE
// ------------------------------------------------------------

function setSubmittingState(
  submitting
) {

  requestButton.disabled =
    submitting;


  requestButton.textContent =
    submitting
      ? 'ENVIANDO...'
      : 'SOLICITAR DEMONSTRAÇÃO';

}


// ------------------------------------------------------------
// 8. SHOW ERROR
// ------------------------------------------------------------

function showFormError(
  message
) {

  formError.textContent =
    message || '';

}


// ------------------------------------------------------------
// 9. SHOW SUCCESS STATE
// ------------------------------------------------------------

function showSuccessState() {

  requestState.hidden =
    true;

  successState.hidden =
    false;


  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  });

}


// ------------------------------------------------------------
// 10. SEND DEMO REQUEST
// ------------------------------------------------------------

async function sendDemoRequest(
  payload
) {

  const response =
    await fetch(
      DEMO_REQUEST_WEBHOOK,
      {

        method:
          'POST',

        headers: {

          'Content-Type':
            'application/json'

        },

        body:
          JSON.stringify(
            payload
          )

      }
    );


  if (!response.ok) {

    throw new Error(
      `Demo request failed with status ${response.status}`
    );

  }


  return response;

}


// ------------------------------------------------------------
// 11. HANDLE FORM SUBMISSION
// ------------------------------------------------------------

async function handleFormSubmit(
  event
) {

  event.preventDefault();


  showFormError(
    ''
  );


  const payload =
    buildRequestPayload();


  const validationError =
    validatePayload(
      payload
    );


  if (validationError) {

    showFormError(
      validationError
    );

    return;

  }


  setSubmittingState(
    true
  );


  try {

    await sendDemoRequest(
      payload
    );


    showSuccessState();

  }

  catch (error) {

    console.error(
      'Demo request error:',
      error
    );


    showFormError(
      'Não foi possível processar sua solicitação. Tente novamente.'
    );


    setSubmittingState(
      false
    );

  }

}


// ------------------------------------------------------------
// 12. INITIALIZE
// ------------------------------------------------------------

function initializeDemoRequest() {

  if (!demoRequestForm) {

    console.error(
      'Demo request form not found.'
    );

    return;

  }


  demoRequestForm.addEventListener(
    'submit',
    handleFormSubmit
  );

}


// ------------------------------------------------------------
// 13. START
// ------------------------------------------------------------

initializeDemoRequest();
