=== FormCrafted ===
Contributors: yourname
Tags: forms, contact, frontend, templates, shortcode
Requires at least: 5.0
Tested up to: 6.8
Stable tag: 1.0
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

A simple frontend form template picker and visual form editor with shortcode support.

== Description ==

FormCrafted is a simple plugin that provides:
* A frontend UI to pick from templates or create/save custom forms.
* A visual modal editor for assembling fields.
* Shortcode support: [formcrafted] for the editor page and [formcrafted_form id="FORMID"] to embed forms.
* Stores saved forms and submissions in options (suitable for low-volume usage).

== Installation ==

1. Upload the `formcrafted` folder to the `/wp-content/plugins/` directory.
2. Activate the plugin through the 'Plugins' screen in WordPress.
3. Create a page and place the shortcode: `[formcrafted]`.
4. Visit the page, open the editor, pick a template or build a form, and Save. Use the shortcode `[formcrafted_form id="YOUR_FORM_ID"]` to embed saved forms.

== Changelog ==

= 1.0 =
* Initial release.

== Frequently Asked Questions ==

= Where are forms stored? =
Forms and submissions are stored in options (wp_options) under `formcrafted_saved_forms` and `formcrafted_submissions`. For production or high-volume usage, consider integrating with a custom table or external storage.

== Screenshots ==
1. Admin overview with saved forms.
2. Frontend template picker.
3. Editor modal preview.

== Upgrade Notice ==

= 1.0 =
Initial release.

== License ==
This plugin is released under the GPLv2 or later. See the license URI above.
