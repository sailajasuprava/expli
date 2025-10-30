<?php
/**
 * Plugin Name: My First Plugin
 * Description: Generate a blog post from a prompt using an AI API.
 * Version: 1.0
 * Author: Sailaja Suprava Mohanty
 */

// ======== FRONT-END SHORTCODE ======== //


// function ai_blog_generator_shortcode() {
//     if (isset($_POST['ai_prompt'])) {
//         $prompt = sanitize_text_field($_POST['ai_prompt']);
//         $api_key = defined('GEMINI_API_KEY') ? GEMINI_API_KEY : '';

//     $response = wp_remote_post(
//     'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=' . $api_key,
//     [
//         'headers' => [
//             'Content-Type' => 'application/json',
//         ],
//         'body' => json_encode([
//             'contents' => [[
//                 'parts' => [['text' => "Write a detailed blog about: $prompt"]]
//             ]]
//         ]),
//         'timeout' => 20, // Increase timeout to 20 seconds
//     ]
// );


//         // ✅ Debugging part
//         if (is_wp_error($response)) {
//             error_log('Gemini API Request Error: ' . $response->get_error_message());
//             return '<p>Error: ' . esc_html($response->get_error_message()) . '</p>';
//         }

//         // Get the raw response body
//         $body = wp_remote_retrieve_body($response);
//         error_log('Gemini API Response: ' . $body); // <-- log full API reply

//         $data = json_decode($body, true);

//         // Check if data structure exists
//         if (isset($data['candidates'][0]['content']['parts'][0]['text'])) {
//             $text = $data['candidates'][0]['content']['parts'][0]['text'];
//         } else {
//             $text = '<p><strong>Unexpected API response format.</strong></p>';
//         }

//         return '<div><h3>Generated Blog:</h3><p>' . esc_html($text) . '</p></div>';
//     }

//     // HTML form
//     return '
//         <form method="post">
//             <input type="text" name="ai_prompt" placeholder="Enter your blog topic..." required />
//             <button type="submit">Create</button>
//         </form>
//     ';
// }
// add_shortcode('ai_blog', 'ai_blog_generator_shortcode');

function ai_blog_generator_shortcode() {
    $output = '';

    // When the form is submitted
    if (isset($_POST['ai_prompt'])) {
        $prompt = sanitize_text_field($_POST['ai_prompt']);
        $api_key = defined('GEMINI_API_KEY') ? GEMINI_API_KEY : '';

        // Call Gemini API
        $response = wp_remote_post(
            'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=' . $api_key,
            [
                'headers' => [
                    'Content-Type' => 'application/json',
                ],
                'body' => json_encode([
                    'contents' => [[
                        'parts' => [['text' => "Write a detailed blog post about: $prompt. Include headings, intro, and conclusion."]]
                    ]]
                ]),
                'timeout' => 30,
            ]
        );

        // Handle request errors
        if (is_wp_error($response)) {
            $output .= '<p style="color:red;">Error: ' . esc_html($response->get_error_message()) . '</p>';
        } else {
            $body = wp_remote_retrieve_body($response);
            $data = json_decode($body, true);

            // Extract generated text from Gemini response
            $text = $data['candidates'][0]['content']['parts'][0]['text'] ?? 'No response received.';

            // Display the generated blog
            $output .= '<div style="margin-top:20px;">';
            $output .= '<h3>📝 Generated Blog:</h3>';
           // Format Gemini markdown-style text into readable HTML
$formatted = nl2br($text); // Convert \n to <br>
$formatted = preg_replace('/\*\*(.*?)\*\*/', '<strong>$1</strong>', $formatted); // bold
$formatted = preg_replace('/## (.*?)<br>/', '<h2>$1</h2>', $formatted); // headings
$formatted = preg_replace('/# (.*?)<br>/', '<h1>$1</h1>', $formatted); // big headings

$output .= '<div style="background:#f9f9f9; padding:15px; border-radius:8px; line-height:1.6;">' . $formatted . '</div>';

            $output .= '</div>';
        }
    }

    // Input form (always visible)
    $output .= '
        <form method="post" style="margin-top:20px;">
            <input type="text" name="ai_prompt" placeholder="Enter your blog topic..." required
                style="padding:10px; width:70%; border:1px solid #ccc; border-radius:5px;" />
            <button type="submit" style="padding:10px 20px; background:#4CAF50; color:white; border:none; border-radius:5px; cursor:pointer;">
                Create
            </button>
        </form>
    ';

    return $output;
}
add_shortcode('ai_blog', 'ai_blog_generator_shortcode');


// ======== LOAD JS ======== //
function sailaja_enqueue_scripts() {
    wp_enqueue_script(
        'sailaja-gemini-js',
        plugin_dir_url(__FILE__) . 'js/gemini.js',
        array('jquery'),
        null,
        true
    );

    // Pass AJAX URL and nonce to JS
    wp_localize_script('sailaja-gemini-js', 'sailajaData', array(
        'ajaxUrl' => admin_url('admin-ajax.php'),
        'nonce'   => wp_create_nonce('sailaja_ai_nonce')
    ));
}
add_action('wp_enqueue_scripts', 'sailaja_enqueue_scripts');


// ======== AJAX HANDLER ======== //
function sailaja_generate_blog() {
    check_ajax_referer('sailaja_ai_nonce', 'nonce');

    $prompt = sanitize_text_field($_POST['prompt']);

    // --------------- CONNECT TO GEMINI HERE ------------------
    // This part should use your own Gemini API key and endpoint.
    // For safety, store your key in wp-config.php or as an environment variable.

    $api_key = 'GEMINI_API_KEY'; 
    $endpoint = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=' . $api_key;

    $body = array(
        'contents' => array(
            array('parts' => array(array('text' => "Write a detailed blog post about: $prompt")))
        )
    );

    $response = wp_remote_post($endpoint, array(
        'headers' => array('Content-Type' => 'application/json'),
        'body'    => wp_json_encode($body),
    ));

    if (is_wp_error($response)) {
        wp_send_json_error('Request failed.');
    }

    $data = json_decode(wp_remote_retrieve_body($response), true);
    $text = $data['candidates'][0]['content']['parts'][0]['text'] ?? 'No response.';

    wp_send_json_success($text);
}
add_action('wp_ajax_sailaja_generate_blog', 'sailaja_generate_blog');
add_action('wp_ajax_nopriv_sailaja_generate_blog', 'sailaja_generate_blog');
