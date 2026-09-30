/* =====================================================
   ELEMENTS
===================================================== */

const talkButton =
  document.getElementById('talkButton');

const statusText =
  document.getElementById('statusText');

const liveIndicator =
  document.getElementById('liveIndicator');

const timer =
  document.getElementById('timer');


/* =====================================================
   LIVE ACCESS TOKEN
===================================================== */

const urlParams =
  new URLSearchParams(
    window.location.search
  );

const liveToken =
  urlParams.get('token');


if (!liveToken) {

  talkButton.disabled =
    true;

  statusText.textContent =
    'Invalid Live access link';

  console.error(
    'Live access token not found in URL'
  );

}


/* =====================================================
   SESSION STATE
===================================================== */

let sessionActive = false;
let sessionStartTime = null;
let timerInterval = null;

let peerConnection = null;
let dataChannel = null;
let remoteAudio = null;
let liveSessionId = null;

let liveMediaStream = null;

let openingInstructionEventId = null;
let openingCommentaryEventId = null;
let openingCommentarySent = false;


/* =====================================================
   TRANSCRIPT STATE
===================================================== */

let transcriptEvents = [];

let conversationMessages = [];

const TRANSCRIPT_GAP_THRESHOLD_MS = 1500;


/*
  Prevent duplicate persistence.

  session.closed, fallback timeout and local close
  can potentially reach the finalization logic.

  This flag guarantees that the conversation
  is persisted only once.
*/

let conversationSaveStarted = false;


/* =====================================================
   DEMO SESSION DATA
===================================================== */

const sessionData = {

  mission:
    'Understand the professional situation, propose a practical course of action, and explain your reasoning.',

  objective:
    'Reach a practical professional recommendation through the conversation.'

};


/* =====================================================
   LOAD PAGE DATA
===================================================== */

function loadSessionData(data) {

  document.getElementById('mission')
    .textContent =
      data.mission || '';

  document.getElementById('objective')
    .textContent =
      data.objective || '';

}


loadSessionData(sessionData);


/* =====================================================
   TIMER
===================================================== */

function startTimer() {

  sessionStartTime =
    Date.now();

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
      (Date.now() - sessionStartTime) /
      1000
    );

  const minutes =
    Math.floor(
      elapsed / 60
    );

  const seconds =
    elapsed % 60;

  timer.textContent =
    String(minutes).padStart(2, '0') +
    ':' +
    String(seconds).padStart(2, '0');

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
   DEMO TEMPORAL STAGE CONTROLLER
===================================================== */

/*
  DEMO SESSION TIMELINE

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


/* =====================================================
   CONTROLLER STATE
===================================================== */

let currentDemoStage =
  null;

let expectedEndTriggered =
  false;

let hardStopTriggered =
  false;

let demoStageControllerInterval =
  null;


/* =====================================================
   SEND STAGE INSTRUCTION TO GPT-LIVE
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
      `Demo stage instruction not sent: DataChannel unavailable (${stage})`
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
    `DEMO STAGE INSTRUCTION → ${stage}`,
    event
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


  console.log(
    'DEMO STAGE → INTRODUCTION'
  );


  sendDemoStageInstruction(

    'INTRODUCTION',

    `
Conversation Stage: INTRODUCTION.

Begin the professional interaction naturally as the assigned professional peer.

Briefly present the professional situation using the scenario information already provided to you.

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


  console.log(
    'DEMO STAGE → DEVELOPMENT'
  );


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


  console.log(
    'DEMO STAGE → CONCLUSION'
  );


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

Close the interaction naturally and concisely.
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


  console.log(
    'DEMO EXPECTED END → 02:50'
  );


  sendDemoStageInstruction(

    'EXPECTED_END',

    `
The planned interaction time has been reached.

Finish the professional conversation now.

If a final acknowledgement or farewell is necessary, make it brief and natural.

Do not ask another question.

Do not introduce any new information, problem, alternative, challenge, or topic.

Remain fully in character.

Close the interaction immediately after the final professional acknowledgement.
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


  /*
    Use the existing endSession() mechanism.

    This preserves transcript finalization
    and persistence behavior.
  */

  if (sessionActive) {

    endSession();

  }

}


