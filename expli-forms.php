<?php
/*
Plugin Name: expli-forms
Description: Frontend form templates and lightweight visual editor for all users. Add [expli_forms] anywhere.
Version: 1.2
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
        
        // Register handles
        wp_register_script( $handle, plugins_url( '/assets/expli-forms.js', __FILE__ ), [ 'jquery' ], '1.2', true );
        wp_register_style( 'expli-forms-style', plugins_url( '/assets/expli-forms.css', __FILE__ ), [], '1.2' );

        wp_enqueue_script( $handle );
        wp_enqueue_style( 'expli-forms-style' );

        // Pass data and nonces to JS
        $data = [
            'ajax_url'  => admin_url( 'admin-ajax.php' ),
            'nonce'     => wp_create_nonce( 'expli_forms_nonce' ),
            'templates' => $this->get_default_templates(),
            'savedForms' => get_option( $this->option_forms_key, [] )
        ];
        wp_localize_script( $handle, 'ExpliFormsData', $data );

        // Inline styles (Fallback)
        $css = $this->inline_css();
        wp_add_inline_style( 'expli-forms-style', $css );

        // Inline JS (Fallback)
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
            <div class="expli-forms-header" style="display:flex; justify-content:space-between; margin-bottom:15px; align-items:center;">
                <h2 style="margin:0;">Expli-Forms</h2>
                <div class="expli-forms-actions">
                    <button class="ef-btn ef-btn-primary" id="ef-open-saved">My Saved Forms</button>
                    <button class="ef-btn" id="ef-open-templates">Templates</button>
                </div>
            </div>

            <div id="ef-templates-panel" class="ef-panel"></div>
            <div id="ef-saved-panel" class="ef-panel" style="display:none;"></div>

            <div id="ef-editor-modal" class="ef-modal" style="display:none;">
                <div class="ef-modal-inner">
                    <div class="ef-editor-header" style="display:flex; justify-content:space-between; border-bottom:1px solid #eee; padding-bottom:10px; margin-bottom:10px;">
                        <h3 style="margin:0;">Edit Form</h3>
                        <button class="ef-close" id="ef-close-editor" style="border:none; background:none; font-size:24px; cursor:pointer;">&times;</button>
                    </div>
                    
                    <div class="ef-editor-body" style="display:flex; gap:20px;">
                        <div class="ef-left" style="width:40%;">
                            <label style="display:block; margin-bottom:5px; font-weight:bold;">Form Name:</label>
                            <input type="text" id="ef-form-name" class="ef-input" style="width:100%; margin-bottom:15px;" />
                            
                            <h4 style="margin: 0 0 10px 0;">Form Fields</h4>
                            <div id="ef-fields-list" class="ef-fields-list" style="max-height:400px; overflow-y:auto; padding-right:5px;"></div>

                            <div class="ef-field-controls" style="margin-top:15px; border-top:1px solid #eee; padding-top:10px;">
                                <select id="ef-new-type" style="padding:6px;">
                                    <option value="text">Single line (text)</option>
                                    <option value="textarea">Paragraph</option>
                                    <option value="email">Email</option>
                                    <option value="number">Number</option>
                                    <option value="select">Dropdown</option>
                                    <option value="checkbox">Checkbox</option>
                                </select>
                                <button class="ef-btn" id="ef-add-field">Add Field</button>
                            </div>
                        </div>

                        <div class="ef-right" style="width:60%;">
                            <h4 style="margin: 0 0 10px 0;">Live Preview</h4>
                            <div id="ef-form-preview" class="ef-form-preview"></div>

                            <div class="ef-editor-actions" style="margin-top:20px; text-align:right;">
                                <button class="ef-btn ef-btn-primary" id="ef-save-custom">Save Form</button>
                                <button class="ef-btn" id="ef-publish-form">Insert & Publish</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div id="ef-published-area"></div>
        </div>
        <?php
        return ob_get_clean();
    }

    // Default templates
    private function get_default_templates() {
        $thumb_path = 'https://via.placeholder.com/300x150?text=Form+Template'; 

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
                'id' => 'tpl_college',
                'name' => 'College Application Form',
                'thumbnail' => $thumb_path,
                'fields' => [
                    ['id'=>'c1', 'label'=>'Email', 'type'=>'email', 'required'=>true],
                    ['id'=>'c2', 'label'=>'Address Line 1', 'type'=>'text', 'required'=>false],
                    ['id'=>'c3', 'label'=>'Address Line 2', 'type'=>'text', 'required'=>false],
                    ['id'=>'c4', 'label'=>'City', 'type'=>'text', 'required'=>false],
                    ['id'=>'c5', 'label'=>'State', 'type'=>'select', 'options'=>['--- Select State ---', 'California', 'New York', 'Texas', 'Florida', 'Washington', 'Other']],
                    ['id'=>'c6', 'label'=>'Zip Code', 'type'=>'number', 'required'=>false],
                ],
            ],
            [
                'id' => 'tpl_enrollment',
                'name' => 'Enrollment Form',
                'thumbnail' => $thumb_path,
                'fields' => [
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
        ];

        return $templates;
    }

    public function ajax_save_form() {
        check_ajax_referer( 'expli_forms_nonce', 'nonce' );
        $payload = isset( $_POST['form'] ) ? wp_unslash( $_POST['form'] ) : '';
        $form = json_decode( $payload, true );

        if ( empty( $form ) || empty( $form['id'] ) ) {
            wp_send_json_error( [ 'message' => 'Invalid form payload' ] );
        }

        $saved = get_option( $this->option_forms_key, [] );
        $saved[ $form['id'] ] = $form;
        update_option( $this->option_forms_key, $saved );

        wp_send_json_success( [ 'message' => 'Form saved', 'form' => $form ] );
    }

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

        wp_send_json_success( [ 'message' => 'Form submitted', 'entry' => $entry ] );
    }

    // Inline CSS: Fixed width for labels to prevent collapsing
    private function inline_css() {
        return <<<CSS
.expli-forms-root { background: #f8f8f8; padding: 20px; border-radius: 8px; font-family: sans-serif; }
.ef-btn { background: #eee; padding: 7px 12px; border-radius: 5px; cursor: pointer; border: 1px solid #ccc; margin-right: 5px; }
.ef-btn-primary { background: #0acd63; color: #fff; border-color: #08a34d; }
.ef-template-card { width: 220px; padding: 10px; border-radius: 8px; background: white; box-shadow: 0 0 5px rgba(0, 0, 0, 0.1); display: inline-block; margin: 10px; vertical-align: top; text-align: center; }
.ef-template-thumb { width: 100%; height: 120px; object-fit: cover; border-radius: 6px; background: #ddd; margin-bottom: 8px; }
.ef-template-name { font-weight: bold; margin-bottom: 8px; }
.ef-modal { position: fixed; inset: 0; background: rgba(0, 0, 0, 0.5); display: flex; justify-content: center; align-items: center; z-index: 99999; }
.ef-modal-inner { background: white; width: 90%; max-width: 1000px; padding: 20px; border-radius: 10px; max-height: 90vh; overflow-y: auto; box-sizing: border-box; }

/* Editor List Items */
.ef-field-item { background: #fff; padding: 8px; border: 1px solid #ddd; margin-bottom: 8px; border-radius: 5px; display: flex; align-items: center; gap: 8px; }
/* This ensures the label input is wide enough */
.ef-field-label-input { flex: 1; min-width: 100px; padding: 8px; border: 1px solid #ccc; border-radius: 4px; }
.ef-field-type-select { padding: 8px; border: 1px solid #ccc; border-radius: 4px; }

.ef-input { width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px; margin-top: 4px; margin-bottom: 10px; box-sizing: border-box; }
.ef-form-preview { background: #fff; padding: 20px; border: 1px dashed #ccc; border-radius: 5px; min-height: 200px; }
CSS;
    }

    // Inline JS: Fixed renderFields logic
    private function inline_js() {
        return <<<JS
(function ($) {
  "use strict";

  function uid(prefix) {
    return prefix + "_" + Math.random().toString(36).substr(2, 9);
  }

  function escapeHtml(unsafe) {
    if (!unsafe) return "";
    return String(unsafe)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  // --- RENDERING ---

  function buildTemplatesGrid() {
    const panel = $("#ef-templates-panel").empty();
    const templates = ExpliFormsData.templates || [];

    templates.forEach((tpl) => {
      const card = $('<div class="ef-template-card"></div>');
      card.append('<img class="ef-template-thumb" src="'+tpl.thumbnail+'">');
      card.append('<div class="ef-template-name">'+escapeHtml(tpl.name)+'</div>');
      
      const btn = $('<button class="ef-btn ef-use">Use</button>');
      btn.on("click", () => openEditor(tpl));
      card.append(btn);

      panel.append(card);
    });
  }

  function buildSavedGrid() {
    const panel = $("#ef-saved-panel").empty();
    const saved = ExpliFormsData.savedForms || {};
    const keys = Object.keys(saved);

    if (keys.length === 0) {
        panel.html('<p style="padding:10px; color:#666;">No saved forms found.</p>');
        return;
    }

    keys.forEach((key) => {
      const tpl = saved[key];
      const card = $('<div class="ef-template-card"></div>');
      const thumb = tpl.thumbnail || 'https://via.placeholder.com/300x150?text=Saved+Form';
      card.append('<img class="ef-template-thumb" src="'+thumb+'">');
      card.append('<div class="ef-template-name">'+escapeHtml(tpl.name)+'</div>');
      
      const btn = $('<button class="ef-btn">Edit</button>');
      btn.on("click", () => openEditor(tpl));
      card.append(btn);

      panel.append(card);
    });
  }

  // --- EDITOR ---

  function openEditor(tpl) {
    const modal = $("#ef-editor-modal");
    modal.show();

    // Deep copy
    const formData = JSON.parse(JSON.stringify(tpl));
    if(!formData.id) formData.id = uid('form');

    $("#ef-form-name").val(formData.name || 'Untitled Form');
    $("#ef-editor-modal").data("editing", formData);

    renderFields();
    renderPreview();
  }

  function renderFields() {
    const form = $("#ef-editor-modal").data("editing");
    const list = $("#ef-fields-list").empty();

    if(!form.fields) form.fields = [];

    form.fields.forEach((f, index) => {
      const item = $('<div class="ef-field-item"></div>');
      
      // FIX: Explicitly creating the input and setting value to ensure it appears
      const lblInput = $('<input type="text" class="ef-field-label-input" placeholder="Field Label">');
      lblInput.val(f.label); 
      lblInput.on("input", function() { f.label = $(this).val(); renderPreview(); });
      
      const typeSel = $('<select class="ef-field-type-select"><option value="text">text</option><option value="textarea">textarea</option><option value="email">email</option><option value="number">number</option><option value="select">select</option><option value="checkbox">checkbox</option></select>');
      typeSel.val(f.type);
      typeSel.on("change", function() { f.type = $(this).val(); renderPreview(); });

      const reqLabel = $('<label style="white-space:nowrap; font-size:0.9em;"><input type="checkbox" '+(f.required?'checked':'')+'> Req</label>');
      reqLabel.find('input').on('change', function() { f.required = $(this).is(':checked'); renderPreview(); });

      const removeBtn = $('<button class="ef-btn" style="background:#ffdddd; border-color:#eab8b8; padding:5px 10px;">&times;</button>');
      removeBtn.on("click", function() { 
        form.fields.splice(index, 1); 
        renderFields(); 
        renderPreview(); 
      });

      item.append(lblInput).append(typeSel).append(reqLabel).append(removeBtn);
      list.append(item);
    });
  }

  function renderPreview() {
    const form = $("#ef-editor-modal").data("editing");
    const preview = $("#ef-form-preview").empty();
    
    if(!form.fields || form.fields.length === 0) {
        preview.html('<p style="color:#999; text-align:center; padding-top:20px;">No fields added yet.</p>');
        return;
    }

    form.fields.forEach((f) => {
      let html = '';
      const reqStar = f.required ? ' <span style="color:red">*</span>' : '';
      const lbl = '<label style="font-weight:600; font-size:14px; display:block;">' + escapeHtml(f.label) + reqStar + '</label>';
      
      if (f.type === "textarea") {
        html = lbl + '<textarea class="ef-input" rows="3"></textarea>';
      } else if (f.type === "select") {
        let opts = '';
        if(f.options && Array.isArray(f.options)) {
            f.options.forEach(o => opts += '<option>'+escapeHtml(o)+'</option>');
        } else {
            opts = '<option>Option 1</option><option>Option 2</option>';
        }
        html = lbl + '<select class="ef-input">' + opts + '</select>';
      } else if (f.type === "checkbox") {
        html = '<div style="margin:10px 0;"><label><input type="checkbox"> ' + escapeHtml(f.label) + reqStar + '</label></div>';
      } else {
        html = lbl + '<input class="ef-input" type="'+f.type+'">';
      }
      preview.append('<div style="margin-bottom:12px;">' + html + '</div>');
    });
  }

  // --- ACTIONS ---

  $("#ef-add-field").on("click", function() {
    const type = $("#ef-new-type").val();
    const form = $("#ef-editor-modal").data("editing");
    const opts = (type === 'select') ? ['Option 1', 'Option 2'] : [];
    form.fields.push({ id: uid('f'), label: 'New ' + type, type: type, required: false, options: opts });
    renderFields();
    renderPreview();
  });

  $("#ef-save-custom").on("click", function() {
    const form = $("#ef-editor-modal").data("editing");
    form.name = $("#ef-form-name").val();
    
    $.post(ExpliFormsData.ajax_url, {
        action: 'expli_save_form',
        nonce: ExpliFormsData.nonce,
        form: JSON.stringify(form)
    }, function(res) {
        if(res.success) {
            alert('Form saved successfully!');
            ExpliFormsData.savedForms = ExpliFormsData.savedForms || {};
            ExpliFormsData.savedForms[form.id] = form;
            buildSavedGrid();
        } else {
            alert('Error saving form.');
        }
    });
  });

  $("#ef-publish-form").on("click", function() {
    const form = $("#ef-editor-modal").data("editing");
    form.name = $("#ef-form-name").val();
    $("#ef-editor-modal").hide();
    
    const area = $("#ef-published-area").empty();
    area.append('<h3 style="margin-top:20px; border-bottom:2px solid #ddd; padding-bottom:10px;">' + escapeHtml(form.name) + '</h3>');
    
    const formEl = $('<form class="ef-live-form"></form>');
    form.fields.forEach(f => {
        let fieldHtml = '';
        const reqStr = f.required ? 'required' : '';
        const lbl = '<label style="font-weight:bold; display:block;">'+escapeHtml(f.label) + (f.required?' *':'')+'</label>';
        
        if(f.type === 'textarea') {
            fieldHtml = lbl + '<textarea name="'+f.id+'" class="ef-input" '+reqStr+'></textarea>';
        } else if(f.type === 'select') {
            let opts = '';
            (f.options||['Option 1']).forEach(o => opts += '<option>'+escapeHtml(o)+'</option>');
            fieldHtml = lbl + '<select name="'+f.id+'" class="ef-input">'+opts+'</select>';
        } else if(f.type === 'checkbox') {
             fieldHtml = '<label style="display:block; margin:10px 0;"><input type="checkbox" name="'+f.id+'"> '+escapeHtml(f.label)+'</label>';
        } else {
            fieldHtml = lbl + '<input type="'+f.type+'" name="'+f.id+'" class="ef-input" '+reqStr+'>';
        }
        formEl.append(fieldHtml);
    });

    const submitBtn = $('<button type="submit" class="ef-btn ef-btn-primary" style="margin-top:10px;">Submit Form</button>');
    formEl.on('submit', function(e) {
        e.preventDefault();
        const rawData = $(this).serializeArray();
        let jsonData = {};
        rawData.forEach(item => jsonData[item.name] = item.value);

        $.post(ExpliFormsData.ajax_url, {
            action: 'expli_submit_form',
            nonce: ExpliFormsData.nonce,
            form_id: form.id,
            data: JSON.stringify(jsonData)
        }, function(res) {
            if(res.success) { alert('Form submitted!'); formEl[0].reset(); }
        });
    });

    formEl.append(submitBtn);
    area.append(formEl);
  });

  $("#ef-open-templates").on("click", function () { $("#ef-templates-panel").show(); $("#ef-saved-panel").hide(); });
  $("#ef-open-saved").on("click", function () { $("#ef-templates-panel").hide(); $("#ef-saved-panel").show(); buildSavedGrid(); });
  $("#ef-close-editor").on("click", function () { $("#ef-editor-modal").hide(); });

  $(document).ready(function () {
    buildTemplatesGrid();
  });
})(jQuery);
JS;
    }
}

new Expli_Forms_Plugin();