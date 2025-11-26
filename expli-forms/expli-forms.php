<?php
/*
Plugin Name: expli-forms
Description: Frontend form templates and lightweight visual editor for all users. Add [expli_forms] anywhere.
Version: 1.0
Author: (You)
Text Domain: expli-forms
*/

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class Expli_Forms_Plugin {

	private $option_forms_key = 'expli_forms_saved_forms';
	private $option_submissions_key = 'expli_forms_submissions';

	public function __construct() {
		add_action( 'wp_enqueue_scripts', [ $this, 'enqueue_assets' ] );
		add_shortcode( 'expli_forms', [ $this, 'shortcode_render' ] );

		add_action( 'wp_ajax_expli_save_form', [ $this, 'ajax_save_form' ] );
		add_action( 'wp_ajax_nopriv_expli_save_form', [ $this, 'ajax_save_form' ] );

		add_action( 'wp_ajax_expli_submit_form', [ $this, 'ajax_submit_form' ] );
		add_action( 'wp_ajax_nopriv_expli_submit_form', [ $this, 'ajax_submit_form' ] );
	}

	public function enqueue_assets() {
		$handle = 'expli-forms-frontend';
		wp_register_script( $handle, plugins_url( '/assets/expli-forms.js', __FILE__ ), [ 'jquery' ], '1.0', true );
		wp_register_style( 'expli-forms-style', plugins_url( '/assets/expli-forms.css', __FILE__ ), [], '1.0' );

		// We'll inline assets if asset files are not present (to keep everything in this single-file snippet).
		// But still register handles so WP can manage dependencies.

		wp_enqueue_script( $handle );
		wp_enqueue_style( 'expli-forms-style' );

		// Pass data and nonces
		$data = [
			'ajax_url' => admin_url( 'admin-ajax.php' ),
			'nonce'    => wp_create_nonce( 'expli_forms_nonce' ),
			'templates' => $this->get_default_templates(),
		];
		wp_localize_script( $handle, 'ExpliFormsData', $data );

		// Inline styles (fallback) — keep them light
		$css = $this->inline_css();
		wp_add_inline_style( 'expli-forms-style', $css );

		// Inline JS (fallback) — core UI/logic
		$js = $this->inline_js();
		wp_add_inline_script( $handle, $js );
	}

	// Shortcode output
	public function shortcode_render( $atts = [] ) {
		$atts = shortcode_atts( [
			'container_class' => 'expli-forms-root'
		], $atts, 'expli_forms' );

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
				<div class="ef-modal-inner">
					<div class="ef-editor-header">
						<h3 id="ef-editor-title">Edit Form</h3>
						<button class="ef-close" id="ef-close-editor">&times;</button>
					</div>
					<div class="ef-editor-body">
						<div class="ef-left">
							<label>Form name: <input type="text" id="ef-form-name" /></label>
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
								<button class="ef-btn" id="ef-publish-form">Insert & Publish (render below)</button>
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

	// Default templates
	private function get_default_templates() {
		// Using the uploaded image path as thumbnail. Replace this with a web-accessible URL when deploying.
		$thumb_path = '/mnt/data/Screenshot 2025-11-25 204703.png';
		// If you host images in plugin assets, replace the thumbnail path accordingly.

		$templates = [
			[
				'id' => 'tpl_contact',
				'name' => 'Contact Us',
				'thumbnail' => $thumb_path,
				'fields' => [
					['id'=>'f1','label'=>'Full Name','type'=>'text','required'=>true],
					['id'=>'f2','label'=>'Email','type'=>'email','required'=>true],
					['id'=>'f3','label'=>'Message','type'=>'textarea','required'=>true],
				],
			],
			[
				'id' => 'tpl_signup',
				'name' => 'Sign Up',
				'thumbnail' => $thumb_path,
				'fields' => [
					['id'=>'f1','label'=>'First Name','type'=>'text','required'=>true],
					['id'=>'f2','label'=>'Last Name','type'=>'text','required'=>false],
					['id'=>'f3','label'=>'Email','type'=>'email','required'=>true],
				],
			],
			[
				'id' => 'tpl_survey',
				'name' => 'Quick Survey',
				'thumbnail' => $thumb_path,
				'fields' => [
					['id'=>'f1','label'=>'How did you hear about us?','type'=>'select','options'=>['Web','Friend','Ad','Other']],
					['id'=>'f2','label'=>'Satisfaction (1-5)','type'=>'number'],
					['id'=>'f3','label'=>'Comments','type'=>'textarea'],
				],
			],
		];

		// Merge with any saved custom templates in database (optional)
		return $templates;
	}

	// AJAX save form (store customized form in options)
	public function ajax_save_form() {
		check_ajax_referer( 'expli_forms_nonce', 'nonce' );

		$payload = isset( $_POST['form'] ) ? wp_unslash( $_POST['form'] ) : '';
		$form = json_decode( $payload, true );

		if ( empty( $form ) || empty( $form['id'] ) ) {
			wp_send_json_error( [ 'message' => 'Invalid form payload' ] );
		}

		// Get saved forms
		$saved = get_option( $this->option_forms_key, [] );
		// Save/replace by id
		$saved[ $form['id'] ] = $form;
		update_option( $this->option_forms_key, $saved );

		wp_send_json_success( [ 'message' => 'Form saved', 'form' => $form ] );
	}

	// AJAX submit form (store submission)
	public function ajax_submit_form() {
		check_ajax_referer( 'expli_forms_nonce', 'nonce' );

		$form_id = isset( $_POST['form_id'] ) ? sanitize_text_field( wp_unslash( $_POST['form_id'] ) ) : '';
		$data = isset( $_POST['data'] ) ? wp_unslash( $_POST['data'] ) : '';

		if ( empty( $form_id ) || empty( $data ) ) {
			wp_send_json_error( [ 'message' => 'Missing form ID or data' ] );
		}

		$entry = [
			'form_id' => $form_id,
			'time' => current_time( 'mysql' ),
			'data' => json_decode( $data, true ),
		];

		$submissions = get_option( $this->option_submissions_key, [] );
		$submissions[] = $entry;
		update_option( $this->option_submissions_key, $submissions );

		// Optionally email administrator
		/*
		$admin_email = get_option('admin_email');
		wp_mail( $admin_email, "New expli-forms submission ($form_id)", print_r($entry['data'], true) );
		*/

		wp_send_json_success( [ 'message' => 'Form submitted', 'entry' => $entry ] );
	}

	// Inline minimal CSS
	private function inline_css() {
		return <<<CSS
/* expli-forms basic styles */
.expli-forms-root{background:#f2f2f2;padding:18px;border-radius:6px;font-family:Arial,Helvetica,sans-serif}
.expli-forms-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:12px}
.expli-forms-header h2{margin:0}
.ef-btn{background:#e9e9e9;border:1px solid #cfcfcf;padding:8px 12px;border-radius:6px;cursor:pointer;margin-left:6px}
.ef-btn-primary{background:#10b981;color:#fff;border-color:#0f766e}
.ef-panel{display:flex;flex-wrap:wrap;gap:16px}
.ef-template-card{width:230px;background:#fff;padding:10px;border-radius:6px;box-shadow:0 1px 3px rgba(0,0,0,0.08);text-align:center}
.ef-template-thumb{height:110px;background:#777;border-radius:4px;margin-bottom:8px;object-fit:cover;width:100%}
.ef-template-name{font-weight:600;margin-bottom:8px}
.ef-template-actions{display:flex;justify-content:space-between;gap:8px}
.ef-modal{position:fixed;left:0;top:0;right:0;bottom:0;background:rgba(0,0,0,0.35);display:flex;align-items:center;justify-content:center;z-index:9999}
.ef-modal-inner{background:#fff;width:90%;max-width:1000px;border-radius:8px;overflow:hidden}
.ef-editor-header{display:flex;justify-content:space-between;align-items:center;padding:12px 16px;border-bottom:1px solid #eee}
.ef-editor-body{display:flex;gap:12px;padding:16px}
.ef-left{width:45%}
.ef-right{width:55%}
.ef-fields-list{border:1px dashed #ddd;padding:8px;border-radius:6px;min-height:120px;background:#fafafa}
.ef-field-item{padding:8px;border:1px solid #e6e6e6;background:#fff;border-radius:6px;margin-bottom:8px;display:flex;align-items:center;gap:8px}
.ef-field-item .ef-field-meta{flex:1}
.ef-field-controls{margin-top:8px}
.ef-form-preview{border:1px solid #eee;padding:12px;border-radius:6px;background:#fff;min-height:120px}
.ef-field-edit input[type="text"]{width:100%}
.ef-close{background:transparent;border:0;font-size:22px;cursor:pointer}
#ef-published-area{margin-top:18px}
.ef-input{width:100%;padding:8px;margin:6px 0;border-radius:4px;border:1px solid #ccc}
CSS;
	}

	// Inline JS — renders templates, opens editor, allows editing/save/submit
	private function inline_js() {
		// Note: ExpliFormsData object is injected by wp_localize_script with templates, ajax_url and nonce
		return <<<JS
(function($){
	"use strict";

	function uid(prefix){
		return prefix + '_' + Math.random().toString(36).substr(2,9);
	}

	// Utilities to render a field to DOM
	function renderFieldPreview(field){
		let html = '';
		let required = field.required ? 'required' : '';
		switch(field.type){
			case 'text':
			case 'email':
			case 'number':
				html = '<label>'+escapeHtml(field.label)+(field.required? ' *':'')+'</label><input class="ef-input" type="'+field.type+'" name="'+escapeHtml(field.id)+'" '+required+'>';
				break;
			case 'textarea':
				html = '<label>'+escapeHtml(field.label)+(field.required? ' *':'')+'</label><textarea class="ef-input" name="'+escapeHtml(field.id)+'"></textarea>';
				break;
			case 'select':
				html = '<label>'+escapeHtml(field.label)+'</label><select class="ef-input" name="'+escapeHtml(field.id)+'">';
				(field.options||[]).forEach(function(o){ html += '<option>'+escapeHtml(o)+'</option>'; });
				html += '</select>';
				break;
			case 'checkbox':
				html = '<label><input type="checkbox" name="'+escapeHtml(field.id)+'"> '+escapeHtml(field.label)+'</label>';
				break;
			default:
				html = '<label>'+escapeHtml(field.label)+'</label><input class="ef-input" type="text" name="'+escapeHtml(field.id)+'">';
		}
		return html;
	}

	function escapeHtml(unsafe) {
		if (unsafe === undefined || unsafe === null) return '';
		return String(unsafe)
		  .replace(/&/g, '&amp;')
		  .replace(/</g, '&lt;')
		  .replace(/>/g, '&gt;')
		  .replace(/"/g, '&quot;')
		  .replace(/'/g, '&#039;');
	}

	// Initialize UI
	$(document).ready(function(){
		let templates = (window.ExpliFormsData && ExpliFormsData.templates) || [];
		let savedForms = {}; // will be fetched later (from option via AJAX if desired) — but we store via admin ajax when saved.

		const $templatesPanel = $('#ef-templates-panel');
		const $savedPanel = $('#ef-saved-panel');

		function buildTemplatesGrid(){
			$templatesPanel.empty();
			templates.forEach(function(tpl){
				const $card = $('<div class="ef-template-card"></div>');
				const thumbUrl = tpl.thumbnail || '';
				const $img = thumbUrl ? $('<img class="ef-template-thumb" />').attr('src', thumbUrl) : $('<div class="ef-template-thumb"></div>');
				$card.append($img);
				$card.append('<div class="ef-template-name">'+escapeHtml(tpl.name)+'</div>');
				const $actions = $('<div class="ef-template-actions"></div>');
				const $use = $('<button class="ef-btn ef-use">Use</button>');
				$use.on('click', function(){
					openEditorFromTemplate(tpl);
				});
				$actions.append($use);
				$card.append($actions);
				$templatesPanel.append($card);
			});
		}

		function buildSavedGrid(){
			$savedPanel.empty();
			// load saved from server via REST-like small call (we didn't make an endpoint; fetch via localized ExpliFormsData? For now we read from option via AJAX: not implemented server endpoint — we will read from window.ExpliFormsSaved if present)
			// To keep simple: ask server for saved forms by injecting them into ExpliFormsData savedForms if you want persistence retrievable on page load.
			let saved = window.ExpliFormsData.savedForms || {};
			let keys = Object.keys(saved);
			if(!keys.length){
				$savedPanel.append('<div>No saved forms yet (others who saved on the site will appear here).</div>');
				return;
			}
			keys.forEach(function(k){
				let tpl = saved[k];
				const $card = $('<div class="ef-template-card"></div>');
				$card.append('<div class="ef-template-name">'+escapeHtml(tpl.name)+'</div>');
				const $actions = $('<div class="ef-template-actions"></div>');
				const $edit = $('<button class="ef-btn">Edit</button>');
				$edit.on('click', function(){ openEditorFromTemplate(tpl); });
				$actions.append($edit);
				$savedPanel.append($card.append($actions));
			});
		}

		function openEditorFromTemplate(tpl){
			$('#ef-editor-title').text('Edit — ' + (tpl.name||'Untitled'));
			$('#ef-form-name').val(tpl.name || 'Custom Form');
			// copy fields
			let fields = (tpl.fields || []).map(function(f){
				return Object.assign({}, f, { id: f.id || uid('field') });
			});
			renderFieldsList(fields);
			$('#ef-editor-modal').show();
			refreshPreview(fields);
			// store current editing fields on modal element
			$('#ef-editor-modal').data('editing', { id: tpl.id || uid('form'), fields: fields, name: tpl.name || 'Custom Form' });
		}

		function renderFieldsList(fields){
			const $list = $('#ef-fields-list').empty();
			fields.forEach(function(f, idx){
				const $item = $('<div class="ef-field-item"></div>');
				const $meta = $('<div class="ef-field-meta"></div>');
				const $label = $('<input type="text" class="ef-field-label" value="'+escapeHtml(f.label||'Field')+'" />');
				$label.on('input', function(){
					f.label = $(this).val();
					refreshPreview(fields);
				});
				const $type = $('<select class="ef-field-type"><option value="text">text</option><option value="textarea">textarea</option><option value="email">email</option><option value="number">number</option><option value="select">select</option><option value="checkbox">checkbox</option></select>');
				$type.val(f.type || 'text');
				$type.on('change', function(){
					f.type = $(this).val();
					refreshPreview(fields);
					// if select, show options editor
					renderFieldsList(fields);
				});
				const $req = $('<label style="margin-left:6px"><input type="checkbox" class="ef-field-required" '+(f.required?'checked':'')+'> required</label>');
				$req.on('change', function(){
					f.required = $(this).find('input').is(':checked');
					refreshPreview(fields);
				});
				const $up = $('<button class="ef-btn">↑</button>').on('click', function(){
					if(idx<=0) return;
					fields.splice(idx-1, 0, fields.splice(idx,1)[0]);
					renderFieldsList(fields);
					refreshPreview(fields);
				});
				const $down = $('<button class="ef-btn">↓</button>').on('click', function(){
					if(idx>=fields.length-1) return;
					fields.splice(idx+1, 0, fields.splice(idx,1)[0]);
					renderFieldsList(fields);
					refreshPreview(fields);
				});
				const $remove = $('<button class="ef-btn" style="background:#ffdddd">Remove</button>').on('click', function(){
					fields.splice(idx,1);
					renderFieldsList(fields);
					refreshPreview(fields);
				});

				$meta.append($label).append($type).append($req);
				$item.append($meta);
				$item.append($up).append($down).append($remove);

				// If select field, show options editor
				if(f.type === 'select'){
					let opts = f.options || [];
					let $optList = $('<div style="margin-top:6px"></div>');
					opts.forEach(function(o, oi){
						let $oi = $('<div style="display:flex;gap:6px;margin-bottom:4px"></div>');
						let $inp = $('<input type="text" class="ef-field-option" value="'+escapeHtml(o)+'"/>');
						$inp.on('input', function(){ opts[oi] = $(this).val(); refreshPreview(fields); });
						let $rem = $('<button class="ef-btn" style="background:#ffdddd">x</button>').on('click', function(){ opts.splice(oi,1); f.options = opts; renderFieldsList(fields); refreshPreview(fields); });
						$oi.append($inp).append($rem);
						$optList.append($oi);
					});
					let $addOpt = $('<button class="ef-btn">Add option</button>').on('click', function(){ opts.push('Option '+(opts.length+1)); f.options = opts; renderFieldsList(fields); refreshPreview(fields); });
					$item.append($optList).append($addOpt);
				}

				$list.append($item);
			});
		}

		function refreshPreview(fields){
			const $preview = $('#ef-form-preview').empty();
			let $form = $('<form class="ef-live-form"></form>');
			fields.forEach(function(f){
				$form.append($(renderFieldPreview(f)));
			});
			// submit button
			let $submit = $('<button class="ef-btn ef-btn-primary">Submit (demo)</button>');
			$submit.on('click', function(e){
				e.preventDefault();
				// collect and submit dataset
				let formData = {};
				$form.serializeArray().forEach(function(pair){
					if(formData[pair.name] === undefined) formData[pair.name] = pair.value;
					else if(Array.isArray(formData[pair.name])) formData[pair.name].push(pair.value);
					else formData[pair.name] = [formData[pair.name], pair.value];
				});
				// AJAX submit
				$.post(ExpliFormsData.ajax_url, {
					action: 'expli_submit_form',
					nonce: ExpliFormsData.nonce,
					form_id: $('#ef-editor-modal').data('editing').id,
					data: JSON.stringify(formData)
				}, function(resp){
					if(resp && resp.success){
						alert('Submission saved (demo).');
					} else {
						alert('Submission failed.');
					}
				});
			});
			$preview.append($form).append($submit);
		}

		// Wire editor controls
		$('#ef-add-field').on('click', function(){
			let type = $('#ef-new-type').val();
			let editing = $('#ef-editor-modal').data('editing') || {};
			editing.fields = editing.fields || [];
			let newField = { id: uid('field'), label: (type==='select'?'Choose':'New field'), type: type, required: false, options: type==='select' ? ['Option 1','Option 2'] : [] };
			editing.fields.push(newField);
			$('#ef-editor-modal').data('editing', editing);
			renderFieldsList(editing.fields);
			refreshPreview(editing.fields);
		});

		$('#ef-close-editor').on('click', function(){ $('#ef-editor-modal').hide(); });

		$('#ef-save-custom').on('click', function(){
			let editing = $('#ef-editor-modal').data('editing');
			if(!editing) return alert('Nothing to save.');
			editing.name = $('#ef-form-name').val() || editing.name || 'Custom Form';
			// ensure id exists
			editing.id = editing.id || uid('form');
			// send to server to save in options
			$.post(ExpliFormsData.ajax_url, {
				action: 'expli_save_form',
				nonce: ExpliFormsData.nonce,
				form: JSON.stringify(editing)
			}, function(resp){
				if(resp && resp.success){
					alert('Form saved.');
					// update local saved forms list
					window.ExpliFormsData.savedForms = window.ExpliFormsData.savedForms || {};
					window.ExpliFormsData.savedForms[editing.id] = editing;
					buildSavedGrid();
				} else {
					alert('Save failed.');
				}
			});
		});

		$('#ef-publish-form').on('click', function(){
			let editing = $('#ef-editor-modal').data('editing');
			if(!editing) return;
			editing.name = $('#ef-form-name').val() || editing.name;
			renderPublishedForm(editing);
			$('#ef-editor-modal').hide();
		});

		function renderPublishedForm(form){
			const $area = $('#ef-published-area').empty();
			let $container = $('<div class="ef-published"></div>');
			$container.append('<h3>'+escapeHtml(form.name)+'</h3>');
			let $formEl = $('<form></form>');
			form.fields.forEach(function(f){
				$formEl.append($(renderFieldPreview(f)));
			});
			let $submit = $('<button class="ef-btn ef-btn-primary">Submit</button>');
			$submit.on('click', function(e){
				e.preventDefault();
				let formData = {};
				$formEl.serializeArray().forEach(function(pair){
					if(formData[pair.name] === undefined) formData[pair.name] = pair.value;
					else if(Array.isArray(formData[pair.name])) formData[pair.name].push(pair.value);
					else formData[pair.name] = [formData[pair.name], pair.value];
				});
				$.post(ExpliFormsData.ajax_url, {
					action: 'expli_submit_form',
					nonce: ExpliFormsData.nonce,
					form_id: form.id || uid('form'),
					data: JSON.stringify(formData)
				}, function(resp){
					if(resp && resp.success){
						alert('Submission received. (demo)');
					} else {
						alert('Submission failed.');
					}
				});
			});
			$container.append($formEl).append($submit);
			$area.append($container);
		}

		// toggles
		$('#ef-open-templates').on('click', function(){ $('#ef-templates-panel').show(); $('#ef-saved-panel').hide(); });
		$('#ef-open-saved').on('click', function(){ $('#ef-templates-panel').hide(); $('#ef-saved-panel').show(); buildSavedGrid(); });

		// initial build
		buildTemplatesGrid();
		buildSavedGrid();
	});
})(jQuery);
JS;
	}
}

new Expli_Forms_Plugin();
