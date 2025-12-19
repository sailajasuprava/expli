<?php
/*
Plugin Name: expli-forms
Description: Frontend template picker + visual form editor (modal) + admin overview. Place [expli_forms] on a page (default slug: /expli-forms/) to use.
Version: 1.6-merged
Author: You
Text Domain: expli-forms
*/

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class Expli_Forms_Plugin {

	const FRONTEND_PAGE_SLUG = 'expli-forms'; // Change if your shortcode page uses a different slug

	private $option_forms_key = 'expli_forms_saved_forms';
	private $option_submissions_key = 'expli_forms_submissions';
	private $plugin_version = '1.6';
	private $handle = 'expli-forms-frontend';

	public function __construct() {
		// Frontend assets and UI
		add_action( 'wp_enqueue_scripts', [ $this, 'enqueue_assets' ] );

		// Shortcodes
		add_shortcode( 'expli_forms', [ $this, 'shortcode_render' ] );
		add_shortcode( 'expli_form', [ $this, 'shortcode_render_saved_form' ] );

		// Ajax endpoints
		add_action( 'wp_ajax_expli_save_form', [ $this, 'ajax_save_form' ] );
		add_action( 'wp_ajax_nopriv_expli_save_form', [ $this, 'ajax_save_form' ] );
		add_action( 'wp_ajax_expli_submit_form', [ $this, 'ajax_submit_form' ] );
		add_action( 'wp_ajax_nopriv_expli_submit_form', [ $this, 'ajax_submit_form' ] );

		// Admin menu & actions
		add_action( 'admin_menu', [ $this, 'register_admin_menu' ] );
		add_action( 'admin_post_expli_delete_form', [ $this, 'admin_handle_delete' ] );

		// If frontend receives ?edit=FORMID, print an auto-open script at footer (only on the page)
		add_action( 'wp_footer', [ $this, 'maybe_auto_open_editor' ] );
	}

	/* -------------------------
	   Enqueue assets + localized data
	--------------------------*/
	public function enqueue_assets() {
		$plugin_url = plugin_dir_url( __FILE__ );

		// Register (external asset files expected in assets/). We also provide inline fallback.
		wp_register_script( $this->handle, $plugin_url . 'assets/expli-forms.js', [ 'jquery' ], $this->plugin_version, true );
		wp_register_style( $this->handle . '-style', $plugin_url . 'assets/expli-forms.css', [], $this->plugin_version );

		wp_enqueue_script( $this->handle );
		wp_enqueue_style( $this->handle . '-style' );

		// Provide data to JS including templates and saved forms
		$data = [
			'ajax_url'           => admin_url( 'admin-ajax.php' ),
			'nonce'              => wp_create_nonce( 'expli_forms_nonce' ),
			'templates'          => $this->get_default_templates(),
			'savedForms'         => get_option( $this->option_forms_key, [] ),
			'frontend_page_slug' => self::FRONTEND_PAGE_SLUG,
			'admin_overview_url' => admin_url( 'admin.php?page=expli-forms' ),
		];
		wp_localize_script( $this->handle, 'ExpliFormsData', $data );

		// Inline fallback css/js (keeps plugin working immediately)
		wp_add_inline_style( $this->handle . '-style', $this->inline_css() );
		wp_add_inline_script( $this->handle, $this->inline_js() );
	}

	/* -------------------------
	   FRONTEND SHORTCODE (UI)
	--------------------------*/
	public function shortcode_render( $atts = [] ) {
		$atts = shortcode_atts( [ 'container_class' => 'expli-forms-root' ], $atts, 'expli_forms' );

		ob_start();
		?>
		<div class="<?php echo esc_attr( $atts['container_class'] ); ?>">
			<div class="expli-forms-header">
				<h2>expli-forms — Templates</h2>
				<div class="expli-forms-actions">
					<button class="ef-btn ef-btn-primary" id="ef-open-saved">My Saved Forms</button>
					<button class="ef-btn" id="ef-open-templates">Templates</button>
				</div>
			</div>

			<div id="ef-templates-panel" class="ef-panel"></div>
			<div id="ef-saved-panel" class="ef-panel" style="display:none;"></div>

			<!-- Editor modal -->
			<div id="ef-editor-modal" class="ef-modal" style="display:none;">
				<div class="ef-modal-inner" role="dialog" aria-modal="true">
					<div class="ef-editor-header">
						<h3 id="ef-editor-title">Edit Form</h3>
						<button class="ef-close" id="ef-close-editor" aria-label="Close editor">&times;</button>
					</div>
					<div class="ef-editor-body">
						<div class="ef-left">
							<label>Form name: <input type="text" id="ef-form-name" class="ef-input" /></label>
							<div id="ef-fields-list" class="ef-fields-list"></div>

							<div class="ef-field-controls">
								<select id="ef-new-type">
									<option value="text">Single line (text)</option>
									<option value="textarea">Paragraph (textarea)</option>
									<option value="email">Email</option>
									<option value="number">Number</option>
									<option value="select">Dropdown</option>
									<option value="checkbox">Checkbox</option>
								</select>
								<button class="ef-btn" id="ef-add-field">Add field</button>
							</div>
						</div>
						<div class="ef-right">
							<h4>Preview</h4>
							<div id="ef-form-preview" class="ef-form-preview"></div>

							<div class="ef-editor-actions">
								<button class="ef-btn ef-btn-primary" id="ef-save-custom">Save form</button>
								<button class="ef-btn" id="ef-publish-form">Insert & Publish</button>
							</div>
						</div>
					</div>
				</div>
			</div>

			<!-- Where inserted form appears -->
			<div id="ef-published-area"></div>
		</div>
		<?php
		return ob_get_clean();
	}

	/* -------------------------
	   Shortcode render saved form by ID
	--------------------------*/
	public function shortcode_render_saved_form( $atts = [] ) {
		$atts = shortcode_atts( [ 'id' => '' ], $atts, 'expli_form' );
		$id = sanitize_text_field( $atts['id'] );
		if ( empty( $id ) ) return '<p>expli-forms: missing form id.</p>';

		$saved = get_option( $this->option_forms_key, [] );
		if ( ! isset( $saved[ $id ] ) ) return '<p>expli-forms: form not found.</p>';

		$form = $saved[ $id ];

		ob_start();
		echo '<div class="expli-saved-form">';
		echo '<h3>' . esc_html( $form['name'] ?? 'Form' ) . '</h3>';
		echo '<form class="expli-live-form" data-expli-id="' . esc_attr( $id ) . '">';
		foreach ( $form['fields'] as $f ) {
			$label = esc_html( $f['label'] ?? '' );
			$type  = $f['type'] ?? 'text';
			$fid   = esc_attr( $f['id'] ?? uniqid('f') );
			if ( $type === 'textarea' ) {
				echo '<label>' . $label . '</label><textarea name="' . $fid . '" class="ef-input"></textarea>';
			} elseif ( $type === 'select' ) {
				echo '<label>' . $label . '</label><select name="' . $fid . '" class="ef-input">';
				foreach ( $f['options'] ?? [] as $opt ) {
					echo '<option>' . esc_html( $opt ) . '</option>';
				}
				echo '</select>';
			} elseif ( $type === 'checkbox' ) {
				echo '<label><input type="checkbox" name="' . $fid . '"> ' . $label . '</label>';
			} else {
				echo '<label>' . $label . '</label><input type="' . esc_attr( $type ) . '" name="' . $fid . '" class="ef-input">';
			}
		}
		echo '<button class="ef-btn ef-btn-primary expli-submit">Submit</button>';
		echo '</form>';
		echo '</div>';

		// Inline script to wire submit if JS is present
		$script = <<<JS
<script>
jQuery(function($){
  $('.expli-saved-form .expli-submit').off('click').on('click', function(e){
    e.preventDefault();
    var \$form = $(this).closest('form');
    var data = {};
    \$form.serializeArray().forEach(function(pair){ data[pair.name] = pair.value; });
    var id = \$form.data('expli-id') || '';
    $.post(ExpliFormsData.ajax_url, { action:'expli_submit_form', nonce:ExpliFormsData.nonce, form_id:id, data: JSON.stringify(data) }, function(resp){
      if(resp && resp.success) alert('Submission received.');
      else alert('Submission failed.');
    });
  });
});
</script>
JS;
		echo $script;

		return ob_get_clean();
	}

	/* -------------------------
	   Templates (thumbnails + 9 templates)
	--------------------------*/
	private function get_default_templates() {
		$plugin_url = plugin_dir_url( __FILE__ );
		$images = [
			'blank'      => $plugin_url . 'assets/images/blank.png',
			'contact'    => $plugin_url . 'assets/images/contact.png',
			'signup'     => $plugin_url . 'assets/images/signup.png',
			'college'    => $plugin_url . 'assets/images/college.png',
			'enrollment' => $plugin_url . 'assets/images/enrollment.png',
			'lesson'     => $plugin_url . 'assets/images/lesson.png',
			'meeting'    => $plugin_url . 'assets/images/meeting.png',
			'newyear'    => $plugin_url . 'assets/images/newyear.png',
			'toc'        => $plugin_url . 'assets/images/toc.png',
		];

		return [
			[
				'id' => 'tpl_blank',
				'name' => 'Blank Form',
				'thumbnail' => $images['blank'],
				'fields' => [],
			],
			[
				'id'=>'tpl_contact',
				'name'=>'Contact Us',
				'thumbnail'=>$images['contact'],
				'fields'=>[
					['id'=>'f1','label'=>'Full Name','type'=>'text','required'=>true],
					['id'=>'f2','label'=>'Email','type'=>'email','required'=>true],
					['id'=>'f3','label'=>'Message','type'=>'textarea','required'=>true],
				],
			],
			[
				'id'=>'tpl_signup',
				'name'=>'Sign Up',
				'thumbnail'=>$images['signup'],
				'fields'=>[
					['id'=>'f1','label'=>'First Name','type'=>'text','required'=>true],
					['id'=>'f2','label'=>'Last Name','type'=>'text','required'=>false],
					['id'=>'f3','label'=>'Email','type'=>'email','required'=>true],
				],
			],
			[
				'id'=>'tpl_survey',
				'name'=>'Quick Survey',
				'thumbnail'=>$images['blank'],
				'fields'=>[
					['id'=>'f1','label'=>'How did you hear about us?','type'=>'select','options'=>['Web','Friend','Ad','Other']],
					['id'=>'f2','label'=>'Satisfaction (1-5)','type'=>'number'],
					['id'=>'f3','label'=>'Comments','type'=>'textarea'],
				],
			],
			[
				'id'=>'tpl_college',
				'name'=>'College Application Form',
				'thumbnail'=>$images['college'],
				'fields'=>[
					['id'=>'c1', 'label'=>'Email', 'type'=>'email', 'required'=>true],
					['id'=>'c2', 'label'=>'Address Line 1', 'type'=>'text', 'required'=>false],
					['id'=>'c3', 'label'=>'Address Line 2', 'type'=>'text', 'required'=>false],
					['id'=>'c4', 'label'=>'City', 'type'=>'text', 'required'=>false],
					['id'=>'c5', 'label'=>'State', 'type'=>'select', 'options'=>['--- Select State ---', 'California', 'New York', 'Texas', 'Florida', 'Washington', 'Other']],
					['id'=>'c6', 'label'=>'Zip Code', 'type'=>'number', 'required'=>false],
				],
			],
			[
				'id'=>'tpl_enrollment',
				'name'=>'Enrollment Form',
				'thumbnail'=>$images['enrollment'],
				'fields'=>[
					['id'=>'e1', 'label'=>'First Name', 'type'=>'text', 'required'=>true],
					['id'=>'e2', 'label'=>'Last Name', 'type'=>'text', 'required'=>true],
					['id'=>'e3', 'label'=>'Email', 'type'=>'email', 'required'=>true],
					['id'=>'e4', 'label'=>'Address Line 1', 'type'=>'text', 'required'=>false],
					['id'=>'e5', 'label'=>'Address Line 2', 'type'=>'text', 'required'=>false],
					['id'=>'e6', 'label'=>'City', 'type'=>'text', 'required'=>false],
					['id'=>'e7', 'label'=>'State / Province / Region', 'type'=>'text', 'required'=>false],
					['id'=>'e8', 'label'=>'Country', 'type'=>'select', 'options'=>['Afghanistan', 'Australia', 'Canada', 'India', 'United Kingdom', 'United States']],
					['id'=>'e9', 'label'=>'Postal Code', 'type'=>'text', 'required'=>false],
				],
			],
			[
				'id'=>'tpl_rsvp',
				'name'=>'New Years Party RSVP',
				'thumbnail'=>$images['newyear'],
				'fields'=>[
					['id'=>'r1', 'label'=>'First Name', 'type'=>'text', 'required'=>true],
					['id'=>'r2', 'label'=>'Last Name', 'type'=>'text', 'required'=>true],
					['id'=>'r3', 'label'=>'Email', 'type'=>'email', 'required'=>true],
					['id'=>'r4', 'label'=>'Can you make it?', 'type'=>'select', 'options'=>['Yes','No','Not sure']],
					['id'=>'r5', 'label'=>'How many people will be joining you?', 'type'=>'select', 'options'=>['Just me','Plus 1','Plus 2','Plus 3+']],
					['id'=>'r6', 'label'=>'I am bringing Snacks', 'type'=>'checkbox','required'=>false],
					['id'=>'r7', 'label'=>'I am bringing Desserts', 'type'=>'checkbox','required'=>false],
					['id'=>'r8', 'label'=>'I am bringing Beverages', 'type'=>'checkbox','required'=>false],
					['id'=>'r9', 'label'=>'Anything else we should know?', 'type'=>'textarea','required'=>false],
				],
			],
			[
				'id'=>'tpl_tos',
				'name'=>'Terms of Service Contact',
				'thumbnail'=>$images['toc'],
				'fields'=>[
					['id'=>'t1','label'=>'First Name','type'=>'text','required'=>true],
					['id'=>'t2','label'=>'Last Name','type'=>'text','required'=>false],
					['id'=>'t3','label'=>'Email','type'=>'email','required'=>true],
					['id'=>'t4','label'=>'Comment or Message','type'=>'textarea','required'=>true],
					['id'=>'t5','label'=>'I accept the terms of service','type'=>'checkbox','required'=>true],
				],
			],
			[
				'id'=>'tpl_meeting',
				'name'=>'Meeting Room Registration',
				'thumbnail'=>$images['meeting'],
				'fields'=>[
					['id'=>'m1','label'=>'First Name','type'=>'text','required'=>true],
					['id'=>'m2','label'=>'Last Name','type'=>'text','required'=>true],
					['id'=>'m3','label'=>'Email','type'=>'email','required'=>true],
					['id'=>'m4','label'=>'Department','type'=>'text','required'=>false],
					['id'=>'m5','label'=>'Which room would you like to reserve?','type'=>'select','options'=>['Room A','Room B','Room C']],
					['id'=>'m6','label'=>'Which time block?','type'=>'select','options'=>['8:00 - 9:00am','9:00 - 10:00am','10:00 - 11:00am','11:00 - 12:00pm','1:00 - 2:00pm','2:00 - 3:00pm']],
					['id'=>'m7','label'=>'Questions or Comments','type'=>'textarea','required'=>false],
				],
			],
			[
				'id'=>'tpl_lesson',
				'name'=>'Lesson Plan Form',
				'thumbnail'=>$images['lesson'],
				'fields'=>[
					['id'=>'l1','label'=>'Subject','type'=>'text','required'=>false],
					['id'=>'l2','label'=>'Teaching Topic','type'=>'text','required'=>false],
					['id'=>'l3','label'=>'Lesson Plan Title','type'=>'text','required'=>false],
					['id'=>'l4','label'=>'Standard Addressed (Choice 1)','type'=>'checkbox','required'=>false],
					['id'=>'l5','label'=>'Standard Addressed (Choice 2)','type'=>'checkbox','required'=>false],
					['id'=>'l6','label'=>'Goals/Objectives of Lesson Plans','type'=>'textarea','required'=>false],
					['id'=>'l7','label'=>'Material: Photos','type'=>'checkbox','required'=>false],
					['id'=>'l8','label'=>'Material: Electronic Devices','type'=>'checkbox','required'=>false],
					['id'=>'l9','label'=>'Material: Paper and Pencil','type'=>'checkbox','required'=>false],
					['id'=>'l10','label'=>'Step-by-Step Procedure','type'=>'textarea','required'=>false],
					['id'=>'l11','label'=>'Additional Comments','type'=>'textarea','required'=>false],
					['id'=>'l12','label'=>'Teacher First Name','type'=>'text','required'=>true],
					['id'=>'l13','label'=>'Teacher Last Name','type'=>'text','required'=>true],
					['id'=>'l14','label'=>'Email','type'=>'email','required'=>true],
				],
			],
		];
	}

	/* -------------------------
	   AJAX Save form
	--------------------------*/
	public function ajax_save_form() {
		check_ajax_referer( 'expli_forms_nonce', 'nonce' );

		$payload = isset( $_POST['form'] ) ? wp_unslash( $_POST['form'] ) : '';
		$form    = json_decode( $payload, true );

		if ( empty( $form ) || empty( $form['id'] ) ) {
			wp_send_json_error( [ 'message' => 'Invalid form payload' ] );
		}

		$form['date'] = current_time( 'Y-m-d H:i:s' );
		$form['name'] = sanitize_text_field( $form['name'] ?? 'Untitled' );

		$saved = get_option( $this->option_forms_key, [] );
		$saved[ $form['id'] ] = $form;
		update_option( $this->option_forms_key, $saved );

		wp_send_json_success( [ 'message' => 'Form saved', 'form' => $form ] );
	}

	/* -------------------------
	   AJAX Submit form (store responses)
	--------------------------*/
	public function ajax_submit_form() {
		check_ajax_referer( 'expli_forms_nonce', 'nonce' );

		$form_id = isset( $_POST['form_id'] ) ? sanitize_text_field( wp_unslash( $_POST['form_id'] ) ) : '';
		$data    = isset( $_POST['data'] ) ? wp_unslash( $_POST['data'] ) : '';

		if ( empty( $form_id ) || empty( $data ) ) {
			wp_send_json_error( [ 'message' => 'Missing form ID or data' ] );
		}

		$entry = [
			'form_id' => $form_id,
			'time'    => current_time( 'mysql' ),
			'data'    => json_decode( $data, true ),
		];

		$submissions = get_option( $this->option_submissions_key, [] );
		$submissions[] = $entry;
		update_option( $this->option_submissions_key, $submissions );

		wp_send_json_success( [ 'message' => 'Form submitted', 'entry' => $entry ] );
	}

	/* -------------------------
	   Admin menu & Overview
	--------------------------*/
	public function register_admin_menu() {
		add_menu_page(
			'Expli-Forms',
			'Expli-Forms',
			'manage_options',
			'expli-forms',
			[ $this, 'admin_forms_overview' ],
			'dashicons-feedback',
			25
		);
	}

	public function admin_forms_overview() {
		if ( ! current_user_can( 'manage_options' ) ) return;

		$saved = get_option( $this->option_forms_key, [] );
		?>
		<div class="wrap">
			<h1 class="wp-heading-inline">Expli-Forms</h1>
			<a href="<?php echo esc_url( admin_url('admin.php?page=expli-forms&action=new') ); ?>" class="page-title-action">Add New</a>
			<hr class="wp-header-end" />
			<?php if ( empty( $saved ) ) : ?>
				<p>No forms found. Create one from the frontend by visiting the page with the <code>[expli_forms]</code> shortcode and saving a template.</p>
			<?php else : ?>
				<table class="wp-list-table widefat fixed striped">
					<thead>
						<tr>
							<th>Name</th>
							<th>Shortcode</th>
							<th>Date</th>
							<th style="width:170px;">Actions</th>
						</tr>
					</thead>
					<tbody>
						<?php foreach ( $saved as $id => $form ) : ?>
							<tr>
								<td><strong><?php echo esc_html( $form['name'] ?? $id ); ?></strong></td>
								<td><code><?php echo esc_html( '[expli_form id="' . $id . '"]' ); ?></code></td>
								<td><?php echo esc_html( $form['date'] ?? '' ); ?></td>
								<td>
									<?php
									// Edit - redirect to frontend page where the shortcode is used, with ?edit=ID
									$frontend_edit_url = home_url( '/' . self::FRONTEND_PAGE_SLUG . '/?edit=' . rawurlencode( $id ) );
									?>
									<a class="button" href="<?php echo esc_url( $frontend_edit_url ); ?>">Edit</a>
									<a class="button" href="<?php echo wp_nonce_url( admin_url( 'admin-post.php?action=expli_delete_form&form_id=' . $id ), 'expli_delete_form_' . $id ); ?>">Delete</a>
								</td>
							</tr>
						<?php endforeach; ?>
					</tbody>
				</table>
			<?php endif; ?>
		</div>
		<?php
	}

	// Admin delete handler
	public function admin_handle_delete() {
		if ( ! current_user_can( 'manage_options' ) ) wp_die( 'Unauthorized' );

		$form_id = isset( $_GET['form_id'] ) ? sanitize_text_field( wp_unslash( $_GET['form_id'] ) ) : '';
		if ( empty( $form_id ) ) wp_redirect( admin_url( 'admin.php?page=expli-forms' ) );

		$nonce_action = 'expli_delete_form_' . $form_id;
		if ( ! wp_verify_nonce( wp_unslash( $_GET['_wpnonce'] ?? '' ), $nonce_action ) ) {
			wp_die( 'Invalid nonce' );
		}

		$saved = get_option( $this->option_forms_key, [] );
		if ( isset( $saved[ $form_id ] ) ) {
			unset( $saved[ $form_id ] );
			update_option( $this->option_forms_key, $saved );
		}

		wp_safe_redirect( admin_url( 'admin.php?page=expli-forms' ) );
		exit;
	}

	/* -------------------------
	   Auto-open editor if ?edit= is present on frontend page
	--------------------------*/
	public function maybe_auto_open_editor() {
		// Only attempt on frontend (not in admin) and only when edit param exists
		if ( is_admin() ) return;
		if ( empty( $_GET['edit'] ) ) return;

		$form_id = sanitize_text_field( wp_unslash( $_GET['edit'] ) );

		$saved = get_option( $this->option_forms_key, [] );
		if ( empty( $saved ) || ! isset( $saved[ $form_id ] ) ) return;

		?>
		<script>
		(function(){
			var targetId = <?php echo json_encode( $form_id ); ?>;
			document.addEventListener('DOMContentLoaded', function(){
				setTimeout(function(){
					try {
						if ( window.ExpliFormsData && window.ExpliFormsData.savedForms && window.ExpliFormsData.savedForms[targetId] ) {
							if ( typeof window.expliOpenEditor === 'function' ) {
								window.expliOpenEditor( window.ExpliFormsData.savedForms[targetId] );
							} else if ( typeof window.openEditor === 'function' ) {
								window.openEditor( window.ExpliFormsData.savedForms[targetId] );
							} else {
								console.warn('Expli-forms editor function not found.' );
							}
						}
					} catch(e){
						console.error('expli-forms auto-open error', e);
					}
				}, 350);
			});
		})();
		</script>
		<?php
	}

	/* -------------------------
	   Inline CSS fallback (UI from v1.6)
	--------------------------*/
	private function inline_css() {
		return <<<CSS
/* expli-forms merged UI (from v1.6) */
.expli-forms-root{font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial;background:#fff;padding:18px;border-radius:8px}
.expli-forms-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:12px}
.expli-forms-header h2{margin:0}
.ef-btn{background:#f0f2f5;border:1px solid #d9e2ec;padding:8px 12px;border-radius:6px;cursor:pointer;margin-left:6px}
.ef-btn-primary{background: linear-gradient(135deg,#003366 0%,#3a7bd5 100%); color:#fff; border-color:#004bb5; font-weight:600; box-shadow:0 4px 10px rgba(0,75,181,0.18)}
.ef-panel{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:16px}
.ef-template-card{background:#fff;padding:12px;border-radius:8px;border:1px solid #e6eef6;text-align:center}
.ef-template-thumb{height:120px;width:100%;object-fit:cover;border-radius:6px;margin-bottom:10px;background:#f5f7fa}
.ef-template-name{font-weight:600;margin-bottom:8px;color:#22303b}

/* Modal - fixed size and internal scrolling */
.ef-modal{position:fixed;inset:0;background:rgba(0,0,0,0.45);display:flex;align-items:center;justify-content:center;z-index:99999;padding:20px}
.ef-modal-inner{background:#fff;width:90%;max-width:1000px;height:85vh;border-radius:10px;display:flex;flex-direction:column;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,0.25)}
.ef-editor-header{padding:14px 18px;border-bottom:1px solid #eee;display:flex;justify-content:space-between;align-items:center;flex-shrink:0}
.ef-editor-body{display:flex;gap:16px;padding:16px;flex:1;overflow:auto}
.ef-left{width:44%}
.ef-right{width:56%}
.ef-fields-list{background:#fafafa;padding:10px;border-radius:6px;border:1px dashed #e6eef6;max-height:60vh;overflow:auto}
.ef-field-item{padding:8px;border:1px solid #e9f0fa;background:#fff;border-radius:6px;margin-bottom:8px;display:flex;gap:8px;align-items:center}
.ef-field-label{flex:1}
.ef-input{width:100%;padding:8px;border-radius:6px;border:1px solid #dcdfe6;margin-top:6px}
.ef-form-preview{border:1px dashed #e6eef6;padding:12px;border-radius:6px;background:#fbfdff;min-height:120px;overflow:auto}

/* Table style adjustments for admin */
.wp-list-table .column-shortcode code{background:#f5f5f6;padding:4px 6px;border-radius:3px}

/* Small helpers */
.ef-editor-actions{margin-top:12px}
CSS;
	}

	/* -------------------------
	   Inline JS fallback (core UI from v1.6)
	--------------------------*/
	private function inline_js() {
		return <<<JS
(function($){
"use strict";

function uid(prefix){ return prefix + '_' + Math.random().toString(36).substr(2,9); }
function escHtml(s){ if(s===undefined||s===null) return ''; return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,"&#039;"); }

/*
 Core UI: builds template grid, saved list, opens modal editor, allows adding/removing fields,
 saves via AJAX, publishes preview, and exposes global editor functions for external triggers.
*/

jQuery(function($){
	var templates = (window.ExpliFormsData && ExpliFormsData.templates) || [];
	var savedForms = (window.ExpliFormsData && ExpliFormsData.savedForms) || {};

	var \$templatesPanel = $('#ef-templates-panel');
	var \$savedPanel = $('#ef-saved-panel');

	// Expose global openEditor so admin redirect can call it
	window.openEditor = openEditor;
	// Also expose a namespaced function (safer)
	window.expliOpenEditor = openEditor;

	function buildTemplatesGrid(){
		\$templatesPanel.empty();
		templates.forEach(function(tpl){
			var \$card = $('<div class="ef-template-card"></div>');
			var thumb = tpl.thumbnail || '';
			var \$img = thumb ? $('<img class="ef-template-thumb" />').attr('src',thumb) : $('<div class="ef-template-thumb"></div>');
			\$card.append(\$img);
			\$card.append('<div class="ef-template-name">'+escHtml(tpl.name)+'</div>');
			var \$btn = $('<button class="ef-btn ef-btn-primary">Use</button>');
			\$btn.on('click', function(){ openEditor(tpl); });
			\$card.append(\$btn);
			\$templatesPanel.append(\$card);
		});
	}

	function buildSavedGrid(){
		\$savedPanel.empty();
		var keys = Object.keys(savedForms||{});
		if(!keys.length){
			\$savedPanel.append('<div style="padding:20px;color:#666;text-align:center;">No saved forms yet. Use a template to create one.</div>');
			return;
		}
		keys.forEach(function(k){
			var f = savedForms[k];
			var \$card = $('<div class="ef-template-card"></div>');
			\$card.append('<div class="ef-template-name">'+escHtml(f.name || k)+'</div>');
			\$card.append('<div style="margin:10px 0;"><code>[expli_form id=\"'+escHtml(k)+'\"]</code></div>');
			var \$edit = $('<button class="ef-btn">Edit</button>');
			\$edit.on('click', function(){ openEditor(f); });
			\$card.append(\$edit);
			\$savedPanel.append(\$card);
		});
	}

	// Opens the editor modal with a template/object
	function openEditor(tpl){
		$('#ef-editor-title').text('Edit — ' + (tpl.name||'Untitled'));
		$('#ef-form-name').val(tpl.name || 'Custom Form');

		// Create a deep copy to avoid editing original object until saved
		var formCopy = JSON.parse(JSON.stringify(tpl));
		// Ensure unique ids for fields if missing
		formCopy.fields = (formCopy.fields || []).map(function(f){ return Object.assign({}, f, { id: f.id || uid('field') }); });

		renderFieldsList(formCopy.fields);
		$('#ef-editor-modal').data('editing', { id: formCopy.id || uid('form'), fields: formCopy.fields, name: formCopy.name || 'Custom Form' });
		$('#ef-editor-modal').show();
		refreshPreview(formCopy.fields);
		// focus first input
		setTimeout(function(){ $('#ef-fields-list .ef-field-item input.ef-field-label').first().focus(); }, 200);
	}

	function renderFieldsList(fields){
		var \$list = $('#ef-fields-list').empty();
		fields.forEach(function(f, idx){
			var \$item = $('<div class="ef-field-item"></div>');
			var \$label = $('<input class="ef-field-label ef-field-label-input" type="text">').val(f.label||'Field');
			\$label.on('input', function(){ f.label = $(this).val(); refreshPreview(fields); });
			var \$type = $('<select class="ef-field-type ef-field-type-select"><option value="text">text</option><option value="textarea">textarea</option><option value="email">email</option><option value="number">number</option><option value="select">select</option><option value="checkbox">checkbox</option></select>');
			\$type.val(f.type || 'text');
			\$type.on('change', function(){ f.type = $(this).val(); renderFieldsList(fields); refreshPreview(fields); });
			var \$req = $('<label style="margin-left:6px"><input type="checkbox" class="ef-field-required"> required</label>');
			if(f.required) \$req.find('input').prop('checked', true);
			\$req.find('input').on('change', function(){ f.required = $(this).is(':checked'); refreshPreview(fields); });
			var \$remove = $('<button class="ef-btn" style="background:#ffdddd">Remove</button>').on('click', function(){ fields.splice(idx,1); renderFieldsList(fields); refreshPreview(fields); });

			var \$meta = $('<div style="flex:1"></div>').append(\$label).append('<div style="margin-top:6px"></div>').append(\$type);
			\$item.append(\$meta).append(\$req).append(\$remove);

			// If select, show options editor
			if(f.type === 'select'){
				var opts = f.options || [];
				var \$optWrap = $('<div style="width:100%;margin-top:8px"></div>');
				opts.forEach(function(o, oi){
					var \$o = $('<div style="display:flex;gap:6px;margin-bottom:6px;"></div>');
					var \$inp = $('<input type="text" class="ef-field-option">').val(o);
					\$inp.on('input', function(){ opts[oi] = $(this).val(); f.options = opts; refreshPreview(fields); });
					var \$del = $('<button class="ef-btn" style="background:#ffdede">x</button>').on('click', function(){ opts.splice(oi,1); f.options = opts; renderFieldsList(fields); refreshPreview(fields); });
					\$o.append(\$inp).append(\$del);
					\$optWrap.append(\$o);
				});
				var \$addOpt = $('<button class="ef-btn">Add option</button>').on('click', function(){ opts.push('Option ' + (opts.length+1)); f.options = opts; renderFieldsList(fields); refreshPreview(fields); });
				\$item.append(\$optWrap).append(\$addOpt);
			}

			\$list.append(\$item);
		});
	}

	function refreshPreview(fields){
    var \$preview = $('#ef-form-preview').empty();
    var \$form = $('<form class="ef-live-form"></form>');

    fields.forEach(function(f){
        var html = '';

        // REQUIRED STAR — this is what you were missing
        var reqStar = f.required ? ' <span style="color:red">*</span>' : '';

        // LABEL WITH STAR
        var labelHtml = '<label style="font-weight:600; font-size:14px; display:block;">'
                        + escHtml(f.label) + reqStar + '</label>';

        if (f.type === 'textarea') {
            html = labelHtml +
                '<textarea class="ef-input" name="' + escHtml(f.id) + '"></textarea>';
        }
        else if (f.type === 'select') {
            html = labelHtml + '<select class="ef-input" name="' + escHtml(f.id) + '">';
            (f.options || []).forEach(function(o){
                html += '<option>' + escHtml(o) + '</option>';
            });
            html += '</select>';
        }
        else if (f.type === 'checkbox') {
            // Star appears after the label text for checkboxes
            html = '<label><input type="checkbox" name="' + escHtml(f.id) + '"> ' 
                   + escHtml(f.label) + reqStar + '</label>';
        }
        else {
            html = labelHtml +
                '<input class="ef-input" type="' + escHtml(f.type) 
                + '" name="' + escHtml(f.id) + '">';
        }

        \$form.append('<div style="margin-bottom:10px;">' + html + '</div>');
    });

    var \$submit = $('<button class="ef-btn ef-btn-primary">Submit (demo)</button>');
    \$submit.on('click', function(e){
        e.preventDefault();
        var d = {};
        \$form.serializeArray().forEach(function(p){ d[p.name] = p.value; });
        \$.post(ExpliFormsData.ajax_url, {
            action:'expli_submit_form',
            nonce:ExpliFormsData.nonce,
            form_id: $('#ef-editor-modal').data('editing').id,
            data: JSON.stringify(d)
        }, function(resp){
            if(resp && resp.success) alert('Submission saved (demo)');
            else alert('Submission failed');
        });
    });

    \$preview.append(\$form).append(\$submit);
}


	// Add new field
	$('#ef-add-field').on('click', function(){
		var type = $('#ef-new-type').val();
		var editing = $('#ef-editor-modal').data('editing') || {};
		editing.fields = editing.fields || [];
		var nf = { id: uid('f'), label: (type==='select'?'Choose':'New field'), type: type, required:false, options: type==='select'?['Option 1','Option 2']:[] };
		editing.fields.push(nf);
		$('#ef-editor-modal').data('editing', editing);
		renderFieldsList(editing.fields);
		refreshPreview(editing.fields);
	});

	// Close editor
	$('#ef-close-editor').on('click', function(){ $('#ef-editor-modal').hide(); });

	// Save form via AJAX
	$('#ef-save-custom').on('click', function(){
		var editing = $('#ef-editor-modal').data('editing') || {};
		if(!editing) return alert('Nothing to save');
		editing.name = $('#ef-form-name').val() || editing.name || 'Custom Form';
		editing.id = editing.id || uid('form');
		$.post(ExpliFormsData.ajax_url, { action:'expli_save_form', nonce:ExpliFormsData.nonce, form: JSON.stringify(editing) }, function(resp){
			if(resp && resp.success){
				// Update local cache and UI
				savedForms[editing.id] = resp.data.form || editing;
				alert('Form saved');
				$('#ef-editor-modal').hide();
				window.location.href = ExpliFormsData.admin_overview_url;

			} else {
				alert('Save failed');
			}
		});
	});

	// Insert & publish (render on page)
	$('#ef-publish-form').on('click', function(){
		var editing = $('#ef-editor-modal').data('editing');
		if(!editing) return;
		editing.name = $('#ef-form-name').val() || editing.name;
		renderPublishedForm(editing);
		$('#ef-editor-modal').hide();
	});

	function renderPublishedForm(form){
		$('#ef-published-area').empty();
		var \$c = $('<div class="ef-published"></div>');
		\$c.append('<h3>'+escHtml(form.name)+'</h3>');
		var \$f = $('<form></form>');
		form.fields.forEach(function(ff){ 
			if(ff.type==='textarea') \$f.append('<label>'+escHtml(ff.label)+'</label><textarea class="ef-input" name="'+escHtml(ff.id)+'"></textarea>');
			else if(ff.type==='select'){ var opts=''; (ff.options||[]).forEach(function(o){ opts+='<option>'+escHtml(o)+'</option>'; }); \$f.append('<label>'+escHtml(ff.label)+'</label><select class="ef-input" name="'+escHtml(ff.id)+'">'+opts+'</select>'); }
			else if(ff.type==='checkbox') \$f.append('<label><input type="checkbox" name="'+escHtml(ff.id)+'"> '+escHtml(ff.label)+'</label>');
			else \$f.append('<label>'+escHtml(ff.label)+'</label><input class="ef-input" type="'+escHtml(ff.type)+'" name="'+escHtml(ff.id)+'">');
		});
		var \$btn = $('<button class="ef-btn ef-btn-primary">Submit</button>');
		\$btn.on('click', function(e){ e.preventDefault(); var data={}; \$f.serializeArray().forEach(function(p){ data[p.name]=p.value; }); $.post(ExpliFormsData.ajax_url, { action:'expli_submit_form', nonce:ExpliFormsData.nonce, form_id: form.id||uid('form'), data: JSON.stringify(data) }, function(resp){ if(resp && resp.success) alert('Submission received'); }); });
		\$c.append(\$f).append(\$btn);
		$('#ef-published-area').append(\$c);
	}

	// toggles
	$('#ef-open-templates').on('click', function(){ $('#ef-templates-panel').show(); $('#ef-saved-panel').hide(); buildTemplatesGrid(); });
	$('#ef-open-saved').on('click', function(){ $('#ef-templates-panel').hide(); $('#ef-saved-panel').show(); buildSavedGrid(); });

	// init UI
	buildTemplatesGrid();
	buildSavedGrid();

	// default to Saved Forms view like WPForms
	$('#ef-templates-panel').hide();
	$('#ef-saved-panel').show();
});
})(jQuery);
JS;
	}
} // end class

new Expli_Forms_Plugin();
