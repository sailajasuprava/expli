<?php
/**
 * Plugin Name: AutoBlogGen
 * Description: Generate AI-powered blog posts automatically using the Gemini API after verifying your API key.
 * Version: 1.1
 * Author: Sailaja Suprava Mohanty
 * License: GPLv2 or later
 */

if (session_status() === PHP_SESSION_NONE) {
    session_start(); // To temporarily store user's API key
}

// ======== SHORTCODE ======== //
function ai_blog_generator_shortcode() {
    // STEP 1: Ask for API Key
    if (empty($_SESSION['gemini_api_key'])) {
        // Verify API Key form submitted + nonce verification
        if ( isset($_POST['verify_api_key']) && isset($_POST['_wpnonce']) && wp_verify_nonce( sanitize_text_field( wp_unslash( $_POST['_wpnonce'] ) ), 'verify_api_key_nonce' ) ) {

            $key = '';
            if ( isset( $_POST['gemini_key'] ) ) {
                // unslash then sanitize
                $key = sanitize_text_field( wp_unslash( $_POST['gemini_key'] ) );
            }

            if ( ! empty( $key ) ) {
                // Quick test call to validate key
                $test_response = wp_remote_post(
                    'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=' . rawurlencode( $key ),
                    [
                        'headers' => [ 'Content-Type' => 'application/json' ],
                        'body'    => wp_json_encode( [ 'contents' => [ [ 'parts' => [ [ 'text' => 'test' ] ] ] ] ] ),
                        'timeout' => 10,
                    ]
                );

                if ( ! is_wp_error( $test_response ) && wp_remote_retrieve_response_code( $test_response ) === 200 ) {
                    $_SESSION['gemini_api_key'] = $key;
                    // refresh to show next step
                    echo "<meta http-equiv='refresh' content='0'>";
                    return;
                } else {
                    // show api form with error message
                    return '<p style="color:red;">Invalid API key. Please try again.</p>' . ai_api_key_form();
                }
            } else {
                return '<p style="color:red;">Please enter an API key.</p>' . ai_api_key_form();
            }
        }

        // Show API Key Form
        return ai_api_key_form();
    }

    // STEP 2: Blog Generator Form
    return ai_blog_form();
}
add_shortcode('ai_blog', 'ai_blog_generator_shortcode');


