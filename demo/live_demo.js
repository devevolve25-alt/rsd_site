/* =====================================================
   BUSINESS TALKS
   LIVE DEMO
===================================================== */


/* =====================================================
   ENDPOINTS
===================================================== */

/*
  PREPARATION WEBHOOK

  Responsibilities:
  - validate token
  - update user_name
  - update profession
  - update industry
  - generate demo scenario
  - save scenario
  - return success
*/

const DEMO_PREPARATION_WEBHOOK =
  'https://powerfulkiwi-n8n.cloudfy.live/webhook/7e399616-6269-4c8b-a671-60be6bbfb066';


/*
  TEMPORARY:

  This is still the production Live endpoint.

  Replace it when the dedicated demo Live
  workflow is created.
*/

const DEMO_LIVE_WEBHOOK =
  'https://powerfulkiwi-n8n.cloudfy.live/webhook/demo-live-start';


/*
  TEMPORARY:

  This is still the current transcript webhook.

  Replace it when the dedicated demo
  persistence / analysis workflow is created.
*/

const DEMO_TRANSCRIPT_WEBHOOK =
  'https://powerfulkiwi-n8n.cloudfy.live/webhook/demo_messages';


/* =====================================================
   PAGE ELEMENTS
===================================================== */

const preparationState =
  document.getElementById(
    'preparationState'
  );

const liveState =
  document.getElementById(
    'liveState'
  );

const demoForm =
  document.getElementById(
    'demoForm'
  );

const userNameInput =
  document.getElementById(
    'userNameInput'
  );

const professionInput =
  document.getElementById(
    'professionInput'
  );

const industryInput =
  document.getElementById(
    'industryInput'
  );

const continueButton =
  document.getElementById(
    'continueButton'
  );

const formError =
  document.getElementById(
    'formError'
  );

const talkButton =
  document.getElementById(
    'talkButton'
  );

const statusText =
  document.getElementById(
    'statusText'
  );

const liveIndicator =
  document.getElementById(
    'liveIndicator'
  );

const timer =
  document.getElementById(
    'timer'
  );

const liveSessionContent =
  document.getElementById(
    'liveSessionContent'
  );

const scenarioTitle =
  document.getElementById(
    'scenarioTitle'
  );

const scenarioSituation =
  document.getElementById(
    'scenarioSituation'
  );

const scenarioTask =
  document.getElementById(
    'scenarioTask'
  );

const feedbackState =
  document.getElementById(
    'feedbackState'
  );

const feedbackText =
  document.getElementById(
    'feedbackText'
  );


/* =====================================================
   TOKEN
===================================================== */

const urlParams =
  new URLSearchParams(
    window.location.search
  );

const liveToken =
  urlParams.get('token');


/* =====================================================
   PAGE STATE
===================================================== */

let preparationCompleted =
  false;

let preparationRequestRunning =
  false;


/* =====================================================
   LIVE SESSION STATE
===================================================== */

let sessionActive =
  false;

let sessionStartTime =
  null;

let timerInterval =
  null;

let peerConnection =
  null;

let dataChannel =
  null;

let remoteAudio =
  null;

let liveSessionId =
  null;

let liveMediaStream =
  null;

let openingInstructionEventId =
  null;

let openingCommentaryEventId =
  null;

let openingCommentarySent =
  false;


/* =====================================================
   TRANSCRIPT STATE
===================================================== */

let transcriptEvents =
  [];

let conversationMessages =
  [];

const TRANSCRIPT_GAP_THRESHOLD_MS =
  1500;

let conversationSaveStarted =
  false;


/* =====================================================
   DEFAULT PUBLIC SCENARIO
===================================================== */

/*
  These values are temporary placeholders only.

  After preparation, n8n returns the public scenario:
  - title
  - situation
  - user_task

  Private scenario data such as peer_context and
  possible_solutions must never be exposed here.
*/

const DEFAULT_SCENARIO_TITLE =
  'Professional workplace situation';

const DEFAULT_SCENARIO_SITUATION =
  'Your personalized professional situation will appear here.';

const DEFAULT_SCENARIO_TASK =
  'Understand the situation, propose a practical course of action, and explain your reasoning.';


/* =====================================================
   INITIAL PAGE STATE
===================================================== */

function initializePage() {

  preparationState.hidden =
    false;

  liveState.hidden =
    true;

  talkButton.disabled =
    true;

  liveSessionContent.hidden =
    false;

  feedbackState.hidden =
    true;

  feedbackText.textContent =
    '';

  scenarioTitle.textContent =
    DEFAULT_SCENARIO_TITLE;

  scenarioSituation.textContent =
    DEFAULT_SCENARIO_SITUATION;

  scenarioTask.textContent =
    DEFAULT_SCENARIO_TASK;


  /*
    No token means the invitation cannot
    be associated with a demo session.
  */

  if (!liveToken) {

    disablePreparation(
      'This demo link is invalid.'
    );

    console.error(
      'Demo token not found in URL'
    );

    return;

  }


  console.log(
    'Demo invitation token detected'
  );

}


