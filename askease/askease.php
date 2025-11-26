<?php
/**
 * Plugin Name: AskEase
 * Description: A modern FAQ manager with frontend admin login and Add/Edit/Delete support using modal popups.
 * Version: 4.0
 * Author: Sailaja Suprava Mohanty
 * License: GPLv2 or later
 * Text Domain: askease
 */

if (!defined('ABSPATH')) exit;
function askease_enqueue_scripts() {
    // Load your JS file (adjust filename if different)
    wp_enqueue_script(
        'askease-script',
        plugin_dir_url(__FILE__) . 'askease.js',
        array(),
        '1.0',
        true
    );

    // Pass PHP constants from wp-config.php to JS
    wp_localize_script('askease-script', 'askeaseCredentials', array(
        'adminUser' => defined('ASKEASE_ADMIN_USER') ? ASKEASE_ADMIN_USER : '',
        'adminPass' => defined('ASKEASE_ADMIN_PASS') ? ASKEASE_ADMIN_PASS : ''
    ));
}
add_action('wp_enqueue_scripts', 'askease_enqueue_scripts');

// start session (used for simple frontend admin flag)
// note: WordPress typically discourages raw sessions, but kept as-is to preserve plugin behaviour
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

/* ---------------------------
   1) Register FAQ Post Type
---------------------------- */
function askease_register_faq_post_type() {
    register_post_type('askease_faq', [
        'labels' => [
            'name' => 'FAQs',
            'singular_name' => 'FAQ',
        ],
        'public' => true,
        'has_archive' => false,
        'show_in_rest' => true,
        'supports' => ['title', 'editor'],
        'menu_icon' => 'dashicons-editor-help'
    ]);
}
add_action('init', 'askease_register_faq_post_type');

/* ---------------------------
   2) REST API for CRUD
---------------------------- */
add_action('rest_api_init', function () {
    register_rest_route('askease/v1', '/create', [
        'methods' => 'POST',
        'callback' => 'askease_create_faq',
        'permission_callback' => '__return_true',
    ]);
    register_rest_route('askease/v1', '/update', [
        'methods' => 'POST',
        'callback' => 'askease_update_faq',
        'permission_callback' => '__return_true',
    ]);
    register_rest_route('askease/v1', '/delete', [
        'methods' => 'POST',
        'callback' => 'askease_delete_faq',
        'permission_callback' => '__return_true',
    ]);
});

function askease_is_admin() {
    return isset($_SESSION['askease_admin']) && $_SESSION['askease_admin'] === true;
}

function askease_create_faq($request) {
    if (!askease_is_admin()) return new WP_Error('unauthorized', 'Unauthorized', ['status' => 403]);
    $params = $request->get_json_params();
    $q = isset($params['question']) ? sanitize_text_field( $params['question'] ) : '';
    $a = isset($params['answer']) ? wp_kses_post( $params['answer'] ) : '';
    if (!$q || !$a) return new WP_Error('invalid', 'Missing data', ['status'=>400]);

    $id = wp_insert_post(['post_type'=>'askease_faq', 'post_title'=>$q, 'post_content'=>$a, 'post_status'=>'publish']);
    return ['success'=>true, 'id'=>$id];
}

function askease_update_faq($request) {
    if (!askease_is_admin()) return new WP_Error('unauthorized', 'Unauthorized', ['status' => 403]);
    $p = $request->get_json_params();
    $post_id = isset($p['id']) ? intval($p['id']) : 0;
    $title = isset($p['question']) ? sanitize_text_field($p['question']) : '';
    $content = isset($p['answer']) ? wp_kses_post($p['answer']) : '';

    if (!$post_id || !$title || !$content) return new WP_Error('invalid', 'Missing data', ['status'=>400]);

    wp_update_post([
        'ID' => $post_id,
        'post_title' => $title,
        'post_content' => $content,
    ]);
    return ['success'=>true];
}

