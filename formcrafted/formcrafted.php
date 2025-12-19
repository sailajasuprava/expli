<?php
/*
Plugin Name: FormCrafted
Description: Frontend template picker + visual form editor (modal) + admin overview. Place [formcrafted] on a page (default slug: /formcrafted/) to use.
Version: 1.0
Author: You
Text Domain: formcrafted
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html
*/

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class FormCrafted_Plugin {

	const FRONTEND_PAGE_SLUG = 'formcrafted';

	private $option_forms_key = 'formcrafted_saved_forms';
	private $option_submissions_key = 'formcrafted_submissions';
	private $plugin_version = '1.0';
	private $handle = 'formcrafted-frontend';

	public function __construct() {
		// Frontend assets and UI
		add_action( 'wp_enqueue_scripts', [ $this, 'enqueue_assets' ] );

		// Shortcodes
		add_shortcode( 'formcrafted', [ $this, 'shortcode_render' ] );
		add_shortcode( 'formcrafted_form', [ $this, 'shortcode_render_saved_form' ] );

		// Ajax endpoints (namespaced to formcrafted)
		add_action( 'wp_ajax_formcrafted_save_form', [ $this, 'ajax_save_form' ] );
		add_action( 'wp_ajax_nopriv_formcrafted_save_form', [ $this, 'ajax_save_form' ] );
		add_action( 'wp_ajax_formcrafted_submit_form', [ $this, 'ajax_submit_form' ] );
		add_action( 'wp_ajax_nopriv_formcrafted_submit_form', [ $this, 'ajax_submit_form' ] );

		// Admin menu & actions
		add_action( 'admin_menu', [ $this, 'register_admin_menu' ] );
		add_action( 'admin_post_formcrafted_delete_form', [ $this, 'admin_handle_delete' ] );

		// If frontend receives ?edit=FORMID, print an auto-open script at footer (only on the page)
		add_action( 'wp_footer', [ $this, 'maybe_auto_open_editor' ] );
	}

	/* -------------------------
	   Enqueue assets + localized data
	--------------------------*/
	public function enqueue_assets() {
		$plugin_url = plugin_dir_url( __FILE__ );

		// Register (external asset files expected in assets/)
		wp_register_script( $this->handle, $plugin_url . 'assets/formcrafted.js', [ 'jquery' ], $this->plugin_version, true );
		wp_register_style( $this->handle . '-style', $plugin_url . 'assets/formcrafted.css', [], $this->plugin_version );

		wp_enqueue_script( $this->handle );
		wp_enqueue_style( $this->handle . '-style' );

		// Provide data to JS including templates and saved forms
		$data = [
			'ajax_url'           => admin_url( 'admin-ajax.php' ),
			'nonce'              => wp_create_nonce( 'formcrafted_nonce' ),
			'templates'          => $this->get_default_templates(),
			'savedForms'         => get_option( $this->option_forms_key, [] ),
			'frontend_page_slug' => self::FRONTEND_PAGE_SLUG,
			'admin_overview_url' => admin_url( 'admin.php?page=formcrafted' ),
		];
		wp_localize_script( $this->handle, 'FormCraftedData', $data );

		// Inline fallback css (keeps plugin working immediately)
		wp_add_inline_style( $this->handle . '-style', $this->inline_css() );

		// NOTE: We intentionally DO NOT add large inline JS here (external file should contain the JS).
	}

	/* -------------------------
	   FRONTEND SHORTCODE (UI)
	--------------------------*/
	public function shortcode_render( $atts = [] ) {
		$atts = shortcode_atts( [ 'container_class' => 'formcrafted-root' ], $atts, 'formcrafted' );

		ob_start();
		?>
		<div class="<?php echo esc_attr( $atts['container_class'] ); ?>">
			<div class="fc-header">
				<h2>FormCrafted — Templates</h2>
				<div class="fc-actions">
					<button class="fc-btn fc-btn-primary" id="fc-open-saved">My Saved Forms</button>
					<button class="fc-btn" id="fc-open-templates">Templates</button>
				</div>
			</div>

			<div id="fc-templates-panel" class="fc-panel"></div>
			<div id="fc-saved-panel" class="fc-panel" style="display:none;"></div>

			<!-- Editor modal -->
			<div id="fc-editor-modal" class="fc-modal" style="display:none;">
				<div class="fc-modal-inner" role="dialog" aria-modal="true">
					<div class="fc-editor-header">
						<h3 id="fc-editor-title">Edit Form</h3>
						<button class="fc-close" id="fc-close-editor" aria-label="Close editor">&times;</button>
					</div>
					<div class="fc-editor-body">
						<div class="fc-left">
							<label>Form name: <input type="text" id="fc-form-name" class="fc-input" /></label>
							<div id="fc-fields-list" class="fc-fields-list"></div>

							<div class="fc-field-controls">
								<select id="fc-new-type">
									<option value="text">Single line (text)</option>
									<option value="textarea">Paragraph (textarea)</option>
									<option value="email">Email</option>
									<option value="number">Number</option>
									<option value="select">Dropdown</option>
									<option value="checkbox">Checkbox</option>
								</select>
								<button class="fc-btn fc-btn-primary" id="fc-add-field">Add field</button>
							</div>
						</div>
						<div class="fc-right">
							<h4>Preview</h4>
							<div id="fc-form-preview" class="fc-form-preview"></div>

							<div class="fc-editor-actions">
								<button class="fc-btn fc-btn-primary" id="fc-save-custom">Save form</button>
								<button class="fc-btn" id="fc-publish-form">Insert & Publish</button>
							</div>
						</div>
					</div>
				</div>
			</div>

			<!-- Where inserted form appears -->
			<div id="fc-published-area"></div>
		</div>
		<?php
		return ob_get_clean();
	}

	/* -------------------------
	   Shortcode render saved form by ID
	--------------------------*/
	public function shortcode_render_saved_form( $atts = [] ) {
		$atts = shortcode_atts( [ 'id' => '' ], $atts, 'formcrafted_form' );
		$id = sanitize_text_field( $atts['id'] );
		if ( empty( $id ) ) return '<p>FormCrafted: missing form id.</p>';

		$saved = get_option( $this->option_forms_key, [] );
		if ( ! isset( $saved[ $id ] ) ) return '<p>FormCrafted: form not found.</p>';

		$form = $saved[ $id ];

		ob_start();
		echo '<div class="fc-saved-form">';
		echo '<h3>' . esc_html( $form['name'] ?? 'Form' ) . '</h3>';
		echo '<form class="fc-live-form" data-fc-id="' . esc_attr( $id ) . '">';

		// Render fields (escaped)
		foreach ( $form['fields'] as $f ) {

			$label = $f['label'] ?? '';
			$type  = $f['type'] ?? 'text';
			$fid   = $f['id'] ?? uniqid( 'f' );
			$req   = ! empty( $f['required'] ) ? ' <span style="color:red">*</span>' : '';

			// TEXTAREA
			if ( $type === 'textarea' ) {
				echo '<label>' . esc_html( $label ) . wp_kses_post( $req ) . '</label>';
				echo '<textarea name="' . esc_attr( $fid ) . '" class="fc-input"></textarea>';

			// SELECT
			} elseif ( $type === 'select' ) {
				echo '<label>' . esc_html( $label ) . wp_kses_post( $req ) . '</label>';
				echo '<select name="' . esc_attr( $fid ) . '" class="fc-input">';
				foreach ( $f['options'] ?? [] as $opt ) {
					echo '<option>' . esc_html( $opt ) . '</option>';
				}
				echo '</select>';

			// CHECKBOX
			} elseif ( $type === 'checkbox' ) {
				echo '<label><input type="checkbox" name="' . esc_attr( $fid ) . '"> ' .
				     esc_html( $label ) . wp_kses_post( $req ) . '</label>';

			// OTHER (input)
			} else {
				echo '<label>' . esc_html( $label ) . wp_kses_post( $req ) . '</label>';
				echo '<input type="' . esc_attr( $type ) . '" name="' . esc_attr( $fid ) . '" class="fc-input">';
			}
		}

		echo '<button class="fc-btn fc-btn-primary fc-submit">Submit</button>';
		echo '</form>';
		echo '</div>';

		// Inline script to wire submit if JS is present (built as concatenated string, no heredoc)
		$script  = '<script>jQuery(function($){';
		$script .= '$(\'.fc-saved-form .fc-submit\').off(\'click\').on(\'click\', function(e){';
		$script .= 'e.preventDefault();';
		$script .= 'var $form = $(this).closest(\'form\');';
		$script .= 'var data = {};';
		$script .= '$form.serializeArray().forEach(function(pair){ data[pair.name] = pair.value; });';
		$script .= 'var id = $form.data(\'fc-id\') || \'\';';
		$script .= 'var payload = { action: \'formcrafted_submit_form\', nonce: FormCraftedData.nonce, form_id: id, data: JSON.stringify(data) };';
		$script .= '$.post(FormCraftedData.ajax_url, payload, function(resp){';
		$script .= 'if(resp && resp.success) alert(\'Submission received.\'); else alert(\'Submission failed.\');';
		$script .= '});';
		$script .= '});';
		$script .= '});</script>';

		wp_add_inline_script( $this->handle, $script );
		return ob_get_clean();
	}

	/* -------------------------
	   Templates (thumbnails)
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
	   Small helper to sanitize nested submission arrays
	--------------------------*/
	private function sanitize_form_values( $data ) {
		if ( is_array( $data ) ) {
			$clean = [];
			foreach ( $data as $k => $v ) {
				$clean_key = is_string( $k ) ? sanitize_text_field( $k ) : $k;
				$clean[ $clean_key ] = $this->sanitize_form_values( $v );
			}
			return $clean;
		}

		if ( is_string( $data ) ) {
			// Most values are plain text; if you want to allow HTML in some fields, use wp_kses_post()
			return sanitize_text_field( $data );
		}

		return $data;
	}

/* -------------------------
       AJAX Save form
    --------------------------*/
    public function ajax_save_form() {
        // verifies nonce
        check_ajax_referer( 'formcrafted_nonce', 'nonce' );

        // FIX: Unslash and Sanitize immediately upon access
        $payload = isset( $_POST['form'] ) ? sanitize_textarea_field( wp_unslash( $_POST['form'] ) ) : '';

        $form = json_decode( $payload, true );

        if ( empty( $form ) || empty( $form['id'] ) ) {
            wp_send_json_error( [ 'message' => 'Invalid form payload' ] );
        }

        // sanitize id and name
        $form_id   = sanitize_key( $form['id'] );
        $form_name = sanitize_text_field( $form['name'] ?? 'Untitled' );

        // sanitize fields array if present
        if ( isset( $form['fields'] ) && is_array( $form['fields'] ) ) {
            $clean_fields = [];
            foreach ( $form['fields'] as $f ) {
                if ( ! is_array( $f ) ) {
                    continue;
                }
                $clean = [];
                $clean['id'] = isset( $f['id'] ) ? sanitize_key( $f['id'] ) : uniqid( 'f' );
                $clean['label'] = isset( $f['label'] ) ? sanitize_text_field( $f['label'] ) : '';
                $clean['type'] = isset( $f['type'] ) ? sanitize_text_field( $f['type'] ) : 'text';
                $clean['required'] = ! empty( $f['required'] ) ? true : false;
                if ( isset( $f['options'] ) && is_array( $f['options'] ) ) {
                    $opts = [];
                    foreach ( $f['options'] as $opt ) {
                        $opts[] = sanitize_text_field( $opt );
                    }
                    $clean['options'] = $opts;
                }
                $clean_fields[] = $clean;
            }
            $form['fields'] = $clean_fields;
        }

        $form['id']   = $form_id;
        $form['name'] = $form_name;
        $form['date'] = current_time( 'Y-m-d H:i:s' );

        $saved = get_option( $this->option_forms_key, [] );
        $saved[ $form_id ] = $form;
        update_option( $this->option_forms_key, $saved );

        wp_send_json_success( [ 'message' => 'Form saved', 'form' => $form ] );
    }

    /* -------------------------
       AJAX Submit form (store responses)
    --------------------------*/
    public function ajax_submit_form() {
        check_ajax_referer( 'formcrafted_nonce', 'nonce' );

        // FIX: Combined checks into one line
        $form_id = isset( $_POST['form_id'] ) ? sanitize_text_field( wp_unslash( $_POST['form_id'] ) ) : '';
        
        // FIX: Unslash and Sanitize immediately upon access
        $data = isset( $_POST['data'] ) ? sanitize_textarea_field( wp_unslash( $_POST['data'] ) ) : '';

        if ( empty( $form_id ) || empty( $data ) ) {
            wp_send_json_error( [ 'message' => 'Missing form ID or data' ] );
        }

        $decoded = json_decode( $data, true );
        if ( ! is_array( $decoded ) ) {
            wp_send_json_error( [ 'message' => 'Invalid form data' ] );
        }

        // sanitize submitted form values recursively
        $clean_data = $this->sanitize_form_values( $decoded );

        $entry = [
            'form_id' => $form_id,
            'time'    => current_time( 'mysql' ),
            'data'    => $clean_data,
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
			'FormCrafted',
			'FormCrafted',
			'manage_options',
			'formcrafted',
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
			<h1 class="wp-heading-inline">FormCrafted</h1>
			<a href="<?php echo esc_url( admin_url('admin.php?page=formcrafted&action=new') ); ?>" class="page-title-action">Add New</a>
			<hr class="wp-header-end" />
			<?php if ( empty( $saved ) ) : ?>
				<p>No forms found. Create one from the frontend by visiting the page with the <code>[formcrafted]</code> shortcode and saving a template.</p>
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
								<td><code><?php echo esc_html( '[formcrafted_form id="' . $id . '"]' ); ?></code></td>
								<td><?php echo esc_html( $form['date'] ?? '' ); ?></td>
								<td>
									<?php
									// Edit - redirect to frontend page where the shortcode is used, with ?edit=ID
									$frontend_edit_url = home_url( '/' . self::FRONTEND_PAGE_SLUG . '/?edit=' . rawurlencode( $id ) );
									$delete_url = wp_nonce_url( admin_url( 'admin-post.php?action=formcrafted_delete_form&form_id=' . rawurlencode( $id ) ), 'formcrafted_delete_form_' . $id );
									?>
									<a class="button" href="<?php echo esc_url( $frontend_edit_url ); ?>">Edit</a>
									<a class="button" href="<?php echo esc_url( $delete_url ); ?>">Delete</a>
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
		if ( empty( $form_id ) ) {
			wp_safe_redirect( admin_url( 'admin.php?page=formcrafted' ) );
			exit;
		}

		$nonce_action = 'formcrafted_delete_form_' . $form_id;
		$nonce = isset( $_GET['_wpnonce'] ) ? sanitize_text_field( wp_unslash( $_GET['_wpnonce'] ) ) : '';
		if ( ! wp_verify_nonce( $nonce, $nonce_action ) ) {
			wp_die('Invalid nonce');
		}


		$saved = get_option( $this->option_forms_key, [] );
		if ( isset( $saved[ $form_id ] ) ) {
			unset( $saved[ $form_id ] );
			update_option( $this->option_forms_key, $saved );
		}

		wp_safe_redirect( admin_url( 'admin.php?page=formcrafted' ) );
		exit;
	}

	/* -------------------------
	   Auto-open editor if ?edit= is present on frontend page
	--------------------------*/
	public function maybe_auto_open_editor() {
		// Only attempt on frontend (not in admin) and only when edit param exists
		if ( is_admin() ) return;
		if ( empty( $_GET['edit'] ) || empty( $_GET['_fcnonce'] ) ) return;

		$nonce = sanitize_text_field( wp_unslash( $_GET['_fcnonce'] ) );
		if ( ! wp_verify_nonce( $nonce, 'formcrafted_edit' ) ) {
			return;
		}

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
						if ( window.FormCraftedData && window.FormCraftedData.savedForms && window.FormCraftedData.savedForms[targetId] ) {
							if ( typeof window.formcraftedOpenEditor === 'function' ) {
								window.formcraftedOpenEditor( window.FormCraftedData.savedForms[targetId] );
							} else if ( typeof window.openEditor === 'function' ) {
								window.openEditor( window.FormCraftedData.savedForms[targetId] );
							} else {
								console.warn('FormCrafted editor function not found.' );
							}
						}
					} catch(e){
						console.error('formcrafted auto-open error', e);
					}
				}, 350);
			});
		})();
		</script>
		<?php
	}

	/* -------------------------
	   Inline CSS fallback (UI) - no heredoc
	--------------------------*/
	private function inline_css() {
		$css  = '/* FormCrafted inline fallback styles */';
		$css .= '.formcrafted-root, .fc-root { font-family: system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial; background:#fff; padding:18px; border-radius:8px; }';
		$css .= '.fc-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:12px}';
		$css .= '.fc-header h2{margin:0}';
		$css .= '.fc-btn{background:#f0f2f5;border:1px solid #d9e2ec;padding:8px 12px;border-radius:6px;cursor:pointer;margin-left:6px}';
		$css .= '.fc-btn-primary{background: linear-gradient(135deg,#003366 0%,#3a7bd5 100%); color:#fff; border-color:#004bb5; font-weight:600; box-shadow:0 4px 10px rgba(0,75,181,0.18)}';
		$css .= '.fc-panel{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:16px}';
		$css .= '.fc-template-card{background:#fff;padding:12px;border-radius:8px;border:1px solid #004bb5;text-align:center}';
		$css .= '.fc-template-thumb{height:120px;width:100%;object-fit:cover;border-radius:6px;margin-bottom:10px;background:#f5f7fa}';
		$css .= '.fc-template-name{font-weight:600;margin-bottom:8px;color:#22303b}';
		$css .= '.fc-modal{position:fixed;inset:0;background:rgba(0,0,0,0.45);display:flex;align-items:center;justify-content:center;z-index:99999;padding:20px}';
		$css .= '.fc-modal-inner{background:#fff;width:90%;max-width:1100px;max-height:90vh;border-radius:10px;display:flex;flex-direction:column;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,0.25)}';
		$css .= '.fc-editor-header{padding:14px 18px;border-bottom:1px solid #eee;display:flex;justify-content:space-between;align-items:center;flex-shrink:0}';
		$css .= '.fc-editor-body{display:flex;gap:16px;padding:16px;flex:1;overflow:auto}';
		$css .= '.fc-left{width:45%;min-width:280px;box-sizing:border-box}';
		$css .= '.fc-right{width:55%;min-width:300px;box-sizing:border-box}';
		$css .= '.fc-fields-list{background:#fafafa;padding:10px;border-radius:6px;border:1px dashed #e6eef6;max-height:60vh;overflow:auto;box-sizing:border-box}';
		$css .= '.fc-field-item{padding:12px;border:1px solid #e9f0fa;background:#fff;border-radius:6px;margin-bottom:8px;display:flex;gap:12px;align-items:flex-start;flex-wrap:wrap}';
		$css .= '.fc-field-item > .fc-meta { flex:1; min-width:160px; }';
		$css .= '.fc-field-label-input{ width:100%; padding:8px;border-radius:6px;border:1px solid #dcdfe6; box-sizing:border-box; }';
		$css .= '.fc-field-type-select{ padding:8px;border-radius:6px;border:1px solid #dcdfe6; margin-top:6px; width:200px; box-sizing:border-box; }';
		$css .= '.fc-field-option{ padding:8px;border:1px solid #dcdfe6;border-radius:6px; width: calc(100% - 44px); box-sizing:border-box; display:inline-block; }';
		$css .= '.fc-field-option + button { vertical-align: top; margin-left:6px; }';
		$css .= '.fc-field-controls{margin-top:12px;display:flex;gap:8px;align-items:center;flex-wrap:wrap}';
		$css .= '.fc-input{width:100%;padding:8px;border-radius:6px;border:1px solid #dcdfe6;margin-top:6px;box-sizing:border-box}';
		$css .= '.fc-form-preview{border:1px dashed #e6eef6;padding:16px;border-radius:6px;background:#fbfdff;min-height:160px;overflow:auto;box-sizing:border-box}';
		$css .= '.fc-editor-actions{margin-top:12px}';
		$css .= '.fc-close{background:#0b63b7;color:#fff;border:none;border-radius:6px;padding:8px 12px;cursor:pointer}';
		$css .= '@media (max-width:900px){ .fc-editor-body{flex-direction:column} .fc-left, .fc-right{width:100%} }';

		return $css;
	}
} // end class

new FormCrafted_Plugin();