/* =====================================================
   DISABLE PREPARATION
===================================================== */

function disablePreparation(
  message
) {

  userNameInput.disabled =
    true;

  professionInput.disabled =
    true;

  industryInput.disabled =
    true;

  continueButton.disabled =
    true;

  formError.textContent =
    message || 'Unable to continue.';

}


/* =====================================================
   NORMALIZE FORM VALUE
===================================================== */

function normalizeFormValue(
  value
) {

  if (
    typeof value !== 'string'
  ) {

    return '';

  }

  return value
    .trim()
    .replace(/\s+/g, ' ');

}


/* =====================================================
   VALIDATE PREPARATION FORM
===================================================== */

function validatePreparationForm() {

  const userName =
    normalizeFormValue(
      userNameInput.value
    );

  const profession =
    normalizeFormValue(
      professionInput.value
    );

  const industry =
    normalizeFormValue(
      industryInput.value
    );


  if (!userName) {

    return {
      valid: false,
      message:
        'Please enter your name.'
    };

  }


  if (!profession) {

    return {
      valid: false,
      message:
        'Please enter your profession.'
    };

  }


  if (!industry) {

    return {
      valid: false,
      message:
        'Please enter your industry.'
    };

  }


  return {

    valid:
      true,

    data: {

      user_name:
        userName,

      profession:
        profession,

      industry:
        industry

    }

  };

}


/* =====================================================
   PARSE HTTP RESPONSE
===================================================== */

async function parseResponse(
  response
) {

  const responseText =
    await response.text();


  if (!responseText) {

    return null;

  }


  try {

    return JSON.parse(
      responseText
    );

  }

  catch {

    return responseText;

  }

}


/* =====================================================
   PREPARE DEMO
===================================================== */