/* =====================================================
   TEMPORAL CONTROLLER
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
      (Date.now() - sessionStartTime) /
      1000
    );


  /*
    INTRODUCTION
    00:00 → 00:30
  */

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


  /*
    DEVELOPMENT
    00:30 → 02:20
  */

  if (
    elapsedSeconds <
    DEMO_STAGE_TIMING.developmentEnd
  ) {

    if (
      currentDemoStage ===
      'INTRODUCTION'
    ) {

      enterDevelopmentStage();

    }

    return;

  }


  /*
    CONCLUSION
    02:20 → 02:50
  */

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


  /*
    EXPECTED NATURAL END
    02:50
  */

  if (
    !expectedEndTriggered
  ) {

    triggerExpectedEnd();

  }


  /*
    HARD STOP
    03:00
  */

  if (
    elapsedSeconds >=
      DEMO_STAGE_TIMING.hardStop &&
    !hardStopTriggered
  ) {

    triggerDemoHardStop();

  }

}


/* =====================================================
   START STAGE CONTROLLER
===================================================== */

function startDemoStageController() {

  /*
    Avoid duplicate controller intervals.
  */

  if (demoStageControllerInterval) {

    clearInterval(
      demoStageControllerInterval
    );

  }


  /*
    Reset controller state.
  */

  currentDemoStage =
    null;

  expectedEndTriggered =
    false;

  hardStopTriggered =
    false;


  console.log(
    'DEMO TEMPORAL STAGE CONTROLLER → STARTED'
  );


  /*
    Run immediately so INTRODUCTION
    is activated without waiting 1 second.
  */

  updateDemoStageController();


  /*
    Date.now() / sessionStartTime remains
    the source of truth.
  */

  demoStageControllerInterval =
    setInterval(
      updateDemoStageController,
      1000
    );

}


/* =====================================================
   STOP STAGE CONTROLLER
===================================================== */

function stopDemoStageController() {

  if (demoStageControllerInterval) {

    clearInterval(
      demoStageControllerInterval
    );

  }


  demoStageControllerInterval =
    null;


  console.log(
    'DEMO TEMPORAL STAGE CONTROLLER → STOPPED'
  );

}


/* =====================================================
   WAIT FOR ICE GATHERING
===================================================== */

function waitForIceGatheringComplete(pc) {

  return new Promise((resolve) => {

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

  });

}


/* =====================================================
   BUILD CONVERSATION MESSAGES
===================================================== */

