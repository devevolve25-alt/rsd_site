// ==================================================
// BUSINESS TALKS — HOME
// Invitation-aware demo CTAs
// ==================================================

document.addEventListener('DOMContentLoaded', () => {

  // ------------------------------------------------
  // FOOTER YEAR
  // ------------------------------------------------

  const yearElement = document.getElementById('year');

  if (yearElement) {
    yearElement.textContent = new Date().getFullYear();
  }


  // ------------------------------------------------
  // DEMO TOKEN
  // ------------------------------------------------

  const params = new URLSearchParams(window.location.search);

  const tokenFromUrl = params.get('demo_token');


  // If visitor arrived through an invitation,
  // preserve token during this browser session.
  if (tokenFromUrl) {
    sessionStorage.setItem(
      'businessTalksDemoToken',
      tokenFromUrl
    );
  }


  const demoToken =
    tokenFromUrl ||
    sessionStorage.getItem('businessTalksDemoToken');


  // ------------------------------------------------
  // NORMAL VISITOR
  // ------------------------------------------------

  // No invitation:
  // leave all existing CTAs exactly as they are.
  if (!demoToken) {
    return;
  }


  // ------------------------------------------------
  // INVITED PROSPECT
  // ------------------------------------------------

  const demoUrl =
    `/demo/live_demo.html?token=${encodeURIComponent(demoToken)}`;


  // HEADER CTA

  const headerDemoCta =
    document.getElementById('headerDemoCta');

  if (headerDemoCta) {
    headerDemoCta.textContent =
      'Acessar demonstração';

    headerDemoCta.href = demoUrl;

    headerDemoCta.classList.add(
      'demo-invitation-active'
    );
  }


  // SYNC DEMO CTA

  const syncDemoCta =
    document.getElementById('syncDemoCta');

  if (syncDemoCta) {
    syncDemoCta.textContent =
      'Iniciar demonstração ao vivo';

    syncDemoCta.href = demoUrl;

    syncDemoCta.classList.add(
      'demo-invitation-active'
    );
  }

});