async function prepareDemo(
  participantData
) {

  if (!liveToken) {

    throw new Error(
      'Demo token is missing'
    );

  }


  /*
    Browser sends the token plus only
    the three participant-provided values.
  */

  const payload = {

    token:
      liveToken,

    user_name:
      participantData.user_name,

    profession:
      participantData.profession,

    industry:
      participantData.industry

  };


  console.log(
    'Preparing personalized demo'
  );


  const response =
    await fetch(
      DEMO_PREPARATION_WEBHOOK,
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


  const result =
    await parseResponse(
      response
    );


  if (!response.ok) {

    let message =
      'Unable to prepare the demo.';


    if (
      result &&
      typeof result === 'object' &&
      typeof result.message === 'string'
    ) {

      message =
        result.message;

    }


    throw new Error(
      message
    );

  }


  return result;

}


/* =====================================================
   COMPLETE PREPARATION
===================================================== */

function completePreparation(
  result
) {

  preparationCompleted =
    true;


  /*
    Participant information is already stored by n8n.
    The browser keeps only the public scenario data
    required to prepare the participant for the Live demo.
  */

  const preparationResult =
    Array.isArray(result)
      ? result[0]
      : result;

  const publicScenario =
    preparationResult &&
    typeof preparationResult === 'object' &&
    preparationResult.scenario &&
    typeof preparationResult.scenario === 'object'
      ? preparationResult.scenario
      : null;


  if (publicScenario) {

    if (
      typeof publicScenario.title === 'string' &&
      publicScenario.title.trim()
    ) {

      scenarioTitle.textContent =
        publicScenario.title.trim();

    }


    if (
      typeof publicScenario.situation === 'string' &&
      publicScenario.situation.trim()
    ) {

      scenarioSituation.textContent =
        publicScenario.situation.trim();

    }


    if (
      typeof publicScenario.user_task === 'string' &&
      publicScenario.user_task.trim()
    ) {

      scenarioTask.textContent =
        publicScenario.user_task.trim();

    }

  }

  else {

    console.warn(
      'Preparation response does not contain a public scenario'
    );

  }


  /*
    Clear form values before removing
    the preparation screen.
  */

  demoForm.reset();


  /*
    Switch UI state.
  */

  preparationState.hidden =
    true;

  liveState.hidden =
    false;

  liveSessionContent.hidden =
    false;

  feedbackState.hidden =
    true;


  /*
    Live can now be started.
  */

  talkButton.disabled =
    false;

  talkButton.textContent =
    'START TALK';

  statusText.textContent =
    'Ready to start';


  console.log(
    'Demo preparation completed'
  );

}


/* =====================================================
   PREPARATION FORM SUBMIT
===================================================== */

demoForm.addEventListener(
  'submit',
  async (event) => {

    event.preventDefault();


    if (
      preparationRequestRunning
    ) {

      return;

    }


    formError.textContent =
      '';


    const validation =
      validatePreparationForm();


    if (!validation.valid) {

      formError.textContent =
        validation.message;

      return;

    }


    preparationRequestRunning =
      true;


    continueButton.disabled =
      true;

    continueButton.textContent =
      'PREPARING DEMO...';


    userNameInput.disabled =
      true;

    professionInput.disabled =
      true;

    industryInput.disabled =
      true;


    try {

      const result =
        await prepareDemo(
          validation.data
        );


      console.log(
        'Demo preparation response:',
        result
      );


      completePreparation(
        result
      );

    }

    catch (error) {

      console.error(
        'Demo preparation failed:',
        error
      );


      formError.textContent =
        error.message ||
        'Unable to prepare the demo. Please try again.';


      userNameInput.disabled =
        false;

      professionInput.disabled =
        false;

      industryInput.disabled =
        false;

      continueButton.disabled =
        false;

      continueButton.textContent =
        'CONTINUE';

    }

    finally {

      preparationRequestRunning =
        false;

    }

  }
);


/* =====================================================
   TIMER
===================================================== */

function startTimer() {

  sessionStartTime =
    Date.now();


  timer.textContent =
    '00:00';


  timer.classList.add(
    'active'
  );


  updateTimer();


  timerInterval =
    setInterval(
      updateTimer,
      1000
    );

}


function updateTimer() {

  if (!sessionStartTime) {

    return;

  }


  const elapsed =
    Math.floor(
      (
        Date.now() -
        sessionStartTime
      ) / 1000
    );


  const minutes =
    Math.floor(
      elapsed / 60
    );


  const seconds =
    elapsed % 60;


  timer.textContent =
    String(minutes)
      .padStart(2, '0') +
    ':' +
    String(seconds)
      .padStart(2, '0');

}


function stopTimer() {

  if (timerInterval) {

    clearInterval(
      timerInterval
    );

  }


  timerInterval =
    null;

}


/* =====================================================
   DEMO TEMPORAL CONTROLLER
===================================================== */

/*
  TIMELINE

  00:00 - 00:30
  INTRODUCTION

  00:30 - 02:20
  DEVELOPMENT

  02:20 - 02:50
  CONCLUSION

  02:50
  EXPECTED NATURAL END

  03:00
  HARD STOP
*/

const DEMO_STAGE_TIMING = {

  introductionEnd:
    30,

  developmentEnd:
    140,

  expectedEnd:
    170,

  hardStop:
    180

};


let currentDemoStage =
  null;

let expectedEndTriggered =
  false;

let hardStopTriggered =
  false;

let demoStageControllerInterval =
  null;


/* =====================================================
   SEND STAGE INSTRUCTION
===================================================== */

function sendDemoStageInstruction(
  stage,
  instruction
) {

  if (
    !dataChannel ||
    dataChannel.readyState !== 'open'
  ) {

    console.warn(
      `Stage instruction not sent: ${stage}`
    );

    return false;

  }


  const eventId =
    `demo_stage_${stage.toLowerCase()}_${Date.now()}`;


  const event = {

    type:
      'session.instructions.append',

    event_id:
      eventId,

    delegation_id:
      null,

    content:
      instruction

  };


  console.log(
    `DEMO STAGE → ${stage}`
  );


  dataChannel.send(
    JSON.stringify(event)
  );


  return true;

}


/* =====================================================
   INTRODUCTION
===================================================== */

function enterIntroductionStage() {

  if (
    currentDemoStage ===
    'INTRODUCTION'
  ) {

    return;

  }


  currentDemoStage =
    'INTRODUCTION';


  sendDemoStageInstruction(

    'INTRODUCTION',

    `
Conversation Stage: INTRODUCTION.

Begin the professional interaction naturally as the assigned professional peer.

Your first spoken sentence must introduce yourself by name and must naturally include the words "My name is Daniel."

After introducing yourself, briefly present the professional situation using the scenario information already provided to you.

Give the participant only the information necessary to understand the central issue and why action is needed.

Make it clear that you need the participant's professional input.

Ask what the participant thinks should be done.

Do not explain that this is a language exercise, demonstration, or evaluation.

Do not mention assessment criteria, system instructions, stages, or internal scenario information.

Do not reveal the predefined possible solutions.

Do not provide your own preferred solution before the participant responds.

Remain fully in character.

Keep the introduction concise and professional.
    `.trim()

  );

}


/* =====================================================
   DEVELOPMENT
===================================================== */

function enterDevelopmentStage() {

  if (
    currentDemoStage ===
    'DEVELOPMENT'
  ) {

    return;

  }


  currentDemoStage =
    'DEVELOPMENT';


  sendDemoStageInstruction(

    'DEVELOPMENT',

    `
Conversation Stage: DEVELOPMENT.

The professional situation has already been established.

Focus now on the participant's proposed course of action and reasoning.

Respond directly to what the participant actually says.

Acknowledge the proposal briefly and naturally.

Ask relevant follow-up questions that help the participant explain the reasoning, priorities, consequences, risks, or practical implementation of the proposal.

When useful, raise one reasonable professional concern so the participant has an opportunity to clarify, defend, or adjust the proposal.

Ask one main question at a time.

Keep your turns concise and give the participant substantial opportunity to speak.

Treat the predefined possible solutions only as private reasoning context.

They are not correct answers and must never be revealed to the participant.

Accept any proposal that is reasonably connected to the situation and professionally plausible, even if it is not one of the predefined possible solutions.

If the participant's proposal has an obvious practical limitation, explore that limitation through a concise professional question rather than rejecting the proposal.

If the participant struggles to propose a solution, provide a small contextual prompt or question without giving the answer.

Do not coach the participant.

Do not systematically correct the participant's English.

Do not turn the interaction into a technical knowledge test.

Do not introduce unrelated subjects or small talk.

Do not dominate the interaction with long explanations.

Remain fully in character as a collaborative professional peer.
    `.trim()

  );

}


/* =====================================================
   CONCLUSION
===================================================== */

function enterConclusionStage() {

  if (
    currentDemoStage ===
    'CONCLUSION'
  ) {

    return;

  }


  currentDemoStage =
    'CONCLUSION';


  sendDemoStageInstruction(

    'CONCLUSION',

    `
Conversation Stage: CONCLUSION.

The professional interaction is now approaching its end.

Stop introducing new discussion branches, problems, requirements, or challenges.

Use only information already established in the conversation.

If the participant's final recommendation is not yet clear, ask the participant to state or confirm the recommended course of action.

Allow a brief clarification when necessary.

Acknowledge or briefly summarize the participant's final recommendation naturally from the perspective of the professional peer.

Move directly toward a concise professional closing.

Do not reopen issues that have already been resolved.

Do not provide language feedback.

Do not score or evaluate the participant.

Do not provide a CEFR assessment.

Do not mention evaluation, exercises, stages, AI, or system instructions.

Do not switch from professional peer to teacher or evaluator.

Remain fully in character.

Close the interaction naturally and concisely by showing appreciation.
    `.trim()

  );

}


/* =====================================================
   EXPECTED NATURAL END
===================================================== */

function triggerExpectedEnd() {

  if (expectedEndTriggered) {

    return;

  }


  expectedEndTriggered =
    true;


  sendDemoStageInstruction(

    'EXPECTED_END',

    `
The planned interaction time has been reached.

The conversation must end now.

This is the final closing stage of the interaction.

Do not ask any question.

Do not request confirmation, clarification, feedback, additional information, or another response from the participant.

Do not introduce any new information, problem, alternative, concern, challenge, or topic.

Do not reopen any previous discussion point.

If appropriate, briefly acknowledge the participant's final recommendation using only information already established in the conversation.

Then give a clear and concise professional farewell.

Your closing must clearly signal that the conversation is finished. End with a natural farewell such as "Thank you for your time. Have a good day."

Do not invite the participant to continue speaking.

Do not say phrases such as "Is there anything else?", "What do you think?", "Would you like to add anything?", or any equivalent question.

After the farewell, do not continue the conversation.

Remain fully in character.

This must be your final conversational turn.
    `.trim()

  );

}


/* =====================================================
   HARD STOP
===================================================== */

function triggerDemoHardStop() {

  if (hardStopTriggered) {

    return;

  }


  hardStopTriggered =
    true;


  console.log(
    'DEMO HARD STOP → 03:00'
  );


  if (sessionActive) {

    endSession();

  }

}


/* =====================================================
   UPDATE TEMPORAL CONTROLLER
===================================================== */

function updateDemoStageController() {

  if (
    !sessionActive ||
    !sessionStartTime
  ) {

    return;

  }


  const elapsedSeconds =
    Math.floor(
      (
        Date.now() -
        sessionStartTime
      ) / 1000
    );


  /* INTRODUCTION */

  if (
    elapsedSeconds <
    DEMO_STAGE_TIMING.introductionEnd
  ) {

    if (
      currentDemoStage === null
    ) {

      enterIntroductionStage();

    }

    return;

  }


  /* DEVELOPMENT */

  if (
    elapsedSeconds <
    DEMO_STAGE_TIMING.developmentEnd
  ) {

    if (
      currentDemoStage !==
      'DEVELOPMENT'
    ) {

      enterDevelopmentStage();

    }

    return;

  }


  /* CONCLUSION */

  if (
    elapsedSeconds <
    DEMO_STAGE_TIMING.expectedEnd
  ) {

    if (
      currentDemoStage !==
      'CONCLUSION'
    ) {

      enterConclusionStage();

    }

    return;

  }


  /* EXPECTED END */

  if (!expectedEndTriggered) {

    triggerExpectedEnd();

  }


  /* HARD STOP */

  if (
    elapsedSeconds >=
      DEMO_STAGE_TIMING.hardStop &&
    !hardStopTriggered
  ) {

    triggerDemoHardStop();

  }

}


/* =====================================================
   START TEMPORAL CONTROLLER
===================================================== */

function startDemoStageController() {

  if (demoStageControllerInterval) {

    clearInterval(
      demoStageControllerInterval
    );

  }


  currentDemoStage =
    null;

  expectedEndTriggered =
    false;

  hardStopTriggered =
    false;


  updateDemoStageController();


  demoStageControllerInterval =
    setInterval(
      updateDemoStageController,
      1000
    );

}


/* =====================================================
   STOP TEMPORAL CONTROLLER
===================================================== */

function stopDemoStageController() {

  if (demoStageControllerInterval) {

    clearInterval(
      demoStageControllerInterval
    );

  }


  demoStageControllerInterval =
    null;

}


/* =====================================================
   WAIT FOR ICE
===================================================== */

function waitForIceGatheringComplete(
  pc
) {

  return new Promise(
    (resolve) => {

      if (
        pc.iceGatheringState ===
        'complete'
      ) {

        resolve();
        return;

      }


      function checkState() {

        if (
          pc.iceGatheringState ===
          'complete'
        ) {

          pc.removeEventListener(
            'icegatheringstatechange',
            checkState
          );

          resolve();

        }

      }


      pc.addEventListener(
        'icegatheringstatechange',
        checkState
      );

    }
  );

}


/* =====================================================
   BUILD CONVERSATION MESSAGES
===================================================== */

function buildConversationMessages(
  events
) {

  if (
    !Array.isArray(events) ||
    events.length === 0
  ) {

    return [];

  }


  const orderedEvents =
    events
      .map(
        (event, index) => ({
          ...event,
          _originalIndex:
            index
        })
      )
      .sort(
        (a, b) => {

          const aStart =
            Number.isFinite(a.start_ms)
              ? a.start_ms
              : Number.MAX_SAFE_INTEGER;

          const bStart =
            Number.isFinite(b.start_ms)
              ? b.start_ms
              : Number.MAX_SAFE_INTEGER;


          if (
            aStart !== bStart
          ) {

            return (
              aStart - bStart
            );

          }


          return (
            a._originalIndex -
            b._originalIndex
          );

        }
      );


  const messages =
    [];

  let currentMessage =
    null;


  for (
    const event
    of orderedEvents
  ) {

    if (
      !event ||
      !event.speaker ||
      typeof event.text !==
        'string'
    ) {

      continue;

    }


    if (
      event.text.length === 0
    ) {

      continue;

    }


    const eventStart =
      Number.isFinite(
        event.start_ms
      )
        ? event.start_ms
        : null;


    const eventEnd =
      Number.isFinite(
        event.end_ms
      )
        ? event.end_ms
        : eventStart;


    if (!currentMessage) {

      currentMessage = {

        role:
          event.speaker,

        content:
          event.text,

        start_ms:
          eventStart,

        end_ms:
          eventEnd

      };

      continue;

    }


    const speakerChanged =
      event.speaker !==
      currentMessage.role;


    let temporalGap =
      0;


    if (
      eventStart !== null &&
      currentMessage.end_ms !== null
    ) {

      temporalGap =
        eventStart -
        currentMessage.end_ms;

    }


    const temporalBreak =
      !speakerChanged &&
      temporalGap >
        TRANSCRIPT_GAP_THRESHOLD_MS;


    if (
      speakerChanged ||
      temporalBreak
    ) {

      messages.push(
        currentMessage
      );


      currentMessage = {

        role:
          event.speaker,

        content:
          event.text,

        start_ms:
          eventStart,

        end_ms:
          eventEnd

      };


      continue;

    }


    currentMessage.content +=
      event.text;


    if (
      eventEnd !== null
    ) {

      if (
        currentMessage.end_ms ===
        null
      ) {

        currentMessage.end_ms =
          eventEnd;

      }

      else {

        currentMessage.end_ms =
          Math.max(
            currentMessage.end_ms,
            eventEnd
          );

      }

    }

  }


  if (currentMessage) {

    messages.push(
      currentMessage
    );

  }


  return messages.map(
    (message, index) => ({

      sequence:
        index + 1,

      ...message

    })
  );

}


/* =====================================================
   BUILD FINAL TRANSCRIPT
===================================================== */

function buildAndPrintFinalTranscript(
  label = ''
) {

  const suffix =
    label
      ? ` (${label})`
      : '';


  console.log(
    `FINAL RAW TRANSCRIPT${suffix}:`,
    transcriptEvents
  );


  conversationMessages =
    buildConversationMessages(
      transcriptEvents
    );


  console.log(
    `FINAL CONVERSATION MESSAGES${suffix}:`,
    conversationMessages
  );


  return conversationMessages;

}


/* =====================================================
   FEEDBACK RESPONSE
===================================================== */

function extractFeedback(
  result
) {

  if (
    !Array.isArray(result) ||
    !result[0] ||
    typeof result[0] !== 'object'
  ) {

    return '';

  }


  const report =
    result[0];


  if (
    report.validation?.status !== 'ok'
  ) {

    console.warn(
      'Feedback response validation is not ok:',
      report.validation
    );

    return '';

  }


  const feedback =
    report.final_report?.feedback;


  if (
    typeof feedback !== 'string' ||
    !feedback.trim()
  ) {

    return '';

  }


  return feedback.trim();

}


function showFeedback(
  feedback
) {

  if (
    typeof feedback !== 'string' ||
    !feedback.trim()
  ) {

    return false;

  }


  feedbackText.textContent =
    feedback.trim();

  liveSessionContent.hidden =
    true;

  feedbackState.hidden =
    false;


  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  });


  console.log(
    'Demo feedback displayed'
  );


  return true;

}


