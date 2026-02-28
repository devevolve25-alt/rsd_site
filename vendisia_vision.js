const mySupabaseClient = supabase.createClient(
        'https://htsorgukdbfuuypiuksm.supabase.co', 
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh0c29yZ3VrZGJmdXV5cGl1a3NtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk3MDQ0NjMsImV4cCI6MjA4NTI4MDQ2M30.MVwsWMW1AX-tTDu5Vz_x9y6anb-DO10rZW2L_2B0NVM'
    );

// 2. Referências aos elementos HTML - 1
// Autenticação
const loginArea = document.getElementById('login-area');
const mainApp = document.getElementById('main-app');
const loginForm = document.getElementById('login-form');
const emailInput = document.getElementById('email-input');
const passwordInput = document.getElementById('password-input');
const loginButton = document.getElementById('login-button');
const showSignupLink = document.getElementById('show-signup');
const signupForm = document.getElementById('signup-form');
const signupEmailInput = document.getElementById('signup-email-input');
const signupPasswordInput = document.getElementById('signup-password-input');
const signupButton = document.getElementById('signup-button');
const showLoginLink = document.getElementById('show-login');
const authMessage = document.getElementById('auth-message');
const logoutButton = document.getElementById('logout-button');

// Navegação e Conteúdo do App
const tabsNavigation = document.getElementById('tabs-navigation');
const tabButtons = document.querySelectorAll('.tab-button'); // Todos os botões de aba
const tabSections = document.querySelectorAll('.tab-section'); // Todas as seções de conteúdo
const leadsTab = document.getElementById('leads-tab');
const contactsTab = document.getElementById('contacts-tab');
const companiesTab = document.getElementById('companies-tab');
const dealsTab = document.getElementById('deals-tab');
const activitiesTab = document.getElementById('activities-tab');
const teamsTab = document.getElementById('teams-tab');
const settingsTab = document.getElementById('settings-tab');

// Formulário de Leads
const addLeadForm = document.getElementById('add-lead-form');
const leadNameInput = document.getElementById('lead-name');
const leadEmailInput = document.getElementById('lead-email');
const leadPhoneInput = document.getElementById('lead-phone');
const leadCompanyInput = document.getElementById('lead-company');
const leadOriginInput = document.getElementById('lead-origin');
const submitLeadButton = document.getElementById('submit-lead-button');
const leadsList = document.getElementById('leads-list');
const leadMessage = document.getElementById('lead-message');


// 3. Funções Utilitárias
function showMessage(element, message, type = 'error') {
    element.textContent = message;
    element.className = `message-area ${type}`; // Define a classe para estilização CSS
    element.style.display = 'block';
    setTimeout(() => {
        element.style.display = 'none';
        element.textContent = '';
    }, 5000); // Esconde a mensagem após 5 segundos
}

// 4. Lógica de Autenticação
async function handleLogin(event) {
    event.preventDefault();
    authMessage.style.display = 'none'; // Esconde mensagens anteriores

    const email = emailInput.value;
    const password = passwordInput.value;

    loginButton.disabled = true; // Desabilita o botão para evitar cliques múltiplos
    loginButton.textContent = 'Entrando...';

    const { error } = await mySupabaseClient.auth.signInWithPassword({ email, password });

    if (error) {
        showMessage(authMessage, `Erro de login: ${error.message}`);
    } else {
        // Redirecionamento ou atualização da UI será feito pelo listener de authStateChange
        showMessage(authMessage, 'Login bem-sucedido!', 'success');
    }
    loginButton.disabled = false;
    loginButton.textContent = 'Entrar';
}

async function handleSignup(event) {
    event.preventDefault();
    authMessage.style.display = 'none'; // Esconde mensagens anteriores

    const email = signupEmailInput.value;
    const password = signupPasswordInput.value;

    signupButton.disabled = true;
    signupButton.textContent = 'Cadastrando...';

    const { error } = await mySupabaseClient.auth.signUp({ email, password });

    if (error) {
        showMessage(authMessage, `Erro de cadastro: ${error.message}`);
    } else {
        showMessage(authMessage, 'Cadastro realizado! Por favor, verifique seu e-mail para confirmar a conta.', 'success');
        // Opcional: Voltar para o formulário de login após o cadastro bem-sucedido
        signupForm.style.display = 'none';
        loginForm.style.display = 'block';
        signupEmailInput.value = '';
        signupPasswordInput.value = '';
    }
    signupButton.disabled = false;
    signupButton.textContent = 'Cadastrar';
}

async function handleLogout() {
    logoutButton.disabled = true;
    logoutButton.textContent = 'Saindo...';
    const { error } = await mySupabaseClient.auth.signOut();
    if (error) {
        console.error('Erro ao fazer logout:', error.message);
        // Não mostramos mensagem de erro para o usuário final, apenas console.error
    }
    // A UI será atualizada pelo listener de authStateChange
    logoutButton.disabled = false;
    logoutButton.textContent = 'Sair';
}

// Listener de mudança de estado de autenticação do Supabase
mySupabaseClient.auth.onAuthStateChange((event, session) => {
    if (session) {
        // Usuário autenticado: mostra o app principal, esconde o login
        loginArea.style.display = 'none';
        mainApp.style.display = 'block';
        // Carrega os leads ou a primeira aba padrão
        displayLeads();
    } else {
        // Usuário não autenticado: mostra o login, esconde o app principal
        loginArea.style.display = 'block';
        mainApp.style.display = 'none';
    }
});