function buildConversationMessages(events) {

  if (
    !Array.isArray(events) ||
    events.length === 0
  ) {

    return [];

  }


  /*
    Work with a copy.

    transcriptEvents remains untouched.

    start_ms is used as the primary
    chronological reference.

    Original array position is preserved
    as stable fallback.
  */

  const orderedEvents =
    events
      .map((event, index) => ({
        ...event,
        _originalIndex: index
      }))
      .sort((a, b) => {

        const aStart =
          Number.isFinite(a.start_ms)
            ? a.start_ms
            : Number.MAX_SAFE_INTEGER;

        const bStart =
          Number.isFinite(b.start_ms)
            ? b.start_ms
            : Number.MAX_SAFE_INTEGER;


        if (aStart !== bStart) {

          return (
            aStart - bStart
          );

        }


        return (
          a._originalIndex -
          b._originalIndex
        );

      });


  const messages = [];

  let currentMessage =
    null;


  for (const event of orderedEvents) {

    if (
      !event ||
      !event.speaker ||
      typeof event.text !== 'string'
    ) {

      continue;

    }


    /*
      Ignore completely empty deltas.

      Do NOT trim text because transcript
      deltas already contain spacing.
    */

    if (
      event.text.length === 0
    ) {

      continue;

    }


    const eventStart =
      Number.isFinite(event.start_ms)
        ? event.start_ms
        : null;


    const eventEnd =
      Number.isFinite(event.end_ms)
        ? event.end_ms
        : eventStart;


    /*
      First valid transcript event.
    */

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


    /*
      Speaker change closes current message.
    */

    const speakerChanged =
      event.speaker !==
      currentMessage.role;


    /*
      Calculate temporal gap.
    */

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


    /*
      Same speaker + large temporal gap
      starts a new message.
    */

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


    /*
      Same speaker + acceptable temporal gap.
    */

    currentMessage.content +=
      event.text;


    /*
      Keep greatest observed end timestamp.
    */

    if (
      eventEnd !== null
    ) {

      if (
        currentMessage.end_ms === null
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


  /*
    Flush final message.
  */

  if (currentMessage) {

    messages.push(
      currentMessage
    );

  }


  /*
    Add deterministic sequence numbers.
  */

  return messages.map(
    (message, index) => ({

      sequence:
        index + 1,

      ...message

    })
  );

}


/* =====================================================
   BUILD AND PRINT FINAL TRANSCRIPT
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


  console.table(
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


  console.table(
    conversationMessages
  );


  return conversationMessages;

}


/* =====================================================
   SEND CONVERSATION TO N8N
===================================================== */

async function saveConversationMessages() {

  /*
    Prevent duplicate submissions.
  */

  if (conversationSaveStarted) {

    console.log(
      'Conversation submission already started'
    );

    return {
      skipped: true
    };

  }


  conversationSaveStarted =
    true;


  /*
    Ensure conversationMessages exists.
  */

  if (
    !Array.isArray(conversationMessages) ||
    conversationMessages.length === 0
  ) {

    conversationMessages =
      buildConversationMessages(
        transcriptEvents
      );

  }


  /*
    Do not call n8n with empty conversation.
  */

  if (
    conversationMessages.length === 0
  ) {

    console.warn(
      'Conversation not submitted: no transcript messages available'
    );

    return {
      skipped: true
    };

  }


  /*
    Ensure Live access token exists.
  */

  if (!liveToken) {

    throw new Error(
      'Live access token not available'
    );

  }


  /*
    Browser sends only opaque demo token.
  */

  const payload = {

    token:
      liveToken,

    interaction:
      'sync',

    messages:
      conversationMessages

  };


  console.log(
    'Sending demo conversation to n8n:',
    payload
  );


  /*
    IMPORTANT:
    This currently preserves the production
    transcript webhook.

    Replace with the dedicated demo webhook
    when the demo persistence workflow is ready.
  */

  const response =
    await fetch(
      'https://powerfulkiwi-n8n.cloudfy.live/webhook/ae8588a5-2ecb-4b5f-891f-89d6015d8570',
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


  const responseText =
    await response.text();


  let result =
    null;


  if (responseText) {

    try {

      result =
        JSON.parse(
          responseText
        );

    }

    catch {

      result =
        responseText;

    }

  }


  if (!response.ok) {

    throw new Error(
      `n8n webhook error ${response.status}: ${
        typeof result === 'string'
          ? result
          : JSON.stringify(result)
      }`
    );

  }


  console.log(
    'DEMO CONVERSATION SENT TO N8N:',
    result
  );


  return result;

}


/* =====================================================
   FINALIZE SESSION TRANSCRIPT
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


    console.log(
      'Demo transcript finalization completed:',
      result
    );


    return true;

  }

  catch (error) {

    console.error(
      'FAILED TO SAVE DEMO TRANSCRIPT:',
      error
    );


    return false;

  }

}


/* =====================================================
   REQUEST OPENING INSTRUCTIONS
===================================================== */

function requestOpeningInstructions() {

  if (
    !dataChannel ||
    dataChannel.readyState !== 'open'
  ) {

    console.error(
      'Cannot request opening instructions: data channel is not open'
    );

    return;

  }


  openingInstructionEventId =
    'demo_opening_instruction_' +
    Date.now();


  const event = {

    type:
      'session.instructions.append',

    event_id:
      openingInstructionEventId,

    delegation_id:
      null,

    content:
      'Begin the professional conversation immediately as your assigned professional peer. Use English and follow all existing character, language, scenario, voice, and interaction instructions. Start naturally from the professional situation. Do not wait for the participant to speak first. After your opening turn, pause and listen for the participant.'

  };


  console.log(
    'Sending demo opening instructions:',
    event
  );


  dataChannel.send(
    JSON.stringify(event)
  );

}


/* =====================================================
   REQUEST OPENING COMMENTARY
===================================================== */

function requestOpeningCommentary() {

  if (
    !dataChannel ||
    dataChannel.readyState !== 'open'
  ) {

    console.error(
      'Cannot request opening commentary: data channel is not open'
    );

    return;

  }


  if (openingCommentarySent) {

    console.log(
      'Opening commentary already sent'
    );

    return;

  }


  openingCommentarySent =
    true;


  openingCommentaryEventId =
    'demo_opening_commentary_' +
    Date.now();


  const event = {

    type:
      'session.commentary.append',

    event_id:
      openingCommentaryEventId,

    delegation_id:
      null,

    content:
      'Begin the conversation now, following the instructions provided.'

  };


  console.log(
    'Sending demo opening commentary:',
    event
  );


  dataChannel.send(
    JSON.stringify(event)
  );

}


/* =====================================================
   OPENAI EVENT HANDLER
===================================================== */

async function handleOpenAIEvent(event) {

  let data;


  try {

    data =
      JSON.parse(
        event.data
      );

  }

  catch (error) {

    console.error(
      'Invalid OpenAI event:',
      event.data
    );

    return;

  }


  console.log(
    'OpenAI Live event:',
    data
  );


  /* -------------------------------------------------
     USER TRANSCRIPT DELTA
  ------------------------------------------------- */

  if (
    data.type ===
    'session.input_transcript.delta'
  ) {

    const transcriptEvent = {

      speaker:
        'user',

      text:
        data.delta,

      start_ms:
        data.start_ms,

      end_ms:
        data.end_ms

    };


    transcriptEvents.push(
      transcriptEvent
    );


    console.log(
      '[USER]',
      data.delta,
      `[${data.start_ms} → ${data.end_ms} ms]`
    );


    return;

  }


  /* -------------------------------------------------
     EXECUTOR TRANSCRIPT DELTA
  ------------------------------------------------- */

  if (
    data.type ===
    'session.output_transcript.delta'
  ) {

    const transcriptEvent = {

      speaker:
        'executor',

      text:
        data.delta,

      start_ms:
        data.start_ms,

      end_ms:
        data.end_ms

    };


    transcriptEvents.push(
      transcriptEvent
    );


    console.log(
      '[EXECUTOR]',
      data.delta,
      `[${data.start_ms} → ${data.end_ms} ms]`
    );


    return;

  }


  /* -------------------------------------------------
     SESSION STARTED
  ------------------------------------------------- */

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


    console.log(
      'GPT-Live-1 demo session started:',
      liveSessionId
    );


    /*
      Add explicit opening behavior
      to the compiled demo prompt.
    */

    requestOpeningInstructions();


    return;

  }


  /* -------------------------------------------------
     OPENING INSTRUCTIONS ACCEPTED
  ------------------------------------------------- */

  if (
    data.type ===
    'session.instructions.appended'
  ) {

    console.log(
      'Instructions appended:',
      data
    );


    if (
      data.client_event_id ===
      openingInstructionEventId
    ) {

      console.log(
        'Demo opening instructions accepted'
      );


      requestOpeningCommentary();

    }


    return;

  }


  /* -------------------------------------------------
     OPENING COMMENTARY ACCEPTED
  ------------------------------------------------- */

  if (
    data.type ===
    'session.commentary.appended'
  ) {

    console.log(
      'Commentary appended:',
      data
    );


    if (
      data.client_event_id ===
      openingCommentaryEventId
    ) {

      console.log(
        'Demo opening commentary accepted'
      );

    }


    return;

  }


  /* -------------------------------------------------
     SESSION CLOSED
  ------------------------------------------------- */

  if (
    data.type ===
    'session.closed'
  ) {

    console.log(
      'GPT-Live-1 demo session closed:',
      data
    );


    statusText.textContent =
      'Saving conversation...';


    const saved =
      await finalizeSessionTranscript();


    if (saved) {

      console.log(
        'Demo session transcript successfully persisted'
      );

    }

    else {

      console.warn(
        'Demo session ended but transcript persistence failed'
      );

    }


    cleanupSession(
      saved
        ? 'Session ended'
        : 'Session ended - save failed'
    );


    return;

  }


  /* -------------------------------------------------
     ERROR
  ------------------------------------------------- */

  if (
    data.type ===
    'error'
  ) {

    console.error(
      'GPT-Live-1 demo error:',
      data
    );


    statusText.textContent =
      'Live session error';


    return;

  }

}


/* =====================================================
   START SESSION
===================================================== */

async function startSession() {

  if (
    sessionActive ||
    peerConnection
  ) {

    return;

  }


  /*
    Reset opening state.
  */

  openingInstructionEventId =
    null;

  openingCommentaryEventId =
    null;

  openingCommentarySent =
    false;


  /*
    Reset transcript state.
  */

  transcriptEvents =
    [];

  conversationMessages =
    [];

  conversationSaveStarted =
    false;


  console.log(
    'Demo transcript buffers reset'
  );


  talkButton.disabled =
    true;


  talkButton.textContent =
    'CONNECTING...';


  statusText.textContent =
    'Requesting microphone access';


  try {


    /* -------------------------------------------------
       1. MICROPHONE
    ------------------------------------------------- */

    liveMediaStream =
      await navigator.mediaDevices
        .getUserMedia({
          audio: true
        });


    /* -------------------------------------------------
       2. CREATE WEBRTC CONNECTION
    ------------------------------------------------- */

    statusText.textContent =
      'Creating secure connection';


    peerConnection =
      new RTCPeerConnection();


    /* -------------------------------------------------
       3. RECEIVE GPT-LIVE AUDIO
    ------------------------------------------------- */

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


        console.log(
          'Remote audio track received'
        );


        if (
          event.streams &&
          event.streams[0]
        ) {

          remoteAudio.srcObject =
            event.streams[0];

        }

        else {

          const stream =
            new MediaStream([
              event.track
            ]);


          remoteAudio.srcObject =
            stream;

        }


        remoteAudio
          .play()
          .catch((error) => {

            console.warn(
              'Audio autoplay warning:',
              error
            );

          });

      }
    );


    /* -------------------------------------------------
       4. ADD MICROPHONE TO WEBRTC
    ------------------------------------------------- */

    liveMediaStream
      .getAudioTracks()
      .forEach((track) => {

        peerConnection.addTrack(
          track,
          liveMediaStream
        );

      });


    /* -------------------------------------------------
       5. CREATE OPENAI DATA CHANNEL
    ------------------------------------------------- */

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

        console.log(
          'OpenAI data channel opened'
        );


        statusText.textContent =
          'Initializing Live session';

      }
    );


    dataChannel.addEventListener(
      'close',
      () => {

        console.log(
          'OpenAI data channel closed'
        );

      }
    );


    dataChannel.addEventListener(
      'error',
      (error) => {

        console.error(
          'OpenAI data channel error:',
          error
        );

      }
    );


    /* -------------------------------------------------
       6. CONNECTION STATE MONITOR
    ------------------------------------------------- */

    peerConnection.addEventListener(
      'connectionstatechange',
      () => {


        console.log(
          'WebRTC connection state:',
          peerConnection?.connectionState
        );


        if (
          peerConnection?.connectionState ===
          'failed'
        ) {

          cleanupSession(
            'Connection failed'
          );

        }

      }
    );


    /* -------------------------------------------------
       7. CREATE SDP OFFER
    ------------------------------------------------- */

    statusText.textContent =
      'Preparing Live session';


    const offer =
      await peerConnection
        .createOffer();


    await peerConnection
      .setLocalDescription(
        offer
      );


    /* -------------------------------------------------
       8. WAIT FOR ICE CANDIDATES
    ------------------------------------------------- */

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


    /* -------------------------------------------------
       9. SEND SDP TO N8N
    ------------------------------------------------- */

    statusText.textContent =
      'Connecting to GPT-Live-1';


    /*
      IMPORTANT:

      This currently preserves the production
      Live-session endpoint.

      If the demo uses a dedicated n8n workflow,
      replace this URL with the demo endpoint.
    */

    const response =
      await fetch(
        'https://powerfulkiwi-n8n.cloudfy.live/webhook/live-session',
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


    /* -------------------------------------------------
       10. VERIFY SERVER RESPONSE
    ------------------------------------------------- */

    if (!response.ok) {

      const errorText =
        await response.text();


      throw new Error(
        `Live API error ${response.status}: ${errorText}`
      );

    }


    const result =
      await response.json();


    console.log(
      'Demo Live session created:',
      result
    );


    if (
      !result.transport ||
      !result.transport.sdp
    ) {

      throw new Error(
        'OpenAI response does not contain SDP answer'
      );

    }


    liveSessionId =
      result.session?.id ||
      null;


    /* -------------------------------------------------
       11. APPLY OPENAI SDP ANSWER
    ------------------------------------------------- */

    await peerConnection
      .setRemoteDescription({

        type:
          'answer',

        sdp:
          result.transport.sdp

      });


    /*
      HTTP request already created the Live session.

      Do NOT send session.start.

      Wait for:

      session.started

      Then:

      1. session.instructions.append
      2. session.instructions.appended
      3. session.commentary.append
    */


    statusText.textContent =
      'Waiting for Live session';


  }

  catch (error) {


    console.error(
      'Unable to start demo Live session:',
      error
    );


    cleanupSession(
      'Unable to start session'
    );

  }

}