/* =====================================================
   SAVE CONVERSATION
===================================================== */

async function saveConversationMessages() {

  if (conversationSaveStarted) {

    return {
      skipped: true
    };

  }


  conversationSaveStarted =
    true;


  if (
    !Array.isArray(
      conversationMessages
    ) ||
    conversationMessages.length === 0
  ) {

    conversationMessages =
      buildConversationMessages(
        transcriptEvents
      );

  }


  if (
    conversationMessages.length === 0
  ) {

    console.warn(
      'No transcript available'
    );


    return {
      skipped: true
    };

  }


  const payload = {

    token:
      liveToken,

    interaction:
      'sync',

    messages:
      conversationMessages

  };


  const response =
    await fetch(
      DEMO_TRANSCRIPT_WEBHOOK,
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


  const result =
    await parseResponse(
      response
    );


  if (!response.ok) {

    throw new Error(
      `Transcript webhook error ${response.status}`
    );

  }


  return result;

}


/* =====================================================
   FINALIZE TRANSCRIPT
===================================================== */

async function finalizeSessionTranscript(
  label = ''
) {

  buildAndPrintFinalTranscript(
    label
  );


  try {

    const result =
      await saveConversationMessages();

    return result;

  }

  catch (error) {

    console.error(
      'Transcript persistence failed:',
      error
    );

    return null;

  }

}


/* =====================================================
   OPENING INSTRUCTIONS
===================================================== */

function requestOpeningInstructions() {

  if (
    !dataChannel ||
    dataChannel.readyState !==
      'open'
  ) {

    return;

  }


  openingInstructionEventId =
    'demo_opening_instruction_' +
    Date.now();


  dataChannel.send(
    JSON.stringify({

      type:
        'session.instructions.append',

      event_id:
        openingInstructionEventId,

      delegation_id:
        null,

      content:
        'Begin the conversation now. Follow the current INTRODUCTION stage instructions exactly. Do not add a separate opening structure or additional introductory content.'

    })
  );

}


/* =====================================================
   OPENING COMMENTARY
===================================================== */

function requestOpeningCommentary() {

  if (
    !dataChannel ||
    dataChannel.readyState !==
      'open'
  ) {

    return;

  }


  if (openingCommentarySent) {

    return;

  }


  openingCommentarySent =
    true;


  openingCommentaryEventId =
    'demo_opening_commentary_' +
    Date.now();


  dataChannel.send(
    JSON.stringify({

      type:
        'session.commentary.append',

      event_id:
        openingCommentaryEventId,

      delegation_id:
        null,

      content:
        'Begin the conversation now, following the instructions provided.'

    })
  );

}


/* =====================================================
   OPENAI EVENT HANDLER
===================================================== */

async function handleOpenAIEvent(
  event
) {

  let data;


  try {

    data =
      JSON.parse(
        event.data
      );

  }

  catch {

    return;

  }


  console.log(
    'OpenAI Live event:',
    data
  );


  /* USER TRANSCRIPT */

  if (
    data.type ===
    'session.input_transcript.delta'
  ) {

    transcriptEvents.push({

      speaker:
        'user',

      text:
        data.delta,

      start_ms:
        data.start_ms,

      end_ms:
        data.end_ms

    });


    return;

  }


  /* EXECUTOR TRANSCRIPT */

  if (
    data.type ===
    'session.output_transcript.delta'
  ) {

    transcriptEvents.push({

      speaker:
        'executor',

      text:
        data.delta,

      start_ms:
        data.start_ms,

      end_ms:
        data.end_ms

    });


    return;

  }


  /* SESSION STARTED */

  if (
    data.type ===
    'session.started'
  ) {

    liveSessionId =
      data.session?.id ||
      liveSessionId;


    sessionActive =
      true;


    talkButton.disabled =
      false;

    talkButton.textContent =
      'END TALK';

    talkButton.classList.add(
      'live'
    );

    liveIndicator.classList.add(
      'active'
    );

    statusText.textContent =
      'LIVE';


    startTimer();

    startDemoStageController();

    requestOpeningInstructions();


    return;

  }


  /* INSTRUCTIONS ACCEPTED */

  if (
    data.type ===
    'session.instructions.appended'
  ) {

    if (
      data.client_event_id ===
      openingInstructionEventId
    ) {

      requestOpeningCommentary();

    }


    return;

  }


  /* SESSION CLOSED */

  if (
    data.type ===
    'session.closed'
  ) {

    statusText.textContent =
      'Saving conversation...';


    const result =
      await finalizeSessionTranscript();


    const feedback =
      extractFeedback(
        result
      );


    cleanupSession(
      result
        ? 'Session ended'
        : 'Session ended - save failed'
    );


    if (feedback) {

      showFeedback(
        feedback
      );

    }

    else {

      statusText.textContent =
        'Session ended - feedback unavailable';

    }


    return;

  }


  /* ERROR */

  if (
    data.type ===
    'error'
  ) {

    console.error(
      'GPT Live error:',
      data
    );


    statusText.textContent =
      'Live session error';

  }

}


/* =====================================================
   START LIVE SESSION
===================================================== */

async function startSession() {

  /*
    Live cannot start before preparation.
  */

  if (!preparationCompleted) {

    console.error(
      'Demo preparation has not been completed'
    );

    return;

  }


  if (
    sessionActive ||
    peerConnection
  ) {

    return;

  }


  openingInstructionEventId =
    null;

  openingCommentaryEventId =
    null;

  openingCommentarySent =
    false;


  transcriptEvents =
    [];

  conversationMessages =
    [];

  conversationSaveStarted =
    false;


  talkButton.disabled =
    true;

  talkButton.textContent =
    'CONNECTING...';

  statusText.textContent =
    'Requesting microphone access';


  try {


    /* MICROPHONE */

    liveMediaStream =
      await navigator.mediaDevices
        .getUserMedia({
          audio: true
        });


    statusText.textContent =
      'Creating secure connection';


    /* WEBRTC */

    peerConnection =
      new RTCPeerConnection();


    /* REMOTE AUDIO */

    remoteAudio =
      document.createElement(
        'audio'
      );


    remoteAudio.autoplay =
      true;

    remoteAudio.playsInline =
      true;


    document.body.appendChild(
      remoteAudio
    );


    peerConnection.addEventListener(
      'track',
      (event) => {

        if (
          event.streams &&
          event.streams[0]
        ) {

          remoteAudio.srcObject =
            event.streams[0];

        }

        else {

          remoteAudio.srcObject =
            new MediaStream([
              event.track
            ]);

        }


        remoteAudio
          .play()
          .catch(
            (error) => {

              console.warn(
                'Audio autoplay warning:',
                error
              );

            }
          );

      }
    );


    /* MICROPHONE TRACK */

    liveMediaStream
      .getAudioTracks()
      .forEach(
        (track) => {

          peerConnection.addTrack(
            track,
            liveMediaStream
          );

        }
      );


    /* DATA CHANNEL */

    dataChannel =
      peerConnection
        .createDataChannel(
          'oai-events'
        );


    dataChannel.addEventListener(
      'message',
      handleOpenAIEvent
    );


    dataChannel.addEventListener(
      'open',
      () => {

        statusText.textContent =
          'Initializing Live session';

      }
    );


    dataChannel.addEventListener(
      'error',
      (error) => {

        console.error(
          'Data channel error:',
          error
        );

      }
    );


    /* CONNECTION MONITOR */

    peerConnection.addEventListener(
      'connectionstatechange',
      () => {

        if (
          peerConnection &&
          peerConnection.connectionState ===
            'failed'
        ) {

          cleanupSession(
            'Connection failed'
          );

        }

      }
    );


    /* SDP OFFER */

    statusText.textContent =
      'Preparing Live session';


    const offer =
      await peerConnection
        .createOffer();


    await peerConnection
      .setLocalDescription(
        offer
      );


    await waitForIceGatheringComplete(
      peerConnection
    );


    const sdp =
      peerConnection
        .localDescription
        ?.sdp;


    if (!sdp) {

      throw new Error(
        'Unable to create SDP offer'
      );

    }


    /* SEND TO N8N */

    statusText.textContent =
      'Connecting to GPT-Live-1';


    const response =
      await fetch(
        DEMO_LIVE_WEBHOOK,
        {

          method:
            'POST',

          headers: {

            'Content-Type':
              'application/json'

          },

          body:
            JSON.stringify({

              token:
                liveToken,

              sdp:
                sdp

            })

        }
      );


    const result =
      await parseResponse(
        response
      );


    if (!response.ok) {

      throw new Error(
        `Live API error ${response.status}`
      );

    }


    if (
      !result ||
      typeof result !== 'object' ||
      !result.transport ||
      !result.transport.sdp
    ) {

      throw new Error(
        'Live response does not contain SDP answer'
      );

    }


    liveSessionId =
      result.session?.id ||
      null;


    /* APPLY SDP ANSWER */

    await peerConnection
      .setRemoteDescription({

        type:
          'answer',

        sdp:
          result.transport.sdp

      });


    statusText.textContent =
      'Waiting for Live session';

  }

  catch (error) {

    console.error(
      'Unable to start Live demo:',
      error
    );


    cleanupSession(
      'Unable to start session'
    );

  }

}


/* =====================================================
   END SESSION
===================================================== */

function endSession() {

  if (!sessionActive) {

    return;

  }


  talkButton.disabled =
    true;

  statusText.textContent =
    'Ending conversation...';


  if (
    dataChannel &&
    dataChannel.readyState ===
      'open'
  ) {

    dataChannel.send(
      JSON.stringify({
        type:
          'session.close'
      })
    );


    setTimeout(
      async () => {

        if (peerConnection) {

          statusText.textContent =
            'Saving conversation...';


          const result =
            await finalizeSessionTranscript(
              'fallback'
            );


          const feedback =
            extractFeedback(
              result
            );


          cleanupSession(
            result
              ? 'Session ended'
              : 'Session ended - save failed'
          );


          if (feedback) {

            showFeedback(
              feedback
            );

          }

        }

      },
      15000
    );


    return;

  }


  finalizeSessionTranscript(
    'local close'
  )
    .then(
      (result) => {

        const feedback =
          extractFeedback(
            result
          );


        cleanupSession(
          result
            ? 'Session ended'
            : 'Session ended - save failed'
        );


        if (feedback) {

          showFeedback(
            feedback
          );

        }

      }
    );

}


/* =====================================================
   CLEANUP
===================================================== */

function cleanupSession(
  message
) {

  if (liveMediaStream) {

    liveMediaStream
      .getTracks()
      .forEach(
        (track) =>
          track.stop()
      );


    liveMediaStream =
      null;

  }


  if (dataChannel) {

    try {

      dataChannel.close();

    }

    catch {
      // no-op
    }

  }


  dataChannel =
    null;


  if (peerConnection) {

    try {

      peerConnection.close();

    }

    catch {
      // no-op
    }

  }


  peerConnection =
    null;


  if (remoteAudio) {

    try {

      remoteAudio.pause();

      remoteAudio.srcObject =
        null;

      remoteAudio.remove();

    }

    catch {
      // no-op
    }

  }


  remoteAudio =
    null;


  stopTimer();

  stopDemoStageController();


  sessionStartTime =
    null;

  sessionActive =
    false;

  liveSessionId =
    null;


  liveIndicator.classList.remove(
    'active'
  );


  talkButton.classList.remove(
    'live'
  );


  talkButton.disabled =
    true;

  talkButton.textContent =
    'SESSION ENDED';


  statusText.textContent =
    message ||
    'Session ended';

}


/* =====================================================
   TALK BUTTON
===================================================== */

talkButton.addEventListener(
  'click',
  () => {

    if (sessionActive) {

      endSession();

      return;

    }


    startSession();

  }
);


/* =====================================================
   PAGE UNLOAD
===================================================== */

window.addEventListener(
  'beforeunload',
  () => {

    if (liveMediaStream) {

      liveMediaStream
        .getTracks()
        .forEach(
          (track) =>
            track.stop()
        );

    }


    if (dataChannel) {

      try {

        dataChannel.close();

      }

      catch {
        // no-op
      }

    }


    if (peerConnection) {

      try {

        peerConnection.close();

      }

      catch {
        // no-op
      }

    }

  }
);


/* =====================================================
   INITIALIZE
===================================================== */

initializePage();