// ======== API KEY INPUT FORM ======== //
function ai_api_key_form() {
    // Keep UI exactly as original; add nonce field for verification
    return '
    <style>
        @import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap");
        
        .ai-key-container {
            max-width: 520px;
            margin: 60px auto;
            background: linear-gradient(135deg, #2abfff 0%, #0071ff 100%);
            border-radius: 20px;
            padding: 2px;
            box-shadow: 0 20px 60px rgba(0, 113, 255, 0.4);
            animation: fadeIn 0.6s ease-out;
        }
        
        .ai-key-inner {
            background: #ffffff;
            border-radius: 18px;
            padding: 50px 40px;
            text-align: center;
        }
        
        .ai-key-icon {
            font-size: 48px;
            margin-bottom: 20px;
            animation: bounce 2s infinite;
        }
        
        .ai-key-title {
            font-family: "Inter", sans-serif;
            font-size: 28px;
            font-weight: 700;
            color: #1a202c;
            margin-bottom: 12px;
        }
        
        .ai-key-subtitle {
            font-family: "Inter", sans-serif;
            color: #718096;
            font-size: 15px;
            line-height: 1.6;
            margin-bottom: 35px;
        }
        
        .ai-key-input {
            padding: 16px 20px;
            width: 100%;
            box-sizing: border-box;
            border: 2px solid #e2e8f0;
            border-radius: 12px;
            font-size: 15px;
            font-family: "Inter", sans-serif;
            outline: none;
            transition: all 0.3s ease;
            background: #f7fafc;
            margin-bottom: 25px;
        }
        
        .ai-key-input:focus {
            border-color: #0071ff;
            background: #ffffff;
            box-shadow: 0 0 0 3px rgba(0, 113, 255, 0.1);
        }
        
        .ai-key-button {
            padding: 16px 40px;
            background: linear-gradient(135deg, #2abfff 0%, #0071ff 100%);
            color: white;
            border: none;
            border-radius: 12px;
            font-size: 16px;
            font-weight: 600;
            font-family: "Inter", sans-serif;
            cursor: pointer;
            transition: all 0.3s ease;
            box-shadow: 0 4px 15px rgba(0, 113, 255, 0.4);
        }
        
        .ai-key-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 25px rgba(0, 113, 255, 0.5);
        }
        
        .ai-key-button:active {
            transform: translateY(0);
        }
        
        @keyframes fadeIn {
            from {
                opacity: 0;
                transform: translateY(20px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        
        @keyframes bounce {
            0%, 100% {
                transform: translateY(0);
            }
            50% {
                transform: translateY(-10px);
            }
        }
    </style>
    
    <div class="ai-key-container">
        <div class="ai-key-inner">
            <h2 class="ai-key-title">Enter Your Gemini API Key</h2>
            <p class="ai-key-subtitle">Securely connect your Gemini API to unlock AI-powered blog generation</p>
            <form method="post">
                <input type="password" name="gemini_key" class="ai-key-input" placeholder="Paste your API key here..." required />
                ' . wp_nonce_field( 'verify_api_key_nonce', '_wpnonce', true, false ) . '
                <button type="submit" name="verify_api_key" class="ai-key-button">
                    Verify & Continue →
                </button>
            </form>
        </div>
    </div>';
}


// ======== BLOG PROMPT FORM ======== //
function ai_blog_form() { 
    $output = '
    <style>
        @import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap");
        @import url("https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&display=swap");

        .ai-blog-container {
            max-width: 850px;
            margin: 60px auto;
            font-family: "Inter", sans-serif;
            animation: fadeIn 0.6s ease-out;
        }

        .ai-blog-header {
            text-align: center;
            margin-bottom: 40px;
        }

        .ai-blog-title {
            font-size: 38px;
            font-weight: 700;
            font-family: "Playfair Display", serif;
            background: linear-gradient(135deg, #0071ff, #00b4ff);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            margin-bottom: 12px;
        }

        .ai-blog-subtitle {
            color: #5a6f82;
            font-size: 16px;
            line-height: 1.6;
        }

        .ai-blog-card {
            background: #ffffff;
            border-radius: 20px;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.08);
            padding: 45px;
            margin-bottom: 25px;
        }

    /* Enhanced inline form */
        .ai-blog-form-wrapper {
            display: flex;
            gap: 12px;
            align-items: stretch;
            background: linear-gradient(135deg, #f0f8ff 0%, #e6f2ff 100%);
            padding: 10px;
            border-radius: 18px;
            box-shadow: 0 4px 20px rgba(0, 113, 255, 0.15);
            transition: all 0.3s ease;
        }

        .ai-blog-form-wrapper:focus-within {
            box-shadow: 0 6px 30px rgba(0, 113, 255, 0.25);
            background: linear-gradient(135deg, #e8f4ff 0%, #d9edff 100%);
        }

        .ai-blog-input {
            flex: 1;
            padding: 18px 24px;
            border: 2px solid transparent;
            border-radius: 12px;
            font-size: 16px;
            outline: none;
            transition: all 0.3s ease;
            background: #ffffff;
            font-family: "Inter", sans-serif;
            color: #1e3a5f;
        }

        .ai-blog-input:focus {
            border-color: #0071ff;
            box-shadow: 0 0 0 3px rgba(42, 191, 255, 0.15);
        }

        .ai-blog-input::placeholder {
            color: #94a3b8;
        }

        .ai-blog-button {
            padding: 18px 40px;
            background: linear-gradient(135deg, #2abfff 0%, #0071ff 100%);
            color: white;
            border: none;
            border-radius: 12px;
            font-size: 17px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            box-shadow: 0 4px 15px rgba(0, 113, 255, 0.4);
            white-space: nowrap;
            font-family: "Inter", sans-serif;
        }

        .ai-blog-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 25px rgba(0, 113, 255, 0.6);
            background: linear-gradient(135deg, #1aafef 0%, #0061ef 100%);
        }

        .ai-blog-button:active {
            transform: translateY(0);
        }

        .ai-blog-logout {
            padding: 12px 30px;
            background: linear-gradient(135deg, #ff5f5f 0%, #e60000 100%);
            color: white;
            border: none;
            border-radius: 12px;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.3s ease;
            margin-top: 15px;
            font-family: "Inter", sans-serif;
        }

        .ai-blog-logout:hover {
            transform: translateY(-1px);
            box-shadow: 0 4px 15px rgba(255, 95, 95, 0.4);
        }

        .ai-blog-result {
            margin-top: 40px;
        }

        .ai-blog-result-header {
            font-size: 22px;
            font-weight: 600;
            color: #1e3a5f;
            margin-bottom: 20px;
            display: flex;
            align-items: center;
            gap: 10px;
        }

        /* Blog content formatting */
        .ai-blog-result-content {
            background: linear-gradient(135deg, #f9fbff 0%, #edf6ff 100%);
            border: 1.8px solid #cfe4ff;
            border-radius: 18px;
            padding: 40px 45px;
            line-height: 1.9;
            color: #1e3a5f;
            font-size: 17px;
            box-shadow: inset 0 1px 4px rgba(0, 0, 0, 0.05);
        }

        .ai-blog-result-content h1,
        .ai-blog-result-content h2,
        .ai-blog-result-content h3 {
            font-family: "Playfair Display", serif;
            color: #003c99;
            margin: 30px 0 15px 0;
        }

        .ai-blog-result-content h1 {
            font-size: 30px;
            border-bottom: 2px solid #0071ff;
            padding-bottom: 6px;
        }

        .ai-blog-result-content h2 {
            font-size: 24px;
            font-weight: bold;
            color: #0052cc;
            border-left: 4px solid #0071ff;
            padding-left: 10px;
            margin-top: 28px;
        }

        .ai-blog-result-content h3 {
            font-size: 20px;
            color: #004099;
            margin-top: 20px;
        }

        .ai-blog-result-content p {
            margin-bottom: 16px;
            text-align: justify;
        }

        .ai-blog-result-content strong {
            color: #002966;
            font-weight: 600;
        }

        .ai-blog-result-content ul {
            margin: 15px 0 20px 25px;
            list-style: disc;
        }

        .ai-blog-result-content li {
            margin-bottom: 8px;
        }

        .ai-blog-result-content blockquote {
            border-left: 4px solid #0071ff;
            padding-left: 15px;
            font-style: italic;
            color: #375a8c;
            background: #f4faff;
            margin: 20px 0;
            border-radius: 6px;
        }

        @keyframes fadeIn {
            from {
                opacity: 0;
                transform: translateY(20px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
    </style>

    
    <div class="ai-blog-container">
        <div class="ai-blog-header">
            <h2 class="ai-blog-title">AI Blog Generator</h2>
            <p class="ai-blog-subtitle">Transform your ideas into compelling, SEO-optimized blog posts powered by Gemini AI</p>
        </div>
        
        <div class="ai-blog-card">';

    // Process blog generation only when form submitted and nonce valid
    if ( isset( $_POST['ai_prompt'] ) && isset( $_POST['_wpnonce'] ) && wp_verify_nonce( sanitize_text_field( wp_unslash( $_POST['_wpnonce'] ) ), 'generate_blog_nonce' ) ) {

        $prompt = sanitize_text_field( wp_unslash( $_POST['ai_prompt'] ) );
        $api_key = isset( $_SESSION['gemini_api_key'] ) ? sanitize_text_field( $_SESSION['gemini_api_key'] ) : '';

        if ( ! empty( $api_key ) && ! empty( $prompt ) ) {

            $response = wp_remote_post(
                'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=' . rawurlencode( $api_key ),
                [
                    'headers' => [ 'Content-Type' => 'application/json' ],
                    'body'    => wp_json_encode( [
                        'contents' => [[
                            'parts' => [[ 'text' => "Write a detailed blog post about: $prompt. Include headings, intro, and conclusion. Use Markdown syntax for formatting." ]]
                        ]],
                    ] ),
                    'timeout' => 25,
                ]
            );

            if ( is_wp_error( $response ) ) {
                $output .= "<p style='color:#e60000; font-weight:500;'>⚠️ Error: " . esc_html( $response->get_error_message() ) . "</p>";
            } else {
                $body = wp_remote_retrieve_body( $response );
                $data = json_decode( $body, true );

                // Safely get the generated text, avoid undefined index warnings
                $text = '';
                if ( isset( $data['candidates'][0]['content']['parts'][0]['text'] ) ) {
                    $text = $data['candidates'][0]['content']['parts'][0]['text'];
                } elseif ( isset( $data['output'][0]['content'][0]['text'] ) ) {
                    // fallback if response shape differs
                    $text = $data['output'][0]['content'][0]['text'];
                } else {
                    $text = '';
                }

                if ( empty( $text ) ) {
                    $text = 'No response received.';
                }

                // --- Convert Markdown-like text into safe HTML ---
                // Work on the raw $text (from API) and then allow only safe tags in final output
                $formatted = $text;

                // Headings
                $formatted = preg_replace('/^###\s+(.*?)$/m', '<h3>$1</h3>', $formatted);
                $formatted = preg_replace('/^##\s+(.*?)$/m', '<h2>$1</h2>', $formatted);
                $formatted = preg_replace('/^#\s+(.*?)$/m', '<h1>$1</h1>', $formatted);

                // Bold and Italic (do bold before italic)
                $formatted = preg_replace('/\*\*(.*?)\*\*/s', '<strong>$1</strong>', $formatted);
                $formatted = preg_replace('/\*(.*?)\*/s', '<em>$1</em>', $formatted);

                // Lists: convert lines starting with "* " into <li>
                $formatted = preg_replace('/(?:\r\n|\r|\n)\* (.*?)(?=(?:\r\n|\r|\n)|$)/', "\n<li>$1</li>\n", $formatted);
                // Wrap contiguous <li> groups into <ul>
                $formatted = preg_replace_callback('/(?:\n<li>.*?<\/li>\n)+/s', function($m){
                    $inner = trim($m[0]);
                    return '<ul>' . $inner . '</ul>';
                }, $formatted);

                // Paragraphs: Turn double line breaks into paragraph separators
                $formatted = preg_replace("/\r\n\r\n|\n\n|\r\r/", "</p><p>", $formatted);
                // Wrap whole content in <p> if it doesn't already start with block tags
                $formatted = '<p>' . $formatted . '</p>';
                // Convert single newlines to <br />
                $formatted = nl2br( $formatted );

                // Allowed HTML tags for final output
                $allowed_tags = array(
                    'h1' => array(),
                    'h2' => array(),
                    'h3' => array(),
                    'p'  => array(),
                    'br' => array(),
                    'strong' => array(),
                    'em' => array(),
                    'ul' => array(),
                    'li' => array(),
                    'blockquote' => array(),
                );

                // Strip tags not in allowed list and output safely
                $safe_html = wp_kses( $formatted, $allowed_tags );

                // --- Display the output inside styled container --- //
                $output .= "
                <div class='ai-blog-result'>
                    <h3 class='ai-blog-result-header'>
                        Your Generated Blog Post
                    </h3>
                    <div class='ai-blog-result-content'>
                        $safe_html
                    </div>
                </div>";
            }
        } else {
            $output .= "<p style='color:#e60000;'>Please provide a prompt and make sure your API key is set.</p>";
        }
    }

    // Blog input form (kept UI exactly; added nonce field)
    $output .= '
            <form method="post">
                <div class="ai-blog-form-wrapper">
                    <input type="text" name="ai_prompt" class="ai-blog-input" placeholder="Enter your blog topic (e.g., Benefits of AI in Healthcare)..." required />
                    ' . wp_nonce_field( 'generate_blog_nonce', '_wpnonce', true, false ) . '
                    <button type="submit" class="ai-blog-button">
                         Generate Blog
                    </button>
                </div>
            </form>
        </div>

        <form method="post" class="ai-blog-center">
            ' . wp_nonce_field( 'logout_nonce', '_wpnonce', true, false ) . '
            <button type="submit" name="logout_key" class="ai-blog-logout">
                Change API Key
            </button>
        </form>
    </div>';

    // Handle logout (change API key) with nonce
    if ( isset( $_POST['logout_key'] ) && isset( $_POST['_wpnonce'] ) && wp_verify_nonce( sanitize_text_field( wp_unslash( $_POST['_wpnonce'] ) ), 'logout_nonce' ) ) {
        if ( isset( $_SESSION['gemini_api_key'] ) ) {
            unset( $_SESSION['gemini_api_key'] );
        }
        echo "<meta http-equiv='refresh' content='0'>";
    }

    return $output;
}