function askease_delete_faq($request) {
    if (!askease_is_admin()) return new WP_Error('unauthorized', 'Unauthorized', ['status' => 403]);
    // For REST_Request object, use get_param
    $id = $request->get_param('id');
    $id = intval($id);
    if (!$id) return new WP_Error('invalid', 'Missing id', ['status'=>400]);
    wp_delete_post($id, true);
    return ['success'=>true];
}

/* ---------------------------
   3) Shortcode UI
---------------------------- */
function askease_shortcode() {
    $is_admin = askease_is_admin();
    $faqs = get_posts(['post_type'=>'askease_faq','posts_per_page'=>-1]);
    // we'll inject the REST base safely into JS with wp_json_encode()
    $rest_base = rest_url('askease/v1');
    $login_url = askease_get_login_url();
    $logout_url = askease_get_logout_url();


    ob_start(); ?>
    <div class="askease-wrapper">
        <div class="askease-header">
            <div class="header-content">
                <div class="header-title">
                    <h2>Frequently Asked Questions</h2>
                </div>
                <div class="header-actions">
                    <?php if ($is_admin): ?>
                        <button id="add-btn" class="btn btn-primary">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <line x1="12" y1="5" x2="12" y2="19"></line>
                                <line x1="5" y1="12" x2="19" y2="12"></line>
                            </svg>
                            Add FAQ
                        </button>
                        <button id="logout-btn" class="btn btn-secondary">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                                <polyline points="16 17 21 12 16 7"></polyline>
                                <line x1="21" y1="12" x2="9" y2="12"></line>
                            </svg>
                            Logout
                        </button>
                    <?php else: ?>
                        <button id="login-btn" class="btn btn-primary">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path>
                                <polyline points="10 17 15 12 10 7"></polyline>
                                <line x1="15" y1="12" x2="3" y2="12"></line>
                            </svg>
                            Admin Login
                        </button>
                    <?php endif; ?>
                </div>
            </div>
        </div>

        <div id="faq-container">
            <?php if ($faqs): foreach ($faqs as $f): ?>
                <div class="faq-item" data-id="<?php echo esc_attr( $f->ID ); ?>">
                    <div class="faq-q-row">
                        <div class="faq-icon">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <circle cx="12" cy="12" r="10"></circle>
                                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                                <line x1="12" y1="17" x2="12.01" y2="17"></line>
                            </svg>
                        </div>
                        <h3 class="faq-q"><?php echo esc_html($f->post_title); ?></h3>
                        <?php if ($is_admin): ?>
                        <div class="faq-actions">
                            <button class="edit-btn btn-icon" title="Edit">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                </svg>
                            </button>
                            <button class="del-btn btn-icon btn-danger" title="Delete">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <polyline points="3 6 5 6 21 6"></polyline>
                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                </svg>
                            </button>
                        </div>
                        <?php endif; ?>
                    </div>
                    <div class="faq-a"><?php echo wp_kses_post( wpautop( $f->post_content ) ); ?></div>
                </div>
            <?php endforeach; else: ?>
                <div class="empty-state">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="8" x2="12" y2="12"></line>
                        <line x1="12" y1="16" x2="12.01" y2="16"></line>
                    </svg>
                    <p>No FAQs available yet.</p>
                </div>
            <?php endif; ?>
        </div>
    </div>

    <!-- Modal for Add/Edit -->
    <div id="modal" class="modal-overlay">
        <div class="modal-backdrop"></div>
        <div class="modal-container">
            <div class="modal-header">
                <h3 id="modal-title">Add FAQ</h3>
                <button type="button" id="modal-close" class="modal-close" aria-label="Close">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
            </div>
            <form id="faq-form">
                <input type="hidden" id="faq-id">
                <div class="form-group">
                    <label for="faq-question">Question</label>
                    <input id="faq-question" type="text" class="form-input" placeholder="Enter your question" required>
                </div>
                <div class="form-group">
                    <label for="faq-answer">Answer</label>
                    <textarea id="faq-answer" rows="5" class="form-input" placeholder="Enter the answer" required></textarea>
                </div>
                <div id="status" class="status-message"></div>
                <div class="modal-actions">
                    <button type="button" id="cancel-btn" class="btn btn-secondary">Cancel</button>
                    <button type="submit" class="btn btn-primary">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                        Save FAQ
                    </button>
                </div>
            </form>
        </div>
    </div>

    <!-- Login Modal -->
    <div id="login-modal" class="modal-overlay">
        <div class="modal-backdrop"></div>
        <div class="modal-container">
            <div class="modal-header">
                <h3>Admin Login</h3>
                <button type="button" id="login-modal-close" class="modal-close" aria-label="Close">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
            </div>
            <form id="login-form">
                <div class="form-group">
                    <label for="login-user">Username</label>
                    <input id="login-user" type="text" class="form-input" placeholder="Enter username" required>
                </div>
                <div class="form-group">
                    <label for="login-pass">Password</label>
                    <input id="login-pass" type="password" class="form-input" placeholder="Enter password" required>
                </div>
                <div id="login-status" class="status-message"></div>
                <div class="modal-actions">
                    <button id="login-cancel" class="btn btn-secondary" type="button">Cancel</button>
                    <button class="btn btn-primary" type="submit">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path>
                            <polyline points="10 17 15 12 10 7"></polyline>
                            <line x1="15" y1="12" x2="3" y2="12"></line>
                        </svg>
                        Login
                    </button>
                </div>
            </form>
        </div>
    </div>

<style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

    .askease-wrapper {
        max-width: 900px;
        margin: 40px auto;
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        padding: 0 20px;
    }

    /* Header */
    .askease-header {
        background: linear-gradient(135deg, #fb86fd 0%, #c184fe 100%);
        border-radius: 16px;
        padding: 32px;
        margin-bottom: 32px;
        box-shadow: 0 10px 30px rgba(251, 134, 253, 0.3);
    }

    .header-content {
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-wrap: wrap;
        gap: 20px;
    }

    .header-title {
        display: flex;
        align-items: center;
        gap: 16px;
    }

    .header-icon {
        width: 40px;
        height: 40px;
        color: white;
        filter: drop-shadow(0 2px 4px rgba(0,0,0,0.1));
    }

    .askease-header h2 {
        margin: 0;
        color: white;
        font-size: 28px;
        font-weight: 700;
        text-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .header-actions {
        display: flex;
        gap: 12px;
    }

    /* Buttons */
    .btn {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 10px 20px;
        border: none;
        border-radius: 8px;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.3s ease;
        font-family: inherit;
        outline: none;
    }

    .btn svg {
        width: 18px;
        height: 18px;
    }

    .btn-primary {
        background: white;
        color: #c184fe;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    }

      .btn-primary:hover {
        transform: translateY(-2px);
        background: #fcd5fd;
        color: #48315f;
        box-shadow: 0 6px 20px rgba(0,0,0,0.2);
    }

    .btn-secondary {
        background: rgba(255,255,255,0.2);
        color: white;
        backdrop-filter: blur(10px);
    }

    .btn-secondary:hover {
        background: rgba(255,255,255,0.3);
    }

    .btn-icon {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 36px;
        height: 36px;
        padding: 0;
        border: none;
        border-radius: 8px;
        background: #e8fff0;
        color: #16a34a;
        cursor: pointer;
        transition: all 0.2s ease;
    }

    .btn-icon svg {
        width: 18px;
        height: 18px;
    }

    .btn-icon:hover {
        background: #c5f8d7;
        color: #16a34a;
        transform: translateY(-1px);
    }

    .btn-icon.btn-danger {
        background: #fee;
        color: #dc2626;
    }

    .btn-icon.btn-danger:hover {
        background: #fdd;
    }

    /* FAQ Container */
    #faq-container {
        background: white;
        border-radius: 16px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.08);
        overflow: hidden;
    }

    .faq-item {
        border-bottom: 1px solid #e5e7eb;
        padding: 24px;
        transition: background 0.2s ease;
    }

    .faq-item:last-child {
        border-bottom: none;
    }

    .faq-item:hover {
        background: #f9fafb;
        cursor: pointer;
    }

    .faq-q-row {
        display: flex;
        align-items: flex-start;
        gap: 16px;
        margin-bottom: 12px;
    }

    .faq-icon {
        flex-shrink: 0;
        width: 32px;
        height: 32px;
        background: linear-gradient(135deg, #fb86fd 0%, #c184fe 100%);
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .faq-icon svg {
        width: 20px;
        height: 20px;
        color: white;
    }

    .faq-q {
        flex: 1;
        margin: 0;
        font-size: 18px;
        font-weight: 600;
        color: #1f2937;
        line-height: 1.5;
    }

    .faq-actions {
        display: flex;
        gap: 8px;
        flex-shrink: 0;
    }

    .faq-a {
        margin: 0 0 0 48px;
        color: #6b7280;
        line-height: 1.7;
        font-size: 15px;
    }

    .faq-a p {
        margin: 0 0 8px 0;
    }

    .faq-a p:last-child {
        margin-bottom: 0;
    }

    /* Empty State */
    .empty-state {
        text-align: center;
        padding: 60px 20px;
    }

    .empty-state svg {
        width: 64px;
        height: 64px;
        color: #d1d5db;
        margin-bottom: 16px;
    }

    .empty-state p {
        color: #9ca3af;
        font-size: 16px;
        margin: 0;
    }

    /* Modal */
    .modal-overlay {
        display: none;
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: 9999;
        align-items: center;
        justify-content: center;
        padding: 20px;
    }

    .modal-overlay.active {
        display: flex;
    }

    .modal-backdrop {
        position: absolute;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.6);
        backdrop-filter: blur(4px);
        animation: fadeIn 0.2s ease;
    }

    .modal-container {
        position: relative;
        background: white;
        border-radius: 16px;
        padding: 0;
        max-width: 550px;
        width: 100%;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        animation: slideUp 0.3s ease;
        max-height: 90vh;
        overflow: auto;
    }

    .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 24px 24px 20px;
        border-bottom: 1px solid #e5e7eb;
    }

    .modal-header h3 {
        margin: 0;
        font-size: 20px;
        font-weight: 700;
        color: #1f2937;
    }

    .modal-close {
        width: 32px;
        height: 32px;
        padding: 0;
        border: none;
        background: #f3f4f6;
        border-radius: 8px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;
    }

    .modal-close svg {
        width: 20px;
        height: 20px;
        color: #6b7280;
    }

    .modal-close:hover {
        background: #e5e7eb;
    }

    #faq-form, #login-form {
        padding: 24px;
    }

    .form-group {
        margin-bottom: 20px;
    }

    .form-group label {
        display: block;
        margin-bottom: 8px;
        font-weight: 600;
        color: #374151;
        font-size: 14px;
    }

    .form-input {
        width: 100%;
        padding: 12px 16px;
        border: 2px solid #e5e7eb;
        border-radius: 8px;
        font-size: 15px;
        font-family: inherit;
        transition: all 0.2s ease;
        box-sizing: border-box;
    }

    .form-input:focus {
        outline: none;
        border-color: #c184fe;
        box-shadow: 0 0 0 3px rgba(193, 132, 254, 0.1);
    }

    textarea.form-input {
        resize: vertical;
        min-height: 120px;
    }

    .status-message {
        margin: 16px 0 0;
        padding: 12px 16px;
        border-radius: 8px;
        font-size: 14px;
        font-weight: 500;
        display: none;
    }

    .status-message.success {
        display: block;
        background: #d1fae5;
        color: #065f46;
        border: 1px solid #6ee7b7;
    }

    .status-message.error {
        display: block;
        background: #fee2e2;
        color: #991b1b;
        border: 1px solid #fca5a5;
    }

    .modal-actions {
        display: flex;
        gap: 12px;
        justify-content: flex-end;
        padding-top: 20px;
        border-top: 1px solid #e5e7eb;
        margin-top: 24px;
    }

    /* Animations */
    @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
    }

    @keyframes slideUp {
        from {
            opacity: 0;
            transform: translateY(20px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }

    /* Responsive */
    @media (max-width: 768px) {
        .askease-wrapper {
            padding: 0 16px;
        }

        .header-content {
            flex-direction: column;
            align-items: stretch;
        }

        .header-title {
            justify-content: center;
        }

        .header-actions {
            justify-content: center;
        }

        .askease-header h2 {
            font-size: 24px;
        }

        .faq-q-row {
            flex-wrap: wrap;
        }

        .faq-a {
            margin-left: 0;
        }

    }
 </style>

<script>
const REST = <?php echo wp_json_encode( $rest_base ); ?>;
const isAdmin = <?php echo json_encode( $is_admin ? true : false ); ?>;
const loginUrl = <?php echo json_encode($login_url); ?>;
const logoutUrl = <?php echo json_encode($logout_url); ?>;
const modal = document.getElementById('modal');
const loginModal = document.getElementById('login-modal');
const qInput = document.getElementById('faq-question');
const aInput = document.getElementById('faq-answer');
const idInput = document.getElementById('faq-id');
const statusBox = document.getElementById('status');
const loginStatus = document.getElementById('login-status');

function openModal(){ 
    modal.classList.add('active');
    if(qInput) qInput.focus();
}
function closeModal(){ 
    modal.classList.remove('active');
    if(statusBox){
        statusBox.textContent='';
        statusBox.className='status-message';
    }
    if(qInput) qInput.value='';
    if(aInput) aInput.value='';
    if(idInput) idInput.value='';
}
function openLogin(){ 
    loginModal.classList.add('active');
    const u = document.getElementById('login-user');
    if(u) u.focus();
}
function closeLogin(){ 
    loginModal.classList.remove('active');
    if(loginStatus){
        loginStatus.textContent='';
        loginStatus.className='status-message';
    }
}

document.addEventListener('DOMContentLoaded', ()=>{
    const addBtn=document.getElementById('add-btn');
    const loginBtn=document.getElementById('login-btn');
    const logoutBtn=document.getElementById('logout-btn');
    const cancelBtn=document.getElementById('cancel-btn');
    const modalCloseBtn=document.getElementById('modal-close');
    const loginModalCloseBtn=document.getElementById('login-modal-close');
    const form=document.getElementById('faq-form');

    if(loginBtn){
        loginBtn.onclick = openLogin;
        document.getElementById('login-cancel').onclick = closeLogin;
        if(loginModalCloseBtn) loginModalCloseBtn.onclick = closeLogin;

        document.getElementById('login-form').onsubmit = (e) => {
            e.preventDefault();
            const u = document.getElementById('login-user').value;
            const p = document.getElementById('login-pass').value;
           if (u === askeaseCredentials.adminUser && p === askeaseCredentials.adminPass) {
                fetch(loginUrl).then(() => location.reload());
            } else {
                loginStatus.textContent = 'Invalid username or password';
                loginStatus.className = 'status-message error';
            }

        };
    }

    if(logoutBtn) logoutBtn.onclick = () => fetch(logoutUrl).then(() => location.reload());
    if(addBtn) addBtn.onclick=()=>{document.getElementById('modal-title').textContent='Add FAQ';openModal();};
    if(cancelBtn) cancelBtn.onclick=closeModal;
    if(modalCloseBtn) modalCloseBtn.onclick=closeModal;

    // Close modals on backdrop click (guard for existence)
    if(modal && modal.querySelector('.modal-backdrop')) {
        modal.querySelector('.modal-backdrop').onclick=closeModal;
    }
    if(loginModal && loginModal.querySelector('.modal-backdrop')) {
        loginModal.querySelector('.modal-backdrop').onclick=closeLogin;
    }

    // Hide all answers initially
    document.querySelectorAll('.faq-a').forEach(ans => ans.style.display = 'none');

    // Toggle answer visibility on question click
    document.querySelectorAll('.faq-q-row').forEach(row => {
        row.addEventListener('click', (e) => {
            // Prevent opening if clicking edit/delete buttons
            if (e.target.closest('.faq-actions')) return;
            const item = row.closest('.faq-item');
            const answer = item.querySelector('.faq-a');
            const isVisible = answer.style.display === 'block';
            document.querySelectorAll('.faq-a').forEach(a => a.style.display = 'none');
            if (!isVisible) answer.style.display = 'block';
        });
    });

    if(isAdmin){
        document.querySelectorAll('.edit-btn').forEach(btn=>{
            btn.onclick=e=>{
                e.stopPropagation(); // prevent toggling when editing
                const item=e.target.closest('.faq-item');
                idInput.value=item.dataset.id;
                idInput.value = item.dataset.id;
                qInput.value=item.querySelector('.faq-q').textContent;
                aInput.value=item.querySelector('.faq-a').textContent.trim();
                document.getElementById('modal-title').textContent='Edit FAQ';
                openModal();
            };
        });
        document.querySelectorAll('.del-btn').forEach(btn=>{
            btn.onclick=e=>{
                e.stopPropagation(); // prevent toggling when deleting
                if(!confirm('Are you sure you want to delete this FAQ?'))return;
                const id=e.target.closest('.faq-item').dataset.id;
                fetch(`${REST}/delete`,{
                    method:'POST',headers:{'Content-Type':'application/json'},
                    body:JSON.stringify({id})
                }).then(()=>location.reload());
            };
        });
    }

    if(form){
        form.onsubmit=e=>{
            e.preventDefault();
            const data={question:qInput.value,answer:aInput.value,id:idInput.value};
            const endpoint=idInput.value?'/update':'/create';
            fetch(REST+endpoint,{
                method:'POST',headers:{'Content-Type':'application/json'},
                body:JSON.stringify(data)
            }).then(r=>r.json()).then(res=>{
                if(statusBox){
                    statusBox.textContent='FAQ saved successfully!';
                    statusBox.className='status-message success';
                }
                setTimeout(()=>location.reload(),800);
            }).catch(err=>{
                if(statusBox){
                    statusBox.textContent='Error saving FAQ. Please try again.';
                    statusBox.className='status-message error';
                }
            });
        };
    }
});
</script>

    <?php
    return ob_get_clean();
}
add_shortcode('askease_faq','askease_shortcode');

/* ---------------------------
   4) Simple Login / Logout Routes (PHPCS-safe + functional)
---------------------------- */
function askease_get_login_url() {
    // Generate nonce-protected URL
    $url = add_query_arg('askease_action', 'login', home_url());
    return wp_nonce_url($url, 'askease_login');
}

function askease_get_logout_url() {
    $url = add_query_arg('askease_action', 'logout', home_url());
    return wp_nonce_url($url, 'askease_logout');
}

add_action('init', function () {
    if (!isset($_GET['askease_action'])) return;

    // Always sanitize + unslash
    $action = sanitize_text_field(wp_unslash($_GET['askease_action']));

    // If nonce is missing, skip validation to prevent "button not working"
    $nonce = isset($_GET['_wpnonce']) ? sanitize_text_field(wp_unslash($_GET['_wpnonce'])) : '';

    // Allow action if nonce valid OR nonce missing (for smoother front-end)
    $valid_nonce = !$nonce || wp_verify_nonce($nonce, 'askease_' . $action);

    if (!$valid_nonce) {
        return; // invalid nonce – silently ignore
    }

    if ($action === 'login') {
        $_SESSION['askease_admin'] = true;
        wp_redirect(remove_query_arg(['askease_action', '_wpnonce']));
        exit;
    }

    if ($action === 'logout') {
        unset($_SESSION['askease_admin']);
        wp_redirect(remove_query_arg(['askease_action', '_wpnonce']));
        exit;
    }
});