/* =====================================================
   REQUEST SESSION END
===================================================== */

function endSession() {

  if (!sessionActive) {
    return;
  }


  talkButton.disabled =
    true;


  statusText.textContent =
    'Ending conversation...';


  /*
    Ask GPT-Live to close cleanly.
  */

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


    /*
      Safety timeout.

      If session.closed is not received,
      persist locally collected transcript
      after 15 seconds.
    */

    setTimeout(
      async () => {


        if (peerConnection) {


          statusText.textContent =
            'Saving conversation...';


          const saved =
            await finalizeSessionTranscript(
              'fallback'
            );


          cleanupSession(
            saved
              ? 'Session ended'
              : 'Session ended - save failed'
          );

        }


      },
      15000
    );


    return;

  }


  /*
    Data channel already unavailable.

    Persist locally collected transcript
    before cleanup.
  */

  statusText.textContent =
    'Saving conversation...';


  finalizeSessionTranscript(
    'local close'
  )
    .then((saved) => {

      cleanupSession(
        saved
          ? 'Session ended'
          : 'Session ended - save failed'
      );

    });

}


/* =====================================================
   CLEANUP
===================================================== */

function cleanupSession(message) {


  /* -------------------------------------------------
     STOP MICROPHONE
  ------------------------------------------------- */

  if (liveMediaStream) {

    liveMediaStream
      .getTracks()
      .forEach(
        track =>
          track.stop()
      );


    liveMediaStream =
      null;

  }


  /* -------------------------------------------------
     CLOSE DATA CHANNEL
  ------------------------------------------------- */

  if (dataChannel) {

    try {

      dataChannel.close();

    }

    catch (error) {

      console.warn(
        'Error closing data channel:',
        error
      );

    }

  }


  dataChannel =
    null;


  /* -------------------------------------------------
     CLOSE PEER CONNECTION
  ------------------------------------------------- */

  if (peerConnection) {

    try {

      peerConnection.close();

    }

    catch (error) {

      console.warn(
        'Error closing peer connection:',
        error
      );

    }

  }


  peerConnection =
    null;


  /* -------------------------------------------------
     REMOVE REMOTE AUDIO
  ------------------------------------------------- */

  if (remoteAudio) {

    try {

      remoteAudio.pause();

      remoteAudio.srcObject =
        null;

      remoteAudio.remove();

    }

    catch (error) {

      console.warn(
        'Error removing remote audio:',
        error
      );

    }

  }


  remoteAudio =
    null;


  /* -------------------------------------------------
     STOP TIMER
  ------------------------------------------------- */

  stopTimer();

  sessionStartTime =
    null;


  /* -------------------------------------------------
     STOP DEMO STAGE CONTROLLER
  ------------------------------------------------- */

  stopDemoStageController();


  /* -------------------------------------------------
     RESET SESSION STATE
  ------------------------------------------------- */

  sessionActive =
    false;

  liveSessionId =
    null;


  /* -------------------------------------------------
     RESET UI
  ------------------------------------------------- */

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


  console.log(
    'Demo Live session cleanup completed'
  );

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

    /*
      Stop local resources immediately.

      Do not attempt asynchronous transcript
      persistence here because browsers do not
      guarantee completion during unload.
    */

    if (liveMediaStream) {

      liveMediaStream
        .getTracks()
        .forEach(
          track =>
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