// 5. Lógica de Navegação entre Abas
function switchTab(event) {
    // Remove a classe 'active' de todos os botões e seções
    tabButtons.forEach(button => button.classList.remove('active'));
    tabSections.forEach(section => section.classList.remove('active'));
    tabSections.forEach(section => section.style.display = 'none'); // Garante que todos estão ocultos

    // Adiciona a classe 'active' ao botão clicado
    event.target.classList.add('active');

    // Obtém o ID da seção correspondente (ex: 'leads-section' para 'leads-tab')
    const targetSectionId = event.target.id.replace('-tab', '-section');
    const targetSection = document.getElementById(targetSectionId);

    if (targetSection) {
        targetSection.classList.add('active');
        targetSection.style.display = 'block'; // Mostra a seção ativa
        // TODO: Chamar função para carregar dados específicos da aba, se necessário
        if (targetSectionId === 'leads-section') {
            displayLeads(); // Recarrega os leads ao voltar para a aba de leads
        }
    }
}

// 6. Lógica de Leads
async function displayLeads() {
    leadsList.innerHTML = '<p>Carregando leads...</p>'; // Feedback visual

    const { data: leads, error } = await mySupabaseClient
        .from('leads')
        .select('*')
        .order('data_criacao', { ascending: false }); // Ordena por data de criação

    if (error) {
        console.error('Erro ao buscar leads:', error.message);
        leadsList.innerHTML = `<p class="error">Erro ao carregar leads: ${error.message}</p>`;
        return;
    }

    if (leads.length === 0) {
        leadsList.innerHTML = '<p>Nenhum lead encontrado.</p>';
        return;
    }

    // Cria uma lista HTML para exibir os leads
    const ul = document.createElement('ul');
    ul.className = 'leads-list-items'; // Adiciona uma classe para estilização

    leads.forEach(lead => {
        const li = document.createElement('li');
        li.className = 'lead-item-card'; // Estilo para cada item de lead
        li.innerHTML = `
            <strong>${lead.nome_completo_lead}</strong><br>
            Email: ${lead.email}<br>
            Telefone: ${lead.telefone_lead || 'N/A'}<br>
            Empresa: ${lead.empresa_lead || 'N/A'}<br>
            Origem: ${lead.origem_lead}<br>
            Status: <span class="lead-status status-${lead.status_lead ? lead.status_lead.toLowerCase() : 'novo'}">${lead.status_lead || 'Novo'}</span>
            <span class="lead-date">${new Date(lead.data_criacao).toLocaleDateString()}</span>
        `;
        ul.appendChild(li);
    });

    leadsList.innerHTML = ''; // Limpa o "Carregando..."
    leadsList.appendChild(ul);
}


async function handleAddLead(event) {
    event.preventDefault();
    leadMessage.style.display = 'none'; // Esconde mensagens anteriores

    const nome_completo_lead = leadNameInput.value.trim();
    const email = leadEmailInput.value.trim();
    const telefone_lead = leadPhoneInput.value.trim();
    const empresa_lead = leadCompanyInput.value.trim();
    const origem_lead = leadOriginInput.value.trim();
    const status_lead = 'Novo'; // Padrão

    if (!nome_completo_lead || !email || !origem_lead) {
        showMessage(leadMessage, 'Por favor, preencha Nome, Email e Origem do Lead.', 'error');
        return;
    }

    submitLeadButton.disabled = true;
    submitLeadButton.textContent = 'Salvando...';

    const { data: { user } } = await mySupabaseClient.auth.getUser();

    if (!user) {
        showMessage(leadMessage, 'Você precisa estar logado para adicionar leads.', 'error');
        submitLeadButton.disabled = false;
        submitLeadButton.textContent = 'Salvar Lead';
        return;
    }

    const { data, error } = await mySupabaseClient
        .from('leads')
        .insert({
            nome_completo_lead,
            email,
            telefone_lead: telefone_lead || null,
            empresa_lead: empresa_lead || null,
            origem_lead,
            status_lead,
            id_usuario_criador: user.id,
            id_usuario_responsavel: user.id, // Por padrão, o criador é o responsável
            data_criacao: new Date().toISOString()
        })
        .select();

    if (error) {
        console.error('Erro ao adicionar lead:', error);
        showMessage(leadMessage, `Erro ao adicionar lead: ${error.message}`, 'error');
    } else {
        showMessage(leadMessage, 'Lead adicionado com sucesso!', 'success');
        addLeadForm.reset(); // Limpa o formulário
        displayLeads(); // Atualiza a lista de leads
    }

    submitLeadButton.disabled = false;
    submitLeadButton.textContent = 'Salvar Lead';
}


// 7. Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    // Verifica o estado da sessão ao carregar a página
    mySupabaseClient.auth.getSession().then(({ data: { session } }) => {
        if (session) {
            loginArea.style.display = 'none';
            mainApp.style.display = 'block';
            displayLeads(); // Carrega os leads se já estiver logado
        } else {
            loginArea.style.display = 'block';
            mainApp.style.display = 'none';
        }
    });

    // Autenticação
    loginForm.addEventListener('submit', handleLogin);
    signupForm.addEventListener('submit', handleSignup);
    logoutButton.addEventListener('click', handleLogout);

    showSignupLink.addEventListener('click', (e) => {
        e.preventDefault();
        loginForm.style.display = 'none';
        signupForm.style.display = 'block';
        authMessage.style.display = 'none'; // Limpa mensagens
    });

    showLoginLink.addEventListener('click', (e) => {
        e.preventDefault();
        signupForm.style.display = 'none';
        loginForm.style.display = 'block';
        authMessage.style.display = 'none'; // Limpa mensagens
    });

    // Navegação entre Abas
    tabsNavigation.addEventListener('click', (event) => {
        if (event.target.classList.contains('tab-button')) {
            switchTab(event);
        }
    });

    // Leads
    addLeadForm.addEventListener('submit', handleAddLead);

    // TODO: Adicionar event listeners para outras abas e formulários conforme forem sendo implementados
});
